---
title: The claims lifecycle
description: Who does what, from patient admission to PhilHealth payment, and which PECWS 3.0 method your system calls at each stage.
---

# The claims lifecycle

<Badge type="tip" text="Current: rev. 20250217" />

This page gives you the big picture before you write any code. It shows who is involved in a PhilHealth claim, the stages from admission to payment, and which PhilHealth e-Claims Web Service (PECWS) method your system calls at each stage. Read it first, then follow the hands-on [Submitting a claim](/guides/submitting-a-claim) tutorial.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 6–7](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6): introduction and API overview
- [Implementation Guide, p. 8–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8): the 19 web service methods
- [Implementation Guide, Annex A–C, p. 75–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75): encryption, document types, eClaims data dictionary
- [Software Solution Validation Test Form (SSVTF) for PECWS 3.0 (rev. 20250217), p. 1–4, 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1): what a certified system must do
- [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [PhilHealth Circular (PC) 2023-0026, eSOA policy, p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)
- [CF5 form v0.4 (DRG shadow billing)](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) and [CF4 form (February 2020)](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf): filing deadlines
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)
:::

::: warning The order on this page is partly our recommendation
The Implementation Guide describes each method separately. It does not prescribe one end-to-end sequence. Where the Guide or another DevKit file states an order (for example, check eligibility upon admission, or validate the eSOA before you attach it), this page cites it. Everything else about ordering is **our recommendation**, and is labeled that way.
:::

## TL;DR

