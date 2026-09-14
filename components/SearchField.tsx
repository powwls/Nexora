"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function SearchField({
  value = "",
  onQueryChange,
}: {
  value?: string;
  onQueryChange?: (query: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateSearch(query: string) {
    onQueryChange?.(query);
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) params.set("q", query);
    else params.delete("q");
    router.replace(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <label className="hidden h-9 w-[280px] items-center gap-2.5 rounded-xl border border-[#dfe4ee] bg-[#fafbfe] px-3.5 text-xs text-[#a0a8bb] shadow-sm transition-colors focus-within:border-[#bfc6ff] focus-within:bg-white lg:flex">
      <Search size={16} />
      <input
        aria-label="Search records"
        value={value}
        onChange={(event) => updateSearch(event.target.value)}
        placeholder="Search anything..."
        className="w-full bg-transparent text-sm text-[#36415d] outline-none placeholder:text-[#a0a8bb]"
      />
    </label>
  );
}
