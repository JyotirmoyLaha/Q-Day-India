/** A shield with two orbits: classical (dashed) and post-quantum (solid). */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 3 5 7v8c0 7 4.7 11.6 11 14 6.3-2.4 11-7 11-14V7L16 3Z" fill="var(--accent)" opacity=".14" />
      <path
        d="M16 3 5 7v8c0 7 4.7 11.6 11 14 6.3-2.4 11-7 11-14V7L16 3Z"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.8"
      />
      <ellipse
        cx="16"
        cy="15.5"
        rx="6.5"
        ry="2.6"
        fill="none"
        stroke="var(--fg)"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        transform="rotate(-30 16 15.5)"
      />
      <ellipse
        cx="16"
        cy="15.5"
        rx="6.5"
        ry="2.6"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.4"
        transform="rotate(30 16 15.5)"
      />
      <circle cx="16" cy="15.5" r="1.6" fill="var(--fg)" />
    </svg>
  );
}
