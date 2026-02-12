import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'URL Shortener - Fast & Reliable Link Shortening',
  description:
    'Create short URLs with analytics tracking. Fast, secure, and reliable URL shortening service.',
  keywords: ['url shortener', 'link shortener', 'analytics', 'short links'],
  authors: [{ name: 'URL Shortener Team' }],
  openGraph: {
    title: 'URL Shortener with Analytics',
    description: 'Create short URLs with click analytics tracking',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
