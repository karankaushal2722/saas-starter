"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string>("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setDebug("Submitting...");
    setLoading(true);

    try {
      if (mode === "sign-up") {
        const { data, error } = await supabaseClient.auth.signUp({
          email,
          password,
        });

        console.log("signUp result", { data, error });
        setDebug(`signUp: ${JSON.stringify({ data, error })}`);

        if (error) throw error;
      } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        });

        console.log("signIn result", { data, error });
        setDebug(`signIn: ${JSON.stringify({ data, error })}`);

        if (error) throw error;
      }

      // If we get here, auth call succeeded
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Auth error", err);
      setError(err?.message ?? "Something went wrong");
      setDebug(`Error: ${err?.message ?? "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-lg p-6">
        <h1 className="text-2xl font-semibold mb-4 text-center">
          {mode === "sign-up" ? "Create your account" : "Sign in"}
        </h1>
        <p className="text-sm text-gray-600 mb-6 text-center">
          AI legal assistant for small and immigrant-owned businesses.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          {debug && (
            <p className="text-xs text-gray-500 break-all">
              Debug: {debug}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md px-4 py-2 bg-black text-white disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === "sign-up" ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("sign-in")}
                className="underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New here?{" "}
              <button
                type="button"
                onClick={() => setMode("sign-up")}
                className="underline"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
