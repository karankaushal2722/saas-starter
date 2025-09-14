// src/app/checkout/success/page.tsx
import Link from "next/link";

export default function CheckoutSuccess() {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">🎉 Subscription Active</h1>
      <p className="mb-6">
        Thanks for subscribing! Your payment was successful and your account is now active.
      </p>

      <div className="space-x-3">
        <Link
          href="/"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Go to the app
        </Link>

        <Link
          href="/api/billing/portal"
          className="rounded border px-4 py-2"
        >
          Manage billing
        </Link>
      </div>
    </main>
  );
}
