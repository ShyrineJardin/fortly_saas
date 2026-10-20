const axios = require('axios');

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || 'Fortly';

  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!senderEmail) {
    throw new Error('BREVO_SENDER_EMAIL is not configured');
  }

  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
      },
      {
        headers: {
          'api-key': apiKey,
          'content-type': 'application/json'
        }
      }
    );
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    throw new Error(`Brevo email request failed${status ? ` (${status})` : ''}: ${message}`);
  }
};

module.exports = { sendEmail };
