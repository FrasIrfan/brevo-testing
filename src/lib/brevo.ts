'use server';

// Remove SDK usage and use direct API calls
export const sendVerificationEmail = async (email: string, verificationLink: string) => {
  // Validate required environment variables
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    throw new Error('BREVO_SENDER_EMAIL is not configured');
  }

  const url = 'https://api.sendinblue.com/v3/smtp/email';
  const sender = { 
    email: process.env.BREVO_SENDER_EMAIL, 
    name: process.env.BREVO_SENDER_NAME || 'Your App Name' 
  };
  const receivers = [{ email }];

  try {
    console.log('Sending verification email to:', email);
    console.log('Using verification link:', verificationLink);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender,
        to: receivers,
        subject: 'Verify Your Email',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333;">Email Verification</h1>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" 
                 style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Verify Email
              </a>
            </div>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      }),
    });

    const responseText = await response.text();
    console.log('Raw API response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response:', parseError);
      throw new Error('Invalid response from email service');
    }

    if (!response.ok) {
      console.error('Brevo API error:', data);
      throw new Error(data.message || 'Failed to send verification email');
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email: ' + (error as Error).message);
  }
}; 