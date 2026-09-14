"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  BriefcaseBusiness,
  Cloud,
  Database,
  FileBarChart2,
  LayoutDashboard,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Wrench,
  X,
} from "lucide-react";
import type { Activity as ActivityRow, DashboardSummary } from "@/lib/db";
import NexoraLogo from "@/components/NexoraLogo";
import UserProfile from "@/components/UserProfile";
import NotificationBell from "@/components/NotificationBell";
import CurrentDateTime from "@/components/CurrentDateTime";
import SearchField from "@/components/SearchField";

// Sidebar menu items. Add or remove navigation links here.
const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Assets", icon: Box },
  { label: "Employees", icon: BriefcaseBusiness },
  { label: "Network Devices", icon: Network },
  { label: "Maintenance", icon: Wrench },
  { label: "Reports", icon: FileBarChart2 },
];

type MetricsResponse = {
  activities: ActivityRow[];
  summary: DashboardSummary;
};

function DonutChart({ summary }: { summary: DashboardSummary["assets"] }) {
  const total = Math.max(summary.total, 1);
  const activeEnd = (summary.active / total) * 100;
  const maintenanceEnd = activeEnd + (summary.maintenance / total) * 100;
  const availableEnd = maintenanceEnd + (summary.available / total) * 100;

  return (
    <div
      className="relative grid h-36 w-36 place-items-center rounded-full"
      style={{
        background:
          `conic-gradient(#635bfa 0 ${activeEnd}%, #40cfb1 ${activeEnd}% ${maintenanceEnd}%, #ff9a67 ${maintenanceEnd}% ${availableEnd}%, #c8ccda ${availableEnd}% 100%)`,
      }}
    >
      <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
        <strong className="font-display text-2xl text-[#101a38]">
          {summary.total}
        </strong>
        <span className="text-[10px] text-[#9098aa]">Total Assets</span>
      </div>
    </div>
  );
}

