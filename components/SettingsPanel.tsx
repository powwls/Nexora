"use client";

import { CheckCircle2, Database, LoaderCircle, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type HealthResponse = {
  connected: boolean;
  database?: string;
  error?: string;
};

export default function SettingsPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [reloading, setReloading] = useState(false);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      const data = (await response.json()) as HealthResponse;
      setHealth(data);
    } catch {
      setHealth({ connected: false, error: "The health check could not be reached." });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkConnection();
  }, [checkConnection]);

  function reloadApplication() {
    setReloading(true);
    window.location.reload();
  }

  const isConnected = health?.connected === true;

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)]">
      <section className="panel-shadow rounded-xl border border-[#e4e8f1] bg-white p-4 sm:p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eafaf5] text-[#22a887]">
              <Database size={18} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold">Database connection</h3>
              <p className="mt-1 text-sm text-[#8992a8]">Live PostgreSQL status for this workspace.</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${checking ? "bg-[#f1f3f8] text-[#8992a8]" : isConnected ? "bg-[#e5f8f2] text-[#168b72]" : "bg-[#fff0f0] text-[#c05761]"}`}>
            {checking ? <LoaderCircle size={13} className="animate-spin" /> : isConnected ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            {checking ? "Checking" : isConnected ? "Connected" : "Offline"}
          </span>
        </div>
        <div className={`rounded-lg px-4 py-3 text-sm ${isConnected ? "bg-[#f4fbf8] text-[#27896f]" : "bg-[#fff5f5] text-[#b14d58]"}`}>
          {checking ? "Checking the database connection..." : isConnected ? "Your operational records are ready for live updates." : health?.error ?? "The database connection is unavailable."}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] pt-5">
          <div>
            <p className="text-xs font-semibold text-[#101a38]">Provider</p>
            <p className="mt-1 text-xs text-[#8992a8]">{health?.database ?? "PostgreSQL"}</p>
          </div>
          <button type="button" onClick={() => void checkConnection()} disabled={checking} className="inline-flex items-center gap-2 rounded-lg border border-[#dfe4ee] bg-white px-3 py-2 text-xs font-semibold text-[#5960f2] transition hover:border-[#5960f2] disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={14} className={checking ? "animate-spin" : ""} /> Check connection
          </button>
        </div>
      </section>

      <section className="panel-shadow rounded-xl border border-[#e4e8f1] bg-white p-4 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#eef0ff] text-[#5960f2]">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">Workspace access</h3>
            <p className="mt-1 text-sm text-[#8992a8]">Protected administrator workspace.</p>
          </div>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4"><dt className="text-[#8992a8]">Role</dt><dd className="font-semibold text-[#101a38]">Administrator</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-[#8992a8]">Authentication</dt><dd className="font-semibold text-[#168b72]">Enabled</dd></div>
          <div className="flex items-center justify-between gap-4"><dt className="text-[#8992a8]">Data mode</dt><dd className="font-semibold text-[#101a38]">Live records</dd></div>
        </dl>
      </section>

      <section className="panel-shadow rounded-xl border border-[#e4e8f1] bg-white p-4 sm:p-6 md:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-base font-semibold">Application</h3>
            <p className="mt-1 text-sm text-[#8992a8]">Reload the workspace after changing database or environment settings.</p>
          </div>
          <button type="button" onClick={reloadApplication} disabled={reloading} className="inline-flex items-center gap-2 rounded-lg bg-[#5960f2] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_5px_14px_rgba(85,91,234,.22)] disabled:cursor-not-allowed disabled:opacity-60">
            <RefreshCw size={14} className={reloading ? "animate-spin" : ""} /> {reloading ? "Reloading..." : "Reload workspace"}
          </button>
        </div>
      </section>
    </div>
  );
}
