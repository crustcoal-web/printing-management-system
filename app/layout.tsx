import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'NAAM Studio - Order & Business Management System',
  description: 'Production Order Management, Customer Ledger, Payments, Expenses, Profit Analytics & DOCX Slip Generator for NAAM Studio',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/logo-icon.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/logo-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
