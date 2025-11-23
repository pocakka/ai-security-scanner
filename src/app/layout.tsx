import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// SEO-Optimized Metadata
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),

  title: {
    default: 'AI Security Scanner - Free OWASP LLM Vulnerability Detection',
    template: '%s | AI Security Scanner'
  },

  description: 'Free AI security scanner for detecting OWASP LLM Top 10 vulnerabilities, AI implementation risks, and security misconfigurations. Scan any website in seconds with our comprehensive security analysis tool.',

  keywords: [
    'AI security scanner',
    'LLM security',
    'OWASP LLM Top 10',
    'AI vulnerability detection',
    'security scanner',
    'AI risk assessment',
    'prompt injection detection',
    'AI security audit',
    'machine learning security',
    'ChatGPT security',
    'free security scanner',
    'website vulnerability scanner',
    'OWASP security',
    'AI implementation security',
    'LLM vulnerability scanner'
  ],

  authors: [
    { name: 'AI Security Scanner Team' }
  ],

  creator: 'AI Security Scanner',
  publisher: 'AI Security Scanner',

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
    locale: 'en_US',
    url: '/',
    title: 'AI Security Scanner - Free OWASP LLM Vulnerability Detection',
    description: 'Scan websites for AI security risks and OWASP LLM vulnerabilities. Free, comprehensive security analysis in seconds.',
    siteName: 'AI Security Scanner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Security Scanner - OWASP LLM Vulnerability Detection',
      }
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'AI Security Scanner - Free OWASP LLM Vulnerability Detection',
    description: 'Scan websites for AI security risks and OWASP LLM vulnerabilities',
    images: ['/og-image.png'],
    creator: '@aisecurityscan',
  },

  verification: {
    google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },

  alternates: {
    canonical: '/',
  },

  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Structured Data - WebApplication Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'AI Security Scanner',
              description: 'Free AI security scanner for detecting OWASP LLM Top 10 vulnerabilities',
              url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
              applicationCategory: 'SecurityApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              featureList: [
                'OWASP LLM Top 10 Detection',
                'AI Implementation Risk Assessment',
                'Security Misconfiguration Detection',
                'SSL/TLS Analysis',
                'Cookie Security Audit',
                'DNS Security Check',
                'Compliance Assessment (GDPR, CCPA)',
                'Technology Stack Detection',
                'Vulnerability Scanning',
                'PDF Report Generation'
              ],
              browserRequirements: 'Requires JavaScript. Requires HTML5.',
              softwareVersion: '2.0',
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '1247',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
