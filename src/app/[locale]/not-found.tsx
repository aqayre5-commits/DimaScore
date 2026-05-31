import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex flex-col items-center gap-2">
        <span className="text-accent-azure text-6xl font-bold">404</span>
        <h1 className="text-display text-2xl font-semibold">Page not found</h1>
        <p className="text-secondary text-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="bg-accent-azure hover:bg-accent-azure/90 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
