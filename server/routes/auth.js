const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

// @route    POST api/auth/signup
// @desc     Register user
router.post('/signup', async (req, res) => {
  const { name, email, password, role, firebaseUid } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists in MongoDB' });
    }

    user = new User({
      name,
      email,
      password, // We still store it in Mongo as a backup or for other purposes
      role,
      firebaseUid,
      isActive: false // Initial status until they verify in Firebase (or we can use it to track profile completion)
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.json({ msg: 'MongoDB profile created', user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.isActive } });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route    POST api/auth/login
// @desc     Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password, firebaseUid } = req.body;

  try {
    // Try finding by firebaseUid first if provided
    let user;
    if (firebaseUid) {
      user = await User.findOne({ firebaseUid });
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ msg: 'No MongoDB profile found for this account' });
    }

    // Update status to true if logging in (implies verified via firebase logic in frontend)
    if (!user.isActive) {
      user.isActive = true;
      await user.save();
    }

    // If login via Firebase UID, we skip password check as Firebase already verified them.
    // If logging in via standard email/password (e.g. from an admin or old session), we check the password.
    if (!firebaseUid) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile, status: user.isActive } });
      }
    );
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route    GET api/auth/me
// @desc     Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

module.exports = router;
