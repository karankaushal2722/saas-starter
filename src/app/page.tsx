// src/app/page.tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-3 text-2xl font-semibold">App is running</h1>
      <p className="text-gray-600">
        Go to your{' '}
        <a
          href="/dashboard"
          className="text-blue-600 underline hover:no-underline"
        >
          dashboard
        </a>{' '}
        to set your profile. POST to <code>/api/billing/checkout</code> to test
        Stripe checkout.
      </p>
    </main>
  );
}
