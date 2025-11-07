
import React from 'react';
import { WebSearchResult } from '../types.ts';
import { Link } from 'lucide-react';

interface WebResultsProps {
  results: WebSearchResult[];
}

const WebResults: React.FC<WebResultsProps> = ({ results }) => {
  if (!results || results.length === 0) return null;

  return (
    <div className="mt-4 p-4 w-full max-w-2xl bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-lg border border-white/10 shadow-lg">
      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
        <Link size={16} />
        Web Sources
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {results.map((result, index) => (
          <a
            key={index}
            href={result.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 bg-blue-100/50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs rounded-full hover:bg-blue-200/50 dark:hover:bg-blue-800/50 transition-colors truncate max-w-[200px]"
            title={result.title}
          >
            {new URL(result.uri).hostname}
          </a>
        ))}
      </div>
    </div>
  );
};

export default WebResults;