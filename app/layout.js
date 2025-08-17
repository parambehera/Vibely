// app/layout.js or app/layout.tsx

'use client'
import Navbar from '@/components/Navbar'
import './globals.css'
import { SessionProvider } from 'next-auth/react'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
        <Navbar/>
          {children}
          <Toaster position="top-right" reverseOrder={false} />
        </SessionProvider>
      </body>
    </html>
  )
}
