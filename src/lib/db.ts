// src/lib/db.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // allow global `var prisma` so we don't create multiple clients in dev
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

/**
 * Get the user row for a given email.
 * (Used as the "profile" for now.)
 */
export async function getProfileByEmail(email: string) {
  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Save profile input.
 * Right now we just make sure a user row exists for this email.
 * Any extra fields in `input` are ignored for now so we don't
 * fight with Prisma types while you're wiring everything up.
 */
export async function saveProfileInput(
  input: { email: string } & Record<string, any>
) {
  const { email } = input;
  if (!email) throw new Error("Email is required");

  return prisma.user.upsert({
    where: { email },
    // No unknown fields here – matches your current User model
    update: {},
    create: { email },
  });
}


