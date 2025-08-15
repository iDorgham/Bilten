# Email Notifications System Documentation

## Overview

The Bilten platform includes a comprehensive email notification system built with SendGrid that handles order confirmations, password resets, event updates, and other transactional emails. The system uses SendGrid's dynamic templates for consistent branding and personalization.

## Features

- **Order Confirmation Emails**: Sent automatically when payments succeed
- **Password Reset Emails**: Secure token-based password reset functionality
- **Email Verification**: Welcome emails with verification links
- **Event Update Notifications**: Bulk notifications for event changes
- **Ticket Reminders**: Automated reminders before events
- **Welcome Emails**: New user onboarding
- **Payment Failure Notifications**: Failed payment alerts

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
EMAIL_FROM=noreply@bilten.com
EMAIL_FROM_NAME=Bilten Events
SUPPORT_EMAIL=support@bilten.com
TEST_EMAIL=test@bilten.com

# SendGrid Template IDs (replace with your actual template IDs)
SENDGRID_TEMPLATE_ORDER_CONFIRMATION=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_EMAIL_VERIFICATION=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_EVENT_CANCELLED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_EVENT_POSTPONED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_EVENT_UPDATED=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_TICKET_REMINDER=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_WELCOME=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_PAYMENT_FAILURE=d-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. SendGrid Setup

