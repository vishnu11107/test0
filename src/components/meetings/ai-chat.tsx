'use client';

import * as React from 'react';
import { trpc } from '@/lib/trpc/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';

interface AIChatProps {
  meetingId: string;
  agentName?: string;
  agentAvatarSeed?: string;
}

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
}

export function AIChat({ meetingId, agentName, agentAvatarSeed }: AIChatProps) {
  const [question, setQuestion] = React.useState('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const askQuestionMutation = trpc.meetings.askQuestion.useMutation({
    onSuccess: (data) => {
      const newMessage: ChatMessage = {
        id: `${Date.now()}`,
        question: data.question,
        answer: data.answer,
        timestamp: data.timestamp,
      };

      setMessages((prev) => [...prev, newMessage]);
      setQuestion('');
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error asking question:', error);
      setIsLoading(false);
    },
  });

  // Scroll to bottom when new messages are added
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || isLoading) return;

    setIsLoading(true);
    askQuestionMutation.mutate({
      meetingId,
      question: question.trim(),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const agentAvatarUrl = agentAvatarSeed
    ? `https://api.dicebear.com/7.x/bottts/svg?seed=${agentAvatarSeed}`
    : undefined;

  const suggestedQuestions = [
    'What were the main takeaways from this meeting?',
    'What action items were discussed?',
    'Can you summarize the key advice given?',
    'What topics did we spend the most time on?',
    'Were there any important deadlines mentioned?',
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Ask About This Meeting
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions about your meeting and get AI-powered answers based on
          the transcript.
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Sparkles className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Start a conversation</p>
                <p className="text-sm text-muted-foreground">
                  Ask questions about your meeting to get insights and
                  clarifications.
                </p>
              </div>

              {/* Suggested Questions */}
              <div className="w-full max-w-md space-y-2">
                <p className="text-center text-xs text-muted-foreground">
                  Suggested questions:
                </p>
                {suggestedQuestions.slice(0, 3).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-auto w-full justify-start p-2 text-left text-xs"
                    onClick={() => setQuestion(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-4">
                  {/* User Question */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                        <p className="text-sm">{message.question}</p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>

                  {/* AI Answer */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage
                        src={agentAvatarUrl}
                        alt={agentName || 'AI Agent'}
                      />
                      <AvatarFallback>
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-lg bg-muted p-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.answer}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {agentName || 'AI Agent'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Message */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={agentAvatarUrl}
                      alt={agentName || 'AI Agent'}
                    />
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about this meeting..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!question.trim() || isLoading}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>

          {askQuestionMutation.error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to get answer. Please try again.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
