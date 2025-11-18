/**
 * Test login endpoint - creates a fake session for testing
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    // Find or create the demo user
    let demoUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'demo@meetai.com'))
      .limit(1);

    if (demoUser.length === 0) {
      // Create demo user if it doesn't exist
      [demoUser[0]] = await db
        .insert(users)
        .values({
          name: 'Demo User',
          email: 'demo@meetai.com',
          emailVerified: true,
          subscriptionTier: 'pro',
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .returning();
    }

    // Create a simple session token (not secure, just for testing)
    const sessionToken = `test-session-${Date.now()}`;
    
    // In a real app, you'd store this in a session store
    // For testing, we'll just return the user info
    
    const response = NextResponse.json({
      success: true,
      message: 'Test login successful',
      user: demoUser[0],
      sessionToken,
    });

    // Set a simple cookie for the session
    response.cookies.set('test-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Test login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create a test login session',
    endpoint: '/api/test/login',
  });
}