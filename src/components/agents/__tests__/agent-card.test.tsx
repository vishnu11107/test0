import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '../agent-card';
import type { Agent } from '@/lib/db/schema';

describe('AgentCard', () => {
  const mockAgent: Agent = {
    id: 'test-id',
    name: 'Test Agent',
    userId: 'user-id',
    instructions: 'This is a test agent with some instructions',
    avatarSeed: 'test-seed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders agent information correctly', () => {
    render(<AgentCard agent={mockAgent} />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
    expect(screen.getByText(/this is a test agent/i)).toBeInTheDocument();
    expect(screen.getByText('AI Agent')).toBeInTheDocument();
  });

  it('displays avatar fallback', () => {
    render(<AgentCard agent={mockAgent} />);

    // Avatar fallback should show first two letters
    expect(screen.getByText('TE')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<AgentCard agent={mockAgent} onEdit={onEdit} />);

    const editButton = screen.getByLabelText(/edit agent/i);
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockAgent);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(<AgentCard agent={mockAgent} onDelete={onDelete} />);

    const deleteButton = screen.getByLabelText(/delete agent/i);
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith(mockAgent);
  });

  it('calls onViewDetails when details button is clicked', () => {
    const onViewDetails = vi.fn();
    render(<AgentCard agent={mockAgent} onViewDetails={onViewDetails} />);

    const detailsButton = screen.getByRole('button', { name: /details/i });
    fireEvent.click(detailsButton);

    expect(onViewDetails).toHaveBeenCalledWith(mockAgent);
  });

  it('truncates long instructions', () => {
    const longAgent = {
      ...mockAgent,
      instructions: 'This is a very long instruction text that should be truncated when displayed in the card component to maintain a clean and consistent layout across all agent cards in the grid view.',
    };

    render(<AgentCard agent={longAgent} />);

    const instructionsElement = screen.getByText(/this is a very long instruction/i);
    expect(instructionsElement).toHaveClass('line-clamp-3');
  });
});
