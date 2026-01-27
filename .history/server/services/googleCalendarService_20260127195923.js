const { google } = require('googleapis');
const moment = require('moment-timezone');

/**
 * Google Calendar Service
 * Handles OAuth2 authentication and calendar event management
 * Supports two-way sync between business and client calendars
 */

class GoogleCalendarService {
  constructor() {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Generate Google OAuth URL for user authorization
   */
  getAuthUrl(userId, userType = 'business') {
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ userId, userType }) // Pass user info in state
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Set credentials for the OAuth client
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Refresh access token if expired
   */
  async refreshAccessToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Create a calendar event for a booking with chat message information
   */
  async createBookingEvent(booking, business, service, calendarTokens, chatMessages = []) {
    try {
      this.setCredentials(calendarTokens);

      // Parse service duration
      const duration = this.parseDuration(service.duration);
      
      // Create start and end times
      const startDateTime = moment.tz(
        `${booking.bookingDate} ${booking.bookingTime}`,
        'YYYY-MM-DD HH:mm:ss',
        business.timezone
      );

      const endDateTime = startDateTime.clone().add(duration, 'minutes');

      // Create event description with booking details AND chat messages
      const description = this.createEventDescription(booking, service, business, chatMessages);

      // Create the event
      const event = {
        summary: `${service.name} - ${booking.clientName}`,
        description: description,
        location: booking.clientAddress || business.location || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: business.timezone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: business.timezone
        },
        attendees: [
          { email: booking.clientEmail, displayName: booking.clientName },
          { email: business.email, displayName: business.businessName }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        },
        // Add custom metadata
        extendedProperties: {
          private: {
            bookingId: booking.id,
            businessId: business.id,
            serviceId: service.id,
            clientEmail: booking.clientEmail,
            hasChatHistory: String(chatMessages.length > 0),
            chatMessageCount: String(chatMessages.length)
          }
        },
        // Color coding based on status
        colorId: this.getEventColor(booking.status)
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all' // Send email invites to attendees
      });

      console.log('✅ Calendar event created:', response.data.id);
      console.log('📧 Calendar invites sent to:', booking.clientEmail, 'and', business.email);
      
      return response.data;

    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateBookingEvent(eventId, booking, business, service, calendarTokens, chatMessages = []) {
    try {
      this.setCredentials(calendarTokens);

      const duration = this.parseDuration(service.duration);
      
      const startDateTime = moment.tz(
        `${booking.bookingDate} ${booking.bookingTime}`,
        'YYYY-MM-DD HH:mm:ss',
        business.timezone
      );

      const endDateTime = startDateTime.clone().add(duration, 'minutes');

      const event = {
        summary: `${service.name} - ${booking.clientName}`,
        description: this.createEventDescription(booking, service, business, chatMessages),
        location: booking.clientAddress || business.location || '',
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: business.timezone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: business.timezone
        },
        attendees: [
          { email: booking.clientEmail, displayName: booking.clientName },
          { email: business.email, displayName: business.businessName }
        ],
        extendedProperties: {
          private: {
            bookingId: booking.id,
            businessId: business.id,
            serviceId: service.id,
            clientEmail: booking.clientEmail,
            hasChatHistory: String(chatMessages.length > 0),
            chatMessageCount: String(chatMessages.length)
          }
        },
        colorId: this.getEventColor(booking.status)
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
      });

      console.log('✅ Calendar event updated:', eventId);
      console.log('📧 Update notifications sent to attendees');
      
