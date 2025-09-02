# API Reference

## 📚 Overview

This directory contains comprehensive API reference documentation for all Bilten platform endpoints, schemas, and integration examples.

## 📁 Structure

### Endpoints
- **Authentication**: User authentication and authorization endpoints
- **Events**: Event management and discovery endpoints  
- **Tickets**: Ticket creation, management, and validation endpoints
- **Payments**: Payment processing and transaction endpoints
- **Users**: User management and profile endpoints
- **Analytics**: Analytics and reporting endpoints

### Schemas
- **Request Schemas**: API request data structures
- **Response Schemas**: API response data structures
- **Error Schemas**: Error response formats
- **Webhook Schemas**: Webhook payload structures

### Examples
- **cURL Examples**: Command-line API usage examples
- **JavaScript Examples**: Frontend integration examples
- **Python Examples**: Backend integration examples
- **Postman Collection**: Complete API collection for testing

## 🚀 Quick Start

### Authentication
```bash
# Get access token
curl -X POST https://api.bilten.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'
```

### Create Event
```bash
# Create a new event
curl -X POST https://api.bilten.com/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My Event", "date": "2025-03-15", "location": "New York"}'
```

## 📋 Available Endpoints

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

### Event Endpoints
- `GET /events` - List events
- `POST /events` - Create event
- `GET /events/:id` - Get event details
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event

### Ticket Endpoints
- `GET /events/:id/tickets` - List event tickets
- `POST /events/:id/tickets` - Create ticket type
- `POST /tickets/purchase` - Purchase tickets
- `GET /tickets/:id` - Get ticket details

### Payment Endpoints
- `POST /payments/intent` - Create payment intent
- `POST /payments/confirm` - Confirm payment
- `GET /payments/:id` - Get payment status
- `POST /payments/refund` - Process refund

## 🔗 Related Documentation

- [Authentication Guide](../authentication.md)
- [API Overview](../README.md)
- [Integration Examples](../../guides/api-integration.md)
- [Error Handling](../../troubleshooting/api-errors.md)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintained by**: API Documentation Team