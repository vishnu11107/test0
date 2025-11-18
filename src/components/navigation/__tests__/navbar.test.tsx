import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../navbar';

// Mock GlobalSearch component to avoid tRPC dependency
vi.mock('../global-search', () => ({
  GlobalSearch: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="global-search" data-open={open}>
      <button onClick={() => onOpenChange(false)}>Close Search</button>
    </div>
  ),
}));

// Mock the auth client
vi.mock('@/lib/auth/client', () => ({
  useSession: () => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
      },
    },
  }),
  signOut: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search input with keyboard shortcut hint', () => {
    render(<Navbar />);

    const searchInput = screen.getByPlaceholderText(/search agents, meetings/i);
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('K')).toBeInTheDocument(); // Keyboard shortcut
  });

  it('shows notifications button with badge', () => {
    render(<Navbar />);

    const notificationButton = screen.getByLabelText(/notifications/i);
    expect(notificationButton).toBeInTheDocument();
    
    // Check for notification badge
    const badge = document.querySelector('.bg-red-500');
    expect(badge).toBeInTheDocument();
  });

  it('displays user information in menu', () => {
    render(<Navbar />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('TU')).toBeInTheDocument(); // Initials in avatar
  });

  it('opens search dialog when search input is clicked', () => {
    render(<Navbar />);

    const searchInput = screen.getByPlaceholderText(/search agents, meetings/i);
    fireEvent.click(searchInput);

    const searchDialog = screen.getByTestId('global-search');
    expect(searchDialog).toHaveAttribute('data-open', 'true');
  });

  it('opens search dialog with Cmd+K keyboard shortcut', () => {
    render(<Navbar />);

    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    const searchDialog = screen.getByTestId('global-search');
    expect(searchDialog).toHaveAttribute('data-open', 'true');
  });

  it('toggles user menu when avatar is clicked', () => {
    render(<Navbar />);

    const userButton = screen.getByRole('button', { name: /test user/i });
    
    // Menu should not be visible initially
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();

    // Click to open menu
    fireEvent.click(userButton);
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });
});