/**
 * OpenAI client configuration
 * 
 * General OpenAI client for non-realtime operations like summary generation.
 * This should only be used on the server-side (API routes, server components).
 */

import OpenAI from 'openai';

// Get API key - try environment first, then fallback to hardcoded for development
const apiKey = process.env.OPENAI_API_KEY || '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';

// Create OpenAI client (server-side only)
export const openai = new OpenAI({
  apiKey,
  // Allow browser usage for development (not recommended for production)
  dangerouslyAllowBrowser: process.env.NODE_ENV === 'development',
});

// Export for use in other modules
export default openai;