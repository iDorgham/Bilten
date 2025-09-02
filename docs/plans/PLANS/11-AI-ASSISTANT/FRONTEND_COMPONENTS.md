# Frontend Components - AI Assistant

## Overview

This document outlines the frontend components used in the AI Assistant implementation, including the home page integration, AI assistant modal, and related UI components.

## Core Components

### 1. Home Page (Home.js)

**Location**: `apps/bilten-frontend/src/pages/Home.js`

**Purpose**: Main landing page with Google-style design and AI assistant integration

**Key Features**:
- Google-inspired minimalist design
- Large, centered search bar
- AI assistant button integration
- Quick action buttons
- Smart suggestions
- Responsive design

**Component Structure**:
```jsx
const Home = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header>...</header>
      
      {/* Main Content */}
      <main>
        {/* Logo */}
        <div>...</div>
        
        {/* Search Box */}
        <div>
          <input placeholder="Ask AI to help you find events..." />
          <AIAssistantButton />
          <SearchButton />
        </div>
        
        {/* Quick Actions */}
        <div>...</div>
        
        {/* AI Features */}
        <div>...</div>
      </main>
      
      {/* Footer */}
      <footer>...</footer>
      
      {/* AI Assistant Modal */}
      <AIAssistant />
    </div>
  );
};
```

### 2. AI Assistant Modal (AIAssistant.js)

**Location**: `apps/bilten-frontend/src/components/AIAssistant.js`

**Purpose**: Conversational interface for AI-powered event discovery

**Key Features**:
- Modal overlay design
- Quick suggestion buttons
- Custom input field
- Responsive layout
- Clean, modern UI

**Component Structure**:
```jsx
const AIAssistant = ({ onSearch, isVisible, onClose }) => {
  const [input, setInput] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3>AI Event Assistant</h3>
          <CloseButton />
        </div>
        
        {/* Quick Suggestions */}
        <div className="mb-4">
          <p>How can I help you find events?</p>
          <div className="space-y-2">
            {suggestions.map(suggestion => (
              <SuggestionButton key={suggestion} />
            ))}
          </div>
        </div>
        
        {/* Input Area */}
        <div className="flex space-x-2">
          <input placeholder="Or type your own query..." />
          <SearchButton />
        </div>
      </div>
    </div>
  );
};
```

### 3. Search Bar Integration

**Features**:
- Large, prominent search input
- AI assistant button with icon
- Loading states
- Dynamic suggestions
- Auto-focus functionality

**Implementation**:
```jsx
// Search box with AI integration
<div className="relative">
  <input
    type="text"
    value={query}
    onChange={handleInputChange}
    placeholder="Ask AI to help you find events..."
    className="w-full max-w-2xl px-6 py-4 text-lg border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    autoFocus
  />
  
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
    <AIAssistantButton onClick={() => setShowAIAssistant(true)} />
    <SearchButton />
  </div>
</div>
```

### 4. Quick Action Buttons

**Purpose**: Pre-defined search queries for common use cases

**Implementation**:
```jsx
const quickActions = [
  'Find events near me',
  'Show me concerts this weekend',
  'Find family-friendly events',
  'What events are free today'
];

<div className="flex flex-wrap justify-center gap-4 mb-8">
  {quickActions.map(action => (
    <button
      key={action}
      onClick={() => setQuery(action)}
      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
    >
      {action}
    </button>
  ))}
</div>
```

## Styling & Design

