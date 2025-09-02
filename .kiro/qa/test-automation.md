# Test Automation Guide

This guide provides comprehensive information on implementing and maintaining automated testing for the EventChain platform.

## Automation Framework Architecture

### Framework Overview
```
Test Automation Architecture
├── Unit Tests (Jest/Mocha)
├── Integration Tests (Supertest/Jest)
├── API Tests (Postman/Newman)
├── E2E Tests (Playwright/Cypress)
├── Performance Tests (Artillery/k6)
├── Security Tests (OWASP ZAP)
└── Mobile Tests (Appium/Detox)
```

### Technology Stack
- **Frontend Testing**: Jest, React Testing Library, Playwright
- **Backend Testing**: Jest, Supertest, Mocha, Chai
- **API Testing**: Postman, Newman, REST Assured
- **E2E Testing**: Playwright, Cypress
- **Performance Testing**: Artillery, k6, JMeter
- **Mobile Testing**: Appium, Detox
- **CI/CD Integration**: GitHub Actions, Jenkins

## Unit Test Automation

### Frontend Unit Testing

#### React Component Testing
```javascript
// components/__tests__/EventCard.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from '../EventCard';

describe('EventCard Component', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    date: '2024-12-01T18:00:00Z',
    venue: 'Test Venue',
    price: 50,
    image: 'test-image.jpg'
  };

  it('renders event information correctly', () => {
    render(<EventCard event={mockEvent} />);
    
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
    expect(screen.getByText('$50')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button', { name: /view details/i }));
    
    expect(mockOnClick).toHaveBeenCalledWith(mockEvent.id);
  });

  it('displays loading state', () => {
    render(<EventCard event={mockEvent} loading={true} />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

#### Custom Hook Testing
```javascript
// hooks/__tests__/useEventData.test.js
import { renderHook, act } from '@testing-library/react';
import { useEventData } from '../useEventData';
import * as api from '../../services/api';

jest.mock('../../services/api');

describe('useEventData Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches event data successfully', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1' },
      { id: '2', title: 'Event 2' }
    ];
    
    api.getEvents.mockResolvedValue(mockEvents);

    const { result } = renderHook(() => useEventData());

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.error).toBeNull();
  });

  it('handles fetch errors', async () => {
    const mockError = new Error('API Error');
    api.getEvents.mockRejectedValue(mockError);

    const { result } = renderHook(() => useEventData());

    await act(async () => {
      await result.current.fetchEvents();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.events).toEqual([]);
    expect(result.current.error).toBe(mockError.message);
  });
});
```

### Backend Unit Testing

#### Service Layer Testing
```javascript
// services/__tests__/eventService.test.js
const EventService = require('../eventService');
const Event = require('../../models/Event');

jest.mock('../../models/Event');

describe('EventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('creates event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2024-12-01T18:00:00Z',
        venue: 'Test Venue'
      };

      const mockEvent = { id: '1', ...eventData };
      Event.create.mockResolvedValue(mockEvent);

      const result = await EventService.createEvent(eventData);

      expect(Event.create).toHaveBeenCalledWith(eventData);
      expect(result).toEqual(mockEvent);
    });

    it('throws error for invalid data', async () => {
      const invalidData = { title: '' };

      await expect(EventService.createEvent(invalidData))
        .rejects.toThrow('Event title is required');
    });
  });

  describe('getEventById', () => {
    it('returns event when found', async () => {
      const mockEvent = { id: '1', title: 'Test Event' };
      Event.findById.mockResolvedValue(mockEvent);

      const result = await EventService.getEventById('1');

      expect(Event.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockEvent);
    });

    it('throws error when event not found', async () => {
      Event.findById.mockResolvedValue(null);

      await expect(EventService.getEventById('999'))
        .rejects.toThrow('Event not found');
    });
  });
});
```

#### Controller Testing
```javascript
// controllers/__tests__/eventController.test.js
const request = require('supertest');
const app = require('../../app');
const EventService = require('../../services/eventService');

jest.mock('../../services/eventService');

