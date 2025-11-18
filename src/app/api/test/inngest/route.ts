/**
 * Inngest integration test endpoint
 */

import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest';

export async function POST() {
  try {
    // Test Inngest by sending a test event
    const result = await inngest.send({
      name: 'test/integration',
      data: {
        message: 'Testing Inngest integration',
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Inngest integration test event sent!',
      eventId: result.ids[0],
    });
  } catch (error) {
    console.error('Inngest test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Inngest integration failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to test Inngest integration',
    endpoint: '/api/test/inngest',
  });
}