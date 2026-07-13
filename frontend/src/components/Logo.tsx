export function Logo({ size = 34 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="vaaniGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF9D3D" />
            <stop offset="0.55" stopColor="#F0509B" />
            <stop offset="1" stopColor="#7C5CFF" />
          </linearGradient>
        </defs>
        <circle cx="20" cy="20" r="19" fill="url(#vaaniGrad)" opacity="0.14" />
        {/* soundwave: three bars rising, evokes voice */}
        <rect x="11" y="16" width="3.4" height="8" rx="1.7" fill="url(#vaaniGrad)" />
        <rect x="18.3" y="10" width="3.4" height="20" rx="1.7" fill="url(#vaaniGrad)" />
        <rect x="25.6" y="14" width="3.4" height="12" rx="1.7" fill="url(#vaaniGrad)" />
      </svg>
      <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
        Vaani
      </span>
    </div>
  );
}
