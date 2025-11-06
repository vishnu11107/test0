/**
 * OpenAI Realtime API Integration
 * 
 * This module provides client-side integration with OpenAI's Realtime API
 * for real-time speech-to-speech AI agent interactions during video calls.
 */

export interface RealtimeConfig {
  apiKey: string;
  model?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  instructions?: string;
  temperature?: number;
}

export interface RealtimeMessage {
  type: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export type RealtimeEventType =
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'speaking_started'
  | 'speaking_stopped'
  | 'message'
  | 'audio_buffer';

export interface RealtimeEvent {
  type: RealtimeEventType;
  data?: any;
}

export class OpenAIRealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private eventHandlers: Map<RealtimeEventType, Set<(data: any) => void>> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;

  constructor(config: RealtimeConfig) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2024-10-01',
      voice: 'alloy',
      temperature: 0.8,
      ...config,
    };
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.warn('Already connected to OpenAI Realtime API');
      return;
    }

    try {
      // Create WebSocket connection to OpenAI Realtime API
      const url = 'wss://api.openai.com/v1/realtime?model=' + this.config.model;
      
      this.ws = new WebSocket(url, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'OpenAI-Beta': 'realtime=v1',
        },
      } as any);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', {});
        
        // Send session configuration
        this.sendSessionUpdate();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { error: 'WebSocket connection error' });
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected', {});
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(() => {
            console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Failed to connect to OpenAI Realtime API:', error);
      this.emit('error', { error: 'Connection failed' });
      throw error;
    }
  }

  /**
   * Disconnect from OpenAI Realtime API
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Send session configuration to OpenAI
   */
  private sendSessionUpdate(): void {
    if (!this.ws || !this.isConnected) return;

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: this.config.instructions || 'You are a helpful AI assistant.',
        voice: this.config.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        temperature: this.config.temperature,
      },
    };

    this.send(sessionConfig);
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Not connected to OpenAI Realtime API');
      return;
    }

    // Convert audio data to base64
    const base64Audio = this.arrayBufferToBase64(audioData);

    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  /**
   * Commit audio buffer (signal end of user speech)
   */
  commitAudio(): void {
    if (!this.isConnected || !this.ws) return;

    this.send({
      type: 'input_audio_buffer.commit',
    });

    this.send({
      type: 'response.create',
    });
  }

  /**
   * Send text message to AI agent
   */
  sendText(text: string): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Not connected to OpenAI Realtime API');
      return;
    }

    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text,
          },
        ],
      },
    });

    this.send({
      type: 'response.create',
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case 'session.created':
        case 'session.updated':
          console.log('Session configured:', message);
          break;

        case 'conversation.item.created':
          if (message.item?.role === 'assistant') {
            const text = message.item.content?.[0]?.text;
            if (text) {
              this.emit('message', {
                type: 'agent',
                text,
                timestamp: Date.now(),
              });
            }
          }
          break;

        case 'response.audio.delta':
          // Received audio chunk from AI
          if (message.delta) {
            const audioData = this.base64ToArrayBuffer(message.delta);
            this.emit('audio_buffer', { audioData });
          }
          break;

        case 'response.audio.done':
          this.emit('speaking_stopped', {});
          break;

        case 'response.done':
          console.log('Response completed');
          break;

        case 'input_audio_buffer.speech_started':
          this.emit('speaking_started', { speaker: 'user' });
          break;

        case 'input_audio_buffer.speech_stopped':
          this.emit('speaking_stopped', { speaker: 'user' });
          break;

        case 'error':
          console.error('OpenAI Realtime API error:', message.error);
          this.emit('error', { error: message.error });
          break;

        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Send data through WebSocket
   */
  private send(data: any): void {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify(data));
    }
  }

  /**
   * Register event handler
   */
  on(event: RealtimeEventType, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unregister event handler
   */
  off(event: RealtimeEventType, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to all registered handlers
   */
  private emit(event: RealtimeEventType, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Update agent instructions
   */
  updateInstructions(instructions: string): void {
    this.config.instructions = instructions;
    if (this.isConnected) {
      this.sendSessionUpdate();
    }
  }
}

/**
 * Create and configure OpenAI Realtime client
 */
export function createRealtimeClient(config: RealtimeConfig): OpenAIRealtimeClient {
  return new OpenAIRealtimeClient(config);
}
