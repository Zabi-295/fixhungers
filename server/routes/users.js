const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');

// @route    GET api/users
// @desc     Get all users (Admin only)
router.get('/', auth, async (req, res) => {
  console.log("Admin fetch users request from:", req.user.email, "Role:", req.user.role);
  try {
    if (req.user.role !== 'Admin') {
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
    if (req.user.role !== 'Admin') {
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

module.exports = router;
