"use client";

import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("admin@nexora.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      setError("The email or password is incorrect.");
      setBusy(false);
      return;
    }
    router.replace(searchParams.get("from") || "/");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen bg-[#f5f7fb] lg:grid-cols-[minmax(360px,0.9fr)_1.1fr]">
      <section className="relative hidden overflow-hidden bg-[#0e1838] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="relative z-10 flex items-center">
          <span className="font-display text-[22px] font-bold tracking-[0.22em] text-white">
            NEXORA
          </span>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[.2em] text-[#8f9bca]">Operations intelligence</p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-[-.04em]">A clearer view of every moving part.</h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-[#aab4d2]">Manage assets, people, devices, and maintenance from one focused workspace.</p>
        </div>
        <p className="relative z-10 text-xs text-[#7985ae]">Nexora admin console</p>
        <div className="login-grid absolute inset-0 opacity-30" />
      </section>
      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef0ff] text-[#5960f2]">
              <ShieldCheck size={20} />
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[.16em] text-[#8e98ae]">Welcome back</p>
            <h2 className="font-display text-3xl font-semibold tracking-[-.04em] text-[#101a38]">Sign in to Nexora</h2>
            <p className="mt-2 text-sm text-[#8a94aa]">Use your administrator account to continue.</p>
          </div>
          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-[#e4e8f1] bg-white p-6 shadow-[0_18px_50px_rgba(30,44,83,.08)]">
            <label className="block text-xs font-semibold text-[#4f5b78]">Email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#dfe4ee] px-3 text-sm font-normal text-[#101a38] outline-none transition focus:border-[#5960f2] focus:ring-4 focus:ring-[#5960f2]/10" /></label>
            <label className="block text-xs font-semibold text-[#4f5b78]">Password<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 text-[#a0a8bb]" size={16} /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border border-[#dfe4ee] pl-10 pr-3 text-sm font-normal text-[#101a38] outline-none transition focus:border-[#5960f2] focus:ring-4 focus:ring-[#5960f2]/10" /></div></label>
            {error && <p className="rounded-lg bg-[#fff1f1] px-3 py-2 text-xs text-[#c05761]">{error}</p>}
            <button disabled={busy} className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#5960f2] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(89,96,242,.25)] transition hover:bg-[#4e55e5] disabled:opacity-60">{busy ? "Signing in..." : "Sign in"}<ArrowRight size={16} /></button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f5f7fb]" />}>
      <LoginForm />
    </Suspense>
  );
}
