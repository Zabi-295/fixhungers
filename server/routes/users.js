const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');

// @route    GET api/users
// @desc     Get all users (Admin only)
router.get('/', auth, async (req, res) => {
  console.log("Admin fetch users request from:", req.user.email, "Role:", req.user.role);
  try {
    if (req.user.role !== 'Admin' && req.user.email !== 'adminfixhunger@gmail.com') {
      console.log("Access denied for role:", req.user.role);
      return res.status(403).json({ msg: 'Access denied' });
    }
    const users = await User.find().select('-password');
    console.log("Users found:", users.length);
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/users/profile
// @desc     Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profile: req.body, name: req.body.orgName || req.body.fullName || undefined } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/users/:id/status
// @desc     Update any user status (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.email !== 'adminfixhunger@gmail.com') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { isActive: status } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/users/:id/verify-action
// @desc     Approve or reject NGO registration (Admin only)
router.put('/:id/verify-action', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.email !== 'adminfixhunger@gmail.com') {
      return res.status(403).json({ msg: 'Access denied. Administrator permissions required.' });
    }

    const { action, rejectionReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'NGO') {
      return res.status(400).json({ msg: 'Only NGO verification status can be modified.' });
    }

    if (action === 'approve') {
      user.verificationStatus = 'verified';
      if (user.verificationDocs) {
        user.verificationDocs.reviewedAt = new Date();
        user.verificationDocs.rejectionReason = undefined;
      }
    } else if (action === 'reject') {
      user.verificationStatus = 'rejected';
      if (user.verificationDocs) {
        user.verificationDocs.reviewedAt = new Date();
        user.verificationDocs.rejectionReason = rejectionReason || 'Documents uploaded were invalid or incomplete.';
      }
    } else {
      return res.status(400).json({ msg: 'Invalid action. Must be approve or reject.' });
    }

    await user.save();

    const { sendNGOApprovalEmail, sendNGORejectionEmail } = require('../utils/emailService.js');
    if (action === 'approve') {
      try {
        await sendNGOApprovalEmail(user.email, user.name);
      } catch (err) {
        console.error("Failed to send approval email:", err.message);
      }
    } else {
      try {
        await sendNGORejectionEmail(user.email, user.name, user.verificationDocs.rejectionReason);
      } catch (err) {
        console.error("Failed to send rejection email:", err.message);
      }
    }

    res.json(user);
  } catch (err) {
    console.error("Verify action error:", err.message);
    res.status(500).send('Server Error: ' + err.message);
  }
});

// @route    PUT api/users/:id
// @desc     Edit user details (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    const { name, email, role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name, email, role } },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/users/:id
// @desc     Delete a user (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ msg: 'Access denied' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'User removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/users/contacts
// @desc     Get possible chat contacts (Providers get NGOs, NGOs get Providers)
router.get('/contacts', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) return res.status(404).json({ msg: 'User not found' });

    let query = { isActive: true };
    if (currentUser.role === 'Provider') {
      query.role = 'NGO';
    } else if (currentUser.role === 'NGO') {
      query.role = 'Provider';
    } else {
      // Admin sees both
      query.role = { $in: ['Provider', 'NGO'] };
    }

    const contacts = await User.find(query).select('name email role status profile');
    res.json(contacts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
