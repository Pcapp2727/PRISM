import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PRISM - Decision Intelligence',
  description: 'Pattern Recognition & Intelligent Strategy Mapping',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
