'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bot, Mic } from 'lucide-react';

interface AIAgentDisplayProps {
  agentName: string;
  agentAvatar?: string;
  isActive?: boolean;
  isSpeaking?: boolean;
}

export function AIAgentDisplay({
  agentName,
  agentAvatar,
  isActive = true,
  isSpeaking = false,
}: AIAgentDisplayProps) {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center">
        <div
          className={`relative mx-auto transition-all duration-300 ${
            isSpeaking ? 'scale-110' : 'scale-100'
          }`}
        >
          <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
            {agentAvatar ? (
              <AvatarImage src={agentAvatar} alt={agentName} />
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                <Bot className="h-16 w-16" />
              </AvatarFallback>
            )}
          </Avatar>

          {isSpeaking && (
            <div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500 shadow-lg">
              <Mic className="h-5 w-5 text-white" />
            </div>
          )}

          {isSpeaking && (
            <>
              <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20" />
              <div className="absolute inset-0 animate-pulse rounded-full bg-green-400 opacity-30" />
            </>
          )}
        </div>

        <div className="mt-6 space-y-2">
          <h2 className="text-2xl font-bold text-white">{agentName}</h2>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={`${
              isActive
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {isActive ? 'Active' : 'Connecting...'}
          </Badge>
        </div>

        {isSpeaking && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-white [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
