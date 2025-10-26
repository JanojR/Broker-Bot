import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Contractr.AI - Contractor Sourcing & Negotiation',
  description: 'Automated contractor discovery and negotiation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
