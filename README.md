# Next.js Authentication with Firebase and Brevo

A modern authentication system built with Next.js, featuring email verification using Firebase Authentication and Brevo email service.

## Features

- 🔐 User Authentication (Sign up, Sign in, Password Reset)
- ✉️ Email Verification
- 🛡️ Secure Password Handling
- 🎨 Modern UI with Tailwind CSS
- ⚡ Server-Side Rendering with Next.js
- 🔄 Real-time Form Validation

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- Git

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Brevo Configuration
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_sender_email
BREVO_SENDER_NAME=Your App Name

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd next-brevo-auth
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
next-brevo-auth/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── route.ts    # Authentication API endpoints
│   │   ├── signup/
│   │   │   └── page.tsx        # Signup page component
│   │   └── page.tsx            # Home page
│   ├── lib/
│   │   ├── firebase.ts         # Firebase configuration
│   │   └── brevo.ts            # Brevo email service integration
│   └── components/             # Reusable components
├── public/                     # Static files
├── .env.local                 # Environment variables
└── package.json               # Project dependencies
```

## Authentication Flow

1. **User Registration**
   - User submits email and password
   - Frontend validates input
   - Backend creates Firebase account
   - Verification email sent via Brevo

2. **Email Verification**
   - User receives verification email
   - Clicks verification link
   - Account status updated in Firebase

3. **Login**
   - User enters credentials
   - Firebase authenticates
   - Session created

## API Routes

### POST /api/auth
Handles authentication requests with the following actions:
- `signup`: Create new user account
- `login`: Authenticate existing user
- `resetPassword`: Send password reset email

## Security

- Server-side validation
- Secure password handling via Firebase
- Environment variable protection
- Content-type validation
- CORS protection

