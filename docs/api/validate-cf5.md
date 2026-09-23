---
title: validateCF5
description: Ask PhilHealth to check a Claim Form 5 (CF5, DRG data) XML file, together with its eClaims XML, before you attach the CF5 to a claim.
---

# validateCF5

Asks the PhilHealth e-Claims Web Service (PECWS) to check a Claim Form 5 (CF5, DRG data) XML file, together with the eClaims XML of the same claim.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/validateCF5` |
| **Auth header** | `token`, from [getToken](/api/get-token) |
| **Request body** | A plain JSON object with **two** encrypted envelopes: `cf5` (the CF5 XML) and `eclaims` (the eClaims XML). Each is encrypted with your facility's **cipher key**. |
| **Response `result`** | **Not documented.** The Guide's Validate CF5 section has no Output section and no response sample, so it doesn't say whether `result` is encrypted ([KI-42](/known-issues#ki-42)). |

::: tip TL;DR
1. Build the CF5 XML from the standalone `CF5.dtd` and the eClaims XML of the same claim, with the same `pHospitalCode` and claim number. Put the CF5's final attachment URL in the eClaims XML before you validate.
2. Encrypt **each** XML separately with your **cipher key** and `POST` them as `cf5` and `eclaims`. The method checks the CF5 against PhilHealth's Document Type Definition (DTD) and valid values. Like [validateeSOA](/api/validate-esoa), it does **not** submit anything.
3. The response is undocumented: log it in full, decrypt `result` only if it looks like an envelope, and show whatever it says.
4. After the CF5 passes, encrypt the **same** CF5 XML with **PhilHealth's public key**, host it, and continue with the [submission order](#where-it-fits-the-submission-order): eClaimsFileCheck, then uploadeClaims.
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 16–18: Validate CF5 Method, CF5 DTD v1.3, samples](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)
- [Implementation Guide, p. 88: Annex E, data dictionary validateCF5](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)
- [Implementation Guide, p. 3–4: revision history (Laterality `N`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, p. 78: Annex B, document type `CF5`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)
- [`CF5.dtd`](/originals/cf5/CF5.dtd) and [`20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf`](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf)
- [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14)](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [Software Solution Validation Test Form (SSVTF), p. 7–13: CF5 criteria](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)
- [CF5 form (DRG Claim Form, shadow billing)](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)

"Annex A" to "Annex E" on this page are the Guide's annexes ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).
:::

## When to use it

CF5 is the "Electronic Claim Form 5 (for DRG Shadow Billing)" ([Annex B, Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)). It carries the coded data that PhilHealth needs to group a claim into a Diagnosis-Related Group (DRG): one primary diagnosis, up to 12 secondary diagnoses (International Classification of Diseases, ICD-10, codes), and up to 20 procedures (Relative Value Scale, or RVS, codes) ([Annex E, Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)).

Call `validateCF5` every time you generate or change a CF5, **before** you attach it to a claim. The Guide's "Important Note" ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)):

> After successful validation, CF5 XML should be encrypted using PhilHealth Public Key and submitted as attachment to electronic claims using the EclaimsUpload Method, with the Document Type set to CF5.

"EclaimsUpload" means the [`uploadeClaims`](/api/upload-eclaims) endpoint ([KI-09](/known-issues#ki-09)).

### Where it fits: the submission order

::: tip Recommendation (not from PhilHealth): submission order
This site uses one order for every claim. The CF5-specific work is in steps 1–4:

1. Build the XML files: the CF5, the other XML attachments, and the eClaims XML of the same claim. Decide the CF5's attachment URL now and put it in the eClaims XML, for example `<DOCUMENT pDocumentType="CF5" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF5.enc"/>`. Then the eClaims XML you validate is the one you upload.
2. Check each file locally against its DTD ([Validating XML locally](/guides/validating-xml)).
3. **Encrypt the CF5 and the eClaims XML separately with your cipher key and send both to `validateCF5` (this page).** Read the result, fix the errors, and repeat until there are none. Validate the eSOA with [validateeSOA](/api/validate-esoa).
4. Encrypt the **same** CF5 XML again, this time with PhilHealth's public key, and host the file at its HTTPS URL. Do the same for the other attachments.
5. Check the final eClaims XML, with the live attachment URLs, with [eClaimsFileCheck](/api/eclaims-file-check).
6. Upload it with [uploadeClaims](/api/upload-eclaims).
7. Store the `eRECEIPT`, with its Receipt Ticket Number (RTN) and Transmission Control Number (TCN).
8. Call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN.
:::

