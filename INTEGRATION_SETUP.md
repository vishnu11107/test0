# Meet AI Platform - Integration Setup Guide

This guide will help you set up and test the OpenAI and Inngest integrations for the Meet AI Platform.

## ✅ Current Status

- **OpenAI Integration**: ✅ WORKING
- **Post-Call Processing**: ✅ WORKING
- **Inngest Integration**: ⏳ NEEDS SETUP

## 🔧 Environment Variables

Your `.env.local` file should contain:

```env
# Database
DATABASE_URL="your-neon-database-url"

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Stream Video SDK
STREAM_API_KEY="your-stream-api-key"
STREAM_API_SECRET="your-stream-api-secret"

# OpenAI (✅ CONFIGURED)
OPENAI_API_KEY="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"

# Inngest (⏳ NEEDS SETUP)
INNGEST_EVENT_KEY="your-inngest-event-key"
INNGEST_SIGNING_KEY="your-inngest-signing-key"

# Application
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 🚀 Next Steps: Inngest Setup

To complete the integration, you need to set up Inngest for background job processing:

### 1. Create Inngest Account

1. Go to [https://www.inngest.com](https://www.inngest.com)
2. Sign up for a free account
3. Create a new app

### 2. Get Your Keys

1. In your Inngest dashboard, go to **Settings** → **Keys**
2. Copy your **Event Key** (starts with `inngest_`)
3. Copy your **Signing Key** (starts with `signkey-`)

### 3. Update Environment Variables

Add these to your `.env.local` file:

```env
INNGEST_EVENT_KEY="inngest_your_event_key_here"
INNGEST_SIGNING_KEY="signkey-your_signing_key_here"
```

### 4. Configure Inngest App

1. In your Inngest dashboard, go to **Apps**
2. Add your app URL: `http://localhost:3000/api/inngest`
3. This tells Inngest where to find your functions

## 🧪 Testing the Integration

### Option 1: Using the Test Page

1. Start your development server: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard/test-integration`
3. Click "Test All Integrations" to verify everything works

### Option 2: Using API Endpoints

Test individual components:

```bash
# Test OpenAI
curl http://localhost:3000/api/test/openai

# Test Post-Call Processing
curl -X POST http://localhost:3000/api/test/post-call \
  -H "Content-Type: application/json" \
  -d '{}'

# Test Inngest (after setup)
curl -X POST http://localhost:3000/api/test/inngest
```

## 🔄 How the Integration Works

### 1. Meeting Flow

```
User starts meeting → Stream Video SDK → Meeting recorded
↓
Meeting ends → Webhook to /api/webhook/stream
↓
Inngest job triggered → Process transcript
↓
OpenAI generates summary → Meeting marked complete
```

### 2. Background Jobs (Inngest Functions)

- **processCallCompletion**: Main orchestrator for post-call processing
- **processTranscript**: Handles transcript processing when available
- **generateSummary**: Uses OpenAI to create structured meeting summaries

### 3. OpenAI Integration

- **Chat Completions**: For generating meeting summaries and insights
- **Realtime API**: For live AI agent interactions during calls
- **Structured Output**: Extracts key topics, action items, and insights

## 📊 Features Enabled

With these integrations, your platform now supports:

- ✅ **AI-Powered Meeting Summaries**: Automatic post-call intelligence
- ✅ **Structured Data Extraction**: Key topics, insights, action items
- ✅ **Background Processing**: Non-blocking post-call workflows
- ✅ **Real-time AI Agents**: Live conversation during meetings
- ✅ **Scalable Architecture**: Handles multiple concurrent meetings

## 🔍 Monitoring & Debugging

### Logs to Watch

```bash
# OpenAI API calls
console.log('OpenAI completion:', completion);

# Inngest job execution
console.log('Inngest job started:', event.data);

# Stream webhooks
console.log('Stream webhook received:', event.type);
```

### Common Issues

1. **OpenAI Rate Limits**: Monitor your usage at [platform.openai.com](https://platform.openai.com)
2. **Inngest Connection**: Check your app URL configuration
3. **Stream Webhooks**: Verify webhook signature validation

## 🎯 Production Considerations

Before deploying to production:

1. **Environment Variables**: Use secure secret management
2. **Rate Limiting**: Implement proper rate limiting for API calls
3. **Error Handling**: Add comprehensive error handling and retries
4. **Monitoring**: Set up logging and alerting for failed jobs
5. **Scaling**: Consider OpenAI usage limits and Inngest pricing

## 🆘 Support

If you encounter issues:

1. Check the test integration page for detailed error messages
2. Review the console logs for API errors
3. Verify all environment variables are set correctly
4. Ensure your OpenAI account has sufficient credits

---

**Status**: OpenAI integration is fully working! Complete Inngest setup to enable background job processing.