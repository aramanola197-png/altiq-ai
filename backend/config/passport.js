const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) {
          return done(new Error('No email returned from Google'), null);
        }

        let user = await User.findOne({ email });

        if (user) {
          // Link Google if existing local account
          if (user.authProvider === 'local') {
            user.authProvider = 'both';
            user.googleId = profile.id;
            if (!user.name) user.name = profile.displayName;
            await user.save();
          }
          return done(null, user);
        }

        // New Google user
        user = await User.create({
          email,
          name: profile.displayName,
          googleId: profile.id,
          authProvider: 'google',
          isProfileComplete: false,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
