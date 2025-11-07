
import { GoogleGenAI } from "@google/genai";
import { WebSearchResult } from '../types.ts';

// The API key is injected by the environment. The explicit check is removed to prevent crashes.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const performSearchAndSummarize = async (query: string): Promise<{ summary: string; sources: WebSearchResult[] }> => {
  try {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: query,
        config: {
          tools: [{googleSearch: {}}],
        },
    });

    const summary = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources = groundingChunks
      .map(chunk => chunk.web)
      .filter((web): web is { uri: string; title: string } => !!web && !!web.uri)
      .reduce<WebSearchResult[]>((acc, current) => {
          if (!acc.some(item => item.uri === current.uri)) {
              acc.push(current);
          }
          return acc;
      }, []);

    return { summary, sources };

  } catch (error) {
    console.error("Error performing search and summarize:", error);
    return {
      summary: "I'm sorry, I encountered an error while searching the web. Please try again.",
      sources: []
    };
  }
};