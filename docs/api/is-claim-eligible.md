---
title: isClaimEligible
description: Check whether a PhilHealth member or dependent is eligible for claims availment, and get the PBEF reference number and the claim's tracking number.
---

# isClaimEligible

Check whether a PhilHealth member, or one of the member's dependents, is eligible to use PhilHealth benefits ("claims availment") for an admission or an outpatient hemodialysis claim.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/isClaimEligible` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON, **encrypted** with your health facility's cipher key (the standard [encrypted envelope](/api/#the-encrypted-envelope)) |
| Response `result` | Encrypted envelope. Once decrypted, it is JSON with `isok`, `referenceno`, `trackingno` and `asof`. |

::: tip What you need to do
1. **On admission**, call with `isFinal: "0"`. Show `isok` to the admitting staff, and keep `referenceno` so you can print the PBEF with [generatePBEFPDF](/api/generate-pbef-pdf).
2. **Before you build the claim**, call again with `isFinal: "1"`, and put the returned `trackingno` in the eClaims XML attribute `CLAIM@pTrackingNumber`.
3. **Encrypt** the plain JSON body with your cipher key and send the bare envelope, not wrapped in `"result"`. Send every value as a string.
4. **Confirm with PhilHealth** which facility identifier goes in `hospitalCode` ([KI-48](/known-issues#ki-48)). Use the sample's key spelling `patientBasicInformation` ([KI-20](/known-issues#ki-20)).
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 69–72: Is Claim Eligible Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)
- [Implementation Guide, p. 3–4: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (20240823 `patientIs` values; 20240910 `memberpPIN` renamed to `memberPIN`; 20241111 `hospitalCode` definition and sample update)
- [Implementation Guide, p. 73: Generate PBEF PDF Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73) (where `referenceno` goes)
- [Implementation Guide, Annex C, p. 79–80: eClaims data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) (`pTrackingNumber`, `pMemberShipType`, `pPatientIs`, `pPEN`, PIN format)
- [eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd) (`CLAIM@pTrackingNumber`, `CF1@pMemberShipType`, `CF1@pPatientIs`)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
:::

## When to use it

The result tells you whether the patient is eligible, gives you the reference number you need to print the PhilHealth Benefit Eligibility Form (PBEF), and, on the final call, gives you the tracking number that goes into the claim you upload.

The Guide describes two kinds of call to the same method ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)):

> Eligibility should be checked upon admission (initial call), while the final call generates a Tracking Number to confirm the member's eligibility for their claims availment.

You choose which kind of call you are making with the `isFinal` key:

| Call | `isFinal` | When (from the Guide) | Purpose (from the Guide) |
|---|---|---|---|
| Initial | `"0"` (not final) | "upon admission" | Verify "the eligibility of a member and their valid dependents for claims availment" |
| Final | `"1"` (final) | Not stated | "generates a Tracking Number to confirm the member's eligibility for their claims availment" |

The Guide documents one result structure for both calls. It doesn't say which fields are filled in on an initial call and which only on a final call ([KI-20](/known-issues#ki-20)). Recommendation (not from PhilHealth): write your code so that any of them can be empty.

Here is how the outputs feed the rest of the claims process:

```text
Upon admission
  └─► isClaimEligible (isFinal "0") ──► isok: tell admitting staff whether the patient is eligible

Before you build the claim
  └─► isClaimEligible (isFinal "1") ──► trackingno ──► eClaims XML: CLAIM@pTrackingNumber
                                                           └─► uploadeClaims

When you need to print the PBEF
  └─► generatePBEFPDF (referenceno from isClaimEligible) ──► PBEF as a PDF
```

- **`referenceno`** is the input for [generatePBEFPDF](/api/generate-pbef-pdf). That method's `referenceno` parameter is described as "PBEF reference number from isClaimEligible method" ([Guide p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)).
- **`trackingno`** belongs in the eClaims XML attribute `CLAIM@pTrackingNumber`. Annex C describes that attribute as "The Claims Eligibility Tracking number assigned if undergone the Online Eligibility Checking", `String(20)`, "Formatted as: '####-####-####-####'", "Can be blank" ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). The Guide never says "copy `trackingno` into `pTrackingNumber`" in so many words, but the two descriptions match. The data-migration dictionary uses the same wording ([p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)).

The DevKit doesn't say exactly when to make the final call. Because the tracking number goes into the claim you upload, the final call has to happen before you build the eClaims XML. Recommendation (not from PhilHealth): make the final call once the admission details are confirmed and before you generate the claim, and ask PhilHealth or your PhilHealth Regional Office what timing they expect.

::: tip This method is part of software certification
Module 1 (Claims Eligibility) of the Software Solution Validation Test Form asks whether "the interface display[s] all parameters for the eligibility call, including PIN [PhilHealth Identification Number] (member or dependent), name, date of birth, and the option to indicate the purpose of the PBEF (whether or not for an outpatient hemodialysis claim)". It also checks that the PBEF printout complies with the prescribed format and "pass[es] the PBEF validator" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). The DevKit doesn't describe the validator or the format ([KI-56](/known-issues#ki-56)). See [Software certification](/guides/certification).
:::

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

