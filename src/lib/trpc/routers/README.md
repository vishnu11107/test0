# tRPC Routers

This directory contains all tRPC router implementations for the Meet AI platform.

## Available Routers

### Agents Router (`agents.ts`)
Handles CRUD operations for AI agents.

**Procedures:**
- `getMany` - Get paginated list of agents with search
- `getOne` - Get single agent by ID
- `create` - Create new agent
- `update` - Update existing agent
- `remove` - Delete agent (prevents deletion if agent has active meetings)

### Meetings Router (`meetings.ts`)
Handles meeting management and Stream Video SDK integration.

**Procedures:**
- `getMany` - Get paginated list of meetings with filters (status, agent, search)
- `getOne` - Get single meeting with agent details
- `create` - Create new meeting and Stream call
- `update` - Update meeting name (not allowed for active/completed meetings)
- `updateStatus` - Update meeting status with validation
- `remove` - Delete meeting (not allowed for active meetings)
- `generateToken` - Generate Stream user token for joining calls

**Status Transitions:**
- `upcoming` → `active`, `cancelled`
- `active` → `processing`, `cancelled`
- `processing` → `completed`, `cancelled`
- `completed` → (no transitions)
- `cancelled` → (no transitions)

## Stream Video Integration

The meetings router integrates with Stream Video SDK through the `@/lib/stream` utility module. This provides:
- `createStreamCall()` - Create a video call in Stream
- `generateStreamToken()` - Generate JWT tokens for users to join calls

## Testing

All routers have comprehensive test coverage in the `__tests__` directory. Tests use mocked database and Stream SDK for isolation.

Run tests:
```bash
npm test src/lib/trpc/routers/__tests__/
```
