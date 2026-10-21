package targets

import (
	"os"
	"path/filepath"
	"testing"
)

func TestParse(t *testing.T) {
	ts, err := Parse([]byte(`
- host: WWW.Zeta.in
  org: Zeta
  sector: media
- host: alpha.gov.in
  org: Alpha
  sector: government
  shelf_life_years: 30
  verified: true
`))
	if err != nil {
		t.Fatal(err)
	}
	if ts[0].Host != "alpha.gov.in" || ts[1].Host != "www.zeta.in" {
		t.Fatalf("not sorted/lowercased: %+v", ts)
	}
	if ts[0].ShelfLifeYears != 30 || ts[1].ShelfLifeYears != 1 {
		t.Fatalf("shelf life defaults wrong: %+v", ts)
	}
	if !ts[0].Verified || ts[1].Verified {
		t.Fatal("verified flag not parsed")
	}
}

func TestParseRejects(t *testing.T) {
	for name, doc := range map[string]string{
		"dup":        "- {host: a.in, org: A, sector: media}\n- {host: A.in, org: B, sector: media}",
		"sector":     "- {host: a.in, org: A, sector: crypto}",
		"org":        "- {host: a.in, sector: media}",
		"unknownKey": "- {host: a.in, org: A, sector: media, colour: red}",
	} {
		if _, err := Parse([]byte(doc)); err == nil {
			t.Errorf("%s: expected error", name)
		}
	}
}

func TestOptOut(t *testing.T) {
	p := filepath.Join(t.TempDir(), "optout.txt")
	os.WriteFile(p, []byte("# comment\nexact.in\n.wild.in  # all subdomains\n"), 0o644)
	o, err := LoadOptOut(p)
	if err != nil {
		t.Fatal(err)
	}
	cases := map[string]bool{"exact.in": true, "www.exact.in": false, "wild.in": true, "a.b.wild.in": true, "notwild.in": false}
	for h, want := range cases {
		if o.Excludes(h) != want {
			t.Errorf("Excludes(%s) = %v", h, !want)
		}
	}
	got := o.Filter([]Target{{Host: "exact.in"}, {Host: "keep.in"}})
	if len(got) != 1 || got[0].Host != "keep.in" {
		t.Fatalf("filter: %+v", got)
	}
	if o, err := LoadOptOut(filepath.Join(t.TempDir(), "missing.txt")); err != nil || o != nil {
		t.Fatal("missing opt-out file should be empty, not an error")
	}
}

func TestRepoTargetFileIsValid(t *testing.T) {
	ts, err := Load(filepath.Join("..", "..", "..", "targets", "india.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if len(ts) < 20 {
		t.Fatalf("expected at least 20 targets, got %d", len(ts))
	}
}