describe('Event Controller', () => {
  describe('POST /api/events', () => {
    it('creates event successfully', async () => {
      const eventData = {
        title: 'Test Event',
        description: 'Test Description',
        date: '2024-12-01T18:00:00Z',
        venue: 'Test Venue'
      };

      const mockEvent = { id: '1', ...eventData };
      EventService.createEvent.mockResolvedValue(mockEvent);

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      expect(response.body).toEqual(mockEvent);
      expect(EventService.createEvent).toHaveBeenCalledWith(eventData);
    });

    it('returns 400 for invalid data', async () => {
      const invalidData = { title: '' };
      EventService.createEvent.mockRejectedValue(new Error('Event title is required'));

      const response = await request(app)
        .post('/api/events')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Event title is required');
    });
  });

  describe('GET /api/events/:id', () => {
    it('returns event when found', async () => {
      const mockEvent = { id: '1', title: 'Test Event' };
      EventService.getEventById.mockResolvedValue(mockEvent);

      const response = await request(app)
        .get('/api/events/1')
        .expect(200);

      expect(response.body).toEqual(mockEvent);
    });

    it('returns 404 when event not found', async () => {
      EventService.getEventById.mockRejectedValue(new Error('Event not found'));

      await request(app)
        .get('/api/events/999')
        .expect(404);
    });
  });
});
```

## Integration Test Automation

### API Integration Testing

#### Database Integration Tests
```javascript
// tests/integration/eventAPI.test.js
const request = require('supertest');
const app = require('../../app');
const { setupTestDB, cleanupTestDB, seedTestData } = require('../helpers/database');

