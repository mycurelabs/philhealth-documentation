---
title: validateeSOA
description: Ask PhilHealth to check an electronic Statement of Account (eSOA) XML file before you attach it to a claim.
---

# validateeSOA

Asks the PhilHealth e-Claims Web Service (PECWS) to check an electronic Statement of Account (eSOA) XML file before you attach it to a claim.

<Badge type="tip" text="Current" />

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/validateeSOA` |
| **Auth header** | `token`, from [getToken](/api/get-token) |
| **Request body** | The eSOA XML, encrypted with your facility's **cipher key** (standard encrypted envelope, `key1` and `key2` empty) |
| **Response `result`** | An envelope encrypted with the cipher key. Decrypted, it "may contain" a JSON object `{"errors": [...]}` |

::: tip TL;DR
1. Build the eSOA XML from `ESOA.dtd` v0.5 and check it locally against the DTD.
2. Encrypt it with your **cipher key** and `POST` it here. The method checks the file against PhilHealth's Document Type Definition (DTD) and valid values. It does **not** submit the eSOA.
3. Decrypt `result`, parse it as JSON, and show every string in `errors`. Fix and repeat until there are none.
4. Encrypt the **same** eSOA XML a second time, with **PhilHealth's public key**, host it at an HTTPS URL, and list it in the eClaims XML under document type `ESA`.
5. Continue with the [submission order](#where-it-fits-the-submission-order): eClaimsFileCheck, then uploadeClaims.
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 9–15: Validate eSOA Method, eSOA DTD, samples](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)
- [Implementation Guide, p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, p. 77–78: Annex B, document type codes (`ESA`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)
- [Implementation Guide, p. 85: Annex C, `pDocumentURL`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)
- [`ESOA.dtd` (v0.5, 2025-02-17)](/originals/esoa/ESOA.dtd)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14)](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [PhilHealth Circular 2023-0026, p. 4: section V.N](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)
- [Software Solution Validation Test Form (SSVTF), p. 9–13: eSOA process, controls, and decryption checks](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)

"Annex A" to "Annex D" on this page are the Guide's annexes ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).
:::

## When to use it

The eSOA is the patient's hospital bill in XML. PhilHealth Circular (PC) 2023-0026 says a complete SOA submission in XML "should reflect three (3) major components: the summary of fees, professional and reader's fees, and the itemized charges", and that "PhilHealth shall return to the HF any claim that lacks any of the three (3) major components" ([PC 2023-0026, p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)). HF means health facility; other PhilHealth terms are explained in the [Glossary](/getting-started/glossary).

Call `validateeSOA` every time you generate or change an eSOA, **before** you attach it to a claim. The Guide describes the full flow in an "Important Note" ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)):

> After successful validation, the eSOA XML must be encrypted using the PhilHealth Public Key and submitted as an attachment to electronic claims through the EclaimsUpload method, with the Document Type set to ESA.

"EclaimsUpload" is the Guide's informal name for the [`uploadeClaims`](/api/upload-eclaims) endpoint ([KI-09](/known-issues#ki-09)).

### Where it fits: the submission order

::: tip Recommendation (not from PhilHealth): submission order
This site uses one order for every claim. The eSOA-specific work is in steps 1–4:

1. Build the XML files: the eSOA (`ESOA.dtd` v0.5), the other XML attachments, and the eClaims XML with a `DOCUMENT` entry for each attachment, for example `<DOCUMENT pDocumentType="ESA" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/ESA.enc"/>`.
2. Check each file locally against its DTD ([Validating XML locally](/guides/validating-xml)).
3. **Encrypt the eSOA with your cipher key and send it to `validateeSOA` (this page).** Decrypt the result, fix the errors, and repeat until there are none. Validate the CF5 with [validateCF5](/api/validate-cf5).
4. Encrypt the **same** eSOA XML again, this time with PhilHealth's public key, and host the file at its HTTPS URL. Do the same for the other attachments.
5. Check the final eClaims XML, with the live attachment URLs, with [eClaimsFileCheck](/api/eclaims-file-check).
6. Upload it with [uploadeClaims](/api/upload-eclaims).
7. Store the `eRECEIPT`, with its Receipt Ticket Number (RTN) and Transmission Control Number (TCN).
8. Call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN.
:::

