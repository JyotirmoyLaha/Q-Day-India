import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-serif text-6xl font-semibold">404</p>
      <h1 className="mt-4 text-xl">This page doesn&apos;t exist.</h1>
      <p className="mt-2 text-muted">
        Looking for a site that isn&apos;t in the index? <Link href="/check" className="underline">Run a live check</Link>.
      </p>
      <p className="mt-6">
        <Link href="/" className="text-accent underline">
          Back to the home page
        </Link>
      </p>
    </div>
  );
}
