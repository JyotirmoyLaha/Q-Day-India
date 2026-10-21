// Minimal stroke icon set (24×24, 1.8px strokes) so the site needs no icon library.
const PATHS: Record<string, string> = {
  shield: 'M12 3 4.5 6v6c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6L12 3Z',
  'shield-check':
    'M12 3 4.5 6v6c0 4.6 3.1 8.1 7.5 9.5 4.4-1.4 7.5-4.9 7.5-9.5V6L12 3Z M8.8 12.2l2.2 2.2 4.4-4.6',
  search: 'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z M21 21l-5.2-5.2',
  code: 'm8 7-5 5 5 5 M16 7l5 5-5 5 M13.5 4.5l-3 15',
  building: 'M4 21V5l8-2v18 M12 7l8 3v11 M3 21h18 M7.5 8h1 M7.5 12h1 M7.5 16h1 M15.5 13h1 M15.5 17h1',
  clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z M12 7v5l3 2',
  chart: 'M4 20V10 M10 20V4 M16 20v-7 M22 20H2',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z M4 20.5A2.5 2.5 0 0 0 6.5 23H20',
  info: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z M12 11v5 M12 8h.01',
  check: 'm5 12.5 4.5 4.5L19 7',
  x: 'M6 6l12 12 M18 6 6 18',
  'arrow-right': 'M5 12h14 M13 6l6 6-6 6',
  globe:
    'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z',
  lock: 'M6 11h12v10H6z M8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  copy: 'M9 9h11v11H9z M5 15H4V4h11v1',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  github:
    'M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21',
  cloud: 'M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5H7Z',
  server: 'M4 4h16v6H4z M4 14h16v6H4z M8 7h.01 M8 17h.01',
  key: 'M14.5 9.5a4 4 0 1 1-5.66 0 M15 10l6-6 M18 4l2 2 M16 6l2 2 M9.2 14.8a2 2 0 1 0 0-2.8',
  zap: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z',
  layers: 'm12 3 9 5-9 5-9-5 9-5Z M3 13l9 5 9-5 M3 17.5l9 5 9-5',
  calculator: 'M5 3h14v18H5z M8 7h8 M8 11h.01 M12 11h.01 M16 11h.01 M8 15h.01 M12 15h.01 M16 15v3',
  sparkles:
    'M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z',
  alert: 'M12 3 2 20h20L12 3Z M12 10v4 M12 17h.01',
  download: 'M12 4v11 M7 10l5 5 5-5 M4 20h16',
  share:
    'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4',
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = 'h-5 w-5',
  label,
}: {
  name: IconName;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {PATHS[name]!.split(' M').map((d, i) => (
        <path key={i} d={i ? `M${d}` : d} />
      ))}
    </svg>
  );
}
