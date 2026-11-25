const mongoose = require('mongoose');
const { JOB_STATUS, REPORT_STATUS, REPORT_TARGET } = require('@handyconnect/shared');
const { Job, Quote, Report, Message, User, Review, ServiceListing, Category, Setting, AuditLog, HandymanProfile } = require('../../models');
const ApiError = require('../../utils/ApiError');
const { audit } = require('../../services/audit');

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---- Jobs ----

exports.jobs = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 25, 100);
  const p = Math.max(Number(req.query.page) || 1, 1);
  const filter = {};
  if (req.query.status === 'removed') filter.removedByAdmin = true;
  else if (req.query.status && Object.values(JOB_STATUS).includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) filter.title = new RegExp(escape(String(req.query.q).trim()), 'i');
  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((p - 1) * limit)
      .limit(limit)
      .populate('client', 'firstName lastName')
      .populate('category', 'name'),
    Job.countDocuments(filter),
  ]);
  res.json({ success: true, jobs, total, page: p, pages: Math.ceil(total / limit) });
};

exports.job = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw ApiError.notFound();
  const job = await Job.findById(req.params.id).populate('client', 'firstName lastName phone email').populate('category', 'name');
  if (!job) throw ApiError.notFound('Job not found');
  const quotes = await Quote.find({ job: job._id }).populate('handyman', 'firstName lastName');
  res.json({ success: true, job, quotes });
};

exports.setJobRemoved = async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw ApiError.notFound('Job not found');
  const remove = req.body.removed !== false;
  job.removedByAdmin = remove;
  job.removalReason = remove ? req.body.reason : undefined;
  await job.save();
  await audit(req, remove ? 'job.remove' : 'job.restore', 'job', job._id, { reason: req.body.reason, title: job.title });
  res.json({ success: true, job });
};

// ---- Reports ----

async function describeTarget(r) {
  const id = r.targetId;
  switch (r.targetType) {
    case REPORT_TARGET.USER: {
      const u = await User.findById(id).select('firstName lastName status');
      return u ? { label: `${u.firstName} ${u.lastName}`, status: u.status, link: `/users/${u._id}` } : null;
    }
    case REPORT_TARGET.JOB: {
      const j = await Job.findById(id).select('title status removedByAdmin');
      return j ? { label: j.title, status: j.removedByAdmin ? 'removed' : j.status, link: `/jobs/${j._id}` } : null;
    }
    case REPORT_TARGET.MESSAGE: {
      const m = await Message.findById(id).populate('sender', 'firstName lastName');
      return m ? { label: m.text || 'Photo', status: m.hidden ? 'hidden' : 'visible', author: m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : undefined, authorId: m.sender?._id } : null;
    }
    case REPORT_TARGET.REVIEW: {
      const rv = await Review.findById(id).select('text rating hidden');
      return rv ? { label: `${rv.rating}-star review${rv.text ? `: ${rv.text}` : ''}`, status: rv.hidden ? 'hidden' : 'visible' } : null;
    }
    case REPORT_TARGET.LISTING: {
      const l = await ServiceListing.findById(id).select('title');
      return l ? { label: l.title } : null;
    }
    default:
      return null;
  }
}

exports.reports = async (req, res) => {
  const status = req.query.status || REPORT_STATUS.OPEN;
  const reports = await Report.find({ status }).sort({ createdAt: -1 }).limit(100).populate('reporter', 'firstName lastName').populate('handledBy', 'firstName');
  const items = await Promise.all(reports.map(async (r) => ({ ...r.toObject(), target: await describeTarget(r) })));
  res.json({ success: true, reports: items });
};

exports.handleReport = async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) throw ApiError.notFound('Report not found');
  report.status = req.body.status;
  report.note = req.body.note;
  report.handledBy = req.user._id;
  report.handledAt = new Date();
  await report.save();
  await audit(req, `report.${req.body.status}`, 'report', report._id, { targetType: report.targetType, targetId: report.targetId, note: req.body.note });
  res.json({ success: true, report });
};

exports.setMessageHidden = async (req, res) => {
  const msg = await Message.findById(req.params.id);
  if (!msg) throw ApiError.notFound('Message not found');
  msg.hidden = req.body.hidden !== false;
  await msg.save();
  await audit(req, msg.hidden ? 'message.hide' : 'message.unhide', 'message', msg._id);
  res.json({ success: true, message: { _id: msg._id, hidden: msg.hidden } });
};

exports.setReviewHidden = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  review.hidden = req.body.hidden !== false;
  await review.save();
  // Hidden reviews don't count towards a handyman's rating.
  if (review.direction === 'client_to_handyman') {
    const [agg] = await Review.aggregate([
      { $match: { reviewee: review.reviewee, direction: 'client_to_handyman', hidden: false } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await HandymanProfile.updateOne(
      { user: review.reviewee },
      { 'stats.averageRating': agg ? Math.round(agg.avg * 10) / 10 : 0, 'stats.reviewCount': agg ? agg.count : 0 }
    );
  }
  await audit(req, review.hidden ? 'review.hide' : 'review.unhide', 'review', review._id);
  res.json({ success: true, review: { _id: review._id, hidden: review.hidden } });
};

// ---- Categories ----

exports.categories = async (req, res) => {
  res.json({ success: true, categories: await Category.find({}).sort({ sortOrder: 1, name: 1 }) });
};

const CATEGORY_FIELDS = ['name', 'slug', 'icon', 'subcategories', 'active', 'sortOrder'];
const pick = (src) => Object.fromEntries(CATEGORY_FIELDS.filter((k) => src[k] !== undefined).map((k) => [k, src[k]]));

exports.createCategory = async (req, res) => {
  const data = pick(req.body);
  data.slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const category = await Category.create(data);
  await audit(req, 'category.create', 'category', category._id, { name: category.name });
  res.status(201).json({ success: true, category });
};

exports.updateCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  const before = category.toObject();
  category.set(pick(req.body));
  await category.save();
  const changed = Object.keys(pick(req.body)).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(category[k]));
  await audit(req, 'category.update', 'category', category._id, { name: category.name, changed });
  res.json({ success: true, category });
};

// ---- Settings ----

exports.settings = async (req, res) => {
  res.json({ success: true, settings: await Setting.get() });
};

exports.updateSettings = async (req, res) => {
  const s = await Setting.get();
  const before = { commissionPercent: s.commissionPercent, autoConfirmHours: s.autoConfirmHours };
  if (req.body.commissionPercent !== undefined) s.commissionPercent = req.body.commissionPercent;
  if (req.body.autoConfirmHours !== undefined) s.autoConfirmHours = req.body.autoConfirmHours;
  await s.save();
  await audit(req, 'settings.update', 'settings', s._id, { before, after: { commissionPercent: s.commissionPercent, autoConfirmHours: s.autoConfirmHours } });
  res.json({ success: true, settings: s });
};

// ---- Audit log ----

exports.auditLog = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const p = Math.max(Number(req.query.page) || 1, 1);
  const filter = req.query.action ? { action: new RegExp(`^${escape(String(req.query.action))}`) } : {};
  const [entries, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((p - 1) * limit).limit(limit).populate('actor', 'firstName lastName email'),
    AuditLog.countDocuments(filter),
  ]);
  res.json({ success: true, entries, total, page: p, pages: Math.ceil(total / limit) });
};
