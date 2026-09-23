---
title: Revision history
description: One reverse-chronological timeline of every dated change across the PECWS 3.0 DevKit documents and DTDs, with a note on whether each change still matters to developers.
---

# Revision history

<Badge type="info" text="Reference only" />

The DevKit has no single change log. The dates are spread across the Implementation Guide's revision table, a one-page DevKit revision note, the version-history comments inside each DTD, amendment tables in individual PDFs, and a circular. This page merges all of them into one timeline, newest first, so you can see what changed, when, and whether it still affects your code.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) (revision history) and [p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) (CF5 DTD history)
- [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf)
- Version-history comments in [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd), [`ESOA.dtd`](/originals/esoa/ESOA.dtd), [`CF4.dtd`](/originals/cf4/CF4.dtd), [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd)
- [20240604 CF5 DTD / DRG XML eForms format, p. 1](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=1) (amendment history)
- [CF4_FILES_UPDATE(02232021).pdf](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf), [CF4 data dictionary rev. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)
- [Data migration dictionary, p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1) (amendment history)
- [PC 2023-0026, p. 7–8](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=7) (repealing clause, date signed)
- [SSVTF (rev. 20250217)](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1), [Dummy test data](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf), [Encryption guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
- PDF and spreadsheet file metadata (creation and modification dates), used only where a document carries no date of its own and marked "file metadata"
:::

## How to read this page

- **Dates** are ISO (`YYYY-MM-DD`). The originals use `YYYYMMDD` revision numbers (Guide), `MM-DD-YYYY` (eClaims and CF4 DTDs) or `YYYY-MM-DD` (eSOA, CF5 and migration DTDs). We converted them.
- **Current?** is our judgment, measured against the DevKit baseline (rev. 20250217) and the dates below:
  - **Yes**: the change is part of the current rules. Implement it.
  - **Superseded**: a later entry undid or replaced it.
  - **History**: background only, already folded into the current files.
  - **Partly** or **Unclear**: other DevKit sources conflict with the change; the KI link explains which one to follow.
- When an entry is also a known discrepancy, the KI link explains the conflict.
- The two long DTD histories have their own sections: [CF4 (EPCB) DTD, 2018–2019](#cf4-dtd-history) and [eClaims upload DTD, 2010–2017](#eclaims-dtd-history). Every version in each DTD's history comment is listed.

## 2026

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2026-12-31 | Dummy test data | The two dummy health care professionals are listed "with Accreditation up to 12/31/2026". After this date, tests that use them will presumably fail. | [Test data PDF](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) | **Yes**, until 2026-12-31. Ask PhilHealth for new test data before that date. See [Test data](/reference/test-data), [KI-11](/known-issues#ki-11). |

## 2025

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2025-03-14 | Guidelines for the Encryption of e-Claim Attachments | The newest file in the DevKit. The page is undated; the date is from file metadata. It defines attachment encryption: SHA-256 hash of the file, AES-256-CBC, a 32-byte random password made of two 16-byte halves each encrypted with PhilHealth's public key, an encrypted random IV, base64 output in one JSON object, optional `.enc` file name, PDF/A for scans. | [Guideline PDF](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) | **Yes**. See [Attachment encryption](/guides/encryption/attachments), [KI-12](/known-issues#ki-12). |
| 2025-02-17 | Software Solution Validation Test Form (SSVTF) for PECWS 3.0, "Revised 20250217", with SSVTF Annex A (CF4 data requirements) and SSVTF Annex B (eSOA minimum data elements) | Current certification checklist: Part I (completeness, eligibility, submission, status, document format incl. PDF/A-1b, offline mode); Part II (eSOA, CF5, CF4 incl. BP `1/1` and `2/2` and the no-medicine code, eCCSA, Data Migration; Stage 2 decryption checks). The CF4 rules it checks are not new: they are already in the 2021 CF4 data dictionary. The form has no change table, so we can't tell what changed from earlier versions. SSVTF Annex B is the same sample SOA page as PC 2023-0026 Annex B, including the 11/17/2023 master-copy stamp. The form cites PA 2024-0032 for applying for the CF5 and eSOA modules "jointly or separately"; that advisory is not in the DevKit. | [SSVTF](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1) | **Yes**. See [Software certification](/guides/certification), [KI-08](/known-issues#ki-08), [KI-40](/known-issues#ki-40), [KI-56](/known-issues#ki-56). |
| 2025-02-17 | Implementation Guide rev. 20250217 and DevKit Revision History | (1) Revised the eSOA data dictionary and DTD. (2) Changed the Drug and Medicine Library for eSOA. (3) CF5 data dictionary: `N` (None) is now the valid value for Laterality. (4) Removed `requestQrAuthorization` and `inquireQrTrackingNo` ("this requirement has been deferred"). | [Guide p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4), [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf) | **Yes**: this is the DevKit baseline. See [KI-02](/known-issues#ki-02), [KI-05](/known-issues#ki-05). |
| 2025-02-17 | `ESOA.dtd` 0.5 (01:08 PM) | "Added the specs for the 'Others' element and 'Others' category". `Others` becomes a required child of `SummaryOfFees` and a `pCategory` value. | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) | **Yes**. See [eSOA XML](/reference/esoa-xml), [KI-04](/known-issues#ki-04). |

::: warning `ESOA.dtd` still calls itself "Version 0.1"
The header comment of `ESOA.dtd` reads "Electronic Statement of Account Data Type Definition Version 0.1", although its history runs to 0.5 (2025-02-17). The copy printed in the Guide (p. 11) drops the number. Identify the file by its last history entry, not by the title line.
:::

## 2024

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2024-12-10 | `eClaimsXmlForDataMigration.dtd` 1.0.0.1 (04:44 PM) | Added the missing closing parenthesis in the `CLAIM` declaration. Added `+` after `OFFLINEDOCUMENT` in `OFFLINEDOCUMENTS` (at least one document if the container exists). Declared `OFFLINEDOCUMENT` as `(#PCDATA)`. | [Migration DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd) | **Yes**: the current migration DTD. It keeps the upload DTD's three non-deterministic content models ([KI-43](/known-issues#ki-43)). See [Data migration XML](/reference/migration-xml). |
| 2024-11-26 | Data Dictionary of the e-Claims XML for Data Migration, revision 20241126 | "Initial Release". Purpose, the key differences from the upload XML (`pClaimSeriesLhio`, `OFFLINEDOCUMENTS`), and encryption of the whole file with the facility's cipher key. | [Dictionary p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1) | **Yes**. It disagrees with the DTD in places ([KI-37](/known-issues#ki-37)) and leaves several questions open ([KI-54](/known-issues#ki-54)). |
| 2024-11-25 | `eClaimsXmlForDataMigration.dtd` 1.0.0.0 (06:43 PM) | "Initial Release" of the migration DTD. Compared with `eClaimsDef.dtd` v1.9, it adds `CLAIM@pClaimSeriesLhio` and `OFFLINEDOCUMENTS`, removes `DOCUMENTS`, and also adds `NCP@pNewbornHearingRegistryNo` and `NCP@pNewbornHearingScreeningTestResult`. Neither the history nor the dictionary mentions the two `NCP` attributes, or the `OFFLINEDOCUMENT@pEncryptionUsed` values `N`/`C`/`P` ([KI-54](/known-issues#ki-54)). | [Migration DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd) | **Superseded** by 1.0.0.1. The newborn attributes remain ([KI-10](/known-issues#ki-10)). |
| 2024-11-11 | Implementation Guide rev. 20241111 | `uploadeClaims`: `pUserName` must be `":"` + software certificate ID; the `softwareCertifficateId` header was removed. `addRequiredDocument`: the body is raw JSON. `getUploadedClaimsMap`: query parameter "ReceiptTicketNo" is now `receiptTicketNumber`. `isDoctorAccredited`, `searchEmployer`: key names documentation updated (the `searchEmployer` table and sample still disagree, [KI-18](/known-issues#ki-18)). `isClaimEligible`: `hospitalCode` defined, sample result updated. `generatePBEFPDF`: documentation updated. "Moved the Annexes B to F to a different file." | [Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Yes** (except the annex move: the 20250217 Guide still contains Annexes A–F). See [KI-03](/known-issues#ki-03), [KI-09](/known-issues#ki-09), [KI-22](/known-issues#ki-22). |
| 2024-09-11 | Implementation Guide rev. 20240911 | Added the Medicine Library to the eSOA Library (Annex F). | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Superseded**: the library was changed again in 20250217. Use the current [eSOA libraries](/reference/libraries/esoa). |
| 2024-09-10 | Implementation Guide rev. 20240910 | Added a `softwareCertifficateId` header to Upload eClaims, "(to be removed on the next version)". Renamed `memberpPIN` to `memberPIN` in `isClaimEligible`. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | Header: **Superseded** (removed 20241111). `memberPIN`: **Yes**. |
| 2024-08-23 | Implementation Guide rev. 20240823 | eSOA XML: `pActualCharges` became `pChargesNetOfApplicableVat`. `isClaimEligible`: `patientIs` values are now `M`, `S`, `C`, `P`. This is the first mention of `isClaimEligible`; no revision records when the method was added ([KI-09](/known-issues#ki-09)). Added the CF5 data dictionary. Added the eSOA libraries. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Yes**. The DTD had made the eSOA rename a year earlier (0.4, 2023-08-14). See [KI-04](/known-issues#ki-04). |
| 2024-08-01 | Dummy Health Care Providers and Employers | Test data: two dummy professionals (accredited up to 2026-12-31) and four dummy employers (no validity date given). There are no dummy members or PINs. The page is undated; the date is from file metadata. | [Test data PDF](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) | **Yes**, until 2026-12-31 for the doctors. See [Test data](/reference/test-data), [KI-11](/known-issues#ki-11). |
| 2024-06-04 | CF5 DTD / DRG XML eForms format, amendment 20240604 | "Remove the attributes of NewBornTimeOfBirth from CF5 XML". This is the standalone `CF5.dtd`, with `SECONDARYDIAG*` and `PROCEDURE*`. | [20240604 PDF p. 1](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=1), [`CF5.dtd`](/originals/cf5/CF5.dtd) | **Yes**, but it conflicts with the DTD printed in the Guide ([KI-06](/known-issues#ki-06)). |
| 2024-04-23 | Implementation Guide rev. 20240423 | Added 13 methods: `addRequiredDocument`, `eClaimsFileCheck`, `getClaimStatus`, `getDoctorPAN`, `getMemberPIN`, `getUploadedClaimsMap`, `getVoucherDetails`, `isDoctorAccredited`, `searchEmployer`, `getDBServerDateTime`, `getServerDateTime`, `getServerVersion`, `generatePBEFPDF`. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Yes**. See [API overview](/api/). |
| 2024-04-18 | Implementation Guide rev. 20240418 | Added `softwareCertId` to the header of `uploadeClaims`. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Superseded**. No revision records its removal, but the current `uploadeClaims` header table lists only `token` ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)). See [KI-03](/known-issues#ki-03). |
| 2024-03-06 | Implementation Guide rev. 20240306 | Added the `uploadeClaims` method. Added Annexes B, C, D, E, F. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Yes**. |
| 2024-02-28 | Implementation Guide rev. 20240228 | Added `requestQrAuthorization` and `inquireQrTrackingNo` for a QR-code use case of the eGov super app. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Superseded**: removed 20250217. Don't implement. See [Removed methods](/api/removed-methods). |
| 2024-02-16 | Implementation Guide rev. 20240216 | `SearchCaseRate`: input changed from object parameters to a comma-separated list. | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Unclear**. The current method section still documents a JSON object body, and we recommend following it ([KI-46](/known-issues#ki-46)). See [searchCaseRates](/api/search-case-rates). |
| 2024-02-15 | Implementation Guide rev. 20240215 | "Initial Release for the SearchCaseRate, GenerateToken, ValidateEsoa and ValidateCF5 methods" (endpoints `searchCaseRates`, `getToken`, `validateeSOA`, `validateCF5`). | [Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) | **Yes**. The names in the history are not the endpoint names ([KI-09](/known-issues#ki-09)). |
| 2024-02-15 | CF5 DTD v1.3, printed in the Guide | "Remove duplicate data", "Remove Attributes (Series,Lhio,Admission Time)", "Rename Tag (DRG - CF5)". This version has `SECONDARYDIAGS (SECONDARYDIAG)` and `PROCEDURES (PROCEDURE)+`. | [Guide p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) | Partly. It conflicts with the 20240604 standalone DTD ([KI-06](/known-issues#ki-06)). |
| 2024-02 | CF5 claim form (Supplementary Form for DRG), "v0.4 revised February 2024" | The paper form behind CF5: 1 PDx, up to 12 SDx, up to 20 RVS codes with laterality and extension codes, newborn admission weight ("less than 0.3kg is considered invalid"), filing "within thirty (30) calendar days from date of discharge". | [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) | **Yes**, except "leave the field blank" for laterality, which was replaced by `N` in 20250217 ([KI-05](/known-issues#ki-05)). See also [KI-51](/known-issues#ki-51) (0.3 kg) and [KI-58](/known-issues#ki-58) (filing deadlines). |

::: tip The CF5 DTD's own history has a labelling slip
In the history printed on Guide p. 17, the 1.2 entry (2023-07-12) sits under a heading that says "Version 1.3". The entries themselves are dated 1.0 to 1.3 in order, so read them by their entry numbers ([KI-09](/known-issues#ki-09)).
:::

## 2023

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2023-11-14 | PhilHealth Circular 2023-0026, "Electronic Data Submission of the Statement of Account (SOA) for All Case Rates (ACR) Claims and Identified PhilHealth Benefits (Revision 1)" | Signed 11/14/2023 (master-copy stamp 11/17/2023). It requires the eSOA with three components, sets deduction order and scope, and "repeals PhilHealth Circular No. 2023-0004". It takes effect 15 days after publication in a newspaper; the publication date is not in the DevKit. | [PC 2023-0026 p. 7](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=7), [p. 8](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=8) | **Yes** (policy). PC 2023-0026 Annex A (p. 9–11) and Annex B (p. 12) describe the fields in business terms; the XML format is `ESOA.dtd` ([KI-04](/known-issues#ki-04)). See [eSOA guide](/guides/esoa). |
| 2023-08-14 | `ESOA.dtd` 0.4 (05:17 PM) | "Changed pActualCharges to pChargesNetOfApplicableVat". | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) | **Yes**. |
| 2023-07-12 | CF5 DTD 1.2 | "Remove duplicate data". | [Guide p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) | History. |
| 2023-06-07 | CF5 DTD 1.1 | "Final Forms of DRG E-Forms"; "Add possible required for claims but not yet final". | [Guide p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) | History. |
| 2023-05-30 | `ESOA.dtd` 0.3 (09:14 AM) | "Added pCategory in ItemizedBillingItem". | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) | **Yes**. |
| 2023-05-16 | CF5 DTD 1.0 | "Testing part since e form not in thier final form". | [Guide p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) | History. |
| 2023-02-13 | `ESOA.dtd` 0.2 (03:51 PM) | "Revised" (no details). | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) | History. |

## 2022

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2022-08-19 | `ESOA.dtd` 0.1 (12:24 PM) | "Initial". | [`ESOA.dtd`](/originals/esoa/ESOA.dtd) | History. |
| 2022-02-24 | Encryption demo kits (`ForEncryption.zip`), file metadata | Date stamp of every file in the zip: C# (.NET Framework, Newtonsoft.Json 10.0.3) and PHP kits, the bundled test certificate, and sample `.enc` outputs. The folder entries are dated 2022-08-31. | [`ForEncryption.zip`](/originals/encryption/ForEncryption.zip) | Reference only, with known defects ([KI-13](/known-issues#ki-13), [KI-15](/known-issues#ki-15), [KI-16](/known-issues#ki-16)). See [Demo kits](/reference/demo-kits). |

## 2021

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2021-02-23 | CF4 files update and CF4 data dictionary revision 4 | Systolic and diastolic BP are required for patients three years old and above. Added `pHeight` and `pWeight` (required). For "no medicine": `pDrugCode` `NOMED0000000000000000000000000`, `pGenericCode` `NOMED`, `00000` for salt/strength/form/unit/package codes, `-` for `pRoute` and `pInstructionFrequency`. Added the February 2020 CF4 template. Library codes added to `lib_medicine`, `lib_medicine_generic`, `lib_medicine_form`. The dictionary also has the BP values `1` ("not available or not required") and `2` (palpatory) for systolic and diastolic ([p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)), which the update note doesn't list. | [CF4 files update](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf), [CF4 dictionary p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) | **Yes**. SSVTF 2025 turned the BP values and the no-medicine codes into certification checks ([KI-08](/known-issues#ki-08)). See [CF4 guide](/guides/cf4). |

## 2020

| Date | Document | Change | Source | Current? |
|---|---|---|---|---|
| 2020-02 | PhilHealth Claim Form 4, "February 2020" | The paper CF4 template. It says the form "should be filed within sixty (60) calendar days from date of discharge". The PDF file was created 2020-08-03 (file metadata). | [CF4 form](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf) | **Yes**: the current CF4 form. Its deadline differs from the CF5 form's ([KI-58](/known-issues#ki-58)). |

## 2018–2019: CF4 (EPCB) DTD {#cf4-dtd-history}

All entries come from the version-history comment in [`CF4.dtd`](/originals/cf4/CF4.dtd) (also printed in [`CF4.pdf`](/originals/cf4/CF4.pdf)). The file's title line says "EPCB Document Type Definition Version 1.20", while the history numbers its versions 0.1.0 to 0.1.20. The DTD was built for the primary-care (EPCB) program and later reused for CF4, which is why many of its fields are "not part of the CF4, but requirement for XML validation".

| Date | Version | Change | Current? |
|---|---|---|---|
| 2019-02-26 | 0.1.20 | Added `pSaltCode`, `pUnitCode` and `pRoute` to `MEDICINE` ("EPCB and CF4 purposes"), `pIsApplicable` to `MENSHIST`, and `pPainSite` to `SUBJECTIVE`. | **Yes**: the current CF4 DTD. See [CF4 XML](/reference/cf4-xml). |
| 2019-02-19 | 0.1.19 | Added `W` (waived) in `PAPSSMEAR` and `OGTT`. | History (included in 0.1.20). |
| 2019-02-12 | 0.1.18 | "added pSignsSymptoms in SUBJECTIVE list for CF4 purposes". | History (included in 0.1.20). |
| 2019-01-31 | 0.1.17 | Added `X` as "NOT APPLICABLE" in `SPUTUM`, and "read value of 'X' as NOT APPLICABLE in element of ENLISTMENT". | History (included in 0.1.20). |
| 2019-01-29 | 0.1.16 | "updated elements and attributes per requirements"; "modified element operators". | History (included in 0.1.20). |
| 2018-12-20 | 0.1.15 | `ENLISTMENT@pPackageType` values changed from `(P\|X\|A)` to `(P\|E\|A)`, "E - for EPCB". CF4 uses `A`. | History (included in 0.1.20). |
| 2018-10-09 | 0.1.14 | Added `pGenericName` in `MEDICINE`. | History (included in 0.1.20). |
| 2018-10-05 | 0.1.13 | Added `pTransDate` and `pCreatedBy`. | History (included in 0.1.20). |
| 2018-10-03 | 0.1.12 | Added `pDataCollection` in `SPUTUM`; removed `pFindings` in `FECALYSIS`. | History (included in 0.1.20). |
| 2018-09-28 | 0.1.11 | Removed `pWaist`; added `pIsApplicable` in `LABRESULT`. | History (included in 0.1.20). |
| 2018-09-27 | 0.1.10 | Removed the unit code and salt code in `MEDICINE` (added back in 0.1.20). Added `pPrescPhysician` and `pIsApplicable` in `MEDICINE`. Modified `LABRESULT`. Added `pEClaimId` (Claim ID) and `pEClaimsTransmittalId` "for CF4". | History (included in 0.1.20). |
| 2018-09-19 | 0.1.9 | Valid values for `pGenSurveyId` ("1 - Awake and Alert; 2 - Altered Sensorium") and `pPackageType` ("P - PCB1; X - EPCB; A - CF4"). | History (the `pPackageType` values changed in 0.1.15). |
| 2018-09-10 | 0.1.8 | "Add Generic Survey, Course in the ward - date, doctors action". | History (included in 0.1.20). |
| 2018-08-30 | 0.1.7 | "Update Medicine element/attributes (library from DOH)"; "Update attributes based on CF4". | History (included in 0.1.20). |
| 2018-07-11 | 0.1.6 | Added co-payment in laboratory results and in medicine; the unit price became `pActualUnitPrice` ("Drug Actual Price"). | History (included in 0.1.20). |
| 2018-07-10 | 0.1.5 | Added `pAvailFreeService` in `ENLISTMENT`; "Added needed value in pReportStatus". | History (included in 0.1.20). |
| 2018-07-09 | 0.1.4 | Renamed `pEnlistType` to `pPackageType` in `ENLISTMENT`. | History (included in 0.1.20). |
| 2018-06-28 | 0.1.3 | A large revision of profiling, SOAP and laboratory results: added plan/management in profiling, "the Certification ID of XPS", `pWithDisability` and `pDependentType` in enlistment, `pProfileOTP`, the `ADVICE`, `DIAGNOSTIC`, `MANAGEMENT`, `PEPERT` and `PESPECIFIC` elements, a new `MEDICINE` element, the `ECG`, `FECALYSIS`, `PAPSSMEAR` and `OGTT` laboratory elements, and `pDrugActualPrice`, `pDiagnosticLabFee`, `pReportStatus` and `pDeficiencyRemarks`. Removed the `OBLIGATED` element and several attributes. | History (included in 0.1.20). |
| 2018-04-24 | 0.1.2 | Added laboratory results, and medicine in the consultation (SOAP) module. | History (included in 0.1.20). |
| 2018-01-16 | 0.1.1 | "Camelized" attribute names. | History. |
| 2018-01-15 | 0.1.0 | Initial draft. | History. |

## 2010–2017: eClaims upload DTD {#eclaims-dtd-history}

All entries come from the version-history comment in [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd). The Guide (rev. 20250217) still prints v1.9 as the current upload DTD.

| Date | Version | Change | Current? |
|---|---|---|---|
| 2017-06-23 | 1.9.0 | Removed the enumerated values of `pDocumentType` "for flexibility of adding new elements". Added `pServiceProvider` to `eCLAIMS`. | **Yes**: the current upload DTD. |
| 2016-09-19 | 1.8.0 | Added `IMRT` (repetitive procedure), `APR` in `CF2` (consent to access patient record), `pHasAttachedSOA` in `CF2`, and `CATARACTINFO`. "The 'CATARACT' element will be deprecated later." Changed the `pThumbMarkedBy` comments. | **Yes**. See [KI-07](/known-issues#ki-07). |
| 2015-07-31 | 1.7.6 | Removed "()" in the `BENEFITS` part. | History. |
| 2015-06-23 | 1.7.5 | Added `P` (Lifetime Member) to `pMemberShipType`. Added `ANR` (Anesthesia Record) and `HDR` (Hemodialysis Record) document types. | **Yes** (`P`). |
| 2014-11-03 | 1.7.4 | Added `MRF` (PhilHealth Member Registration Form) document type. | History (enumeration removed in 1.9.0; code still in Annex B). |
| 2014-01-28 | 1.7.3 | Added `pPreAuthDate` (`ZBENEFIT`), `pCaseRateAmount` (`CASERATE`), `pDoctorSignDate` (`PROFESSIONALS`), `pPatientType` and `pIsEmergency` (`CLAIM`). Moved `pCataractPreAuth` into `CATARACT`. | **Yes**. |
| 2013-12-16 | 1.7.2 | Moved `PARTICULARS` out of `CF3`. Added `CF3_OLD` and `CF3_NEW`. | **Yes**. |
| 2013-11-04 | 1.7.1 | Updated elements to the claim forms version 11_04_2013. | History. |
| 2013-09-24 | 1.7 | "Major revision to cater all case rate policy". | History. |
| 2013-01-29 | 1.6.1 | Added `CSF` to the document types. | History. |
| 2013-01-25 | 1.6 | Updated the new coding of documents. | History. |
| 2012-10-18 | 1.5 | Moved observation codes out of the Z-Benefit part. Added official receipt details. | History. |
| 2012-07-16 | 1.4 | Added support for observation for Z-Benefits. | History. |
| 2012-06-01 | 1.3 | Added elements for document URLs and for Z Benefit. | History. |
| 2012-02-24 | 1.2 | Added codes for packages and case rates. | History. |
| 2011-08-19 | 1.1 | Added requirements for case rate. | History. |
| 2010-11-12 | 1.0 | First version. | History. |

## Other dated items

| Date | Item | Note | Current? |
|---|---|---|---|
| 2014-09-30 to 2014-12-29 | `pnpki_philhealth_eclaims_auth_cert.pem` | Validity period of the bundled PhilHealth certificate (CN `eclaims-test.philhealth.gov.ph`, issued by a test CA). It expired in 2014. | **Yes**: don't use it. Get the current certificate from PhilHealth ([KI-01](/known-issues#ki-01)). |
| 2018-01-17 | CF4 data dictionary ("Annex G") | "Date created" printed in the header of every page of revision 4 (revised 2021-02-23). Revisions 1 to 3 are not in the DevKit. | No. Use revision 4 ([KI-08](/known-issues#ki-08), [KI-55](/known-issues#ki-55)). |
| 2025-05-28 | `philhealth-docs.zip` | Date stamped on the DevKit files inside the bundle as we received it. It shows when the bundle was assembled, not a content change. | No. |

### File metadata only

These files have no revision table or history comment. Their only dates are file properties, which can reflect when a file was saved rather than when its content changed.

| File | Created | Last modified |
|---|---|---|
| Implementation Guide rev. 20250217 (PDF) | 2025-02-18 | 2025-02-18 |
| DevKit Revision History (PDF) | 2025-02-18 | 2025-02-18 |
| Validating e-Claims XML File in NetBeans (PDF) | 2025-02-18 | 2025-02-18 |
| SSVTF rev. 20250217 (PDF) | 2025-02-18 | 2025-02-18 |
| SSVTF Annex B, eSOA Minimum Data Elements (PDF) | not set | 2025-02-18 |
| `DRG Error Codes.xlsx` ([KI-36](/known-issues#ki-36)) | 2024-09-27 | 2025-02-18 |
| `Annex F - eSOA Item Library.xlsx` | 2024-11-12 | 2025-02-18 |
| `Annex F - Medicine Library.xlsx` | 2018-10-03 | 2025-02-18 |
| 20240604 CF5 DTD PDF | not set | 2024-08-30 |
| Data migration dictionary (PDF) | 2024-11-26 | 2024-11-26 |
| CF4 files update (PDF) | 2021-03-03 | 2021-03-03 |
| CF4 data dictionary rev. 4 (PDF) | 2021-03-02 | 2021-03-02 |
| `CF4.pdf` (the CF4 DTD printed) | 2021-02-23 | 2021-02-23 |
| CF4 library spreadsheets (16 files) | 2018-10-02 to 2019-02-27 (not set for `lib_chief_complaint.xlsx`) | 2019-02-27 to 2021-02-23 where set (`lib_medicine_generic.xlsx`: 2021-02-23); not set for 8 files |
| SSVTF Annex A, CF4 Data Requirements (PDF) | not set | not set |
| CF5 claim form (PDF, exported from Google Sheets) | not set | not set |
| PC 2023-0026 (scanned PDF) | not set | not set |

## Related pages

- [How to read these docs](/getting-started/how-to-read): which source wins when dates conflict
- [Known issues](/known-issues)
- [Original source files](/sources/)
- [Removed methods](/api/removed-methods)
