'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Lightbulb, 
  CheckSquare, 
  Target,
  Clock,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface MeetingSummaryProps {
  summary: string;
  meeting: {
    name: string;
    startedAt: string | null;
    endedAt: string | null;
    durationSeconds: number | null;
    agent: {
      name: string;
    } | null;
  };
}

interface ParsedSummary {
  keyTopics: string[];
  insights: string[];
  actionItems: string[];
  outcome: string;
  fullSummary: string;
}

/**
 * Parse summary text to extract structured information
 * Handles both structured JSON and plain text summaries
 */
function parseSummary(summary: string): ParsedSummary {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(summary);
    if (parsed.keyTopics && parsed.insights && parsed.actionItems) {
      return parsed;
    }
  } catch {
    // Not JSON, continue with text parsing
  }

  // Parse plain text summary for structured elements
  const keyTopics: string[] = [];
  const insights: string[] = [];
  const actionItems: string[] = [];
  let outcome = '';

  const lines = summary.split('\n').filter(line => line.trim());
  
  let currentSection = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Detect section headers
    if (trimmed.toLowerCase().includes('key topics') || 
        trimmed.toLowerCase().includes('topics discussed')) {
      currentSection = 'topics';
      continue;
    } else if (trimmed.toLowerCase().includes('insights') || 
               trimmed.toLowerCase().includes('advice')) {
      currentSection = 'insights';
      continue;
    } else if (trimmed.toLowerCase().includes('action items') || 
               trimmed.toLowerCase().includes('next steps')) {
      currentSection = 'actions';
      continue;
    } else if (trimmed.toLowerCase().includes('outcome') || 
               trimmed.toLowerCase().includes('conclusion')) {
      currentSection = 'outcome';
      continue;
    }
    
    // Extract items based on current section
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || /^\d+\./.test(trimmed)) {
      const item = trimmed.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '');
      
      switch (currentSection) {
        case 'topics':
          keyTopics.push(item);
          break;
        case 'insights':
          insights.push(item);
          break;
        case 'actions':
          actionItems.push(item);
          break;
      }
    } else if (currentSection === 'outcome' && trimmed) {
      outcome = trimmed;
    }
  }

  return {
    keyTopics,
    insights,
    actionItems,
    outcome: outcome || 'Meeting completed successfully',
    fullSummary: summary,
  };
}

export function MeetingSummary({ summary, meeting }: MeetingSummaryProps) {
  const parsedSummary = React.useMemo(() => parseSummary(summary), [summary]);

  return (
    <div className="space-y-6">
      {/* Meeting Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Meeting Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Date:</span>
              <span>
                {meeting.startedAt 
                  ? format(new Date(meeting.startedAt), 'MMM d, yyyy')
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Duration:</span>
              <span>
                {meeting.durationSeconds 
                  ? `${Math.floor(meeting.durationSeconds / 60)}m ${meeting.durationSeconds % 60}s`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Agent:</span>
              <Badge variant="secondary">{meeting.agent?.name || 'Unknown'}</Badge>
            </div>
          </div>
          
          <div className="border-t my-4" />
          
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Meeting Outcome
            </h4>
            <p className="text-sm text-muted-foreground">
              {parsedSummary.outcome}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Topics */}
      {parsedSummary.keyTopics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Key Topics Discussed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parsedSummary.keyTopics.map((topic, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <p className="text-sm">{topic}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      {parsedSummary.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Key Insights & Advice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsedSummary.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {parsedSummary.actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckSquare className="h-5 w-5" />
              Action Items & Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {parsedSummary.actionItems.map((action, index) => (
                <div key={index} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                  <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Complete Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {parsedSummary.fullSummary}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}