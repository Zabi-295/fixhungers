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
      password,
      role,
      firebaseUid,
      isActive: isAdminCreated ? true : false
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // If not created by admin, generate OTP and set expiry
    if (!isAdminCreated) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = otp;
      user.verificationOtpExpires = Date.now() + 15 * 60 * 1000; // 15 mins expiry
    }

    await user.save();

    if (isAdminCreated) {
      try {
        await sendAccountCreationEmail(email, name, password, role);
      } catch (emailErr) {
        console.error("Failed to send account creation email:", emailErr);
      }
    } else {
      try {
        await sendVerificationEmail(email, user.verificationOtp);
      } catch (emailErr) {
        console.error("Failed to send verification email:", emailErr);
      }
    }

    res.json({ 
      msg: 'MongoDB profile created', 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        status: user.isActive 
      } 
    });
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
    let user;
    if (firebaseUid) {
      user = await User.findOne({ firebaseUid });
      if (!user) {
        // Fallback: Check if user already exists by email, and link their Firebase UID
        user = await User.findOne({ email });
        if (user) {
          user.firebaseUid = firebaseUid;
          await user.save();
        }
      }
    } else {
      user = await User.findOne({ email });
    }

    if (!user) {
      if (firebaseUid) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('FirebaseAutoHealed123!', salt);
        
        const namePart = email.split('@')[0];
        const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
        
        const isEmailAdmin = email.toLowerCase().includes('admin') || email === 'adminfixhunger@gmail.com';
        
        let finalRole = 'NGO';
        if (req.body.role) {
          const r = req.body.role.toLowerCase();
          if (r === 'provider') finalRole = 'Provider';
          else if (r === 'ngo') finalRole = 'NGO';
          else if (r === 'admin') finalRole = 'Admin';
        }
        if (isEmailAdmin) finalRole = 'Admin';

        user = new User({
          email,
          name: formattedName,
          role: finalRole,
          password: hashedPassword,
          firebaseUid,
          isActive: true, // Already authenticated/verified in Firebase
          verificationStatus: finalRole === 'NGO' ? 'unsubmitted' : undefined
        });
        await user.save();
      } else {
        return res.status(400).json({ msg: 'No MongoDB profile found for this account' });
      }
    }

    // Force block unverified users from logging in (except Admin bypass)
    if (!user.isActive && user.email !== "adminfixhunger@gmail.com") {
      return res.status(400).json({ msg: 'Please verify your email address first.' });
    }

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
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, profile: user.profile, status: user.isActive, rating: user.rating, reviewCount: user.reviewCount, rank: user.rank, verificationStatus: user.verificationStatus, verificationDocs: user.verificationDocs } });
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

// @route    POST api/auth/verify-otp
// @desc     Verify 6-digit OTP code for registration
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account with this email does not exist' });
    }

    if (user.isActive) {
      return res.status(400).json({ msg: 'This account has already been verified' });
    }

    if (user.verificationOtp !== otp || user.verificationOtpExpires < Date.now()) {
      return res.status(400).json({ msg: 'The verification OTP code is invalid or has expired' });
    }

    // Set user as active and clear verification code
    user.isActive = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    res.json({ msg: 'Email verification successful! You can now log in.' });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route    POST api/auth/resend-otp
// @desc     Resend registration verification OTP email
router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Account with this email does not exist' });
    }

    if (user.isActive) {
      return res.status(400).json({ msg: 'This account has already been verified' });
    }

    // Generate a new 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationOtp = otp;
    user.verificationOtpExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send email via SMTP
    await sendVerificationEmail(email, otp);

    res.json({ msg: 'A new 6-digit verification OTP has been sent to your email address' });
  } catch (err) {
    console.error("Resend OTP error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

// @route    POST api/auth/ngo-verify
// @desc     Submit NGO verification documents
router.post('/ngo-verify', auth, async (req, res) => {
  const { ngoCertificate, cnicFront, cnicBack } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.role !== 'NGO') {
      return res.status(400).json({ msg: 'Only NGO accounts can submit verification documents' });
    }

    user.verificationStatus = 'pending';
    user.verificationDocs = {
      ngoCertificate,
      cnicFront,
      cnicBack,
      submittedAt: new Date(),
      rejectionReason: undefined
    };

    await user.save();

    res.json({
      msg: 'Verification documents submitted successfully. Your account is now under review.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.isActive,
        verificationStatus: user.verificationStatus,
        verificationDocs: user.verificationDocs
      }
    });
  } catch (err) {
    console.error("NGO Verify submit error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
});

module.exports = router;
