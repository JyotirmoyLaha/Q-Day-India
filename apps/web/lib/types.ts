// Data contract shared with the Go scanner (PROJECT_SPEC.md §10.1, schemas/scan.schema.json).

export const SECTORS = [
  'banking',
  'payments',
  'government',
  'stock_broking',
  'insurance',
  'healthcare',
  'telecom',
  'ecommerce',
  'education',
  'media',
  'other',
] as const;
export type Sector = (typeof SECTORS)[number];

export const GRADES = ['A+', 'A', 'B', 'C', 'D', 'F'] as const;
export type Grade = (typeof GRADES)[number];

export type ErrorCode = 'DNS_FAIL' | 'TIMEOUT' | 'TLS_FAIL' | 'REFUSED';
export type CDN = 'cloudflare' | 'akamai' | 'fastly' | 'cloudfront' | 'other' | null;

export type ProbeOutcome = { ok: boolean; detail?: string };

export type SiteResult = {
  host: string;
  org: string;
  sector: Sector;
  subsector?: string;
  verified: boolean;
  shelfLifeYears: number;
  reachable: boolean;
  error?: { code: ErrorCode; detail: string };
  tls?: {
    maxVersion: 'TLS1.3' | 'TLS1.2' | 'TLS1.1' | 'TLS1.0';
    defaultGroup: string;
    pqHybrid: { x25519mlkem768: boolean; secp256r1mlkem768?: boolean; secp384r1mlkem1024?: boolean };
    legacyEnabled: boolean;
    cipherSuite: string;
    alpn?: string;
  };
  cert?: {
    keyAlgorithm: string;
    keySize: number;
    curve?: string;
    signatureAlgorithm: string;
    issuer: string;
    notAfter: string;
    chainSignatureAlgorithms: string[];
    valid: boolean;
    validationError?: string;
  };
  http?: { hsts: boolean; server?: string; cdn: CDN };
  probes?: {
    default: ProbeOutcome;
    pqOnly: ProbeOutcome;
    pqAlt: ProbeOutcome;
    tls13: ProbeOutcome;
    legacy: ProbeOutcome;
    head: ProbeOutcome;
  };
  grade: Grade | null;
  hygieneFlags: HygieneFlag[];
  hndlRisk: number;
};

export type HygieneFlag =
  'RSA_LT_2048' | 'SHA1_IN_CHAIN' | 'CERT_EXPIRING_SOON' | 'NO_HSTS' | 'LEGACY_TLS' | 'CERT_INVALID';

export type ScanFile = {
  scannedAt: string;
  scannerVersion: string;
  goVersion: string;
  results: SiteResult[];
};

/** One host's grade on one scan date (compact, for sparklines and reports). */
export type HistoryPoint = { date: string; grade: Grade | null; risk: number };

/** Compact per-host row of one scan, used by the monthly report. */
export type SnapshotRow = {
  h: string; // host
  s: Sector;
  g: Grade | null;
  r: number; // HNDL risk
  cdn: CDN | undefined;
  leg: boolean; // legacy TLS enabled
  v: boolean; // verified
  o: string; // org
};

export type Snapshot = { date: string; scannedAt: string; rows: SnapshotRow[] };

export type SiteWithHistory = SiteResult & { history: HistoryPoint[]; scannedAt: string };
