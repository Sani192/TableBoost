import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TableBoost',
  description: 'Restaurant Visit & SMS Tracker',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen bg-gray-50 flex flex-col items-center">
          <div className="w-full max-w-md bg-white min-h-screen shadow-md relative">
            {children}
          </div>
        </main>
      </body>
    </html>
  )
}
