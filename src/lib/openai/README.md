# OpenAI Realtime API Integration

This module provides integration with OpenAI's Realtime API for real-time speech-to-speech AI agent interactions during video calls.

## Features

- **Real-time Speech Processing**: Stream audio to/from OpenAI's Realtime API
- **WebSocket Connection**: Persistent connection with automatic reconnection
- **Audio Playback**: Automatic queuing and playback of AI responses
- **Event Handling**: Comprehensive event system for connection, speech, and errors
- **React Hook**: Easy-to-use React hook for component integration

## Setup

### 1. Get OpenAI API Key

You need an OpenAI API key with access to the Realtime API:

1. Go to https://platform.openai.com/
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Add credits to your account (Realtime API is usage-based)

### 2. Configure Environment Variables

Add your OpenAI API key to `.env.local`:

```env
OPENAI_API_KEY=sk-...your-key-here
```

### 3. Pricing Information

OpenAI Realtime API pricing (as of 2024):
- **Audio Input**: $0.06 per minute
- **Audio Output**: $0.24 per minute
- **Text Input**: $5.00 per 1M tokens
- **Text Output**: $20.00 per 1M tokens

Example cost for a 10-minute call:
- Input: 10 min × $0.06 = $0.60
- Output: 10 min × $0.24 = $2.40
- **Total**: ~$3.00 per 10-minute call

## Usage

### Basic Usage with React Hook

```typescript
import { useRealtime } from '@/lib/openai';

function VideoCall() {
  const {
    isConnected,
    isSpeaking,
    messages,
    connect,
    disconnect,
    sendText,
  } = useRealtime({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    instructions: 'You are a helpful sales assistant.',
    voice: 'alloy',
    autoConnect: true,
    onError: (error) => {
      console.error('Realtime API error:', error);
    },
  });

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>AI Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
      
      <button onClick={() => sendText('Hello!')}>
        Send Message
      </button>
      
      <div>
        {messages.map((msg, i) => (
          <div key={i}>
            <strong>{msg.type}:</strong> {msg.text}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Advanced Usage with Audio Streaming

```typescript
import { useRealtime } from '@/lib/openai';
import { useEffect, useRef } from 'react';

function VideoCallWithAudio() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  const {
    isConnected,
    isSpeaking,
    connect,
    disconnect,
    sendAudio,
  } = useRealtime({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
    instructions: 'You are a helpful assistant.',
    voice: 'nova',
  });

  useEffect(() => {
    // Initialize audio capture
    async function setupAudio() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (isConnected) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert float32 to int16 PCM
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
          }
          
          sendAudio(pcm16.buffer);
        }
      };
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      processorRef.current = processor;
    }

    if (isConnected) {
      setupAudio();
    }

    return () => {
      if (processorRef.current) {
        processorRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isConnected, sendAudio]);

  return (
    <div>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
      <p>AI Speaking: {isSpeaking ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Using the Client Directly

```typescript
import { createRealtimeClient } from '@/lib/openai';

const client = createRealtimeClient({
  apiKey: 'your-api-key',
  instructions: 'You are a helpful assistant.',
  voice: 'alloy',
  temperature: 0.8,
});

// Register event handlers
client.on('connected', () => {
  console.log('Connected to OpenAI');
});

client.on('speaking_started', () => {
  console.log('AI started speaking');
});

client.on('message', (message) => {
  console.log('AI message:', message.text);
});

client.on('error', (error) => {
  console.error('Error:', error);
});

// Connect
await client.connect();

// Send text
client.sendText('Hello, how are you?');

// Send audio
client.sendAudio(audioBuffer);

// Disconnect
client.disconnect();
```

## API Reference

### `useRealtime(options)`

React hook for OpenAI Realtime API integration.

**Options:**
- `apiKey` (string, required): OpenAI API key
- `instructions` (string, optional): System instructions for the AI agent
- `voice` (string, optional): Voice to use ('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
- `autoConnect` (boolean, optional): Auto-connect on mount
- `onError` (function, optional): Error callback

**Returns:**
- `isConnected` (boolean): Connection status
- `isSpeaking` (boolean): Whether AI is currently speaking
- `messages` (RealtimeMessage[]): Array of conversation messages
- `connect` (function): Connect to API
- `disconnect` (function): Disconnect from API
- `sendAudio` (function): Send audio data
- `sendText` (function): Send text message
- `updateInstructions` (function): Update AI instructions
- `error` (string | null): Current error message

### `OpenAIRealtimeClient`

Low-level client for OpenAI Realtime API.

**Methods:**
- `connect()`: Connect to API
- `disconnect()`: Disconnect from API
- `sendAudio(audioData)`: Send audio buffer
- `sendText(text)`: Send text message
- `commitAudio()`: Signal end of user speech
- `updateInstructions(instructions)`: Update AI instructions
- `on(event, handler)`: Register event handler
- `off(event, handler)`: Unregister event handler
- `getConnectionStatus()`: Get connection status

**Events:**
- `connected`: Connection established
- `disconnected`: Connection closed
- `error`: Error occurred
- `speaking_started`: AI started speaking
- `speaking_stopped`: AI stopped speaking
- `message`: Text message received
- `audio_buffer`: Audio data received

## Error Handling

The client includes automatic reconnection with exponential backoff:

```typescript
const { error, isConnected } = useRealtime({
  apiKey: 'your-key',
  onError: (err) => {
    // Handle errors
    if (err.code === 'invalid_api_key') {
      // Show error to user
    } else if (err.code === 'rate_limit_exceeded') {
      // Handle rate limit
    }
  },
});

if (error) {
  return <div>Error: {error}</div>;
}
```

## Best Practices

1. **API Key Security**: Never expose API keys in client-side code. Use server-side proxy for production.
2. **Error Handling**: Always implement error handlers for connection failures.
3. **Resource Cleanup**: Disconnect when component unmounts to avoid memory leaks.
4. **Audio Quality**: Use 24kHz sample rate for best quality.
5. **Cost Management**: Monitor usage and implement limits to control costs.

## Troubleshooting

### Connection Issues

If you can't connect:
1. Verify API key is correct
2. Check you have credits in your OpenAI account
3. Ensure you have access to Realtime API (may require waitlist approval)
4. Check browser console for WebSocket errors

### Audio Issues

If audio isn't working:
1. Verify microphone permissions
2. Check audio format (should be PCM16 at 24kHz)
3. Ensure AudioContext is properly initialized
4. Check browser compatibility (Chrome/Edge recommended)

### Rate Limits

OpenAI has rate limits on the Realtime API:
- Monitor your usage in the OpenAI dashboard
- Implement exponential backoff for retries
- Consider caching responses when possible

## Security Considerations

**Important**: The current implementation uses client-side API keys for simplicity. For production:

1. **Use Server-Side Proxy**: Create an API route that handles OpenAI requests
2. **Implement Authentication**: Verify user identity before allowing API access
3. **Rate Limiting**: Implement per-user rate limits
4. **Usage Tracking**: Monitor and limit costs per user
5. **Token Rotation**: Regularly rotate API keys

Example server-side proxy:

```typescript
// app/api/realtime/token/route.ts
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Generate temporary token or proxy WebSocket connection
  // This keeps your API key secure on the server
}
```

## Resources

- [OpenAI Realtime API Documentation](https://platform.openai.com/docs/guides/realtime)
- [OpenAI API Pricing](https://openai.com/pricing)
- [WebRTC Best Practices](https://webrtc.org/getting-started/overview)
