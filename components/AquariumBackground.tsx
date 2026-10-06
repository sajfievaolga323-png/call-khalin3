const FISH = [
  { e: "🐠", top: 12, dur: 22, delay: 0, left: true, size: 40 },
  { e: "🐡", top: 28, dur: 30, delay: -8, left: false, size: 52 },
  { e: "🐠", top: 46, dur: 26, delay: -14, left: true, size: 32 },
  { e: "🐡", top: 63, dur: 34, delay: -4, left: false, size: 44 },
  { e: "🐠", top: 78, dur: 24, delay: -18, left: true, size: 48 },
];
const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37 + 5) % 100,
  size: 6 + ((i * 7) % 5) * 4,
  dur: 9 + ((i * 5) % 8),
  delay: -((i * 3) % 12),
}));

export default function AquariumBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 overflow-hidden bg-gradient-to-b from-[#0d3a63] via-ocean-bg to-[#050c18]">
      {FISH.map((f, i) => (
        <span
          key={i}
          className="fish"
          style={{
            top: `${f.top}%`,
            fontSize: f.size,
            animationName: f.left ? "swim-r" : "swim-l",
            animationDuration: `${f.dur}s`,
            animationDelay: `${f.delay}s`,
          }}
        >
          {f.e}
        </span>
      ))}
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="bubble"
          style={{ left: `${b.left}%`, width: b.size, height: b.size, animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s` }}
        />
      ))}
    </div>
  );
}
