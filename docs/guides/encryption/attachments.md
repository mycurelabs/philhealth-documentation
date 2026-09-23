---
title: Encrypting attachments (public key)
description: How to encrypt scanned PDFs and CF4, CF5 and eSOA XML files with PhilHealth's public key, publish them at an HTTPS URL, and test them byte by byte, with tested Node.js and Python code.
---

# Encrypting attachments (public key)

<Badge type="tip" text="Current: 2025-03-14 guideline" /> <Badge type="warning" text="Gap" />

Supporting documents for a claim are not uploaded to PECWS. Your system **encrypts each file with PhilHealth's public key**, publishes it at an HTTPS URL, and puts that URL in the eClaims XML (`DOCUMENT/@pDocumentURL`). This page follows PhilHealth's 2025 attachment guideline step by step. It covers the details the guideline leaves open (the AES padding, the RSA padding and the MIME type for XML files: [KI-13](/known-issues#ki-13), [KI-59](/known-issues#ki-59), [KI-57](/known-issues#ki-57)) and gives tested Node.js and Python code. The certificate bundled with the DevKit expired in 2014, so you need a current one from PhilHealth ([KI-01](/known-issues#ki-01)). For request and response bodies, which use the cipher key instead, see [Encrypting API payloads](/guides/encryption/api-payloads).

::: info Sources
- [Guidelines for the Encryption of e-Claim Attachments, p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1) (PDF created 2025-03-14, the newest file in the DevKit)
- [pnpki_philhealth_eclaims_auth_cert.pem](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem): the bundled certificate (expired, [KI-01](/known-issues#ki-01))
- [Implementation Guide (rev. 20250217): validateeSOA p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [validateCF5 p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16), [sample DOCUMENTS p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35), [Annex B p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77), [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)
- [eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd): `DOCUMENTS` / `DOCUMENT`
- [Software Solution Validation Test Form (SSVTF), p. 4, 10, 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)
- Demo kits in [ForEncryption.zip](/originals/encryption/ForEncryption.zip) ([Encryption demo kits](/reference/demo-kits))
:::

Terms used on this page (see the [Glossary](/getting-started/glossary)): [AES-256-CBC](/getting-started/glossary#aes) is the Advanced Encryption Standard with a 256-bit key in Cipher Block Chaining mode. The [initialization vector (IV)](/getting-started/glossary#iv) is 16 random bytes that start the encryption. [RSA](/getting-started/glossary#rsa) is public-key encryption; [PKCS#1 v1.5](/getting-started/glossary#pkcs1) and OAEP (Optimal Asymmetric Encryption Padding) are two ways to pad data for RSA. [PDF/A](/getting-started/glossary#pdf-a) is the archival PDF format. PhilHealth's public key comes in an [X.509 certificate](/getting-started/glossary#x509).

## TL;DR: what you need to do

- **Get the current certificate from PhilHealth.** The one in the DevKit expired in 2014 ([KI-01](/known-issues#ki-01)).
- **For each file:** hash it (SHA-256, lowercase hex), make a random 32-byte password (two 16-byte halves) and a random 16-byte IV, encrypt the file with AES-256-CBC, and RSA-encrypt each password half and the IV separately. Write the six-field JSON as `<file>.enc`.
- **RSA padding is not specified** ([KI-59](/known-issues#ki-59)). Use PKCS#1 v1.5, as both demo kits do, not OAEP, and confirm with PhilHealth.
- **AES padding is not specified** ([KI-13](/known-issues#ki-13)). Our examples default to Annex A's zero padding. Ask PhilHealth which padding its decryptor expects, and test that your files decrypt byte for byte.
- **`docMimeType`:** `application/pdf` for PDFs. XML attachments: not specified; our examples use `text/xml` ([KI-57](/known-issues#ki-57)).
- **Publish** each `.enc` file at an `https://` URL that PhilHealth can download, and list it in `DOCUMENT/@pDocumentURL`. **Keep your original files.**
- **Code:** [encrypt-attachment.mjs](/examples/encryption/encrypt-attachment.mjs) (`loadPhilHealthPublicKey`, `encryptAttachment`) or [encrypt_attachment.py](/examples/encryption/encrypt_attachment.py) (`load_philhealth_public_key`, `encrypt_attachment`).

## What gets encrypted this way

- **PDF files**, for example a scanned Claim Signature Form (CSF). "Scanned documents should comply with the PDF/A standard" (guideline §1). The certification form checks for **PDF/A-1b** ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)).
- **XML files**, for example Claim Form 4 (CF4) (guideline §1). Also the eSOA and CF5 XML: after `validateeSOA` / `validateCF5` succeeds, "the eSOA XML must be encrypted using the PhilHealth Public Key" and attached with document type `ESA`, and the CF5 with document type `CF5` (Guide p. 9, 16).

"Each file must be encrypted individually." "Encryption will be performed by the system of the Health Facility (HF). PECWS does not provide a service or method for encryption of the e-claim attachments." (guideline §2)

::: warning Annex B still lists an Excel document type
The guideline says supporting documents "must be in PDF … or XML format". [Annex B](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) still lists `ITX` "Itemized Billing (MS Excel Format)" ([KI-57](/known-issues#ki-57)). Follow the newer guideline (PDF or XML), and confirm with PhilHealth before you send any other format.
:::

## Before you start: get the current certificate

::: danger The certificate in the DevKit expired in 2014 (KI-01)
The only public key in the DevKit is a **test** certificate. It expired on 2014-12-29. Don't use it for real claims. **Ask PhilHealth for the current production certificate**, and check its fingerprint with PhilHealth through a second channel before you trust it (recommendation, not from PhilHealth).
:::

What `openssl x509 -in pnpki_philhealth_eclaims_auth_cert.pem -noout -text` shows about the [bundled file](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem):

| Field | Value |
|---|---|
| Subject | `CN=eclaims-test.philhealth.gov.ph, serialNumber=100000000A, OU=TMD, O=Philhealth, C=PH` |
| Issuer | `CN=Gov Authentication Test CA, O=DOST, C=PH` |
| Valid | 2014-09-30 08:25:06 GMT to **2014-12-29 08:25:06 GMT** |
| Public key | RSA 2048-bit, exponent 65537 |
| Key usage | Digital Signature, Key Encipherment, Data Encipherment |
| SHA-256 fingerprint | `B2:7A:95:47:8C:AA:6F:A8:68:C8:DF:72:F7:CA:48:FB:4A:05:CE:04:2D:11:A5:B6:AE:E2:58:5D:72:A2:5A:9F` |

The same file is inside both demo kits. It starts with some `Bag Attributes` text lines before `-----BEGIN CERTIFICATE-----`. Node.js, Python `cryptography`, PHP and OpenSSL all read it as-is.

The guideline says "PhilHealth will provide a public key (via a digital certificate or file)" (§4). Our example code accepts either a certificate (`BEGIN CERTIFICATE`) or a bare public key (`BEGIN PUBLIC KEY`). It also refuses an expired certificate unless you pass `--allow-expired-certificate` for experiments.

## Step by step

The numbers in brackets refer to the sections of the [guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1).

1. **Prepare the final file** [§1]. Produce the PDF/A (or XML) exactly as it will be archived. Any change after step 2 breaks the hash. Save XML files as UTF-8; the DevKit doesn't name a text encoding ([KI-60](/known-issues#ki-60)).
2. **Hash it** [§3]. Compute SHA-256 over the file's bytes, as 64 lowercase hex characters. The guideline doesn't name the format; lowercase hex is what both demo kits use ([KI-57](/known-issues#ki-57)). "On decryption, PhilHealth will recompute the hash to confirm the file's integrity."
3. **Make a 32-byte password** [§6]. "Create two random arrays of 16 bytes each. Concatenate these arrays to form the 32-byte password." Use a cryptographically secure random generator.
4. **Make an IV** [§7]. "Generate a random 16-byte array (128 bits)."
5. **Encrypt the file** [§4]. Use AES-256-CBC, with the 32-byte password as the key and the IV. The padding is not specified; see [Padding](#padding-not-specified-ki-13) below.
6. **Encrypt the secrets with PhilHealth's public key** [§6, §7]. Encrypt the first 16-byte half, the second 16-byte half, and the IV **separately**, each with RSA. The padding mode is not named; both demo kits use PKCS#1 v1.5 ([see below](#rsa-padding), [KI-59](/known-issues#ki-59)).
7. **Base64-encode** [§8] the four encrypted values: `key1`, `key2`, `iv` and `doc`.
8. **Write one JSON file** [§8] with the six fields. The guideline says it "may be renamed" to the original name plus `.enc`, for example `CSF.pdf.enc`.

The output format from the guideline (p. 2):

```json
{
  "docMimeType": "{MIME type of the attachment file, e.g., 'application/pdf'}",
  "hash": "{SHA-256 hash of the attachment file before encryption}",
  "key1": "{Base64 encoded, public key-encrypted first 16 bytes of the password}",
  "key2": "{Base64 encoded, public key-encrypted second 16 bytes of the password}",
  "iv": "{Base64 encoded, public key-encrypted initialization vector}",
  "doc": "{Base64 encoded, AES-256-CBC encrypted attachment file data}"
}
```

::: tip Why a random password plus RSA?
RSA can only encrypt a few hundred bytes, and it is slow. So the file is encrypted with fast AES under a one-time random key, and only that small key (and the IV) is encrypted with RSA. This is called *hybrid encryption*. Only the holder of PhilHealth's private key can recover the AES key, so not even your own system can decrypt the file afterwards.
:::

### Padding: not specified (KI-13)

<Badge type="warning" text="Conflicting sources" />

AES-CBC needs the data to be a multiple of 16 bytes, but the attachment guideline does not say how to pad. The demo kits disagree. For the same 4,496-byte sample PDF (already a multiple of 16), the kits' sample outputs have encrypted `doc` lengths of:

| Producer | Padding | `doc` length |
|---|---|---|
| C# kit ([sample](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc)) | `PaddingMode.Zeros`: `0x00` bytes only if needed | 4,496 bytes |
| PHP kit ([sample](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingPHP.pdf.enc)) | Custom: zeros up to a multiple of 32, then a pad-length byte | 4,512 bytes |
| Java ([sample](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE--UsingJava.pdf.enc); source not included, [KI-41](/known-issues#ki-41)) | Unknown. 4,512 bytes fits PKCS#7 padding or the PHP scheme, but without the private key we can't tell. | 4,512 bytes |

This matters because certification checks that "the raw and decrypted PDF and XML files [are] the same using byte-by-byte comparison" ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)). If PhilHealth's decryptor removes a different padding than the one you added, the files won't match.

::: warning Zero padding is ambiguous when a file ends in 0x00 bytes
A decryptor that removes zero padding by stripping every trailing `0x00` also strips any `0x00` bytes that belong to the file. Most PDF and XML files don't end in `0x00`, but some do: the DevKit's own sample PDF (`SAMPLE_BIRTH_CERTIFICATE.orig.pdf` in [ForEncryption.zip](/originals/encryption/ForEncryption.zip), 4,496 bytes) ends with 15 `0x00` bytes after `%%EOF`. Stripped that way, it comes back as 4,481 bytes, so the hash check and the byte-by-byte comparison fail. So "strip trailing zeros" is fine for API payloads (text) but never safe for attachments. Only hash-guided unpadding (try each pad length and keep the one whose hash matches) or PKCS#7 padding is unambiguous. The DevKit does not say how PhilHealth's decryptor removes padding ([KI-13](/known-issues#ki-13)).
:::

::: tip Recommendation (not from PhilHealth)
- Our examples default to **zero padding**, the only padding rule PhilHealth has written down (Annex A) and the one the C# kit uses. They print a warning when the input file ends in `0x00`.
- The examples also support `--padding=pkcs7`, which can always be undone exactly.
- **Ask PhilHealth which padding its decryptor expects** before you certify, and use the certification test cycle to confirm that your files decrypt byte for byte.
:::

### RSA padding

<Badge type="warning" text="Gap" />

The guideline says only that the password halves and the IV are encrypted "using the public key provided by PhilHealth". It never names the RSA padding mode ([KI-59](/known-issues#ki-59)). Both demo kits use **RSA with PKCS#1 v1.5 padding**:

- C#: `rsaObj.Encrypt(data, false)`. The `false` means "not OAEP", so PKCS#1 v1.5 ([PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs)).
- PHP: `openssl_public_encrypt($data, $encryptedData, $this->_publicKey)` with no padding argument, which defaults to PKCS#1 v1.5 ([PhilHealthEClaimsEncryptor.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php)).

Use PKCS#1 v1.5, as both kits do, and confirm with PhilHealth. Many modern libraries default to, or recommend, OAEP instead; if you use OAEP, PhilHealth may not be able to decrypt your files. With a 2048-bit key, each RSA output is 256 bytes (344 base64 characters). RSA PKCS#1 v1.5 output is randomized, so `key1`, `key2` and `iv` look different every time, even for the same input. That is normal.

## Publishing the file and referencing it

Put the encrypted file where PhilHealth can download it, then list it in the claim. For our example claim (hospital claim number `202609170001`; the host name is made up):

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="CSF" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CSF.enc"/>
  <DOCUMENT pDocumentType="CF4" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF4.enc"/>
  <DOCUMENT pDocumentType="ESA" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/ESA.enc"/>
</DOCUMENTS>
```

Our example names each file after its document type code. The guideline's naming (original name plus `.enc`, such as `CSF.pdf.enc`) is optional: the file "may be renamed" that way (§8).

What the DevKit requires:

| Rule | Source |
|---|---|
| `pDocumentType` and `pDocumentURL` are both required on every `DOCUMENT` | [eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd) |
| `pDocumentType` is a code from Annex B, for example `CSF`, `SOA`, `CF4`, `CF5`, `ESA` | [Annex B p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77), [Document type codes](/reference/document-types) |
| `pDocumentURL`: String(250), a "URL of the document accessible via https. The document must first be encrypted using philhealth public key before publishing online." | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| PhilHealth must be able to open the URL in a web browser and download the file | [SSVTF Stage 2 A.1–A.2, p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12) |
| The file must decrypt "using the pre-defined algorithm by PhilHealth" and match the raw file byte by byte | SSVTF Stage 2 B.1–B.6, p. 12–13 |

Stage 2 lists the raw PDF, eClaims, eSOA and CF5 files, but not CF4. The eClaims XML is sent as an API payload, not as an attachment ([KI-56](/known-issues#ki-56)). Test every attachment type anyway.

The DevKit does **not** specify authentication for these URLs, allowed hosts, the HTTP `Content-Type`, or how long the files must stay online ([KI-57](/known-issues#ki-57)). The certification form also has an "eClaims Cloud Storage API (eCCSA)" module that is not specified anywhere ([KI-40](/known-issues#ki-40)). Confirm these with PhilHealth.

::: tip Recommendation (not from PhilHealth)
- Make paths hard to guess, for example by adding a long random segment, and keep patient names and PINs out of URLs and file names. (Our example claim above uses only the hospital claim number, to keep the examples readable.)
- Serve the `.enc` file byte for byte (for example as `application/octet-stream`). Don't let a web server or CDN re-encode it.
- Keep the files online at least until the claim is paid or closed.
- Use `https://`. The `addRequiredDocument` sample uses `http://` URLs ([Guide p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)), but Annex C requires https ([KI-57](/known-issues#ki-57)).
:::

::: warning Keep the original files
Both demo kits **delete the source file** after encrypting it (on PHP 8 the PHP kit crashes just before that step, [KI-16](/known-issues#ki-16)). Don't copy that behavior. You can't decrypt your own `.enc` files: providers lack "access to PhilHealth's private key" ([migration dictionary p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)). You still need the originals to resend a document, to pass the byte-by-byte check, and to export the base64 file content if the hospital moves to another provider ([Migrating data](/guides/data-migration)).
:::

## Example code

These files are **unofficial examples**, not PhilHealth code. They generate the password and IV with a cryptographically secure random generator, never delete your input, and refuse expired certificates by default. Download them: [encrypt-attachment.mjs](/examples/encryption/encrypt-attachment.mjs), [encrypt_attachment.py](/examples/encryption/encrypt_attachment.py), [README.txt](/examples/encryption/README.txt).

::: code-group
<<< @/public/examples/encryption/encrypt-attachment.mjs{js} [Node.js]
<<< @/public/examples/encryption/encrypt_attachment.py [Python]
:::

From the command line:

```bash
# Node.js 18+ (no packages needed)
node encrypt-attachment.mjs encrypt philhealth-cert.pem CSF.pdf        # writes CSF.pdf.enc
node encrypt-attachment.mjs encrypt philhealth-cert.pem CF4.xml text/xml

# Python 3.9+ (pip install cryptography)
python encrypt_attachment.py encrypt philhealth-cert.pem CSF.pdf
python encrypt_attachment.py encrypt philhealth-cert.pem eSOA.xml --padding=pkcs7
```

As a library:

::: code-group
```js [Node.js]
import { readFileSync, writeFileSync } from 'node:fs';
import { loadPhilHealthPublicKey, encryptAttachment } from './encrypt-attachment.mjs';

const publicKey = loadPhilHealthPublicKey(readFileSync('philhealth-cert.pem', 'utf8'));
const envelope = encryptAttachment(readFileSync('CSF.pdf'), 'application/pdf', publicKey);
writeFileSync('CSF.pdf.enc', JSON.stringify(envelope));
// upload CSF.pdf.enc, then use its https URL in DOCUMENT/@pDocumentURL
```

```python [Python]
import json
from encrypt_attachment import load_philhealth_public_key, encrypt_attachment

with open("philhealth-cert.pem", "rb") as f:
    public_key = load_philhealth_public_key(f.read())
with open("CSF.pdf", "rb") as f:
    envelope = encrypt_attachment(f.read(), "application/pdf", public_key)
with open("CSF.pdf.enc", "w", encoding="ascii") as f:
    json.dump(envelope, f, separators=(",", ":"))
# upload CSF.pdf.enc, then use its https URL in DOCUMENT/@pDocumentURL
```
:::

::: info Which docMimeType for XML attachments?
The guideline's only example is `application/pdf`. The DevKit gives no MIME type for XML attachments ([KI-57](/known-issues#ki-57)). The PECWS payload envelopes use `text/xml`, and the data-migration dictionary uses `application/xml` for XML documents in `pMimeType` ([migration dictionary p. 11–12](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=11)). Our examples default to `text/xml` for `.xml` files. Pass the type explicitly if PhilHealth tells you otherwise.
:::

## Testing with your own key pair

You can't decrypt a real attachment, because only PhilHealth has the private key. To check your output byte by byte, as PhilHealth does at certification, create a **throwaway** key pair, encrypt with its certificate, and decrypt with its private key:

```bash
# 1. A throwaway RSA-2048 key pair and self-signed certificate (never commit these)
openssl req -x509 -newkey rsa:2048 -nodes -keyout test_private.pem \
    -out test_cert.pem -days 30 -subj "/CN=throwaway-test-only"

# 2. Encrypt with the test certificate
node encrypt-attachment.mjs encrypt test_cert.pem sample.pdf

# 3. Decrypt with the test private key, then compare
node encrypt-attachment.mjs decrypt-test test_private.pem sample.pdf.enc sample.decrypted.pdf
cmp sample.pdf sample.decrypted.pdf && echo "byte-for-byte identical"
```

`decrypt-test` checks the SHA-256 and tells you which padding it removed. For zero padding it tries every possible pad length (0–15 bytes) and keeps the one whose hash matches, so files that end in `0x00` also pass. In Node.js it needs a version whose OpenSSL still allows RSA PKCS#1 v1.5 decryption. Node.js 22.23 and 24.16 worked in our tests; 18.20 and 20.20 refused. The Python version (`python encrypt_attachment.py decrypt-test …`) works everywhere.

### How we tested the examples

| Test | Result |
|---|---|
| Node.js and Python encryption, zero and PKCS#7 padding, 4 inputs (the kits' 4,496-byte sample PDF, a 481,924-byte PDF, a 152-byte CF5 XML, a 4,511-byte binary). Each output decrypted three ways: Node.js, Python, and the OpenSSL command line only (`openssl pkeyutl` + `openssl enc -nopad`). | All 16 outputs: SHA-256 of the decrypted file equals the original, with all three decryptors |
| PHP demo kit on the same 4 inputs (`encryptImageFile` on PHP 7.4; the public `encrypt()` method on PHP 8.3, where `encryptImageFile` throws), decrypted the same three ways | All match, once the kit's own padding is removed |
| Encryption with the bundled certificate (`--allow-expired-certificate`) | Same shape as the C# sample output: `doc` 4,496 bytes, `key1`/`key2`/`iv` 256 bytes each, same hash `2a3e6601…3d20` |
| Encryption on Node.js 18.20, 20.20, 22.23 and 24.16; Python 3.9 and 3.12 | Works |
| Files that end in `0x00` (the DevKit sample PDF; the same PDF cut to 4,490 bytes; random data followed by 1 or 20 zero bytes), zero and PKCS#7 padding, including PHP-kit output | All decrypted to the original bytes by both `decrypt-test` tools |

## Common mistakes

- **Using the expired test certificate** from the DevKit ([KI-01](/known-issues#ki-01)).
- **Encrypting the whole 32-byte password in one RSA block.** The guideline requires two separate 16-byte halves: `key1` and `key2`.
- **Forgetting to RSA-encrypt the IV.** In this scheme the `iv` field holds the RSA-encrypted IV, not the raw IV.
- **Using RSA-OAEP** because a library suggests it. It is more modern, but a PKCS#1 v1.5 decryptor can't read it. Use PKCS#1 v1.5, as both kits do, and confirm with PhilHealth ([KI-59](/known-issues#ki-59)).
- **Changing the file after hashing,** for example converting to PDF/A or pretty-printing XML after step 2.
- **Publishing the original PDF** instead of the `.enc` file, or publishing on plain `http://`.
- **Reusing the password or IV across files.** The PHP demo kit does this when one encryptor object encrypts several files ([KI-16](/known-issues#ki-16)), and the C# kit always uses the same IV ([KI-15](/known-issues#ki-15)); see [Encryption demo kits](/reference/demo-kits#known-problems).
- **Deleting the originals,** as both demo kits do.
- **Encrypting attachments with the cipher key.** That is the other scheme, and PhilHealth expects filled `key1`/`key2` fields here.

## Related pages

- [Encryption overview](/guides/encryption/)
- [Encrypting API payloads (cipher key)](/guides/encryption/api-payloads)
- [Encryption demo kits](/reference/demo-kits)
- [Submitting a claim](/guides/submitting-a-claim)
- [Building the eSOA](/guides/esoa), [Building CF5](/guides/cf5), [Building CF4](/guides/cf4)
- [Document type codes](/reference/document-types)
- [Software certification (SSVTF)](/guides/certification)
- Known issues: [KI-01](/known-issues#ki-01), [KI-12](/known-issues#ki-12), [KI-13](/known-issues#ki-13), [KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16), [KI-40](/known-issues#ki-40), [KI-41](/known-issues#ki-41), [KI-56](/known-issues#ki-56), [KI-57](/known-issues#ki-57), [KI-59](/known-issues#ki-59), [KI-60](/known-issues#ki-60)