function MiniBars({ categories }: { categories: DashboardSummary["categories"] }) {
  const maxCount = Math.max(...categories.map((category) => category.count), 1);
  const colors = [
    "bg-[#5d60f3]",
    "bg-[#54cdb0]",
    "bg-[#8175f5]",
    "bg-[#ff956b]",
    "bg-[#a9b0c2]",
  ];

  return (
    <div className="flex h-36 items-end justify-around gap-3 px-2 pb-5 pt-4">
      {categories.slice(0, 5).map((category, index) => (
        <div
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          key={index}
        >
          <span className="text-[11px] font-semibold text-[#4c5876]">
            {category.count}
          </span>
          <span
            className={`w-full max-w-8 rounded-t-md ${colors[index]}`}
            style={{ height: `${(category.count / maxCount) * 100}%` }}
          />
          <span className="text-center text-[10px] text-[#9299aa]">
            {category.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

export default function Home() {
  // Search text for filtering the assets table.
  const [query, setQuery] = useState("");

  // Controls the mobile sidebar menu.
  const [mobileOpen, setMobileOpen] = useState(false);

  // Activity data shown in the Recent Activity table.
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  // Shows whether the dashboard is currently loading database records.
  const [isLoading, setIsLoading] = useState(true);

  // Displays a connection error without hiding the rest of the dashboard.
  const [databaseError, setDatabaseError] = useState<string | null>(null);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) =>
        `${row.id} ${row.workspace} ${row.event} ${row.status} ${row.volume}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, rows],
  );

  const assetSummary = summary?.assets ?? {
    total: 0,
    active: 0,
    maintenance: 0,
    retired: 0,
    available: 0,
  };
  const departments = summary?.departments ?? [];
  const departmentTotal = departments.reduce(
    (total, department) => total + department.count,
    0,
  );
  const departmentColors = ["#635bfa", "#ff9a67", "#ffcf5c", "#55cdb1"];
  let departmentStart = 0;
  const departmentGradient = departments
    .slice(0, 4)
    .map((department, index) => {
      const end = departmentStart + percentage(department.count, departmentTotal);
      const segment = `${departmentColors[index]} ${departmentStart}% ${end}%`;
      departmentStart = end;
      return segment;
    })
    .join(", ");

  // Load activity records through the server API, which reads PostgreSQL.
  async function loadDatabaseData() {
    setIsLoading(true);
    setDatabaseError(null);

    try {
      const response = await fetch("/api/metrics", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load database records.");

      const data = (await response.json()) as MetricsResponse;
      setRows(data.activities);
      setSummary(data.summary);
    } catch {
      setDatabaseError("Database records could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDatabaseData();
  }, []);

  return (
    <main className="min-h-screen bg-[#f5f7fb] lg:flex">
      {/* Left navigation: logo, main menu, settings, and signed-in user. */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-[#0e1838]/45 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
      <aside
        className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} sidebar-glow fixed inset-y-0 left-0 z-30 flex w-[min(250px,calc(100vw-32px))] flex-col px-5 py-6 transition-transform lg:relative lg:translate-x-0 lg:w-[250px]`}
      >
        <div className="mb-9 flex items-center justify-between px-3">
          <NexoraLogo />
          <button
            className="text-white lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[.18em] text-[#7983a2]">
          Main menu
        </div>
          <nav className="space-y-1.5">
          {navItems.map(({ label, icon: Icon }, index) => (
              <Link
                href={index === 0 ? "/" : `/${label.toLowerCase().replaceAll(" ", "-")}`}
              className={`flex w-full items-center gap-3 rounded-[8px] px-3.5 py-3 text-sm font-medium transition-colors ${index === 0 ? "bg-[#555bea] text-white shadow-[0_5px_14px_rgba(85,91,234,.3)]" : "text-[#aab2ce] hover:bg-white/10 hover:text-white"}`}
              key={label}
            >
              <Icon size={15} strokeWidth={index === 0 ? 2.3 : 1.8} />
              {label}
              </Link>
          ))}
        </nav>
        <div className="mb-3 mt-9 px-3 text-xs font-semibold uppercase tracking-[.18em] text-[#7983a2]">
          System
        </div>
        <Link href="/settings" className="flex w-full items-center gap-3 rounded-[8px] px-3.5 py-3 text-sm font-medium text-[#aab2ce] hover:bg-white/10 hover:text-white">
          <Settings size={15} />
          Settings
        </Link>
      </aside>

      {/* Main content: top bar, summary cards, charts, and activity. */}
      <section className="min-w-0 flex-1">
        <header className="flex min-h-[64px] items-center border-b border-[#e4e8f1] bg-white/95 px-3 py-3 shadow-[0_1px_0_rgba(30,44,83,.02)] backdrop-blur sm:px-5 lg:h-[60px] lg:min-h-0 lg:px-8 lg:py-0">
          <div className="mx-auto flex h-full min-h-[44px] w-full max-w-[1800px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#dfe4ee] bg-white text-[#5960f2] shadow-sm lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={19} />
            </button>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#eef0ff] text-[#5960f2]">
              <LayoutDashboard size={16} strokeWidth={2} />
            </span>
            <div className="hidden text-sm text-[#8c95aa] lg:block">
              Workspace <span className="mx-2">/</span>{" "}
              <span className="font-semibold text-[#101a38]">Dashboard</span>
            </div>
            <div className="truncate text-sm font-semibold lg:hidden">Dashboard</div>
          </div>
          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <Suspense fallback={<div className="hidden h-10 w-[300px] md:block" />}>
              <SearchField value={query} onQueryChange={setQuery} />
            </Suspense>
            <NotificationBell />
            <UserProfile />
          </div>
          </div>
        </header>

        {/* Page heading and dashboard summary cards. */}
        <div className="mx-auto max-w-[1800px] px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex items-end justify-between sm:mb-6">
            <div>
              <p className="mb-1 text-xs text-[#8c95aa]">
                <CurrentDateTime />
              </p>
              <p className="mb-2 text-sm font-medium text-[#5960f2]">
                Philippine time: <CurrentDateTime compact />
              </p>
              <h1 className="font-display text-[26px] font-semibold tracking-[-.04em] text-[#101a38] sm:text-[28px]">
                Dashboard
              </h1>
              <p className="mt-1 text-[12px] text-[#8c95aa]">
                Overview of your IT infrastructure
              </p>
            </div>
          </div>

          {/* KPI cards: edit the values and labels in this array. */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
            {[
              {
                label: "Total Assets",
                value: assetSummary.total,
                change: "Current",
                color: "#5d60f3",
                icon: Box,
              },
              {
                label: "Active",
                value: assetSummary.active,
                change: "Current",
                color: "#42cfb0",
                icon: ShieldCheck,
              },
              {
                label: "Maintenance",
                value: assetSummary.maintenance,
                change: "Current",
                color: "#ff976d",
                icon: Wrench,
              },
              {
                label: "Retired",
                value: assetSummary.retired,
                change: "Current",
                color: "#ff6e78",
                icon: Database,
              },
              {
                label: "Available",
                value: assetSummary.available,
                change: "Current",
                color: "#7c8ef4",
                icon: Cloud,
              },
            ].map(({ label, value, change, color, icon: Icon }) => (
              <div
                className="panel-shadow rounded-lg border border-[#e4e8f1] bg-white p-3 sm:p-4"
                key={label}
              >
                <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5">
                  <span className="text-xs font-medium text-[#8992a8] sm:text-sm">
                    {label}
                  </span>
                  <span
                    className="grid h-7 w-7 place-items-center rounded-md"
                    style={{ backgroundColor: `${color}18`, color }}
                  >
                    <Icon size={14} />
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <strong className="font-display text-[23px] font-semibold tracking-[-.06em] text-[#101a38] sm:text-[25px]">
                    {value}
                  </strong>
                  <span className="text-xs font-semibold text-[#24a887]">
                    {change}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-[#adb3c1] sm:text-xs">
                  Current records
                </div>
              </div>
            ))}
          </div>

          {/* Visual reports: asset status, category breakdown, and department breakdown. */}
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="panel-shadow rounded-lg border border-[#e4e8f1] bg-white p-5">
              <div className="mb-4 flex items-start justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-[#101a38]">
                    Asset Status
                  </h2>
                  <p className="mt-1 text-xs text-[#9aa2b4]">
                    Current asset distribution
                  </p>
                </div>
                <button
                  className="text-[#9aa2b4]"
                  aria-label="Asset status options"
                >
                  ...
                </button>
              </div>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around sm:gap-0">
                <DonutChart summary={assetSummary} />
                <div className="w-full space-y-2.5 text-[10px] text-[#768097] sm:w-auto">
                  {[
                    { label: "Active", count: assetSummary.active, color: "bg-[#635bfa]" },
                    { label: "Maintenance", count: assetSummary.maintenance, color: "bg-[#40cfb1]" },
                    { label: "Available", count: assetSummary.available, color: "bg-[#ff9a67]" },
                    { label: "Retired", count: assetSummary.retired, color: "bg-[#c8ccda]" },
                  ].map((item) => (
                    <div key={item.label}>
                      <span className={`mr-2 inline-block h-2 w-2 rounded-full ${item.color}`} />
                      {item.label}
                      <span className="ml-3 text-[#101a38]">
                        {item.count} ({percentage(item.count, assetSummary.total)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel-shadow rounded-lg border border-[#e4e8f1] bg-white p-5">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#101a38]">
                    Assets by Category
                  </h2>
                  <p className="mt-1 text-xs text-[#9aa2b4]">
                    Distribution by asset type
                  </p>
                </div>
                <button
                  className="text-[#9aa2b4]"
                  aria-label="Category options"
                >
                  ...
                </button>
              </div>
              <MiniBars categories={summary?.categories ?? []} />
            </div>
            <div className="panel-shadow rounded-lg border border-[#e4e8f1] bg-white p-5">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[#101a38]">
                    Assets by Department
                  </h2>
                  <p className="mt-1 text-xs text-[#9aa2b4]">
                    Distribution by team
                  </p>
                </div>
                <button
                  className="text-[#9aa2b4]"
                  aria-label="Department options"
                >
                  ...
                </button>
              </div>
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-around sm:gap-0">
                <div
                  className="relative grid h-32 w-32 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(${departmentGradient})`,
                  }}
                >
                  <div className="h-20 w-20 rounded-full bg-white" />
                </div>
                <div className="w-full space-y-2.5 text-[10px] text-[#768097] sm:w-auto">
                  {departments.slice(0, 4).map((department, index) => (
                    <div key={department.label}>
                      <span
                        className="mr-2 inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: departmentColors[index] }}
                      />
                      {department.label}{" "}
                      <b className="ml-2 text-[#101a38]">
                        {percentage(department.count, departmentTotal)}%
                      </b>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="panel-shadow overflow-hidden rounded-lg border border-[#e4e8f1] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#101a38]">
                    Recent Activity
                  </h2>
                  <p className="mt-1 text-xs text-[#9aa2b4]">
                    {isLoading
                      ? "Loading records from PostgreSQL..."
                      : databaseError ?? "Latest actions in your organization"}
                  </p>
                </div>
              </div>
              <div className="divide-y divide-[#edf0f5] sm:hidden">
                {visibleRows.slice(0, 4).map((row, index) => (
                  <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-4 py-3" key={row.id}>
                    <strong className="truncate text-xs font-semibold text-[#36415d]">
                      {["John Francis", "Maria Santos", "System", "Ramon Garcia"][index]}
                    </strong>
                    <span className="text-right text-[10px] text-[#9ba3b4]">{row.updated}</span>
                    <span className="truncate text-[11px] text-[#68738d]">
                      {["Added new asset", "Updated asset information", "Device network maintenance", "Assigned device"][index]}
                    </span>
                    <span className="truncate text-right text-[11px] font-medium text-[#5960f2]">{row.workspace}</span>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-[#fbfcfe] text-[8px] font-semibold uppercase tracking-[.1em] text-[#a0a8b9]">
                    <tr>
                      <th className="px-5 py-2.5">User</th>
                      <th className="px-5 py-2.5">Action</th>
                      <th className="px-5 py-2.5">Asset</th>
                      <th className="px-5 py-2.5">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf0f5]">
                    {visibleRows.slice(0, 4).map((row, index) => (
                      <tr className="text-[11px] text-[#68738d]" key={row.id}>
                        <td className="px-5 py-3 font-medium text-[#36415d]">
                          {
                            [
                              "John Francis",
                              "Maria Santos",
                              "System",
                              "Ramon Garcia",
                            ][index]
                          }
                        </td>
                        <td className="px-5 py-3">
                          {
                            [
                              "Added new asset",
                              "Updated asset information",
                              "Device network maintenance",
                              "Assigned device",
                            ][index]
                          }
                        </td>
                        <td className="px-5 py-3">{row.workspace}</td>
                        <td className="px-5 py-3 text-[#9ba3b4]">
                          {row.updated}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isLoading && rows.length === 0 && (
                  <p className="px-5 py-6 text-[11px] text-[#9ba3b4]">
                    No database records found.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-[9px] text-[#a1a9bb]">
            <span>© 2026 Nexora Systems</span>
            <span className="hidden sm:block">
              IT infrastructure management platform
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
