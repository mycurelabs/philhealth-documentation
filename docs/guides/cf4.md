---
title: Building CF4
description: How to turn a patient's confinement record into a DTD-valid CF4 XML file, apply PhilHealth's default values and clinical rules, and attach it to a claim.
---

# Building CF4

<Badge type="tip" text="Current: CF4.dtd v1.20" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

CF4 (Claim Form 4) is the clinical summary of one hospital confinement: why the patient was admitted, what the doctor found, what was done in the ward, and which drugs were given. With the PhilHealth eClaims Web Service (PECWS) 3.0 you send it as an **XML file, encrypted with PhilHealth's public key and attached to the claim** with document type `CF4`. This guide explains what goes into the file, the fixed values you must hard-code, the clinical rules PhilHealth checks, and how to attach the result.

::: info Sources
- [`CF4.dtd`](/originals/cf4/CF4.dtd) ("EPCB Document Type Definition Version 1.20", last change 2019-02-26) and [`CF4.pdf`](/originals/cf4/CF4.pdf) (the same DTD printed, 2021-02-23)
- [CF4 Data Dictionary rev. 4 (Annex G, 2021-02-23), p. 1–20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)
- [CF4 files update (2021-02-23), p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1)
- [CF4 paper form (February 2020), p. 1–2](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)
- [SSVTF Annex A – CF4 Data Requirements](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf#page=1)
- [Software Solution Validation Test Form (SSVTF) rev. 20250217, p. 8–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14), p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)
- [Implementation Guide (rev. 20250217), Annex B p. 77–78 and Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)
- [CF4 library spreadsheets](/reference/libraries/cf4) (`cf4/libraries/*.xlsx`)
:::

## TL;DR: what you need to do

