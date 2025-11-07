
import React, { useState, useEffect } from 'react';
import { useGeminiLive } from '../contexts/GeminiLiveContext';
import { Assistant, MemoryItem, ConversationTurn } from '../types';
import Orb from '../components/Orb';
import WebResults from '../components/WebResults';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';

// Mock data
const mockAssistant: Assistant = {
  id: '1',
  user_id: '12345',
  name: 'Nexus',
  avatar: 'https://picsum.photos/seed/nexus/200',
  personality: ['Helpful', 'Curious', 'Knowledgeable'],
  attitude: 'Friendly and professional',
  voice: 'Zephyr',
  prompt: 'You are the central AI of The Nexus platform. Your goal is to assist users by leveraging your tools and memory.',
  description: 'A helpful AI assistant.',
  author_name: 'AI Architect',
  orb_hue: 200,
  is_public: true,
};
const mockMemory: MemoryItem[] = [];
const mockHistory: ConversationTurn[] = [];

const ConversationPage: React.FC = () => {
  const { status, startSession, stopSession, userTranscript, assistantTranscript, isAssistantSpeaking, webSearchResults } = useGeminiLive();
  const [assistant] = useState<Assistant>(mockAssistant);
  const [memory] = useState<MemoryItem[]>(mockMemory);
  const [history] = useState<ConversationTurn[]>(mockHistory);
  
  const handleToggleSession = () => {
    if (status === 'active') {
      stopSession();
    } else {
      startSession(assistant, memory, history);
    }
  };

  const orbStatus = isAssistantSpeaking ? 'speaking' : status === 'active' ? 'active' : status === 'connecting' ? 'connecting' : 'idle';

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-gray-50/50 dark:bg-gray-950/50">
      <div className="absolute inset-0 flex items-center justify-center">
         <Orb status={orbStatus} hue={assistant.orb_hue} />
      </div>
      
      <div className="z-10 flex flex-col items-center justify-center text-center">
        <img src={assistant.avatar} alt={assistant.name} className="w-40 h-40 rounded-full border-4 border-white/20 shadow-lg mb-6" />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">{assistant.name}</h1>
        
        <div className="h-24 w-full max-w-2xl my-4 text-lg p-2 rounded-lg">
          <p className="font-semibold text-gray-700 dark:text-gray-300">
            {userTranscript || (status === 'active' && 'Listening...')}
          </p>
          <p className="font-bold text-blue-600 dark:text-blue-400 mt-2">
            {assistantTranscript}
          </p>
        </div>

        {webSearchResults && webSearchResults.length > 0 && (
          <WebResults results={webSearchResults} />
        )}
        
        <button
          onClick={handleToggleSession}
          className={`mt-8 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out text-white
            ${status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}
            ${status === 'connecting' ? 'animate-pulse' : ''}
          `}
          disabled={status === 'connecting'}
        >
          {status === 'active' ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
          {status === 'active' ? 'Session Active' : status}
        </p>

        {status === 'error' && (
            <div className="mt-4 flex items-center gap-2 text-red-500">
                <AlertTriangle size={20} />
                <p>An error occurred. Please try again.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ConversationPage;
