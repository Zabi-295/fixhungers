const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const auth = require('../middleware/auth.js');
const crypto = require('crypto');
const { sendVerificationEmail, sendAccountCreationEmail, sendResetPasswordEmail } = require('../utils/emailService.js');

// @route    POST api/auth/signup
// @desc     Register user
router.post('/signup', async (req, res) => {
  const { name, email, password, role, firebaseUid, isAdminCreated } = req.body;

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
      isActive: isAdminCreated ? true : false // If admin created, make it active immediately
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // If Admin created this user, send them an email with their credentials
    if (isAdminCreated) {
      try {
        await sendAccountCreationEmail(email, name, password, role);
      } catch (emailErr) {
        console.error("Failed to send account creation email:", emailErr);
      }
    }

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
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile, status: user.isActive, rating: user.rating, reviewCount: user.reviewCount, rank: user.rank } });
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

// @route    POST api/auth/forgot-password
// @desc     Generate password reset token and email a secure reset link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account with this email does not exist' });
    }

    // Generate a secure, unique random token
    const token = crypto.randomBytes(20).toString('hex');
    
    // Save to user profile with 15 mins expiry
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Dynamically retrieve client origin (supports both localhost and Vercel automatically)
    const clientUrl = req.headers.origin || 'http://localhost:5173';
    const resetLink = `${clientUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    // Send the email with the reset link
    await sendResetPasswordEmail(email, resetLink);

    res.json({ msg: 'A secure password reset link has been sent to your email address' });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route    POST api/auth/reset-password
// @desc     Reset password using token-based recovery
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: 'This password reset link is invalid or has expired' });
    }

    // Encrypt the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Delete token and expiry from DB (so they can't be reused)
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Your password has been successfully reset' });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

module.exports = router;