The attachment rules in steps 1 and 4 come from Annex C: `pDocumentURL` is the "URL of the document accessible via https", and "the document must first be encrypted using philhealth public key before publishing online" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)).

The certification test form checks this flow. It asks whether your system displays "warning errors and major errors" and "the eSOA validation result", and whether it can "upload and attach the encrypted eSOA XML data to the claim" ([SSVTF p. 10–11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)).

### Two encryptions of the same file

This is the easiest part to get wrong. You encrypt the same eSOA XML **twice**, with two different schemes, for two different purposes ([KI-12](/known-issues#ki-12)):

| | Step 3: the `validateeSOA` request body | Step 4: the `ESA` attachment |
|---|---|---|
| Purpose | Let PhilHealth check the XML now | Deliver the eSOA as part of the claim |
| Key | The **cipher key** PhilHealth issued to your facility | A random 32-byte password, protected with **PhilHealth's public key** (RSA public-key encryption; the padding isn't named, and both demo kits use PKCS#1 v1.5, [KI-59](/known-issues#ki-59)) |
| `docMimeType` | `text/xml` ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)) | Not specified for XML attachments; this site uses `text/xml` ([KI-57](/known-issues#ki-57)) |
| `key1`, `key2` | `""` (empty strings) | Base64 of the RSA-encrypted halves of the password |
| `iv` | Base64 of the random 16-byte initialization vector (IV) | Base64 of the RSA-encrypted IV |
| How it travels | JSON body of this `POST` | A file on your HTTPS server, referenced by `DOCUMENT@pDocumentURL` |
| Who can decrypt it | You and PhilHealth | Only PhilHealth ([migration dictionary, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)) |
| Source | [Guide p. 9, 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) | [Attachment guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) |

Why two schemes? `validateeSOA` is an ordinary API call, and the Guide requires its body to be encrypted with the cipher key (Annex A describes that scheme). The attachment is different: it is a file that PhilHealth downloads later from your server, and Annex C requires every such file to be "encrypted using philhealth public key before publishing online" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). See [Encryption overview](/guides/encryption/) for the full explanation.

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PECWS authentication token from [getToken](/api/get-token) | [Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) |
| `Content-Type` | `application/json` | Not in the Guide ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send it, because the body is JSON. |

### What you build: the eSOA XML

The plain (unencrypted) content is an eSOA XML document that follows [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5:

```text
eSOA                        pHciPan, pHciTransmittalId
├── SummaryOfFees
│   ├── RoomAndBoard             SummaryOfFee, OtherFundSource*
│   ├── DrugsAndMedicine         SummaryOfFee, OtherFundSource*
│   ├── LaboratoryAndDiagnostic  SummaryOfFee, OtherFundSource*
│   ├── OperatingRoomFees        SummaryOfFee, OtherFundSource*
│   ├── MedicalSupplies          SummaryOfFee, OtherFundSource*
│   ├── Others                   SummaryOfFee, OtherFundSource*
│   ├── PhilHealth               pTotalCaseRateAmount
│   └── Balance                  pAmount
├── ProfessionalFees
│   ├── ProfessionalFee*         ProfessionalInfo, SummaryOfFee
│   ├── PhilHealth
│   └── Balance
└── ItemizedBillingItems
    └── ItemizedBillingItem+     pServiceDate, pItemCode, pItemName, pUnitOfMeasurement,
                                 pUnitPrice, pQuantity, pTotalAmount, pCategory
```

`*` means zero or more; `+` means one or more. Every element and attribute is explained on [eSOA XML reference](/reference/esoa-xml), and [Building the eSOA](/guides/esoa) walks through the business rules.

### What you send: the encrypted envelope

Encrypt the eSOA XML with your cipher key, as described in [API payload encryption](/guides/encryption/api-payloads). The request body is this JSON object ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)):

| Key | Value |
|---|---|
| `docMimeType` | `"text/xml"` |
| `hash` | SHA-256 hash of the unencrypted eSOA XML bytes (Annex A). The request sample and both demo kits use a 64-character lowercase hex string. Encode the XML as UTF-8 before you hash and encrypt it ([KI-60](/known-issues#ki-60)). |
| `key1` | `""` (empty string) |
| `key2` | `""` (empty string) |
| `iv` | The initialization vector: 16 random bytes, Base64-encoded |
| `doc` | The eSOA XML encrypted with AES-256-CBC using your cipher key, Base64-encoded |

## Response

The response is a JSON object ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)):

