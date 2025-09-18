// src/app/(app)/dashboard/page.tsx
import { createServerClient } from "@/lib/supabaseServer";
import NewRecordForm from "./NewRecordForm";
import RecordItem from "./RecordItem";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <p>Not logged in</p>;

  // make sure profile row exists
  await supabase.from("profiles").upsert({ id: user.id, email: user.email }).eq("id", user.id);

  const { data: records } = await supabase
    .from("records")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <NewRecordForm userId={user.id} />
      <div className="grid gap-3">
        {records?.length ? (
          records.map((r) => <RecordItem key={r.id} record={r} />)
        ) : (
          <p>No records yet.</p>
        )}
      </div>
    </div>
  );
}
