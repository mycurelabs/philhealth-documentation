---
title: isDoctorAccredited
description: Check whether a health care professional is accredited by PhilHealth for a confinement's admission and discharge dates.
---

# isDoctorAccredited

Check whether a health care professional (HCP), such as a doctor, is accredited by PhilHealth for a confinement's admission and discharge dates.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/isDoctorAccredited` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON `{accrecode, admissiondate, dischargedate}`. The Guide calls it a "JSON Payload" and doesn't say it is encrypted ([KI-24](/known-issues#ki-24), [KI-61](/known-issues#ki-61)). |
| Response `result` | Encrypted with your facility's cipher key. The Guide calls the content "XML text", but lists JSON-style keys and gives no sample ([KI-24](/known-issues#ki-24)). |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 60–61: Is Doctor Accredited Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)
- [Implementation Guide, p. 3–4: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (added in 20240423; "updated the key names documentation" in 20241111)
- [Implementation Guide, p. 49–50: Get Doctor PAN Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49) and [Annex C, p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) (PAN formats)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (dummy HCPs for testing)
:::

## When to use it

The Guide says this method "verifies whether a Health Care Professional (HCP) is accredited based on the Accreditation Number, Admission Date, and Discharge Date" ([p. 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)). The result also returns the start and end dates of the professional's accreditation.

Software certification requires it. Module 1 of the Software Solution Validation Test Form asks: "Does the system provide an interface for checking the accreditation status of a healthcare professional for a specified date?" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

```text
getDoctorPAN (name + birth date) ──► PAN
                                      │
isDoctorAccredited { accrecode: PAN, admissiondate, dischargedate }
                                      │
                                      └─► isaccredited, accreditationstart, accreditationend
```

Recommendation (not from PhilHealth): check every professional you are about to list in the claim's `PROFESSIONALS` elements, using that confinement's admission and discharge dates, before you upload the claim. That way staff can fix an expired or mistyped accreditation number before the claim goes out.

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

"JSON object containing the following key-value pairs" ([Guide p. 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)):

| Key | Description (from the Guide) | Format |
|---|---|---|
| `accrecode` | "Health Care Professional Accreditation Number" | string; see the [format note](#notes-and-gotchas) ([KI-48](/known-issues#ki-48)) |
| `admissiondate` | "Date of Admission" | "Date Format should be : 'MM-DD-YYYY'" |
| `dischargedate` | "Date of Discharge" | "Date Format should be : 'MM-DD-YYYY'" |

Unlike [getDoctorPAN](/api/get-doctor-pan) and [getMemberPIN](/api/get-member-pin), this section doesn't say the body is "encrypted using the cipher key of the Health Facility", and its sample is plain JSON ([KI-24](/known-issues#ki-24), [KI-61](/known-issues#ki-61)). Recommendation (not from PhilHealth): send plain JSON as the sample shows. If the test server rejects it, try the encrypted envelope, and confirm with PhilHealth.

The DevKit doesn't say what to send as `dischargedate` for a patient who is still admitted ([KI-64](/known-issues#ki-64)). Confirm with PhilHealth.

## Response

The HTTP response is the standard envelope ([Guide p. 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | "The JSON object as the result of the encryption (using the cipher key of the health facility) of the XML text containing the essential information for verifying accreditation status and validity." |

So `result` is the usual encrypted envelope, which you decrypt with your cipher key (see [Encrypting API payloads](/guides/encryption/api-payloads)). Unlike other methods, the Guide's table doesn't list the envelope fields (`docMimeType`, `hash`, …). It lists the fields of the decrypted content instead ([p. 60–61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)):

| Key | Description (from the Guide) | Format |
|---|---|---|
| `isaccredited` | *(no description in the Guide)* | Not specified |
| `accrecode` | "Health Care Professional Accreditation Number" | string |
| `admissiondate` | "Date of Admission" | `MM-DD-YYYY` |
| `dischargedate` | "Date of Discharge" | `MM-DD-YYYY` |
| `accreditationstart` | "Date of Start of Accreditation" | `MM-DD-YYYY` |
| `accreditationend` | "Date of End of Accreditation" | `MM-DD-YYYY` |

The last two names are printed across two lines in a narrow table column ("accreditation / start", "accreditation / end"). We assume they are single words, like every other key in this method, but check the real response.

The Guide gives no sample output for this method ([KI-24](/known-issues#ki-24)).

## Example

### Request

This is the Guide's "Sample JSON input payload" ([p. 61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=61)). It is valid JSON as printed:

```json
{
  "accrecode": "1234567890",
  "admissiondate": "01-01-1990",
  "dischargedate": "01-01-1990"
}
```

A test request for this site's example claim: the attending doctor is one of PhilHealth's dummy professionals, whose accreditation runs "up to 12/31/2026" ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)), and the confinement runs from 09-15-2026 to 09-17-2026. The dates are illustrative.

```json
{
  "accrecode": "1504-2400015-3",
  "admissiondate": "09-15-2026",
  "dischargedate": "09-17-2026"
}
```

Recommendation (not from PhilHealth): also test a confinement after 12-31-2026 for the same professional. You'd expect it to come back as not accredited, which tests your "not accredited" path. The DevKit doesn't say which environment the dummy records exist in ([KI-11](/known-issues#ki-11)). See [Test data](/reference/test-data).

### Response

There is no sample in the Guide, so we don't show an invented one. Log the full decrypted content from the test server the first time you call the method, and build your parser from what you actually receive.

### Code

Recommendation (not from PhilHealth). The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsPost` / `pecws_post` sends the plain JSON body with a fresh token ([KI-61](/known-issues#ki-61)), `assertSuccess` / `assert_success` throws unless `success` is `true`, and `unseal` decrypts `result` and returns the text (it throws when the hash doesn't match).

The Guide says "XML text" but lists JSON-style keys, so the code checks which one it received. The Python version parses either JSON or XML. The Node.js version parses JSON and stops with a clear error if it gets XML, because Node.js has no built-in XML parser; add one (for example `fast-xml-parser`) if the test server returns XML. The code also refuses to guess what `isaccredited` means: it returns the raw value, and your code maps it once you have seen real responses.

::: code-group

```js [Node.js 18+]
import { pecwsPost, unseal, assertSuccess } from './pecws-client.mjs'

async function isDoctorAccredited(accrecode, admissiondate, dischargedate) {
  // Plain JSON body, as in the Guide's sample (KI-61).
  const env = assertSuccess(
    await pecwsPost('isDoctorAccredited', { accrecode, admissiondate, dischargedate }),
  )
  const text = unseal(env.result).trim()

  if (text.startsWith('{')) return JSON.parse(text)
  if (text.startsWith('<')) {
    // Parse with your XML library (for example fast-xml-parser) and return the same keys.
    throw new Error(`isDoctorAccredited returned XML; add an XML parser:\n${text.slice(0, 300)}`)
  }
  throw new Error(`Unexpected isDoctorAccredited result:\n${text.slice(0, 300)}`)
}

// This site's example claim: dummy doctor, admitted 09-15-2026, discharged 09-17-2026.
const r = await isDoctorAccredited('1504-2400015-3', '09-15-2026', '09-17-2026')
console.log('raw isaccredited value:', JSON.stringify(r.isaccredited))
// Map it only after you have seen real values, and treat anything unknown as NOT accredited.
```

```python [Python 3.9+]
import json
import xml.etree.ElementTree as ET

from pecws_client import pecws_post, unseal, assert_success


def is_doctor_accredited(accrecode, admissiondate, dischargedate) -> dict:
    # Plain JSON body, as in the Guide's sample (KI-61).
    env = assert_success(pecws_post("isDoctorAccredited", {
        "accrecode": accrecode,
        "admissiondate": admissiondate,
        "dischargedate": dischargedate,
    }))
    text = unseal(env["result"]).strip()
    if text.startswith("{"):
        return json.loads(text)
    if text.startswith("<"):
        root = ET.fromstring(text)
        # Collect any element text or attribute whose name matches a documented key.
        wanted = {"isaccredited", "accrecode", "admissiondate", "dischargedate",
                  "accreditationstart", "accreditationend"}
        found = {}
        for el in root.iter():
            if el.tag.lower() in wanted and el.text:
                found[el.tag.lower()] = el.text.strip()
            for k, v in el.attrib.items():
                if k.lower() in wanted:
                    found[k.lower()] = v
        return found
    raise ValueError("Unexpected isDoctorAccredited result: " + text[:300])


# This site's example claim: dummy doctor, admitted 09-15-2026, discharged 09-17-2026.
r = is_doctor_accredited("1504-2400015-3", "09-15-2026", "09-17-2026")
print("raw isaccredited value:", repr(r.get("isaccredited")))
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

## Notes and gotchas

::: warning KI-24: this method is under-documented
On [Guide p. 60–61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60). See [KI-24](/known-issues#ki-24).

- **XML or JSON?** The result is described as the encryption "of the XML text", but the keys are listed like JSON keys (`isaccredited`, `accrecode`, …). The Guide shows no sample output.
- **`isaccredited` has no description.** The Guide doesn't say whether it is `YES`/`NO`, `Y`/`N`, `true`/`false` or something else.
- **Key names wrap in the table.** `accreditationstart` and `accreditationend` are printed across two lines.
- **Encryption of the request is not mentioned** ([KI-61](/known-issues#ki-61)). The sections for `getDoctorPAN` and `getMemberPIN` say explicitly that their bodies are encrypted. This one doesn't, and its sample is plain JSON.

Revision 20241111 says it "updated the key names documentation" for this method ([p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)), but doesn't say what changed.
:::

::: warning Which accreditation number format? (KI-48)
The sample `accrecode` is `1234567890`: 10 digits, no dashes. That matches none of the other professional PANs in the DevKit. [getDoctorPAN](/api/get-doctor-pan)'s sample returns `0000-0000000-0`, the dummy professionals have PANs like `1504-2400015-3`, and Annex C formats `pDoctorAccreCode` as `####-######-##` ([p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). See the [format table on the getDoctorPAN page](/api/get-doctor-pan#notes-and-gotchas) and [KI-48](/known-issues#ki-48).

Recommendation (not from PhilHealth): send the PAN exactly as `getDoctorPAN` returns it. If the test server says it isn't found, try the digits only, and confirm the expected format with PhilHealth.
:::

- **Fail closed.** Recommendation (not from PhilHealth): if you can't decrypt or parse the result, or `isaccredited` has a value you haven't mapped, show the professional as "accreditation not verified", not as accredited.
- **Show the accreditation period.** Recommendation (not from PhilHealth): display `accreditationstart` and `accreditationend` to staff. They explain *why* a check failed, for example because the accreditation ended before the admission date.
- **Dates are month first.** `03-10-2025` is March 10, not October 3.

### Common mistakes

- Sending the professional's name instead of the PAN. Look the PAN up first with [getDoctorPAN](/api/get-doctor-pan).
- Sending your **facility's** accreditation number instead of the professional's.
- Using camelCase keys (`accreCode`, `admissionDate`). This method's keys are all lowercase. `isClaimEligible`, in contrast, uses `admissionDate`.
- Passing an object to your parser. `unseal()` returns the text. If you call `decryptPayload` yourself, use its `.text`: it returns an object.
- Treating `success: true` as "the doctor is accredited". The Guide defines `success` only as "a successful operation". The accreditation answer is in the decrypted `isaccredited`.

## Related pages

- [getDoctorPAN](/api/get-doctor-pan): find the PAN to check
- [eClaims XML reference](/reference/eclaims-xml): `PROFESSIONALS` element
- [Test data](/reference/test-data)
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [Software certification (SSVTF)](/guides/certification)
- [Glossary](/getting-started/glossary): PAN, HCP
- Known issues: [KI-11](/known-issues#ki-11), [KI-24](/known-issues#ki-24), [KI-48](/known-issues#ki-48), [KI-61](/known-issues#ki-61), [KI-64](/known-issues#ki-64)
