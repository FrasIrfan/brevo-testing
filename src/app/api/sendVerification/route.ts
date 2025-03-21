import { NextResponse } from 'next/server';
import SibApiV3Sdk from 'sib-api-v3-sdk';

if (!process.env.BREVO_API_KEY) {
  throw new Error('BREVO_API_KEY environment variable is not set');
}

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, verificationCode } = body;

    const sender = { email: 'your-verified-sender@example.com', name: 'Your Name' };
    const receivers = [{ email }];

    const response = await apiInstance.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Email Verification',
      htmlContent: `
        <h1>Email Verification</h1>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
} 