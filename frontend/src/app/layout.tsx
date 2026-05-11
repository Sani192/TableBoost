import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navigation from '@/components/Navigation';

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
        <Navigation />
        <div className="container-app min-h-screen py-4 pb-20 sm:py-6 sm:pt-24 lg:py-8 lg:pt-28">
          {children}
        </div>
      </body>
    </html>
  );
}
