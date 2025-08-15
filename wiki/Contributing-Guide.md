# 🤝 Contributing Guide

Thank you for your interest in contributing to Bilten! This guide will help you get started with contributing to the project.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## 🚀 Getting Started

### Before You Begin

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see [Installation Guide](Installation-Guide))
4. **Create a feature branch** for your changes

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/Bilten.git
cd Bilten

# Add upstream remote
git remote add upstream https://github.com/iDorgham/Bilten.git

# Create feature branch
git checkout -b feature/your-feature-name
```

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix issues and improve stability
- ✨ **New features** - Add new functionality
- 📚 **Documentation** - Improve docs and guides
- 🧪 **Tests** - Add or improve test coverage
- 🎨 **UI/UX improvements** - Enhance user experience
- 🔧 **Refactoring** - Improve code quality
- 🌐 **Translations** - Add new languages
- 📊 **Performance** - Optimize performance

## 🔧 Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Git

### Local Development

```bash
# Install dependencies
npm install
cd bilten-frontend && npm install && cd ..
cd bilten-scanner && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d postgres redis

# Run migrations and seed
npm run migrate
npm run seed

# Start development servers
npm run dev
cd bilten-frontend && npm start
cd bilten-scanner && npm run dev
```

### Development Tools

We use several tools to maintain code quality:

```bash
# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format

# Type checking (if using TypeScript)
npm run type-check

# Testing
npm test
npm run test:watch
npm run test:coverage
```

## 📝 Code Style

### General Guidelines

1. **Follow existing patterns** in the codebase
2. **Write self-documenting code** with clear variable names
3. **Add comments** for complex logic
4. **Keep functions small** and focused
5. **Use meaningful commit messages**

### JavaScript/Node.js

```javascript
// Use ES6+ features
const { destructuring } = require('module');
import { namedImport } from 'module';

// Use async/await instead of callbacks
async function fetchData() {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch data:', error);
    throw error;
  }
}

// Use descriptive variable names
const userProfile = await getUserProfile(userId);
const eventTickets = await getEventTickets(eventId);

// Add JSDoc comments for functions
/**
 * Creates a new event with the provided data
 * @param {Object} eventData - The event data
 * @param {string} eventData.title - Event title
 * @param {string} eventData.description - Event description
 * @returns {Promise<Object>} The created event
 */
async function createEvent(eventData) {
  // Implementation
}
```

### React Components

```jsx
// Use functional components with hooks
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const EventCard = ({ event, onSelect }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onSelect(event);
    } catch (error) {
      console.error('Failed to select event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <button 
        onClick={handleClick}
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : 'Select Event'}
      </button>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default EventCard;
```

### Database Migrations

```javascript
// Use descriptive migration names
exports.up = function(knex) {
  return knex.schema.createTable('user_profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users');
    table.string('bio', 500);
    table.string('avatar_url');
    table.timestamps(true, true);
    
    // Add indexes for performance
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_profiles');
};
```

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
```
feat(auth): add OAuth2 support for Google login
fix(events): resolve timezone display issue
docs(api): update authentication endpoints
test(orders): add integration tests for checkout flow
refactor(components): extract reusable EventCard component
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## 🧪 Testing

### Writing Tests

We use Jest for testing. Write tests for:

1. **Unit tests** for individual functions
2. **Integration tests** for API endpoints
3. **Component tests** for React components
4. **E2E tests** for complete user flows

### Test Structure

```javascript
// Unit test example
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const user = await UserService.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      await expect(UserService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### API Testing

```javascript
// Integration test example
describe('POST /v1/auth/register', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith'
    };

    const response = await request(app)
      .post('/v1/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.tokens).toHaveProperty('accessToken');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=user.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create user"
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure tests pass** locally
2. **Update documentation** if needed
3. **Follow code style** guidelines
4. **Test your changes** thoroughly

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Create a PR** against the main branch
3. **Fill out the PR template** completely
4. **Link related issues** if applicable

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** and make changes
4. **Get approval** from at least one maintainer
5. **Merge** when ready

## 🐛 Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g. Windows 10]
- Browser: [e.g. Chrome 90]
- Version: [e.g. 1.0.0]

## Additional Context
Screenshots, logs, etc.
```

### Feature Requests

Use the feature request template:

```markdown
## Feature Description
Clear description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should it work?

## Alternatives Considered
Other approaches you considered

## Additional Context
Screenshots, mockups, etc.
```

## 👥 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please:

- **Be respectful** and inclusive
- **Use welcoming language**
- **Be collaborative**
- **Give and receive constructive feedback**
- **Focus on what is best for the community**

### Communication

- **GitHub Issues** for bug reports and feature requests
- **GitHub Discussions** for questions and general discussion
- **Pull Requests** for code contributions
- **Discord/Slack** for real-time communication (if available)

### Getting Help

1. **Check existing issues** and discussions
2. **Search documentation** thoroughly
3. **Ask in discussions** with clear context
4. **Be patient** with responses

## 🏆 Recognition

Contributors are recognized in several ways:

- **Contributors list** in README
- **Release notes** for significant contributions
- **Special thanks** for major features
- **Contributor badges** on GitHub profile

## 📚 Resources

- [Installation Guide](Installation-Guide)
- [API Documentation](API-Documentation)
- [Development Guide](Development-Guide)
- [Testing Guide](Testing-Guide)
- [Code Style Guide](Code-Style-Guide)

## 🎯 Getting Started Checklist

- [ ] Fork the repository
- [ ] Set up development environment
- [ ] Read the codebase
- [ ] Pick an issue to work on
- [ ] Create a feature branch
- [ ] Make your changes
- [ ] Write tests
- [ ] Submit a pull request

---

**Thank you for contributing to Bilten!** 🎉

Your contributions help make Bilten better for everyone. If you have any questions, don't hesitate to ask in our [Discussions](https://github.com/iDorgham/Bilten/discussions) or create an issue.
