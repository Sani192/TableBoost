import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TableBoost — Quick Billing Desk',
  description: 'Fast restaurant visit capture, customer tracking, and review SMS management.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fafaf9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="container-app min-h-screen py-4 sm:py-6 lg:py-8">
          {children}
        </div>
      </body>
    </html>
  );
}
