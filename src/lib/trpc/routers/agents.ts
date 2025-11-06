import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { agents, meetings } from '@/lib/db/schema';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';

// Validation schemas
export const createAgentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  instructions: z.string().min(1, 'Instructions are required'),
  avatarSeed: z.string().optional(),
});

export const updateAgentSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  instructions: z.string().min(1, 'Instructions are required'),
  avatarSeed: z.string().optional(),
});

export const getAgentSchema = z.object({
  id: z.string(),
});

export const deleteAgentSchema = z.object({
  id: z.string(),
});

export const getManyAgentsSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

// Agent router
export const agentsRouter = router({
  // Get paginated list of agents with optional search
  getMany: protectedProcedure
    .input(getManyAgentsSchema)
    .query(async ({ input, ctx }) => {
      const { page, limit, search } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions = [eq(agents.userId, ctx.user.id)];
      
      if (search) {
        whereConditions.push(
          sql`${agents.name} ILIKE ${`%${search}%`}`
        );
      }

      // Get total count
      const [{ value: total }] = await ctx.db
        .select({ value: count() })
        .from(agents)
        .where(and(...whereConditions));

      // Get paginated results
      const results = await ctx.db
        .select()
        .from(agents)
        .where(and(...whereConditions))
        .orderBy(desc(agents.createdAt))
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

  // Get single agent by ID
  getOne: protectedProcedure
    .input(getAgentSchema)
    .query(async ({ input, ctx }) => {
      const agent = await ctx.db.query.agents.findFirst({
        where: and(
          eq(agents.id, input.id),
          eq(agents.userId, ctx.user.id)
        ),
      });

      if (!agent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      return agent;
    }),

  // Create new agent
  create: protectedProcedure
    .input(createAgentSchema)
    .mutation(async ({ input, ctx }) => {
      const { name, instructions, avatarSeed } = input;

      // Check if agent with same name already exists for this user
      const existingAgent = await ctx.db.query.agents.findFirst({
        where: and(
          eq(agents.userId, ctx.user.id),
          eq(agents.name, name)
        ),
      });

      if (existingAgent) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'An agent with this name already exists',
        });
      }

      // Generate avatar seed if not provided
      const seed = avatarSeed || nanoid();

      // Create agent
      const [newAgent] = await ctx.db
        .insert(agents)
        .values({
          id: nanoid(),
          name,
          userId: ctx.user.id,
          instructions,
          avatarSeed: seed,
        })
        .returning();

      return newAgent;
    }),

  // Update existing agent
  update: protectedProcedure
    .input(updateAgentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, name, instructions, avatarSeed } = input;

      // Check if agent exists and belongs to user
      const existingAgent = await ctx.db.query.agents.findFirst({
        where: and(
          eq(agents.id, id),
          eq(agents.userId, ctx.user.id)
        ),
      });

      if (!existingAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Check if another agent with the same name exists
      if (name !== existingAgent.name) {
        const duplicateAgent = await ctx.db.query.agents.findFirst({
          where: and(
            eq(agents.userId, ctx.user.id),
            eq(agents.name, name)
          ),
        });

        if (duplicateAgent) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'An agent with this name already exists',
          });
        }
      }

      // Update agent
      const [updatedAgent] = await ctx.db
        .update(agents)
        .set({
          name,
          instructions,
          avatarSeed: avatarSeed || existingAgent.avatarSeed,
          updatedAt: new Date(),
        })
        .where(eq(agents.id, id))
        .returning();

      return updatedAgent;
    }),

  // Delete agent
  remove: protectedProcedure
    .input(deleteAgentSchema)
    .mutation(async ({ input, ctx }) => {
      const { id } = input;

      // Check if agent exists and belongs to user
      const existingAgent = await ctx.db.query.agents.findFirst({
        where: and(
          eq(agents.id, id),
          eq(agents.userId, ctx.user.id)
        ),
      });

      if (!existingAgent) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Agent not found',
        });
      }

      // Check if agent has active meetings
      const activeMeetings = await ctx.db.query.meetings.findFirst({
        where: and(
          eq(meetings.agentId, id),
          sql`${meetings.status} IN ('upcoming', 'active')`
        ),
      });

      if (activeMeetings) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Cannot delete agent with active or upcoming meetings',
        });
      }

      // Delete agent (cascade will handle related meetings)
      await ctx.db
        .delete(agents)
        .where(eq(agents.id, id));

      return { success: true };
    }),
});
