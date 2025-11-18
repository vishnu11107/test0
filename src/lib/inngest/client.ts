/**
 * Inngest client configuration
 * 
 * Configures the Inngest client for background job processing.
 */

import { Inngest } from 'inngest';

// Create Inngest client
export const inngest = new Inngest({
  id: 'meet-ai-platform',
  name: 'Meet AI Platform',
  eventKey: process.env.INNGEST_EVENT_KEY,
  // Enable local development mode when using local keys
  isDev: process.env.INNGEST_EVENT_KEY === 'local-development-key',
});

// Event types for type safety
export interface MeetingProcessingEvent {
  name: 'meetings/process-completion';
  data: {
    meetingId: string;
  };
}

export interface TranscriptProcessingEvent {
  name: 'meetings/process-transcript';
  data: {
    meetingId: string;
    transcriptUrl: string;
  };
}

export interface SummaryGenerationEvent {
  name: 'meetings/generate-summary';
  data: {
    meetingId: string;
    transcript: string;
  };
}

// Union type for all events
export type InngestEvents = 
  | MeetingProcessingEvent
  | TranscriptProcessingEvent
  | SummaryGenerationEvent;