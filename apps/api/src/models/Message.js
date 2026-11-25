const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: ObjectId, ref: 'Conversation', required: true },
    sender: { type: ObjectId, ref: 'User', required: true },
    text: { type: String, maxlength: 4000 },
    images: { type: [String], default: [] },
    readBy: [{ type: ObjectId, ref: 'User' }],
    containsContact: { type: Boolean, default: false }, // phone/email/WhatsApp shared: app shows a safety tip
    clientId: String, // sender's temporary id, so the app can match its optimistic message
    hidden: { type: Boolean, default: false }, // moderated by admin
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
