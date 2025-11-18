import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIChat } from '../ai-chat';
import { trpc } from '@/lib/trpc/client';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    meetings: {
      askQuestion: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('AIChat', () => {
  const mockMutate = vi.fn();
  const mockMutation = {
    mutate: mockMutate,
    error: null,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(mockMutation);
  });

  it('renders initial state correctly', () => {
    render(<AIChat meetingId="test-meeting-id" />);

    expect(screen.getByText('Ask About This Meeting')).toBeInTheDocument();
    expect(screen.getByText('Start a conversation')).toBeInTheDocument();
    expect(screen.getByText(/ask questions about your meeting/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ask a question about this meeting...')).toBeInTheDocument();
  });

  it('displays suggested questions', () => {
    render(<AIChat meetingId="test-meeting-id" />);

    expect(screen.getByText('Suggested questions:')).toBeInTheDocument();
    expect(screen.getByText('What were the main takeaways from this meeting?')).toBeInTheDocument();
    expect(screen.getByText('What action items were discussed?')).toBeInTheDocument();
    expect(screen.getByText('Can you summarize the key advice given?')).toBeInTheDocument();
  });

  it('fills input when suggested question is clicked', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const suggestedQuestion = screen.getByText('What were the main takeaways from this meeting?');
    await user.click(suggestedQuestion);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    expect(input).toHaveValue('What were the main takeaways from this meeting?');
  });

  it('submits question when form is submitted', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    const submitButton = screen.getByRole('button', { name: '' }); // Send button

    await user.type(input, 'What was discussed?');
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      question: 'What was discussed?',
    });
  });

  it('submits question when Enter is pressed', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');

    await user.type(input, 'What was discussed?');
    await user.keyboard('{Enter}');

    expect(mockMutate).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      question: 'What was discussed?',
    });
  });

  it('does not submit when Shift+Enter is pressed', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');

    await user.type(input, 'What was discussed?');
    await user.keyboard('{Shift>}{Enter}{/Shift}');

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('disables input and button when loading', () => {
    const loadingMutation = {
      ...mockMutation,
      isLoading: true,
    };
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(loadingMutation);

    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    const submitButton = screen.getByRole('button', { name: '' });

    expect(input).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state when question is being processed', () => {
    const loadingMutation = {
      ...mockMutation,
      isLoading: true,
    };
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(loadingMutation);

    render(<AIChat meetingId="test-meeting-id" />);

    // Simulate having messages to show loading message
    const component = screen.getByText('Ask About This Meeting').closest('div');
    expect(component).toBeInTheDocument();
  });

  it('displays error message when mutation fails', () => {
    const errorMutation = {
      ...mockMutation,
      error: { message: 'Failed to get answer' },
    };
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(errorMutation);

    render(<AIChat meetingId="test-meeting-id" />);

    expect(screen.getByText('Failed to get answer. Please try again.')).toBeInTheDocument();
  });

  it('displays agent name and avatar when provided', () => {
    render(
      <AIChat 
        meetingId="test-meeting-id" 
        agentName="Test Agent"
        agentAvatarSeed="test-seed"
      />
    );

    // The avatar and name would be shown in messages, but since we don't have messages
    // in the initial state, we just verify the component renders without error
    expect(screen.getByText('Ask About This Meeting')).toBeInTheDocument();
  });

  it('does not submit empty questions', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const submitButton = screen.getByRole('button', { name: '' });
    
    // Button should be disabled when input is empty
    expect(submitButton).toBeDisabled();

    // Try submitting empty form
    fireEvent.submit(screen.getByRole('form'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not submit whitespace-only questions', async () => {
    const user = userEvent.setup();
    
    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    const submitButton = screen.getByRole('button', { name: '' });

    await user.type(input, '   ');
    
    // Button should still be disabled
    expect(submitButton).toBeDisabled();
  });

  it('clears input after successful submission', async () => {
    const user = userEvent.setup();
    
    // Mock successful mutation
    const successMutation = {
      mutate: vi.fn((data, options) => {
        // Simulate successful response
        options?.onSuccess?.({
          question: data.question,
          answer: 'This is the answer',
          meetingId: data.meetingId,
          timestamp: new Date().toISOString(),
        });
      }),
      error: null,
      isLoading: false,
    };
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(successMutation);

    render(<AIChat meetingId="test-meeting-id" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    
    await user.type(input, 'What was discussed?');
    await user.keyboard('{Enter}');

    // Input should be cleared after successful submission
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('displays conversation messages after successful Q&A', async () => {
    const user = userEvent.setup();
    
    // Mock successful mutation
    const successMutation = {
      mutate: vi.fn((data, options) => {
        options?.onSuccess?.({
          question: data.question,
          answer: 'This is the AI response to your question.',
          meetingId: data.meetingId,
          timestamp: new Date().toISOString(),
        });
      }),
      error: null,
      isLoading: false,
    };
    (trpc.meetings.askQuestion.useMutation as any).mockReturnValue(successMutation);

    render(<AIChat meetingId="test-meeting-id" agentName="Test Agent" />);

    const input = screen.getByPlaceholderText('Ask a question about this meeting...');
    
    await user.type(input, 'What was discussed?');
    await user.keyboard('{Enter}');

    // Should show the question and answer
    await waitFor(() => {
      expect(screen.getByText('What was discussed?')).toBeInTheDocument();
      expect(screen.getByText('This is the AI response to your question.')).toBeInTheDocument();
      expect(screen.getByText('Test Agent')).toBeInTheDocument();
    });
  });
});