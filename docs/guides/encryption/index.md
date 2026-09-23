---
title: Encryption overview
description: PECWS 3.0 uses two different encryption schemes that produce the same six-field JSON envelope. Learn which one to use for API payloads, attachments, and data-migration files.
---

# Encryption overview

<Badge type="tip" text="Current" /> <Badge type="warning" text="Easy to confuse" />

PhilHealth's eClaims Web Service (PECWS) 3.0 uses **two different encryption schemes**, and both produce the **same six-field JSON envelope**. This page explains which scheme applies to which request, response, and file, before you write any code. Mixing up the two schemes is an easy mistake to make ([KI-12](/known-issues#ki-12)).

::: info Sources
- [Implementation Guide (rev. 20250217), Annex A, p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75): encryption with the facility's cipher key
- [Implementation Guide, method pages p. 8–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8): which bodies and results are encrypted
- [Implementation Guide, Annex C, p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85): `pDocumentURL`
- [Guidelines for the Encryption of e-Claim Attachments, p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1) (created 2025-03-14)
- [pnpki_philhealth_eclaims_auth_cert.pem](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem) (expired test certificate, [KI-01](/known-issues#ki-01))
- [ForEncryption.zip](/originals/encryption/ForEncryption.zip): C# and PHP demo kits ([Encryption demo kits](/reference/demo-kits))
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)
- [Software Solution Validation Test Form (SSVTF), p. 4, 10, 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)
:::

Terms used on this page (see the [Glossary](/getting-started/glossary)): [AES-256-CBC](/getting-started/glossary#aes) is the Advanced Encryption Standard with a 256-bit key in Cipher Block Chaining mode. An [initialization vector (IV)](/getting-started/glossary#iv) is 16 random bytes that start the encryption. [RSA](/getting-started/glossary#rsa) is public-key encryption, used here only to protect small secrets. A [MIME type](/getting-started/glossary#mime-type) is a file-format label such as `application/pdf`. [SHA-256](/getting-started/glossary#sha-256) is a hash function. "Annex A", "Annex B" and "Annex C" are annexes of the Implementation Guide ([Placeholders and conventions](/getting-started/how-to-read#placeholders-and-conventions)).

## The short version

- **Talking to the API?** Use the **cipher key** that PhilHealth issued to the health facility (HF). This covers request bodies, response `result` values, and the data-migration file. You can decrypt these yourself. See [Encrypting API payloads](/guides/encryption/api-payloads).
- **Attaching a document to a claim?** Use **PhilHealth's public key** (from its certificate). This covers scanned PDFs and the CF4, CF5 and eSOA XML files that you publish at a URL. Only PhilHealth can decrypt these. See [Encrypting attachments](/guides/encryption/attachments).
- **eSOA and CF5 XML need both schemes.** You first send the XML to a validator method, encrypted with the cipher key. After it passes, you encrypt the same XML again with the public key and attach it to the claim ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)).

## The two schemes side by side