describe('Event API Integration', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  beforeEach(async () => {
    await seedTestData();
  });

  describe('Event CRUD Operations', () => {
    it('should create, read, update, and delete event', async () => {
      // Create
      const eventData = {
        title: 'Integration Test Event',
        description: 'Test Description',
        date: '2024-12-01T18:00:00Z',
        venue: 'Test Venue',
        capacity: 100
      };

      const createResponse = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(201);

      const eventId = createResponse.body.id;
      expect(createResponse.body.title).toBe(eventData.title);

      // Read
      const readResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(readResponse.body.title).toBe(eventData.title);

      // Update
      const updateData = { title: 'Updated Event Title' };
      const updateResponse = await request(app)
        .put(`/api/events/${eventId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.title).toBe(updateData.title);

      // Delete
      await request(app)
        .delete(`/api/events/${eventId}`)
        .expect(204);

      // Verify deletion
      await request(app)
        .get(`/api/events/${eventId}`)
        .expect(404);
    });
  });

  describe('Event Search and Filtering', () => {
    it('should filter events by category', async () => {
      const response = await request(app)
        .get('/api/events?category=music')
        .expect(200);

      expect(response.body.events).toBeInstanceOf(Array);
      response.body.events.forEach(event => {
        expect(event.category).toBe('music');
      });
    });

    it('should search events by title', async () => {
      const response = await request(app)
        .get('/api/events?search=concert')
        .expect(200);

      expect(response.body.events).toBeInstanceOf(Array);
      response.body.events.forEach(event => {
        expect(event.title.toLowerCase()).toContain('concert');
      });
    });
  });
});
```

#### Third-Party Service Integration
```javascript
// tests/integration/paymentService.test.js
const PaymentService = require('../../services/paymentService');
const { mockStripe } = require('../mocks/stripe');

describe('Payment Service Integration', () => {
  beforeEach(() => {
    mockStripe.reset();
  });

  it('should process payment successfully', async () => {
    const paymentData = {
      amount: 5000, // $50.00
      currency: 'usd',
      paymentMethodId: 'pm_card_visa',
      customerId: 'cus_test123'
    };

    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_test123',
      status: 'succeeded',
      amount: paymentData.amount
    });

    const result = await PaymentService.processPayment(paymentData);

    expect(result.success).toBe(true);
    expect(result.paymentIntentId).toBe('pi_test123');
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: paymentData.amount,
      currency: paymentData.currency,
      payment_method: paymentData.paymentMethodId,
      customer: paymentData.customerId,
      confirm: true
    });
  });

  it('should handle payment failures', async () => {
    const paymentData = {
      amount: 5000,
      currency: 'usd',
      paymentMethodId: 'pm_card_declined',
      customerId: 'cus_test123'
    };

    mockStripe.paymentIntents.create.mockRejectedValue({
      type: 'card_error',
      code: 'card_declined',
      message: 'Your card was declined.'
    });

    const result = await PaymentService.processPayment(paymentData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Your card was declined.');
  });
});
```

## End-to-End Test Automation

### Playwright E2E Testing

#### Page Object Model
```javascript
// tests/e2e/pages/EventPage.js
class EventPage {
  constructor(page) {
    this.page = page;
    this.eventTitle = '[data-testid=event-title]';
    this.eventDescription = '[data-testid=event-description]';
    this.buyTicketsButton = '[data-testid=buy-tickets]';
    this.ticketQuantity = '[data-testid=ticket-quantity]';
    this.checkoutButton = '[data-testid=checkout-button]';
  }

  async goto(eventId) {
    await this.page.goto(`/events/${eventId}`);
  }

  async getEventTitle() {
    return await this.page.textContent(this.eventTitle);
  }

  async buyTickets(quantity = 1) {
    await this.page.click(this.buyTicketsButton);
    await this.page.selectOption(this.ticketQuantity, quantity.toString());
    await this.page.click(this.checkoutButton);
  }

  async waitForEventToLoad() {
    await this.page.waitForSelector(this.eventTitle);
  }
}

module.exports = { EventPage };
```

#### E2E Test Scenarios
```javascript
// tests/e2e/eventBooking.spec.js
const { test, expect } = require('@playwright/test');
const { EventPage } = require('./pages/EventPage');
const { CheckoutPage } = require('./pages/CheckoutPage');
const { LoginPage } = require('./pages/LoginPage');

test.describe('Event Booking Flow', () => {
  let eventPage;
  let checkoutPage;
  let loginPage;

  test.beforeEach(async ({ page }) => {
    eventPage = new EventPage(page);
    checkoutPage = new CheckoutPage(page);
    loginPage = new LoginPage(page);
  });

  test('should complete full booking flow', async ({ page }) => {
    // Login
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');

    // Navigate to event
    await eventPage.goto('test-event-123');
    await eventPage.waitForEventToLoad();

    // Verify event details
    const eventTitle = await eventPage.getEventTitle();
    expect(eventTitle).toBe('Test Concert Event');

    // Purchase tickets
    await eventPage.buyTickets(2);

    // Complete checkout
    await checkoutPage.waitForCheckoutToLoad();
    await checkoutPage.fillPaymentDetails({
      cardNumber: '4242424242424242',
      expiryDate: '12/25',
      cvc: '123',
      name: 'Test User'
    });

    await checkoutPage.submitPayment();

    // Verify success
    await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    await expect(page.locator('[data-testid=confirmation-number]')).toBeVisible();
  });

  test('should handle sold out events', async ({ page }) => {
    await eventPage.goto('sold-out-event-456');
    await eventPage.waitForEventToLoad();

    await expect(page.locator('[data-testid=sold-out-message]')).toBeVisible();
    await expect(page.locator('[data-testid=buy-tickets]')).toBeDisabled();
  });

  test('should validate payment form', async ({ page }) => {
    await loginPage.goto();
    await loginPage.login('user@example.com', 'password123');

    await eventPage.goto('test-event-123');
    await eventPage.buyTickets(1);

    await checkoutPage.waitForCheckoutToLoad();
    await checkoutPage.submitPayment(); // Submit without filling form

    // Verify validation errors
    await expect(page.locator('[data-testid=card-number-error]')).toBeVisible();
    await expect(page.locator('[data-testid=expiry-error]')).toBeVisible();
    await expect(page.locator('[data-testid=cvc-error]')).toBeVisible();
  });
});
```

### Cross-Browser Testing
```javascript
// playwright.config.js
module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
};
```

## API Test Automation

### Postman Collection Automation

#### Collection Structure
```json
{
  "info": {
    "name": "EventChain API Tests",
    "description": "Automated API tests for EventChain platform"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "{{$randomUUID}}"
    },
    {
      "key": "authToken",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Login successful', function () {",
                  "    pm.response.to.have.status(200);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.token).to.be.a('string');",
                  "    pm.collectionVariables.set('authToken', response.token);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["api", "auth", "login"]
            }
          }
        }
      ]
    },
    {
      "name": "Events",
      "item": [
        {
          "name": "Create Event",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test('Event created successfully', function () {",
                  "    pm.response.to.have.status(201);",
                  "    const response = pm.response.json();",
                  "    pm.expect(response.id).to.be.a('string');",
                  "    pm.expect(response.title).to.eql('API Test Event');",
                  "    pm.collectionVariables.set('eventId', response.id);",
                  "});"
                ]
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"title\": \"API Test Event\",\n  \"description\": \"Test event created via API\",\n  \"date\": \"2024-12-01T18:00:00Z\",\n  \"venue\": \"Test Venue\",\n  \"capacity\": 100\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/api/events",
              "host": ["{{baseUrl}}"],
              "path": ["api", "events"]
            }
          }
        }
      ]
    }
  ]
}
```

#### Newman CLI Integration
```bash
#!/bin/bash
# scripts/run-api-tests.sh

# Install Newman if not already installed
npm install -g newman

# Run API tests
newman run tests/api/EventChain-API-Tests.postman_collection.json \
  --environment tests/api/environments/staging.postman_environment.json \
  --reporters cli,json,html \
  --reporter-html-export reports/api-test-report.html \
  --reporter-json-export reports/api-test-results.json

# Check exit code
if [ $? -eq 0 ]; then
  echo "API tests passed successfully"
else
  echo "API tests failed"
  exit 1
fi
```

## Performance Test Automation

### Artillery Load Testing

#### Load Test Configuration
```javascript
// tests/performance/load-test.yml
config:
  target: 'https://api.eventchain.com'
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 300
      arrivalRate: 20
      name: "Normal load"
    - duration: 120
      arrivalRate: 50
      name: "Peak load"
    - duration: 60
      arrivalRate: 5
      name: "Cool down"
  processor: "./load-test-processor.js"

scenarios:
  - name: "Event browsing flow"
    weight: 60
    flow:
      - get:
          url: "/api/events"
          capture:
            - json: "$.events[0].id"
              as: "eventId"
      - get:
          url: "/api/events/{{ eventId }}"
      - think: 3

  - name: "User registration and event creation"
    weight: 20
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "{{ $randomEmail() }}"
            password: "password123"
            name: "{{ $randomFullName() }}"
          capture:
            - json: "$.token"
              as: "authToken"
      - post:
          url: "/api/events"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            title: "Load Test Event {{ $randomInt(1, 1000) }}"
            description: "Event created during load test"
            date: "2024-12-01T18:00:00Z"
            venue: "Test Venue"
            capacity: 100

  - name: "Ticket purchase flow"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "password123"
          capture:
            - json: "$.token"
              as: "authToken"
      - get:
          url: "/api/events"
          capture:
            - json: "$.events[0].id"
              as: "eventId"
      - post:
          url: "/api/orders"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            eventId: "{{ eventId }}"
            quantity: 2
            paymentMethodId: "pm_card_visa_debit"
```

#### Performance Test Processor
```javascript
// tests/performance/load-test-processor.js
module.exports = {
  setRandomEmail: function(requestParams, context, ee, next) {
    context.vars.randomEmail = `test${Math.random().toString(36).substring(7)}@example.com`;
    return next();
  },

  setRandomFullName: function(requestParams, context, ee, next) {
    const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    context.vars.randomFullName = `${firstName} ${lastName}`;
    return next();
  },

  logResponse: function(requestParams, response, context, ee, next) {
    if (response.statusCode >= 400) {
      console.log(`Error response: ${response.statusCode} - ${response.body}`);
    }
    return next();
  }
};
```

### k6 Performance Testing

#### k6 Test Script
```javascript
// tests/performance/k6-load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'], // Error rate must be below 10%
    errors: ['rate<0.1'],
  },
};

const BASE_URL = 'https://api.eventchain.com';

export default function() {
  // Test event listing
  let response = http.get(`${BASE_URL}/api/events`);
  let success = check(response, {
    'events list status is 200': (r) => r.status === 200,
    'events list response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);

  if (success && response.json('events').length > 0) {
    const eventId = response.json('events')[0].id;
    
    // Test individual event fetch
    response = http.get(`${BASE_URL}/api/events/${eventId}`);
    success = check(response, {
      'event detail status is 200': (r) => r.status === 200,
      'event detail response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!success);
  }

  sleep(1);
}

export function handleSummary(data) {
  return {
    'performance-report.html': htmlReport(data),
    'performance-results.json': JSON.stringify(data),
  };
}
```

## Mobile Test Automation

### Appium Mobile Testing

#### Mobile Test Configuration
```javascript
// tests/mobile/config/appium.config.js
const path = require('path');

const config = {
  runner: 'local',
  port: 4723,
  specs: ['./tests/mobile/specs/**/*.js'],
  maxInstances: 1,
  capabilities: [
    {
      platformName: 'iOS',
      platformVersion: '16.0',
      deviceName: 'iPhone 14',
      browserName: 'Safari',
      automationName: 'XCUITest',
      newCommandTimeout: 240,
      commandTimeouts: 240,
    },
    {
      platformName: 'Android',
      platformVersion: '12.0',
      deviceName: 'Pixel 6',
      browserName: 'Chrome',
      automationName: 'UiAutomator2',
      newCommandTimeout: 240,
      commandTimeouts: 240,
    }
  ],
  logLevel: 'info',
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec', 'json'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000
  }
};

module.exports = { config };
```

#### Mobile Test Implementation
```javascript
// tests/mobile/specs/eventBooking.spec.js
const { expect } = require('chai');

describe('Mobile Event Booking', () => {
  beforeEach(async () => {
    await browser.url('https://eventchain.com');
    await browser.pause(2000); // Wait for page load
  });

  it('should complete ticket purchase on mobile', async () => {
    // Navigate to events
    const eventsLink = await $('[data-testid="events-link"]');
    await eventsLink.click();

    // Select an event
    const firstEvent = await $('[data-testid="event-card"]:first-child');
    await firstEvent.click();

    // Verify event details page
    const eventTitle = await $('[data-testid="event-title"]');
    await eventTitle.waitForDisplayed();
    expect(await eventTitle.getText()).to.not.be.empty;

    // Click buy tickets
    const buyTicketsBtn = await $('[data-testid="buy-tickets"]');
    await buyTicketsBtn.click();

    // Select quantity
    const quantitySelect = await $('[data-testid="quantity-select"]');
    await quantitySelect.selectByValue('2');

    // Proceed to checkout
    const checkoutBtn = await $('[data-testid="checkout-button"]');
    await checkoutBtn.click();

    // Verify checkout page
    const checkoutForm = await $('[data-testid="checkout-form"]');
    await checkoutForm.waitForDisplayed();

    // Fill payment details (using test card)
    const cardNumber = await $('[data-testid="card-number"]');
    await cardNumber.setValue('4242424242424242');

    const expiryDate = await $('[data-testid="expiry-date"]');
    await expiryDate.setValue('12/25');

    const cvc = await $('[data-testid="cvc"]');
    await cvc.setValue('123');

    // Submit payment
    const submitBtn = await $('[data-testid="submit-payment"]');
    await submitBtn.click();

    // Verify success
    const successMessage = await $('[data-testid="success-message"]');
    await successMessage.waitForDisplayed({ timeout: 10000 });
    expect(await successMessage.getText()).to.include('successful');
  });

  it('should handle responsive design correctly', async () => {
    // Test different viewport sizes
    await browser.setWindowSize(375, 667); // iPhone SE size

    const mobileMenu = await $('[data-testid="mobile-menu-button"]');
    await mobileMenu.waitForDisplayed();
    expect(await mobileMenu.isDisplayed()).to.be.true;

    // Test tablet size
    await browser.setWindowSize(768, 1024);
    
    const desktopNav = await $('[data-testid="desktop-navigation"]');
    await desktopNav.waitForDisplayed();
    expect(await desktopNav.isDisplayed()).to.be.true;
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

#### Complete Test Pipeline
```yaml
# .github/workflows/test-automation.yml
name: Automated Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *' # Run nightly at 2 AM

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: eventchain_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eventchain_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/eventchain_test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: |
          npm run start &
          npx wait-on http://localhost:3000 --timeout 60000
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30

  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Newman
        run: npm install -g newman
      
      - name: Run API tests
        run: |
          newman run tests/api/EventChain-API-Tests.postman_collection.json \
            --environment tests/api/environments/ci.postman_environment.json \
            --reporters cli,json \
            --reporter-json-export api-test-results.json
      
      - name: Upload API test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: api-test-results
          path: api-test-results.json

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule' || contains(github.event.head_commit.message, '[perf-test]')
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Artillery
        run: npm install -g artillery
      
      - name: Run performance tests
        run: |
          artillery run tests/performance/load-test.yml \
            --output performance-results.json
      
      - name: Generate performance report
        run: |
          artillery report performance-results.json \
            --output performance-report.html
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-report
          path: |
            performance-results.json
            performance-report.html

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      
      - name: Run OWASP ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://staging.eventchain.com'
          rules_file_name: '.zap/rules.tsv'
          cmd_options: '-a'

  test-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, api-tests]
    if: always()
    
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3
      
      - name: Generate consolidated test report
        run: |
          echo "# Test Execution Summary" > test-summary.md
          echo "## Unit Tests: ${{ needs.unit-tests.result }}" >> test-summary.md
          echo "## Integration Tests: ${{ needs.integration-tests.result }}" >> test-summary.md
          echo "## E2E Tests: ${{ needs.e2e-tests.result }}" >> test-summary.md
          echo "## API Tests: ${{ needs.api-tests.result }}" >> test-summary.md
      
      - name: Comment PR with test results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('test-summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

## Test Maintenance and Best Practices

### Test Code Quality

#### Test Code Standards
- **Descriptive Test Names**: Use clear, descriptive test names
- **Single Responsibility**: Each test should verify one specific behavior
- **Independent Tests**: Tests should not depend on each other
- **Proper Setup/Teardown**: Clean setup and teardown for each test
- **Meaningful Assertions**: Use specific assertions with clear error messages

#### Test Data Management
```javascript
// tests/helpers/testDataFactory.js
class TestDataFactory {
  static createEvent(overrides = {}) {
    return {
      title: 'Test Event',
      description: 'Test event description',
      date: '2024-12-01T18:00:00Z',
      venue: 'Test Venue',
      capacity: 100,
      price: 50,
      category: 'music',
      ...overrides
    };
  }

  static createUser(overrides = {}) {
    return {
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      name: 'Test User',
      role: 'attendee',
      ...overrides
    };
  }

  static createOrder(overrides = {}) {
    return {
      eventId: 'test-event-123',
      userId: 'test-user-456',
      quantity: 2,
      totalAmount: 100,
      status: 'pending',
      ...overrides
    };
  }
}

module.exports = { TestDataFactory };
```

### Flaky Test Management

#### Identifying Flaky Tests
```javascript
// scripts/detect-flaky-tests.js
const { execSync } = require('child_process');

function runTestMultipleTimes(testFile, iterations = 10) {
  let failures = 0;
  const results = [];

  for (let i = 0; i < iterations; i++) {
    try {
      execSync(`npm test ${testFile}`, { stdio: 'pipe' });
      results.push('PASS');
    } catch (error) {
      results.push('FAIL');
      failures++;
    }
  }

  const flakyRate = (failures / iterations) * 100;
  
  if (flakyRate > 0 && flakyRate < 100) {
    console.log(`🚨 Flaky test detected: ${testFile}`);
    console.log(`Failure rate: ${flakyRate.toFixed(1)}%`);
    console.log(`Results: ${results.join(', ')}`);
  }

  return flakyRate;
}

// Usage
const testFiles = [
  'tests/e2e/eventBooking.spec.js',
  'tests/integration/paymentService.test.js'
];

testFiles.forEach(testFile => {
  runTestMultipleTimes(testFile);
});
```

#### Retry Mechanisms
```javascript
// tests/helpers/retryHelper.js
async function retryTest(testFunction, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await testFunction();
      return; // Success, exit retry loop
    } catch (error) {
      if (attempt === maxRetries) {
        throw error; // Final attempt failed, throw error
      }
      
      console.log(`Test attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage in tests
describe('Flaky Test Example', () => {
  it('should handle network delays', async () => {
    await retryTest(async () => {
      const response = await fetch('/api/events');
      expect(response.status).toBe(200);
    });
  });
});
```

---

*This test automation guide should be regularly updated to reflect changes in testing tools, frameworks, and best practices. The automation strategy should be adapted based on project needs, team capabilities, and technology stack evolution.*