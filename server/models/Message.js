const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  read: { type: Boolean, default: false },
  delivered: { type: Boolean, default: false },
  file_url: { type: String },
  file_type: { type: String },
  file_name: { type: String },
  deleted_for_everyone: { type: Boolean, default: false },
  deleted_by_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', MessageSchema);
