import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TranscriptViewer } from '../transcript-viewer';
import { trpc } from '@/lib/trpc/client';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    meetings: {
      getTranscript: {
        useQuery: vi.fn(),
      },
    },
  },
}));

describe('TranscriptViewer', () => {
  const mockTranscriptData = {
    entries: [
      {
        timestamp: 0,
        speaker: 'user' as const,
        text: 'Hello, how are you today?',
      },
      {
        timestamp: 5000,
        speaker: 'agent' as const,
        text: 'I am doing well, thank you for asking. How can I help you?',
      },
      {
        timestamp: 10000,
        speaker: 'user' as const,
        text: 'I need help with my project planning.',
      },
    ],
    totalEntries: 3,
    searchTerm: undefined,
    timeRange: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state correctly', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('Loading transcript...')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
    const mockRefetch = vi.fn();
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: { message: 'Failed to load transcript' },
      refetch: mockRefetch,
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('Failed to load transcript')).toBeInTheDocument();
    expect(screen.getByText('Failed to load transcript')).toBeInTheDocument();
    
    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(tryAgainButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders empty state when no transcript entries', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: { entries: [], totalEntries: 0 },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('No transcript available')).toBeInTheDocument();
    expect(screen.getByText(/transcript will be available after/i)).toBeInTheDocument();
  });

  it('renders transcript entries correctly', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('Meeting Transcript')).toBeInTheDocument();
    expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
    expect(screen.getByText('I am doing well, thank you for asking. How can I help you?')).toBeInTheDocument();
    expect(screen.getByText('I need help with my project planning.')).toBeInTheDocument();
  });

  it('displays speaker badges correctly', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    const youBadges = screen.getAllByText('You');
    const agentBadges = screen.getAllByText('AI Agent');
    
    expect(youBadges).toHaveLength(2); // Two user messages
    expect(agentBadges).toHaveLength(1); // One agent message
  });

  it('displays timestamps correctly', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('0:00')).toBeInTheDocument();
    expect(screen.getByText('0:05')).toBeInTheDocument();
    expect(screen.getByText('0:10')).toBeInTheDocument();
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    
    // Mock the query to return different results based on search
    const mockUseQuery = vi.fn();
    (trpc.meetings.getTranscript.useQuery as any).mockImplementation(mockUseQuery);
    
    // Initial render without search
    mockUseQuery.mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    const searchInput = screen.getByPlaceholderText('Search transcript...');
    
    // Type in search box
    await user.type(searchInput, 'project');

    // Wait for debounced search
    await waitFor(() => {
      expect(mockUseQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'project',
        }),
        expect.any(Object)
      );
    }, { timeout: 500 });
  });

  it('filters by speaker correctly', async () => {
    const user = userEvent.setup();
    
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    // Click on "You" filter button
    const youButton = screen.getByRole('button', { name: /you/i });
    await user.click(youButton);

    // Should only show user messages
    expect(screen.getByText('Hello, how are you today?')).toBeInTheDocument();
    expect(screen.getByText('I need help with my project planning.')).toBeInTheDocument();
    expect(screen.queryByText('I am doing well, thank you for asking. How can I help you?')).not.toBeInTheDocument();
  });

  it('exports transcript correctly', async () => {
    const user = userEvent.setup();
    
    // Mock URL.createObjectURL and related functions
    const mockCreateObjectURL = vi.fn(() => 'mock-url');
    const mockRevokeObjectURL = vi.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock document.createElement and appendChild/removeChild
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    } as any;
    const mockCreateElement = vi.fn(() => mockAnchor);
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();
    
    document.createElement = mockCreateElement as any;
    document.body.appendChild = mockAppendChild as any;
    document.body.removeChild = mockRemoveChild as any;

    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    const exportButton = screen.getByRole('button', { name: /export/i });
    await user.click(exportButton);

    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAnchor.download).toBe('meeting-transcript-test-meeting-id.txt');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
    expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
  });

  it('displays search results count', () => {
    const searchData = {
      ...mockTranscriptData,
      entries: [mockTranscriptData.entries[2]], // Only the project-related entry
      searchTerm: 'project',
    };

    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: searchData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('1 result for "project"')).toBeInTheDocument();
  });

  it('displays total entries count', () => {
    (trpc.meetings.getTranscript.useQuery as any).mockReturnValue({
      data: mockTranscriptData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<TranscriptViewer meetingId="test-meeting-id" />);

    expect(screen.getByText('Total entries: 3')).toBeInTheDocument();
    expect(screen.getByText('Showing: 3 entries')).toBeInTheDocument();
  });
});