---
title: Migrating data between providers
description: How a health facility's claims data and supporting documents move from one IT service provider's system to another using PhilHealth's encrypted e-Claims migration XML.
---

# Migrating data between providers

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

When a hospital or clinic switches to a different IT service provider, its claims history has to move from the old system to the new one. PhilHealth defines a special **e-Claims XML file for data migration** for this, and the certification test form requires every certified system to both **export** and **import** it. This page explains why the format exists, how it differs from the claim upload XML, and gives export and import checklists. Field details are on the [Data migration XML reference](/reference/migration-xml).

::: info Sources
- [Data Dictionary of the e-Claims XML for Data Migration (rev. 20241126), p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1) (purpose, key differences, encryption), p. 3–12 (elements and attributes)
- [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) (v1.0.0.1, 2024-12-10)
- [Software Solution Validation Test Form (SSVTF) for PECWS 3.0 (rev. 20250217), p. 9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) (Data Migration criteria) and [p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13) (module is required)
- [Implementation Guide (rev. 20250217), p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) (Annex A: encryption with the cipher key), [p. 53–54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53) (`getUploadedClaimsMap`), [p. 46–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46) (`getClaimStatus`), [p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42) (`addRequiredDocument`), [p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) (`pDocumentURL`)
:::

## TL;DR: what you need to do

- **Build both directions.** Certification tests export **and** import ([SSVTF p. 9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)).
- **Export:** reuse your upload XML writer, add each claim's `pClaimSeriesLhio`, embed the documents as base64 `OFFLINEDOCUMENT` elements, validate against the migration DTD (with [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2), [KI-43](/known-issues#ki-43)), then encrypt the whole file with the facility's cipher key.
- **Import:** decrypt, check the hash, validate, then store `pClaimNumber` and `pClaimSeriesLhio` together so you can keep working on returned claims.
- **Agree on the gaps first.** The DevKit leaves several points open: which cipher key, what `pEncryptionUsed` means, blank claim numbers, file size ([KI-54](/known-issues#ki-54)), the newborn-hearing attributes ([KI-10](/known-issues#ki-10)), and how the certification evaluator tests import ([KI-56](/known-issues#ki-56)).

## Why a migration format exists

The migration data dictionary opens with the problem: "When a health facility transitions from one IT service provider to another, one major challenge is the migration of data." The file "facilitate[s] the import/export of e-claims data from one service provider's system to another's" ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

A plain copy of the upload XML isn't enough, for two reasons:

1. **The new system must keep working on old claims.** PhilHealth identifies each claim by its own 15-digit claim series number, not by the hospital's claim number. The new system needs that number to follow up claims that PhilHealth returned to the hospital (return-to-hospital, RTH) after they were submitted through the old system. The migration file adds it as `CLAIM@pClaimSeriesLhio`.
2. **Uploaded documents are unreadable to everyone except PhilHealth.** In the upload XML, each supporting document is only a URL to a file encrypted with PhilHealth's **public key**. Providers "cannot decrypt [it] due to the lack of access to PhilHealth's private key." The migration file therefore carries the document content itself, base64-encoded, inside `OFFLINEDOCUMENT` elements.

Because the file then contains complete patient records and scanned documents, "the migration XML file must be encrypted using the cipher key of the health facility", following "the same procedure used for encrypting input or output XML payloads" of the web service ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

::: tip Every certified system needs both directions
The SSVTF (Part II, Stage 1, A. Data Completeness, V. Data Migration) asks two questions ([SSVTF p. 9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)):

1. "Does the system export all health data in compliance with the encrypted eClaims migration format?"
2. "Does the system import the eClaims migration file successfully?"

The notes on [p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13) say: "CF4 and eClaims Cloud Storage API, Data Migration modules are required to be tested/evaluated." So you build export **and** import, even if none of your clients plans to switch providers. The form doesn't say which file the evaluator gives you for the import test, or which cipher key protects it ([KI-56](/known-issues#ki-56)). See [Software certification](/guides/certification).
:::

## How the pieces fit

```text
OLD SYSTEM (exporting provider)
  claims DB + stored getUploadedClaimsMap results
     │
     ▼
  build the migration XML (plain)
     │
     ▼
  validate it against eClaimsXmlForDataMigration.dtd
     │
     ▼
  encrypt the WHOLE file with the facility's cipher key (Annex A)
  { "docMimeType", "hash", "key1": "", "key2": "", "iv", "doc" }
     │
     │  hand over the encrypted file
     ▼
NEW SYSTEM (importing provider)
  decrypt with the same cipher key and verify the SHA-256 hash
     │
     ▼
  validate it against the migration DTD
     │
     ▼
  import the claims, the claim-number map
  (pClaimNumber ↔ pClaimSeriesLhio) and the embedded documents
     │
     ▼
  continue work in PECWS: getClaimStatus, addRequiredDocument (RTH)
```

The DevKit describes the migration file only as a transfer between the two systems. No PECWS method accepts it, so you never upload it to PhilHealth. (For certification, the SSVTF evaluator checks that your system can export and import it.)

## What changes compared with the upload XML

The migration XML "closely resembles the e-claim XML structure used for submitting e-claims to PhilHealth" ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)). Diffing the two DTDs gives exactly these changes:

