---
title: Software certification (SSVTF)
description: How PhilHealth tests an HIS/EMR for PECWS 3.0 using the Software Solution Validation Test Form, with every criterion turned into a developer checklist.
---

# Software certification (SSVTF)

<Badge type="tip" text="Current: rev. 20250217" />

Before a health facility can file claims with your Hospital Information System (HIS) or Electronic Medical Record (EMR), PhilHealth tests it with the **Software Solution Validation Test Form (SSVTF) for PECWS 3.0**. This page explains how the form is organized, which modules you must pass, and turns every criterion into a checklist item with the PhilHealth e-Claims Web Service (PECWS) method or document it relates to. Use it to plan your build and to rehearse before the test.

::: info Sources
- [Software Solution Validation Test Form for PECWS 3.0 (Revised 20250217), p. 1–14](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)
- [SSVTF Annex A: CF4 Data Requirements](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf)
- [SSVTF Annex B: eSOA Minimum Data Elements](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf)
- [PhilHealth Circular (PC) 2023-0026, p. 4, 7](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4): eSOA certification
- [Implementation Guide (rev. 20250217)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8): the methods each criterion relies on; Annex A–E (p. 75–88)
- [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- [`ESOA.dtd`](/originals/esoa/ESOA.dtd), [CF4 file updates (2021-02-23)](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf), [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf), [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx)
- [ForEncryption.zip](/originals/encryption/ForEncryption.zip): demo-kit sample outputs (padding lengths)
- [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf): test data
- [CF4 data dictionary rev. 4, p. 10–11, 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10): blood pressure and no-medicine rules
:::

## TL;DR

- You must pass **all of Part I**, plus the **Claim Form 4 (CF4), eClaims Cloud Storage API (eCCSA) and Data Migration** modules of Part II. The Claim Form 5 (CF5) and electronic Statement of Account (eSOA) modules can be certified together or one at a time.
- Part I is mostly screens: the eligibility check and its four lookups, claim encoding and upload, status and vouchers, PDF/A-1b files, and offline mode.
- In Stage 2, PhilHealth downloads and decrypts your attachments and compares them **byte by byte** with the raw files, so padding matters ([KI-13](/known-issues#ki-13)).
- Several criteria refer to things the DevKit never explains, such as the PhilHealth Benefit Eligibility Form (PBEF) validator, NClaims Web and eCCSA. Ask the evaluator what they expect before your test cycle ([KI-56](/known-issues#ki-56), [KI-40](/known-issues#ki-40)).

## Why certification matters to your code

Certification is not paperwork at the end. Your production code can't run without it:

- [getToken](/api/get-token) needs the "software certification ID for PECWS 3.0 of the Health Facility" in its `softwareCertificateId` header ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).
- The same ID goes into every upload: `eCLAIMS@pUserName` is `":"` plus the software certificate ID ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3), [KI-03](/known-issues#ki-03)).
- "PhilHealth issues a cipher key to the health facility for each certified software" ([Annex A, p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)).

For the electronic Statement of Account (eSOA), PC 2023-0026 says PhilHealth "shall ensure service providers' compliance with the eSOA requirements by issuing the corresponding IT certification" (V.F, [p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)). While "the certification of the hospital information system (HIS) for the submission of eSOA is on-process", health facilities (HFs) may submit a PDF copy of the Statement of Account (SOA) under PC 2017-0014 (VII.D, [p. 7](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=7)).

The DevKit doesn't describe how to apply, whom to contact, how long it takes, or whether test credentials exist before certification. Ask your PhilHealth Regional Office.

## How the form is organized

The header records the name of the health facility, whether the software is **in-house or outsourced**, the service provider, the software name and version number, and the date and time of the test ([p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)). Each criterion is a yes/no question with a remarks column, repeated for **three test cycles** (`CYCLE # ___`). The last page has one "PASSED / FAILED" line, and signature and position lines for up to three evaluators per cycle ([p. 14](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=14)).

```text
PART I (p. 1-4)                           all criteria required
  Stage 1 (PhilHealth Regional Offices)
    A  Completeness                        5 criteria
    Module 1  Claims Eligibility           7 criteria
    Module 2  Electronic Claims Submission 6 criteria
    Module 3  Claims Status Verification   2 criteria
    B  Document Format and Content         3 criteria
    C  Offline                             4 criteria

PART II (p. 5-13)
  Stage 1 (PhilHealth Regional Offices)
    A  Data Completeness
       I   eSOA (PC 2023-0026)             3 criteria   (+ SSVTF Annex B)
       II  CF5                             7 criteria
       III CF4                             3 criteria   (+ SSVTF Annex A)
       IV  eClaims Cloud Storage API       4 criteria
       V   Data Migration                  2 criteria
    B  Process Requirement                 eSOA 3, CF5 3, CF4 3
    C  Controls and Validations            CF5 2, eSOA 2
  Stage 2 (PhilHealth Central Office)
    A  Encrypted File                      2 criteria
    B  Decryption                          6 criteria

Result (p. 14): PASSED / FAILED, evaluators per cycle
```

The form doesn't say how many cycles you may use or what happens after a failed cycle.

## Which modules you must pass

The notes on [p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13) say:

> **Part I**: All criteria are required to be tested / evaluated.
>
> **Part II**: CF4 and eClaims Cloud Storage API, Data Migration modules are required to be tested/evaluated. CF5 module and eSOA module can be jointly or separately applied for certification. (PA 2024-0032)

So you always need Part I, plus the Claim Form 4 (CF4), eClaims Cloud Storage API (eCCSA) and Data Migration modules of Part II. The Claim Form 5 (CF5, data for Diagnosis-Related Groups) and eSOA modules may be certified together or one at a time. The form doesn't expand "PA 2024-0032", and that document is not in the DevKit. The notes don't say which Stage 2 checks apply when you certify only one of CF5 or eSOA; ask your evaluator.

## Part I checklist

Criteria are quoted from the form. "What to build" is our reading of what an evaluator will look for; where the DevKit is silent, the table says so.

### A. Completeness

Source: [SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)

| # | Criterion | What to build | Related |
|---|---|---|---|
| A1 | "Does the system successfully receive the Receipt Ticket Number (RTN)?" | Decrypt the upload result, read `eRECEIPT@pReceiptTicketNumber`, store it and show it. | [uploadeClaims](/api/upload-eclaims) |
| A2 | "Does the system generate the Transmission Control Number?" | Annex C calls the TCN "Philhealth Generated" ([p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)), so your system receives it in `eRECEIPT@pTransmissionControlNumber`. Store and show it. The criterion's wording ("generate") conflicts with Annex C ([KI-56](/known-issues#ki-56)). | [uploadeClaims](/api/upload-eclaims) |
| A3 | "Does the system send the RAW Image via email?" | Not described in the DevKit ([KI-56](/known-issues#ki-56)). Our reading: evaluators need the unencrypted ("raw") files to compare with what they decrypt in Stage 2. Keep raw copies of every attachment and ask the evaluator where to send them. | Stage 2 B |
| A4 | "Does the system retrieve the XML in the eClaims database using the RTN/TCN?" | No PECWS method returns an uploaded XML by RTN or TCN ([KI-56](/known-issues#ki-56)). Our reading: the evaluator looks the transmission up in PhilHealth's database with the RTN/TCN your system shows. Also index your own copy of each sent XML by RTN and TCN. | [uploadeClaims](/api/upload-eclaims) |
| A5 | "Does the system capture a screenshot of the system sign-on?" | Recommendation: a sign-on screen that shows the software name and version, matching the form header. | Form header |

### Module 1: Claims Eligibility

Source: [SSVTF p. 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)

Items 1–3 cover the eligibility check and the PBEF. Items 4–7 are **lookup screens**, each backed by one PECWS method: searchEmployer, getMemberPIN, getDoctorPAN and isDoctorAccredited. They are certification requirements in their own right, so build a screen for each even if your claim flow rarely needs it. The DevKit has no test members or PINs, so you can't rehearse items 1 and 5 with DevKit data; ask PhilHealth for test members ([KI-11](/known-issues#ki-11)).

| # | Criterion | What to build | Related |
|---|---|---|---|
| 1.1 | "Does the interface display all parameters for the eligibility call, including PIN (member or dependent), name, date of birth, and the option to indicate the purpose of the PBEF (whether or not for an outpatient hemodialysis claim)?" | An eligibility screen with every isClaimEligible input, including the `isForOPDHemodialysisClaim` Y/N choice. | [isClaimEligible](/api/is-claim-eligible) |
| 1.2 | "Does the printout of the PBEF comply with the prescribed format?" | Print the PhilHealth Benefit Eligibility Form (PBEF) PDF returned by generatePBEFPDF. Recommendation: print it as returned; don't re-layout it. | [generatePBEFPDF](/api/generate-pbef-pdf) |
| 1.3 | "Does the printout of the PBEF pass the PBEF validator?" | The DevKit doesn't describe the PBEF validator or the "prescribed format" of 1.2 ([KI-56](/known-issues#ki-56)). Ask the evaluator. | [generatePBEFPDF](/api/generate-pbef-pdf) |
| 1.4 | "Does the system provide an interface for searching for an employer?" | Employer search by PhilHealth Employer Number (PEN) and/or name. The request key names are uncertain ([KI-18](/known-issues#ki-18)). | [searchEmployer](/api/search-employer) |
| 1.5 | "Does the system provide an interface for verifying the member's PIN?" | PIN lookup by name and birth date. | [getMemberPIN](/api/get-member-pin) |
| 1.6 | "Does the system provide an interface for retrieving the PhilHealth Accreditation Number of a healthcare professional?" | Doctor PAN lookup by name and birth date. | [getDoctorPAN](/api/get-doctor-pan) |
| 1.7 | "Does the system provide an interface for checking the accreditation status of a healthcare professional for a specified date?" | Accreditation check for admission and discharge dates. The method's output is under-documented ([KI-24](/known-issues#ki-24)). | [isDoctorAccredited](/api/is-doctor-accredited) |

### Module 2: Electronic Claims Submission

Source: [SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)

| # | Criterion | What to build | Related |
|---|---|---|---|
| 2.1 | "Does the system provide an interface for encoding Claims (CF1/CF2)?" | Screens for all CF1 and CF2 data in the eClaims XML. | [eClaims XML](/reference/eclaims-xml) |
| 2.2 | "Does the system provide a notification or mechanism indicating a successful upload?" | A clear success or failure message based on the decrypted `eRECEIPT`, not on `success` alone. | [uploadeClaims](/api/upload-eclaims) |
| 2.3 | "Does the system generate a printout of the Receipt Ticket Number/Transmission Control Number?" | A printable receipt with RTN and TCN. | [uploadeClaims](/api/upload-eclaims) |
| 2.4 | "Does the system provide mapping between the PhilHealth claim series number and the health facility claim ID?" | Store and show `pClaimSeriesLhio` next to your `pClaimNumber`. | [getUploadedClaimsMap](/api/get-uploaded-claims-map) |
| 2.5 | "Does the system provide an interface for searching case rates?" | Case-rate search by ICD code, RVS code or description, with a target date. | [searchCaseRates](/api/search-case-rates) |
| 2.6 | "Does the system provide an interface and notification for submitting additional documents for RTH claims?" | Tell users when a claim is returned to hospital (RTH), and let them attach documents. The status values that signal RTH are not documented ([KI-42](/known-issues#ki-42)). | [addRequiredDocument](/api/add-required-document), [getClaimStatus](/api/get-claim-status) |

### Module 3: Claims Status Verification

Source: [SSVTF p. 3–4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)

| # | Criterion | What to build | Related |
|---|---|---|---|
| 3.1 | "Does the system provide an interface for retrieving the status of claims?" | A status screen with the trail and as-of date. | [getClaimStatus](/api/get-claim-status) |
| 3.2 | "Does the system provide an interface for retrieving voucher information for approved claims?" | A voucher screen: payees, amounts, check numbers and dates. | [getVoucherDetails](/api/get-voucher-details) |

### B. Document Format and Content

Source: [SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)

| # | Criterion | What to build | Related |
|---|---|---|---|
| B1 | "Does the PDF file comply with the PDF/A-1b format?" | Produce scans and generated PDFs as PDF/A-1b. Recommendation: check them with a PDF/A validator (for example the open-source veraPDF) in your tests. The attachment guideline also asks for PDF/A. | [Attachment encryption](/guides/encryption/attachments) |
| B2 | "Does the PDF and XML exclude Personally Identifiable Information (PII)?" | The form doesn't define which PII to exclude, and claim XML necessarily contains names and PINs ([KI-56](/known-issues#ki-56)). Our reading: keep PII out of file names and URLs, and don't add data beyond what the forms require. Ask the evaluator. | Annex C `pDocumentURL` |
| B3 | "Do the manually submitted PDF files match those shown in the NClaims Web?" | Each attachment must decrypt to exactly the file you scanned. The DevKit doesn't describe NClaims Web ([KI-56](/known-issues#ki-56)). From the criteria, it is a PhilHealth application where evaluators view a claim's documents (see also IV.2 and Process Requirement eSOA 3). | Stage 2 B |

### C. Offline

Source: [SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)

| # | Criterion | What to build |
|---|---|---|
| C1 | "Does the system support offline data encoding?" | All encoding screens work without a connection to PECWS. |
| C2 | "Are the data encoded in offline mode encrypted?" | Encrypt the local offline store. The form doesn't say how; this is separate from the PECWS payload and attachment encryption. |
| C3 | "Are scanned images saved while offline?" | Scans are stored locally until they can be encrypted and hosted. |
| C4 | "Can the system submit offline data to PhilHealth eClaims WebService once online?" | A queue that sends eligibility checks, validations and uploads when the connection returns. |

## Part II checklist

As in Part I, criteria are quoted from the form, and "What to build" is our reading.

### A. Data Completeness

#### I. eSOA, compliance with PC 2023-0026

Source: [SSVTF p. 5–7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)

| # | Criterion | What to build | Related |
|---|---|---|---|
| I.1 | "Does the system capture the following eSOA data elements? (See Annex B)", listed as Summary of Fees, Professional Fees and Itemized Billing elements (mapped below) | Capture every element and put it in the eSOA XML. Some listed elements have no place in `ESOA.dtd` ([KI-52](/known-issues#ki-52)). | [Building the eSOA](/guides/esoa), [eSOA XML](/reference/esoa-xml) |
| I.2 | "Does the system capture items under the Summary of Fees and Itemized Billing for the following categories?" Room And Board, Drugs And Medicine, Laboratory And Diagnostic, Operating Room Fee, Medical Supplies, Others | All six categories, including `Others` (added in ESOA.dtd 0.5, [KI-04](/known-issues#ki-04)): the six category elements of `SummaryOfFees`, and the `pCategory` value of each `ItemizedBillingItem`. | `ESOA.dtd` |
| I.3 | "Does the system capture other items not included in the provided library?" | Free-text items: blank `pItemCode`, full description in `pItemName` ([Annex D, p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87)). | [eSOA libraries](/reference/libraries/esoa) |

The form's element names are business names, not XML names. Here is how they line up with [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5. The mapping is our interpretation; confirm it with PhilHealth ([KI-52](/known-issues#ki-52)):

| SSVTF element | ESOA.dtd v0.5 |
|---|---|
| Summary of Fees: Particulars | The category elements `RoomAndBoard`, `DrugsAndMedicine`, `LaboratoryAndDiagnostic`, `OperatingRoomFees`, `MedicalSupplies`, `Others` |
| Actual Charges; VAT Exemption | `SummaryOfFee@pChargesNetOfApplicableVat` (charges net of applicable VAT). The DTD has no separate VAT-exemption attribute ([KI-52](/known-issues#ki-52)). |
| Senior Citizen/PWD | `SummaryOfFee@pSeniorCitizenDiscount`, `@pPWDDiscount` |
| Case Rate 1; Case Rate 2 | `SummaryOfFees/PhilHealth@pTotalCaseRateAmount`, a single total. The DTD doesn't split first and second case rates ([KI-52](/known-issues#ki-52)). |
| Other Funding Sources | `SummaryOfFee@pPCSO`, `@pDSWD`, `@pDOHMAP`, `@pHMO`, plus `OtherFundSource` (`pDescription`, `pAmount`) |
| Balance | `SummaryOfFees/Balance@pAmount` |
| Professional Fees: Physician Accreditation No. (PAN); Physician Name | `ProfessionalInfo@pPAN`, `@pFirstName`, `@pMiddleName`, `@pLastName`, `@pSuffixName` |
| Amount; Mandatory Discount | `ProfessionalFee/SummaryOfFee@pChargesNetOfApplicableVat`; `@pSeniorCitizenDiscount`, `@pPWDDiscount` |
| PhilHealth Benefits; Other Funding Sources; Balance | `ProfessionalFees/PhilHealth@pTotalCaseRateAmount`; the other-funding attributes of `SummaryOfFee`; `ProfessionalFees/Balance@pAmount` |
| Itemized Billing: Service Date, Item Name, Unit of Measurement, Price, Quantity, Amount | `ItemizedBillingItem@pServiceDate`, `@pItemName` (with `@pItemCode`), `@pUnitOfMeasurement`, `@pUnitPrice`, `@pQuantity`, `@pTotalAmount` |

::: warning SSVTF Annex B doesn't match the criteria it is cited for ([KI-52](/known-issues#ki-52))
[SSVTF Annex B](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf) is a scanned copy of PC 2023-0026 Annex B ([p. 12](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=12)): a sample paper SOA. Its Summary of Fees columns are Amount, Mandatory Discount, PhilHealth, Other Funding Sources and Balance, with five categories (no "Others"). Criterion I.1 lists different elements (VAT Exemption, Case Rate 1, Case Rate 2), and criterion I.2 lists six categories. Neither list uses the XML names. Build to `ESOA.dtd` v0.5 and use SSVTF Annex B only as a picture of the business content.
:::

#### II. CF5

Source: [SSVTF p. 7–8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)

| # | Criterion | What to build | Related |
|---|---|---|---|
| II.1 | "Does the system accept only (1) Primary Diagnosis (PDx)?" | Exactly one `DRGCLAIM@PrimaryCode`. | [Building CF5](/guides/cf5) |
| II.2 | "Does the system accept up to twelve (12) Secondary Diagnosis (SDx)?" | Up to 12 `SECONDARYDIAG`. Use the standalone `CF5.dtd`; the Guide's v1.3 DTD allows only one ([KI-06](/known-issues#ki-06)). | [CF5 XML](/reference/cf5-xml) |
| II.3 | "Does the system accept up to twenty (20) Procedures using RVS codes?" | Up to 20 `PROCEDURE` elements with `RvsCode`. The DRG manuals that list valid RVS codes are not in the DevKit ([KI-63](/known-issues#ki-63)). | Annex E |
| II.4 | "Does the system accept laterality left right or both, as applicable?" | `L`, `R`, `B`, and `N` for none. The criterion doesn't mention `N`, but revision 20250217 made `N` the valid value when there is no laterality ([KI-05](/known-issues#ki-05), [KI-56](/known-issues#ki-56)). | Annex E [p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88) |
| II.5 | "Does the system ensure there are no repeated codes across all the secondary diagnosis and with the primary diagnosis?" | Block duplicates at data entry. | CF5 form |
| II.6 | "Does the system accept extension code for each procedure, as necessary?" | `Ext1` (number of body sites, 1–9) and `Ext2` (times done, 1–9). The rules for adding extension codes are in a "DRG Implementation Manual" that is not in the DevKit, and whether a blank value is accepted is not stated ([KI-63](/known-issues#ki-63)). | Annex E |
| II.7 | "Does the system accept admission weight for newborn patients in kilograms (kg) up to one (1) decimal place?" | `NewBornAdmWeight`, for patients 0–27 days old, in kg with up to one decimal. Annex E says "greater than 0.3 kg"; the CF5 form and DRG error codes 228 and 418 accept exactly 0.3 kg ([KI-51](/known-issues#ki-51)). Recommendation (not from PhilHealth): accept 0.3 kg and above, and confirm with the evaluator. | Annex E; CF5 form; [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx) |

#### III. CF4

Source: [SSVTF p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)

| # | Criterion | What to build | Related |
|---|---|---|---|
| III.1 | "Does the system capture the required CF4 data elements? (See Annex A)" | Every element in the SSVTF Annex A list below. | [Building CF4](/guides/cf4) |
| III.2 | "Does the system allow '1' as a value for Systolic and Diastolic (1/1) for patients where BP is not available or required, and '2' for palpatory (2/2)?" | Accept `1/1` and `2/2` in `pSystolic` and `pDiastolic`. The rule is not new: the CF4 data dictionary rev. 4 already says it ([p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)). SSVTF 2025 made it a certification check ([KI-08](/known-issues#ki-08)). | [CF4 XML](/reference/cf4-xml) |
| III.3 | "Does the system support the additional library code for no medicine record?" | When no medicine was given: `pDrugCode` `NOMED0000000000000000000000000`, `pGenericCode` `NOMED`, `00000` for the salt, strength, form, unit and package codes, and `-` for `pRoute` and `pInstructionFrequency` ([CF4 data dictionary rev. 4, p. 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13); [CF4 file updates, 2021-02-23](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf)). The dictionary also sets the quantity and amount to zero, which the update note omits ([KI-55](/known-issues#ki-55)). | [CF4 libraries](/reference/libraries/cf4) |

[SSVTF Annex A](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf) lists the CF4 data to capture:

- **Health Care Institution (HCI) information:** name, address, accreditation number.
- **Patient data:** name, PIN, age, sex, chief complaint.
- **Reason for admission:** history of present illness; pertinent past medical history; OB/GYN history (OB score); pertinent signs and symptoms on admission.
- **Physical examination on admission:** general survey; vital signs (BP systolic/diastolic "for patient age three years and above", HR, RR, temperature, height, weight); HEENT; chest/lungs; CVS; abdomen; GU (IE); skin/extremities; neuro exam.
- **Course in the ward:** date; doctor's order/action.
- **Drugs/medicines:** complete drug description ("allow user to encode drug if not listed on the library"), route, frequency, quantity, total amount price.
- "Other data elements of CF4 not listed above shall be sourced from CF1/CF2 data."

The CF4 XML has no field for the HCI name or address, and no age field (age can be derived from the birth date). Ask the evaluator how they expect to see these ([KI-55](/known-issues#ki-55)).

#### IV. eClaims Cloud Storage API (eCCSA)

Source: [SSVTF p. 8–9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)

| # | Criterion | What to build |
|---|---|---|
| IV.1 | "Does the system has a feature to change or use multiple cloud storage to store eClaims file attachments?" | Configurable attachment storage, with more than one provider. |
| IV.2 | "Are the required documents (CF4, CSF, SOA) viewable in NClaims application per cycle?" | Attachments PhilHealth can download and decrypt in each test cycle. The DevKit doesn't describe NClaims ([KI-56](/known-issues#ki-56)), or which documents each claim type requires ([KI-62](/known-issues#ki-62)). |
| IV.3 | "Can the attachments be successfully downloaded?" | Public HTTPS URLs that don't expire. |
| IV.4 | "Is the data same as in RAW PDF (as provided)?" | Decrypted attachments identical to the raw files (see Stage 2). |

::: warning eCCSA is required, but not specified ([KI-40](/known-issues#ki-40))
The notes make this module mandatory, but the DevKit contains no eCCSA specification: no endpoints, no protocol, no list of supported storage services. The criteria only describe outcomes. Recommendation (not from PhilHealth): put attachment storage behind one interface in your code (put, get URL, delete), with at least two implementations (for example your own HTTPS server and one cloud object store), selectable per health facility. Ask PhilHealth for the eCCSA specification before you build more.
:::

#### V. Data Migration

Source: [SSVTF p. 9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)

| # | Criterion | What to build | Related |
|---|---|---|---|
| V.1 | "Does the system export all health data in compliance with the encrypted eClaims migration format?" | Export to the migration XML, encrypted with the HF's cipher key. Several details of the format are undefined, such as the `pEncryptionUsed` values and which cipher key to use when the two systems hold different keys ([KI-54](/known-issues#ki-54)). | [Migrating data](/guides/data-migration), [Migration XML](/reference/migration-xml) |
| V.2 | "Does the system import the eClaims migration file successfully?" | Import files exported by other providers, including `pClaimSeriesLhio` and the base64 documents. Validate them against the migration DTD with Java or a patched copy ([KI-43](/known-issues#ki-43)). The form doesn't say which file the evaluator supplies for this test, or which cipher key protects it ([KI-56](/known-issues#ki-56)). | [Migrating data](/guides/data-migration) |

### B. Process Requirement

Source: [SSVTF p. 9–11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)

| # | Criterion | What to build | Related |
|---|---|---|---|
| eSOA 1 | "Does the system successfully generate the eSOA in XML format?" | DTD-valid eSOA XML. | [Validating XML](/guides/validating-xml) |
| eSOA 2 | "Does the system successfully upload and attach the encrypted eSOA XML data to the claim?" | Validate with validateeSOA, encrypt with PhilHealth's public key, attach as `ESA` ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). | [validateeSOA](/api/validate-esoa) |
| eSOA 3 | "Is the eSOA data successfully displayed in the NClaims Web?" | PhilHealth can download, decrypt and read it. NClaims Web is not described in the DevKit ([KI-56](/known-issues#ki-56)). | Stage 2 |
| CF5 1 | "Does the system successfully generate the CF5 in XML format?" | DTD-valid CF5 XML. | [Validating XML](/guides/validating-xml) |
| CF5 2 | "Does the system successfully upload and attach the encrypted CF5 XML data to the claim?" | Validate with validateCF5, encrypt with the public key, attach as `CF5` ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). | [validateCF5](/api/validate-cf5) |
| CF5 3 | "Can the CF5 data be viewed on PhilHealth's side?" | As eSOA 3. | Stage 2 |
| CF4 1 | "Does the system successfully generate the CF4 in XML format?" | DTD-valid CF4 XML (EPCB DTD). | [CF4 XML](/reference/cf4-xml) |
| CF4 2 | "Does the system successfully upload and attach the encrypted CF4 XML data to the claim?" | Encrypt with the public key, attach as `CF4`. There is no CF4 validator method ([KI-55](/known-issues#ki-55)). | [Document types](/reference/document-types) |
| CF4 3 | "Is the CF4 data successfully displayed in the NClaims Web?" | As eSOA 3. | Stage 2 |

### C. Controls and Validations

Source: [SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)

| # | Criterion | What to build | Related |
|---|---|---|---|
| CF5 1 | "Does the system display warning errors and major errors?" | Show every message from validateCF5 to the user, separated by severity. | [validateCF5](/api/validate-cf5), [DRG error codes](/reference/drg-error-codes) |
| CF5 2 | "Does the system display the CF5 validation result?" | Show the result screen, success included. | [validateCF5](/api/validate-cf5) |
| eSOA 1 | "Does the system display warning errors and major errors?" | Show every message from validateeSOA. | [validateeSOA](/api/validate-esoa) |
| eSOA 2 | "Does the system display the eSOA validation result?" | As CF5 2. | [validateeSOA](/api/validate-esoa) |

The form doesn't define "warning" and "major" errors. The closest thing in the DevKit is the [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx) workbook, which has a separate "Warning Codes" sheet (codes 501–508, where the code "will be removed from the grouping logic and will proceed") next to its error codes. For the eSOA, the Guide documents only an `errors` array of strings, without severity ([p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)), and not the success result. The validateCF5 response isn't documented at all ([KI-42](/known-issues#ki-42)).

### Stage 2: Central Office checks

Source: [SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)

| # | Criterion | What to build |
|---|---|---|
| A1 | "Are the URLs of the encrypted PDF and XML files accessible to PHILHEALTH via a web browser?" | Public HTTPS URLs, reachable from outside your network, no login, no expiry. |
| A2 | "Are the encrypted PDF and XML files downloadable?" | The URL returns the encrypted JSON file itself, not an HTML page. |
| B1 | "Are the encrypted PDF and XML files can be decrypted using the pre-defined algorithm by PhilHealth?" | Follow the [attachment guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) exactly, with the **current** PhilHealth certificate ([KI-01](/known-issues#ki-01)). The guideline doesn't name the RSA padding; use PKCS#1 v1.5, as both demo kits do, and confirm ([KI-59](/known-issues#ki-59)). |
| B2 | "Are the data of the decrypted file the same as data in the raw PDF file?" | Decrypted PDF identical to the raw PDF. |
| B3 | "Are the data of the decrypted file the same as data in the raw eClaims XML file?" | See the note below the table. |
| B4 | "Are the data of the decrypted file the same as data in the raw eSOA XML file?" | Decrypted eSOA identical to the raw eSOA. |
| B5 | "Are the data of the decrypted file the same as data in the raw CF5 XML file?" | Decrypted CF5 identical to the raw CF5. |
| B6 | "Are the raw and decrypted PDF and XML files the same using byte-by-byte comparison?" | Bit-for-bit identical files. See the next section. |

::: warning Unclear points in Stage 2 ([KI-56](/known-issues#ki-56))
- **B3 mentions the eClaims XML**, but the eClaims XML is not an attachment. It is the body of uploadeClaims, encrypted with the HF's cipher key. Our reading: PhilHealth decrypts the uploaded body and compares it with the raw eClaims XML you provide, so keep the exact XML you sent.
- **CF4 is missing from B2–B5**, although CF4 XML is an encrypted attachment (Process Requirement CF4 2). B6 covers "PDF and XML files" in general, so expect your CF4 files to be compared too.

Ask your evaluator to confirm both.
:::

## Passing the byte-by-byte check (B6)

"Same data" is not enough for B6: the decrypted file must be **identical, byte for byte**, to the raw file. The usual cause of failure is **padding**. AES-CBC encrypts in 16-byte blocks, so a file whose size isn't a multiple of 16 gets padding bytes at the end. After decryption, those bytes must be removed in exactly the way they were added, or the file comes out longer than the original.

The DevKit is inconsistent here ([KI-13](/known-issues#ki-13)):

- Annex A (API payloads) says to pad "with null character (… '0x00') if it is not a multiple of 16 bytes" ([p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76)).
- The attachment guideline says nothing about padding.
- The demo kits disagree. For the same 4,496-byte sample PDF, the encrypted `doc` in the C# kit's sample output decodes to 4,496 bytes, while the PHP and Java sample outputs decode to 4,512 bytes. All three carry the same `hash` ([ForEncryption.zip](/originals/encryption/ForEncryption.zip)).

The envelope has no "original length" field. The receiver can only use the `hash` and its own padding rule to know where the file ends. Ask PhilHealth which padding its decryptor expects for attachments, and test before the evaluation.

::: warning Don't strip trailing zeros from attachments
Removing every trailing `0x00` byte after decryption is safe for API payloads (XML, JSON and base64 text never end in a NUL byte), but **not** for attachments. The DevKit's own sample PDF, `SAMPLE_BIRTH_CERTIFICATE.orig.pdf` (4,496 bytes, in [ForEncryption.zip](/originals/encryption/ForEncryption.zip)), ends with 15 `0x00` bytes after `%%EOF`. Stripping them shortens the file, and both the hash check and B6 fail. Only hash-guided unpadding (try each possible pad length and keep the one whose SHA-256 matches `hash`) or PKCS#7 padding is unambiguous ([KI-13](/known-issues#ki-13)).
:::

### Rehearse Stage 2 with your own test key

You can't decrypt with PhilHealth's private key, but you can test your whole pipeline with a key pair of your own. Recommendation (not from PhilHealth):

1. Create a throwaway RSA-2048 key and self-signed certificate:

   ```bash
   openssl req -x509 -newkey rsa:2048 -nodes -days 30 \
     -keyout selftest-key.pem -out selftest-cert.pem -subj "/CN=eclaims-selftest"
   ```

2. Encrypt a raw file with **your production code**, but with `selftest-cert.pem` instead of PhilHealth's certificate.
3. Decrypt the file with a test decryptor that follows the attachment guideline in reverse, using `selftest-key.pem`. This site's unofficial attachment example has one ([`encrypt_attachment.py`](/examples/encryption/encrypt_attachment.py); see [Attachment encryption](/guides/encryption/attachments)):

   ```bash
   python encrypt_attachment.py decrypt-test selftest-key.pem raw.pdf.enc decrypted.pdf
   ```

   It finds the padding by trying each possible pad length and keeping the one whose hash matches. It only works with your own throwaway key.

4. Compare the files and the hash:

   ```bash
   cmp raw.pdf decrypted.pdf && echo "identical"
   sha256sum raw.pdf decrypted.pdf
   python3 -c "import json; print(json.load(open('raw.pdf.enc'))['hash'])"
   ```

   All three hashes must be equal, and `cmp` must print nothing.

5. Test a file whose size is **not** a multiple of 16 bytes, one whose size is, and a file that ends in zero bytes, such as the DevKit's sample PDF. In our own test, a 4,497-byte file was zero-padded to 4,512 bytes. Decrypted without removing the padding, it failed the comparison:

   ```text
   $ cmp raw.pdf decrypted.pdf
   cmp: EOF on raw.pdf after byte 4497, in line 113
   ```

   The DevKit's 4,496-byte sample PDF shows the opposite mistake. Stripping every trailing zero byte after decryption also removed the 15 zero bytes that belong to the file:

   ```text
   $ cmp raw.pdf stripped.pdf
   cmp: EOF on stripped.pdf after byte 4481, in line 113
   ```

   The hash-guided `decrypt-test` restored both files exactly. Still, agree on the padding rule with PhilHealth ([KI-13](/known-issues#ki-13)).

6. Also test that the URL works from a network outside your own (A1, A2).

This rehearsal proves that your encryption and a decryptor that follows the guideline agree. It can't prove what PhilHealth's own decryptor expects: the AES padding ([KI-13](/known-issues#ki-13)) and the RSA padding ([KI-59](/known-issues#ki-59)) are not specified. Confirm both with PhilHealth before the test day.

## Before the test day

Recommendation (not from PhilHealth):

- **Use valid test data.** PhilHealth's dummy health care professionals have "Accreditation up to 12/31/2026". The test-data file gives no validity date for its dummy employers, and it has no test members or PINs ([KI-11](/known-issues#ki-11), [Test data](/reference/test-data)). Ask PhilHealth for test members before your first test cycle, and for new test doctors before 2026-12-31.
- **Use current formats.** ESOA.dtd 0.5 with `Others`, CF5 laterality `N`, the CF4 `1/1` and `NOMED` rules ([KI-04](/known-issues#ki-04), [KI-05](/known-issues#ki-05), [KI-08](/known-issues#ki-08)).
- **Use the current PhilHealth certificate**, not the expired test certificate from the DevKit ([KI-01](/known-issues#ki-01)).
- **Rehearse every row** of the checklists above in order, and write down where each one is shown in your system.
- **Keep evidence**: the raw files, the XML you sent, every decrypted response, RTNs and TCNs, and screenshots.
- **Validate everything locally first** ([Validating XML](/guides/validating-xml)).

## Common mistakes

1. **Building only for Part I.** CF4, eCCSA and Data Migration are required too.
2. **Encrypting attachments with the expired DevKit certificate** ([KI-01](/known-issues#ki-01)), or with the cipher key ([KI-12](/known-issues#ki-12)). Stage 2 decryption fails.
3. **Padding that PhilHealth doesn't strip the same way** ([KI-13](/known-issues#ki-13)). The file opens, but the byte-by-byte check fails.
4. **Signed or expiring URLs, or URLs on a private network.** PhilHealth can't download them.
5. **Scans that aren't PDF/A-1b.**
6. **eSOA without the `Others` category**, or CF5 with blank laterality ([KI-04](/known-issues#ki-04), [KI-05](/known-issues#ki-05)).
7. **Hiding validator messages.** The form checks that users see warnings, major errors and the result.
8. **No offline mode.** Part I C requires offline encoding, encrypted offline data and later submission.

## Related pages

- [The claims lifecycle](/getting-started/claims-lifecycle) and [Submitting a claim](/guides/submitting-a-claim)
- [Encryption overview](/guides/encryption/), [Attachment encryption](/guides/encryption/attachments)
- [Building the eSOA](/guides/esoa), [Building CF5](/guides/cf5), [Building CF4](/guides/cf4), [Migrating data](/guides/data-migration)
- [Validating XML](/guides/validating-xml)
- [Known issues](/known-issues), especially [KI-13](/known-issues#ki-13), [KI-40](/known-issues#ki-40) and [KI-56](/known-issues#ki-56)
- [Original source files](/sources/)
