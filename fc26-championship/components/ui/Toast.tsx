'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: '#0d1440',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#f0f2fa',
          borderRadius: '10px',
          fontSize: '0.9rem',
        },
      }}
    />
  )
}