- **Set up once.** Ask PhilHealth for test-environment access first: certification itself needs live PECWS calls ([Prerequisites](/getting-started/prerequisites#access-before-certification)). Get your software certified, then get the production certification ID, cipher key, PhilHealth's current public key certificate and the PECWS host name.
- **For each claim.** Check eligibility on admission. After discharge, build and validate the XML files, encrypt and host the attachments, check the final eClaims XML, and upload the claim. Then map, track and reconcile it. The [submission order](#recommended-submission-order) is our recommendation.
- **Store every identifier** that PhilHealth returns (Receipt Ticket Number (RTN), Transmission Control Number (TCN), claim series number) exactly as received.
- **Watch the clock.** The Claim Form 5 (CF5) says to file within 30 days of discharge, and the Claim Form 4 (CF4) says 60 days. The DevKit gives no deadline for the upload itself ([KI-58](/known-issues#ki-58)).

## Why eClaims exists

PhilHealth has run the Electronic Claims (eClaims) system since 2016 for its All Case Rates (ACR) payment mechanism. The Guide says delays and many "Return-to-Hospital" (RTH) claims remained, mainly because of manual steps and "the lack of front-end claims data validation mechanisms". The Universal Health Care Act of 2019 requires PhilHealth to move to paying by Diagnosis-Related Groups (DRG). PECWS 3.0 is the enhanced eClaims interface that also collects the data needed for DRG grouping ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)).

For you as a developer, that history explains two things:

- **Validation matters.** The validator methods (`validateeSOA`, `validateCF5`, `eClaimsFileCheck`) let you catch errors before a claim is filed, instead of getting the claim back later as an RTH.
- **There is more data than before.** Besides the classic claim forms (Claim Form 1 and Claim Form 2, CF1 and CF2), a claim can now carry an electronic Statement of Account (eSOA), a Claim Form 5 (CF5) for DRG, and a Claim Form 4 (CF4) as XML attachments.

## Who is involved

| Actor | What they do in the lifecycle | What your system needs from or for them |
|---|---|---|
| **Patient and member** | The patient receives care. The patient is either the PhilHealth member or a dependent: spouse, child or parent (`pPatientIs` = `M`, `S`, `C`, `P`, [Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). | PhilHealth Identification Numbers (PINs), names, birth dates, membership type, employer. Signatures on forms such as the Claim Signature Form (CSF). |
| **Health facility (HF)** | The accredited hospital or clinic that files the claim and gets paid. Staff admit, encode, bill and follow up. | The HF's PhilHealth Accreditation Number (PAN), used by `getToken`; the PMCC number used as `pHospitalCode` ("For now PMCC number should be used", [Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)); the HF's cipher key. Which facility identifier each method expects is not always clear ([KI-48](/known-issues#ki-48)). |
| **HIS/EMR service provider** | Builds and runs the Hospital Information System (HIS) or Electronic Medical Record (EMR) that talks to PECWS. It can be in-house or outsourced (the SSVTF asks which). That is probably you. | A certified software version, and its software certification ID. You also name yourself in `eCLAIMS@pServiceProvider`. |
| **Health care professionals** | Doctors who attend the patient and bill professional fees. | Their PAN (for example `1504-2400015-3`, a dummy doctor from PhilHealth's [test data](/reference/test-data); format: [KI-48](/known-issues#ki-48)) and accreditation status for the confinement dates. |
| **PhilHealth** | Runs PECWS, receives and processes claims, and pays. Regional Offices run certification Stage 1; the Central Office runs Stage 2 ([SSVTF p. 1, 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). | PECWS host name ([KI-30](/known-issues#ki-30)), the current PhilHealth public key certificate ([KI-01](/known-issues#ki-01)), the cipher key and certification ID. |
| **Your file host** | An HTTPS server or cloud storage that serves the encrypted attachments. PhilHealth downloads them from the URLs in your claim ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). | Stable HTTPS URLs that PhilHealth can reach. |

See the [glossary](/getting-started/glossary) for PIN, PAN, PMCC, RTN, TCN and the other acronyms.

## Before the first claim: one-time setup

You cannot call PECWS until these exist:

1. **A certified software version.** Before that, you need test-environment access to develop and to run the certification tests. The DevKit doesn't say how to get it ([Prerequisites](/getting-started/prerequisites#access-before-certification)). Your HIS must pass the SSVTF (see [Software certification](/guides/certification)). `getToken` needs a "software certification ID for PECWS 3.0 of the Health Facility" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).
2. **A cipher key.** "PhilHealth issues a cipher key to the health facility for each certified software" ([Annex A, p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). You use it to encrypt request bodies and decrypt responses. Its format and the text encoding to use are not specified ([KI-60](/known-issues#ki-60)).
3. **PhilHealth's public key certificate.** You use it to encrypt attachments. The one in the DevKit is an expired test certificate ([KI-01](/known-issues#ki-01)).
4. **The PECWS host name.** The DevKit only writes `https://{pecws.domain}/PHIC/Claims3.0/...` ([KI-30](/known-issues#ki-30)).
5. **An HTTPS location for attachments.**

The DevKit does not describe how the certification ID, cipher key, certificate and host name are handed over. Confirm with PhilHealth. [Prerequisites](/getting-started/prerequisites) lists everything to request, including test-environment access before certification.

::: tip Two keys, two directions
Encrypted request bodies and encrypted results use **your cipher key** (both sides can decrypt). A few requests are plain JSON; each [API page](/api/) says which, and for some methods the Guide doesn't say ([KI-61](/known-issues#ki-61)). Attachments use **PhilHealth's public key** (only PhilHealth can decrypt). Mixing them up is an easy mistake ([KI-12](/known-issues#ki-12)). Read the [encryption overview](/guides/encryption/) before you start.
:::

## The lifecycle at a glance

Every PECWS call needs a token from [getToken](/api/get-token). The sample says "Token is valid for 20 seconds" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8), [KI-26](/known-issues#ki-26)), so the diagrams leave `getToken` out: assume a fresh token before each call.

The diagrams come in three parts. The numbers on the right match the [stages below](#stage-by-stage).

**Admission and stay (stages 1–3)**

```text
 HF staff        Your HIS/EMR                                        PECWS
    |                 |                                                |
 patient admitted     |                                                |
    |-- PIN, name --->|                                                |
    |                 |-- isClaimEligible (isFinal "0") -------------->|  1
    |                 |<-------------------------- isok, referenceno --|
    |                 |-- generatePBEFPDF (referenceno) -------------->|  2
    |<-------- PBEF --|<----------------------- PBEF as a base64 PDF --|
    |                 |                                                |
    |-- stay data --->| CF1/CF2, CF4, charges; lookups                 |  3
```

**Discharge, build and submit (stages 4–9)**

```text
 HF staff        Your HIS/EMR                     File host          PECWS
    |                 |                               |                |
 patient discharged   |                               |                |
    |                 |-- isClaimEligible (isFinal "1") -------------->|  4
    |                 |<--------------------------------- trackingno --|
    |                 |-- searchCaseRates ---------------------------->|  5
    |                 | build eClaims, eSOA, CF5, CF4 XML              |  6
    |                 | check each file against its DTD                |  7
    |                 |-- validateeSOA, validateCF5 ------------------>|
    |                 |-- encrypted attachments ----->|                |  8
    |                 |-- eClaimsFileCheck (final XML) --------------->|  9
    |                 |-- uploadeClaims ------------------------------>|
    |<---- RTN, TCN --|<------------------------- eRECEIPT: RTN, TCN --|
    |                 |                               |<-- downloads --|
```

**After the upload (stages 10–13)**

```text
 HF staff        Your HIS/EMR                                        PECWS
    |                 |                                                |
    |                 |-- getUploadedClaimsMap (RTN) ----------------->| 10
    |                 |<--------------------------- pClaimSeriesLhio --|
    |                 |-- getClaimStatus (series numbers) ------------>| 11
    |                 |<--------------------------- status and trail --|
    |                 | if returned to hospital (RTH):                 |
    |                 |-- addRequiredDocument ------------------------>| 12
    |                 | once a voucher exists:                         |
    |                 |-- getVoucherDetails (voucherNo) -------------->| 13
    |<----- payment --|<-------------------- voucher, payees, checks --|
```

The DevKit orders only a few of these steps itself: eligibility "upon admission", the eSOA and CF5 validators before you attach those files, and the RTN before the claims map. Everything else about the order is our recommendation. When PhilHealth actually downloads the attachments is not documented. The certification form only checks that the URLs are reachable and the files are downloadable ([SSVTF p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).

### Recommended submission order

::: tip Recommendation (not from PhilHealth)
Submit each claim in this order. The same order is used on every page of this site.

1. **Build the XML files**: eClaims, eSOA, CF5 and CF4 (stage 6).
2. **Check each file locally** against its DTD (stage 7).
3. **Call `validateeSOA` and `validateCF5`** (stage 7).
4. **Encrypt the attachments** with PhilHealth's public key and **host them** at HTTPS URLs (stage 8).
5. **Call `eClaimsFileCheck`** on the final eClaims XML, with the live attachment URLs in it (stage 9).
6. **Call `uploadeClaims`** with exactly that XML (stage 9).
7. **Store the eRECEIPT**: the RTN and the TCN (stage 9).
8. **Call `getUploadedClaimsMap`** with the RTN (stage 10).

Why: the Guide says to attach the eSOA and CF5 only "after successful validation" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). The eClaims XML must contain the final attachment URLs, and the DevKit doesn't say whether `eClaimsFileCheck` checks that they are reachable. So check the exact file you will upload, after the files are online.
:::

## Stage by stage

| # | Stage | When | PECWS method | What you keep |
|---|---|---|---|---|
| 1 | Check eligibility | Upon admission | [isClaimEligible](/api/is-claim-eligible) with `isFinal` `"0"` | `isok`, `referenceno`, `asof` |
| 2 | Print the PBEF | After stage 1 | [generatePBEFPDF](/api/generate-pbef-pdf) | The PBEF PDF |
| 3 | Encode the claim data | During the stay | Lookups: [getMemberPIN](/api/get-member-pin), [searchEmployer](/api/search-employer), [getDoctorPAN](/api/get-doctor-pan), [isDoctorAccredited](/api/is-doctor-accredited) | CF1/CF2, CF4 and billing data |
| 4 | Final eligibility | Before you build the claim (recommended: at discharge) | [isClaimEligible](/api/is-claim-eligible) with `isFinal` `"1"` | `trackingno` |
| 5 | Find the case rate | Before you build the claim | [searchCaseRates](/api/search-case-rates) | Case rate code and amount |
| 6 | Build the XML files | After discharge | none | eClaims, eSOA, CF5, CF4 XML |
| 7 | Validate the XML files | After building them | Local DTD checks, then [validateeSOA](/api/validate-esoa) and [validateCF5](/api/validate-cf5) | Validation results |
| 8 | Encrypt and host attachments | After the eSOA and CF5 pass | none (your own code and file host) | Raw file, SHA-256 hash, URL |
| 9 | Check the final file and upload the claim | Once every attachment URL is live | [eClaimsFileCheck](/api/eclaims-file-check), then [uploadeClaims](/api/upload-eclaims) | Check result; `eRECEIPT`: RTN, TCN, transmission date |
| 10 | Map to PhilHealth's claim number | After a successful upload | [getUploadedClaimsMap](/api/get-uploaded-claims-map) | `pClaimSeriesLhio` for each claim |
| 11 | Track status | Repeatedly, until final | [getClaimStatus](/api/get-claim-status) | Status, trail, as-of date |
| 12 | Answer an RTH | When PhilHealth returns the claim | [addRequiredDocument](/api/add-required-document) | Documents added |
| 13 | Reconcile payment | When a voucher exists | [getVoucherDetails](/api/get-voucher-details) | Voucher, payees, check numbers |

### 1. Check eligibility upon admission

The Guide is explicit here: "Eligibility should be checked upon admission (initial call), while the final call generates a Tracking Number to confirm the member's eligibility for their claims availment" ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). The initial call sends `isFinal` `"0"`.

You send the member's and the patient's PIN and basic information, the admission date, the membership type and employer details, and whether the check is for an outpatient hemodialysis claim (`isForOPDHemodialysisClaim`). The decrypted answer has `isok` (`YES` or `NO`), `referenceno` (for printing the PhilHealth Benefit Eligibility Form, PBEF), `trackingno` and `asof` ([Guide p. 69–71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). The method's documentation has several errors ([KI-20](/known-issues#ki-20)).

If the member doesn't know their PIN, [getMemberPIN](/api/get-member-pin) looks it up by complete name and birth date ([Guide p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51)); whether it also finds dependents' PINs is not stated ([KI-64](/known-issues#ki-64)). For employed members, [searchEmployer](/api/search-employer) finds the employer by PhilHealth Employer Number (PEN) or name ([Guide p. 62](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62); key names: [KI-18](/known-issues#ki-18)). Both lookups are certification requirements: Module 1, items 4 and 5, ask for an interface for each ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).

The DevKit has no test members or PINs, so you can't try `isClaimEligible` or `getMemberPIN` with DevKit data ([KI-11](/known-issues#ki-11)). Ask PhilHealth for test members.

### 2. Print the PBEF

[generatePBEFPDF](/api/generate-pbef-pdf) "generates a PDF file of the PhilHealth Benefit Eligibility Form (PBEF) using the Reference Number obtained from the eligibility check" ([Guide p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)). The decrypted result is a base64 PDF. Certification checks that the printout "comply with the prescribed format" and passes "the PBEF validator" ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). The DevKit describes neither the prescribed format nor that validator ([KI-56](/known-issues#ki-56)).

### 3. Encode the claim data during the stay

This is ordinary HIS work, but it feeds every later stage:

- **CF1 and CF2 data** (member, patient, confinement, diagnoses, procedures, doctors, consumption of benefits) end up in the eClaims XML `CF1` and `CF2` elements. A certified system must provide "an interface for encoding Claims (CF1/CF2)" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).
- **Doctors.** [getDoctorPAN](/api/get-doctor-pan) finds a doctor's PAN by name and birth date; [isDoctorAccredited](/api/is-doctor-accredited) checks accreditation for the admission and discharge dates ([Guide p. 49, 60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60); output: [KI-24](/known-issues#ki-24)). The DevKit doesn't say which discharge date to send while the patient is still admitted ([KI-64](/known-issues#ki-64)). These are certification requirements too: Module 1, items 6 and 7 ([SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)).
- **Clinical data for CF4** (history, physical exam, course in the ward, medicines). See [Building CF4](/guides/cf4).
- **Charges for the eSOA**, itemized with codes from the eSOA libraries. See [Building the eSOA](/guides/esoa).
- **Offline work.** Certification requires offline encoding, encrypted offline data, saving scans offline, and submitting once back online ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)). Design for it from the start.

### 4. Final eligibility check

The final call (`isFinal` `"1"`) "generates a Tracking Number" ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). The eClaims data dictionary describes `CLAIM@pTrackingNumber` as "The Claims Eligibility Tracking number assigned if undergone the Online Eligibility Checking", formatted `####-####-####-####`, and "Can be blank" ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).

Recommendation (not from PhilHealth): make the final call at or right after discharge, once the admission data is final, and copy `trackingno` into `pTrackingNumber`. The Guide doesn't say when the final call should happen, or state outright that `trackingno` goes into `pTrackingNumber`; the matching descriptions make that the natural reading.

### 5. Find the case rate

[searchCaseRates](/api/search-case-rates) returns case rate amounts "for target benefit packages, including different applicable periods". Its `targetdate` is "normally the admission date of a target claim"; with a date, only the period covering it is returned ([Guide p. 37](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)). The result supplies `pCaseRateCode` and the amount for `ALLCASERATE/CASERATE`. The Guide's input description and its sample contradict each other ([KI-46](/known-issues#ki-46)). Certification requires a case-rate search screen ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

### 6. Build the XML files

One claim can involve up to four XML documents:

| Document | Format reference | How it travels |
|---|---|---|
| eClaims XML (CF1, CF2, case rates, document list) | [eClaims XML](/reference/eclaims-xml) | Encrypted with your cipher key, as the body of `uploadeClaims` |
| eSOA | [eSOA XML](/reference/esoa-xml) | Encrypted with PhilHealth's public key, hosted, attached as document type `ESA` |
| CF5 (DRG data) | [CF5 XML](/reference/cf5-xml) | Encrypted with PhilHealth's public key, hosted, attached as `CF5` |
| CF4 (clinical data) | [CF4 XML](/reference/cf4-xml) | Encrypted with PhilHealth's public key, hosted, attached as `CF4` |

Scanned documents such as the signed CSF are PDFs, attached the same way with their own document type codes ([Annex B, p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77); [Document types](/reference/document-types)). The DevKit doesn't say which documents each benefit or claim type needs, or when a CF3 is required ([KI-62](/known-issues#ki-62)). It also doesn't say which facilities must send a CF5 for DRG shadow billing ([KI-63](/known-issues#ki-63)). Confirm both with PhilHealth.

Under PC 2023-0026, an eSOA must have all three components (summary of fees, professional fees, itemized charges). "PhilHealth shall return to the HF any claim that lacks any of the three (3) major components" ([PC 2023-0026 p. 4, V.N](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)).

### 7. Validate the XML files

Validate in two layers before anything is encrypted or hosted:

1. **Locally, against the DTDs.** Fast and free, but it only checks structure. See [Validating XML](/guides/validating-xml). The eClaims DTD breaks common libxml2-based validators, so check eClaims XML with Java or with a patched local copy of the DTD ([KI-43](/known-issues#ki-43)).
2. **PhilHealth's eSOA and CF5 validators.** [validateeSOA](/api/validate-esoa) checks the eSOA; "After successful validation, the eSOA XML must be encrypted using the PhilHealth Public Key and submitted as an attachment … with the Document Type set to ESA" ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). [validateCF5](/api/validate-cf5) takes the CF5 **and** the eClaims XML. The same rule applies to the CF5: after successful validation, encrypt it with the PhilHealth public key and attach it with document type `CF5` ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). The Guide doesn't document what validateCF5 returns, or what a passing validateeSOA result looks like ([KI-42](/known-issues#ki-42)). It also doesn't say whether the eClaims XML you send to validateCF5 must already contain the final attachment URLs ([KI-62](/known-issues#ki-62)).

There is no PECWS validator for CF4 in the Guide ([KI-55](/known-issues#ki-55)). You can only check CF4 locally: against its DTD, and with your own rule checks.

The whole eClaims file gets its own check in stage 9, once the attachment URLs are final.

### 8. Encrypt and host the attachments

Each attachment is encrypted on its own by your system with PhilHealth's public key, then published at an HTTPS URL. "PECWS does not provide a service or method for encryption of the e-claim attachments" ([attachment guideline, p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). The URL goes into `DOCUMENT@pDocumentURL`, which Annex C describes as "URL of the document accessible via https" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). See [Attachment encryption](/guides/encryption/attachments).

The guideline doesn't name the RSA padding mode; both demo kits use PKCS#1 v1.5 ([KI-59](/known-issues#ki-59)). The DevKit doesn't cover hosting rules (authentication, retention, allowed hosts), and it doesn't name a MIME type for XML attachments ([KI-57](/known-issues#ki-57)). Certification also asks for an "eClaims Cloud Storage API" module that the DevKit doesn't specify ([KI-40](/known-issues#ki-40)).

### 9. Check the final file and upload the claim

First, send the final eClaims XML, with the live attachment URLs in it, to [eClaimsFileCheck](/api/eclaims-file-check). The method "allows the caller to validate the eClaims XML File" ([Guide p. 44](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44)). What its decrypted result contains is not documented ([KI-42](/known-issues#ki-42)), so store it and show it to the user.

Then upload **exactly that XML** with [uploadeClaims](/api/upload-eclaims). The Guide says the upload "ensures Document Type Definition (DTD) compliance and validates XML element attributes based on the eClaims XML Elements Attribute Definition table", and that "the transmission date serves as the official date received for the uploaded claims, which will be used to measure the Turnaround Time (TAT)" ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)). No table has that name; Annex C is presumably meant ([KI-09](/known-issues#ki-09)).

The decrypted result is an `eRECEIPT`. On success it carries the Receipt Ticket Number (RTN, `pReceiptTicketNumber`) and the Transmission Control Number (TCN, `pTransmissionControlNumber`). On failure it carries `REMARKS` elements with `pErrCode` and `pErrDescription` ([Guide p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)). The DevKit doesn't list the error codes ([KI-42](/known-issues#ki-42)). One upload (one `eTRANSMITTAL`) can hold several `CLAIM` elements.

Store the `eRECEIPT` before you do anything else with it: the RTN is the only way to reach the next stage. The DevKit doesn't say how PECWS treats a second upload of the same claim or transmittal number, for example after a timeout ([KI-62](/known-issues#ki-62)). Recommendation (not from PhilHealth): don't resend automatically after a timeout; flag the claim for a person and ask PhilHealth. The upload date is the official "date received", so a clean first upload counts.

### 10. Map your claim numbers to PhilHealth's

[getUploadedClaimsMap](/api/get-uploaded-claims-map) maps "the health facility's system-generated ID to the PhilHealth Claim Series Number", which "serves as a common reference between the health facility and PhilHealth". Its `receiptTicketNumber` parameter "must match the pReceiptTicketNumber attribute returned by" the upload ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53); name: [KI-22](/known-issues#ki-22)).

The claim series number (`pClaimSeriesLhio`, 15 characters, [Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) is the key for every later stage. The DevKit doesn't say when the mapping becomes available after an upload, or for how long ([KI-64](/known-issues#ki-64)). The series number is also what a new service provider needs to handle RTH claims filed through your system ([data migration dictionary, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

### 11. Track the claim status

[getClaimStatus](/api/get-claim-status) takes a list of claim series numbers (`serieslhionos`) and returns, per claim, a processing trail (`TRAIL.PROCESS[]` with `pProcessStage` and `pProcessDate`), `pStatus` and an as-of date and time ([Guide p. 46–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)). It is a `GET` with a JSON body ([KI-17](/known-issues#ki-17)). Whether it expects the 13- or the 15-digit form of the series number is not stated ([KI-64](/known-issues#ki-64)).

The only `pStatus` value in the sample is `IN PROCESS`. The DevKit does not list the other values, including the ones for RTH, paid or denied claims ([KI-42](/known-issues#ki-42)). Confirm them with PhilHealth before you build status-based logic.

### 12. Answer a Return-To-Hospital (RTH)

[addRequiredDocument](/api/add-required-document) "allows the addition of required documents in compliance with RTH claims". You send the claim series number (`pSeriesLhioNo`) and an encrypted `DOCUMENTS` list with the new document URLs. The documented results are "Claims has already been paid" and "Claims has already been denied" ([Guide p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42); [KI-29](/known-issues#ki-29)). Certification requires "an interface and notification for submitting additional documents for RTH claims" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

### 13. Reconcile the payment

[getVoucherDetails](/api/get-voucher-details) "facilitates the reconciliation of paid claims by returning the voucher details and other payment information". Its `voucherNo` should come from `pVoucherNo` "returned by the getClaimStatus method if a voucher has already been prepared". "A single voucher may contain multiple claims" ([Guide p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). The getClaimStatus sample has no `pVoucherNo` ([KI-23](/known-issues#ki-23)).

### Around the lifecycle

- **Health checks.** [getServerDateTime](/api/get-server-date-time) lets you check "whether the API or server is active or experiencing downtime", and [getDBServerDateTime](/api/get-db-server-date-time) checks "the availability of one of PhilHealth's databases" ([Guide p. 64–67](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)). [getServerVersion](/api/get-server-version) only returns the server version (p. 68). All three need a token. Recommendation (not from PhilHealth): call one of the first two before a batch upload, and when calls start failing.
- **Switching service providers.** Export the HF's claims in the encrypted migration format, including `pClaimSeriesLhio` and the documents. See [Migrating data](/guides/data-migration).

## The identifiers that tie it together

Most integration bugs come from losing or mixing up these numbers. Store all of them.

| Identifier | Created by | Where it appears | Used for |
|---|---|---|---|
| Hospital claim number (`pClaimNumber`) | Your system; "should be unique per hospital" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) | `CLAIM@pClaimNumber`; returned in the claims map | Your own claim ID. The DRG error-code list says the CF5 `ClaimNumber` must match it (code 222, [DRG Error Codes](/originals/cf5/DRG%20Error%20Codes.xlsx)), but Annex E describes that field differently ([KI-45](/known-issues#ki-45)). Annex C allows 12 characters ([KI-31](/known-issues#ki-31)). |
| Hospital transmittal number (`pHospitalTransmittalNo`) | Your system; "unique per hospital" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) | `eTRANSMITTAL`; echoed in the `eRECEIPT` | Identifies one upload batch |
| `referenceno` | PhilHealth (isClaimEligible) | Eligibility result | Input to generatePBEFPDF |
| `trackingno` | PhilHealth (final isClaimEligible) | Eligibility result | `CLAIM@pTrackingNumber` |
| Receipt Ticket Number (RTN) | PhilHealth (uploadeClaims) | `eRECEIPT@pReceiptTicketNumber` | Input to getUploadedClaimsMap |
| Transmission Control Number (TCN) | PhilHealth (uploadeClaims) | `eRECEIPT@pTransmissionControlNumber` | Proof of transmission; printed for certification |
| Claim series number (`pClaimSeriesLhio`) | PhilHealth | Claims map, claim status, voucher | getClaimStatus, addRequiredDocument, data migration |
| Voucher number (`pVoucherNo`) | PhilHealth | Claim status (per the Guide), voucher | getVoucherDetails |

Recommendation (not from PhilHealth): store these as strings exactly as received. The RTN has different shapes in different samples (`1234-5601-1234` on p. 35, `071311000005` on p. 54), and several documented lengths contradict the samples ([KI-31](/known-issues#ki-31)).

## Time limits the DevKit mentions

- **Tokens.** "Token is valid for 20 seconds" in the getToken sample ([KI-26](/known-issues#ki-26)).
- **Turnaround time (TAT)** is measured from the transmission date of the upload ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).
- **CF5.** The CF5 form says that the form and its supporting documents "should be filed within thirty (30) calendar days from date of discharge" ([CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)).
- **CF4.** The CF4 form (February 2020) says: "This form, together with other supporting documents, should be filed within sixty (60) calendar days from date of discharge" ([CF4 form, p. 1](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)).

The two forms give different deadlines, and the DevKit does not state a deadline for the eClaims upload itself ([KI-58](/known-issues#ki-58)). Confirm with PhilHealth which deadline applies to your claims. Recommendation (not from PhilHealth): plan for the shorter one. Show the discharge date and the days elapsed in your claims queue, and alert users well before 30 days.

## Common mistakes

1. **Skipping the initial eligibility check.** The Guide says to check "upon admission". Checking only at billing time means you learn late that the patient isn't eligible.
2. **Not storing the RTN.** Without it you can't call getUploadedClaimsMap, so you never learn the claim series number, and you can't track the claim.
3. **Treating `success: true` as "claim accepted".** You must decrypt the `result` and read the `eRECEIPT`. See [uploadeClaims](/api/upload-eclaims).
4. **Encrypting attachments with the cipher key.** Attachments use PhilHealth's public key ([KI-12](/known-issues#ki-12)).
5. **Attaching an eSOA or CF5 that failed PhilHealth's validator.** The Guide tells you to attach them "after successful validation".
6. **Checking or uploading an eClaims XML with placeholder URLs.** Host the attachments first, then run eClaimsFileCheck on the exact XML you upload ([recommended order](#recommended-submission-order)).
7. **Resending an upload after a timeout without checking.** How PhilHealth handles duplicates is not documented ([KI-62](/known-issues#ki-62)).
8. **Deleting attachment files after upload.** PhilHealth must be able to download them, and certification checks it ([SSVTF p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). The DevKit doesn't say how long the URLs must stay online ([KI-57](/known-issues#ki-57)); confirm with PhilHealth.

## Related pages

- [Submitting a claim](/guides/submitting-a-claim): the step-by-step tutorial with pseudo-code
- [API overview and conventions](/api/)
- [Encryption overview](/guides/encryption/)
- [Validating XML](/guides/validating-xml)
- [Software certification (SSVTF)](/guides/certification)
- [Glossary](/getting-started/glossary)
- [Known issues](/known-issues)
