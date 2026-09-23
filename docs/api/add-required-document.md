---
title: addRequiredDocument
description: Add supporting documents to a claim that PhilHealth returned to the hospital (Return-To-Hospital, RTH).
---

# addRequiredDocument

Adds supporting documents to a claim that PhilHealth returned to the hospital (Return-To-Hospital, RTH), through the PhilHealth e-Claims Web Service (PECWS).

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/addRequiredDocument` |
| **Auth header** | `token`, from [getToken](/api/get-token) |
| **Request body** | Raw JSON: `pSeriesLhioNo` (plain string) and `pXML` (an encrypted envelope, `key1`/`key2` empty, holding a `<DOCUMENTS>` XML list) |
| **Response `result`** | Only two failure texts are documented: "Claims has already been paid" and "Claims has already been denied". The success result is not documented ([KI-29](/known-issues#ki-29)). |

::: tip TL;DR
1. Get the claim's PhilHealth claim series number (`pClaimSeriesLhio`) from [getUploadedClaimsMap](/api/get-uploaded-claims-map) and send it as `pSeriesLhioNo`.
2. Encrypt each missing file with **PhilHealth's public key** and host it at an HTTPS URL.
3. List the files in a `<DOCUMENTS>` XML, encrypt only that XML with your **cipher key**, and send it as `pXML`. The rest of the body is plain JSON.
4. Recommendation (not from PhilHealth): treat "Claims has already been paid" and "Claims has already been denied" as failures; otherwise `success: true` means accepted. Log the full response.
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 42–43: Add Required Document Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)
- [Implementation Guide, p. 3: revision history (20240423 added; 20241111 "body should be a raw JSON")](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 6: Introduction ("Return-to-Hospital" claims)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)
- [Implementation Guide, p. 53–54: Get Uploaded Claims Map Method (`pClaimSeriesLhio`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)
- [Implementation Guide, p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, p. 77–79, 85: Annex B document types; Annex C `pClaimSeriesLhio`, `pDocumentType`, `pDocumentURL`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)
- [`eClaimsDef.dtd` (v1.9): `DOCUMENTS`, `DOCUMENT`](/originals/eclaims-xml/eClaimsDef.dtd)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14)](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [Software Solution Validation Test Form (SSVTF), p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)

"Annex A" to "Annex C" on this page are the Guide's annexes ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).
:::

## When to use it

The Guide's description ([Guide p. 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)):

> This method allows the addition of required documents in compliance with RTH claims.

RTH means **Return-To-Hospital**: a claim that PhilHealth sends back to the health facility, for example because something is missing. The Guide's introduction names "high numbers of 'Return-to-Hospital' claims" as a problem of the earlier eClaims process ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). One documented reason for a return: "PhilHealth shall return to the HF [health facility] any claim that lacks any of the three (3) major components of the SOA [Statement of Account]" ([PC 2023-0026, p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)). See also the [Glossary](/getting-started/glossary).

Use `addRequiredDocument` to supply the missing documents for such a claim **without uploading the claim again**. The certification form requires it: "Does the system provide an interface and notification for submitting additional documents for RTH claims?" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

::: warning How do you learn that a claim was returned, and what it needs?
The DevKit doesn't say. The [getClaimStatus](/api/get-claim-status) sample shows only the status `IN PROCESS`, and no list of status values or return reasons is given ([KI-42](/known-issues#ki-42)). Annex B lists the document type codes, but nothing says which documents each benefit or claim type requires ([KI-62](/known-issues#ki-62)). Ask PhilHealth how RTH claims and their missing requirements are communicated.
:::

The flow:

```text
1. Claim uploaded earlier with uploadeClaims            -> eRECEIPT (pReceiptTicketNumber)
2. getUploadedClaimsMap(receiptTicketNumber)             -> pClaimSeriesLhio of each claim
3. PhilHealth returns the claim to the hospital (RTH)
4. Encrypt each missing file with PHILHEALTH'S PUBLIC KEY and host it at an HTTPS URL
5. Build <DOCUMENTS> XML listing the new files; encrypt it with your CIPHER KEY
6. POST addRequiredDocument {"pSeriesLhioNo": <series no.>, "pXML": <envelope>}
```

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PECWS authentication token from [getToken](/api/get-token) | [Guide p. 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42) |
| `Content-Type` | `application/json` | Not in the Guide ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send it, because the body is JSON. |

### Body

"JSON object containing the following key-value pairs" ([Guide p. 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)). Revision 20241111 adds: "The body should be a raw JSON" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). Our reading: send this JSON object directly as the body; unlike uploadeClaims, the body as a whole is **not** encrypted. Only `pXML` is.

| Key | Type | Value |
|---|---|---|
| `pSeriesLhioNo` | string | "Series Lhio Number": the PhilHealth claim series number of the returned claim. See below. |
| `pXML` | object | "JSON Object list of documents to be added to the claim submitted": an encrypted envelope whose `doc` is "the encrypted text of the XML object containing the document type and document URL" |

**Where `pSeriesLhioNo` comes from.** The Guide says only "Series Lhio Number". Other parts of the DevKit identify it:

- Annex C defines `pClaimSeriesLhio`, String(15): "Philhealth Generated and Assigned Unique Number per Claim… This will be returned after the claim are uploaded to Philhealth" ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).
- [getUploadedClaimsMap](/api/get-uploaded-claims-map) returns it per claim, for example `"pClaimSeriesLhio": "090801990000199"` in the Guide's sample ([Guide p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)).
- The data-migration dictionary says this 15-digit number "enables the new service provider to process return-to-hospital (RTH) claims" ([migration dictionary, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

Our reading of these sources: use the `pClaimSeriesLhio` value you stored from getUploadedClaimsMap. It is **not** your own `pClaimNumber`, and not the receipt ticket number.

**The `pXML` envelope** uses the same keys as every cipher-key payload ([Guide p. 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)):

| Key | Value |
|---|---|
| `docMimeType` | `"text/xml"` |
| `hash` | SHA-256 hash of the unencrypted `<DOCUMENTS>` XML |
| `key1` | `""` (empty string) |
| `key2` | `""` (empty string) |
| `iv` | The initialization vector (IV): 16 random bytes, Base64-encoded |
| `doc` | The `<DOCUMENTS>` XML, encrypted and Base64-encoded |

::: warning Which key encrypts `pXML` is not stated
The Guide doesn't name the key for `pXML`. Our inference (not stated by PhilHealth): empty `key1` and `key2` are the signature of the cipher-key scheme in Annex A, so encrypt `pXML` with your facility's cipher key, exactly as in [API payload encryption](/guides/encryption/api-payloads). Confirm with PhilHealth if the call fails.
:::

### What you build: the `<DOCUMENTS>` XML

The plain content of `pXML` is a `DOCUMENTS` element with one `DOCUMENT` per file. It uses the same elements as the end of the eClaims XML ([`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd): `DOCUMENTS (DOCUMENT+)`, both attributes required). The Guide's sample ([Guide p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)) validates against those declarations (we checked with lxml):

