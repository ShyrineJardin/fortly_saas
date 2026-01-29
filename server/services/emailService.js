const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

let emailCount = 0;

/**
 * Email Service Class
 * Handles booking confirmation and notification emails
 */
class EmailService {
  constructor(transporter) {
    this.transporter = transporter;
  }

  /**
   * Send booking confirmation to client
   */
  async sendBookingConfirmation(booking, business, service) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.clientEmail,
        subject: `Booking Confirmation - ${business.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${booking.clientName},</p>
              
              <p>Your appointment with <strong>${business.businessName}</strong> has been confirmed!</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #10b981; margin-top: 0;">📋 Booking Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Duration:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.duration}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Price:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.price}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Booking ID:</strong></td>
                    <td style="padding: 8px 0;"><code>${booking.id}</code></td>
                  </tr>
                </table>
              </div>

              ${booking.notes ? `
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>📝 Your Notes:</strong>
                  <p style="margin: 10px 0 0 0;">${booking.notes}</p>
                </div>
              ` : ''}

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #10b981; margin-top: 0;">📍 Location</h3>
                <p>${business.location || 'Address not provided'}</p>
                
                ${business.phone ? `<p><strong>📞 Phone:</strong> ${business.phone}</p>` : ''}
                ${business.email ? `<p><strong>📧 Email:</strong> ${business.email}</p>` : ''}
              </div>

              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏰ Reminders:</strong></p>
                <p style="margin: 10px 0 0 0;">You'll receive email reminders 24 hours and 1 hour before your appointment.</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">
                  Need to make changes? Contact us at ${business.email || business.phone || 'the business'}
                </p>
              </div>
            </div>

            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName}. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Confirmation email sent to client:', booking.clientEmail);

      // Send notification to business
      await this.sendBusinessBookingNotification(booking, business, service);

    } catch (error) {
      console.error('❌ Error sending confirmation email:', error);
      throw error;
    }
  }

  /**
   * Send new booking notification to business
   */
  async sendBusinessBookingNotification(booking, business, service) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: business.email,
        subject: `New Booking - ${booking.clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔔 New Booking Received</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${business.businessName},</p>
              
              <p>You have a new booking!</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #10b981; margin-top: 0;">👤 Client Information</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientPhone || 'Not provided'}</td>
                  </tr>
                  ${booking.clientAddress ? `
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Address:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientAddress}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #10b981; margin-top: 0;">📅 Appointment Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Duration:</strong></td>
                    <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.duration}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0;"><strong>Status:</strong></td>
                    <td style="padding: 8px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING</span></td>
                  </tr>
                </table>
              </div>

              ${booking.notes ? `
                <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <strong>📝 Client Notes:</strong>
                  <p style="margin: 10px 0 0 0;">${booking.notes}</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL}/business/dashboard" 
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View in Dashboard
                </a>
              </div>
            </div>

            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from your booking system.</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Business notification sent to:', business.email);

    } catch (error) {
      console.error('❌ Error sending business notification:', error);
      // Don't throw - this is secondary notification
    }
  }

  /**
   * Send booking status update email
   */
  async sendBookingStatusUpdate(booking, business, service, oldStatus, newStatus) {
    try {
      const statusMessages = {
        confirmed: '✅ Your booking has been confirmed!',
        cancelled: '❌ Your booking has been cancelled',
        completed: '✅ Your appointment is complete'
      };

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: booking.clientEmail,
        subject: `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${business.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${newStatus === 'cancelled' ? '#ef4444' : '#10b981'}; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${statusMessages[newStatus] || 'Booking Updated'}</h1>
            </div>
            
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${booking.clientName},</p>
              
              <p>Your booking status has been updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.</p>
              
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0;">Booking Details</h2>
                <p><strong>Service:</strong> ${service.name}</p>
                <p><strong>Date:</strong> ${booking.bookingDate}</p>
                <p><strong>Time:</strong> ${booking.bookingTime}</p>
                <p><strong>Status:</strong> <span style="text-transform: uppercase; font-weight: bold;">${newStatus}</span></p>
              </div>

              ${newStatus === 'cancelled' ? `
                <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;">If you'd like to book again, please visit our booking page.</p>
                </div>
              ` : ''}

              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">
                  Questions? Contact us at ${business.email || business.phone}
                </p>
              </div>
            </div>

            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName}</p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log('✅ Status update email sent to:', booking.clientEmail);

    } catch (error) {
      console.error('❌ Error sending status update email:', error);
      throw error;
    }
  }
}

// ==================== CHAT EMAIL FUNCTIONS ====================

/**
 * Send notification email to client for new chat message
 */
const sendClientNotification = async (clientEmail, clientName, businessName, message, businessSlug) => {
  emailCount++;
  console.log(`📧 Chat notification email sent (${emailCount} today)`);
  
  if (emailCount > 450) {
    console.warn('⚠️ Approaching daily limit!');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: clientEmail,
    subject: `New message from ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF84; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .message-box { background-color: white; border-left: 4px solid #4CAF84; padding: 15px; margin: 20px 0; border-radius: 3px; }
          .button { display: inline-block; background-color: #4CAF84; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📬 You have a new message!</h2>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p><strong>${businessName}</strong> sent you a message:</p>
            <div class="message-box">
              ${message.length > 200 ? message.substring(0, 200) + '...' : message}
            </div>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${businessSlug}" class="button">
                Reply Now
              </a>
            </p>
            <div class="footer">
              <p>This email was sent because you have an active conversation with ${businessName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Chat notification email sent to client:', clientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending chat notification email to client:', error);
    return false;
  }
};

/**
 * Send notification email to business for new chat message
 */
const sendBusinessNotification = async (businessEmail, businessName, clientName, clientEmail, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: businessEmail,
    subject: `New message from ${clientName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF84; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .message-box { background-color: white; border-left: 4px solid #4CAF84; padding: 15px; margin: 20px 0; border-radius: 3px; }
          .client-info { background-color: #e8f5e9; padding: 10px; border-radius: 3px; margin: 15px 0; }
          .button { display: inline-block; background-color: #4CAF84; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 New Customer Message!</h2>
          </div>
          <div class="content">
            <p>Hi ${businessName},</p>
            <p>You received a new message from a customer:</p>
            <div class="client-info">
              <strong>From:</strong> ${clientName}<br>
              <strong>Email:</strong> ${clientEmail}
            </div>
            <div class="message-box">
              ${message.length > 200 ? message.substring(0, 200) + '...' : message}
            </div>
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/business/dashboard" class="button">
                View & Reply
              </a>
            </p>
            <div class="footer">
              <p>Reply quickly to keep your customers happy! 😊</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Chat notification email sent to business:', businessEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending chat notification email to business:', error);
    return false;
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Format time from 24-hour to 12-hour format
 */
function formatTime(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

// ==================== EXPORTS ====================

// Export class constructor for booking emails (used in bookings route)
module.exports = (transporter) => new EmailService(transporter);

// Export individual functions for chat emails (used in chat route)
module.exports.sendClientNotification = sendClientNotification;
module.exports.sendBusinessNotification = sendBusinessNotification;