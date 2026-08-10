const jwt = require('jsonwebtoken');

const signToken = (userId) => {
  const days = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10);
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: `${days}d`,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const days = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10);

  res.cookie('altiq_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: days * 24 * 60 * 60 * 1000,
  });

  // Remove password if present
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      isProfileComplete: user.isProfileComplete,
      role: user.role,
      authProvider: user.authProvider,
      securityQuestion: user.securityQuestion || null,
    },
  });
};

module.exports = { signToken, createSendToken };
