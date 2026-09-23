---
title: Encrypting API payloads (cipher key)
description: Step-by-step AES-256-CBC encryption and decryption of PECWS 3.0 request bodies and responses with the health facility's cipher key, with tested Node.js, Python and PHP code.
---

# Encrypting API payloads (cipher key)

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

Many PECWS 3.0 request bodies and most response `result` values are encrypted with the **cipher key** that PhilHealth issues to the health facility. This page follows the official procedure (Annex A of the Implementation Guide) step by step. It explains how to decrypt responses safely and gives tested example code for Node.js, Python and PHP. Annex A and the demo kits pad the data differently, so read [Removing the padding](#removing-the-padding) before you decrypt ([KI-13](/known-issues#ki-13)). For attachments, which use PhilHealth's public key instead, see [Encrypting attachments](/guides/encryption/attachments).

::: info Sources
- [Implementation Guide (rev. 20250217), Annex A "Guidelines for the Data Encryption Using the Cipher Key of the Health Facility", p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- Envelope tables on the method pages, for example [validateeSOA p. 9–10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [uploadeClaims p. 19–20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19), [getDoctorPAN p. 49–50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49), [isClaimEligible p. 69–71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)
- Demo kits in [ForEncryption.zip](/originals/encryption/ForEncryption.zip): [PhilHealthEClaimsEncryptor.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php), [PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1): the migration file uses the same procedure
:::

Terms used on this page (see the [Glossary](/getting-started/glossary)): [AES-256-CBC](/getting-started/glossary#aes) is the Advanced Encryption Standard with a 256-bit key in Cipher Block Chaining (CBC) mode. The [initialization vector (IV)](/getting-started/glossary#iv) is 16 random bytes that start the encryption. [SHA-256](/getting-started/glossary#sha-256) is a hash function. [MIME type](/getting-started/glossary#mime-type) is a format label such as `text/xml`. PKCS#7 is the most common general-purpose padding scheme; it is explained in [Removing the padding](#removing-the-padding). "Annex A" is the Implementation Guide's encryption annex (p. 75–76; see [Placeholders and conventions](/getting-started/how-to-read#placeholders-and-conventions)).

## TL;DR: what you need to do

- **Key:** the AES-256 key is the **raw 32-byte SHA-256 digest** of your cipher key, not its hex text ([KI-14](/known-issues#ki-14)).
- **Encrypt:** a new random 16-byte IV for every message; pad the plaintext with `0x00` to a multiple of 16; AES-256-CBC with the library's own padding turned off; `hash` = SHA-256 hex of the plaintext; `key1` and `key2` = `""`.
- **Text encoding:** UTF-8 for the cipher key and for all XML and JSON text. The DevKit doesn't name an encoding ([KI-60](/known-issues#ki-60)).
- **`docMimeType`:** `text/xml` for XML. For JSON, this site uses `application/json` (Annex A). If the test server rejects `application/json`, switch to `text/xml` (what every Guide JSON sample and both demo kits use) and tell PhilHealth ([KI-25](/known-issues#ki-25)).
- **Decrypt:** turn off the library's padding removal, remove the padding, and check the SHA-256 against `hash`. Removing trailing `0x00` bytes is safe for these text payloads; our code also handles the demo kits' other paddings ([KI-13](/known-issues#ki-13)). Then parse the text as the method you called requires (XML, JSON or base64 PDF), not by `docMimeType`; see [step 8](#decrypting-a-response).
- **Code:** use our tested helpers, [payload-crypto.mjs](/examples/encryption/payload-crypto.mjs) (`encryptPayload`, `decryptPayload`) or [payload_crypto.py](/examples/encryption/payload_crypto.py) (`encrypt_payload`, `decrypt_payload`). The site's [shared API client](/api/#shared-client-setup) wraps them as `seal()` and `unseal()`. Don't copy the demo kits ([KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16)).

## Before you start

You need three things:

1. **The cipher key.** "PhilHealth issues a *cipher key* to the health facility for each certified software" (Annex A, p. 75). The DevKit does not describe the key's format or length, how it is delivered, or which text encoding to use ([KI-60](/known-issues#ki-60)). Treat the key as an opaque string, use UTF-8, and confirm the format with PhilHealth.
2. **A token** from [getToken](/api/get-token), sent in the `token` header of every other method.
3. **The PECWS host name.** It is not in the DevKit ([KI-30](/known-issues#ki-30)).

Recommendation (not from PhilHealth): treat the cipher key like a password. Keep it in a secret store or an environment variable. Never commit it to source control, and never write it to logs. Anyone with the key can read every request and response.

## Encrypting, step by step

Annex A has five steps. The table shows each step as written, then what it means in practice.

| Annex A step | What to do |
|---|---|
| **1.** "Get the hash total of the data … using SHA-256" | Compute SHA-256 over the **plaintext bytes** (UTF-8 for text, [KI-60](/known-issues#ki-60)). Write it as 64 lowercase hex characters ([KI-57](/known-issues#ki-57)). |
| **2a–c.** "Hash the given cipher key using SHA-256 algorithm." "Use the first 32 bytes of the resulting hash value as the passphrase for the AES encryption." "If the length of the resulting hash value is less than 32 bytes, pad the hash value with null character …" | AES key = SHA-256 of the cipher key's UTF-8 bytes, as the **raw 32-byte digest**. The padding clause never applies, because a SHA-256 digest is always 32 bytes ([KI-14](/known-issues#ki-14)). |
| **3a–b.** "Generate an array of random 16 bytes … Encode the array of bytes as base 64 string" | Generate a new 16-byte IV with a cryptographically secure random generator for **every** message. Base64-encode it. |
| **4a–c.** "Convert the data as array of bytes … Encrypt the data using AES encryption … Pad the data with null character (with hexadecimal value of '0x00') if it is not a multiple of 16 bytes." "Encode the resulting encrypted array of bytes as base-64 string." | Append `0x00` bytes until the length is a multiple of 16 (append nothing if it already is). Encrypt with AES-256-CBC and **no other padding**. Base64-encode the ciphertext. |
| **5a–f.** Build the JSON | `docMimeType`, `hash` (step 1), `key1: ""`, `key2: ""`, `iv` (step 3b), `doc` (step 4c). |

::: tip Why these rules
- **The hash** lets the receiver check that the decrypted data is exactly what was sent. If the hashes differ, "the data may have been tampered with or corrupted" (Annex A step 1).
- **The IV** makes two encryptions of the same XML look different. Reusing an IV with the same key leaks information, so every message needs a fresh one.
- **The zero padding** is needed because AES-CBC only works on whole 16-byte blocks.
:::

::: warning Wording slip in Annex A step 1
Step 1 says to hash "the data to be **decrypted**". The figure on the same page says "SHA-256 hash of the data **before encryption**", and both demo kits hash the plaintext. Hash the plaintext ([KI-14](/known-issues#ki-14)).
:::

::: danger Common key mistake (KI-14)
`sha256("123456")` as hex is the 64-character text `8d969eef…6c92`. The AES key is the **32 bytes** that this hex text represents. Some developers pass the first 32 characters of the hex text as the key. That produces a different key, and PhilHealth cannot decrypt the result.
:::

### Which docMimeType to send

| Body content | Annex A says | Method pages and demo kits show | What we recommend |
|---|---|---|---|
| XML (eSOA, CF5, eClaims, `DOCUMENTS`) | MIME type of the data | `"text/xml"`. The `addRequiredDocument` sample leaves it empty (`""`, [p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)). | `text/xml`. It is what the method pages show, and it is a MIME type for XML, as Annex A asks. |
| JSON (getDoctorPAN, getMemberPIN, isClaimEligible) | `"application/json"` (step 5a example) | `"text/xml"` in every sample ([p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50), [p. 52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=52), [p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)). Both demo kits also fix it to `"text/xml"`. | `application/json`, following Annex A, the only normative statement. Every Guide JSON sample and both demo kits use `text/xml`; if the test server rejects `application/json`, switch to `text/xml` and tell PhilHealth ([KI-25](/known-issues#ki-25)). |

### Worked example (test vector)

Use these values to check your implementation one step at a time. They are **unofficial**: we computed them and got identical results from Node.js `crypto`, Python `cryptography`, the OpenSSL command line, and the C# demo kit's own `EncryptUsingAES` method. The PHP demo kit's `decryptPayloadDataToXml` decrypts the result exactly. The cipher key `123456` is the default passphrase of the PHP kit's test page ([testEncryptAndDecryptXml.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/testEncryptAndDecryptXml.php)).

| Step | Value |
|---|---|
| Cipher key | `123456` |
| AES key (step 2), shown as hex | `8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92` |
| Plaintext (52 bytes; the `pUserName` value is the Guide's sample placeholder) | `<eCLAIMS pUserName=":SOFTWARE-CERTIFICATE-ID-HERE"/>` |
| `hash` (step 1) | `483392aa872c9bf0f936c81e68a4aaec676244513a19494a7b5208dce4e12b76` |
| IV (step 3). **Fixed for this test only; always use random bytes.** | hex `000102030405060708090a0b0c0d0e0f`, base64 `AAECAwQFBgcICQoLDA0ODw==` |
| Padded plaintext (step 4b) | 52 bytes + 12 × `0x00` = 64 bytes |
| `doc` (step 4c) | `W+nfy5GZmpdP41jitPW2EMKlFio6nNk9NHz7YbePJp9phdT0GULhRbM3sDYMa1cTzC/QvsvMQ+L+j1f+Ex58Zw==` |

The resulting envelope:

```json
{
  "docMimeType": "text/xml",
  "hash": "483392aa872c9bf0f936c81e68a4aaec676244513a19494a7b5208dce4e12b76",
  "key1": "",
  "key2": "",
  "iv": "AAECAwQFBgcICQoLDA0ODw==",
  "doc": "W+nfy5GZmpdP41jitPW2EMKlFio6nNk9NHz7YbePJp9phdT0GULhRbM3sDYMa1cTzC/QvsvMQ+L+j1f+Ex58Zw=="
}
```

You can reproduce the `doc` value with the OpenSSL command line:

```bash
printf '%s' '<eCLAIMS pUserName=":SOFTWARE-CERTIFICATE-ID-HERE"/>' > plain.txt
KEY=$(printf '%s' '123456' | openssl dgst -sha256 -binary | xxd -p -c 64)
# zero-pad to a multiple of 16 bytes (52 -> 64)
{ cat plain.txt; head -c 12 /dev/zero; } > padded.bin
openssl enc -aes-256-cbc -K "$KEY" -iv 000102030405060708090a0b0c0d0e0f -nopad -in padded.bin | base64 -w0
```

## Decrypting a response

A typical encrypted response looks like this (Guide p. 35; the Guide's hashes and ciphertexts are placeholders, [KI-27](/known-issues#ki-27), so they are shortened here to `…`):

```json
{
  "success": true,
  "message": "",
  "result": {
    "docMimeType": "text/xml",
    "hash": "…",
    "key1": "",
    "key2": "",
    "iv": "…",
    "doc": "…"
  }
}
```

To read it:

1. Check `success`. If it is not `true`, log the HTTP status and `message` (a plain string outside `result` in every Guide sample), and don't decrypt `result`. Failure responses are otherwise undocumented ([KI-42](/known-issues#ki-42)).
2. Take the `result` object. If `key1` or `key2` is not empty, this is not a cipher-key envelope. Stop.
3. Base64-decode `iv` (it must be 16 bytes) and `doc` (a multiple of 16 bytes).
4. Derive the AES key from your cipher key, exactly as in step 2 above.
5. Decrypt with AES-256-CBC and **turn off** automatic padding removal. Most libraries expect PKCS#7 padding and throw a "bad decrypt" error on zero-padded data.
6. Remove the padding (see below).
7. Compute SHA-256 of the result and compare it with `hash`. If it doesn't match, don't use the data.
8. Parse the plaintext according to the method you called:

   | Decrypted content | Methods |
   |---|---|
   | XML (the `eRECEIPT`) | `uploadeClaims` |
   | JSON | `searchCaseRates`, `getClaimStatus`, `getUploadedClaimsMap`, `getVoucherDetails`, `getDoctorPAN`, `getMemberPIN`, `isClaimEligible`, `searchEmployer`, `validateeSOA` |
   | A base64 PDF string | `generatePBEFPDF` |
   | Not documented ([KI-42](/known-issues#ki-42)) | `eClaimsFileCheck` (its decrypted content) and `validateCF5` (its whole response, including whether `result` is encrypted). Log what you receive, and handle both XML and JSON. |

   `isDoctorAccredited` has no output sample. Its listed keys look like JSON ([KI-24](/known-issues#ki-24)).

   Don't rely on `docMimeType`, which the Guide always shows as `text/xml` ([KI-25](/known-issues#ki-25)). Don't rely on the output tables' wording either: several call a JSON result "XML text", because the text was copied from other methods ([KI-47](/known-issues#ki-47)).

### Removing the padding

<Badge type="warning" text="Conflicting sources" />

Annex A says only "pad with 0x00". The official demo kits don't agree with it or with each other ([KI-13](/known-issues#ki-13)):

| Sender | What it appends | What a strict "strip trailing 0x00" decryptor gets |
|---|---|---|
| Annex A / C# demo kit | `0x00` bytes up to a multiple of 16, nothing if already aligned | The exact plaintext |
| PHP demo kit `pad()` | Zeros up to a multiple of **32**, then one byte holding the pad length (`0x01`–`0x20`). Always adds at least 1 byte. | Plaintext **plus** leftover bytes, for example `…/>` `00 00 … 00 0c`. The hash fails and XML parsers fail. |
| A library's default PKCS#7 padding | 1–16 bytes, each equal to the pad length | Plaintext plus `0x01`–`0x10` bytes |

The DevKit does not say which padding PhilHealth's server uses in its responses.

For these API payloads, removing trailing `0x00` bytes is safe when the sender followed Annex A: XML, JSON and base64 text never end in a real `0x00` byte ([KI-13](/known-issues#ki-13)). It is **not** safe for attachments, because a file can end in `0x00` bytes; see [Encrypting attachments](/guides/encryption/attachments#padding-not-specified-ki-13).

::: tip Recommendation (not from PhilHealth): let the hash decide
Decrypt without padding removal, then try each candidate in turn: strip trailing `0x00` (Annex A), no stripping, strip the PHP kit's padding, strip PKCS#7. Keep the first candidate whose SHA-256 equals `hash`. If none matches, reject the response: the key is wrong or the data is corrupt. Our example code below does exactly this, and reports which padding it removed. Once you have seen real PhilHealth responses in the test environment, you can simplify.
:::

## Example code

The files below are **unofficial examples**, not PhilHealth code. They use only a cryptographically secure random generator, keep the cipher key out of command-line arguments, and verify the hash on every decryption. Download them: [payload-crypto.mjs](/examples/encryption/payload-crypto.mjs), [payload_crypto.py](/examples/encryption/payload_crypto.py), [payload_crypto.php](/examples/encryption/payload_crypto.php), [README.txt](/examples/encryption/README.txt).

::: code-group
<<< @/public/examples/encryption/payload-crypto.mjs{js} [Node.js]
<<< @/public/examples/encryption/payload_crypto.py [Python]
<<< @/public/examples/encryption/payload_crypto.php [PHP]
:::

Try them from the command line:

```bash
node payload-crypto.mjs selftest
export PECWS_CIPHER_KEY='your-cipher-key'        # never pass it as an argument
node payload-crypto.mjs encrypt text/xml esoa.xml > body.json
node payload-crypto.mjs decrypt response.json > result.xml   # accepts the envelope or the whole response

python payload_crypto.py selftest                # needs: pip install cryptography
python payload_crypto.py decrypt response.json > result.xml
```

### Using the code in a request

The site's shared API client builds on these helpers. `seal(plaintext, docMimeType)` calls `encryptPayload(plaintext, PECWS_CIPHER_KEY, docMimeType)`. `unseal(envelope)` returns `decryptPayload(envelope, PECWS_CIPHER_KEY).text` and throws when the hash doesn't match. The client also gets a fresh token for every call ([KI-26](/known-issues#ki-26)) and reads the base URL from `PECWS_BASE_URL`, because the host name is not in the DevKit ([KI-30](/known-issues#ki-30)). It sends `Content-Type: application/json`, which is our assumption: the Guide lists only the `token` header ([KI-42](/known-issues#ki-42)).

This sketch of an `uploadeClaims` call uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup):

::: code-group
```js [Node.js]
import { readFile } from 'node:fs/promises';
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';

const xml = await readFile('eclaims.xml', 'utf8');
const env = assertSuccess(await pecwsPost('uploadeClaims', seal(xml, 'text/xml'))); // throws unless success is true
const receiptXml = unseal(env.result); // the eRECEIPT XML; throws on a hash mismatch
console.log(receiptXml);
```

```python [Python]
from pecws_client import pecws_post, seal, unseal, assert_success

with open("eclaims.xml", encoding="utf-8") as f:
    xml = f.read()
env = assert_success(pecws_post("uploadeClaims", seal(xml, "text/xml")))  # raises unless success is true
receipt_xml = unseal(env["result"])  # the eRECEIPT XML; raises on a hash mismatch
print(receipt_xml)
```
:::

Without the shared client, call the helpers directly with your cipher key. `decryptPayload` and `decrypt_payload` return an object, not a string: use `.text` for the XML or JSON text, and `.padding` to see which padding was removed.

::: code-group
```js [Node.js]
import { encryptPayload, decryptPayload } from './payload-crypto.mjs';

const cipherKey = process.env.PECWS_CIPHER_KEY;
const body = encryptPayload(xml, cipherKey, 'text/xml'); // send JSON.stringify(body) as the request body
// ... later, with the parsed response { success, message, result }:
const { text, padding } = decryptPayload(response.result, cipherKey); // throws on a hash mismatch
```

```python [Python]
import os
from payload_crypto import encrypt_payload, decrypt_payload

cipher_key = os.environ["PECWS_CIPHER_KEY"]
body = encrypt_payload(xml, cipher_key, "text/xml")  # send json.dumps(body) as the request body
# ... later, with the parsed response {"success", "message", "result"}:
result = decrypt_payload(response["result"], cipher_key)  # raises on a hash mismatch
print(result.padding, result.text)
```
:::

Other body shapes use the same helpers:

::: code-group
```js [Node.js]
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';

// validateCF5: two separate envelopes, each with its own random IV (Guide p. 16)
const cf5Body = { cf5: seal(cf5Xml, 'text/xml'), eclaims: seal(eclaimsXml, 'text/xml') };

// addRequiredDocument: a plain field plus an encrypted DOCUMENTS XML (Guide p. 42-43)
const docsBody = { pSeriesLhioNo: seriesLhioNo, pXML: seal(documentsXml, 'text/xml') };

// getMemberPIN: encrypt the JSON text once (getDoctorPAN and isClaimEligible are encrypted the same way).
// The values are our example member, not PhilHealth test data (the DevKit has none, KI-11).
const pinBody = seal(
  JSON.stringify({ lastname: 'DELA CRUZ', firstname: 'JUAN', middlename: 'OCAMPO', suffix: '', birthdate: '09-19-1973' }),
  'application/json', // Annex A; switch to 'text/xml' if the test server rejects it (KI-25)
);
const { pin } = JSON.parse(unseal(assertSuccess(await pecwsPost('getMemberPIN', pinBody)).result));

// generatePBEFPDF: a plain JSON body (KI-61); the decrypted text is a base64 PDF (Guide p. 74)
const pbef = assertSuccess(await pecwsPost('generatePBEFPDF', { accreno, referenceno }));
const pdfBytes = Buffer.from(unseal(pbef.result), 'base64');
```

```python [Python]
import base64
import json
from pecws_client import pecws_post, seal, unseal, assert_success

# validateCF5: two separate envelopes, each with its own random IV (Guide p. 16)
cf5_body = {"cf5": seal(cf5_xml, "text/xml"), "eclaims": seal(eclaims_xml, "text/xml")}

# addRequiredDocument: a plain field plus an encrypted DOCUMENTS XML (Guide p. 42-43)
docs_body = {"pSeriesLhioNo": series_lhio_no, "pXML": seal(documents_xml, "text/xml")}

# getMemberPIN: encrypt the JSON text once (getDoctorPAN and isClaimEligible are encrypted the same way).
# The values are our example member, not PhilHealth test data (the DevKit has none, KI-11).
pin_body = seal(
    json.dumps({"lastname": "DELA CRUZ", "firstname": "JUAN", "middlename": "OCAMPO",
                "suffix": "", "birthdate": "09-19-1973"}),
    "application/json",  # Annex A; switch to "text/xml" if the test server rejects it (KI-25)
)
pin = json.loads(unseal(assert_success(pecws_post("getMemberPIN", pin_body))["result"]))["pin"]

# generatePBEFPDF: a plain JSON body (KI-61); the decrypted text is a base64 PDF (Guide p. 74)
pbef = assert_success(pecws_post("generatePBEFPDF", {"accreno": accreno, "referenceno": referenceno}))
pdf_bytes = base64.b64decode(unseal(pbef["result"]))
```
:::

## How we tested the examples

| Test | Result |
|---|---|
| Round trip, Node.js ↔ Python, 71 inputs from 1 to 1,000,003 characters (ASCII and non-ASCII), both directions | All identical |
| Test vector above: Node.js, Python, OpenSSL CLI, C# kit's `EncryptUsingAES` (run on .NET 8) | Identical ciphertext |
| PHP example ↔ Node.js / Python, PHP 7.4 and 8.3 | All identical |
| PHP demo kit `encryptXmlPayloadData` → our decrypt (PHP 7.4 and 8.3, 18 lengths) | All identical; the hash check selected the "php-kit" padding every time |
| Our encrypt → PHP demo kit `decryptPayloadDataToXml` | Correct when the plaintext length is **not** a multiple of 16. When it **is** a multiple of 16, the kit usually returned an **empty string**, sometimes the plaintext plus a few garbage bytes, and was right only by chance ([KI-16](/known-issues#ki-16)). See [Encryption demo kits](/reference/demo-kits#known-problems). |
| Wrong cipher key | Rejected by the hash check in all three examples |

## Common mistakes

- **Leaving the library's default padding on.** Most libraries add PKCS#7 padding unless you turn it off. The table below describes general platform behavior; it is not from the DevKit.

  | Platform | Default AES-CBC padding | How to turn it off |
  |---|---|---|
  | Node.js `crypto` | PKCS#7 | `cipher.setAutoPadding(false)` |
  | Python `cryptography` | None (you pad yourself) | Nothing to do |
  | PHP `openssl_encrypt` | PKCS#7 | Add the `OPENSSL_ZERO_PADDING` flag. Despite its name, it means "no padding". |
  | Java `Cipher` | Set by the transformation string | Use `"AES/CBC/NoPadding"` |
  | .NET `Aes` | `PaddingMode.PKCS7` | `PaddingMode.None`. `PaddingMode.Zeros` also works for encryption, but it does **not** remove the zeros when you decrypt. |

- **Hashing something other than the plaintext.** Don't hash the padded data, the ciphertext, or the base64 text. Hash the exact bytes you encrypt. Changing the XML afterwards (pretty-printing, adding a byte order mark, converting line endings) breaks the hash.
- **Using a non-UTF-8 encoding.** The C# demo kit encodes text as UTF-8 (`Encoding.UTF8.GetBytes`); the PHP kit encrypts the string's bytes as they are. Annex A does not name an encoding ([KI-60](/known-issues#ki-60)). Names like "Niño" produce different bytes in Windows-1252, so the hash would not match. Use UTF-8 for the cipher key and for all XML and JSON text (recommendation, not from PhilHealth).
- **Reusing the IV,** or using a fixed IV like the C# demo kit's `"0123456789ABCDEF"` ([KI-15](/known-issues#ki-15)). The PHP demo kit also reuses the same IV for every message encrypted by one encryptor object ([KI-16](/known-issues#ki-16); see [Encryption demo kits](/reference/demo-kits#known-problems)).
- **Parsing the decrypted text before removing the padding.** Leftover `0x00` bytes cause errors like "Extra content at the end of the document" or "Unexpected token" in JSON parsers.
- **Skipping the hash check.** A wrong cipher key doesn't always cause an error. It can produce random-looking bytes, and only the hash check catches this.
- **Encrypting a JSON body twice.** Encrypt the JSON **text** once, then send the envelope as the request body. Don't put the envelope inside another JSON string.
- **Assuming `result` is always encrypted.** Some methods return plain values; see the [methods table](/guides/encryption/#methods-and-their-encryption).
- **Choosing the parser from `docMimeType`.** The Guide shows `text/xml` even for JSON and PDF results ([KI-25](/known-issues#ki-25)). Choose it from the method you called (see [step 8](#decrypting-a-response)).

## Related pages

- [Encryption overview](/guides/encryption/)
- [Encrypting attachments (public key)](/guides/encryption/attachments)
- [Encryption demo kits](/reference/demo-kits)
- [API overview & conventions](/api/), including the [shared client setup](/api/#shared-client-setup)
- [getToken](/api/get-token), [uploadeClaims](/api/upload-eclaims), [validateeSOA](/api/validate-esoa), [validateCF5](/api/validate-cf5)
- [Migrating data between providers](/guides/data-migration)
- Known issues: [KI-12](/known-issues#ki-12), [KI-13](/known-issues#ki-13), [KI-14](/known-issues#ki-14), [KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16), [KI-25](/known-issues#ki-25), [KI-27](/known-issues#ki-27), [KI-42](/known-issues#ki-42), [KI-47](/known-issues#ki-47), [KI-60](/known-issues#ki-60)
