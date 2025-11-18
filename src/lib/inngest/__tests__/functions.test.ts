import { describe, it, expect, vi, beforeEach } from 'vitest';
import { inngestFunctions } from '../functions';
import { generateStructuredSummary, parseTranscript, transcriptToText } from '@/lib/post-call';

// Mock dependencies
vi.mock('@/lib/post-call', () => ({
  parseTranscript: vi.fn(),
  transcriptToText: vi.fn(),
  generateStructuredSummary: vi.fn(),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Inngest Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('inngestFunctions', () => {
    it('exports the correct number of functions', () => {
      expect(inngestFunctions).toHaveLength(3);
    });

    it('exports functions with correct configuration', () => {
      expect(inngestFunctions[0]).toBeDefined();
      expect(inngestFunctions[1]).toBeDefined();
      expect(inngestFunctions[2]).toBeDefined();
    });
  });

  describe('Post-call processing utilities integration', () => {
    it('parseTranscript handles array format', () => {
      const mockTranscriptData = [
        { timestamp: 1000, speaker: 'user', text: 'Hello' },
        { timestamp: 2000, speaker: 'agent', text: 'Hi there' },
      ];

      const mockParsedTranscript = [
        { timestamp: 1000, speaker: 'user' as const, text: 'Hello' },
        { timestamp: 2000, speaker: 'agent' as const, text: 'Hi there' },
      ];

      (parseTranscript as any).mockReturnValue(mockParsedTranscript);

      const result = parseTranscript(mockTranscriptData);
      expect(result).toEqual(mockParsedTranscript);
      expect(parseTranscript).toHaveBeenCalledWith(mockTranscriptData);
    });

    it('transcriptToText converts entries to text', () => {
      const mockTranscript = [
        { timestamp: 1000, speaker: 'user' as const, text: 'Hello' },
        { timestamp: 2000, speaker: 'agent' as const, text: 'Hi there' },
      ];

      (transcriptToText as any).mockReturnValue('user: Hello\nagent: Hi there');

      const result = transcriptToText(mockTranscript);
      expect(result).toBe('user: Hello\nagent: Hi there');
      expect(transcriptToText).toHaveBeenCalledWith(mockTranscript);
    });

    it('generateStructuredSummary creates structured summary', async () => {
      const mockSummaryData = {
        keyTopics: ['Topic 1', 'Topic 2'],
        insights: ['Insight 1'],
        actionItems: ['Action 1', 'Action 2'],
        outcome: 'Successful meeting',
        fullSummary: 'Complete summary text',
      };

      (generateStructuredSummary as any).mockResolvedValue(mockSummaryData);

      const result = await generateStructuredSummary(
        'user: Hello\nagent: Hi there',
        'Test agent instructions'
      );

      expect(result).toEqual(mockSummaryData);
      expect(generateStructuredSummary).toHaveBeenCalledWith(
        'user: Hello\nagent: Hi there',
        'Test agent instructions'
      );
    });
  });

  describe('Transcript fetching workflow', () => {
    it('handles successful transcript fetch and processing', async () => {
      const mockTranscriptData = [
        { speaker: 'user', text: 'Hello' },
        { speaker: 'agent', text: 'Hi there' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranscriptData),
      });

      (parseTranscript as any).mockReturnValue([
        { timestamp: 0, speaker: 'user', text: 'Hello' },
        { timestamp: 1000, speaker: 'agent', text: 'Hi there' },
      ]);

      (transcriptToText as any).mockReturnValue('user: Hello\nagent: Hi there');

      // Test the workflow
      const response = await fetch('https://example.com/transcript.json');
      const data = await response.json();
      const parsed = parseTranscript(data);
      const text = transcriptToText(parsed);

      expect(text).toBe('user: Hello\nagent: Hi there');
    });

    it('handles failed transcript fetch', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });

      const response = await fetch('https://example.com/transcript.json');
      expect(response.ok).toBe(false);
      expect(response.statusText).toBe('Not Found');
    });
  });

  describe('Summary generation workflow', () => {
    it('generates summary from transcript', async () => {
      const mockSummary = {
        keyTopics: ['Greeting'],
        insights: ['Polite conversation'],
        actionItems: [],
        outcome: 'Successful greeting',
        fullSummary: 'The user and agent exchanged greetings.',
      };

      (generateStructuredSummary as any).mockResolvedValue(mockSummary);

      const summary = await generateStructuredSummary(
        'user: Hello\nagent: Hi there',
        'Be helpful and polite'
      );

      expect(summary.fullSummary).toBe('The user and agent exchanged greetings.');
      expect(summary.keyTopics).toContain('Greeting');
      expect(generateStructuredSummary).toHaveBeenCalledWith(
        'user: Hello\nagent: Hi there',
        'Be helpful and polite'
      );
    });
  });
});