const mongoose = require('mongoose');
const { JOB_STATUS, QUOTE_STATUS } = require('@handyconnect/shared');
const { Conversation, Message, Job, Quote } = require('../models');
const ApiError = require('../utils/ApiError');
const realtime = require('../services/realtime');
const notify = require('../services/notify');
const { containsContact } = require('../services/contact');

const PEOPLE = 'firstName lastName avatar';
const JOB = 'title status category';

function summary(c, me) {
  const other = c.participants.find((p) => !p._id.equals(me));
  return {
    _id: c._id,
    other: other ? { id: other._id, firstName: other.firstName, lastName: other.lastName, avatar: other.avatar } : null,
    role: c.client.equals(me) ? 'client' : 'handyman', // my role in this conversation
    job: c.job ? { _id: c.job._id, title: c.job.title, status: c.job.status } : null,
    lastMessage: c.lastMessage,
    unread: c.unread?.get(String(me)) || 0,
    blocked: c.blockedBy.length > 0,
    blockedByMe: c.blockedBy.some((b) => b.equals(me)),
    updatedAt: c.updatedAt,
  };
}

async function loadConversation(id, me) {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound('Conversation not found');
  const c = await Conversation.findById(id).populate('participants', PEOPLE).populate('job', JOB);
  if (!c || !c.participants.some((p) => p._id.equals(me))) throw ApiError.notFound('Conversation not found');
  return c;
}

/**
 * Start (or reopen) a conversation about a job.
 * - A handyman can message the client about an open job, or one they've quoted on.
 * - A client can message any handyman who has quoted on their job.
 */
exports.start = async (req, res) => {
  const me = req.user._id;
  const job = mongoose.isValidObjectId(req.body.jobId) ? await Job.findById(req.body.jobId) : null;
  if (!job || job.removedByAdmin) throw ApiError.notFound('Job not found');

  let clientId;
  let handymanId;
  if (job.client.equals(me)) {
    if (!mongoose.isValidObjectId(req.body.userId)) throw ApiError.badRequest('Who do you want to message?');
    const quoted = await Quote.exists({ job: job._id, handyman: req.body.userId, status: { $ne: QUOTE_STATUS.WITHDRAWN } });
    if (!quoted) throw ApiError.forbidden('You can message handymen who have quoted on this job');
    clientId = me;
    handymanId = new mongoose.Types.ObjectId(String(req.body.userId));
  } else {
    if (!req.user.roles.includes('handyman')) throw ApiError.forbidden();
    const quoted = await Quote.exists({ job: job._id, handyman: me });
    if (job.status !== JOB_STATUS.OPEN && !quoted) throw ApiError.forbidden('This job is no longer open');
    clientId = job.client;
    handymanId = me;
  }

  const key = `${job._id}:${clientId}:${handymanId}`;
  const conversation = await Conversation.findOneAndUpdate(
    { key },
    { $setOnInsert: { key, job: job._id, client: clientId, handyman: handymanId, participants: [clientId, handymanId] } },
    { upsert: true, new: true }
  )
    .populate('participants', PEOPLE)
    .populate('job', JOB);
  res.status(201).json({ success: true, conversation: summary(conversation, me) });
};

// My conversations, optionally only those where I'm the client or the handyman (one inbox per side).
exports.list = async (req, res) => {
  const me = req.user._id;
  const filter = { participants: me };
  if (req.query.role === 'client') filter.client = me;
  if (req.query.role === 'handyman') filter.handyman = me;
  const conversations = await Conversation.find(filter)
    .sort({ updatedAt: -1 })
    .limit(100)
    .populate('participants', PEOPLE)
    .populate('job', JOB);
  // Hide conversations nobody has written in yet.
  res.json({ success: true, conversations: conversations.filter((c) => c.lastMessage?.at).map((c) => summary(c, me)) });
};

exports.get = async (req, res) => {
  const c = await loadConversation(req.params.id, req.user._id);
  res.json({ success: true, conversation: summary(c, req.user._id) });
};

exports.unreadCount = async (req, res) => {
  const me = String(req.user._id);
  const filter = { participants: req.user._id, [`unread.${me}`]: { $gt: 0 } };
  if (req.query.role === 'client') filter.client = req.user._id;
  if (req.query.role === 'handyman') filter.handyman = req.user._id;
  const convs = await Conversation.find(filter).select('unread');
  res.json({ success: true, count: convs.reduce((n, c) => n + (c.unread.get(me) || 0), 0) });
};

// Newest first; pass ?before=<ISO date> to page back.
exports.messages = async (req, res) => {
  const c = await loadConversation(req.params.id, req.user._id);
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  const filter = { conversation: c._id, hidden: false };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit);
  res.json({ success: true, messages, hasMore: messages.length === limit });
};

exports.send = async (req, res) => {
  const me = req.user._id;
  const c = await loadConversation(req.params.id, me);
  if (c.blockedBy.length) throw ApiError.forbidden('This conversation is blocked');

  const text = (req.body.text || '').trim();
  const images = req.body.images || [];
  if (!text && !images.length) throw ApiError.badRequest('Write a message or add a photo');

  const message = await Message.create({
    conversation: c._id,
    sender: me,
    text: text || undefined,
    images,
    readBy: [me],
    containsContact: containsContact(text),
    clientId: req.body.clientId,
  });

  const other = c.participants.find((p) => !p._id.equals(me));
  c.lastMessage = { text: text || 'Photo', sender: me, at: message.createdAt, hasImages: images.length > 0 };
  c.unread.set(String(other._id), (c.unread.get(String(other._id)) || 0) + 1);
  await c.save();

  const payload = { conversationId: String(c._id), message: message.toObject() };
  realtime.toUser(String(other._id), 'message:new', payload);
  realtime.toUser(String(me), 'message:new', payload); // my other devices
  notify.message({ to: other._id, from: req.user.firstName, conversation: c, text: text || 'Sent a photo' });

  res.status(201).json({ success: true, message });
};

exports.markRead = async (req, res) => {
  const me = req.user._id;
  const c = await loadConversation(req.params.id, me);
  c.unread.set(String(me), 0);
  await c.save();
  await Message.updateMany({ conversation: c._id, readBy: { $ne: me } }, { $addToSet: { readBy: me } });
  const other = c.participants.find((p) => !p._id.equals(me));
  realtime.toUser(String(other._id), 'conversation:read', { conversationId: String(c._id), by: String(me), at: new Date() });
  res.json({ success: true });
};

exports.block = async (req, res) => {
  const c = await loadConversation(req.params.id, req.user._id);
  if (!c.blockedBy.some((b) => b.equals(req.user._id))) c.blockedBy.push(req.user._id);
  await c.save();
  res.json({ success: true, conversation: summary(c, req.user._id) });
};

exports.unblock = async (req, res) => {
  const c = await loadConversation(req.params.id, req.user._id);
  c.blockedBy = c.blockedBy.filter((b) => !b.equals(req.user._id));
  await c.save();
  res.json({ success: true, conversation: summary(c, req.user._id) });
};

module.exports.summary = summary;
