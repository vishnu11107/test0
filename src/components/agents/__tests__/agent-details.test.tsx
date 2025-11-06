import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentDetails } from '../agent-details';
import { trpc } from '@/lib/trpc/client';
import type { Agent } from '@/lib/db/schema';

// Mock tRPC client
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    agents: {
      getOne: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (date: Date, formatStr: string) => {
    return date.toLocaleDateString();
  },
}));

describe('AgentDetails', () => {
  const mockAgent: Agent = {
    id: 'agent-1',
    name: 'Language Tutor',
    userId: 'user-1',
    instructions: 'Help users learn languages through conversation',
    avatarSeed: 'seed-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders agent details correctly', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.getByText('Language Tutor')).toBeInTheDocument();
    expect(screen.getByText('Help users learn languages through conversation')).toBeInTheDocument();
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
    expect(screen.getByText('agent-1')).toBeInTheDocument();
    expect(screen.getByText('seed-1')).toBeInTheDocument();
  });

  it('renders error state', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Agent not found'),
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.getByText('Agent not found')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    const onEdit = vi.fn();
    render(<AgentDetails agentId="agent-1" onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalled();
  });

  it('calls onDelete when delete button is clicked', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    const onDelete = vi.fn();
    render(<AgentDetails agentId="agent-1" onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalled();
  });

  it('does not render edit and delete buttons when callbacks not provided', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('displays avatar fallback', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.getByText('LA')).toBeInTheDocument();
  });

  it('displays formatted dates', () => {
    (trpc.agents.getOne.useQuery as any).mockReturnValue({
      data: mockAgent,
      isLoading: false,
      error: null,
    });

    render(<AgentDetails agentId="agent-1" />);

    expect(screen.getByText(/created/i)).toBeInTheDocument();
    expect(screen.getByText(/updated/i)).toBeInTheDocument();
  });
});