The DevKit doesn't say whether the eClaims XML you send here must already contain its final `DOCUMENTS` entries, or be identical to the file you upload later ([KI-62](/known-issues#ki-62)). Deciding the URLs in step 1 makes both true, so the question doesn't arise. If you change the eClaims XML after this call, validate the CF5 with it again.

As with the eSOA, the same CF5 file is encrypted **twice**: once with the cipher key for this call, and once with PhilHealth's public key for the attachment. The comparison table on [validateeSOA](/api/validate-esoa#two-encryptions-of-the-same-file) applies unchanged, including the open points about the attachment's `docMimeType` ([KI-57](/known-issues#ki-57)) and RSA padding ([KI-59](/known-issues#ki-59)). See also [Encryption overview](/guides/encryption/) and [KI-12](/known-issues#ki-12).

The certification form asks whether your system "display[s] warning errors and major errors" and "the CF5 validation result", and whether it can "upload and attach the encrypted CF5 XML data to the claim" ([SSVTF p. 10–11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)). The CF5 module may be certified jointly with, or separately from, the eSOA module ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)).

### Why the eClaims XML is part of the request

The Guide doesn't explain why `validateCF5` also needs the eClaims XML. The DRG error-code workbook gives strong hints. In its "Summary of Errors" sheet, an unlabeled column tags many codes as `eclaims` or `DRG`, and some messages refer to the eClaims XML directly ([`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)):

| Code | Workbook text | What it suggests |
|---|---|---|
| 102–110 | "Patient sex is required", "Patient date of birth is required", … "Time of birth is required for patient less than 28 days old", all tagged `eclaims` | Except for the admission weight, CF5 has none of these fields. The eClaims XML carries most of them (`CF1@pPatientSex`, `CF1@pPatientBirthDate`, and the `CF2` admission, discharge and disposition attributes). See the note on time of birth below. |
| 222 | "Claim number does not exist in eClaims XML" / "Claim number must exist in eClaims XML (pClaimNumber 'xml attribute')" | The CF5 `ClaimNumber` must match a `CLAIM@pClaimNumber` in the eClaims XML |
| 509 | "CF5 pHospitalCode not found in eClaims XML" / "CF5 pHospitalCode Value must be found in eClaims XML or equal to pHospitalCode Value eClaims.xml" | The CF5 `pHospitalCode` must equal `eCLAIMS@pHospitalCode` |

Our interpretation (not stated by PhilHealth): PhilHealth cross-checks the CF5 against the eClaims XML of the same claim and takes patient and confinement data from it. So send the eClaims XML of **the claim this CF5 belongs to**, with the same `pHospitalCode` and claim number.

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PECWS authentication token from [getToken](/api/get-token) | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |
| `Content-Type` | `application/json` | Not in the Guide. Recommendation (not from PhilHealth): send it, because the body is JSON. |

### Body

The body is a JSON object with two keys ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). Unlike most methods, the body itself is **not** an envelope; each value is one.

| Key | Value |
|---|---|
| `cf5` | "The CF5 XML text encrypted using cipher key of the HF" (HF = health facility): an envelope object |
| `eclaims` | "The e-Claims XML text encrypted using cipher key of the HF": an envelope object |

