import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user as authUser } from '@/lib/auth/schema';

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free_trial',
  'basic',
  'pro',
  'enterprise',
]);

export const meetingStatusEnum = pgEnum('meeting_status', [
  'upcoming',
  'active',
  'completed',
  'processing',
  'cancelled',
]);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  password: text('password'), // Hashed password for email/password auth
  image: text('image'),
  subscriptionTier: subscriptionTierEnum('subscription_tier').default('free_trial'),
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// Accounts table (for OAuth)
export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(table.provider, table.providerAccountId),
}));

// Agents table
export const agents = pgTable('agents', {
  id: varchar('id', { length: 21 }).primaryKey(), // nanoid
  name: varchar('name', { length: 255 }).notNull(),
  userId: text('user_id')
    .references(() => authUser.id, { onDelete: 'cascade' })
    .notNull(),
  instructions: text('instructions').notNull(),
  avatarSeed: varchar('avatar_seed', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('agents_user_id_idx').on(table.userId),
  userNameIdx: uniqueIndex('agents_user_name_idx').on(table.userId, table.name),
}));

// Meetings table
export const meetings = pgTable('meetings', {
  id: varchar('id', { length: 21 }).primaryKey(), // nanoid
  name: varchar('name', { length: 255 }).notNull(),
  userId: text('user_id')
    .references(() => authUser.id, { onDelete: 'cascade' })
    .notNull(),
  agentId: varchar('agent_id', { length: 21 })
    .references(() => agents.id, { onDelete: 'cascade' })
    .notNull(),
  streamCallId: varchar('stream_call_id', { length: 255 }).unique(),
  status: meetingStatusEnum('status').default('upcoming').notNull(),
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  durationSeconds: integer('duration_seconds'),
  transcriptUrl: text('transcript_url'),
  recordingUrl: text('recording_url'),
  summary: text('summary'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('meetings_user_id_idx').on(table.userId),
  agentIdIdx: index('meetings_agent_id_idx').on(table.agentId),
  statusIdx: index('meetings_status_idx').on(table.status),
  userStatusIdx: index('meetings_user_status_idx').on(table.userId, table.status),
  streamCallIdIdx: index('meetings_stream_call_id_idx').on(table.streamCallId),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  agents: many(agents),
  meetings: many(meetings),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  user: one(authUser, {
    fields: [agents.userId],
    references: [authUser.id],
  }),
  meetings: many(meetings),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  user: one(authUser, {
    fields: [meetings.userId],
    references: [authUser.id],
  }),
  agent: one(agents, {
    fields: [meetings.agentId],
    references: [agents.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
