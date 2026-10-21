/** Semicircle gauge 0–100. `goodHigh` flips the colour scale (agility: high is good). */
export function Gauge({
  value,
  label,
  goodHigh = false,
  caption,
}: {
  value: number;
  label: string;
  goodHigh?: boolean;
  caption?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = 52;
  const len = Math.PI * r;
  const good = goodHigh ? v >= 60 : v <= 30;
  const mid = goodHigh ? v >= 30 : v <= 60;
  const color = good
    ? 'var(--accent)'
    : mid
      ? 'color-mix(in srgb, var(--exposed) 70%, var(--card))'
      : 'var(--exposed)';
  return (
    <figure className="flex flex-col items-center">
      <svg
        viewBox="0 0 128 76"
        className="w-44"
        role="img"
        aria-label={`${label}: ${v} out of 100${caption ? `. ${caption}` : ''}`}
      >
        <path
          d="M 12 66 A 52 52 0 0 1 116 66"
          fill="none"
          stroke="var(--subtle)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 12 66 A 52 52 0 0 1 116 66"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(v / 100) * len} ${len}`}
        />
        <text
          x="64"
          y="62"
          textAnchor="middle"
          fontSize="26"
          fontWeight="600"
          fill="var(--fg)"
          fontFamily="var(--font-serif)"
        >
          {v}
        </text>
      </svg>
      <figcaption className="mt-1 text-center">
        <span className="block font-medium">{label}</span>
        {caption && <span className="block text-xs text-muted">{caption}</span>}
      </figcaption>
    </figure>
  );
}
