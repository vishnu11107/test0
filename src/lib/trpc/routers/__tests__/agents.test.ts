import { describe, it, expect, beforeEach, vi } from 'vitest';
import { agentsRouter } from '../agents';
import type { Context } from '../../context';
import { TRPCError } from '@trpc/server';

// Mock database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  query: {
    agents: {
      findFirst: vi.fn(),
    },
    meetings: {
      findFirst: vi.fn(),
    },
  },
};

// Mock context
const createMockContext = (userId: string = 'test-user-id'): Context => ({
  db: mockDb as any,
  session: {
    user: {
      id: userId,
      email: 'test@example.com',
      name: 'Test User',
    },
    session: {
      id: 'session-id',
      userId,
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
    },
  } as any,
  user: {
    id: userId,
    email: 'test@example.com',
    name: 'Test User',
  } as any,
});

describe('Agents Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMany', () => {
    it('should return paginated agents', async () => {
      const mockAgents = [
        {
          id: 'agent-1',
          name: 'Test Agent 1',
          userId: 'test-user-id',
          instructions: 'Test instructions',
          avatarSeed: 'seed-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                offset: vi.fn().mockResolvedValue(mockAgents),
              }),
            }),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      const result = await caller.getMany({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockAgents);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('create', () => {
    it('should create a new agent', async () => {
      const newAgent = {
        id: 'new-agent-id',
        name: 'New Agent',
        userId: 'test-user-id',
        instructions: 'New instructions',
        avatarSeed: 'new-seed',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.agents.findFirst.mockResolvedValue(null);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newAgent]),
        }),
      });

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      const result = await caller.create({
        name: 'New Agent',
        instructions: 'New instructions',
      });

      expect(result.name).toBe('New Agent');
      expect(result.instructions).toBe('New instructions');
    });

    it('should throw error if agent name already exists', async () => {
      mockDb.query.agents.findFirst.mockResolvedValue({
        id: 'existing-agent',
        name: 'Existing Agent',
      });

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      await expect(
        caller.create({
          name: 'Existing Agent',
          instructions: 'Test instructions',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getOne', () => {
    it('should return a single agent', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        userId: 'test-user-id',
        instructions: 'Test instructions',
        avatarSeed: 'seed-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.agents.findFirst.mockResolvedValue(mockAgent);

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      const result = await caller.getOne({ id: 'agent-1' });

      expect(result).toEqual(mockAgent);
    });

    it('should throw error if agent not found', async () => {
      mockDb.query.agents.findFirst.mockResolvedValue(null);

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      await expect(caller.getOne({ id: 'non-existent' })).rejects.toThrow(
        TRPCError
      );
    });
  });

  describe('update', () => {
    it('should update an existing agent', async () => {
      const existingAgent = {
        id: 'agent-1',
        name: 'Old Name',
        userId: 'test-user-id',
        instructions: 'Old instructions',
        avatarSeed: 'seed-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedAgent = {
        ...existingAgent,
        name: 'New Name',
        instructions: 'New instructions',
      };

      mockDb.query.agents.findFirst.mockResolvedValueOnce(existingAgent);
      mockDb.query.agents.findFirst.mockResolvedValueOnce(null);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedAgent]),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      const result = await caller.update({
        id: 'agent-1',
        name: 'New Name',
        instructions: 'New instructions',
      });

      expect(result.name).toBe('New Name');
      expect(result.instructions).toBe('New instructions');
    });
  });

  describe('remove', () => {
    it('should delete an agent', async () => {
      const existingAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        userId: 'test-user-id',
        instructions: 'Test instructions',
        avatarSeed: 'seed-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.agents.findFirst.mockResolvedValue(existingAgent);
      mockDb.query.meetings.findFirst.mockResolvedValue(null);
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      const result = await caller.remove({ id: 'agent-1' });

      expect(result.success).toBe(true);
    });

    it('should throw error if agent has active meetings', async () => {
      const existingAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        userId: 'test-user-id',
      };

      const activeMeeting = {
        id: 'meeting-1',
        agentId: 'agent-1',
        status: 'active',
      };

      mockDb.query.agents.findFirst.mockResolvedValue(existingAgent);
      mockDb.query.meetings.findFirst.mockResolvedValue(activeMeeting);

      const ctx = createMockContext();
      const caller = agentsRouter.createCaller(ctx);

      await expect(caller.remove({ id: 'agent-1' })).rejects.toThrow(
        TRPCError
      );
    });
  });
});
