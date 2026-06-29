const User = require('../models/User.js');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found in MongoDB' });
    }

    // Only apply verified check to NGO roles
    if (user.role === 'NGO' && user.verificationStatus !== 'verified') {
      return res.status(403).json({ msg: 'Access denied. Your NGO account is not verified yet by an Administrator.' });
    }

    next();
  } catch (err) {
    console.error("NGO Verification middleware error:", err.message);
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};
