// Package targets loads targets/india.yaml and targets/optout.txt.
package targets

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"slices"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"

	"github.com/qday-india/qday-india/scanner/internal/grade"
	"github.com/qday-india/qday-india/scanner/internal/model"
)

type Target struct {
	Host           string `yaml:"host"`
	Org            string `yaml:"org"`
	Sector         string `yaml:"sector"`
	Subsector      string `yaml:"subsector,omitempty"`
	ShelfLifeYears int    `yaml:"shelf_life_years,omitempty"`
	Notes          string `yaml:"notes,omitempty"`
	Verified       bool   `yaml:"verified"`
}

// Load parses a target list, validates it and returns it sorted by host.
func Load(path string) ([]Target, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return Parse(b)
}

func Parse(b []byte) ([]Target, error) {
	var ts []Target
	dec := yaml.NewDecoder(bytes.NewReader(b))
	dec.KnownFields(true)
	if err := dec.Decode(&ts); err != nil {
		return nil, fmt.Errorf("parse targets: %w", err)
	}
	seen := map[string]bool{}
	for i := range ts {
		t := &ts[i]
		t.Host = strings.ToLower(strings.TrimSpace(t.Host))
		if t.Host == "" {
			return nil, fmt.Errorf("target #%d: empty host", i+1)
		}
		if seen[t.Host] {
			return nil, fmt.Errorf("duplicate host %s", t.Host)
		}
		seen[t.Host] = true
		if !slices.Contains(model.Sectors, t.Sector) {
			return nil, fmt.Errorf("%s: unknown sector %q", t.Host, t.Sector)
		}
		if t.Org == "" {
			return nil, fmt.Errorf("%s: org is required", t.Host)
		}
		t.ShelfLifeYears = grade.ShelfLife(t.Sector, t.ShelfLifeYears)
	}
	sort.Slice(ts, func(i, j int) bool { return ts[i].Host < ts[j].Host })
	return ts, nil
}

// OptOut is a set of opted-out hosts. An entry starting with "." matches every
// subdomain, e.g. ".example.in" matches "www.example.in" and "example.in".
type OptOut []string

func LoadOptOut(path string) (OptOut, error) {
	f, err := os.Open(path)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var out OptOut
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if i := strings.IndexByte(line, '#'); i >= 0 {
			line = strings.TrimSpace(line[:i])
		}
		if line != "" {
			out = append(out, strings.ToLower(line))
		}
	}
	return out, sc.Err()
}

func (o OptOut) Excludes(host string) bool {
	host = strings.ToLower(host)
	for _, e := range o {
		if strings.HasPrefix(e, ".") {
			if host == e[1:] || strings.HasSuffix(host, e) {
				return true
			}
		} else if host == e {
			return true
		}
	}
	return false
}

// Filter drops opted-out targets.
func (o OptOut) Filter(ts []Target) []Target {
	out := ts[:0:0]
	for _, t := range ts {
		if !o.Excludes(t.Host) {
			out = append(out, t)
		}
	}
	return out
}
