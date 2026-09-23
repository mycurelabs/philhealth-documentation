---
title: generatePBEFPDF
description: Generate the PhilHealth Benefit Eligibility Form (PBEF) as a PDF from the reference number returned by isClaimEligible.
---

# generatePBEFPDF

Generate the PhilHealth Benefit Eligibility Form (PBEF) as a PDF, using the reference number from an eligibility check with [isClaimEligible](/api/is-claim-eligible).

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/generatePBEFPDF` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON `{"accreno": …, "referenceno": …}`. The Guide labels these "Parameter" ([KI-21](/known-issues#ki-21)) and doesn't say the body is encrypted; its sample is plain JSON ([KI-61](/known-issues#ki-61)). |
| Response `result` | Encrypted envelope (cipher key). Once decrypted, it is "a base64 string representation of a PDF document". |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 73–74: Generate PBEF PDF Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)
- [Implementation Guide, p. 69–72: Is Claim Eligible Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69) (where `referenceno` comes from)
- [Implementation Guide, p. 3–4: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (method added in 20240423; "updated the documentation" in 20241111)
- [Implementation Guide, Annex B, p. 77–78: Document type codes](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
:::

## When to use it

Call this method after [isClaimEligible](/api/is-claim-eligible) has returned a `referenceno` ("Reference number for printing PBEF", [Guide p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)). The Guide describes the method as generating "a PDF file of the PhilHealth Benefit Eligibility Form (PBEF) using the Reference Number obtained from the eligibility check" ([p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)).

The PDF comes back encrypted. Once you decrypt it, you get a base64 string that you decode into PDF bytes to display, save or print:

```text
isClaimEligible ──► decrypted result { referenceno, ... }
                                          │
generatePBEFPDF { accreno, referenceno } ◄┘
        │
        └─► decrypt result ──► base64 string ──► PDF bytes ──► display / save / print
```

Software certification checks the PBEF. Module 1 (Claims Eligibility) of the Software Solution Validation Test Form asks "Does the printout of the PBEF comply with the prescribed format?" and "Does the printout of the PBEF pass the PBEF validator?" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). See [Software certification](/guides/certification).

::: warning Not described in the DevKit
- **The "PBEF validator"** ([KI-56](/known-issues#ki-56)). No file in the DevKit describes it: what it is, where it runs, or what it checks.
- **The "prescribed format"** ([KI-56](/known-issues#ki-56)). The DevKit contains no PBEF layout. Recommendation (not from PhilHealth): print the PDF exactly as PhilHealth returns it, without re-rendering or re-flowing it, so you don't change the prescribed format by accident.
- **Whether to attach the PBEF to a claim** ([KI-56](/known-issues#ki-56)). Annex B has no document type code for the PBEF ([p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)). The closest code is `COE` "Certificate of Eligibility", but the DevKit doesn't connect the two.

Ask PhilHealth about all three.
:::

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

The Guide lists these under the heading "Parameter", then shows them as a "Sample JSON Input Payload" ([p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)):

| Key | Description (from the Guide) | Where to get it |
|---|---|---|
| `accreno` | "Health facility accreditation number" | Presumably your facility's PhilHealth Accreditation Number (PAN), the value you send to `getToken` as `accreditationNo`. The Guide describes that header and `isClaimEligible`'s `hospitalCode` almost the same way. The DevKit never says whether it wants the PAN or the PMCC number that the claim XML uses "for now" ([KI-48](/known-issues#ki-48)). |
| `referenceno` | "PBEF reference number from isClaimEligible method" | The `referenceno` in the decrypted `isClaimEligible` result |

The Guide doesn't say whether this body is encrypted ([KI-61](/known-issues#ki-61)). Other sections say so explicitly when it is: for example, `isClaimEligible` says "The body is in JSON format as encrypted using the cipher key of the Health Facility". This section doesn't, and its sample is plain JSON. Recommendation (not from PhilHealth): send plain JSON as the sample shows. If the test server rejects it, try the encrypted envelope, and confirm with PhilHealth.

## Response

The HTTP response is the standard envelope ([Guide p. 73–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | "An encrypted JSON object": `docMimeType` (documented as `"text/xml"`, see [KI-25](/known-issues#ki-25)), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc` |

Decrypt `result` with your cipher key (see [Encrypting API payloads](/guides/encryption/api-payloads)). The Guide then says ([p. 74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=74)):

> When decrypted, it contains a base64 string representation of a PDF document. You may render the PDF using any base64 renderer.

So there are **two layers** to undo:

