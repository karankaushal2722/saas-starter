import Link from "next/link";

export default function DashboardPage() {
  return (
    <main style={{ maxWidth: "800px", margin: "2rem auto", fontFamily: "system-ui, sans-serif" }}>
      <h1>Your Legal Copilot Dashboard</h1>

      <p style={{ marginTop: "1rem" }}>
        ✅ Your account is created and the database connection is working.
      </p>

      <p style={{ marginTop: "0.5rem" }}>
        Next, tell your copilot about your business so it can give{" "}
        <strong>better legal guidance in your language.</strong>
      </p>

      <div style={{ marginTop: "1.5rem" }}>
        <Link href="/dashboard/profile">Complete your business profile →</Link>
      </div>

      <hr style={{ margin: "2rem 0" }} />

      <section>
        <h2>Coming next: your multilingual AI legal assistant</h2>
        <p>
          Soon this dashboard will let you upload contracts, ask legal questions, and get answers
          tuned to <strong>your industry and language preferences</strong>.
        </p>
        <p>
          For now, finish your <Link href="/dashboard/profile">business profile</Link> so we’re ready
          to plug in the AI.
        </p>
      </section>

      <p style={{ marginTop: "2rem" }}>
        <Link href="/">← Back to home</Link>
      </p>
    </main>
  );
}
