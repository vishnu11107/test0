/**
 * Debug meeting endpoint - check what's in the database
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { meetings, agents, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get meeting with all related data
    const result = await db
      .select({
        meeting: meetings,
        agent: agents,
        user: users,
      })
      .from(meetings)
      .leftJoin(agents, eq(meetings.agentId, agents.id))
      .leftJoin(users, eq(meetings.userId, users.id))
      .where(eq(meetings.id, id))
      .limit(1);

    // Also get all meetings for this user if found
    let allMeetings = [];
    if (result.length > 0 && result[0].user) {
      allMeetings = await db
        .select()
        .from(meetings)
        .where(eq(meetings.userId, result[0].user.id));
    }

    // Get all users
    const allUsers = await db.select().from(users);

    return NextResponse.json({
      success: true,
      requestedId: id,
      found: result.length > 0,
      meeting: result[0] || null,
      allMeetingsForUser: allMeetings,
      totalUsers: allUsers.length,
      allUsers: allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })),
    });
  } catch (error) {
    console.error('Debug meeting error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        requestedId: (await params).id,
      },
      { status: 500 }
    );
  }
}