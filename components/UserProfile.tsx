"use client";

import Link from "next/link";
import { ChevronDown, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UserProfile() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("admin@nexora.local");
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const initials = email.slice(0, 2).toUpperCase();

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { email?: string | null }) => {
        if (data.email) setEmail(data.email);
      })
      .catch(() => undefined);

    function closeOnOutsideClick(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={profileRef}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex items-center gap-2 rounded-xl px-1.5 py-1 text-left transition-colors hover:bg-[#f7f8fc]"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffc5b3] to-[#f08a83] text-[10px] font-bold text-[#873f43]">
          {initials}
          <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-[#4bd0ae]" />
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block truncate text-xs font-semibold text-[#101a38]">
            {email}
          </span>
          <span className="mt-0.5 block text-[10px] text-[#9098aa]">
            Admin
          </span>
        </span>
        <ChevronDown
          className={`text-[#9098aa] transition-transform ${open ? "rotate-180" : ""}`}
          size={14}
        />
      </button>
      {open && (
        <div
          className="absolute right-0 top-11 z-50 w-52 rounded-lg border border-[#e4e8f1] bg-white p-2 shadow-[0_12px_30px_rgba(30,44,83,.14)]"
          role="menu"
        >
          <div className="border-b border-[#edf0f5] px-3 py-2">
            <p className="text-xs font-semibold text-[#101a38]">
              {email}
            </p>
            <p className="mt-0.5 text-xs text-[#9098aa]">
              Admin
            </p>
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-[11px] font-medium text-[#66718a] hover:bg-[#f5f7fb]"
          >
            <Settings size={14} />
            Account settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="mt-1 flex w-full items-center rounded-md px-3 py-2 text-left text-[11px] font-medium text-[#c05761] hover:bg-[#fff1f1]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
