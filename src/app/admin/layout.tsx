import Link from 'next/link';
import { IBM_Plex_Sans } from 'next/font/google';
import { LogoutButton } from '@/components/admin/LogoutButton';
import '../globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: 'Atlas Kings Admin',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} h-full antialiased`}>
      <body className="font-[family-name:var(--font-ibm-plex-sans)] min-h-full bg-bg-canvas text-text-primary">
        <header className="flex h-10 items-center justify-between border-b border-border-subtle bg-bg-surface px-4">
          <Link href="/admin/media" className="text-sm font-semibold">
            Atlas Kings Admin
          </Link>
          <LogoutButton />
        </header>
        {children}
      </body>
    </html>
  );
}
