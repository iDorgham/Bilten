# Tickets API

## Overview

The Tickets API manages ticket sales, purchases, and validation for events on the Bilten platform. It handles ticket creation, sales, validation, and refunds.

## Base URL
```
GET /api/v1/tickets
```

## Endpoints

### List Tickets
Retrieves tickets for an event or user.

**Endpoint**: `GET /tickets`

**Query Parameters**:
- `eventId` (string): Filter by event ID
- `userId` (string): Filter by user ID
- `status` (string): Filter by status (active, used, cancelled, refunded)

### Get Ticket
Retrieves detailed ticket information.

**Endpoint**: `GET /tickets/{ticketId}`

### Purchase Tickets
Purchases tickets for an event.

**Endpoint**: `POST /tickets/purchase`

**Request Body**:
```json
{
  "eventId": "event_123456789",
  "ticketTypeId": "ticket_123",
  "quantity": 2,
  "attendeeInfo": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    }
  ]
}
```

### Validate Ticket
Validates a ticket for entry.

**Endpoint**: `POST /tickets/{ticketId}/validate`

### Cancel Ticket
Cancels a ticket purchase.

**Endpoint**: `POST /tickets/{ticketId}/cancel`

## Error Codes

| Code | Description |
|------|-------------|
| `TICKET_NOT_FOUND` | Ticket not found |
| `TICKET_ALREADY_USED` | Ticket already validated |
| `TICKET_EXPIRED` | Ticket has expired |
| `INSUFFICIENT_QUANTITY` | Not enough tickets available |

## Code Examples

```typescript
// Purchase tickets
const purchase = await api.tickets.purchase({
  eventId: 'event_123',
  ticketTypeId: 'ticket_456',
  quantity: 2
});

// Validate ticket
await api.tickets.validate('ticket_789');
```
