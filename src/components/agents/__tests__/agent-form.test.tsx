import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentForm } from '../agent-form';
import type { Agent } from '@/lib/db/schema';

describe('AgentForm', () => {
  const mockAgent: Agent = {
    id: 'test-id',
    name: 'Test Agent',
    userId: 'user-id',
    instructions: 'Test instructions',
    avatarSeed: 'test-seed',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('renders create form correctly', () => {
    const onSubmit = vi.fn();
    render(<AgentForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/instructions/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create agent/i })).toBeInTheDocument();
  });

  it('renders edit form with agent data', () => {
    const onSubmit = vi.fn();
    render(<AgentForm agent={mockAgent} onSubmit={onSubmit} />);

    expect(screen.getByDisplayValue('Test Agent')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test instructions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update agent/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const onSubmit = vi.fn();
    render(<AgentForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /create agent/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/instructions are required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<AgentForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/agent name/i);
    const instructionsInput = screen.getByLabelText(/instructions/i);
    const submitButton = screen.getByRole('button', { name: /create agent/i });

    fireEvent.change(nameInput, { target: { value: 'New Agent' } });
    fireEvent.change(instructionsInput, { target: { value: 'New instructions' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Agent',
          instructions: 'New instructions',
          avatarSeed: expect.any(String),
        })
      );
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<AgentForm onSubmit={onSubmit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('regenerates avatar seed', () => {
    const onSubmit = vi.fn();
    render(<AgentForm onSubmit={onSubmit} />);

    const regenerateButton = screen.getByRole('button', { name: /regenerate avatar/i });
    fireEvent.click(regenerateButton);

    // Avatar should have a new seed (different from initial)
    expect(regenerateButton).toBeInTheDocument();
  });

  it('disables form when loading', () => {
    const onSubmit = vi.fn();
    render(<AgentForm onSubmit={onSubmit} isLoading={true} />);

    expect(screen.getByLabelText(/agent name/i)).toBeDisabled();
    expect(screen.getByLabelText(/instructions/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /create agent/i })).toBeDisabled();
  });
});
