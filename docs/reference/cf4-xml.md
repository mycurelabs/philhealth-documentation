---
title: CF4 XML (EPCB DTD)
description: Element-by-element reference for the CF4 XML file, merging CF4.dtd (EPCB 1.20) with the CF4 data dictionary rev. 4.
---

# CF4 XML (EPCB DTD)

<Badge type="tip" text="Current: CF4.dtd v1.20" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

This page is the complete reference for the CF4 (Claim Form 4) XML file: every element and every attribute of [`CF4.dtd`](/originals/cf4/CF4.dtd), merged with the lengths, formats, defaults and rules of the CF4 data dictionary rev. 4. Use it while you code; for the "why" and the workflow, read [Building CF4](/guides/cf4) first. The CF4 files date from 2019–2021 but are still the newest in the DevKit, and the 2025 certification form still requires CF4 ([KI-08](/known-issues#ki-08)).

::: info Sources
- [`CF4.dtd`](/originals/cf4/CF4.dtd): "EPCB Document Type Definition Version 1.20", last history entry 0.1.20 of 2019-02-26
- [`CF4.pdf`](/originals/cf4/CF4.pdf): the same DTD printed as a PDF (created 2021-02-23). We compared it with the `.dtd` word by word: the content is identical; only line wrapping differs.
- [CF4 Data Dictionary rev. 4, Annex G (2021-02-23), p. 1–20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)
- [CF4 files update (2021-02-23), p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1)
- [SSVTF rev. 20250217, p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)
:::

::: tip TL;DR
- The root is `EPCB` with six mandatory sections, in this order: `ENLISTMENTS`, `PROFILING`, `SOAPS`, `COURSEWARDS`, `LABRESULTS`, `MEDICINES`.
- All 449 attributes are `#REQUIRED`: send each one, using the dictionary default or `""` when CF4 doesn't use it.
- Dates are `YYYY-MM-DD`; `pEffYear` is a four-digit year ([KI-38](/known-issues#ki-38)).
- Where the dictionary and the DTD disagree, use the DTD for names and structure. Several clinical questions and the "blank row" attributes have no guidance at all ([KI-55](/known-issues#ki-55)).
- Copy the [DTD-valid example](#example) and replace the patient data. The workflow is in [Building CF4](/guides/cf4).
:::

::: details Abbreviations used on this page
| Term | Meaning |
|---|---|
| DTD | Document Type Definition: the XML schema PhilHealth validates against |
| EPCB | The primary-care benefit package whose DTD CF4 reuses ([why](/guides/cf4#the-key-idea-cf4-borrows-the-primary-care-epcb-dtd)) |
| HCI | Health care institution: the former term for a health facility (HF), still used in CF4 names such as `pHciAccreNo` ([glossary](/getting-started/glossary#hci)) |
| PIN | PhilHealth Identification Number (12 digits) |
| SSVTF | Software Solution Validation Test Form (certification checklist) |
| SOAP | The consultation part of the CF4 XML ("SOAP - Consultation"). Not expanded in the DevKit; in medical records it usually means Subjective, Objective, Assessment, Plan |
| HEENT, CVS, GU (IE) | Head, eyes, ears, nose and throat; cardiovascular system; genitourinary (internal examination) |
| LMP | Last menstrual period |
| NCD | Non-communicable disease |
| CBC, FBS, ECG, OGTT | Complete blood count, fasting blood sugar, electrocardiogram, oral glucose tolerance test |
| NOMED | The library code for "no medicine given" |

More terms: [Glossary](/getting-started/glossary).
:::

## At a glance

| Item | Value |
|---|---|
| Root element | `EPCB` |
| DTD | [`CF4.dtd`](/originals/cf4/CF4.dtd) (EPCB 1.20). No `PUBLIC` identifier. |
| Encoding | The DTD file declares `UTF-8`. The DevKit doesn't say which encoding the CF4 file must use. Recommendation (not from PhilHealth): UTF-8, declared in the XML declaration, as in our sample ([KI-60](/known-issues#ki-60)) |
| Attributes | 449, **all `#REQUIRED`** (none are `#IMPLIED`); every element is `EMPTY` except the containers |
| Dates | `YYYY-MM-DD` (dictionary FORMAT column), unlike eClaims XML (`MM-DD-YYYY`) |
| Sent as | An encrypted attachment: `DOCUMENT pDocumentType="CF4"` in the eClaims XML ([Building CF4](/guides/cf4#encrypt-and-attach)) |
| Official sample | None in the DevKit ([KI-55](/known-issues#ki-55)). See our [DTD-valid example](#example). |
| PhilHealth validator | None. PECWS has no CF4 validation method, so validate locally ([Validating XML locally](/guides/validating-xml)). |

## Element tree

`?` = optional, `*` = zero or more, `+` = one or more, no mark = exactly one. The order is fixed.

```text
EPCB
├── ENLISTMENTS
│   └── ENLISTMENT+                  patient identity, claim link
├── PROFILING
│   └── PROFILE+
│       ├── OINFO                    (not used by CF4)
│       ├── MEDHIST+                 (not used by CF4)
│       ├── MHSPECIFIC+              past medical history
│       ├── SURGHIST+                (not used by CF4)
│       ├── FAMHIST+                 (not used by CF4)
│       ├── FHSPECIFIC+              (not used by CF4)
│       ├── SOCHIST                  (not used by CF4)
│       ├── IMMUNIZATION+            (not used by CF4)
│       ├── MENSHIST                 menstrual history, LMP, "applicable" flag
│       ├── PREGHIST                 OB score
│       ├── PEPERT                   vital signs, height, weight
│       ├── BLOODTYPE                (not used by CF4)
│       ├── PEGENSURVEY              general survey
│       ├── PEMISC+                  PE finding IDs per system
│       ├── PESPECIFIC+              PE "Others" remarks per system
│       ├── DIAGNOSTIC+              fixed default
│       ├── MANAGEMENT+              fixed default
│       ├── ADVICE                   fixed default
│       └── NCDQANS                  (not used by CF4)
├── SOAPS
│   └── SOAP+
│       ├── SUBJECTIVE+              chief complaint, HPI, signs and symptoms
│       ├── PEPERT                   vital signs, height, weight
│       ├── PEMISC+
│       ├── PESPECIFIC+
│       ├── ICDS+                    fixed default
│       ├── DIAGNOSTIC+              fixed default
│       ├── MANAGEMENT+              fixed default
│       └── ADVICE                   fixed default
├── COURSEWARDS
│   └── COURSEWARD+                  course in the ward
├── LABRESULTS
│   └── LABRESULT+                   (not used by CF4; all tests "not applicable")
│       ├── CBC+
│       ├── URINALYSIS+
│       ├── CHESTXRAY+
│       ├── SPUTUM+
│       ├── LIPIDPROF+
│       ├── FBS+
│       ├── ECG+
│       ├── FECALYSIS+
│       ├── PAPSSMEAR+
│       └── OGTT+
└── MEDICINES
    └── MEDICINE+                    drugs and medicines (or the NOMED record)
```

`PEPERT`, `PEMISC`, `PESPECIFIC`, `DIAGNOSTIC`, `MANAGEMENT` and `ADVICE` are declared once and used in both `PROFILE` and `SOAP`. The dictionary describes each of them once. **Recommendation (not from PhilHealth):** send the same values in both places.

## How to read the tables

- **Req. (DTD / dict.)**: the DTD column is always "Yes", because every attribute is `#REQUIRED`: the attribute must be present, even if empty. The dictionary column is its REQUIRED flag: `Y`, `N`, or `—` for a blank row.
- **Type / size** comes from the dictionary (`VARCHAR2(21)` = up to 21 bytes). The DTD itself only says `CDATA` or lists an enumeration.
- **Valid values / format / default** merges DTD enumerations ("DTD: `U`, `V`, `F`") with the dictionary's FORMAT, DEFAULT, VALID VALUES and TABLE REFERENCE columns. Library names (`lib_…`) are explained in [CF4 libraries](/reference/libraries/cf4).
- **Description** quotes the dictionary, sometimes shortened. "Not part of the CF4, but requirement for XML Validation" is shortened to *(not part of CF4; needed for XML validation)*.
- **Blank row** means the dictionary lists only the attribute name. Recommendation (not from PhilHealth): send an empty string `""`. The DevKit gives no other guidance for these attributes ([KI-55](/known-issues#ki-55)).

Every `pReportStatus` is "Use "U" – Unvalidated as default value" with valid values `V` Validated, `U` Unvalidated, `F` Failed, and every `pDeficiencyRemarks` is a blank row (one exception under [BLOODTYPE](#bloodtype)). The tables list them anyway, so each table is complete.

## EPCB

The root element. Content: `(ENLISTMENTS, PROFILING, SOAPS, COURSEWARDS, LABRESULTS, MEDICINES)`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pUsername` | Yes / Y | VARCHAR2(30) | Your software certificate ID | "HCI User ID --to be provided by PhilHealth. Use the EClaims Software Certificate ID" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pPassword` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pHciAccreNo` | Yes / Y | VARCHAR2(9) | HCI accreditation number | "Accreditation Number of Health Care Institution (HCI)" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEnlistTotalCnt` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pProfileTotalCnt` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pSoapTotalCnt` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEmrId` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pCertificationId` | Yes / Y | VARCHAR2(21) | Your software certificate ID | "Software Certificate ID. Use the EClaims Software Certificate ID" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pHciTransmittalNumber` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |

The three `…TotalCnt` attributes are blank rows ([KI-55](/known-issues#ki-55)). An empty string passes the DTD. If PhilHealth ever rejects it, the natural value would be the number of `ENLISTMENT`, `PROFILE` and `SOAP` elements; confirm with PhilHealth. The DevKit doesn't say whether `pUsername` takes the `":"` prefix that the eClaims `pUserName` needs ([KI-55](/known-issues#ki-55), [KI-03](/known-issues#ki-03)); see [Building CF4](/guides/cf4#fixed-default-values).

## ENLISTMENTS and ENLISTMENT

`ENLISTMENTS` contains `ENLISTMENT+`. `ENLISTMENT` is `EMPTY` and carries the patient's identity and the link to the claim (dictionary section "ENLISTMENT - Registration").

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pEClaimId` | Yes / Y | VARCHAR2(21) | Recommendation (not from PhilHealth): same value as eClaims `CLAIM@pClaimNumber` | "Claim ID Number that will came from the Service Provider's system". Dictionary spells it `pEClaimID` ([KI-55](/known-issues#ki-55)). | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEClaimsTransmittalId` | Yes / N | VARCHAR(21) | Recommendation (not from PhilHealth): same value as eClaims `eTRANSMITTAL@pHospitalTransmittalNo` | "HCI Eclaims Transmittal ID Number that is generated by the Service Provider's System". Dictionary spells it `pEClaimsTransmittalID` ([KI-55](/known-issues#ki-55)). | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pHciCaseNo` | Yes / Y | VARCHAR2(21) | — | "Reference Number per CF4 Record" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pHciTransNo` | Yes / Y | VARCHAR2(21) | Same value as `pHciCaseNo` | "Reference Number per CF4 Record (Same value with pHciCaseNo)" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEffYear` | Yes / Y | VARCHAR2(4) | FORMAT column says `YYYY-MM-DD` ([KI-38](/known-issues#ki-38)); send `YYYY` | "Use the current year" *(not part of CF4; needed for XML validation)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEnlistStat` | Yes / Y | VARCHAR2(1) | Default `1` | "Use "1"- Active as default value" *(not part of CF4; needed for XML validation)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pEnlistDate` | Yes / Y | DATE | `YYYY-MM-DD` | "Date of Admission" | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pPackageType` | Yes / Y | VARCHAR2(1) | DTD: `P`, `E`, `A`. Default `A` (the DTD history calls `A` "CF4"; [KI-55](/known-issues#ki-55)) | "Use "A"- All Case Rate as default value" *(not part of CF4; needed for XML validation)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemPin` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemFname` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemMname` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemLname` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemExtname` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemDob` | Yes / — | — | `""` | *(blank row)* | [p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |
| `pMemCat` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pMemNcat` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientPin` | Yes / Y | VARCHAR2(12) | 12-digit PIN | "Refer to Member's Pin if patient type is MM; Refer to Dependent's Pin if type is DD. If Dependent's Pin Is not available then use Member's Pin" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientFname` | Yes / Y | VARCHAR2(30) | — | "First Name of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientMname` | Yes / N | VARCHAR2(30) | — | "Middle Name of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientLname` | Yes / Y | VARCHAR2(30) | — | "Last Name of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientExtname` | Yes / N | VARCHAR2(30) | — | "Extension Name of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientType` | Yes / Y | VARCHAR2(2) | `MM` Member, `DD` Dependent, `NM` Non Member | "Patient Type" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientSex` | Yes / Y | VARCHAR2(1) | DTD: `M`, `F` (`F` Female, `M` Male) | "Sex of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientContactno` | Yes / Y | VARCHAR2(15) | Default `NA` | "Use "NA"- Not Available as default value" *(not part of CF4; needed for XML validation)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientDob` | Yes / Y | DATE | `YYYY-MM-DD` | "Date of Birth of Patient" | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientAddbrgy` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientAddmun` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientAddprov` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientAddreg` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pPatientAddzipcode` | Yes / — | — | `""` | *(blank row)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pCivilStatus` | Yes / Y | VARCHAR2(1) | DTD: `S`, `M`, `W`, `X`, `A`, `U`. Default `U` | "Use "U"- Unspecified as default value" *(not part of CF4; needed for XML validation)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pWithConsent` | Yes / Y | VARCHAR2(1) | DTD: `Y`, `N`, `X`. Default `X` | "Use "X" – Not Applicable as default value" *(not part of CF4; needed for XML validation)* | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pWithLoa` | Yes / Y | VARCHAR2(1) | DTD: `Y`, `N`, `X`. Default `X` | Same wording as `pWithConsent` | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pWithDisability` | Yes / Y | VARCHAR2(1) | DTD: `Y`, `N`, `X`. Default `X` | Same wording as `pWithConsent` | [p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pDependentType` | Yes / Y | VARCHAR2(1) | DTD: `S`, `C`, `P`, `X` (`S` Spouse, `C` Child, `P` Parent; the dictionary labels `X` "Dependent Type" [sic]). Default `X` | "Use "X" – Not Applicable as default value" *(not part of CF4; needed for XML validation)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pTransDate` | Yes / Y | DATE | `YYYY-MM-DD` | "Date when the record inserted" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pCreatedBy` | Yes / Y | VARCHAR2(30) | — | "User who created the record" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated as default value" *(not part of CF4; needed for XML validation)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pAvailFreeService` | Yes / Y | VARCHAR2(1) | DTD: `Y`, `N`, `X`. `X` per the description (the DEFAULT column is empty; [KI-55](/known-issues#ki-55)) | "Use "X" – Not Applicable as default value" *(not part of CF4; needed for XML validation)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |

## PROFILING and PROFILE

`PROFILING` contains `PROFILE+`. Dictionary section: "PROFILING - Health Screening & Assessment". `PROFILE` content, in order: `(OINFO, MEDHIST+, MHSPECIFIC+, SURGHIST+, FAMHIST+, FHSPECIFIC+, SOCHIST, IMMUNIZATION+, MENSHIST, PREGHIST, PEPERT, BLOODTYPE, PEGENSURVEY, PEMISC+, PESPECIFIC+, DIAGNOSTIC+, MANAGEMENT+, ADVICE, NCDQANS)`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciTransNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciTransNo` | "Reference Number per CF4 Record (Must be the same value with the pHciTransNo in Enlistment)" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pHciCaseNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciCaseNo` | "Reference Number per CF4 Record (Must be the same value with the pHciCaseNo in Enlistment)" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pPatientPin` | Yes / Y | VARCHAR2(12) | Same rule as `ENLISTMENT@pPatientPin` | "PhilHealth Identification Number of Patient. Refer to Member's Pin if patient type is MM; …" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pPatientType` | Yes / — | — | `""` | *(blank row here; required on `SOAP`)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pMemPin` | Yes / — | — | `""` | *(blank row)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pProfDate` | Yes / Y | DATE | `YYYY-MM-DD` | "Date of Admission" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pEffYear` | Yes / Y | VARCHAR2(4) | No format or default in the dictionary ([KI-55](/known-issues#ki-55)). Recommendation (not from PhilHealth): `YYYY`, same as `ENLISTMENT@pEffYear` | "Effectivity Year" | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pProfileATC` | Yes / Y | VARCHAR2(10) | Default `CF4` | "Use "CF4" as default value" *(not part of CF4; needed for XML validation)* | [p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |

### OINFO

"Other Information". Not used by CF4: every attribute except `pReportStatus` is a blank row ([p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4)).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pPatientPob`, `pPatientAge`, `pPatientOccupation`, `pPatientEducation`, `pPatientReligion`, `pPatientMotherMnln`, `pPatientMotherMnmi`, `pPatientMotherFn`, `pPatientMotherExtn`, `pPatientMotherBday`, `pPatientFatherLn`, `pPatientFatherMi`, `pPatientFatherFn`, `pPatientFatherExtn`, `pPatientFatherBday` (15) | Yes / — | — | `""` | *(blank rows)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |

`pPatientAge` is a blank row even though SSVTF Annex A lists "Age" as required CF4 data. The age is implied by `ENLISTMENT@pPatientDob`. SSVTF Annex A's "Name of HCI" and "Address of HCI" have no attribute at all ([KI-55](/known-issues#ki-55)).

### MEDHIST

"Patient Medical History". Not used by CF4 ([p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4)).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pMdiseaseCode` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |

### MHSPECIFIC

"Patient Specific Disease Description in Medical History". Holds CF4 III.2.a, Pertinent Past Medical History.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pMdiseaseCode` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pSpecificDesc` | Yes / Y | VARCHAR2(2000) | "none", "NA", "not applicable" or "N/A" value is not acceptable | "Pertinent Past Medical History" | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |

The DevKit doesn't say what to write in `pSpecificDesc` when a patient truly has no past medical history, since "none" and "N/A" are rejected. Confirm with PhilHealth ([KI-55](/known-issues#ki-55)).

### SURGHIST

"Patient Surgical History". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pSurgDesc` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pSurgDate` | Yes / — | — | `""` | *(blank row)* | [p. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=4) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |

### FAMHIST

"Family Medical History". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pMdiseaseCode` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |

### FHSPECIFIC

"Specific Disease Description in Patient Family Medical History". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pMdiseaseCode` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pSpecificDesc` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |

### SOCHIST

"Patient Social/Personal History". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pIsSmoker`, `pNoCigpk`, `pIsAdrinker`, `pNoBottles`, `pIllDrugUser` | Yes / — | — | `""` | *(blank rows)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |

### IMMUNIZATION

"Patient Immunization Record". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pChildImmcode`, `pYoungwImmcode`, `pPregwImmcode`, `pElderlyImmcode`, `pOtherImm` | Yes / — | — | `""` | *(blank rows)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |

### MENSHIST

"Patient Menstrual History (For Female Patient Only)". Holds the LMP and the flag that switches the OB/GYN fields on or off.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pMenarchePeriod` | Yes / — | — | `""` | *(blank row)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pLastMensPeriod` | Yes / N | DATE | `YYYY-MM-DD` | "Date of Last Menstrual Period (LMP). Required only if value of pIsApplicable in MENSHIST is == "Y"." | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pPeriodDuration`, `pMensInterval` | Yes / — | — | `""` | *(blank rows)* | [p. 5](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5) |
| `pPadsPerDay`, `pOnsetSexIc`, `pBirthCtrlMethod`, `pIsMenopause`, `pMenopauseAge` | Yes / — | — | `""` | *(blank rows)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pIsApplicable` | Yes / Y | VARCHAR2(1) | DTD: `Y`, `N` | "If Patient Menstrual History Applicable" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "For CF4: Use "U" – Unvalidated" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |

### PREGHIST

"Patient Pregnancy History (For Female Patient Only)". Holds the OB score. Each count is "Required only if value of pIsApplicable in MENSHIST is == "Y"" ([p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6)).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pPregCnt` | Yes / N | NUMBER | 0–99 | "Number of Pregnancy to Date – Gravidity" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pDeliveryCnt` | Yes / N | NUMBER | 0–99 | "Number of Delivery to Date – Parity" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pDeliveryTyp` | Yes / — | — | `""` | *(blank row)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pFullTermCnt` | Yes / N | NUMBER | 0–99 | "Number of Full Term Pregnancy" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pPrematureCnt` | Yes / N | NUMBER | 0–99 | "Number of Premature Pregnancy" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pAbortionCnt` | Yes / N | NUMBER | 0–99 | "Number of Abortion" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pLivChildrenCnt` | Yes / N | NUMBER | 0–99 | "Number of Living Children" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pWPregIndhyp`, `pWFamPlan` | Yes / — | — | `""` | *(blank rows)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "For CF4: Use "U" – Unvalidated" | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |

When `MENSHIST@pIsApplicable="N"`, the DevKit doesn't say what the counts should hold ([KI-55](/known-issues#ki-55)). The attributes must still be present; our sample sends `""`.

### PEPERT

"Physical Examination Findings for BP Measurements, Heart and Respiratory Rate, Body Measurements and Vision". Used in `PROFILE` and `SOAP`. In the dictionary, the `pSystolic`, `pDiastolic`, `pHeight` and `pWeight` rows are printed in italics. The files update note lists the BP and height/weight changes as rev. 4 changes, so the italics appear to mark them (our reading). The `1`/`2` BP values are also in italics, although the update note doesn't mention them.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pSystolic` | Yes / Y | NUMBER | mmHg; `1` if BP not available or not required; `2` if palpatory | "Systolic Blood Pressure of Patient – mmHG. Definite value required for Patient from age three years old and above. Use "1" as value for systolic and diastolic for patients which BP are not available or not required and "2" for Palpatory Patients" | [p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDiastolic` | Yes / Y | NUMBER | Same as `pSystolic` | "Diastolic Blood Pressure of Patient – mmHG", same rules | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pHr` | Yes / Y | NUMBER | Maximum characters: 3. "With decimal value is not acceptable." | "Heart Rate of Patient per Minute" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pRr` | Yes / Y | NUMBER | Maximum characters: 3. Decimals not acceptable. | "Respiratory Rate of Patient per Minute" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pTemp` | Yes / Y | NUMBER | Maximum characters: 4 | "Temperature in Celsius" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pHeight` | Yes / Y | NUMBER | Maximum characters: 6 | "Height in Centimeters (cm)" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pWeight` | Yes / Y | NUMBER | Maximum characters: 6 | "Weight in Kilograms (kg)" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pVision`, `pLength`, `pHeadCirc` | Yes / — | — | `""` | *(blank rows)* | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |

The `1`/`1` and `2`/`2` rule is already in this 2021 dictionary. SSVTF 2025 didn't add it; it turned it into a certification check: "'1' … (1/1) for patients where BP is not available or required, and '2' for palpatory (2/2)" ([SSVTF p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8); [KI-08](/known-issues#ki-08)). The files update note adds that `pSystolic` and `pDiastolic` need a "definite value … for Patient from age three years old and above" and that `pHeight` and `pWeight` were "added … as parameters with required value" ([update p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1)). Neither document says on which date to compute the patient's age for the three-year rule ([KI-55](/known-issues#ki-55)); [Building CF4](/guides/cf4#vital-signs-and-blood-pressure) uses the admission date (our recommendation).

### BLOODTYPE

"Patient Blood type Details". Not used by CF4.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pBloodType` | Yes / — | — | `""` | *(blank row)* | [p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pBloodRh` | Yes / — | — | `""` | *(blank row)* | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Report Status of Generated XML Report. For CF4: Use "U" – Unvalidated" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pDeficiencyRemarks` | Yes / Y | VARCHAR2(2000) | — | "Remarks of the Status Report" (the only `pDeficiencyRemarks` row with a type and description; the row isn't highlighted as CF4 data) | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |

### PEGENSURVEY

"Physical Examination General Survey" (CF4 III.5 General Survey).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pGenSurveyId` | Yes / Y | VARCHAR2(1) | `1` Awake and Alert; `2` Altered Sensorium (DTD: `CDATA`, so not enforced) | "General Survey" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pGenSurveyRem` | Yes / N | VARCHAR2(2000) | — | "Remarks for pGenSurveyId, if pGenSurveyId ==2" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Report Status of Generated XML Report. For CF4: Use "U"" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |

### PEMISC

"Physical Examination Findings for Skin, Heent, Chest, Heart, Abdomen, Neuro, Rectal and Genitourinary". One ID per system, from the library in the TABLE REFERENCE column. Used in `PROFILE` and `SOAP`. For every system, "If Selected … Description ID value is == "Essentially Normal", other choices must be disabled."

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pSkinId` | Yes / Y | VARCHAR2(3) | ID from `lib_skin` | "Skin/Extremities Description ID" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pHeentId` | Yes / Y | VARCHAR2(3) | ID from `lib_heent` | "HEENT Description ID" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pChestId` | Yes / Y | VARCHAR2(3) | ID from `lib_chest` | "Chest/Lungs Description ID" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pHeartId` | Yes / Y | VARCHAR2(3) | ID from `lib_heart` | "Heart/CVS Description ID" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pAbdomenId` | Yes / Y | VARCHAR2(3) | ID from `lib_abdomen` | "Abdomen Description ID" | [p. 7](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7) |
| `pNeuroId` | Yes / Y | VARCHAR2(3) | ID from `lib_neuro` | "Neuro-Exam Description ID" | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| `pGuId` | Yes / Y | VARCHAR2(3) | ID from `lib_genitourinary` | "GU (IE) Description ID" | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| `pRectalId` | Yes / — | — | `""` | *(blank row; no rectal library, no rectal section on the form)* | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 8](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |

The DTD allows `PEMISC+`, but the DevKit doesn't explain how to send several findings for one system, or what goes in the other ID attributes of each extra `PEMISC` ([KI-55](/known-issues#ki-55)). See [Building CF4](/guides/cf4#physical-examination-findings).

### PESPECIFIC

"Remarks in Patient Physical Examination Findings for Skin, Heent, Chest, Heart, Abdomen, Neuro, Rectal and Genitourinary". Free-text "Others" findings. Used in `PROFILE` and `SOAP`. Every remark: "none", "NA", "not applicable" or "N/A" value is not acceptable.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pSkinRem` | Yes / N | VARCHAR2(2000) | Required if `pSkinId` is "Others" (`99`) | "Other Finding/s in Skin/Extremities, Required if Skin/Extremities Description ID Value == "Others"" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pHeentRem` | Yes / N | VARCHAR2(2000) | Required if `pHeentId` is "Others" | "Other Finding/s in HEENT, Required if HEENT Description ID Value == "Others"" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pChestRem` | Yes / N | VARCHAR2(2000) | Required if `pChestId` is "Others" | "Other Finding/s in Chest/Lungs, …" | [p. 11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=11) |
| `pHeartRem` | Yes / N | VARCHAR2(2000) | Required if `pHeartId` is "Others" | "Other Finding/s in Heart/CVS, …" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pAbdomenRem` | Yes / N | VARCHAR2(2000) | Required if `pAbdomenId` is "Others" | "Other Finding/s in Abdomen, …" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pNeuroRem` | Yes / N | VARCHAR2(2000) | Required if `pNeuroId` is "Others" | "Other Finding/s in Neuro-Exam, …" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pRectalRem` | Yes / — | — | `""` | *(blank row)* | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pGuRem` | Yes / N | VARCHAR2(2000) | Required if `pGuId` is "Others" | "Other Finding/s in GU(IE), Required if GU (IE) Description ID Value == "Others"" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |

### DIAGNOSTIC

"Prescribed Laboratory to the Patient". Fixed default. Used in `PROFILE` and `SOAP`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pDiagnosticId` | Yes / Y | VARCHAR2 (no size) | Default `0`. Table reference `lib_diagnostic` (not in the DevKit; [KI-55](/known-issues#ki-55)) | "Use "0" – Not applicable from the library as default value" *(not part of CF4; needed for XML validation)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pOthRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Report Status of Generated XML Report. For CF4: Use "U"" | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |

### MANAGEMENT

"Patient Plan/Management Record". Fixed default. Used in `PROFILE` and `SOAP`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pManagementId` | Yes / Y | VARCHAR2 (no size) | Default `0`. Table reference `lib_management` (not in the DevKit; [KI-55](/known-issues#ki-55)) | "Use "0" – Not applicable as default value" *(not part of CF4; needed for XML validation)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pOthRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |

### ADVICE

"Doctor's Advice to Patient". Fixed default. Used in `PROFILE` and `SOAP`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pRemarks` | Yes / Y | VARCHAR2(2000) | Default `NA` | "Use "NA" – Not applicable as default value" *(not part of CF4; needed for XML validation)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | Default `U`. **DTD: `CDATA`**, the only `pReportStatus` that isn't `(U\|V\|F)` | "Use "U" – Unvalidated" | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |

### NCDQANS

"Patient Answer to NCD Questionnaires (For Patient Aged 25 Years Old)". Not used by CF4: every question attribute is a blank row ([p. 8–9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8)).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pQid1_Yn`, `pQid2_Yn`, `pQid3_Yn`, `pQid4_Yn`, `pQid5_Ynx`, `pQid6_Yn`, `pQid7_Yn`, `pQid8_Yn`, `pQid9_Yn`, `pQid10_Yn`, `pQid11_Yn`, `pQid12_Yn`, `pQid13_Yn`, `pQid14_Yn`, `pQid15_Yn`, `pQid16_Yn`, `pQid17_Abcde`, `pQid18_Yn`, `pQid19_Yn`, `pQid19_Fbsmg`, `pQid19_Fbsmmol`, `pQid19_Fbsdate`, `pQid20_Yn`, `pQid20_Choleval`, `pQid20_Choledate`, `pQid21_Yn`, `pQid21_Ketonval`, `pQid21_Ketondate`, `pQid22_Yn`, `pQid22_Proteinval`, `pQid22_Proteindate`, `pQid23_Yn`, `pQid24_Yn` (33) | Yes / — | — | `""` | *(blank rows)* | [p. 8–9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=8) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |

## SOAPS and SOAP

`SOAPS` contains `SOAP+`. Dictionary section: "SOAP - Consultation". `SOAP` content, in order: `(SUBJECTIVE+, PEPERT, PEMISC+, PESPECIFIC+, ICDS+, DIAGNOSTIC+, MANAGEMENT+, ADVICE)`. For `PEPERT`, `PEMISC`, `PESPECIFIC`, `DIAGNOSTIC`, `MANAGEMENT` and `ADVICE`, see the sections under [PROFILE](#pepert).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciTransNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciTransNo` | "Reference Number per CF4 Record (Must be the same value with the pHciTransNo in Enlistment)" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pHciCaseNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciCaseNo` | "Reference Number per CF4 Record (Must be the same value with the pHciCaseNo in Enlistment)" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pPatientPin` | Yes / Y | VARCHAR2(12) | Same rule as `ENLISTMENT@pPatientPin` | "Philhealth Identification Number of Patient …" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pPatientType` | Yes / Y | VARCHAR2(2) | `MM` Member, `DD` Dependent, `NM` Non Member | "Patient Type" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pMemPin` | Yes / — | — | `""` | *(blank row)* | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pSoapDate` | Yes / Y | DATE | `YYYY-MM-DD` | "Date of Admission" | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pEffYear` | Yes / Y | VARCHAR2(4) | Current year as `YYYY` (this row has no FORMAT entry) | "Use the current year" *(not part of CF4; needed for XML validation)* | [p. 9](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=9) |
| `pSoapATC` | Yes / Y | VARCHAR2(10) | Default `CF4` | "Use "CF4" as default value" *(not part of CF4; needed for XML validation)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |

### SUBJECTIVE

"Record of Patient Chief Complaint and of Illness" (CF4 II.5, III.1 and III.3).

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pChiefComplaint` | Yes / Y | VARCHAR2(2000) | "none", "NA", "not applicable" or "N/A" value is not acceptable | "Patient Chief Complaint" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pIllnessHistory` | Yes / Y | VARCHAR2(2000) | "none", "NA", "not applicable" or "N/A" value is not acceptable | "History of Present Illness" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pOtherComplaint` | Yes / N | VARCHAR2(2000) | Required when `X` is in `pSignsSymptoms` | "Other Pertinent Signs and Symptoms on Admission, Required if Symptoms ID == "X" is included in the value of pSignsSymptoms" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pSignsSymptoms` | Yes / Y | VARCHAR2(2000) | IDs from `lib_chief_complaint`. "For multiple entries: use semi-colon ";" as delimiter". Our example: `3;18;26;37` | "Pertinent Signs and Symptoms on Admission ID" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pPainSite` | Yes / *(empty)* | VARCHAR2(500) | Required when `38` (PAIN) is in `pSignsSymptoms` | "Site of Pain, Required if Pain Element in Pertinent Signs and Symptoms on Admission is checked" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Report Status of Generated XML Report. For CF4: Use "U"" | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |

### ICDS

"ICD – List of ICD10 Codes For Patient Diagnosis". Fixed default: the diagnosis goes in the eClaims XML, not here. Our example sends `000`, although its dengue diagnosis `A90` is also in `lib_icd`.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pIcdCode` | Yes / Y | VARCHAR2(10) | Default: description says `000`, DEFAULT column says `0000`; `lib_icd` has `000` ("Essentially Well Individual"). **Use `000`** ([KI-55](/known-issues#ki-55)). | "Use "000" – Essentially well individual from the library as default value" *(not part of CF4; needed for XML validation)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10) |

## COURSEWARDS and COURSEWARD

`COURSEWARDS` contains `COURSEWARD+`. Dictionary: "COURSEWARDS – List of Actions/Order by Doctor" (CF4 IV, Course in the Ward). One element per dated entry.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciCaseNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciCaseNo` | "Reference Number per CF4 Record (Must be the same value with the pHciCaseNo in Enlistment)" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pHciTransNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciTransNo` | "Reference Number per CF4 Record (Must be the same value with the pHciTransNo in Enlistment)" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pDateAction` | Yes / Y | DATE | `YYYY-MM-DD` | "Date when Doctor took an action" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pDoctorsAction` | Yes / Y | VARCHAR2(2000) | — | "Action/Order by Doctor" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |

## LABRESULTS and LABRESULT

`LABRESULTS` contains `LABRESULT+`. `LABRESULT` content, in order: `(CBC+, URINALYSIS+, CHESTXRAY+, SPUTUM+, LIPIDPROF+, FBS+, ECG+, FECALYSIS+, PAPSSMEAR+, OGTT+)`. Lab results are not part of the CF4 XML (the paper form's Course in the Ward section says "Attach photocopy of laboratory/imaging results"), but the DTD requires one of each test. The dictionary leaves all lab values blank and sets each test to "not applicable" ([p. 14–20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14)).

`LABRESULT` attributes:

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciCaseNo`, `pPatientPin`, `pPatientType`, `pMemPin`, `pEffYear` | Yes / — | — | `""` | *(blank rows)* | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |

Attributes shared by all ten test elements:

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciTransNo`, `pReferralFacility`, `pLabDate` | Yes / — | — | `""` | *(blank rows)* | p. 14–20 |
| `pDateAdded`, `pModule`, `pDiagnosticLabFee`, `pCoPay` | Yes / — | — | `""` | *(blank rows)* | p. 15–20 |
| `pIsApplicable` | Yes / Y | VARCHAR2(1) | Default `N`. DTD: `Y`, `N` (`PAPSSMEAR` and `OGTT`: `Y`, `N`, `W` "Waived") | "Use "N"-No as default value" *(not part of CF4; needed for XML validation)*; for CHESTXRAY: "If Chest XRay Applicable. For CF4: Use "N"-No as default value" | p. 15–20 |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | p. 15–20 |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | p. 15–20 |

Test-specific attributes:

| Element (dictionary name) | Test-specific attributes | Dictionary guidance | Source |
|---|---|---|---|
| `CBC` (Complete Blood Count) | `pHematocrit`, `pHemoglobinG`, `pHemoglobinMmol`, `pMhcPg`, `pMhcFmol`, `pMchcGhb`, `pMchcMmol`, `pMcvUm`, `pMcvFl`, `pWbc1000`, `pWbc10`, `pMyelocyte`, `pNeutrophilsBnd`, `pNeutrophilsSeg`, `pLymphocytes`, `pMonocytes`, `pEosinophils`, `pBasophils`, `pPlatelet` | blank rows: `""` | [p. 14–15](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `URINALYSIS` | `pGravity`, `pAppearance`, `pColor`, `pGlucose`, `pProteins`, `pKetones`, `pPh`, `pRbCells`, `pWbCells`, `pBacteria`, `pCrystals`, `pBladderCell`, `pSquamousCell`, `pTubularCell`, `pBroadCasts`, `pEpithelialCast`, `pGranularCast`, `pHyalineCast`, `pRbcCast`, `pWaxyCast`, `pWcCast`, `pAlbumin`, `pPusCells` | blank rows: `""` | [p. 15–16](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=15) |
| `CHESTXRAY` (Chest X-Ray) | `pFindings`, `pRemarksFindings`, `pObservation`, `pRemarksObservation` | blank rows: `""` | [p. 16–17](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=16) |
| `SPUTUM` (Sputum Microscopy) | `pDataCollection`, `pFindings`, `pRemarks`, `pNoPlusses` | `pDataCollection`: VARCHAR(1), Y, default `X`; DTD `1`, `2`, `3`, `X` (1 First Collection, 2 Second Collection, 3 Third Collection, X Not Applicable). "Use "X" – Not Applicable as default value" *(not part of CF4; needed for XML validation)*. Others blank: `""` | [p. 17](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=17) |
| `LIPIDPROF` (Lipid Profile) | `pLdl`, `pHdl`, `pTotal`, `pCholesterol`, `pTriglycerides` | blank rows: `""` | [p. 17–18](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=17) |
| `FBS` (Fasting Blood Sugar) | `pGlucoseMg`, `pGlucoseMmol` | blank rows: `""` | [p. 18](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=18) |
| `ECG` (Electrocardiogram) | `pFindings`, `pRemarks` | blank rows: `""` | [p. 18–19](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=18) |
| `FECALYSIS` | `pColor`, `pConsistency`, `pRbc`, `pWbc`, `pOva`, `pParasite`, `pBlood`, `pOccultBlood`, `pPusCells` | blank rows: `""` | [p. 19](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=19) |
| `PAPSSMEAR` | `pFindings`, `pImpression` | blank rows: `""`; `pIsApplicable` may also be `W` | [p. 19–20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=19) |
| `OGTT` (Oral Glucose Tolerance Test) | `pExamFastingMg`, `pExamFastingMmol`, `pExamOgttOneHrMg`, `pExamOgttOneHrMmol`, `pExamOgttTwoHrMg`, `pExamOgttTwoHrMmol` | blank rows: `""`; `pIsApplicable` may also be `W` | [p. 20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=20) |

## MEDICINES and MEDICINE

`MEDICINES` contains `MEDICINE+` (the DTD comment above it reads "FOR APPROVAL XML FORMAT"). Dictionary: "MEDICINE - List of Prescribed Drugs to the Patient" (CF4 V). At least one `MEDICINE` is required; use the [NOMED record](/guides/cf4#no-medicine-nomed) when no drug was given.

| Attribute | Req. (DTD / dict.) | Type / size | Valid values / format / default | Description (dictionary) | Source |
|---|---|---|---|---|---|
| `pHciCaseNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciCaseNo` | "Reference Number per CF4 Record (Must be the same value with the pHciTransNo in Enlistment)" [sic] | [p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pHciTransNo` | Yes / Y | VARCHAR2(21) | Same as `ENLISTMENT@pHciTransNo` | "Reference Number per CF4 Record (Must be the same value with the pHciCaseNo in Enlistment)" [sic] | [p. 12–13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12) |
| `pDrugCode` | Yes / N | VARCHAR2(30) | Code from `lib_medicine`; NOMED: `NOMED0000000000000000000000000` | "Complete Drug Code. Use 'NOMED0000000000000000000000000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pGenericName` | Yes / N | VARCHAR2(500) | Free text | "Complete Drug Description, if Medicine not listed on the library (GenericName/Salt/Strength/Form/Unit/Package)" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pGenericCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_generic`; NOMED: `NOMED` | "Generic Code of Medicine. Use 'NOMED' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pSaltCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_salt`; NOMED: `00000` | "Salt Code of Medicine. Use '00000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pStrengthCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_strength`; NOMED: `00000` | "Strength / Dosage Code of Medicine. Use '00000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pFormCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_form`; NOMED: `00000` | "Form Code of Medicine. Use '00000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pUnitCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_unit`; NOMED: `00000` | "Unit Code of Medicine. Use '00000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pPackageCode` | Yes / N | VARCHAR2(5) | Code from `lib_medicine_package`; NOMED: `00000` | "Package Code of Medicine. Use '00000' if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pRoute` | Yes / Y | VARCHAR2(500) | Free text; NOMED: `-` | "Medicine Route. Use dash "-" if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pQuantity` | Yes / Y | NUMBER | NOMED: `0` | "Number of Medicines Prescribed. Use "0" if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pActualUnitPrice` | Yes / — | — | `""` | *(blank row)* | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pCoPayment` | Yes / — | — | `""` | *(blank row)* | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pTotalAmtPrice` | Yes / Y | NUMBER | NOMED: `0.00` | "Total Amount Price of Medicine Issued. Use "0.00" if no medicine record" | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pInstructionQuantity` | Yes / — | — | `""` | *(blank row)* | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pInstructionStrength` | Yes / — | — | `""` | *(blank row)* | [p. 13](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13) |
| `pInstructionFrequency` | Yes / Y | VARCHAR2(50) | Free text; NOMED: `-` | "Frequency of Medicine per Instruction. Use dash "-" if no medicine record" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pPrescPhysician` | Yes / — | — | `""` | *(blank row)* | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pIsApplicable` | Yes / Y | VARCHAR(1) | DTD: `Y`, `N` | "If Medicine Applicable" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pDateAdded` | Yes / Y | DATE | `YYYY-MM-DD` | "Date the record was added" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pModule` | Yes / Y | VARCHAR2(4) | `CF4` (in the STANDARD column). VALID VALUES lists "HAS" – Profiling; "SOAP" – Soap | "Use "CF4" – Unvalidated as default value" *(not part of CF4; needed for XML validation)* | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pReportStatus` | Yes / Y | VARCHAR2(1) | DTD: `U`, `V`, `F`. Default `U` | "Use "U" – Unvalidated" | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |
| `pDeficiencyRemarks` | Yes / — | — | `""` | *(blank row)* | [p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14) |

The NOMED values are in this 2021 dictionary and (except `pQuantity` and `pTotalAmtPrice`) in the 2021 files update note. SSVTF 2025 only made them a certification check ([KI-08](/known-issues#ki-08)). Neither document says which `pIsApplicable` or `pGenericName` to send with NOMED ([KI-55](/known-issues#ki-55)).

For a drug that is not in `lib_medicine`, the description goes in `pGenericName`, but the DevKit doesn't say what to send in `pDrugCode` and the six component codes (all marked `N`, not required) ([KI-55](/known-issues#ki-55)).

How the 30-character drug code is built from the five-character component codes is explained in [CF4 libraries](/reference/libraries/cf4#drug-code-composition).

## Where the DTD and the dictionary disagree

<Badge type="warning" text="Conflicting sources" />

The mismatches are in the Known-Issues register. [KI-38](/known-issues#ki-38) covers `pEffYear`. [KI-55](/known-issues#ki-55) covers the attribute names, `pIcdCode`, the missing libraries, the blank rows, and the smaller differences for `pModule`, `ADVICE@pReportStatus`, `pGenSurveyId`, `pPackageType` and `pAvailFreeService`. The remaining rows (`pCivilStatus`, the `MEDICINE` cross-references, the shared PE elements) are minor differences with an obvious answer.

| Topic | DTD | Data dictionary rev. 4 | What we recommend |
|---|---|---|---|
| Claim ID attribute names | `pEClaimId`, `pEClaimsTransmittalId` | `pEClaimID`, `pEClaimsTransmittalID` (p. 1) | DTD spelling. XML is case-sensitive ([KI-55](/known-issues#ki-55)). |
| Required-ness | Every attribute `#REQUIRED` | Many attributes `N` or blank | Always send the attribute; use `""` when there's nothing to say ([KI-55](/known-issues#ki-55)). |
| `pEffYear` | `CDATA` | VARCHAR2(4), FORMAT `YYYY-MM-DD` (p. 1) | Four-digit year ([KI-38](/known-issues#ki-38)). |
| `ICDS@pIcdCode` default | `CDATA` | Description `000`, DEFAULT column `0000` (p. 10) | `000`, which exists in `lib_icd` ([KI-55](/known-issues#ki-55)). |
| `PEGENSURVEY@pGenSurveyId` | `CDATA` (the history entry 0.1.9 says "(1\|2)") | `1` / `2` (p. 7) | Send `1` or `2`; your code must enforce it ([KI-55](/known-issues#ki-55)). |
| `pPackageType` meaning of `A` | History: "A - CF4" | "All Case Rate" (p. 1) | `A` either way ([KI-55](/known-issues#ki-55)). |
| `pCivilStatus` | `S`, `M`, `W`, `X`, `A`, `U` | Only the default `U` "Unspecified" (p. 2) | `U`. |
| `MEDICINE@pModule` | `CDATA` | `CF4` in the STANDARD column; VALID VALUES `HAS`, `SOAP`; description "Use "CF4" – Unvalidated as default value" (p. 14) | `CF4` ([KI-55](/known-issues#ki-55)). |
| `ADVICE@pReportStatus` | `CDATA` (all others `(U\|V\|F)`) | `U` / `V` / `F` (p. 10) | `U` ([KI-55](/known-issues#ki-55)). |
| `MEDICINE@pHciCaseNo` / `@pHciTransNo` | — | Descriptions cross-reference each other's Enlistment attribute (p. 12–13) | Copy each from the attribute of the same name. |
| `pAvailFreeService` default | `Y`, `N`, `X` | `X` in the description; DEFAULT column empty (p. 3) | `X` ([KI-55](/known-issues#ki-55)). |
| Libraries `lib_diagnostic`, `lib_management` | — | Named as TABLE REFERENCE (p. 10) | Not in the DevKit; you only need the default `0` ([KI-55](/known-issues#ki-55)). |
| Shared PE elements | Used in both `PROFILE` and `SOAP` | Described once | Send identical values in both. |

## Example

[`cf4-sample.xml`](/examples/cf4-sample.xml) is an unofficial, **DTD-valid** example. It is the site's shared example claim: member and patient JUAN OCAMPO DELA CRUZ (PIN `072007271094`), facility `H12345678`, claim number `202609170001`, transmittal `TR20260917001`, admitted `2026-09-15` and discharged `2026-09-17` for dengue fever without warning signs. It has three library medicines (0.9% sodium chloride, paracetamol and omeprazole), three course-in-the-ward entries, every default from this page, and the NOMED alternative in a comment. The diagnosis code `A90` is not in the file: it belongs in the eClaims XML ([`eclaims-minimal.xml`](/examples/eclaims-minimal.xml)), and `ICDS@pIcdCode` keeps the default `000`.

We validated the file (and the NOMED variant) against `CF4.dtd` with lxml 6.1.3 (libxml2 2.14.6). Unlike the eClaims DTD, `CF4.dtd` has no non-deterministic content models, so lxml checks it fully ([KI-43](/known-issues#ki-43) doesn't apply).

To check it yourself, download [`CF4.dtd`](/originals/cf4/CF4.dtd) and [`cf4-sample.xml`](/examples/cf4-sample.xml) (or your own file) into one folder, then run this there. The command uses the `uv` Python runner; with plain Python, run `pip install lxml` and the same code with `python -c`.

```bash
uv run --quiet --with lxml python -c "from lxml import etree; d=etree.DTD(open('CF4.dtd','rb')); t=etree.parse('cf4-sample.xml'); print(d.validate(t), d.error_log.filter_from_errors())"
# Prints "True" and an empty error log. An invalid file prints "False" and the DTD errors.
```

::: details Full example (cf4-sample.xml)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Unofficial CF4 (Claim Form 4) example - NOT an official PhilHealth sample.
  DTD-valid against cf4/CF4.dtd ("EPCB Document Type Definition Version 1.20"),
  checked with lxml.

  This is the site's shared example claim: member and patient JUAN OCAMPO DELA CRUZ
  (PIN 072007271094, born 1973-09-19), admitted 2026-09-15 and discharged
  2026-09-17 for dengue fever without warning signs. The diagnosis itself
  (ICD-10 A90) travels in the eClaims XML (CF2), not in CF4.
  - Dates use YYYY-MM-DD (CF4 data dictionary), not the MM-DD-YYYY used by eClaims XML.
  - pEClaimId and pEClaimsTransmittalId repeat CLAIM@pClaimNumber (202609170001) and
    eTRANSMITTAL@pHospitalTransmittalNo (TR20260917001) of the eClaims XML (our choice).
  - Values marked "default" in the comments are the fixed values the data dictionary
    requires "not part of the CF4, but requirement for XML Validation".
  - Attributes the data dictionary leaves blank are sent as empty strings ("").
    The DTD only requires that every attribute is present. Confirm with PhilHealth
    (KI-55).
  - The file is UTF-8. The DevKit does not name an encoding (KI-60).
  - pUsername and pCertificationId hold the plain software certificate ID, as the
    dictionary says. Whether the eClaims ":" prefix also applies here is not
    documented (KI-55).
  - PIN, accreditation number, certificate ID, claim IDs and amounts are fictitious.
  - pGenericName is filled with the library description for readability (our choice;
    the dictionary only requires it when the drug is not in lib_medicine).

  The "no medicine" alternative is shown in a comment inside MEDICINES.
-->
<EPCB pUsername="SAMPLE-CERT-ID"
      pPassword=""
      pHciAccreNo="H12345678"
      pEnlistTotalCnt=""
      pProfileTotalCnt=""
      pSoapTotalCnt=""
      pEmrId=""
      pCertificationId="SAMPLE-CERT-ID"
      pHciTransmittalNumber="">

  <!-- ===== ENLISTMENTS: patient identity and the claim link ===== -->
  <ENLISTMENTS>
    <ENLISTMENT pEClaimId="202609170001"
                pEClaimsTransmittalId="TR20260917001"
                pHciCaseNo="CF4-202609170001"
                pHciTransNo="CF4-202609170001"
                pEffYear="2026"
                pEnlistStat="1"
                pEnlistDate="2026-09-15"
                pPackageType="A"
                pMemPin="" pMemFname="" pMemMname="" pMemLname="" pMemExtname=""
                pMemDob="" pMemCat="" pMemNcat=""
                pPatientPin="072007271094"
                pPatientFname="JUAN"
                pPatientMname="OCAMPO"
                pPatientLname="DELA CRUZ"
                pPatientExtname=""
                pPatientType="MM"
                pPatientSex="M"
                pPatientContactno="NA"
                pPatientDob="1973-09-19"
                pPatientAddbrgy="" pPatientAddmun="" pPatientAddprov=""
                pPatientAddreg="" pPatientAddzipcode=""
                pCivilStatus="U"
                pWithConsent="X"
                pWithLoa="X"
                pWithDisability="X"
                pDependentType="X"
                pTransDate="2026-09-17"
                pCreatedBy="ENCODER01"
                pReportStatus="U"
                pDeficiencyRemarks=""
                pAvailFreeService="X"/>
  </ENLISTMENTS>

  <!-- ===== PROFILING: history and physical exam on admission ===== -->
  <PROFILING>
    <PROFILE pHciTransNo="CF4-202609170001" pHciCaseNo="CF4-202609170001"
             pPatientPin="072007271094" pPatientType="" pMemPin=""
             pProfDate="2026-09-15" pRemarks="" pEffYear="2026"
             pProfileATC="CF4" pReportStatus="U" pDeficiencyRemarks="">
      <OINFO pPatientPob="" pPatientAge="" pPatientOccupation="" pPatientEducation=""
             pPatientReligion="" pPatientMotherMnln="" pPatientMotherMnmi=""
             pPatientMotherFn="" pPatientMotherExtn="" pPatientMotherBday=""
             pPatientFatherLn="" pPatientFatherMi="" pPatientFatherFn=""
             pPatientFatherExtn="" pPatientFatherBday=""
             pReportStatus="U" pDeficiencyRemarks=""/>
      <MEDHIST pMdiseaseCode="" pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- CF4 III.2.a Pertinent Past Medical History -->
      <MHSPECIFIC pMdiseaseCode=""
                  pSpecificDesc="HYPERTENSION SINCE 2018, MAINTAINED ON AMLODIPINE 5 MG ONCE A DAY"
                  pReportStatus="U" pDeficiencyRemarks=""/>
      <SURGHIST pSurgDesc="" pSurgDate="" pReportStatus="U" pDeficiencyRemarks=""/>
      <FAMHIST pMdiseaseCode="" pReportStatus="U" pDeficiencyRemarks=""/>
      <FHSPECIFIC pMdiseaseCode="" pSpecificDesc="" pReportStatus="U" pDeficiencyRemarks=""/>
      <SOCHIST pIsSmoker="" pNoCigpk="" pIsAdrinker="" pNoBottles="" pIllDrugUser=""
               pReportStatus="U" pDeficiencyRemarks=""/>
      <IMMUNIZATION pChildImmcode="" pYoungwImmcode="" pPregwImmcode="" pElderlyImmcode=""
                    pOtherImm="" pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- CF4 III.2.b OB/GYN history: male patient, so not applicable -->
      <MENSHIST pMenarchePeriod="" pLastMensPeriod="" pPeriodDuration="" pMensInterval=""
                pPadsPerDay="" pOnsetSexIc="" pBirthCtrlMethod="" pIsMenopause=""
                pMenopauseAge="" pIsApplicable="N" pReportStatus="U" pDeficiencyRemarks=""/>
      <PREGHIST pPregCnt="" pDeliveryCnt="" pDeliveryTyp="" pFullTermCnt="" pPrematureCnt=""
                pAbortionCnt="" pLivChildrenCnt="" pWPregIndhyp="" pWFamPlan=""
                pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- CF4 III.5 vital signs (same values as SOAP/PEPERT). Patient is 52, so a real BP is required. -->
      <PEPERT pSystolic="120" pDiastolic="80" pHr="96" pRr="20" pTemp="38.9"
              pHeight="168" pWeight="70.5" pVision="" pLength="" pHeadCirc=""
              pReportStatus="U" pDeficiencyRemarks=""/>
      <BLOODTYPE pBloodType="" pBloodRh="" pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- CF4 III.5 General survey: 1 = Awake and alert -->
      <PEGENSURVEY pGenSurveyId="1" pGenSurveyRem="" pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- CF4 III.5 findings per system (IDs from lib_skin, lib_heent, lib_chest, lib_heart,
           lib_abdomen, lib_neuro, lib_genitourinary). Skin 9 = Rashes/Petechiae;
           every other system is "Essentially normal". -->
      <PEMISC pSkinId="9" pHeentId="11" pChestId="6" pHeartId="5" pAbdomenId="7"
              pNeuroId="6" pGuId="1" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/>
      <PESPECIFIC pSkinRem="" pHeentRem="" pChestRem="" pHeartRem="" pAbdomenRem=""
                  pNeuroRem="" pRectalRem="" pGuRem="" pReportStatus="U" pDeficiencyRemarks=""/>
      <DIAGNOSTIC pDiagnosticId="0" pOthRemarks="" pReportStatus="U" pDeficiencyRemarks=""/>
      <MANAGEMENT pManagementId="0" pOthRemarks="" pReportStatus="U" pDeficiencyRemarks=""/>
      <ADVICE pRemarks="NA" pReportStatus="U" pDeficiencyRemarks=""/>
      <NCDQANS pQid1_Yn="" pQid2_Yn="" pQid3_Yn="" pQid4_Yn="" pQid5_Ynx="" pQid6_Yn=""
               pQid7_Yn="" pQid8_Yn="" pQid9_Yn="" pQid10_Yn="" pQid11_Yn="" pQid12_Yn=""
               pQid13_Yn="" pQid14_Yn="" pQid15_Yn="" pQid16_Yn="" pQid17_Abcde=""
               pQid18_Yn="" pQid19_Yn="" pQid19_Fbsmg="" pQid19_Fbsmmol="" pQid19_Fbsdate=""
               pQid20_Yn="" pQid20_Choleval="" pQid20_Choledate="" pQid21_Yn=""
               pQid21_Ketonval="" pQid21_Ketondate="" pQid22_Yn="" pQid22_Proteinval=""
               pQid22_Proteindate="" pQid23_Yn="" pQid24_Yn=""
               pReportStatus="U" pDeficiencyRemarks=""/>
    </PROFILE>
  </PROFILING>

  <!-- ===== SOAPS: chief complaint, history of present illness, vital signs ===== -->
  <SOAPS>
    <SOAP pHciTransNo="CF4-202609170001" pHciCaseNo="CF4-202609170001"
          pPatientPin="072007271094" pPatientType="MM" pMemPin=""
          pSoapDate="2026-09-15" pEffYear="2026" pSoapATC="CF4"
          pReportStatus="U" pDeficiencyRemarks="">
      <!-- pSignsSymptoms: lib_chief_complaint IDs separated by ";"
           (3 ANOREXIA, 18 HEADACHE, 26 MYALGIA, 37 FEVER) -->
      <SUBJECTIVE pChiefComplaint="FEVER FOR 3 DAYS"
                  pIllnessHistory="3 DAYS PRIOR TO ADMISSION, PATIENT HAD HIGH-GRADE FEVER UP TO 39.5 C WITH HEADACHE, MUSCLE PAINS AND POOR APPETITE. NO BLEEDING, NO ABDOMINAL PAIN AND NO PERSISTENT VOMITING. DENGUE NS1 ANTIGEN POSITIVE AT THE OPD. ADMITTED FOR HYDRATION AND MONITORING."
                  pOtherComplaint=""
                  pSignsSymptoms="3;18;26;37"
                  pPainSite=""
                  pReportStatus="U" pDeficiencyRemarks=""/>
      <PEPERT pSystolic="120" pDiastolic="80" pHr="96" pRr="20" pTemp="38.9"
              pHeight="168" pWeight="70.5" pVision="" pLength="" pHeadCirc=""
              pReportStatus="U" pDeficiencyRemarks=""/>
      <PEMISC pSkinId="9" pHeentId="11" pChestId="6" pHeartId="5" pAbdomenId="7"
              pNeuroId="6" pGuId="1" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/>
      <PESPECIFIC pSkinRem="" pHeentRem="" pChestRem="" pHeartRem="" pAbdomenRem=""
                  pNeuroRem="" pRectalRem="" pGuRem="" pReportStatus="U" pDeficiencyRemarks=""/>
      <!-- default: "000" = Essentially Well Individual (lib_icd), as the data dictionary
           requires. The real diagnosis (A90) goes in the eClaims XML (CF2). -->
      <ICDS pIcdCode="000" pReportStatus="U" pDeficiencyRemarks=""/>
      <DIAGNOSTIC pDiagnosticId="0" pOthRemarks="" pReportStatus="U" pDeficiencyRemarks=""/>
      <MANAGEMENT pManagementId="0" pOthRemarks="" pReportStatus="U" pDeficiencyRemarks=""/>
      <ADVICE pRemarks="NA" pReportStatus="U" pDeficiencyRemarks=""/>
    </SOAP>
  </SOAPS>

  <!-- ===== COURSEWARDS: CF4 IV Course in the ward (one row per date/order) ===== -->
  <COURSEWARDS>
    <COURSEWARD pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
                pDateAction="2026-09-15"
                pDoctorsAction="ADMITTED TO WARD. CBC WITH PLATELET COUNT EVERY 12 HOURS. 0.9% SODIUM CHLORIDE 1 L IV AT 100 ML PER HOUR. PARACETAMOL 500 MG TABLET EVERY 4 HOURS AS NEEDED FOR FEVER. OMEPRAZOLE 40 MG CAPSULE TWICE A DAY. MONITOR FOR WARNING SIGNS."
                pReportStatus="U" pDeficiencyRemarks=""/>
    <COURSEWARD pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
                pDateAction="2026-09-16"
                pDoctorsAction="AFEBRILE SINCE MORNING. PLATELET COUNT STABLE. NO WARNING SIGNS. CONTINUE IV FLUIDS AND MONITORING."
                pReportStatus="U" pDeficiencyRemarks=""/>
    <COURSEWARD pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
                pDateAction="2026-09-17"
                pDoctorsAction="IMPROVED. TOLERATING ORAL FLUIDS. MAY GO HOME. FOLLOW-UP AT OPD AFTER 1 WEEK."
                pReportStatus="U" pDeficiencyRemarks=""/>
  </COURSEWARDS>

  <!-- ===== LABRESULTS: not part of CF4; every test is required by the DTD,
       so each one is sent as "not applicable" (pIsApplicable="N") ===== -->
  <LABRESULTS>
    <LABRESULT pHciCaseNo="" pPatientPin="" pPatientType="" pMemPin="" pEffYear="">
      <CBC pHciTransNo="" pReferralFacility="" pLabDate="" pHematocrit="" pHemoglobinG=""
           pHemoglobinMmol="" pMhcPg="" pMhcFmol="" pMchcGhb="" pMchcMmol="" pMcvUm=""
           pMcvFl="" pWbc1000="" pWbc10="" pMyelocyte="" pNeutrophilsBnd=""
           pNeutrophilsSeg="" pLymphocytes="" pMonocytes="" pEosinophils="" pBasophils=""
           pPlatelet="" pDateAdded="" pIsApplicable="N" pModule="" pDiagnosticLabFee=""
           pCoPay="" pReportStatus="U" pDeficiencyRemarks=""/>
      <URINALYSIS pHciTransNo="" pReferralFacility="" pLabDate="" pGravity="" pAppearance=""
                  pColor="" pGlucose="" pProteins="" pKetones="" pPh="" pRbCells=""
                  pWbCells="" pBacteria="" pCrystals="" pBladderCell="" pSquamousCell=""
                  pTubularCell="" pBroadCasts="" pEpithelialCast="" pGranularCast=""
                  pHyalineCast="" pRbcCast="" pWaxyCast="" pWcCast="" pAlbumin=""
                  pPusCells="" pDateAdded="" pIsApplicable="N" pModule=""
                  pDiagnosticLabFee="" pCoPay="" pReportStatus="U" pDeficiencyRemarks=""/>
      <CHESTXRAY pHciTransNo="" pReferralFacility="" pLabDate="" pFindings=""
                 pRemarksFindings="" pObservation="" pRemarksObservation="" pDateAdded=""
                 pIsApplicable="N" pModule="" pDiagnosticLabFee="" pCoPay=""
                 pReportStatus="U" pDeficiencyRemarks=""/>
      <SPUTUM pHciTransNo="" pReferralFacility="" pLabDate="" pDataCollection="X"
              pFindings="" pRemarks="" pNoPlusses="" pDateAdded="" pIsApplicable="N"
              pModule="" pDiagnosticLabFee="" pCoPay="" pReportStatus="U" pDeficiencyRemarks=""/>
      <LIPIDPROF pHciTransNo="" pReferralFacility="" pLabDate="" pLdl="" pHdl="" pTotal=""
                 pCholesterol="" pTriglycerides="" pDateAdded="" pIsApplicable="N"
                 pModule="" pDiagnosticLabFee="" pCoPay="" pReportStatus="U" pDeficiencyRemarks=""/>
      <FBS pHciTransNo="" pReferralFacility="" pLabDate="" pGlucoseMg="" pGlucoseMmol=""
           pDateAdded="" pIsApplicable="N" pModule="" pDiagnosticLabFee="" pCoPay=""
           pReportStatus="U" pDeficiencyRemarks=""/>
      <ECG pHciTransNo="" pReferralFacility="" pLabDate="" pFindings="" pRemarks=""
           pDateAdded="" pIsApplicable="N" pModule="" pDiagnosticLabFee="" pCoPay=""
           pReportStatus="U" pDeficiencyRemarks=""/>
      <FECALYSIS pHciTransNo="" pReferralFacility="" pLabDate="" pColor="" pConsistency=""
                 pRbc="" pWbc="" pOva="" pParasite="" pBlood="" pOccultBlood="" pPusCells=""
                 pDateAdded="" pIsApplicable="N" pModule="" pDiagnosticLabFee="" pCoPay=""
                 pReportStatus="U" pDeficiencyRemarks=""/>
      <PAPSSMEAR pHciTransNo="" pReferralFacility="" pLabDate="" pFindings="" pImpression=""
                 pDateAdded="" pIsApplicable="N" pModule="" pDiagnosticLabFee="" pCoPay=""
                 pReportStatus="U" pDeficiencyRemarks=""/>
      <OGTT pHciTransNo="" pReferralFacility="" pLabDate="" pExamFastingMg=""
            pExamFastingMmol="" pExamOgttOneHrMg="" pExamOgttOneHrMmol=""
            pExamOgttTwoHrMg="" pExamOgttTwoHrMmol="" pDateAdded="" pIsApplicable="N"
            pModule="" pDiagnosticLabFee="" pCoPay="" pReportStatus="U" pDeficiencyRemarks=""/>
    </LABRESULT>
  </LABRESULTS>

  <!-- ===== MEDICINES: CF4 V Drugs/Medicines ===== -->
  <MEDICINES>
    <!-- Drug code = Gen(09SOD) + Salt(00000) + Strength(00000) + Form(SOL32) + Unit(00247) + Package(BOTTL) -->
    <MEDICINE pHciCaseNo="CF4-202609170001"
              pHciTransNo="CF4-202609170001"
              pDrugCode="09SOD0000000000SOL3200247BOTTL"
              pGenericName="0.9% SODIUM CHLORIDE SOLUTION 1 L BOTTLE"
              pGenericCode="09SOD"
              pSaltCode="00000"
              pStrengthCode="00000"
              pFormCode="SOL32"
              pUnitCode="00247"
              pPackageCode="BOTTL"
              pRoute="IV"
              pQuantity="4"
              pActualUnitPrice=""
              pCoPayment=""
              pTotalAmtPrice="600.00"
              pInstructionQuantity=""
              pInstructionStrength=""
              pInstructionFrequency="100 ML PER HOUR"
              pPrescPhysician=""
              pIsApplicable="Y"
              pDateAdded="2026-09-15"
              pModule="CF4"
              pReportStatus="U"
              pDeficiencyRemarks=""/>
    <!-- Drug code = Gen(PARAC) + Salt(00000) + Strength(00047) + Form(TAB49) + Unit(00000) + Package(00000) -->
    <MEDICINE pHciCaseNo="CF4-202609170001"
              pHciTransNo="CF4-202609170001"
              pDrugCode="PARAC0000000047TAB490000000000"
              pGenericName="PARACETAMOL 500 mg TABLET"
              pGenericCode="PARAC"
              pSaltCode="00000"
              pStrengthCode="00047"
              pFormCode="TAB49"
              pUnitCode="00000"
              pPackageCode="00000"
              pRoute="ORAL"
              pQuantity="20"
              pActualUnitPrice=""
              pCoPayment=""
              pTotalAmtPrice="200.00"
              pInstructionQuantity=""
              pInstructionStrength=""
              pInstructionFrequency="EVERY 4 HOURS AS NEEDED FOR FEVER"
              pPrescPhysician=""
              pIsApplicable="Y"
              pDateAdded="2026-09-15"
              pModule="CF4"
              pReportStatus="U"
              pDeficiencyRemarks=""/>
    <!-- Drug code = Gen(ESOM1) + Salt(00000) + Strength(00036) + Form(CAPSU) + Unit(00000) + Package(00000) -->
    <MEDICINE pHciCaseNo="CF4-202609170001"
              pHciTransNo="CF4-202609170001"
              pDrugCode="ESOM10000000036CAPSU0000000000"
              pGenericName="OMEPRAZOLE 40 mg CAPSULE"
              pGenericCode="ESOM1"
              pSaltCode="00000"
              pStrengthCode="00036"
              pFormCode="CAPSU"
              pUnitCode="00000"
              pPackageCode="00000"
              pRoute="ORAL"
              pQuantity="6"
              pActualUnitPrice=""
              pCoPayment=""
              pTotalAmtPrice="300.00"
              pInstructionQuantity=""
              pInstructionStrength=""
              pInstructionFrequency="TWICE A DAY"
              pPrescPhysician=""
              pIsApplicable="Y"
              pDateAdded="2026-09-15"
              pModule="CF4"
              pReportStatus="U"
              pDeficiencyRemarks=""/>
    <!--
      No-medicine alternative: if no drug was given during this confinement, send exactly
      one MEDICINE like this instead (values from CF4_FILES_UPDATE(02232021) and the data
      dictionary rev. 4, p. 13-14). pIsApplicable="N" and pGenericName are our assumptions
      (KI-55).

    <MEDICINE pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
              pDrugCode="NOMED0000000000000000000000000"
              pGenericName="DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE"
              pGenericCode="NOMED" pSaltCode="00000" pStrengthCode="00000" pFormCode="00000"
              pUnitCode="00000" pPackageCode="00000" pRoute="-" pQuantity="0"
              pActualUnitPrice="" pCoPayment="" pTotalAmtPrice="0.00"
              pInstructionQuantity="" pInstructionStrength="" pInstructionFrequency="-"
              pPrescPhysician="" pIsApplicable="N" pDateAdded="2026-09-15" pModule="CF4"
              pReportStatus="U" pDeficiencyRemarks=""/>
    -->
  </MEDICINES>
</EPCB>
```
:::

## DTD version history

The DTD's header comment records its history ([`CF4.dtd`](/originals/cf4/CF4.dtd)). "Version 1.20" in the title matches the last entry, 0.1.20. Dates are month-day-year.

| Version | Date | Changes (summarized from the DTD comment) |
|---|---|---|
| 0.1.0 | 01-15-2018 | Initial draft |
| 0.1.1 | 01-16-2018 | "Camelized" attribute names |
| 0.1.2 | 04-24-2018 | Added laboratory results; medicine in the consultation (SOAP) module |
| 0.1.3 | 06-28-2018 | Plan/management in profiling; certification ID; `pWithDisability`, `pDependentType`; "pProfileOTP" in PROFILE (the current DTD has `pProfileATC`); ADVICE, DIAGNOSTIC, MANAGEMENT, PEPERT, PESPECIFIC in profiling; MEDICINE element created; ECG, FECALYSIS, PAPSSMEAR, OGTT added; rectal and GU findings replace extremities in PEMISC/PESPECIFIC; `pDiagnosticLabFee`, `pReportStatus`, `pDeficiencyRemarks` added |
| 0.1.4 | 07-09-2018 | `pEnlistType` renamed `pPackageType` |
| 0.1.5 | 07-10-2018 | `pAvailFreeService`; values for `pReportStatus` |
| 0.1.6 | 07-11-2018 | Co-payment in lab results and medicine; unit price renamed `pActualUnitPrice` |
| 0.1.7 | 08-30-2018 | Medicine attributes updated ("library from DOH"); "Update attributes based on CF4" |
| 0.1.8 | 09-10-2018 | General survey; course in the ward (date, doctor's action) |
| 0.1.9 | 09-19-2018 | `pGenSurveyId` values (1 Awake and Alert; 2 Altered Sensorium); `pPackageType` values (P - PCB1; X - EPCB; A - CF4) |
| 0.1.10 | 09-27-2018 | Unit and salt code removed from MEDICINE; `pPrescPhysician`, `pIsApplicable` added; LABRESULT modified; `pEClaimId` and `pEClaimsTransmittalId` added "for CF4" |
| 0.1.11 | 09-28-2018 | `pWaist` removed; `pIsApplicable` in LABRESULT |
| 0.1.12 | 10-03-2018 | `pDataCollection` in SPUTUM; `pFindings` removed from FECALYSIS |
| 0.1.13 | 10-5-2018 | `pTransDate`, `pCreatedBy` |
| 0.1.14 | 10-09-2018 | `pGenericName` in MEDICINE |
| 0.1.15 | 12-20-2018 | `pPackageType` values changed from `(P\|X\|A)` to `(P\|E\|A)`, "E - for EPCB" |
| 0.1.16 | 01-29-2019 | "updated elements and attributes per requirements"; "modified element operators" |
| 0.1.17 | 01-31-2019 | `X` = NOT APPLICABLE in SPUTUM and ENLISTMENT |
| 0.1.18 | 02-12-2019 | `pSignsSymptoms` in SUBJECTIVE "for CF4 purposes" |
| 0.1.19 | 02-19-2019 | `W` = waived in PAPSSMEAR and OGTT |
| 0.1.20 | 02-26-2019 | `pSaltCode`, `pUnitCode`, `pRoute` in MEDICINE ("EPCB and CF4 purposes"); `pIsApplicable` in MENSHIST; `pPainSite` in SUBJECTIVE |

Within the DevKit, the only later CF4 rules come from the data dictionary rev. 4 and the files update note, both dated 2021-02-23: BP required from age 3, the `1`/`1` and `2`/`2` BP values (dictionary only), required `pHeight`/`pWeight`, and the NOMED values. SSVTF rev. 20250217 adds no new values; it turns the `1/1`, `2/2` rule and the no-medicine code into certification checks. See [KI-08](/known-issues#ki-08).

## Raw DTD

::: details Raw DTD (CF4.dtd)
```xml
<?xml version='1.0' encoding='UTF-8'?>
<!--
	Philippine Health Insurance Corporation
	EPCB Document Type Definition Version 1.20
	Version History
        0.1.0 01-15-2018
            : Initial draft
			
        0.1.1 01-16-2018
            : "Camelized" attribute names
			
		0.1.2 04-24-2018 by Zia
			: Added Laboratory Result
			: Added Medicine in Consultation/SOAP MODULE
		
		0.1.3 06-28-2018 by Zia
			:Added Plan/Management in Profiling
			:Added the Certification ID of XPS
			:Modified Enlistment - added pWithDisability, pDependentType
			:Modified Profiling - added pProfileOTP in PROFILE, removed pPrescType
			:Modified Profiling - added elements of ADVICE, DIAGNOSTIC , MANAGEMENT, PEPERT, and PESPECIFIC
			:Modified SOAP - added pOthRemarks in MANAGEMENT element, and delete OBLIGATED element
			:Removed Meds attribute in SOAP
			:Created MEDICINE element (added attributes pHciTransNo, pHciCaseNo, pModule)
			:Modified LABRESULTS - added ECG, FECALYSIS, PAPSSMEAR, OGTT elements; added pModule attribute
			:Removed pExtremeRem, pHeentPalploc, and pExtrmDeform in PESPECIFIC element
			:Added pRectalRem and pGuRem in PESPECIFIC element
			:Removed pExtremitiesId in PEMISC element
			:Added pRectalId and pGuId in PEMISC element
			:Added pDrugActualPrice, pDiagnosticLabFee, pReportStatus and pDeficiencyRemarks
		
		0.1.4 07-09-2018 by Zia
			:Changed pEnlistType into pPackageType in Enlistment element
			
		0.1.5 07-10-2018 by Zia
			:Added pAvailFreeService in Enlistment element
			:Added needed value in pReportStatus
			
		0.1.6 07-11-2018 by Zia
			:Added Co-payment in Laboratory Results
			:Added Co-payment in Medicine and changed parameter of Unit Price into pActualUnitPrice (as Drug Actual Price)
		0.1.7 08-30-2018 by Zia
			:Update Medicine element/attributes (library from DOH)	
			:Update attributes based on CF4 
		0.1.8 09-10-2018 by Zia
			:Add Generic Survey, Course in the ward - date, doctors action
		0.1.9 09-19-2018 by Zia
			:Update pGenSurveyId (1|2) insert valid values (1 - Awake and Alert; 2 - Altered Sensorium)
			:Update pPackageType (P|X) insert valid values (P - PCB1; X - EPCB; A - CF4)
		0.1.10 09-27-2018 by Zia
			:Removed Unit Code and Salt Code in MEDICINE
			:Added pPrescPhysician and pIsApplicable in Medicine element
			:Modified LABRESULT element
			:Added pEClaimId (Claim ID) and pEClaimsTransmittalId for CF4 
		0.1.11 09-28-2018 by Zia
			: removed pWaist
			: added pIsApplicable in LABRESULT
		0.1.12 10-03-2018  by Zia
			: added pDataCollection in SPUTUM 
			: removed pFindings in FECALYSIS
		0.1.13 10-5-2018 by Zia
			: added pTransDate, pCreatedBy
		0.1.14 10-09-2018 by Zia
			: Added pGenericName in MEDICINE
		0.1.15 12-20-2018 by Zia
			:modify value accepted for pPackageType in ENLISTMENT from (P|X|A) to (P|E|A), E - for EPCB
		0.1.16 01-29-2019 by Zia
			:updated elements and attributes per requirements
			:modified element operators
		0.1.17 01-31-2019 by Zia
			:added value of "X" as NOT APPLICABLE in SPUTUM
			:read value of "X" as NOT APPLICABLE in element of ENLISTMENT
		0.1.18 02-12-2019 by zia
			:added pSignsSymptoms in SUBJECTIVE list for CF4 purposes
		0.1.19 02-19-2019 by Zia
			:added value of 'W' as waived in PAPSSMEAR and OGTT element
		0.1.20 02-26-2019 by Zia
			:added pSaltCode, pUnitCode, pRoute attributes in MEDICINE element (EPCB and CF4 purposes)
			:added pIsApplicable attribute in MENSHIST
			:added pPainSite attribute in SUBJECTIVE
-->
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT EPCB (ENLISTMENTS,PROFILING,SOAPS,COURSEWARDS,LABRESULTS,MEDICINES)>
<!ATTLIST EPCB
   pUsername CDATA #REQUIRED
   pPassword CDATA #REQUIRED
   pHciAccreNo CDATA #REQUIRED
   pEnlistTotalCnt CDATA #REQUIRED
   pProfileTotalCnt CDATA #REQUIRED
   pSoapTotalCnt CDATA #REQUIRED
   pEmrId CDATA #REQUIRED
   pCertificationId CDATA #REQUIRED
   pHciTransmittalNumber CDATA #REQUIRED 
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT ENLISTMENTS (ENLISTMENT)+>
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT ENLISTMENT EMPTY>
<!ATTLIST ENLISTMENT
   pEClaimId CDATA #REQUIRED
   pEClaimsTransmittalId CDATA #REQUIRED
   pHciCaseNo CDATA #REQUIRED
   pHciTransNo CDATA #REQUIRED
   pEffYear CDATA #REQUIRED
   pEnlistStat CDATA #REQUIRED
   pEnlistDate CDATA #REQUIRED
   pPackageType (P|E|A) #REQUIRED
   pMemPin CDATA #REQUIRED
   pMemFname CDATA #REQUIRED
   pMemMname CDATA #REQUIRED
   pMemLname CDATA #REQUIRED
   pMemExtname CDATA #REQUIRED
   pMemDob CDATA #REQUIRED
   pMemCat CDATA #REQUIRED
   pMemNcat CDATA #REQUIRED
   pPatientPin CDATA #REQUIRED
   pPatientFname CDATA #REQUIRED
   pPatientMname CDATA #REQUIRED
   pPatientLname CDATA #REQUIRED
   pPatientExtname CDATA #REQUIRED
   pPatientType CDATA #REQUIRED
   pPatientSex (M|F) #REQUIRED
   pPatientContactno CDATA #REQUIRED
   pPatientDob CDATA #REQUIRED
   pPatientAddbrgy CDATA #REQUIRED
   pPatientAddmun CDATA #REQUIRED
   pPatientAddprov CDATA #REQUIRED
   pPatientAddreg CDATA #REQUIRED
   pPatientAddzipcode CDATA #REQUIRED
   pCivilStatus (S|M|W|X|A|U) #REQUIRED
   pWithConsent (Y|N|X) #REQUIRED
   pWithLoa (Y|N|X) #REQUIRED
   pWithDisability (Y|N|X) #REQUIRED
   pDependentType (S|C|P|X) #REQUIRED
   pTransDate CDATA #REQUIRED
   pCreatedBy CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   pAvailFreeService (Y|N|X) #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT PROFILING (PROFILE)+>
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT PROFILE (OINFO,MEDHIST+,MHSPECIFIC+,SURGHIST+,FAMHIST+,FHSPECIFIC+,SOCHIST,IMMUNIZATION+,MENSHIST,PREGHIST,PEPERT,BLOODTYPE,PEGENSURVEY,PEMISC+,PESPECIFIC+,DIAGNOSTIC+,MANAGEMENT+,ADVICE,NCDQANS)>
<!ATTLIST PROFILE
   pHciTransNo CDATA #REQUIRED
   pHciCaseNo CDATA #REQUIRED
   pPatientPin CDATA #REQUIRED
   pPatientType CDATA #REQUIRED
   pMemPin CDATA #REQUIRED
   pProfDate CDATA #REQUIRED
   pRemarks CDATA #REQUIRED
   pEffYear CDATA #REQUIRED
   pProfileATC CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT OINFO EMPTY>
<!ATTLIST OINFO
   pPatientPob CDATA #REQUIRED
   pPatientAge CDATA #REQUIRED
   pPatientOccupation CDATA #REQUIRED
   pPatientEducation CDATA #REQUIRED
   pPatientReligion CDATA #REQUIRED
   pPatientMotherMnln CDATA #REQUIRED
   pPatientMotherMnmi CDATA #REQUIRED
   pPatientMotherFn CDATA #REQUIRED
   pPatientMotherExtn CDATA #REQUIRED
   pPatientMotherBday CDATA #REQUIRED
   pPatientFatherLn CDATA #REQUIRED
   pPatientFatherMi CDATA #REQUIRED
   pPatientFatherFn CDATA #REQUIRED
   pPatientFatherExtn CDATA #REQUIRED
   pPatientFatherBday CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT MEDHIST EMPTY>
<!ATTLIST MEDHIST
   pMdiseaseCode CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
         
<!--- Put your DTDDoc comment here. -->
<!ELEMENT MHSPECIFIC EMPTY>
<!ATTLIST MHSPECIFIC
   pMdiseaseCode CDATA #REQUIRED
   pSpecificDesc CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >  
   
 <!--- Put your DTDDoc comment here. -->
<!ELEMENT SURGHIST EMPTY>
<!ATTLIST SURGHIST
   pSurgDesc CDATA #REQUIRED
   pSurgDate CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >  

   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT FAMHIST EMPTY>
<!ATTLIST FAMHIST
   pMdiseaseCode CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT FHSPECIFIC EMPTY>
<!ATTLIST FHSPECIFIC
   pMdiseaseCode CDATA #REQUIRED
   pSpecificDesc CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT SOCHIST EMPTY>
<!ATTLIST SOCHIST
   pIsSmoker CDATA #REQUIRED
   pNoCigpk CDATA #REQUIRED
   pIsAdrinker CDATA #REQUIRED
   pNoBottles CDATA #REQUIRED
   pIllDrugUser CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT IMMUNIZATION EMPTY>
<!ATTLIST IMMUNIZATION
   pChildImmcode CDATA #REQUIRED
   pYoungwImmcode CDATA #REQUIRED
   pPregwImmcode CDATA #REQUIRED
   pElderlyImmcode CDATA #REQUIRED
   pOtherImm CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
     
<!--- Put your DTDDoc comment here. -->
<!ELEMENT MENSHIST EMPTY>
<!ATTLIST MENSHIST
   pMenarchePeriod CDATA #REQUIRED
   pLastMensPeriod CDATA #REQUIRED
   pPeriodDuration CDATA #REQUIRED
   pMensInterval CDATA #REQUIRED
   pPadsPerDay CDATA #REQUIRED
   pOnsetSexIc CDATA #REQUIRED
   pBirthCtrlMethod CDATA #REQUIRED
   pIsMenopause CDATA #REQUIRED
   pMenopauseAge CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
 <!--- Put your DTDDoc comment here. -->
<!ELEMENT PREGHIST EMPTY>
<!ATTLIST PREGHIST
   pPregCnt CDATA #REQUIRED
   pDeliveryCnt CDATA #REQUIRED
   pDeliveryTyp CDATA #REQUIRED
   pFullTermCnt CDATA #REQUIRED
   pPrematureCnt CDATA #REQUIRED
   pAbortionCnt CDATA #REQUIRED
   pLivChildrenCnt CDATA #REQUIRED
   pWPregIndhyp CDATA #REQUIRED
   pWFamPlan CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >

<!--- Put your DTDDoc comment here. -->
<!ELEMENT BLOODTYPE EMPTY>
<!ATTLIST BLOODTYPE
   pBloodType CDATA #REQUIRED
   pBloodRh CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >  
  
<!--- Put your DTDDoc comment here. -->
<!ELEMENT PEGENSURVEY EMPTY>
<!ATTLIST PEGENSURVEY
   pGenSurveyId CDATA #REQUIRED
   pGenSurveyRem CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT PEMISC EMPTY>
<!ATTLIST PEMISC
   pSkinId CDATA #REQUIRED
   pHeentId CDATA #REQUIRED
   pChestId CDATA #REQUIRED
   pHeartId CDATA #REQUIRED
   pAbdomenId CDATA #REQUIRED
   pNeuroId CDATA #REQUIRED
   pGuId CDATA #REQUIRED
   pRectalId CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT NCDQANS EMPTY>
<!ATTLIST NCDQANS   
   pQid1_Yn CDATA #REQUIRED
   pQid2_Yn CDATA #REQUIRED
   pQid3_Yn CDATA #REQUIRED
   pQid4_Yn CDATA #REQUIRED
   pQid5_Ynx CDATA #REQUIRED
   pQid6_Yn CDATA #REQUIRED
   pQid7_Yn CDATA #REQUIRED
   pQid8_Yn CDATA #REQUIRED
   pQid9_Yn CDATA #REQUIRED
   pQid10_Yn CDATA #REQUIRED   
   pQid11_Yn CDATA #REQUIRED
   pQid12_Yn CDATA #REQUIRED
   pQid13_Yn CDATA #REQUIRED
   pQid14_Yn CDATA #REQUIRED
   pQid15_Yn CDATA #REQUIRED
   pQid16_Yn CDATA #REQUIRED
   pQid17_Abcde CDATA #REQUIRED
   pQid18_Yn CDATA #REQUIRED
   pQid19_Yn CDATA #REQUIRED
   pQid19_Fbsmg CDATA #REQUIRED
   pQid19_Fbsmmol CDATA #REQUIRED
   pQid19_Fbsdate CDATA #REQUIRED
   pQid20_Yn CDATA #REQUIRED
   pQid20_Choleval CDATA #REQUIRED
   pQid20_Choledate CDATA #REQUIRED
   pQid21_Yn CDATA #REQUIRED
   pQid21_Ketonval CDATA #REQUIRED
   pQid21_Ketondate CDATA #REQUIRED
   pQid22_Yn CDATA #REQUIRED
   pQid22_Proteinval CDATA #REQUIRED
   pQid22_Proteindate CDATA #REQUIRED
   pQid23_Yn CDATA #REQUIRED 
   pQid24_Yn CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
<!--- Put your DTDDoc comment here. -->
<!ELEMENT SOAPS (SOAP)+>
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT SOAP (SUBJECTIVE+,PEPERT,PEMISC+,PESPECIFIC+,ICDS+,DIAGNOSTIC+,MANAGEMENT+,ADVICE)>
<!ATTLIST SOAP
   pHciTransNo CDATA #REQUIRED
   pHciCaseNo CDATA #REQUIRED
   pPatientPin CDATA #REQUIRED
   pPatientType CDATA #REQUIRED
   pMemPin CDATA #REQUIRED
   pSoapDate CDATA #REQUIRED
   pEffYear CDATA #REQUIRED
   pSoapATC CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT SUBJECTIVE EMPTY>
<!ATTLIST SUBJECTIVE
   pChiefComplaint CDATA #REQUIRED
   pIllnessHistory CDATA #REQUIRED
   pOtherComplaint CDATA #REQUIRED
   pSignsSymptoms CDATA #REQUIRED
   pPainSite CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >

<!--- Put your DTDDoc comment here. -->
<!ELEMENT PEPERT EMPTY>
<!ATTLIST PEPERT
   pSystolic CDATA #REQUIRED
   pDiastolic CDATA #REQUIRED
   pHr CDATA #REQUIRED
   pRr CDATA #REQUIRED
   pTemp CDATA #REQUIRED
   pHeight CDATA #REQUIRED
   pWeight CDATA #REQUIRED
   pVision CDATA #REQUIRED
   pLength CDATA #REQUIRED
   pHeadCirc CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >

<!--- Put your DTDDoc comment here. -->
<!ELEMENT PESPECIFIC EMPTY>
<!ATTLIST PESPECIFIC
   pSkinRem CDATA #REQUIRED
   pHeentRem CDATA #REQUIRED
   pChestRem CDATA #REQUIRED
   pHeartRem CDATA #REQUIRED
   pAbdomenRem CDATA #REQUIRED
   pNeuroRem CDATA #REQUIRED
   pRectalRem CDATA #REQUIRED
   pGuRem CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT ICDS EMPTY>
<!ATTLIST ICDS
   pIcdCode CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
  
<!--- Put your DTDDoc comment here. -->
<!ELEMENT DIAGNOSTIC EMPTY>
<!ATTLIST DIAGNOSTIC
   pDiagnosticId CDATA #REQUIRED
   pOthRemarks CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
    
<!--- Put your DTDDoc comment here. -->
<!ELEMENT MANAGEMENT EMPTY>
<!ATTLIST MANAGEMENT
   pManagementId CDATA #REQUIRED
   pOthRemarks CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT ADVICE EMPTY>
<!ATTLIST ADVICE
   pRemarks CDATA #REQUIRED
   pReportStatus CDATA #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >    
   
<!-- FOR APPROVAL XML FORMAT -->
<!-- Put your DTDDoc comment here. -->
<!ELEMENT MEDICINES (MEDICINE)+>
<!--- Put your DTDDoc comment here. -->
<!ELEMENT MEDICINE EMPTY>
<!ATTLIST MEDICINE
   pHciCaseNo CDATA #REQUIRED
   pHciTransNo CDATA #REQUIRED
   pDrugCode CDATA #REQUIRED
   pGenericName CDATA #REQUIRED	
   pGenericCode CDATA #REQUIRED
   pSaltCode CDATA #REQUIRED
   pStrengthCode CDATA #REQUIRED
   pFormCode CDATA #REQUIRED
   pUnitCode CDATA #REQUIRED
   pPackageCode CDATA #REQUIRED  
   pRoute CDATA #REQUIRED  
   pQuantity CDATA #REQUIRED
   pActualUnitPrice CDATA #REQUIRED
   pCoPayment CDATA #REQUIRED
   pTotalAmtPrice CDATA #REQUIRED
   pInstructionQuantity CDATA #REQUIRED
   pInstructionStrength CDATA #REQUIRED
   pInstructionFrequency CDATA #REQUIRED
   pPrescPhysician CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pDateAdded CDATA #REQUIRED
   pModule CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT COURSEWARDS (COURSEWARD)+>
<!ELEMENT COURSEWARD EMPTY>
<!ATTLIST COURSEWARD
   pHciCaseNo CDATA #REQUIRED
   pHciTransNo CDATA #REQUIRED
   pDateAction CDATA #REQUIRED
   pDoctorsAction CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT LABRESULTS (LABRESULT)+>   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT LABRESULT (CBC+,URINALYSIS+,CHESTXRAY+,SPUTUM+,LIPIDPROF+,FBS+,ECG+,FECALYSIS+,PAPSSMEAR+,OGTT+)>
<!ATTLIST LABRESULT   
   pHciCaseNo CDATA #REQUIRED
   pPatientPin CDATA #REQUIRED
   pPatientType CDATA #REQUIRED
   pMemPin CDATA #REQUIRED
   pEffYear CDATA #REQUIRED
   >
<!--- Put your DTDDoc comment here. -->
<!ELEMENT CBC EMPTY>
<!ATTLIST CBC
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pHematocrit CDATA #REQUIRED
   pHemoglobinG CDATA #REQUIRED
   pHemoglobinMmol CDATA #REQUIRED
   pMhcPg CDATA #REQUIRED
   pMhcFmol CDATA #REQUIRED
   pMchcGhb CDATA #REQUIRED
   pMchcMmol CDATA #REQUIRED
   pMcvUm CDATA #REQUIRED
   pMcvFl CDATA #REQUIRED
   pWbc1000 CDATA #REQUIRED
   pWbc10 CDATA #REQUIRED
   pMyelocyte CDATA #REQUIRED
   pNeutrophilsBnd CDATA #REQUIRED
   pNeutrophilsSeg CDATA #REQUIRED
   pLymphocytes CDATA #REQUIRED
   pMonocytes CDATA #REQUIRED
   pEosinophils CDATA #REQUIRED
   pBasophils CDATA #REQUIRED
   pPlatelet CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT URINALYSIS EMPTY>
<!ATTLIST URINALYSIS
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pGravity CDATA #REQUIRED
   pAppearance CDATA #REQUIRED
   pColor CDATA #REQUIRED
   pGlucose CDATA #REQUIRED
   pProteins CDATA #REQUIRED
   pKetones CDATA #REQUIRED
   pPh CDATA #REQUIRED
   pRbCells CDATA #REQUIRED
   pWbCells CDATA #REQUIRED
   pBacteria CDATA #REQUIRED
   pCrystals CDATA #REQUIRED
   pBladderCell CDATA #REQUIRED
   pSquamousCell CDATA #REQUIRED
   pTubularCell CDATA #REQUIRED
   pBroadCasts CDATA #REQUIRED
   pEpithelialCast CDATA #REQUIRED
   pGranularCast CDATA #REQUIRED
   pHyalineCast CDATA #REQUIRED
   pRbcCast CDATA #REQUIRED
   pWaxyCast CDATA #REQUIRED
   pWcCast CDATA #REQUIRED
   pAlbumin CDATA #REQUIRED
   pPusCells CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT CHESTXRAY EMPTY>
<!ATTLIST CHESTXRAY
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pFindings CDATA #REQUIRED
   pRemarksFindings CDATA #REQUIRED
   pObservation CDATA #REQUIRED
   pRemarksObservation CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT SPUTUM EMPTY>
<!ATTLIST SPUTUM
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pDataCollection (1|2|3|X) #REQUIRED
   pFindings CDATA #REQUIRED
   pRemarks CDATA #REQUIRED
   pNoPlusses CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >  
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT LIPIDPROF EMPTY>
<!ATTLIST LIPIDPROF
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pLdl CDATA #REQUIRED
   pHdl CDATA #REQUIRED
   pTotal CDATA #REQUIRED
   pCholesterol CDATA #REQUIRED
   pTriglycerides CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >     
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT FBS EMPTY>
<!ATTLIST FBS
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pGlucoseMg CDATA #REQUIRED
   pGlucoseMmol CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >     

<!--- Put your DTDDoc comment here. -->
<!ELEMENT ECG EMPTY>
<!ATTLIST ECG
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pFindings CDATA #REQUIRED
   pRemarks CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >    

<!--- Put your DTDDoc comment here. -->
<!ELEMENT FECALYSIS EMPTY>
<!ATTLIST FECALYSIS
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pColor CDATA #REQUIRED
   pConsistency CDATA #REQUIRED
   pRbc CDATA #REQUIRED
   pWbc CDATA #REQUIRED
   pOva CDATA #REQUIRED
   pParasite CDATA #REQUIRED
   pBlood CDATA #REQUIRED
   pOccultBlood CDATA #REQUIRED
   pPusCells CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >       
 
<!--- Put your DTDDoc comment here. -->
<!ELEMENT PAPSSMEAR EMPTY>
<!ATTLIST PAPSSMEAR
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pFindings CDATA #REQUIRED
   pImpression CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N|W) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >   
   
<!--- Put your DTDDoc comment here. -->
<!ELEMENT OGTT EMPTY>
<!ATTLIST OGTT
   pHciTransNo CDATA #REQUIRED
   pReferralFacility CDATA #REQUIRED
   pLabDate CDATA #REQUIRED
   pExamFastingMg CDATA #REQUIRED
   pExamFastingMmol CDATA #REQUIRED
   pExamOgttOneHrMg CDATA #REQUIRED
   pExamOgttOneHrMmol CDATA #REQUIRED
   pExamOgttTwoHrMg CDATA #REQUIRED
   pExamOgttTwoHrMmol CDATA #REQUIRED
   pDateAdded CDATA #REQUIRED
   pIsApplicable (Y|N|W) #REQUIRED
   pModule CDATA #REQUIRED
   pDiagnosticLabFee CDATA #REQUIRED
   pCoPay CDATA #REQUIRED
   pReportStatus (U|V|F) #REQUIRED
   pDeficiencyRemarks CDATA #REQUIRED
   >   
```
:::

The trailing blank lines of the file are omitted above. [`CF4.pdf`](/originals/cf4/CF4.pdf) prints the same text.

## Related pages

- [Building CF4](/guides/cf4): workflow, defaults, clinical rules, NOMED
- [CF4 libraries](/reference/libraries/cf4): codes used by `PEMISC`, `SUBJECTIVE`, `ICDS` and `MEDICINE`
- [eClaims XML](/reference/eclaims-xml): where the CF4 attachment is referenced (`DOCUMENT`)
- [Document types](/reference/document-types)
- [Validating XML locally](/guides/validating-xml)
- [Known issues: KI-08](/known-issues#ki-08), [KI-38](/known-issues#ki-38), [KI-39](/known-issues#ki-39), [KI-55](/known-issues#ki-55), [KI-60](/known-issues#ki-60)
