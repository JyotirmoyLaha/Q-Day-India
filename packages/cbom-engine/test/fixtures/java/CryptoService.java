// Fixture: Java JCA + BouncyCastle usage.
package in.example.crypto;

import java.security.*;
import javax.crypto.*;
import javax.net.ssl.SSLContext;
import org.bouncycastle.crypto.generators.RSAKeyPairGenerator;
import org.bouncycastle.crypto.digests.SHA1Digest;

public class CryptoService {
    // KeyPairGenerator.getInstance("DSA") in a comment is ignored
    public KeyPair rsa() throws Exception {
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA"); // expect: java-keypairgenerator
        kpg.initialize(2048);
        return kpg.generateKeyPair();
    }

    public KeyPair pq() throws Exception {
        return KeyPairGenerator.getInstance("ML-KEM").generateKeyPair(); // expect: java-keypairgenerator
    }

    public byte[] ecdh(PrivateKey a, PublicKey b) throws Exception {
        KeyAgreement ka = KeyAgreement.getInstance("ECDH"); // expect: java-keyagreement
        ka.init(a);
        ka.doPhase(b, true);
        return ka.generateSecret();
    }

    public byte[] sign(PrivateKey k, byte[] data) throws Exception {
        Signature s = Signature.getInstance("SHA256withECDSA"); // expect: java-signature
        Signature legacy = Signature.getInstance("SHA1withRSA"); // expect: java-signature, java-signature-weak-hash
        s.initSign(k);
        s.update(data);
        return s.sign();
    }

    public Cipher ciphers() throws Exception {
        Cipher rsa = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding"); // expect: java-cipher
        Cipher des = Cipher.getInstance("DESede/CBC/PKCS5Padding"); // expect: java-cipher
        return Cipher.getInstance("AES/GCM/NoPadding");
    }

    public byte[] digest(byte[] d) throws Exception {
        MessageDigest.getInstance("SHA-256").digest(d);
        return MessageDigest.getInstance("MD5").digest(d); // expect: java-messagedigest-weak
    }

    public void tls() throws Exception {
        SSLContext old = SSLContext.getInstance("TLSv1"); // expect: java-sslcontext-legacy
        SSLContext ok = SSLContext.getInstance("TLSv1.3");
        System.setProperty("jdk.tls.namedGroups", "secp256r1,x25519"); // expect: java-tls-named-groups
        System.setProperty("jdk.tls.namedGroups", "X25519MLKEM768,x25519");
        KeyFactory kf = KeyFactory.getInstance("EC"); // expect: java-keyfactory
    }

    public void bc() {
        RSAKeyPairGenerator gen = new RSAKeyPairGenerator(); // expect: java-bouncycastle
        SHA1Digest d = new SHA1Digest(); // expect: java-bouncycastle
        String label = "RSA is mentioned in a string only";
    }
}
