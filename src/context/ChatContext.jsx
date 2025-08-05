import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { product } from '../product';
import { shipping } from '../shipping';
import { faqs } from '../faq';
import { ChatContext } from './ChatContext';

// API Configuration
const API_KEY = "AIzaSyBq5kY0379XTWHTRDaEwmZN5yTxViv-hD4"; // REPLACE THIS WITH YOUR ACTUAL KEY
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Context Provider Component
export const ChatProvider = ({ children }) => {
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
    console.log('🔍 Searching for FAQ match for:', userInput);
    console.log('📋 Available FAQs:', faqs.map(f => f.question));
    
    // Check if user is asking about payment
    const userAskingAboutPayment = lowerCaseInput.includes('payment') || lowerCaseInput.includes('pay') || lowerCaseInput.includes('methods') || lowerCaseInput.includes('options');
    
    let faqMatch;
    
    if (userAskingAboutPayment) {
      console.log('🔍 User is asking about payment, looking for payment FAQ first...');
      // First try to find payment FAQ specifically
      faqMatch = faqs.find(item => {
        const isPaymentFAQ = item.question.toLowerCase().includes('payment');
        if (isPaymentFAQ) {
          console.log(`🔍 Found payment FAQ: "${item.question}"`);
          // For payment FAQs, use simpler matching
          const hasPaymentKeywords = lowerCaseInput.includes('payment') || lowerCaseInput.includes('methods') || lowerCaseInput.includes('options');
          const result = hasPaymentKeywords && isPaymentFAQ;
          console.log(`   Payment FAQ match: ${result}`);
          return result;
        }
        return false;
      });
      
      // If no payment FAQ found, try regular matching
      if (!faqMatch) {
        console.log('🔍 No payment FAQ found, trying regular matching...');
        faqMatch = faqs.find(item => {
          const questionWords = item.question.toLowerCase().split(' ');
          const inputWords = lowerCaseInput.split(' ');
          
          console.log(`\n🔎 Checking FAQ: "${item.question}"`);
          
          // 1. Exact phrase match
          const exactMatch = lowerCaseInput.includes(item.question.toLowerCase());
          console.log(`   Exact match: ${exactMatch}`);
          
          // 1.5. Direct question matching for common variations
          const directMatches = {
            'what payment methods do you accept': ['payment methods', 'payment options', 'what payment', 'payment methods do you accept', 'payment options', 'what are payment options'],
            'what is your return policy': ['return policy', 'returns', 'return'],
            'how do i track my order': ['track order', 'order tracking', 'track my order'],
            'do you offer cash on delivery': ['cash on delivery', 'cod', 'cash delivery'],
            'how long does delivery take': ['delivery time', 'how long delivery', 'delivery duration']
          };
          
          const directMatch = Object.entries(directMatches).some(([faqQuestion, variations]) => {
            if (item.question.toLowerCase() === faqQuestion) {
              const matchFound = variations.some(variation => lowerCaseInput.includes(variation));
              console.log(`   Direct match for "${faqQuestion}": ${matchFound}`);
              if (matchFound) {
                console.log(`   ✅ Matched variations:`, variations.filter(v => lowerCaseInput.includes(v)));
              }
              return matchFound;
            }
            return false;
          });
          
          // 2. Keyword matching - check if any important words match
          const keywordMatch = questionWords.some(word => 
            word.length > 2 && inputWords.some(inputWord => 
              inputWord.includes(word) || word.includes(inputWord)
            )
          );
          console.log(`   Keyword match: ${keywordMatch}`);
          
          // 3. Synonym matching for common terms
          const synonyms = {
            'return': ['return', 'refund', 'exchange', 'send back'],
            'shipping': ['shipping', 'delivery', 'postage', 'courier'],
            'payment': ['payment', 'pay', 'money', 'cash', 'card', 'payment methods', 'payment options'],
            'cancel': ['cancel', 'cancellation', 'stop order'],
            'track': ['track', 'tracking', 'where is my order', 'order status'],
            'damage': ['damage', 'broken', 'defective', 'faulty'],
            'size': ['size', 'fit', 'measurement', 'dimension'],
            'contact': ['contact', 'support', 'help', 'customer service'],
            'gift': ['gift', 'gift card', 'present'],
            'invoice': ['invoice', 'bill', 'receipt', 'gst'],
            'methods': ['methods', 'options', 'ways', 'accepted'],
            'accept': ['accept', 'methods', 'options', 'ways']
          };
          
          const synonymMatch = Object.entries(synonyms).some(([key, values]) => {
            if (questionWords.includes(key)) {
              const matchFound = values.some(synonym => inputWords.some(inputWord => 
                inputWord.includes(synonym) || synonym.includes(inputWord)
              ));
              if (matchFound) {
                console.log(`   Synonym match for "${key}": ${matchFound}`);
              }
              return matchFound;
            }
            return false;
          });
          console.log(`   Synonym match: ${synonymMatch}`);
          
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
          console.log(`   Question type match: ${questionTypeMatch}`);
          
          // Exclude return policy when asking about payment
          const isReturnPolicyFAQ = item.question.toLowerCase().includes('return');
          const shouldExcludeReturnPolicy = userAskingAboutPayment && isReturnPolicyFAQ;
          console.log(`   Is return policy FAQ: ${isReturnPolicyFAQ}`);
          console.log(`   Should exclude return policy: ${shouldExcludeReturnPolicy}`);
          
          const finalResult = (exactMatch || directMatch || keywordMatch || synonymMatch || questionTypeMatch) && !shouldExcludeReturnPolicy;
          console.log(`   🎯 Final result for "${item.question}": ${finalResult}`);
          
          return finalResult;
        });
      }
    } else {
      // Regular matching for non-payment questions
      faqMatch = faqs.find(item => {
        const questionWords = item.question.toLowerCase().split(' ');
        const inputWords = lowerCaseInput.split(' ');
        
        console.log(`\n🔎 Checking FAQ: "${item.question}"`);
        
        // 1. Exact phrase match
        const exactMatch = lowerCaseInput.includes(item.question.toLowerCase());
        console.log(`   Exact match: ${exactMatch}`);
        
        // 1.5. Direct question matching for common variations
        const directMatches = {
          'what payment methods do you accept': ['payment methods', 'payment options', 'what payment', 'payment methods do you accept', 'payment options', 'what are payment options'],
          'what is your return policy': ['return policy', 'returns', 'return'],
          'how do i track my order': ['track order', 'order tracking', 'track my order'],
          'do you offer cash on delivery': ['cash on delivery', 'cod', 'cash delivery'],
          'how long does delivery take': ['delivery time', 'how long delivery', 'delivery duration']
        };
        
        const directMatch = Object.entries(directMatches).some(([faqQuestion, variations]) => {
          if (item.question.toLowerCase() === faqQuestion) {
            const matchFound = variations.some(variation => lowerCaseInput.includes(variation));
            console.log(`   Direct match for "${faqQuestion}": ${matchFound}`);
            if (matchFound) {
              console.log(`   ✅ Matched variations:`, variations.filter(v => lowerCaseInput.includes(v)));
            }
            return matchFound;
          }
          return false;
        });
        
        // 2. Keyword matching - check if any important words match
        const keywordMatch = questionWords.some(word => 
          word.length > 2 && inputWords.some(inputWord => 
            inputWord.includes(word) || word.includes(inputWord)
          )
        );
        console.log(`   Keyword match: ${keywordMatch}`);
        
        // 3. Synonym matching for common terms
        const synonyms = {
          'return': ['return', 'refund', 'exchange', 'send back'],
          'shipping': ['shipping', 'delivery', 'postage', 'courier'],
          'payment': ['payment', 'pay', 'money', 'cash', 'card', 'payment methods', 'payment options'],
          'cancel': ['cancel', 'cancellation', 'stop order'],
          'track': ['track', 'tracking', 'where is my order', 'order status'],
          'damage': ['damage', 'broken', 'defective', 'faulty'],
          'size': ['size', 'fit', 'measurement', 'dimension'],
          'contact': ['contact', 'support', 'help', 'customer service'],
          'gift': ['gift', 'gift card', 'present'],
          'invoice': ['invoice', 'bill', 'receipt', 'gst'],
          'methods': ['methods', 'options', 'ways', 'accepted'],
          'accept': ['accept', 'methods', 'options', 'ways']
        };
        
        const synonymMatch = Object.entries(synonyms).some(([key, values]) => {
          if (questionWords.includes(key)) {
            const matchFound = values.some(synonym => inputWords.some(inputWord => 
              inputWord.includes(synonym) || synonym.includes(inputWord)
            ));
            if (matchFound) {
              console.log(`   Synonym match for "${key}": ${matchFound}`);
            }
            return matchFound;
          }
          return false;
        });
        console.log(`   Synonym match: ${synonymMatch}`);
        
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
        console.log(`   Question type match: ${questionTypeMatch}`);
        
        const finalResult = exactMatch || directMatch || keywordMatch || synonymMatch || questionTypeMatch;
        console.log(`   🎯 Final result for "${item.question}": ${finalResult}`);
        
        return finalResult;
      });
    }
    
    if (faqMatch) {
      console.log('Found FAQ match:', faqMatch.question);
      contextData += `\n\nUser's question is related to FAQs. Relevant FAQ: Question: "${faqMatch.question}", Answer: "${faqMatch.answer}"`;
    } else {
      console.log('No FAQ match found for:', userInput);
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
        `🛍️ PRODUCT CARD ${item.id}:\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🖼️  Image: ${item.image}\n` +
        `🏷️  Name: ${item.name}\n` +
        `📝 Description: ${item.description}\n` +
        `💰 Price: ₹${item.price}\n` +
        `🏷️  Category: ${item.category}\n` +
        `⭐ Rating: ${item.rating}/5 (${item.reviews} reviews)\n` +
        `📦 Stock: ${item.inStock ? '✅ In Stock' : '❌ Out of Stock'}\n` +
        `📏 Available Sizes: ${item.variants.map(v => v.size).join(', ')}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      ).join('\n\n');
      contextData += `\n\nUser's question is related to products. Please display these products in beautiful card format with images:\n${productInfo}`;
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

  // Helper function to construct AI prompt
  const constructPrompt = (userInput, contextData) => {
    if (contextData) {
      return `The user asked: "${userInput}".
      I found some potentially relevant information:
      ${contextData}

      Please provide a helpful, user-friendly answer based on this information. If you found products, display them in beautiful card format with proper spacing, emojis, and mention the image URLs. If you found FAQ information, explain it clearly. If you found shipping information, provide the status details. Be specific and helpful with the information provided.`;
    } else {
      return `The user asked: "${userInput}". Please provide a helpful response about our ecommerce store. You can help with product information, shipping, returns, and general customer service questions.`;
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
      
      // Get product matches for UI display
      const lowerCaseInput = inputValue.toLowerCase();
      const productMatches = product.filter(
        (item) => {
          const nameMatch = lowerCaseInput.includes(item.name.toLowerCase());
          const idMatch = lowerCaseInput.includes(item.id.toLowerCase());
          const categoryMatch = lowerCaseInput.includes(item.category.toLowerCase());
          const wordMatch = inputValue.split(' ').some(word => 
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
      
      // Construct prompt
      const promptToGemini = constructPrompt(inputValue, contextData);

      // Call Gemini API
      const result = await model.generateContent(promptToGemini);
      const response = await result.response;
      const botResponseText = response.text();

      const botMessage = { 
        text: botResponseText, 
        sender: 'bot',
        products: productMatches.length > 0 ? productMatches : undefined
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

    } catch (error) {
      console.error("Error communicating with Gemini API:", error);
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
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}; 