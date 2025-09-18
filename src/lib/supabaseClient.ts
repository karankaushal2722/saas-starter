// src/lib/supabaseClient.ts
// Client-side helper for Supabase in Next.js (used in "use client" components)

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
// If you generated DB types, update the path below. If not, the `any` fallback is used.
import type { Database } from "@/types/supabase";

export const supabase = createClientComponentClient<Database>();
