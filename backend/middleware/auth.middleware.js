const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signToken } = require('../utils/token');

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.altiq_token;

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'You are not logged in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User no longer exists.' });
    }

    // Sliding session: re-issue token on every authenticated request
    const newToken = signToken(user._id);
    const days = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10);
    res.cookie('altiq_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
    });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Invalid or expired token.' });
  }
};

const requireProfileComplete = (req, res, next) => {
  if (!req.user.isProfileComplete) {
    return res.status(403).json({
      status: 'error',
      message: 'Please complete your builder profile before continuing.',
      code: 'PROFILE_INCOMPLETE',
    });
  }
  next();
};

module.exports = { protect, requireProfileComplete };
