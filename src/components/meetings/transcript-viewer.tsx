'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  MessageSquare, 
  User, 
  Bot,
  Clock,
  Loader2,
  AlertCircle,
  Download,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

interface TranscriptViewerProps {
  meetingId: string;
}

interface TranscriptEntry {
  timestamp: number;
  speaker: 'user' | 'agent';
  text: string;
}

/**
 * Format timestamp to readable time
 */
function formatTimestamp(timestamp: number): string {
  const minutes = Math.floor(timestamp / 60000);
  const seconds = Math.floor((timestamp % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Highlight search terms in text
 */
function highlightText(text: string, searchTerm: string): React.ReactNode {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export function TranscriptViewer({ meetingId }: TranscriptViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [selectedSpeaker, setSelectedSpeaker] = React.useState<'all' | 'user' | 'agent'>('all');

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { 
    data: transcriptData, 
    isLoading, 
    error,
    refetch 
  } = trpc.meetings.getTranscript.useQuery(
    { 
      meetingId,
      search: debouncedSearchTerm || undefined,
    },
    {
      enabled: !!meetingId,
    }
  );

  // Filter entries by speaker
  const filteredEntries = React.useMemo(() => {
    if (!transcriptData?.entries) return [];
    
    if (selectedSpeaker === 'all') {
      return transcriptData.entries;
    }
    
    return transcriptData.entries.filter(entry => entry.speaker === selectedSpeaker);
  }, [transcriptData?.entries, selectedSpeaker]);

  const handleExportTranscript = () => {
    if (!transcriptData?.entries) return;

    const transcriptText = transcriptData.entries
      .map(entry => `[${formatTimestamp(entry.timestamp)}] ${entry.speaker === 'user' ? 'You' : 'AI Agent'}: ${entry.text}`)
      .join('\n');

    const blob = new Blob([transcriptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${meetingId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading transcript...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div className="text-center">
            <p className="text-sm font-medium">Failed to load transcript</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!transcriptData?.entries || transcriptData.entries.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-sm font-medium">No transcript available</p>
            <p className="text-sm text-muted-foreground">
              The transcript will be available after the meeting ends and processing is complete.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Meeting Transcript
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transcript..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Button
                  variant={selectedSpeaker === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpeaker('all')}
                >
                  All
                </Button>
                <Button
                  variant={selectedSpeaker === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpeaker('user')}
                >
                  <User className="h-3 w-3 mr-1" />
                  You
                </Button>
                <Button
                  variant={selectedSpeaker === 'agent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpeaker('agent')}
                >
                  <Bot className="h-3 w-3 mr-1" />
                  AI
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTranscript}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Search Results Info */}
          {debouncedSearchTerm && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>
                {filteredEntries.length} result{filteredEntries.length !== 1 ? 's' : ''} 
                {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcript Entries */}
      <Card>
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No results found for your search.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredEntries.map((entry, index) => (
                  <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
                        {entry.speaker === 'user' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <Badge variant="secondary" className="text-xs">AI Agent</Badge>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {highlightText(entry.text, debouncedSearchTerm)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcript Stats */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Total entries: {transcriptData.totalEntries}
            </span>
            <span>
              Showing: {filteredEntries.length} entries
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}