import React, { useState } from 'react';
import './Chatpage.css'; // Import the CSS file for styling
// import { useChat } from './context/useChat'; // Commented out Gemini hook
import { usePerplexity } from './context/usePerplexity'; // Using Perplexity hook
import ProductCard from './components/ProductCard';

function Chatpage() {
  // const { messages, isLoading, messagesEndRef, sendMessage } = useChat(); // Commented out Gemini hook
  const { messages, isLoading, messagesEndRef, sendMessage } = usePerplexity(); // Using Perplexity hook
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h4>🛍️ E-commerce Chatbot</h4>
        <h6>Ask me about products, shipping, returns, and more!</h6>
      </div>

      <div className="chat-wrapper">
        <div className="chat-window">
          <div className="chat-messages">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`message ${msg.sender}`}
              >
                {msg.sender === 'bot' ? (
                <div>
                  {msg.text.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                  {msg.products && msg.products.length > 0 && (
                    <div className="product-cards-container">
                      {msg.products.map((product, productIndex) => (
                        <ProductCard key={productIndex} product={product} />
                      ))}
                    </div>
                  )}
                </div>
                ) : (
                  msg.text.split('\n').map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      {lineIndex < msg.text.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))
                )}
              </div>
            ))}
            
            {isLoading && (
            <div className="message loading">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="chat-input-container">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about our products and services..."
            className="chat-input"
            disabled={isLoading}
          />
          <button
            type="submit" 
            className="send-button"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Sending...
              </>
            ) : (
              <>
                📤 Send
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chatpage;