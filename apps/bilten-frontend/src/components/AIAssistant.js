import React, { useState } from 'react';

const AIAssistant = ({ onSearch, isVisible, onClose }) => {
  const [input, setInput] = useState('');

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    onSearch(message);
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">AI Event Assistant</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600 mb-3">How can I help you find events?</p>
          <div className="space-y-2">
            {[
              "Find events near me",
              "Show me concerts this weekend", 
              "What's happening tonight?",
              "Find family-friendly events"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion)}
                className="w-full text-left p-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
            placeholder="Or type your own query..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleSendMessage(input)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
