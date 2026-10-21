// Fixture: Go crypto usage.
package main

import (
	"crypto/ecdsa" // expect: go-crypto-import
	"crypto/elliptic" // expect: go-crypto-import
	"crypto/md5" // expect: go-crypto-import
	"crypto/mlkem" // expect: go-crypto-import
	"crypto/rand"
	"crypto/rsa" // expect: go-crypto-import
	"crypto/sha256"
	"crypto/tls"
	"fmt"
)

func main() {
	// rsa.GenerateKey(rand.Reader, 1024) in a comment is ignored
	k, _ := rsa.GenerateKey(rand.Reader, 2048) // expect: go-rsa-generate
	e, _ := ecdsa.GenerateKey(elliptic.P256(), rand.Reader) // expect: go-ecdsa-generate
	dk, _ := mlkem.GenerateKey768()
	fmt.Println(k, e, dk, md5.Sum(nil), sha256.Sum256(nil))

	old := &tls.Config{
		MinVersion:       tls.VersionTLS10, // expect: go-tls-version
		CurvePreferences: []tls.CurveID{tls.CurveP256, tls.X25519}, // expect: go-tls-curve-preferences
	}
	capped := &tls.Config{MaxVersion: tls.VersionTLS12} // expect: go-tls-version
	modern := &tls.Config{
		MinVersion:       tls.VersionTLS12,
		CurvePreferences: []tls.CurveID{tls.X25519MLKEM768, tls.X25519},
	}
	fmt.Println(old, capped, modern, "RSA in a string")
}
