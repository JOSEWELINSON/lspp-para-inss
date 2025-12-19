
'use client';

import { useEffect } from 'react';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';

// Metadata cannot be exported from a client component.
// We will manage the title and other head elements directly in the component.

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('Service Worker registered with scope:', registration.scope))
        .catch((error) => console.log('Service Worker registration failed:', error));
    }
  }, []);

  return (
    <html lang="pt-BR">
      <head>
        <title>LSPP do INSS</title>
        <meta name="description" content="Aplicativo para gestão de benefícios do INSS" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="https://firebasestorage.googleapis.com/v0/b/yulacesso.appspot.com/o/Screenshot_20250930-070813_(1)_(1).png?alt=media&token=d2815605-ff33-4c40-a04c-e76350e88ef4" type="image/png" sizes="any" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
