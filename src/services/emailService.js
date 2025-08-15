const sgMail = require('@sendgrid/mail');
const config = require('../config');

// Initialize SendGrid
sgMail.setApiKey(config.email.sendgridApiKey);

class EmailService {
  /**
   * Send order confirmation email
   * @param {Object} orderData - Order data with user and event information
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendOrderConfirmation(orderData) {
    const {
      user,
      order,
      event,
      items,
      promoCode
    } = orderData;

    const templateData = {
      orderNumber: order.order_number,
      eventTitle: event.title,
      eventDate: new Date(event.start_date).toLocaleDateString(),
      eventTime: new Date(event.start_date).toLocaleTimeString(),
      eventVenue: event.venue_name,
      eventAddress: event.venue_address,
      customerName: `${user.first_name} ${user.last_name}`,
      customerEmail: user.email,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      subtotal: `$${order.subtotal.toFixed(2)}`,
      discount: order.discount_amount ? `-$${order.discount_amount.toFixed(2)}` : '$0.00',
      total: `$${order.total.toFixed(2)}`,
      promoCodeUsed: promoCode ? promoCode.code : null,
      items: items.map(item => ({
        ticketType: item.ticket_type,
        quantity: item.quantity,
        price: `$${item.price.toFixed(2)}`,
        total: `$${item.total_price.toFixed(2)}`
      })),
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl
    };

    const msg = {
      to: user.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.orderConfirmation,
      dynamicTemplateData: templateData,
      subject: `Order Confirmation - ${event.title}`
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Order confirmation email sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending order confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {Object} userData - User data
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendPasswordReset(userData, resetToken) {
    const resetUrl = `${config.server.frontendUrl}/reset-password?token=${resetToken}`;
    
    const templateData = {
      customerName: userData.first_name,
      resetUrl: resetUrl,
      expiryTime: '1 hour',
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl
    };

    const msg = {
      to: userData.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.passwordReset,
      dynamicTemplateData: templateData,
      subject: 'Reset Your Password - Bilten'
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Password reset email sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  /**
   * Send email verification email
   * @param {Object} userData - User data
   * @param {string} verificationToken - Email verification token
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendEmailVerification(userData, verificationToken) {
    const verificationUrl = `${config.server.frontendUrl}/verify-email?token=${verificationToken}`;
    
    const templateData = {
      customerName: userData.first_name,
      verificationUrl: verificationUrl,
      expiryTime: '24 hours',
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl
    };

    const msg = {
      to: userData.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.emailVerification,
      dynamicTemplateData: templateData,
      subject: 'Verify Your Email - Bilten'
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Email verification sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending email verification:', error);
      throw error;
    }
  }

  /**
   * Send event update notification
   * @param {Object} eventData - Event data
   * @param {Array} attendees - Array of attendee data
   * @param {string} updateType - Type of update (cancelled, postponed, details_changed)
   * @param {Object} updateDetails - Details about the update
   * @returns {Promise<Array>} Array of SendGrid responses
   */
  static async sendEventUpdateNotification(eventData, attendees, updateType, updateDetails) {
    const updateMessages = {
      cancelled: {
        subject: `Event Cancelled - ${eventData.title}`,
        templateId: config.email.templates.eventCancelled
      },
      postponed: {
        subject: `Event Postponed - ${eventData.title}`,
        templateId: config.email.templates.eventPostponed
      },
      details_changed: {
        subject: `Event Details Updated - ${eventData.title}`,
        templateId: config.email.templates.eventUpdated
      }
    };

    const messageConfig = updateMessages[updateType];
    if (!messageConfig) {
      throw new Error(`Invalid update type: ${updateType}`);
    }

    const templateData = {
      eventTitle: eventData.title,
      eventDate: new Date(eventData.start_date).toLocaleDateString(),
      eventTime: new Date(eventData.start_date).toLocaleTimeString(),
      eventVenue: eventData.venue_name,
      eventAddress: eventData.venue_address,
      updateDetails: updateDetails,
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl,
      eventUrl: `${config.server.frontendUrl}/events/${eventData.id}`
    };

    const emailPromises = attendees.map(async (attendee) => {
      const msg = {
        to: attendee.email,
        from: {
          email: config.email.fromEmail,
          name: config.email.fromName
        },
        templateId: messageConfig.templateId,
        dynamicTemplateData: {
          ...templateData,
          customerName: attendee.first_name
        },
        subject: messageConfig.subject
      };

      try {
        const response = await sgMail.send(msg);
        console.log(`Event update email sent to ${attendee.email}:`, response[0].statusCode);
        return { success: true, email: attendee.email, response };
      } catch (error) {
        console.error(`Error sending event update email to ${attendee.email}:`, error);
        return { success: false, email: attendee.email, error };
      }
    });

    const results = await Promise.allSettled(emailPromises);
    return results.map(result => result.value || result.reason);
  }

