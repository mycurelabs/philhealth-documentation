---
title: eClaimsFileCheck
description: Ask PhilHealth to validate an encrypted eClaims XML file. It takes the same body as uploadeClaims, but the Guide describes it only as a check.
---

# eClaimsFileCheck

Asks the PhilHealth e-Claims Web Service (PECWS) to validate an encrypted eClaims XML file, without submitting it.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/eClaimsFileCheck` |
| **Auth header** | `token`, from [getToken](/api/get-token) |
| **Request body** | The eClaims XML, encrypted with your facility's **cipher key** (standard encrypted envelope, `key1` and `key2` empty). Same as uploadeClaims. |
| **Response `result`** | An envelope encrypted with the cipher key. **What it contains after decryption is not documented** ([KI-42](/known-issues#ki-42)). |

::: tip TL;DR
- The request body is exactly the same as for [uploadeClaims](/api/upload-eclaims). The Guide describes this method only as validation, not as submitting claims.
- Recommendation (not from PhilHealth): run it once the attachments are encrypted and hosted, on the **final** eClaims XML with the live URLs, and upload that same XML right after (steps 5 and 6 of the [submission order](#where-it-fits-the-submission-order)).
- The decrypted result is undocumented, so log it in full and parse it defensively.
- A passing check is not a filed claim. Only [uploadeClaims](/api/upload-eclaims) returns the receipt you track claims with.
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 44–45: EClaims File Check Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)
- [Implementation Guide, p. 19–20: Upload eClaims Method (for comparison)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)
- [Implementation Guide, p. 53: Get Uploaded Claims Map Method (which receipt number it expects)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)
- [Implementation Guide, p. 3: revision history (method added in 20240423)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [`eClaimsDef.dtd` (v1.9)](/originals/eclaims-xml/eClaimsDef.dtd)

"Annex A" and "Annex C" on this page are the Guide's annexes ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).
:::

## When to use it

The Guide's whole description of the method is one sentence ([Guide p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)):

> This method allows the caller to validate the eClaims XML File.

It was added in revision 20240423, together with getClaimStatus, getUploadedClaimsMap and other methods ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

Recommendation (not from PhilHealth): use it as a **server-side pre-check** right before [uploadeClaims](/api/upload-eclaims): while you develop your XML generator, while you prepare for certification, and before a real upload if you want PhilHealth's opinion on the file first. In the Guide, only uploadeClaims is described as the method that transmits claims to PhilHealth, and only its section says that the transmission date is the official date received for turnaround time ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).

::: warning What the Guide does not say
The DevKit doesn't state:

- which checks `eClaimsFileCheck` runs (the Document Type Definition, or DTD, only, or also the Annex C attribute rules that uploadeClaims applies);
- whether it checks that the attachment URLs are reachable;
- whether PhilHealth records anything when you call it;
- what the decrypted result looks like ([KI-42](/known-issues#ki-42)).

So don't treat a passing check as a guarantee that the upload will succeed, and never treat a response from this method as proof that a claim was filed. Confirm the details with PhilHealth.
:::

### Where it fits: the submission order

::: tip Recommendation (not from PhilHealth): submission order
This site uses one order for every claim. Because the DevKit doesn't say whether `eClaimsFileCheck` fetches the attachment URLs, run it only when they are live, on the exact XML you are about to upload:

1. Build the XML files: the eClaims XML and its XML attachments (eSOA, CF5, CF4), with each attachment's final URL already in `DOCUMENTS`.
2. Check each file locally against its DTD ([Validating XML locally](/guides/validating-xml)).
3. Validate the eSOA with [validateeSOA](/api/validate-esoa) and the CF5 with [validateCF5](/api/validate-cf5).
4. Encrypt every attachment with PhilHealth's public key and host it at an HTTPS URL ([Attachment encryption](/guides/encryption/attachments)).
5. **Check the final eClaims XML, with the live attachment URLs, with `eClaimsFileCheck` (this page).**
6. Upload the same XML with [uploadeClaims](/api/upload-eclaims).
7. Store the `eRECEIPT`, with its Receipt Ticket Number (RTN) and Transmission Control Number (TCN).
8. Call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN.
:::

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PECWS authentication token from [getToken](/api/get-token) | [Guide p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44) |
| `Content-Type` | `application/json` | Not in the Guide ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send it, because the body is JSON. |

### Body

"The body is the eclaims XML in JSON format as encrypted using the cipher key of the Health Facility" ([Guide p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)). The wording and the key table are identical to uploadeClaims:

| Key | Value |
|---|---|
| `docMimeType` | `"text/xml"` |
| `hash` | SHA-256 hash of the unencrypted eClaims XML |
| `key1` | `""` (empty string) |
| `key2` | `""` (empty string) |
| `iv` | The initialization vector: 16 random bytes, Base64-encoded |
| `doc` | "The encrypted e-claim XML text" |

The plain content is the same eClaims XML you would upload: see [uploadeClaims](/api/upload-eclaims#what-you-build-the-eclaims-xml), [eClaims XML reference](/reference/eclaims-xml), and the unofficial example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), which we validated with Java's built-in parser (JAXP) and with lxml plus the patched DTD ([KI-43](/known-issues#ki-43)). Encryption: [API payload encryption](/guides/encryption/api-payloads). Encode the XML as UTF-8 before you hash and encrypt it ([KI-60](/known-issues#ki-60)).

## Response

The response is a JSON object ([Guide p. 44–45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | The error message, if the method hit an error |
| `result` | An envelope object (`docMimeType`, `hash`, `key1`, `key2`, `iv`, `doc`) encrypted with your cipher key |

::: warning The `result` description is copied from other methods
The Guide describes `result` as "the XML text containing the Receipt Ticket Number and other data about the processing of the submitted e-claim data", word for word the uploadeClaims text. It describes `doc` as "the JSON object containing the records of the matching benefit packages. Sample XML text and the DTD of the XML text is shown below", but nothing follows except the encrypted sample. So the decrypted content is undocumented: it could be an `eRECEIPT`-style XML, a JSON error list like [validateeSOA](/api/validate-esoa#the-decrypted-result), or something else ([KI-42](/known-issues#ki-42), [KI-47](/known-issues#ki-47)).
:::

::: tip Recommendation (not from PhilHealth): read the result defensively
1. If `success` is not `true`, show `message`.
2. Otherwise decrypt `result` and look at the first non-whitespace character: `<` means XML, `{` means JSON.
3. XML: look for `REMARKS` elements with `pErrCode`/`pErrDescription`, as in the uploadeClaims failure receipt. JSON: look for an `errors` array.
4. Show everything you find, and log the full decrypted text.
5. **Don't store any receipt number from this call as a submission.** If the result contains something that looks like a receipt ticket number, record it only as part of the check's log. File the claim with uploadeClaims.
:::

## Example

**Request.** The Guide gives no request sample for this method. The body has the same shape as the [uploadeClaims request](/api/upload-eclaims#request); the values below are placeholders.

```http
POST /PHIC/Claims3.0/eClaimsFileCheck HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
    "docMimeType": "text/xml",
    "hash": "<SHA-256 hex of the eClaims XML>",
    "key1": "",
    "key2": "",
    "iv": "<Base64 IV>",
    "doc": "<Base64 ciphertext>"
}
```

**Response.** The Guide's "Sample encrypted output value" ([Guide p. 45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=45)). The values are placeholders, identical to other methods' samples ([KI-27](/known-issues#ki-27)).

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

**Decrypted result:** no sample exists in the DevKit.

### Code: call the check and inspect the result

Recommendation (not from PhilHealth): illustrative code. Uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs` / `pecws_client.py`). `pecwsPost` gets a fresh token for the call, `seal` encrypts the XML with your cipher key, and `unseal` decrypts `result` and throws if the hash doesn't match. `saveCheckLog` / `save_check_log` is your own function.

