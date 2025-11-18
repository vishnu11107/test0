/**
 * Create demo data for testing
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, agents, meetings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST() {
  try {
    console.log('Creating demo data...');

    // Create or find demo user
    let demoUser;
    try {
      [demoUser] = await db
        .insert(users)
        .values({
          name: 'Demo User',
          email: 'demo@meetai.com',
          emailVerified: true,
          subscriptionTier: 'pro',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        })
        .returning();
    } catch (error) {
      // User might already exist, try to find it
      const existingUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, 'demo@meetai.com'))
        .limit(1);
      
      if (existingUsers.length > 0) {
        demoUser = existingUsers[0];
      } else {
        throw error; // Re-throw if it's not a duplicate key error
      }
    }

    console.log('✅ Demo user created/found:', demoUser.email);

    // Create demo agents
    const agentData = [
      {
        id: nanoid(),
        name: 'Language Tutor',
        userId: demoUser.id,
        instructions:
          'You are a friendly and patient language tutor. Help users practice conversation, correct their grammar gently, and provide cultural context.',
        avatarSeed: 'language-tutor',
      },
      {
        id: nanoid(),
        name: 'Interview Coach',
        userId: demoUser.id,
        instructions:
          'You are an experienced interview coach. Conduct mock interviews, ask relevant questions, and provide constructive feedback.',
        avatarSeed: 'interview-coach',
      },
    ];

    // Check if agents already exist for this user
    const existingAgents = await db
      .select()
      .from(agents)
      .where(eq(agents.userId, demoUser.id))
      .limit(5);

    let createdAgents;
    if (existingAgents.length >= 2) {
      createdAgents = existingAgents.slice(0, 2);
      console.log(`✅ Found ${createdAgents.length} existing demo agents`);
    } else {
      // Delete existing agents to avoid duplicates
      if (existingAgents.length > 0) {
        await db.delete(agents).where(eq(agents.userId, demoUser.id));
      }
      
      createdAgents = await db.insert(agents).values(agentData).returning();
      console.log(`✅ Created ${createdAgents.length} demo agents`);
    }

    // Check if meetings already exist for this user
    const existingMeetings = await db
      .select()
      .from(meetings)
      .where(eq(meetings.userId, demoUser.id))
      .limit(5);

    let createdMeetings;
    if (existingMeetings.length >= 2) {
      createdMeetings = existingMeetings.slice(0, 2);
      console.log(`✅ Found ${createdMeetings.length} existing demo meetings`);
    } else {
      // Delete existing meetings to avoid duplicates
      if (existingMeetings.length > 0) {
        await db.delete(meetings).where(eq(meetings.userId, demoUser.id));
      }

      // Create demo meetings
      const meetingData = [
        {
          id: nanoid(),
          name: 'Spanish Conversation Practice',
          userId: demoUser.id,
          agentId: createdAgents[0].id,
          status: 'upcoming' as const,
          streamCallId: `call-${nanoid()}`, // Add a stream call ID
        },
        {
          id: nanoid(),
          name: 'Mock Technical Interview',
          userId: demoUser.id,
          agentId: createdAgents[1].id,
          status: 'upcoming' as const,
          streamCallId: `call-${nanoid()}`, // Add a stream call ID
        },
      ];

      createdMeetings = await db.insert(meetings).values(meetingData).returning();
      console.log(`✅ Created ${createdMeetings.length} demo meetings`);
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data created successfully',
      data: {
        user: demoUser,
        agents: createdAgents,
        meetings: createdMeetings,
      },
    });
  } catch (error) {
    console.error('Error creating demo data:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create demo data',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create demo data',
    endpoint: '/api/test/create-demo-data',
  });
}