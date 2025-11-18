# Complete Inngest Setup Guide

This guide will walk you through getting your Inngest API keys step by step.

## Step 1: Create Inngest Account

1. **Go to Inngest Website**
   - Open your browser and go to: https://www.inngest.com
   - Click the "Sign Up" or "Get Started" button

2. **Sign Up Options**
   - You can sign up with:
     - GitHub account (recommended for developers)
     - Google account
     - Email and password

3. **Choose GitHub Sign Up** (recommended)
   - Click "Continue with GitHub"
   - Authorize Inngest to access your GitHub account
   - This will automatically create your account

## Step 2: Create Your First App

1. **After signing up, you'll be in the Inngest Dashboard**
   - You should see a welcome screen or empty dashboard

2. **Create a New App**
   - Look for a button that says "Create App" or "New App"
   - Click it to start creating your first app

3. **App Configuration**
   - **App Name**: Enter "Meet AI Platform" (or any name you prefer)
   - **Description**: "AI-powered meeting platform with post-call processing"
   - Click "Create App" or "Continue"

## Step 3: Get Your API Keys

### Method 1: From App Settings

1. **Navigate to Your App**
   - You should now see your app in the dashboard
   - Click on your app name to enter the app dashboard

2. **Find the Keys Section**
   - Look for a "Settings" tab or "Keys" section
   - This might be in the sidebar or top navigation

3. **Copy Your Keys**
   - **Event Key**: Look for something like `inngest_evt_01234567890abcdef`
   - **Signing Key**: Look for something like `signkey-prod-abc123def456`

### Method 2: From Main Dashboard

1. **Go to Account Settings**
   - Look for your profile/account icon (usually top right)
   - Click on "Settings" or "Account Settings"

2. **Find API Keys Section**
   - Look for "API Keys", "Keys", or "Credentials" section
   - You should see both Event Key and Signing Key here

## Step 4: Configure Your Environment

1. **Open your `.env.local` file**

2. **Add the Inngest keys**:
```env
# Replace with your actual keys from Inngest dashboard
INNGEST_EVENT_KEY="inngest_evt_your_actual_key_here"
INNGEST_SIGNING_KEY="signkey-prod-your_actual_signing_key_here"
```

## Step 5: Configure Your App URL (Important!)

1. **Back in Inngest Dashboard**
   - Go to your app settings
   - Look for "Endpoints", "Webhooks", or "App URL" section

2. **Add Your Development URL**
   - Add: `http://localhost:3000/api/inngest`
   - This tells Inngest where to find your functions during development

3. **For Production Later**
   - You'll need to update this to your production URL
   - Example: `https://yourdomain.com/api/inngest`

## Alternative: Use Inngest Dev Server (Easier for Development)

If you're having trouble with the cloud setup, you can use Inngest's local development server:

### Install Inngest CLI

```bash
# Install Inngest CLI globally
npm install -g inngest-cli

# Or use npx (no installation needed)
npx inngest-cli@latest
```

### Start Local Dev Server

```bash
# Start the Inngest dev server
npx inngest-cli@latest dev

# This will start a local Inngest server at http://localhost:8288
```

### Use Local Development Keys

For local development, you can use these placeholder keys:

```env
# Local development keys (when using inngest dev)
INNGEST_EVENT_KEY="local-development-key"
INNGEST_SIGNING_KEY="signkey-local-development"
```

## Step 6: Test Your Setup

1. **Start your Next.js development server**:
```bash
npm run dev
```

2. **If using Inngest CLI, start it in another terminal**:
```bash
npx inngest-cli@latest dev
```

3. **Test the integration**:
   - Go to: http://localhost:3000/dashboard/test-integration
   - Click "Test Inngest" button
   - You should see a success message

## Troubleshooting

### Can't Find Keys in Dashboard?

1. **Check Different Sections**:
   - Try "Settings" → "API Keys"
   - Try "Developer" → "Keys"
   - Try "Integrations" → "API Keys"

2. **Look for These Key Formats**:
   - Event Key: `inngest_evt_` followed by random characters
   - Signing Key: `signkey-prod-` or `signkey-test-` followed by random characters

### Still Can't Find Keys?

1. **Contact Inngest Support**:
   - Go to Inngest documentation: https://www.inngest.com/docs
   - Look for "Support" or "Help" section
   - They have excellent developer support

2. **Use Local Development Instead**:
   - Follow the "Alternative: Use Inngest Dev Server" section above
   - This works great for development and testing

### Keys Not Working?

1. **Check Key Format**:
   - Event keys start with `inngest_evt_`
   - Signing keys start with `signkey-`

2. **Verify App URL**:
   - Make sure you added `http://localhost:3000/api/inngest` to your app settings

3. **Check Environment File**:
   - Make sure there are no extra spaces or quotes
   - Restart your development server after adding keys

## What Happens After Setup?

Once Inngest is configured, your platform will be able to:

1. **Process meetings in the background**
2. **Handle post-call workflows automatically**
3. **Scale to handle multiple concurrent meetings**
4. **Retry failed jobs automatically**
5. **Monitor job execution and performance**

## Quick Start with Local Development

If you want to get started immediately without cloud setup:

1. **Install Inngest CLI**:
```bash
npm install -g inngest-cli
```

2. **Add local keys to `.env.local`**:
```env
INNGEST_EVENT_KEY="local-development-key"
INNGEST_SIGNING_KEY="signkey-local-development"
```

3. **Start both servers**:
```bash
# Terminal 1: Start Next.js
npm run dev

# Terminal 2: Start Inngest dev server
inngest dev
```

4. **Test it**:
   - Go to http://localhost:3000/dashboard/test-integration
   - Click "Test All Integrations"

This local setup is perfect for development and testing!

---

**Need Help?** If you're still having trouble, let me know exactly what you see in the Inngest dashboard, and I can provide more specific guidance.