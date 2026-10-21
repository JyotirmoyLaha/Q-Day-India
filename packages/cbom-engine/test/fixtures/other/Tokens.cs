// Fixture: C# classical crypto.
using System.Security.Cryptography;

public static class Tokens
{
    public static byte[] Sign(byte[] data)
    {
        using var rsa = RSA.Create(2048); // expect: csharp-classical
        using var sha1 = SHA1.Create(); // expect: csharp-classical
        using var sha256 = SHA256.Create();
        return rsa.SignData(data, HashAlgorithmName.SHA256, RSASignaturePadding.Pss);
    }
}
