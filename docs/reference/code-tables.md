---
title: Code tables
description: Every enumerated value in the eClaims XML (eClaimsDef.dtd v1.9 and Annex C) in one place, plus the key code lists of the eSOA, CF5 and CF4 formats.
---

# Code tables

<Badge type="tip" text="Current: DTD v1.9" />

This page collects every fixed list of values ("enumeration") used in the eClaims XML, with the meaning of each code. Use it when you map values from your Hospital Information System (HIS) to PhilHealth codes, or when a validator says a value "is not among the enumerated set". The last section lists the main code lists of the other XML formats and links to their reference pages.

::: info Sources
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.9: the allowed values
- [Implementation Guide (rev. 20250217), Annex C, p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79): the meanings
- [Implementation Guide, p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) and [p. 69–70](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69): the same codes in `isClaimEligible`
- [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5 and [Implementation Guide, Annex F, p. 130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130) (category, sub-category and bill type libraries)
- [Implementation Guide, Annex E, p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88) (CF5 data dictionary)
- [`CF4.dtd`](/originals/cf4/CF4.dtd) and the [CF4 data dictionary rev. 4, p. 1–3 and 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)
:::

## How to read these tables

- **The DTD list is the hard rule.** For an enumerated attribute, the validator accepts only the listed values, spelled exactly as shown (XML is case-sensitive). An empty string is **not** accepted, even though most other eClaims attributes may be `""`. See [eClaims XML](/reference/eclaims-xml#every-attribute-must-be-present).
- **Meanings come from Annex C**, copied as written (including PhilHealth's wording, such as "Employer Government", [KI-20](/known-issues#ki-20)). Where Annex C and the DTD disagree, both are shown.
- "Annex C only" marks a list that Annex C gives but the DTD does not enforce (the DTD accepts any text there).

## eClaims XML values

### Claim type

`CLAIM@pPhilhealthClaimType`: "Flag whether Claims Payment Mechanism" ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).

| Code | Meaning | Then the claim contains |
|---|---|---|
| `ALL-CASE-RATE` | All Case Rates | `ALLCASERATE` with one or more `CASERATE` |
| `Z-BENEFIT` | Z Benefit package | `ZBENEFIT` |

The link between the code and the element comes from the comments in the Guide's sample ([p. 31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=31)). The DTD itself only says the claim has one of the two elements.

### Patient type

`CLAIM@pPatientType` ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)):

| Code | Meaning |
|---|---|
| `I` | Inpatient |
| `O` | Outpatient |

### Membership type

