import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  CalendarIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { aiChatService } from '../services/aiChat';
import { generateEventSlug } from '../utils/slugUtils';

const AIChat = ({ isOpen, onClose, initialMessage = '' }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Hello! I'm your AI assistant. I can help you find amazing events based on your interests, location, and preferences. What kind of events are you looking for?",
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Handle sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use mock AI response for now (replace with real API when ready)
      const response = await aiChatService.mockAIResponse(inputMessage);
      
      if (response.success) {
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: response.data.message,
          timestamp: new Date(),
          recommendations: response.data.recommendations || [],
          suggestedActions: response.data.suggestedActions || []
        };

        setMessages(prev => [...prev, aiMessage]);
        setRecommendations(response.data.recommendations || []);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = (action) => {
    switch (action) {
      case 'View all events':
        navigate('/events');
        onClose();
        break;
      case 'Set preferences':
        navigate('/settings');
        onClose();
        break;
      case 'Get notifications':
        navigate('/notifications');
        onClose();
        break;
      default:
        break;
    }
  };

  // Handle recommendation click
  const handleRecommendationClick = (recommendation) => {
    navigate(`/events/${generateEventSlug(recommendation)}`);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Full Page Chat Interface */}
      <div className="w-full h-full bg-white dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Assistant</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl px-6 py-4 rounded-xl ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white ml-auto'
                    : message.isError
                    ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-base leading-relaxed">{message.content}</p>
                
                                  {/* Recommendations */}
                  {message.recommendations && message.recommendations.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                        Recommended Events:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {message.recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            onClick={() => handleRecommendationClick(rec)}
                            className="p-4 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.title}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{rec.description}</p>
                              </div>
                              <div className="text-sm font-medium text-primary-600 dark:text-primary-400">{rec.price}</div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-500 dark:text-gray-400">{rec.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Suggested Actions */}
                {message.suggestedActions && message.suggestedActions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {message.suggestedActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickAction(action)}
                        className="px-4 py-2 text-sm bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/40 transition-colors font-medium"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  <span className="text-base text-gray-600 dark:text-gray-400">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="max-w-4xl mx-auto flex items-center space-x-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about events..."
              className="flex-1 px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChat;
