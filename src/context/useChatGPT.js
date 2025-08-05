import { useContext } from 'react';
import { ChatGPTContext } from './ChatGPTContext.js';

export const useChatGPT = () => {
  const context = useContext(ChatGPTContext);
  if (!context) {
    throw new Error('useChatGPT must be used within a ChatGPTProvider');
  }
  return context;
}; 