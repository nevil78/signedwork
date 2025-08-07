# Google OAuth Branding Setup Guide

## Issue
Google OAuth consent screen shows the Replit domain instead of "SignedWork" app name.

## Root Cause
The app name is configured in Google Cloud Console, not in our application code.

## Solution Steps

### 1. Access Google Cloud Console
- Go to: https://console.cloud.google.com/
- Select the project that contains your OAuth credentials

### 2. Navigate to OAuth Consent Screen
- Click: **APIs & Services** → **OAuth consent screen**
- Or search for "OAuth consent screen" in the search bar

### 3. Configure App Information
Update these fields:
- **App name**: Change to "SignedWork"
- **User support email**: Select your email address
- **App domain** (optional): Add your website domain
- **Developer contact information**: Add your email

### 4. Save Changes
- Click "Save and Continue" 
- Review the scopes (should include profile and email)
- Save all changes

### 5. Verification (If Required)
For external apps:
- May need to submit for verification
- Process takes 1-7 days for basic review
- Required for apps accessing user data

## Expected Result
After configuration, the OAuth consent screen will show:
```
SignedWork wants to access your Google Account
```
Instead of:
```
a8e25821-8eed-450f-9d50-5ca4929f4242-00-ks1dbum0ifnq.riker.replit.dev wants to access your Google Account
```

## Current OAuth Configuration
Our application is properly configured with:
- ✅ Google OAuth strategy
- ✅ Proper scopes (profile, email)
- ✅ Account selection prompt
- ✅ Secure callback handling
- ⚠️ Missing: App name in Google Cloud Console

## Note
This is a one-time setup that requires access to the Google Cloud Console where the OAuth credentials were created.