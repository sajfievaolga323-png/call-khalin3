/** Лотос в виде SVG: эмодзи 🪷 не отображается в Windows 10 (показывается квадратик). */
export default function Logo({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Khalin Meet AI">
      <defs>
        <linearGradient id="lotus" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9ab0" />
          <stop offset="1" stopColor="#ff6b6b" />
        </linearGradient>
      </defs>
      <g transform="translate(32 42)">
        {[-62, -32, 32, 62].map((r) => (
          <ellipse key={r} cx="0" cy="-12" rx="7" ry="16" transform={`rotate(${r})`} fill="url(#lotus)" opacity=".8" />
        ))}
        <ellipse cx="0" cy="-14" rx="8" ry="19" fill="url(#lotus)" />
      </g>
      <path d="M8 50 Q32 60 56 50" stroke="#00d4ff" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
