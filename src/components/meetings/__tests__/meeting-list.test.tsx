import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MeetingList } from '../meeting-list';
import { trpc } from '@/lib/trpc/client';
import type { Meeting } from '@/lib/db/schema';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    meetings: {
      getMany: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
      },
      remove: {
        useMutation: vi.fn(),
      },
    },
    agents: {
      getMany: {
        useQuery: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));

describe('MeetingList', () => {
  const mockMeetings: Meeting[] = [
    {
      id: 'meeting-1',
      name: 'Spanish Practice',
      userId: 'user-1',
      agentId: 'agent-1',
      streamCallId: 'call-1',
      status: 'upcoming',
      startedAt: null,
      endedAt: null,
      durationSeconds: null,
      transcriptUrl: null,
      recordingUrl: null,
      summary: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'meeting-2',
      name: 'Mock Interview',
      userId: 'user-1',
      agentId: 'agent-2',
      streamCallId: 'call-2',
      status: 'completed',
      startedAt: new Date('2024-01-02T10:00:00'),
      endedAt: new Date('2024-01-02T10:30:00'),
      durationSeconds: 1800,
      transcriptUrl: 'https://example.com/transcript',
      recordingUrl: 'https://example.com/recording',
      summary: 'Great interview practice',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockAgents = [
    {
      id: 'agent-1',
      name: 'Language Tutor',
      userId: 'user-1',
      instructions: 'Help with languages',
      avatarSeed: 'seed-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'agent-2',
      name: 'Interview Coach',
      userId: 'user-1',
      instructions: 'Help with interviews',
      avatarSeed: 'seed-2',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUtils = {
    meetings: {
      getMany: {
        invalidate: vi.fn(),
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils);
  });

  it('renders loading state', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    expect(screen.getByText('Meetings')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders meeting list with data', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockMeetings,
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockAgents,
        pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
      },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    expect(screen.getByText('Spanish Practice')).toBeInTheDocument();
    expect(screen.getByText('Mock Interview')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    expect(screen.getByText(/failed to load meetings/i)).toBeInTheDocument();
  });

  it('renders empty state when no meetings', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: {
        data: [],
        pagination: {
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 0,
        },
      },
      isLoading: false,
      error: null,
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    expect(screen.getByText(/no meetings yet/i)).toBeInTheDocument();
  });

  it('opens create dialog when create button is clicked', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockMeetings,
        pagination: {
          page: 1,
          limit: 12,
          total: 2,
          totalPages: 1,
        },
      },
      isLoading: false,
      error: null,
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    const createButton = screen.getByRole('button', { name: /create meeting/i });
    fireEvent.click(createButton);

    expect(screen.getByText(/create a new meeting/i)).toBeInTheDocument();
  });

  it('filters meetings by search query', async () => {
    const mockQueryFn = vi.fn();
    (trpc.meetings.getMany.useQuery as any).mockImplementation((params: any) => {
      mockQueryFn(params);
      return {
        data: {
          data: params.search ? [mockMeetings[0]] : mockMeetings,
          pagination: {
            page: 1,
            limit: 12,
            total: params.search ? 1 : 2,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      };
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    const searchInput = screen.getByPlaceholderText(/search meetings/i);
    fireEvent.change(searchInput, { target: { value: 'Spanish' } });

    await waitFor(
      () => {
        expect(mockQueryFn).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Spanish',
          })
        );
      },
      { timeout: 500 }
    );
  });

  it('filters meetings by status', () => {
    const mockQueryFn = vi.fn();
    (trpc.meetings.getMany.useQuery as any).mockImplementation((params: any) => {
      mockQueryFn(params);
      return {
        data: {
          data: mockMeetings,
          pagination: {
            page: 1,
            limit: 12,
            total: 2,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      };
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    // Find and click the status filter
    const statusTriggers = screen.getAllByRole('combobox');
    const statusFilter = statusTriggers[0]; // First select is status filter
    fireEvent.click(statusFilter);

    // Select "Completed" option
    const completedOption = screen.getByRole('option', { name: /completed/i });
    fireEvent.click(completedOption);

    expect(mockQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      })
    );
  });

  it('filters meetings by agent', () => {
    const mockQueryFn = vi.fn();
    (trpc.meetings.getMany.useQuery as any).mockImplementation((params: any) => {
      mockQueryFn(params);
      return {
        data: {
          data: mockMeetings,
          pagination: {
            page: 1,
            limit: 12,
            total: 2,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      };
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    // Find and click the agent filter
    const agentTriggers = screen.getAllByRole('combobox');
    const agentFilter = agentTriggers[1]; // Second select is agent filter
    fireEvent.click(agentFilter);

    // Select agent option
    const agentOption = screen.getByRole('option', { name: /language tutor/i });
    fireEvent.click(agentOption);

    expect(mockQueryFn).toHaveBeenCalledWith(
      expect.objectContaining({
        agentId: 'agent-1',
      })
    );
  });

  it('clears all filters when clear button is clicked', () => {
    const mockQueryFn = vi.fn();
    (trpc.meetings.getMany.useQuery as any).mockImplementation((params: any) => {
      mockQueryFn(params);
      return {
        data: {
          data: mockMeetings,
          pagination: {
            page: 1,
            limit: 12,
            total: 2,
            totalPages: 1,
          },
        },
        isLoading: false,
        error: null,
      };
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    // Add a search filter
    const searchInput = screen.getByPlaceholderText(/search meetings/i);
    fireEvent.change(searchInput, { target: { value: 'Spanish' } });

    // Click clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    fireEvent.click(clearButton);

    // Verify search is cleared
    expect(searchInput).toHaveValue('');
  });

  it('handles pagination', () => {
    (trpc.meetings.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockMeetings,
        pagination: {
          page: 1,
          limit: 12,
          total: 25,
          totalPages: 3,
        },
      },
      isLoading: false,
      error: null,
    });

    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: { data: mockAgents, pagination: { page: 1, limit: 100, total: 2, totalPages: 1 } },
      isLoading: false,
    });

    (trpc.meetings.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.meetings.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<MeetingList />);

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });
});
