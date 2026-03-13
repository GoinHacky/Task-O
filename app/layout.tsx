import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// Default metadata for the app
export const metadata: Metadata = {
  title: 'Task-O',
  description: 'Professional task and project management application',
}

import { ThemeProvider } from '@/components/ThemeProvider'
import { SidebarProvider } from '@/components/SidebarContext'
import { GuidedTourProvider } from '@/components/GuidedTour'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SidebarProvider>
          <GuidedTourProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </GuidedTourProvider>
        </SidebarProvider>
      </body>
    </html>
  )
}