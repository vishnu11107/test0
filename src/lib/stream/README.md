# Stream Video SDK Integration

This module provides server-side integration with Stream Video SDK for managing video calls.

## Features

- **User Token Generation**: Generate JWT tokens for users to join video calls
- **Call Management**: Create, manage, and end video calls via Stream REST API
- **Participant Management**: Add participants to existing calls
- **Webhook Handling**: Process call lifecycle events from Stream

## Configuration

Required environment variables:

```env
STREAM_API_KEY=your_api_key
STREAM_API_SECRET=your_api_secret
```

## Usage

### Generate User Token

```typescript
import { generateStreamToken } from '@/lib/stream';

// Generate a token for a user (valid for 1 hour by default)
const token = generateStreamToken(userId);

// Generate a token with custom validity
const token = generateStreamToken(userId, 7200); // 2 hours
```

### Create a Call

```typescript
import { createStreamCall } from '@/lib/stream';

await createStreamCall(
  'meeting-123',
  userId,
  {
    meetingId: '123',
    agentId: 'agent-456',
    agentName: 'Sales Assistant',
  }
);
```

### Add Participant

```typescript
import { addCallParticipant } from '@/lib/stream';

await addCallParticipant('meeting-123', userId, 'participant');
```

### End a Call

```typescript
import { endCall } from '@/lib/stream';

await endCall('meeting-123');
```

## Webhook Events

The webhook handler at `/api/webhook/stream` processes the following events:

- `call.session_started`: Updates meeting status to "active"
- `call.session_ended`: Updates meeting status to "processing" and calculates duration
- `call.transcription_ready`: Stores transcription URL
- `call.recording_ready`: Stores recording URL

### Webhook Configuration

Configure the webhook URL in your Stream dashboard:

```
https://your-domain.com/api/webhook/stream
```

The webhook handler validates signatures using HMAC-SHA256 with your Stream API secret.

## Security

- All tokens are signed using HS256 algorithm
- Webhook signatures are validated before processing events
- Server tokens are used for API calls with 1-hour expiration
- User tokens can have custom expiration times

## Error Handling

All functions throw errors if:
- Stream API credentials are not configured
- API requests fail
- Invalid parameters are provided

Errors are logged to the console and should be caught by the calling code.
