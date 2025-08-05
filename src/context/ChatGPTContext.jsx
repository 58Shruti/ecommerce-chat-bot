import React, { useState, useRef, useEffect } from 'react';
import { product } from '../product';
import { shipping } from '../shipping';
import { faqs } from '../faq';
import { ChatGPTContext } from './ChatGPTContext.js';

// API Configuration for OpenAI ChatGPT
const OPENAI_API_KEY = "your-openai-api-key-here"; // REPLACE WITH YOUR ACTUAL KEY
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Context Provider Component
export const ChatGPTProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Helper function to find relevant data based on user input
  const findRelevantData = (userInput) => {
    const lowerCaseInput = userInput.toLowerCase();
    let contextData = '';

    // Check FAQs - Comprehensive matching
    const faqMatch = faqs.find(
      (item) => {
        const questionWords = item.question.toLowerCase().split(' ');
        const inputWords = lowerCaseInput.split(' ');
        
        // 1. Exact phrase match
        const exactMatch = lowerCaseInput.includes(item.question.toLowerCase());
        
        // 2. Keyword matching - check if any important words match
        const keywordMatch = questionWords.some(word => 
          word.length > 2 && inputWords.some(inputWord => 
            inputWord.includes(word) || word.includes(inputWord)
          )
        );
        
        // 3. Synonym matching for common terms
        const synonyms = {
          'return': ['return', 'refund', 'exchange', 'send back'],
          'shipping': ['shipping', 'delivery', 'postage', 'courier'],
          'payment': ['payment', 'pay', 'money', 'cash', 'card'],
          'cancel': ['cancel', 'cancellation', 'stop order'],
          'track': ['track', 'tracking', 'where is my order', 'order status'],
          'damage': ['damage', 'broken', 'defective', 'faulty'],
          'size': ['size', 'fit', 'measurement', 'dimension'],
          'contact': ['contact', 'support', 'help', 'customer service'],
          'gift': ['gift', 'gift card', 'present'],
          'invoice': ['invoice', 'bill', 'receipt', 'gst']
        };
        
        const synonymMatch = Object.entries(synonyms).some(([key, values]) => {
          if (questionWords.includes(key)) {
            return values.some(synonym => inputWords.some(inputWord => 
              inputWord.includes(synonym) || synonym.includes(inputWord)
            ));
          }
          return false;
        });
        
        // 4. Question type matching
        const questionTypes = {
          'what': ['what', 'tell me about', 'information about'],
          'how': ['how', 'how to', 'steps to', 'process'],
          'when': ['when', 'time', 'duration', 'how long'],
          'where': ['where', 'location', 'place'],
          'can': ['can', 'is it possible', 'do you allow'],
          'do': ['do', 'does', 'are you', 'is there']
        };
        
        const questionTypeMatch = Object.entries(questionTypes).some(([type, variations]) => {
          if (questionWords.includes(type)) {
            return variations.some(variation => inputWords.some(inputWord => 
              inputWord.includes(variation) || variation.includes(inputWord)
            ));
          }
          return false;
        });
        
        return exactMatch || keywordMatch || synonymMatch || questionTypeMatch;
      }
    );
    if (faqMatch) {
      contextData += `\n\nUser's question is related to FAQs. Relevant FAQ: Question: "${faqMatch.question}", Answer: "${faqMatch.answer}"`;
    }

    // Check Products - Enhanced matching with synonyms
    const productMatches = product.filter(
      (item) => {
        const nameMatch = lowerCaseInput.includes(item.name.toLowerCase());
        const idMatch = lowerCaseInput.includes(item.id.toLowerCase());
        const categoryMatch = lowerCaseInput.includes(item.category.toLowerCase());
        const wordMatch = userInput.split(' ').some(word => 
          item.name.toLowerCase().includes(word) && word.length > 2
        );
        
        // Handle synonyms for better matching
        const synonyms = {
          't-shirt': ['tees', 'tee', 'shirt'],
          't-shirts': ['tees', 'tee', 'shirt'],
          'tshirt': ['tees', 'tee', 'shirt'],
          'tshirts': ['tees', 'tee', 'shirt'],
          'pants': ['pant', 'trousers', 'slacks'],
          'jeans': ['jean', 'denim'],
          'shirts': ['shirt', 'top']
        };
        
        // Check if any synonym matches the category
        const synonymMatch = Object.entries(synonyms).some(([key, values]) => {
          if (lowerCaseInput.includes(key)) {
            return values.some(synonym => 
              item.category.toLowerCase().includes(synonym) ||
              item.name.toLowerCase().includes(synonym)
            );
          }
          return false;
        });
        
        return nameMatch || idMatch || categoryMatch || wordMatch || synonymMatch;
      }
    );

    if (productMatches.length > 0) {
      const productInfo = productMatches.map(item => 
        `📦 PRODUCT CARD ${item.id}:\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🏷️  Name: ${item.name}\n` +
        `📝 Description: ${item.description}\n` +
        `💰 Price: ₹${item.price}\n` +
        `🏷️  Category: ${item.category}\n` +
        `⭐ Rating: ${item.rating}/5 (${item.reviews} reviews)\n` +
        `📦 Stock: ${item.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n` +
        `📏 Available Sizes: ${item.variants.map(v => v.size).join(', ')}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      ).join('\n\n');
      contextData += `\n\nUser's question is related to products. Please display these products in card format:\n${productInfo}`;
    }

    // Check Shipping - Enhanced matching
    const shippingMatch = shipping.find(
      (item) => {
        // Check if user is asking about shipping status
        const shippingKeywords = ['shipping', 'delivery', 'track', 'order status', 'when will i receive'];
        const isShippingQuery = shippingKeywords.some(keyword => lowerCaseInput.includes(keyword));
        
        // Check if user mentioned the specific product
        const productMatch = lowerCaseInput.includes(item.productName.toLowerCase()) ||
                           lowerCaseInput.includes(item.productId);
        
        return isShippingQuery && productMatch;
      }
    );
    
    if (shippingMatch) {
      contextData += `\n\nUser's question is related to shipping. Relevant shipping info: Product: "${shippingMatch.productName}", Status: "${shippingMatch.status}", Expected Delivery: "${shippingMatch.expectedDelivery}", Location: "${shippingMatch.location}"`;
    }

    return contextData;
  };

  // Helper function to construct ChatGPT prompt
  const constructChatGPTPrompt = (userInput, contextData) => {
    if (contextData) {
      return {
        role: "user",
        content: `The user asked: "${userInput}".
        I found some potentially relevant information:
        ${contextData}

        Please provide a helpful, user-friendly answer based on this information. If you found products, display them in a clean card format with proper spacing and emojis. If you found FAQ information, explain it clearly. If you found shipping information, provide the status details. Be specific and helpful with the information provided.`
      };
    } else {
      return {
        role: "user", 
        content: `The user asked: "${userInput}". Please provide a helpful response about our ecommerce store. You can help with product information, shipping, returns, and general customer service questions.`
      };
    }
  };

  // Function to call OpenAI ChatGPT API
  const callChatGPTAPI = async (messages) => {
    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: messages,
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling ChatGPT API:", error);
      throw error;
    }
  };

  // Main function to handle sending messages
  const sendMessage = async (inputValue) => {
    if (inputValue.trim() === '') return;

    const userMessage = { text: inputValue, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setIsLoading(true);

    try {
      // Find relevant data
      const contextData = findRelevantData(inputValue);
      
      // Construct messages for ChatGPT
      const systemMessage = {
        role: "system",
        content: "You are a helpful ecommerce customer service chatbot. You help customers with product information, shipping, returns, and general questions. Always be friendly and helpful."
      };

      const userMessageForAPI = constructChatGPTPrompt(inputValue, contextData);
      
      const messagesForAPI = [systemMessage, userMessageForAPI];

      // Call ChatGPT API
      const botResponseText = await callChatGPTAPI(messagesForAPI);

      const botMessage = { text: botResponseText, sender: 'bot' };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (error) {
      console.error("Error communicating with ChatGPT API:", error);
      const errorMessage = { 
        text: "Sorry, I'm having trouble understanding right now. Can you please rephrase?", 
        sender: 'bot' 
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to clear chat history
  const clearChat = () => {
    setMessages([]);
  };

  // Function to get chat statistics
  const getChatStats = () => {
    return {
      totalMessages: messages.length,
      userMessages: messages.filter(msg => msg.sender === 'user').length,
      botMessages: messages.filter(msg => msg.sender === 'bot').length,
    };
  };

  // Context value
  const value = {
    messages,
    isLoading,
    messagesEndRef,
    sendMessage,
    clearChat,
    getChatStats,
  };

  return (
    <ChatGPTContext.Provider value={value}>
      {children}
    </ChatGPTContext.Provider>
  );
}; 