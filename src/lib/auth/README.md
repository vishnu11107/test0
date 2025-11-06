# Authentication System

This directory contains the authentication implementation using Better Auth.

## Features

- Email/password authentication with secure password hashing
- OAuth support (Google, GitHub)
- Session management with secure cookies
- Rate limiting (5 attempts per minute)
- Server-side and client-side authentication utilities

## Structure

- `index.ts` - Better Auth server configuration
- `client.ts` - Client-side authentication hooks and methods
- `session.ts` - Server-side session utilities
- `../middleware.ts` - Route protection middleware

## Usage

### Client-side

```tsx
import { signIn, signUp, signOut, useSession } from '@/lib/auth/client';

// In a component
const { data: session, isPending } = useSession();

// Sign in
await signIn.email({ email, password });

// Sign up
await signUp.email({ email, password, name });

// Sign out
await signOut();
```

### Server-side

```tsx
import { getSession, requireAuth, getCurrentUser } from '@/lib/auth/session';

// Get session (returns null if not authenticated)
const session = await getSession();

// Require authentication (throws if not authenticated)
const session = await requireAuth();

// Get current user
const user = await getCurrentUser();
```

### Route Protection

Use the `AuthGuard` component to protect pages:

```tsx
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <YourContent />
    </AuthGuard>
  );
}
```

## Environment Variables

Required:
- `NEXTAUTH_SECRET` - Secret key for session encryption
- `NEXT_PUBLIC_APP_URL` - Application URL (optional in development, auto-detected from browser)

Optional (for OAuth):
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret

Note: In development mode, the auth client automatically uses the current browser origin, so you can access the app via localhost, 127.0.0.1, or your local network IP without CORS issues.

## API Routes

Authentication endpoints are automatically handled at `/api/auth/*`:
- `/api/auth/sign-in` - Sign in
- `/api/auth/sign-up` - Sign up
- `/api/auth/sign-out` - Sign out
- `/api/auth/session` - Get session
- `/api/auth/callback/*` - OAuth callbacks

## Testing

Tests are located in `src/components/auth/__tests__/`:
- `login-form.test.tsx` - Login form tests
- `register-form.test.tsx` - Registration form tests

Run tests with:
```bash
npm test
```
