import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardLayout } from '../dashboard-layout';

// Mock child components
vi.mock('../sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>,
}));

vi.mock('../navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>,
}));

describe('DashboardLayout', () => {
  it('renders sidebar, navbar, and children', () => {
    render(
      <DashboardLayout>
        <div data-testid="content">Test Content</div>
      </DashboardLayout>
    );

    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('navbar')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('applies correct layout structure', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    // Check for main layout container
    const layoutContainer = screen.getByTestId('sidebar').parentElement;
    expect(layoutContainer).toHaveClass('flex', 'h-screen', 'bg-background');

    // Check for main content area
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('flex-1', 'overflow-y-auto');
  });

  it('applies custom className to main content', () => {
    render(
      <DashboardLayout className="custom-class">
        <div>Content</div>
      </DashboardLayout>
    );

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('custom-class');
  });

  it('has correct responsive layout classes', () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const contentArea = screen.getByTestId('navbar').parentElement;
    expect(contentArea).toHaveClass('md:ml-0'); // No margin on desktop since sidebar is relative

    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveClass('p-4', 'md:p-6'); // Responsive padding
  });
});