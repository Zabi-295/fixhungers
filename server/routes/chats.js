const express = require('express');
const router = express.Router();
const Message = require('../models/Message.js');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');
const verifiedNGO = require('../middleware/verifiedNGO.js');
const mongoose = require('mongoose');

// @route   GET api/chats/admin-user
// @desc    Get the administrator user ID and details for support chat
router.get('/admin-user', auth, async (req, res) => {
  try {
    let admin = await User.findOne({ email: 'adminfixhunger@gmail.com' }).select('_id name email role');
    if (!admin) {
      admin = await User.findOne({ role: 'Admin' }).select('_id name email role');
    }
    if (!admin) {
      return res.status(404).json({ msg: 'No administrator found' });
    }
    res.json(admin);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chats
// @desc    Get all conversations for logged-in user
router.get('/', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-mark any incoming pending messages as delivered
    await Message.updateMany(
      { receiver: userId, delivered: false },
      { $set: { delivered: true } }
    );

    // Notify other users via sockets if active
    const io = req.app.get('io');
    if (io) {
      io.emit('messagesDelivered', { receiverId: userId });
    }

    // Find all messages where current user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ createdAt: -1 });

    // Group messages by the other user ID
    const conversationMap = new Map();
    for (const msg of messages) {
      const otherUserId = msg.sender.toString() === userId ? msg.receiver.toString() : msg.sender.toString();
      if (!conversationMap.has(otherUserId)) {
        conversationMap.set(otherUserId, msg);
      }
    }

    const conversations = [];
    for (const [otherUserId, lastMsg] of conversationMap.entries()) {
      const otherUser = await User.findById(otherUserId).select('name email role profile isActive');
      if (!otherUser) continue;

      // Filter out admin support chat for normal users to keep inbox clean, if requested
      if (req.user.role !== 'Admin' && otherUser.role === 'Admin') {
        // Skip adding admin to their normal chats list, support chat is handled separately
        continue;
      }

      // Count unread messages sent by the other user to the current user
      const unreadCount = await Message.countDocuments({
        sender: otherUserId,
        receiver: userId,
        read: false
      });

      conversations.push({
        _id: otherUserId, // Use other user ID as the conversation ID for easy routing
        participants: [
          { _id: userId },
          otherUser
        ],
        lastMessage: lastMsg.deleted_for_everyone ? 'This message was deleted' : lastMsg.content || '[Attachment]',
        unreadCount,
        updatedAt: lastMsg.createdAt
      });
    }

    res.json(conversations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chats/:userId
// @desc    Get all messages between current user and another user
router.get('/:userId', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const otherUser = await User.findById(otherUserId).select('name email role profile isActive');
    if (!otherUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Mark messages sent by the other user to current user as delivered
    await Message.updateMany(
      { sender: otherUserId, receiver: userId, delivered: false },
      { $set: { delivered: true } }
    );

    // Notify other user via sockets if online
    const io = req.app.get('io');
    if (io) {
      io.to(otherUserId).emit('messagesDelivered', { receiverId: userId });
    }

    // Find all messages between them, excluding ones deleted by current user
    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId }
      ],
      deleted_by_users: { $ne: userId }
    }).sort({ createdAt: 1 });

    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      senderId: msg.sender,
      senderName: msg.sender.toString() === userId ? 'You' : otherUser.name,
      role: msg.sender.toString() === userId ? req.user.role : otherUser.role,
      message: msg.deleted_for_everyone ? 'This message was deleted' : msg.content || '',
      file_url: msg.deleted_for_everyone ? undefined : msg.file_url,
      file_type: msg.deleted_for_everyone ? undefined : msg.file_type,
      file_name: msg.deleted_for_everyone ? undefined : msg.file_name,
      read: msg.read,
      delivered: msg.delivered,
      deleted_for_everyone: msg.deleted_for_everyone,
      createdAt: msg.createdAt
    }));

    res.json({
      _id: otherUserId,
      participants: [
        { _id: userId, name: 'You', role: req.user.role },
        otherUser
      ],
      messages: formattedMessages
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chats/:userId
// @desc    Send a message to a user
router.post('/:userId', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    let { message, file_url, file_type, file_name } = req.body;

    if (!message && !file_url) {
      return res.status(400).json({ msg: 'Message content or file is required' });
    }

    // Upload to Cloudinary if base64 Data URL and Cloudinary is configured
    if (file_url && file_url.startsWith('data:')) {
      const { uploadToBase64 } = require('../utils/cloudinary');
      const cloudinaryUrl = await uploadToBase64(file_url);
      if (cloudinaryUrl) {
        file_url = cloudinaryUrl;
      }
    }

    const newMessage = new Message({
      sender: userId,
      receiver: otherUserId,
      content: message,
      file_url,
      file_type,
      file_name,
      delivered: false,
      read: false
    });

    await newMessage.save();

    // Trigger realtime socket if socket.io is active
    const io = req.app.get('io');
    if (io) {
      const formattedMessage = {
        _id: newMessage._id,
        senderId: userId,
        senderName: req.user.email?.split('@')[0] || 'User',
        role: req.user.role,
        message: message || '',
        file_url,
        file_type,
        file_name,
        read: false,
        delivered: false,
        createdAt: newMessage.createdAt
      };
      io.to(otherUserId).emit('receiveMessage', formattedMessage);
    }

    res.json(newMessage);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/chats/:userId/read
// @desc    Mark all messages from userId as read
router.put('/:userId/read', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    await Message.updateMany(
      { sender: otherUserId, receiver: userId, read: false },
      { $set: { read: true, delivered: true } }
    );

    // Notify other user via sockets
    const io = req.app.get('io');
    if (io) {
      io.to(otherUserId).emit('messagesRead', { readerId: userId });
    }

    res.json({ msg: 'Messages marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chats/upload
// @desc    Mock upload endpoint to comply with file transfer requirements
router.post('/upload', [auth, verifiedNGO], async (req, res) => {
  const { file, fileName, fileType } = req.body;
  res.json({
    file_url: file,
    file_name: fileName,
    file_type: fileType
  });
});

// @route   PUT api/chats/messages/:messageId/delete-for-me
// @desc    Delete message for me
router.put('/messages/:messageId/delete-for-me', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (!message.deleted_by_users.includes(userId)) {
      message.deleted_by_users.push(userId);
      await message.save();
    }

    res.json({ msg: 'Message deleted for you' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/chats/messages/:messageId/delete-for-everyone
// @desc    Delete message for everyone (Unsend)
router.put('/messages/:messageId/delete-for-everyone', [auth, verifiedNGO], async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ msg: 'Message not found' });
    }

    if (message.sender.toString() !== userId) {
      return res.status(403).json({ msg: 'Cannot delete messages sent by others' });
    }

    message.deleted_for_everyone = true;
    await message.save();

    // Notify other user via sockets
    const io = req.app.get('io');
    if (io) {
      io.to(message.receiver.toString()).emit('messageDeletedEveryone', { messageId: message._id });
    }

    res.json({ msg: 'Message deleted for everyone' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
