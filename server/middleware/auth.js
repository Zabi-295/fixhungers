const jwt = require('jsonwebtoken');
const User = require('../models/User.js');

module.exports = async function (req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    
    // Fetch user from DB to ensure fresh status and role
    const dbUser = await User.findById(req.user.id);
    if (!dbUser) {
      return res.status(401).json({ msg: 'User no longer exists' });
    }

    // Attach fresh database role and details to the request user object
    req.user.role = dbUser.role;
    req.user.email = dbUser.email;
    
    next();

  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
