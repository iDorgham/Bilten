# Testing Guide

This guide covers testing strategies, setup, and best practices for the EventChain project.

## Testing Strategy

### Test Pyramid
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test service interactions and API endpoints
- **End-to-End Tests**: Test complete user workflows

### Coverage Goals
- Minimum 80% code coverage for critical paths
- 100% coverage for security-related functions
- All API endpoints must have integration tests

## Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Test database instance

### Environment Setup
```bash
# Copy test environment variables
cp .env.example .env.test

# Start test services
docker-compose -f docker/docker-compose.test.yml up -d

# Install dependencies
npm install
```

## Running Tests

### Frontend Tests
```bash
cd frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:e2e          # End-to-end tests
```

### Backend Services Tests
```bash
cd api-gateway
npm test                    # Unit and integration tests
npm run test:integration   # Integration tests only

cd services/event-service
npm test

cd services/order-service
npm test
```

### Database Tests
```bash
# Run database migration tests
npm run test:db-migrations

# Test database seeding
npm run test:db-seed
```

## Test Structure

### Frontend Testing
- **Components**: Use React Testing Library
- **Hooks**: Use React Hooks Testing Library
- **Pages**: Integration tests with mock API
- **E2E**: Playwright for user workflows

```javascript
// Example component test
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';

describe('EventCard', () => {
  it('displays event information correctly', () => {
    const mockEvent = {
      id: '1',
      title: 'Test Event',
      date: '2024-01-01'
    };
    
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });
});
```

### Backend Testing
- **Unit Tests**: Jest for business logic
- **Integration Tests**: Supertest for API endpoints
- **Database Tests**: Test database with transactions

```javascript
// Example API test
import request from 'supertest';
import app from '../app';

describe('POST /api/events', () => {
  it('creates a new event', async () => {
    const eventData = {
      title: 'Test Event',
      date: '2024-01-01',
      venue: 'Test Venue'
    };
    
    const response = await request(app)
      .post('/api/events')
      .send(eventData)
      .expect(201);
      
    expect(response.body.title).toBe('Test Event');
  });
});
```

## Test Data Management

### Fixtures
- Use consistent test data across tests
- Store fixtures in `__fixtures__` directories
- Use factories for generating test data

### Database Testing
- Use transactions for test isolation
- Reset database state between tests
- Use separate test database

## Mocking Guidelines

### External Services
- Mock third-party APIs
- Use MSW (Mock Service Worker) for HTTP mocking
- Mock payment processors and email services

### Database Mocking
- Use in-memory database for unit tests
- Use test database for integration tests
- Mock database connections for isolated tests

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled nightly runs

### Test Reports
- Coverage reports uploaded to Codecov
- Test results displayed in PR comments
- Performance benchmarks tracked

## Best Practices

### Writing Tests
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Test edge cases and error conditions
- Keep tests independent and isolated

### Test Organization
- Group related tests in describe blocks
- Use beforeEach/afterEach for setup/cleanup
- Separate unit, integration, and e2e tests

### Performance Testing
- Use Jest performance testing for critical paths
- Monitor test execution time
- Optimize slow tests

## Debugging Tests

### Common Issues
- Async/await timing issues
- Database connection problems
- Mock configuration errors
- Environment variable conflicts

### Debugging Tools
- Use `--verbose` flag for detailed output
- Add `console.log` statements for debugging
- Use debugger breakpoints in IDE
- Check test database state

## Test Maintenance

### Regular Tasks
- Update test dependencies
- Review and update test data
- Remove obsolete tests
- Refactor duplicate test code

### Monitoring
- Track test execution time
- Monitor test flakiness
- Review coverage reports
- Update test documentation