::: code-group

```js [Node.js]
// Node.js 18+
import { pecwsPost, seal, unseal } from './pecws-client.mjs'

export async function eclaimsFileCheck(eclaimsXml) {
  const env = await pecwsPost('eClaimsFileCheck', seal(eclaimsXml, 'text/xml'))
  if (env.success !== true) return { ok: false, message: env.message }

  const text = unseal(env.result).trim() // throws if the hash doesn't match
  const format = text.startsWith('<') ? 'xml' : text.startsWith('{') ? 'json' : 'unknown'
  saveCheckLog({ format, text }) // undocumented format: keep it all
  return { ok: true, format, text } // show `text` (or the REMARKS / errors in it) to the user
}
```

```python [Python]
# Python 3.9+ with the `requests` package
from pecws_client import pecws_post, seal, unseal


def eclaims_file_check(eclaims_xml: str) -> dict:
    env = pecws_post("eClaimsFileCheck", seal(eclaims_xml, "text/xml"))
    if env.get("success") is not True:
        return {"ok": False, "message": env.get("message")}

    text = unseal(env["result"]).strip()  # raises if the hash doesn't match
    fmt = "xml" if text.startswith("<") else "json" if text.startswith("{") else "unknown"
    save_check_log(fmt, text)  # undocumented format: keep it all
    return {"ok": True, "format": fmt, "text": text}
```

