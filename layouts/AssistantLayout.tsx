
import React from 'react';
import { GeminiLiveProvider } from '../contexts/GeminiLiveContext.tsx';
import ConversationPage from '../pages/ConversationPage.tsx';

const AssistantLayout: React.FC = () => {
  // In a full app, state would manage which page is visible (Conversation, Memory, etc.)
  // For this demo, we'll only show the ConversationPage.

  return (
    <GeminiLiveProvider>
      <div className="flex h-screen w-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
        {/* A full app would have a <Navigation /> component here */}
        <main className="flex-1 flex flex-col">
          <ConversationPage />
        </main>
      </div>
    </GeminiLiveProvider>
  );
};

export default AssistantLayout;