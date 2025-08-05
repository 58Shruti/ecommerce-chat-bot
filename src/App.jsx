
import React from 'react';
import './App.css';

import Chatpage from './Chatpage';
// import { ChatProvider } from './context/ChatContext.jsx'; // Commented out Gemini context
import { PerplexityProvider } from './context/PerplexityContext.jsx'; // Using Perplexity context

function App() {
  return (
    <div className="App">
      <PerplexityProvider>
        <Chatpage />
      </PerplexityProvider>
    </div>
  );
}

export default App;
