'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, CameraOff, Mic, MicOff, Video } from 'lucide-react';

interface VideoLobbyProps {
  onJoinCall: () => void;
  userName: string | null | undefined;
  agentName: string;
}

export function VideoLobby({ onJoinCall, userName, agentName }: VideoLobbyProps) {
  const displayName = userName || 'User';
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let mounted = true;

    async function initializeDevices() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setError('Unable to access camera or microphone. Please check your permissions.');
      }
    }

    initializeDevices();

    return () => {
      mounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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

  const handleJoinCall = () => {
    // Keep the stream active for the call
    onJoinCall();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-4xl p-6">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Ready to join?</h1>
            <p className="mt-2 text-gray-600">
              You're about to meet with <span className="font-semibold">{agentName}</span>
            </p>
          </div>

          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-900">
            {error ? (
              <div className="flex h-full items-center justify-center text-white">
                <div className="text-center">
                  <CameraOff className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm">{error}</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${!isCameraOn ? 'hidden' : ''}`}
                />
                {!isCameraOn && (
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
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isCameraOn ? 'default' : 'destructive'}
              size="lg"
              onClick={toggleCamera}
              disabled={!stream}
              className="h-14 w-14 rounded-full p-0"
            >
              {isCameraOn ? (
                <Camera className="h-6 w-6" />
              ) : (
                <CameraOff className="h-6 w-6" />
              )}
            </Button>

            <Button
              variant={isMicOn ? 'default' : 'destructive'}
              size="lg"
              onClick={toggleMic}
              disabled={!stream}
              className="h-14 w-14 rounded-full p-0"
            >
              {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleJoinCall}
              disabled={!stream || !!error}
              className="min-w-[200px]"
            >
              <Video className="mr-2 h-5 w-5" />
              Join Call
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
