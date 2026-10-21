// Fixture: Node.js crypto usage. `expect: <rule-id>` marks required findings.
const crypto = require('crypto');
const https = require('https');
const jwt = require('jsonwebtoken');
const forge = require('node-forge');
const nacl = require('tweetnacl');
const EC = require('elliptic').ec;
const NodeRSA = require('node-rsa');

// crypto.generateKeyPairSync('rsa', { modulusLength: 1024 })  <- comment, ignored
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 }); // expect: js-generate-keypair
crypto.generateKeyPair('ec', { namedCurve: 'P-256' }, () => {}); // expect: js-generate-keypair
const x = crypto.generateKeyPairSync('x25519'); // expect: js-generate-keypair
const pq = crypto.generateKeyPairSync('ml-kem-768'); // expect: js-generate-keypair

const signer = crypto.createSign('RSA-SHA256'); // expect: js-create-sign
const ecdh = crypto.createECDH('prime256v1'); // expect: js-create-ecdh
const dh = crypto.createDiffieHellman(2048); // expect: js-create-dh
const wrapped = crypto.publicEncrypt(publicKey, Buffer.from('k')); // expect: js-rsa-encrypt

const etag = crypto.createHash('md5').update('x').digest('hex'); // expect: js-weak-hash
const ok = crypto.createHash('sha256').update('x').digest('hex');
const des = crypto.createCipheriv('des-ede3-cbc', key24, iv8); // expect: js-cipher
const aes128 = crypto.createCipheriv('aes-128-gcm', key16, iv12); // expect: js-cipher
const aes256 = crypto.createCipheriv('aes-256-gcm', key32, iv12);

https.createServer({ key, cert, ecdhCurve: 'prime256v1', minVersion: 'TLSv1' }, app); // expect: js-tls-ecdh-curve, js-tls-version
https.createServer({ key, cert, ecdhCurve: 'X25519MLKEM768:X25519', minVersion: 'TLSv1.2' }, app);

const keys = forge.pki.rsa.generateKeyPair({ bits: 2048 }); // expect: js-node-forge
const md = forge.md.sha1.create(); // expect: js-node-forge

const box = nacl.box.keyPair(); // expect: js-tweetnacl
const signPair = nacl.sign.keyPair(); // expect: js-tweetnacl
const curve = new EC('secp256k1'); // expect: js-elliptic
const nodeRsa = new NodeRSA({ b: 2048 }); // expect: js-node-rsa

const token = jwt.sign({ sub: 1 }, privateKey, { algorithm: 'RS256' }); // expect: js-jsonwebtoken
jwt.verify(token, publicKey, { algorithms: ['ES384'] }); // expect: js-jsonwebtoken
const hs = jwt.sign({ sub: 1 }, 'secret', { algorithm: 'HS256' });
const doc = 'Do not use RSA or createHash("md5") in new code';
