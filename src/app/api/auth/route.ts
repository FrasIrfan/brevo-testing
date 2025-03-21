import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { sendVerificationEmail } from '@/lib/brevo';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  deleteUser
} from 'firebase/auth';

export async function POST(request: Request) {
  console.log('Received auth request');
  
  try {
    // Validate content type
    const contentType = request.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    if (contentType !== 'application/json') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Content-Type must be application/json' 
        }), 
        { 
          status: 415,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get and validate request body
    const text = await request.text();
    console.log('Raw request body:', text);

    if (!text) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Request body is empty' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = JSON.parse(text);
      console.log('Parsed request body:', body);
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid JSON in request body' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    const { action, email, password } = body;
    if (!action || !email || (action !== 'resetPassword' && action !== 'deleteAccount' && !password)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields' 
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Handle different actions
    switch (action) {
      case 'signup': {
        try {
          // Create user account
          console.log('Creating user account for:', email);
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          console.log('User account created:', userCredential.user.uid);
          
          // Generate verification link
          const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?uid=${userCredential.user.uid}`;
          console.log('Generated verification link:', verificationLink);
          
          try {
            // Send verification email
            console.log('Attempting to send verification email...');
            await sendVerificationEmail(email, verificationLink);
            console.log('Verification email sent successfully');
            
            // Return success response
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Account created and verification email sent',
                user: {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email || email
                }
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } catch (emailError: any) {
            console.error('Failed to send verification email:', emailError);
            
            // Return partial success - account created but email failed
            return new Response(
              JSON.stringify({
                success: true,
                message: 'Account created but verification email failed to send. Please try again later.',
                error: emailError.message,
                user: {
                  uid: userCredential.user.uid,
                  email: userCredential.user.email || email
                }
              }),
              { 
                status: 201,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        } catch (error: any) {
          console.error('Signup error:', error);
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || 'Failed to create account',
              code: error.code
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      case 'login': {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          return new Response(
            JSON.stringify({
              success: true,
              user: {
                uid: userCredential.user.uid,
                email: userCredential.user.email
              }
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || 'Failed to login',
              code: error.code
            }),
            { 
              status: 401,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      case 'resetPassword': {
        try {
          await sendPasswordResetEmail(auth, email);
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Password reset email sent'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || 'Failed to send reset email',
              code: error.code
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      case 'deleteAccount': {
        try {
          // First sign in the user to verify credentials
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          
          // Then delete the account
          await deleteUser(userCredential.user);
          
          return new Response(
            JSON.stringify({
              success: true,
              message: 'Account successfully deleted'
            }),
            { 
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              success: false,
              error: error.message || 'Failed to delete account',
              code: error.code
            }),
            { 
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid action'
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
    }
  } catch (error: any) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 