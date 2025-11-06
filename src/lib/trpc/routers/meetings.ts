import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { meetings, agents } from '@/lib/db/schema';
import { eq, and, sql, desc, count, or } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { createStreamCall, generateStreamToken } from '@/lib/stream';

// Validation schemas
export const createMeetingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  agentId: z.string().min(1, 'Agent is required'),
});

export const updateMeetingSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
});

export const getMeetingSchema = z.object({
  id: z.string(),
});

export const deleteMeetingSchema = z.object({
  id: z.string(),
});

export const getManyMeetingsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['upcoming', 'active', 'completed', 'processing', 'cancelled']).optional(),
  agentId: z.string().optional(),
});

export const updateMeetingStatusSchema = z.object({
  id: z.string(),
  status: z.enum(['upcoming', 'active', 'completed', 'processing', 'cancelled']),
});

export const generateTokenSchema = z.object({
  meetingId: z.string(),
});

// Valid status transitions
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  upcoming: ['active', 'cancelled'],
  active: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Helper function to validate status transitions
function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// Meetings router
export const meetingsRouter = router({
  // Get paginated list of meetings with optional filters
  getMany: protectedProcedure
    .input(getManyMeetingsSchema)
    .query(async ({ input, ctx }) => {
      const { page, limit, search, status, agentId } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [eq(meetings.userId, ctx.user.id)];
      
      if (status) {
        whereConditions.push(eq(meetings.status, status));
      }

      if (agentId) {
        whereConditions.push(eq(meetings.agentId, agentId));
      }

      if (search) {
        whereConditions.push(
          sql`${meetings.name} ILIKE ${`%${search}%`}`
        );
      }

      // Get total count
      const [{ value: total }] = await ctx.db
        .select({ value: count() })
        .from(meetings)
        .where(and(...whereConditions));

      // Get paginated results with agent information
      const results = await ctx.db
        .select({
          id: meetings.id,
          name: meetings.name,
          userId: meetings.userId,
          agentId: meetings.agentId,
          streamCallId: meetings.streamCallId,
          status: meetings.status,
          startedAt: meetings.startedAt,
          endedAt: meetings.endedAt,
          durationSeconds: meetings.durationSeconds,
          transcriptUrl: meetings.transcriptUrl,
          recordingUrl: meetings.recordingUrl,
          summary: meetings.summary,
          createdAt: meetings.createdAt,
          updatedAt: meetings.updatedAt,
          agent: {
            id: agents.id,
            name: agents.name,
            avatarSeed: agents.avatarSeed,
            instructions: agents.instructions,
          },
        })
        .from(meetings)
        .leftJoin(agents, eq(meetings.agentId, agents.id))
        .where(and(...whereConditions))
        .orderBy(desc(meetings.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        data: results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get single meeting by ID
  getOne: protectedProcedure
    .input(getMeetingSchema)
    .query(async ({ input, ctx }) => {
      const result = await ctx.db
        .select({
          id: meetings.id,
          name: meetings.name,
          userId: meetings.userId,
          agentId: meetings.agentId,
          streamCallId: meetings.streamCallId,
          status: meetings.status,
          startedAt: meetings.startedAt,
          endedAt: meetings.endedAt,
          durationSeconds: meetings.durationSeconds,
          transcriptUrl: meetings.transcriptUrl,
          recordingUrl: meetings.recordingUrl,
          summary: meetings.summary,
          createdAt: meetings.createdAt,
          updatedAt: meetings.updatedAt,
          agent: {
            id: agents.id,
            name: agents.name,
            avatarSeed: agents.avatarSeed,
            instructions: agents.instructions,
          },
        })
        .from(meetings)
        .leftJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.id, input.id),
            eq(meetings.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!result || result.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      return result[0];
    }),

  // Create new meeting
  create: protectedProcedure
    .input(createMeetingSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, agentId } = input;

      // Verify agent exists and belongs to user
      const agent = await ctx.db.query.agents.findFirst({
        where: and(
          eq(agents.id, agentId),
          eq(agents.userId, ctx.user.id)
        ),
      });

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Generate meeting ID
      const meetingId = nanoid();

      // Create Stream call
      try {
        const callId = `meeting-${meetingId}`;
        
        // Create call in Stream
        await createStreamCall(callId, ctx.user.id, {
          meetingId,
          agentId,
          agentName: agent.name,
        });

        // Create meeting in database
        const [newMeeting] = await ctx.db
          .insert(meetings)
          .values({
            id: meetingId,
            name,
            userId: ctx.user.id,
            agentId,
            streamCallId: callId,
            status: 'upcoming',
          })
          .returning();

        return newMeeting;
      } catch (error) {
        console.error('Error creating meeting:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create meeting',
        });
      }
    }),

  // Update meeting name
  update: protectedProcedure
    .input(updateMeetingSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, name } = input;

      // Check if meeting exists and belongs to user
      const existingMeeting = await ctx.db.query.meetings.findFirst({
        where: and(
          eq(meetings.id, id),
          eq(meetings.userId, ctx.user.id)
        ),
      });

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // Don't allow updates to active or completed meetings
      if (existingMeeting.status === 'active' || existingMeeting.status === 'completed') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot update active or completed meetings',
        });
      }

      // Update meeting
      const [updatedMeeting] = await ctx.db
        .update(meetings)
        .set({
          name,
          updatedAt: new Date(),
        })
        .where(eq(meetings.id, id))
        .returning();

      return updatedMeeting;
    }),

  // Update meeting status
  updateStatus: protectedProcedure
    .input(updateMeetingStatusSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, status: newStatus } = input;

      // Check if meeting exists and belongs to user
      const existingMeeting = await ctx.db.query.meetings.findFirst({
        where: and(
          eq(meetings.id, id),
          eq(meetings.userId, ctx.user.id)
        ),
      });

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // Validate status transition
      if (!isValidStatusTransition(existingMeeting.status, newStatus)) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Invalid status transition from ${existingMeeting.status} to ${newStatus}`,
        });
      }

      // Prepare update data
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date(),
      };

      // Set timestamps based on status
      if (newStatus === 'active' && !existingMeeting.startedAt) {
        updateData.startedAt = new Date();
      }

      if (newStatus === 'processing' && !existingMeeting.endedAt) {
        updateData.endedAt = new Date();
        
        // Calculate duration if we have both start and end times
        if (existingMeeting.startedAt) {
          const durationMs = updateData.endedAt.getTime() - existingMeeting.startedAt.getTime();
          updateData.durationSeconds = Math.floor(durationMs / 1000);
        }
      }

      // Update meeting
      const [updatedMeeting] = await ctx.db
        .update(meetings)
        .set(updateData)
        .where(eq(meetings.id, id))
        .returning();

      return updatedMeeting;
    }),

  // Delete meeting
  remove: protectedProcedure
    .input(deleteMeetingSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      // Check if meeting exists and belongs to user
      const existingMeeting = await ctx.db.query.meetings.findFirst({
        where: and(
          eq(meetings.id, id),
          eq(meetings.userId, ctx.user.id)
        ),
      });

      if (!existingMeeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // Don't allow deletion of active meetings
      if (existingMeeting.status === 'active') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete active meetings',
        });
      }

      // Delete meeting
      await ctx.db
        .delete(meetings)
        .where(eq(meetings.id, id));

      return { success: true };
    }),

  // Generate Stream user token for joining a call
  generateToken: protectedProcedure
    .input(generateTokenSchema)
    .mutation(async ({ input, ctx }) => {
      const { meetingId } = input;

      // Verify meeting exists and belongs to user
      const meeting = await ctx.db.query.meetings.findFirst({
        where: and(
          eq(meetings.id, meetingId),
          eq(meetings.userId, ctx.user.id)
        ),
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      if (!meeting.streamCallId) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Meeting does not have a Stream call ID',
        });
      }

      try {
        // Generate user token
        const token = generateStreamToken(ctx.user.id, 3600); // 1 hour validity

        return {
          token,
          apiKey: process.env.STREAM_API_KEY,
          callId: meeting.streamCallId,
          userId: ctx.user.id,
        };
      } catch (error) {
        console.error('Error generating token:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate Stream token',
        });
      }
    }),
});
