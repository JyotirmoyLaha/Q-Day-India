package grade

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type casesFile struct {
	Grades []struct {
		Name string `json:"name"`
		In   struct {
			Reachable  bool   `json:"reachable"`
			CertValid  bool   `json:"certValid"`
			MaxVersion string `json:"maxVersion"`
			DefaultPQ  bool   `json:"defaultPQ"`
			PQOnly     bool   `json:"pqOnly"`
			PQAlt      bool   `json:"pqAlt"`
			TLS13      bool   `json:"tls13"`
			LegacyTLS  bool   `json:"legacyTLS"`
		} `json:"in"`
		Grade *string `json:"grade"`
	} `json:"grades"`
	HNDL []struct {
		Grade  *string `json:"grade"`
		Sector string  `json:"sector"`
		Shelf  int     `json:"shelf"`
		Risk   int     `json:"risk"`
	} `json:"hndl"`
	ShelfDefaults map[string]int `json:"shelfDefaults"`
}

func loadCases(t *testing.T) casesFile {
	t.Helper()
	b, err := os.ReadFile(filepath.Join("..", "..", "..", "schemas", "grading-cases.json"))
	if err != nil {
		t.Fatal(err)
	}
	var c casesFile
	if err := json.Unmarshal(b, &c); err != nil {
		t.Fatal(err)
	}
	return c
}

func TestGradeParityCases(t *testing.T) {
	for _, c := range loadCases(t).Grades {
		in := Input{c.In.Reachable, c.In.CertValid, c.In.MaxVersion, c.In.DefaultPQ, c.In.PQOnly, c.In.PQAlt, c.In.TLS13, c.In.LegacyTLS}
		want := ""
		if c.Grade != nil {
			want = *c.Grade
		}
		if got := Grade(in); got != want {
			t.Errorf("%s: got %q want %q", c.Name, got, want)
		}
	}
}

func TestHNDLParityCases(t *testing.T) {
	for _, c := range loadCases(t).HNDL {
		g := ""
		if c.Grade != nil {
			g = *c.Grade
		}
		if got := HNDLRisk(g, c.Sector, c.Shelf); got != c.Risk {
			t.Errorf("HNDLRisk(%q,%q,%d) = %d, want %d", g, c.Sector, c.Shelf, got, c.Risk)
		}
	}
}

func TestShelfDefaults(t *testing.T) {
	c := loadCases(t)
	for sector, want := range c.ShelfDefaults {
		if got := ShelfLife(sector, 0); got != want {
			t.Errorf("ShelfLife(%s) = %d, want %d", sector, got, want)
		}
	}
	if ShelfLife("banking", 30) != 30 {
		t.Error("explicit shelf life must win")
	}
	if ShelfLife("unknown-sector", 0) != SectorDefaults["other"] {
		t.Error("unknown sector falls back to other")
	}
}

func TestHNDLBounds(t *testing.T) {
	for _, g := range []string{"A+", "A", "B", "C", "D", "F", ""} {
		for s := range SectorWeights {
			for _, y := range []int{-5, 0, 1, 25, 100} {
				r := HNDLRisk(g, s, y)
				if r < 0 || r > 100 {
					t.Fatalf("risk out of range: %d", r)
				}
			}
		}
	}
}