  /**
   * Send ticket reminder email
   * @param {Object} ticketData - Ticket data with user and event information
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendTicketReminder(ticketData) {
    const {
      user,
      event,
      ticket,
      qrCodeUrl
    } = ticketData;

    const templateData = {
      customerName: user.first_name,
      eventTitle: event.title,
      eventDate: new Date(event.start_date).toLocaleDateString(),
      eventTime: new Date(event.start_date).toLocaleTimeString(),
      eventVenue: event.venue_name,
      eventAddress: event.venue_address,
      ticketType: ticket.ticket_type,
      ticketNumber: ticket.ticket_number,
      qrCodeUrl: qrCodeUrl,
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl,
      eventUrl: `${config.server.frontendUrl}/events/${event.id}`
    };

    const msg = {
      to: user.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.ticketReminder,
      dynamicTemplateData: templateData,
      subject: `Your Ticket for ${event.title} - Tomorrow!`
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Ticket reminder email sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending ticket reminder email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new users
   * @param {Object} userData - User data
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendWelcomeEmail(userData) {
    const templateData = {
      customerName: userData.first_name,
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl
    };

    const msg = {
      to: userData.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.welcome,
      dynamicTemplateData: templateData,
      subject: 'Welcome to Bilten!'
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Welcome email sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  /**
   * Send payment failure notification
   * @param {Object} orderData - Order data with user and event information
   * @param {string} failureReason - Reason for payment failure
   * @returns {Promise<Object>} SendGrid response
   */
  static async sendPaymentFailureNotification(orderData, failureReason) {
    const {
      user,
      order,
      event
    } = orderData;

    const templateData = {
      customerName: user.first_name,
      orderNumber: order.order_number,
      eventTitle: event.title,
      failureReason: failureReason,
      retryUrl: `${config.server.frontendUrl}/orders/${order.id}/retry-payment`,
      supportEmail: config.email.supportEmail,
      websiteUrl: config.server.frontendUrl
    };

    const msg = {
      to: user.email,
      from: {
        email: config.email.fromEmail,
        name: config.email.fromName
      },
      templateId: config.email.templates.paymentFailure,
      dynamicTemplateData: templateData,
      subject: `Payment Failed - Order ${order.order_number}`
    };

    try {
      const response = await sgMail.send(msg);
      console.log('Payment failure notification sent successfully:', response[0].statusCode);
      return response;
    } catch (error) {
      console.error('Error sending payment failure notification:', error);
      throw error;
    }
  }

  /**
   * Test email service connectivity
   * @returns {Promise<boolean>} Success status
   */
  static async testConnection() {
    try {
      const msg = {
        to: config.email.testEmail,
        from: {
          email: config.email.fromEmail,
          name: config.email.fromName
        },
        subject: 'Bilten Email Service Test',
        text: 'This is a test email to verify the email service is working correctly.',
        html: '<p>This is a test email to verify the email service is working correctly.</p>'
      };

      const response = await sgMail.send(msg);
      console.log('Email service test successful:', response[0].statusCode);
      return true;
    } catch (error) {
      console.error('Email service test failed:', error);
      return false;
    }
  }
}

module.exports = EmailService;
