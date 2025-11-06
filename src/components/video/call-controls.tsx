'use client';

import { Button } from '@/components/ui/button';
import { Camera, CameraOff, Mic, MicOff, PhoneOff } from 'lucide-react';

interface CallControlsProps {
  isCameraOn: boolean;
  isMicOn: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onEndCall: () => void;
  disabled?: boolean;
}

export function CallControls({
  isCameraOn,
  isMicOn,
  onToggleCamera,
  onToggleMic,
  onEndCall,
  disabled = false,
}: CallControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 rounded-lg bg-gray-900/90 p-4 backdrop-blur-sm">
      <Button
        variant={isCameraOn ? 'secondary' : 'destructive'}
        size="lg"
        onClick={onToggleCamera}
        disabled={disabled}
        className="h-14 w-14 rounded-full p-0"
        aria-label={isCameraOn ? 'Turn camera off' : 'Turn camera on'}
      >
        {isCameraOn ? (
          <Camera className="h-6 w-6" />
        ) : (
          <CameraOff className="h-6 w-6" />
        )}
      </Button>

      <Button
        variant={isMicOn ? 'secondary' : 'destructive'}
        size="lg"
        onClick={onToggleMic}
        disabled={disabled}
        className="h-14 w-14 rounded-full p-0"
        aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {isMicOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
      </Button>

      <Button
        variant="destructive"
        size="lg"
        onClick={onEndCall}
        disabled={disabled}
        className="h-14 w-14 rounded-full p-0"
        aria-label="End call"
      >
        <PhoneOff className="h-6 w-6" />
      </Button>
    </div>
  );
}