:::

The code doesn't use `assertSuccess` / `assert_success`, because a failed check is an expected answer here: it returns `ok: false` with PhilHealth's `message` so that you can show it.

## Notes and gotchas

- **Same XML for the check and the upload.** Send the same plaintext eClaims XML to both methods. Recommendation (not from PhilHealth): encrypt it again for the upload with a fresh random IV (call `seal` again) rather than replaying the envelope; the plaintext and hash stay the same. If you change anything afterwards, including an attachment URL, check it again.
- **Check after hosting, not before.** The DevKit doesn't say whether this method checks that the attachment URLs are reachable. Recommendation (not from PhilHealth): host the encrypted attachments first, so that a check that does fetch them can pass ([Attachment encryption](/guides/encryption/attachments)).
- **A local DTD check is still worth it.** It is free, it runs offline, and it gives precise line numbers. See [Validating XML locally](/guides/validating-xml). Unpatched libxml2-based tools (lxml, `xmllint`, PHP) either reject every eClaims file with a "not deterministic" error or skip some checks, depending on the version ([KI-43](/known-issues#ki-43)). Use [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or the [patched DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2). PhilHealth's own NetBeans instructions describe the same idea ([Validating e-Claims XML File in Netbeans](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf)).
- **Retries.** A check doesn't file anything, so you can repeat it. How PECWS treats a repeated *upload* is a different question ([KI-62](/known-issues#ki-62)).
- **When the local DTD and PhilHealth disagree, PhilHealth wins.** The precedence rules on [How to read these docs](/getting-started/how-to-read#which-source-wins-precedence-rules) name eClaimsFileCheck as one of the validator endpoints that settle doubts about the DTD.
- **`docMimeType` is always `text/xml` in the samples** ([KI-25](/known-issues#ki-25)). Don't use it to decide how to parse the result. For the request, `text/xml` is correct, because the payload is XML.
- **Tokens are short-lived** ([KI-26](/known-issues#ki-26)), so the shared client gets a fresh one for every call. **The host name isn't in the DevKit** ([KI-30](/known-issues#ki-30)); set it in `PECWS_BASE_URL`.
- **Method name casing.** The endpoint is `eClaimsFileCheck` (lowercase `e`); the Guide's section title says "EClaims File Check Method". Always use the spelling from the endpoint URL ([KI-09](/known-issues#ki-09)).

### Common mistakes

1. Treating a passing `eClaimsFileCheck` as a filed claim. Nothing in the Guide says it submits anything. [getUploadedClaimsMap](/api/get-uploaded-claims-map) expects the receipt ticket number "returned by the eClaimsUpload method" ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)), so track claims with the receipt from uploadeClaims.
2. Assuming the response is an `eRECEIPT` because the Guide's table says so. It is copied text; parse defensively.
3. Skipping uploadeClaims error handling because the check passed.
4. Checking a draft XML before the attachment URLs are final, then uploading a different file.

## Related pages

- [uploadeClaims](/api/upload-eclaims): the real submission, same request body
- [eClaims XML reference](/reference/eclaims-xml) and [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml)
- [Validating XML locally](/guides/validating-xml)
- [API payload encryption](/guides/encryption/api-payloads)
- [validateeSOA](/api/validate-esoa) and [validateCF5](/api/validate-cf5): validators for the XML attachments
- [Known issues](/known-issues)
