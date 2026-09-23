---
title: getMemberPIN
description: Look up a PhilHealth member's PhilHealth Identification Number (PIN) from their complete name and date of birth.
---

# getMemberPIN

Look up a PhilHealth member's PhilHealth Identification Number (PIN) from the member's complete name and date of birth.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" />

| Property | Value |
|---|---|
| Method | `POST` |
| Endpoint | `https://{pecws.domain}/PHIC/Claims3.0/getMemberPIN` |
| Auth header | `token`, from [getToken](/api/get-token) |
| Request body | JSON `{lastname, firstname, middlename, suffix, birthdate}`, **encrypted** with your health facility's cipher key |
| Response `result` | Encrypted envelope. Once decrypted, it is JSON: `{"pin": "…"}` |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 51–52: Get Member PIN Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)
- [Implementation Guide, p. 3: Revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (method added in 20240423)
- [Implementation Guide, Annex C, p. 79–80: eClaims data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) (PIN format, name and suffix rules, PEN)
- [Software Solution Validation Test Form (rev. 20250217), p. 2: Module 1, Claims Eligibility](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (test data; contains no members)
:::

## When to use it

Use it when a patient doesn't know their PIN, or to check the PIN they gave you before you run an eligibility check or file a claim. The Guide says this method "retrieves the PhilHealth Identification Number (PIN) of a PhilHealth member using the member's complete name and date of birth" ([p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)).

The PIN you get back is used in:

- **[isClaimEligible](/api/is-claim-eligible)**: `memberPIN`, and `patientPIN` when the patient is the member.
- **The eClaims XML** you upload: `CF1@pMemberPIN`, and `CF1@pPatientPIN` when the patient is the member ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). See [eClaims XML](/reference/eclaims-xml).

Software certification requires this lookup. Module 1 of the Software Solution Validation Test Form asks: "Does the system provide an interface for verifying the member's PIN?" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

The Guide describes this method only for **members**. It doesn't say whether it also finds a dependent's PIN ([KI-64](/known-issues#ki-64)). Confirm with PhilHealth before you rely on it for dependents.

### PIN, PAN and PEN

PhilHealth uses three similar-looking identifiers. They are easy to mix up, and each one has its own lookup method:

| Identifier | Stands for | Identifies | Format in the DevKit | Look it up with |
|---|---|---|---|---|
| **PIN** | PhilHealth Identification Number | A member, or a dependent who is the patient | "a unique 12 digit number"; "The last character in the PIN is a modulus 11 check digit" ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). Sample: `072007271094` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). | `getMemberPIN` (this page) |
| **PAN** | PhilHealth Accreditation Number | An accredited health facility, or an accredited health care professional (HCP) such as a doctor | HCP samples look like `1504-2400015-3` ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)); a facility sample is the referring facility's accreditation code `H12345678` in the Guide's eClaims XML sample ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)), which this site also uses as its example facility's PAN. See [getDoctorPAN](/api/get-doctor-pan#notes-and-gotchas) for format conflicts. | [getDoctorPAN](/api/get-doctor-pan) (for HCPs) |
| **PEN** | PhilHealth Employer Number | An employer | "a unique 12 digit number assigned to an employer" ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). Sample: `110474000002` ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)). | [searchEmployer](/api/search-employer) |

The DevKit writes the PAN and PEN in more than one format (with and without dashes, different digit groupings). See [KI-48](/known-issues#ki-48). For these and other terms, see the [glossary](/getting-started/glossary).

## Request

### Headers

| Header | Value |
|---|---|
| `token` | "PECWS authentication token", from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). |
| `Content-Type` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): `application/json`. |

### Body

"The body is in JSON format as encrypted using the cipher key of the Health Facility" ([Guide p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)). Build this plain JSON object, then wrap it in the encrypted envelope (see [Encrypting API payloads](/guides/encryption/api-payloads)):

| Key | Description (from the Guide) | Format |
|---|---|---|
| `lastname` | "Member Last Name" | string |
| `firstname` | "Member First Name" | string |
| `middlename` | "Member Middle Name" | string |
| `suffix` | "Member Suffix Name" | string, for example `III` in the Guide's sample |
| `birthdate` | "Member Birth Date" | "Date Format should be : 'MM-DD-YYYY'" |

