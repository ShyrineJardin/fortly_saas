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
   * Create a calendar event for a booking
   */
  async createBookingEvent(booking, business, service, calendarTokens) {
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

      // Create event description with booking details
      const description = this.createEventDescription(booking, service, business);

      // Create the event
      const event = {
        summary: `${service.name} - ${booking.clientName}`,
        description: description,
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
            clientEmail: booking.clientEmail
          }
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all' // Send email invites to attendees
      });

      console.log('✅ Calendar event created:', response.data.id);
      return response.data;

    } catch (error) {
      console.error('❌ Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateBookingEvent(eventId, booking, business, service, calendarTokens) {
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
        description: this.createEventDescription(booking, service, business),
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
        ]
      };

      const response = await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all'
      });

      console.log('✅ Calendar event updated:', eventId);
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
   * Create detailed event description
   */
  createEventDescription(booking, service, business) {
    let description = `📅 Booking Details\n\n`;
    description += `Service: ${service.name}\n`;
    description += `Duration: ${service.duration}\n`;
    description += `Price: ${service.price}\n\n`;
    description += `👤 Client Information\n`;
    description += `Name: ${booking.clientName}\n`;
    description += `Email: ${booking.clientEmail}\n`;
    description += `Phone: ${booking.clientPhone || 'N/A'}\n\n`;
    description += `🏢 Business Information\n`;
    description += `Name: ${business.businessName}\n`;
    description += `Location: ${business.location || 'N/A'}\n`;
    
    if (booking.notes) {
      description += `\n📝 Special Notes\n${booking.notes}\n`;
    }

    description += `\n🔗 Booking ID: ${booking.id}`;
    description += `\nStatus: ${booking.status.toUpperCase()}`;

    return description;
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