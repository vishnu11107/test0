// Server-side exports (only import these in API routes or server components)
// export { openai } from './client'; // Commented out to prevent client-side loading

// Client-side exports (safe to import in components)
export { OpenAIRealtimeClient, createRealtimeClient } from './realtime';
export { useRealtime } from './use-realtime';
export type {
  RealtimeConfig,
  RealtimeMessage,
  RealtimeEventType,
  RealtimeEvent,
} from './realtime';
export type { UseRealtimeOptions, UseRealtimeReturn } from './use-realtime';
