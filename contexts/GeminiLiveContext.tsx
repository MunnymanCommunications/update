
import React, { createContext, useContext, useState, useRef, ReactNode, useCallback } from 'react';
// FIX: Removed LiveSession as it is not an exported member of @google/genai
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, Blob } from '@google/genai';
import { decode, decodeAudioData, encode } from '../utils/audioUtils';
import { Assistant, MemoryItem, ConversationTurn, WebSearchResult } from '../types';
import { performSearchAndSummarize } from '../services/geminiService';

type SessionStatus = 'idle' | 'connecting' | 'active' | 'error' | 'stopped';

interface GeminiLiveContextType {
  status: SessionStatus;
  userTranscript: string;
  assistantTranscript: string;
  startSession: (assistant: Assistant, memory: MemoryItem[], history: ConversationTurn[]) => void;
  stopSession: () => void;
  isAssistantSpeaking: boolean;
  webSearchResults: WebSearchResult[] | null;
  clearWebResults: () => void;
}

const GeminiLiveContext = createContext<GeminiLiveContextType | undefined>(undefined);

export const useGeminiLive = () => {
  const context = useContext(GeminiLiveContext);
  if (!context) throw new Error('useGeminiLive must be used within a GeminiLiveProvider');
  return context;
};

const webSearchFunctionDeclaration: FunctionDeclaration = {
  name: 'webSearch',
  parameters: {
    type: Type.OBJECT,
    description: 'Get information from the web about current events or recent topics.',
    properties: {
      query: { type: Type.STRING, description: 'The search query.' },
    },
    required: ['query'],
  },
};

const saveToMemoryFunctionDeclaration: FunctionDeclaration = {
    name: 'saveToMemory',
    parameters: {
      type: Type.OBJECT,
      description: 'Save a piece of information to your long-term memory bank.',
      properties: {
        information: { type: Type.STRING, description: 'The information to save.' },
      },
      required: ['information'],
    },
};

// FIX: Create a type alias for the LiveSession object, as it's not exported from the library.
type LiveSession = Awaited<ReturnType<InstanceType<typeof GoogleGenAI>['live']['connect']>>;

export const GeminiLiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [assistantTranscript, setAssistantTranscript] = useState('');
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<WebSearchResult[] | null>(null);

  const sessionRef = useRef<LiveSession | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // FIX: Refactored audio playback to follow guidelines for smooth, gapless audio.
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const nextStartTimeRef = useRef(0);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopSession = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
        mediaStreamSourceRef.current.disconnect();
        mediaStreamSourceRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    // FIX: Refactored audio playback: stop and clear any active audio sources.
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setStatus('stopped');
    setUserTranscript('');
    setAssistantTranscript('');
    setIsAssistantSpeaking(false);
  }, []);

  const clearWebResults = () => setWebSearchResults(null);

  const startSession = async (assistant: Assistant, memory: MemoryItem[], history: ConversationTurn[]) => {
    if (status === 'active' || status === 'connecting') return;
    setStatus('connecting');
    clearWebResults();

    const systemPrompt = `
      You are ${assistant.name}, an AI assistant.
      Your personality is: ${assistant.personality.join(', ')}.
      Your attitude is: ${assistant.attitude}.
      ${assistant.prompt}

      Here is some information you must remember:
      ${memory.map(m => `- ${m.content}`).join('\n')}

      Here is the recent conversation history:
      ${history.map(t => `${t.speaker}: ${t.text}`).join('\n')}
    `.trim();

    // FIX: Use process.env.API_KEY as per guidelines.
    if (!process.env.API_KEY) {
      console.error("API_KEY not set!");
      setStatus('error');
      return;
    }
    // FIX: Use process.env.API_KEY as per guidelines.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } }, // Voice is customizable
          systemInstruction: systemPrompt,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          tools: [{ functionDeclarations: [webSearchFunctionDeclaration, saveToMemoryFunctionDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            setStatus('active');
            const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
            mediaStreamSourceRef.current = source;
            const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(new Int16Array(inputData.map(f => f * 32768)).buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (message.serverContent?.inputTranscription) {
                currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                setUserTranscript(currentInputTranscriptionRef.current);
             }
             if (message.serverContent?.outputTranscription) {
                currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                setAssistantTranscript(currentOutputTranscriptionRef.current);
             }
             if (message.serverContent?.turnComplete) {
                currentInputTranscriptionRef.current = '';
                currentOutputTranscriptionRef.current = '';
             }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                let result = "OK.";
                if (fc.name === 'webSearch') {
                  // FIX: Cast fc.args.query to string to resolve type error.
                  const searchResult = await performSearchAndSummarize(fc.args.query as string);
                  result = searchResult.summary;
                  setWebSearchResults(searchResult.sources);
                } else if (fc.name === 'saveToMemory') {
                  console.log(`Saving to memory: ${fc.args.information}`);
                  // Here you would call an API to save to Supabase
                  result = "I have saved that to my memory.";
                }
                
                sessionPromise.then(session => session.sendToolResponse({
                    functionResponses: { id: fc.id, name: fc.name, response: { result } }
                }));
              }
            }

            // FIX: Refactored audio playback to be gapless and follow guidelines.
            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData && outputAudioContextRef.current) {
              setIsAssistantSpeaking(true);
              const audioContext = outputAudioContextRef.current;
              const audioBuffer = await decodeAudioData(decode(audioData), audioContext, 24000, 1);
              
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                audioContext.currentTime
              );
              
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                    setIsAssistantSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              sourcesRef.current.forEach(source => source.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsAssistantSpeaking(false);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setStatus('error');
            stopSession();
          },
          onclose: () => {
            stopSession();
          },
        },
      });
      sessionRef.current = await sessionPromise;

    } catch (error) {
      console.error('Failed to start session:', error);
      setStatus('error');
    }
  };

  const value = { status, userTranscript, assistantTranscript, startSession, stopSession, isAssistantSpeaking, webSearchResults, clearWebResults };

  return <GeminiLiveContext.Provider value={value}>{children}</GeminiLiveContext.Provider>;
};