`CF1@pMemberShipType` ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). The same codes are listed for the `membershipType` input of [isClaimEligible](/api/is-claim-eligible), where they are printed under the wrong key ([KI-20](/known-issues#ki-20)).

| Code | Meaning (Annex C wording) |
|---|---|
| `S` | Employed Private |
| `G` | Employer Government (probably "Employed Government", [KI-20](/known-issues#ki-20)) |
| `I` | Indigent |
| `NS` | Individually Paying |
| `NO` | OFW |
| `PS` | Non Paying Private |
| `PG` | Non Paying Government |
| `P` | Lifetime Member (added in DTD 1.7.5, 2015) |

Annex C introduces the list with "(Not limited to the following:)", but the DTD accepts **only** these 8 codes ([KI-32](/known-issues#ki-32)). A new code would need a new DTD. Members of type `S` or `G` are employed: only for them are `pPEN` and `pEmployerName` used ("These are disregarded if pMemberShipType is not ('S' or 'G')", [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)).

### Patient is (relationship to the member)

`CF1@pPatientIs` ([Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). Revision 20240823 set the same values for the `patientIs` input of [isClaimEligible](/api/is-claim-eligible) ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

| Code | Meaning |
|---|---|
| `M` | Patient is member (self) |
| `S` | Patient is spouse |
| `C` | Patient is child |
| `P` | Patient is parent |

When the code is `M`, the patient's first and middle name "can be blank since these are disregarded" (Annex C gives no rule for the last name, [KI-50](/known-issues#ki-50)) ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)).

### Sex

| Attribute | Codes | Enforced by |
|---|---|---|
| `CF1@pMemberSex`, `CF1@pPatientSex` | `M` Male, `F` Female | DTD |
| `DELIVERY@pSex` (sex of the newborn in CF3) | `M` Male, `F` Female | Annex C only ([p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83)); the DTD declares it as CDATA |

### Disposition

`CF2@pDisposition`: the patient's disposition at discharge ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)).

| Code | Meaning | Extra rule |
|---|---|---|
| `I` | Improved | |
| `R` | Recovered | |
| `H` | Home/Discharged Against Medical Advise | |
| `A` | Absconded | |
| `E` | Expired | `pExpiredDate` and `pExpiredTime` are required. |
| `T` | Transferred/Referred | `pReferralIHCPAccreCode` and `pReferralReasons` are required (one merged Annex C cell covers both). |

### Accommodation type

`CF2@pAccommodationType` ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)):

| Code | Meaning |
|---|---|
| `P` | Private |
| `N` | Non-Private (Charity/Service) |

### Attached SOA

`CF2@pHasAttachedSOA`, one of only two optional attributes in the DTD ([Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)):

| Code | Meaning |
|---|---|
| `Y` | With attached SOA (statement of account) |
| `N` | Without attached SOA |

Annex C's description of this attribute says "Type of Accommodation", which is a typo ([KI-32](/known-issues#ki-32)). The DevKit doesn't say whether `Y` is required when you attach an eSOA (document type `ESA`) rather than a scanned `SOA` ([KI-62](/known-issues#ki-62)).

### Laterality

`RVSCODES@pLaterality`: the side of the body of a procedure ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)):

| Code | Meaning |
|---|---|
| `L` | Left |
| `R` | Right |
| `B` | Both |
| `N` | N/A |

It can't be empty in the eClaims XML. The CF5 XML uses the same four letters (there `N` is "None"); see [CF5](#cf5-drg) below and [KI-05](/known-issues#ki-05).

### TB-DOTS type

`TBDOTS@pTBType`: "Type of TB-Dots claim" ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)):

| Code | Meaning | What the admission and discharge dates must be |
|---|---|---|
| `I` | Intensive Phase | The first and last days of treatment in the intensive phase |
| `M` | Maintenance | The first and last days of treatment in the maintenance phase |

### Z-benefit codes

`ZBENEFIT@pZBenefitCode` ([Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82)). The DTD lists exactly these 18 codes. Note that `Z003` has only four characters.

| Code | Package (Annex C wording) | Payment |
|---|---|---|
| `Z0011` | Standard Risk Acute Lymphocytic (lymphoblastic) Leukemia for Children | 1st tranche |
| `Z0012` | Standard Risk Acute Lymphocytic (lymphoblastic) Leukemia for Children | 2nd tranche |
| `Z0013` | Standard Risk Acute Lymphocytic (lymphoblastic) Leukemia for Children | 3rd tranche |
| `Z0021` | Early Stage Breast Cancer (Stage 0 to III-A) | 1st tranche |
| `Z0022` | Early Stage Breast Cancer (Stage 0 to III-A) | 2nd tranche |
| `Z003` | Low to Intermediate Risk Prostate Cancer Requiring Prostatectomy | Full payment |
| `Z0041` | End Stage Renal Disease Eligible for Kidney Transplant (Low Risk) | 1st tranche |
| `Z0042` | End Stage Renal Disease Eligible for Kidney Transplant (Low Risk) | 2nd tranche |
| `Z0051` | Elective Surgery for Standard Risk Coronary Artery Bypass Graft (CABG) | 1st tranche |
| `Z0052` | Elective Surgery for Standard Risk Coronary Artery Bypass Graft (CABG) | 2nd tranche |
| `Z0061` | Tetralogy of Fallot (TOF) | 1st tranche |
| `Z0062` | Tetralogy of Fallot (TOF) | 2nd tranche |
| `Z0071` | Ventricular Septal Defect (VSD) | 1st tranche |
| `Z0072` | Ventricular Septal Defect (VSD) | 2nd tranche |
| `Z0081` | Cervical Cancer Chemoradiation with Cobalt & Brachytherapy (Low Dose) or Primary Surgery for Stage IA1, IA2 – IIA1 | 1st tranche |
| `Z0082` | Cervical Cancer Chemoradiation with Cobalt & Brachytherapy (Low Dose) or Primary Surgery for Stage IA1, IA2 – IIA1 | 2nd tranche |
| `Z0091` | Cervical Cancer Chemoradiation with Linear Accelerator & Brachytherapy (High Dose) | 1st tranche |
| `Z0092` | Cervical Cancer Chemoradiation with Linear Accelerator & Brachytherapy (High Dose) | 2nd tranche |

`ZBENEFIT` also needs `pPreAuthDate` (the Z-Benefit pre-authorization date, `MM-DD-YYYY`). This list is part of DTD v1.9 (2017), and the DevKit contains no newer Z-benefit list. If PhilHealth has added packages since then, the v1.9 DTD would reject their codes, so confirm with PhilHealth.

### Diagnostic type

`XLSO@pDiagnosticType` in `PARTICULARS` ([Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84)): "Type of diagnostic/test done". Uppercase, as written. Annex C describes the matching `pDiagnosticName` as "Name of Imaging procedure for Imaging, Name of Laboratory procedure for Laboratory, Name of Supplies for Supplies or Others for Supplies and Others".

| Code | `pDiagnosticName` then holds |
|---|---|
| `IMAGING` | The name of the imaging procedure |
| `LABORATORY` | The name of the laboratory procedure |
| `SUPPLIES` | The name of the supplies |
| `OTHERS` | Not stated clearly. The last part of the Annex C sentence is garbled ([KI-32](/known-issues#ki-32)); it probably means the name of the other item. |

### Consent to access patient record (APR)

These codes describe who signed the consent in `CF2/APR` ([Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85); DTD comments).

**Relation of the representative (`pRelCode`)**

| Code | Meaning | Where |
|---|---|---|
| `S` | Spouse | `DEFINEDPATREPREL` |
| `C` | Child | `DEFINEDPATREPREL` |
| `P` | Parent | `DEFINEDPATREPREL` |
| `I` | Sibling (DTD comment: "Siblings") | `DEFINEDPATREPREL` |
| `O` | Others. Describe the relation in `pRelDesc`. | `OTHERPATREPREL`, where the DTD fixes the value to `O` |

**Reason a representative signed (`pReasonCode`)**

| Code | Meaning | Where |
|---|---|---|
| `I` | Patient is incapacitated | `DEFINEDREASONFORSIGNING` (the only value allowed there) |
| `O` | Other reasons. Describe them in `pReasonDesc`. | `OTHERREASONFORSIGNING`, where the DTD fixes the value to `O` |

Annex C describes `O` as "Patient is incapacitated (pReasonDesc should have a value)". The DTD comment says "O: Other reasons. Should be specified in pReasonDesc". The DTD comment matches the element design, so use that meaning ([KI-32](/known-issues#ki-32)).

**Thumbmark (`APRBYTHUMBMARK@pThumbmarkedBy`)**

| Code | Meaning |
|---|---|
| `P` | Of the patient/member |
| `R` | Of a representative |

### Y/N flags

The DTD declares 57 attributes as `(Y|N)`. Each must be `Y` (yes) or `N` (no), never empty. Some of them switch other parts of the XML on or off:

| Flag | When `Y` | When `N` |
|---|---|---|
| `CONSUMPTION@pEnoughBenefits` | Write `BENEFITS`. | Write `HCIFEES`, `PROFFEES`, `PURCHASES`. |
| `PROFESSIONALS@pWithCoPay` | `pDoctorCoPay` is required. | `pDoctorCoPay` may be `""`. |
| `PURCHASES@pDrugsMedicinesSupplies` | `pDMSTotalAmount` is required ([KI-32](/known-issues#ki-32)). | Amount may be `""`. |
| `PURCHASES@pExaminations` | `pExamTotalAmount` is required ([KI-32](/known-issues#ki-32)). | Amount may be `""`. |
| `NCP@pNewbornScreeningTest` | `pFilterCardNo` is required. | Card number may be `""`. |
| `NCP@pEssentialNewbornCare` | The `ESSENTIAL` flags are required. | |
| `CF2@pPatientReferred` | `pReferredIHCPAccreCode` is required ("Required if the patient is referred by another IHCP"). | Code may be `""`. |

Sources: [Annex C p. 80–82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) and the DTD.

::: details All 57 Y/N attributes by element
| Element | Y/N attributes |
|---|---|
| `CLAIM` | `pIsEmergency` |
| `CF2` | `pPatientReferred`, `pHasAttachedSOA` |
| `NCP` | `pEssentialNewbornCare`, `pNewbornHearingScreeningTest`, `pNewbornScreeningTest` |
| `ESSENTIAL` | `pDrying`, `pSkinToSkin`, `pCordClamping`, `pProphylaxis`, `pWeighing`, `pVitaminK`, `pBCG`, `pNonSeparation`, `pHepatitisB` |
| `PROFESSIONALS` | `pWithCoPay` |
| `CONSUMPTION` | `pEnoughBenefits` |
| `HCIFEES` | `pMemberPatient`, `pHMO`, `pOthers` |
| `PROFFEES` | `pMemberPatient`, `pHMO`, `pOthers` |
| `PURCHASES` | `pDrugsMedicinesSupplies`, `pExaminations` |
| `PRENATAL` | `pMCPOrientation` |
| `CLINICALHIST` | `pVitalSigns`, `pPregnancyLowRisk` |
| `OBSTETRIC` | `pMultiplePregnancy`, `pOvarianCyst`, `pMyomaUteri`, `pPlacentaPrevia`, `pMiscarriages`, `pStillBirth`, `pPreEclampsia`, `pEclampsia`, `pPrematureContraction` |
| `MEDISURG` | `pHypertension`, `pHeartDisease`, `pDiabetes`, `pThyroidDisaster`, `pObesity`, `pAsthma`, `pEpilepsy`, `pRenalDisease`, `pBleedingDisorders`, `pPreviousCS`, `pUterineMyomectomy` |
| `POSTPARTUM` | `pPerinealWoundCare`, `pMaternalComplications`, `pBreastFeeding`, `pFamilyPlanning`, `pPlanningService`, `pSurgicalSterilization`, `pFollowupSchedule` |
| `ADMITREASON` | `pIntensive`, `pMaintenance` |

`pHasAttachedSOA` is the only optional one (`#IMPLIED`). Annex C's text for `pDrying` says "Flag whether Yes (Y) or No (Y)", a typo for `N` ([KI-32](/known-issues#ki-32)).
:::

### Codes that come from libraries, not from the DTD

These attributes take codes from external lists. The DTD accepts any text, so only PhilHealth's server checks them.

| Attribute | Code list | Where to get it |
|---|---|---|
| `ICDCODE@pICDCode`, `CASERATE@pICDCode` | ICD-10 ("Refer to ICD10 library", String(15)) | The DevKit has no separate ICD-10 file for eClaims. The CF4 library [`lib_icd.xlsx`](/originals/cf4/libraries/lib_icd.xlsx) is a PhilHealth ICD list; it says "Only with active library status shall be used", and it has duplicate and truncated rows ([KI-39](/known-issues#ki-39)). See [CF4 libraries](/reference/libraries/cf4). |
| `RVSCODES@pRVSCode`, `CASERATE@pRVSCode` | Relative Value Scale ("See RVS Library", String(6)) | Not included in the DevKit; the CF5 form points to a "DRG Manual" that isn't included either ([KI-63](/known-issues#ki-63)). [searchCaseRates](/api/search-case-rates) accepts an `rvscode` and returns the matching benefit packages. |
| `CASERATE@pCaseRateCode` | Case rates ("See Case Rate Library", String(6)) | Not included in the DevKit ([KI-46](/known-issues#ki-46)). Use [searchCaseRates](/api/search-case-rates). |
| `DOCUMENT@pDocumentType` | Annex B document codes (String(3)) | [Document type codes](/reference/document-types). DTD 1.9.0 removed the list from the DTD. |
| `eRECEIPT/REMARKS@pErrCode` | Upload error codes (String(3)), e.g. `T01`, `T02` in the sample | Not listed anywhere in the DevKit ([KI-42](/known-issues#ki-42)). |

## Code lists of the other formats

These are summaries. Each format has its own reference page with the full details.

### eSOA

`ItemizedBillingItem@pCategory` in [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5 is enumerated. The category library in Annex F lists the same six codes with descriptions and a bill type ([Guide p. 130](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130)):

| `pCategory` code | Description (Annex F) | Bill type |
|---|---|---|
| `RoomAndBoard` | ROOM AND BOARD | `I` |
| `DrugsAndMedicine` | DRUGS AND MEDICINE | `I` |
| `LaboratoryAndDiagnostic` | LABORATORY AND DIAGNOSTIC | `I` |
| `OperatingRoomFees` | OPERATING ROOM FEES | `I` |
| `MedicalSupplies` | MEDICAL SUPPLIES | `I` |
| `Others` | OTHERS (added in ESOA.dtd 0.5, 2025-02-17, [KI-04](/known-issues#ki-04)) | `I` |

Bill types: `I` = HEALTH CARE INSTITUTION, `P` = HEALTH CARE PROFESSIONAL. The category library also has the rows `PAN: (FN MN LN Suffix)` (bill type `P`), `PhilHealth` and `Balance`. They are not `pCategory` values in the DTD; they appear to describe the professional fee, `PhilHealth` and `Balance` parts of the eSOA. The sub-category library (1 ACTUAL CHARGES, 2 SENIOR CITIZEN DISCOUNT, 3 PWD DISCOUNT, 4 PCSO DISCOUNT, 5 DSWD DISCOUNT, 6 DOH MEDICAL ASSISTANCE PROGRAM, 7 HMO DISCOUNT) appears to correspond to the seven amount attributes of `SummaryOfFee`. Details: [eSOA XML](/reference/esoa-xml) and [eSOA libraries](/reference/libraries/esoa).

### CF5 (DRG)

The CF5 DTD declares every attribute as CDATA, so these lists come from the data dictionary only ([Annex E p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)):

| Attribute | Values |
|---|---|
| `PROCEDURE@Laterality` | `L` Left, `R` Right, `B` Both, `N` None. Revision 20250217 made `N` the value for "no laterality"; older CF5 material says to leave it blank ([KI-05](/known-issues#ki-05)). |
| `PROCEDURE@Ext1` | `1`–`9`: number of body sites. Both official CF5 samples send `""`; whether blank is accepted is not stated ([KI-63](/known-issues#ki-63)). |
| `PROCEDURE@Ext2` | `1`–`9`: number of times the procedure was done. Blank as for `Ext1` ([KI-63](/known-issues#ki-63)). |
| `CF5@pHospitalCode` | 6 characters, format `999999` or `X99999` (the PMCC number). DRG error code 509 requires the same value as the eClaims `pHospitalCode` ([KI-48](/known-issues#ki-48)). |

Details: [CF5 XML](/reference/cf5-xml).

### CF4

The CF4 XML uses the EPCB DTD, which contains many fields that are "Not part of the CF4, but requirement for XML Validation". For those, the data dictionary gives a fixed default. The enumerated attributes in [`CF4.dtd`](/originals/cf4/CF4.dtd) are:

| Attribute (element) | DTD values | Meaning / default for CF4 | Source |
|---|---|---|---|
| `pPackageType` (`ENLISTMENT`) | `P`, `E`, `A` | Use `A` ("All Case Rate") as default. The DTD history calls it "A - CF4" ([KI-55](/known-issues#ki-55)); `P` = PCB1, `E` = EPCB. | [Dictionary p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1), DTD 0.1.9 and 0.1.15 |
| `pPatientSex` (`ENLISTMENT`) | `M`, `F` | Male, Female | DTD |
| `pCivilStatus` (`ENLISTMENT`) | `S`, `M`, `W`, `X`, `A`, `U` | Use `U` ("Unspecified") as default. The other letters are not explained in the DevKit. | [Dictionary p. 2](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pWithConsent`, `pWithLoa`, `pWithDisability`, `pAvailFreeService` (`ENLISTMENT`) | `Y`, `N`, `X` | Yes, No, Not Applicable. Use `X` as default. (For `pAvailFreeService` the DEFAULT column is empty; only its description says `X`, [KI-55](/known-issues#ki-55).) | [Dictionary p. 2–3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=2) |
| `pDependentType` (`ENLISTMENT`) | `S`, `C`, `P`, `X` | Spouse, Child, Parent; use `X` ("Not Applicable") as default | [Dictionary p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pReportStatus` (35 elements) | `U`, `V`, `F` | Unvalidated, Validated, Failed. Use `U` as default. `ADVICE@pReportStatus` is plain CDATA in the DTD, so the DTD accepts any text there; this site's CF4 example still uses `U` ([KI-55](/known-issues#ki-55)). | [Dictionary p. 3](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=3) |
| `pIsApplicable` (`MENSHIST`, `MEDICINE`, `CBC`, `URINALYSIS`, `CHESTXRAY`, `SPUTUM`, `LIPIDPROF`, `FBS`, `ECG`, `FECALYSIS`) | `Y`, `N` | Whether the record applies (for `MENSHIST`: "If Patient Menstrual History Applicable") | DTD, [Dictionary p. 6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=6) |
| `pIsApplicable` (`PAPSSMEAR`, `OGTT`) | `Y`, `N`, `W` | `W` = waived (DTD 0.1.19) | DTD |
| `pDataCollection` (`SPUTUM`) | `1`, `2`, `3`, `X` | `X` = Not Applicable (DTD 0.1.17) | DTD |

CF4 dates use `YYYY-MM-DD`, unlike the eClaims `MM-DD-YYYY` ([KI-08](/known-issues#ki-08)). The medicine "no medicine" codes and the other CF4 library codes are on [CF4 libraries](/reference/libraries/cf4). Details: [CF4 XML](/reference/cf4-xml).

## Common mistakes

- **Lowercase or padded codes.** `y`, `n`, `"I "` or `Imaging` are rejected. Use the exact spelling.
- **Empty enumerated values.** Unlike CDATA attributes, an enumerated attribute can't be `""`. For laterality, use `N`.
- **Inventing a membership type** because Annex C says "Not limited to the following". The DTD accepts only the 8 codes.
- **Using the Annex C meaning of `pReasonCode="O"`.** It is "other reasons", not "incapacitated".
- **Mixing date formats between formats.** eClaims and eSOA use `MM-DD-YYYY`; CF4 uses `YYYY-MM-DD`.

## Related pages

- [eClaims XML](/reference/eclaims-xml): where each attribute goes
- [Document type codes](/reference/document-types)
- [eSOA XML](/reference/esoa-xml), [CF5 XML](/reference/cf5-xml), [CF4 XML](/reference/cf4-xml)
- [isClaimEligible](/api/is-claim-eligible), which uses the membership and patient codes
- [Known issues](/known-issues): [KI-05](/known-issues#ki-05), [KI-20](/known-issues#ki-20), [KI-32](/known-issues#ki-32), [KI-55](/known-issues#ki-55), [KI-62](/known-issues#ki-62), [KI-63](/known-issues#ki-63)
