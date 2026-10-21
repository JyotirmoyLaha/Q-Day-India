/** Animated "harvest now, decrypt later" diagram. Pure SVG + CSS; motion is disabled under prefers-reduced-motion. */
export function HndlDiagram() {
  return (
    <figure className="rounded-xl border border-line bg-card p-4">
      <svg
        viewBox="0 0 720 250"
        className="w-full"
        role="img"
        aria-labelledby="hndl-title hndl-desc"
      >
        <title id="hndl-title">Harvest now, decrypt later</title>
        <desc id="hndl-desc">
          Today, an eavesdropper copies encrypted traffic between you and your bank and stores it. Years later, a quantum
          computer breaks the classical key exchange and opens the stored copies. With a hybrid post-quantum key exchange,
          the stored copies stay locked.
        </desc>
        <style>{`
          .hndl-pkt { animation: hndl-move 4s linear infinite; }
          .hndl-pkt.d2 { animation-delay: -1.33s; }
          .hndl-pkt.d3 { animation-delay: -2.66s; }
          .hndl-copy { animation: hndl-copy 4s linear infinite; }
          .hndl-copy.d2 { animation-delay: -1.33s; }
          .hndl-copy.d3 { animation-delay: -2.66s; }
          .hndl-open { animation: hndl-open 4s ease-in-out infinite; }
          @keyframes hndl-move { from { transform: translateX(0); } to { transform: translateX(170px); } }
          @keyframes hndl-copy { 0%,45% { transform: translate(0,0); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(0,70px); opacity: 0; } }
          @keyframes hndl-open { 0%,40% { opacity: 0; } 60%,100% { opacity: 1; } }
          @media (prefers-reduced-motion: reduce) { .hndl-pkt, .hndl-copy, .hndl-open { animation: none; opacity: 1; } }
        `}</style>

        {/* Panel 1: today */}
        <text x="20" y="22" fontSize="14" fontWeight="600" fill="var(--fg)">1 · Today</text>
        <rect x="20" y="50" width="56" height="40" rx="6" fill="var(--subtle)" stroke="var(--line)" />
        <text x="48" y="75" fontSize="11" textAnchor="middle" fill="var(--fg)">You</text>
        <rect x="246" y="50" width="56" height="40" rx="6" fill="var(--subtle)" stroke="var(--line)" />
        <text x="274" y="75" fontSize="11" textAnchor="middle" fill="var(--fg)">Bank</text>
        <line x1="76" y1="70" x2="246" y2="70" stroke="var(--line)" strokeDasharray="4 4" />
        {['', 'd2', 'd3'].map((d) => (
          <g key={d} className={`hndl-pkt ${d}`}>
            <rect x="72" y="62" width="18" height="14" rx="2" fill="var(--exposed)" />
            <path d="M72 62 l9 7 l9 -7" fill="none" stroke="var(--card)" strokeWidth="1.5" />
          </g>
        ))}
        <rect x="140" y="160" width="80" height="44" rx="6" fill="var(--exposed-soft)" stroke="var(--exposed)" />
        <text x="180" y="186" fontSize="11" textAnchor="middle" fill="var(--fg)">recorded copy</text>
        {['', 'd2', 'd3'].map((d) => (
          <rect key={d} className={`hndl-copy ${d}`} x="172" y="80" width="14" height="10" rx="2" fill="var(--exposed)" opacity="0" />
        ))}
        <text x="160" y="230" fontSize="11" textAnchor="middle" fill="var(--muted)">eavesdropper stores traffic</text>

        {/* Panel 2: later */}
        <text x="370" y="22" fontSize="14" fontWeight="600" fill="var(--fg)">2 · Years later</text>
        <rect x="390" y="60" width="96" height="52" rx="8" fill="var(--danger-soft)" stroke="var(--danger)" />
        <text x="438" y="83" fontSize="11" textAnchor="middle" fill="var(--fg)">quantum</text>
        <text x="438" y="98" fontSize="11" textAnchor="middle" fill="var(--fg)">computer</text>
        <rect x="398" y="160" width="80" height="44" rx="6" fill="var(--exposed-soft)" stroke="var(--exposed)" />
        <text x="438" y="186" fontSize="11" textAnchor="middle" fill="var(--fg)">recorded copy</text>
        <path d="M438 160 L438 112" stroke="var(--danger)" strokeWidth="2" markerEnd="url(#arr)" />
        <g className="hndl-open">
          <rect x="500" y="72" width="22" height="16" rx="2" fill="var(--card)" stroke="var(--danger)" />
          <path d="M500 72 l11 -9 l11 9" fill="none" stroke="var(--danger)" strokeWidth="1.5" />
          <text x="511" y="104" fontSize="10" textAnchor="middle" fill="var(--danger)">readable</text>
        </g>
        <text x="438" y="230" fontSize="11" textAnchor="middle" fill="var(--muted)">RSA / ECDH key exchange broken</text>

        {/* Panel 3: protected */}
        <text x="580" y="22" fontSize="14" fontWeight="600" fill="var(--fg)">3 · With PQ hybrid</text>
        <rect x="598" y="60" width="96" height="52" rx="8" fill="var(--accent-soft)" stroke="var(--accent)" />
        <text x="646" y="83" fontSize="11" textAnchor="middle" fill="var(--fg)">X25519</text>
        <text x="646" y="98" fontSize="11" textAnchor="middle" fill="var(--fg)">+ ML-KEM-768</text>
        <rect x="625" y="160" width="42" height="34" rx="4" fill="var(--accent)" />
        <path d="M635 160 v-8 a11 11 0 0 1 22 0 v8" fill="none" stroke="var(--accent)" strokeWidth="3" />
        <text x="646" y="230" fontSize="11" textAnchor="middle" fill="var(--muted)">copies stay locked</text>
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" fill="var(--danger)" />
          </marker>
        </defs>
      </svg>
      <figcaption className="mt-2 text-sm text-muted">
        Harvest now, decrypt later: traffic protected only by classical key exchange can be recorded today and opened
        once a large quantum computer exists. A hybrid post-quantum key exchange closes that window.
      </figcaption>
    </figure>
  );
}
