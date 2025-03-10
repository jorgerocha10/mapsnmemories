import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { CartProvider } from '@/context/CartContext';
import { SessionProvider } from '@/components/session-provider';
import { ToastProvider } from '@/components/toast-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Maps N Memories - E-commerce Store',
  description: 'Shop for memories and maps',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <CartProvider>
              <ToastProvider>
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <footer className="border-t py-6 md:py-0">
                    <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
                      <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Maps N Memories. All rights reserved.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Built with Next.js and Shadcn UI
                      </p>
                    </div>
                  </footer>
                </div>
              </ToastProvider>
            </CartProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
