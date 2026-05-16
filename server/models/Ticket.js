const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: { type: String, required: true },
  role: { type: String, required: true },
  message: { type: String },
  imageUrl: { type: String },
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const TicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  userRole: { type: String, required: true },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  messages: [MessageSchema],
  unreadCountAdmin: { type: Number, default: 0 },
  unreadCountUser: { type: Number, default: 0 },
  lastMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ticket', TicketSchema);
