// src/app/page.tsx
export default function HomePage() {
  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto", lineHeight: 1.6 }}>
      <h1>Small Business Legal & Compliance Copilot</h1>
      <p>
        Your AI assistant for staying compliant (IRS, DOT, FDA and more), reading documents, and
        answering “what do I do now?” questions tailored to your business and language.
      </p>

      <ul style={{ marginTop: 16 }}>
        <li><a href="/dashboard">Go to Dashboard</a></li>
        <li><a href="/billing">Manage Billing</a></li>
      </ul>

      <section style={{ marginTop: 24 }}>
        <h3>How to try billing</h3>
        <ol>
          <li>Open <a href="/billing">Billing</a>.</li>
          <li>Click “Subscribe (Stripe Checkout)”.</li>
          <li>Use Stripe test cards (e.g., 4242 4242 4242 4242).</li>
        </ol>
      </section>
    </main>
  );
}
