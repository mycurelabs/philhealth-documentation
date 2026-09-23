---
title: Test data
description: The dummy health care professionals and employers in PhilHealth's DevKit, how to use them with getDoctorPAN, isDoctorAccredited, searchEmployer and the eClaims XML, and when they expire.
---

# Test data

<Badge type="tip" text="Current" /> <Badge type="danger" text="Expires 2026-12-31" />

The DevKit contains one page of dummy data: two health care professionals (doctors) and four employers. Use them to test the professional and employer lookups and to fill professional and employer fields in test claims. The file doesn't say which environment accepts them. Presumably it is PhilHealth's test environment; confirm with PhilHealth before you rely on it ([KI-11](/known-issues#ki-11)). There are **no dummy members**, so the file can't help you test member lookups.

::: info Sources
- [Dummy Health Care Providers and Employers.pdf](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (1 page; the page itself is undated, the PDF file was created 2024-08-01)
- [Implementation Guide (rev. 20250217), p. 49–50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49) (`getDoctorPAN`), [p. 60–61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60) (`isDoctorAccredited`), [p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62) (`searchEmployer`), [p. 69–70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69) (`isClaimEligible`), [p. 29–31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29) (upload sample), [p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) (Annex C), [p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86) (Annex D, eSOA `pPAN`)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd), [`ESOA.dtd`](/originals/esoa/ESOA.dtd)
:::

::: danger The dummy doctors' accreditation ends on 2026-12-31
The table title reads "HCP with Accreditation up to 12/31/2026". After that date, lookups and accreditation checks with these two doctors will presumably stop succeeding, and test claims that name them may be rejected. **Ask PhilHealth for replacement test data before 2026-12-31** so your regression tests keep working from 2027-01-01. The PDF gives no validity date for the employers. See [KI-11](/known-issues#ki-11).
:::

## TL;DR

- **Two dummy doctors,** identified by their PhilHealth Accreditation Numbers (PANs): `1504-2400015-3` (LIFE GOES ON) and `1100-2400002-5` (LIVE LOVE LAUGH), accredited up to 2026-12-31.
- **Four dummy employers:** 12-digit numbers such as `110474000002` (JOSE A TERAMOTO ODM). Store them as text.
- **Use them with** [`getDoctorPAN`](/api/get-doctor-pan), [`isDoctorAccredited`](/api/is-doctor-accredited) and [`searchEmployer`](/api/search-employer), and in the claim XML (`CF1` employer, `PROFESSIONALS`, eSOA `ProfessionalInfo`). The [smoke test](#smoke-test-for-the-three-lookups) below calls all three lookups.
- **Not in the file:** test members (PhilHealth Identification Numbers, PINs), your facility's credentials, and the host name of the PhilHealth eClaims Web Service (PECWS). Ask PhilHealth for them ([KI-11](/known-issues#ki-11), [KI-30](/known-issues#ki-30)).

## What the file contains

### Dummy health care professionals

The table is headed "HCP with Accreditation up to 12/31/2026". Here [HCP](/getting-started/glossary#hcp) means health care professional, as the Guide uses it for `getDoctorPAN` and `isDoctorAccredited`. The PDF's file name calls them "Health Care Providers". Values are copied exactly:

| PAN | FIRST_NAME | MIDDLE_NAME | FIRST_NAME *(sic)* | BIRTH_DATE | TIN | PROF_CLASS |
|---|---|---|---|---|---|---|
| `1504-2400015-3` | LIFE | GOES | ON | 10/11/1992 | `100-123-456-` | MS |
| `1100-2400002-5` | LIVE | LOVE | LAUGH | 11/26/1985 | `200-123-456-` | GP |

How to read the columns:

- **PAN** is the PhilHealth Accreditation Number of the professional. It has the same `####-#######-#` shape as the Guide's `getDoctorPAN` sample result `"0000-0000000-0"` ([Guide p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50)). Annex C documents a different shape; see [Format questions](#format-questions-the-devkit-leaves-open) and [KI-48](/known-issues#ki-48).
- **The header repeats `FIRST_NAME`.** The fourth column is almost certainly the last name, so the names read "LIFE GOES ON" and "LIVE LOVE LAUGH". This is our reading ([KI-11](/known-issues#ki-11)). If a lookup fails, try the other order.
- **BIRTH_DATE** is printed as `MM/DD/YYYY` with slashes. PECWS wants `MM-DD-YYYY` with dashes (for example `10-11-1992`).
- **TIN** (Taxpayer Identification Number) values end with a dash, so they look truncated ([KI-11](/known-issues#ki-11)). No PECWS method in the DevKit takes a professional's TIN, so this doesn't block testing.
- **PROF_CLASS** (`MS`, `GP`) is not defined anywhere in the DevKit ([KI-11](/known-issues#ki-11)). No method or XML field takes it. `GP` usually means general practitioner and `MS` probably medical specialist, but that is our guess.

### Dummy employers

| EMPID_NO | EMP_NAME |
|---|---|
| `110474000002` | JOSE A TERAMOTO ODM |
| `200474306952` | ROOF GARDEN CAFE ODM |
| `003000057138` | TEST EMPLOYER |
| `003000057145` | SAMPLE EMP01 |

The PDF labels the number `EMPID_NO`, not PEN, and gives the employers no validity date ([KI-11](/known-issues#ki-11)). Each value has 12 digits, the length of a PhilHealth Employer Number (PEN), "a unique 12 digit number assigned to an employer" ([migration dictionary p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)). The Guide's own upload sample uses `pPEN="11-047400000-2"` ([Guide p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)), which has the same digits as the first employer, written with dashes ([KI-48](/known-issues#ki-48)). So we treat these values as PENs.

Keep them as **text**. Two of them start with `00`, and a numeric column or a spreadsheet drops the leading zeros.

### What the file does not contain

The PDF lists no dummy members or patients (no PINs), no dummy health facility accreditation number, no software certification ID, no cipher key, and no test host name ([KI-30](/known-issues#ki-30)). You get those from PhilHealth during onboarding.

Without a test member, you can't test [`getMemberPIN`](/api/get-member-pin) or [`isClaimEligible`](/api/is-claim-eligible) with DevKit data ([KI-11](/known-issues#ki-11)). The PIN `072007271094` in the site's examples is the Implementation Guide's sample value, not a test account.

## How to use the test data

The file only lists the data. It doesn't say which methods to try it with. The uses below follow from which PECWS inputs take a PAN, a professional's name and birth date, or a PEN. Treat the expected results as expectations, not documented behavior.

These lookups matter for certification. Part I, Module 1 of the certification form (items 4–7) asks for interfaces to search for an employer, verify the member's PIN, retrieve a professional's PAN, and check a professional's accreditation status for a date ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). The dummy data covers three of the four. For the PIN check you need a test member from PhilHealth ([KI-11](/known-issues#ki-11)).

### getDoctorPAN: find a PAN from name and birth date

[`getDoctorPAN`](/api/get-doctor-pan) takes the professional's name and birth date and returns the PAN. Its body is "in JSON format as encrypted using the cipher key of the Health Facility" ([Guide p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)). Build this JSON, then wrap it in the encrypted envelope ([API payload encryption](/guides/encryption/api-payloads)) with `docMimeType` `application/json`, as [Annex A](/getting-started/glossary#annex) says to do for JSON. If the test server rejects `application/json`, switch to `text/xml` (what every Guide JSON sample and both demo kits use) and tell PhilHealth ([KI-25](/known-issues#ki-25)).

```json
{
  "lastname": "ON",
  "firstname": "LIFE",
  "middlename": "GOES",
  "suffix": "",
  "birthdate": "10-11-1992"
}
```

If the data works as the PDF implies, the decrypted result is `{"pan":"1504-2400015-3"}`.

### isDoctorAccredited: check accreditation for a confinement

[`isDoctorAccredited`](/api/is-doctor-accredited) takes `accrecode`, `admissiondate` and `dischargedate` ([Guide p. 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)).

```json
{
  "accrecode": "1504-2400015-3",
  "admissiondate": "09-15-2026",
  "dischargedate": "09-17-2026"
}
```

Dates before the end of the accreditation (the PDF gives only the end date, 2026-12-31) should return an accredited result. Recommendation (not from PhilHealth): also test a confinement in 2027 to exercise your "not accredited" path. After 2026-12-31 that is presumably the only result you will get.

- **Plain or encrypted body?** The Guide doesn't say this body is encrypted, and its sample is plain JSON. Send plain JSON first ([KI-61](/known-issues#ki-61)).
- **Dashes.** The Guide's own sample sends `"accrecode":"1234567890"`, without dashes. The DevKit doesn't say whether dashes are required, so try the PAN exactly as printed first ([KI-48](/known-issues#ki-48)).
- **Output.** The `result` is encrypted, and its keys are under-documented ([KI-24](/known-issues#ki-24)).
- **Patients still admitted.** The DevKit doesn't say what `dischargedate` to send before discharge ([KI-64](/known-issues#ki-64)).

### searchEmployer: find an employer by PEN and/or name

[`searchEmployer`](/api/search-employer) searches "using the PhilHealth Employer Number (PEN) and/or employer name" ([Guide p. 62](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)). The Guide's table and sample disagree on the key names ([KI-18](/known-issues#ki-18)):

::: code-group

```json [Keys from the table]
{
  "philhealthno": "003000057138",
  "employername": "TEST EMPLOYER"
}
```

```json [Keys from the sample]
{
  "PEN": "003000057138",
  "employerName": "TEST EMPLOYER"
}
```

:::

As with `isDoctorAccredited`, the Guide doesn't say the body is encrypted, and its sample is plain JSON ([KI-61](/known-issues#ki-61)). The `result` is encrypted. Once decrypted, a match comes back as `eEMPLOYERS.employer[]` items with `pPEN`, `pEmployerName` and `pEmployerAddress`, plus `ASOF` ([Guide p. 63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=63)). Test with each employer, with a name only, and with a PEN only.

### isClaimEligible: employed members

For an employed member (`membershipType` `S` or `G`), [`isClaimEligible`](/api/is-claim-eligible) takes the employer's number in `pEN` and the name in `employerName` ([Guide p. 69–70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). A dummy employer fills those fields, but you still need a test member PIN from PhilHealth ([KI-11](/known-issues#ki-11)). The Guide prints the membership-type list under `pEN` by mistake ([KI-20](/known-issues#ki-20)).

### eClaims XML: CF1 employer and PROFESSIONALS

In the upload XML (and the [migration XML](/reference/migration-xml)), `CF1@pPEN` and `CF1@pEmployerName` are used when `pMemberShipType` is `S` or `G`. They "are disregarded if pMemberShipType is not ('S' or 'G')". `PROFESSIONALS` carries the doctor's PAN and name:

```xml
<CF1 ... pMemberShipType="S" ... pPEN="110474000002" pEmployerName="JOSE A TERAMOTO ODM"/>
...
<PROFESSIONALS
    pDoctorAccreCode="1504-2400015-3"
    pDoctorLastName="ON"
    pDoctorFirstName="LIFE"
    pDoctorMiddleName="GOES"
    pDoctorSuffix=""
    pWithCoPay="N"
    pDoctorCoPay=""
    pDoctorSignDate="09-17-2026"/>
```

See the [eClaims XML reference](/reference/eclaims-xml) for the other attributes.

### eSOA: professional fees

In the eSOA, each `ProfessionalFee` has a `ProfessionalInfo` with `pPAN`, `pFirstName`, `pMiddleName`, `pLastName` and `pSuffixName` ([`ESOA.dtd`](/originals/esoa/ESOA.dtd)). Annex D gives `pPAN` a length of Varchar(14), which fits `1504-2400015-3` exactly ([Guide p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)).

```xml
<ProfessionalInfo pPAN="1504-2400015-3" pFirstName="LIFE" pMiddleName="GOES" pLastName="ON" pSuffixName=""/>
```

See [eSOA XML](/reference/esoa-xml).

### Smoke test for the three lookups {#smoke-test-for-the-three-lookups}

This script calls the three lookups once with the dummy data. It uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup). Download [`pecws-client.mjs`](/examples/client/pecws-client.mjs) and [`payload-crypto.mjs`](/examples/encryption/payload-crypto.mjs) (or [`pecws_client.py`](/examples/client/pecws_client.py) and [`payload_crypto.py`](/examples/encryption/payload_crypto.py)) into one folder, set the four environment variables described there, save the script next to them, and run it.

Recommendation (not from PhilHealth): the request formats follow each method's Guide sample. The bodies of `isDoctorAccredited` and `searchEmployer` are sent as plain JSON ([KI-61](/known-issues#ki-61)), and `searchEmployer` uses the sample's key names ([KI-18](/known-issues#ki-18)).

::: code-group

```js [Node.js]
// smoke-test-data.mjs (Node.js 18+). Run: node smoke-test-data.mjs
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs'

// 1. getDoctorPAN: the body is encrypted (Guide p. 49)
const doctor = { lastname: 'ON', firstname: 'LIFE', middlename: 'GOES', suffix: '', birthdate: '10-11-1992' }
const panEnv = assertSuccess(await pecwsPost('getDoctorPAN', seal(JSON.stringify(doctor), 'application/json')))
console.log('getDoctorPAN:', JSON.parse(unseal(panEnv.result))) // expected { pan: '1504-2400015-3' }

// 2. isDoctorAccredited: plain JSON body, as in the Guide's sample (KI-61)
const accEnv = assertSuccess(await pecwsPost('isDoctorAccredited', {
  accrecode: '1504-2400015-3', admissiondate: '09-15-2026', dischargedate: '09-17-2026',
}))
console.log('isDoctorAccredited:', unseal(accEnv.result)) // print the raw text: its format is unclear (KI-24)

// 3. searchEmployer: plain JSON body with the sample's key names (KI-18, KI-61)
const empEnv = assertSuccess(await pecwsPost('searchEmployer', { PEN: '003000057138', employerName: 'TEST EMPLOYER' }))
console.log('searchEmployer:', JSON.parse(unseal(empEnv.result)).eEMPLOYERS)
```

```python [Python]
# smoke_test_data.py (Python 3.9+). Run: python smoke_test_data.py
import json
from pecws_client import pecws_post, seal, unseal, assert_success

# 1. getDoctorPAN: the body is encrypted (Guide p. 49)
doctor = {"lastname": "ON", "firstname": "LIFE", "middlename": "GOES", "suffix": "", "birthdate": "10-11-1992"}
pan_env = assert_success(pecws_post("getDoctorPAN", seal(json.dumps(doctor), "application/json")))
print("getDoctorPAN:", json.loads(unseal(pan_env["result"])))  # expected {"pan": "1504-2400015-3"}

# 2. isDoctorAccredited: plain JSON body, as in the Guide's sample (KI-61)
acc_env = assert_success(pecws_post("isDoctorAccredited", {
    "accrecode": "1504-2400015-3", "admissiondate": "09-15-2026", "dischargedate": "09-17-2026",
}))
print("isDoctorAccredited:", unseal(acc_env["result"]))  # print the raw text: its format is unclear (KI-24)

# 3. searchEmployer: plain JSON body with the sample's key names (KI-18, KI-61)
emp_env = assert_success(pecws_post("searchEmployer", {"PEN": "003000057138", "employerName": "TEST EMPLOYER"}))
print("searchEmployer:", json.loads(unseal(emp_env["result"]))["eEMPLOYERS"])
```

:::

If a call fails, the error carries PhilHealth's `message` and the HTTP status. Failure responses are otherwise undocumented ([KI-42](/known-issues#ki-42)). If `getDoctorPAN` rejects `application/json`, change it to `text/xml` ([KI-25](/known-issues#ki-25)).

## Format questions the DevKit leaves open

::: warning PAN and PEN formats disagree across the DevKit
The DevKit writes the same identifiers in different formats ([KI-48](/known-issues#ki-48)).

**Professional PAN.** Annex C ([Guide p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)) and the [migration dictionary (p. 8)](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=8) define `pDoctorAccreCode` as String(12), "Formatted as: '####-######-##'", which is 4-6-2 digits. Every actual PAN in the DevKit is 4-7-1 digits and 14 characters long: both dummy doctors, the Guide's upload sample `1234-1527066-1` ([p. 30](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=30)), and the `getDoctorPAN` sample result `0000-0000000-0`. The eSOA's `pPAN` is Varchar(14). **Recommendation:** use the PAN exactly as `getDoctorPAN` returns it (`####-#######-#`), and size database columns for at least 14 characters.

**Employer PEN.** `pPEN` is String(12), "a unique 12 digit number". The `searchEmployer` sample output (`"pPEN": "123456789012"`) and the dummy data use 12 plain digits. But the Guide's upload sample writes `pPEN="11-047400000-2"` (14 characters, with dashes). **Recommendation:** send the 12 digits without dashes unless PhilHealth tells you otherwise, and check with [`eClaimsFileCheck`](/api/eclaims-file-check).

Both points are also examples of the length-vs-sample problem in [KI-31](/known-issues#ki-31).
:::

## Common mistakes

- **Sending `10/11/1992`.** PECWS dates use dashes: `10-11-1992`.
- **Putting "ON" or "LAUGH" in `firstname`** because the header says FIRST_NAME twice.
- **Dropping leading zeros** from `003000057138` and `003000057145` by storing PENs as numbers or opening the list in a spreadsheet.
- **Hard-coding the dummy doctors in automated tests without a date check.** The tests start failing after 2026-12-31. Keep test data in configuration so you can swap it.
- **Using test data outside testing.** These are fake people and companies. Never let them reach a production claim.

## Related pages

- [getDoctorPAN](/api/get-doctor-pan), [isDoctorAccredited](/api/is-doctor-accredited), [searchEmployer](/api/search-employer), [isClaimEligible](/api/is-claim-eligible)
- [eClaims XML](/reference/eclaims-xml): `CF1` and `PROFESSIONALS`
- [eSOA XML](/reference/esoa-xml): `ProfessionalInfo`
- [API overview → Shared client setup](/api/#shared-client-setup): the client the smoke test uses
- Known issues: [KI-11](/known-issues#ki-11) (test data), [KI-48](/known-issues#ki-48) (identifier formats), [KI-61](/known-issues#ki-61) (plain or encrypted request bodies)
- [Glossary](/getting-started/glossary): [PAN](/getting-started/glossary#pan), [PEN](/getting-started/glossary#pen), [HCP](/getting-started/glossary#hcp), [TIN](/getting-started/glossary#tin)
