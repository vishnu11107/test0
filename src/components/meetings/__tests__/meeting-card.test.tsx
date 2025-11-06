import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MeetingCard } from '../meeting-card';
import type { Meeting } from '@/lib/db/schema';

describe('MeetingCard', () => {
  const mockMeeting: Meeting & {
    agent?: {
      id: string;
      name: string;
      avatarSeed: string | null;
      instructions: string;
    } | null;
  } = {
    id: 'test-id',
    name: 'Test Meeting',
    userId: 'user-id',
    agentId: 'agent-id',
    streamCallId: 'call-id',
    status: 'upcoming',
    startedAt: null,
    endedAt: null,
    durationSeconds: null,
    transcriptUrl: null,
    recordingUrl: null,
    summary: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    agent: {
      id: 'agent-id',
      name: 'Test Agent',
      avatarSeed: 'test-seed',
      instructions: 'Test instructions',
    },
  };

  it('renders meeting information correctly', () => {
    render(<MeetingCard meeting={mockMeeting} />);

    expect(screen.getByText('Test Meeting')).toBeInTheDocument();
    expect(screen.getByText(/with test agent/i)).toBeInTheDocument();
    expect(screen.getByText('Upcoming')).toBeInTheDocument();
  });

  it('displays avatar fallback', () => {
    render(<MeetingCard meeting={mockMeeting} />);

    // Avatar fallback should show first two letters
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('displays status badge with correct variant for upcoming meeting', () => {
    render(<MeetingCard meeting={mockMeeting} />);

    const badge = screen.getByText('Upcoming');
    expect(badge).toBeInTheDocument();
  });

  it('displays status badge with correct variant for completed meeting', () => {
    const completedMeeting = {
      ...mockMeeting,
      status: 'completed' as const,
      durationSeconds: 1800,
    };

    render(<MeetingCard meeting={completedMeeting} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('displays status badge with correct variant for active meeting', () => {
    const activeMeeting = {
      ...mockMeeting,
      status: 'active' as const,
    };

    render(<MeetingCard meeting={activeMeeting} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays duration for completed meetings', () => {
    const completedMeeting = {
      ...mockMeeting,
      status: 'completed' as const,
      durationSeconds: 1800, // 30 minutes
    };

    render(<MeetingCard meeting={completedMeeting} />);

    expect(screen.getByText(/duration: 30m 0s/i)).toBeInTheDocument();
  });

  it('shows Start button for upcoming meetings', () => {
    render(<MeetingCard meeting={mockMeeting} onJoin={vi.fn()} />);

    const startButton = screen.getByRole('button', { name: /start/i });
    expect(startButton).toBeInTheDocument();
  });

  it('shows Rejoin button for active meetings', () => {
    const activeMeeting = {
      ...mockMeeting,
      status: 'active' as const,
    };

    render(<MeetingCard meeting={activeMeeting} onJoin={vi.fn()} />);

    const rejoinButton = screen.getByRole('button', { name: /rejoin/i });
    expect(rejoinButton).toBeInTheDocument();
  });

  it('shows View Details button for completed meetings', () => {
    const completedMeeting = {
      ...mockMeeting,
      status: 'completed' as const,
    };

    render(<MeetingCard meeting={completedMeeting} onViewDetails={vi.fn()} />);

    const detailsButton = screen.getByRole('button', { name: /view details/i });
    expect(detailsButton).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<MeetingCard meeting={mockMeeting} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit meeting/i);
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockMeeting);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<MeetingCard meeting={mockMeeting} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete meeting/i);
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockMeeting);
  });

  it('calls onJoin when start button is clicked', () => {
    const onJoin = vi.fn();
    render(<MeetingCard meeting={mockMeeting} onJoin={onJoin} />);

    const startButton = screen.getByRole('button', { name: /start/i });
    fireEvent.click(startButton);

    expect(onJoin).toHaveBeenCalledWith(mockMeeting);
  });

  it('calls onViewDetails when details button is clicked', () => {
    const completedMeeting = {
      ...mockMeeting,
      status: 'completed' as const,
    };
    const onViewDetails = vi.fn();
    render(<MeetingCard meeting={completedMeeting} onViewDetails={onViewDetails} />);

    const detailsButton = screen.getByRole('button', { name: /view details/i });
    fireEvent.click(detailsButton);

    expect(onViewDetails).toHaveBeenCalledWith(completedMeeting);
  });

  it('does not show edit button for active meetings', () => {
    const activeMeeting = {
      ...mockMeeting,
      status: 'active' as const,
    };

    render(<MeetingCard meeting={activeMeeting} onEdit={vi.fn()} />);

    const editButton = screen.queryByLabelText(/edit meeting/i);
    expect(editButton).not.toBeInTheDocument();
  });

  it('does not show delete button for active meetings', () => {
    const activeMeeting = {
      ...mockMeeting,
      status: 'active' as const,
    };

    render(<MeetingCard meeting={activeMeeting} onDelete={vi.fn()} />);

    const deleteButton = screen.queryByLabelText(/delete meeting/i);
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('displays created time relative to now', () => {
    render(<MeetingCard meeting={mockMeeting} />);

    // Should show "Created X ago"
    expect(screen.getByText(/created/i)).toBeInTheDocument();
  });
});
