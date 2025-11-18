/**
 * Post-call processing utilities
 * 
 * Utilities for handling post-call intelligence features including
 * transcript processing, summary generation, and Q&A functionality.
 */

import { openai } from '@/lib/openai/client';

export interface TranscriptEntry {
  timestamp: number;
  speaker: 'user' | 'agent';
  text: string;
}

export interface MeetingSummary {
  keyTopics: string[];
  insights: string[];
  actionItems: string[];
  outcome: string;
  fullSummary: string;
}

/**
 * Parse transcript from various formats into a standardized format
 */
export function parseTranscript(transcriptData: any): TranscriptEntry[] {
  // Handle array format (Stream format)
  if (Array.isArray(transcriptData)) {
    return transcriptData.map((entry: any, index: number) => ({
      timestamp: entry.timestamp || index * 1000, // Default to index-based timing
      speaker: entry.speaker === 'user' ? 'user' : 'agent',
      text: entry.text || entry.content || '',
    }));
  }

  // Handle string format (plain text)
  if (typeof transcriptData === 'string') {
    const lines = transcriptData.split('\n').filter(line => line.trim());
    return lines.map((line, index) => {
      // Try to parse "Speaker: Text" format
      const match = line.match(/^(user|agent|User|Agent):\s*(.+)$/i);
      if (match) {
        return {
          timestamp: index * 1000,
          speaker: match[1].toLowerCase() === 'user' ? 'user' : 'agent',
          text: match[2],
        };
      }

      // Default to user if no speaker specified
      return {
        timestamp: index * 1000,
        speaker: 'user' as const,
        text: line,
      };
    });
  }

  // Handle object format
  if (typeof transcriptData === 'object' && transcriptData.entries) {
    return parseTranscript(transcriptData.entries);
  }

  // Fallback: empty transcript
  return [];
}

/**
 * Convert transcript entries to readable text
 */
export function transcriptToText(transcript: TranscriptEntry[]): string {
  return transcript
    .map(entry => `${entry.speaker}: ${entry.text}`)
    .join('\n');
}

/**
 * Generate structured meeting summary using OpenAI
 */
export async function generateStructuredSummary(
  transcript: string,
  agentInstructions: string
): Promise<MeetingSummary> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that creates structured meeting summaries. 
          
The meeting was with an AI agent that had these instructions: "${agentInstructions}"

Please analyze the transcript and provide a JSON response with the following structure:
{
  "keyTopics": ["topic1", "topic2", ...],
  "insights": ["insight1", "insight2", ...],
  "actionItems": ["action1", "action2", ...],
  "outcome": "brief description of the overall meeting outcome",
  "fullSummary": "comprehensive summary paragraph"
}

Focus on extracting actionable insights and concrete next steps.`,
        },
        {
          role: 'user',
          content: `Please analyze this meeting transcript:\n\n${transcript}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    try {
      const parsed = JSON.parse(content) as MeetingSummary;
      return parsed;
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      return {
        keyTopics: [],
        insights: [],
        actionItems: [],
        outcome: 'Meeting completed successfully',
        fullSummary: content,
      };
    }
  } catch (error) {
    console.error('Error generating structured summary:', error);
    throw new Error('Failed to generate meeting summary');
  }
}

/**
 * Answer questions about a meeting using the transcript context
 */
export async function answerMeetingQuestion(
  question: string,
  transcript: string,
  agentInstructions: string
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that answers questions about meeting transcripts.
          
The meeting was with an AI agent that had these instructions: "${agentInstructions}"

Use the provided transcript to answer questions accurately. If the information isn't in the transcript, say so clearly.
Be concise but comprehensive in your responses.`,
        },
        {
          role: 'user',
          content: `Meeting transcript:\n\n${transcript}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.2,
    });

    return completion.choices[0]?.message?.content || 'Unable to generate response';
  } catch (error) {
    console.error('Error answering meeting question:', error);
    throw new Error('Failed to answer question about meeting');
  }
}

/**
 * Search transcript for specific terms or phrases
 */
export function searchTranscript(
  transcript: TranscriptEntry[],
  query: string
): TranscriptEntry[] {
  const searchTerm = query.toLowerCase();
  return transcript.filter(entry =>
    entry.text.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get transcript entries within a time range
 */
export function getTranscriptByTimeRange(
  transcript: TranscriptEntry[],
  startTime: number,
  endTime: number
): TranscriptEntry[] {
  return transcript.filter(entry =>
    entry.timestamp >= startTime && entry.timestamp <= endTime
  );
}