| Key | Value |
|---|---|
| `success` | `true` when the call succeeded |
| `message` | The error message, if the method hit an error |
| `result` | An encrypted envelope (`docMimeType`, `hash`, `key1`, `key2`, `iv`, `doc`), encrypted with your cipher key. In the sample it is a JSON object, not a string. |

### The decrypted `result`

The Guide says only this about the decrypted content: "When decrypted, it may contains a response JSON object containing the error details. An array of errors as shown below" ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)):

```json
{
  "errors": [
    "string1",
    "string2",
    "string3"
  ]
}
```

| Key | Type | Description |
|---|---|---|
| `errors` | array of strings | One message per problem found in your eSOA |

::: warning The Guide doesn't show a passing result
The Guide documents only the error shape. It doesn't show what the decrypted `result` looks like when the eSOA is valid: an empty `errors` array, no `errors` key, or something else ([KI-53](/known-issues#ki-53), [KI-42](/known-issues#ki-42)). The result table also describes `doc` as "the result of the encryption of eSOA XML text", which is copied from the request table ([KI-47](/known-issues#ki-47)). The decrypted result is PhilHealth's validation response, not your eSOA.
:::

::: tip Recommendation (not from PhilHealth): how to read the response
1. If the HTTP call fails, or `success` is not `true`, the validation did not run. Show `message`. Get a fresh token before you retry ([KI-26](/known-issues#ki-26)); the shared client does this for every call. The Guide describes this call only as a check, so a retry should be harmless.
2. If `success` is `true`, decrypt `result` and parse it as JSON.
3. If `errors` is a non-empty array, the eSOA is invalid. Show **every** string to the user. The certification form expects your system to display the validation result ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)).
4. If `errors` is missing or empty, treat the eSOA as passed.
5. If the decrypted text isn't JSON, treat the result as unknown. Log it and don't attach the eSOA yet.
6. Always store the decrypted text with the claim, for audit and support.
:::

## Example

These are PhilHealth's samples ([Guide p. 15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=15)). The hashes and ciphertexts are placeholders, not real encryption output ([KI-27](/known-issues#ki-27)). For example, the response `hash` has only 31 hex characters; a real SHA-256 hash has 64.

**Request.** We added the `Content-Type` header and the HTTP framing; the JSON body is the Guide's sample.

```http
POST /PHIC/Claims3.0/validateeSOA HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
   "docMimeType": "text/xml",
   "hash": "dfe701c0c9bbca0678300540591fac928f7dc8f4d74d9771a3841317e7a99aec",
   "key1": "",
   "key2": "",
   "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
   "doc": "PMs1FWFZT+odAp0qf2zMmroSUr3lYgDFnhYeJqBkuhJNMJU5geSEN=="
}
```

**Response:**

```json
{
    "message": "",
    "result": {
        "doc": "tlb2b2NF4PeAS1VoVOX3xIk/GMyBOs/bR6C56VUG2f2XhkA==",
        "docMimeType": "text/xml",
        "hash": "91cb1c3361f70f56ad5df326a000f5c",
        "iv": "oW/4PLliOnwgPNax1d6QWQ==",
        "key1": "",
        "key2": ""
    },
    "success": true
}
```

**Decrypted `result` when the eSOA has errors** ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)): see the `errors` object above.

