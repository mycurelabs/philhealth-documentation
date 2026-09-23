---
title: Original source files
description: Catalog of every file in the PhilHealth PECWS 3.0 DevKit, with dates, status, and where each one is explained on this site.
---

# Original source files

This page lists **every file in the PhilHealth DevKit**, unmodified, with its date or version, its status, and the pages on this site that explain it. Every page on this site cites these files.

::: tip Download everything
[`philhealth-docs.zip`](/originals/philhealth-docs.zip) (12.2 MB) is the complete DevKit bundle exactly as received. The individual files below are byte-identical to the files inside it. We checked this with SHA-256 hashes.
:::

::: info File names
We kept PhilHealth's original file names so you can match them with copies you receive from PhilHealth. We only moved the files into topic folders; the [mapping table](#where-each-file-came-from) at the end shows where each one was in the bundle. Page numbers on this site are **PDF page numbers**, not the printed footer numbers.
:::

Status legend: <Badge type="tip" text="Current" /> newest official version in the DevKit · <Badge type="warning" text="Conflicting sources" /> disagrees with another official file · <Badge type="danger" text="Outdated" /> superseded or expired · <Badge type="info" text="Reference only" /> for understanding, not for copying.

## Implementation Guide and revision history

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [PhilHealth Electronic Claims Implementation Guide for PECWS 3.0 (Revised 20250217).pdf](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) (188 pages) | Rev. 20250217 | <Badge type="tip" text="Current" /> | **The main document.** It covers all 19 API methods (p. 8–74), payload encryption (Annex A, p. 75–76), document type codes (Annex B, p. 77–78), the eClaims data dictionary (Annex C, p. 79–85), the eSOA data dictionary (Annex D, p. 86–87), the CF5 data dictionary (Annex E, p. 88), and the eSOA libraries (Annex F, p. 89–188). | [API reference](/api/), most reference pages |
| [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf) (1 page) | Rev. 20250217 | <Badge type="tip" text="Current" /> | What changed in the 20250217 DevKit: eSOA dictionary and DTD revised, eSOA drug library changed, CF5 laterality `N`, QR methods removed. | [Revision history](/changelog) |

## eClaims XML (the claim itself)

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd) | v1.9 (2017-06-23) | <Badge type="tip" text="Current" /> | Schema of the claim XML sent to `uploadeClaims`. It is old, but it is the same DTD printed in the 2025 Guide (p. 21–28). | [eClaims XML](/reference/eclaims-xml), [Code tables](/reference/code-tables) |
| [Validating e-Claims XML File in Netbeans.pdf](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf) (1 page) | 2025-02-18 | <Badge type="tip" text="Current" /> | How to validate an eClaims XML against the DTD with the NetBeans IDE. | [Validating XML locally](/guides/validating-xml) |

