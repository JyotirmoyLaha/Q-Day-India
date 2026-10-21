/* Fixture: C with OpenSSL low-level APIs. */
#include <openssl/rsa.h>
#include <openssl/md5.h>

int make_key(void) {
    RSA *rsa = RSA_new();
    BIGNUM *e = BN_new();
    RSA_generate_key_ex(rsa, 2048, e, NULL); // expect: c-openssl-classical
    // MD5_Init(&ctx);  <- comment, ignored
    const EVP_MD *md = EVP_md5(); // expect: c-openssl-classical
    EVP_PKEY *pq = EVP_PKEY_Q_keygen(NULL, NULL, "ML-KEM-768");
    return 0;
}
