
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

// Audio configuration constants
const INPUT_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

export interface LiveTranscriptionCallbacks {
  onTranscription: (text: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onClose: () => void;
}

export class LiveAudioService {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private mediaStream: MediaStream | null = null;
  private currentTranscription = "";

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async start(callbacks: LiveTranscriptionCallbacks) {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });

      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            console.debug('Guardia Live session opened');
            this.streamMicrophone();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              this.currentTranscription += text;
              callbacks.onTranscription(this.currentTranscription, false);
            }

            if (message.serverContent?.turnComplete) {
              callbacks.onTranscription(this.currentTranscription, true);
              this.currentTranscription = "";
            }
          },
          onerror: (e: any) => {
            console.error('Guardia Live error:', e);
            callbacks.onError("Erro na conexão de áudio.");
          },
          onclose: (e: any) => {
            console.debug('Guardia Live session closed');
            callbacks.onClose();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          // Enhanced System Instruction to force Speaker Diarization in the transcription output
          systemInstruction: `You are the specialized transcription engine for GUARD.IA. 
          Your ONLY task is to TRANSCRIBE the incoming audio into English.
          
          DIARIZATION RULES:
          1. Detect who is speaking. 
          2. Label the speakers as [USER] (the victim) or [SCAMMER] (the caller/fraudster).
          3. Format every line as "[SPEAKER_NAME]: Text".
          
          Example output:
          [SCAMMER]: Hello, this is your bank security calling.
          [USER]: Oh, hello? What is the problem?
          
          Always output English text regardless of the input language.`,
        },
      });
    } catch (err) {
      console.error('Failed to start Live Audio:', err);
      callbacks.onError("Permissão de microfone negada ou erro de hardware.");
    }
  }

  private streamMicrophone() {
    if (!this.audioContext || !this.mediaStream || !this.sessionPromise) return;

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);
    this.scriptProcessor = this.audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  private createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  stop() {
    this.scriptProcessor?.disconnect();
    this.mediaStream?.getTracks().forEach(track => track.stop());
    this.audioContext?.close();
    this.sessionPromise?.then(session => session.close());
    
    this.scriptProcessor = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.sessionPromise = null;
  }
}

export const liveAudioService = new LiveAudioService();
