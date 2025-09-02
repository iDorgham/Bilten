# Bilten Frontend Setup

This is a React application built with Create React App and configured with Tailwind CSS for styling.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Header.js       # Navigation header
│   └── Footer.js       # Site footer
├── contexts/           # React contexts
│   └── AuthContext.js  # Authentication context
├── hooks/              # Custom React hooks
│   └── useLocalStorage.js
├── pages/              # Page components
│   ├── Home.js         # Landing page
│   ├── Events.js       # Events listing
│   ├── EventDetail.js  # Individual event view
│   ├── Login.js        # Login form
│   ├── Register.js     # Registration form
│   └── Dashboard.js    # User dashboard
├── services/           # API services
│   └── api.js          # Axios configuration
├── utils/              # Utility functions
│   └── helpers.js      # Common helper functions
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles with Tailwind
```

## Features

- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **Context API**: State management for authentication
- **Responsive Design**: Mobile-first approach
- **Modern React**: Using functional components and hooks

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001
```

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (not recommended)

## Dependencies

### Core Dependencies
- `react` - React library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing
- `axios` - HTTP client

### UI Dependencies
- `tailwindcss` - CSS framework
- `@heroicons/react` - Icon library

### Development Dependencies
- `react-scripts` - Create React App scripts
- `autoprefixer` - CSS autoprefixer
- `postcss` - CSS post-processor

## API Integration

The app is configured to work with the Bilten backend API. The API base URL can be configured via the `REACT_APP_API_URL` environment variable.

## Authentication

The app uses JWT tokens for authentication, stored in localStorage. The AuthContext provides login, register, and logout functionality.

## Styling

The app uses Tailwind CSS for styling. The configuration is in `tailwind.config.js` and global styles are in `src/index.css`.

## Deployment

The app can be deployed to any static hosting service (Netlify, Vercel, etc.) by running `npm run build` and serving the `build` directory.
