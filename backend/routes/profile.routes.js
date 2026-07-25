const express = require('express');
const BuilderProfile = require('../models/BuilderProfile');
const User = require('../models/User');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Get current builder profile
router.get('/me', protect, async (req, res) => {
  try {
    const profile = await BuilderProfile.findOne({ user: req.user._id });
    res.status(200).json({ status: 'success', profile });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not load profile.' });
  }
});

// Create / Update builder profile (mandatory after signup)
router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;

    if (!data.name || !data.username) {
      return res.status(400).json({ status: 'error', message: 'Name and username are required.' });
    }

    // Check username uniqueness
    const existingUsername = await BuilderProfile.findOne({
      username: data.username.toLowerCase(),
      user: { $ne: req.user._id },
    });
    if (existingUsername) {
      return res.status(400).json({ status: 'error', message: 'Username is already taken.' });
    }

    let profile = await BuilderProfile.findOne({ user: req.user._id });

    if (profile) {
      Object.assign(profile, {
        ...data,
        username: data.username.toLowerCase(),
      });
      await profile.save();
    } else {
      profile = await BuilderProfile.create({
        user: req.user._id,
        ...data,
        username: data.username.toLowerCase(),
      });
    }

    // Mark user profile as complete
    await User.findByIdAndUpdate(req.user._id, { isProfileComplete: true, name: data.name });

    res.status(200).json({ status: 'success', profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: 'Could not save profile.' });
  }
});

module.exports = router;
