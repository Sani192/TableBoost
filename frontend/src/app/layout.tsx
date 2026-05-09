import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TableBoost',
  description: 'Fast restaurant visit capture and review SMS tracking.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fff7ed',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white/70 shadow-[0_0_80px_-45px_rgba(15,23,42,0.8)] sm:my-6 sm:min-h-[calc(100vh-3rem)] sm:overflow-hidden sm:rounded-[2.25rem]">
          {children}
        </main>
      </body>
    </html>
  );
}
