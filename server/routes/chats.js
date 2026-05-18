const express = require('express');
const router = express.Router();
const Conversation = require('../models/Conversation.js');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');

// @route   GET api/chats
// @desc    Get all conversations for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Conversation.find({
      participants: req.user.id
    })
    .populate('participants', 'name email role profile isActive')
    .sort({ updatedAt: -1 });
    
    res.json(chats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/chats/:userId
// @desc    Get or create a conversation between current user and another user
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherUser = await User.findById(req.params.userId).select('name email role profile isActive');
    if (!otherUser) {
      return res.status(404).json({ msg: 'User not found' });
    }

    let chat = await Conversation.findOne({
      participants: { $all: [req.user.id, req.params.userId] }
    }).populate('participants', 'name email role profile isActive');

    if (!chat) {
      chat = new Conversation({
        participants: [req.user.id, req.params.userId],
        messages: []
      });
      await chat.save();
      // Populate participants after saving
      chat = await Conversation.findById(chat._id).populate('participants', 'name email role profile isActive');
    }

    res.json(chat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/chats/:userId
// @desc    Send a message to a user
router.post('/:userId', auth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ msg: 'Message is required' });
    }

    const sender = await User.findById(req.user.id);
    if (!sender) {
      return res.status(404).json({ msg: 'Sender not found' });
    }

    let chat = await Conversation.findOne({
      participants: { $all: [req.user.id, req.params.userId] }
    });

    if (!chat) {
      chat = new Conversation({
        participants: [req.user.id, req.params.userId],
        messages: []
      });
    }

    chat.messages.push({
      senderId: req.user.id,
      senderName: sender.name,
      role: sender.role,
      message: message.trim()
    });

    chat.updatedAt = Date.now();
    await chat.save();

    const populatedChat = await Conversation.findById(chat._id)
      .populate('participants', 'name email role profile isActive');

    res.json(populatedChat);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
