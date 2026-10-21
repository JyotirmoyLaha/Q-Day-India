// Engine data contract (PROJECT_SPEC.md §10.2) plus the compiled rule format.

export type Primitive = 'pke' | 'signature' | 'kem' | 'key-agreement' | 'hash' | 'symmetric' | 'mac' | 'kdf' | 'rng';
export type QuantumRisk = 'HIGH' | 'LOW' | 'NONE' | 'CLASSICAL_BROKEN';
export type Confidence = 'high' | 'medium' | 'low';
export type AssetType = 'algorithm' | 'certificate' | 'protocol' | 'related-crypto-material';
export type RuleKind = 'treesitter' | 'regex' | 'pem' | 'manifest';

export type Finding = {
  ruleId: string;
  file: string;
  line: number; // 1-based
  column: number; // 1-based
  snippet: string; // at most 3 lines; never contains key material
  algorithm: string;
  keySize?: number;
  primitive: Primitive;
  quantumRisk: QuantumRisk;
  confidence: Confidence;
  fixId?: string;
  // Extensions beyond §10.2 (used by the CBOM exporter and UI).
  message: string;
  assetType: AssetType;
  kind: RuleKind;
  parameter?: string; // curve, parameter set or protocol version
  details?: Record<string, string>; // e.g. certificate subject / expiry
};

export type TreeLanguage = 'python' | 'javascript' | 'typescript' | 'tsx' | 'java' | 'go';

export type Variant = {
  match: string; // case-insensitive regex tested against the variant source value
  algorithm?: string;
  primitive?: Primitive;
  quantum_risk?: QuantumRisk;
  confidence?: Confidence;
  fix?: string;
  message?: string;
  key_size?: number;
  parameter?: string;
  asset_type?: AssetType;
  skip?: boolean; // matching values produce no finding
};

export type Rule = {
  id: string;
  kind: RuleKind;
  /** treesitter: grammars the rule applies to ("js" expands to javascript, typescript and tsx). */
  language?: TreeLanguage[];
  /** regex / manifest: file globs (basename unless the glob contains "/"). */
  files?: string[];
  // treesitter, raw query form — capture @match marks the reported node
  query?: string;
  // treesitter, call form — matched against every call / constructor call
  callee?: string;
  args?: Record<string, string>; // positional index → regex on literal value (or source text)
  kwargs?: Record<string, string>; // Python keyword arguments
  props?: Record<string, string>; // JS object-literal properties in any argument
  // regex form
  pattern?: string;
  flags?: string;
  // manifest form
  libraries?: ManifestLibrary[];
  /** Where a variant is chosen from: arg0, kwarg:name, prop:name, capture:name, group:name, callee, match. */
  variant_from?: string;
  variants?: Variant[];
  /** Where a key size is read from (same syntax as variant_from, plus regex:<pattern>). */
  key_size?: string;
  parameter?: string;
  algorithm: string;
  primitive: Primitive;
  quantum_risk: QuantumRisk;
  confidence: Confidence;
  fix?: string;
  message: string;
  asset_type?: AssetType;
};

export type ManifestLibrary = {
  name: string; // regex on the dependency name
  ecosystem: 'npm' | 'pypi' | 'maven' | 'go' | 'any';
  algorithm: string;
  primitive: Primitive;
  quantum_risk: QuantumRisk;
  confidence?: Confidence;
  fix?: string;
  message: string;
  /** Only report when the declared version is below this (e.g. Go < 1.24). */
  version_below?: string;
};

export type Fix = {
  id: string;
  title: string;
  verified: string; // ISO date the guidance was last checked
  appliesTo: string[];
  why: string;
  replacement: string;
  before?: { lang: string; code: string };
  after?: { lang: string; code: string };
  caveats: string;
  references: string[];
  markdown: string;
};

export type SourceFile = { path: string; content: string };

export type SkipReason = 'excluded-dir' | 'minified' | 'too-large' | 'binary' | 'irrelevant' | 'cap';

export type ScanStats = {
  filesSeen: number;
  filesScanned: number;
  skipped: Partial<Record<SkipReason, number>>;
  bytesScanned: number;
  durationMs: number;
  byLanguage: Record<string, number>;
  /** Findings suppressed with an inline `quantumbom:ignore` comment. */
  suppressed: number;
};

export type ScoreInput = { label: string; value: string | number };

export type Scores = {
  exposure: number;
  agility: number;
  exposureInputs: ScoreInput[];
  agilityInputs: ScoreInput[];
};

export type ScanSource = { kind: 'github' | 'zip' | 'paste' | 'local'; name: string; ref?: string; url?: string };

export type ScanReport = {
  tool: { name: string; version: string };
  scannedAt: string;
  source: ScanSource;
  stats: ScanStats;
  findings: Finding[];
  scores: Scores;
  warnings: string[];
};
