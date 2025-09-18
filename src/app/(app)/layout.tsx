// src/app/(app)/layout.tsx
import Link from "next/link";

export default function AppSectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-12">
      <aside className="col-span-3 lg:col-span-2 border-r p-4 space-y-3">
        <div className="text-xl font-bold">Your App</div>
        <nav className="flex flex-col gap-2">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/billing">Billing</Link>
          <Link href="/settings">Settings</Link> {/* ← add this */}
        </nav>
      </aside>
      <main className="col-span-9 lg:col-span-10 p-6">{children}</main>
    </div>
  );
}