| | API payload encryption | Attachment (document) encryption |
|---|---|---|
| **Used for** | Request bodies and response `result` values of PECWS methods; the data-migration XML file | Supporting documents that `DOCUMENT/@pDocumentURL` points to: PDFs (for example a scanned Claim Signature Form (CSF)) and XML files (Claim Form 4 (CF4); Claim Form 5 (CF5) and the electronic Statement of Account (eSOA) after validation) |
| **Secret** | The **cipher key**, which "PhilHealth issues … to the health facility for each certified software" (Annex A) | A **random 32-byte password** made of two random 16-byte arrays, plus a random IV. Each of the three is encrypted with **PhilHealth's public key**. |
| **AES** | AES-256-CBC | AES-256-CBC |
| **AES key** | SHA-256 digest of the cipher key: the raw 32 bytes, not the hex text ([KI-14](/known-issues#ki-14)). The key's format and text encoding are not specified; use UTF-8 ([KI-60](/known-issues#ki-60)). | The 32-byte random password |
| **IV** | 16 random bytes | 16 random bytes |
| **`key1`, `key2`** | Empty strings `""` | Base64 of the RSA-encrypted first and second 16 bytes of the password |
| **`iv`** | Base64 of the raw 16-byte IV (24 characters) | Base64 of the RSA-encrypted IV (344 characters with a 2048-bit key) |
| **`hash`** | SHA-256 of the data **before** encryption | SHA-256 of the file **before** encryption |
| **`docMimeType`** | "MIME type of the data", for example `application/json` (Annex A). The method pages always show `text/xml`. This site uses `text/xml` for XML and `application/json` for JSON. If the test server rejects `application/json`, switch to `text/xml` (what every Guide JSON sample and both demo kits use) and tell PhilHealth ([KI-25](/known-issues#ki-25)). | "MIME type of the attachment file, e.g., 'application/pdf'". XML attachments: not specified; our examples use `text/xml` ([KI-57](/known-issues#ki-57)). |
| **AES padding** | `0x00` bytes up to a multiple of 16 (Annex A). The demo kits pad differently ([KI-13](/known-issues#ki-13)). | Not specified ([KI-13](/known-issues#ki-13)) |
| **RSA** | Not used | The guideline says only "public key encryption" and names no padding mode ([KI-59](/known-issues#ki-59)). Both demo kits use RSA with [PKCS#1 v1.5](/getting-started/glossary#pkcs1) padding. Use the same, and confirm with PhilHealth. |
| **Who can decrypt** | The health facility (it has the cipher key) and PhilHealth | Only PhilHealth (it has the private key) |
| **Official source** | [Guide Annex A, p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) | [Attachment guideline, p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1) |
| **Demo kit functions** | PHP `encryptXmlPayloadData` / `decryptPayloadDataToXml`; C# `EncryptXmlPayload` / `DecryptPayloadDataToXml` | PHP `encryptImageFile`; C# `EncryptImageFile` |
| **Our example code** | [payload-crypto.mjs](/examples/encryption/payload-crypto.mjs), [payload_crypto.py](/examples/encryption/payload_crypto.py), [payload_crypto.php](/examples/encryption/payload_crypto.php) | [encrypt-attachment.mjs](/examples/encryption/encrypt-attachment.mjs), [encrypt_attachment.py](/examples/encryption/encrypt_attachment.py) |

::: warning The "hash" format is inferred, not stated
Neither Annex A nor the attachment guideline says how to write the SHA-256 value. Both demo kits write it as **64 lowercase hexadecimal characters** (PHP `hash("sha256", $data)`; C# `ToString("x2")`), and the Guide's samples look the same. Our examples do the same ([KI-57](/known-issues#ki-57)).
:::

## Which scheme do I use?

Answer the first question that matches what you are encrypting:

```text
What are you encrypting (or decrypting)?
│
├── A request body for a PECWS method, or the "result" of a PECWS response?
│       └──► Cipher-key scheme  →  /guides/encryption/api-payloads
│
├── A file that you will publish at an HTTPS URL and list in DOCUMENT/@pDocumentURL
│   (a scanned PDF, or a CF4 / CF5 / eSOA XML file attached to a claim)?
│       └──► Public-key scheme  →  /guides/encryption/attachments
│
└── The data-migration XML file you hand to a new IT service provider?
        └──► Cipher-key scheme  →  /guides/data-migration
```

### Methods and their encryption

The table below lists what each method sends and receives, and what an encrypted `result` contains once you decrypt it. "Envelope" means the six-field JSON object encrypted with the cipher key. Page numbers are PDF pages of the [Implementation Guide](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8). The [API overview](/api/#all-19-methods-at-a-glance) lists the same methods with their HTTP verbs and purposes.

| Method | Request body | Response `result` (decrypted content) | Guide p. |
|---|---|---|---|
| [getToken](/api/get-token) | None (headers only; the Guide calls the header values "encrypted", but the header table describes plain values, [KI-44](/known-issues#ki-44)) | Plain token string | 8 |
| [validateeSOA](/api/validate-esoa) | Envelope of the eSOA XML | Envelope. The Guide says that, when decrypted, it may contain a JSON object with an `errors` array. | 9–10 |
| [validateCF5](/api/validate-cf5) | JSON object with **two** envelopes: `cf5` (CF5 XML) and `eclaims` (eClaims XML) | Not documented (see below, [KI-42](/known-issues#ki-42)) | 16–18 |
| [uploadeClaims](/api/upload-eclaims) | Envelope of the eClaims XML | Envelope (XML: the `eRECEIPT`) | 19–20, 35 |
| [searchCaseRates](/api/search-case-rates) | Plain JSON ([KI-46](/known-issues#ki-46)) | Envelope (JSON `eCASERATES`, although the Guide calls it "XML text", [KI-47](/known-issues#ki-47)) | 37–41 |
| [addRequiredDocument](/api/add-required-document) | JSON with `pSeriesLhioNo` (plain) and `pXML` (envelope of a `DOCUMENTS` XML) | Not described as encrypted. Only two failure messages are listed, as plain strings ([KI-29](/known-issues#ki-29)). | 42–43 |
| [eClaimsFileCheck](/api/eclaims-file-check) | Envelope of the eClaims XML | Envelope (decrypted content not documented, [KI-42](/known-issues#ki-42)) | 44–45 |
| [getClaimStatus](/api/get-claim-status) | Plain JSON, sent with a GET ([KI-17](/known-issues#ki-17)) | Envelope (JSON `CLAIMS`) | 46–48 |
| [getDoctorPAN](/api/get-doctor-pan) | Envelope of a JSON object | Envelope (JSON `{"pan": …}`) | 49–50 |
| [getMemberPIN](/api/get-member-pin) | Envelope of a JSON object | Envelope (JSON `{"pin": …}`) | 51–52 |
| [getUploadedClaimsMap](/api/get-uploaded-claims-map) | None (query parameter) | Envelope (JSON `eCONFIRMATION`) | 53–54 |
| [getVoucherDetails](/api/get-voucher-details) | None. The Guide doesn't say whether `voucherNo` goes in the query string or a body ([KI-61](/known-issues#ki-61)). | Envelope (JSON `VOUCHER`) | 55–60 |
| [isDoctorAccredited](/api/is-doctor-accredited) | Plain JSON (not described as encrypted, [KI-61](/known-issues#ki-61)) | Described as encrypted with the cipher key, but no envelope fields or sample are shown. The listed keys look like JSON ([KI-24](/known-issues#ki-24)). | 60–61 |
| [searchEmployer](/api/search-employer) | Plain JSON (not described as encrypted, [KI-61](/known-issues#ki-61); key names conflict, [KI-18](/known-issues#ki-18)) | Envelope (JSON `eEMPLOYERS`) | 62–63 |
| [getDBServerDateTime](/api/get-db-server-date-time) | None | Plain JSON array | 64–65 |
| [getServerDateTime](/api/get-server-date-time) | None | Plain JSON object | 66–67 |
| [getServerVersion](/api/get-server-version) | None | Plain string | 68 |
| [isClaimEligible](/api/is-claim-eligible) | Envelope of a JSON object (the Guide's sample wraps it in `"result"`, [KI-20](/known-issues#ki-20)) | Envelope (JSON `{isok, referenceno, trackingno, asof}`) | 69–72 |
| [generatePBEFPDF](/api/generate-pbef-pdf) | Plain JSON (not described as encrypted, [KI-61](/known-issues#ki-61); the Guide labels the inputs "Parameter", [KI-21](/known-issues#ki-21)) | Envelope (a base64 PDF string) | 73–74 |

No method uses the public-key scheme. That scheme is only for the files you publish yourself.

Decide how to parse a decrypted `result` from the method you called, not from its `docMimeType`: the Guide shows `text/xml` even for JSON and PDF results ([KI-25](/known-issues#ki-25)). Several output tables also describe their results with text copied from other methods ([KI-47](/known-issues#ki-47)).

::: warning Not documented: the validateCF5 response
The `validateCF5` section (Guide p. 16–18) describes the headers, the body and a sample input, but it has **no Output section**. The DevKit does not say what the response contains or whether its `result` is encrypted ([KI-42](/known-issues#ki-42)). Confirm with PhilHealth, and handle both an envelope and a plain value.
:::

### Files and their encryption

| File | How it is encrypted | Source |
|---|---|---|
| eClaims XML (upload) | Cipher key, as the body of `uploadeClaims` / `eClaimsFileCheck` and as `eclaims` in `validateCF5` | Guide p. 16, 19, 44 |
| eSOA XML | Cipher key for `validateeSOA`; then the **public key** when you attach it with document type `ESA` | Guide p. 9; [SSVTF p. 10](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10) |
| CF5 XML | Cipher key for `validateCF5`; then the **public key** when you attach it with document type `CF5` | Guide p. 16; SSVTF p. 10 |
| CF4 XML | **Public key**, attached with document type `CF4` | Attachment guideline §1; SSVTF p. 10 |
| Scanned PDFs (CSF, SOA, OPR, …) | **Public key** | Attachment guideline §1; [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `DOCUMENTS` XML sent as `pXML` to `addRequiredDocument` | Cipher key. This is our reading: the Guide doesn't name the key, but `key1` and `key2` are empty, which is the mark of the cipher-key scheme. The documents it points to use the public key. | Guide p. 42–43 |
| Data-migration XML | Cipher key, "the same procedure used for encrypting input or output XML payloads". The old and new providers' systems may hold different cipher keys, and nothing says which one to use ([KI-54](/known-issues#ki-54)). | [Migration dictionary p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1) |

For document type codes, see [Document type codes](/reference/document-types).

::: warning "Please see the Annex" points to the wrong scheme
Annex C describes `pDocumentURL` as a "URL of the document accessible via https. The document must first be encrypted using philhealth public key before publishing online. Please see the Annex for the guidelines for encryption." ([p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). The Guide's only encryption annex, Annex A, describes the **cipher-key** scheme. The public-key procedure is in the separate [attachment guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) ([KI-57](/known-issues#ki-57)).
:::

## The envelope

Both schemes produce this JSON object. The field names are case-sensitive.

```json
{
  "docMimeType": "text/xml",
  "hash": "<SHA-256 of the plaintext, 64 hex characters>",
  "key1": "<empty, or base64 of RSA-encrypted password part 1>",
  "key2": "<empty, or base64 of RSA-encrypted password part 2>",
  "iv": "<base64 of the IV, or of the RSA-encrypted IV>",
  "doc": "<base64 of the AES-256-CBC ciphertext>"
}
```

| Field | Cipher-key scheme (API payloads) | Public-key scheme (attachments) |
|---|---|---|
| `docMimeType` | MIME type of the plaintext | MIME type of the file, for example `application/pdf` |
| `hash` | SHA-256 of the plaintext bytes, hex | SHA-256 of the file bytes, hex |
| `key1` | `""` | Base64 of RSA(first 16 bytes of the password) |
| `key2` | `""` | Base64 of RSA(second 16 bytes of the password) |
| `iv` | Base64 of the 16-byte IV | Base64 of RSA(16-byte IV) |
| `doc` | Base64 of the ciphertext | Base64 of the ciphertext |

**Tip:** the envelope tells you which scheme was used. If `key1` and `key2` are empty, it is a cipher-key envelope. If they are long base64 strings, it is an attachment envelope.

### What real values look like

A cipher-key envelope. This is our unofficial test vector from [Encrypting API payloads](/guides/encryption/api-payloads#worked-example-test-vector); the cipher key is `123456`:

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

An attachment envelope, from the C# demo kit's sample output [`SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc`](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/%40Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc). Long values are shortened with `…`:

```json
{
  "docMimeType": "application/pdf",
  "hash": "2a3e6601ca70f8d2036c81e5a4d6549888984d686b87581db99c449744463d20",
  "key1": "ViZkcN0QFzrwfqbZFjNOcPq5hacnxC08+3ujS3kI…3J1+mw==",
  "key2": "OTU+qQdJ3Fhdd+Z2fM1yzhbrjV+Tww2AYVYStayH…yCFO9A==",
  "iv": "LY+J3aWdQ8pF2hh+QJ0FTQs57Sxgl0OpkE3FWpa1…xCifwA==",
  "doc": "qayGoDXuHw9pupFQA++1eyZkdiddHpG5CoSJEJrc…fopBQjU="
}
```

The hashes and base64 values in the Implementation Guide itself are placeholders. Don't use them as test data ([KI-27](/known-issues#ki-27)).

## Hash, hex and base64 in one minute

These three terms appear in every envelope:

- **SHA-256** turns any number of bytes into a 32-byte digest. If one byte of the input changes, the digest changes completely. The receiver recomputes it after decryption and compares it with `hash` to confirm that the data arrived intact (Annex A step 1). For attachments, the guideline says "PhilHealth will recompute the hash" (§3).
- **Hex** writes each byte as two characters `0–9a–f`, so 32 bytes become 64 characters. The `hash` field uses hex.
- **Base64** writes binary data as text using `A–Z a–z 0–9 + /`, with `=` padding at the end. Every 3 bytes become 4 characters. The `iv`, `doc`, `key1` and `key2` fields use base64.

Quick size check (useful when debugging):

| Field | Raw bytes | Base64 characters |
|---|---|---|
| Payload `iv` | 16 | 24 (ends in `==`) |
| Attachment `key1` / `key2` / `iv` with a 2048-bit RSA key | 256 | 344 |
| `doc` | With zero padding: the plaintext length rounded up to a multiple of 16. Other paddings add more ([KI-13](/known-issues#ki-13)). | About 4/3 of that |

Recommendation (not from PhilHealth): use standard base64 with `=` padding and no line breaks, as both demo kits do. Don't use the URL-safe variant (`-` and `_`).

## Common mistakes

- **Using the wrong scheme.** For example, encrypting an attachment with the cipher key, or putting RSA-encrypted keys into an API request. Check `key1`/`key2`: they must be empty for API payloads and filled for attachments.
- **Using the hex text of the SHA-256 digest as the AES key.** The key is the raw 32-byte digest ([KI-14](/known-issues#ki-14)).
- **Hashing the wrong bytes.** Hash the plaintext before padding and encryption, not the ciphertext, the base64 text, or a re-formatted copy of the XML. Certification checks that decrypted files match the originals byte for byte ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)).
- **Reusing or hard-coding the IV.** Generate a new random IV for every message and every file. The C# demo kit hard-codes its IV ([KI-15](/known-issues#ki-15)), and the PHP kit reuses one IV per encryptor object ([KI-16](/known-issues#ki-16)).
- **Using the bundled certificate in production.** It is a test certificate that expired on 2014-12-29 ([KI-01](/known-issues#ki-01)).
- **Relying on `docMimeType` to decide how to parse a response.** The Guide shows `text/xml` even for JSON and PDF results ([KI-25](/known-issues#ki-25)). Parse according to the method you called; see the [methods table](#methods-and-their-encryption).
- **Using RSA-OAEP for attachments** because a library recommends it. Both demo kits use PKCS#1 v1.5, and the guideline doesn't name a padding mode ([KI-59](/known-issues#ki-59)).
- **Copying the demo kits as-is.** They have known defects ([KI-13](/known-issues#ki-13), [KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16)). See [Encryption demo kits](/reference/demo-kits).

## Related pages

- [Encrypting API payloads (cipher key)](/guides/encryption/api-payloads)
- [Encrypting attachments (public key)](/guides/encryption/attachments)
- [Encryption demo kits](/reference/demo-kits)
- [API overview & conventions](/api/)
- [Submitting a claim](/guides/submitting-a-claim)
- [Software certification (SSVTF)](/guides/certification)
- [Known issues: encryption](/known-issues#ki-12): [KI-12](/known-issues#ki-12) to [KI-16](/known-issues#ki-16), [KI-59](/known-issues#ki-59) and [KI-60](/known-issues#ki-60), plus [KI-01](/known-issues#ki-01), [KI-25](/known-issues#ki-25), [KI-42](/known-issues#ki-42), [KI-57](/known-issues#ki-57) and [KI-61](/known-issues#ki-61)
