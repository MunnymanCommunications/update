
import React, { useState, useEffect } from 'react';
import AssistantLayout from './layouts/AssistantLayout';
import ConversationPage from './pages/ConversationPage';

// A simple mock for authentication state
const useAuth = () => {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate checking for an active session
    setTimeout(() => {
      setUser({ id: '12345', email: 'user@example.com' });
      setLoading(false);
    }, 500);
  }, []);
  
  // In a real app, this would use Supabase auth client
  const login = () => setUser({ id: '12345', email: 'user@example.com' });
  
  return { user, login, loading };
};


const App: React.FC = () => {
  const [hash, setHash] = useState(window.location.hash);
  const { user, login, loading } = useAuth();

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Mocked Auth Page
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
        <div className="p-8 bg-white/30 dark:bg-black/30 backdrop-blur-lg rounded-xl shadow-lg border border-white/20">
          <h1 className="text-2xl font-bold mb-4">Login to AI Architect</h1>
          <button 
            onClick={login}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log In (Mock)
          </button>
        </div>
      </div>
    );
  }
  
  // Simple Hash-based Router
  const renderContent = () => {
    // For this demo, we'll always render the assistant layout.
    // A full implementation would parse the hash for assistant IDs etc.
    return <AssistantLayout />;
  };

  return <div className="min-h-screen text-gray-800 dark:text-gray-200">{renderContent()}</div>;
};

export default App;
