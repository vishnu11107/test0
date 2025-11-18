/**
 * Inngest background job functions
 * 
 * Implements post-call processing jobs for transcript fetching,
 * parsing, and AI summary generation.
 */

import { inngest } from './client';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { 
  parseTranscript, 
  transcriptToText, 
  generateStructuredSummary 
} from '@/lib/post-call';

/**
 * Main post-call processing job
 * 
 * Orchestrates the complete post-call workflow:
 * 1. Fetch transcript from Stream
 * 2. Generate AI summary
 * 3. Update meeting status to completed
 */
export const processCallCompletion = inngest.createFunction(
  {
    id: 'process-call-completion',
    name: 'Process Call Completion',
    retries: 3,
  },
  { event: 'meetings/process-completion' },
  async ({ event, step }) => {
    const { meetingId } = event.data;

    // Step 1: Fetch meeting details
    const meeting = await step.run('fetch-meeting', async () => {
      const result = await db.query.meetings.findFirst({
        where: eq(meetings.id, meetingId),
        with: {
          agent: true,
        },
      });

      if (!result) {
        throw new Error(`Meeting ${meetingId} not found`);
      }

      return result;
    });

    // Step 2: Wait for transcript to be available (with timeout)
    const transcript = await step.run('wait-for-transcript', async () => {
      // If transcript URL is already available, fetch it
      if (meeting.transcriptUrl) {
        return await fetchTranscriptFromUrl(meeting.transcriptUrl);
      }

      // Otherwise, wait for transcript to be processed by Stream
      // This is a simplified approach - in production, you might want to
      // implement a more sophisticated polling mechanism
      throw new Error('Transcript not yet available');
    });

    // Step 3: Generate AI summary
    const summaryData = await step.run('generate-summary', async () => {
      return await generateStructuredSummary(transcript, meeting.agent.instructions);
    });

    // Step 4: Update meeting with summary and mark as completed
    await step.run('update-meeting', async () => {
      await db
        .update(meetings)
        .set({
          summary: summaryData.fullSummary,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId));
    });

    return {
      meetingId,
      status: 'completed',
      summaryLength: summaryData.fullSummary.length,
      keyTopics: summaryData.keyTopics.length,
      actionItems: summaryData.actionItems.length,
    };
  }
);

/**
 * Process transcript when it becomes available
 * 
 * This function is triggered when Stream notifies us that
 * a transcript is ready for processing.
 */
export const processTranscript = inngest.createFunction(
  {
    id: 'process-transcript',
    name: 'Process Transcript',
    retries: 2,
  },
  { event: 'meetings/process-transcript' },
  async ({ event, step }) => {
    const { meetingId, transcriptUrl } = event.data;

    // Step 1: Fetch and parse transcript
    const transcript = await step.run('fetch-transcript', async () => {
      return await fetchTranscriptFromUrl(transcriptUrl);
    });

    // Step 2: Trigger summary generation
    await step.run('trigger-summary-generation', async () => {
      await inngest.send({
        name: 'meetings/generate-summary',
        data: {
          meetingId,
          transcript,
        },
      });
    });

    return {
      meetingId,
      transcriptLength: transcript.length,
    };
  }
);

/**
 * Generate AI summary for a meeting
 * 
 * Uses OpenAI to generate a comprehensive summary based on
 * the meeting transcript and agent context.
 */
export const generateSummary = inngest.createFunction(
  {
    id: 'generate-summary',
    name: 'Generate AI Summary',
    retries: 2,
  },
  { event: 'meetings/generate-summary' },
  async ({ event, step }) => {
    const { meetingId, transcript } = event.data;

    // Step 1: Fetch meeting and agent details
    const meeting = await step.run('fetch-meeting-details', async () => {
      const result = await db.query.meetings.findFirst({
        where: eq(meetings.id, meetingId),
        with: {
          agent: true,
        },
      });

      if (!result) {
        throw new Error(`Meeting ${meetingId} not found`);
      }

      return result;
    });

    // Step 2: Generate summary using OpenAI
    const summaryData = await step.run('generate-ai-summary', async () => {
      return await generateStructuredSummary(transcript, meeting.agent.instructions);
    });

    // Step 3: Update meeting with summary and mark as completed
    await step.run('save-summary', async () => {
      await db
        .update(meetings)
        .set({
          summary: summaryData.fullSummary,
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId));
    });

    return {
      meetingId,
      summaryLength: summaryData.fullSummary.length,
      keyTopics: summaryData.keyTopics.length,
      actionItems: summaryData.actionItems.length,
    };
  }
);

/**
 * Fetch transcript content from Stream URL
 */
async function fetchTranscriptFromUrl(transcriptUrl: string): Promise<string> {
  try {
    const response = await fetch(transcriptUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transcript: ${response.statusText}`);
    }

    const transcriptData = await response.json();
    
    // Parse transcript using utility function and convert to text
    const parsedTranscript = parseTranscript(transcriptData);
    return transcriptToText(parsedTranscript);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch transcript content');
  }
}

/**
 * Test function for integration testing
 */
export const testIntegration = inngest.createFunction(
  {
    id: 'test-integration',
    name: 'Test Integration',
  },
  { event: 'test/integration' },
  async ({ event }) => {
    console.log('Test integration function executed:', event.data);
    
    return {
      success: true,
      message: 'Test function executed successfully',
      receivedData: event.data,
    };
  }
);

// Export all functions as an array for easy registration
export const inngestFunctions = [
  processCallCompletion,
  processTranscript,
  generateSummary,
  testIntegration,
];