| | Upload XML (`eClaimsDef.dtd` v1.9) | Migration XML (`eClaimsXmlForDataMigration.dtd` v1.0.0.1) |
|---|---|---|
| PhilHealth claim number | Not in the DTD. Annex C lists `pClaimSeriesLhio`, but only as a number PhilHealth returns after upload ([details](/reference/migration-xml#claim-pclaimserieslhio-new), [KI-50](/known-issues#ki-50)). | `CLAIM@pClaimSeriesLhio`, required, 15 digits |
| Supporting documents | `DOCUMENTS/DOCUMENT` (required), each with `pDocumentType` and `pDocumentURL` (an HTTPS link to a file encrypted with PhilHealth's public key) | `OFFLINEDOCUMENTS/OFFLINEDOCUMENT` (optional); the element text is the base64 of the file, with `pDocumentType`, `pMimeType` and `pEncryptionUsed` |
| Newborn care (`NCP`) | 4 attributes | 2 more required attributes: `pNewbornHearingRegistryNo` and `pNewbornHearingScreeningTestResult` (`P`, `R` or `X`) ([KI-10](/known-issues#ki-10)) |
| Encryption | The XML is the encrypted **body** of `uploadeClaims` (cipher key) | The whole **file** is encrypted with the cipher key |
| Everything else | | Identical |

An XML that is valid for one DTD is invalid for the other. See [Differences from the upload XML](/reference/migration-xml#differences-from-the-upload-xml) for the full comparison.

## What the DevKit does not tell you

Read these before you design anything. Each one needs a decision, and ideally written confirmation from PhilHealth. Most of them are collected in [KI-54](/known-issues#ki-54).

### Which cipher key?

The dictionary says to use "the cipher key of the health facility". Annex A says "PhilHealth issues a cipher key to the health facility **for each certified software**" ([Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). The old and new systems are different certified software, so the facility may hold two cipher keys. The DevKit does not say which one encrypts the migration file. It also doesn't give the key's format, or the character encoding to use when you hash the key and the file ([KI-60](/known-issues#ki-60)). If the two systems hash the same key with different encodings, the file won't decrypt.

::: warning Gap: the cipher key for the migration file is ambiguous ([KI-54](/known-issues#ki-54))
**Recommendation (not from PhilHealth):** let the health facility decide which key to use (for example, the exporting system's key), and give that key to the importing provider through a channel separate from the file. Treat the key as an opaque string, and hash it as UTF-8 on both sides ([KI-60](/known-issues#ki-60)). Record which key was used next to the file's hash. Confirm the intended key with PhilHealth.
:::

### What `pEncryptionUsed` means

The DTD requires `pEncryptionUsed` on every `OFFLINEDOCUMENT`, with the values `N`, `C` or `P`. **The data dictionary does not define this attribute at all.** It has no row for it, and no other DevKit file mentions it ([KI-54](/known-issues#ki-54)).

Our interpretation (not from PhilHealth): `N` = the element holds the plain file, `C` = the file is encrypted with the facility's cipher key, `P` = the file is encrypted with PhilHealth's public key. These match the only two encryption schemes in the DevKit ([KI-12](/known-issues#ki-12)). The dictionary's own reason for embedding documents, "making it accessible for the new provider", suggests plain files (`N`) are the normal case. See [the reference page](/reference/migration-xml#offlinedocument-new) for details, and confirm with PhilHealth.

### The newborn-hearing attributes

`NCP@pNewbornHearingRegistryNo` and `NCP@pNewbornHearingScreeningTestResult` are required in the migration DTD but appear nowhere else: not in the upload DTD, not in the migration dictionary, and not in the DTD's version history. The meanings of `P`, `R` and `X` are not given. If your system has old newborn claims, you must put *some* valid value in every `NCP`. Ask PhilHealth what to use when the result was never recorded ([KI-10](/known-issues#ki-10)).

### The dictionary's `SESSION` element

The dictionary's element list shows `SESSIONS` → `SESSION` under each repetitive procedure. The DTD has no `SESSION` element: `SESSIONS` itself repeats, once per session date. Follow the DTD ([KI-37](/known-issues#ki-37)).

### Other open points

- **Claims that never reached PhilHealth** (drafts, offline-encoded claims) have no claim series number. The DTD accepts `pClaimSeriesLhio=""`, but the dictionary doesn't say whether that is intended ([KI-54](/known-issues#ki-54)).
- **File size and splitting.** Base64 makes every document about 33% larger, and the encrypted envelope base64-encodes the whole file again. `pTotalClaims` is String(3). If that length is enforced, a file holds at most 999 claims. The DevKit says nothing about maximum size, splitting, file naming, or how to deliver the file ([KI-54](/known-issues#ki-54)).
- **`docMimeType` of the encrypted file.** Annex A says it is "the MIME type of the target data". The Guide uses `"text/xml"` for XML payloads, and so do we. See [KI-25](/known-issues#ki-25).
- **Encoding and `DOCTYPE`.** Neither the migration dictionary nor the upload documentation states the XML character encoding, or whether the file should contain a `DOCTYPE` line ([KI-62](/known-issues#ki-62)). *Recommendation (not from PhilHealth):* write UTF-8 with an XML declaration, and make your importer accept files with or without a `DOCTYPE`. Validate against your own local copy of the DTD, and don't let the parser fetch files that a `DOCTYPE` names.
- **How the certification evaluator tests import** (which file they give you, encrypted with which key) is not described. Ask PhilHealth's certification team before your test cycle, as for the other certification items the DevKit doesn't explain ([KI-56](/known-issues#ki-56)).

## Before you start

- [ ] Written authorization from the health facility to export (or import) its data. *(Recommendation: this is patient data.)*
- [ ] The cipher key that will protect the file, and agreement on who holds it (see above).
- [ ] The exporting system's PECWS **software certification ID**. It goes into `pUserName`.
- [ ] For the exporter: the claim series numbers of all uploaded claims, or the receipt ticket numbers needed to fetch them again.
- [ ] The facility's PMCC number for `pHospitalCode` ("For now PMCC number should be used"; see [KI-48](/known-issues#ki-48) on facility identifiers).
- [ ] An agreed list of what "all health data" covers for this facility (the SSVTF wording). *(Recommendation: every claim record the old system holds, with all of its supporting documents, including CF4, CF5 and eSOA XML attachments.)*

## Export procedure (outgoing system)

### Step 1: Collect the PhilHealth claim series numbers {#step-1-collect-the-philhealth-claim-series-numbers}

For every claim that was uploaded, you need its `pClaimSeriesLhio`, "the 15-digit number returned by the GetUploadedClaimsMap API" ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

- If your system stored the [`getUploadedClaimsMap`](/api/get-uploaded-claims-map) result after each upload, read it from your database. Each `MAPPING` pairs your `pClaimNumber` with PhilHealth's `pClaimSeriesLhio` ([Guide p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)).
- If not, call `getUploadedClaimsMap` again with each transmission's `receiptTicketNumber` (the `pReceiptTicketNumber` from the upload's `eRECEIPT`).

The number has 13 digits of "PhilHealth Claim Series number" followed by a 2-digit PhilHealth Regional Office (PRO) code ([Dict. p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)). Keep it as text. It can start with `0`.

### Step 2: Build each claim as you would for upload

Generate `CF1`, `CF2`, `ALLCASERATE`/`ZBENEFIT`, `CF3`, `PARTICULARS` and `RECEIPTS` exactly as your upload code does. Export `CF3` whenever the uploaded claim had it: the DevKit doesn't say when `CF3` is required ([KI-62](/known-issues#ki-62)), so don't drop data the old system sent. Then:

1. Add `pClaimSeriesLhio` to `CLAIM`.
2. Keep `pClaimNumber` identical to the value you uploaded. It is the key PhilHealth maps to the series number.
3. On every `NCP`, add `pNewbornHearingRegistryNo` and `pNewbornHearingScreeningTestResult`.
4. Do **not** write `DOCUMENTS` or `DOCUMENT`.

### Step 3: Embed the supporting documents

For each supporting document of the claim, write one `OFFLINEDOCUMENT`:

```xml
<OFFLINEDOCUMENTS>
  <OFFLINEDOCUMENT pDocumentType="CSF" pMimeType="application/pdf" pEncryptionUsed="N">JVBERi0xLjQK...</OFFLINEDOCUMENT>
  <OFFLINEDOCUMENT pDocumentType="CF5" pMimeType="application/xml" pEncryptionUsed="N">PENGNSBwSG9zcGl0YWxDb2RlPSIxMjM0NTYi...</OFFLINEDOCUMENT>
</OFFLINEDOCUMENTS>
```

- **Text:** the base64 of the file's bytes. Use the original file, not the `.enc` JSON you published for PhilHealth, if you still have it.
- **`pDocumentType`:** a document type code. The migration dictionary lists no values; the upload dictionary points to the document library in Annex B (`CSF`, `SOA`, `OPR`, `CF4`, `CF5`, `ESA`, ...). See [Document type codes](/reference/document-types).
- **`pMimeType`:** `application/pdf` for PDF or `application/xml` for XML, as the dictionary lists. Write the full value, even though the dictionary says String(3) ([KI-37](/known-issues#ki-37)).
- **`pEncryptionUsed`:** see [What `pEncryptionUsed` means](#what-pencryptionused-means) ([KI-54](/known-issues#ki-54)).
- If a claim has no documents, omit `OFFLINEDOCUMENTS` completely. An empty `<OFFLINEDOCUMENTS/>` is invalid.

::: tip Recommendation (not from PhilHealth)
Write base64 on a single line, without line breaks. Strict decoders (Java's `Base64.getDecoder()`, Python's `b64decode(..., validate=True)`) reject embedded newlines. On import, strip whitespace before decoding anyway.
:::

### Step 4: Wrap the claims in eCLAIMS and eTRANSMITTAL

```xml
<eCLAIMS pUserName=":SAMPLE-CERT-ID" pUserPassword=""
         pHospitalCode="123456" pHospitalEmail="eclaims@samplehospital.example"
         pServiceProvider="SAMPLE HIS">
  <eTRANSMITTAL pHospitalTransmittalNo="TR20260917001" pTotalClaims="1">
    <CLAIM pClaimNumber="202609170001" ... pClaimSeriesLhio="260917990000101"> ... </CLAIM>
  </eTRANSMITTAL>
</eCLAIMS>
```

These are the placeholder values of our [example file](/examples/migration-sample.xml), not real identifiers.

- `pUserName`: `":"` followed by "the software certification ID issued by PhilHealth to the system used that will generate this XML file", which is the **exporting** system ([Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)). This is the same rule as for upload files ([KI-03](/known-issues#ki-03)).
- `pUserPassword`: empty string.
- One file has one `eTRANSMITTAL`. The DevKit does not say how to group claims. *Recommendation (not from PhilHealth): write one file per original transmittal and keep its `pHospitalTransmittalNo`. This keeps the history traceable and each file at or under 999 claims.*
- Make `pTotalClaims` equal to the number of `CLAIM` elements.

### Step 5: Validate the plain XML

Validate against [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) before encrypting. libxml2-based tools (lxml, xmllint, PHP) complain about three declarations in the DTD itself (`DISCHARGE`, `PROCEDURES` and `PARTICULARS`), so a plain lxml check reports every claim as invalid ([KI-43](/known-issues#ki-43)). Use the [Java validator](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml), or a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2) with your libxml2 tool. Our test results are on the [reference page](/reference/migration-xml#validating-a-migration-file). Also check what a DTD can't: `pClaimSeriesLhio` is not blank for uploaded claims, and every `OFFLINEDOCUMENT` decodes to a real file of the declared type.

### Step 6: Encrypt the whole file {#step-6-encrypt-the-whole-file}

Encrypt the complete XML file with the cipher key, using the Annex A procedure that PECWS uses for request and response payloads ([Guide p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)):

1. `hash` = SHA-256 of the plain file bytes, as a hex string (the Guide's samples show 64 hex characters).
2. AES key = SHA-256 of the cipher key, as **raw 32 bytes** ([KI-14](/known-issues#ki-14)). Hash the key's UTF-8 bytes; the DevKit doesn't name an encoding ([KI-60](/known-issues#ki-60)).
3. `iv` = 16 random bytes, base64.
4. AES-256-CBC. Pad the data with `0x00` bytes to a multiple of 16 (no PKCS#7). Base64 the result into `doc` ([KI-13](/known-issues#ki-13)).
5. `key1` and `key2` are empty strings. This is the cipher-key scheme, **not** the public-key scheme used for attachments.

The output is a single JSON object with the same six fields as an encrypted API body (`key1` and `key2` are empty). That JSON is the migration file you hand over. Its `doc` field holds the whole encrypted file, including every embedded document, so the JSON is about a third larger than the plain XML and can be very large.

Use the site's tested helper modules for API payloads, [`payload_crypto.py`](/examples/encryption/payload_crypto.py) and [`payload-crypto.mjs`](/examples/encryption/payload-crypto.mjs) (explained on [API payload encryption](/guides/encryption/api-payloads)). They implement exactly this procedure, and they accept file bytes as well as text:

::: code-group

```python [Python]
# pip install cryptography; payload_crypto.py is in /examples/encryption/
import json
import os
from pathlib import Path
from payload_crypto import encrypt_payload, decrypt_payload

cipher_key = os.environ["PECWS_CIPHER_KEY"]  # the key agreed for this file

# Exporter: encrypt the plain XML file
xml_bytes = Path("migration.xml").read_bytes()
envelope = encrypt_payload(xml_bytes, cipher_key, "text/xml")  # dict with the 6 fields
Path("migration.enc.json").write_text(json.dumps(envelope))

# Importer: decrypt and check the SHA-256 hash
result = decrypt_payload(Path("migration.enc.json").read_text(), cipher_key)
# decrypt_payload raises ValueError when the hash doesn't match (wrong key or damaged file)
Path("migration.xml").write_bytes(result.data)  # result.data = the exact original bytes
```

```js [Node.js]
// payload-crypto.mjs is in /examples/encryption/ (Node.js 18+, no dependencies)
import { readFileSync, writeFileSync } from 'node:fs'
import { encryptPayload, decryptPayload } from './payload-crypto.mjs'

const cipherKey = process.env.PECWS_CIPHER_KEY // the key agreed for this file

// Exporter: encrypt the plain XML file
const xmlBuffer = readFileSync('migration.xml')
const envelope = encryptPayload(xmlBuffer, cipherKey, 'text/xml') // object with the 6 fields
writeFileSync('migration.enc.json', JSON.stringify(envelope))

// Importer: decrypt and check the SHA-256 hash
const result = decryptPayload(readFileSync('migration.enc.json', 'utf8'), cipherKey)
// decryptPayload throws when the hash doesn't match (wrong key or damaged file)
writeFileSync('migration.xml', result.data) // result.data = the exact original bytes
```

:::

Both modules also work from the command line. They read the cipher key from the `PECWS_CIPHER_KEY` environment variable, so the key stays out of your shell history:

```bash
PECWS_CIPHER_KEY='...' python payload_crypto.py encrypt text/xml migration.xml > migration.enc.json
PECWS_CIPHER_KEY='...' node payload-crypto.mjs decrypt migration.enc.json > migration.xml
```

We tested this with our [example file](/examples/migration-sample.xml): a file encrypted in Python decrypts byte for byte in Node.js and the reverse, and a wrong key fails the hash check. The modules are unofficial examples, not PhilHealth code.

### Step 7: Hand over the file

*Recommendation (not from PhilHealth):* deliver the encrypted JSON file and its `hash` value through one channel, and the cipher key through another. Keep a log of what was exported (file names, hashes, claim counts, date), and delete any plain XML copies once the importer confirms receipt.

## Import procedure (incoming system)

1. **Get the cipher key** that protected the file from the health facility (see [Which cipher key?](#which-cipher-key)).
2. **Decrypt.** Parse the JSON, derive the key as SHA-256 of the cipher key (raw bytes), base64-decode `iv` and `doc`, decrypt with AES-256-CBC **without** PKCS#7 unpadding, and strip trailing `0x00` bytes. Stripping is safe here because an XML file never ends in a NUL byte. The [helper modules](#step-6-encrypt-the-whole-file) go further: they try each known padding and keep the one whose hash matches ([KI-13](/known-issues#ki-13)).
3. **Verify the hash.** Compute SHA-256 of the decrypted bytes and compare it with `hash`. A mismatch means a wrong key or a damaged file. Stop and ask the facility.
4. **Validate** the XML against the migration DTD, with [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2) ([KI-43](/known-issues#ki-43)). Reject the file on errors. Don't try to "fix" it silently.
5. **Import the claims.** Map `CF1`, `CF2`, `CF3` and the other elements into your data model, using the [eClaims XML reference](/reference/eclaims-xml). Store `pClaimNumber` and `pClaimSeriesLhio` together. This pair is the bridge between the hospital's records and PhilHealth's. Watch for duplicates if the facility gives you overlapping files. *Recommendation (not from PhilHealth):* never upload an imported claim that already has a `pClaimSeriesLhio` again, and make sure the claim and transmittal numbers your system generates from now on can't repeat the old system's numbers. Annex C only says both "should be unique per hospital"; the DevKit doesn't say how PECWS handles a duplicate ([KI-62](/known-issues#ki-62)).
6. **Import the documents.** For each `OFFLINEDOCUMENT`: strip whitespace, base64-decode, check that the bytes match `pMimeType` (a PDF starts with `%PDF-`), and store the file with its `pDocumentType`. Handle `pEncryptionUsed` according to what PhilHealth confirms. Anything other than plain content may be unreadable to you.
7. **Reconcile.** Check that the number of `CLAIM` elements equals `pTotalClaims`. *Recommendation:* call [`getClaimStatus`](/api/get-claim-status) with the imported series numbers (`serieslhionos`) to confirm they are valid and to find claims that are waiting for the hospital. Note that `getClaimStatus` is a GET request with a JSON body ([KI-17](/known-issues#ki-17)), and the Guide doesn't say whether it expects the 15-digit `pClaimSeriesLhio` or the 13-digit series without the regional office code ([KI-64](/known-issues#ki-64)).
8. **Continue RTH claims.** When the hospital responds to a returned claim, call [`addRequiredDocument`](/api/add-required-document) with `pSeriesLhioNo` set to the imported `pClaimSeriesLhio`. New documents follow the normal attachment rules: encrypt them with PhilHealth's public key and publish them at an HTTPS URL ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85); [attachment encryption](/guides/encryption/attachments)).
9. **Clean up.** *Recommendation:* delete the decrypted XML and any temporary files once the import is verified.

## Worked example

The site provides an unofficial example: [`/examples/migration-sample.xml`](/examples/migration-sample.xml). It is valid against the migration DTD when checked with [Java's validator](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or with a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2); a plain libxml2 check fails on the DTD itself ([KI-43](/known-issues#ki-43)). It holds the same claim as the site's [eClaims XML example](/examples/eclaims-minimal.xml), after upload: `pClaimNumber="202609170001"` paired with the illustrative PhilHealth number `pClaimSeriesLhio="260917990000101"`. It embeds two documents: a placeholder PDF and a small CF5 XML. The full file, and every field of the format, are on the [reference page](/reference/migration-xml#example).

After Step 6, the file you hand over looks like this (values shortened):

```json
{
  "docMimeType": "text/xml",
  "hash": "4162de39b5b08f08aacdaafc7e21b10e1258ef03ac784928bc55ca5936546512",
  "key1": "",
  "key2": "",
  "iv": "3LW0TYojNG4vJ21sPrDu1g==",
  "doc": "cNTsYtHr7SqxrZ8VCN7FWXHFz/MOiF..."
}
```

The `hash` above is the real SHA-256 of our example file. We encrypted it with a made-up test cipher key. Your `iv` and `doc` will differ on every run, because the IV is random.

## Common mistakes

- **Encrypting the migration file with PhilHealth's public key.** That is the attachment scheme ([KI-12](/known-issues#ki-12)). The migration file uses the facility's cipher key, with empty `key1` and `key2`. Nobody but PhilHealth could open a public-key-encrypted migration file.
- **Embedding the `.enc` attachment instead of the original file.** The new provider can't decrypt it, which defeats the purpose of `OFFLINEDOCUMENT` ([KI-54](/known-issues#ki-54)).
- **Using the hex string of SHA-256 as the AES key,** or letting your crypto library add PKCS#7 padding. See [KI-13](/known-issues#ki-13) and [KI-14](/known-issues#ki-14).
- **Reusing the upload XML unchanged.** `DOCUMENTS` is invalid in a migration file, and `pClaimSeriesLhio` is missing.
- **Putting migration-only attributes into an upload XML.** `eClaimsDef.dtd` v1.9 rejects them ([KI-10](/known-issues#ki-10), [KI-50](/known-issues#ki-50)).
- **Following the dictionary's `SESSION` element.** Use repeated `SESSIONS` ([KI-37](/known-issues#ki-37)).
- **Changing `pClaimNumber` during export,** for example by reformatting it. The mapping to PhilHealth's number is then lost.
- **Storing `pClaimSeriesLhio` as a number,** which drops leading zeros.
- **Writing an empty `<OFFLINEDOCUMENTS/>`,** or forgetting the required (possibly empty) `<SPECIAL/>`.

## Related pages

- [Data migration XML reference](/reference/migration-xml): every element, attribute and DTD difference
- [API payload encryption](/guides/encryption/api-payloads): the cipher-key scheme used to protect the file
- [Attachment encryption](/guides/encryption/attachments): the other scheme (PhilHealth public key)
- [getUploadedClaimsMap](/api/get-uploaded-claims-map), [getClaimStatus](/api/get-claim-status), [addRequiredDocument](/api/add-required-document)
- [Software certification (SSVTF)](/guides/certification)
- [Validating XML locally](/guides/validating-xml)
- [Known issues](/known-issues): [KI-10](/known-issues#ki-10), [KI-37](/known-issues#ki-37), [KI-43](/known-issues#ki-43), [KI-54](/known-issues#ki-54), [KI-56](/known-issues#ki-56), [KI-60](/known-issues#ki-60), [KI-62](/known-issues#ki-62), [KI-64](/known-issues#ki-64)