The full unencrypted sample eSOA is on [Guide p. 12–15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12). Its amounts don't add up, and one item code has a leading space (`" 1898"`), so don't copy its values ([KI-34](/known-issues#ki-34)).

### Code: validate, then encrypt for the attachment

Recommendation (not from PhilHealth): the code below is illustrative. Uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs` / `pecws_client.py`) for the `validateeSOA` call: `pecwsPost` gets a fresh token, `seal` encrypts with your cipher key, `assertSuccess` throws with PhilHealth's `message` when `success` isn't `true`, and `unseal` decrypts `result` and checks its hash. The attachment step uses the unofficial example module [`encrypt-attachment.mjs`](/examples/encryption/encrypt-attachment.mjs) / [`encrypt_attachment.py`](/examples/encryption/encrypt_attachment.py), explained on [Attachment encryption](/guides/encryption/attachments). Save it in the same folder as the shared client and its payload module. `saveValidationLog` / `save_validation_log` is your own function.

The code keeps the eSOA as **one string** and encrypts the same UTF-8 bytes twice ([KI-60](/known-issues#ki-60)): `seal` for the check, `encryptAttachment` for the attachment. The DevKit doesn't give a `docMimeType` for XML attachments, so the attachment uses `text/xml` ([KI-57](/known-issues#ki-57)). It also doesn't name the RSA padding; the example module uses PKCS#1 v1.5, like both demo kits ([KI-59](/known-issues#ki-59)).

::: code-group

```js [Node.js]
// Node.js 18+. Keep pecws-client.mjs, payload-crypto.mjs and encrypt-attachment.mjs
// in the same folder as this file.
import { readFileSync } from 'node:fs'
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'
import { encryptAttachment, loadPhilHealthPublicKey } from './encrypt-attachment.mjs'

async function validateEsoa(esoaXml) {
  // Throws if success !== true: the validation did not run.
  const env = assertSuccess(await pecwsPost('validateeSOA', seal(esoaXml, 'text/xml')))
  const text = unseal(env.result) // throws if the hash doesn't match
  const parsed = JSON.parse(text) // throws if not JSON: log `text` and investigate
  return { errors: parsed.errors ?? [], raw: text }
}

const esoaXml = readFileSync('esoa.xml', 'utf8') // or the string your eSOA builder returns
const { errors, raw } = await validateEsoa(esoaXml)
saveValidationLog('202609170001', raw) // your code: keep the decrypted response with the claim
if (errors.length > 0) {
  errors.forEach((e) => console.log('eSOA error:', e))
} else {
  // Same XML, second encryption: PhilHealth's public key this time (KI-12).
  // Use the current certificate from PhilHealth; the DevKit's copy has expired (KI-01).
  const PHILHEALTH_CERT_PEM = readFileSync('philhealth-cert.pem', 'utf8')
  const attachment = encryptAttachment(
    Buffer.from(esoaXml, 'utf8'), // the same bytes that seal() encrypted
    'text/xml', // XML attachment MIME type is not specified (KI-57)
    loadPhilHealthPublicKey(PHILHEALTH_CERT_PEM),
  )
  // Publish JSON.stringify(attachment) at, for example,
  // https://files.samplehospital.example/eclaims/202609170001/ESA.enc
  // and list that URL with pDocumentType="ESA" in the eClaims XML.
}
```

```python [Python]
# Python 3.9+ with `requests` and `cryptography`. Keep pecws_client.py,
# payload_crypto.py and encrypt_attachment.py in the same folder as this file.
import json

from encrypt_attachment import encrypt_attachment, load_philhealth_public_key
from pecws_client import assert_success, pecws_post, seal, unseal


def validate_esoa(esoa_xml: str) -> tuple[list, str]:
    # Raises if success is not True: the validation did not run.
    env = assert_success(pecws_post("validateeSOA", seal(esoa_xml, "text/xml")))
    text = unseal(env["result"])  # raises if the hash doesn't match
    parsed = json.loads(text)  # raises if not JSON: log `text` and investigate
    return parsed.get("errors") or [], text


# newline="" keeps the file's line endings unchanged
with open("esoa.xml", encoding="utf-8", newline="") as f:
    esoa_xml = f.read()  # or the string your eSOA builder returns

errors, raw = validate_esoa(esoa_xml)
save_validation_log("202609170001", raw)  # your code: keep the decrypted response with the claim
if errors:
    for e in errors:
        print("eSOA error:", e)
else:
    # Same XML, second encryption: PhilHealth's public key this time (KI-12).
    # Use the current certificate from PhilHealth; the DevKit's copy has expired (KI-01).
    with open("philhealth-cert.pem", "rb") as f:
        PHILHEALTH_CERT_PEM = f.read()
    attachment = encrypt_attachment(
        esoa_xml.encode("utf-8"),  # the same bytes that seal() encrypted
        "text/xml",  # XML attachment MIME type is not specified (KI-57)
        load_philhealth_public_key(PHILHEALTH_CERT_PEM),
    )
    # Publish json.dumps(attachment) at, for example,
    # https://files.samplehospital.example/eclaims/202609170001/ESA.enc
    # and list that URL with pDocumentType="ESA" in the eClaims XML.
```

:::

## Notes and gotchas

::: danger Don't mix up the two encryptions
Send the **cipher-key** envelope to `validateeSOA`. Attach the **public-key** envelope to the claim. The Guide requires exactly this split ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)), so don't reuse one envelope for both jobs ([KI-12](/known-issues#ki-12)). The public key file in the DevKit is an expired **test** certificate, so get the current certificate from PhilHealth ([KI-01](/known-issues#ki-01)).
:::

- **Use the document type `ESA`, not `SOA`.** Annex B lists both: `SOA` is "Statement of Account" and `ESA` is "Electronic Statement of Account (eSOA)" ([Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)). The eSOA XML goes under `ESA`.
- **Attach exactly the bytes you validated.** Recommendation (not from PhilHealth): don't reformat, re-round, or regenerate the eSOA between validation and encryption. PhilHealth's Stage 2 certification check compares the decrypted file with the raw eSOA XML ([SSVTF p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). If you change the eSOA, validate it again.
- **Use the DTD spelling.** XML is case-sensitive. The attribute is `pChargesNetOfApplicableVat` (it replaced `pActualCharges` in DTD v0.4), and the `Others` category exists only since DTD v0.5 ([KI-04](/known-issues#ki-04)). Annex D spells several names differently from the DTD; follow the DTD ([KI-33](/known-issues#ki-33)).
- **`docMimeType` says `text/xml`, but the decrypted result is JSON.** Parse the result as JSON regardless of `docMimeType` ([KI-25](/known-issues#ki-25)).
- **Tokens are short-lived.** The `getToken` sample says "Token is valid for 20 seconds". Get a fresh token right before the call; the shared client does this for every call ([KI-26](/known-issues#ki-26)).
- **The host name is not in the DevKit.** Get the test and production hosts from PhilHealth, and keep them in configuration (`PECWS_BASE_URL`) ([KI-30](/known-issues#ki-30)).
- **`pHasAttachedSOA` is not linked to `ESA`.** The eClaims `CF2` element has an optional `pHasAttachedSOA` (`Y`/`N`) attribute. The DevKit doesn't say whether attaching an `ESA` document means you must set it to `Y` ([KI-62](/known-issues#ki-62)), and Annex C even describes the attribute as "Type of Accommodation" ([KI-32](/known-issues#ki-32)). Our example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) sets `Y`. Confirm with PhilHealth.
- **The attachment's `docMimeType` and RSA padding are not specified.** This site uses `text/xml` for XML attachments ([KI-57](/known-issues#ki-57)) and RSA PKCS#1 v1.5, like both demo kits ([KI-59](/known-issues#ki-59)). Confirm both with PhilHealth before certification.
- **Validate locally first.** A local DTD check catches structural errors before you spend a network call. See [Validating XML locally](/guides/validating-xml). The eSOA DTD works with every common validator; only the eClaims and migration DTDs cause trouble ([KI-43](/known-issues#ki-43)).

### Common mistakes

1. Treating `success: true` as "the eSOA is valid". `success` only says the call ran. Decrypt `result` and check `errors`.
2. Filling `key1` and `key2` in the request. For cipher-key payloads they must be empty strings.
3. Attaching the eSOA under `SOA` instead of `ESA`.
4. Editing the eSOA after it passed validation and attaching the edited version without validating again.
5. Using `pActualCharges` or the data-dictionary capitalization (`PChargesNetOfApplicableVat`) instead of the DTD names.

## Related pages

- [Building the eSOA](/guides/esoa) and [eSOA XML reference](/reference/esoa-xml)
- [eSOA libraries](/reference/libraries/esoa): item and medicine codes
- [Encryption overview](/guides/encryption/), [API payload encryption](/guides/encryption/api-payloads), [Attachment encryption](/guides/encryption/attachments)
- [uploadeClaims](/api/upload-eclaims): where the `ESA` attachment is submitted
- [Document type codes](/reference/document-types)
- [validateCF5](/api/validate-cf5): the same pattern for Claim Form 5
- [Known issues](/known-issues)