| Layer | What it is | How to undo it |
|---|---|---|
| 1 | AES-256-CBC encryption (the Annex A scheme) with your cipher key | Your Annex A decrypt function, which removes the padding and checks `hash`. With the [shared client](/api/#shared-client-setup): `unseal(result)`, which returns the text. With this site's example modules directly: `decryptPayload(result, cipherKey).text` (Node.js) or `decrypt_payload(result, cipher_key).text` (Python). |
| 2 | Base64 encoding of the PDF bytes | A base64 decoder (`Buffer.from(s, 'base64')`, `base64.b64decode(s)`, `atob(s)`) |

::: warning The Guide describes the decrypted content in two ways (KI-47)
The `doc` row of the output table says `doc` is "The encrypted text of the JSON object containing the detailed result of the PBEF inquiry". That is the same wording as in `isClaimEligible`, which suggests it was copied ([KI-47](/known-issues#ki-47)). The paragraph right below it says the decrypted content is "a base64 string representation of a PDF document" ([p. 74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=74)). We follow the base64 description, because it is specific to this method and comes with a rendering example. Recommendation (not from PhilHealth): check the decrypted text before you use it, as the code below does.
:::

## Example

### Request

The Guide's sample is not valid JSON: `"referenceno: ""` is missing a closing quote after the key ([p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73), [KI-21](/known-issues#ki-21)). Here it is **with that quote fixed**:

```json
{
  "accreno": "",
  "referenceno": ""
}
```

Filled in for this site's example facility, it looks like this. `H12345678` is the example facility's accreditation number (PAN); the same facility's PMCC number is `123456`. We show the PAN because the Guide calls `accreno` the "Health facility accreditation number", but the DevKit never says which identifier this method expects, so confirm with PhilHealth ([KI-48](/known-issues#ki-48)). The reference number is a placeholder.

```json
{
  "accreno": "H12345678",
  "referenceno": "<referenceno from isClaimEligible>"
}
```

### Response (from the Guide)

This is the Guide's "Sample JSON output" ([p. 74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=74)). **We added the missing comma after the `result` object.** The values are placeholders ([KI-27](/known-issues#ki-27)).

```json
{
  "result": {
    "docMimeType": "text/xml",
    "hash": "dc8f4d74d977dfe701c0c9bbca06783005405",
    "key1": "",
    "key2": "",
    "iv": "y1jPMxvQE2aJPVnqqn",
    "doc": " odAp0qf2zManmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
  },
  "success": true,
  "message": ""
}
```

### Rendering the PDF (from the Guide)

The Guide's rendering example puts the decrypted base64 string straight into a `data:` URL ([p. 74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=74)):

```html
<embed src="data:application/pdf;base64,decrypted_base64_value_here"
       type="application/pdf" />
```

Replace `decrypted_base64_value_here` with the decrypted string (layer 1 undone, layer 2 still in place).

### Code: fetch, check and save the PBEF

Recommendation (not from PhilHealth). The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsPost` / `pecws_post` sends the plain JSON body with a fresh token ([KI-61](/known-issues#ki-61)). `assertSuccess` / `assert_success` throws unless `success` is `true`. `unseal` decrypts `result` with your cipher key and returns the decrypted **text**: the base64 string, with the padding removed and the hash checked. `accreno` is read from `PHIC_FACILITY_PAN`, the facility accreditation number that `getToken` also sends; whether this method expects the PAN or the PMCC number is not confirmed ([KI-48](/known-issues#ki-48)).

::: code-group

```js [Node.js 18+]
import { writeFile } from 'node:fs/promises'
import { pecwsPost, unseal, assertSuccess } from './pecws-client.mjs'

// Turn the decrypted text into a clean base64 string. Defensive, because the
// Guide describes the decrypted content in two different ways (KI-47).
function toPdfBase64(plaintext) {
  let s = plaintext.trim()                              // stray whitespace or line breaks
  if (s.startsWith('"')) s = JSON.parse(s)              // a JSON string literal: "JVBERi0..."
  if (s.startsWith('data:')) s = s.slice(s.indexOf(',') + 1) // a full data: URL
  if (s.startsWith('{')) {
    throw new Error('Decrypted PBEF is a JSON object, not base64. Log it and ask PhilHealth: '
      + s.slice(0, 200))
  }
  return s
}

async function generatePbefPdf(referenceno) {
  // Plain JSON body, as in the Guide's sample (KI-61).
  const env = assertSuccess(await pecwsPost('generatePBEFPDF', {
    accreno: process.env.PHIC_FACILITY_PAN, // e.g. H12345678; PAN or PMCC? confirm (KI-48)
    referenceno,
  }))
  const pdf = Buffer.from(toPdfBase64(unseal(env.result)), 'base64')
  // Every PDF file starts with the bytes "%PDF-".
  if (pdf.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error('Decoded PBEF does not look like a PDF')
  }
  return pdf
}

// eligibility = the decrypted isClaimEligible result
const pdf = await generatePbefPdf(eligibility.referenceno)
await writeFile(`pbef-${eligibility.referenceno}.pdf`, pdf)
```

```python [Python 3.9+]
import base64
import json
import os

from pecws_client import pecws_post, unseal, assert_success


def to_pdf_base64(plaintext: str) -> str:
    """Turn the decrypted text into a clean base64 string (defensive, KI-47)."""
    s = plaintext.strip()                         # stray whitespace or line breaks
    if s.startswith('"'):
        s = json.loads(s)                         # a JSON string literal
    if s.startswith("data:"):
        s = s.split(",", 1)[1]                    # a full data: URL
    if s.startswith("{"):
        raise ValueError("Decrypted PBEF is a JSON object, not base64: " + s[:200])
    return s


def generate_pbef_pdf(referenceno: str) -> bytes:
    # Plain JSON body, as in the Guide's sample (KI-61).
    env = assert_success(pecws_post("generatePBEFPDF", {
        "accreno": os.environ["PHIC_FACILITY_PAN"],  # PAN or PMCC? confirm (KI-48)
        "referenceno": referenceno,
    }))
    pdf = base64.b64decode(to_pdf_base64(unseal(env["result"])))
    if not pdf.startswith(b"%PDF-"):              # every PDF starts with %PDF-
        raise ValueError("Decoded PBEF does not look like a PDF")
    return pdf


# eligibility = the decrypted isClaimEligible result
pdf = generate_pbef_pdf(eligibility["referenceno"])
with open(f"pbef-{eligibility['referenceno']}.pdf", "wb") as f:
    f.write(pdf)
```

```js [Browser]
// Show the PBEF in a web page. A Blob URL avoids putting a very long
// data: URL into the page, which some browsers handle poorly.
function showPbef(base64, container) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
  const embed = document.createElement('embed')
  embed.type = 'application/pdf'
  embed.src = url
  embed.style.width = '100%'
  embed.style.height = '80vh'
  container.replaceChildren(embed)
}
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

Recommendation (not from PhilHealth): call PECWS from your server, and send only the decrypted base64 string to the browser snippet. Never put the cipher key in browser code.

## Notes and gotchas

::: warning KI-21: errors in the Guide's section for this method
On [Guide p. 73–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73). See [KI-21](/known-issues#ki-21).

- **"Parameter" or body?** The inputs are listed under "Parameter", which could suggest query parameters. The sample underneath, though, is a "Sample JSON Input Payload". Recommendation (not from PhilHealth): send them as a plain JSON body, as the sample shows ([KI-61](/known-issues#ki-61)). Revision 20241111 says only that this method's documentation was "updated", without details.
- **Invalid sample input.** `"referenceno: ""` is missing a quote. Use `"referenceno": ""`.
- **Invalid sample output.** There is no comma between the `result` object and `"success"`.
:::

- **The PDF note in `isClaimEligible` belongs here.** The `isClaimEligible` section ends with "Decrypt the result which is an encrypted base64 PDF document", which appears to be copied from this method ([KI-20](/known-issues#ki-20)). Only `generatePBEFPDF` returns a PDF.
- **`docMimeType` says `text/xml`, but the content is a base64 PDF string.** Decide how to parse the result from the method you called, not from `docMimeType` ([KI-25](/known-issues#ki-25)).
- **Three names for (probably) one value** ([KI-48](/known-issues#ki-48)). `getToken` uses `accreditationNo`, `isClaimEligible` uses `hospitalCode`, and this method uses `accreno`. The descriptions all point to your health facility's accreditation number (in this site's examples, `H12345678`). The eClaims XML's `pHospitalCode`, however, uses the PMCC number "for now" (`123456` in our examples, [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)), and the DevKit never says which one each method expects. See the [glossary](/getting-started/glossary) and confirm with PhilHealth.
- **Treat the PDF as confidential patient data.** Recommendation (not from PhilHealth): the PBEF presumably contains member and patient details, so don't log the base64 string, and store the PDF only where your patient records are protected.
- **Keep the reference number.** Recommendation (not from PhilHealth): store `referenceno` with the confinement so staff can reprint the PBEF later without a new eligibility check. The DevKit doesn't say how long a reference number stays valid.

### Common mistakes

- Putting the **still-encrypted** `result.doc` into the `data:` URL. `doc` is AES ciphertext in base64, so it also "looks like base64", but the PDF viewer shows an error. Decrypt it first.
- Base64-decoding the PDF string **twice**, or not at all. The Annex A decryption already base64-decodes `doc`. Decode the string it returns exactly once more.
- Leaving the trailing `0x00` padding bytes on the decrypted string before you base64-decode it. (`unseal()` and the example modules already remove them.)
- Passing an object to the base64 decoder. `unseal()` returns the text. If you call `decryptPayload` / `decrypt_payload` yourself, use its `.text`: it returns an object.
- Sending the `isClaimEligible` `trackingno` instead of `referenceno`.
- Copying the Guide's input sample with its missing quote, and getting a JSON parse error before the request is even sent.

## Related pages

- [isClaimEligible](/api/is-claim-eligible): where `referenceno` comes from
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [Document type codes](/reference/document-types)
- [Software certification (SSVTF)](/guides/certification)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [Glossary](/getting-started/glossary): PBEF, PAN
- Known issues: [KI-21](/known-issues#ki-21), [KI-47](/known-issues#ki-47), [KI-48](/known-issues#ki-48), [KI-56](/known-issues#ki-56), [KI-61](/known-issues#ki-61)
