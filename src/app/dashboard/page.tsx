// src/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import Link from 'next/link';

async function fetchProfile(baseUrl: string) {
  const res = await fetch(`${baseUrl}/api/profile`, {
    // Use Vercel internal fetch on the server; cookies are forwarded automatically in App Router
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}

function t(lang: string | null | undefined, key: string) {
  const en = {
    title: 'Your Business Profile',
    subtitle: 'Tell us about your business so advice is tailored to you.',
    company: 'Company name',
    industry: 'Industry',
    language: 'Preferred language',
    focus: 'Compliance focus (comma-separated, e.g., IRS,DOT,FDA)',
    save: 'Save profile',
    saved: 'Saved!',
  };
  const es = {
    title: 'Tu perfil de negocio',
    subtitle: 'Cuéntanos sobre tu negocio para personalizar el asesoramiento.',
    company: 'Nombre de la empresa',
    industry: 'Industria',
    language: 'Idioma preferido',
    focus: 'Enfoque de cumplimiento (separado por comas, ej.: IRS,DOT,FDA)',
    save: 'Guardar perfil',
    saved: '¡Guardado!',
  };
  const pa = {
    title: 'ਤੁਹਾਡਾ ਬਿਜ਼ਨਸ ਪ੍ਰੋਫ਼ਾਈਲ',
    subtitle: 'ਸਾਨੂੰ ਆਪਣੇ ਬਿਜ਼ਨਸ ਬਾਰੇ ਦੱਸੋ ਤਾਂ ਜੋ ਸਲਾਹ ਤੁਹਾਡੇ ਲਈ ਹੋਵੇ।',
    company: 'ਕੰਪਨੀ ਦਾ ਨਾਮ',
    industry: 'ਇੰਡਸਟਰੀ',
    language: 'ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ',
    focus: 'ਕਾਮਪਲਾਇੰਸ ਫੋਕਸ (ਕਾਮਾ ਨਾਲ, ਜਿਵੇਂ: IRS,DOT,FDA)',
    save: 'ਪ੍ਰੋਫ਼ਾਈਲ ਸੇਵ ਕਰੋ',
    saved: 'ਸੇਵ ਹੋ ਗਿਆ!',
  };

  const dict = lang === 'es' ? es : lang === 'pa' ? pa : en;
  return (dict as any)[key];
}

export default async function DashboardPage() {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    `https://${process.env.VERCEL_URL ?? 'saas-starter-beta-two.vercel.app'}`;

  const data = await fetchProfile(baseUrl);
  const user = data?.user ?? null;
  const lang = user?.language ?? 'en';

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t(lang, 'title')}</h1>
        <Link
          href="/"
          className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
        >
          Home
        </Link>
      </div>

      <p className="mb-8 text-gray-600">{t(lang, 'subtitle')}</p>

      <ProfileForm
        defaults={{
          companyName: user?.companyName ?? '',
          industry: user?.industry ?? '',
          language: user?.language ?? 'en',
          complianceFocus: user?.complianceFocus ?? '',
        }}
        baseUrl={baseUrl}
        dict={(k) => t(lang, k)}
      />
    </main>
  );
}

// ----- Client component -----
'use client';

import { useState } from 'react';

function ProfileForm({
  defaults,
  baseUrl,
  dict,
}: {
  defaults: {
    companyName: string;
    industry: string;
    language: string;
    complianceFocus: string;
  };
  baseUrl: string;
  dict: (k: string) => string;
}) {
  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${baseUrl}/api/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setMsg(dict('saved'));
    } catch (err: any) {
      setMsg(err.message ?? 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict('company')}
        </label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          placeholder="Kaushal Logistics LLC"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict('industry')}
        </label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={form.industry}
          onChange={(e) => setForm({ ...form, industry: e.target.value })}
          placeholder="Trucking"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict('language')}
        </label>
        <select
          className="w-full rounded-md border px-3 py-2"
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {dict('focus')}
        </label>
        <input
          className="w-full rounded-md border px-3 py-2"
          value={form.complianceFocus}
          onChange={(e) =>
            setForm({ ...form, complianceFocus: e.target.value })
          }
          placeholder="IRS,DOT,FDA"
        />
      </div>

      <button
        disabled={saving}
        className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? 'Saving…' : dict('save')}
      </button>

      {msg && <p className="text-sm text-green-600">{msg}</p>}
    </form>
  );
}
