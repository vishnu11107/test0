# OpenAI Realtime API Setup Guide

This guide will walk you through setting up and using OpenAI's Realtime API for your Meet AI platform.

## Table of Contents

1. [Getting Started with OpenAI](#getting-started-with-openai)
2. [API Access and Pricing](#api-access-and-pricing)
3. [Configuration](#configuration)
4. [Testing the Integration](#testing-the-integration)
5. [Production Deployment](#production-deployment)
6. [Cost Management](#cost-management)
7. [Troubleshooting](#troubleshooting)

## Getting Started with OpenAI

### Step 1: Create an OpenAI Account

1. Go to https://platform.openai.com/
2. Click "Sign Up" in the top right corner
3. You can sign up with:
   - Email address
   - Google account
   - Microsoft account
4. Verify your email address
5. Complete your profile information

### Step 2: Set Up Billing

The Realtime API is a paid service. You need to add credits to your account:

1. Log in to https://platform.openai.com/
2. Click on your profile icon (top right)
3. Select "Billing" from the dropdown
4. Click "Add payment method"
5. Enter your credit card information
6. Add credits to your account:
   - Minimum: $5
   - Recommended for testing: $20-50
   - For production: Set up auto-recharge

**Important**: OpenAI charges based on usage. Monitor your spending in the billing dashboard.

### Step 3: Generate API Key

1. Navigate to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Give it a descriptive name (e.g., "Meet AI Platform - Development")
4. **Important**: Copy the key immediately - you won't be able to see it again!
5. Store it securely (we'll add it to your `.env.local` file)

### Step 4: Request Realtime API Access

As of 2024, the Realtime API may require special access:

1. Go to https://platform.openai.com/docs/guides/realtime
2. Check if you need to join a waitlist
3. If required, fill out the access request form
4. Wait for approval (usually 1-3 business days)
5. You'll receive an email when access is granted

## API Access and Pricing

### Current Pricing (2024)

OpenAI Realtime API uses usage-based pricing:

| Feature | Price |
|---------|-------|
| Audio Input | $0.06 per minute |
| Audio Output | $0.24 per minute |
| Text Input | $5.00 per 1M tokens |
| Text Output | $20.00 per 1M tokens |

### Cost Examples

**10-minute call:**
- Audio input: 10 min × $0.06 = $0.60
- Audio output: 10 min × $0.24 = $2.40
- **Total**: ~$3.00

**1-hour call:**
- Audio input: 60 min × $0.06 = $3.60
- Audio output: 60 min × $0.24 = $14.40
- **Total**: ~$18.00

**100 calls per month (10 min each):**
- Total minutes: 1,000 minutes
- **Total cost**: ~$300/month

### Rate Limits

Default rate limits (may vary by account tier):
- **Requests per minute**: 50
- **Tokens per minute**: 40,000
- **Concurrent connections**: 10

You can request higher limits by contacting OpenAI support.

## Configuration

### Step 1: Add API Key to Environment

Add your OpenAI API key to `.env.local`:

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: For client-side usage (NOT RECOMMENDED for production)
NEXT_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Security Warning**: Never commit API keys to version control. The `.env.local` file is already in `.gitignore`.

### Step 2: Verify Configuration

Create a test script to verify your API key works:

```typescript
// scripts/test-openai.ts
import { createRealtimeClient } from '@/lib/openai';

async function testConnection() {
  const client = createRealtimeClient({
    apiKey: process.env.OPENAI_API_KEY!,
    instructions: 'You are a test assistant.',
  });

  client.on('connected', () => {
    console.log('✅ Successfully connected to OpenAI Realtime API');
    client.disconnect();
  });

  client.on('error', (error) => {
    console.error('❌ Connection failed:', error);
  });

  await client.connect();
}

testConnection();
```

Run the test:

```bash
npx tsx scripts/test-openai.ts
```

## Testing the Integration

### Step 1: Test in Development

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Create a test meeting with an AI agent

3. Navigate to the meeting lobby

4. Join the call - the AI agent should connect automatically

### Step 2: Test Audio

1. Speak into your microphone
2. The AI should respond with audio
3. Check the browser console for connection logs
4. Verify the AI agent display shows "speaking" status

### Step 3: Monitor Usage

1. Go to https://platform.openai.com/usage
2. Check real-time usage statistics
3. Monitor costs per request
4. Set up usage alerts if needed

## Production Deployment

### Security Best Practices

**DO NOT** use client-side API keys in production. Instead:

#### Option 1: Server-Side Proxy (Recommended)

Create an API route that proxies requests to OpenAI:

```typescript
// app/api/realtime/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Verify user authentication
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user's subscription tier and usage limits
  const user = session.user;
  const canUseRealtime = await checkRealtimeAccess(user.id);
  
  if (!canUseRealtime) {
    return NextResponse.json(
      { error: 'Upgrade required' },
      { status: 403 }
    );
  }

  // Generate temporary token or establish WebSocket proxy
  // This keeps your API key secure on the server
  const token = generateTemporaryToken(user.id);

  return NextResponse.json({ token });
}
```

#### Option 2: WebSocket Proxy

Set up a WebSocket proxy server that:
1. Authenticates users
2. Establishes connection to OpenAI
3. Proxies messages between client and OpenAI
4. Tracks usage per user
5. Enforces rate limits

### Environment Variables for Production

```env
# Production OpenAI Configuration
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORGANIZATION_ID=org-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Usage Limits
MAX_CALL_DURATION_MINUTES=60
MAX_CALLS_PER_USER_PER_DAY=10
MAX_MONTHLY_COST_PER_USER=100

# Monitoring
OPENAI_USAGE_ALERT_THRESHOLD=1000
OPENAI_COST_ALERT_EMAIL=admin@yourdomain.com
```

### Deployment Checklist

- [ ] API keys stored in secure environment variables
- [ ] Server-side proxy implemented
- [ ] User authentication verified
- [ ] Usage tracking implemented
- [ ] Rate limiting configured
- [ ] Cost alerts set up
- [ ] Error handling tested
- [ ] Monitoring dashboard configured
- [ ] Backup/fallback system ready

## Cost Management

### 1. Set Usage Limits

Implement per-user limits:

```typescript
// lib/usage-limits.ts
export async function checkRealtimeUsage(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  
  // Check daily call limit
  const callsToday = await db.query.meetings.findMany({
    where: and(
      eq(meetings.userId, userId),
      gte(meetings.createdAt, new Date(today))
    ),
  });

  if (callsToday.length >= MAX_CALLS_PER_DAY) {
    return false;
  }

  // Check monthly cost limit
  const monthlyCost = await getMonthlyRealtimeCost(userId);
  if (monthlyCost >= MAX_MONTHLY_COST) {
    return false;
  }

  return true;
}
```

### 2. Implement Usage Tracking

Track costs per call:

```typescript
// After call ends
const duration = meeting.durationSeconds || 0;
const estimatedCost = (duration / 60) * (0.06 + 0.24); // Input + Output

await db.insert(usageRecords).values({
  userId: meeting.userId,
  meetingId: meeting.id,
  service: 'openai_realtime',
  duration,
  estimatedCost,
  timestamp: new Date(),
});
```

### 3. Set Up Alerts

Configure OpenAI usage alerts:

1. Go to https://platform.openai.com/account/billing/limits
2. Set monthly budget limit
3. Configure email alerts at 50%, 75%, 90% of budget
4. Set hard limit to prevent overages

### 4. Optimize Costs

Strategies to reduce costs:

- **Shorter Calls**: Encourage concise interactions
- **Text Fallback**: Use text-only mode when audio isn't needed
- **Caching**: Cache common responses
- **Compression**: Use audio compression where possible
- **Tier Limits**: Limit call duration based on subscription tier

## Troubleshooting

### Common Issues

#### 1. "Invalid API Key" Error

**Solution:**
- Verify API key is correct in `.env.local`
- Check for extra spaces or newlines
- Regenerate key if needed
- Ensure key has Realtime API access

#### 2. "Insufficient Credits" Error

**Solution:**
- Add credits to your OpenAI account
- Check billing dashboard for current balance
- Set up auto-recharge to prevent interruptions

#### 3. "Rate Limit Exceeded" Error

**Solution:**
- Wait before retrying (exponential backoff)
- Request higher rate limits from OpenAI
- Implement request queuing
- Distribute load across multiple API keys (if allowed)

#### 4. WebSocket Connection Fails

**Solution:**
- Check browser console for errors
- Verify firewall/proxy settings
- Test with different browser
- Check OpenAI status page: https://status.openai.com/

#### 5. No Audio Output

**Solution:**
- Check browser audio permissions
- Verify AudioContext is initialized
- Check audio format (PCM16, 24kHz)
- Test with different voice option
- Check browser compatibility (Chrome/Edge recommended)

#### 6. Poor Audio Quality

**Solution:**
- Ensure stable internet connection
- Use wired connection instead of WiFi
- Close bandwidth-heavy applications
- Check microphone quality
- Adjust audio sample rate

### Debug Mode

Enable debug logging:

```typescript
const client = createRealtimeClient({
  apiKey: process.env.OPENAI_API_KEY!,
  instructions: 'You are a helpful assistant.',
});

// Log all events
client.on('connected', () => console.log('Connected'));
client.on('disconnected', () => console.log('Disconnected'));
client.on('error', (err) => console.error('Error:', err));
client.on('speaking_started', () => console.log('AI speaking'));
client.on('speaking_stopped', () => console.log('AI stopped'));
client.on('message', (msg) => console.log('Message:', msg));
```

### Getting Help

If you're still having issues:

1. **OpenAI Documentation**: https://platform.openai.com/docs
2. **OpenAI Community Forum**: https://community.openai.com/
3. **OpenAI Support**: https://help.openai.com/
4. **Status Page**: https://status.openai.com/

## Additional Resources

- [OpenAI Realtime API Guide](https://platform.openai.com/docs/guides/realtime)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- [OpenAI Playground](https://platform.openai.com/playground)

## Next Steps

After completing this setup:

1. ✅ Test the integration in development
2. ✅ Implement usage tracking
3. ✅ Set up cost alerts
4. ✅ Create server-side proxy for production
5. ✅ Deploy to staging environment
6. ✅ Conduct user acceptance testing
7. ✅ Deploy to production
8. ✅ Monitor usage and costs

---

**Need Help?** If you encounter any issues during setup, check the troubleshooting section or reach out to OpenAI support.