"The body is in JSON format as encrypted using the cipher key of the Health Facility" ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). You build the plain JSON object below, then wrap it in the encrypted envelope (see [Encrypting API payloads](/guides/encryption/api-payloads)). The HTTP body is the envelope itself.

In the Guide's sample, every value is a JSON **string**, including `isFinal` ([p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)).

| Key | Format / valid values | Description (Guide p. 69–70) |
|---|---|---|
| `hospitalCode` | string | "Accreditation number of the health facility". This definition was added in revision 20241111. It may not be the same value as the claim XML's `pHospitalCode`, which uses the PMCC number "for now" ([KI-48](/known-issues#ki-48)); see [Notes and gotchas](#notes-and-gotchas). |
| `isForOPDHemodialysisClaim` | `"Y"` or `"N"` | "If the purpose of checking eligibility is for hemodialysis claim." OPD means outpatient department. |
| `memberPIN` | string, 12 digits (Annex C) | The member's PhilHealth Identification Number (PIN). Revision 20240910 renamed this key from `memberpPIN`. |
| `memberBasicInformation` | object | The member's [basic information](#basic-information-object). |
| `patientIs` | `"M"`, `"S"`, `"C"`, `"P"` | "Flag whether patient is the member or if dependent the relationship of patient with the member." See [`patientIs` values](#patientis-values). |
| `admissionDate` | `MM-DD-YYYY` | "Refer to the admission date." |
| `patientPIN` | string, 12 digits (Annex C) | "The PIN to the patient. It is either member or dependent PIN." |
| `patientBasicInformation` | object | The patient's [basic information](#basic-information-object). The table spells this key `PatientBasicInformation`; the sample spells it `patientBasicInformation` ([KI-20](/known-issues#ki-20)). |
| `membershipType` | `S`, `G`, `I`, `NS`, `NO`, `PS`, `PG`, `P` | "PhilHealth membership type of the member". See [membership types](#membership-types). |
| `pEN` | string | "The PhilHealth issued number to the employer of the member": the PhilHealth Employer Number (PEN). Find it with [searchEmployer](/api/search-employer). |
| `employerName` | string | "Applicable only if the member is employed. Refer to the employer's name of the member." |
| `isFinal` | `"1"` or `"0"` | "An indicator if the call for eligibility checking is final. Indicate "1" for final and "0" for not final." |

#### Basic information object

Both `memberBasicInformation` and `patientBasicInformation` use this shape ([Guide p. 70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=70)):

| Key | Format / valid values | Description |
|---|---|---|
| `lastname` | string | "The last name of the member or patient" |
| `firstname` | string | "The first name of the member or patient" |
| `middlename` | string | "The middle name of the member or patient" |
| `maidenname` | string | "The maiden name of the member or patient" |
| `suffix` | string | "The suffix or extension name of the member or patient" |
| `sex` | `"M"` or `"F"` | "M=for Male and F=for Female" |
| `dateOfBirth` | `MM-DD-YYYY` | "The date of birth of the member or patient" |

::: warning `dateOfBirth` here, `birthdate` elsewhere
The basic-information objects use `dateOfBirth`. [getMemberPIN](/api/get-member-pin) and [getDoctorPAN](/api/get-doctor-pan) use `birthdate` for the same idea. Copy each key exactly from its own method.
:::

#### `patientIs` values

Revision 20240823 set these values ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). The eClaims DTD uses the same set for `CF1@pPatientIs`.

| Value | Meaning |
|---|---|
| `M` | patient is member (Self) |
| `S` | patient is spouse |
| `C` | patient is child |
| `P` | patient is parent |

#### Membership types

The Guide prints this list under `pEN`, but it belongs to `membershipType` ([KI-20](/known-issues#ki-20)). Annex C prints the same list for `pMemberShipType` ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)), and the eClaims DTD allows exactly these eight codes: `(S|G|I|NS|NO|PS|PG|P)`.

| Code | Meaning (as printed) |
|---|---|
| `S` | Employed Private |
| `G` | Employer Government (as printed; probably means "Employed Government", [KI-20](/known-issues#ki-20)) |
| `I` | Indigent |
| `NS` | Individually Paying |
| `NO` | OFW (overseas Filipino worker) |
| `PS` | Non Paying Private |
| `PG` | Non Paying Government |
| `P` | Lifetime member |

The Guide says the list is "not limited to the following", here and in Annex C ([KI-32](/known-issues#ki-32)). The eClaims Document Type Definition (DTD), though, rejects any other code in the claim XML.

#### The Guide's sample (plain JSON)

This is the Guide's "Sample decrypted JSON input payload", with every value left empty. Only the indentation is changed ([p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)):

```json
{
  "hospitalCode": "",
  "isForOPDHemodialysisClaim": "",
  "memberPIN": "",
  "memberBasicInformation": {
    "lastname": "",
    "firstname": "",
    "middlename": "",
    "maidenname": "",
    "suffix": "",
    "sex": "",
    "dateOfBirth": ""
  },
  "patientIs": "",
  "admissionDate": "",
  "patientPIN": "",
  "patientBasicInformation": {
    "lastname": "",
    "firstname": "",
    "middlename": "",
    "maidenname": "",
    "suffix": "",
    "sex": "",
    "dateOfBirth": ""
  },
  "membershipType": "",
  "pEN": "",
  "employerName": "",
  "isFinal": ""
}
```

#### What goes over the wire

Recommendation (not from PhilHealth): send the envelope itself as the HTTP body, not wrapped in anything else, with `docMimeType` set to `application/json` as Annex A step 5a says for JSON data ([p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76)). This is the same shape as the `getDoctorPAN` and `getMemberPIN` request samples:

```json
{
  "docMimeType": "application/json",
  "hash": "<lowercase hex SHA-256 of the plain JSON above>",
  "key1": "",
  "key2": "",
  "iv": "<base64 of 16 random bytes>",
  "doc": "<base64 of the AES-256-CBC ciphertext>"
}
```

The Guide's own "Sample encrypted JSON input payload" wraps this envelope in `"result"` and shows `"docMimeType": "text/xml"` ([p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)). The `result` wrapper doesn't match the other encrypted request samples ([KI-20](/known-issues#ki-20)). `text/xml` doesn't match Annex A's rule for JSON data, although every JSON sample in the Guide and both demo kits use it ([KI-25](/known-issues#ki-25)). If PhilHealth's test server rejects `application/json`, switch to `text/xml` and tell PhilHealth. See [Notes and gotchas](#notes-and-gotchas).

## Response

The HTTP response is the standard envelope ([Guide p. 70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=70)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | "An encrypted JSON object": `docMimeType` (documented as `"text/xml"`, see [KI-25](/known-issues#ki-25)), `hash`, `key1` (`""`), `key2` (`""`), `iv`, and `doc` ("The encrypted text of the JSON object containing the detailed result of the PBEF inquiry") |

Decrypt `result` with your cipher key (see [Encrypting API payloads](/guides/encryption/api-payloads)). "When decrypted, the JSON object contains the following key-value pairs" ([Guide p. 70–71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=70)):

| Key | Description (from the Guide) | What you do with it |
|---|---|---|
| `isok` | "Eligibility response (YES \| NO)" | Show the answer to the admitting staff. |
| `referenceno` | "Reference number for printing PBEF" | Pass it to [generatePBEFPDF](/api/generate-pbef-pdf) as `referenceno`. |
| `trackingno` | "Tracking number" | Store it with the confinement and put it in `CLAIM@pTrackingNumber` (Annex C format `####-####-####-####`). |
| `asof` | "Response Date" | Recommendation (not from PhilHealth): store it with the confinement as the time eligibility was checked. The format is not specified. |

The Guide does not show a decrypted result sample for this method. Revision 20241111 says it "Updated the sample JSON result documentation" ([p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)), but the 20250217 Guide contains only the encrypted sample ([KI-20](/known-issues#ki-20)).

## Example

### Request (plain JSON, before encryption)

An illustrative initial call for this site's example claim, where the member is also the patient. None of these are real records:

- **Member and patient:** PIN `072007271094`, JUAN OCAMPO DELA CRUZ, born 09-19-1973. This is the member in the Guide's own eClaims XML sample ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). The DevKit contains no test members, so ask PhilHealth for one before you call the test server ([KI-11](/known-issues#ki-11)).
- **Admission:** 09-15-2026.
- **Employer:** dummy employer `110474000002`, JOSE A TERAMOTO ODM, from the DevKit's [test data](/reference/test-data). Membership type `S` (Employed Private), so the employer fields apply.
- **`hospitalCode`:** `H12345678`, the example facility's accreditation number (PAN). The same facility's PMCC number is `123456`, which is what the claim XML's `pHospitalCode` carries "for now". The Guide defines `hospitalCode` as the "Accreditation number of the health facility", so we show the PAN. The DevKit never says which of the two identifiers this method expects, so confirm with PhilHealth before go-live ([KI-48](/known-issues#ki-48)).

```json
{
  "hospitalCode": "H12345678",
  "isForOPDHemodialysisClaim": "N",
  "memberPIN": "072007271094",
  "memberBasicInformation": {
    "lastname": "DELA CRUZ",
    "firstname": "JUAN",
    "middlename": "OCAMPO",
    "maidenname": "",
    "suffix": "",
    "sex": "M",
    "dateOfBirth": "09-19-1973"
  },
  "patientIs": "M",
  "admissionDate": "09-15-2026",
  "patientPIN": "072007271094",
  "patientBasicInformation": {
    "lastname": "DELA CRUZ",
    "firstname": "JUAN",
    "middlename": "OCAMPO",
    "maidenname": "",
    "suffix": "",
    "sex": "M",
    "dateOfBirth": "09-19-1973"
  },
  "membershipType": "S",
  "pEN": "110474000002",
  "employerName": "JOSE A TERAMOTO ODM",
  "isFinal": "0"
}
```

For a dependent, set `patientIs` to `S`, `C` or `P`, put the dependent's PIN in `patientPIN`, and put the dependent's details in `patientBasicInformation`. The member fields stay the member's.

When the patient is the member, the Guide doesn't say what to put in the patient fields. Recommendation (not from PhilHealth): repeat the member's PIN and details, as the Guide's eClaims XML sample does for `CF1` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)).

### Response (from the Guide)

This is the Guide's "Sample JSON output" ([p. 71–72](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)). **We added the comma after the closing brace of `result`**, which the Guide omits ([KI-20](/known-issues#ki-20)). The values are placeholders ([KI-27](/known-issues#ki-27)).

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

### Decrypted result (illustrative)

The Guide has no decrypted sample, so this example only shows the **shape**, using the documented key names. The values are made up. The DevKit specifies a format only for the tracking number (through `pTrackingNumber`).

```json
{
  "isok": "YES",
  "referenceno": "<reference number for printing the PBEF>",
  "trackingno": "0000-0000-0000-0000",
  "asof": "<response date>"
}
```

### Code: initial and final calls

Recommendation (not from PhilHealth). The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup):

- `seal(plaintext, docMimeType)` encrypts the plain JSON with your cipher key into the six-field envelope (Annex A).
- `pecwsPost` / `pecws_post` sends that envelope as the JSON body, with a fresh token.
- `assertSuccess` / `assert_success` throws unless `success` is `true`.
- `unseal(result)` decrypts `result` and returns the decrypted **text**. It throws when the hash doesn't match.

`hospitalCode` is read from `PHIC_FACILITY_PAN`, the facility accreditation number that `getToken` also sends. Whether this method expects the PAN or the PMCC number is not confirmed ([KI-48](/known-issues#ki-48)). The member is this site's example member; the DevKit has no test members ([KI-11](/known-issues#ki-11)).

::: code-group

```js [Node.js 18+]
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'

const member = {
  lastname: 'DELA CRUZ', firstname: 'JUAN', middlename: 'OCAMPO',
  maidenname: '', suffix: '', sex: 'M', dateOfBirth: '09-19-1973',
}

function buildRequest(isFinal) {
  return {
    hospitalCode: process.env.PHIC_FACILITY_PAN, // e.g. H12345678; PAN or PMCC? confirm (KI-48)
    isForOPDHemodialysisClaim: 'N',
    memberPIN: '072007271094',          // always a string: PINs can start with 0
    memberBasicInformation: member,
    patientIs: 'M',
    admissionDate: '09-15-2026',        // MM-DD-YYYY
    patientPIN: '072007271094',
    patientBasicInformation: member,
    membershipType: 'S',
    pEN: '110474000002',
    employerName: 'JOSE A TERAMOTO ODM',
    isFinal,                            // the string "0" or "1", not a number or boolean
  }
}

async function isClaimEligible(request) {
  // application/json per Annex A; if the test server rejects it, use 'text/xml' (KI-25).
  const env = assertSuccess(
    await pecwsPost('isClaimEligible', seal(JSON.stringify(request), 'application/json')),
  )
  return JSON.parse(unseal(env.result)) // { isok, referenceno, trackingno, asof }
}

// 1. Upon admission
const initial = await isClaimEligible(buildRequest('0'))
const eligible = String(initial.isok).trim().toUpperCase() === 'YES'
// Save initial.referenceno, then call generatePBEFPDF to print the PBEF.

// 2. Final call, before you build the eClaims XML
const final = await isClaimEligible(buildRequest('1'))
// Store final.trackingno; it becomes CLAIM@pTrackingNumber.
// An empty value is allowed there ("Can be blank"), but log it so someone can follow up.
```

```python [Python 3.9+]
import json
import os

from pecws_client import pecws_post, seal, unseal, assert_success

member = {
    "lastname": "DELA CRUZ", "firstname": "JUAN", "middlename": "OCAMPO",
    "maidenname": "", "suffix": "", "sex": "M", "dateOfBirth": "09-19-1973",
}


def build_request(is_final: str) -> dict:
    return {
        "hospitalCode": os.environ["PHIC_FACILITY_PAN"],  # PAN or PMCC? confirm (KI-48)
        "isForOPDHemodialysisClaim": "N",
        "memberPIN": "072007271094",       # keep as a string: PINs can start with 0
        "memberBasicInformation": member,
        "patientIs": "M",
        "admissionDate": "09-15-2026",     # MM-DD-YYYY
        "patientPIN": "072007271094",
        "patientBasicInformation": member,
        "membershipType": "S",
        "pEN": "110474000002",
        "employerName": "JOSE A TERAMOTO ODM",
        "isFinal": is_final,               # the string "0" or "1"
    }


def is_claim_eligible(request: dict) -> dict:
    # application/json per Annex A; if the test server rejects it, use "text/xml" (KI-25).
    env = assert_success(
        pecws_post("isClaimEligible", seal(json.dumps(request), "application/json")))
    return json.loads(unseal(env["result"]))  # {isok, referenceno, trackingno, asof}


# 1. Upon admission
initial = is_claim_eligible(build_request("0"))
eligible = str(initial.get("isok", "")).strip().upper() == "YES"
# Save initial["referenceno"], then call generatePBEFPDF to print the PBEF.

# 2. Final call, before you build the eClaims XML
final = is_claim_eligible(build_request("1"))
tracking_no = final.get("trackingno") or ""   # goes into CLAIM@pTrackingNumber
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

## Notes and gotchas

::: warning KI-20: several errors in the Guide's section for this method
The following problems are all on [Guide p. 69–72](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69). See [KI-20](/known-issues#ki-20).

- **Membership codes printed under the wrong key.** The list `S`, `G`, `I`, `NS`, `NO`, `PS`, `PG`, `P` appears under `pEN`, but `pEN` is the employer number. The codes belong to `membershipType`.
- **The encrypted input sample looks like an output.** It is wrapped in `"result": { … }`, and the outer closing brace is missing, so it isn't valid JSON either. The other encrypted request samples ([getDoctorPAN](/api/get-doctor-pan), [getMemberPIN](/api/get-member-pin)) send the bare envelope. Send the bare envelope.
- **A note about a PDF that doesn't belong here.** Under the output sample, the Guide says: "Decrypt the result which is an encrypted base64 PDF document. You may render it as shown below." It then shows an `<embed>` tag. The note and the tag appear to be copied from [generatePBEFPDF](/api/generate-pbef-pdf), whose section has the same example. This method's documented result is JSON with `isok`, `referenceno`, `trackingno` and `asof`. Parse it as JSON.
- **Key casing differs between the table and the sample.** The table says `PatientBasicInformation`; the sample says `patientBasicInformation`, which also matches `memberBasicInformation`. We recommend the sample's spelling (`patientBasicInformation`). JSON keys are usually case-sensitive, so confirm against the test server.
- **The output sample is not valid JSON.** It is missing a comma after the `result` object. We fixed it in the [example above](#response-from-the-guide).
:::

::: warning Two different "hospital codes" (KI-48)
This method's `hospitalCode` is the "Accreditation number of the health facility" ([p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). The Guide describes `getToken`'s `accreditationNo` header ("The PhilHealth Accreditation Number (PAN) of the Health Facility", [p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)) and `generatePBEFPDF`'s `accreno` ("Health facility accreditation number") almost the same way, so it is presumably the same value. The eClaims XML attribute `eCLAIMS@pHospitalCode` is also described as the "Facility Accreditation Number", but its valid value is "For now PMCC number should be used" (the Guide's sample uses `123456`) ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). The DevKit never expands "PMCC", and never says whether `isClaimEligible` expects the PAN or the PMCC number.

In this site's examples, the facility's PAN is `H12345678` and its PMCC number is `123456`. We send the PAN in `hospitalCode`, because that matches the Guide's definition. That is our reading, not a confirmed rule: don't assume that two fields called "hospital code" hold the same value, and confirm with PhilHealth. See [KI-48](/known-issues#ki-48) and the [glossary](/getting-started/glossary).
:::

- **`memberPIN`, not `memberpPIN`.** Revision 20240910 renamed the key ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). Code written against older Guides may still send `memberpPIN`.
- **`patientIs` values changed in 20240823.** The revision history doesn't list the old values. If you maintain an older integration, check that it sends only `M`, `S`, `C` or `P`.
- **`isok` is a word, not a boolean.** The Guide documents `YES` or `NO`. Recommendation (not from PhilHealth): compare case-insensitively after trimming, and treat anything other than `YES` as "not confirmed".
- **What to do when `isok` is `NO` is not documented** ([KI-20](/known-issues#ki-20)). The DevKit doesn't cover the business process for a patient who is not eligible. Ask PhilHealth or your Regional Office.
- **`pTrackingNumber` must always be present in the XML.** The DTD declares `CLAIM@pTrackingNumber` as `CDATA #REQUIRED`, so the attribute must exist. Annex C says the value "Can be blank", and the Guide's XML sample uses `pTrackingNumber=""` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). Annex C gives the format `####-####-####-####` (19 characters, within `String(20)`).
- **Employer fields.** `employerName` is "Applicable only if the member is employed." For the claim XML, Annex C says `pPEN` and `pEmployerName` "are disregarded if pMemberShipType is not ('S' or 'G')" ([p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). Recommendation (not from PhilHealth): send `pEN` and `employerName` for `S` and `G` members, and `""` otherwise.
- **PEN with or without dashes** ([KI-48](/known-issues#ki-48)). Annex C defines the PEN as "a unique 12 digit number", `String(12)`. The [searchEmployer](/api/search-employer) sample returns 12 plain digits (`123456789012`), and so does the dummy employer list (`110474000002`). The Guide's eClaims XML sample, however, writes the same dummy number as `pPEN="11-047400000-2"` (14 characters) ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). The DevKit doesn't say which form this method expects. Recommendation (not from PhilHealth): send the 12 digits exactly as `searchEmployer` returns them, and confirm with PhilHealth.
- **`docMimeType`** ([KI-25](/known-issues#ki-25)). Annex A says to use the MIME type of the data, `application/json` for JSON, and this site follows it. The Guide's samples and both demo kits use `text/xml`. If the test server rejects `application/json`, switch to `text/xml` and tell PhilHealth. When reading the response, don't rely on `docMimeType`.
- **Use the cipher-key scheme.** This body is encrypted with your facility's cipher key (empty `key1` and `key2`), not with PhilHealth's public key ([KI-12](/known-issues#ki-12)).
- **When the method was added is not recorded** ([KI-09](/known-issues#ki-09)). The revision history lists `generatePBEFPDF` among the methods added in 20240423, but never records when `isClaimEligible` was added. Its first mention is the 20240823 `patientIs` change ([p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

### Common mistakes

- Sending `isFinal` as a number (`1`) or a boolean (`true`). Send the string `"1"` or `"0"`.
- Only ever making the initial call, so the claim goes out with an empty `pTrackingNumber`.
- Sending `memberpPIN` (the key name before 20240910), or `birthdate` inside a basic-information object.
- Sending `PatientBasicInformation` (the table's spelling) without testing it. We recommend the sample's `patientBasicInformation`, but confirm on the test server ([KI-20](/known-issues#ki-20)).
- Wrapping the encrypted envelope in `{"result": …}` because the Guide's sample does.
- Parsing `result` without decrypting it. Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object.
- Trying to render the decrypted result as a PDF because of the copied note.
- Storing PINs or PENs as numbers. The Guide's own sample PIN `072007271094` starts with a zero, which a numeric type drops.
- Sending dates as `YYYY-MM-DD` or `DD-MM-YYYY`. Every date here is `MM-DD-YYYY`.
- Putting a membership code such as `S` into `pEN`, because the Guide prints the codes there.

## Related pages

- [generatePBEFPDF](/api/generate-pbef-pdf): turn `referenceno` into the PBEF PDF
- [getMemberPIN](/api/get-member-pin): find a member's PIN
- [searchEmployer](/api/search-employer): find the employer's PEN and name
- [uploadeClaims](/api/upload-eclaims) and [eClaims XML reference](/reference/eclaims-xml): where `pTrackingNumber` goes
- [Code tables](/reference/code-tables): membership types, `patientIs` and other codes
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [Glossary](/getting-started/glossary): PIN, PAN, PEN, PBEF
- [Test data](/reference/test-data)
- Known issues: [KI-11](/known-issues#ki-11), [KI-20](/known-issues#ki-20), [KI-25](/known-issues#ki-25), [KI-48](/known-issues#ki-48), [KI-56](/known-issues#ki-56)
