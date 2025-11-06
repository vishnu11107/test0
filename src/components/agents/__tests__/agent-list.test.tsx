import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentList } from '../agent-list';
import { trpc } from '@/lib/trpc/client';
import type { Agent } from '@/lib/db/schema';

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    agents: {
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
    useUtils: vi.fn(),
  },
}));

describe('AgentList', () => {
  const mockAgents: Agent[] = [
    {
      id: 'agent-1',
      name: 'Language Tutor',
      userId: 'user-1',
      instructions: 'Help users learn languages',
      avatarSeed: 'seed-1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'agent-2',
      name: 'Interview Coach',
      userId: 'user-1',
      instructions: 'Prepare users for interviews',
      avatarSeed: 'seed-2',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
  ];

  const mockUtils = {
    agents: {
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
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders agent list with data', () => {
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockAgents,
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

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    expect(screen.getByText('Language Tutor')).toBeInTheDocument();
    expect(screen.getByText('Interview Coach')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    expect(screen.getByText(/failed to load agents/i)).toBeInTheDocument();
  });

  it('renders empty state when no agents', () => {
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
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

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    expect(screen.getByText(/no agents yet/i)).toBeInTheDocument();
  });

  it('opens create dialog when create button is clicked', () => {
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockAgents,
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

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    const createButton = screen.getByRole('button', { name: /create agent/i });
    fireEvent.click(createButton);

    expect(screen.getByText(/create a custom ai agent/i)).toBeInTheDocument();
  });

  it('filters agents by search query', async () => {
    const mockQueryFn = vi.fn();
    (trpc.agents.getMany.useQuery as any).mockImplementation((params: any) => {
      mockQueryFn(params);
      return {
        data: {
          data: params.search ? [mockAgents[0]] : mockAgents,
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

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    const searchInput = screen.getByPlaceholderText(/search agents/i);
    fireEvent.change(searchInput, { target: { value: 'Language' } });

    await waitFor(
      () => {
        expect(mockQueryFn).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Language',
          })
        );
      },
      { timeout: 500 }
    );
  });

  it('handles pagination', () => {
    (trpc.agents.getMany.useQuery as any).mockReturnValue({
      data: {
        data: mockAgents,
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

    (trpc.agents.create.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.update.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    (trpc.agents.remove.useMutation as any).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(<AgentList />);

    expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
  });
});
