'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { OpenAIRealtimeClient, RealtimeConfig, RealtimeMessage } from './realtime';

export interface UseRealtimeOptions {
  apiKey: string;
  instructions?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  autoConnect?: boolean;
  onError?: (error: any) => void;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  isSpeaking: boolean;
  messages: RealtimeMessage[];
  connect: () => Promise<void>;
  disconnect: () => void;
  sendAudio: (audioData: ArrayBuffer) => void;
  sendText: (text: string) => void;
  updateInstructions: (instructions: string) => void;
  error: string | null;
}

export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  const clientRef = useRef<OpenAIRealtimeClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<RealtimeMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Play audio buffer
  const playAudioBuffer = useCallback(async (audioData: ArrayBuffer) => {
    if (!audioContextRef.current) return;

    try {
      // Convert PCM16 to AudioBuffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        audioData.byteLength / 2, // 16-bit samples
        24000 // sample rate
      );

      const channelData = audioBuffer.getChannelData(0);
      const view = new Int16Array(audioData);

      for (let i = 0; i < view.length; i++) {
        channelData[i] = view[i] / 32768; // Convert to float [-1, 1]
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        isPlayingRef.current = false;
        // Play next audio in queue
        if (audioQueueRef.current.length > 0) {
          const nextAudio = audioQueueRef.current.shift();
          if (nextAudio) {
            playAudioBuffer(nextAudio);
          }
        }
      };

      source.start();
      isPlayingRef.current = true;
    } catch (err) {
      console.error('Error playing audio:', err);
    }
  }, []);

  // Queue audio for playback
  const queueAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (isPlayingRef.current) {
        audioQueueRef.current.push(audioData);
      } else {
        playAudioBuffer(audioData);
      }
    },
    [playAudioBuffer]
  );

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (clientRef.current?.getConnectionStatus()) {
      console.warn('Already connected');
      return;
    }

    try {
      setError(null);

      const config: RealtimeConfig = {
        apiKey: options.apiKey,
        instructions: options.instructions,
        voice: options.voice,
      };

      const client = new OpenAIRealtimeClient(config);

      // Register event handlers
      client.on('connected', () => {
        setIsConnected(true);
        setError(null);
      });

      client.on('disconnected', () => {
        setIsConnected(false);
      });

      client.on('error', (data) => {
        const errorMessage = data.error?.message || 'Connection error';
        setError(errorMessage);
        if (options.onError) {
          options.onError(data.error);
        }
      });

      client.on('speaking_started', (data) => {
        setIsSpeaking(true);
      });

      client.on('speaking_stopped', (data) => {
        setIsSpeaking(false);
      });

      client.on('message', (message: RealtimeMessage) => {
        setMessages((prev) => [...prev, message]);
      });

      client.on('audio_buffer', (data) => {
        if (data.audioData) {
          queueAudio(data.audioData);
        }
      });

      clientRef.current = client;
      await client.connect();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect';
      setError(errorMessage);
      if (options.onError) {
        options.onError(err);
      }
    }
  }, [options, queueAudio]);

  // Disconnect from OpenAI Realtime API
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
    setIsConnected(false);
    setIsSpeaking(false);
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // Send audio data
  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (clientRef.current) {
      clientRef.current.sendAudio(audioData);
    }
  }, []);

  // Send text message
  const sendText = useCallback((text: string) => {
    if (clientRef.current) {
      clientRef.current.sendText(text);
      setMessages((prev) => [
        ...prev,
        {
          type: 'user',
          text,
          timestamp: Date.now(),
        },
      ]);
    }
  }, []);

  // Update agent instructions
  const updateInstructions = useCallback((instructions: string) => {
    if (clientRef.current) {
      clientRef.current.updateInstructions(instructions);
    }
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (options.autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.autoConnect]);

  return {
    isConnected,
    isSpeaking,
    messages,
    connect,
    disconnect,
    sendAudio,
    sendText,
    updateInstructions,
    error,
  };
}
