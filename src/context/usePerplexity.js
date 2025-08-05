import { useContext } from 'react';
import { PerplexityContext } from './PerplexityContext.js';

export const usePerplexity = () => {
  const context = useContext(PerplexityContext);
  if (!context) {
    throw new Error('usePerplexity must be used within a PerplexityProvider');
  }
  return context;
}; 