const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

let emailCount = 0;


// Send notification email to client
const sendClientNotification = async (clientEmail, clientName, businessName, message, businessSlug) => {
  emailCount++;
  console.log(`📧 Email sent (${emailCount} today)`);
  
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
    console.log('✅ Email sent to client:', clientEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending email to client:', error);
    return false;
  }
};

// Send notification email to business
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
    console.log('✅ Email sent to business:', businessEmail);
    return true;
  } catch (error) {
    console.error('❌ Error sending email to business:', error);
    return false;
  }
};

module.exports = {
  sendClientNotification,
  sendBusinessNotification
};