---
title: Encryption demo kits
description: What is inside PhilHealth's ForEncryption.zip (C# and PHP demo kits), how each kit works, and the defects we confirmed by running them. Read this before you copy any of their code.
---

# Encryption demo kits

<Badge type="info" text="Reference only" /> <Badge type="danger" text="Security" /> <Badge type="danger" text="Bug" />

PhilHealth's DevKit includes `ForEncryption.zip`, with demo encryption programs in **C#** and **PHP** and a sample output from a **Java** program. They are useful for understanding the algorithm, but they are **not production code**. They contain a hard-coded IV, a non-secure random generator, non-standard padding, and bugs that we reproduced on PHP 7.4 and 8.3 ([KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16)). This page describes what's in the zip, how the kits work, and what not to copy. For correct, tested code, use the examples in [Encrypting API payloads](/guides/encryption/api-payloads) and [Encrypting attachments](/guides/encryption/attachments).

::: info Sources
- [ForEncryption.zip](/originals/encryption/ForEncryption.zip): the complete original archive (4.3 MB)
- Extracted source on this site:
  - PHP: [PhilHealthEClaimsEncryptor.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php), [encryptEclaimsAttachment.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/encryptEclaimsAttachment.php), [testEncryptAndDecryptXml.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/testEncryptAndDecryptXml.php)
  - C#: [PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs), [PhilHealthEClaimsDocEncryption.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsDocEncryption.cs), [Form1.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Form1.cs), [Program.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Program.cs), [Helpers/Utils.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Helpers/Utils.cs)
  - Helper scripts: [Recreate file to be encrypted.bat (PHP kit)](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/%40Files/Input/Recreate%20file%20to%20be%20encrypted.bat), [Recreate file to be encrypted.bat (C# kit)](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Input/Recreate%20file%20to%20be%20encrypted.bat)
  - Sample outputs: [usingCSharp.pdf.enc](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc), [UsingJava.pdf.enc](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE--UsingJava.pdf.enc), [usingPHP.pdf.enc](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingPHP.pdf.enc)
- [pnpki_philhealth_eclaims_auth_cert.pem](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem) (the certificate both kits use; expired, [KI-01](/known-issues#ki-01))
- [Implementation Guide Annex A, p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) and [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf), which the kits implement
:::

Terms used on this page (see the [Glossary](/getting-started/glossary)): [AES](/getting-started/glossary#aes) (Advanced Encryption Standard), [IV](/getting-started/glossary#iv) (initialization vector), [RSA](/getting-started/glossary#rsa) (public-key encryption), [PKCS#1 v1.5](/getting-started/glossary#pkcs1) and OAEP (Optimal Asymmetric Encryption Padding, two RSA padding modes), and the [cipher key](/getting-started/glossary#cipher-key). "KI-nn" links point to the [Known issues](/known-issues) register.

## TL;DR

- Use the kits to **understand** the algorithm. Don't copy them into production.
- **C# kit** ([KI-15](/known-issues#ki-15)): every IV is the fixed text `0123456789ABCDEF`, for payloads and attachments; keys come from the non-secure `System.Random`; decryption leaves the zero padding in the text; with logging on, the plaintext and the cipher key are logged as hex.
- **PHP kit** ([KI-16](/known-issues#ki-16)): `encryptImageFile` crashes on PHP 8. Decryption is unreliable: the kit's own output never decrypts correctly for plaintext lengths of 31 mod 32, and payloads zero-padded per Annex A whose length is an exact multiple of 16 bytes almost always come back empty or with extra bytes. One encryptor object reuses its IV and password; the cipher key is logged; the attachment demo page deletes files named in a web form.
- **Padding** ([KI-13](/known-issues#ki-13)): the C# kit zero-pads to 16 bytes as Annex A says. The PHP kit pads to 32 bytes with a length byte.
- **Both kits** ship the expired 2014 test certificate ([KI-01](/known-issues#ki-01)), use RSA PKCS#1 v1.5 padding, which the guideline never names ([KI-59](/known-issues#ki-59)), and delete the source file after encrypting it (the PHP kit on PHP 7.4; on PHP 8 it crashes first). There is no Java kit ([KI-41](/known-issues#ki-41)).
- For working code, use [Encrypting API payloads](/guides/encryption/api-payloads) and [Encrypting attachments](/guides/encryption/attachments).

## What's in ForEncryption.zip

The files in the archive are dated 2022-02-24, so the kits predate the 2025 attachment guideline.

```text
ForEncryption/
├── Demo Kit for C#/
│   ├── EClaimsDocEncryption.sln              Visual Studio solution
│   ├── .vs/ , EClaimsDocEncryption.v12.suo   Visual Studio user settings
│   ├── packages/Newtonsoft.Json.10.0.3/      NuGet package (DLLs for several .NET targets)
│   └── PhilHealthEClaimsEncryptionDemoApp/   Windows Forms app, .NET Framework 4.5
│       ├── PhilHealthEClaimsEncryptor.cs     the encryption class the app uses
│       ├── PhilHealthEClaimsDocEncryption.cs older class, NOT compiled (not in the .csproj)
│       ├── Form1.cs, Form1.Designer.cs, Program.cs, Helpers/Utils.cs, Properties/
│       ├── @Files/Input/                     sample PDF (4,496 bytes), certificate, "Recreate file to be encrypted.bat"
│       ├── @Files/Output/                    ...-usingCSharp.pdf.enc and ...--UsingJava.pdf.enc
│       └── bin/Debug/, obj/Debug/            compiled .exe, .pdb, a copy of the certificate
└── Demo Kit for PHP/
    └── EClaimsEncryption/                    NetBeans PHP project (php.version=PHP_53)
        ├── PhilHealthEClaimsEncryptor.php    the encryption class
        ├── encryptEclaimsAttachment.php      web form: encrypt an attachment
        ├── testEncryptAndDecryptXml.php      web form: encrypt/decrypt an XML payload
        ├── @Files/Input/                     sample PDF (.orig.pdf), certificate, .bat
        ├── @Files/Output/                    ...-usingPHP.pdf.enc
        ├── @Samples/                         another copy of the sample PDF
        └── nbproject/                        NetBeans settings
```

The browsable copy on this site is under `/originals/encryption/demo-kits-source/`. There, the `Demo Kit for C#` folder is renamed `Demo Kit for CSharp`, because a `#` in a web address breaks links on many servers. The files themselves are unchanged.

The `Recreate file to be encrypted.bat` files ([PHP kit](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/%40Files/Input/Recreate%20file%20to%20be%20encrypted.bat), [C# kit](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Input/Recreate%20file%20to%20be%20encrypted.bat)) contain one command, `copy "SAMPLE_BIRTH_CERTIFICATE.orig.pdf" "SAMPLE_BIRTH_CERTIFICATE.pdf"`. They exist because both kits **delete the input file** after encrypting it.

There is **no Java kit** in the archive, only a Java-produced output file inside the C# folder ([KI-41](/known-issues#ki-41)). The extracted-source folder on this site holds only the source files, `.bat` files and sample outputs. Download the zip for the binaries, the sample PDF and the certificate.

## How the kits work

Both kits have one class that does both schemes. When the passphrase (the **cipher key**) is empty, the class runs the attachment scheme: a random password, and key and IV encrypted with the public key. When it is set, the class runs the API payload scheme: the key is derived from the cipher key, and `key1`/`key2` are empty. See [Encryption overview](/guides/encryption/) for the two schemes.

### PHP kit

Class `PhilHealthEClaimsEncryptor` in [PhilHealthEClaimsEncryptor.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php):

| Method | Purpose |
|---|---|
| `encryptXmlPayloadData($xml, $passphrase)` | API payload encryption. Returns the envelope as a JSON string, with `docMimeType` fixed to `"text/xml"`. |
| `decryptPayloadDataToXml($encryptedDataAsJsonStr, $passphrase)` | Decrypts a payload envelope and returns the text. |
| `setPublicKeyFileName($publicKeyFileName)` | Loads PhilHealth's certificate. The demo passes a `file://` path. |
| `encryptImageFile($sourceFileName, $sourceFileMimeType, $encryptedFileName)` | Attachment encryption. Writes the `.enc` JSON file, then **deletes the source file**. |
| `encrypt($data, $dataMimeType, $passphrase)` | The shared worker behind `encryptXmlPayloadData` and `encryptImageFile`. It is `public`, so you can call it directly. |
| `setPassword1UsingHexStr`, `setPassword2UsingHexStr`, `setIVUsingHexStr`, `resetPasswordAndIV` | Debugging helpers that fix the password or IV |

The two demo pages are small web forms. `testEncryptAndDecryptXml.php` uses the default passphrase `123456`. `encryptEclaimsAttachment.php` takes file names from form fields.

Key derivation, as described in Annex A step 2 (lines 194–207):

```php
function getPassphraseHash($passphrase)
{
    $cipherKey = array();
    $passphraseHash = $this->getSHA256HashAsRawBinaryData($passphrase);
    $passphraseHashLen = strlen($passphraseHash);
    if($passphraseHashLen >= self::CIPHER_KEY_LEN){
        $cipherKey = substr($passphraseHash, 0, self::CIPHER_KEY_LEN);
    }else{
        $padLen = self::CIPHER_KEY_LEN - $passphraseHashLen;
        $padding = str_repeat("\0", $padLen);
        $cipherKey = $passphraseHashLen . $padding;
    }
    return $cipherKey;
}
```

`getSHA256HashAsRawBinaryData` is `hash("sha256", $data, true)`, the raw 32-byte digest ([KI-14](/known-issues#ki-14)). AES and RSA (lines 228–236 and 255–258):

```php
private function encryptUsingAES($data, $cipherKey, $cipherIV)
{
    $blockSizeInBits = 256;
    $method = "AES-{$blockSizeInBits}-CBC";
    $data = $this->pad($data, $blockSizeInBits/8);
    $options = OPENSSL_ZERO_PADDING + OPENSSL_RAW_DATA;
    //$options = OPENSSL_ZERO_PADDING;
    return openssl_encrypt($data, $method, $cipherKey, $options, $cipherIV);
}
```

```php
private function encryptUsingPublicKey($data, &$encryptedData)
{
    return openssl_public_encrypt($data, $encryptedData, $this->_publicKey);
}
```

`openssl_public_encrypt` without a padding argument uses PKCS#1 v1.5, the mode both kits use; the attachment guideline doesn't name one ([KI-59](/known-issues#ki-59)). Random bytes come from `openssl_random_pseudo_bytes`. The hash is `hash("sha256", $data)`: 64 lowercase hex characters.

### C# kit

A Windows Forms app (.NET Framework 4.5, Windows only) with two tabs, "e-Claims Doc Encryption" and "e-Claimss XML Payload Encryption" (sic). Both tabs use class `PhilHealthEClaimsEncryptor` in [PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs) ([Form1.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Form1.cs)):

| Method | Purpose |
|---|---|
| `EncryptXmlPayload(string xml, string passphrase)` | API payload encryption (UTF-8 bytes, `docMimeType` `"text/xml"`) |
| `DecryptPayloadDataToXml(string encryptedDataAsJsonStr, string passphrase)` | Decrypts a payload envelope |
| `EncryptImageFile(string sourceFileName, string dataMimeType, string encryptedFileName)` | Attachment encryption. Writes the `.enc` file, then **deletes the source file**. |

AES and RSA (lines 261–268 and 328–331):

```csharp
using (AesManaged aes = new AesManaged())
{
    aes.Padding = PaddingMode.Zeros;
    aes.KeySize = 256;
    aes.BlockSize = 128;
    aes.Mode = CipherMode.CBC;
    aes.IV = cipherIV;
    aes.Key = cipherKey;
```

```csharp
RSACryptoServiceProvider rsaObj = (RSACryptoServiceProvider)_publicKey.Key;
try
{
    encryptedData = rsaObj.Encrypt(data, false);
```

`Encrypt(data, false)` means "no OAEP", so RSA PKCS#1 v1.5. The key for payloads is SHA-256 of the passphrase's UTF-8 bytes. The hash is written with `ToString("x2")`: lowercase hex.

[PhilHealthEClaimsDocEncryption.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsDocEncryption.cs) defines an older attachment-only class, `PhilHealthEClaimsDocEncryptor`. It is **not listed in the project file**, so it is never compiled or used. It also draws its password and IV from `System.Random` ([KI-15](/known-issues#ki-15)). Ignore it.

### Side-by-side

| | PHP kit | C# kit |
|---|---|---|
| Payload AES key | `hash('sha256', $passphrase, true)` (the string's raw bytes) | `SHA256.ComputeHash(UTF8(passphrase))`. The DevKit names no encoding ([KI-60](/known-issues#ki-60)). |
| Attachment password | 2 × 16 random bytes | 2 × 16 random bytes |
| Random generator | `openssl_random_pseudo_bytes` (suitable) | `System.Random` (**not** cryptographically secure) |
| IV | Random, but **cached per object** | **Always `"0123456789ABCDEF"`** |
| AES padding | Custom `pad()`: multiple of **32**, zeros + length byte | `PaddingMode.Zeros` (multiple of 16) |
| Padding removal on decrypt | Pads the *ciphertext*, then truncates at the first `0x00` | None: trailing `0x00` stay in the string |
| RSA padding | PKCS#1 v1.5 (default) | PKCS#1 v1.5 (`fOAEP = false`). The guideline names no mode ([KI-59](/known-issues#ki-59)). |
| `hash` | lowercase hex | lowercase hex |
| JSON writer | `json_encode` (writes `/` as `\/`) | `JavaScriptSerializer` |
| Deletes the source file | Yes (`unlink`) | Yes (`File.Delete`) |

### Sample outputs

All three sample files encrypt the same 4,496-byte PDF (SHA-256 `2a3e6601ca70f8d2036c81e5a4d6549888984d686b87581db99c449744463d20`) with a 2048-bit RSA key:

| File | Size | `doc` (decoded) | `key1` / `key2` / `iv` (decoded) | Notes |
|---|---|---|---|---|
| `…-usingCSharp.pdf.enc` | 7,172 B | 4,496 B | 256 B each | No padding added (4,496 is a multiple of 16) |
| `…-usingPHP.pdf.enc` | 7,294 B | 4,512 B | 256 B each | 16 bytes of PHP-kit padding; slashes escaped as `\/` |
| `…--UsingJava.pdf.enc` | 7,301 B | 4,512 B | 256 B each | Keys in a different order (`iv` first); slashes escaped. Padding can't be identified without the private key. |

All three are valid JSON with the same six keys. Key order and `\/` escaping don't matter to a JSON parser.

The sample PDF itself ends with 15 `0x00` bytes after `%%EOF`. A decryptor that removes zero padding by stripping every trailing `0x00` would turn it into a 4,481-byte file whose hash no longer matches. See [Padding: not specified](/guides/encryption/attachments#padding-not-specified-ki-13).

## Known problems: do not copy blindly {#known-problems}

We ran the PHP kit's code, unchanged, on PHP 8.3.33 and 7.4.33 (Docker `php:8.3-cli`, `php:7.4-cli`). We ran the C# kit's `EncryptUsingAES`/`DecryptUsingAES` methods, copied verbatim, on .NET 8. The full C# app needs Windows and .NET Framework, which we could not run. Findings marked *observed* come from these runs.

### 1. C#: fixed IV and a non-secure random generator (KI-15)

<Badge type="danger" text="Security" />

```csharp
const bool UsesDummyInitVector = true;  //for debugging only
```

```csharp
if (UsesDummyInitVector)
{
    iv = new byte[DummyInitVector.Length];
    System.Buffer.BlockCopy(DummyInitVector, 0, iv, 0, DummyInitVector.Length);
}
else
    iv = GetRandomBytes(CIPHER_IV_LEN);
```

```csharp
private byte[] GetRandomBytes(int count)
{
    Random random = new Random();
    byte[] data = new byte[count];
    random.NextBytes(data);
    return data;
}
```

([PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs), lines 18, 166–172, 236–242.) Every IV is the ASCII text `0123456789ABCDEF`. The form uses this class for both payloads and attachments, so both are affected. `System.Random` is predictable. Microsoft's documentation notes that on .NET Framework, `Random` objects created in quick succession get the same clock-based seed, so the two "random" password halves may even be identical. We did not run the .NET Framework app to confirm this. The unused `Utils.GenerateRandomBytes` is weaker still: `new Random(DateTime.Now.Millisecond)` has only 1,000 possible seeds.

**Instead:** `RandomNumberGenerator` (.NET), `crypto.randomBytes` (Node.js), `secrets.token_bytes` (Python), `random_bytes` (PHP).

### 2. PHP: non-standard padding that the kit itself can't always undo (KI-13, KI-16)

<Badge type="warning" text="Conflicting sources" /> <Badge type="danger" text="Bug" />

```php
public function pad($string, $blockSizeInBits = 32) {
    $pad = $blockSizeInBits - (strlen($string) % $blockSizeInBits);
    return $string . str_repeat(chr(0), $pad - 1) . chr($pad);
}
```

Despite the parameter name, the value is in **bytes**. The kit calls `pad($data, 32)`, so data is padded to a multiple of 32 bytes with zeros plus a final byte holding the pad length. It always adds 1–32 bytes. Annex A instead says to pad with `0x00` to a multiple of 16, adding nothing if already aligned.

Decryption (lines 237–250 and 103–107) first **pads the ciphertext** the same way, which appends a garbage block to the decrypted output. It then cuts the text at the first `0x00`:

```php
$data = $this->pad($data, $blockSizeInBits/8);
```

```php
//truncates decrypted data up to the position of the null ('\0') character
$nullCharPos = strpos($decryptedXml, "\0");
if($nullCharPos >= 0){
    $decryptedXml = substr($decryptedXml,0, $nullCharPos); //msm2018-02-16:  Changed $nullCharPos-1 to $nullCharPos;
}
```

When there is no `0x00`, `strpos` returns `false`. `false >= 0` is `true` in PHP, and `substr($x, 0, false)` returns `''`. *Observed* on both PHP versions. The result:

| Scenario (observed, PHP 8.3 and 7.4) | Result |
|---|---|
| Kit encrypts → kit decrypts, text plaintext, length **not** 31 mod 32 | Correct (50 of 50 trials for every such length from 1 to 96) |
| Kit encrypts → kit decrypts, plaintext length **31 mod 32** (the padding is a single `0x01`, so there is no `0x00`) | **Never correct**: 93–96% of 1,000 trials per length returned an empty string, the rest the text plus `0x01` and garbage |
| Annex A zero-padded payload (our examples, or the C# kit) → kit decrypts, length **not** a multiple of 16 | Correct (50 of 50 trials for every such length from 1 to 96) |
| Same, length **a multiple of 16** (no padding bytes) | **Almost always wrong**: 92–95% of 1,000 trials per length returned an empty string, most of the rest the text plus 1–15 garbage bytes. Only 0.2–0.6% came back correct, by chance (when the extra decrypted bytes happen to start with `0x00`). |
| Kit encrypts → a strict Annex A decryptor (strip trailing `0x00`) | Leaves the zeros and the pad-length byte in place (for example `…/>` `00…00 0c`), so the hash check fails |
| Kit encrypts → our examples (hash-guided unpadding) | Correct for every length we tried |

**Instead:** follow Annex A exactly for encryption. When decrypting, let the SHA-256 `hash` pick the padding to remove, as our examples do. See [Removing the padding](/guides/encryption/api-payloads#removing-the-padding).

### 3. PHP: `encryptImageFile` fails on PHP 8 (KI-16)

<Badge type="danger" text="Bug" />

Line 59 joins strings with `+` instead of `.`:

```php
$this->log("Saving the JSON string of the encrypted e-claim doc as '" . urlencode($encryptedFileName) + "'...");
```

The argument is evaluated even when logging is off. *Observed:*

| PHP version | What happens |
|---|---|
| 8.3.33 | `TypeError: Unsupported operand types: string + string`, thrown **after** encryption but **before** the file is written. No `.enc` file is created, and the source file is not deleted. |
| 7.4.33 | When the file is loaded: `Deprecated: The behavior of unparenthesized expressions containing both '.' and '+'/'-' will change in PHP 8`. When the line runs: twice `Warning: A non-numeric value encountered`. Then it continues: it writes the `.enc` file and deletes the source. |

The NetBeans project is set to PHP 5.3 (`php.version=PHP_53`). On PHP 8 you can still call the public `encrypt($data, $dataMimeType, null)` method directly; that is what we did for our tests.

The same register entry ([KI-16](/known-issues#ki-16)) notes that the `else` branch of `getPassphraseHash` (shown above) joins the hash **length** instead of the hash. That branch is dead code: a SHA-256 digest is always 32 bytes.

### 4. PHP: the same IV and password for every call on one object (KI-16)

<Badge type="danger" text="Security" />

```php
public function getIV() {
    if(empty($this->_iv)){
        $this->log("Generating 16 random bytes for initialization vector for AES encryption...");
        $this->_iv = $this->getRandomBytes(self::CIPHER_IV_LEN);
    }
    return $this->_iv;
}
```

`getPassword1()` and `getPassword2()` (lines 303–316) cache the same way. *Observed:* two `encryptXmlPayloadData` calls on one object produced the **same `iv`**. Two attachment encryptions on one object used the **same AES password and IV**; we confirmed this by decrypting `key1`, `key2` and `iv` with a test private key. The RSA-encrypted `key1`/`key2`/`iv` strings still looked different, because RSA PKCS#1 v1.5 output is randomized. `resetPasswordAndIV()` exists, but neither demo page calls it ([KI-16](/known-issues#ki-16)).

**Instead:** generate a new IV (and, for attachments, a new password) inside every encrypt call.

### 5. C#: decryption leaves the zero padding in the text (KI-15, KI-13)

`DecryptPayloadDataToXml`, lines 114–118:

```csharp
var decryptedBytes = this.DecryptUsingAES(encryptedData, cipherKeyBytes, iv);

string decryptedXml = Encoding.UTF8.GetString(decryptedBytes);

return decryptedXml;
```

`PaddingMode.Zeros` adds zeros when encrypting but does not remove them when decrypting. *Observed* (on .NET 8, with the kit's methods): a 7-character payload came back as a 16-character string ending in nine `\0` characters, and the hash no longer matched ([KI-15](/known-issues#ki-15)). Remove trailing `0x00` bytes before you use or hash the result. That is safe for text payloads, but not for attachments ([KI-13](/known-issues#ki-13)).

### 6. Both kits: secrets and plaintext in logs (KI-15, KI-16)

When logging is on (both demo UIs turn it on), the PHP decryptor logs the passphrase (line 75) and the derived key in base64 (lines 95 and 245):

```php
$this->log("decryptXmlPayload:: passphrase: $passphrase " );
```

The C# class logs every input to its SHA-256 helper as hex (`Log("Data to compute hash for:"); Log(ToHexString(data));`, lines 341–342). That helper hashes the plaintext, and also the cipher key itself when `GetPassphraseHash` derives the AES key (line 128). So with logging on, the C# app shows both the full plaintext and the cipher key (as hex) in its log box ([KI-15](/known-issues#ki-15)). The PHP logging is part of [KI-16](/known-issues#ki-16). Recommendation (not from PhilHealth): never log cipher keys, derived keys, or claim data.

### 7. Both kits: the source file is deleted

`encryptImageFile` ends with `unlink($sourceFileName)` (PHP, line 63) and `EncryptImageFile` with `File.Delete(sourceFileName)` (C#, line 77). On PHP 8 the PHP kit crashes one line before the write, so the source survives there ([section 3](#_3-php-encryptimagefile-fails-on-php-8-ki-16)). You can't decrypt your own attachments, and you need the originals for resending, certification checks and data migration. See [Keep the original files](/guides/encryption/attachments#publishing-the-file-and-referencing-it).

### 8. The PHP demo pages must never be exposed on a server (KI-16)

`encryptEclaimsAttachment.php` reads the input path, output path, certificate path, password and IV from form fields, then deletes the input file. On a reachable web server, anyone could make it read or delete files ([KI-16](/known-issues#ki-16)). Run the demos only on your own machine (recommendation, not from PhilHealth).

### 9. Other points

- **Expired certificate.** Both kits ship the 2014 test certificate ([KI-01](/known-issues#ki-01)).
- **No Java source** ([KI-41](/known-issues#ki-41)).
- **`docMimeType` is fixed to `text/xml`** for payloads in both kits. Annex A asks for the data's real MIME type, for example `application/json` ([KI-25](/known-issues#ki-25)).
- **The PHP test page's "Cipher IV" field** is read, but never passed to the encryptor ([testEncryptAndDecryptXml.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/testEncryptAndDecryptXml.php), lines 14 and 73–75). This is harmless but misleading ([KI-16](/known-issues#ki-16)).

## Running the PHP kit yourself

You can run the PHP class from the command line with Docker. This helps when you want to see what the kit produces. Copy `PhilHealthEClaimsEncryptor.php` into an empty folder first.

```bash
# Encrypt a payload with the demo passphrase 123456 (API payload scheme)
docker run --rm -v "$PWD":/w -w /w php:8.3-cli php -r '
  require "PhilHealthEClaimsEncryptor.php";
  $e = new PhilHealthEClaimsEncryptor();
  echo $e->encryptXmlPayloadData("<eSOA/>", "123456"), "\n";'

# Decrypt an envelope saved in envelope.json
docker run --rm -v "$PWD":/w -w /w php:8.3-cli php -r '
  require "PhilHealthEClaimsEncryptor.php";
  $e = new PhilHealthEClaimsEncryptor();
  var_dump($e->decryptPayloadDataToXml(file_get_contents("envelope.json"), "123456"));'
```

The C# app needs Windows with Visual Studio and .NET Framework 4.5.

## Related pages

- [Encryption overview](/guides/encryption/)
- [Encrypting API payloads (cipher key)](/guides/encryption/api-payloads)
- [Encrypting attachments (public key)](/guides/encryption/attachments)
- [Original source files](/sources/)
- Known issues: [KI-01](/known-issues#ki-01), [KI-12](/known-issues#ki-12), [KI-13](/known-issues#ki-13), [KI-14](/known-issues#ki-14), [KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16), [KI-25](/known-issues#ki-25), [KI-41](/known-issues#ki-41), [KI-59](/known-issues#ki-59), [KI-60](/known-issues#ki-60)
