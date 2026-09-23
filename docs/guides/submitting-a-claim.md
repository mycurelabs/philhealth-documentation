---
title: Submitting a claim
description: A step-by-step tutorial for filing one PhilHealth claim through PECWS 3.0, from the admission eligibility check to payment, with pseudo-code, what to store, and error handling.
---

# Submitting a claim

<Badge type="tip" text="Current: rev. 20250217" />

This tutorial walks you through one inpatient All Case Rates (ACR) claim, from admission to payment. For each step you get the PhilHealth e-Claims Web Service (PECWS) method to call, pseudo-code, what to save in your database, and what can go wrong. Read [The claims lifecycle](/getting-started/claims-lifecycle) first for the big picture.

Along the way you build up to four XML documents: the eClaims XML (the claim itself, with the Claim Form 1 and Claim Form 2 data, CF1 and CF2), the electronic Statement of Account (eSOA), Claim Form 5 (CF5, the data for Diagnosis-Related Groups, DRG) and Claim Form 4 (CF4, clinical data). Terms are explained in the [glossary](/getting-started/glossary).

::: info Sources
- [Implementation Guide (rev. 20250217), p. 8–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8): the methods
- [Implementation Guide, Annex A, p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75): cipher-key encryption
- [Implementation Guide, Annex B–E, p. 77–88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77): document types and data dictionaries
- [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [Software Solution Validation Test Form (SSVTF), p. 1–4, 11–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)
- [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx) (sheet "Summary of Errors", codes 222, 509 and 511–514)
- [CF4 data dictionary, rev. 4, p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)
- [PhilHealth Circular 2023-0026 (eSOA)](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf): the example claim's doctor and employer
:::

::: warning PhilHealth documents methods, not a workflow
The Guide describes each method on its own. A few steps have an order stated in the DevKit, and those are cited below. The overall sequence, the database design, the local claim states and the retry rules on this page are **our recommendations**. Where the DevKit is silent, this page says so. Confirm open points with PhilHealth.
:::

## TL;DR

1. **During the stay:** check eligibility on admission ([isClaimEligible](/api/is-claim-eligible) with `isFinal` `"0"`), print the PhilHealth Benefit Eligibility Form (PBEF), and collect the claim data.
2. **At discharge:** run the final eligibility check (`isFinal` `"1"`) and look up the case rate.
3. **Build and validate:** build the eClaims, eSOA, CF5 and CF4 XML with matching identifiers. Check each file locally against its DTD, then call validateeSOA and validateCF5.
4. **Encrypt, host, check and upload:** encrypt each attachment with PhilHealth's public key and publish it at an HTTPS URL. Run eClaimsFileCheck on the final eClaims XML, then send exactly that XML with [uploadeClaims](/api/upload-eclaims) and store the eRECEIPT.
5. **Follow up:** use the Receipt Ticket Number (RTN) to get the claim series numbers, poll the status, answer Return To Hospital (RTH) requests, and reconcile the voucher.

Recommendation (not from PhilHealth): this is the submission order used on every page of this site. The [claims lifecycle](/getting-started/claims-lifecycle#recommended-submission-order) explains why. The [checklist](#checklist) at the end turns these steps into a per-claim list.

## Before you start

Check that you have all of these. Without them, you can't call PECWS or complete a claim. The full list, with a request checklist for PhilHealth, is on [Prerequisites](/getting-started/prerequisites).

| You need | What it is | Where it comes from |
|---|---|---|
| PECWS host name | The `{pecws.domain}` in `https://{pecws.domain}/PHIC/Claims3.0/<method>` | Not in the DevKit ([KI-30](/known-issues#ki-30)); ask PhilHealth |
| Health facility (HF) PhilHealth Accreditation Number (PAN) | Sent as the `accreditationNo` header of getToken ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). Whether each method wants the PAN or the PMCC number is not always clear ([KI-48](/known-issues#ki-48)). | The HF |
| Software certification ID | Sent as the `softwareCertificateId` header of getToken, and inside `eCLAIMS@pUserName` ([KI-03](/known-issues#ki-03)) | PhilHealth, for software that passed [certification](/guides/certification). The DevKit doesn't describe how it is issued. |
| Cipher key | Encrypts request bodies and decrypts responses; issued "to the health facility for each certified software" ([Annex A, p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). Its format and text encoding are not specified; use UTF-8 ([KI-60](/known-issues#ki-60)). | PhilHealth |
| PhilHealth public key certificate | Encrypts attachments | PhilHealth; the DevKit's copy is an expired test certificate ([KI-01](/known-issues#ki-01)) |
| PMCC number | The 6-character facility code for `eCLAIMS@pHospitalCode` and `CF5@pHospitalCode` ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79), [p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). The DevKit never expands "PMCC" ([KI-48](/known-issues#ki-48)). | The HF |
| HTTPS file host | Serves the encrypted attachments to PhilHealth. The DevKit has no hosting rules ([KI-57](/known-issues#ki-57)). | You |
| Test members (PINs) | The DevKit has none, so you can't test isClaimEligible or getMemberPIN with DevKit data ([KI-11](/known-issues#ki-11)) | PhilHealth |
| Encryption and client code | Cipher-key envelopes, public-key attachment encryption, and the calls themselves | The [shared client](/api/#shared-client-setup), [API payload encryption](/guides/encryption/api-payloads), [Attachment encryption](/guides/encryption/attachments) |

::: danger Keep the cipher key out of logs and source control
Anyone with the cipher key can decrypt every request and response of the HF. Load it from a secret store or an environment variable, and never write it to logs.
:::

## The example claim

The code on this page and all of this site's [example files](#step-6-build-the-xml-documents) describe the same fictional claim, so the identifiers match across documents the way they must in a real claim:

| Item | Example value | Where it goes |
|---|---|---|
| Facility PMCC number | `123456` | `eCLAIMS@pHospitalCode`, `CF5@pHospitalCode` |
| Facility PAN | `H12345678` | getToken `accreditationNo`; isClaimEligible `hospitalCode` and generatePBEFPDF `accreno` (both described as the facility's accreditation number, [KI-48](/known-issues#ki-48)); `eSOA@pHciPan`; CF4 `EPCB@pHciAccreNo` |
| Software certificate ID | `SAMPLE-CERT-ID` | getToken `softwareCertificateId`; `eCLAIMS@pUserName` = `":SAMPLE-CERT-ID"` ([KI-03](/known-issues#ki-03)) |
| Facility email | `eclaims@samplehospital.example` | `eCLAIMS@pHospitalEmail` |
| Service provider | `SAMPLE HIS` | `eCLAIMS@pServiceProvider` |
| Hospital transmittal number | `TR20260917001` | `eTRANSMITTAL@pHospitalTransmittalNo`, CF4 `ENLISTMENT@pEClaimsTransmittalId` |
| Hospital claim number | `202609170001` | `CLAIM@pClaimNumber`, CF5 `DRGCLAIM@ClaimNumber`, CF4 `ENLISTMENT@pEClaimId`, `eSOA@pHciTransmittalId` |
| Member and patient | JUAN OCAMPO DELA CRUZ, male, born 09-19-1973, PIN `072007271094` | `CF1`, isClaimEligible |
| Employer | PEN `110474000002`, JOSE A TERAMOTO ODM | `CF1@pPEN`, `CF1@pEmployerName`, isClaimEligible |
| Stay | Admitted 09-15-2026 01:00:00PM, discharged 09-17-2026 03:00:00PM, dengue fever (ICD-10 `A90`), a medical case with no procedure | `CF2`, CF5, CF4 (as `2026-09-15` and `2026-09-17`), eSOA |
| Case rate and benefits | `CR0001`, 10000.00; CF2 `BENEFITS`: 7000.00 for the HF, 3000.00 for professional fees | `ALLCASERATE/CASERATE`, `CONSUMPTION/BENEFITS`, eSOA `PhilHealth` totals |
| Attending doctor | `1504-2400015-3` (LIFE GOES ON) | `PROFESSIONALS@pDoctorAccreCode`, eSOA `ProfessionalInfo@pPAN` |
| Attachment URLs | `https://files.samplehospital.example/eclaims/202609170001/<DOCTYPE>.enc`, where `<DOCTYPE>` is the Annex B document type code, for example `.../CF5.enc` | `DOCUMENT@pDocumentURL` |
| Returned by PhilHealth (illustrative) | An RTN shaped like the Guide's sample `071311000005` (p. 54); claim series number `260917990000101` (15 digits) | Steps 9 to 11 |

Where the values come from: the PMCC number `123456` and the member's name, birth date and PIN are the Guide's own sample values ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). The case rate `CR0001` and its amount are the Guide sample's too; get real values from searchCaseRates. The doctor and the employer are PhilHealth's dummy test records ([Test data](/reference/test-data)). The DevKit has no test members or PINs ([KI-11](/known-issues#ki-11)). Everything else is made up. Reusing the claim number in the CF5 follows DRG error code 222; reusing it in the eSOA and CF4 is our choice. [Step 6](#step-6-build-the-xml-documents) has the details.

## What you will store

Recommendation (not from PhilHealth): save these values as you go. Every later step needs something from an earlier one, and certification asks you to show several of them: the Receipt Ticket Number (RTN) and Transmission Control Number (TCN) that the upload returns, and the mapping between your claim numbers and PhilHealth's.

| Step | Save | Why |
|---|---|---|
| 1. Initial eligibility | Request, `isok`, `referenceno`, `trackingno`, `asof`, time of call | Proof of the check; `referenceno` feeds the PBEF |
| 2. PBEF | The PDF | Reprints; audit |
| 4. Final eligibility | `isok`, `trackingno`, `asof` | `trackingno` goes into `CLAIM@pTrackingNumber` |
| 5. Case rates | Chosen `pCaseRateCode`, amount, effectivity dates | What you claimed and why |
| 6. XML | The exact plain XML of every document you build | Resubmission, audits, [data migration](/guides/data-migration) |
| 7. Validation | Each validator's result and time | Show errors to users (certification requires it) |
| 8. Attachments | Document type, raw file, SHA-256 of the raw file, encrypted file, URL | PhilHealth downloads the URL; Stage 2 compares raw and decrypted files byte by byte |
| 9. Final check and upload | The eClaimsFileCheck result, your `pHospitalTransmittalNo`, the decrypted `eRECEIPT`, RTN, TCN, transmission date and time, error codes | RTN feeds step 10; the transmission date is the official date received |
| 10. Mapping | `pClaimSeriesLhio` for each `pClaimNumber` | The key for steps 11 to 13 |
| 11. Status | Every poll result: `pStatus`, trail, `pAsOf`, `pAsOfTime` | History; RTH and payment triggers |
| 12. RTH | Documents added, result, time | Proof of compliance |
| 13. Payment | Voucher number and date, charges, check numbers and dates | Reconciliation |

Store PhilHealth's identifiers as **strings, exactly as received**. Samples disagree on formats and lengths ([KI-31](/known-issues#ki-31)), so don't strip dashes, pad, or convert to numbers.

::: tip Recommendation: keep your own claim state
PhilHealth's `pStatus` values are not documented beyond `IN PROCESS` ([KI-42](/known-issues#ki-42)). Keep a separate local state for your workflow, for example `DRAFT` → `VALIDATED` → `UPLOADED` → `MAPPED` → `IN_PROCESS` → `RTH` (Return To Hospital) / `PAID` / `DENIED`. Store PhilHealth's raw `pStatus` next to it and map values as you learn them.
:::

## Step 0: The shared client

The code on this page uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup) (`pecws-client.mjs`). It reads four environment variables: `PECWS_BASE_URL`, `PHIC_FACILITY_PAN`, `PHIC_SOFTWARE_CERT_ID` and `PECWS_CIPHER_KEY`. These are the functions the steps below use:

| Function | What it does |
|---|---|
| `pecwsPost(method, body)` | Gets a fresh token, then sends `body` as JSON. Returns the response envelope (`success`, `message`, `result`). |
| `pecwsGet(method, query)` | The same for `GET` methods with query parameters. |
| `pecwsGetWithBody(method, body)` | A `GET` with a JSON body, which `getClaimStatus` needs ([KI-17](/known-issues#ki-17)). |
| `seal(text, docMimeType)` | Encrypts text with your cipher key into an envelope (`docMimeType`, `hash`, `key1`, `key2`, `iv`, `doc`). |
| `unseal(envelope)` | Decrypts an envelope to text. Throws if the SHA-256 hash doesn't match. |
| `assertSuccess(envelope)` | Throws with `message` if `success` isn't `true`; otherwise returns the envelope. |

```js
// PSEUDO-CODE on top of the shared client. It shows the shape of the calls.
// Everything not imported here stands for your own code: storage (db, files,
// fileHost), data (admission, claim, eclaimsXml, ...) and helpers (parseXml,
// showErrors, isTimeout, alertOperator).
import { pecwsGet, pecwsGetWithBody, pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';
```

Why the client works this way:

- **Fresh token per call.** The only hint about token lifetime is the sample message "Token is valid for 20 seconds" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8), [KI-26](/known-issues#ki-26)).
- **Check `success`, then the content.** The Guide defines `success` as "A value of 'true' indicates a successful operation" and `message` as the error message. It does not document HTTP status codes. `success: true` does not prove a claim was accepted; you still have to read the decrypted result ([API overview](/api/)).
- **Check the hash.** Annex A step 1 says to compare the SHA-256 of the decrypted data with the `hash` value to detect tampering or corruption ([p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). `unseal` does this for you.
- **Parse by what you expect.** Responses always show `docMimeType` `"text/xml"`, even for JSON and PDF content ([KI-25](/known-issues#ki-25)). For bodies you encrypt, use `text/xml` for XML and `application/json` for JSON (Annex A step 5a). Every Guide sample with JSON content shows `text/xml`, and both demo kits' payload functions always write `text/xml`. If PhilHealth's test server rejects `application/json`, switch to `text/xml` and tell PhilHealth ([KI-25](/known-issues#ki-25)).

## Step 1: Check eligibility upon admission

**Call:** [isClaimEligible](/api/is-claim-eligible) with `isFinal` `"0"`. The Guide: "Eligibility should be checked upon admission (initial call)" ([p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)).

Wrap the call in a helper, because step 4 calls it again:

```js
// PSEUDO-CODE
async function checkEligibility(request) {
  const env = assertSuccess(await pecwsPost('isClaimEligible',
    seal(JSON.stringify(request), 'application/json')));   // encrypted JSON body
  return JSON.parse(unseal(env.result));  // { isok: "YES" | "NO", referenceno, trackingno, asof }
}

const request = {
  hospitalCode: process.env.PHIC_FACILITY_PAN, // "Accreditation number of the health facility" (p. 69), e.g. H12345678
  isForOPDHemodialysisClaim: 'N',       // "Y" or "N"
  memberPIN: admission.member.pin,      // e.g. 072007271094
  memberBasicInformation: {
    lastname: 'DELA CRUZ', firstname: 'JUAN', middlename: 'OCAMPO',
    maidenname: '', suffix: '', sex: 'M', dateOfBirth: '09-19-1973',  // MM-DD-YYYY
  },
  patientIs: 'M',                       // M member, S spouse, C child, P parent
  admissionDate: '09-15-2026',          // MM-DD-YYYY
  patientPIN: admission.patient.pin,
  patientBasicInformation: { /* same keys as memberBasicInformation */ },
  membershipType: 'S',                  // S = Employed Private
  pEN: '110474000002',
  employerName: 'JOSE A TERAMOTO ODM',
  isFinal: '0',                         // "0" not final, "1" final
};
const check = await checkEligibility(request);
await db.eligibilityChecks.insert({ admissionId, isFinal: false, request, ...check });
```

The values above are illustrative and belong to [the example claim](#the-example-claim), so they match this site's [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml). The member is the Guide's sample member, not a test account: the DevKit has no test members or PINs, so ask PhilHealth for one ([KI-11](/known-issues#ki-11)). The employer comes from PhilHealth's [dummy test data](/reference/test-data). The key names and their spelling come from the Guide's sample, which disagrees with its own table in places ([KI-20](/known-issues#ki-20)); check the [isClaimEligible page](/api/is-claim-eligible) before you rely on them. Note that this `hospitalCode` is described as the HF's accreditation number, while the eClaims XML's `pHospitalCode` uses the PMCC number (Annex C, p. 79). Which one each method really expects is unconfirmed ([KI-48](/known-issues#ki-48)).

**Helpers you may need first:**

- The member doesn't know their PhilHealth Identification Number (PIN): [getMemberPIN](/api/get-member-pin) (name and birth date, [Guide p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)). Whether it also finds dependents' PINs is not stated ([KI-64](/known-issues#ki-64)).
- Employed member: [searchEmployer](/api/search-employer) finds the PhilHealth Employer Number (PEN) and name ([Guide p. 62](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62), [KI-18](/known-issues#ki-18)).

Both lookups are certification requirements: SSVTF Module 1, items 4 and 5, ask for an interface for each ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

**Store:** the request, `isok`, `referenceno`, `trackingno`, `asof`.

**If `isok` is `NO`:** tell the admitting staff right away. The DevKit doesn't document reasons or next steps for an ineligible result.

## Step 2: Print the PhilHealth Benefit Eligibility Form (PBEF)

**Call:** [generatePBEFPDF](/api/generate-pbef-pdf) with the HF accreditation number and the `referenceno` from step 1 ([Guide p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)).

```js
// PSEUDO-CODE: `check` is the result of step 1
const env = assertSuccess(await pecwsPost('generatePBEFPDF', {
  accreno: process.env.PHIC_FACILITY_PAN,
  referenceno: check.referenceno,
}));                                       // plain JSON body, as in the Guide's sample (KI-21, KI-61)
const pdfBytes = Buffer.from(unseal(env.result).trim(), 'base64'); // decrypted text is a base64 PDF
await files.save(`pbef/${admissionId}.pdf`, pdfBytes);
```

**Store:** the PDF. Certification checks that the printout complies "with the prescribed format" and passes "the PBEF validator" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). The DevKit doesn't describe either ([KI-56](/known-issues#ki-56)).

## Step 3: Collect the claim data during the stay

No claim-specific call is required here, but plan for these:

- **Doctors.** Use [getDoctorPAN](/api/get-doctor-pan) to find a doctor's PAN and [isDoctorAccredited](/api/is-doctor-accredited) to check accreditation for the admission and discharge dates ([Guide p. 49, 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)). Certification requires screens for both: SSVTF Module 1, items 6 and 7 ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). The isDoctorAccredited output is under-documented ([KI-24](/known-issues#ki-24)), and the DevKit doesn't say which discharge date to send while the patient is still admitted ([KI-64](/known-issues#ki-64)).
- **CF4 clinical data**: chief complaint, history, vital signs, physical exam, course in the ward, medicines. See [Building CF4](/guides/cf4).
- **Charges for the eSOA**, using the eSOA item and medicine libraries. See [Building the eSOA](/guides/esoa).
- **Scanned documents** such as the signed Claim Signature Form (CSF), as PDF/A. Certification checks PDF/A-1b ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)).
- **Offline mode.** Certification requires offline encoding, encrypted offline data, scans saved offline, and submission once online ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)). Queue PECWS calls instead of calling them inline from the user interface.

## Step 4: Final eligibility check

**Call:** [isClaimEligible](/api/is-claim-eligible) again, with `isFinal` `"1"`. "The final call generates a Tracking Number to confirm the member's eligibility" ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)).

```js
// PSEUDO-CODE: checkEligibility and request are from step 1
const finalCheck = await checkEligibility({ ...request, isFinal: '1' });
await db.eligibilityChecks.insert({ admissionId, isFinal: true, request, ...finalCheck });
claim.trackingNumber = finalCheck.trackingno ?? '';
```

**Store:** `trackingno`. Put it in `CLAIM@pTrackingNumber`, which Annex C describes as "The Claims Eligibility Tracking number assigned if undergone the Online Eligibility Checking", formatted `####-####-####-####`, and "Can be blank" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).

Recommendation (not from PhilHealth): make the final call at discharge, after the admission data is final. The Guide doesn't say when to make it, or state outright that `trackingno` goes into `pTrackingNumber`.

## Step 5: Look up the case rate

**Call:** [searchCaseRates](/api/search-case-rates), with `targetdate` set to the admission date. The Guide says `targetdate` is "normally the admission date of a target claim" ([p. 37](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)).

```js
// PSEUDO-CODE
const env = assertSuccess(await pecwsPost('searchCaseRates',
  { icdcode: 'A90', rvscode: '', description: '', targetdate: '09-15-2026' })); // plain JSON
const rates = JSON.parse(unseal(env.result)).eCASERATES.CASERATES;  // JSON, although the Guide calls it XML (KI-47)
// Let the user pick; then fill CASERATE@pCaseRateCode and CASERATE@pCaseRateAmount.
```

**Store:** the chosen code, the amount and its effectivity dates. Which `AMOUNT` field goes into `pCaseRateAmount` is not stated by PhilHealth; see the [searchCaseRates page](/api/search-case-rates). The Guide's input description and its sample contradict each other, so test the request shape early ([KI-46](/known-issues#ki-46)).

## Step 6: Build the XML documents

Build each document from your stored data. Start from this site's unofficial examples: [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), [`esoa-sample.xml`](/examples/esoa-sample.xml), [`cf5-sample.xml`](/examples/cf5-sample.xml), [`cf4-sample.xml`](/examples/cf4-sample.xml). All four share one scenario, [the example claim](#the-example-claim): claim `202609170001`, facility `123456` / `H12345678`, the stay from 09-15-2026 to 09-17-2026, and the dengue diagnosis `A90`. So their identifiers, dates and diagnosis already match one another, as the tables below require.

The eSOA example bills the same stay: one attending doctor (`1504-2400015-3`), no operating-room fee, and `PhilHealth` totals of 7000.00 for the HF and 3000.00 for professional fees, the same amounts as `CF2` `BENEFITS@pTotalHCIFees` and `@pTotalProfFees` in the eClaims XML. The DevKit doesn't say how the eSOA's PhilHealth amounts must relate to the eClaims amounts ([KI-53](/known-issues#ki-53)); matching them is our choice. In a real claim, bill only the professionals listed in `PROFESSIONALS`, and derive the eSOA and CF2 from the same billing data.

How we validated them: the eSOA, CF5 and CF4 examples pass Python lxml against their DTDs. The published eClaims DTD breaks libxml2-based validators such as lxml ([KI-43](/known-issues#ki-43)), so `eclaims-minimal.xml` was checked with Java's validating parser (JAXP) and with the patched DTD described on [Validating XML](/guides/validating-xml#the-eclaims-dtd-and-libxml2). `cf5-sample.xml` (no secondary diagnosis, no procedure) is valid against the standalone `CF5.dtd` but **not** against the older CF5 DTD v1.3 printed in the Guide ([KI-06](/known-issues#ki-06)). So send a claim like it through [validateCF5](/api/validate-cf5) early.

### The eClaims XML

This is the claim itself ([eClaims XML reference](/reference/eclaims-xml)). The attributes that link it to everything else:

| Attribute | Value | Source |
|---|---|---|
| `eCLAIMS@pUserName` | `":"` followed by your software certificate ID (example: `":SAMPLE-CERT-ID"`) | Revision 20241111 ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)); [KI-03](/known-issues#ki-03) |
| `eCLAIMS@pUserPassword` | `""` in the Guide's sample | [Guide p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29) |
| `eCLAIMS@pHospitalCode` | The PMCC number (example: `123456`) | "For now PMCC number should be used" (Annex C, p. 79); [KI-48](/known-issues#ki-48) |
| `eCLAIMS@pHospitalEmail` | The HF's email; "Must not be blank" (example: `eclaims@samplehospital.example`) | Annex C, p. 79 |
| `eTRANSMITTAL@pHospitalTransmittalNo` | A new batch number from your system; "should be unique per hospital" (example: `TR20260917001`) | Annex C, p. 79 |
| `eTRANSMITTAL@pTotalClaims` | Number of `CLAIM` elements in the batch | Annex C, p. 79 ("Claims counter") |
| `CLAIM@pClaimNumber` | Your claim ID; "should be unique per hospital" (example: `202609170001`, which fits Annex C's String(12)) | Annex C, p. 79; lengths: [KI-31](/known-issues#ki-31) |
| `CLAIM@pTrackingNumber` | `trackingno` from step 4, or `""` | Annex C, p. 79 |
| `CF2@pHasAttachedSOA` | The example sets `Y`, because it attaches an eSOA (`ESA`). Whether `ESA` requires `Y` is not stated ([KI-62](/known-issues#ki-62)). | `eClaimsDef.dtd` |
| `DOCUMENTS/DOCUMENT` | One per attachment: `pDocumentType` code and HTTPS `pDocumentURL` | Annex B, C; step 8 |

Dates are `MM-DD-YYYY` and times `HH:MM:SSAM/PM` (Annex C, [p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). The DTD requires a `DOCUMENTS` element with at least one `DOCUMENT` in every claim.

::: tip Recommendation: decide attachment URLs before you build the XML
The eClaims XML must contain the final attachment URLs, and [validateCF5](/api/validate-cf5) needs the eClaims XML in step 7, before the files are hosted in step 8. The DevKit doesn't say whether the XML you send to validateCF5 must already be final ([KI-62](/known-issues#ki-62)). Use a predictable URL scheme, so the XML you validate already has the URLs the files will get. The example claim uses `https://files.samplehospital.example/eclaims/<pClaimNumber>/<DOCTYPE>.enc`, for example `https://files.samplehospital.example/eclaims/202609170001/CF5.enc`.
:::

### The eSOA

See [Building the eSOA](/guides/esoa). Two links to the claim:

- `eSOA@pHciPan` is "The accreditation number issued by PhilHealth to the health facility" ([Annex D, p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)). Example: `H12345678`.
- `eSOA@pHciTransmittalId` is "A UNIQUE reference number assigned to the claim by the submitting health facility" (Annex D, listed there as `pTransmittalId`, [KI-33](/known-issues#ki-33)). Using your `pClaimNumber` here (example: `202609170001`) is our choice, not a PhilHealth rule ([KI-53](/known-issues#ki-53)).

All three components (summary of fees, professional fees, itemized charges) must be present, or PhilHealth returns the claim ([PC 2023-0026 p. 4, V.N](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)).

### The CF5 (DRG data)

See [Building CF5](/guides/cf5). The DRG error-code workbook ties the CF5 to the eClaims XML ([DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx), sheet "Summary of Errors"):

- Code 222, "CF5 ClaimNumber not found in eClaims XML": the claim number "must exist in eClaims XML (pClaimNumber 'xml attribute')". So `DRGCLAIM@ClaimNumber` = `CLAIM@pClaimNumber` (example: both `202609170001`).
- Code 509, "CF5 pHospitalCode not found in eClaims XML": `CF5@pHospitalCode` must equal the eClaims `pHospitalCode` (example: both `123456`).

::: warning Conflicting description of the CF5 ClaimNumber ([KI-45](/known-issues#ki-45))
Annex E describes `ClaimNumber` as a 13-digit number "assigned to the claim upon successful submission of claim via eClaims API" ([p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). That contradicts code 222, the fact that validateCF5 runs before the upload, and PhilHealth's own samples, whose claim numbers don't fit the documented lengths either ([KI-31](/known-issues#ki-31)). The same workbook also lists codes 511 "CF5 ClaimNumber is required", 512 "CF5 ClaimNumber not found in eClaims DB", 513 "CF5 ClaimNumber is already exist in CF5 DB with same series number" and 514 "Series Number not found in eClaims DB", without saying when they are raised.

Recommendation (not from PhilHealth): use the same value as `CLAIM@pClaimNumber`, because code 222 names that attribute. The example claim number `202609170001` is 12 digits, so it fits both Annex C's String(12) and the CF5's 13-digit numeric format. Check it with [validateCF5](/api/validate-cf5) and confirm with PhilHealth.
:::

### The CF4

See [Building CF4](/guides/cf4). Its `ENLISTMENT@pEClaimId` is described as "Claim ID Number that will came from the Service Provider's system", and `pEClaimsTransmittalId` as the "HCI Eclaims Transmittal ID Number that is generated by the Service Provider's System" ([CF4 data dictionary, p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)). Using your `pClaimNumber` and `pHospitalTransmittalNo` (example: `202609170001` and `TR20260917001`) is our choice. CF4 dates use `YYYY-MM-DD`, unlike the eClaims XML ([KI-08](/known-issues#ki-08)): the example stay is `2026-09-15` to `2026-09-17`.

For `EPCB@pUsername` the dictionary says "Use the EClaims Software Certificate ID", but it doesn't say whether the eClaims `":"` prefix applies here too; the CF4 example uses the plain ID `SAMPLE-CERT-ID` ([KI-55](/known-issues#ki-55)).

::: warning Attribute-name case differs between the CF4 dictionary and DTD ([KI-55](/known-issues#ki-55))
The data dictionary writes `pEClaimID` and `pEClaimsTransmittalID`; [`CF4.dtd`](/originals/cf4/CF4.dtd) declares `pEClaimId` and `pEClaimsTransmittalId`. XML is case-sensitive, so use the DTD spelling.
:::

**Store:** the exact plain XML of every document.

## Step 7: Validate the XML files

Validate in two layers, before you encrypt or host anything. Stop at the first failure, fix, and start again. The whole eClaims file gets its final check in step 9, once the attachment URLs are live.

### 7a. Locally, against the DTDs

Free, fast and offline, but it checks structure only. See [Validating XML](/guides/validating-xml). The eClaims DTD needs a small patch before libxml2-based tools (xmllint, Python lxml, PHP DOM) can check it properly, or you can validate with Java ([KI-43](/known-issues#ki-43)); [that page explains why](/guides/validating-xml#the-eclaims-dtd-and-libxml2).

### 7b. PhilHealth's eSOA and CF5 validators

```js
// PSEUDO-CODE
const esoaEnv = assertSuccess(await pecwsPost('validateeSOA', seal(esoaXml, 'text/xml')));
const esoaCheck = JSON.parse(unseal(esoaEnv.result));   // may contain { errors: [...] }
if (esoaCheck.errors?.length) return showErrors('eSOA', esoaCheck.errors);

// validateCF5's response is not documented (KI-42): don't assume its shape.
// Store it whole; /api/validate-cf5 shows a reader for every likely shape.
const cf5Response = await pecwsPost('validateCF5', {
  cf5: seal(cf5Xml, 'text/xml'),
  eclaims: seal(eclaimsXml, 'text/xml'),   // the same eClaims XML you will upload
});
await db.validations.insert({ claimNumber: claim.number, method: 'validateCF5', response: cf5Response });
```

- **validateeSOA.** When decrypted, the result "may contains a response JSON object containing the error details", an `errors` array of strings ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)). The success shape is not documented ([KI-42](/known-issues#ki-42)).
- **validateCF5.** The Guide has no Output section for this method ([p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16), [KI-42](/known-issues#ki-42)). The [DRG error codes](/reference/drg-error-codes) list what it may report.
- Certification requires your system to "display warning errors and major errors" and the validation result for both ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)).
- The Guide says to attach the eSOA and CF5 "after successful validation" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). That is why they come before step 8.
- There is no PECWS validator for CF4 ([KI-55](/known-issues#ki-55)).

**Store:** every validator result, with the time and the exact XML you validated.

## Step 8: Encrypt and host the attachments

Each attachment (PDF or XML) is encrypted by your system, one file at a time, with **PhilHealth's public key** ([attachment guideline, p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). Then you publish it at an HTTPS URL, the one already written in `DOCUMENTS`.

```js
// PSEUDO-CODE: see /guides/encryption/attachments for the real algorithm
import { loadPhilHealthPublicKey, encryptAttachment, sha256Hex }
  from './encrypt-attachment.mjs';          // /examples/encryption/encrypt-attachment.mjs

const philhealthPublicKey = loadPhilHealthPublicKey(currentCertificatePem); // not the expired DevKit file (KI-01)

for (const doc of claim.attachments) {        // e.g. CSF (PDF), ESA, CF4, CF5 (XML)
  const raw = await files.read(doc.rawPath);  // a Buffer with the exact file bytes
  const mimeType = doc.isPdf ? 'application/pdf'
                             : 'text/xml';    // XML attachments: not specified (KI-57)
  const envelope = encryptAttachment(raw, mimeType, philhealthPublicKey);
  //  -> {docMimeType, hash: sha256(raw), key1, key2, iv, doc}  (public-key scheme)
  doc.url = await fileHost.put(`eclaims/${claim.number}/${doc.type}.enc`,   // e.g. eclaims/202609170001/CF5.enc
                               JSON.stringify(envelope));
  doc.rawSha256 = sha256Hex(raw);
  await db.attachments.update(doc);
}
```

| Document type code | Attach when | Source |
|---|---|---|
| `ESA` | For claims covered by PC 2023-0026 (ACR claims, with the exclusions in its scope), after validateeSOA passes | [Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9); [Annex B p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78) |
| `CF5` | When the HF takes part in DRG shadow billing ([CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)), after validateCF5 passes. Which facilities must take part is not stated ([KI-63](/known-issues#ki-63)). | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16); Annex B p. 78 |
| `CF4` | With the CF4 XML. The DevKit doesn't say which claims need a CF4; the CF4 module is mandatory for certification ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)) | Annex B p. 77–78 |
| `CSF`, `SOA`, `DTR` and others | Scanned PDFs, as the benefit requires | [Document types](/reference/document-types) |

The DevKit doesn't list which documents each benefit requires ([KI-62](/known-issues#ki-62)). Confirm with PhilHealth.

The DevKit also doesn't say which `docMimeType` to use for XML attachments. The attachment guideline only shows `application/pdf`. Our examples use `text/xml`, the value PECWS payloads use; confirm it with PhilHealth ([KI-57](/known-issues#ki-57)). The guideline doesn't name the RSA padding either; the example module uses PKCS#1 v1.5, like both demo kits ([KI-59](/known-issues#ki-59)).

::: warning Keep the raw file and keep the URL alive
PhilHealth's Stage 2 certification checks that the encrypted files are reachable "via a web browser", downloadable, decryptable, and identical to the raw files "using byte-by-byte comparison" ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). Keep the raw file and its hash. Don't use URLs that expire; the DevKit doesn't say how long they must stay online ([KI-57](/known-issues#ki-57)). Padding differences can break the byte-by-byte check ([KI-13](/known-issues#ki-13)).
:::

**Store:** document type, raw file path, raw SHA-256, encrypted file, URL.

## Step 9: Check the final file and upload the claim

### 9a. Check the final eClaims XML

**Call:** [eClaimsFileCheck](/api/eclaims-file-check), with the exact eClaims XML you will upload, now that every attachment URL in it is live.

```js
// PSEUDO-CODE
const checkEnv = assertSuccess(await pecwsPost('eClaimsFileCheck', seal(eclaimsXml, 'text/xml')));
const fileCheck = unseal(checkEnv.result);   // content not documented: store it and show it
await db.validations.insert({ claimNumber: claim.number, method: 'eClaimsFileCheck', result: fileCheck });
```

eClaimsFileCheck "allows the caller to validate the eClaims XML File" ([Guide p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)). What the decrypted result contains is not documented: the Guide describes the result with sentences copied from other methods and shows no decrypted sample (p. 44–45; [KI-47](/known-issues#ki-47), [KI-42](/known-issues#ki-42)). The DevKit also doesn't say whether it checks that the attachment URLs are reachable, which is why this site runs it after step 8.

### 9b. Upload

**Call:** [uploadeClaims](/api/upload-eclaims), with the same eClaims XML, encrypted with your cipher key.

```js
// PSEUDO-CODE
await db.transmittals.insert({ transmittalNo, xml: eclaimsXml, state: 'SENDING' });
let env;
try {
  env = assertSuccess(await pecwsPost('uploadeClaims', seal(eclaimsXml, 'text/xml')));
} catch (err) {
  if (isTimeout(err)) {                      // PhilHealth may or may not have received it
    await db.transmittals.update(transmittalNo, { state: 'UNKNOWN' });
    return alertOperator(transmittalNo);     // don't resend blindly (KI-62)
  }
  throw err;
}
const receiptXml = unseal(env.result);
await db.transmittals.update(transmittalNo, { receiptXml });   // store the eRECEIPT first

const r = parseXml(receiptXml).eRECEIPT;
const ok = r.pReceiptTicketNumber && r.pTransmissionControlNumber && r.REMARKS.length === 0;
await db.transmittals.update(transmittalNo, {
  state: ok ? 'RECEIVED' : 'REJECTED',
  rtn: r.pReceiptTicketNumber, tcn: r.pTransmissionControlNumber,
  transmissionDate: r.pTransmissionDate, transmissionTime: r.pTransmissionTime,
  errors: r.REMARKS.map(e => ({ code: e.pErrCode, text: e.pErrDescription })),
});
```

What the Guide says:

- The upload "ensures Document Type Definition (DTD) compliance and validates XML element attributes based on the eClaims XML Elements Attribute Definition table" (we read that table as the Annex C data dictionary, [KI-09](/known-issues#ki-09)).
- "The transmission date serves as the official date received for the uploaded claims, which will be used to measure the Turnaround Time (TAT)" ([p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).
- A successful `eRECEIPT` has `pTransmissionControlNumber` and `pReceiptTicketNumber`. A failed one has a blank TCN and `REMARKS` with `pErrCode` and `pErrDescription` ([p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35); Annex C: TCN "Will be blank if the transmission is failed", [p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)).

The success test in the pseudo-code is our recommendation; the [uploadeClaims page](/api/upload-eclaims) explains it. The error codes are not listed anywhere in the DevKit ([KI-42](/known-issues#ki-42)). For every element and attribute of the XML you upload, see the [eClaims XML reference](/reference/eclaims-xml).

**Store:** the eClaimsFileCheck result, the decrypted `eRECEIPT`, RTN, TCN, transmission date and time, and any errors. Certification checks that the system shows a successful-upload notification and prints the RTN/TCN ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

## Step 10: Get PhilHealth's claim series numbers

**Call:** [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN as the `receiptTicketNumber` query parameter ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53), [KI-22](/known-issues#ki-22)).

```js
// PSEUDO-CODE
const env = assertSuccess(await pecwsGet('getUploadedClaimsMap',
  { receiptTicketNumber: transmittal.rtn }));
const conf = JSON.parse(unseal(env.result)).eCONFIRMATION;
const mappings = Array.isArray(conf.MAPPING) ? conf.MAPPING : [conf.MAPPING]; // sample: one object
for (const m of mappings) {
  await db.claims.update({ claimNumber: m.pClaimNumber }, {
    seriesLhio: m.pClaimSeriesLhio, receivedDate: conf.pReceivedDate, state: 'MAPPED',
  });
}
```

The sample shows a single `MAPPING` object for a one-claim upload ([p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)). The shape for several claims isn't documented, so the code accepts both. The DevKit also doesn't say how soon after the upload the mapping is available ([KI-64](/known-issues#ki-64)).

**Store:** `pClaimSeriesLhio` against each `pClaimNumber`. Certification asks for this mapping ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

## Step 11: Track the status

**Call:** [getClaimStatus](/api/get-claim-status) with a list of series numbers. It is a `GET` with a JSON body ([Guide p. 46](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46), [KI-17](/known-issues#ki-17)); `pecwsGetWithBody` sends one.

```js
// PSEUDO-CODE: run on a schedule for claims that are not final yet
const pending = await db.claims.find({ state: { in: ['MAPPED', 'IN_PROCESS', 'RTH'] } });
const env = assertSuccess(await pecwsGetWithBody('getClaimStatus',
  { serieslhionos: pending.map(c => c.seriesLhio) }));   // plain JSON body
const res = JSON.parse(unseal(env.result));
for (const { STATUS } of res.CLAIMS) {
  await db.statusHistory.insert({
    seriesLhio: STATUS.CLAIM.pClaimSeriesLhio, pStatus: STATUS.CLAIM.pStatus,
    trail: STATUS.CLAIM.TRAIL.PROCESS, asOf: STATUS.pAsOf, asOfTime: STATUS.pAsOfTime,
  });
  // Map pStatus to your local state here. Only "IN PROCESS" is documented (KI-42).
}
```

**Store:** every result. The Guide's sample status is `IN PROCESS` with a trail of stages such as `RECEIVING`, `ENCODING` and `VALIDATION` ([p. 47–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=47)). Ask PhilHealth for the full list of `pStatus` values, including the ones that mean RTH, paid and denied. The DevKit doesn't say whether it wants the 13- or the 15-digit form of the series number, or how many you may send per call ([KI-64](/known-issues#ki-64)).

## Step 12: Answer a Return-To-Hospital (RTH)

**Call:** [addRequiredDocument](/api/add-required-document), "in compliance with RTH claims" ([Guide p. 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)). First encrypt and host the new documents as in step 8. In this example, PhilHealth asked for a Diagnostic Test Result (`DTR`).

```js
// PSEUDO-CODE
const documentsXml =
  '<DOCUMENTS>' +
  '<DOCUMENT pDocumentType="DTR" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/DTR.enc"/>' +
  '</DOCUMENTS>';
const env = assertSuccess(await pecwsPost('addRequiredDocument', {
  pSeriesLhioNo: claim.seriesLhio,          // plain string
  pXML: seal(documentsXml, 'text/xml'),     // encrypted envelope
}));
// Documented results: "Claims has already been paid", "Claims has already been denied" (KI-29)
```

::: warning The addRequiredDocument sample uses http:// URLs ([KI-57](/known-issues#ki-57))
The Guide's sample `DOCUMENTS` list uses `http://sample/file/other/cf1.pdf` and similar URLs ([p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)), but Annex C defines `pDocumentURL` as the "URL of the document accessible via https" ([p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). Use HTTPS here too.
:::

**Store:** documents added, result, time. Certification asks for "an interface and notification for submitting additional documents for RTH claims" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

## Step 13: Reconcile the payment

**Call:** [getVoucherDetails](/api/get-voucher-details) with `voucherNo`. The Guide says it comes from `pVoucherNo` "returned by the getClaimStatus method if a voucher has already been prepared", and "a single voucher may contain multiple claims" ([p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). The getClaimStatus sample doesn't show `pVoucherNo` ([KI-23](/known-issues#ki-23)).

```js
// PSEUDO-CODE
const env = assertSuccess(await pecwsGet('getVoucherDetails', { voucherNo })); // query string: our inference (KI-61)
const voucher = JSON.parse(unseal(env.result)).VOUCHER;
await db.vouchers.upsert({ voucherNo: voucher.pVoucherNo, date: voucher.pVoucherDate, raw: voucher });
for (const c of voucher.CLAIM) await db.claims.update({ seriesLhio: c.pClaimSeriesLhio }, { state: 'PAID' });
```

**Store:** the whole voucher, including the per-payee charges and the check numbers and dates in `SUMMARY.PAYEE[]` ([p. 58–59](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=58)).

## Error handling

| Symptom | Likely cause | What to do |
|---|---|---|
| `getToken` returns `success` other than `true` | Wrong `accreditationNo` or `softwareCertificateId`, wrong host, or software not certified | Check configuration; ask PhilHealth. The DevKit lists no getToken error messages. |
| A call fails after working a moment ago | Token expired ([KI-26](/known-issues#ki-26)) | Get a new token and retry once. |
| Decryption fails, or the hash doesn't match | Wrong cipher key; hex string used instead of the raw SHA-256 digest ([KI-14](/known-issues#ki-14)); padding not removed ([KI-13](/known-issues#ki-13)); text encoding other than UTF-8 ([KI-60](/known-issues#ki-60)) | See [API payload encryption](/guides/encryption/api-payloads). Never skip the hash check. |
| validateeSOA returns `errors` | eSOA content problems | Show every message to the user, fix, validate again. |
| validateCF5 returns messages | CF5 or eClaims content problems | Show them; look codes up in [DRG error codes](/reference/drg-error-codes). |
| eClaimsFileCheck reports problems | eClaims content problems | Show them, fix, and run steps 7 to 9 again with the corrected XML. |
| `eRECEIPT` has `REMARKS` or a blank TCN | Upload rejected | Show `pErrCode` and `pErrDescription`, fix, upload again. Codes are undocumented ([KI-42](/known-issues#ki-42)). |
| Upload timed out | Unknown whether PhilHealth received it | Don't resend automatically. You have no RTN, so you can't check getUploadedClaimsMap. Flag it for a person and ask PhilHealth how duplicates are handled ([KI-62](/known-issues#ki-62)). |
| getUploadedClaimsMap has no mapping yet | Not documented ([KI-64](/known-issues#ki-64)) | Retry later with a growing delay; the DevKit gives no timing. |
| getClaimStatus ignores your list | Your client or a proxy dropped the `GET` body ([KI-17](/known-issues#ki-17)) | Use a client that sends `GET` bodies, such as the shared client's `pecwsGetWithBody`; confirm with PhilHealth. |
| addRequiredDocument says "Claims has already been paid" or "denied" | Claim is final | Stop and update your local state. |
| PhilHealth can't open an attachment | URL not public HTTPS, expired link, deleted file, wrong key or certificate, RSA padding ([KI-59](/known-issues#ki-59)) | Check from outside your network; re-encrypt with the current PhilHealth certificate ([KI-01](/known-issues#ki-01)). |
| Everything fails | PECWS or its database is down | Check [getServerDateTime](/api/get-server-date-time) and [getDBServerDateTime](/api/get-db-server-date-time). Queue work and retry later. |

Recommendation (not from PhilHealth): for automatic retries, generate a new `pHospitalTransmittalNo` for each new upload attempt, and keep `pClaimNumber` the same, because it identifies the claim. The DevKit doesn't say how PECWS treats a repeated claim or transmittal number, or whether a rejected transmittal number may be reused ([KI-62](/known-issues#ki-62)). Confirm with PhilHealth.

## Checklist

Use this list for every claim.

1. Initial eligibility checked upon admission; `referenceno` saved.
2. PBEF generated and printed.
3. Doctors' PANs found and accreditation checked for the confinement dates.
4. Final eligibility checked; `trackingno` saved and in `pTrackingNumber`.
5. Case rate chosen with `targetdate` = admission date.
6. eClaims XML built: `pUserName` = `":"` + certificate ID, PMCC `pHospitalCode`, unique `pClaimNumber` and `pHospitalTransmittalNo`, correct `pTotalClaims`, final attachment URLs.
7. eSOA built with all three components; CF5 `ClaimNumber` and `pHospitalCode` match the eClaims XML; CF4 built.
8. All XML passes local DTD validation (eClaims XML: with Java or the patched DTD, [KI-43](/known-issues#ki-43)).
9. validateeSOA and validateCF5 pass; results shown to the user and saved.
10. Attachments encrypted with PhilHealth's public key, one by one; raw files and hashes kept; HTTPS URLs reachable from outside.
11. eClaimsFileCheck run on the final eClaims XML; result saved.
12. Exactly that XML uploaded; `eRECEIPT` saved; RTN and TCN shown and printable.
13. Claim series numbers mapped and saved.
14. Status polled on a schedule; RTH handled with addRequiredDocument.
15. Voucher details saved and reconciled.

## Common mistakes

1. **Reusing a token.** It is short-lived ([KI-26](/known-issues#ki-26)). Get a new one per call.
2. **Using the PAN where the PMCC number goes, or the reverse.** getToken, isClaimEligible and eSOA use the accreditation number; the eClaims and CF5 `pHospitalCode` use the PMCC number. Confirm with PhilHealth which one each method expects ([KI-48](/known-issues#ki-48)).
3. **Writing `pUserName` without the leading colon** ([KI-03](/known-issues#ki-03)).
4. **Encrypting attachments with the cipher key**, or the eClaims body with the public key ([KI-12](/known-issues#ki-12)).
5. **Treating `success: true` as "claim received".** Read the `eRECEIPT`.
6. **Losing the RTN.** Without it, you can't get the claim series numbers.
7. **Validating the CF5 against a different eClaims XML than the one you upload.** The claim number and hospital code must match (codes 222, 509).
8. **Running eClaimsFileCheck before the attachments are hosted**, or uploading a different XML from the one you checked.
9. **Letting attachment URLs expire or deleting raw files.** Certification downloads and compares them.
10. **Resending an upload after a timeout without checking.** You risk duplicate claims ([KI-62](/known-issues#ki-62)).

## Related pages

- [The claims lifecycle](/getting-started/claims-lifecycle)
- [API overview and conventions](/api/), including the [shared client](/api/#shared-client-setup)
- [API payload encryption](/guides/encryption/api-payloads) and [Attachment encryption](/guides/encryption/attachments)
- [Building the eSOA](/guides/esoa), [Building CF5](/guides/cf5), [Building CF4](/guides/cf4)
- [Validating XML](/guides/validating-xml)
- [eClaims XML reference](/reference/eclaims-xml), [Document types](/reference/document-types), [Test data](/reference/test-data)
- [Software certification (SSVTF)](/guides/certification)
- [Known issues](/known-issues)
