import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User, IUser } from '../models';

// Configure Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Check if user with email exists
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });

            if (user) {
              // Link Google account to existing user
              user.googleId = profile.id;
              user.profilePic = profile.photos?.[0]?.value || user.profilePic;
              await user.save();
              return done(null, user);
            }
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            email: email || `${profile.id}@google.oauth`,
            name: profile.displayName || profile.name?.givenName || 'User',
            profilePic: profile.photos?.[0]?.value || '',
            role: 'student',
            isVerified: true
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// Serialize user for session (not used for JWT but good practice)
passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
