// src/app/checkout/cancel/page.tsx
import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <main className="mx-auto max-w-xl p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Checkout canceled</h1>
      <p className="mb-6">
        No charge was made. You can try again any time.
      </p>

      <Link
        href="/"
        className="rounded bg-black px-4 py-2 text-white"
      >
        Back to app
      </Link>
    </main>
  );
}
