---
title: getDoctorPAN
description: Look up a health care professional's PhilHealth Accreditation Number (PAN) from their complete name and date of birth.
---

# getDoctorPAN

Look up the PhilHealth Accreditation Number (PAN) of a health care professional (HCP), such as a doctor, from the professional's complete name and date of birth.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/getDoctorPAN` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON `{lastname, firstname, middlename, suffix, birthdate}`, **encrypted** with your health facility's cipher key |
| Response `result` | Encrypted envelope. Once decrypted, it is JSON: `{"pan": "…"}` |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 49–50: Get Doctor PAN Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)
- [Implementation Guide, p. 3: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (method added in 20240423)
- [Implementation Guide, p. 30: eClaims XML sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=30) and [Annex C, p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) (`PROFESSIONALS@pDoctorAccreCode`)
- [Implementation Guide, p. 60–61: Is Doctor Accredited Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60) (sample `accrecode`)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (dummy HCPs for testing)
:::

::: tip PIN, PAN or PEN?
A **PAN** (PhilHealth Accreditation Number) identifies an accredited health facility or health care professional. A **PIN** (PhilHealth Identification Number) identifies a member or dependent; see [getMemberPIN](/api/get-member-pin#pin-pan-and-pen). A **PEN** (PhilHealth Employer Number) identifies an employer; see [searchEmployer](/api/search-employer). This method returns the PAN of a **professional**, not of your facility. See the [glossary](/getting-started/glossary).
:::

## When to use it

The Guide says this method "retrieves the PhilHealth Accreditation Number (PAN) of a health care professional (HCP) using the professional's complete name and date of birth" ([p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)).

You need the PAN of every professional you list on a claim. Typical uses:

- **Filling in the claim.** Each `PROFESSIONALS` element in the eClaims XML needs `pDoctorAccreCode`, the "Doctor's Accreditation Number" ([Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). See [eClaims XML](/reference/eclaims-xml).
- **Checking accreditation.** [isDoctorAccredited](/api/is-doctor-accredited) takes the professional's accreditation number as `accrecode`.
- **Setting up your doctor master list.** Recommendation (not from PhilHealth): look up each professional's PAN once, when you add them to your hospital information system (HIS) or electronic medical record (EMR), store it, and let staff correct it. That is easier than looking it up on every claim.

Software certification requires this lookup. Module 1 of the Software Solution Validation Test Form asks: "Does the system provide an interface for retrieving the PhilHealth Accreditation Number of a healthcare professional?" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

"The body is in JSON format as encrypted using the cipher key of the Health Facility" ([Guide p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)). Build this plain JSON object, then wrap it in the encrypted envelope (see [Encrypting API payloads](/guides/encryption/api-payloads)):

| Key | Description (from the Guide) | Format |
|---|---|---|
| `lastname` | "Health Care Professional Last Name" | string |
| `firstname` | "Health Care Professional First Name" | string |
| `middlename` | "Health Care Professional Middle Name" | string |
| `suffix` | "Health Care Professional Suffix Name" | string, for example `III` in the Guide's sample |
| `birthdate` | "Health Care Professional Birth Date" | "Date Format should be : 'MM-DD-YYYY'" |

The Guide doesn't say which keys are required, or what to send when a professional has no middle name or suffix. Recommendation (not from PhilHealth): send names in capital letters, as the Guide's samples do, and `""` for a missing middle name or suffix.

## Response

The HTTP response is the standard envelope ([Guide p. 49–50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | "The JSON object as the result of the encryption (using the cipher key of the health facility) of the JSON object containing the PAN": `docMimeType` (documented as `"text/xml"`, see [KI-25](/known-issues#ki-25)), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc` |

Decrypt `result` with your cipher key. The decrypted content is a JSON object with one key:

| Key | Description | Format |
|---|---|---|
| `pan` | The professional's PhilHealth Accreditation Number | String. The Guide's sample is `"0000-0000000-0"`: 12 digits with dashes after the 4th and 11th digits. See the [format conflict](#notes-and-gotchas) below ([KI-48](/known-issues#ki-48)). |

The DevKit doesn't document what happens when no professional matches, or when more than one does ([KI-42](/known-issues#ki-42)). Check `success` and `message`, and confirm the behavior on PhilHealth's test server.

## Example

### Request

This is the Guide's "Sample decrypted JSON input payload" ([p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50)), reformatted. It is the plain JSON that you encrypt:

```json
{
  "lastname": "LASTNAME",
  "firstname": "FIRSTNAME",
  "middlename": "MIDDLENAME",
  "suffix": "III",
  "birthdate": "01-01-1990"
}
```

After encryption, the HTTP body is the envelope. This is the Guide's "Sample encrypted JSON input payload". The values are placeholders ([KI-27](/known-issues#ki-27)):

```json
{
  "docMimeType": "text/xml",
  "hash": "dc8f4d74d977dfe701c0c9bbca067830054…………",
  "key1": "",
  "key2": "",
  "iv": "y1jPMxvQE2aJPV………",
  "doc": "PMs1FWFZT+odAp0qf2zManmroSUr3lYgDF………..=="
}
```

The sample shows `"docMimeType": "text/xml"`, but the plaintext is JSON. Annex A says `docMimeType` should be the MIME type of the data, such as `application/json` ([p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76), [KI-25](/known-issues#ki-25)). We recommend `application/json`, as the [API overview](/api/#the-encrypted-envelope) does. Every JSON sample in the Guide and both demo kits use `text/xml`, so if the test server rejects `application/json`, switch to `text/xml` and tell PhilHealth.

### Response

The Guide's "Sample encrypted JSON output payload" ([p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50)):

```json
{
  "message": "",
  "result": {
    "doc": "TxUkrmwTSKWuP……",
    "docMimeType": "text/xml",
    "hash": "dac3ccd4a4b726a3305c17c4df5efdda2a9273724ac………",
    "iv": "I/yCJcJG3ZAe2NNmR………",
    "key1": "",
    "key2": ""
  },
  "success": true
}
```

The Guide's "Sample decrypted result JSON output payload":

```json
{"pan":"0000-0000000-0"}
```

### Testing with PhilHealth's dummy professionals

The DevKit includes a list of dummy health care professionals "with Accreditation up to 12/31/2026" ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)). You can use them as inputs when you test this lookup. The first one, `1504-2400015-3`, is also the attending doctor in this site's example claim.

| PAN | Name columns as printed (`FIRST_NAME`, `MIDDLE_NAME`, `FIRST_NAME`) | `BIRTH_DATE` | `PROF_CLASS` |
|---|---|---|---|
| `1504-2400015-3` | LIFE, GOES, ON | 10/11/1992 | MS |
| `1100-2400002-5` | LIVE, LOVE, LAUGH | 11/26/1985 | GP |

Two things to know before you use them ([KI-11](/known-issues#ki-11)):

- The header repeats `FIRST_NAME`. The third name column is **probably** the last name, so "LIFE GOES ON" would be first name LIFE, middle name GOES, last name ON.
- The list writes birth dates with slashes. This method needs `MM-DD-YYYY`, so `10/11/1992` becomes `10-11-1992`.

A test request for the first professional would then be:

```json
{
  "lastname": "ON",
  "firstname": "LIFE",
  "middlename": "GOES",
  "suffix": "",
  "birthdate": "10-11-1992"
}
```

If PhilHealth's test environment recognizes the dummy data, you'd expect `{"pan":"1504-2400015-3"}`. The DevKit doesn't say which environment the dummy records exist in, and they may stop working after 12/31/2026 ([KI-11](/known-issues#ki-11)). See [Test data](/reference/test-data).

### Code

Recommendation (not from PhilHealth). The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `seal` encrypts the plain JSON with your cipher key, `pecwsPost` / `pecws_post` sends the envelope with a fresh token, `assertSuccess` / `assert_success` throws unless `success` is `true`, and `unseal` decrypts `result` and returns the text (it throws when the hash doesn't match). The example looks up the first dummy professional, who is also the attending doctor in this site's example claim.

::: code-group

```js [Node.js 18+]
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'

// The dummy list uses MM/DD/YYYY; the API wants MM-DD-YYYY.
const toApiDate = (d) => d.replaceAll('/', '-')

async function getDoctorPan({ lastname, firstname, middlename = '', suffix = '', birthdate }) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(birthdate)) {
    throw new Error(`birthdate must be MM-DD-YYYY, got ${birthdate}`)
  }
  const query = { lastname, firstname, middlename, suffix, birthdate }
  // application/json per Annex A; if the test server rejects it, use 'text/xml' (KI-25).
  const env = assertSuccess(
    await pecwsPost('getDoctorPAN', seal(JSON.stringify(query), 'application/json')),
  )
  const { pan } = JSON.parse(unseal(env.result))
  return pan // store exactly as returned, as a string
}

const pan = await getDoctorPan({
  lastname: 'ON', firstname: 'LIFE', middlename: 'GOES', birthdate: toApiDate('10/11/1992'),
})
```

```python [Python 3.9+]
import json
import re

from pecws_client import pecws_post, seal, unseal, assert_success


def get_doctor_pan(lastname, firstname, birthdate, middlename="", suffix=""):
    if not re.fullmatch(r"\d{2}-\d{2}-\d{4}", birthdate):
        raise ValueError(f"birthdate must be MM-DD-YYYY, got {birthdate}")
    query = {"lastname": lastname, "firstname": firstname,
             "middlename": middlename, "suffix": suffix, "birthdate": birthdate}
    # application/json per Annex A; if the test server rejects it, use "text/xml" (KI-25).
    env = assert_success(
        pecws_post("getDoctorPAN", seal(json.dumps(query), "application/json")))
    return json.loads(unseal(env["result"]))["pan"]  # store exactly as returned


pan = get_doctor_pan("ON", "LIFE", "10/11/1992".replace("/", "-"), middlename="GOES")
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

## Notes and gotchas

::: warning The DevKit shows a professional's PAN in several formats (KI-48)
| Where | Value or format | Shape |
|---|---|---|
| This method's decrypted sample ([p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50)) | `0000-0000000-0` | 4-7-1 digits, with dashes |
| Dummy test data ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)) | `1504-2400015-3`, `1100-2400002-5` | 4-7-1 digits, with dashes |
| eClaims XML sample, `PROFESSIONALS@pDoctorAccreCode` ([p. 30](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=30)) | `1234-1527066-1` | 4-7-1 digits, with dashes |
| Annex C, `pDoctorAccreCode` ([p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)) | `String(12)`, "Formatted as: '####-######-##'" | 4-6-2 digits, with dashes |
| `isDoctorAccredited` sample `accrecode` ([p. 61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=61)) | `1234567890` | 10 digits, no dashes |

Three of the five sources use 12 digits in a 4-7-1 pattern. With the dashes, that is 14 characters, which is longer than Annex C's `String(12)` ([KI-31](/known-issues#ki-31)). Annex C's own pattern (4-6-2) matches none of the samples. The eClaims DTD declares `pDoctorAccreCode` as plain `CDATA`, so DTD validation won't catch a wrong format.

Recommendation (not from PhilHealth): store the PAN **exactly as this method returns it**, and send it unchanged in `pDoctorAccreCode` and in `isDoctorAccredited`'s `accrecode`. That matches the Guide's XML sample and the test data. Confirm the format with PhilHealth, for example by testing a claim with [eClaimsFileCheck](/api/eclaims-file-check) on the test server. See [KI-48](/known-issues#ki-48).
:::

- **The PAN is not proof of accreditation for a date.** This method only finds the number. To check that the professional was accredited during a confinement, use [isDoctorAccredited](/api/is-doctor-accredited). The Software Solution Validation Test Form checks both lookups separately ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).
- **Professional PAN vs facility PAN.** Your facility's own PAN is what you send to `getToken` as `accreditationNo` (`H12345678` in this site's examples). Don't mix the two up in configuration.
- **Keep PANs as strings.** They contain dashes, so a numeric type can't hold them.
- **Use the cipher-key scheme.** This body is encrypted with your facility's cipher key (empty `key1` and `key2`), not with PhilHealth's public key ([KI-12](/known-issues#ki-12)).

### Common mistakes

- Sending the plain JSON as the HTTP body instead of the encrypted envelope.
- Parsing `result` without decrypting it. Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object.
- Copying the dummy data's birth date `10/11/1992` as-is, instead of `10-11-1992`.
- Swapping first and last names because of the dummy table's duplicated `FIRST_NAME` header.
- Stripping the dashes from the PAN, or reformatting it to Annex C's `####-######-##` pattern, without confirming with PhilHealth.
- Using `dateOfBirth` (from `isClaimEligible`) instead of `birthdate`.

## Related pages

- [isDoctorAccredited](/api/is-doctor-accredited): check accreditation for a confinement's dates
- [getMemberPIN](/api/get-member-pin): same request shape, for members
- [eClaims XML reference](/reference/eclaims-xml): `PROFESSIONALS@pDoctorAccreCode`
- [Test data](/reference/test-data)
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [Glossary](/getting-started/glossary)
- Known issues: [KI-11](/known-issues#ki-11), [KI-25](/known-issues#ki-25), [KI-31](/known-issues#ki-31), [KI-48](/known-issues#ki-48)