### Design System
- **Colors**: Blue primary (#3B82F6), gray neutrals
- **Typography**: Clean, readable fonts
- **Spacing**: Consistent padding and margins
- **Shadows**: Subtle shadows for depth
- **Border Radius**: Rounded corners for modern look

### Responsive Design
- **Mobile**: Stacked layout, full-width components
- **Tablet**: Adjusted spacing and sizing
- **Desktop**: Optimal layout with proper spacing

### Animation & Transitions
- **Hover Effects**: Smooth color transitions
- **Loading States**: Spinner animations
- **Modal Transitions**: Fade in/out effects
- **Button Interactions**: Scale and color changes

## State Management

### Local State
```jsx
const [query, setQuery] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [showAIAssistant, setShowAIAssistant] = useState(false);
```

### Event Handlers
```jsx
const handleSearch = (e) => {
  e.preventDefault();
  // Process search query
};

const handleInputChange = (e) => {
  setQuery(e.target.value);
  // Generate suggestions
};

const handleAISearch = (aiQuery) => {
  setQuery(aiQuery);
  // Process AI query
};
```

## Integration Points

### App.js Integration
```jsx
// Route for AI assistant callback
<Route path="/oauth/callback" element={<OAuthCallback />} />

// Conditional header/footer rendering
{!isHomePage && <Header />}
{!isHomePage && <Footer />}
```

### Home Page Integration
The AI Assistant is fully integrated into the home page (`apps/bilten-frontend/src/pages/Home.js`) with the following features:

#### Search Bar with AI Integration
```jsx
// Main search input with AI assistant button
<div className="relative">
  <input
    type="text"
    value={query}
    onChange={handleInputChange}
    placeholder="Ask AI to help you find events..."
    className="w-full max-w-2xl px-6 py-4 text-lg border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    autoFocus
  />
  
  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
    <button
      type="button"
      onClick={() => setShowAIAssistant(true)}
      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
      title="AI Assistant"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.802 8.249 16 9.1 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.796a4.002 4.002 0 01-.041-2.08l-.08.08-1.53-1.533A5.98 5.98 0 004 10c0 .954.223 1.856.619 2.657l1.54-1.54zm1.088-6.45A5.974 5.974 0 0110 4c.954 0 1.856.223 2.657.619l-1.54 1.54a4.002 4.002 0 00-2.346.033L7.246 4.668zM12 10a2 2 0 11-4 0 2 2 0 014 0z" clipRule="evenodd" />
      </svg>
    </button>
    <SearchButton />
  </div>
</div>
```

#### Quick Action Buttons
```jsx
// Pre-defined search buttons for common queries
<div className="flex flex-wrap justify-center gap-4 mb-8">
  <button
    onClick={() => setQuery('Find events near me')}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
  >
    Events near me
  </button>
  <button
    onClick={() => setQuery('Show me concerts this weekend')}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
  >
    Concerts this weekend
  </button>
  <button
    onClick={() => setQuery('Find family-friendly events')}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
  >
    Family events
  </button>
  <button
    onClick={() => setQuery('What events are free today')}
    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors text-sm"
  >
    Free events
  </button>
</div>
```

#### AI Assistant Modal Integration
```jsx
// AI Assistant modal at the bottom of the home page
<AIAssistant
  isVisible={showAIAssistant}
  onClose={() => setShowAIAssistant(false)}
  onSearch={handleAISearch}
/>
```

#### State Management for Home Page
```jsx
// Home page state management
const [query, setQuery] = useState('');
const [isSearching, setIsSearching] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [showAIAssistant, setShowAIAssistant] = useState(false);

// Event handlers
const handleSearch = (e) => {
  e.preventDefault();
  setIsSearching(true);
  // Process search query and navigate to results
  navigate(`/events?search=${encodeURIComponent(query)}`);
};

const handleInputChange = (e) => {
  setQuery(e.target.value);
  // Generate AI suggestions based on input
  generateSuggestions(e.target.value);
};

const handleAISearch = (aiQuery) => {
  setQuery(aiQuery);
  setShowAIAssistant(false);
  // Process AI query and navigate to results
  navigate(`/events?search=${encodeURIComponent(aiQuery)}`);
};
```

#### Google-Style Layout Structure
```jsx
// Complete home page structure
<div className="min-h-screen bg-white flex flex-col">
  {/* Header with navigation */}
  <header className="flex justify-end p-4">
    <nav className="flex items-center space-x-4 text-sm">
      <Link to="/events">Events</Link>
      <Link to="/login">Sign in</Link>
      <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md">
        Get Started
      </Link>
    </nav>
  </header>

  {/* Main content area */}
  <main className="flex-grow flex flex-col items-center justify-center px-4">
    <div className="text-center max-w-2xl w-full">
      {/* Logo and branding */}
      <div className="mb-8">
        <h1 className="text-6xl font-bold text-gray-800 mb-2">Bilten</h1>
        <p className="text-xl text-gray-600">AI-Powered Event Discovery</p>
      </div>

      {/* Search box with AI integration */}
      <div className="mb-8">
        {/* Search input and AI assistant button */}
      </div>

      {/* Quick action buttons */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        {/* Quick action buttons */}
      </div>

      {/* AI features description */}
      <div className="text-center">
        <p className="text-gray-600 mb-4">
          Powered by AI to understand your preferences and find the perfect events
        </p>
        <div className="flex justify-center space-x-8 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Smart Recommendations
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Natural Language Search
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Personalized Results
          </div>
        </div>
      </div>
    </div>
  </main>

  {/* Footer */}
  <footer className="p-4 text-center text-sm text-gray-500">
    <div className="flex justify-center space-x-6 mb-2">
      <Link to="/about" className="hover:text-gray-700">About</Link>
      <Link to="/help" className="hover:text-gray-700">Help</Link>
      <Link to="/privacy" className="hover:text-gray-700">Privacy</Link>
      <Link to="/terms" className="hover:text-gray-700">Terms</Link>
    </div>
    <p>&copy; 2024 Bilten. All rights reserved.</p>
  </footer>

  {/* AI Assistant Modal */}
  <AIAssistant
    isVisible={showAIAssistant}
    onClose={() => setShowAIAssistant(false)}
    onSearch={handleAISearch}
  />
</div>
```

### Navigation
- **Home Page**: Main AI assistant interface
- **Events Page**: Search results display
- **Event Details**: Individual event information
- **Dashboard**: User account management

## Performance Considerations

### Optimization
- **Lazy Loading**: Load components on demand
- **Memoization**: Prevent unnecessary re-renders
- **Debouncing**: Limit API calls for suggestions
- **Image Optimization**: Compress and optimize images

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels
- **Focus Management**: Logical tab order
- **Color Contrast**: WCAG compliant colors

## Testing Strategy

### Unit Tests
```jsx
describe('Home Component', () => {
  test('renders search bar', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText(/ask ai/i)).toBeInTheDocument();
  });
  
  test('shows AI assistant modal when button clicked', () => {
    render(<Home />);
    fireEvent.click(screen.getByTitle(/ai assistant/i));
    expect(screen.getByText(/ai event assistant/i)).toBeInTheDocument();
  });
});
```

### Integration Tests
- Search functionality
- AI assistant modal
- Quick action buttons
- Responsive design

### User Testing
- Usability testing
- A/B testing
- Performance testing
- Accessibility testing

## Future Enhancements

### Planned Features
- **Voice Input**: Speech-to-text integration
- **Advanced Suggestions**: ML-powered suggestions
- **Personalization**: User preference learning
- **Multi-language**: Internationalization support

### Technical Improvements
- **TypeScript**: Full type safety
- **Performance**: Further optimization
- **Testing**: Comprehensive test coverage
- **Documentation**: Enhanced component docs

---

**Last Updated**: January 2024  
**Version**: 1.0.0  
**Status**: Implemented
