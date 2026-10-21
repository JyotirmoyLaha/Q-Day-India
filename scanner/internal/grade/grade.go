// Package grade implements the quantum key-exchange grade (§5.4) and the
// Harvest-Now-Decrypt-Later risk score (§5.5). The TypeScript twin lives in
// apps/web/lib/grading.ts; both are tested against schemas/grading-cases.json.
package grade

import "math"

// Input is everything the grading rules look at.
type Input struct {
	Reachable  bool
	CertValid  bool
	MaxVersion string // "TLS1.3" | "TLS1.2" | "TLS1.1" | "TLS1.0"
	DefaultPQ  bool   // P1 negotiated a PQ hybrid group
	PQOnly     bool   // P2 passed (X25519MLKEM768)
	PQAlt      bool   // P3 passed (other hybrids)
	TLS13      bool   // P4 passed
	LegacyTLS  bool   // P5 passed
}

// Grade returns "A+", "A", "B", "C", "D", "F", or "" when the host is unreachable.
func Grade(in Input) string {
	switch {
	case !in.Reachable:
		return ""
	case !in.CertValid, in.MaxVersion == "TLS1.1", in.MaxVersion == "TLS1.0":
		return "F"
	case in.PQOnly && in.DefaultPQ && !in.LegacyTLS:
		return "A+"
	case in.PQOnly && in.DefaultPQ:
		return "A"
	case in.PQOnly || in.PQAlt:
		return "B"
	case in.TLS13 || in.MaxVersion == "TLS1.3":
		return "C"
	default:
		return "D"
	}
}

// SectorDefaults are the default data shelf lives in years (§5.3).
var SectorDefaults = map[string]int{
	"banking": 10, "payments": 7, "government": 25, "stock_broking": 10,
	"insurance": 15, "healthcare": 25, "telecom": 5, "ecommerce": 3,
	"education": 5, "media": 1, "other": 10,
}

// SectorWeights express how sensitive a sector's data typically is (§5.5).
var SectorWeights = map[string]float64{
	"government": 1.0, "healthcare": 1.0, "banking": 0.9, "insurance": 0.8,
	"stock_broking": 0.8, "payments": 0.8, "telecom": 0.6, "education": 0.5,
	"ecommerce": 0.4, "media": 0.2, "other": 0.5,
}

// Exposure is the share of traffic assumed recordable-and-later-decryptable.
func Exposure(grade string) float64 {
	switch grade {
	case "A+", "A":
		return 0
	case "B":
		return 0.3
	case "C", "D", "F":
		return 1
	default: // ungraded / unreachable
		return 0
	}
}

// HNDLRisk = round(100 * exposure * (0.6*shelf + 0.4*sector_w)), shelf = clamp(years/25, 0, 1).
func HNDLRisk(grade, sector string, shelfLifeYears int) int {
	shelf := math.Max(0, math.Min(1, float64(shelfLifeYears)/25))
	w, ok := SectorWeights[sector]
	if !ok {
		w = SectorWeights["other"]
	}
	return int(math.Round(100 * Exposure(grade) * (0.6*shelf + 0.4*w)))
}

// ShelfLife returns the explicit value if positive, else the sector default.
func ShelfLife(sector string, explicit int) int {
	if explicit > 0 {
		return explicit
	}
	if d, ok := SectorDefaults[sector]; ok {
		return d
	}
	return SectorDefaults["other"]
}
