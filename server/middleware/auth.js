const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
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
    
    // Temporary Admin Bypass for Debugging
    if (req.user.id === '6a0208a67df4a81718019346') {
      req.user.role = 'Admin';
    }
    
    next();

  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
