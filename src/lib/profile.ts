// src/lib/profile.ts
import { saveProfileInput } from "./db";

/**
 * Make sure there is a `profiles` row for this email.
 * If it exists, do nothing. If not, create it.
 */
export async function ensureProfileForEmail(email: string | null | undefined) {
  if (!email) {
    console.warn("[ensureProfileForEmail] No email provided, skipping");
    return null;
  }

  // For now we only care that the row exists.
  // If you later add more fields (full_name, etc.), you can pass them here.
  const user = await saveProfileInput({ email });

  return user;
}
