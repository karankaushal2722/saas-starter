// src/app/(app)/settings/page.tsx
import { createServerClient } from "@/lib/supabaseServer";
import SettingsForm from "./ui/SettingsForm";
import SubscriptionCard from "./ui/SubscriptionCard";

export default async function SettingsPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // If middleware is active this shouldn't happen (it will redirect to /login).
    return <div style={{ padding: 24 }}>You must be signed in to view settings.</div>;
  }

  // Ensure a profile row exists for this user
  await supabase
    .from("profiles")
    .upsert({ id: user.id, email: user.email ?? null })
    .select();

  // Fetch profile
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return <div style={{ padding: 24 }}>Error loading profile.</div>;
  }

  // Supply priceId as a server-side prop (replace with your real Price ID or set NEXT_PUBLIC_STRIPE_PRICE_ID)
  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? "price_123"; // replace "price_123"

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Profile</h2>
        <SettingsForm profile={profile} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Subscription</h2>
        <SubscriptionCard isActive={!!profile?.is_active} email={user.email!} priceId={priceId} />
      </section>
    </div>
  );
}
