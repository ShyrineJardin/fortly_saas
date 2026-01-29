const { google } = require('googleapis');
const moment = require('moment-timezone');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth URL for user authorization
   * @param {string} userId - Business or Client ID
   * @param {string} userType - 'business' or 'client'
   * @param {string} bookingId - Optional booking ID for client auth
   */
  getAuthUrl(userId, userType, bookingId = null) {
    const state = JSON.stringify({
      userId,
      userType,
      bookingId,
      timestamp: Date.now()
    });

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ],
      state: encodeURIComponent(state),
      prompt: 'consent' // Force to get refresh_token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      console.log('✅ Tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date
      });
      return tokens;
    } catch (error) {
      console.error('❌ Error getting tokens:', error);
      throw error;
    }
  }

  /**
   * Set credentials for OAuth client
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
      console.log('✅ Token refreshed successfully');
      return credentials;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Check if calendar is connected
   */
  isCalendarConnected(tokens) {
    return !!(tokens && tokens.access_token);
  }

  /**
   * Parse service duration to minutes
   */
  parseDuration(durationStr) {
    if (!durationStr) return 60;

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
   * Get event color based on booking status
   */
  getEventColor(status) {
    const colorMap = {
      pending: '5',    // Yellow
      confirmed: '10', // Green
      completed: '2',  // Sage green
      cancelled: '11'  // Red
    };
    return colorMap[status] || '5';
  }

  /**
   * Create detailed event description with chat history
   */
  createEventDescription(booking, service, business, chatMessages = []) {
    let description = `📋 BOOKING DETAILS\n\n`;
    description += `👤 Client: ${booking.clientName}\n`;
    description += `📧 Email: ${booking.clientEmail}\n`;
    description += `📱 Phone: ${booking.clientPhone || 'Not provided'}\n`;
    description += `📍 Address: ${booking.clientAddress || 'Not provided'}\n\n`;
    
    description += `🎯 Service: ${service.name}\n`;
    description += `💰 Price: ${service.price}\n`;
    description += `⏱️ Duration: ${service.duration}\n\n`;
    
    // Add chat history if exists
    if (chatMessages && chatMessages.length > 0) {
      description += `💬 CONVERSATION HISTORY (${chatMessages.length} messages)\n`;
      description += `─────────────────────────────────────\n`;
      
      // Show last 10 messages
      const displayMessages = chatMessages.slice(-10);
      displayMessages.forEach((msg) => {
        const sender = msg.senderType === 'business' ? business.businessName : booking.clientName;
        const timestamp = moment(msg.createdAt).format('MMM D, h:mm A');
        description += `\n[${timestamp}] ${sender}:\n${msg.message}\n`;
      });
      
      if (chatMessages.length > 10) {
        description += `\n... and ${chatMessages.length - 10} more messages\n`;
      }
      description += `─────────────────────────────────────\n\n`;
    }
    
    if (booking.notes) {
      description += `📝 Special Notes:\n${booking.notes}\n\n`;
    }
    
    description += `🏢 Business: ${business.businessName}\n`;
    description += `📍 Location: ${business.location || 'See business profile'}\n\n`;
    
    description += `📊 Status: ${booking.status.toUpperCase()}\n`;
    description += `🆔 Booking ID: ${booking.id}\n\n`;
    
    // Add management links
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    description += `🔗 Manage Booking:\n`;
    description += `${frontendUrl}/${business.slug}/bookings/${booking.id}\n\n`;
    
    if (chatMessages && chatMessages.length > 0) {
      description += `💬 View Full Conversation:\n`;
      description += `${frontendUrl}/${business.slug}/chat?email=${encodeURIComponent(booking.clientEmail)}`;
    }

    return description;
  }

  /**
   * Create calendar event for booking
   * Creates events in BOTH business and client calendars
   */
  async createBookingEvent(booking, business, service, businessTokens, clientTokens = null, chatMessages = []) {
    try {
      const durationMinutes = this.parseDuration(service.duration);
      
      // Create start and end times
      const startDateTime = moment.tz(
        `${booking.bookingDate} ${booking.bookingTime}`,
        'YYYY-MM-DD HH:mm',
        business.timezone || 'UTC'
      );
      
      const endDateTime = startDateTime.clone().add(durationMinutes, 'minutes');

      // Create event description with chat history
      const description = this.createEventDescription(booking, service, business, chatMessages);

      // Event data
      const eventData = {
        summary: `${service.name} - ${booking.clientName}`,
        description: description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: business.timezone || 'UTC',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: business.timezone || 'UTC',
        },
        attendees: [
          { email: booking.clientEmail, displayName: booking.clientName },
          { email: business.email, displayName: business.businessName }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'email', minutes: 60 },      // 1 hour before
            { method: 'popup', minutes: 60 },      // 1 hour before (popup)
          ],
        },
        colorId: this.getEventColor(booking.status),
        extendedProperties: {
          private: {
            bookingId: booking.id,
            businessId: business.id,
            serviceId: service.id,
            clientEmail: booking.clientEmail,
            hasChatHistory: chatMessages.length > 0 ? 'true' : 'false',
            chatMessageCount: chatMessages.length.toString()
          }
        }
      };

      console.log('📅 Creating calendar events:', {
        summary: eventData.summary,
        start: eventData.start.dateTime,
        end: eventData.end.dateTime,
        hasChatHistory: chatMessages.length > 0,
        messageCount: chatMessages.length
      });

      const results = {
        businessEventId: null,
        clientEventId: null
      };

      // 1. Create event in BUSINESS calendar
      try {
        this.setCredentials(businessTokens);
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

        const businessEvent = await calendar.events.insert({
          calendarId: 'primary',
          resource: eventData,
          sendUpdates: 'all' // Send email to client
        });

        results.businessEventId = businessEvent.data.id;
        console.log('✅ Business calendar event created:', businessEvent.data.id);
        console.log('📧 Email invitation sent to client:', booking.clientEmail);
      } catch (businessError) {
        console.error('❌ Failed to create business calendar event:', businessError.message);
        throw businessError;
      }

      // 2. Create event in CLIENT calendar (if they authorized)
      if (clientTokens) {
        try {
          this.setCredentials(clientTokens);
          const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

          const clientEvent = await calendar.events.insert({
            calendarId: 'primary',
            resource: eventData,
            sendUpdates: 'none' // Don't send duplicate emails
          });

          results.clientEventId = clientEvent.data.id;
          console.log('✅ Client calendar event created:', clientEvent.data.id);
        } catch (clientError) {
          console.error('⚠️ Failed to create client calendar event (non-blocking):', clientError.message);
          // Don't fail the entire booking if client calendar fails
        }
      } else {
        console.log('ℹ️ Client calendar not connected - event created in business calendar only');
      }

      return results;

    } catch (error) {
      console.error('❌ Create calendar event error:', error);
      throw error;
    }
  }

  /**
   * Update existing calendar event
   */
  async updateBookingEvent(eventId, booking, business, service, tokens, chatMessages = []) {
    try {
      this.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const durationMinutes = this.parseDuration(service.duration);

      const startDateTime = moment.tz(
        `${booking.bookingDate} ${booking.bookingTime}`,
        'YYYY-MM-DD HH:mm',
        business.timezone || 'UTC'
      );
      
      const endDateTime = startDateTime.clone().add(durationMinutes, 'minutes');

      const description = this.createEventDescription(booking, service, business, chatMessages);

      const eventData = {
        summary: `${service.name} - ${booking.clientName}`,
        description: description,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: business.timezone || 'UTC',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: business.timezone || 'UTC',
        },
        attendees: [
          { email: booking.clientEmail, displayName: booking.clientName },
          { email: business.email, displayName: business.businessName }
        ],
        colorId: this.getEventColor(booking.status),
        extendedProperties: {
          private: {
            bookingId: booking.id,
            hasChatHistory: chatMessages.length > 0 ? 'true' : 'false',
            chatMessageCount: chatMessages.length.toString()
          }
        }
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: eventData,
        sendUpdates: 'all'
      });

      console.log('✅ Calendar event updated:', eventId);
      console.log('📧 Update notifications sent to attendees');
      
      return response.data;

    } catch (error) {
      console.error('❌ Update calendar event error:', error);
      throw error;
    }
  }

  /**
   * Delete calendar event
   */
  async deleteBookingEvent(eventId, tokens) {
    try {
      this.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all'
      });

      console.log('✅ Calendar event deleted:', eventId);
      console.log('📧 Cancellation notifications sent');
      
      return true;

    } catch (error) {
      console.error('❌ Delete calendar event error:', error);
      throw error;
    }
  }

  /**
   * Get busy times from calendar
   */
  async getBusyTimes(tokens, timeMin, timeMax, timezone = 'UTC') {
    try {
      this.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: timeMin,
          timeMax: timeMax,
          timeZone: timezone,
          items: [{ id: 'primary' }]
        }
      });

      const busySlots = response.data.calendars.primary.busy || [];
      console.log('📅 Found', busySlots.length, 'busy time slots');
      
      return busySlots;

    } catch (error) {
      console.error('❌ Error fetching busy times:', error);
      throw error;
    }
  }

  /**
   * Get calendar events for a date range
   */
  async getEvents(startDate, endDate, tokens) {
    try {
      this.setCredentials(tokens);
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate).toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items || [];

    } catch (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }
  }
}

module.exports = new GoogleCalendarService();