/**
 * Inngest API route
 * 
 * Serves Inngest functions for background job processing.
 */

import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { inngestFunctions } from '@/lib/inngest/functions';

// Serve Inngest functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: inngestFunctions,
  signingKey: process.env.INNGEST_SIGNING_KEY,
  streaming: false, // Disable streaming for better compatibility
});