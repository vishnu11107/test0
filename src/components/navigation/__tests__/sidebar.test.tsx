import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../sidebar';

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
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation items correctly', () => {
    render(<Sidebar />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Agents')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('displays Meet AI brand', () => {
    render(<Sidebar />);

    expect(screen.getByText('Meet AI')).toBeInTheDocument();
  });

  it('shows user profile information', () => {
    render(<Sidebar />);

    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('TU')).toBeInTheDocument(); // Initials
  });

  it('highlights active navigation item', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-accent');
  });

  it('shows mobile menu button', () => {
    render(<Sidebar />);

    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<Sidebar />);

    const menuButton = screen.getByRole('button');
    
    // Get the sidebar container (the div with transform classes)
    const sidebarContainer = document.querySelector('.fixed.left-0.top-0');
    expect(sidebarContainer).toHaveClass('-translate-x-full');

    // Click to open
    fireEvent.click(menuButton);
    expect(sidebarContainer).toHaveClass('translate-x-0');

    // Click to close
    fireEvent.click(menuButton);
    expect(sidebarContainer).toHaveClass('-translate-x-full');
  });

  it('closes mobile menu when navigation link is clicked', () => {
    render(<Sidebar />);

    const menuButton = screen.getByRole('button');
    const agentsLink = screen.getByRole('link', { name: /ai agents/i });
    
    // Open mobile menu
    fireEvent.click(menuButton);
    const sidebarContainer = document.querySelector('.fixed.left-0.top-0');
    expect(sidebarContainer).toHaveClass('translate-x-0');

    // Click navigation link
    fireEvent.click(agentsLink);
    expect(sidebarContainer).toHaveClass('-translate-x-full');
  });

  it('closes mobile menu when overlay is clicked', () => {
    render(<Sidebar />);

    const menuButton = screen.getByRole('button');
    
    // Open mobile menu
    fireEvent.click(menuButton);
    const sidebarContainer = document.querySelector('.fixed.left-0.top-0');
    expect(sidebarContainer).toHaveClass('translate-x-0');

    // Click overlay
    const overlay = document.querySelector('.fixed.inset-0.bg-black\\/50');
    if (overlay) {
      fireEvent.click(overlay);
      expect(sidebarContainer).toHaveClass('-translate-x-full');
    }
  });
});