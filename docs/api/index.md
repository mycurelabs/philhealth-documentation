---
title: API overview and conventions
description: How the PhilHealth eClaims Web Service (PECWS 3.0) API works, including the base URL, token authentication, response and encrypted envelopes, all 19 methods, date formats, and the shared client that every code example uses.
---

# API overview and conventions

<Badge type="tip" text="Current: Guide rev. 20250217" />

This page explains the rules that apply to every call you make to PhilHealth's eClaims Web Service (PECWS) version 3.0. It covers where requests go, how you authenticate, how responses and encrypted payloads are shaped, which of the 19 methods encrypt what, and the small shared client that every code example on this site uses. Read it before you open any single method page.

New to PECWS? Read the [Overview](/getting-started/) first: it explains what eClaims and PECWS are and where your Hospital Information System (HIS) fits in.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 3–4: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 5: Table of contents (list of the 19 methods)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)
- [Implementation Guide, p. 8–74: Web service methods](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)
- [Implementation Guide, p. 75–76: Annex A, data encryption using the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, p. 80: Annex C date and time formats](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)
- [DevKit Revision History (rev. 20250217)](/originals/implementation-guide/DevKit%20Revision%20History.pdf#page=1)
- [ForEncryption.zip demo kits](/originals/encryption/ForEncryption.zip) (C# and PHP): used only to confirm the format of the `hash` value and the `docMimeType` they send
:::

## TL;DR

- **Where:** every method's endpoint is `https://{pecws.domain}/PHIC/Claims3.0/<methodName>`. The DevKit doesn't give the real host, so get it from PhilHealth ([KI-30](/known-issues#ki-30)).
- **Auth:** call [`getToken`](/api/get-token) right before each call, and send its `result` in a header named `token` ([KI-26](/known-issues#ki-26)).
- **Encryption:** most request bodies and most results travel in a six-field envelope encrypted with your facility's cipher key ([Encrypting API payloads](/guides/encryption/api-payloads)).
- **Code:** every example on this site uses one small client, in Node.js and Python. It gets a fresh token for each call and seals or unseals envelopes for you. Set it up once: [Shared client setup](#shared-client-setup).
- **Errors:** check `success === true` first, then look for errors inside the decrypted result. Most failure responses are undocumented ([KI-42](/known-issues#ki-42)).
- **Dates:** in API fields and the eClaims XML, send `MM-DD-YYYY` dates and `HH:MM:SSAM/PM` times. Only the CF4 XML uses `YYYY-MM-DD`. When you read times, accept both `01:20:20PM` and `01:20:20 PM` ([KI-49](/known-issues#ki-49)).
- **Names:** copy method, header and key names exactly, for example `uploadeClaims`, `validateeSOA` and `searchCaseRates`.

## Base URL

Every method in the Guide uses the same endpoint pattern:

```text
https://{pecws.domain}/PHIC/Claims3.0/<methodName>
```

For example, the token method is `https://{pecws.domain}/PHIC/Claims3.0/getToken` ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).

::: warning The host name is not in the DevKit
`{pecws.domain}` is a placeholder. No file in the DevKit gives the real test or production host. Get both from PhilHealth, and keep the host in configuration rather than in code. See [KI-30](/known-issues#ki-30).
:::

Recommendation (not from PhilHealth): keep the method name exactly as written in the Guide, including its capitals. The DevKit does not say whether the path is case-sensitive, so don't rely on it being forgiving.

## Authentication

PECWS uses a short-lived token. The flow is the same for every method:

```text
  Your HIS/EMR                                   PECWS
  ------------                                   -----
  GET  /getToken
       accreditationNo: <facility PAN>      --->
       softwareCertificateId: <cert ID>
                                            <--- { success: true, result: "<token>",
                                                   message: "Token is valid for 20 seconds" }

  POST /uploadeClaims   (or any other method)
       token: <token>                       --->
       body: { encrypted envelope }
                                            <--- { success, message, result }
```

1. Call [`getToken`](/api/get-token) with two headers: `accreditationNo`, which is your health facility's PhilHealth Accreditation Number (PAN), and `softwareCertificateId`, which is your software's PECWS 3.0 certification ID.
2. Take the token from `result`.
3. Send it in a header named `token` on every other call. Every other method's section in the Guide lists `token` ("PECWS authentication token") as its header ([Guide p. 9–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)).

::: warning Tokens are short-lived
The only hint about token lifetime is the sample message `"Token is valid for 20 seconds"` ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). See [KI-26](/known-issues#ki-26).

Recommendation (not from PhilHealth): finish the slow work first (building and encrypting the XML), then get a fresh token right before each call. The [shared client](#shared-client-setup) does this for every call. If a call fails with what looks like an authentication error, get a new token and retry once.
:::

Your software also holds a third credential, the **cipher key**, which is a secret. PhilHealth issues it to the health facility for each certified software ([Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). You never send the cipher key in a request. You use it locally to encrypt request bodies and decrypt results.

## The standard response envelope

Every method whose output the Guide documents (all except `validateCF5`) returns a JSON object with the same three keys:

| Key | Type | Meaning (from the Guide) |
|---|---|---|
| `success` | boolean | "A value of 'true' indicates a successful operation" |
| `message` | string | "If an error was encountered during the execution of this method, this will contain the error message". It is usually `""` on success. `getToken` also uses it for information, as in "Token is valid for 20 seconds". |
| `result` | varies | The method's output. It can be a plain string (`getToken`, `getServerVersion`), a plain object or array (server date-time methods), or, for most methods, an **encrypted envelope** (see below). |

```json
{
  "success": true,
  "message": "",
  "result": "PECWS 3.0"
}
```

The DevKit does not specify what a failed call looks like in general. It doesn't say which HTTP status codes are used, whether `success` becomes `false`, what an invalid or expired token returns, or what `result` contains on failure. Confirm with PhilHealth. See [KI-42](/known-issues#ki-42).

A few methods do document problems reported **inside** the result:

- `validateeSOA`: the decrypted result "may contain" an `errors` array ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)).
- `uploadeClaims`: an "Unsuccessfully Received" `eRECEIPT` with `REMARKS` elements (`pErrCode`, `pErrDescription`) ([Guide p. 36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=36)).
- `addRequiredDocument`: the strings "Claims has already been paid" and "Claims has already been denied" ([Guide p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)).

The Guide doesn't say what `success` is in these cases, and it lists no error codes for the `REMARKS` elements ([KI-42](/known-issues#ki-42)).

Recommendation (not from PhilHealth): treat any response where `success` is not exactly `true` as a failure. Log `message` and the HTTP status, and don't try to decrypt `result`. The shared client's `assertSuccess` does this check for you. When `success` is `true`, still check the decrypted content for the errors above. `success: true` alone doesn't prove the claim or file was accepted.

## The encrypted envelope

Most request bodies and most `result` values are not sent as plain XML or JSON. They are wrapped in this six-field JSON object, which Annex A of the Guide calls the "Sample Format/Layout of the Resulting Encrypted Data" ([Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)):

```json
{
  "docMimeType": "{MIME type of the data}",
  "hash": "{SHA-256 hash of the data before encryption}",
  "key1": "",
  "key2": "",
  "iv": "{The initialization vector encoded as base-64 string}",
  "doc": "{The encrypted data encoded as base-64 string}"
}
```

| Field | What to put in it (API payloads) | Why it exists | Source |
|---|---|---|---|
| `docMimeType` | The MIME type of the plaintext: `"text/xml"` for XML, `"application/json"` for JSON (Annex A's example). If the test server rejects `application/json`, use `text/xml` ([KI-25](/known-issues#ki-25); see the warning below). | Tells the receiver what the decrypted bytes are. | Annex A step 5a (p. 76) |
| `hash` | The SHA-256 hash of the plaintext **before** encryption. Annex A mentions neither padding nor the text format of the hash. Both demo kits hash the original, unpadded data and write the hash as a 64-character lowercase hex string ([KI-57](/known-issues#ki-57)). | Lets the receiver check that decryption produced exactly the original data. | Annex A step 1 (p. 75) |
| `key1` | `""` (empty string) | Used only by the attachment scheme, not by API payloads. | Annex A step 5c |
| `key2` | `""` (empty string) | Same as `key1`. | Annex A step 5d |
| `iv` | Base64 of 16 random bytes: the AES initialization vector (IV). Use a new IV for every message. | Advanced Encryption Standard in Cipher Block Chaining mode (AES-CBC) needs a random IV so that equal plaintexts don't produce equal ciphertexts. | Annex A step 3 |
| `doc` | Base64 of the AES-256-CBC ciphertext. The key is the SHA-256 digest of your cipher key (32 raw bytes). The plaintext is padded with `0x00` bytes to a multiple of 16. | The actual encrypted content. | Annex A steps 2 and 4 (p. 75–76) |

The step-by-step how-to, with working code, is in [Encrypting API payloads](/guides/encryption/api-payloads).

::: danger Two different encryption schemes use the same six field names
The envelope above, with empty `key1` and `key2`, is for **API payloads** and uses your facility's **cipher key**. Supporting documents that you attach to a claim (PDFs, plus CF4, CF5 and eSOA XML files) use a different scheme. That scheme uses PhilHealth's **public key**, so `key1`, `key2` and `iv` are RSA-encrypted and not empty. Mixing the two up is easy. See [Encryption overview](/guides/encryption/) and [KI-12](/known-issues#ki-12).
:::

::: warning `docMimeType` in the Guide is unreliable
Every method section documents `"docMimeType": "text/xml"`, even when the encrypted content is JSON (for example `getMemberPIN`, in both the request and the result) or a base64 PDF (`generatePBEFPDF`). The only exception is the `addRequiredDocument` sample, which leaves it empty (`""`, [Guide p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)). Annex A says the value should be the MIME type of the actual data, such as `application/json` for JSON. See [KI-25](/known-issues#ki-25).

Recommendation (not from PhilHealth):

- **XML payloads:** use `text/xml`. It is what the method sections show, and it is a MIME type for XML, as Annex A asks.
- **JSON payloads:** use `application/json`, following Annex A's explicit rule. If the test server rejects `application/json`, switch to `text/xml` (what every Guide JSON sample and both demo kits use) and tell PhilHealth ([KI-25](/known-issues#ki-25)).
- **Responses:** **don't** decide how to parse a response from its `docMimeType`. Decide from the method's documentation or from the decrypted content itself.
:::

## All 19 methods at a glance

The 20250217 Guide documents 19 methods ([table of contents, Guide p. 5](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)). In the table, "envelope" means the encrypted envelope described above, built with your cipher key.

| # | Method | HTTP | Request input | Encrypted request? | Encrypted `result`? | Guide pages |
|---|---|---|---|---|---|---|
| 1 | [`getToken`](/api/get-token) | GET | Headers `accreditationNo`, `softwareCertificateId`; no body | Not specified (see note 1) | No: plain token string | [p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8) |
| 2 | [`validateeSOA`](/api/validate-esoa) | POST | Envelope of the eSOA XML | Yes | Yes: when decrypted, may contain `{"errors": [...]}` | [p. 9–15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) |
| 3 | [`validateCF5`](/api/validate-cf5) | POST | JSON `{"cf5": envelope, "eclaims": envelope}` | Yes (both values) | Not specified: the section has no Output part (see note 2; [KI-42](/known-issues#ki-42)) | [p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |
| 4 | [`uploadeClaims`](/api/upload-eclaims) | POST | Envelope of the eClaims XML | Yes | Yes: `eRECEIPT` XML | [p. 19–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19) |
| 5 | [`searchCaseRates`](/api/search-case-rates) | POST | JSON `{icdcode, rvscode, description, targetdate}` ([KI-46](/known-issues#ki-46)) | No (plain JSON sample; see note 5) | Yes: JSON `eCASERATES` | [p. 37–41](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37) |
| 6 | [`addRequiredDocument`](/api/add-required-document) | POST | JSON `{pSeriesLhioNo, pXML}`; `pXML` is an envelope of `DOCUMENTS` XML | Partly (`pXML` only) | Not specified: only plain failure strings are listed ([KI-29](/known-issues#ki-29)) | [p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42) |
| 7 | [`eClaimsFileCheck`](/api/eclaims-file-check) | POST | Envelope of the eClaims XML | Yes | Yes: decrypted content not shown ([KI-42](/known-issues#ki-42)) | [p. 44–45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44) |
| 8 | [`getClaimStatus`](/api/get-claim-status) | GET, with a body ([KI-17](/known-issues#ki-17)) | JSON `{"serieslhionos": [...]}` | No (plain JSON sample) | Yes: JSON `CLAIMS` | [p. 46–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46) |
| 9 | [`getDoctorPAN`](/api/get-doctor-pan) | POST | Envelope of JSON `{lastname, firstname, middlename, suffix, birthdate}` | Yes | Yes: `{"pan": ...}` | [p. 49–50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49) |
| 10 | [`getMemberPIN`](/api/get-member-pin) | POST | Envelope of JSON (same keys as `getDoctorPAN`) | Yes | Yes: `{"pin": ...}` | [p. 51–52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51) |
| 11 | [`getUploadedClaimsMap`](/api/get-uploaded-claims-map) | GET | Query parameter `receiptTicketNumber` ([KI-22](/known-issues#ki-22)); no body | Not applicable (no body) | Yes: JSON `eCONFIRMATION` | [p. 53–54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53) |
| 12 | [`getVoucherDetails`](/api/get-voucher-details) | GET | Parameter `voucherNo`; the Guide doesn't say where it goes, so this site sends it as a query parameter ([KI-61](/known-issues#ki-61)); no body | Not applicable (no body) | Yes: JSON `VOUCHER` | [p. 55–60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55) |
| 13 | [`isDoctorAccredited`](/api/is-doctor-accredited) | POST | JSON `{accrecode, admissiondate, dischargedate}` | No (plain JSON sample; [KI-61](/known-issues#ki-61)) | Yes (described; no sample; [KI-24](/known-issues#ki-24)) | [p. 60–61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60) |
| 14 | [`searchEmployer`](/api/search-employer) | POST | JSON; key names conflict ([KI-18](/known-issues#ki-18)) | No (plain JSON sample; [KI-61](/known-issues#ki-61)) | Yes: JSON `eEMPLOYERS` | [p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62) |
| 15 | [`getDBServerDateTime`](/api/get-db-server-date-time) | GET | None | Not applicable (no body) | No: plain JSON array | [p. 64–65](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64) |
| 16 | [`getServerDateTime`](/api/get-server-date-time) | GET | None | Not applicable (no body) | No: plain JSON object | [p. 66–67](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66) |
| 17 | [`getServerVersion`](/api/get-server-version) | GET | None | Not applicable (no body) | No: plain string | [p. 68](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=68) |
| 18 | [`isClaimEligible`](/api/is-claim-eligible) | POST | Envelope of JSON (member and patient details) | Yes | Yes: `{isok, referenceno, trackingno, asof}` ([KI-20](/known-issues#ki-20)) | [p. 69–72](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69) |
| 19 | [`generatePBEFPDF`](/api/generate-pbef-pdf) | POST | JSON `{accreno, referenceno}` (labeled "Parameter"; [KI-21](/known-issues#ki-21)) | No (plain JSON sample; [KI-61](/known-issues#ki-61)) | Yes: a base64 PDF string | [p. 73–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73) |

Notes on the table:

1. **`getToken`**: the Guide's description says the token is generated "using the **encrypted** Accreditation Number and Sofware Certification ID", but the header table describes plain values and doesn't explain any encryption. Send the plain values. See [getToken](/api/get-token#notes-and-gotchas) and [KI-44](/known-issues#ki-44).
2. **`validateCF5`**: the section has Endpoint, Method, Inputs and samples, but no Output section. The response shape is not documented ([KI-42](/known-issues#ki-42)).
3. **Encrypted `result` values** come from each method's Output table. Most tables say the result is "the result of the encryption (using the cipher key of the health facility)". `validateeSOA` says its `doc` is encrypted "using the cipher key of the HF" (p. 10). `isClaimEligible` and `generatePBEFPDF` only say "An encrypted JSON object", but they list empty `key1` and `key2`, which is the mark of the cipher-key scheme (p. 70, 73–74). `isDoctorAccredited` names the cipher key but lists no envelope fields at all ([KI-24](/known-issues#ki-24)). Our reading (not a PhilHealth statement): you decrypt every encrypted result with your cipher key, the same way you encrypt requests.
4. **"No (plain JSON sample)"** means the Guide shows the body as ordinary JSON and never says to encrypt it. The Guide also never says "do not encrypt". Follow the sample and send plain JSON. If the test server rejects a plain body, try the encrypted envelope and confirm with PhilHealth ([KI-61](/known-issues#ki-61)).
5. **`searchCaseRates`**: revision 20240216 says its parameters changed "from object input parameters to comma separated list of input parameters" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). The current method section still shows a JSON object body ([p. 37–38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)). See the warning below and [KI-46](/known-issues#ki-46).

::: warning validateCF5: response not documented
The `validateCF5` section ([Guide p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) has no Output section and no sample response. Unlike `validateeSOA`, which says the decrypted result may contain an `errors` array, the Guide doesn't say what `validateCF5` returns or whether its `result` is encrypted. The DevKit does not specify this. The DevKit's [DRG error codes](/reference/drg-error-codes) workbook lists CF5-related errors, but it never says whether `validateCF5` returns those codes. Confirm with PhilHealth, and code defensively: check `success` and log the raw `result`. See [KI-42](/known-issues#ki-42) and [KI-36](/known-issues#ki-36).
:::

::: warning searchCaseRates: revision note and method section disagree
The revision history entry for 20240216 describes the `searchCaseRates` input as a "comma separated list of input parameters". The 20250217 method section documents a JSON body with the keys `icdcode`, `rvscode`, `description` and `targetdate`. We follow the method section, because it is the detailed specification in the newest Guide. Confirm with PhilHealth if the server rejects the JSON body. The method's sample request and sample response also don't match each other, and the filter rules (which keys are required, how filters combine) are not stated. See [KI-46](/known-issues#ki-46).
:::

### Methods grouped by task

| Task | Methods |
|---|---|
| Authentication | [`getToken`](/api/get-token) |
| Before submitting (validation) | [`validateeSOA`](/api/validate-esoa), [`validateCF5`](/api/validate-cf5), [`eClaimsFileCheck`](/api/eclaims-file-check) |
| Submitting and fixing claims | [`uploadeClaims`](/api/upload-eclaims), [`addRequiredDocument`](/api/add-required-document) |
| Tracking and payment | [`getUploadedClaimsMap`](/api/get-uploaded-claims-map), [`getClaimStatus`](/api/get-claim-status), [`getVoucherDetails`](/api/get-voucher-details) |
| Eligibility | [`isClaimEligible`](/api/is-claim-eligible), [`generatePBEFPDF`](/api/generate-pbef-pdf) |
| Lookups | [`searchCaseRates`](/api/search-case-rates), [`getMemberPIN`](/api/get-member-pin), [`getDoctorPAN`](/api/get-doctor-pan), [`isDoctorAccredited`](/api/is-doctor-accredited), [`searchEmployer`](/api/search-employer) |
| Server utilities | [`getServerVersion`](/api/get-server-version), [`getServerDateTime`](/api/get-server-date-time), [`getDBServerDateTime`](/api/get-db-server-date-time) |

For how these fit into a claim's life, from admission to payment, see [The claims lifecycle](/getting-started/claims-lifecycle).

## Removed methods

Two methods, `requestQrAuthorization` and `inquireQrTrackingNo`, were added in revision 20240228 for a QR-code use case of the eGov super app. They were **removed in revision 20250217** "as this requirement has been deferred" ([Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). Don't implement them. Older copies of the Guide still describe them. See [Removed methods](/api/removed-methods) and [KI-02](/known-issues#ki-02).

## Date and time formats

The DevKit writes dates and times in several formats. This table covers the ones you meet in API calls and the eClaims XML. The full list of variants is in [KI-49](/known-issues#ki-49).

| Where | Format | Example | Source |
|---|---|---|---|
| API request fields (`birthdate`, `admissiondate`, `dischargedate`, `admissionDate`, `dateOfBirth`) | `MM-DD-YYYY` | `01-01-1990` | [Guide p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49), [p. 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60), [p. 69–70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69) |
| `searchCaseRates` `targetdate` | `mm-dd-yyyy`, or `""` for all periods | `02-14-2024` | [Guide p. 37–38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37) |
| eClaims XML dates (Annex C) | `MM-DD-YYYY` | `08-26-2009` (upload sample) | [Guide p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80), [p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29) |
| eClaims XML times (Annex C) | `HH:MM:SSAM/PM`, no space before AM/PM | `00:00:00AM` (eRECEIPT sample) | [Guide p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80), [p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35) |
| Decrypted results (for example `getClaimStatus`) | dates `MM-DD-YYYY`, times like `04:46:23PM` | `"pAsOf": "07-25-2012"` | [Guide p. 48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=48) |
| Server date-time methods | No format is stated. The samples suggest `MM-DD-YYYY hh:mm:ss AM/PM`, **with** a space before AM/PM. The sample date `01-01-2024` can't show whether month or day comes first, so month-first is our assumption. | `01-01-2024 01:20:20 PM` | [Guide p. 65](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=65), [p. 66](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66) |
| CF4 XML (not an API field) | `YYYY-MM-DD` | | [KI-08](/known-issues#ki-08) |

- In every date format the Guide states, the month comes **first**. `01-02-2024` is January 2, not February 1.
- The DevKit does not specify a time zone for any date or time. Confirm with PhilHealth ([KI-42](/known-issues#ki-42)).
- `12-31-9999` appears as an open-ended end date (`pEffectivityEndDate`) in the `searchCaseRates` sample ([Guide p. 41](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=41)).

::: warning Two AM/PM spellings
Annex C and most samples write times with no space before AM/PM (`04:46:23PM`). The server date-time samples put a space there (`01:20:20 PM`). When you **send** times in eClaims XML, follow Annex C (`HH:MM:SSAM/PM`). When you **read** times from responses, accept both forms. See [KI-49](/known-issues#ki-49).
:::

## Naming quirks

Method names in the endpoint URL are what matter. The Guide's prose, headings and revision history often spell them differently. See also [KI-09](/known-issues#ki-09).

| Endpoint name (use this) | Other spellings in the Guide | Watch out for |
|---|---|---|
| `uploadeClaims` | "Upload eClaims Method" (section title, p. 19), "EclaimsUpload method" (p. 9, 16), "eClaimsUpload method" (p. 53), "Data Dictionary eClaimsUpload" (Annex C title, p. 5, 79) | Lowercase `e` then capital `C`: `upload` + `eClaims`. Not `uploadEClaims` or `uploadClaims`. |
| `validateeSOA` | "ValidateEsoa" (revision history p. 3; Annex D title, p. 5, 86) | Double `e`: `validate` + `eSOA`. |
| `eClaimsFileCheck` | "EClaims File Check Method" (p. 5, 44) | Starts with a lowercase `e`. |
| `searchCaseRates` | "SearchCaseRate" (revision history, p. 3) | Plural `Rates`. |
| `getToken` | "GenerateToken" (revision history, p. 3) | |
| `getDBServerDateTime` | "Get DB Server Date Time Method" (p. 64) | `DB` is all capitals. |
| `generatePBEFPDF`, `getDoctorPAN`, `getMemberPIN`, `validateCF5` | | Acronyms are all capitals. |

The same care applies to keys and headers:

- **Header names**: `accreditationNo` and `softwareCertificateId` (getToken), and `token` (all other methods). Revisions 20240418 and 20240910 added `softwareCertId` and the misspelled `softwareCertifficateId` headers to `uploadeClaims`. Revision 20241111 explicitly removed `softwareCertifficateId`. No entry records the removal of `softwareCertId`, but the current `uploadeClaims` header table lists only `token` ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)). Don't send either header. See [KI-03](/known-issues#ki-03).
- **Request keys** use three different styles, and you must copy each exactly: all lowercase (`lastname`, `accrecode`, `serieslhionos`), camelCase (`memberPIN`, `isForOPDHemodialysisClaim`), and `p`-prefixed (`pSeriesLhioNo`, `pXML`).
- **Response keys** also mix styles: `p`-prefixed camelCase (`pClaimSeriesLhio`, `pReceiptTicketNumber`), all lowercase (`pan`, `pin`, `isok`, `referenceno`), and uppercase containers (`CLAIMS`, `VOUCHER`, `eCASERATES`).
- **Some names are spelled two ways in the same method section**: `dateTime` (table) vs `datetime` (sample) in responses ([KI-19](/known-issues#ki-19)); in requests, `philhealthno` / `employername` (table) vs `PEN` / `employerName` (sample) ([KI-18](/known-issues#ki-18)), and `receiptTicketNo` (prose) vs `receiptTicketNumber` (parameter table) ([KI-22](/known-issues#ki-22)).

## A generic request, step by step

Here is the shape of almost every call, using `uploadeClaims` as the example. It is pseudo-code based on Annex A and the method pages. For real code, see [Shared client setup](#shared-client-setup) below.

```text
# ---- one-time setup -------------------------------------------------------
BASE      = "https://{pecws.domain}/PHIC/Claims3.0"     # host from PhilHealth (KI-30)
cipherKey = secret issued by PhilHealth for your certified software
aesKey    = SHA256(UTF8(cipherKey))        # 32 RAW bytes, not the hex string (KI-14)

# ---- 1. build the plaintext ----------------------------------------------
plaintext  = build eClaims XML             # or JSON for getMemberPIN, isClaimEligible...
plainBytes = UTF8(plaintext)

# ---- 2. encrypt into the envelope (Annex A) -------------------------------
iv       = secureRandomBytes(16)
padded   = plainBytes + 0x00 bytes until length % 16 == 0   # turn OFF library PKCS#7 padding
envelope = {
  "docMimeType": "text/xml",                         # MIME type of the plaintext
  "hash":        lowercaseHex(SHA256(plainBytes)),   # of the plaintext, before padding
  "key1": "", "key2": "",
  "iv":          base64(iv),
  "doc":         base64(AES_256_CBC_encrypt(aesKey, iv, padded))
}

# ---- 3. get a fresh token right before the call (KI-26) --------------------
r = HTTP GET  BASE + "/getToken"
      headers: accreditationNo = <facility PAN>
               softwareCertificateId = <software certificate ID>
if r.success != true: stop with r.message
token = r.result

# ---- 4. call the method ---------------------------------------------------
r = HTTP POST BASE + "/uploadeClaims"
      headers: token = <token>
               Content-Type = application/json      # not specified by the DevKit (KI-42)
      body:    JSON(envelope)

# ---- 5. check the outer envelope --------------------------------------------
if r.success != true: stop with r.message           # don't decrypt on failure

# ---- 6. decrypt result (only for methods with an encrypted result) --------
e         = r.result
decrypted = AES_256_CBC_decrypt(aesKey, base64decode(e.iv), base64decode(e.doc))
plainOut  = decrypted with trailing 0x00 bytes removed   # undo zero padding (KI-13)

# ---- 7. verify integrity (Annex A step 1) ---------------------------------
if lowercaseHex(SHA256(plainOut)) != lowercase(e.hash): stop "hash mismatch"

# ---- 8. parse by content, not by docMimeType (KI-25) ----------------------
uploadeClaims -> XML (eRECEIPT); getMemberPIN -> JSON; generatePBEFPDF -> base64 PDF
then look for errors inside the content, e.g. eRECEIPT REMARKS (uploadeClaims)
or an "errors" array (validateeSOA)
```

You don't have to write steps 2 to 7 yourself. The [shared client](#shared-client-setup) does them, using this site's tested encryption modules (unofficial, not from PhilHealth):

- Node.js, [`payload-crypto.mjs`](/examples/encryption/payload-crypto.mjs): `encryptPayload(plaintext, cipherKey, docMimeType)` returns the envelope object. `decryptPayload(envelope, cipherKey)` returns `{ data, text, padding, hashVerified }` and throws on a hash mismatch. Use `.text` for XML or JSON.
- Python, [`payload_crypto.py`](/examples/encryption/payload_crypto.py): `encrypt_payload(plaintext, cipher_key, doc_mime_type)` returns a dict. `decrypt_payload(envelope, cipher_key)` returns an object with `.text`, `.data` and `.hash_verified`.

Their decrypt functions go one step further than the pseudo-code: they try each known padding and keep the one whose SHA-256 matches `hash`. See [Encrypting API payloads](/guides/encryption/api-payloads).

Why each step matters:

1. **Plaintext first.** Validate your XML against the DTD locally before you encrypt it. Encrypted garbage looks exactly like encrypted valid XML. See [Validating XML locally](/guides/validating-xml).
2. **Encrypt.** Most AES libraries add PKCS#7 padding by default. Annex A says to pad with `0x00` bytes instead ([Guide p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76)), so turn the library's padding off and pad by hand.
3. **Token last.** If the token really lasts only 20 seconds, as the sample message suggests, it can expire while you build a large XML file. Get it just before the HTTP call.
4. **Call.** The DevKit doesn't specify the `Content-Type` header ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send `application/json` for JSON bodies.
5. **Check `success`.** On failure, `message` holds the reason. There may be no encrypted result to decrypt.
6. **Decrypt** with the same cipher key. PhilHealth encrypts results with your facility's cipher key. Then remove the trailing `0x00` padding bytes. Recommendation (not from PhilHealth): this is safe for text payloads (XML, JSON, base64), which never end in a real `0x00`. See [KI-13](/known-issues#ki-13) for how the demo kits differ on padding.
7. **Verify the hash.** Annex A's step 1 says that if the hashes match, "the data integrity is preserved". If they don't, "the data may have been tampered with or corrupted during decryption".
8. **Parse.** Use the method page to know what the decrypted content is. Some methods report problems inside it. For example, an `eRECEIPT` with `REMARKS` elements means `uploadeClaims` did not accept the claims ([Guide p. 36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=36)).

## Shared client setup {#shared-client-setup}

Every code example on this site's API pages and guides uses one small client, written once in Node.js and once in Python. It gets a fresh token before each call, sends the request, and seals (encrypts) or unseals (decrypts) envelopes with your cipher key. It is **unofficial**: this site wrote it, not PhilHealth. We tested it only against a local mock server, so test it against PhilHealth's test environment before you rely on it.

### 1. Download the files

| Language | Client | Also download | Install |
|---|---|---|---|
| Node.js 18 or newer | [`pecws-client.mjs`](/examples/client/pecws-client.mjs) | [`payload-crypto.mjs`](/examples/encryption/payload-crypto.mjs) | Nothing. It uses built-in modules only. |
| Python 3.9 or newer | [`pecws_client.py`](/examples/client/pecws_client.py) | [`payload_crypto.py`](/examples/encryption/payload_crypto.py) | `pip install requests cryptography` |

Save the client and its encryption module in the same folder as your code. (The client also works in this site's own layout, with `client/` and `encryption/` side by side.) The method pages import it as `./pecws-client.mjs` or `pecws_client`.

### 2. Set four environment variables

These are the only configuration names used anywhere on this site.

| Variable | What it holds | Example |
|---|---|---|
| `PECWS_BASE_URL` | The base URL, up to and including `/PHIC/Claims3.0`. The host is not in the DevKit, so get it from PhilHealth ([KI-30](/known-issues#ki-30)). | `https://<host from PhilHealth>/PHIC/Claims3.0` |
| `PHIC_FACILITY_PAN` | Your health facility's PhilHealth Accreditation Number, sent as the `accreditationNo` header of [`getToken`](/api/get-token) | `H12345678` (this site's example facility) |
| `PHIC_SOFTWARE_CERT_ID` | Your software certificate ID, sent as the `softwareCertificateId` header | `SAMPLE-CERT-ID` (example) |
| `PECWS_CIPHER_KEY` | Your facility's cipher key. The client uses it locally and never sends it. | Issued by PhilHealth |

```bash
export PECWS_BASE_URL='https://<host from PhilHealth>/PHIC/Claims3.0'
export PHIC_FACILITY_PAN='H12345678'
export PHIC_SOFTWARE_CERT_ID='SAMPLE-CERT-ID'
export PECWS_CIPHER_KEY='<your cipher key>'
```

Recommendation (not from PhilHealth): in production, load these values from your secret store, never from source code, and use different values for test and production.

The client refuses a plain `http://` base URL, except for `localhost` (a local mock server), so your credentials don't travel unencrypted.

### 3. Test the connection

```bash
node pecws-client.mjs smoketest      # or: python pecws_client.py smoketest
```

The smoke test calls `getToken`, then [`getServerVersion`](/api/get-server-version), and prints something like `getToken OK; getServerVersion: PECWS 3.0`. If it fails, it prints the server's `message` and the HTTP status.

### 4. Call a method

| Function (Node.js) | Function (Python) | What it does |
|---|---|---|
| `getToken()` | `get_token()` | Calls `getToken` and returns the plain token string. You rarely need it: the three call functions below get a fresh token before every request ([KI-26](/known-issues#ki-26)). |
| `pecwsGet(method, query)` | `pecws_get(method, query)` | `GET` with optional query parameters, which it URL-encodes. For `getUploadedClaimsMap`, `getVoucherDetails` and the three server utilities. |
| `pecwsGetWithBody(method, body)` | `pecws_get_with_body(method, body)` | `GET` with a JSON body. Only `getClaimStatus` needs it ([KI-17](/known-issues#ki-17)); `fetch()` can't send a body with `GET`. |
| `pecwsPost(method, body)` | `pecws_post(method, body)` | `POST` with a JSON body and `Content-Type: application/json`. For the other 12 methods. |
| `seal(plaintext, docMimeType)` | `seal(plaintext, doc_mime_type)` | Encrypts XML or JSON text with your cipher key and returns the envelope. Same as `encryptPayload(plaintext, PECWS_CIPHER_KEY, docMimeType)`. |
| `unseal(envelope)` | `unseal(envelope)` | Decrypts an envelope and returns the text. Same as `decryptPayload(envelope, PECWS_CIPHER_KEY).text`. Throws if the hash doesn't match. |
| `assertSuccess(envelope)` | `assert_success(envelope)` | Returns the envelope if `success` is exactly `true`. Otherwise throws an error (Python: `PecwsError`) with the server's `message` and the HTTP status. |

How the pieces fit:

- The body is whatever the method's page shows. For an encrypted request, pass `seal(text, docMimeType)`. For a plain-JSON request, pass the object itself, for example `{ icdcode: 'A90', rvscode: '', description: '', targetdate: '09-15-2026' }` for `searchCaseRates`.
- `docMimeType`: use `text/xml` for XML and `application/json` for JSON. If the test server rejects `application/json`, switch to `text/xml` (what every Guide JSON sample and both demo kits use) and tell PhilHealth ([KI-25](/known-issues#ki-25)).
- The call functions return the response envelope (`success`, `message`, `result`), even when `success` is `false`. Pass it to `assertSuccess`. They throw only when `getToken` fails, on network errors, after a timeout (120 seconds, our choice), or when the response isn't a JSON object. Failure responses are undocumented, so the error message is whatever the server sends ([KI-42](/known-issues#ki-42)).
- The client never retries on its own. A retried upload could send the same claim twice, and the DevKit doesn't say how PECWS handles duplicates ([KI-62](/known-issues#ki-62)).

Here is a complete call, using this site's example member (see [getMemberPIN](/api/get-member-pin)). Method pages use the same pattern and say "Uses the shared client from API overview → Shared client setup".

::: code-group

```js [Node.js]
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';

const query = { lastname: 'DELA CRUZ', firstname: 'JUAN', middlename: 'OCAMPO', suffix: '', birthdate: '09-19-1973' };
const env = assertSuccess(await pecwsPost('getMemberPIN', seal(JSON.stringify(query), 'application/json')));
const { pin } = JSON.parse(unseal(env.result)); // keep it a string
```

```python [Python]
import json

from pecws_client import pecws_post, seal, unseal, assert_success

query = {"lastname": "DELA CRUZ", "firstname": "JUAN", "middlename": "OCAMPO", "suffix": "", "birthdate": "09-19-1973"}
env = assert_success(pecws_post("getMemberPIN", seal(json.dumps(query), "application/json")))
pin = json.loads(unseal(env["result"]))["pin"]  # keep it a string
```

:::

### Full source

We tested both files against a local mock server, not PECWS, on Node.js 18 and 24 and Python 3.9 and 3.12. The tests covered a fresh token per call, query-string encoding, `GET` with a body, encrypted XML and JSON round trips (including `Ñ`), plain JSON bodies, failure envelopes, non-JSON responses and hash mismatches.

::: code-group

<<< @/public/examples/client/pecws-client.mjs [Node.js]

<<< @/public/examples/client/pecws_client.py [Python]

:::

## Common mistakes

- **Using the hex string of SHA-256(cipher key) as the AES key.** The key is the 32 raw bytes of the digest. A 64-character hex string is 64 bytes and is wrong. See [KI-14](/known-issues#ki-14).
- **Encrypting API payloads with PhilHealth's public key** (the attachment scheme), or attachments with the cipher key. See [KI-12](/known-issues#ki-12).
- **Leaving the library's default PKCS#7 padding on.** Annex A expects `0x00` padding. With PKCS#7, the decrypted data ends in padding bytes (values `0x01` to `0x10`) that a zero-padding decryptor won't remove, so the hash check can fail. Pad with `0x00` as Annex A says.
- **Hashing the padded or encrypted bytes.** `hash` is SHA-256 of the original plaintext.
- **Getting a token, then spending time building XML.** The token may expire before you send. See [KI-26](/known-issues#ki-26).
- **Sending `Authorization: Bearer <token>`.** The Guide's header name is `token`.
- **Mistyping the endpoint**, for example `uploadEClaims`, `validateESOA` or `searchCaseRate`.
- **Sending dates as `YYYY-MM-DD` or `DD-MM-YYYY`.** The API and eClaims XML use `MM-DD-YYYY`. Only CF4 uses `YYYY-MM-DD` ([KI-49](/known-issues#ki-49)).
- **Treating the Guide's sample hashes, IVs and tokens as test vectors.** They are truncated placeholders, some with spaces. See [KI-27](/known-issues#ki-27).
- **Hard-coding a guessed PhilHealth host name.** It is not in the DevKit ([KI-30](/known-issues#ki-30)).

## Related pages

- [getToken](/api/get-token): start here
- [Encryption overview: two schemes](/guides/encryption/)
- [Encrypting API payloads (cipher key)](/guides/encryption/api-payloads)
- [Submitting a claim](/guides/submitting-a-claim)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [Removed methods](/api/removed-methods)
- [Known issues and discrepancies](/known-issues)
