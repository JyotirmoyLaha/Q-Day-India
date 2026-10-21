"""Fixture: Python crypto usage. Lines marked `expect: <rule-id>` must be found;
every other line must produce no finding. RSA and MD5 mentioned in this docstring
must not be reported."""
import hashlib
import ssl

import jwt
import paramiko
import rsa as pyrsa
from Crypto.Cipher import DES3
from Crypto.Hash import MD5
from Crypto.PublicKey import ECC, RSA
from Crypto.Signature import pkcs1_15
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import dh, dsa, ec, ed25519, mlkem, padding, rsa, x25519

# rsa.generate_private_key(public_exponent=65537, key_size=1024)  <- commented out, ignored
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)  # expect: py-cryptography-rsa-generate
ciphertext = key.public_key().encrypt(  # (call on a variable: not a finding by itself)
    b"secret",
    padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None),  # expect: py-cryptography-rsa-padding
)

ec_key = ec.generate_private_key(ec.SECP256R1())  # expect: py-cryptography-ec-generate
shared = ec_key.exchange(ec.ECDH(), peer_public_key)  # expect: py-cryptography-ecdh
signature = ec_key.sign(b"data", ec.ECDSA(hashes.SHA256()))  # expect: py-cryptography-ecdsa

params = dh.generate_parameters(generator=2, key_size=2048)  # expect: py-cryptography-dh
dsa_key = dsa.generate_private_key(key_size=2048)  # expect: py-cryptography-dsa
xk = x25519.X25519PrivateKey.generate()  # expect: py-cryptography-x25519
ed = ed25519.Ed25519PrivateKey.generate()  # expect: py-cryptography-ed25519
digest = hashes.Hash(hashes.SHA1())  # expect: py-cryptography-weak-hash
good_digest = hashes.Hash(hashes.SHA256())

pq = mlkem.MLKEM768PrivateKey.generate()  # expect: py-cryptography-pq

legacy_md5 = hashlib.md5(b"etag")  # expect: py-hashlib-weak
also_sha1 = hashlib.new("sha1")  # expect: py-hashlib-new-weak
fine = hashlib.sha256(b"ok")
fine2 = hashlib.new("sha256")

pycrypto_rsa = RSA.generate(3072)  # expect: py-pycryptodome-pubkey
pycrypto_ecc = ECC.generate(curve="P-256")  # expect: py-pycryptodome-pubkey
signer = pkcs1_15.new(pycrypto_rsa)  # expect: py-pycryptodome-schemes
cipher = DES3.new(b"0123456789abcdef01234567", DES3.MODE_CBC)  # expect: py-pycryptodome-legacy-cipher
h = MD5.new(b"x")  # expect: py-pycryptodome-weak-hash

(pub, priv) = pyrsa.newkeys(2048)  # (aliased import: not matched — documented limitation)
(pub2, priv2) = rsa.newkeys(512)  # expect: py-rsa-lib

ctx = ssl.SSLContext(ssl.PROTOCOL_TLSv1)  # expect: py-ssl-legacy-protocol
ctx.minimum_version = ssl.TLSVersion.TLSv1_1  # expect: py-ssl-tlsversion-legacy
ctx.set_ecdh_curve("prime256v1")  # expect: py-ssl-ecdh-curve
modern = ssl.create_default_context()
modern.minimum_version = ssl.TLSVersion.TLSv1_2

ssh_key = paramiko.RSAKey.generate(bits=2048)  # expect: py-paramiko-keys

token = jwt.encode({"sub": "1"}, private_pem, algorithm="RS256")  # expect: py-jwt-algorithm
claims = jwt.decode(token, public_pem, algorithms=["ES256"])  # expect: py-jwt-algorithm
hmac_token = jwt.encode({"sub": "1"}, "secret", algorithm="HS256")
message = "We used RSA and MD5 in 2010"  # strings mentioning algorithms are not findings
