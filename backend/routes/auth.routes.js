const express = require('express');
const rateLimit = require('express-rate-limit');
const passport = require('passport');
const User = require('../models/User');
const { createSendToken } = require('../utils/token');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 40 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Too many auth attempts. Please try again later.' },
});

// Email / Password Register
router.post('/register', authAttemptLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name: name || '',
      authProvider: 'local',
      isProfileComplete: false,
    });

    createSendToken(user, 201, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Registration failed. Please try again.' });
  }
});

// Email / Password Login
router.post('/login', authAttemptLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'error', message: 'Incorrect email or password.' });
    }

    createSendToken(user, 200, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Login failed. Please try again.' });
  }
});

// Current user
router.get('/me', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      isProfileComplete: req.user.isProfileComplete,
      role: req.user.role,
      authProvider: req.user.authProvider,
      securityQuestion: req.user.securityQuestion || null,
    },
  });
});

// Logout
router.post('/logout', (req, res) => {
  res.cookie('altiq_token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
});

// Google OAuth
router.get(
  '/google',
  authAttemptLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/signin?error=google` }),
  (req, res) => {
    const token = require('../utils/token').signToken(req.user._id);
    const days = parseInt(process.env.SESSION_MAX_AGE_DAYS || '30', 10);

    res.cookie('altiq_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: days * 24 * 60 * 60 * 1000,
    });

    // Redirect based on profile status
    if (!req.user.isProfileComplete) {
      return res.redirect(`${process.env.CLIENT_URL}/onboarding`);
    }
    return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);


/**
 * Change password after proving security question + answer (both CAPS).
 * Works for local accounts and Google users who set a recovery Q&A at onboarding.
 */
router.post('/change-password', protect, authAttemptLimiter, async (req, res) => {
  try {
    const { securityAnswer, newPassword } = req.body;

    if (!securityAnswer || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Security answer and new password are required.',
      });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters.',
      });
    }

    const user = await User.findById(req.user._id).select('+securityAnswerHash +password');
    if (!user || !user.securityQuestion || !user.securityAnswerHash) {
      return res.status(400).json({
        status: 'error',
        message: 'No security question on this account. Complete your builder profile first.',
      });
    }

    const ok = await user.compareSecurityAnswer(securityAnswer);
    if (!ok) {
      return res.status(401).json({
        status: 'error',
        message: 'Security answer does not match. Use capital letters exactly as saved.',
      });
    }

    user.password = newPassword;
    if (user.authProvider === 'google') user.authProvider = 'both';
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully. You can sign in with email and the new password.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not change password.' });
  }
});


module.exports = router;

