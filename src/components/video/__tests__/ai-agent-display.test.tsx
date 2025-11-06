import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIAgentDisplay } from '../ai-agent-display';

describe('AIAgentDisplay', () => {
  it('renders agent name', () => {
    render(<AIAgentDisplay agentName="Test Agent" />);

    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('shows active badge when agent is active', () => {
    render(<AIAgentDisplay agentName="Test Agent" isActive={true} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows connecting badge when agent is not active', () => {
    render(<AIAgentDisplay agentName="Test Agent" isActive={false} />);

    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('displays speaking indicator when agent is speaking', () => {
    render(<AIAgentDisplay agentName="Test Agent" isSpeaking={true} />);

    // Check for animated dots (speaking indicator)
    const dots = screen.getAllByRole('generic').filter((el) =>
      el.className.includes('animate-bounce')
    );
    expect(dots.length).toBeGreaterThan(0);
  });

  it('does not display speaking indicator when agent is not speaking', () => {
    render(<AIAgentDisplay agentName="Test Agent" isSpeaking={false} />);

    const dots = screen.queryAllByRole('generic').filter((el) =>
      el.className.includes('animate-bounce')
    );
    expect(dots.length).toBe(0);
  });

  it('renders avatar with custom image when provided', () => {
    render(
      <AIAgentDisplay
        agentName="Test Agent"
        agentAvatar="https://example.com/avatar.png"
      />
    );

    const avatar = screen.getByAltText('Test Agent');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.png');
  });

  it('renders bot icon fallback when no avatar provided', () => {
    const { container } = render(<AIAgentDisplay agentName="Test Agent" />);

    // Bot icon should be present in the fallback
    const botIcon = container.querySelector('svg');
    expect(botIcon).toBeInTheDocument();
  });
});
