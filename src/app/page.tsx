// src/app/page.tsx
export default function HomePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>App is running</h1>
      <p>POST to <code>/api/billing/checkout</code> to create a checkout session.</p>
    </main>
  );
}
