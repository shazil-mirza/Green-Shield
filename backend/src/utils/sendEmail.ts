import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

const sendEmail = async (options: MailOptions): Promise<void> => {
  // 1. Create a transporter
  // Ensure EMAIL_PORT is treated as a number. Default to 587 if not set or invalid.
  const portNumber = Number(process.env.EMAIL_PORT);
  const mailPort = isNaN(portNumber) || portNumber === 0 ? 587 : portNumber;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: mailPort,
    secure: mailPort === 465, // true for 465 (SSL), false for other ports (typically STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Additional options for development or specific providers:
    // tls: {
    //   // do not fail on invalid certs (for local testing with self-signed certs)
    //   rejectUnauthorized: process.env.NODE_ENV === 'production',
    // },
  });

  // 2. Define the email options
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Green Shield App" <noreply@example.com>', // sender address
    to: options.to,
    subject: options.subject,
    text: options.text, // Plain text body (optional, good for accessibility)
    html: options.html, // HTML body
  };

  // 3. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully. Message ID: %s', info.messageId);
    // console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info)); // Only if using ethereal.email
  } catch (error) {
    console.error('Error sending email:', error);
    // Avoid exposing detailed error messages to the caller in production
    // The controller should handle user-facing messages.
    throw new Error('Email could not be sent due to a server error.');
  }
};

export default sendEmail;
