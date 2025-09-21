import { prisma } from "./prisma";

export async function getProfileByEmail(email: string) {
  if (!email) throw new Error("email is required");
  return prisma.profile.findUnique({ where: { email } });
}

type SaveProfileInput = {
  email: string;
  companyName?: string | null;
  industry?: string | null;
  language?: string | null;
  complianceFocus?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan?: string | null;
};

export async function saveProfile(input: SaveProfileInput) {
  const { email, ...rest } = input;
  if (!email) throw new Error("email is required");

  const result = await prisma.profile.upsert({
    where: { email },
    update: { ...rest },
    create: { email, ...rest }
  });

  await addAuditLog({
    email,
    event: "profile.saved",
    data: result
  });

  return result;
}

export async function addAuditLog(params: { email?: string | null; event: string; data?: any }) {
  const { email, event, data } = params;
  return prisma.auditLog.create({
    data: { email: email ?? null, event, data }
  });
}
