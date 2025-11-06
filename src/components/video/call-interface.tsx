'use client';

import { useState, useEffect, useRef } from 'react';
import { CallControls } from './call-controls';
import { AIAgentDisplay } from './ai-agent-display';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useRealtime } from '@/lib/openai';

interface CallInterfaceProps {
  meetingId: string;
  userName: string | null | undefined;
  agentName: string;
  agentAvatar?: string;
  agentInstructions?: string;
  onCallEnd?: () => void;
}

export function CallInterface({
  meetingId,
  userName,
  agentName,
  agentAvatar,
  agentInstructions,
  onCallEnd,
}: CallInterfaceProps) {
  const router = useRouter();
  const displayName = userName || 'User';
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number>(Date.now());
  const audioProcessorRef = useRef<ScriptProcessorNode | null>(null);

  // OpenAI Realtime API integration
  const {
    isConnected: isAgentActive,
    isSpeaking: isAgentSpeaking,
    connect: connectAgent,
    disconnect: disconnectAgent,
    sendAudio,
    error: agentError,
  } = useRealtime({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
    instructions: agentInstructions || `You are ${agentName}, a helpful AI assistant.`,
    voice: 'alloy',
    autoConnect: false,
    onError: (error) => {
      console.error('AI Agent error:', error);
    },
  });

  useEffect(() => {
    let mounted = true;

    async function initializeCall() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 24000,
          },
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Connect AI agent
        await connectAgent();

        // Set up audio processing for AI agent
        if (window.AudioContext || (window as any).webkitAudioContext) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
            sampleRate: 24000,
          });
          const source = audioContext.createMediaStreamSource(mediaStream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e) => {
            if (isMicOn && isAgentActive) {
              const inputData = e.inputBuffer.getChannelData(0);

              // Convert float32 to int16 PCM
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
              }

              sendAudio(pcm16.buffer);
            }
          };

          source.connect(processor);
          processor.connect(audioContext.destination);
          audioProcessorRef.current = processor;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
      }
    }

    initializeCall();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioProcessorRef.current) {
        audioProcessorRef.current.disconnect();
      }
      disconnectAgent();
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Update call duration
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleCamera = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    }
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const handleEndCall = async () => {
    // Stop all media tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Call the onCallEnd callback if provided
    if (onCallEnd) {
      await onCallEnd();
    }

    // Redirect to meeting details page
    router.push(`/dashboard/meetings/${meetingId}`);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-white">Meeting with {agentName}</h1>
          <p className="text-sm text-gray-400">{formatDuration(callDuration)}</p>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex flex-1 gap-4 p-4">
        {/* AI Agent Display - Main View */}
        <Card className="flex-1 overflow-hidden">
          <AIAgentDisplay
            agentName={agentName}
            agentAvatar={agentAvatar}
            isActive={isAgentActive}
            isSpeaking={isAgentSpeaking}
          />
        </Card>

        {/* User Video - Picture in Picture */}
        <div className="relative w-80">
          <Card className="h-full overflow-hidden">
            <div className="relative h-full bg-gray-800">
              {isCameraOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center text-white">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-700">
                      <span className="text-2xl font-semibold">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-gray-300">Camera is off</p>
                  </div>
                </div>
              )}

              {/* User name overlay */}
              <div className="absolute bottom-4 left-4 rounded-md bg-black/50 px-3 py-1 text-sm text-white backdrop-blur-sm">
                {displayName} (You)
              </div>

              {/* Mic status indicator */}
              {!isMicOn && (
                <div className="absolute right-4 top-4 rounded-full bg-red-500 p-2">
                  <svg
                    className="h-4 w-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                    />
                  </svg>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="pb-6">
        <CallControls
          isCameraOn={isCameraOn}
          isMicOn={isMicOn}
          onToggleCamera={toggleCamera}
          onToggleMic={toggleMic}
          onEndCall={handleEndCall}
        />
      </div>
    </div>
  );
}
