// Package model holds the scanner's output data contract (PROJECT_SPEC.md §10.1).
// Field order is deliberate: encoding/json writes fields in declaration order,
// which keeps weekly diffs of data/scans/*.json readable.
package model

// Sectors accepted in targets/india.yaml. "other" is used for ad-hoc scans of
// hosts that are not in the target list.
var Sectors = []string{
	"banking", "payments", "government", "stock_broking", "insurance",
	"healthcare", "telecom", "ecommerce", "education", "media", "other",
}

// Error reason codes (§5.2).
const (
	ErrDNS     = "DNS_FAIL"
	ErrTimeout = "TIMEOUT"
	ErrTLS     = "TLS_FAIL"
	ErrRefused = "REFUSED"
)

// Hygiene flags (§5.4). They never change the quantum grade.
const (
	FlagRSAWeak      = "RSA_LT_2048"
	FlagSHA1InChain  = "SHA1_IN_CHAIN"
	FlagCertExpiring = "CERT_EXPIRING_SOON"
	FlagNoHSTS       = "NO_HSTS"
	FlagLegacyTLS    = "LEGACY_TLS"
	FlagCertInvalid  = "CERT_INVALID"
)

type ScanFile struct {
	ScannedAt      string       `json:"scannedAt"`
	ScannerVersion string       `json:"scannerVersion"`
	GoVersion      string       `json:"goVersion"`
	Results        []SiteResult `json:"results"`
}

type SiteResult struct {
	Host           string        `json:"host"`
	Org            string        `json:"org"`
	Sector         string        `json:"sector"`
	Subsector      string        `json:"subsector,omitempty"`
	Verified       bool          `json:"verified"`
	ShelfLifeYears int           `json:"shelfLifeYears"`
	Reachable      bool          `json:"reachable"`
	Error          *ErrorInfo    `json:"error,omitempty"`
	TLS            *TLSInfo      `json:"tls,omitempty"`
	Cert           *CertInfo     `json:"cert,omitempty"`
	HTTP           *HTTPInfo     `json:"http,omitempty"`
	Probes         *ProbeSummary `json:"probes,omitempty"`
	Grade          *string       `json:"grade"`
	HygieneFlags   []string      `json:"hygieneFlags"`
	HNDLRisk       int           `json:"hndlRisk"`
}

type ErrorInfo struct {
	Code   string `json:"code"`
	Detail string `json:"detail"`
}

type TLSInfo struct {
	MaxVersion    string   `json:"maxVersion"`
	DefaultGroup  string   `json:"defaultGroup"`
	PQHybrid      PQHybrid `json:"pqHybrid"`
	LegacyEnabled bool     `json:"legacyEnabled"`
	CipherSuite   string   `json:"cipherSuite"`
	ALPN          string   `json:"alpn,omitempty"`
}

type PQHybrid struct {
	X25519MLKEM768     bool  `json:"x25519mlkem768"`
	SecP256r1MLKEM768  *bool `json:"secp256r1mlkem768,omitempty"`
	SecP384r1MLKEM1024 *bool `json:"secp384r1mlkem1024,omitempty"`
}

type CertInfo struct {
	KeyAlgorithm             string   `json:"keyAlgorithm"`
	KeySize                  int      `json:"keySize"`
	Curve                    string   `json:"curve,omitempty"`
	SignatureAlgorithm       string   `json:"signatureAlgorithm"`
	Issuer                   string   `json:"issuer"`
	NotAfter                 string   `json:"notAfter"`
	ChainSignatureAlgorithms []string `json:"chainSignatureAlgorithms"`
	Valid                    bool     `json:"valid"`
	ValidationError          string   `json:"validationError,omitempty"`
}

type HTTPInfo struct {
	HSTS   bool    `json:"hsts"`
	Server string  `json:"server,omitempty"`
	CDN    *string `json:"cdn"`
}

// ProbeSummary records the raw pass/fail outcome of each probe so the site
// page can show exactly what was observed.
type ProbeSummary struct {
	Default ProbeOutcome `json:"default"`
	PQOnly  ProbeOutcome `json:"pqOnly"`
	PQAlt   ProbeOutcome `json:"pqAlt"`
	TLS13   ProbeOutcome `json:"tls13"`
	Legacy  ProbeOutcome `json:"legacy"`
	Head    ProbeOutcome `json:"head"`
}

type ProbeOutcome struct {
	OK     bool   `json:"ok"`
	Detail string `json:"detail,omitempty"`
}
