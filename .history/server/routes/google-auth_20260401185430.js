const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate a unique slug
async function generateUniqueSlug(businessName) {
  const baseSlug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  let slug = baseSlug;
  let counter = 1;
  
  let slugExists = await db.Business.findOne({ where: { slug } });
  while (slugExists) {
    slug = `${baseSlug}-${counter}`;
    slugExists = await db.Business.findOne({ where: { slug } });
    counter++;
  }
  
  return slug;
}

// Initiate Google OAuth flow
router.get('/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    // Get user info from Google
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    
    // Check if business exists
    let business = await db.Business.findOne({ where: { email } });
    
    if (business) {
      // Existing user - login
      const token = jwt.sign(
        { id: business.id, email: business.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&slug=${business.slug}&onboarding=${business.onboardingCompleted}`
      );
    } else {
      // ✅ NEW: Create business with MINIMAL data - no temporary names!
      // Use email as temporary slug (will be updated during onboarding)
      const tempSlug = `user-${email.split('@')[0]}-${Date.now()}`;
        
      // Create business with random password (they won't use it since they're using Google)
      const randomPassword = Math.random().toString(36).slice(-12);
        
      business = await db.Business.create({
        businessName: 'New Business',  // ✅ Generic placeholder that won't confuse users
        email,
        password: randomPassword,
        slug: tempSlug,  // Temporary slug, will be updated in onboarding
        ownerName: name || '',  // ✅ Pre-fill owner name from Google
        logo: null,  // ✅ NO temporary logo - let them upload their own
        onboardingCompleted: false
      });
      
      const token = jwt.sign(
        { id: business.id, email: business.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      
      // Redirect to frontend with token
      res.redirect(
        `${process.env.FRONTEND_URL}/auth/callback?token=${token}&slug=${business.slug}&onboarding=${business.onboardingCompleted}`
      );
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/business/login?error=oauth_failed`);
  }
});

module.exports = router;