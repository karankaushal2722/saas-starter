// src/lib/db.ts
import { prisma } from '@/lib/prisma'

export async function getProfileByEmail(email: string) {
  if (!email) throw new Error('email is required')
  return prisma.profile.findUnique({ where: { email } })
}

export type SaveProfileInput = {
  email: string
  fullName?: string | null
}

export async function upsertProfile(input: SaveProfileInput) {
  const { email, fullName } = input
  if (!email) throw new Error('email is required')

  return prisma.profile.upsert({
    where: { email },
    update: { fullName: fullName ?? undefined },
    create: { email, fullName: fullName ?? undefined },
  })
}
