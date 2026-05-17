const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket.js');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');

// @route   GET api/support
// @desc    Get tickets (Admin sees all, Users see their own)
router.get('/', auth, async (req, res) => {
  try {
    let tickets;
    if (req.user.role === 'Admin') {
      tickets = await Ticket.find().sort({ updatedAt: -1 });
    } else {
      tickets = await Ticket.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    }
    res.json(tickets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/support
// @desc    Create a new support ticket / chat thread
router.post('/', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    // Fetch actual user from DB to get the real name
    const actualUser = await User.findById(req.user.id);
    if (!actualUser) return res.status(404).json({ msg: 'User not found' });

    // Check if user already has an Open ticket
    let ticket = await Ticket.findOne({ userId: req.user.id, status: 'Open' });
    
    if (!ticket) {
      ticket = new Ticket({
        userId: req.user.id,
        userName: actualUser.name,
        userRole: actualUser.role,
        messages: [{
          senderId: req.user.id,
          senderName: actualUser.name,
          role: actualUser.role,
          message: message
        }]
      });
    } else {
      ticket.messages.push({
        senderId: req.user.id,
        senderName: actualUser.name,
        role: actualUser.role,
        message: message
      });
      ticket.updatedAt = Date.now();
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/support/:id/reply
// @desc    Reply to an existing ticket (Admin or User)
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    
    if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });
    
    // Only Admin or ticket owner can reply
    if (req.user.role !== 'Admin' && ticket.userId.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const actualUser = await User.findById(req.user.id);
    const senderName = actualUser ? actualUser.name : (req.user.role === 'Admin' ? 'Support Admin' : 'User');

    ticket.messages.push({
      senderId: req.user.id,
      senderName: senderName,
      role: req.user.role,
      message: message
    });
    ticket.updatedAt = Date.now();

    // If a user replies to a closed ticket, reopen it
    if (req.user.role !== 'Admin' && ticket.status === 'Closed') {
      ticket.status = 'Open';
    }

    await ticket.save();
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/support/:id/close
// @desc    Close a ticket (Admin only)
router.put('/:id/close', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Not authorized' });
    }
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id, 
      { $set: { status: 'Closed', updatedAt: Date.now() } },
      { new: true }
    );
    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
