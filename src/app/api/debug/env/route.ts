/**
 * Environment variables debug endpoint
 * This helps debug environment variable loading issues
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Not set',
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY ? 'Set' : 'Not set',
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY ? 'Set' : 'Not set',
    STREAM_API_KEY: process.env.STREAM_API_KEY ? 'Set' : 'Not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
  };

  return NextResponse.json({
    message: 'Environment variables status',
    environment: envVars,
    timestamp: new Date().toISOString(),
  });
}