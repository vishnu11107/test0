'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Bot,
  Video,
  Calendar,
  Settings,
  User,
  ArrowRight,
  Command,
  Loader2,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  id: string;
  type: 'agent' | 'meeting' | 'navigation';
  title: string;
  subtitle?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  avatarSeed?: string;
}

const navigationItems: SearchResult[] = [
  {
    id: 'nav-dashboard',
    type: 'navigation',
    title: 'Dashboard',
    subtitle: 'Overview and quick actions',
    href: '/dashboard',
    icon: Calendar,
  },
  {
    id: 'nav-agents',
    type: 'navigation',
    title: 'AI Agents',
    subtitle: 'Manage your AI agents',
    href: '/dashboard/agents',
    icon: Bot,
  },
  {
    id: 'nav-meetings',
    type: 'navigation',
    title: 'Meetings',
    subtitle: 'View and manage meetings',
    href: '/dashboard/meetings',
    icon: Video,
  },
  {
    id: 'nav-settings',
    type: 'navigation',
    title: 'Settings',
    subtitle: 'Account and preferences',
    href: '/dashboard',
    icon: Settings,
  },
  {
    id: 'nav-profile',
    type: 'navigation',
    title: 'Profile',
    subtitle: 'Manage your profile',
    href: '/dashboard',
    icon: User,
  },
];

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Fetch agents and meetings for search
  const { data: agents, isLoading: agentsLoading } = trpc.agents.getMany.useQuery(
    { limit: 10, search: query },
    { enabled: open && query.length > 0 }
  );

  const { data: meetings, isLoading: meetingsLoading } = trpc.meetings.getMany.useQuery(
    { limit: 10, search: query },
    { enabled: open && query.length > 0 }
  );

  // Combine and filter results
  const searchResults = useMemo(() => {
    const results: SearchResult[] = [];

    // Add navigation items if query matches
    if (query.length > 0) {
      const filteredNav = navigationItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle?.toLowerCase().includes(query.toLowerCase())
      );
      results.push(...filteredNav);
    } else {
      // Show all navigation items when no query
      results.push(...navigationItems);
    }

    // Add agents
    if (agents?.data) {
      const agentResults: SearchResult[] = agents.data.map((agent) => ({
        id: `agent-${agent.id}`,
        type: 'agent' as const,
        title: agent.name,
        subtitle: agent.instructions.slice(0, 60) + '...',
        href: `/dashboard/agents/${agent.id}`,
        icon: Bot,
        badge: 'Agent',
        avatarSeed: agent.avatarSeed,
      }));
      results.push(...agentResults);
    }

    // Add meetings
    if (meetings?.data) {
      const meetingResults: SearchResult[] = meetings.data.map((meeting) => ({
        id: `meeting-${meeting.id}`,
        type: 'meeting' as const,
        title: meeting.name,
        subtitle: meeting.agent
          ? `with ${meeting.agent.name} • ${format(new Date(meeting.createdAt), 'MMM d, yyyy')}`
          : format(new Date(meeting.createdAt), 'MMM d, yyyy'),
        href: `/dashboard/meetings/${meeting.id}`,
        icon: Video,
        badge: meeting.status,
      }));
      results.push(...meetingResults);
    }

    return results;
  }, [query, agents, meetings]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev < searchResults.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : searchResults.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (searchResults[selectedIndex]) {
            handleSelect(searchResults[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, searchResults, selectedIndex, onOpenChange]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  const handleSelect = (result: SearchResult) => {
    onOpenChange(false);
    router.push(result.href);
  };

  const isLoading = agentsLoading || meetingsLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search
          </DialogTitle>
        </DialogHeader>

        <div className="px-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents, meetings, or navigate..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-12"
              autoFocus
            />
            <div className="absolute right-3 top-3 flex items-center space-x-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ESC
              </kbd>
            </div>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && query.length > 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="space-y-1 p-2">
                {searchResults.map((result, index) => {
                  const Icon = result.icon;
                  const isSelected = index === selectedIndex;

                  return (
                    <Button
                      key={result.id}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-auto p-3 text-left',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => handleSelect(result)}
                    >
                      <div className="flex items-center space-x-3 w-full">
                        {result.avatarSeed ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${result.avatarSeed}`}
                              alt={result.title}
                            />
                            <AvatarFallback>
                              <Icon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium truncate">
                              {result.title}
                            </span>
                            {result.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {result.badge}
                              </Badge>
                            )}
                          </div>
                          {result.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {result.subtitle}
                            </p>
                          )}
                        </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Button>
                  );
                })}
              </div>
              {query.length === 0 && (
                <div className="py-4 px-6 text-sm text-muted-foreground border-t">
                  <div className="flex items-center space-x-2 mb-2">
                    <Command className="h-4 w-4" />
                    <span>Quick navigation</span>
                  </div>
                  <p>Use ↑↓ to navigate</p>
                </div>
              )}
            </>
          ) : query.length > 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            <div className="py-4 px-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 mb-2">
                <Command className="h-4 w-4" />
                <span>Quick navigation</span>
              </div>
              <p>Use ↑↓ to navigate</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}