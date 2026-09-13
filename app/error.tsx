"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Nexora page error", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f7fb] px-5 text-center text-[#101a38]">
      <section className="w-full max-w-md rounded-xl border border-[#e4e8f1] bg-white p-8 shadow-[0_12px_35px_rgba(30,44,83,.08)]">
        <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#5960f2]">Something went wrong</p>
        <h1 className="mt-2 font-display text-2xl font-semibold">The page could not load</h1>
        <p className="mt-2 text-sm text-[#8992a8]">Please try again. Your saved records are not affected.</p>
        <button type="button" onClick={() => reset()} className="mt-6 rounded-lg bg-[#5960f2] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#4e55e5]">
          Try again
        </button>
      </section>
    </main>
  );
}
