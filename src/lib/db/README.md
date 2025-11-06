# Database Setup

This directory contains the database schema, migrations, and utilities for the Meet AI platform.

## Structure

- `schema.ts` - Drizzle ORM schema definitions for all tables
- `index.ts` - Database connection and configuration
- `migrate.ts` - Migration runner script
- `seed.ts` - Seed data for development/testing
- `utils.ts` - Database utility functions

## Quick Start

Run the automated setup script:

**Windows (PowerShell):**
```powershell
.\scripts\setup-db.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/setup-db.sh
./scripts/setup-db.sh
```

This will:
1. Install dependencies
2. Generate migrations
3. Push schema to database
4. Seed with demo data

## Manual Setup Instructions

### 1. Configure Database URL

Update your `.env.local` file with your Neon PostgreSQL connection string:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
```

### 2. Generate Migrations

Generate migration files from the schema:

```bash
npm run db:generate
```

This creates SQL migration files in the `drizzle` directory.

### 3. Apply Migrations

Run migrations to update your database:

```bash
npm run db:migrate
```

Or push the schema directly (development only):

```bash
npm run db:push
```

### 4. Seed Database (Optional)

Populate the database with demo data:

```bash
npm run db:seed
```

This creates:
- A demo user (demo@meetai.com / demo123)
- 3 sample AI agents (Language Tutor, Interview Coach, Sales Assistant)
- 3 sample meetings with different statuses

### 5. Open Drizzle Studio (Optional)

View and edit your database in a web UI:

```bash
npm run db:studio
```

## Schema Overview

### Tables

#### users
User accounts with authentication and subscription information.

**Columns:**
- `id` (UUID) - Primary key
- `name` (VARCHAR) - User's display name
- `email` (VARCHAR) - Unique email address
- `emailVerified` (BOOLEAN) - Email verification status
- `image` (TEXT) - Profile image URL
- `subscriptionTier` (ENUM) - Current subscription level
- `subscriptionExpiresAt` (TIMESTAMP) - Subscription expiration date
- `createdAt`, `updatedAt` (TIMESTAMP) - Audit timestamps

#### sessions
User session management for authentication.

**Columns:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to users
- `expiresAt` (TIMESTAMP) - Session expiration
- `createdAt` (TIMESTAMP) - Creation timestamp

**Indexes:**
- `sessions_user_id_idx` - Fast user session lookups
- `sessions_expires_at_idx` - Efficient session cleanup

#### accounts
OAuth provider accounts linked to users.

**Columns:**
- `id` (UUID) - Primary key
- `userId` (UUID) - Foreign key to users
- `provider` (VARCHAR) - OAuth provider name
- `providerAccountId` (VARCHAR) - Provider's user ID
- `accessToken`, `refreshToken` (TEXT) - OAuth tokens
- `expiresAt` (TIMESTAMP) - Token expiration
- `createdAt` (TIMESTAMP) - Creation timestamp

**Indexes:**
- `accounts_user_id_idx` - Fast user account lookups
- `accounts_provider_account_idx` (UNIQUE) - Prevent duplicate OAuth accounts

#### agents
Custom AI agents created by users.

**Columns:**
- `id` (VARCHAR) - Primary key (nanoid)
- `name` (VARCHAR) - Agent name
- `userId` (UUID) - Foreign key to users
- `instructions` (TEXT) - Agent personality/behavior
- `avatarSeed` (VARCHAR) - DiceBear avatar seed
- `createdAt`, `updatedAt` (TIMESTAMP) - Audit timestamps

**Indexes:**
- `agents_user_id_idx` - Fast user agent lookups
- `agents_user_name_idx` (UNIQUE) - Prevent duplicate agent names per user

#### meetings
Video call sessions between users and AI agents.

**Columns:**
- `id` (VARCHAR) - Primary key (nanoid)
- `name` (VARCHAR) - Meeting name
- `userId` (UUID) - Foreign key to users
- `agentId` (VARCHAR) - Foreign key to agents
- `streamCallId` (VARCHAR) - Stream Video SDK call ID
- `status` (ENUM) - Meeting status
- `startedAt`, `endedAt` (TIMESTAMP) - Call timing
- `durationSeconds` (INTEGER) - Call duration
- `transcriptUrl`, `recordingUrl` (TEXT) - Post-call assets
- `summary` (TEXT) - AI-generated summary
- `createdAt`, `updatedAt` (TIMESTAMP) - Audit timestamps

**Indexes:**
- `meetings_user_id_idx` - Fast user meeting lookups
- `meetings_agent_id_idx` - Fast agent meeting lookups
- `meetings_status_idx` - Efficient status filtering
- `meetings_user_status_idx` - Combined user + status queries
- `meetings_stream_call_id_idx` - Fast Stream webhook lookups

### Enums

- **subscription_tier**: `free_trial`, `basic`, `pro`, `enterprise`
- **meeting_status**: `upcoming`, `active`, `completed`, `processing`, `cancelled`

### Relationships

- Users have many: sessions, accounts, agents, meetings
- Agents belong to users and have many meetings
- Meetings belong to users and agents

## Connection Pooling

The database connection is configured with:
- **Max connections**: 10 (optimal for serverless)
- **Idle timeout**: 20 seconds
- **Connect timeout**: 10 seconds

These settings optimize for serverless environments like Vercel and prevent connection exhaustion.

## Performance Optimizations

### Indexes

The schema includes strategic indexes for common query patterns:

1. **User lookups**: All foreign keys have indexes
2. **Status filtering**: Meeting status queries are optimized
3. **Composite indexes**: User + status for dashboard queries
4. **Unique constraints**: Prevent duplicate OAuth accounts and agent names

### Query Optimization Tips

```typescript
// Good: Use indexed columns in WHERE clauses
const meetings = await db.query.meetings.findMany({
  where: eq(meetings.userId, userId),
});

