const express = require('express');
const router = express.Router();

// Mock tickets data
const tickets = [
  {
    id: 1,
    event_id: "550e8400-e29b-41d4-a716-446655440101",
    name: "General Admission",
    price: 1500.00,
    quantity_available: 100,
    is_active: true
  }
];

// Mock ticket instances for validation
const ticketInstances = [
  {
    id: "ticket-001",
    ticket_id: 1,
    event_id: "live-event-test-001",
    attendee_name: "John Doe",
    ticket_type: "General Admission",
    is_valid: true,
    is_used: false,
    created_at: new Date().toISOString(),
    event_name: "Live Test Event - Electronic Music Night",
    venue_name: "Test Venue"
  },
  {
    id: "ticket-002", 
    ticket_id: 1,
    event_id: "live-event-test-001",
    attendee_name: "Jane Smith",
    ticket_type: "General Admission",
    is_valid: true,
    is_used: true,
    created_at: new Date().toISOString(),
    event_name: "Live Test Event - Electronic Music Night",
    venue_name: "Test Venue"
  }
];

// Get tickets by event
router.get('/event/:eventId', (req, res) => {
  const eventTickets = tickets.filter(ticket => ticket.event_id === req.params.eventId);
  
  res.json({
    data: {
      tickets: eventTickets
    }
  });
});

// Get my tickets
router.get('/my-tickets', (req, res) => {
  // This would typically use authentication middleware
  res.json({
    data: {
      tickets: []
    }
  });
});

// Get ticket details
router.get('/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === parseInt(req.params.id));
  
  if (!ticket) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Ticket not found'
    });
  }
  
  res.json({
    data: { ticket }
  });
});

// Validate ticket
router.post('/validate', (req, res) => {
  const { ticketId, eventId, timestamp } = req.body;
  
  // Find the ticket instance
  const ticketInstance = ticketInstances.find(t => t.id === ticketId);
  
  if (!ticketInstance) {
    return res.status(404).json({
      valid: false,
      message: 'Ticket not found',
      error: 'TICKET_NOT_FOUND'
    });
  }
  
  // Check if ticket is valid
  if (!ticketInstance.is_valid) {
    return res.json({
      valid: false,
      message: 'Ticket is invalid or has been cancelled',
      error: 'TICKET_INVALID'
    });
  }
  
  // Check if ticket has already been used
  if (ticketInstance.is_used) {
    return res.json({
      valid: false,
      message: 'Ticket has already been used',
      error: 'TICKET_ALREADY_USED'
    });
  }
  
  // Check if event is currently live
  const now = new Date();
  const events = require('./events'); // This would need to be imported properly in a real app
  
  // For now, we'll assume the event is live if the ticket exists
  // In a real implementation, you'd check the event's start/end dates
  
  // Mark ticket as used
  ticketInstance.is_used = true;
  
  return res.json({
    valid: true,
    message: 'Ticket is valid and has been successfully validated',
    ticketInfo: {
      ticketId: ticketInstance.id,
      eventName: ticketInstance.event_name,
      attendeeName: ticketInstance.attendee_name,
      ticketType: ticketInstance.ticket_type,
      venue: ticketInstance.venue_name,
      validatedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
