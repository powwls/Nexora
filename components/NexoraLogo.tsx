export default function NexoraLogo() {
  return (
    <div className="flex items-center gap-2.5 text-white">
      <img
        src="/logo.png"
        alt="Nexora Logo"
        className="h-7 w-7 shrink-0 rounded-[8px] object-cover ring-1 ring-white/15"
      />
      <span className="font-display text-[15px] font-bold tracking-[0.22em]">
        NEXORA
      </span>
    </div>
  );
}
