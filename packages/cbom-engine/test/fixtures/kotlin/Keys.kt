// Fixture: Kotlin (regex rules).
package `in`.example

import java.security.KeyPairGenerator
import java.security.MessageDigest

fun keys() {
    val kpg = KeyPairGenerator.getInstance("RSA") // expect: jvm-regex-getinstance
    // val old = MessageDigest.getInstance("MD5")  <- comment, ignored
    val md = MessageDigest.getInstance("SHA-1") // expect: jvm-regex-getinstance
    val ok = MessageDigest.getInstance("SHA-256")
    val pq = KeyPairGenerator.getInstance("ML-DSA")
}
