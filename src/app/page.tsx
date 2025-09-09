export default function Home() {
  return (
    <main className="p-10 text-center">
      <h1 className="text-4xl font-bold">🚀 It works!</h1>
      <p className="mt-4 text-lg text-gray-600">
        Your Next.js + Tailwind project is running correctly.
      </p>
      <p className="mt-8">
        <a
          href="/tools/summarize"
          className="inline-block px-5 py-3 rounded-xl bg-black text-white"
        >
          Try the AI Summarizer
        </a>
      </p>
    </main>
  );
}
