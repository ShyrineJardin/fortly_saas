const cron = require('node-cron');
const { Op } = require('sequelize');
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);


const db = require('../config/database');

// ── Run every 5 minutes, check for appointments starting in ~1 hour ──
const startReminderScheduler = () => {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const now = new Date();

      const windowStart = new Date(now.getTime() + 45 * 60 * 1000);
      const windowEnd   = new Date(now.getTime() + 75 * 60 * 1000);

      const windowStartDate = windowStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const windowEndDate   = windowEnd.toISOString().split('T')[0];

      const windowStartTime = windowStart.toTimeString().slice(0, 5); // HH:MM
      const windowEndTime   = windowEnd.toTimeString().slice(0, 5);   // HH:MM

      // Find bookings in the upcoming window that haven't been reminded yet
      const upcomingBookings = await db.Booking.findAll({
        where: {
          status: { [Op.in]: ['pending', 'confirmed'] },
          reminderSent: { [Op.ne]: true }, // false or null (not yet sent)
          [Op.or]: [
            // Same date, time in window
            {
              bookingDate: windowStartDate,
              bookingTime: { [Op.between]: [windowStartTime, windowEndTime] }
            },
            // Edge case: window crosses midnight (rare but safe)
            ...(windowStartDate !== windowEndDate ? [{
              bookingDate: windowEndDate,
              bookingTime: { [Op.lte]: windowEndTime }
            }] : [])
          ]
        },
        include: [
          { model: db.Service, as: 'Service' },
          { model: db.Business, as: 'Business' }
        ]
      });

      if (upcomingBookings.length === 0) return;

      console.log(`⏰ Sending reminders for ${upcomingBookings.length} upcoming booking(s)...`);

      for (const booking of upcomingBookings) {
        try {
          await sendReminderEmails(booking, booking.Business, booking.Service);

          // Mark reminder as sent so we don't send it again
          await booking.update({ reminderSent: true });

          console.log(`✅ Reminder sent for booking ${booking.id} (${booking.clientName})`);
        } catch (err) {
          console.error(`❌ Failed to send reminder for booking ${booking.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('❌ Reminder scheduler error:', err.message);
      console.error('❌ Full error:', err);
    }
  });

  console.log('⏰ Appointment reminder scheduler started (runs every 5 minutes)');
};

// ── Send reminder to both client and business ──
const sendReminderEmails = async (booking, business, service) => {
  const FROM_EMAIL = 'Fortly <noreply@fortly.xyz>';

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const clientHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #10b981, #059669); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
        .content { background-color: #f9fafb; padding: 30px; }
        .card { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .tips { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 20px 0; }
        .tips p { margin: 0; color: #065f46; font-size: 14px; }
        .footer { background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Appointment Reminder</h1>
          <p>Your appointment is in 1 hour!</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #111827;">Hi <strong>${booking.clientName}</strong>,</p>
          <p style="color: #374151;">Just a friendly reminder that you have an upcoming appointment with <strong>${business.businessName}</strong>.</p>

          <div class="card">
            <div class="badge">📅 Coming Up in 1 Hour</div>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${service.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(booking.bookingDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${formatTime(booking.bookingTime)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${service.duration}</span>
            </div>
            ${booking.clientAddress ? `
            <div class="detail-row">
              <span class="detail-label">Location</span>
              <span class="detail-value">${business.location || booking.clientAddress}</span>
            </div>
            ` : ''}
          </div>

          ${business.location ? `
          <div class="card">
            <h3 style="margin-top: 0; color: #10b981; font-size: 15px;">📍 Location</h3>
            <p style="margin: 0; color: #374151; font-size: 14px;">${business.location}</p>
            ${business.phone ? `<p style="margin: 8px 0 0 0; font-size: 14px; color: #374151;">📞 ${business.phone}</p>` : ''}
          </div>
          ` : ''}

          <div class="tips">
            <p>💡 <strong>Tip:</strong> Please arrive a few minutes early to ensure a smooth experience!</p>
          </div>

          <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 24px;">
            Need to reschedule or cancel? Contact ${business.businessName} at ${business.email || business.phone || 'the business'}.
          </p>
        </div>
        <div class="footer">
          <p style="margin: 0;">© ${new Date().getFullYear()} ${business.businessName} • Powered by Fortly</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const businessHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 30px 20px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 15px; }
        .content { background-color: #f9fafb; padding: 30px; }
        .card { background: white; border-radius: 12px; padding: 24px; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .badge { display: inline-block; background: #ede9fe; color: #5b21b6; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: bold; margin-bottom: 16px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 500; }
        .footer { background: #1f2937; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Upcoming Appointment</h1>
          <p>You have a booking starting in 1 hour</p>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #111827;">Hi <strong>${business.businessName}</strong>,</p>
          <p style="color: #374151;">Heads up — you have a client appointment coming up in 1 hour.</p>

          <div class="card">
            <div class="badge">👤 Client Details</div>
            <div class="detail-row">
              <span class="detail-label">Name</span>
              <span class="detail-value">${booking.clientName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">${booking.clientEmail}</span>
            </div>
            ${booking.clientPhone ? `
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">${booking.clientPhone}</span>
            </div>
            ` : ''}
          </div>

          <div class="card">
            <div class="badge">📅 Appointment Details</div>
            <div class="detail-row">
              <span class="detail-label">Service</span>
              <span class="detail-value">${service.name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date</span>
              <span class="detail-value">${formatDate(booking.bookingDate)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time</span>
              <span class="detail-value">${formatTime(booking.bookingTime)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration</span>
              <span class="detail-value">${service.duration}</span>
            </div>
          </div>

          ${booking.notes ? `
          <div class="card">
            <h3 style="margin-top: 0; color: #6366f1; font-size: 15px;">📝 Client Notes</h3>
            <p style="margin: 0; color: #374151; font-size: 14px; font-style: italic;">"${booking.notes}"</p>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p style="margin: 0;">This is an automated reminder from your Fortly booking system.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Send both emails in parallel
  await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to: booking.clientEmail,
      subject: `⏰ Reminder: Your appointment with ${business.businessName} is in 1 hour`,
      html: clientHtml
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to: business.email,
      subject: `🔔 Reminder: Appointment with ${booking.clientName} in 1 hour`,
      html: businessHtml
    })
  ]);
};

module.exports = { startReminderScheduler };