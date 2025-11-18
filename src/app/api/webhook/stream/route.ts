/**
 * Stream Video webhook handler
 * 
 * Handles webhook events from Stream Video SDK for call lifecycle events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/lib/inngest';
import crypto from 'crypto';

// Stream webhook event types
interface StreamWebhookEvent {
  type: string;
  call: {
    id: string;
    type: string;
    created_by: {
      id: string;
      name?: string;
    };
    session?: {
      id: string;
      started_at: string;
      ended_at?: string;
    };
  };
  created_at: string;
}

/**
 * Validate Stream webhook signature
 */
function validateStreamSignature(signature: string | null, body: string): boolean {
  if (!signature) {
    return false;
  }

  const secret = process.env.STREAM_API_SECRET;
  if (!secret) {
    console.error('Stream API secret not configured');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error validating signature:', error);
    return false;
  }
}

/**
 * Handle call session started event
 */
async function handleCallStarted(event: StreamWebhookEvent): Promise<void> {
  try {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.streamCallId, event.call.id),
    });

    if (!meeting) {
      console.warn(`Meeting not found for call ${event.call.id}`);
      return;
    }

    // Update meeting status to active
    await db
      .update(meetings)
      .set({
        status: 'active',
        startedAt: new Date(event.call.session?.started_at || event.created_at),
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meeting.id));

    console.log(`Meeting ${meeting.id} started`);
  } catch (error) {
    console.error('Error handling call started:', error);
  }
}

/**
 * Handle call session ended event
 */
async function handleCallEnded(event: StreamWebhookEvent): Promise<void> {
  try {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.streamCallId, event.call.id),
    });

    if (!meeting) {
      console.warn(`Meeting not found for call ${event.call.id}`);
      return;
    }

    const endedAt = new Date(event.call.session?.ended_at || event.created_at);
    let durationSeconds: number | null = null;

    // Calculate duration if we have start time
    if (meeting.startedAt) {
      const durationMs = endedAt.getTime() - meeting.startedAt.getTime();
      durationSeconds = Math.floor(durationMs / 1000);
    }

    // Update meeting status to processing
    await db
      .update(meetings)
      .set({
        status: 'processing',
        endedAt,
        durationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(meetings.id, meeting.id));

    console.log(`Meeting ${meeting.id} ended, duration: ${durationSeconds}s`);

    // Dispatch background job for post-call processing
    await inngest.send({
      name: 'meetings/process-completion',
      data: { meetingId: meeting.id },
    });

    console.log(`Dispatched post-call processing job for meeting ${meeting.id}`);
  } catch (error) {
    console.error('Error handling call ended:', error);
  }
}

/**
 * Handle transcription ready event
 */
async function handleTranscriptionReady(event: StreamWebhookEvent & { transcription_url?: string }): Promise<void> {
  try {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.streamCallId, event.call.id),
    });

    if (!meeting) {
      console.warn(`Meeting not found for call ${event.call.id}`);
      return;
    }

    // Update meeting with transcription URL
    if (event.transcription_url) {
      await db
        .update(meetings)
        .set({
          transcriptUrl: event.transcription_url,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meeting.id));

      console.log(`Transcription ready for meeting ${meeting.id}`);

      // Dispatch transcript processing job
      await inngest.send({
        name: 'meetings/process-transcript',
        data: { 
          meetingId: meeting.id,
          transcriptUrl: event.transcription_url,
        },
      });

      console.log(`Dispatched transcript processing job for meeting ${meeting.id}`);
    }
  } catch (error) {
    console.error('Error handling transcription ready:', error);
  }
}

/**
 * Handle recording ready event
 */
async function handleRecordingReady(event: StreamWebhookEvent & { recording_url?: string }): Promise<void> {
  try {
    const meeting = await db.query.meetings.findFirst({
      where: eq(meetings.streamCallId, event.call.id),
    });

    if (!meeting) {
      console.warn(`Meeting not found for call ${event.call.id}`);
      return;
    }

    // Update meeting with recording URL
    if (event.recording_url) {
      await db
        .update(meetings)
        .set({
          recordingUrl: event.recording_url,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, meeting.id));

      console.log(`Recording ready for meeting ${meeting.id}`);
    }
  } catch (error) {
    console.error('Error handling recording ready:', error);
  }
}

/**
 * POST handler for Stream webhooks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get signature from headers
    const signature = request.headers.get('x-stream-signature') || 
                     request.headers.get('stream-signature');
    
    // Get raw body
    const body = await request.text();

    // Validate signature
    if (!validateStreamSignature(signature, body)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse event
    const event: StreamWebhookEvent = JSON.parse(body);

    console.log(`Received Stream webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'call.session_started':
        await handleCallStarted(event);
        break;
      
      case 'call.session_ended':
        await handleCallEnded(event);
        break;
      
      case 'call.transcription_ready':
        await handleTranscriptionReady(event as any);
        break;
      
      case 'call.recording_ready':
        await handleRecordingReady(event as any);
        break;
      
      default:
        console.log(`Unhandled webhook event type: ${event.type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return 200 to prevent webhook retries for parsing errors
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 200 }
    );
  }
}
