/**
 * Stream Video SDK integration
 * 
 * This module provides server-side integration with Stream Video SDK.
 * Uses REST API for server-side operations and JWT for token generation.
 */

import jwt from 'jsonwebtoken';

const STREAM_API_BASE_URL = 'https://video.stream-io-api.com';

/**
 * Get Stream API credentials
 */
function getStreamCredentials() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('Stream API credentials not configured');
  }

  return { apiKey, apiSecret };
}

/**
 * Generate a Stream user token using JWT
 */
export function generateStreamToken(userId: string, validityInSeconds: number = 3600): string {
  const { apiSecret } = getStreamCredentials();

  // Subtract 30 seconds from current time to account for clock skew
  const issuedAt = Math.floor(Date.now() / 1000) - 30;
  const expiresAt = issuedAt + validityInSeconds;

  const payload = {
    user_id: userId,
    iat: issuedAt,
    exp: expiresAt,
  };

  return jwt.sign(payload, apiSecret, { algorithm: 'HS256' });
}

/**
 * Generate a server-side auth token for API calls
 */
function generateServerToken(): string {
  const { apiSecret } = getStreamCredentials();

  // Subtract 30 seconds from current time to account for clock skew
  const issuedAt = Math.floor(Date.now() / 1000) - 30;
  const expiresAt = issuedAt + 3600; // 1 hour

  const payload = {
    server: true,
    iat: issuedAt,
    exp: expiresAt,
  };

  return jwt.sign(payload, apiSecret, { algorithm: 'HS256' });
}

/**
 * Make a request to Stream API
 */
async function streamApiRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const { apiKey } = getStreamCredentials();
  const token = generateServerToken();

  // Add API key to URL
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${STREAM_API_BASE_URL}${endpoint}${separator}api_key=${apiKey}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Stream-Auth-Type': 'jwt',
    'X-Stream-Client': `meet-ai-platform`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Stream API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Create a Stream video call
 */
export async function createStreamCall(
  callId: string,
  userId: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await streamApiRequest(`/video/call/default/${callId}`, 'POST', {
      data: {
        created_by_id: userId,
        members: [
          { user_id: userId, role: 'host' },
        ],
        custom: metadata,
        settings_override: {
          recording: {
            mode: 'available',
            audio_only: false,
            quality: '1080p',
          },
          transcription: {
            mode: 'available',
          },
        },
      },
    });
  } catch (error) {
    console.error('Error creating Stream call:', error);
    throw error;
  }
}

/**
 * Add a participant to an existing call
 */
export async function addCallParticipant(
  callId: string,
  userId: string,
  role: 'host' | 'participant' = 'participant'
): Promise<void> {
  try {
    await streamApiRequest(`/video/call/default/${callId}/members`, 'POST', {
      update_members: [
        { user_id: userId, role },
      ],
    });
  } catch (error) {
    console.error('Error adding call participant:', error);
    throw error;
  }
}

/**
 * End a call
 */
export async function endCall(callId: string): Promise<void> {
  try {
    await streamApiRequest(`/video/call/default/${callId}/mark_ended`, 'POST', {});
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

/**
 * Get call details
 */
export async function getCallDetails(callId: string): Promise<any> {
  try {
    return await streamApiRequest(`/video/call/default/${callId}`, 'GET');
  } catch (error) {
    console.error('Error getting call details:', error);
    throw error;
  }
}

/**
 * Create or update a user in Stream
 */
export async function upsertStreamUser(
  userId: string,
  userData: {
    name?: string;
    image?: string;
    role?: string;
  }
): Promise<void> {
  try {
    await streamApiRequest('/users', 'POST', {
      users: {
        [userId]: {
          id: userId,
          name: userData.name,
          image: userData.image,
          role: userData.role || 'user',
        },
      },
    });
  } catch (error) {
    console.error('Error upserting Stream user:', error);
    throw error;
  }
}