// Good: Combine indexed columns
const activeMeetings = await db.query.meetings.findMany({
  where: and(
    eq(meetings.userId, userId),
    eq(meetings.status, 'active')
  ),
});

// Good: Use relations for joins
const meetingsWithAgents = await db.query.meetings.findMany({
  with: {
    agent: true,
  },
});
```

## Development Tips

### Test Connection

```typescript
import { testConnection } from '@/lib/db/utils';

const isConnected = await testConnection();
console.log('Database connected:', isConnected);
```

### Get Database Stats

```typescript
import { getDatabaseStats } from '@/lib/db/utils';

const stats = await getDatabaseStats();
console.log('Table sizes:', stats);
```

### Clear All Data (Testing)

```typescript
import { clearAllTables } from '@/lib/db/utils';

await clearAllTables(); // WARNING: Deletes all data!
```

## Migration Workflow

### Creating New Migrations

1. Update `schema.ts` with your changes
2. Generate migration: `npm run db:generate`
3. Review the generated SQL in `drizzle/` folder
4. Apply migration: `npm run db:migrate`

### Migration Best Practices

- Always review generated SQL before applying
- Test migrations on a development database first
- Use transactions for complex migrations
- Keep migrations small and focused
- Never edit applied migration files

## Production Considerations

### 1. Migrations
- Always use migrations in production (never `db:push`)
- Run migrations during deployment pipeline
- Keep migration history in version control

### 2. Connection Pooling
- Adjust pool size based on Neon plan limits
- Monitor connection usage in Neon dashboard
- Use connection pooling for serverless functions

### 3. Indexes
- Monitor slow queries and add indexes as needed
- Use `EXPLAIN ANALYZE` to verify index usage
- Balance index count vs. write performance

### 4. Backups
- Enable automated backups in Neon dashboard
- Test backup restoration regularly
- Keep backups for at least 30 days

### 5. Monitoring
- Set up query performance monitoring
- Track connection pool metrics
- Monitor database size and growth
- Set up alerts for connection errors

### 6. Security
- Use SSL/TLS for all connections
- Rotate database credentials regularly
- Use environment variables for credentials
- Implement row-level security if needed

## Troubleshooting

### Connection Issues

```typescript
// Test connection
import { testConnection } from '@/lib/db/utils';
const connected = await testConnection();
```

### Migration Failures

```bash
# Check migration status
npm run db:studio

# Rollback (manual)
# Edit the database to remove failed changes
# Then re-run: npm run db:migrate
```

### Performance Issues

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```
