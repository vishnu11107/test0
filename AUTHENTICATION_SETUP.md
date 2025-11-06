# Authentication System Setup Guide

The authentication system has been successfully implemented using Better Auth. Follow these steps to get it running.

## Installation

1. Install dependencies:
```bash
npm install
```

This will install all required packages including:
- `better-auth` - Authentication library
- `bcryptjs` - Password hashing
- Testing libraries (vitest, @testing-library/react, etc.)

## Configuration

1. **IMPORTANT**: Generate a secure secret first:
```bash
openssl rand -base64 32
```

2. Update your `.env.local` file with the required variables:

```env
# Required - MUST be set for authentication to work
NEXTAUTH_SECRET="your-generated-secret-from-step-1"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DATABASE_URL="your-database-url"

# Optional - OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Note**: The `NEXTAUTH_SECRET` is critical - without it, you'll get 500 errors on authentication endpoints.

## Database Setup

Better Auth uses the Drizzle adapter with your existing database connection. The authentication tables have been created:
- `user` - User accounts
- `session` - Active sessions
- `account` - OAuth provider accounts  
- `verification` - Email verification tokens

These tables are defined in `src/lib/auth/schema.ts` and migrations have been applied.

The migrations have already been run. If you need to regenerate them:
```bash
npm run db:generate
npm run db:migrate
```

## Testing the Implementation

1. Start the development server:
```bash
npm run dev
```

2. Navigate to:
- `/register` - Create a new account
- `/login` - Sign in to existing account
- `/dashboard` - Protected page (requires authentication)

## Running Tests

Run the authentication tests:

```bash
npm test
```

Or in watch mode:
```bash
npm run test:watch
```

## Features Implemented

### Task 3.1: Better Auth Configuration ✅
- Email/password authentication with bcrypt hashing
- OAuth support (Google, GitHub)
- Session management with secure cookies
- Rate limiting (5 attempts per minute)
- Server and client utilities

### Task 3.2: Authentication UI Components ✅
- `LoginForm` - Email/password and social login
- `RegisterForm` - User registration with validation
- `AuthGuard` - Server-side route protection
- `UserProfile` - Account management interface
- Responsive design with Tailwind CSS
- Toast notifications for user feedback

### Task 3.3: Authentication Tests ✅
- Login form tests (validation, submission, error handling)
- Register form tests (password matching, validation)
- Test setup with Vitest and React Testing Library
- Mocked authentication client for isolated testing

## Architecture

```
src/
├── lib/auth/
│   ├── index.ts          # Better Auth server config
│   ├── client.ts         # Client-side hooks
│   ├── session.ts        # Server-side utilities
│   └── README.md         # Documentation
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── auth-guard.tsx
│   │   ├── user-profile.tsx
│   │   └── __tests__/
│   └── ui/               # Shadcn/ui components
├── app/
│   ├── api/auth/[...all]/route.ts  # Auth API routes
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── dashboard/page.tsx
└── middleware.ts         # Route protection
```

## Next Steps

After verifying authentication works:

1. Proceed to Task 4: Build AI agent management system
2. The authentication system is now ready to protect agent and meeting routes
3. User sessions will be available throughout the application

## Troubleshooting

### 500 Internal Server Error / CSRF token errors
If you see "500 (Internal Server Error)" or "Failed to fetch CSRF token":
- **Ensure `NEXTAUTH_SECRET` is set in `.env.local`** - This is the most common cause
- Generate a secret with: `openssl rand -base64 32`
- Restart the dev server after adding the secret
- Verify `DATABASE_URL` is correctly set

### 422 Unprocessable Entity errors
If you see "422 (UNPROCESSABLE_ENTITY)" when trying to register:
- Check that the database connection is working
- Verify Better Auth can create its tables (check database permissions)
- Ensure email format is valid and password meets minimum length (8 characters)

### CORS errors (Failed to fetch)
If you see CORS errors like "Access to fetch at 'http://localhost:3000/api/auth/csrf' has been blocked":
- The auth client now automatically uses `window.location.origin` to match your current URL
- In development mode, all origins are trusted by default
- Restart the dev server after making changes: `npm run dev`
- If accessing via IP address (e.g., 172.x.x.x), the system will automatically handle it

### "Unauthorized" errors
- Ensure `NEXTAUTH_SECRET` is set in `.env.local`
- Check that the database migrations have run
- Verify the session cookie is being set (check browser dev tools)

### OAuth not working
- Ensure OAuth credentials are correctly set in `.env.local`
- Verify callback URLs are configured in OAuth provider settings
- Check that the provider is enabled in `src/lib/auth/index.ts`

### Tests failing
- Run `npm install` to ensure all test dependencies are installed
- Check that vitest.config.ts is properly configured
- Verify mock implementations in test setup


## Critical: Server Restart Required

After all the configuration changes, you **MUST restart the development server** for the authentication system to work:

```bash
# Stop the current server (press Ctrl+C in the terminal)
npm run dev
```

**Why restart is needed:**
- New database schema has been added
- Auth configuration has been updated
- Drizzle adapter needs to reinitialize

If you see 404 errors on `/api/auth/session` or other auth endpoints, it means the server hasn't loaded the new configuration yet.

## Summary of Implementation

Task 3 "Implement authentication system" has been completed with all subtasks:

### ✅ 3.1 Better Auth Configuration
- Configured Better Auth with Drizzle adapter
- Email/password authentication enabled
- OAuth support (Google, GitHub) configured
- Session management with secure cookies
- Server and client utilities created

### ✅ 3.2 Authentication UI Components  
- LoginForm with email/password and social login
- RegisterForm with validation
- AuthGuard for route protection
- UserProfile for account management
- All Shadcn/ui components (Button, Input, Label, Card, Avatar)
- Login, register, and dashboard pages created

### ✅ 3.3 Authentication Tests
- Vitest testing infrastructure set up
- LoginForm tests (validation, submission, error handling)
- RegisterForm tests (password matching, validation)
- Test mocks configured

## What Was Fixed During Implementation

1. **CORS Issues**: Auth client now uses `window.location.origin` automatically
2. **Database Schema**: Added `password` field and Better Auth tables
3. **Drizzle Adapter**: Configured with proper schema mapping
4. **Environment Variables**: Added `secret` and `baseURL` configuration
5. **Migrations**: Generated and applied all necessary database migrations

The authentication system is now fully functional and ready to use!
