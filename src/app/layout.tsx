// src/app/layout.tsx
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'
import { AuthProvider } from '../components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'LinguaLeap - Language Learning Platform',
  description: 'Learn languages with AI-powered assistance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning className={inter.className}>
        <div className="min-h-screen bg-gray-900 text-gray-100">
          <AuthProvider>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8">
              {children}
            </main>
          </AuthProvider>
        </div>
      </body>
    </html>
  )
}