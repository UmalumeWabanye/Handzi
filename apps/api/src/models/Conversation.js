const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

// One conversation per client + handyman + job.
const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: ObjectId, ref: 'User', required: true }],
    client: { type: ObjectId, ref: 'User', required: true },
    handyman: { type: ObjectId, ref: 'User', required: true },
    job: { type: ObjectId, ref: 'Job' },
    booking: { type: ObjectId, ref: 'Booking' },
    key: { type: String, required: true, unique: true }, // `${job}:${client}:${handyman}`
    lastMessage: { text: String, sender: { type: ObjectId, ref: 'User' }, at: Date, hasImages: Boolean },
    unread: { type: Map, of: Number, default: {} }, // userId -> unread count
    blockedBy: [{ type: ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

conversationSchema.methods.otherParticipant = function otherParticipant(userId) {
  return this.participants.find((p) => !(p._id || p).equals(userId));
};

module.exports = mongoose.model('Conversation', conversationSchema);
