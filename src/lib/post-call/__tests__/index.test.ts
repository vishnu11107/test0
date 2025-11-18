import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  parseTranscript,
  transcriptToText,
  generateStructuredSummary,
  answerMeetingQuestion,
  searchTranscript,
  getTranscriptByTimeRange,
} from '../index';
import { openai } from '@/lib/openai/client';

// Mock OpenAI
vi.mock('@/lib/openai', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  },
}));

describe('Post-call utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseTranscript', () => {
    it('parses array format transcript correctly', () => {
      const arrayTranscript = [
        { timestamp: 1000, speaker: 'user', text: 'Hello' },
        { timestamp: 2000, speaker: 'agent', text: 'Hi there' },
      ];

      const result = parseTranscript(arrayTranscript);

      expect(result).toEqual([
        { timestamp: 1000, speaker: 'user', text: 'Hello' },
        { timestamp: 2000, speaker: 'agent', text: 'Hi there' },
      ]);
    });

    it('parses string format transcript correctly', () => {
      const stringTranscript = 'user: Hello\nagent: Hi there\nuser: How are you?';

      const result = parseTranscript(stringTranscript);

      expect(result).toEqual([
        { timestamp: 0, speaker: 'user', text: 'Hello' },
        { timestamp: 1000, speaker: 'agent', text: 'Hi there' },
        { timestamp: 2000, speaker: 'user', text: 'How are you?' },
      ]);
    });

    it('handles object format with entries property', () => {
      const objectTranscript = {
        entries: [
          { timestamp: 1000, speaker: 'user', text: 'Hello' },
        ],
      };

      const result = parseTranscript(objectTranscript);

      expect(result).toEqual([
        { timestamp: 1000, speaker: 'user', text: 'Hello' },
      ]);
    });

    it('returns empty array for invalid input', () => {
      const result = parseTranscript(null);
      expect(result).toEqual([]);
    });

    it('defaults to user speaker for unspecified speakers', () => {
      const stringTranscript = 'Hello there\nHow are you?';

      const result = parseTranscript(stringTranscript);

      expect(result).toEqual([
        { timestamp: 0, speaker: 'user', text: 'Hello there' },
        { timestamp: 1000, speaker: 'user', text: 'How are you?' },
      ]);
    });

    it('handles missing timestamp in array format', () => {
      const arrayTranscript = [
        { speaker: 'user', text: 'Hello' },
        { speaker: 'agent', text: 'Hi there' },
      ];

      const result = parseTranscript(arrayTranscript);

      expect(result[0].timestamp).toBe(0);
      expect(result[1].timestamp).toBe(1000);
    });
  });

  describe('transcriptToText', () => {
    it('converts transcript entries to readable text', () => {
      const transcript = [
        { timestamp: 1000, speaker: 'user' as const, text: 'Hello' },
        { timestamp: 2000, speaker: 'agent' as const, text: 'Hi there' },
      ];

      const result = transcriptToText(transcript);

      expect(result).toBe('user: Hello\nagent: Hi there');
    });

    it('handles empty transcript', () => {
      const result = transcriptToText([]);
      expect(result).toBe('');
    });
  });

  describe('generateStructuredSummary', () => {
    it('generates structured summary successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              keyTopics: ['Topic 1', 'Topic 2'],
              insights: ['Insight 1'],
              actionItems: ['Action 1'],
              outcome: 'Successful meeting',
              fullSummary: 'Complete summary text',
            }),
          },
        }],
      };

      (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

      const result = await generateStructuredSummary(
        'user: Hello\nagent: Hi there',
        'Test agent instructions'
      );

      expect(result).toEqual({
        keyTopics: ['Topic 1', 'Topic 2'],
        insights: ['Insight 1'],
        actionItems: ['Action 1'],
        outcome: 'Successful meeting',
        fullSummary: 'Complete summary text',
      });

      expect(openai.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Test agent instructions'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('user: Hello\nagent: Hi there'),
          }),
        ]),
        max_tokens: 1500,
        temperature: 0.3,
      });
    });

    it('handles non-JSON response gracefully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is a plain text summary',
          },
        }],
      };

      (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

      const result = await generateStructuredSummary(
        'user: Hello\nagent: Hi there',
        'Test agent instructions'
      );

      expect(result).toEqual({
        keyTopics: [],
        insights: [],
        actionItems: [],
        outcome: 'Meeting completed successfully',
        fullSummary: 'This is a plain text summary',
      });
    });

    it('throws error when OpenAI call fails', async () => {
      (openai.chat.completions.create as any).mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(
        generateStructuredSummary('transcript', 'instructions')
      ).rejects.toThrow('Failed to generate meeting summary');
    });

    it('throws error when no content is received', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

      await expect(
        generateStructuredSummary('transcript', 'instructions')
      ).rejects.toThrow('Failed to generate meeting summary');
    });
  });

  describe('answerMeetingQuestion', () => {
    it('answers question successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'This is the answer to your question.',
          },
        }],
      };

      (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

      const result = await answerMeetingQuestion(
        'What was discussed?',
        'user: Hello\nagent: Hi there',
        'Test agent instructions'
      );

      expect(result).toBe('This is the answer to your question.');

      expect(openai.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.stringContaining('Test agent instructions'),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('What was discussed?'),
          }),
        ]),
        max_tokens: 500,
        temperature: 0.2,
      });
    });

    it('throws error when OpenAI call fails', async () => {
      (openai.chat.completions.create as any).mockRejectedValue(
        new Error('OpenAI API error')
      );

      await expect(
        answerMeetingQuestion('question', 'transcript', 'instructions')
      ).rejects.toThrow('Failed to answer question about meeting');
    });

    it('returns fallback message when no content received', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: null,
          },
        }],
      };

      (openai.chat.completions.create as any).mockResolvedValue(mockResponse);

      const result = await answerMeetingQuestion(
        'question',
        'transcript',
        'instructions'
      );

      expect(result).toBe('Unable to generate response');
    });
  });

  describe('searchTranscript', () => {
    const transcript = [
      { timestamp: 1000, speaker: 'user' as const, text: 'Hello world' },
      { timestamp: 2000, speaker: 'agent' as const, text: 'Hi there, how can I help?' },
      { timestamp: 3000, speaker: 'user' as const, text: 'I need help with my project' },
    ];

    it('searches transcript entries case-insensitively', () => {
      const result = searchTranscript(transcript, 'HELP');

      expect(result).toEqual([
        { timestamp: 2000, speaker: 'agent', text: 'Hi there, how can I help?' },
        { timestamp: 3000, speaker: 'user', text: 'I need help with my project' },
      ]);
    });

    it('returns empty array when no matches found', () => {
      const result = searchTranscript(transcript, 'nonexistent');
      expect(result).toEqual([]);
    });

    it('returns all entries for empty search query', () => {
      const result = searchTranscript(transcript, '');
      expect(result).toEqual(transcript);
    });
  });

  describe('getTranscriptByTimeRange', () => {
    const transcript = [
      { timestamp: 1000, speaker: 'user' as const, text: 'Hello' },
      { timestamp: 2000, speaker: 'agent' as const, text: 'Hi there' },
      { timestamp: 3000, speaker: 'user' as const, text: 'How are you?' },
      { timestamp: 4000, speaker: 'agent' as const, text: 'I am fine' },
    ];

    it('filters transcript by time range correctly', () => {
      const result = getTranscriptByTimeRange(transcript, 1500, 3500);

      expect(result).toEqual([
        { timestamp: 2000, speaker: 'agent', text: 'Hi there' },
        { timestamp: 3000, speaker: 'user', text: 'How are you?' },
      ]);
    });

    it('returns empty array when no entries in range', () => {
      const result = getTranscriptByTimeRange(transcript, 5000, 6000);
      expect(result).toEqual([]);
    });

    it('includes entries at exact boundaries', () => {
      const result = getTranscriptByTimeRange(transcript, 2000, 3000);

      expect(result).toEqual([
        { timestamp: 2000, speaker: 'agent', text: 'Hi there' },
        { timestamp: 3000, speaker: 'user', text: 'How are you?' },
      ]);
    });
  });
});