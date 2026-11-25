// Holds the Socket.io server so services can emit without importing the HTTP layer.
// In tests there is no socket server, so every call is a no-op.
let io = null;
const focused = new Map(); // userId -> Set(conversationId) currently open on screen

module.exports = {
  setIO: (server) => {
    io = server;
  },
  toUser: (userId, event, payload) => {
    if (io) io.to(`user:${userId}`).emit(event, payload);
  },
  focus: (userId, conversationId) => {
    if (!focused.has(userId)) focused.set(userId, new Set());
    focused.get(userId).add(conversationId);
  },
  blur: (userId, conversationId) => focused.get(userId)?.delete(conversationId),
  clearUser: (userId) => focused.delete(userId),
  /** True when the user has this conversation open right now (so a push would be redundant). */
  isViewing: (userId, conversationId) => !!focused.get(String(userId))?.has(String(conversationId)),
};
