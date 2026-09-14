import { Suspense } from "react";
import {
  Box,
  BriefcaseBusiness,
  CalendarClock,
  Network,
  Server,
  Settings,
} from "lucide-react";
import {
  ensureDatabaseSchema,
  getAssets,
  getEmployees,
  getMaintenance,
  getNetworkDevices,
  type Asset,
  type Employee,
  type Maintenance,
  type NetworkDevice,
} from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import CrudTable from "@/components/CrudTable";
import NotificationBell from "@/components/NotificationBell";
import SearchField from "@/components/SearchField";
import UserProfile from "@/components/UserProfile";
import SettingsPanel from "@/components/SettingsPanel";

type Section =
  | "assets"
  | "employees"
  | "network-devices"
  | "maintenance"
  | "reports"
  | "settings";
type Row = Asset | Employee | NetworkDevice | Maintenance;
type Column = { key: string; label: string };

const sectionConfig: Record<
  Section,
  { title: string; description: string; icon: typeof Box; columns: Column[] }
> = {
  assets: {
    title: "Assets",
    description: "Manage and track every piece of IT equipment.",
    icon: Box,
    columns: [
      { key: "asset", label: "Asset ID" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "deviceType", label: "Device Type" },
      { key: "assigned", label: "Assigned to" },
      { key: "status", label: "Status" },
    ],
  },
  employees: {
    title: "Employees",
    description: "People and ownership across your organization.",
    icon: BriefcaseBusiness,
    columns: [
      { key: "name", label: "Employee" },
      { key: "department", label: "Department" },
      { key: "role", label: "Role" },
      { key: "email", label: "Email" },
      { key: "status", label: "Status" },
    ],
  },
  "network-devices": {
    title: "Network Devices",
    description: "Monitor routers, switches, and connected infrastructure.",
    icon: Network,
    columns: [
      { key: "id", label: "Device ID" },
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "ip_address", label: "IP address" },
      { key: "mac_address", label: "MAC address" },
      { key: "brand", label: "Brand" },
      { key: "model", label: "Model" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
  },
  maintenance: {
    title: "Maintenance",
    description: "Track scheduled and active maintenance work.",
    icon: CalendarClock,
    columns: [
      { key: "id", label: "Ticket" },
      { key: "asset", label: "Asset" },
      { key: "issue", label: "Issue" },
      { key: "technician", label: "Technician" },
      { key: "status", label: "Status" },
      { key: "scheduled", label: "Scheduled" },
      { key: "date_completed", label: "Date completed" },
    ],
  },
  reports: {
    title: "Reports",
    description: "Operational reporting from your connected records.",
    icon: Server,
    columns: [],
  },
  settings: {
    title: "Settings",
    description: "Workspace configuration and connection status.",
    icon: Settings,
    columns: [],
  },
};

function isSection(value: string): value is Section {
  return value in sectionConfig;
}

async function getRows(section: Section): Promise<Row[]> {
  if (section === "settings" || section === "reports") return [];
  await ensureDatabaseSchema();
  if (section === "assets") return getAssets();
  if (section === "employees") return getEmployees();
  if (section === "network-devices") return getNetworkDevices();
  if (section === "maintenance") return getMaintenance();
  return [];
}

function PageHeader({
  title,
  description,
  Icon,
  count,
}: {
  title: string;
  description: string;
  Icon: typeof Box;
  count: number;
}) {
  return (
    <header className="flex min-h-[64px] items-center border-b border-[#e4e8f1] bg-white/95 pl-16 pr-3 py-3 shadow-[0_1px_0_rgba(30,44,83,.02)] backdrop-blur sm:px-5 lg:h-[60px] lg:min-h-0 lg:px-8 lg:py-0">
      <div className="mx-auto flex h-full min-h-[44px] w-full max-w-[1800px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#eef0ff] text-[#5960f2]">
            <Icon size={16} strokeWidth={2} />
          </span>
          <div className="hidden text-sm text-[#8c95aa] lg:block">
            Workspace <span className="mx-2">/</span>{" "}
            <span className="font-semibold text-[#101a38]">{title}</span>
          </div>
          <div className="min-w-0 lg:hidden">
            <div className="truncate text-sm font-semibold">{title}</div>
            <div className="text-xs text-[#8992a8]">
              {title === "Settings" || title === "Reports" ? "Workspace" : `${count} records`}
            </div>
          </div>
          <p className="hidden text-xs text-[#8992a8] lg:block">
            {description}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                <Suspense fallback={<div className="hidden h-10 w-[300px] md:block" />}>
                  <SearchField />
                </Suspense>
                <NotificationBell />
          <UserProfile />
        </div>
      </div>
    </header>
  );
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { section: rawSection } = await params;
  const { q = "" } = await searchParams;
  const section = isSection(rawSection) ? rawSection : "assets";
  const config = sectionConfig[section];
  const allRows = await getRows(section);
  const rows = q.trim()
    ? allRows.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(q.toLowerCase()),
        ),
      )
    : allRows;
  const Icon = config.icon;

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#101a38] lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <PageHeader
          title={config.title}
          description={config.description}
          Icon={Icon}
          count={rows.length}
        />
        <div className="mx-auto max-w-[1800px] px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-[#929aae]">
                Data overview
              </p>
              <h2 className="mt-1 font-display text-[26px] font-semibold tracking-[-.04em] sm:text-[28px]">
                {config.title} records
              </h2>
            </div>
          </div>
          {section === "settings" ? (
            <SettingsPanel />
          ) : section === "reports" ? (
            <div className="panel-shadow rounded-xl border border-[#e4e8f1] bg-white p-4 sm:p-6">
              <h3 className="font-display text-base font-semibold">
                Reports workspace
              </h3>
              <p className="mt-2 max-w-xl text-base leading-6 text-[#8992a8]">
                Review trends across your assets, employees, devices, and
                maintenance records.
              </p>
            </div>
          ) : (
            <CrudTable
              resource={section}
              columns={config.columns}
              initialRows={rows.map((row) =>
                Object.fromEntries(
                  config.columns.map((column) => [
                    column.key,
                    String((row as unknown as Record<string, unknown>)[column.key] ?? ""),
                  ]),
                ),
              )}
            />
          )}
        </div>
      </div>
    </main>
  );
}