```xml
<DOCUMENTS>
        <DOCUMENT pDocumentType="CF1" pDocumentURL="http://sample/file/other/cf1.pdf"/>
        <DOCUMENT pDocumentType="CF2" pDocumentURL="http://sample/file/other/cf2.pdf"/>
        <DOCUMENT pDocumentType="OPR" pDocumentURL="http://sample/file/other/opr.pdf"/>
</DOCUMENTS>
```

| Attribute | Rule | Source |
|---|---|---|
| `pDocumentType` | String(3). A code from Annex B, for example `CSF` (Claim Signature Form), `OPR` (Operative Record), `SOA`, `ESA` (eSOA), `CF4`, `CF5` | [Guide p. 77–78, 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) |
| `pDocumentURL` | String(250). "URL of the document accessible via https. The document must first be encrypted using philhealth public key before publishing online." | [Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

::: warning The sample uses `http://`, Annex C requires HTTPS
The sample URLs start with `http://`, but Annex C says the document must be "accessible via https" ([KI-57](/known-issues#ki-57)). Use `https://` URLs. The sample host names are placeholders.
:::

The files themselves follow the same rules as uploadeClaims attachments: encrypt each one with **PhilHealth's public key** (not your cipher key) and host it where PhilHealth can download it. See [Attachment encryption](/guides/encryption/attachments). The DevKit leaves some attachment details open, such as the RSA padding (both demo kits use PKCS#1 v1.5, [KI-59](/known-issues#ki-59)), the `docMimeType` of XML attachments (this site uses `text/xml`) and how long files must stay online ([KI-57](/known-issues#ki-57)). If a missing document is an eSOA or CF5, validate it first with [validateeSOA](/api/validate-esoa) or [validateCF5](/api/validate-cf5).

## Response

The response is a JSON object ([Guide p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | The error message, if the method hit an error |
| `result` | "Possible results: 'Claims has already been paid' / 'Claims has already been denied'" |

Unlike most methods, `result` is not described as encrypted, and the two documented values are plain text.

::: warning Only failure results are documented
Both documented results mean you can't add documents: the claim is already paid or already denied. The Guide doesn't show the result of a successful call, and doesn't say whether these two texts come with `success: true` or `false` ([KI-29](/known-issues#ki-29), [KI-42](/known-issues#ki-42)).
:::

::: tip Recommendation (not from PhilHealth): interpret the response
1. If `success` is not `true`, the documents were not added. Show `message`.
2. If `result` is "Claims has already been paid" or "Claims has already been denied", treat it as a failure, whatever `success` says. Update the claim's status in your system.
3. If `result` is an envelope object (`docMimeType`, `doc`, …), decrypt it with your cipher key before you read it.
4. Otherwise treat `success: true` as accepted, and log `result` as text.
5. Store the request (series number, the `<DOCUMENTS>` XML, the URLs) and the full response. The certification form expects a "notification" for RTH submissions ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).
:::

## Example

### The Guide's sample body

The Guide's "Sample JSON" ([Guide p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)) shows only the shape; every value is empty, even `docMimeType`, which the table says is `"text/xml"` ([KI-25](/known-issues#ki-25)):

```json
{"pSeriesLhioNo": "",
 "pXML": {
             "docMimeType": "",
             "hash": "",
             "key1": "",
             "key2": "",
             "iv": "",
             "doc": ""
         }
}
```

### A filled-in request (illustrative)

Unofficial example for this site's [example claim](/reference/eclaims-xml#minimal-valid-example) (claim number `202609170001`). Suppose PhilHealth returned it and asks for a diagnostic test result. The claim series number `260917990000101` is an illustrative value in the 15-digit format that getUploadedClaimsMap returns, not real PhilHealth output. The plain XML inside `pXML` (valid against the `DOCUMENTS` declarations of `eClaimsDef.dtd`; we checked with lxml):

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="DTR" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/DTR.enc"/>
</DOCUMENTS>
```

The request. The hash, IV and ciphertext are placeholders, not real encryption output.

```http
POST /PHIC/Claims3.0/addRequiredDocument HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
  "pSeriesLhioNo": "260917990000101",
  "pXML": {
    "docMimeType": "text/xml",
    "hash": "<SHA-256 hex of the DOCUMENTS XML>",
    "key1": "",
    "key2": "",
    "iv": "<Base64 IV>",
    "doc": "<Base64 ciphertext of the DOCUMENTS XML>"
  }
}
```

**Response:** no success sample exists. A documented failure would carry `"result": "Claims has already been paid"` or `"result": "Claims has already been denied"`.

### Code: build and send the request

Recommendation (not from PhilHealth): illustrative code. Uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs` / `pecws_client.py`). `pecwsPost` sends the plain JSON body with a fresh token; `seal` encrypts only the `<DOCUMENTS>` XML with your cipher key; `unseal` decrypts `result` in the undocumented case that it comes back as an envelope. Escape attribute values when you build XML by hand, or use an XML library.

::: code-group

```js [Node.js]
// Node.js 18+
import { pecwsPost, seal, unseal } from './pecws-client.mjs'

const FAILURES = ['Claims has already been paid', 'Claims has already been denied']

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

// docs: [{ type: 'DTR', url: 'https://files.samplehospital.example/eclaims/202609170001/DTR.enc' }, ...]
export async function addRequiredDocument(seriesLhioNo, docs) {
  const documentsXml =
    '<DOCUMENTS>' +
    docs.map((d) => `<DOCUMENT pDocumentType="${esc(d.type)}" pDocumentURL="${esc(d.url)}"/>`).join('') +
    '</DOCUMENTS>'

  const env = await pecwsPost('addRequiredDocument', {
    pSeriesLhioNo: seriesLhioNo, // pClaimSeriesLhio from getUploadedClaimsMap
    pXML: seal(documentsXml, 'text/xml'), // an object, not a string
  })
  const r = env.result
  const resultText =
    r && typeof r === 'object' && 'iv' in r && 'doc' in r ? unseal(r) // undocumented: an envelope
      : typeof r === 'string' ? r : JSON.stringify(r ?? null)
  const accepted = env.success === true && !FAILURES.includes(resultText.trim())
  return { accepted, message: env.message, resultText, documentsXml } // log all of it
}
```

```python [Python]
# Python 3.9+ with the `requests` package
import json
from xml.sax.saxutils import quoteattr

from pecws_client import pecws_post, seal, unseal

FAILURES = {"Claims has already been paid", "Claims has already been denied"}


def add_required_document(series_lhio_no: str, docs: list) -> dict:
    """docs: [{"type": "DTR", "url": "https://files.samplehospital.example/eclaims/202609170001/DTR.enc"}, ...]"""
    documents_xml = (
        "<DOCUMENTS>"
        + "".join(
            f"<DOCUMENT pDocumentType={quoteattr(d['type'])} pDocumentURL={quoteattr(d['url'])}/>"
            for d in docs
        )
        + "</DOCUMENTS>"
    )
    env = pecws_post("addRequiredDocument", {
        "pSeriesLhioNo": series_lhio_no,  # pClaimSeriesLhio from getUploadedClaimsMap
        "pXML": seal(documents_xml, "text/xml"),  # an object, not a string
    })
    r = env.get("result")
    if isinstance(r, dict) and "iv" in r and "doc" in r:
        result_text = unseal(r)  # undocumented: an envelope
    else:
        result_text = r if isinstance(r, str) else json.dumps(r)
    accepted = env.get("success") is True and result_text.strip() not in FAILURES
    return {"accepted": accepted, "message": env.get("message"), "result_text": result_text,
            "documents_xml": documents_xml}  # log all of it
```

:::

The code doesn't use `assertSuccess` / `assert_success`: it returns `accepted: false` together with PhilHealth's `message`, so that you can show both.

## Notes and gotchas

- **Three names for claim series numbers.** This method uses `pSeriesLhioNo`; Annex C and getUploadedClaimsMap use `pClaimSeriesLhio`; getClaimStatus uses `serieslhionos` (a list). JSON keys are case-sensitive, so copy each one exactly for its method.
- **`pXML` is a JSON object in the sample, not a string.** Don't stringify the envelope a second time.
- **Two encryption schemes again.** `pXML` (the list of URLs) uses your cipher key; the files behind the URLs use PhilHealth's public key ([KI-12](/known-issues#ki-12)). The public key in the DevKit is an expired test certificate; get the current one from PhilHealth ([KI-01](/known-issues#ki-01)).
- **"Addition", not replacement.** The Guide calls this "the addition of required documents". It doesn't say what happens if you send a document type the claim already has. Confirm with PhilHealth before you rely on replacing a document.
- **Paid or denied claims can't take new documents.** That is what the two documented results say.
- **Retries.** The DevKit doesn't say what happens if the same documents are sent twice. Recommendation (not from PhilHealth): after a timeout, check the claim with [getClaimStatus](/api/get-claim-status) and ask PhilHealth before you resend ([KI-62](/known-issues#ki-62) covers the same open question for uploads).
- **Short-lived token, unknown host.** The shared client gets a fresh token for every call ([KI-26](/known-issues#ki-26)); set the host from PhilHealth in `PECWS_BASE_URL` ([KI-30](/known-issues#ki-30)).
- **History.** The method was added in revision 20240423; revision 20241111 says "The body should be a raw JSON; Updated the documentation" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). The DevKit doesn't show what the body looked like before that revision.

### Common mistakes

1. Sending your own claim number (`pClaimNumber`) or the receipt ticket number instead of the 15-digit claim series number.
2. Encrypting the whole request body instead of only `pXML`.
3. Putting the file contents (Base64) in the XML. `DOCUMENT` carries only a type and a URL; offline document content exists only in the [data-migration format](/reference/migration-xml).
4. Using `http://` URLs because the sample does.
5. Encrypting the documents with the cipher key instead of PhilHealth's public key.

## Related pages

- [uploadeClaims](/api/upload-eclaims): the original submission and its attachments
- [getUploadedClaimsMap](/api/get-uploaded-claims-map): where the claim series number comes from
- [getClaimStatus](/api/get-claim-status)
- [Document type codes](/reference/document-types)
- [Attachment encryption](/guides/encryption/attachments) and [API payload encryption](/guides/encryption/api-payloads)
- [Migrating data between providers](/guides/data-migration): taking over RTH claims from a previous provider
- [Known issues](/known-issues)
