import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn("Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required");
}

export function setupGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log("Skipping Google OAuth setup - credentials not provided");
    return;
  }

  passport.use('google-employee', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.REPLIT_DEV_DOMAIN || 'https://your-repl-name.replit.dev'}/api/auth/google/callback`,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      const firstName = profile.name?.givenName || '';
      const lastName = profile.name?.familyName || '';
      const profilePhoto = profile.photos?.[0]?.value;

      if (!email) {
        return done(new Error("No email found in Google profile"), false);
      }

      // Check if employee already exists
      let employee = await storage.getEmployeeByEmail(email);
      
      if (employee) {
        // Update profile photo if not set and Google has one
        if (!employee.profilePhoto && profilePhoto) {
          await storage.updateEmployee(employee.id, { profilePhoto });
          employee.profilePhoto = profilePhoto;
        }
        
        // Mark email as verified since it's from Google
        if (!employee.emailVerified) {
          await storage.updateEmployee(employee.id, { emailVerified: true });
          employee.emailVerified = true;
        }
        
        return done(null, { employee, isNew: false });
      } else {
        // Create new employee account - OAuth users don't need password
        const newEmployee = await storage.createEmployee({
          firstName,
          lastName,
          email,
          phone: '', // Will need to be filled later
          countryCode: '+1',
          password: '', // Empty for OAuth users
          profilePhoto,
          emailVerified: true, // Google email is pre-verified
          isActive: true,
        });
        
        return done(null, { employee: newEmployee, isNew: true });
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, false);
    }
  }));
}

export function getGoogleAuthURL(): string {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth not configured");
  }
  return '/api/auth/google';
}