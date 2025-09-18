// src/lib/supabaseServer.ts
// Server-side helper for Supabase in Next.js server components / routes

import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
// If you generated DB types, update the path below. If not, the `any` fallback is used.
import type { Database } from "@/types/supabase";

export function createServerClient() {
  return createServerComponentClient<Database>({ cookies });
}
