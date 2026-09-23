---
title: uploadeClaims
description: Submit one or more claims to PhilHealth as an encrypted eClaims XML file, and read the eRECEIPT that comes back.
---

# uploadeClaims

Submits one or more claims to PhilHealth through the PhilHealth e-Claims Web Service (PECWS) and returns an encrypted `eRECEIPT`.

<Badge type="tip" text="Current" />

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/uploadeClaims` |
| **Auth header** | `token`, from [getToken](/api/get-token). No certificate headers ([KI-03](/known-issues#ki-03)). |
| **Request body** | The eClaims XML (one transmittal with one or more claims), encrypted with your facility's **cipher key** (standard encrypted envelope, `key1` and `key2` empty) |
| **Response `result`** | An envelope encrypted with the cipher key. Decrypted, it is an `eRECEIPT` XML document: success carries the Receipt Ticket Number (`pReceiptTicketNumber`, RTN) and the Transmission Control Number (`pTransmissionControlNumber`, TCN); failure carries `REMARKS` elements with `pErrCode` and `pErrDescription`. |

::: tip TL;DR
1. Call this method only after steps 1–5 of the [submission order](#where-it-fits-the-submission-order): build the XML files, check them locally, run `validateeSOA` and `validateCF5`, encrypt and host the attachments, and run `eClaimsFileCheck` on the final XML.
2. Build the eClaims XML ([eClaims XML](/reference/eclaims-xml)) with `pUserName` set to `":"` plus your software certificate ID. Start from [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml).
3. Encrypt the XML with your cipher key and `POST` the envelope with a fresh `token` header.
4. Decrypt `result` and read the `eRECEIPT`. Recommendation (not from PhilHealth): treat the upload as received only if it has an RTN, a TCN and no `REMARKS`.
5. Store the RTN, TCN, transmission date and the whole receipt. You need the RTN for [getUploadedClaimsMap](/api/get-uploaded-claims-map).
6. Don't resend blindly after a timeout: the DevKit doesn't say how duplicates are handled ([KI-62](/known-issues#ki-62)).

PhilHealth terms are explained in the [Glossary](/getting-started/glossary).
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 19–36: Upload eClaims Method, eClaims DTD, samples, eRECEIPT](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)
- [Implementation Guide, p. 3–4: revision history (`pUserName`, removed headers)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 53–54: Get Uploaded Claims Map Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)
- [Implementation Guide, p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, p. 77–78: Annex B, document type codes](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)
- [Implementation Guide, p. 79–85: Annex C, data dictionary eClaimsUpload](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [`eClaimsDef.dtd` (v1.9)](/originals/eclaims-xml/eClaimsDef.dtd)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14)](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [Software Solution Validation Test Form (SSVTF), p. 1, 3, 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)

"Annex A" to "Annex F" on this page are the Guide's annexes ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).
:::

## When to use it

`uploadeClaims` is the call that actually files claims with PhilHealth. The Guide describes it this way ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)):

> This method allows health facilities to transmit electronic claims (eClaims) files to PhilHealth. It ensures Document Type Definition (DTD) compliance and validates XML element attributes based on the eClaims XML Elements Attribute Definition table.
>
> The transmission date serves as the official date received for the uploaded claims, which will be used to measure the Turnaround Time (TAT).

Two consequences for your system:

- **Timing matters.** The transmission date in the receipt is the claim's official "date received". PhilHealth measures its turnaround time (TAT) from it. Store it. The DevKit gives no deadline for the upload itself; the paper CF4 and CF5 forms say 60 and 30 calendar days from discharge ([KI-58](/known-issues#ki-58)).
- **PhilHealth validates on upload.** It checks the XML against the DTD and the attribute rules. No table in the Guide is called "eClaims XML Elements Attribute Definition table"; Annex C, titled "Data Dictionary eClaimsUpload", is presumably meant ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79), [KI-09](/known-issues#ki-09)).

### Where it fits: the submission order

::: tip Recommendation (not from PhilHealth): submission order
The Guide describes each method on its own. This site uses one order for every claim, so that each check runs on the exact files you upload:

1. Build the XML files: the eClaims XML and its XML attachments (eSOA, CF5, CF4). Decide each attachment's URL now, for example `https://files.samplehospital.example/eclaims/202609170001/CF5.enc`, so that the eClaims XML is already final when you send it to `validateCF5` ([KI-62](/known-issues#ki-62)).
2. Check each file locally against its DTD ([Validating XML locally](/guides/validating-xml)).
3. Validate the eSOA with [validateeSOA](/api/validate-esoa) and the CF5 with [validateCF5](/api/validate-cf5).
4. Encrypt every attachment with PhilHealth's public key and host it at an HTTPS URL ([Attachment encryption](/guides/encryption/attachments)).
5. Check the final eClaims XML, with the live attachment URLs, with [eClaimsFileCheck](/api/eclaims-file-check).
6. **Upload it with `uploadeClaims` (this page).**
7. Store the `eRECEIPT`, with its RTN and TCN.
8. Call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN to get each claim's PhilHealth claim series number (`pClaimSeriesLhio`).

