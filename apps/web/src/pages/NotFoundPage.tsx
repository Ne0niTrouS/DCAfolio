import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-2 text-sm text-ink-muted">That page does not exist.</p>
      <Link to="/" className="mt-6 text-sm text-accent hover:underline">
        Back to the dashboard
      </Link>
    </main>
  );
}
