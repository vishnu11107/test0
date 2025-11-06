import { auth } from './index';
import { headers } from 'next/headers';
import { cache } from 'react';

/**
 * Get the current session on the server side
 * This is cached per request to avoid multiple database calls
 */
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Get the current user from session
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}
