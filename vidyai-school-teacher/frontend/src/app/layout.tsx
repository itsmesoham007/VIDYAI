import type { Metadata, Viewport } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const viewport: Viewport = {
  themeColor: '#C96442',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://vidyai.vercel.app'),
  title: {
    default: 'VidyAI — GSEB English Medium Student Portal & AI Teacher (Std 1 to 12)',
    template: '%s | VidyAI GSEB'
  },
  description: 'AI School Teacher for Gujarat Board (GSEB) English Medium students from Standard 1 to 12, powered by Google Gemini.',
  manifest: '/manifest.json',
  keywords: [
    'GSEB',
    'Gujarat Board',
    'GSEB English Medium',
    'Standard 10 SSC',
    'Standard 12 HSC',
    'GSEB Textbook Solutions',
    'GSEB Board Papers',
    'GSEB Blueprint',
    'VidyAI',
    'AI School Teacher',
    'Gujarat Secondary Education Board'
  ],
  authors: [{ name: 'VidyAI Team' }],
  creator: 'VidyAI',
  publisher: 'VidyAI Education',
  applicationName: 'VidyAI',
  category: 'Education',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://vidyai.vercel.app',
    siteName: 'VidyAI — GSEB Student Portal',
    title: 'VidyAI — GSEB English Medium Student Portal & AI Teacher (Std 1-12)',
    description: 'Personalized AI Teacher, syllabus tracker, formula revision notebook, past board papers, and timed mock exam center for Gujarat Board English Medium students.',
    images: [
      {
        url: '/logo-card.png',
        width: 1024,
        height: 1024,
        alt: 'VidyAI — GSEB English Medium AI Teacher',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'VidyAI — GSEB English Medium Student Portal',
    description: 'AI Teacher and student portal for GSEB English Medium students from Standard 1 to 12.',
    images: ['/logo-card.png'],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/logo.png', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'VidyAI',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full h-[100dvh] overflow-hidden">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#C96442" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="h-full h-[100dvh] overflow-hidden bg-[#FAF9F5] text-[#1F1E1D] font-sans antialiased selection:bg-[#C96442]/20 selection:text-[#1F1E1D]">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
