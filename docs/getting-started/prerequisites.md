---
title: Prerequisites
description: Everything you need before you can develop and test against PECWS, who provides it, what it blocks, and what you can build while you wait.
---

# Prerequisites

<Badge type="warning" text="Gap" />

This page lists what you need **before** you can build, test, and certify an integration with the PhilHealth e-Claims Web Service (PECWS) 3.0. It covers what only PhilHealth can give you, what the health facility (HF) provides, and what you set up yourself. It ends with a request checklist for PhilHealth and a list of work you can do while you wait. The [glossary](/getting-started/glossary) explains the terms.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 8: getToken](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)
- [Implementation Guide, Annex A, p. 75: the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Implementation Guide, Annex C, p. 79 and 85: `pHospitalCode`, `pHospitalEmail`, `pDocumentURL`, `pCertificateId`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [Implementation Guide, Annex E, p. 88: CF5 `pHospitalCode`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)
- [Guidelines for the Encryption of e-Claim Attachments, p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)
- [Software Solution Validation Test Form (SSVTF) for PECWS 3.0 (rev. 20250217), p. 1, 4, 8–9, 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)
- [PhilHealth Circular (PC) 2023-0026, p. 6: the UPECS-EMR team](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=6)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)
:::

## TL;DR

1. **Ask PhilHealth for test access first.** You need the PECWS host names, credentials that work in the test environment (a facility accreditation number, a software certificate ID, and a cipher key), and the current public-key certificate. Without the host and credentials you can't call any PECWS method ([KI-30](/known-issues#ki-30)). Without the certificate you can't send attachments ([KI-01](/known-issues#ki-01)).
2. **Get the facility's details:** its PhilHealth Accreditation Number (PAN), its PMCC number, and the email address for PhilHealth's messages.
3. **Set up your own tools:** an HTTPS file host for encrypted attachments, secret storage, a database for the IDs PhilHealth returns, and Java (or a patched DTD) to validate eClaims XML ([KI-43](/known-issues#ki-43)).
4. **Don't wait idle.** You can build and test XML generation, local validation, and both kinds of encryption now. See [What you can build while you wait](#what-you-can-build-while-you-wait).

## Access before certification: an open question {#access-before-certification}

Every PECWS method except `getToken` needs a token from [getToken](/api/get-token). `getToken` needs "the software certification ID for PECWS 3.0 of the Health Facility" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). Annex C describes the certificate number as "issued upon passing the software compliance testing" (`pCertificateId`, [p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). The cipher key that encrypts most requests and responses is issued "to the health facility for each certified software" ([Annex A, p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)).

So both credentials come with **certified** software. But the certification test checks results that only a live PECWS call can produce. For example, it asks: "Does the system successfully receive the Receipt Ticket Number (RTN)?" ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)).

The DevKit never says how you get credentials before certification ([Software certification](/guides/certification)).

Our inference (not from PhilHealth): PhilHealth probably runs a separate test environment, because:

- The DevKit's public-key file is a test certificate for `eclaims-test.philhealth.gov.ph` ([KI-01](/known-issues#ki-01)). The DevKit doesn't document that name as an API address, so don't use it as your PECWS host ([KI-30](/known-issues#ki-30)).
- The DevKit includes dummy doctors and employers, but it doesn't say which environment they work in ([KI-11](/known-issues#ki-11)).

Recommendation (not from PhilHealth): make test-environment access your first request. Ask for separate test and production values of everything in the next table.

## What only PhilHealth can give you

None of these are in the DevKit. (The DevKit's only certificate expired in 2014.)

| # | You need | Why | Blocks | See |
|---|---|---|---|---|
| 1 | **PECWS host names** (test and production) | Every endpoint is `https://{pecws.domain}/PHIC/Claims3.0/<method>`, and no DevKit file gives the real host | Every API call | [KI-30](/known-issues#ki-30) |
| 2 | **Test-environment credentials**: the facility accreditation number to use, a software certificate ID, and a cipher key | The `getToken` headers `accreditationNo` and `softwareCertificateId`; `eCLAIMS@pUserName` (a colon plus the certificate ID, [KI-03](/known-issues#ki-03)); encrypting request bodies and decrypting results | Every API call | [Access before certification](#access-before-certification), [getToken](/api/get-token) |
| 3 | **The current public-key certificate** (test and production) | Encrypts every attachment: scanned PDFs such as the Claim Signature Form (CSF), and XML files such as the CF4, CF5, and electronic Statement of Account (eSOA). The attachment guideline says "PhilHealth will provide a public key" ([p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). The DevKit's copy is a test certificate that expired on 2014-12-29 | Attachments, and so every complete claim | [KI-01](/known-issues#ki-01), [Encrypting attachments](/guides/encryption/attachments) |
| 4 | **The cipher key's format and delivery** | Annex A doesn't give the key's format or length, how it is delivered, or which text encoding to use. This site assumes UTF-8 | Confirming that your encryption matches PhilHealth's | [KI-60](/known-issues#ki-60) |
| 5 | **Test members and PINs** (PhilHealth Identification Numbers) | The DevKit has dummy doctors and employers, but no members | Testing `isClaimEligible` and `getMemberPIN`, and rehearsing SSVTF Part I, Module 1 | [KI-11](/known-issues#ki-11), [Test data](/reference/test-data) |
| 6 | **Replacement test doctors** | The two dummy doctors are accredited "up to 12/31/2026" | Doctor lookups and test claims from 2027-01-01 | [KI-11](/known-issues#ki-11) |
| 7 | **The eClaims Cloud Storage API (eCCSA) specification** | Certification requires an eCCSA module (SSVTF Part II, section A.IV, [p. 8–9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8), and the notes on p. 13). The DevKit doesn't specify it | Certification | [KI-40](/known-issues#ki-40) |
| 8 | **The DRG manuals** | The CF5 form points to "PhilHealth's DRG Manual" for valid ICD-10 diagnosis and RVS (Relative Value Scale) procedure codes, and to the "DRG Implementation Manual" for extension-code rules. Neither is in the DevKit | Checking CF5 codes locally. `validateCF5` still checks them | [KI-63](/known-issues#ki-63) |
| 9 | **Certification schedule and instructions** | Several SSVTF items refer to things the DevKit doesn't describe: sending the "RAW Image via email", the "PBEF validator" (PBEF: PhilHealth Benefit Eligibility Form), "NClaims Web", and the file used to test the Data Migration module | Certification | [KI-56](/known-issues#ki-56), [Software certification](/guides/certification) |

### Who to ask

The DevKit doesn't name a contact for credentials or certification. Two documents hint at one:

- PC 2023-0026 tells facilities and service providers to coordinate with the Unified PhilHealth Electronic Claims System – Electronic Medical Record ([UPECS-EMR](/getting-started/glossary#upecs-emr)) Team "for the updated version of DTD and eSOA XML formats" ([p. 6](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=6)).
- Stage 1 of certification is "for PhilHealth Regional Offices Use" ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)).

Recommendation (not from PhilHealth): start with your PhilHealth Regional Office, as [Software certification](/guides/certification) also suggests.

## What the health facility provides

Get these from the health facility you are building for.

| You need | Used for | See |
|---|---|---|
| The facility's **PhilHealth Accreditation Number ([PAN](/getting-started/glossary#pan))** | `getToken` `accreditationNo`; `isClaimEligible` `hospitalCode` and `generatePBEFPDF` `accreno`; `eSOA@pHciPan`; CF4 `EPCB@pHciAccreNo`. The DevKit calls each of these the facility's accreditation number, but gives different formats. It never says whether the API methods expect the PAN or the PMCC number | [KI-48](/known-issues#ki-48) |
| The facility's **[PMCC number](/getting-started/glossary#pmcc)**, a 6-character code (the DevKit never expands "PMCC") | `eCLAIMS@pHospitalCode` ("For now PMCC number should be used", [Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) and `CF5@pHospitalCode` ("also known as the PMCC No.", [p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)) | [KI-48](/known-issues#ki-48) |
| An **email address** | `eCLAIMS@pHospitalEmail`: the "Hospital Email Address where communication will be sent". It must not be blank ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) | [eClaims XML](/reference/eclaims-xml) |
| Its **accredited doctors** and their PANs | `PROFESSIONALS` in the eClaims XML, and eSOA `ProfessionalInfo`. You can look PANs up with `getDoctorPAN` and check accreditation with `isDoctorAccredited` | [getDoctorPAN](/api/get-doctor-pan), [isDoctorAccredited](/api/is-doctor-accredited) |
| Its **billing items and medicines**, mapped to the eSOA libraries | The eSOA's itemized billing | [eSOA libraries](/reference/libraries/esoa) |
| Whether the software is **in-house or outsourced**, and the service provider's name | The certification form's header asks for both ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)) | [Software certification](/guides/certification) |

## What you set up yourself

Recommendation (not from PhilHealth), except where a row cites a source.

| You need | Why | See |
|---|---|---|
| An **HTTPS file host** that PhilHealth can reach | Each attachment is listed by URL in `DOCUMENT@pDocumentURL`, "accessible via https" ([Annex C, p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). Certification Stage 2 checks that PhilHealth can open, download, and decrypt the files ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). The eCCSA module asks for switchable or multiple cloud storage ([KI-40](/known-issues#ki-40)). The DevKit has no rules on authentication, retention, or allowed hosts | [KI-57](/known-issues#ki-57), [Encrypting attachments](/guides/encryption/attachments) |
| **Secret storage** for the cipher key and software certificate ID | Anyone with the cipher key can decrypt every request and response of the facility. Keep it out of source code and logs, and keep test and production values apart | [Encrypting API payloads](/guides/encryption/api-payloads) |
| A **database** for the IDs PhilHealth returns | Eligibility tracking numbers, the Receipt Ticket Number (RTN), the Transmission Control Number (TCN), and claim series numbers feed later calls and certification checks. Store them as text | [Submitting a claim: What you will store](/guides/submitting-a-claim#what-you-will-store) |
| **Runtimes** for this site's code | Node.js 18 or newer (no packages), or Python 3.9 or newer with `requests` and `cryptography`, for the shared client and the encryption examples. The OpenSSL command line, to inspect certificates and make a throwaway test key pair | [Shared client setup](/api/#shared-client-setup), [Encrypting attachments](/guides/encryption/attachments) |
| An **XML validator** that handles the eClaims DTD | Tools built on libxml2 (xmllint, Python lxml, PHP's DOM extension) can't check `eClaimsDef.dtd` or the migration DTD correctly. Use Java 11 or newer (we tested Java 21), or a patched copy of the DTD | [KI-43](/known-issues#ki-43), [Validating XML: Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) |
| **Offline support** | Certification checks that your system can encode offline, keep offline data encrypted, save scans offline, and submit once back online ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)) | [Software certification](/guides/certification) |
| **[PDF/A](/getting-started/glossary#pdf-a) scanning** | The attachment guideline says scanned documents "should comply with the PDF/A standard" ([p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)), and certification checks PDF/A-1b ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)) | [Encrypting attachments](/guides/encryption/attachments) |
| The **library spreadsheets**, loaded into your system | Codes for the CF4 and the eSOA. Load every column as text | [KI-39](/known-issues#ki-39), [CF4 libraries](/reference/libraries/cf4), [eSOA libraries](/reference/libraries/esoa) |

## What to read first

Read these before you write code. The [suggested reading order](/getting-started/how-to-read#suggested-reading-order-for-new-developers) has the full list.

- [The claims lifecycle](/getting-started/claims-lifecycle): which method you call when.
- [Encryption overview](/guides/encryption/): the two encryption schemes, which are easy to confuse ([KI-12](/known-issues#ki-12)).
- [API overview: Shared client setup](/api/#shared-client-setup): the client every example on this site uses.
- [Known issues](/known-issues): at least the "Start here" list at the top.

## Request checklist for PhilHealth

Recommendation (not from PhilHealth): copy this list into your request, and ask for test and production values separately.

```text
ACCESS
[ ] PECWS host names: test and production
[ ] Test-environment credentials: which facility accreditation
    number to use, a software certificate ID, and a cipher key
[ ] Cipher key: its format and length, how it is delivered, and which
    text encoding to use when hashing and encrypting (we assume UTF-8)
[ ] Current PhilHealth public-key certificate for test and production,
    and its SHA-256 fingerprint (the DevKit copy expired on 2014-12-29)

TEST DATA
[ ] Test members and PINs, including dependents
[ ] Which environment the dummy doctors and employers work in
[ ] Replacement test doctors (the current ones are accredited
    up to 12/31/2026)

SPECIFICATIONS
[ ] eClaims Cloud Storage API (eCCSA) specification
[ ] DRG Manual and DRG Implementation Manual (valid ICD-10 and
    RVS codes, extension-code rules)
[ ] Are eClaimsDef.dtd v1.9, ESOA.dtd v0.5, CF5.dtd and CF4.dtd the
    current versions? (The migration DTD has two NCP attributes
    that eClaimsDef.dtd v1.9 lacks.)
[ ] Error codes for uploadeClaims, and the format of failure
    responses (HTTP status, expired or invalid token)
[ ] PA 2024-0032, which the certification form cites

OPEN QUESTIONS
[ ] getToken: are the header values sent plain? How long is a token
    valid?
[ ] Attachments: which AES padding, and which RSA padding
    (PKCS#1 v1.5?)
[ ] docMimeType for JSON payloads and for XML attachments
[ ] Which facility identifier (PAN or PMCC number) each method expects
[ ] Are the request bodies of isDoctorAccredited, searchEmployer and
    generatePBEFPDF encrypted?
[ ] What goes in the CF5 ClaimNumber
[ ] Which supporting documents each claim type requires
[ ] How duplicate uploads and retries after a timeout are handled

CERTIFICATION
[ ] How to apply, the schedule, and a contact person
[ ] What the "RAW Image via email", "PBEF validator" and
    "NClaims Web" items expect
[ ] Which migration file the evaluator supplies for the import test,
    and which cipher key protects it
```

::: details Where each item comes from
- **Access:** [KI-30](/known-issues#ki-30) (host names), [KI-60](/known-issues#ki-60) (cipher key), [KI-01](/known-issues#ki-01) (certificate). Checking the fingerprint through a second channel is our recommendation ([Encrypting attachments](/guides/encryption/attachments)).
- **Test data:** [KI-11](/known-issues#ki-11), and [KI-64](/known-issues#ki-64) for dependents' PINs.
- **Specifications:** [KI-40](/known-issues#ki-40) (eCCSA), [KI-63](/known-issues#ki-63) (DRG manuals), [KI-10](/known-issues#ki-10) (newer DTD), [KI-42](/known-issues#ki-42) (errors). PA 2024-0032 is cited on [SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13) but isn't in the DevKit.
- **Open questions:** [KI-44](/known-issues#ki-44) and [KI-26](/known-issues#ki-26) (getToken), [KI-13](/known-issues#ki-13) and [KI-59](/known-issues#ki-59) (padding), [KI-25](/known-issues#ki-25) and [KI-57](/known-issues#ki-57) (`docMimeType`), [KI-48](/known-issues#ki-48) (facility identifier), [KI-61](/known-issues#ki-61) (plain or encrypted bodies), [KI-45](/known-issues#ki-45) (CF5 `ClaimNumber`), [KI-62](/known-issues#ki-62) (required documents, duplicates).
- **Certification:** [KI-56](/known-issues#ki-56), and [KI-54](/known-issues#ki-54) for the migration format.
:::

## What you can build while you wait

You don't need PhilHealth to start. With this site's files you can build and test most of the integration offline. The plan below is our recommendation, not PhilHealth's.

| Work | Use |
|---|---|
| Generate the eClaims, eSOA, CF5, CF4, and migration XML from your data | The [example claim](/guides/submitting-a-claim#the-example-claim) and the XML references: [eClaims](/reference/eclaims-xml), [eSOA](/reference/esoa-xml), [CF5](/reference/cf5-xml), [CF4](/reference/cf4-xml), [migration](/reference/migration-xml) |
| Validate the XML locally against the DTDs | [Validating XML](/guides/validating-xml) |
| Encrypt and decrypt API payloads | The tested [payload code](/guides/encryption/api-payloads), with a made-up cipher key. A round trip proves your code is consistent. Only PhilHealth's test server can prove it matches theirs |
| Encrypt attachments and compare them byte for byte | The [attachment code](/guides/encryption/attachments), with [a throwaway key pair of your own](/guides/encryption/attachments#testing-with-your-own-key-pair) |
| Write the API layer | The [shared client](/api/#shared-client-setup), against a local mock server (the client allows `http://localhost`). The Guide's sample hashes and ciphertexts are placeholders ([KI-27](/known-issues#ki-27)), so make your mock encrypt its own responses with your made-up key |
| Import the code libraries | [CF4 libraries](/reference/libraries/cf4), [eSOA libraries](/reference/libraries/esoa) |
| Build the screens, offline mode, and attachment storage that certification checks | [Software certification](/guides/certification) |

## When access arrives

Recommendation (not from PhilHealth): check the connection in this order.

1. Set the shared client's four environment variables to the test values: `PECWS_BASE_URL`, `PHIC_FACILITY_PAN`, `PHIC_SOFTWARE_CERT_ID` and `PECWS_CIPHER_KEY` ([Shared client setup](/api/#shared-client-setup)).
2. Run the smoke test. It calls `getToken`, then `getServerVersion`:

   ```bash
   node pecws-client.mjs smoketest      # or: python pecws_client.py smoketest
   ```

3. Try an encrypted call and the lookups with PhilHealth's dummy data: [Test data: Smoke test for the three lookups](/reference/test-data#smoke-test-for-the-three-lookups).
4. Follow [Submitting a claim](/guides/submitting-a-claim) end to end.

## Related pages

- [Overview](/getting-started/)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [Submitting a claim](/guides/submitting-a-claim)
- [Software certification](/guides/certification)
- [Test data](/reference/test-data)
- [Known issues](/known-issues)