Later, track the claims with [getClaimStatus](/api/get-claim-status) and [getVoucherDetails](/api/get-voucher-details), and answer returned claims with [addRequiredDocument](/api/add-required-document).
:::

The whole flow is explained on [The claims lifecycle](/getting-started/claims-lifecycle) and [Submitting a claim](/guides/submitting-a-claim).

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PECWS authentication token from [getToken](/api/get-token) | [Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19) |
| `Content-Type` | `application/json` | Not in the Guide ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send it, because the body is JSON. |

::: danger Don't send the old certificate headers
Revision 20240418 added a `softwareCertId` header, and revision 20240910 added `softwareCertifficateId` ("to be removed on the next version"). **Revision 20241111 removed `softwareCertifficateId`; the current header table ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)) no longer lists `softwareCertId` either**, so send neither. The software certificate ID now goes into the XML as `pUserName` ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3), [KI-03](/known-issues#ki-03)).
:::

### What you build: the eClaims XML

The plain (unencrypted) content is an eClaims XML document that follows [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.9, the same DTD printed in the Guide on p. 21–28. Its outer structure:

```text
eCLAIMS                pUserName, pUserPassword, pHospitalCode, pHospitalEmail, pServiceProvider (optional)
└── eTRANSMITTAL       pHospitalTransmittalNo, pTotalClaims
    └── CLAIM+         pClaimNumber, pTrackingNumber, pPhilhealthClaimType, pPatientType, pIsEmergency
        ├── CF1
        ├── CF2
        ├── ALLCASERATE | ZBENEFIT
        ├── CF3?
        ├── PARTICULARS?
        ├── RECEIPTS?
        └── DOCUMENTS
            └── DOCUMENT+   pDocumentType, pDocumentURL
```

`+` means one or more, `?` means optional, and `|` means one of the two. So one upload is one transmittal that holds **one or more** claims. Every element is documented on [eClaims XML reference](/reference/eclaims-xml). For a complete file that passes the DTD, start from our unofficial example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) rather than the Guide's sample, which is not well-formed ([KI-28](/known-issues#ki-28)). We validated the example with Java's built-in parser (JAXP) and with lxml plus a patched copy of the DTD. If you check it with an unpatched libxml2-based tool (Python's lxml, `xmllint`, PHP), expect a false "not deterministic" error caused by the DTD itself, or a pass that skipped some checks ([KI-43](/known-issues#ki-43)). Use [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or the [patched DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2) instead.

::: info Encoding and DOCTYPE
The DevKit doesn't state the character encoding of the eClaims XML, or whether an upload may include a `DOCTYPE` ([KI-62](/known-issues#ki-62)). The DTD's `&Ntilde;` and `&ntilde;` entities only resolve when the DTD is loaded. Recommendation (not from PhilHealth): send UTF-8, as our example does, with no `DOCTYPE`, and write `Ñ` as the literal character or as `&#209;` ([KI-60](/known-issues#ki-60)).
:::

The attributes that matter most for the upload itself:

| Attribute | DTD | Annex C length | Rule | Source |
|---|---|---|---|---|
| `eCLAIMS@pUserName` | required | String(20) | **`":"` followed by your software certificate ID**: `":SOFTWARE-CERTIFICATE-ID-HERE"` in the Guide sample, `":SAMPLE-CERT-ID"` in our example. Annex C still says "Provider user id… to be provided by PhilHealth"; the 20241111 revision supersedes it ([KI-03](/known-issues#ki-03)). Annex C's String(20) predates this rule, and it gives the certificate number (`pCertificateId`) String(50), so don't truncate the value to 20 characters. | [p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3), [p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29), [p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `eCLAIMS@pUserPassword` | required | String(20) | The sample uses `""`. Annex C says "to be provided by PhilHealth". | p. 29, p. 79 |
| `eCLAIMS@pHospitalCode` | required | String(12) | "Facility Accreditation Number". "For now PMCC number should be used." The Guide sample and our example use `123456`; Annex E describes the PMCC No. as a 6-character code ([p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88), [KI-48](/known-issues#ki-48)). | p. 79 |
| `eCLAIMS@pHospitalEmail` | required | String(150) | "Must not be blank"; where PhilHealth sends communication | p. 79 |
| `eCLAIMS@pServiceProvider` | optional | String(50) | Acronym or short name of the company that provided the software | p. 85 |
| `eTRANSMITTAL@pHospitalTransmittalNo` | required | String(20) | "Generated by the Hospital own batching system. This should be unique per hospital." | p. 79, p. 85 |
| `eTRANSMITTAL@pTotalClaims` | required | String(3) | "Claims counter", integer format | p. 79 |
| `CLAIM@pClaimNumber` | required | String(12) | "Hospital Generated Claim Case #, this should be unique per hospital" (the sample value is longer, [KI-31](/known-issues#ki-31)) | p. 79 |
| `DOCUMENT@pDocumentType` | required | String(3) | A code from Annex B, for example `CSF`, `SOA`, `ESA`, `CF4`, `CF5` | p. 85, [p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) |
| `DOCUMENT@pDocumentURL` | required | String(250) | "URL of the document accessible via https. The document must first be encrypted using philhealth public key before publishing online." | [p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

Recommendation (not from PhilHealth): set `pTotalClaims` to the number of `CLAIM` elements in the transmittal. Annex C calls it a "claims counter" but doesn't state the rule explicitly.

### Attachments are separate files

The eClaims XML does not contain the supporting documents. Each `DOCUMENT` points to a file on **your** HTTPS server, and each file must be encrypted with **PhilHealth's public key**, not your cipher key ([Annex C, p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85); [attachment guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)). That includes PDFs (for example the Claim Signature Form, `CSF`) and XML attachments such as the eSOA (`ESA`, validated with [validateeSOA](/api/validate-esoa)), CF5 (`CF5`, validated with [validateCF5](/api/validate-cf5)) and CF4 (`CF4`).

During certification, PhilHealth checks that it can open your URLs in a browser, download the files, decrypt them, and get byte-for-byte the same data as the raw files ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). Recommendation (not from PhilHealth): host the files **before** you run eClaimsFileCheck and upload the claim (steps 4–6 of the [submission order](#where-it-fits-the-submission-order)), and keep them reachable. Our example claim uses URLs such as `https://files.samplehospital.example/eclaims/202609170001/ESA.enc`. See [Attachment encryption](/guides/encryption/attachments) and [Document type codes](/reference/document-types).

::: warning What the DevKit leaves open about attachments
- **RSA padding.** The attachment guideline doesn't name the RSA padding. Both demo kits and this site's examples use PKCS#1 v1.5; confirm with PhilHealth ([KI-59](/known-issues#ki-59)).
- **`docMimeType` of XML attachments** (eSOA, CF5, CF4) is not given. This site uses `text/xml` ([KI-57](/known-issues#ki-57)).
- **Hosting.** Nothing says how long the files must stay online, or how PhilHealth authenticates to your server ([KI-57](/known-issues#ki-57)).
- **Required documents.** Nothing says which documents each benefit or claim type needs ([KI-62](/known-issues#ki-62)).
- **`CF2@pHasAttachedSOA`.** Nothing says whether it must be `Y` when you attach an `ESA` document. Our example sets `Y` ([KI-62](/known-issues#ki-62)).
:::

### What you send: the encrypted envelope

Encrypt the whole eClaims XML with your cipher key ([API payload encryption](/guides/encryption/api-payloads)). The body is this JSON object ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)):

| Key | Value |
|---|---|
| `docMimeType` | `"text/xml"` |
| `hash` | SHA-256 hash of the unencrypted eClaims XML bytes (64-character lowercase hex in the demo kits). Encode the XML as UTF-8 before you hash and encrypt it ([KI-60](/known-issues#ki-60)). |
| `key1` | `""` (empty string) |
| `key2` | `""` (empty string) |
| `iv` | The initialization vector (IV): 16 random bytes, Base64-encoded |
| `doc` | "The encrypted e-claim XML text": AES-256-CBC with your cipher key, Base64-encoded |

## Response

The response is a JSON object ([Guide p. 20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=20)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | The error message, if the method hit an error |
| `result` | "The JSON object as the result of the encryption (using the cipher key of the health facility) of the XML text containing the Receipt Ticket Number and other data about the processing of the submitted e-claim data." An envelope object with `docMimeType`, `hash`, `key1`, `key2`, `iv`, `doc`. |

### The decrypted `result`: `eRECEIPT`

Decrypt `result` with your cipher key. You get an `eRECEIPT` XML document. The Guide shows two versions ([Guide p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)): "A. Successfully Received" and "B. Unsuccessfully Received". The field definitions come from Annex C ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) for the attributes shared with the request, [p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) for the rest):

| Attribute | Annex C | Description | In success sample | In failure sample |
|---|---|---|---|---|
| `pUserName` | String(20) | Provider user ID | `""` | `""` |
| `pUserPassword` | String(20) | Provider password | `""` | `""` |
| `pHospitalCode` | String(12) | Facility code (same attribute name as in your request) | `123456` | `123456` |
| `pHospitalTransmittalNo` | String(20) | Hospital-generated transmittal number (same name as in your request) | `001` | `001` |
| `pTotalClaims` | String(3) | Claims counter (same name as in your request) | `1` | `1` |
| `pTransmissionControlNumber` | String(18) | "Philhealth Generated Transmittal file control number." "Will be blank if the transmission is failed" | `1234-5601-1234-1253` | `""` (blank) |
| `pTransmissionDate` | String(10) | `MM-DD-YYYY`. The official date received, used for TAT (p. 19) | `08-26-2009` | `08-26-2009` |
| `pTransmissionTime` | String(10) | `HH:MM:SSAM/PM` | `00:00:00AM` | `00:00:00AM` |
| `pReceiptTicketNumber` | String(18) | "Philhealth Generated Upload Comfirmation Receipt ticket number" | `1234-5601-1234` | absent |

On failure, `eRECEIPT` also contains one or more `REMARKS` child elements:

| `REMARKS` attribute | Annex C | Description | Sample |
|---|---|---|---|
| `pErrCode` | String(3) | "Claim file error Code" | `T01`, `T02` |
| `pErrDescription` | String(100) | "Claim file error Description" | `Invalid parameter value: pAmtActual` |

Annex C also defines `pReceivedDate` ("Date when the transmitted file received by PhilHealth", `MM-DD-YYYY`). It doesn't appear in either `eRECEIPT` sample; [getUploadedClaimsMap](/api/get-uploaded-claims-map) returns it. The DevKit doesn't say whether it can differ from `pTransmissionDate`.

::: warning No error-code list, no eRECEIPT DTD
The DevKit doesn't list the possible `pErrCode` values ([KI-42](/known-issues#ki-42)). The result table on p. 20 says a "Sample XML text and the DTD of the XML text is shown below", but no `eRECEIPT` DTD exists in the Guide or the DevKit. The DTD printed after it (p. 21–28) is the **request** DTD, `eClaimsDef.dtd`. The same table also describes `doc` as "the JSON object that contains the records of the matching benefit packages", which is copied from another method ([KI-47](/known-issues#ki-47)); the samples show that the decrypted content is the `eRECEIPT` XML.
:::

### How to tell success from failure

The Guide doesn't say whether `success` is `true` or `false` when the receipt contains errors ([KI-42](/known-issues#ki-42)).

::: tip Recommendation (not from PhilHealth): decide on the eRECEIPT, not on `success` alone
Treat the upload as **received** only when all of these are true:

1. `success` is `true` and `result` decrypts without error.
2. The decrypted `eRECEIPT` has a non-empty `pReceiptTicketNumber`.
3. It has a non-empty `pTransmissionControlNumber` (Annex C: "blank if the transmission is failed").
4. It has no `REMARKS` elements.

Anything else is a failed upload. Show every `pErrCode` and `pErrDescription` to the user, fix the XML, and upload again.
:::

### What to store

Recommendation (not from PhilHealth): save the whole decrypted `eRECEIPT` together with the exact eClaims XML you sent. Then save these values in their own columns, as strings, exactly as returned. The certification form's first check is "Does the system successfully receive the Receipt Ticket Number (RTN)?" ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)).

| Value | Why you need it |
|---|---|
| `pReceiptTicketNumber`: the Receipt Ticket Number (RTN) | Required to call [getUploadedClaimsMap](/api/get-uploaded-claims-map): its `receiptTicketNumber` parameter "must match the pReceiptTicketNumber attribute returned by the eClaimsUpload method" ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53); name: [KI-22](/known-issues#ki-22)). That call returns the PhilHealth claim series number (`pClaimSeriesLhio`) of each claim, which you need for [getClaimStatus](/api/get-claim-status) and [addRequiredDocument](/api/add-required-document). |
| `pTransmissionControlNumber`: the Transmission Control Number (TCN) | PhilHealth's control number for the transmitted file. The certification form asks whether your system prints the RTN/TCN and can "retrieve the XML in the eClaims database using the RTN/TCN" ([SSVTF p. 1, 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)); no PECWS method returns uploaded XML ([KI-56](/known-issues#ki-56)). |
| `pTransmissionDate`, `pTransmissionTime` | The official date received, used to measure TAT |
| `pHospitalTransmittalNo`, `pTotalClaims` | They carry the same names as your request attributes. Recommendation (not from PhilHealth): check that they match what you sent, to link the receipt to the right batch. |

::: warning Who generates the TCN?
Annex C calls `pTransmissionControlNumber` a "Philhealth Generated Transmittal file control number" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)), and the samples show it in the `eRECEIPT`. The certification form, however, asks "Does the system generate the Transmission Control Number?" ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)). The DevKit doesn't explain the difference ([KI-56](/known-issues#ki-56)). Recommendation (not from PhilHealth): store the TCN that the `eRECEIPT` returns, and ask PhilHealth what the certification item expects.
:::

Don't reformat the numbers. The RTN appears as `1234-5601-1234` in the `eRECEIPT` sample but as `071311000005` in the getUploadedClaimsMap sample (p. 54), so its exact format isn't settled ([KI-31](/known-issues#ki-31)); store what PhilHealth sends.

The certification form also expects "a notification or mechanism indicating a successful upload" and "mapping between the PhilHealth claim series number and the health facility claim ID" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

## Example

All values below are PhilHealth's samples. The hashes and ciphertexts are placeholders, and the sample request `hash` even contains spaces ([KI-27](/known-issues#ki-27)).

### The eClaims XML (excerpt)

An excerpt of the Guide's sample ([Guide p. 29–35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). We added the quotes around `pHospitalEmail`, which the original is missing ([KI-28](/known-issues#ki-28)), replaced everything between the `CLAIM` start tag and `DOCUMENTS` with a comment, and kept only the first of the three `DOCUMENT` elements. Because of those cuts, this excerpt is not valid against the DTD.

```xml
<eCLAIMS
    pUserName=":SOFTWARE-CERTIFICATE-ID-HERE"
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalEmail="email@yahoo.com"
    pServiceProvider="SAMPLE SERVICE PROVIDER">
    <eTRANSMITTAL
        pHospitalTransmittalNo="20160901"
        pTotalClaims="1">
        <CLAIM
            pClaimNumber="123456-20160930-2"
            pTrackingNumber=""
            pPhilhealthClaimType="ALL-CASE-RATE"
            pPatientType="I"
            pIsEmergency="N">
            <!-- CF1, CF2, ALLCASERATE, CF3, PARTICULARS, RECEIPTS ... -->
            <DOCUMENTS>
                <DOCUMENT
                    pDocumentType="CSF"
                    pDocumentURL="https://hospitalwebserver/eclaims/claimnumber/yyyymmdd000001.pdf"/>
                <!-- more DOCUMENT elements -->
            </DOCUMENTS>
        </CLAIM>
    </eTRANSMITTAL>
</eCLAIMS>
```

The full sample uses dates from 2009 and 2016 and codes that are only illustrative. For a complete file, use [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), this site's example claim (claim number `202609170001`, transmittal `TR20260917001`, facility code `123456`).

### Example request

We added the HTTP framing and `Content-Type`; the JSON body is the Guide's "Sample encrypted XML" ([Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)).

```http
POST /PHIC/Claims3.0/uploadeClaims HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
    "docMimeType": "text/xml",
    "hash": " fac928f71a3841317e7a99aec dc8f4d74d977dfe701c0c9bbca0678300540591",
    "key1": "",
    "key2": "",
    "iv": "nhYeJqBkuhJNM y1jPMxvQE2aJPVnqqn1pDQs==",
    "doc": "aJPVnqqn1pDQ PMs1FWFZT+odAp0qf2zManmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
}
```

### Example response

"Sample encrypted output value" ([Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)):

```json
{
    "result": {
        "docMimeType": "text/xml",
        "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591fac928f71a3841317e7a99aec",
        "key1": "",
        "key2": "",
        "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
        "doc": "PMs1FWFZT+odAp0qf2zManmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
    },
    "success": true,
    "message": ""
}
```

### Decrypted result: successfully received

We fixed one character: the original sample is missing the `>` that closes the start tag, so it doesn't parse ([KI-28](/known-issues#ki-28)).

```xml
<eRECEIPT
    pUserName=""
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalTransmittalNo="001"
    pTotalClaims="1"
    pTransmissionControlNumber="1234-5601-1234-1253"
    pTransmissionDate="08-26-2009"
    pTransmissionTime="00:00:00AM"
    pReceiptTicketNumber="1234-5601-1234">
</eRECEIPT>
```

### Decrypted result: unsuccessfully received

Unchanged from the Guide ([p. 36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=36)). `pTransmissionControlNumber` is blank and there is no `pReceiptTicketNumber`.

```xml
<eRECEIPT
    pUserName=""
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalTransmittalNo="001"
    pTotalClaims="1"
    pTransmissionControlNumber=""
    pTransmissionDate="08-26-2009"
    pTransmissionTime="00:00:00AM" >
    <REMARKS pErrCode="T01" pErrDescription="Invalid parameter value: pAmtActual" />
    <REMARKS pErrCode="T02" pErrDescription="Invalid parameter value: pOperationDate" />
</eRECEIPT>
```

::: warning The sample errors name attributes that don't exist
`pAmtActual` and `pOperationDate` are not attributes in `eClaimsDef.dtd` v1.9 (nor in the data-migration DTD), so the sample probably predates the current format ([KI-28](/known-issues#ki-28)). It only illustrates the shape; don't build logic around these codes or texts.
:::

### Code: upload and read the eRECEIPT

Recommendation (not from PhilHealth): illustrative code. Uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs` / `pecws_client.py`). `pecwsPost` gets a fresh token for the call; `seal` encrypts the XML with your cipher key; `assertSuccess` throws with PhilHealth's `message` when `success` isn't `true`; `unseal` decrypts `result`, removes the padding and throws if the SHA-256 `hash` doesn't match ([KI-13](/known-issues#ki-13)).

::: code-group

```js [Node.js]
// Node.js 18+ and fast-xml-parser v4 (npm install fast-xml-parser)
import { XMLParser } from 'fast-xml-parser'
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false, // keep "001" and other codes as strings
  isArray: (name) => name === 'REMARKS',
})

export async function uploadEclaims(eclaimsXml) {
  // Throws if success !== true: the upload did not run, so nothing was received.
  const env = assertSuccess(await pecwsPost('uploadeClaims', seal(eclaimsXml, 'text/xml')))
  const receiptXml = unseal(env.result) // the eRECEIPT XML; throws if the hash doesn't match
  const r = parser.parse(receiptXml).eRECEIPT
  const errors = (r.REMARKS ?? []).map((x) => ({ code: x.pErrCode, description: x.pErrDescription }))
  const rtn = r.pReceiptTicketNumber ?? ''
  const tcn = r.pTransmissionControlNumber ?? ''
  return {
    received: rtn !== '' && tcn !== '' && errors.length === 0,
    receiptTicketNumber: rtn,
    transmissionControlNumber: tcn,
    transmissionDate: r.pTransmissionDate,
    transmissionTime: r.pTransmissionTime,
    errors,
    receiptXml, // store this too
  }
}
```

```python [Python]
# Python 3.9+ with the `requests` package
import xml.etree.ElementTree as ET

from pecws_client import assert_success, pecws_post, seal, unseal


def upload_eclaims(eclaims_xml: str) -> dict:
    # Raises if success is not True: the upload did not run, so nothing was received.
    env = assert_success(pecws_post("uploadeClaims", seal(eclaims_xml, "text/xml")))
    receipt_xml = unseal(env["result"])  # the eRECEIPT XML; raises if the hash doesn't match
    root = ET.fromstring(receipt_xml)  # the <eRECEIPT> element
    errors = [
        {"code": r.get("pErrCode"), "description": r.get("pErrDescription")}
        for r in root.findall("REMARKS")
    ]
    rtn = root.get("pReceiptTicketNumber", "")
    tcn = root.get("pTransmissionControlNumber", "")
    return {
        "received": bool(rtn) and bool(tcn) and not errors,
        "receipt_ticket_number": rtn,
        "transmission_control_number": tcn,
        "transmission_date": root.get("pTransmissionDate"),
        "transmission_time": root.get("pTransmissionTime"),
        "errors": errors,
        "receipt_xml": receipt_xml,  # store this too
    }
```

:::

## Notes and gotchas

- **`pUserName` is `":"` plus the certificate ID.** The colon is part of the value. Don't put the ID in a header ([KI-03](/known-issues#ki-03)). `getToken` is different: it still takes the ID in its `softwareCertificateId` header.
- **Annex C lists `pCertificateId`, but the DTD doesn't have it.** Adding it makes the XML invalid against `eClaimsDef.dtd`. Don't send it ([KI-03](/known-issues#ki-03)).
- **Don't add attributes from the data-migration DTD.** `NCP@pNewbornHearingRegistryNo` and `NCP@pNewbornHearingScreeningTestResult` exist only there ([KI-10](/known-issues#ki-10)).
- **Two encryption schemes.** The request body uses the cipher key; the attached files use PhilHealth's public key ([KI-12](/known-issues#ki-12)), with RSA padding that the DevKit doesn't name ([KI-59](/known-issues#ki-59)). The public key in the DevKit is an expired test certificate; get the current one from PhilHealth ([KI-01](/known-issues#ki-01)).
- **HTTPS only for attachment URLs** (Annex C, p. 85). PhilHealth must be able to reach and download them ([SSVTF p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).
- **The official samples are broken.** The eClaims sample (p. 29) and the success `eRECEIPT` (p. 35–36) are not well-formed ([KI-28](/known-issues#ki-28)). Use [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) as a starting point.
- **Sample values vs lengths.** The sample TCN `1234-5601-1234-1253` has 19 characters, but Annex C gives String(18). The sample `pClaimNumber` is longer than String(12) ([KI-31](/known-issues#ki-31)). Keep your database columns wider than the documented lengths.
- **"eClaimsUpload" and "EclaimsUpload" mean this endpoint.** Other sections of the Guide use those names; the URL is `uploadeClaims` ([KI-09](/known-issues#ki-09)).
- **Tokens are short-lived** ([KI-26](/known-issues#ki-26)), so the shared client gets a fresh one for every call. **The host name isn't in the DevKit** ([KI-30](/known-issues#ki-30)); set it in `PECWS_BASE_URL`.
- **Check before you upload.** Recommendation (not from PhilHealth): follow the [submission order](#where-it-fits-the-submission-order). Validate the XML locally against the DTD ([Validating XML locally](/guides/validating-xml)), then run [eClaimsFileCheck](/api/eclaims-file-check) on the final file, with the live attachment URLs, as a server-side pre-check. The receipt's transmission date counts for TAT, so a clean first upload is worth it.
- **Retries and duplicates.** The DevKit doesn't say how PECWS treats a second upload of the same claim (`pClaimNumber`) or transmittal (`pHospitalTransmittalNo`), or whether a rejected transmittal number may be reused ([KI-62](/known-issues#ki-62)). Recommendation (not from PhilHealth): retry automatically only when you're sure the request never reached PhilHealth (for example, the connection was refused). After a timeout, flag the batch for a person to check instead of resending blindly. Store every `eRECEIPT`; if an earlier attempt returned an RTN, check it with [getUploadedClaimsMap](/api/get-uploaded-claims-map) before you send again. Ask PhilHealth how duplicates are handled.

### Common mistakes

1. Writing `pUserName="SOFTWARE-CERTIFICATE-ID"` without the leading colon, or still sending `softwareCertId`/`softwareCertifficateId` headers.
2. Encrypting attachments with the cipher key, or pointing `pDocumentURL` at an `http://` or private-network address PhilHealth can't reach.
3. Treating `success: true` as "claim received" without decrypting and checking the `eRECEIPT`.
4. Throwing away the receipt. Without `pReceiptTicketNumber` you can't call getUploadedClaimsMap, and without the claim series numbers you can't track the claims.
5. Copying the Guide's sample XML as a template; it doesn't parse.
6. Uploading a different eClaims XML from the one you checked, for example one whose attachment URLs changed after [eClaimsFileCheck](/api/eclaims-file-check) and [validateCF5](/api/validate-cf5) ran.

## Related pages

- [Submitting a claim](/guides/submitting-a-claim): the step-by-step tutorial
- [eClaims XML reference](/reference/eclaims-xml) and [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml)
- [Document type codes](/reference/document-types)
- [API payload encryption](/guides/encryption/api-payloads) and [Attachment encryption](/guides/encryption/attachments)
- [eClaimsFileCheck](/api/eclaims-file-check), [validateeSOA](/api/validate-esoa), [validateCF5](/api/validate-cf5)
- [getUploadedClaimsMap](/api/get-uploaded-claims-map), [getClaimStatus](/api/get-claim-status), [addRequiredDocument](/api/add-required-document)
- [Software certification (SSVTF)](/guides/certification)
- [Known issues](/known-issues)
