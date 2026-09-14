"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Activity } from "@/lib/db";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/metrics", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { activities: Activity[] }) => setActivities(data.activities.slice(0, 4)))
      .catch(() => setActivities([]));
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!notificationRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="relative" ref={notificationRef}>
      <button
        type="button"
        aria-label="Open notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative grid h-9 w-9 place-items-center rounded-xl text-[#7f89a1] transition-colors hover:bg-[#f1f2ff] hover:text-[#5960f2]"
      >
        <Bell size={18} />
        {activities.length > 0 && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#ff6e78]" />}
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-50 w-72 rounded-lg border border-[#e4e8f1] bg-white p-2 shadow-[0_12px_30px_rgba(30,44,83,.14)]">
          <div className="border-b border-[#edf0f5] px-3 py-2">
            <p className="text-xs font-semibold text-[#101a38]">Notifications</p>
            <p className="mt-0.5 text-[10px] text-[#9098aa]">Recent database activity</p>
          </div>
          {activities.length === 0 ? (
            <p className="px-3 py-4 text-xs text-[#9098aa]">No new activity.</p>
          ) : (
            activities.map((activity) => (
              <div className="border-b border-[#f0f2f6] px-3 py-2 last:border-0" key={activity.id}>
                <p className="text-[11px] font-medium text-[#36415d]">{activity.event}</p>
                <p className="mt-0.5 text-[10px] text-[#9098aa]">{activity.workspace} · {activity.updated}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
