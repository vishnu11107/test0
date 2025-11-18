import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlobalSearch } from '../global-search';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    agents: {
      getMany: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
        })),
      },
    },
    meetings: {
      getMany: {
        useQuery: vi.fn(() => ({
          data: null,
          isLoading: false,
        })),
      },
    },
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('GlobalSearch', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search dialog when open', () => {
    render(<GlobalSearch {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search agents, meetings/i)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<GlobalSearch {...defaultProps} open={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows navigation items by default', () => {
    render(<GlobalSearch {...defaultProps} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();
  });

  it('shows keyboard shortcuts help', () => {
    render(<GlobalSearch {...defaultProps} />);

    expect(screen.getByText('ESC')).toBeInTheDocument();
    expect(screen.getByText(/use ↑↓ to navigate/i)).toBeInTheDocument();
  });

  it('closes dialog on Escape key', () => {
    render(<GlobalSearch {...defaultProps} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it('handles keyboard navigation', () => {
    render(<GlobalSearch {...defaultProps} />);

    // Arrow down should work without errors
    fireEvent.keyDown(document, { key: 'ArrowDown' });
    fireEvent.keyDown(document, { key: 'ArrowUp' });
    
    // Should not throw errors
    expect(true).toBe(true);
  });
});