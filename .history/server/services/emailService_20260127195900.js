const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

let emailCount = 0;

// ==================== BOOKING EMAILS ====================

/**
 * Send booking confirmation email to client
 */
const sendBookingConfirmation = async (booking, business, service) => {
  emailCount++;
  console.log(`📧 Booking confirmation email (${emailCount} today)`);
  
  if (emailCount > 450) {
    console.warn('⚠️ Approaching daily email limit!');
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.clientEmail,
    subject: `Booking Confirmed - ${service.name} at ${business.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF84; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
          .detail-label { font-weight: bold; color: #555; }
          .detail-value { color: #333; }
          .button { display: inline-block; background-color: #4CAF84; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
          .status-badge { display: inline-block; padding: 5px 15px; background-color: #FFA726; color: white; border-radius: 15px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>✅ Booking Confirmed!</h2>
          </div>
          <div class="content">
            <p>Hi ${booking.clientName},</p>
            <p>Thank you for booking with <strong>${business.businessName}</strong>! Your appointment has been confirmed.</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0; color: #4CAF84;">📅 Booking Details</h3>
              
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${service.name}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${formatTime(booking.bookingTime)}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Duration:</span>
                <span class="detail-value">${service.duration}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Price:</span>
                <span class="detail-value">${service.price}</span>
              </div>
              
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value"><span class="status-badge">PENDING</span></span>
              </div>
              
              ${booking.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                  <span class="detail-label">📝 Notes:</span>
                  <p style="margin: 10px 0 0 0; color: #666;">${booking.notes}</p>
                </div>
              ` : ''}
            </div>

            ${booking.hasChatHistory ? `
              <div style="background-color: #E3F2FD; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>💬 Chat History Available</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">
                  This booking has associated chat messages. You can view your conversation history with ${business.businessName}.
                </p>
              </div>
            ` : ''}

            <div style="background-color: #FFF3E0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>📍 Business Information</strong></p>
              <p style="margin: 10px 0 0 0;">
                <strong>${business.businessName}</strong><br>
                ${business.location || 'Location not specified'}<br>
                ${business.phone || ''}<br>
                ${business.email}
              </p>
            </div>

            ${business.bookingPolicyDescription ? `
              <div style="background-color: #F5F5F5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>📋 ${business.bookingPolicyTitle || 'Booking Policy'}</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                  ${business.bookingPolicyDescription}
                </p>
              </div>
            ` : ''}

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${business.slug}" class="button">
                View My Bookings
              </a>
            </p>

            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd;">
              <p style="font-size: 14px; color: #666;">
                <strong>Need to make changes?</strong><br>
                Contact ${business.businessName} at ${business.email} or visit their booking page to reschedule or cancel.
              </p>
            </div>

            <div class="footer">
              <p>Booking ID: ${booking.id}</p>
              <p>This is an automated confirmation email from ${business.businessName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Booking confirmation email sent to:', booking.clientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending booking confirmation email:', error);
    return false;
  }
};

/**
 * Send booking status update email to client
 */
const sendBookingStatusUpdate = async (booking, business, service, oldStatus, newStatus) => {
  emailCount++;
  console.log(`📧 Booking status update email (${emailCount} today)`);

  const statusMessages = {
    confirmed: {
      subject: 'Booking Confirmed',
      title: '✅ Your booking has been confirmed!',
      message: 'Great news! Your booking has been confirmed by the business.',
      color: '#4CAF50'
    },
    cancelled: {
      subject: 'Booking Cancelled',
      title: '❌ Your booking has been cancelled',
      message: 'Your booking has been cancelled. If you have any questions, please contact the business.',
      color: '#F44336'
    },
    completed: {
      subject: 'Booking Completed',
      title: '🎉 Service completed!',
      message: 'Thank you for choosing our service! We hope you had a great experience.',
      color: '#2196F3'
    }
  };

  const statusInfo = statusMessages[newStatus] || {
    subject: 'Booking Status Updated',
    title: '📝 Your booking status has been updated',
    message: `Your booking status has been changed from ${oldStatus} to ${newStatus}.`,
    color: '#9E9E9E'
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: booking.clientEmail,
    subject: `${statusInfo.subject} - ${service.name} at ${business.businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: ${statusInfo.color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }
          .booking-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
          .detail-row { padding: 8px 0; }
          .button { display: inline-block; background-color: ${statusInfo.color}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>${statusInfo.title}</h2>
          </div>
          <div class="content">
            <p>Hi ${booking.clientName},</p>
            <p>${statusInfo.message}</p>
            
            <div class="booking-details">
              <h3 style="margin-top: 0;">📅 Booking Information</h3>
              <div class="detail-row"><strong>Service:</strong> ${service.name}</div>
              <div class="detail-row"><strong>Date:</strong> ${new Date(booking.bookingDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</div>
              <div class="detail-row"><strong>Time:</strong> ${formatTime(booking.bookingTime)}</div>
              <div class="detail-row"><strong>Status:</strong> ${newStatus.toUpperCase()}</div>
              <div class="detail-row"><strong>Booking ID:</strong> ${booking.id}</div>
            </div>

            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${business.slug}" class="button">
                View Booking Details
              </a>
            </p>

            <div style="margin-top: 20px; padding: 15px; background-color: #F5F5F5; border-radius: 5px;">
              <p style="margin: 0;"><strong>Need Help?</strong></p>
              <p style="margin: 10px 0 0 0; font-size: 14px;">
                Contact ${business.businessName} at ${business.email}
              </p>
            </div>

            <div class="footer">
              <p>This email was sent regarding your booking with ${business.businessName}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Status update email sent to:', booking.clientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending status update email:', error);
    return false;
  }
};

// ==================== CHAT EMAILS ====================

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
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/messages" class="button">
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

module.exports = {
  sendBookingConfirmation,
  sendBookingStatusUpdate,
  sendClientNotification,
  sendBusinessNotification
};