Each envelope has the usual keys: `docMimeType` (`"text/xml"`), `hash` (SHA-256 of that XML's UTF-8 bytes before encryption, [KI-60](/known-issues#ki-60)), `key1` (`""`), `key2` (`""`), `iv`, and `doc`. Encrypt the two XML documents **separately**, each with its own random initialization vector (IV). See [API payload encryption](/guides/encryption/api-payloads).

### What you build (1): the CF5 XML

```text
CF5                       pHospitalCode
└── DRGCLAIM              ClaimNumber, PrimaryCode, NewBornAdmWeight, Remarks
    ├── SECONDARYDIAGS
    │   └── SECONDARYDIAG*    SecondaryCode, Remarks
    └── PROCEDURES
        └── PROCEDURE*        RvsCode, Laterality, Ext1, Ext2, Remarks
```

The tree follows the standalone [`CF5.dtd`](/originals/cf5/CF5.dtd) (`*` = zero or more). The DTD printed in the Guide differs: it allows exactly one `SECONDARYDIAG` and one or more `PROCEDURE` ([KI-06](/known-issues#ki-06)). Key rules from Annex E ([Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)):

| Attribute | Type/length | Valid values |
|---|---|---|
| `CF5@pHospitalCode` | Varchar(6) | "A unique code assigned by PhilHealth to the health facility, also known as the PMCC No."; format `999999` or `X99999` ([KI-48](/known-issues#ki-48)) |
| `DRGCLAIM@PrimaryCode` | Varchar(15) | A valid ICD-10 code (exactly one primary diagnosis). The DRG manual that the CF5 form points to for valid codes is not in the DevKit ([KI-63](/known-issues#ki-63)). |
| `DRGCLAIM@NewBornAdmWeight` | Numeric(2,1) | Newborns 0–27 days old only; kilograms, format `##.#`, "greater than 0.3 kg". The CF5 form and error codes 228/418 accept exactly 0.3 ([KI-51](/known-issues#ki-51)) |
| `DRGCLAIM@ClaimNumber` | Varchar(13) | Format `9999999999999`. What the value should be is unclear; see the warning in [Notes and gotchas](#notes-and-gotchas) ([KI-45](/known-issues#ki-45)). |
| `SECONDARYDIAG@SecondaryCode` | Varchar(15) | Valid ICD-10 codes, up to 12 |
| `PROCEDURE@RvsCode` | Varchar(6) | Valid RVS codes, up to 20 |
| `PROCEDURE@Laterality` | Varchar(1) | `L`, `R`, `B`, or `N` (None) |
| `PROCEDURE@Ext1` | Numeric(1) | `1`–`9`: number of body sites. Both official samples send `""`; whether blank is accepted is not stated ([KI-63](/known-issues#ki-63)). |
| `PROCEDURE@Ext2` | Numeric(1) | `1`–`9`: number of times the procedure was done. Blank: as for `Ext1` ([KI-63](/known-issues#ki-63)). |
| `Remarks` (on `DRGCLAIM`, `SECONDARYDIAG` and `PROCEDURE`) | Varchar(2000) | "Logs for internal key per value validation" (Annex E lists "Internal logs" as the valid value) |

Full details: [CF5 XML reference](/reference/cf5-xml) and [Building CF5](/guides/cf5).

### What you build (2): the eClaims XML

This is the same eClaims XML you send to [uploadeClaims](/api/upload-eclaims): the final version, with the CF5's attachment URL already in `DOCUMENTS` (see [the submission order](#where-it-fits-the-submission-order)). See [eClaims XML reference](/reference/eclaims-xml) and the unofficial example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml). Our CF5 example [`cf5-sample.xml`](/examples/cf5-sample.xml) belongs to the same claim: both use `pHospitalCode` `123456` and claim number `202609170001`, and the eClaims example lists the CF5 at `https://files.samplehospital.example/eclaims/202609170001/CF5.enc`.

::: info How the examples were validated (KI-43, KI-06)
`eclaims-minimal.xml` is valid against `eClaimsDef.dtd` v1.9 when checked with Java 21 (JAXP) and with lxml using the patched DTD. Validators built on libxml2 (Python `lxml`, `xmllint`, PHP) can't check eClaims files correctly against the original DTD, because three of its content models are non-deterministic: libxml2 2.13 and later reject every file, and 2.9.x skips the checks inside those three elements ([KI-43](/known-issues#ki-43)). Use [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or the [patched DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2). The CF5 DTDs don't have this problem.

`cf5-sample.xml` (no secondary diagnosis, no procedure) is valid against the standalone `CF5.dtd` (checked with lxml), but not against the older CF5 DTD printed in the Guide ([KI-06](/known-issues#ki-06)). That is exactly the case KI-06 says to confirm with `validateCF5`.
:::

## Response

::: warning The response is not documented (KI-42)
The Validate CF5 section ([Guide p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) ends with the sample input payload. It has no Output table and no response sample, so the DevKit doesn't say what `validateCF5` returns, whether `result` is encrypted, or what a passing result looks like ([KI-42](/known-issues#ki-42)). The DevKit's [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx) lists CF5 and DRG error and warning codes, but no document says that `validateCF5` returns those codes, or in what format ([KI-36](/known-issues#ki-36)).
:::

This page therefore gives **no response schema**. Our assumption, not stated by PhilHealth: the response may follow the envelope (`success`, `message`, `result`) that every method with a documented output returns ([API overview](/api/)). The closely related [validateeSOA](/api/validate-esoa#response) returns a cipher-key-encrypted `result` that may decrypt to `{"errors": [...]}`, but `validateCF5` may differ. Write your parser for several shapes, as below.

::: tip Recommendation (not from PhilHealth): handle the response defensively
1. Store the whole response with the claim before you interpret it. If the reply isn't JSON at all, log it and show it as text.
2. If `success` is not `true`, show `message` and stop.
3. If `result` is an envelope object (or a JSON string of one), decrypt it with your cipher key, using `unseal` from the [shared client](/api/#shared-client-setup). If it is a plain string, use it as is.
4. Show the whole text to the user. If it happens to be JSON with an `errors` array, like the validateeSOA result, you can also list the entries one by one.
5. During certification testing, ask PhilHealth for a real sample of a failing and a passing response, and adjust your parser.
:::

The workbook groups its codes like this, which helps you design the display that the certification form requires ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)):

| Codes | Sheet | Kind |
|---|---|---|
| 101–110 | Claims Submission | Incomplete entries |
| 201–228 | Claims Submission | Invalid entries |
| 301–303 | Claims Submission | XML errors (unreadable file, missing required element, empty hospital code) |
| 401–409, 411–418 | DRG Grouper | Grouper errors, each mapped to a DRG code (`26509`, `26519` or `26539`) that no DevKit document explains ([KI-63](/known-issues#ki-63)) |
| 501–508 | Warning Codes | Warnings: the code "will be removed from the grouping logic" and grouping continues |
| 509, 511–518 | Summary of Errors | Cross-checks with the eClaims XML and with PhilHealth's databases ("eClaims DB", "CF5 DB", series number), a missing claim number, and date/time format errors |

See [DRG error codes](/reference/drg-error-codes) for the full list and its inconsistencies ([KI-36](/known-issues#ki-36)).

## Example

PhilHealth's unencrypted sample CF5 ([Guide p. 18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=18)). It is well-formed and valid against the standalone `CF5.dtd` (we checked with lxml), but some values are outdated or doubtful; see the notes after it.

```xml
<CF5
    pHospitalCode="300806">
  <DRGCLAIM
    ClaimNumber="300806-20221216-1-1"
    PrimaryCode="A00.0"
    NewBornAdmWeight=""
    Remarks="">
    <SECONDARYDIAGS>
      <SECONDARYDIAG
        SecondaryCode="A00.1"
        Remarks=""/>
    </SECONDARYDIAGS>
    <PROCEDURES>
      <PROCEDURE
        RvsCode=""
        Laterality=""
        Ext1=""
        Ext2=""
        Remarks=""/>
    </PROCEDURES>
  </DRGCLAIM>
</CF5>
```

- `Laterality=""` follows the old instruction. Since revision 20250217, the valid values are `L`, `R`, `B`, `N`; use `N` when laterality doesn't apply ([KI-05](/known-issues#ki-05)).
- `ClaimNumber="300806-20221216-1-1"` has 19 characters, but Annex E says Varchar(13), format `9999999999999` ([KI-31](/known-issues#ki-31), [KI-45](/known-issues#ki-45)).
- `RvsCode`, `Ext1` and `Ext2` are empty. Treat them as placeholders: Annex E asks for a valid RVS code, and it doesn't say whether blank extension codes are accepted ([KI-63](/known-issues#ki-63)).

For a CF5 built the way we recommend, see our unofficial [`cf5-sample.xml`](/examples/cf5-sample.xml). It is valid against the standalone `CF5.dtd`, but not against the CF5 DTD printed in the Guide, because it has no secondary diagnosis and no procedure ([KI-06](/known-issues#ki-06)). Send a file like it to `validateCF5` early.

**Request.** We added the HTTP framing and `Content-Type`; the JSON body is the Guide's "Sample Input Payload" ([Guide p. 18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=18)). The hashes and ciphertexts are placeholders ([KI-27](/known-issues#ki-27)); in the table on p. 16 the two sample hashes even have 60 and 62 characters instead of 64.

```http
POST /PHIC/Claims3.0/validateCF5 HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
  "cf5": {
    "docMimeType": "text/xml",
    "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591fac928f71a3841317e7a99aec",
    "key1": "",
    "key2": "",
    "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
    "doc": "PMs1FWFZT+odAp0qf2zMmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
  },
  "eclaims": {
    "docMimeType": "text/xml",
    "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591fac928f71a3841317e7a99aec",
    "key1": "",
    "key2": "",
    "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
    "doc": "PMs1FWFZT+odAp0qf2zMmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
  }
}
```

In the sample, both envelopes are identical. That can't happen with real data: the two XML documents differ, so their hashes differ, and each encryption should use a fresh random IV.

**Response:** no sample exists in the DevKit ([KI-42](/known-issues#ki-42)).

### Code: build the two-envelope body

Recommendation (not from PhilHealth): illustrative code. Uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs` / `pecws_client.py`). `pecwsPost` gets a fresh token and sends the plain JSON body; `seal` encrypts each XML with your cipher key and its own random IV; `unseal` decrypts an envelope and throws if its SHA-256 hash doesn't match. `saveValidationLog` / `save_validation_log` is your own function.

Because the response is undocumented ([KI-42](/known-issues#ki-42)), the code doesn't call `assertSuccess`, logs the whole response, and only decrypts `result` when it looks like an envelope. It doesn't assume any field inside the decrypted text.

::: code-group

```js [Node.js]
// Node.js 18+
import { pecwsPost, seal, unseal } from './pecws-client.mjs'

export async function validateCf5(cf5Xml, eclaimsXml) {
  const body = {
    cf5: seal(cf5Xml, 'text/xml'), // own random IV
    eclaims: seal(eclaimsXml, 'text/xml'), // the final eClaims XML you will upload (KI-62)
  }
  // Rejects on a network error, or if the reply can't be read as JSON: log and show that error.
  const response = await pecwsPost('validateCF5', body)
  saveValidationLog(JSON.stringify(response)) // undocumented response (KI-42): keep everything

  // Assumption (not documented): `result` may be a cipher-key envelope, as in
  // validateeSOA, a JSON string of one, or plain text.
  let result = response.result
  if (typeof result === 'string') {
    try { result = JSON.parse(result) } catch { /* plain text: keep it */ }
  }
  const resultText = result && typeof result === 'object' && 'iv' in result && 'doc' in result
    ? unseal(result) // throws if the hash doesn't match
    : typeof result === 'string' ? result : JSON.stringify(result ?? null)
  return { success: response.success, message: response.message, resultText }
}
```

```python [Python]
# Python 3.9+ with the `requests` package
import json

from pecws_client import pecws_post, seal, unseal


def validate_cf5(cf5_xml: str, eclaims_xml: str) -> dict:
    body = {
        "cf5": seal(cf5_xml, "text/xml"),  # own random IV
        "eclaims": seal(eclaims_xml, "text/xml"),  # the final eClaims XML you will upload (KI-62)
    }
    # Raises on a network error, or if the reply can't be read as JSON: log and show that error.
    response = pecws_post("validateCF5", body)
    save_validation_log(json.dumps(response))  # undocumented response (KI-42): keep everything

    # Assumption (not documented): `result` may be a cipher-key envelope, as in
    # validateeSOA, a JSON string of one, or plain text.
    result = response.get("result")
    if isinstance(result, str):
        try:
            result = json.loads(result)
        except ValueError:
            pass  # plain text: keep it
    if isinstance(result, dict) and "iv" in result and "doc" in result:
        result_text = unseal(result)  # raises if the hash doesn't match
    else:
        result_text = result if isinstance(result, str) else json.dumps(result)
    return {"success": response.get("success"), "message": response.get("message"),
            "result_text": result_text}
```

:::

We ran both functions against a mock server that returned `result` as an envelope, as a JSON string of an envelope, and as plain text. Show `resultText` / `result_text` and `message` to the user, and classify any codes you recognize with the [DRG error codes](/reference/drg-error-codes).

## Notes and gotchas

::: warning Which claim number goes in `ClaimNumber`? (KI-45)
The sources disagree ([KI-45](/known-issues#ki-45)):

- Annex E describes `ClaimNumber` as "a reference number assigned to the claim upon successful submission of claim via eClaims API", Varchar(13), format `9999999999999` ([Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). That reads like a number you only get after upload, which is hard to reconcile with attaching the CF5 at upload time.
- Error code 222 in the DRG workbook says the claim number "must exist in eClaims XML (pClaimNumber 'xml attribute')", that is, your own `CLAIM@pClaimNumber`.
- Other workbook codes point to PhilHealth's databases instead: 512 "CF5 ClaimNumber not found in eClaims DB", 513 "CF5 ClaimNumber is already exist in CF5 DB with same series number", and 514 "Series Number not found in eClaims DB" (sheet "Summary of Errors", no solution text). They suggest that at least some checks look up a claim that PhilHealth already has, but the workbook doesn't say when these codes apply.
- The samples use `300806-20221216-1-1` (Guide) and `2601` ([`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml)). Neither matches the 13-digit format ([KI-31](/known-issues#ki-31)). The Guide's value has the same shape as the hospital-generated `pClaimNumber` in the Guide's eClaims sample (`123456-20160930-2`, [Guide p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)).

Recommendation (not from PhilHealth): use the same value as `CLAIM@pClaimNumber` in the eClaims XML you send in `eclaims`, check the result of `validateCF5`, and confirm the rule with PhilHealth. Our examples use `202609170001` in both files: 12 digits, which fits Annex C's String(12) and Annex E's all-digit Varchar(13).
:::

- **Two CF5 DTDs.** The Guide prints "DRG E-Claims DTD v1.3 (2024-02-15)"; the standalone `CF5.dtd` and the 20240604 PDF are newer and match the "up to 12" and "up to 20" rules. We recommend the standalone DTD and letting `validateCF5` confirm ([KI-06](/known-issues#ki-06)).
- **Which version of the eClaims XML?** The DevKit doesn't say whether the eClaims XML you send here must already contain its final `DOCUMENTS` entries, including the one for the CF5, or be identical to the file you upload ([KI-62](/known-issues#ki-62)). Recommendation (not from PhilHealth): decide the CF5 attachment URL before you validate, as in step 1 of the [submission order](#where-it-fits-the-submission-order) and [Building CF5, step 4](/guides/cf5#step-4-call-validatecf5), and send the exact eClaims XML you will upload. Confirm with PhilHealth.
- **Codes you can't check locally.** The CF5 form points to "PhilHealth's DRG Manual" for valid ICD-10 and RVS codes and to the "DRG Implementation Manual" for extension-code rules. Neither is in the DevKit, so `validateCF5` is your only code check ([KI-63](/known-issues#ki-63)).
- **`pHospitalCode` must match.** Workbook code 509 says the CF5 `pHospitalCode` must equal the eClaims `pHospitalCode`. Note the length difference: CF5 allows Varchar(6), eClaims String(12) ([KI-31](/known-issues#ki-31)). The DevKit calls the CF5 value the "PMCC No." and never says which facility identifier each method expects ([KI-48](/known-issues#ki-48)).
- **Newborn weight of exactly 0.3 kg.** Annex E says "greater than 0.3 kg"; the CF5 form and codes 228/418 accept 0.3. Recommendation (not from PhilHealth): accept 0.3 and above with one decimal place, and let `validateCF5` decide ([KI-51](/known-issues#ki-51)).
- **Time of birth has no home.** Workbook code 110 says "Time of birth is required for patient less than 28 days old". But the 20240604 CF5 amendment says "Remove the attributes of NewBornTimeOfBirth from CF5 XML" ([20240604 PDF, p. 1](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=1)), and [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) has no patient time-of-birth attribute either ([KI-36](/known-issues#ki-36)). If you see this error for a newborn, ask PhilHealth where the value should go.
- **No repeated diagnoses.** The certification form checks that there are "no repeated codes across all the secondary diagnosis and with the primary diagnosis" ([SSVTF p. 7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)). The workbook's warnings 502 and 503 say such codes are dropped from grouping.
- **Attach under `CF5`.** Annex B code `CF5` is "Electronic Claim Form 5 (for DRG Shadow Billing)". Attach the public-key-encrypted file, not the cipher-key envelope from this call ([KI-12](/known-issues#ki-12)).
- **Attach exactly the bytes you validated.** PhilHealth's Stage 2 check compares the decrypted file with the raw CF5 XML ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)). If you edit the CF5, validate it again.
- **Short-lived token, unknown host.** Get a fresh token right before the call; the shared client does this for every call ([KI-26](/known-issues#ki-26)). The host name comes from PhilHealth; set it in `PECWS_BASE_URL` ([KI-30](/known-issues#ki-30)).
- **Shadow billing rules.** The DevKit doesn't say which health facilities must take part in DRG shadow billing, or how the CF5 paper form's patient consent and physician certification (Parts II and III) are handled electronically; the XML carries only Part I ([KI-63](/known-issues#ki-63)).

### Common mistakes

1. Sending only the CF5, or wrapping both XML documents in one envelope. The body needs two separate envelopes under `cf5` and `eclaims`.
2. Sending an eClaims XML from a different claim, or one whose `pHospitalCode` or `pClaimNumber` doesn't match the CF5.
3. Leaving `Laterality` blank. Use `N` when laterality doesn't apply ([KI-05](/known-issues#ki-05)).
4. Repeating the primary diagnosis among the secondary diagnoses, or sending more than 12 secondary diagnoses or 20 procedures.
5. Assuming a response format. Nothing is documented ([KI-42](/known-issues#ki-42)), so log the raw response and parse defensively.
6. Encrypting the two XML documents with PhilHealth's public key. This call uses your cipher key; the public key is only for the attachment ([KI-12](/known-issues#ki-12)).
7. Validating with a draft eClaims XML, then changing it (for example its attachment URLs) before the upload without validating again ([KI-62](/known-issues#ki-62)).

## Related pages

- [Building CF5 (DRG)](/guides/cf5) and [CF5 XML reference](/reference/cf5-xml)
- [DRG error codes](/reference/drg-error-codes)
- [validateeSOA](/api/validate-esoa): the same pattern for the eSOA, with the encryption comparison table
- [eClaims XML reference](/reference/eclaims-xml)
- [Encryption overview](/guides/encryption/), [API payload encryption](/guides/encryption/api-payloads), [Attachment encryption](/guides/encryption/attachments)
- [uploadeClaims](/api/upload-eclaims) and [Document type codes](/reference/document-types)
- Known issues: [KI-05](/known-issues#ki-05), [KI-06](/known-issues#ki-06), [KI-12](/known-issues#ki-12), [KI-31](/known-issues#ki-31), [KI-36](/known-issues#ki-36), [KI-42](/known-issues#ki-42), [KI-43](/known-issues#ki-43), [KI-45](/known-issues#ki-45), [KI-48](/known-issues#ki-48), [KI-51](/known-issues#ki-51), [KI-57](/known-issues#ki-57), [KI-59](/known-issues#ki-59), [KI-62](/known-issues#ki-62), [KI-63](/known-issues#ki-63)
