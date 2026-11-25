const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { verifyAccess } = require('./utils/tokens');
const { corsOrigins } = require('./config/env');
const realtime = require('./services/realtime');
const { Conversation } = require('./models');

/**
 * Socket.io with JWT auth. Each user joins a private room `user:<id>`; the API emits
 * notification:new, message:new and conversation:read there.
 * Clients send: conversation:focus / conversation:blur (to suppress pushes for an open chat) and typing.
 */
function initSocket(server) {
  const io = new Server(server, { cors: { origin: corsOrigins() } });

  io.use((socket, next) => {
    try {
      const payload = verifyAccess(socket.handshake.auth?.token);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  // Cache conversation participants for typing relays (avoids a DB hit per keystroke).
  const participantsCache = new Map();
  async function otherParticipant(conversationId, userId) {
    if (!mongoose.isValidObjectId(conversationId)) return null;
    let ids = participantsCache.get(conversationId);
    if (!ids) {
      const c = await Conversation.findById(conversationId).select('participants');
      if (!c) return null;
      ids = c.participants.map(String);
      participantsCache.set(conversationId, ids);
    }
    if (!ids.includes(userId)) return null;
    return ids.find((id) => id !== userId);
  }

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);

    socket.on('conversation:focus', ({ conversationId } = {}) => conversationId && realtime.focus(userId, String(conversationId)));
    socket.on('conversation:blur', ({ conversationId } = {}) => conversationId && realtime.blur(userId, String(conversationId)));

    socket.on('typing', async ({ conversationId } = {}) => {
      const other = await otherParticipant(String(conversationId), userId).catch(() => null);
      if (other) io.to(`user:${other}`).emit('typing', { conversationId: String(conversationId), userId });
    });

    socket.on('disconnect', async () => {
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      if (!sockets.length) realtime.clearUser(userId);
    });
  });

  realtime.setIO(io);
  return io;
}

module.exports = initSocket;
