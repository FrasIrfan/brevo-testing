import './globals.css';

export const metadata = {
  title: 'Firebase Chat Test',
  description: 'A simple chat testing interface using Firebase',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
} 