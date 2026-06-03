import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FC26 Championship',
  description: 'Private FC26 friends championship platform',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
