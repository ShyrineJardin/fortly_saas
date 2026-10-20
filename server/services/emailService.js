const { sendEmail } = require('./emailTransport');

let emailCount = 0;

// ==================== HELPER ====================

// ==================== EMAIL SERVICE CLASS ====================

class EmailService {

  // ==================== PASSWORD RESET EMAILS ====================

  async sendPasswordResetEmail(business, resetUrl, resetToken) {
    try {
      await sendEmail({
        to: business.email,
        subject: 'Password Reset Request - Fortly',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #6FCF97; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #F7F9F8; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; padding: 12px 30px; background-color: #6FCF97; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px; }
              .warning { background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; border-radius: 4px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>🔐 Password Reset Request</h1></div>
              <div class="content">
                <p style="font-size: 16px; color: #1F2937;">Hi ${business.businessName},</p>
                <p style="color: #374151;">You recently requested to reset your password. Click the button below to reset it:</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                <p style="color: #6B7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; color: #6FCF97; background-color: #ECF7F2; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">${resetUrl}</p>
                <div class="warning">
                  <strong style="color: #92400E;">⚠️ Important:</strong>
                  <p style="margin: 10px 0 0 0; color: #78350F;">This link will expire in 1 hour for security reasons.</p>
                </div>
                <p style="color: #374151;">If you didn't request a password reset, you can safely ignore this email.</p>
                <p style="color: #1F2937; margin-top: 30px;">Best regards,<br><strong>Fortly Team</strong></p>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated email, please do not reply.</p>
                <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Fortly. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log('✅ Password reset email sent to:', business.email);
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw error;
    }
  }

  async sendPasswordResetConfirmation(business) {
    try {
      await sendEmail({
        to: business.email,
        subject: 'Password Successfully Reset - Fortly',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #6FCF97; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #F7F9F8; padding: 30px; border-radius: 0 0 8px 8px; }
              .success { background-color: #E6F6EE; border-left: 4px solid #6FCF97; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 20px; color: #6B7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><h1>✅ Password Reset Successful</h1></div>
              <div class="content">
                <p style="font-size: 16px; color: #1F2937;">Hi ${business.businessName},</p>
                <div class="success">
                  <strong style="color: #047857;">✅ Success!</strong>
                  <p style="margin: 10px 0 0 0; color: #065F46;">Your password has been successfully reset.</p>
                </div>
                <p style="color: #374151;">You can now log in using your new password.</p>
                <div style="background-color: #FEF3C7; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #F59E0B;">
                  <strong style="color: #92400E;">🔒 Security Note:</strong>
                  <p style="margin: 10px 0 0 0; color: #78350F;">If you didn't make this change, contact support immediately at <strong>support@fortly.com</strong></p>
                </div>
                <p style="color: #1F2937; margin-top: 30px;">Best regards,<br><strong>Fortly Team</strong></p>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated email, please do not reply.</p>
                <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} Fortly. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log('✅ Password reset confirmation email sent to:', business.email);
    } catch (error) {
      console.error('❌ Error sending password reset confirmation email:', error);
    }
  }

  // ==================== BOOKING EMAILS ====================

  async sendBookingConfirmation(booking, business, service) {
    // On initial booking the status is 'pending' — so we tell the client it's received/pending,
    // not "confirmed". The confirmed email fires via sendBookingStatusUpdate when business confirms.
    const results = await Promise.allSettled([
      // ── CLIENT: booking received, awaiting confirmation ──
      sendEmail({
        to: booking.clientEmail,
        subject: `Booking Received - ${business.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f59e0b; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">📋 Booking Received!</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${booking.clientName},</p>
              <p>Your booking request with <strong>${business.businessName}</strong> has been received and is <strong>pending confirmation</strong>.</p>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏳ What's next?</strong></p>
                <p style="margin: 10px 0 0 0;">${business.businessName} will review and confirm your booking. You'll receive another email once it's confirmed.</p>
              </div>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #f59e0b; margin-top: 0;">📋 Booking Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Duration:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.duration}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Price:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.price}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="padding: 8px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING</span></td></tr>
                </table>
              </div>
              ${booking.notes ? `<div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>📝 Your Notes:</strong><p style="margin: 10px 0 0 0;">${booking.notes}</p></div>` : ''}
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at ${business.email || business.phone || 'the business'}</p>
              </div>
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName}. All rights reserved.</p>
            </div>
          </div>
        `
      }),
      // ── BUSINESS: new booking notification ──
      sendEmail({
        to: business.email,
        subject: `New Booking - ${booking.clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #10b981; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🔔 New Booking Received</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${business.businessName},</p>
              <p>You have a new booking request!</p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #10b981; margin-top: 0;">👤 Client Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientName}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientEmail}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Phone:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientPhone || 'Not provided'}</td></tr>
                  ${booking.clientAddress ? `<tr><td style="padding: 8px 0;"><strong>Address:</strong></td><td style="padding: 8px 0;">${booking.clientAddress}</td></tr>` : ''}
                </table>
              </div>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #10b981; margin-top: 0;">📅 Appointment Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Duration:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.duration}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="padding: 8px 0;"><span style="background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px;">PENDING</span></td></tr>
                </table>
              </div>
              ${booking.notes ? `<div style="background-color: white; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>📝 Client Notes:</strong><p style="margin: 10px 0 0 0;">${booking.notes}</p></div>` : ''}
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from your booking system.</p>
            </div>
          </div>
        `
      })
    ]);

    if (results[0].status === 'fulfilled') console.log('✅ Booking received email sent to client:', booking.clientEmail);
    else console.error('❌ Client booking email failed:', results[0].reason?.message);
    if (results[1].status === 'fulfilled') console.log('✅ New booking notification sent to business:', business.email);
    else console.error('❌ Business booking email failed:', results[1].reason?.message);
  }

  // ── ✅ ADDED: fires when business changes status (confirmed, completed, cancelled) ──
  async sendBookingStatusUpdate(booking, business, service, oldStatus, newStatus) {
    // Only email the client — the business already knows since they made the change
    if (newStatus === oldStatus) return;

    const statusConfig = {
      confirmed: {
        color: '#10b981',
        emoji: '✅',
        title: 'Booking Confirmed!',
        clientMessage: `Great news! Your booking with <strong>${business.businessName}</strong> has been <strong>confirmed</strong>.`,
        badge: `<span style="background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CONFIRMED</span>`
      },
      completed: {
        color: '#3b82f6',
        emoji: '🎉',
        title: 'Appointment Completed',
        clientMessage: `Your appointment with <strong>${business.businessName}</strong> has been marked as <strong>completed</strong>. Thank you!`,
        badge: `<span style="background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 12px;">COMPLETED</span>`
      },
      cancelled: {
        color: '#ef4444',
        emoji: '❌',
        title: 'Booking Cancelled',
        clientMessage: `Your booking with <strong>${business.businessName}</strong> has been <strong>cancelled</strong> by the business.`,
        badge: `<span style="background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 12px;">CANCELLED</span>`
      }
    };

    const cfg = statusConfig[newStatus];
    if (!cfg) return; // don't email for unknown statuses

    try {
      await sendEmail({
        to: booking.clientEmail,
        subject: `${cfg.emoji} ${cfg.title} - ${business.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${cfg.color}; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">${cfg.emoji} ${cfg.title}</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${booking.clientName},</p>
              <p>${cfg.clientMessage}</p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: ${cfg.color}; margin-top: 0;">📋 Booking Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service?.name || 'N/A'}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Status:</strong></td><td style="padding: 8px 0;">${cfg.badge}</td></tr>
                </table>
              </div>
              ${newStatus === 'confirmed' ? `
              <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
                <p style="margin: 0;"><strong>⏰ Reminder:</strong></p>
                <p style="margin: 10px 0 0 0;">You'll receive an email reminder 1 hour before your appointment.</p>
              </div>
              ` : ''}
              ${newStatus === 'cancelled' ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${business.slug}/services"
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Book Another Appointment
                </a>
              </div>
              ` : ''}
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at ${business.email || business.phone || 'the business'}</p>
              </div>
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName}. All rights reserved.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ Status update email (${newStatus}) sent to client:`, booking.clientEmail);
    } catch (error) {
      console.error(`❌ Status update email failed:`, error.message);
    }
  }

  async sendCancellationNotification(booking, business, service, reason, cancelledBy) {
    const results = await Promise.allSettled([
      sendEmail({
        to: booking.clientEmail,
        subject: `Appointment Cancelled - ${business.businessName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Appointment Cancelled</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${booking.clientName},</p>
              <p>${cancelledBy === 'client' ? 'You have' : `${business.businessName} has`} cancelled the following appointment:</p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #ef4444; margin-top: 0;">📋 Cancelled Appointment</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingTime}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Booking ID:</strong></td><td style="padding: 8px 0;"><code>${booking.id}</code></td></tr>
                </table>
              </div>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>📝 Cancellation Reason:</strong>
                <p style="margin: 10px 0 0 0;">${reason}</p>
              </div>
              ${cancelledBy === 'business' ? `
              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${business.slug}/services"
                   style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Book Another Appointment
                </a>
              </div>
              ` : ''}
              <div style="text-align: center; margin-top: 30px;">
                <p style="color: #6b7280; font-size: 14px;">Questions? Contact us at ${business.email || business.phone}</p>
              </div>
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName}</p>
            </div>
          </div>
        `
      }),
      sendEmail({
        to: business.email,
        subject: `Appointment Cancelled - ${booking.clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #ef4444; padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">❌ Appointment Cancelled</h1>
            </div>
            <div style="padding: 30px; background-color: #f9fafb;">
              <p style="font-size: 16px;">Hi ${business.businessName},</p>
              <p>${cancelledBy === 'client' ? `${booking.clientName} has` : 'You have'} cancelled the following appointment:</p>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #ef4444; margin-top: 0;">👤 Client Information</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Name:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientName}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.clientEmail}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Phone:</strong></td><td style="padding: 8px 0;">${booking.clientPhone || 'Not provided'}</td></tr>
                </table>
              </div>
              <div style="background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #ef4444; margin-top: 0;">📅 Appointment Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Service:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${service.name}</td></tr>
                  <tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Date:</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${booking.bookingDate}</td></tr>
                  <tr><td style="padding: 8px 0;"><strong>Time:</strong></td><td style="padding: 8px 0;">${booking.bookingTime}</td></tr>
                </table>
              </div>
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>📝 Cancellation Reason:</strong>
                <p style="margin: 10px 0 0 0;">${reason}</p>
              </div>
            </div>
            <div style="background-color: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
              <p style="margin: 0;">This is an automated notification from your booking system.</p>
            </div>
          </div>
        `
      })
    ]);

    if (results[0].status === 'fulfilled') console.log('✅ Cancellation email sent to client:', booking.clientEmail);
    else console.error('❌ Client cancellation email failed:', results[0].reason?.message);
    if (results[1].status === 'fulfilled') console.log('✅ Cancellation email sent to business:', business.email);
    else console.error('❌ Business cancellation email failed:', results[1].reason?.message);
  }
}

// ==================== CHAT EMAIL FUNCTIONS ====================

const sendClientNotification = async (clientEmail, clientName, businessName, message, businessSlug) => {
  emailCount++;
  if (emailCount > 450) console.warn('⚠️ Approaching daily email limit!');

  try {
    await sendEmail({
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
            <div class="header"><h2>📬 You have a new message!</h2></div>
            <div class="content">
              <p>Hi ${clientName},</p>
              <p><strong>${businessName}</strong> sent you a message:</p>
              <div class="message-box">${message.length > 200 ? message.substring(0, 200) + '...' : message}</div>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/${businessSlug}" class="button">Reply Now</a>
              </p>
              <div class="footer"><p>This email was sent because you have an active conversation with ${businessName}</p></div>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('✅ Chat notification email sent to client:', clientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending chat notification email to client:', error);
    return false;
  }
};

const sendBusinessNotification = async (businessEmail, businessName, clientName, clientEmail, message) => {
  try {
    await sendEmail({
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
            <div class="header"><h2>💬 New Customer Message!</h2></div>
            <div class="content">
              <p>Hi ${businessName},</p>
              <p>You received a new message from a customer:</p>
              <div class="client-info"><strong>From:</strong> ${clientName}<br><strong>Email:</strong> ${clientEmail}</div>
              <div class="message-box">${message.length > 200 ? message.substring(0, 200) + '...' : message}</div>
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/business/" class="button">View & Reply</a>
              </p>
              <div class="footer"><p>Reply quickly to keep your customers happy! 😊</p></div>
            </div>
          </div>
        </body>
        </html>
      `
    });
    console.log('✅ Chat notification email sent to business:', businessEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending chat notification email to business:', error);
    return false;
  }
};

// ==================== EXPORTS ====================

const emailServiceInstance = new EmailService();

module.exports = () => emailServiceInstance;

module.exports.sendPasswordResetEmail = async (business, resetUrl, resetToken) => {
  return emailServiceInstance.sendPasswordResetEmail(business, resetUrl, resetToken);
};

module.exports.sendPasswordResetConfirmation = async (business) => {
  return emailServiceInstance.sendPasswordResetConfirmation(business);
};

module.exports.sendClientNotification = sendClientNotification;
module.exports.sendBusinessNotification = sendBusinessNotification;