      return response.data;

    } catch (error) {
      console.error('❌ Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Cancel/Delete a calendar event
   */
  async deleteBookingEvent(eventId, calendarTokens) {
    try {
      this.setCredentials(calendarTokens);

      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all' // Notify attendees
      });

      console.log('✅ Calendar event deleted:', eventId);
      console.log('📧 Cancellation notifications sent to attendees');
      
      return true;

    } catch (error) {
      console.error('❌ Error deleting calendar event:', error);
      throw error;
    }
  }

  /**
   * Get all events for a specific date range
   */
  async getEvents(startDate, endDate, calendarTokens) {
    try {
      this.setCredentials(calendarTokens);

      const response = await this.calendar.events.list({
        calendarId: 'primary',
        timeMin: moment(startDate).toISOString(),
        timeMax: moment(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];

    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Create detailed event description with chat history
   */
  createEventDescription(booking, service, business, chatMessages = []) {
    let description = `📅 BOOKING DETAILS\n`;
    description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Service Information
    description += `🛠️ SERVICE\n`;
    description += `   Name: ${service.name}\n`;
    description += `   Duration: ${service.duration}\n`;
    description += `   Price: ${service.price}\n`;
    if (service.description) {
      description += `   Description: ${service.description}\n`;
    }
    description += `\n`;
    
    // Client Information
    description += `👤 CLIENT INFORMATION\n`;
    description += `   Name: ${booking.clientName}\n`;
    description += `   Email: ${booking.clientEmail}\n`;
    description += `   Phone: ${booking.clientPhone || 'N/A'}\n`;
    if (booking.clientAddress) {
      description += `   Address: ${booking.clientAddress}\n`;
    }
    description += `\n`;
    
    // Business Information
    description += `🏢 BUSINESS INFORMATION\n`;
    description += `   Name: ${business.businessName}\n`;
    description += `   Email: ${business.email}\n`;
    if (business.phone) {
      description += `   Phone: ${business.phone}\n`;
    }
    if (business.location) {
      description += `   Location: ${business.location}\n`;
    }
    description += `\n`;
    
    // Booking Status
    description += `📊 STATUS\n`;
    description += `   Current Status: ${booking.status.toUpperCase()}\n`;
    description += `   Booking ID: ${booking.id}\n`;
    description += `   Created: ${moment(booking.createdAt).format('MMMM D, YYYY h:mm A')}\n`;
    description += `\n`;
    
    // Special Notes
    if (booking.notes) {
      description += `📝 SPECIAL NOTES\n`;
      description += `   ${booking.notes}\n\n`;
    }

    // Chat Message History
    if (chatMessages && chatMessages.length > 0) {
      description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      description += `💬 CHAT HISTORY (${chatMessages.length} messages)\n`;
      description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      
      // Show most recent 5 messages
      const recentMessages = chatMessages.slice(-5);
      
      recentMessages.forEach((msg, index) => {
        const sender = msg.senderType === 'business' ? business.businessName : booking.clientName;
        const timestamp = moment(msg.createdAt).format('MMM D, h:mm A');
        
        description += `[${timestamp}] ${sender}:\n`;
        description += `${msg.message}\n\n`;
      });
      
      if (chatMessages.length > 5) {
        description += `... and ${chatMessages.length - 5} earlier messages\n\n`;
      }
      
      description += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    // Footer
    description += `\n📱 View full details at: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/${business.slug}\n`;
    description += `\nThis event was automatically created by the booking system.\n`;

    return description;
  }

  /**
   * Get event color based on booking status
   */
  getEventColor(status) {
    const colorMap = {
      'pending': '5',    // Yellow - awaiting confirmation
      'confirmed': '10', // Green - confirmed
      'completed': '9',  // Blue - completed
      'cancelled': '11'  // Red - cancelled
    };
    
    return colorMap[status] || '7'; // Gray as default
  }

  /**
   * Parse duration string to minutes
   */
  parseDuration(durationStr) {
    if (!durationStr) return 60; // Default 1 hour

    const match = durationStr.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/);
    if (!match) return 60;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'minute':
      case 'minutes':
      case 'min':
      case 'mins':
        return value;
      case 'hour':
      case 'hours':
      case 'hr':
      case 'hrs':
        return value * 60;
      case 'day':
      case 'days':
        return value * 24 * 60;
      default:
        return 60;
    }
  }

  /**
   * Check if calendar integration is enabled for a user
   */
  isCalendarConnected(tokens) {
    return tokens && tokens.access_token && tokens.refresh_token;
  }
}

module.exports = new GoogleCalendarService();