1. **Build one CF4 XML file per claim** with root `EPCB`, following `CF4.dtd`. Send **every** attribute (all 449 are required): the dictionary's [fixed defaults](#fixed-default-values), your patient's data, and `""` for everything else. Start from our [DTD-valid sample](/examples/cf4-sample.xml).
2. **Write dates as `YYYY-MM-DD`**, not the eClaims `MM-DD-YYYY`. `pEffYear` is just the year, for example `2026`.
3. **Enforce the clinical rules yourself:** blood pressure `1`/`1` (not available or not required) and `2`/`2` (palpatory), library IDs for signs, symptoms and findings, and the NOMED record when no drug was given.
4. **Validate the file locally** against `CF4.dtd`. PECWS has no CF4 validator.
5. **Encrypt it with PhilHealth's public key**, publish it at an HTTPS URL, and reference it in the claim as `DOCUMENT pDocumentType="CF4"`.
6. **Ask PhilHealth about the open points** in [KI-55](/known-issues#ki-55), such as the `pUsername` colon, the NOMED `pIsApplicable` value, several physical-exam findings for one body system, and the attributes the dictionary lists with a name only.

::: details Abbreviations used on this page
| Term | Meaning |
|---|---|
| DTD | Document Type Definition: the XML schema PhilHealth validates against |
| HIS / EMR | Hospital Information System / Electronic Medical Record: your system, the source of the CF4 data |
| HF | Health facility: the hospital or clinic that files the claim (PhilHealth's current term) |
| HCI | Health care institution: the former term for a health facility. The CF4 files still use it, for example in `pHciAccreNo` ([glossary](/getting-started/glossary#hci)) |
| AES, IV | Advanced Encryption Standard; initialization vector (the random starting block for AES-CBC) |
| NClaims Web | A PhilHealth application named in the SSVTF: CF4 data must be "displayed in the NClaims Web". The DevKit gives no further detail ([glossary](/getting-started/glossary#nclaims)). |
| ICD | International Classification of Diseases (diagnosis codes) |
| PE | Physical examination |
| PIN | PhilHealth Identification Number |
| SSVTF | Software Solution Validation Test Form, PhilHealth's certification checklist |
| EPCB | The primary-care benefit package whose DTD CF4 reuses (see below) |
| SOAP | The consultation part of the CF4 XML ("SOAP - Consultation"). Not expanded in the DevKit; in medical records it usually means Subjective, Objective, Assessment, Plan ([glossary](/getting-started/glossary)) |
| OB/GYN, LMP | Obstetric/gynecologic; last menstrual period |
| HEENT, CVS, GU (IE) | Head, eyes, ears, nose and throat; cardiovascular system; genitourinary (internal examination) |
| BP, HR, RR | Blood pressure, heart rate, respiratory rate |
| NCD | Non-communicable disease |
| RVS | Relative Value Scale (procedure codes) |
| HAMA/DAMA | Home / discharged against medical advice |
| RTH | Return To Hospital |
| NOMED | The library code for "no medicine given" |

More terms: [Glossary](/getting-started/glossary).
:::

::: warning Old material, still required
The CF4 files are the oldest part of the DevKit: the DTD dates from 2019, the data dictionary and update note from 2021, and the paper form from February 2020. They are still the newest CF4 files in the DevKit, and the 2025 certification form still requires the CF4 module ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)). See [KI-08](/known-issues#ki-08). The dictionary and the DTD disagree in places, and several rules are missing ([KI-55](/known-issues#ki-55)).
:::

## What CF4 is

The paper CF4 (February 2020) has seven parts ([form p. 1–2](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)):

| Part | Content |
|---|---|
| I. Health Care Institution (HCI) information | Name, accreditation number, address of the hospital |
| II. Patient's data | Name, PhilHealth Identification Number (PIN), age, sex, chief complaint, admitting and discharge diagnosis, case rate codes, admission and discharge date/time |
| III. Reason for admission | History of present illness, past medical history, OB/GYN history, signs and symptoms (tick boxes), referral, physical examination on admission |
| IV. Course in the ward | Dated doctor's orders/actions; surgical procedure/RVS code |
| V. Drugs/medicines | Generic name, quantity/dosage/route/frequency, total cost |
| VI. Outcome of treatment | Improved, recovered, HAMA/DAMA, expired, absconded, transferred |
| VII. Certification | Signature of the attending health care professional |

The form's reminders say it "should be filed within sixty (60) calendar days from date of discharge" and that "claim forms with incomplete information shall not be processed" ([form p. 1](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)). The CF5 form gives 30 days instead, and the Implementation Guide sets no deadline for the upload itself ([KI-58](/known-issues#ki-58)).

In an electronic claim, CF4 is **not** part of the eClaims upload XML. It is a separate XML file that you encrypt and attach, just like a scanned PDF. The attachment guideline uses it as its example: supporting documents "must be in PDF (e.g., scanned Claim Signature Form (CSF)) or XML format (e.g., Claim Form 4 (CF4))" ([guideline p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)).

## How CF4 fits into a claim

```text
 HIS / EMR data
      |
      v
 1. Build CF4 XML (root <EPCB>, CF4.dtd) ---- 2. Validate locally against CF4.dtd
      |
      v
 3. Encrypt the file with PhilHealth's PUBLIC KEY  -> JSON {docMimeType, hash, key1, key2, iv, doc}
      |
      v
 4. Host the encrypted file at an HTTPS URL
      |
      v
 5. eClaims XML:  <DOCUMENT pDocumentType="CF4" pDocumentURL="https://..."/>
      |
      v
 6. eClaimsFileCheck on the final eClaims XML, then uploadeClaims
    ->  PhilHealth downloads, decrypts, shows CF4 in NClaims Web
```

1. **Capture** the CF4 data in your system (the required list is in [SSVTF Annex A](#required-data-and-where-it-goes)).
2. **Generate** the CF4 XML following `CF4.dtd`. SSVTF Part II checks "Does the system successfully generate the CF4 in XML format?" ([SSVTF p. 10](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)).
3. **Validate** it against `CF4.dtd` on your side. Unlike eSOA (`validateeSOA`) and CF5 (`validateCF5`), PECWS has **no CF4 validation method**, and the DevKit has no official CF4 sample, so a local DTD check is your only automated safety net ([KI-55](/known-issues#ki-55)). See [Validate locally](#validate-locally).
4. **Encrypt** the XML file with the **attachment scheme** (random AES key protected by PhilHealth's public key), not with your cipher key. See [Encrypting attachments](/guides/encryption/attachments).
5. **Publish** the encrypted file at a URL PhilHealth can reach over HTTPS. Annex C describes `pDocumentURL` as the "URL of the document accessible via https" and says "the document must first be encrypted using philhealth public key before publishing online" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)).
6. **Reference** it from the claim with document type `CF4` ([Annex B, Guide p. 77](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)). Once every attachment URL is live, check the final eClaims XML with [`eClaimsFileCheck`](/api/eclaims-file-check) and upload it with [`uploadeClaims`](/api/upload-eclaims). This is the site's recommended order, not PhilHealth's; the full order is in [Submitting a claim](/guides/submitting-a-claim). SSVTF checks that the system can "upload and attach the encrypted CF4 XML data to the claim" and that "the CF4 data [is] successfully displayed in the NClaims Web" ([SSVTF p. 10–11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)).

::: danger Use the public key, not the cipher key
Your cipher key encrypts API request bodies. Attachments such as CF4 use PhilHealth's public key, so only PhilHealth can decrypt them. Mixing the two up is easy ([KI-12](/known-issues#ki-12)). The public key bundled with the DevKit is an **expired test certificate** ([KI-01](/known-issues#ki-01)); get the current one from PhilHealth.
:::

## The key idea: CF4 borrows the primary-care (EPCB) DTD

`CF4.dtd` is not a CF4-specific schema. Its header reads "EPCB Document Type Definition Version 1.20", and its root element is `EPCB`. The DevKit never expands "EPCB". Outside the DevKit, the name commonly refers to PhilHealth's Expanded Primary Care Benefit package; see the [glossary](/getting-started/glossary#epcb). The DTD's version history lists the `pPackageType` values "P - PCB1" and "A - CF4" (history 0.1.9) and "E - for EPCB" (history 0.1.15) ([`CF4.dtd`](/originals/cf4/CF4.dtd)), and the dictionary's section names are primary-care terms: "ENLISTMENT - Registration", "PROFILING - Health Screening & Assessment", "SOAP - Consultation". So the schema describes things you never see in a hospital claim: enlistment, health screening, SOAP consultations, an NCD questionnaire, and ten laboratory tests.

Two DTD facts make this matter:

- **Every one of the 449 attributes is `#REQUIRED`.** If an attribute is missing, validation fails, even if the attribute has nothing to do with CF4.
- **Every section is mandatory.** The root content model is `(ENLISTMENTS, PROFILING, SOAPS, COURSEWARDS, LABRESULTS, MEDICINES)`, in this order, and each container needs at least one child (`+`). A patient who received no medicine still needs a `MEDICINE` element (see [No medicine](#no-medicine-nomed)).

The data dictionary resolves this by sorting every attribute into one of three groups:

| Group | How to recognize it in the dictionary | What you send |
|---|---|---|
| **CF4 data** | Highlighted row with a real description, e.g. `pChiefComplaint` "Patient Chief Complaint" | The patient's actual data |
| **Fixed default** | Description says "Not part of the CF4, but requirement for XML Validation" and names a default | The fixed value in the [table below](#fixed-default-values) |
| **Blank row** | Only the attribute name; no type, size, or description | Recommendation (not from PhilHealth): an empty string `""`. The DTD only requires that the attribute is present. The DevKit gives no guidance for these attributes ([KI-55](/known-issues#ki-55)). |

::: tip Recommendation (not from PhilHealth)
Build CF4 from a complete template, not from scratch. Start with every element and attribute the DTD requires, pre-filled with the defaults and empty strings, then overwrite only the CF4 fields. Our [DTD-valid sample](/examples/cf4-sample.xml) is such a template. The [CF4 XML reference](/reference/cf4-xml) lists every attribute and its group.
:::

`CF4.pdf` is the same DTD printed as a PDF. We compared the two word by word; the only differences are line breaks where long lines wrap in the PDF.

## Fixed default values

These are every value the data dictionary tells you to hard-code because the field is "not part of the CF4, but requirement for XML Validation" ([dictionary p. 1–20](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)).

| Element | Attribute | Value | Meaning (dictionary wording) | Dict. page |
|---|---|---|---|---|
| `ENLISTMENT` | `pEffYear` | current year, e.g. `2026` | "Use the current year" (see [KI-38](/known-issues#ki-38)) | 1 |
| `ENLISTMENT` | `pEnlistStat` | `1` | "Active" | 1 |
| `ENLISTMENT` | `pPackageType` | `A` | "All Case Rate" (the DTD history says "A - CF4"; [KI-55](/known-issues#ki-55)) | 1 |
| `ENLISTMENT` | `pPatientContactno` | `NA` | "Not Available" | 2 |
| `ENLISTMENT` | `pCivilStatus` | `U` | "Unspecified" | 2 |
| `ENLISTMENT` | `pWithConsent` | `X` | "Not Applicable" | 2 |
| `ENLISTMENT` | `pWithLoa` | `X` | "Not Applicable" | 2 |
| `ENLISTMENT` | `pWithDisability` | `X` | "Not Applicable" | 2 |
| `ENLISTMENT` | `pDependentType` | `X` | "Not Applicable" | 3 |
| `ENLISTMENT` | `pAvailFreeService` | `X` | "Not Applicable" (in the description; the DEFAULT column is empty, [KI-55](/known-issues#ki-55)) | 3 |
| `PROFILE` | `pProfileATC` | `CF4` | "Use "CF4" as default value" | 3 |
| `SOAP` | `pEffYear` | current year | "Use the current year" | 9 |
| `SOAP` | `pSoapATC` | `CF4` | "Use "CF4" as default value" | 10 |
| `ADVICE` | `pRemarks` | `NA` | "Not applicable" | 10 |
| `DIAGNOSTIC` | `pDiagnosticId` | `0` | "Not applicable from the library" | 10 |
| `ICDS` | `pIcdCode` | `000` | "Essentially well individual" (see the warning below) | 10 |
| `MANAGEMENT` | `pManagementId` | `0` | "Not applicable" | 10 |
| `MEDICINE` | `pModule` | `CF4` | "Use "CF4" … as default value" (VALID VALUES lists only `HAS` and `SOAP`; [KI-55](/known-issues#ki-55)) | 14 |
| `CBC`, `URINALYSIS`, `CHESTXRAY`, `SPUTUM`, `LIPIDPROF`, `FBS`, `ECG`, `FECALYSIS`, `PAPSSMEAR`, `OGTT` | `pIsApplicable` | `N` | "No" | 15–20 |
| `SPUTUM` | `pDataCollection` | `X` | "Not Applicable" | 17 |
| **every element that has it** (36 elements) | `pReportStatus` | `U` | "Unvalidated" | 3–20 |

`PROFILE@pEffYear` ("Effectivity Year", VARCHAR2(4)) has no default note and no format ([KI-55](/known-issues#ki-55)). **Recommendation (not from PhilHealth):** it is the same kind of field, so send the same four-digit year.

::: warning pIcdCode: 000 or 0000?
<Badge type="warning" text="Conflicting sources" />

The dictionary's description says `Use "000" – Essentially well individual from the library`, but its DEFAULT column says `0000` ([dictionary p. 10](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)). The ICD library contains `000` "Essentially Well Individual" and no `0000` ([`lib_icd.xlsx`](/originals/cf4/libraries/lib_icd.xlsx), last row). **We recommend `000`** because it matches both the description and the library. Confirm with PhilHealth ([KI-55](/known-issues#ki-55)).

`pIcdCode` is a fixed default, not the patient's diagnosis. Even when `lib_icd` lists the real code (our sample claim's dengue diagnosis `A90` is in it), the dictionary says to send `000`. The diagnosis goes in the eClaims XML.
:::

`pUsername` and `pCertificationId` on the root are not defaults, but they are the same for every file your software produces: the dictionary says "Use the EClaims Software Certificate ID" for both ([dictionary p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)).

::: warning Certificate ID: with or without the colon?
For the eClaims upload XML, `eCLAIMS@pUserName` must be `":" + certificate ID` (revision 20241111; [KI-03](/known-issues#ki-03)). The CF4 dictionary (2021) predates that rule and only says to use the certificate ID. The DevKit does not say whether the colon also applies to `EPCB@pUsername` ([KI-55](/known-issues#ki-55)). Our sample uses the plain certificate ID (`pUsername="SAMPLE-CERT-ID"`), as the CF4 dictionary says, while the matching eClaims XML uses `pUserName=":SAMPLE-CERT-ID"`. Confirm with PhilHealth. Note the different spelling as well: CF4 uses `pUsername`, eClaims uses `pUserName`.
:::

## Required data and where it goes

SSVTF Annex A lists the CF4 data your system must capture. Its closing note says "Other data elements of CF4 not listed above shall be sourced from CF1/CF2 data" ([SSVTF Annex A](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf#page=1)). The table maps each paper-form item to the XML. The "SSVTF Annex A" column marks items on the required list.

| Paper form item | SSVTF Annex A | XML (`element@attribute`) | Notes |
|---|---|---|---|
| I.1 Name of HCI | Yes | *none* | The EPCB DTD has no attribute for it. See the warning below. |
| I.2 Accreditation number | Yes | `EPCB@pHciAccreNo` | VARCHAR2(9) |
| I.3 Address of HCI | Yes | *none* | No attribute. See the warning below. |
| II.1 Name of patient | Yes | `ENLISTMENT@pPatientLname`, `@pPatientFname`, `@pPatientMname`, `@pPatientExtname` | 30 characters each; first and last name required |
| II.2 PIN | Yes | `ENLISTMENT@pPatientPin`, `PROFILE@pPatientPin`, `SOAP@pPatientPin` | Member's PIN if patient type is `MM`; dependent's PIN if `DD`; member's PIN if the dependent has none |
| II.3 Age | Yes | *derived from* `ENLISTMENT@pPatientDob` | `OINFO@pPatientAge` exists but is a blank row in the dictionary |
| II.4 Sex | Yes | `ENLISTMENT@pPatientSex` | `M` or `F` |
| II.5 Chief complaint | Yes | `SUBJECTIVE@pChiefComplaint` | Free text, up to 2000 |
| II.6–7 Admitting / discharge diagnosis | No | *none in CF4* (`SOAP/ICDS@pIcdCode` is a fixed default) | eClaims XML: `CF2/DIAGNOSIS@pAdmissionDiagnosis`, `DISCHARGE@pDischargeDiagnosis`, `ICDCODE@pICDCode` |
| II.8 Case rate codes | No | *none* | eClaims XML: `ALLCASERATE/CASERATE@pCaseRateCode` |
| II.9 Date admitted | No | `ENLISTMENT@pEnlistDate`, `PROFILE@pProfDate`, `SOAP@pSoapDate` | All three are "Date of Admission", `YYYY-MM-DD` |
| II.9–10 Time admitted, date/time discharged | No | *none* | eClaims XML: `CF2@pAdmissionTime`, `@pDischargeDate`, `@pDischargeTime` |
| III.1 History of present illness | Yes | `SUBJECTIVE@pIllnessHistory` | Free text, up to 2000 |
| III.2.a Pertinent past medical history | Yes | `MHSPECIFIC@pSpecificDesc` | Free text, up to 2000 |
| III.2.b OB/GYN history (OB score) | Yes | `MENSHIST@pIsApplicable`, `@pLastMensPeriod`; `PREGHIST@pPregCnt`, `@pDeliveryCnt`, `@pFullTermCnt`, `@pPrematureCnt`, `@pAbortionCnt`, `@pLivChildrenCnt` | See [History](#past-medical-and-ob-gyn-history) |
| III.3 Pertinent signs and symptoms | Yes | `SUBJECTIVE@pSignsSymptoms` (+ `@pPainSite`, `@pOtherComplaint`) | IDs from `lib_chief_complaint`, separated by `;` |
| III.4 Referred from another HCI | No | *none* | eClaims XML: `CF2@pPatientReferred`, `@pReferredIHCPAccreCode` |
| III.5 General survey | Yes | `PEGENSURVEY@pGenSurveyId`, `@pGenSurveyRem` | `1` awake and alert, `2` altered sensorium |
| III.5 Vital signs, height, weight | Yes | `PEPERT@pSystolic`, `@pDiastolic`, `@pHr`, `@pRr`, `@pTemp`, `@pHeight`, `@pWeight` | See [Vital signs](#vital-signs-and-blood-pressure) |
| III.5 HEENT, chest/lungs, CVS, abdomen, GU (IE), skin/extremities, neuro | Yes | `PEMISC@pHeentId`, `@pChestId`, `@pHeartId`, `@pAbdomenId`, `@pGuId`, `@pSkinId`, `@pNeuroId`; "Others" text in `PESPECIFIC@p…Rem` | See [Physical examination](#physical-examination-findings) |
| IV Course in the ward: date, doctor's order/action | Yes | `COURSEWARD@pDateAction`, `@pDoctorsAction` | One `COURSEWARD` per row |
| IV Surgical procedure/RVS code | No | *none* | eClaims XML: `DISCHARGE/RVSCODES@pRVSCode` |
| V Drugs/medicines | Yes | `MEDICINE@pDrugCode` (+ component codes) or `@pGenericName`; `@pRoute`, `@pInstructionFrequency`, `@pQuantity`, `@pTotalAmtPrice` | See [Drugs and medicines](#drugs-and-medicines) |
| VI Outcome of treatment | No | *none* | eClaims XML: `CF2@pDisposition` |

The eClaims XML column is our pointer to where related data lives in [`eClaimsDef.dtd`](/reference/eclaims-xml); the DevKit itself only says "sourced from CF1/CF2 data".

::: warning Gap: HCI name and address have no XML field
SSVTF Annex A requires "Name of HCI" and "Address of HCI", but the EPCB DTD only has `EPCB@pHciAccreNo`, and the data dictionary gives no attribute for a name or address. Likewise, "Age" has no attribute of its own (`OINFO@pPatientAge` is a blank row). Capture these in your system (SSVTF checks that the system captures Annex A data), and send what the DTD allows. The DevKit doesn't say how PhilHealth gets the HCI name and address for CF4; confirm with PhilHealth ([KI-55](/known-issues#ki-55)).
:::

## Rules you must enforce

### Dates use `YYYY-MM-DD`

Every CF4 date (`pEnlistDate`, `pPatientDob`, `pTransDate`, `pProfDate`, `pSoapDate`, `pLastMensPeriod`, `pDateAction`, `pDateAdded`) uses the dictionary's FORMAT `YYYY-MM-DD`. This is **different from the eClaims XML and the API**, which use `MM-DD-YYYY` ([KI-08](/known-issues#ki-08)).

```text
CF4 XML      ENLISTMENT pEnlistDate="2026-09-15"   (YYYY-MM-DD)
eClaims XML  CF2 pAdmissionDate="09-15-2026"       (MM-DD-YYYY)
```

`pEffYear` is the exception: it is VARCHAR2(4) ("Use the current year"), but its FORMAT column says `YYYY-MM-DD` ([KI-38](/known-issues#ki-38)). A full date doesn't fit in four characters, so send the year only, for example `2026`.

### Identifiers that tie the file together

- `pHciCaseNo` is the "Reference Number per CF4 Record" and `pHciTransNo` must have the **same value** ([dictionary p. 1](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1)). Repeat the same pair on `PROFILE`, `SOAP`, `COURSEWARD` and `MEDICINE` ("Must be the same value with the pHciCaseNo in Enlistment"). Each is VARCHAR2(21).
- `ENLISTMENT@pEClaimId` is the "Claim ID Number that will came from the Service Provider's system" and `@pEClaimsTransmittalId` the "HCI Eclaims Transmittal ID Number that is generated by the Service Provider's System" (both 21 characters). **Recommendation (not from PhilHealth):** reuse the values you put in the eClaims XML's `CLAIM@pClaimNumber` and `eTRANSMITTAL@pHospitalTransmittalNo`, so CF4 and claim can be matched. Our sample does this: `pEClaimId="202609170001"` and `pEClaimsTransmittalId="TR20260917001"`.
- `pPatientType` is `MM` (member), `DD` (dependent) or `NM` (non-member).

::: warning Attribute casing: dictionary vs DTD
The dictionary spells `pEClaimID` and `pEClaimsTransmittalID` (capital `ID`); the DTD spells `pEClaimId` and `pEClaimsTransmittalId`. XML is case-sensitive and the DTD wins, so use **`pEClaimId`** and **`pEClaimsTransmittalId`** ([KI-55](/known-issues#ki-55)).
:::

### Vital signs and blood pressure

The dictionary's `PEPERT` rules ([p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)):

| Attribute | Rule |
|---|---|
| `pSystolic`, `pDiastolic` | mmHg. "Definite value required for Patient from age three years old and above." Use `1` for both when "BP are not available or not required", and `2` for palpatory patients. |
| `pHr` | Heart rate per minute. Maximum 3 characters; decimals not acceptable. |
| `pRr` | Respiratory rate per minute. Maximum 3 characters; decimals not acceptable. |
| `pTemp` | Temperature in Celsius. Maximum 4 characters (e.g. `38.9`). |
| `pHeight` | Height in centimeters. Maximum 6 characters. Required since rev. 4. |
| `pWeight` | Weight in kilograms. Maximum 6 characters. Required since rev. 4. |

The 2025 certification form tests the same blood pressure rule: "Does the system allow '1' as a value for Systolic and Diastolic (1/1) for patients where BP is not available or required, and '2' for palpatory (2/2)?" ([SSVTF p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).

| Situation | `pSystolic` / `pDiastolic` |
|---|---|
| Patient aged 3 years or older, BP measured | the real values, e.g. `120` / `80` |
| Patient younger than 3 years (BP not required) | `1` / `1` |
| BP not available | `1` / `1` |
| BP taken by palpation | `2` / `2` |

```python
from datetime import date

def age_on(dob: date, day: date) -> int:
    return day.year - dob.year - ((day.month, day.day) < (dob.month, dob.day))

def bp_values(dob, admitted, systolic=None, diastolic=None, palpatory=False, bp_available=True):
    """(pSystolic, pDiastolic) per CF4 dictionary rev. 4 p. 10-11 and SSVTF p. 8. Unofficial helper."""
    if palpatory:
        return "2", "2"                      # palpatory BP
    if age_on(dob, admitted) < 3 or not bp_available:
        return "1", "1"                      # BP not required / not available
    if systolic is None or diastolic is None:
        raise ValueError("BP is required for patients aged 3 years and above")
    return str(int(systolic)), str(int(diastolic))
```

`PEPERT` appears twice in the DTD: once in `PROFILE` and once in `SOAP`. The dictionary describes it once. **Recommendation (not from PhilHealth):** send identical values in both.

The DevKit doesn't say on which date to compute the age ([KI-55](/known-issues#ki-55)). **Recommendation (not from PhilHealth):** use the admission date, as the helper above does.

::: info The 1/1 and 2/2 rule is not new in 2025
The `1` and `2` values are already in data dictionary rev. 4 (2021-02-23), in the `pSystolic` and `pDiastolic` rows ([p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)). They are printed in italics, like the rev. 4 changes that the files update note lists, although the update note itself doesn't mention them. The 2025 SSVTF didn't add the rule; it turned it into a certification check. The same is true for the NOMED codes below, which are in the dictionary ([p. 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13)) and the 2021 update note. See [KI-08](/known-issues#ki-08).
:::

### Signs and symptoms

- `SUBJECTIVE@pSignsSymptoms` holds **IDs** from [`lib_chief_complaint.xlsx`](/reference/libraries/cf4#signs-and-symptoms-lib-chief-complaint), not text. "For multiple entries: use semi-colon ";" as delimiter". Our sample sends `3;18;26;37` (anorexia, headache, myalgia, fever).
- Despite the file name, `lib_chief_complaint` feeds the **signs and symptoms** tick boxes (form III.3). The chief complaint itself (`pChiefComplaint`) is free text.
- If `38` (PAIN) is ticked, fill `pPainSite` ("Required if Pain Element … is checked", up to 500 characters).
- If `X` (OTHERS) is included, fill `pOtherComplaint` ("Required if Symptoms ID == "X" is included in the value of pSignsSymptoms").
- `pChiefComplaint` and `pIllnessHistory` must not be `none`, `NA`, `not applicable` or `N/A` ([dictionary p. 12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12)).
- Use only IDs whose LIBRARY STATUS is `1` ("Only with active library status shall be used").

### Physical examination findings

Each system on the form has an ID attribute in `PEMISC` (a code from a library) and a remark attribute in `PESPECIFIC` (free text for "Others"):

| Form section | ID attribute | Library | "Essentially normal" ID | "Others" ID | Remark attribute |
|---|---|---|---|---|---|
| HEENT | `pHeentId` | `lib_heent` | `11` | `99` | `pHeentRem` |
| Chest/lungs | `pChestId` | `lib_chest` | `6` | `99` | `pChestRem` |
| CVS | `pHeartId` | `lib_heart` | `5` | `99` | `pHeartRem` |
| Abdomen | `pAbdomenId` | `lib_abdomen` | `7` | `99` | `pAbdomenRem` |
| GU (IE) | `pGuId` | `lib_genitourinary` | `1` | `99` | `pGuRem` |
| Skin/extremities | `pSkinId` | `lib_skin` | `1` | `99` | `pSkinRem` |
| Neuro-exam | `pNeuroId` | `lib_neuro` | `6` | `99` | `pNeuroRem` |
| *(rectal)* | `pRectalId` | *none* | – | – | `pRectalRem` |

Rules from the dictionary ([p. 7–8, 11–12](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=7)):

- If a system's ID is "Essentially Normal", "other choices must be disabled". In your UI, selecting "Essentially normal" should clear and lock the other findings for that system.
- A remark (`p…Rem`, up to 2000 characters) is "Required if … Description ID Value == "Others"", and "none", "NA", "not applicable" or "N/A" are not acceptable.
- `pRectalId` and `pRectalRem` are blank rows: the CF4 form has no rectal section. Send `""`.
- General survey (`PEGENSURVEY@pGenSurveyId`): `1` "Awake and Alert" or `2` "Altered Sensorium"; `pGenSurveyRem` holds remarks when it is `2`.

::: warning Gap: several findings for one system (KI-55)
The form lets the doctor tick several findings per system (for example "Icteric sclerae" and "Pale conjunctivae" under HEENT). Each `PEMISC` attribute holds one 3-character ID, and the DTD allows several `PEMISC` elements (`PEMISC+`). So several findings need several `PEMISC` elements, but the DevKit doesn't say what to put in the other seven ID attributes of each extra element (an empty string, or a repeat). Confirm with PhilHealth before you rely on either approach ([KI-55](/known-issues#ki-55)).
:::

### Past medical and OB/GYN history

- **Past medical history** goes into `MHSPECIFIC@pSpecificDesc` (required, up to 2000 characters, not "none"/"NA"/"not applicable"/"N/A"). `MEDHIST@pMdiseaseCode` and `MHSPECIFIC@pMdiseaseCode` are blank rows. The DevKit doesn't say what to write when a patient truly has no past medical history; confirm with PhilHealth ([KI-55](/known-issues#ki-55)).
- **OB/GYN history** (female patients): set `MENSHIST@pIsApplicable` to `Y` ("If Patient Menstrual History Applicable") and fill:

  | Form (OB score and LMP) | Attribute | Format |
  |---|---|---|
  | G (gravidity) | `PREGHIST@pPregCnt` | number 0–99 |
  | P (parity) | `PREGHIST@pDeliveryCnt` | number 0–99 |
  | full term | `PREGHIST@pFullTermCnt` | number 0–99 |
  | premature | `PREGHIST@pPrematureCnt` | number 0–99 |
  | abortion | `PREGHIST@pAbortionCnt` | number 0–99 |
  | living children | `PREGHIST@pLivChildrenCnt` | number 0–99 |
  | LMP | `MENSHIST@pLastMensPeriod` | `YYYY-MM-DD` |

  The dictionary marks these "Required only if value of pIsApplicable in MENSHIST is == "Y"" ([p. 5–6](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=5)). Matching the four bracketed numbers of the form's `G _ P _ (_-_-_-_)` to full term, premature, abortion and living children is our reading of the field names.
- **Male patients, or the form's "NA" box.** Recommendation (not from PhilHealth): send `MENSHIST@pIsApplicable="N"`. Matching the form's "NA" box to `N` is our reading; the dictionary only says the fields are required when the value is `Y`, and doesn't say what they hold otherwise ([KI-55](/known-issues#ki-55)). The attributes still have to be present, so send them as `""`.

### Course in the ward

One `COURSEWARD` per dated entry: `pDateAction` ("Date when Doctor took an action", `YYYY-MM-DD`) and `pDoctorsAction` ("Action/Order by Doctor", up to 2000 characters) ([dictionary p. 14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=14)). The DTD requires at least one.

### Drugs and medicines

For each drug given, add one `MEDICINE` ([dictionary p. 12–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=12)):

| Attribute | What to put |
|---|---|
| `pDrugCode` | The 30-character "Complete Drug Code" from [`lib_medicine.xlsx`](/reference/libraries/cf4#drug-code-composition) |
| `pGenericCode`, `pSaltCode`, `pStrengthCode`, `pFormCode`, `pUnitCode`, `pPackageCode` | The drug's component codes (5 characters each), copied from the same `lib_medicine` row |
| `pGenericName` | "Complete Drug Description, if Medicine not listed on the library (GenericName/Salt/Strength/Form/Unit/Package)", up to 500 characters |
| `pRoute` | "Medicine Route", free text up to 500 characters (e.g. `IV`) |
| `pInstructionFrequency` | "Frequency of Medicine per Instruction", up to 50 characters |
| `pQuantity` | "Number of Medicines Prescribed" |
| `pTotalAmtPrice` | "Total Amount Price of Medicine Issued" |
| `pIsApplicable` | `Y` ("If Medicine Applicable") |
| `pDateAdded` | "Date the record was added", `YYYY-MM-DD` |
| `pModule` | `CF4` (fixed default) |
| `pActualUnitPrice`, `pCoPayment`, `pInstructionQuantity`, `pInstructionStrength`, `pPrescPhysician` | blank rows: `""` |

SSVTF Annex A asks for a "Complete Drug Description (allow user to encode drug if not listed on the library)", plus route, frequency, quantity and total amount price. For a drug **not** in the library, type the full description into `pGenericName`. The DevKit doesn't say what to put in `pDrugCode` and the component codes in that case (the dictionary marks them "N", not required); confirm with PhilHealth ([KI-55](/known-issues#ki-55)).

::: tip Recommendation (not from PhilHealth)
For a library drug, our sample also copies the library's Drug Description into `pGenericName`. The dictionary only requires it for unlisted drugs, but it makes the file readable to humans. Drop it if PhilHealth tells you otherwise.
:::

### No medicine (NOMED)

`MEDICINES` must contain at least one `MEDICINE`, so a confinement without drugs needs a placeholder record. The values come from the files update note and the dictionary ([update p. 1](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf#page=1); [dictionary p. 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13)):

| Attribute | Value | Source |
|---|---|---|
| `pDrugCode` | `NOMED0000000000000000000000000` (NOMED + 25 zeros = 30 characters) | update note, dictionary |
| `pGenericCode` | `NOMED` | update note, dictionary |
| `pSaltCode`, `pStrengthCode`, `pFormCode`, `pUnitCode`, `pPackageCode` | `00000` | update note, dictionary |
| `pRoute` | `-` | update note, dictionary |
| `pInstructionFrequency` | `-` | update note, dictionary |
| `pQuantity` | `0` | dictionary only |
| `pTotalAmtPrice` | `0.00` | dictionary only |

In `lib_medicine.xlsx` the NOMED row reads "DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE". SSVTF checks "Does the system support the additional library code for no medicine record?" ([SSVTF p. 8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)).

```xml
<MEDICINES>
  <MEDICINE pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
            pDrugCode="NOMED0000000000000000000000000"
            pGenericName="DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE"
            pGenericCode="NOMED" pSaltCode="00000" pStrengthCode="00000" pFormCode="00000"
            pUnitCode="00000" pPackageCode="00000" pRoute="-" pQuantity="0"
            pActualUnitPrice="" pCoPayment="" pTotalAmtPrice="0.00"
            pInstructionQuantity="" pInstructionStrength="" pInstructionFrequency="-"
            pPrescPhysician="" pIsApplicable="N" pDateAdded="2026-09-15" pModule="CF4"
            pReportStatus="U" pDeficiencyRemarks=""/>
</MEDICINES>
```

::: warning Not specified: `pIsApplicable` and `pGenericName` for NOMED
Neither the update note nor the dictionary says which `pIsApplicable` value (`Y` or `N`) goes with the NOMED record, or whether `pGenericName` should be filled. We use `N` ("medicine not applicable") and the library description. Both choices pass the DTD; confirm with PhilHealth. Also note that the update note's no-medicine rules cover only the codes, `pRoute` and `pInstructionFrequency`; `pQuantity="0"` and `pTotalAmtPrice="0.00"` appear only in the dictionary. See [KI-55](/known-issues#ki-55).
:::

## Example

The complete, DTD-valid example is [`cf4-sample.xml`](/examples/cf4-sample.xml). It is **unofficial** (PhilHealth publishes no CF4 sample in the DevKit) and uses fictitious identifiers. We validated it, and the NOMED variant, against `CF4.dtd` with lxml.

It describes the same stay as the site's other example files, such as [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml):

| Item | Value in `cf4-sample.xml` |
|---|---|
| Facility accreditation number | `EPCB@pHciAccreNo="H12345678"` |
| Software certificate ID | `EPCB@pUsername` and `@pCertificationId` = `SAMPLE-CERT-ID` (no colon; see above) |
| Claim and transmittal numbers | `ENLISTMENT@pEClaimId="202609170001"`, `@pEClaimsTransmittalId="TR20260917001"` |
| CF4 record number | `pHciCaseNo` = `pHciTransNo` = `CF4-202609170001` on `ENLISTMENT`, `PROFILE`, `SOAP`, `COURSEWARD` and `MEDICINE` (our own format; the lab-result copies are blank rows, sent as `""`) |
| Patient (the member) | JUAN OCAMPO DELA CRUZ, PIN `072007271094`, male, born `1973-09-19`, `pPatientType="MM"` |
| Stay | admitted `2026-09-15`, discharged `2026-09-17` (three `COURSEWARD` entries) |
| Clinical content | fever for 3 days; dengue fever without warning signs (the ICD-10 code `A90` is in the eClaims XML, not in CF4) |
| Drugs | 0.9% sodium chloride 1 L (IV), paracetamol 500 mg tablets and omeprazole 40 mg capsules: the same drug codes, quantities and totals as the drugs in [`esoa-sample.xml`](/examples/esoa-sample.xml). The NOMED alternative is in a comment. |

The CF4-specific parts look like this (defaults and empty attributes shortened with `…`; see the full file):

```xml
<SOAP pHciTransNo="CF4-202609170001" pHciCaseNo="CF4-202609170001"
      pPatientPin="072007271094" pPatientType="MM" pMemPin=""
      pSoapDate="2026-09-15" pEffYear="2026" pSoapATC="CF4"
      pReportStatus="U" pDeficiencyRemarks="">
  <SUBJECTIVE pChiefComplaint="FEVER FOR 3 DAYS"
              pIllnessHistory="3 DAYS PRIOR TO ADMISSION, PATIENT HAD HIGH-GRADE FEVER …"
              pOtherComplaint="" pSignsSymptoms="3;18;26;37" pPainSite=""
              pReportStatus="U" pDeficiencyRemarks=""/>
  <PEPERT pSystolic="120" pDiastolic="80" pHr="96" pRr="20" pTemp="38.9"
          pHeight="168" pWeight="70.5" pVision="" pLength="" pHeadCirc=""
          pReportStatus="U" pDeficiencyRemarks=""/>
  <PEMISC pSkinId="9" pHeentId="11" pChestId="6" pHeartId="5" pAbdomenId="7"
          pNeuroId="6" pGuId="1" pRectalId="" pReportStatus="U" pDeficiencyRemarks=""/>
  …
  <ICDS pIcdCode="000" pReportStatus="U" pDeficiencyRemarks=""/>
  …
</SOAP>
…
<MEDICINE pHciCaseNo="CF4-202609170001" pHciTransNo="CF4-202609170001"
          pDrugCode="PARAC0000000047TAB490000000000"
          pGenericName="PARACETAMOL 500 mg TABLET"
          pGenericCode="PARAC" pSaltCode="00000" pStrengthCode="00047" pFormCode="TAB49"
          pUnitCode="00000" pPackageCode="00000" pRoute="ORAL" pQuantity="20"
          pActualUnitPrice="" pCoPayment="" pTotalAmtPrice="200.00"
          pInstructionQuantity="" pInstructionStrength=""
          pInstructionFrequency="EVERY 4 HOURS AS NEEDED FOR FEVER"
          pPrescPhysician="" pIsApplicable="Y" pDateAdded="2026-09-15" pModule="CF4"
          pReportStatus="U" pDeficiencyRemarks=""/>
```

## Validate locally

Validate every CF4 file against `CF4.dtd` before you encrypt it. The DevKit gives no `DOCTYPE` declaration for CF4 files (our sample has none), so pass the DTD to the validator explicitly.

Download [`CF4.dtd`](/originals/cf4/CF4.dtd) and [`cf4-sample.xml`](/examples/cf4-sample.xml) (or your own file) into one folder, then run one of these there:

::: code-group
```python [Python (lxml)]
from lxml import etree

dtd = etree.DTD(open("CF4.dtd", "rb"))
doc = etree.parse("cf4-sample.xml")
if dtd.validate(doc):
    print("valid")
else:
    for err in dtd.error_log.filter_from_errors():
        print(err.line, err.message)
```
```bash [xmllint]
xmllint --noout --dtdvalid CF4.dtd cf4-sample.xml
```
:::

`CF4.dtd` has no non-deterministic content models, so libxml2-based tools (lxml, xmllint) check it fully. The eClaims DTD problem in [KI-43](/known-issues#ki-43) doesn't apply here.

A DTD check catches missing attributes, wrong element order, missing sections, and values outside enumerations (such as `pPatientSex`). It does **not** check lengths, date formats, library codes, or the clinical rules above. Add your own checks for those. See [Validating XML locally](/guides/validating-xml).

## Encrypt and attach

1. Compute the SHA-256 hash of the CF4 file bytes. Encrypt the file with AES-256-CBC using a random 32-byte password (two random 16-byte halves) and a random 16-byte IV. Encrypt each password half and the IV with PhilHealth's public key, and Base64-encode everything into one JSON object ([guideline p. 1–2](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). The guideline doesn't name the RSA padding; both demo kits use PKCS#1 v1.5 ([KI-59](/known-issues#ki-59)). Full steps: [Encrypting attachments](/guides/encryption/attachments). The site's [`encrypt_attachment.py`](/examples/encryption/encrypt_attachment.py) does all of this. Put it next to your CF4 file and PhilHealth's current certificate, run `pip install cryptography` once, then run `python encrypt_attachment.py encrypt philhealth-cert.pem cf4-sample.xml`. It writes `cf4-sample.xml.enc` and uses `docMimeType` `text/xml`.
2. Save the JSON result where PhilHealth can download it over HTTPS. The guideline says the encrypted file "may be renamed using the original file name followed by ".enc"", as the script does. Our examples name it after the document type instead: `CF4.enc`.
3. Reference it in the claim's `DOCUMENTS`:

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="CF4" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF4.enc"/>
  <!-- CSF, SOA, ESA, CF5 ... -->
</DOCUMENTS>
```

The document type code is `CF4` "Claim Form 4" (Annex B lists it twice, [KI-35](/known-issues#ki-35)). For Return To Hospital (RTH) claims you can add documents later with [`addRequiredDocument`](/api/add-required-document).

::: warning Not specified: `docMimeType` and hosting for XML attachments
The attachment guideline only shows `application/pdf`. It doesn't say whether an XML attachment such as CF4 uses `text/xml` or `application/xml`, and nothing covers authentication or retention for the URL where you host the file. This site's examples use `text/xml`. Confirm both with PhilHealth ([KI-57](/known-issues#ki-57)).
:::

SSVTF Stage 2 checks that PhilHealth can open the URL, download and decrypt the file, and that the decrypted file matches the raw file byte by byte ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). Padding differences break that comparison ([KI-13](/known-issues#ki-13)). The SSVTF also has an eClaims Cloud Storage API (eCCSA) module about storing claim attachments in cloud storage, but the DevKit doesn't specify that API ([KI-40](/known-issues#ki-40)).

## Common mistakes

- **Writing dates as `MM-DD-YYYY`.** CF4 uses `YYYY-MM-DD`; the eClaims XML uses `MM-DD-YYYY`. Keep two formatters.
- **Dropping "irrelevant" attributes or sections.** Every attribute is `#REQUIRED` and every section needs at least one child. Send `""` or the default instead.
- **Leaving `MEDICINES` empty** when no drug was given. Send the NOMED record.
- **Sending `pEffYear="2026-09-15"`.** It is a four-character year.
- **Using the dictionary's casing** `pEClaimID` / `pEClaimsTransmittalID`. The DTD spells `pEClaimId` / `pEClaimsTransmittalId`.
- **Writing text instead of IDs** in `pSignsSymptoms` or `PEMISC`, or joining several symptom IDs with commas instead of `;`.
- **Reading library IDs as numbers.** Most physical-exam libraries store IDs as floating-point numbers (`7.0`), while the medicine codes (`00020`) are text. If your loader keeps the float or turns codes into numbers, your XML will carry `7.0` or `20` ([KI-39](/known-issues#ki-39); see [CF4 libraries](/reference/libraries/cf4#data-quality)).
- **Using deactivated library entries** (LIBRARY STATUS `0`), such as the old HEENT codes `1`–`10`.
- **Putting "none", "NA" or "N/A"** into chief complaint, history of present illness, past medical history or PE remarks.
- **Leaving BP empty** for a child under 3 or when BP wasn't taken. Send `1`/`1` (or `2`/`2` for palpatory).
- **Encrypting CF4 with the cipher key.** Attachments use PhilHealth's public key ([KI-12](/known-issues#ki-12)).
- **Mixing text encodings.** The DevKit doesn't name an encoding ([KI-60](/known-issues#ki-60)). Write the file as UTF-8 and declare it (`<?xml version="1.0" encoding="UTF-8"?>`, as our sample does), so that a name with `Ñ` reads back correctly.

## Related pages

- [CF4 XML reference](/reference/cf4-xml): every element and attribute
- [CF4 libraries](/reference/libraries/cf4): codes, drug-code composition, data-quality problems
- [Encrypting attachments](/guides/encryption/attachments)
- [Submitting a claim](/guides/submitting-a-claim) and [`uploadeClaims`](/api/upload-eclaims)
- [Document types](/reference/document-types)
- [Software certification (SSVTF)](/guides/certification)
- [Known issues: KI-08](/known-issues#ki-08), [KI-38](/known-issues#ki-38), [KI-39](/known-issues#ki-39), [KI-55](/known-issues#ki-55), [KI-57](/known-issues#ki-57), [KI-58](/known-issues#ki-58), [KI-59](/known-issues#ki-59), [KI-60](/known-issues#ki-60)
