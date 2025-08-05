import React, { useState, useRef, useEffect } from "react";
import { product } from "../product";
import { shipping } from "../shipping";
import { faqs } from "../faq";
import { PerplexityContext } from "./PerplexityContext";

// API Configuration
const PERPLEXITY_API_KEY = "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";
const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions";

// Context Provider Component
export const PerplexityProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // CORRECT APPROACH - Let API handle everything
  const callPerplexityAPI = async (userInput) => {
    // Send ALL data to API and let it figure out what's relevant
    const allData = {
      products: product,
      faqs: faqs,
      shipping: shipping,
    };

    const response = await fetch(PERPLEXITY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          {
            role: "user",
            content: `You are an ecommerce chatbot. Answer this question: "${userInput}" using ONLY the provided data below. DO NOT search the web or use external information. DO NOT add any citations or references.

Available data:
- Products: ${JSON.stringify(allData.products)}
- FAQs: ${JSON.stringify(allData.faqs)}
- Shipping: ${JSON.stringify(allData.shipping)}

Instructions:
1. Answer naturally and helpfully using ONLY the provided data
2. If user asks about products, just say "Here are the products that match your criteria. You can view the details in the cards below."
3. If user asks about shipping/orders, format the response nicely with:
   - Use bullet points (•) for each order
   - Put each order on a new line with proper line breaks
   - Format: "• [Product Name] (Size [size], [Color], [Location]): [Status]. Expected delivery: [date]. Tracking: [number]. Shipping: [method]."
   - Group orders by status (Out for delivery, In transit, Shipped, Order confirmed)
   - Add a summary at the end
   - Use \n for line breaks between each bullet point
4. If user asks about return process, provide detailed steps from the FAQ data
5. If user asks about order cancellation, check shipping status first - only allow cancellation if status is "Order confirmed" or "Shipped" but not "In transit" or "Out for delivery"
6. If user asks about policies, give clear answers from the FAQ data ONLY
7. For order-related queries, always mention the specific order details if found in shipping data
8. DO NOT use web search results - use only the provided JSON data
9. Always be friendly and professional
10. If no relevant data found, say you don't have that information

Question: ${userInput}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Perplexity API error: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  // SIMPLE MESSAGE HANDLER - No complex logic needed
  const sendMessage = async (inputValue) => {
    if (inputValue.trim() === "") return;

    const userMessage = { text: inputValue, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // SMART FLEXIBLE MATCHING - Handle any user input variations
      const lowerCaseInput = inputValue.toLowerCase();
      const productMatches = product.filter((item) => {
        // Helper function to check if any word in input matches any word in target
        const smartMatch = (input, target) => {
          if (!target) return false;
          const inputWords = input.toLowerCase().split(/\s+/);
          const targetWords = target.toLowerCase().split(/\s+/);

          return inputWords.some((inputWord) =>
            targetWords.some(
              (targetWord) =>
                targetWord.includes(inputWord) ||
                inputWord.includes(targetWord) ||
                // Handle common variations
                (inputWord === "pant" && targetWord === "pants") ||
                (inputWord === "pants" && targetWord === "pant") ||
                (inputWord === "jean" && targetWord === "jeans") ||
                (inputWord === "jeans" && targetWord === "jean") ||
                (inputWord === "tee" && targetWord === "tees") ||
                (inputWord === "tees" && targetWord === "tee") ||
                (inputWord === "shirt" && targetWord === "shirts") ||
                (inputWord === "shirts" && targetWord === "shirt") ||
                // Pants/Jeans synonyms
                (inputWord === "pants" && targetWord === "jeans") ||
                (inputWord === "jeans" && targetWord === "pants") ||
                (inputWord === "pant" && targetWord === "jeans") ||
                (inputWord === "jean" && targetWord === "pants") ||
                (inputWord === "stripped" && targetWord === "striped") ||
                (inputWord === "striped" && targetWord === "stripped") ||
                // Formal style synonyms
                (inputWord === "formal" &&
                  (targetWord === "formal" ||
                    targetWord === "button" ||
                    targetWord === "chino")) ||
                (inputWord === "formal" && targetWord.includes("formal")) ||
                (inputWord === "formal" && targetWord.includes("button")) ||
                (inputWord === "formal" && targetWord.includes("chino")) ||
                // Skinny style synonyms
                (inputWord === "skinny" && targetWord.includes("skinny"))
            )
          );
        };

        // Smart matching for all attributes
        const categoryMatch = smartMatch(lowerCaseInput, item.category);
        const colorMatch = smartMatch(lowerCaseInput, item.color);
        const materialMatch = smartMatch(lowerCaseInput, item.material);
        const designMatch = smartMatch(lowerCaseInput, item.design);
        const styleMatch = smartMatch(lowerCaseInput, item.style);

        // Price filtering
        const priceMatch = lowerCaseInput.match(/under\s+(\d+)/);
        const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;
        const priceFilter = maxPrice ? item.price <= maxPrice : true;

        // Debug for first few items to see what's happening
        if (item.id === "10" || item.id === "30") {
          console.log(`\n--- Item ${item.name} Debug ---`);
          console.log("Category match:", categoryMatch, `(${item.category})`);
          console.log("Style match:", styleMatch, `(${item.style})`);
          console.log(
            "Price filter:",
            priceFilter,
            `(₹${item.price} <= ${maxPrice || "no limit"})`
          );
        }

        // Build criteria based on what user actually mentioned
        const criteria = [];

        // Check if user mentioned any category-related words
        const categoryWords = [
          "tee",
          "tees",
          "t-shirt",
          "shirt",
          "shirts",
          "pant",
          "pants",
          "jean",
          "jeans",
        ];

        // Special handling for jeans - if user specifically says "jeans", require exact category match
        if (
          lowerCaseInput.includes("jeans") ||
          lowerCaseInput.includes("jean")
        ) {
          const jeansMatch = item.category === "Jeans";
          criteria.push(jeansMatch);
        } else if (
          categoryWords.some((word) => lowerCaseInput.includes(word))
        ) {
          // For other categories, use the general category match
          criteria.push(categoryMatch);
        }

        // Check if user mentioned any color
        const colorWords = [
          "black",
          "white",
          "blue",
          "red",
          "green",
          "yellow",
          "gray",
          "pink",
          "purple",
          "orange",
          "brown",
        ];
        if (colorWords.some((word) => lowerCaseInput.includes(word))) {
          criteria.push(colorMatch);
        }

        // Check if user mentioned any design
        const designWords = [
          "plain",
          "graphic",
          "distressed",
          "solid",
          "classic",
          "striped",
          "stripped",
        ];
        if (designWords.some((word) => lowerCaseInput.includes(word))) {
          criteria.push(designMatch);
        }

        // Check if user mentioned any style
        const styleWords = [
          "crew",
          "v-neck",
          "slim",
          "straight",
          "button",
          "casual",
          "skinny",
          "boot",
          "regular",
          "relaxed",
          "chino",
          "formal",
          "skinny",
        ];
        if (styleWords.some((word) => lowerCaseInput.includes(word))) {
          // For formal styles, use exact matching instead of smartMatch
          if (lowerCaseInput.includes("formal")) {
            const exactFormalMatch =
              item.style.toLowerCase() === "formal" ||
              item.style.toLowerCase() === "button down" ||
              item.style.toLowerCase() === "chino";
            criteria.push(exactFormalMatch);
          } else {
            criteria.push(styleMatch);
          }
        }

        // Check if user mentioned any material
        const materialWords = ["cotton", "denim", "polyester"];
        if (materialWords.some((word) => lowerCaseInput.includes(word))) {
          criteria.push(materialMatch);
        }

        // Debug criteria for specific items
        if (item.id === "10" || item.id === "30") {
          console.log("Final criteria:", criteria);
          console.log(
            "All criteria true?",
            criteria.every((c) => c === true)
          );
        }

        // If no specific criteria mentioned, use OR logic for basic matching
        if (criteria.length === 0) {
          return (
            categoryMatch ||
            colorMatch ||
            materialMatch ||
            designMatch ||
            styleMatch
          );
        }

        // If user mentioned multiple criteria, be more strict about matching
        // For example, if they say "blue jeans under 1000", require ALL criteria
        const hasMultipleCriteria =
          criteria.length > 1 || (criteria.length === 1 && maxPrice);

        // Use AND logic - all mentioned criteria must be true
        // Also ensure price filter is always applied if mentioned
        const allCriteria = [...criteria];
        if (maxPrice) {
          allCriteria.push(priceFilter);
        }

        // If multiple criteria mentioned, require ALL to be true
        // If single criteria, be more flexible
        if (hasMultipleCriteria) {
          return allCriteria.every((criterion) => criterion === true);
        } else {
          return allCriteria.some((criterion) => criterion === true);
        }
      });

      // Debug: Log what we found
      console.log("=== SMART MATCHING DEBUG ===");
      console.log("Input:", inputValue);
      console.log("Product matches found:", productMatches.length);
      console.log(
        "Matches:",
        productMatches.map(
          (p) => `${p.name} - ${p.category} - ${p.style} - ₹${p.price}`
        )
      );

      // Debug: Check what should match for this specific query
      const testProducts = product.filter(
        (p) => p.category === "Pants" && p.price <= 1000
      );
      console.log(
        "Test products (Pants under 1000):",
        testProducts.map((p) => `${p.name} - ${p.style} - ₹${p.price}`)
      );

      // Check if this is an order/shipping related query or FAQ query
      const orderKeywords = [
        "order",
        "shipping",
        "delivery",
        "track",
        "cancel",
        "return",
        "refund",
        "status",
        "tracking",
        "ship",
        "shipped",
        "transit",
        "out for delivery",
        "expected",
        "when will",
        "where is",
        "my order",
        "order status",
        "delivery date",
        "tracking number",
      ];
      const faqKeywords = [
        "size guide",
        "size",
        "guide",
        "policy",
        "policies",
        "return policy",
        "shipping policy",
        "delivery policy",
        "refund",
        "exchange",
        "damaged",
        "support",
        "contact",
        "help",
        "faq",
        "question",
        "how to",
        "what is",
        "when can",
        "where can",
        "why",
        "how do",
        "do you",
        "can i",
        "is there",
        "are there",
        "what if",
        "how long",
        "how much",
        "cost",
        "price",
        "charge",
        "free",
        "discount",
        "promo",
        "code",
        "gift",
        "invoice",
        "gst",
        "payment",
        "method",
        "cash",
        "cod",
        "upi",
        "card",
        "banking",
        "wallet",
      ];
      const isOrderQuery = orderKeywords.some((keyword) =>
        lowerCaseInput.includes(keyword)
      );
      const isFaqQuery = faqKeywords.some((keyword) =>
        lowerCaseInput.includes(keyword)
      );

      // Get price filter for alternative suggestions
      const priceMatch = lowerCaseInput.match(/under\s+(\d+)/);
      const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;

      // If products are found and it's not an order/FAQ query, show product cards
      if (productMatches.length > 0 && !isOrderQuery && !isFaqQuery) {
        const botMessage = {
          text: "", // Empty text for product queries
          sender: "bot",
          products: productMatches,
        };
        setMessages((prev) => [...prev, botMessage]);
      } else if (!isOrderQuery && !isFaqQuery && productMatches.length === 0) {
        // No products found - show helpful message with alternatives
        let suggestionMessage =
          "Sorry, no products found matching your criteria.";

        // Check if user was looking for jeans specifically
        if (
          lowerCaseInput.includes("jeans") ||
          lowerCaseInput.includes("jean")
        ) {
          // Find similar pants as alternatives
          const alternativePants = product.filter(
            (item) =>
              item.category === "Pants" && item.price <= (maxPrice || 9999) // Use price filter if specified
          );

          if (alternativePants.length > 0) {
            suggestionMessage =
              "No jeans found matching your criteria. Here are some similar pants you might like:";
            const botMessage = {
              text: suggestionMessage,
              sender: "bot",
              products: alternativePants,
            };
            setMessages((prev) => [...prev, botMessage]);
          } else {
            suggestionMessage =
              "No jeans or pants found matching your criteria. Try adjusting your search terms or price range.";
            const botMessage = {
              text: suggestionMessage,
              sender: "bot",
              products: undefined,
            };
            setMessages((prev) => [...prev, botMessage]);
          }
        } else {
          // For other product queries, just show no results message
          const botMessage = {
            text: suggestionMessage,
            sender: "bot",
            products: undefined,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } else {
        // For order queries, FAQ queries, or non-product queries, get AI response and show it
        const botResponseText = await callPerplexityAPI(inputValue);
        const botMessage = {
          text: botResponseText,
          sender: "bot",
          products: undefined,
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("Error communicating with Perplexity API:", error);
      const errorMessage = {
        text: "Sorry, I'm having trouble understanding right now. Can you please rephrase?",
        sender: "bot",
      };
      setMessages((prev) => [...prev, errorMessage]);
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
      userMessages: messages.filter((msg) => msg.sender === "user").length,
      botMessages: messages.filter((msg) => msg.sender === "bot").length,
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
    <PerplexityContext.Provider value={value}>
      {children}
    </PerplexityContext.Provider>
  );
};
