import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MeetingSummary } from '../meeting-summary';

describe('MeetingSummary', () => {
  const mockMeeting = {
    name: 'Test Meeting',
    startedAt: '2024-01-01T10:00:00Z',
    endedAt: '2024-01-01T10:30:00Z',
    durationSeconds: 1800, // 30 minutes
    agent: {
      name: 'Test Agent',
    },
  };

  it('renders structured JSON summary correctly', () => {
    const structuredSummary = JSON.stringify({
      keyTopics: ['Topic 1', 'Topic 2'],
      insights: ['Insight 1', 'Insight 2'],
      actionItems: ['Action 1', 'Action 2'],
      outcome: 'Meeting was successful',
      fullSummary: 'This is the full summary text',
    });

    render(<MeetingSummary summary={structuredSummary} meeting={mockMeeting} />);

    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    expect(screen.getByText('Meeting was successful')).toBeInTheDocument();
    expect(screen.getByText('Key Topics Discussed')).toBeInTheDocument();
    expect(screen.getByText('Topic 1')).toBeInTheDocument();
    expect(screen.getByText('Topic 2')).toBeInTheDocument();
    expect(screen.getByText('Key Insights & Advice')).toBeInTheDocument();
    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Action Items & Next Steps')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
  });

  it('renders plain text summary correctly', () => {
    const plainSummary = 'This is a plain text summary without structure.';

    render(<MeetingSummary summary={plainSummary} meeting={mockMeeting} />);

    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
    expect(screen.getByText('Complete Summary')).toBeInTheDocument();
    expect(screen.getByText(plainSummary)).toBeInTheDocument();
  });

  it('displays meeting metadata correctly', () => {
    const summary = 'Test summary';

    render(<MeetingSummary summary={summary} meeting={mockMeeting} />);

    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('30m 0s')).toBeInTheDocument();
    expect(screen.getByText('Test Agent')).toBeInTheDocument();
  });

  it('handles missing meeting data gracefully', () => {
    const meetingWithMissingData = {
      name: 'Test Meeting',
      startedAt: null,
      endedAt: null,
      durationSeconds: null,
      agent: null,
    };

    const summary = 'Test summary';

    render(<MeetingSummary summary={summary} meeting={meetingWithMissingData} />);

    expect(screen.getAllByText('N/A')).toHaveLength(2); // For date and duration
    expect(screen.getByText('Unknown')).toBeInTheDocument(); // For agent
  });

  it('parses text summary with sections correctly', () => {
    const textSummary = `
Key Topics:
- Topic 1
- Topic 2

Insights:
- Insight 1
- Insight 2

Action Items:
- Action 1
- Action 2

Outcome:
Meeting completed successfully
    `;

    render(<MeetingSummary summary={textSummary} meeting={mockMeeting} />);

    expect(screen.getByText('Key Topics Discussed')).toBeInTheDocument();
    expect(screen.getByText('Topic 1')).toBeInTheDocument();
    expect(screen.getByText('Key Insights & Advice')).toBeInTheDocument();
    expect(screen.getByText('Insight 1')).toBeInTheDocument();
    expect(screen.getByText('Action Items & Next Steps')).toBeInTheDocument();
    expect(screen.getByText('Action 1')).toBeInTheDocument();
  });

  it('shows default outcome when none provided', () => {
    const summary = 'Simple summary without outcome';

    render(<MeetingSummary summary={summary} meeting={mockMeeting} />);

    expect(screen.getByText('Meeting completed successfully')).toBeInTheDocument();
  });

  it('does not render empty sections', () => {
    const summaryWithoutSections = 'Just a plain summary';

    render(<MeetingSummary summary={summaryWithoutSections} meeting={mockMeeting} />);

    expect(screen.queryByText('Key Topics Discussed')).not.toBeInTheDocument();
    expect(screen.queryByText('Key Insights & Advice')).not.toBeInTheDocument();
    expect(screen.queryByText('Action Items & Next Steps')).not.toBeInTheDocument();
  });
});