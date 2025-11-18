/**
 * Test meeting API - bypasses authentication for testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetings, agents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get meeting with agent info (bypassing user authentication for testing)
    const result = await db
      .select({
        id: meetings.id,
        name: meetings.name,
        userId: meetings.userId,
        agentId: meetings.agentId,
        streamCallId: meetings.streamCallId,
        status: meetings.status,
        startedAt: meetings.startedAt,
        endedAt: meetings.endedAt,
        durationSeconds: meetings.durationSeconds,
        transcriptUrl: meetings.transcriptUrl,
        recordingUrl: meetings.recordingUrl,
        summary: meetings.summary,
        createdAt: meetings.createdAt,
        updatedAt: meetings.updatedAt,
        agent: {
          id: agents.id,
          name: agents.name,
          avatarSeed: agents.avatarSeed,
          instructions: agents.instructions,
        },
      })
      .from(meetings)
      .leftJoin(agents, eq(meetings.agentId, agents.id))
      .where(eq(meetings.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting: result[0],
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();

    // Update meeting status (bypassing validation for testing)
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        status,
        updatedAt: new Date(),
        ...(status === 'active' && { startedAt: new Date() }),
        ...(status === 'processing' && { endedAt: new Date() }),
      })
      .where(eq(meetings.id, id))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error('Error updating meeting:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}