The Guide doesn't say which keys are required, or what to send when a member has no middle name or suffix. For the claim XML, Annex C says suffixes are values like "'JR', 'SR', 'III', …etc" and "Suffixes can be blank", and describes names as "Any value consisting of : 'A' to 'Z', 'Ñ'. Can include a space in between characters" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). Recommendation (not from PhilHealth): follow the same conventions here. Send names in capital letters, as the Guide's samples do, and send `""` for a missing middle name or suffix.

## Response

The HTTP response is the standard envelope ([Guide p. 51–52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)):

| Key | Value |
|---|---|
| `success` | "A value of 'true' indicates a successful operation" |
| `message` | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | The encrypted envelope: `docMimeType` (documented as `"text/xml"`, see [KI-25](/known-issues#ki-25)), `hash` ("The computed hash value of the unencrypted text"), `key1` (`""`), `key2` (`""`), `iv`, and `doc` ("The encrypted text of the JSON object containing the PIN") |

Decrypt `result` with your cipher key. The decrypted content is a JSON object with one key:

| Key | Description | Format |
|---|---|---|
| `pin` | The member's PhilHealth Identification Number | String of 12 digits. The Guide's sample is `"000000000000"`. |

The DevKit doesn't document what happens when no member matches, or when more than one does ([KI-42](/known-issues#ki-42)), or whether dependents are found too ([KI-64](/known-issues#ki-64)). Check `success` and `message`, and confirm the behavior on PhilHealth's test server.

## Example

### Request

This is the Guide's "Sample decrypted JSON input payload" ([p. 52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=52)). It is the plain JSON that you encrypt:

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
  "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591….",
  "key1": "",
  "key2": "",
  "iv": "y1jPMxvQE2aJPV……",
  "doc": "PMs1FWFZT+odAp0qf2zManmroSUr3lYgDFnhYeJ……."
}
```

The sample shows `"docMimeType": "text/xml"`, but the plaintext is JSON. Annex A says `docMimeType` should be the MIME type of the data, and gives `application/json` as the example for JSON ([p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76), [KI-25](/known-issues#ki-25)). We recommend `application/json`, as the [API overview](/api/#the-encrypted-envelope) does. Every JSON sample in the Guide and both demo kits use `text/xml`, so if the test server rejects `application/json`, switch to `text/xml` and tell PhilHealth.

### Response

The Guide's "Sample encrypted JSON output payload" ([p. 52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=52)):

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
{"pin":"000000000000"}
```

### Code

Recommendation (not from PhilHealth). The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `seal` encrypts the plain JSON with your cipher key, `pecwsPost` / `pecws_post` sends the envelope with a fresh token, `assertSuccess` / `assert_success` throws unless `success` is `true`, and `unseal` decrypts `result` and returns the text (it throws when the hash doesn't match). The example looks up this site's example member, JUAN OCAMPO DELA CRUZ, born 09-19-1973 (the member in the Guide's eClaims XML sample). The DevKit has no test members, so ask PhilHealth for one before you call the test server ([KI-11](/known-issues#ki-11)).

::: code-group

```js [Node.js 18+]
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'

async function getMemberPin({ lastname, firstname, middlename = '', suffix = '', birthdate }) {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(birthdate)) {
    throw new Error(`birthdate must be MM-DD-YYYY, got ${birthdate}`)
  }
  const query = { lastname, firstname, middlename, suffix, birthdate }
  // application/json per Annex A; if the test server rejects it, use 'text/xml' (KI-25).
  const env = assertSuccess(
    await pecwsPost('getMemberPIN', seal(JSON.stringify(query), 'application/json')),
  )
  const { pin } = JSON.parse(unseal(env.result))
  return pin // keep it a string: PINs can start with 0
}

const pin = await getMemberPin({
  lastname: 'DELA CRUZ', firstname: 'JUAN', middlename: 'OCAMPO', birthdate: '09-19-1973',
})
```

```python [Python 3.9+]
import json
import re

from pecws_client import pecws_post, seal, unseal, assert_success


def get_member_pin(lastname, firstname, birthdate, middlename="", suffix=""):
    if not re.fullmatch(r"\d{2}-\d{2}-\d{4}", birthdate):
        raise ValueError(f"birthdate must be MM-DD-YYYY, got {birthdate}")
    query = {"lastname": lastname, "firstname": firstname,
             "middlename": middlename, "suffix": suffix, "birthdate": birthdate}
    # application/json per Annex A; if the test server rejects it, use "text/xml" (KI-25).
    env = assert_success(
        pecws_post("getMemberPIN", seal(json.dumps(query), "application/json")))
    return json.loads(unseal(env["result"]))["pin"]  # keep it a string


pin = get_member_pin("DELA CRUZ", "JUAN", "09-19-1973", middlename="OCAMPO")
```

:::

We ran the Node.js and Python snippets (Node.js 24, Python 3.9) against a local mock server, not PECWS.

## Notes and gotchas

::: warning The output table says "PAN" where it means "PIN" (KI-47)
The `result` row of the output table reads: "…the JSON object containing the **PAN** of the submitted encrypted JSON input payload" ([Guide p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)). The sentence is word for word the same as in [getDoctorPAN](/api/get-doctor-pan)'s output table ([p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)), so it was probably copied from there. The `doc` row on the next page correctly says "containing the PIN", and the decrypted sample uses the key `pin` ([p. 52](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=52)). Read the key `pin`, not `pan`. See [KI-47](/known-issues#ki-47).
:::

::: warning No test members in the DevKit (KI-11)
The [dummy test data](/reference/test-data) lists only health care professionals and employers, not members ([test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)). You can't test this method, or `isClaimEligible`, with DevKit-provided data. Ask PhilHealth for test member data. See [KI-11](/known-issues#ki-11).
:::

- **Keep PINs as strings.** The Guide's own sample PIN in the eClaims XML, `072007271094`, starts with a zero ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). A numeric database column or `parseInt` drops it and breaks the 12-digit format.
- **The check digit** ([KI-64](/known-issues#ki-64)). Annex C says the last digit of a PIN is "a modulus 11 check digit" but doesn't give the algorithm (the weights). Don't write your own validator from a guess. Use this method, or ask PhilHealth for the algorithm.
- **Same key names as getDoctorPAN, different from isClaimEligible.** This method uses `birthdate`. `isClaimEligible`'s basic-information objects use `dateOfBirth`, plus `maidenname` and `sex`.
- **Use the cipher-key scheme.** This body is encrypted with your facility's cipher key (empty `key1` and `key2`), not with PhilHealth's public key ([KI-12](/known-issues#ki-12)).
- **The sample hashes are placeholders.** The sample `hash`, `iv` and `doc` values are shortened with "…", and they are almost identical to the `getDoctorPAN` samples (the output samples are exactly the same). You can't use them to test your encryption ([KI-27](/known-issues#ki-27)).

### Common mistakes

- Sending the plain JSON as the HTTP body instead of the encrypted envelope.
- Parsing `result` without decrypting it. Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object.
- Sending the date as `1990-01-01` or `01/01/1990`. The format is `MM-DD-YYYY`: `01-01-1990`.
- Using `lastName` or `birthDate` in camelCase. The keys are all lowercase.
- Using `dateOfBirth` (from `isClaimEligible`) instead of `birthdate`.
- Reading `pan` from the result because the output table says "PAN".

## Related pages

- [isClaimEligible](/api/is-claim-eligible): uses the PIN
- [getDoctorPAN](/api/get-doctor-pan): same request shape, for health care professionals
- [searchEmployer](/api/search-employer): find a PEN
- [Encrypting API payloads](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- [eClaims XML reference](/reference/eclaims-xml): `CF1@pMemberPIN` and `CF1@pPatientPIN`
- [Test data](/reference/test-data)
- [Glossary](/getting-started/glossary)
- Known issues: [KI-11](/known-issues#ki-11), [KI-25](/known-issues#ki-25), [KI-47](/known-issues#ki-47), [KI-48](/known-issues#ki-48), [KI-64](/known-issues#ki-64)
