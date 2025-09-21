export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">App is running</h1>
      <p className="mt-2">
        POST to <code>/api/billing/checkout</code> to create a checkout session.
      </p>
    </main>
  );
}
