import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PaperAirplaneIcon,
  SparklesIcon,
  XMarkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { aiChatService } from '../services/aiChat';
import HomeFooter from '../components/HomeFooter';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import GuestAccessDenied from '../components/GuestAccessDenied';
import { generateEventSlug } from '../utils/slugUtils';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showGuestAccessDenied, setShowGuestAccessDenied] = useState(false);
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
    if (isAIChatOpen && messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          content: "Hello! I'm your AI assistant. I can help you find amazing events based on your interests, location, and preferences. What kind of events are you looking for?",
          timestamp: new Date()
        }
      ]);
    }
  }, [isAIChatOpen, messages.length]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      // Start animation
      setIsAnimating(true);
      setInputMessage(searchQuery);
      
      // After animation completes, open AI chat
      setTimeout(() => {
        setIsAIChatOpen(true);
      }, 500); // Match the transition duration
    }
  };

  const handleAIChatClose = () => {
    setIsAIChatOpen(false);
    setMessages([]);
    setInputMessage('');
    // Reset animation state after a short delay
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

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
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use mock AI response for now (replace with real API when ready)
      const response = await aiChatService.mockAIResponse(currentMessage);
      
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
        handleAIChatClose();
        break;
      case 'Set preferences':
        navigate('/settings');
        handleAIChatClose();
        break;
      case 'Get notifications':
        navigate('/notifications');
        handleAIChatClose();
        break;
      default:
        break;
    }
  };

  // Handle recommendation click
  const handleRecommendationClick = (recommendation) => {
    navigate(`/events/${generateEventSlug(recommendation)}`);
    handleAIChatClose();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="home-page h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden" style={{ maxHeight: '100vh', overflowY: 'hidden' }}>
      {/* Hero Section */}
      <div className={`relative overflow-hidden flex items-center justify-center transition-all duration-500 ease-in-out ${
        isAnimating ? 'transform translate-y-[-20vh] opacity-0' : ''
      }`} style={{ height: 'calc(100vh - 80px)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-4">
          <div className="text-center">
            {/* Logo/Brand */}
            <div className={`mb-6 transition-all duration-500 ease-in-out ${
              isAnimating ? 'transform scale-75 opacity-0' : ''
            }`}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl brand-bilten text-primary-600 dark:text-primary-400 mb-2">
                Bilten
              </h1>
              <p className="text-sm text-gray-600 dark:text-white/90">
                {t('home.discover')}
              </p>
            </div>

            {/* AI Chat Form */}
            <form onSubmit={handleSearch} className={`mb-6 transition-all duration-500 ease-in-out ${
              isAnimating ? 'transform translate-y-[40vh] scale-90' : ''
            }`}>
              <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                <div className="flex items-center justify-between">
                  {/* AI Input */}
                  <div className="flex-1 flex items-center px-4 py-3">
                    <SparklesIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-3 rtl:ml-3 rtl:mr-0" />
                    <input
                      type="text"
                      placeholder={isAuthenticated ? t('home.askBilten') : t('home.loginToChat')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={(e) => {
                        // Navigate to login page for guest users when focusing on input
                        if (!isAuthenticated) {
                          e.preventDefault();
                          e.target.blur();
                          navigate('/login');
                        }
                      }}
                      className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                    />
                  </div>

                  {/* AI Chat Button - Positioned on right for LTR, left for RTL */}
                  <div className="flex-shrink-0">
                    {isAuthenticated ? (
                      <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2 px-4 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center space-x-1 rtl:space-x-3 rtl:flex-row-reverse"
                        disabled={!searchQuery.trim()}
                      >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{t('home.askBilten')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="bg-primary-600 hover:bg-primary-700 text-white rounded-full py-2 px-4 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center space-x-1 rtl:space-x-3 rtl:flex-row-reverse"
                      >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-xs font-medium">{t('auth.signin')}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Quick AI Prompts */}
            <div className={`mb-4 transition-all duration-500 ease-in-out ${
              isAnimating ? 'transform translate-y-[20vh] opacity-0' : ''
            }`}>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('home.tryAsking')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  t('home.technoEvents'),
                  t('home.melodicTechno'),
                  t('home.afroHouse'),
                  t('home.amrDiabConcerts'),
                  t('home.massarEgbari')
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Check if user is authenticated
                      if (!isAuthenticated) {
                        navigate('/login');
                        return;
                      }
                      
                      setSearchQuery(prompt);
                      setIsAnimating(true);
                      setTimeout(() => {
                        setIsAIChatOpen(true);
                      }, 500);
                    }}
                    className="px-3 py-1.5 text-xs bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-full border border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Action Buttons removed per request */}



          </div>
        </div>
      </div>



      {/* Integrated Chat Interface */}
      {isAIChatOpen && (
        <div className="fixed inset-0 z-30 bg-white dark:bg-gray-900 flex flex-col">
          {/* Floating Close Button */}
          <button
            onClick={handleAIChatClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 pb-36 space-y-6 max-w-4xl mx-auto w-full">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar */}
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    <span>B</span>
                  </div>
                )}
                
                <div
                  className={`max-w-2xl px-6 py-4 rounded-xl ${
                    message.type === 'user'
                      ? 'bg-primary-600 text-white'
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

                {/* User Avatar */}
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt="Profile"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span>{getUserInitials()}</span>
                    )}
                  </div>
                )}
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

          {/* Chat Input - Fixed position above footer */}
          <form onSubmit={handleSendMessage} className="fixed bottom-20 left-0 right-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-40">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-white/10 rounded-full shadow-lg border border-gray-200 dark:border-white/20 hover:shadow-xl transition-shadow duration-300 p-1.5">
                <div className="flex items-center justify-between">
                  {/* AI Input */}
                  <div className="flex-1 flex items-center px-4 py-3">
                    <SparklesIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-3 rtl:ml-3 rtl:mr-0" />
                    <input
                      type="text"
                      placeholder={isAuthenticated ? t('home.askBilten') : t('home.loginToChat')}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onFocus={(e) => {
                        // Navigate to login page for guest users when focusing on input
                        if (!isAuthenticated) {
                          e.preventDefault();
                          e.target.blur();
                          navigate('/login');
                        }
                      }}
                      className="flex-1 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-white/80 bg-transparent text-sm"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Send Button - Positioned on right for LTR, left for RTL */}
                  <div className="flex-shrink-0">
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isLoading}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full p-2 m-1.5 transition-colors duration-200 shadow-md hover:shadow-lg flex items-center space-x-1 rtl:space-x-3 rtl:flex-row-reverse"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Fixed Footer */}
      <HomeFooter />

      {/* Guest Access Denied Modal */}
      {showGuestAccessDenied && (
        <GuestAccessDenied
          title={t('guest.aiChatRestricted')}
          message={t('guest.aiChatRestrictedMessage')}
          onClose={() => setShowGuestAccessDenied(false)}
        />
      )}
    </div>
  );
};

export default Home;