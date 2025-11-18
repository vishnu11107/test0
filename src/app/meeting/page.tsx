'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

export default function MeetingPage() {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Array<{type: 'user' | 'agent', text: string, timestamp: number}>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Agent configuration
  const agent = {
    name: 'AI Assistant',
    instructions: 'You are a helpful AI assistant. Have a natural conversation with the user.',
    avatar: '🤖'
  };

  const startCall = async () => {
    setIsConnecting(true);
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      streamRef.current = stream;
      
      // Initialize audio context
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          // Convert audio to text and send to AI
          await processAudioData(event.data);
        }
      };

      setIsCallActive(true);
      setIsConnecting(false);
      
      // Add welcome message
      addMessage('agent', 'Hello! I\'m your AI assistant. How can I help you today?');
      
      toast.success('Call started! You can now speak with the AI agent.');
      
      // Start recording
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call. Please check your microphone permissions.');
      setIsConnecting(false);
    }
  };

  const endCall = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsCallActive(false);
    toast.success('Call ended');
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const addMessage = (type: 'user' | 'agent', text: string) => {
    setMessages(prev => [...prev, {
      type,
      text,
      timestamp: Date.now()
    }]);
  };

  const processAudioData = async (audioBlob: Blob) => {
    try {
      // For now, simulate AI response
      // In a real implementation, you'd send this to OpenAI Whisper for transcription
      // and then to GPT for response
      
      if (Math.random() > 0.7) { // Simulate occasional AI responses
        const responses = [
          "I understand. Can you tell me more about that?",
          "That's interesting. What would you like to know?",
          "I'm here to help. What's your question?",
          "Let me think about that for a moment...",
          "Could you elaborate on that point?",
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        setTimeout(() => {
          addMessage('agent', randomResponse);
          // Simulate text-to-speech
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(randomResponse);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            speechSynthesis.speak(utterance);
          }
        }, 1000 + Math.random() * 2000);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const sendTextMessage = async () => {
    if (!currentMessage.trim()) return;
    
    addMessage('user', currentMessage);
    const userMessage = currentMessage;
    setCurrentMessage('');
    
    try {
      // Send to OpenAI
      const response = await fetch('/api/test/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          instructions: agent.instructions
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        addMessage('agent', data.response);
        
        // Text-to-speech
        if ('speechSynthesis' in window && isSpeakerOn) {
          const utterance = new SpeechSynthesisUtterance(data.response);
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('agent', 'Sorry, I had trouble processing that. Could you try again?');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">AI Meeting</h1>
            <p className="text-gray-400">Have a conversation with your AI assistant</p>
          </div>

          {/* Agent Info */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-4xl">{agent.avatar}</span>
                <div>
                  <h3 className="text-xl">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{agent.instructions}</p>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Call Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex justify-center space-x-4">
                {!isCallActive ? (
                  <Button
                    onClick={startCall}
                    disabled={isConnecting}
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5 mr-2" />
                        Start Call
                      </>
                    )}
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={toggleMute}
                      variant={isMuted ? "destructive" : "secondary"}
                      size="lg"
                    >
                      {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                      variant={isSpeakerOn ? "secondary" : "outline"}
                      size="lg"
                    >
                      {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                    </Button>
                    
                    <Button
                      onClick={endCall}
                      variant="destructive"
                      size="lg"
                    >
                      <PhoneOff className="h-5 w-5 mr-2" />
                      End Call
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Interface */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                {isCallActive ? 'Call is active - speak or type your message' : 'Start a call to begin conversation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Messages */}
              <div className="h-64 overflow-y-auto mb-4 space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Text Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendTextMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isCallActive}
                />
                <Button
                  onClick={sendTextMessage}
                  disabled={!isCallActive || !currentMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-sm text-gray-400 space-y-2">
                <p><strong>How to use:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Click "Start Call" to begin</li>
                  <li>Allow microphone access when prompted</li>
                  <li>Speak naturally or type messages</li>
                  <li>The AI will respond with voice and text</li>
                  <li>Use mute/speaker controls as needed</li>
                </ul>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}