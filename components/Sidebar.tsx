"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, Box, FileBarChart2, LayoutDashboard, Menu, Network, Settings, Wrench, X } from "lucide-react";
import { useState } from "react";
import NexoraLogo from "@/components/NexoraLogo";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Box },
  { label: "Employees", href: "/employees", icon: BriefcaseBusiness },
  { label: "Network Devices", href: "/network-devices", icon: Network },
  { label: "Maintenance", href: "/maintenance", icon: Wrench },
  { label: "Reports", href: "/reports", icon: FileBarChart2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button className="fixed left-3 top-3 z-40 grid h-10 w-10 place-items-center rounded-xl border border-[#dfe4ee] bg-white text-[#5960f2] shadow-[0_6px_18px_rgba(30,44,83,.12)] transition hover:bg-[#f7f7ff] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu size={19} strokeWidth={2.2} />
      </button>
      {mobileOpen && <button className="fixed inset-0 z-20 bg-[#0e1838]/45 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
      <aside className={`${mobileOpen ? "translate-x-0" : "-translate-x-full"} sidebar-glow fixed inset-y-0 left-0 z-30 flex w-[min(280px,calc(100vw-24px))] flex-col px-5 py-6 shadow-[12px_0_35px_rgba(14,24,56,.18)] transition-transform lg:relative lg:w-[250px] lg:translate-x-0 lg:shadow-none`}>
        <div className="mb-9 flex items-center justify-between px-3">
          <NexoraLogo />
          <button className="text-white lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <div className="mb-3 px-3 text-xs font-semibold uppercase tracking-[.18em] text-[#7983a2]">Main menu</div>
        <nav className="space-y-1.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                href={href}
                key={label}
                onClick={() => setMobileOpen(false)}
                className={`flex w-full items-center gap-3 rounded-[8px] px-3.5 py-3 text-sm font-medium transition-colors ${active ? "bg-[#555bea] text-white shadow-[0_5px_14px_rgba(85,91,234,.3)]" : "text-[#aab2ce] hover:bg-white/10 hover:text-white"}`}
              >
                <Icon size={15} strokeWidth={active ? 2.3 : 1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mb-3 mt-9 px-3 text-xs font-semibold uppercase tracking-[.18em] text-[#7983a2]">System</div>
        <Link href="/settings" onClick={() => setMobileOpen(false)} className={`flex w-full items-center gap-3 rounded-[8px] px-3.5 py-3 text-sm font-medium ${pathname.startsWith("/settings") ? "bg-[#555bea] text-white" : "text-[#aab2ce] hover:bg-white/10 hover:text-white"}`}>
          <Settings size={15} />
          Settings
        </Link>
      </aside>
    </>
  );
}