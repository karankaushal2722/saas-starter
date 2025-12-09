// src/lib/db.ts
import prisma from "@/lib/prisma";

export type SaveProfileInput = {
  email: string;
  fullName?: string | null;
};

/**
 * Get a user by email.
 * (Replaces old getProfileByEmail that used prisma.profile)
 */
export async function getProfileByEmail(email: string) {
  if (!email) {
    throw new Error("email is required");
  }

  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create or update a user record for this email.
 * (Replaces old profile save logic)
 */
export async function saveProfile(input: SaveProfileInput) {
  const { email, fullName } = input;

  if (!email) {
    throw new Error("email is required");
  }

  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
    },
    create: {
      email,
      fullName,
    },
  });
}
