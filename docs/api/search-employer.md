---
title: searchEmployer
description: Search PhilHealth's employer records by PhilHealth Employer Number (PEN) and/or employer name.
---

# searchEmployer

Search PhilHealth's employer records by PhilHealth Employer Number (PEN), employer name, or both.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/searchEmployer` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON with the PEN and/or the employer name. The key names in the table and in the sample disagree ([KI-18](/known-issues#ki-18)). The Guide doesn't say the body is encrypted; its sample is plain JSON ([KI-61](/known-issues#ki-61)). |
| Response `result` | Encrypted envelope (cipher key). Once decrypted, it is JSON: `eEMPLOYERS.employer[]` with `pPEN`, `pEmployerName`, `pEmployerAddress`, plus `eEMPLOYERS.ASOF`. |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 62–63: Search Employer Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)
- [Implementation Guide, p. 3–4: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (added in 20240423; "updated the key names documentation" in 20241111)
- [Implementation Guide, Annex C, p. 80: eClaims data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) (`pPEN`, `pEmployerName`)
- [Implementation Guide, p. 29: eClaims XML sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29) (`CF1@pPEN`)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (dummy employers for testing)
:::

::: tip PIN, PAN or PEN?
A **PEN** (PhilHealth Employer Number) identifies an employer. Annex C defines it as "a unique 12 digit number assigned to an employer" ([p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). Don't confuse it with a member's **PIN** (PhilHealth Identification Number, see [getMemberPIN](/api/get-member-pin#pin-pan-and-pen)) or a **PAN** (PhilHealth Accreditation Number, see [getDoctorPAN](/api/get-doctor-pan)). See the [glossary](/getting-started/glossary).
:::

## When to use it

The Guide says this method "allows searching for an employed member's employer using the PhilHealth Employer Number (PEN) and/or employer name" ([p. 62](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)).

Use it to fill in the employer of an employed member correctly, for the eligibility check and for the claim. The employer details you find are used in:

| Where | Fields | Rule |
|---|---|---|
| [isClaimEligible](/api/is-claim-eligible) request | `pEN`, `employerName` | `employerName` is "Applicable only if the member is employed" ([p. 70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=70)) |
| eClaims XML, `CF1` element | `pPEN` (`String(12)`), `pEmployerName` (`String(100)`, "The Registered name of the employer") | "These are disregarded if pMemberShipType is not ('S' or 'G')", that is, unless the member is employed in the private or government sector ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)) |

Software certification requires this lookup. Module 1 of the Software Solution Validation Test Form asks: "Does the system provide an interface for searching for an employer?" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

The Guide gives two different sets of key names ([p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62), [KI-18](/known-issues#ki-18)):

| Meaning | Key in the table | Key in the sample | Description (from the table) |
|---|---|---|---|
| Employer number (PEN) | `philhealthno` | `PEN` | "PhilHealth Employer Number" |
| Employer name | `employername` | `employerName` | "PhilHealth Employer Name" |

Revision 20241111 says the "key names documentation" of this method was "updated" ([p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)), but not which set is correct. The DevKit gives no reason to prefer one over the other. Recommendation (not from PhilHealth): make the key names configurable, try both sets against PhilHealth's test server, and ask PhilHealth which one is official. The code below starts with the sample's keys (`PEN`, `employerName`) only because the site follows the sample when a table and a sample disagree for `isClaimEligible` ([KI-20](/known-issues#ki-20)). That default is a guess, not evidence; switching is one setting.

The description says you can search by PEN "and/or" name. The Guide doesn't say whether name searches match partially, whether they are case-sensitive, or how to leave out one of the two fields. Recommendation (not from PhilHealth): send `""` for the field you are not searching by, and use capital letters for names, as the Guide's samples do.

The Guide doesn't say this body is encrypted ([KI-61](/known-issues#ki-61)). Under the "Body" heading it says only "JSON object containing the following key-value pairs", unlike methods such as [getMemberPIN](/api/get-member-pin) whose bodies are "encrypted using the cipher key of the Health Facility". The sample is plain JSON. Recommendation (not from PhilHealth): send plain JSON. If the test server rejects it, try the encrypted envelope, and confirm with PhilHealth.

## Response

The HTTP response is the standard envelope ([Guide p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | The encrypted envelope: `docMimeType` (documented as `"text/xml"`, see [KI-25](/known-issues#ki-25)), `hash` ("The computed hash value of the unencrypted text"), `key1` (`""`), `key2` (`""`), `iv`, `doc` |

Decrypt `result` with your cipher key (see [Encrypting API payloads](/guides/encryption/api-payloads)). The Guide shows the decrypted content as JSON ([p. 63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=63)):

```text
eEMPLOYERS
├── employer[]          one entry per matching employer
│   ├── pPEN
│   ├── pEmployerName
│   └── pEmployerAddress
└── ASOF
```

The Guide doesn't describe these fields. The meanings below come from the key names and the sample values:

| Key | Meaning | Sample values |
|---|---|---|
| `eEMPLOYERS.employer` | Array of matching employers | two entries |
| `pPEN` | The employer's PEN | `"123456789012"`, `"123456789013"` (12 digits, no dashes) |
| `pEmployerName` | The employer's name | `"EMP1"`, `"EMP2"` |
| `pEmployerAddress` | The employer's address; may be empty | `"EMP1"`, `""` |
| `eEMPLOYERS.ASOF` | The date the data is "as of"; presumably `MM-DD-YYYY`. The day and month in the sample are equal, so the order can't be confirmed (compare [KI-49](/known-issues#ki-49)). | `"01-01-2024"` |

The DevKit doesn't document what a search with no matches returns ([KI-42](/known-issues#ki-42)).

## Example

### Request

The Guide's "Sample JSON input" is not valid JSON ([p. 63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=63)). The PEN value opens with a curly quote (`“`) and never closes:

```text
{

    "PEN": “123456789012,
    "employerName": "EMP1"
}
```

Here it is **with the quotes fixed**, keeping the sample's key names:

```json
{
  "PEN": "123456789012",
  "employerName": "EMP1"
}
```

The same search with the table's key names:

```json
{
  "philhealthno": "123456789012",
  "employername": "EMP1"
}
```

### Response

The Guide's "Sample JSON output" ([p. 63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=63)). The values are placeholders ([KI-27](/known-issues#ki-27)):

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

The Guide's "Sample decrypted result" (reformatted):

```json
{
  "eEMPLOYERS": {
    "employer": [
      {
        "pPEN": "123456789012",
        "pEmployerName": "EMP1",
        "pEmployerAddress": "EMP1"
      },
      {
        "pPEN": "123456789013",
        "pEmployerName": "EMP2",
        "pEmployerAddress": ""
      }
    ],
    "ASOF": "01-01-2024"
  }
}
```

### Testing with PhilHealth's dummy employers

The DevKit includes four dummy employers ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)). You can use them as inputs when you test this lookup. The first one is the employer in this site's example claim. The list labels the number column `EMPID_NO`, not PEN, and gives no validity date ([KI-11](/known-issues#ki-11)).

| `EMPID_NO` (PEN) | `EMP_NAME` |
|---|---|
| `110474000002` | JOSE A TERAMOTO ODM |
| `200474306952` | ROOF GARDEN CAFE ODM |
| `003000057138` | TEST EMPLOYER |
| `003000057145` | SAMPLE EMP01 |

For example, search for the example claim's employer by PEN (sample key names shown):

```json
{
  "PEN": "110474000002",
  "employerName": ""
}
```

If PhilHealth's test environment recognizes the dummy data, you'd expect one employer named `JOSE A TERAMOTO ODM`. The DevKit doesn't say which environment the dummy records exist in ([KI-11](/known-issues#ki-11)). See [Test data](/reference/test-data).

### Code

Recommendation (not from PhilHealth). The key names are a setting, because of [KI-18](/known-issues#ki-18). The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsPost` / `pecws_post` sends the plain JSON body with a fresh token ([KI-61](/known-issues#ki-61)), `assertSuccess` / `assert_success` throws unless `success` is `true`, and `unseal` decrypts `result` and returns the text (it throws when the hash doesn't match).

::: code-group

```js [Node.js 18+]
import { pecwsPost, unseal, assertSuccess } from './pecws-client.mjs'

// Switch to 'table' if PhilHealth confirms philhealthno / employername.
const KEY_STYLE = process.env.SEARCH_EMPLOYER_KEYS ?? 'sample'
const KEYS = {
  sample: { pen: 'PEN', name: 'employerName' },
  table: { pen: 'philhealthno', name: 'employername' },
}[KEY_STYLE]

async function searchEmployer({ pen = '', name = '' }) {
  // Plain JSON body, as in the Guide's sample (KI-61).
  const env = assertSuccess(
    await pecwsPost('searchEmployer', { [KEYS.pen]: pen, [KEYS.name]: name }),
  )
  const data = JSON.parse(unseal(env.result))
  const list = data?.eEMPLOYERS?.employer ?? []
  return {
    asOf: data?.eEMPLOYERS?.ASOF ?? '',
    // Defensive: accept a single object as well as an array.
    employers: (Array.isArray(list) ? list : [list]).map((e) => ({
      pen: String(e.pPEN ?? ''),        // keep leading zeros: 003000057138
      name: e.pEmployerName ?? '',
      address: e.pEmployerAddress ?? '',
    })),
  }
}

// This site's example employer (a DevKit dummy employer)
const { employers } = await searchEmployer({ pen: '110474000002' })
```

```python [Python 3.9+]
import json
import os

from pecws_client import pecws_post, unseal, assert_success

# Switch to "table" if PhilHealth confirms philhealthno / employername.
KEY_STYLE = os.environ.get("SEARCH_EMPLOYER_KEYS", "sample")
KEYS = {
    "sample": {"pen": "PEN", "name": "employerName"},
    "table": {"pen": "philhealthno", "name": "employername"},
}[KEY_STYLE]


def search_employer(pen: str = "", name: str = "") -> dict:
    # Plain JSON body, as in the Guide's sample (KI-61).
    env = assert_success(pecws_post("searchEmployer", {KEYS["pen"]: pen, KEYS["name"]: name}))
    data = json.loads(unseal(env["result"])).get("eEMPLOYERS", {})
    items = data.get("employer") or []
    if isinstance(items, dict):           # defensive: a single object
        items = [items]
    return {
        "as_of": data.get("ASOF", ""),
        "employers": [{"pen": str(e.get("pPEN", "")),   # keep leading zeros
                       "name": e.get("pEmployerName", ""),
                       "address": e.get("pEmployerAddress", "")} for e in items],
    }


# This site's example employer (a DevKit dummy employer)
found = search_employer(pen="110474000002")
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

## Notes and gotchas

::: warning KI-18: key names and sample don't match
On [Guide p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62). See [KI-18](/known-issues#ki-18).

- The input table uses `philhealthno` and `employername`. The sample uses `PEN` and `employerName`.
- The sample input is not valid JSON: `"PEN": “123456789012,` has a curly opening quote and no closing quote.
:::

::: warning The output description was copied from other methods (KI-47)
The Guide's description of `result` says it is the encryption "of the XML text containing the Receipt Ticket Number and other data about the processing of the submitted e-claim data". The `doc` row says it contains "the records of the matching benefit packages. Sample XML text and the DTD of the XML text is shown below" ([p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)). Neither applies to this method. There is no Receipt Ticket Number, no benefit package, and no XML or DTD. The sample right below shows JSON employer records. The wording describes `uploadeClaims` (Receipt Ticket Number, [p. 20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=20)) and `searchCaseRates` (benefit packages, [p. 38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=38)), and the same boilerplate appears in the output tables of several other methods, for example `eClaimsFileCheck`, `getClaimStatus`, `getUploadedClaimsMap` and `getVoucherDetails`. Rely on the decrypted sample, not on the description. See [KI-47](/known-issues#ki-47).
:::

::: warning PEN with or without dashes (KI-48)
Annex C calls the PEN "a unique 12 digit number" with length `String(12)` ([p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). This method's sample and the dummy employer list show 12 plain digits. The Guide's eClaims XML sample, however, writes `pPEN="11-047400000-2"` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). That is the same 12 digits as dummy employer `110474000002`, but with dashes, 14 characters long, and with a different employer name (`PHILHEALTH`). Recommendation (not from PhilHealth): store and send the PEN exactly as this method returns it (12 digits), and confirm with PhilHealth. See [KI-48](/known-issues#ki-48) and [KI-31](/known-issues#ki-31).
:::

- **Keep PENs as strings.** Two of the four dummy PENs start with `00` (`003000057138`). A numeric type drops the zeros.
- **Only for employed members.** You need employer details only when the member's `membershipType` / `pMemberShipType` is `S` (Employed Private) or `G` (printed as "Employer Government", [KI-20](/known-issues#ki-20)). For other members, Annex C says the claim's employer fields are disregarded.
- **Use the registered name.** Recommendation (not from PhilHealth): copy `pEmployerName` from the search result into `pEmployerName` in the claim XML, instead of what the patient typed. Annex C calls this field "The Registered name of the employer".

### Common mistakes

- Copying the Guide's sample input with its curly quote and getting a JSON parse error.
- Parsing `result` without decrypting it. Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object.
- Hard-coding one set of key names without testing the other ([KI-18](/known-issues#ki-18)).
- Sending a PIN (the member's number) as the PEN.
- Expecting XML because the output description says "XML text". The decrypted sample is JSON.
- Reading `asof` in lowercase. This method's key is `ASOF`, inside `eEMPLOYERS`. `isClaimEligible`, in contrast, uses lowercase `asof`.

## Related pages

- [isClaimEligible](/api/is-claim-eligible): uses `pEN` and `employerName`
- [eClaims XML reference](/reference/eclaims-xml): `CF1@pPEN`, `CF1@pEmployerName`
- [Code tables](/reference/code-tables): membership types
- [Test data](/reference/test-data)
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [Glossary](/getting-started/glossary): PEN, PIN, PAN
- Known issues: [KI-11](/known-issues#ki-11), [KI-18](/known-issues#ki-18), [KI-47](/known-issues#ki-47), [KI-48](/known-issues#ki-48), [KI-61](/known-issues#ki-61)
