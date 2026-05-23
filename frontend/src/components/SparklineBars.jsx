/** Lightweight vertical bars reminiscent of uptime strip charts - fixed heights for stable render. */
const BAR_HEIGHTS = [
  18, 22, 20, 24, 28, 26, 30, 32, 28, 30, 33, 31, 29, 34, 32, 35, 33, 36, 34, 32, 30, 28, 32, 30, 28, 26, 30, 32, 30, 28, 26, 24, 26, 28, 30,
  32,
];

export default function SparklineBars({ color = '#3fb950' }) {
  const n = BAR_HEIGHTS.length;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 34, opacity: 0.95 }}>
      {BAR_HEIGHTS.map((h, i) => (
        <span
          key={`${color}-${i}`}
          style={{
            width: 3,
            height: h,
            borderRadius: 1,
            background: color,
            opacity: 0.35 + (i / n) * 0.55,
            flexShrink: 0,
          }}
        />
      ))}
    </div>
  );
}