1. Create a SendGrid account at [sendgrid.com](https://sendgrid.com)
2. Generate an API key with full access to "Mail Send" permissions
3. Verify your sender domain or use a verified sender email
4. Create dynamic templates for each email type

### 3. Install Dependencies

```bash
npm install @sendgrid/mail
```

## Email Templates

### 1. Order Confirmation Template

**Template Variables:**
- `orderNumber`: Order reference number
- `eventTitle`: Name of the event
- `eventDate`: Event date (formatted)
- `eventTime`: Event time (formatted)
- `eventVenue`: Venue name
- `eventAddress`: Venue address
- `customerName`: Full customer name
- `customerEmail`: Customer email
- `orderDate`: Order creation date
- `subtotal`: Order subtotal
- `discount`: Applied discount amount
- `total`: Final order total
- `promoCodeUsed`: Promo code if applied
- `items`: Array of ticket items
- `totalItems`: Total number of tickets
- `supportEmail`: Support contact email
- `websiteUrl`: Main website URL

**Example HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Order Confirmation - {{eventTitle}}</title>
</head>
<body>
    <h1>Thank you for your order!</h1>
    <p>Hi {{customerName}},</p>
    <p>Your order #{{orderNumber}} has been confirmed.</p>
    
    <h2>Event Details</h2>
    <p><strong>{{eventTitle}}</strong></p>
    <p>Date: {{eventDate}} at {{eventTime}}</p>
    <p>Venue: {{eventVenue}}</p>
    <p>Address: {{eventAddress}}</p>
    
    <h2>Order Summary</h2>
    <p>Subtotal: {{subtotal}}</p>
    <p>Discount: {{discount}}</p>
    <p><strong>Total: {{total}}</strong></p>
    
    <h2>Tickets</h2>
    {{#each items}}
    <p>{{ticketType}} x {{quantity}} - {{price}} each = {{total}}</p>
    {{/each}}
    
    <p>Need help? Contact us at {{supportEmail}}</p>
</body>
</html>
```

### 2. Password Reset Template

**Template Variables:**
- `customerName`: Customer's first name
- `resetUrl`: Password reset link
- `expiryTime`: Token expiry time
- `supportEmail`: Support contact email
- `websiteUrl`: Main website URL

**Example HTML Structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Reset Your Password</title>
</head>
<body>
    <h1>Reset Your Password</h1>
    <p>Hi {{customerName}},</p>
    <p>We received a request to reset your password. Click the link below to create a new password:</p>
    
    <a href="{{resetUrl}}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
        Reset Password
    </a>
    
    <p>This link will expire in {{expiryTime}}.</p>
    <p>If you didn't request this, please ignore this email.</p>
    
    <p>Need help? Contact us at {{supportEmail}}</p>
</body>
</html>
```

### 3. Event Update Template

**Template Variables:**
- `customerName`: Customer's first name
- `eventTitle`: Event name
- `eventDate`: Event date
- `eventTime`: Event time
- `eventVenue`: Venue name
- `eventAddress`: Venue address
- `updateDetails`: Details about the update
- `supportEmail`: Support contact email
- `websiteUrl`: Main website URL
- `eventUrl`: Direct link to event page

## API Endpoints

### Email Service Test

**POST** `/api/v1/notifications/test`

Test email service connectivity.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Email service is working correctly"
}
```

### Event Update Notifications

**POST** `/api/v1/notifications/event-update`

Send event update notifications to all attendees.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "eventId": "event-uuid",
  "updateType": "cancelled",
  "updateDetails": {
    "reason": "Due to unforeseen circumstances",
    "refundPolicy": "Full refunds will be processed within 5-7 business days"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event update notifications sent successfully",
  "sentCount": 45,
  "failureCount": 2,
  "totalAttendees": 47,
  "results": [...]
}
```

### Ticket Reminders

**POST** `/api/v1/notifications/ticket-reminder`

Send ticket reminder emails for an event.

**Request Body:**
```json
{
  "eventId": "event-uuid"
}
```

### Welcome Email

**POST** `/api/v1/notifications/welcome`

Send welcome email to new user.

**Request Body:**
```json
{
  "userId": "user-uuid"
}
```

### Event Attendees

**GET** `/api/v1/notifications/event-attendees/:eventId`

Get list of attendees for notification purposes.

**Headers:**
```
Authorization: Bearer <token>
```

## Integration Examples

### 1. Order Confirmation (Automatic)

Order confirmation emails are automatically sent when Stripe webhooks confirm successful payments:

```javascript
// In webhooks.js - automatically triggered
async function handlePaymentSucceeded(paymentIntent) {
  // ... payment processing ...
  
  // Send order confirmation email
  try {
    await sendOrderConfirmationEmail(orderId);
  } catch (emailError) {
    console.error('Error sending order confirmation email:', emailError);
  }
}
```

### 2. Password Reset

Password reset emails are sent when users request password resets:

```javascript
// In auth.js
router.post('/forgot-password', async (req, res) => {
  // ... validation and token generation ...
  
  // Send password reset email
  try {
    await EmailService.sendPasswordReset(user, resetToken);
  } catch (emailError) {
    console.error('Error sending password reset email:', emailError);
  }
});
```

### 3. Event Update Notifications

Event organizers can send bulk notifications to attendees:

```javascript
// Frontend example
const sendEventUpdate = async (eventId, updateType, updateDetails) => {
  const response = await fetch('/api/v1/notifications/event-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      eventId,
      updateType,
      updateDetails
    })
  });
  
  return response.json();
};

// Usage
await sendEventUpdate('event-uuid', 'postponed', {
  newDate: '2024-02-15T19:00:00Z',
  reason: 'Due to weather conditions'
});
```

## Error Handling

The email service includes comprehensive error handling:

1. **Graceful Degradation**: Email failures don't break the main application flow
2. **Detailed Logging**: All email operations are logged for debugging
3. **Retry Logic**: Failed emails can be retried (implement as needed)
4. **Fallback Content**: Templates include fallback text for email clients

## Testing

### 1. Test Email Service

```bash
curl -X POST http://localhost:3001/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Order Confirmation

Create a test order and trigger the webhook manually:

```bash
# Simulate successful payment webhook
curl -X POST http://localhost:3001/api/v1/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment_intent.succeeded",
    "data": {
      "object": {
        "id": "pi_test",
        "metadata": {
          "orderId": "test-order-id"
        }
      }
    }
  }'
```

### 3. Test Password Reset

```bash
curl -X POST http://localhost:3001/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

## Monitoring and Analytics

### 1. SendGrid Dashboard

Monitor email performance through SendGrid's dashboard:
- Delivery rates
- Open rates
- Click rates
- Bounce rates
- Spam reports

### 2. Application Logs

Monitor email operations in application logs:
```bash
# View email-related logs
grep "email" logs/app.log
```

### 3. Email Queue Monitoring

For high-volume applications, consider implementing:
- Email queuing with Redis/Bull
- Retry mechanisms for failed emails
- Email analytics tracking
- A/B testing for email templates

## Security Considerations

1. **API Key Security**: Store SendGrid API key securely in environment variables
2. **Rate Limiting**: Implement rate limiting for email endpoints
3. **Input Validation**: Validate all email addresses and content
4. **Token Security**: Use secure, time-limited tokens for password resets
5. **Unsubscribe Compliance**: Include unsubscribe links in marketing emails

## Performance Optimization

1. **Template Caching**: SendGrid caches templates for faster delivery
2. **Batch Processing**: Use batch sending for large notification lists
3. **Async Processing**: Process emails asynchronously to avoid blocking
4. **Database Optimization**: Index email-related database queries

## Troubleshooting

### Common Issues

1. **Email Not Sending**
   - Check SendGrid API key
   - Verify sender email is verified
   - Check template IDs are correct

2. **Template Variables Not Working**
   - Ensure variable names match exactly
   - Check template syntax in SendGrid dashboard

3. **High Bounce Rate**
   - Verify sender domain
   - Clean email lists regularly
   - Monitor spam reports

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=debug
```

This will log detailed email service operations.

## Future Enhancements

1. **Email Preferences**: Allow users to customize email preferences
2. **SMS Integration**: Add SMS notifications for critical updates
3. **Push Notifications**: Implement web push notifications
4. **Email Analytics**: Track email engagement and conversion rates
5. **Template Management**: Admin interface for managing email templates
6. **A/B Testing**: Test different email subject lines and content
7. **Automated Workflows**: Trigger emails based on user behavior
8. **Multi-language Support**: Localized email templates

## Support

For email service issues:
1. Check SendGrid dashboard for delivery status
2. Review application logs for error messages
3. Test email service connectivity
4. Verify template configurations
5. Contact support with detailed error information
