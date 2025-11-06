import { describe, it, expect, beforeEach, vi } from 'vitest';
import { meetingsRouter } from '../meetings';
import type { Context } from '../../context';
import { TRPCError } from '@trpc/server';

// Mock Stream utilities
vi.mock('@/lib/stream', () => ({
  createStreamCall: vi.fn().mockResolvedValue(undefined),
  generateStreamToken: vi.fn().mockReturnValue('mock-token'),
}));

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

describe('Meetings Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new meeting with valid data', async () => {
      const mockAgent = {
        id: 'agent-1',
        name: 'Test Agent',
        userId: 'test-user-id',
        instructions: 'Test instructions',
        avatarSeed: 'seed-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        streamCallId: 'meeting-meeting-1',
        status: 'upcoming' as const,
        startedAt: null,
        endedAt: null,
        durationSeconds: null,
        transcriptUrl: null,
        recordingUrl: null,
        summary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Set environment variables for the test
      process.env.STREAM_API_KEY = 'test-api-key';
      process.env.STREAM_API_SECRET = 'test-api-secret';

      mockDb.query.agents.findFirst.mockResolvedValue(mockAgent);
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newMeeting]),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.create({
        name: 'Test Meeting',
        agentId: 'agent-1',
      });

      expect(result.name).toBe('Test Meeting');
      expect(result.agentId).toBe('agent-1');
      expect(result.status).toBe('upcoming');
    });

    it('should throw error when agent does not exist', async () => {
      mockDb.query.agents.findFirst.mockResolvedValue(null);

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.create({
          name: 'Test Meeting',
          agentId: 'non-existent-agent',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('getMany', () => {
    it('should return paginated meetings', async () => {
      const mockMeetings = [
        {
          id: 'meeting-1',
          name: 'Meeting 1',
          userId: 'test-user-id',
          agentId: 'agent-1',
          streamCallId: 'call-1',
          status: 'upcoming',
          startedAt: null,
          endedAt: null,
          durationSeconds: null,
          transcriptUrl: null,
          recordingUrl: null,
          summary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          agent: {
            id: 'agent-1',
            name: 'Test Agent',
            avatarSeed: 'seed-1',
            instructions: 'Test instructions',
          },
        },
      ];

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ value: 1 }]),
        }),
      });

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockMeetings),
                }),
              }),
            }),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.getMany({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockMeetings);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('getOne', () => {
    it('should return a single meeting', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        streamCallId: 'call-1',
        status: 'upcoming',
        startedAt: null,
        endedAt: null,
        durationSeconds: null,
        transcriptUrl: null,
        recordingUrl: null,
        summary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        agent: {
          id: 'agent-1',
          name: 'Test Agent',
          avatarSeed: 'seed-1',
          instructions: 'Test instructions',
        },
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([mockMeeting]),
            }),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.getOne({ id: 'meeting-1' });

      expect(result.id).toBe('meeting-1');
      expect(result.name).toBe('Test Meeting');
      expect(result.agent?.name).toBe('Test Agent');
    });

    it('should throw error when meeting does not exist', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.getOne({ id: 'non-existent-id' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('update', () => {
    it('should update meeting name', async () => {
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Original Name',
        userId: 'test-user-id',
        agentId: 'agent-1',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMeeting = {
        ...existingMeeting,
        name: 'Updated Name',
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedMeeting]),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.update({
        id: 'meeting-1',
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should not allow updating active meetings', async () => {
      const activeMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        status: 'active',
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(activeMeeting);

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.update({
          id: 'meeting-1',
          name: 'New Name',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('updateStatus', () => {
    it('should update meeting status with valid transition', async () => {
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        status: 'upcoming',
        startedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMeeting = {
        ...existingMeeting,
        status: 'active',
        startedAt: new Date(),
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedMeeting]),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.updateStatus({
        id: 'meeting-1',
        status: 'active',
      });

      expect(result.status).toBe('active');
      expect(result.startedAt).toBeDefined();
    });

    it('should calculate duration when transitioning to processing', async () => {
      const startTime = new Date(Date.now() - 60000); // 1 minute ago
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        status: 'active',
        startedAt: startTime,
        endedAt: null,
        durationSeconds: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedMeeting = {
        ...existingMeeting,
        status: 'processing',
        endedAt: new Date(),
        durationSeconds: 60,
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedMeeting]),
          }),
        }),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.updateStatus({
        id: 'meeting-1',
        status: 'processing',
      });

      expect(result.status).toBe('processing');
      expect(result.endedAt).toBeDefined();
      expect(result.durationSeconds).toBeGreaterThan(0);
    });

    it('should reject invalid status transitions', async () => {
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        status: 'upcoming',
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.updateStatus({
          id: 'meeting-1',
          status: 'completed',
        })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('remove', () => {
    it('should delete a meeting', async () => {
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      });

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.remove({ id: 'meeting-1' });

      expect(result.success).toBe(true);
    });

    it('should not allow deleting active meetings', async () => {
      const activeMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        status: 'active',
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(activeMeeting);

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.remove({ id: 'meeting-1' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('generateToken', () => {
    it('should generate Stream token for meeting', async () => {
      const existingMeeting = {
        id: 'meeting-1',
        name: 'Test Meeting',
        userId: 'test-user-id',
        agentId: 'agent-1',
        streamCallId: 'meeting-meeting-1',
        status: 'upcoming',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockDb.query.meetings.findFirst.mockResolvedValue(existingMeeting);

      // Set environment variables for the test
      process.env.STREAM_API_KEY = 'test-api-key';
      process.env.STREAM_API_SECRET = 'test-api-secret';

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      const result = await caller.generateToken({
        meetingId: 'meeting-1',
      });

      expect(result.token).toBe('mock-token');
      expect(result.apiKey).toBe('test-api-key');
      expect(result.callId).toBe('meeting-meeting-1');
      expect(result.userId).toBe('test-user-id');
    });

    it('should throw error for non-existent meeting', async () => {
      mockDb.query.meetings.findFirst.mockResolvedValue(null);

      const ctx = createMockContext();
      const caller = meetingsRouter.createCaller(ctx);

      await expect(
        caller.generateToken({ meetingId: 'non-existent-id' })
      ).rejects.toThrow(TRPCError);
    });
  });
});