## Electronic Statement of Account (eSOA)

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [ESOA.dtd](/originals/esoa/ESOA.dtd) | v0.5 (2025-02-17) | <Badge type="tip" text="Current" /> | Schema of the eSOA XML. | [eSOA XML](/reference/esoa-xml) |
| [Electronic Submission of the Statement Of Account (PC2023-0026).pdf](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf) (12 pages, scanned) | Signed 2023-11-14 | <Badge type="tip" text="Current" /> policy · <Badge type="danger" text="Outdated" /> field names | PhilHealth Circular 2023-0026 (Revision 1), the eSOA **policy**. Its Annex A and B describe fields in business terms, and the XML format is now defined by `ESOA.dtd` ([KI-04](/known-issues#ki-04)). This PDF is a scan with no selectable text. | [Building the eSOA](/guides/esoa) |
| [Annex F - eSOA Item Library.xlsx](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) | Modified 2025-02-18 | <Badge type="tip" text="Current" /> | Item codes for non-drug eSOA line items. | [eSOA libraries](/reference/libraries/esoa) |
| [Annex F - Medicine Library.xlsx](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) | Modified 2025-02-18 | <Badge type="tip" text="Current" /> | 30-character drug codes for the eSOA DrugsAndMedicine category (2,427 drugs, same codes as CF4's `lib_medicine.xlsx`). | [eSOA libraries](/reference/libraries/esoa) |

## Claim Form 5 (CF5): DRG data

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [CF5.dtd](/originals/cf5/CF5.dtd) | 20240604 | <Badge type="warning" text="Conflicting sources" /> | Schema of the CF5 XML. Differs from the DTD printed in the Guide ([KI-06](/known-issues#ki-06)). | [CF5 XML](/reference/cf5-xml) |
| [20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf) (4 pages) | Rev. 20240604 | <Badge type="tip" text="Current" /> | Amendment history, the CF5 DTD, and a sample XML. | [CF5 XML](/reference/cf5-xml) |
| [DRG XML EFORMS FORMAT.xml](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml) | 20240604 | <Badge type="info" text="Reference only" /> | Sample CF5 XML. Uses blank laterality, which is superseded ([KI-05](/known-issues#ki-05)). | [CF5 XML](/reference/cf5-xml) |
| [DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) (1 page) | Form v0.4, Feb 2024 | <Badge type="tip" text="Current" /> form · <Badge type="danger" text="Outdated" /> laterality note | The paper CF5 "Supplementary Form for DRG" with its filling rules. | [Building CF5](/guides/cf5) |
| [DRG Error Codes.xlsx](/originals/cf5/DRG%20Error%20Codes.xlsx) (5 sheets) | Modified 2025-02-18 | <Badge type="tip" text="Current" /> | Error and warning codes from claim submission and the DRG grouper ([KI-36](/known-issues#ki-36)). | [DRG error codes](/reference/drg-error-codes) |

## Claim Form 4 (CF4): clinical data

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [CF4.dtd](/originals/cf4/CF4.dtd) | EPCB DTD 1.20 (2019-02-26) | <Badge type="tip" text="Current" /> (old) | Schema of the CF4 XML. It is shared with PhilHealth's primary-care (EPCB) program ([KI-08](/known-issues#ki-08)). | [CF4 XML](/reference/cf4-xml) |
| [CF4.pdf](/originals/cf4/CF4.pdf) (14 pages) | 2021-02-23 | <Badge type="info" text="Reference only" /> | The same CF4 DTD, printed as a PDF. | [CF4 XML](/reference/cf4-xml) |
| [Claim_Form_4_Data_Dictionary_Revision_4(02232021)_ANNEX-G.pdf](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf) (20 pages) | Rev. 4, 2021-02-23 | <Badge type="tip" text="Current" /> (old) | Field-by-field rules and default values for CF4 XML. | [CF4 XML](/reference/cf4-xml), [Building CF4](/guides/cf4) |
| [CF4_FILES_UPDATE(02232021).pdf](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf) (1 page) | 2021-02-23 | <Badge type="tip" text="Current" /> | Change note: blood pressure, height, and weight rules, and "no medicine" (NOMED) codes. | [Building CF4](/guides/cf4) |
| [PhilHealth_ClaimForm4_February_2020.pdf](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf) (2 pages) | Feb 2020 | <Badge type="tip" text="Current" /> | The paper CF4 form. | [Building CF4](/guides/cf4) |
| `libraries/lib_*.xlsx` (16 files, listed below) | 2018–2021 | <Badge type="tip" text="Current" /> | Code libraries for CF4 fields (physical exam findings, symptoms, ICD-10, medicines) ([KI-39](/known-issues#ki-39)). | [CF4 libraries](/reference/libraries/cf4) |

CF4 libraries: [lib_abdomen](/originals/cf4/libraries/lib_abdomen.xlsx) · [lib_chest](/originals/cf4/libraries/lib_chest.xlsx) · [lib_chief_complaint](/originals/cf4/libraries/lib_chief_complaint.xlsx) · [lib_genitourinary](/originals/cf4/libraries/lib_genitourinary.xlsx) · [lib_heart](/originals/cf4/libraries/lib_heart.xlsx) · [lib_heent](/originals/cf4/libraries/lib_heent.xlsx) · [lib_icd](/originals/cf4/libraries/lib_icd.xlsx) · [lib_medicine](/originals/cf4/libraries/lib_medicine.xlsx) · [lib_medicine_form](/originals/cf4/libraries/lib_medicine_form.xlsx) · [lib_medicine_generic](/originals/cf4/libraries/lib_medicine_generic.xlsx) · [lib_medicine_package](/originals/cf4/libraries/lib_medicine_package.xlsx) · [lib_medicine_salt](/originals/cf4/libraries/lib_medicine_salt.xlsx) · [lib_medicine_strength](/originals/cf4/libraries/lib_medicine_strength.xlsx) · [lib_medicine_unit](/originals/cf4/libraries/lib_medicine_unit.xlsx) · [lib_neuro](/originals/cf4/libraries/lib_neuro.xlsx) · [lib_skin](/originals/cf4/libraries/lib_skin.xlsx)

## Encryption

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [Guidelines for the Encryption of e-Claim Attachments.pdf](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) (2 pages) | 2025-03-14 | <Badge type="tip" text="Current" /> | How to encrypt supporting documents with PhilHealth's public key. | [Encrypting attachments](/guides/encryption/attachments) |
| [pnpki_philhealth_eclaims_auth_cert.pem](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem) | Valid 2014-09-30 to 2014-12-29 | <Badge type="danger" text="Outdated" /> | PhilHealth "public key file". It is an **expired test certificate** ([KI-01](/known-issues#ki-01)). | [Encrypting attachments](/guides/encryption/attachments) |
| [ForEncryption.zip](/originals/encryption/ForEncryption.zip) | Files dated 2022-02-24 | <Badge type="info" text="Reference only" /> | Demo kits in C# and PHP for encrypting attachments and payloads, with sample outputs. | [Encryption demo kits](/reference/demo-kits) |
| [demo-kits-source/](#demo-kit-source-files-extracted) | Extracted from `ForEncryption.zip` | <Badge type="info" text="Reference only" /> | The kits' source files, extracted so you can read them in a browser. We added this folder; PhilHealth didn't ship it. | [Encryption demo kits](/reference/demo-kits) |

### Demo kit source files (extracted) {#demo-kit-source-files-extracted}

We extracted only the source and sample files; the zip also contains compiled binaries and IDE files. Everything here is also inside [`ForEncryption.zip`](/originals/encryption/ForEncryption.zip). One change: the zip's folder `Demo Kit for C#` is named `Demo Kit for CSharp` here, because a `#` in a web address breaks links on many servers. The file contents are unchanged.

- PHP: [PhilHealthEClaimsEncryptor.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php) · [encryptEclaimsAttachment.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/encryptEclaimsAttachment.php) · [testEncryptAndDecryptXml.php](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/testEncryptAndDecryptXml.php) · [sample output (.enc)](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/@Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingPHP.pdf.enc) · [Recreate file to be encrypted.bat](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/@Files/Input/Recreate%20file%20to%20be%20encrypted.bat)
- C#: [PhilHealthEClaimsEncryptor.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs) · [PhilHealthEClaimsDocEncryption.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsDocEncryption.cs) · [Form1.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Form1.cs) · [Program.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Program.cs) · [Helpers/Utils.cs](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/Helpers/Utils.cs) · [sample output (.enc)](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/@Files/Output/SAMPLE_BIRTH_CERTIFICATE-usingCSharp.pdf.enc) · [Java sample output (.enc)](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/@Files/Output/SAMPLE_BIRTH_CERTIFICATE--UsingJava.pdf.enc) · [Recreate file to be encrypted.bat](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/@Files/Input/Recreate%20file%20to%20be%20encrypted.bat)

## Data migration (switching IT service providers)

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [eClaimsXmlForDataMigration.dtd](/originals/data-migration/eClaimsXmlForDataMigration.dtd) | v1.0.0.1 (2024-12-10) | <Badge type="tip" text="Current" /> | Schema of the export/import file used when a facility changes software provider. | [Data migration XML](/reference/migration-xml) |
| [Data Dictionary of the e-Claims XML for Data Migration.pdf](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf) (12 pages) | Rev. 20241126 | <Badge type="tip" text="Current" /> | How the migration XML differs from the upload XML, and its field definitions. | [Migrating data](/guides/data-migration) |

## Certification (software validation)

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [Software Solution Validation Test Form for PECWS 3.0 (Revised 20250217).pdf](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) (14 pages) | Rev. 20250217 | <Badge type="tip" text="Current" /> | The checklist PhilHealth uses to certify your software (SSVTF). | [Software certification](/guides/certification) |
| [SSVTF - Annex A - CF4 Data Requirements.pdf](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf) (1 page) | 2025 | <Badge type="tip" text="Current" /> | The CF4 data elements your system must capture. | [Building CF4](/guides/cf4) |
| [SSVTF - Annex B -  eSOA Minimum Data Elements.pdf](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf) (1 page, scanned) | 2025-02-18 | <Badge type="tip" text="Current" /> | A sample Statement of Account layout (the same page as Annex B of PC 2023-0026). | [Building the eSOA](/guides/esoa) |

## Test data

| File | Date / version | Status | What it is | Explained in |
|---|---|---|---|---|
| [Dummy Health Care Providers and Employers.pdf](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (1 page) | 2024-08-01 | <Badge type="danger" text="Expires 2026-12-31" /> | Two dummy doctors and four dummy employers for testing ([KI-11](/known-issues#ki-11)). | [Test data](/reference/test-data) |

## Complete bundle

| File | Status | What it is |
|---|---|---|
| [philhealth-docs.zip](/originals/philhealth-docs.zip) (12.2 MB) | <Badge type="tip" text="Current" /> | The whole DevKit as received from PhilHealth. It contains every file above, with the original folder layout. |

## Where each file came from {#where-each-file-came-from}

The left column is the path inside `philhealth-docs.zip`. The middle column is where the file is on this site (and in this repository under `docs/public/originals/`).

| Original path in the DevKit | Location on this site | Size |
|---|---|---|
| `SSVTF - Annex A - CF4 Data Requirements.pdf` | [`certification/SSVTF - Annex A - CF4 Data Requirements.pdf`](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf) | 58.4 KB |
| `SSVTF - Annex B -  eSOA Minimum Data Elements.pdf` | [`certification/SSVTF - Annex B -  eSOA Minimum Data Elements.pdf`](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf) | 27.9 KB |
| `Software Solution Validation Test Form for PECWS 3.0 (Revised 20250217).pdf` | [`certification/Software Solution Validation Test Form for PECWS 3.0 (Revised 20250217).pdf`](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) | 959.4 KB |
| `CF4/DTD/CF4.dtd` | [`cf4/CF4.dtd`](/originals/cf4/CF4.dtd) | 22.5 KB |
| `CF4/CF4.pdf` | [`cf4/CF4.pdf`](/originals/cf4/CF4.pdf) | 150.2 KB |
| `CF4/CF4_FILES_UPDATE(02232021).pdf` | [`cf4/CF4_FILES_UPDATE(02232021).pdf`](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf) | 86.9 KB |
| `CF4/Claim_Form_4_Data_Dictionary_Revision_4(02232021)_ANNEX-G.pdf` | [`cf4/Claim_Form_4_Data_Dictionary_Revision_4(02232021)_ANNEX-G.pdf`](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf) | 965.0 KB |
| `CF4/PhilHealth_ClaimForm4_February_2020.pdf` | [`cf4/PhilHealth_ClaimForm4_February_2020.pdf`](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf) | 402.7 KB |
| `CF4/LIBRARIES/lib_abdomen.xlsx` | [`cf4/libraries/lib_abdomen.xlsx`](/originals/cf4/libraries/lib_abdomen.xlsx) | 9.2 KB |
| `CF4/LIBRARIES/lib_chest.xlsx` | [`cf4/libraries/lib_chest.xlsx`](/originals/cf4/libraries/lib_chest.xlsx) | 9.1 KB |
| `CF4/LIBRARIES/lib_chief_complaint.xlsx` | [`cf4/libraries/lib_chief_complaint.xlsx`](/originals/cf4/libraries/lib_chief_complaint.xlsx) | 11.5 KB |
| `CF4/LIBRARIES/lib_genitourinary.xlsx` | [`cf4/libraries/lib_genitourinary.xlsx`](/originals/cf4/libraries/lib_genitourinary.xlsx) | 10.6 KB |
| `CF4/LIBRARIES/lib_heart.xlsx` | [`cf4/libraries/lib_heart.xlsx`](/originals/cf4/libraries/lib_heart.xlsx) | 9.0 KB |
| `CF4/LIBRARIES/lib_heent.xlsx` | [`cf4/libraries/lib_heent.xlsx`](/originals/cf4/libraries/lib_heent.xlsx) | 11.1 KB |
| `CF4/LIBRARIES/lib_icd.xlsx` | [`cf4/libraries/lib_icd.xlsx`](/originals/cf4/libraries/lib_icd.xlsx) | 275.7 KB |
| `CF4/LIBRARIES/lib_medicine.xlsx` | [`cf4/libraries/lib_medicine.xlsx`](/originals/cf4/libraries/lib_medicine.xlsx) | 124.7 KB |
| `CF4/LIBRARIES/lib_medicine_form.xlsx` | [`cf4/libraries/lib_medicine_form.xlsx`](/originals/cf4/libraries/lib_medicine_form.xlsx) | 19.2 KB |
| `CF4/LIBRARIES/lib_medicine_generic.xlsx` | [`cf4/libraries/lib_medicine_generic.xlsx`](/originals/cf4/libraries/lib_medicine_generic.xlsx) | 72.4 KB |
| `CF4/LIBRARIES/lib_medicine_package.xlsx` | [`cf4/libraries/lib_medicine_package.xlsx`](/originals/cf4/libraries/lib_medicine_package.xlsx) | 17.8 KB |
| `CF4/LIBRARIES/lib_medicine_salt.xlsx` | [`cf4/libraries/lib_medicine_salt.xlsx`](/originals/cf4/libraries/lib_medicine_salt.xlsx) | 11.2 KB |
| `CF4/LIBRARIES/lib_medicine_strength.xlsx` | [`cf4/libraries/lib_medicine_strength.xlsx`](/originals/cf4/libraries/lib_medicine_strength.xlsx) | 52.7 KB |
| `CF4/LIBRARIES/lib_medicine_unit.xlsx` | [`cf4/libraries/lib_medicine_unit.xlsx`](/originals/cf4/libraries/lib_medicine_unit.xlsx) | 32.1 KB |
| `CF4/LIBRARIES/lib_neuro.xlsx` | [`cf4/libraries/lib_neuro.xlsx`](/originals/cf4/libraries/lib_neuro.xlsx) | 9.2 KB |
| `CF4/LIBRARIES/lib_skin.xlsx` | [`cf4/libraries/lib_skin.xlsx`](/originals/cf4/libraries/lib_skin.xlsx) | 9.0 KB |
| `CF5/20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf` | [`cf5/20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf`](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf) | 785.4 KB |
| `CF5/CF5.dtd` | [`cf5/CF5.dtd`](/originals/cf5/CF5.dtd) | 1.2 KB |
| `CF5/DRG Error Codes.xlsx` | [`cf5/DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx) | 43.0 KB |
| `CF5/DRG XML EFORMS FORMAT.xml` | [`cf5/DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml) | 639 B |
| `CF5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf` | [`cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf`](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) | 448.9 KB |
| `For Data Migration/Data Dictionary of the e-Claims XML for Data Migration.pdf` | [`data-migration/Data Dictionary of the e-Claims XML for Data Migration.pdf`](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf) | 796.5 KB |
| `For Data Migration/eClaimsXmlForDataMigration.dtd` | [`data-migration/eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) | 13.9 KB |
| `Validating e-Claims XML File in Netbeans.pdf` | [`eclaims-xml/Validating e-Claims XML File in Netbeans.pdf`](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf) | 66.4 KB |
| `eClaimsDef.dtd` | [`eclaims-xml/eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) | 15.5 KB |
| `ForEncryption.zip` | [`encryption/ForEncryption.zip`](/originals/encryption/ForEncryption.zip) | 4.3 MB |
| `About Encryption  of eClaim Attachments/Guidelines for the Encryption of e-Claim Attachments.pdf` | [`encryption/Guidelines for the Encryption of e-Claim Attachments.pdf`](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) | 470.6 KB |
| `About Encryption  of eClaim Attachments/PhilHealth Public Key File/pnpki_philhealth_eclaims_auth_cert.pem` | [`encryption/pnpki_philhealth_eclaims_auth_cert.pem`](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem) | 2.2 KB |
| `eSOA/Annex F - Medicine Library.xlsx` | [`esoa/Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) | 83.7 KB |
| `eSOA/Annex F - eSOA Item Library.xlsx` | [`esoa/Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) | 71.8 KB |
| `eSOA/ESOA.dtd` | [`esoa/ESOA.dtd`](/originals/esoa/ESOA.dtd) | 2.5 KB |
| `eSOA/Electronic Submission of the Statement Of Account (PC2023-0026).pdf` | [`esoa/Electronic Submission of the Statement Of Account (PC2023-0026).pdf`](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf) | 419.2 KB |
| `DevKit Revision History.pdf` | [`implementation-guide/DevKit Revision History.pdf`](/originals/implementation-guide/DevKit%20Revision%20History.pdf) | 79.5 KB |
| `PhilHealth Electronic Claims Implementation Guide for PECWS 3.0 (Revised 20250217).pdf` | [`implementation-guide/PhilHealth Electronic Claims Implementation Guide for PECWS 3.0 (Revised 20250217).pdf`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) | 2.9 MB |
| `philhealth-docs.zip` | [`philhealth-docs.zip`](/originals/philhealth-docs.zip) | 12.2 MB |
| `Dummy Health Care Providers and Employers.pdf` | [`test-data/Dummy Health Care Providers and Employers.pdf`](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) | 75.2 KB |
