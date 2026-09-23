---
title: DRG error codes
description: Every code in PhilHealth's DRG Error Codes workbook (CF5 validation and DRG grouping), what each range means, errors vs warnings, and the workbook's known inconsistencies.
---

# DRG error codes

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

PhilHealth's `DRG Error Codes.xlsx` lists the error and warning codes for CF5 (Claim Form 5) validation and Diagnosis-Related Groups (DRG) grouping. It covers codes 101 to 518, with a message and a suggested solution for each. Use this page to explain these codes to your users if [`validateCF5`](/api/validate-cf5), or another PhilHealth step, returns them. The DevKit doesn't say which step does, or in what format ([KI-36](/known-issues#ki-36), [KI-42](/known-issues#ki-42)). The page also shows how to tell **warnings** (the claim can still group) from **errors**.

::: info Sources
- [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx): 5 sheets; the workbook is not dated, but its file properties record creation on 2024-09-27 and a last save on 2025-02-18 by "PHILHEALTH DATA SERVICES"
- [Implementation Guide (rev. 20250217), p. 16–18: `validateCF5`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16), [p. 29: eClaims XML sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29), [p. 79–80: Annex C formats](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79), [p. 88: Annex E](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)
- [Software Solution Validation Test Form (SSVTF, rev. 20250217), p. 11: Part II C.I "Controls and Validations: CF5"](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)
- [`CF5.dtd`](/originals/cf5/CF5.dtd), [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd)
:::

::: warning The workbook contradicts itself (KI-36)
The sheets use different date formats (`mm/dd/yyyy` and `mm-dd-yyyy`) and three different time formats. Some "solution" texts are reversed or wrong, and some codes check fields that no longer exist. Use the workbook to **explain** a code to your user. Take field formats from the data dictionaries instead: eClaims dates `MM-DD-YYYY` and times `HH:MM:SSAM/PM` (Annex C). See [Inconsistencies inside the workbook](#inconsistencies-inside-the-workbook), [KI-36](/known-issues#ki-36) and [KI-49](/known-issues#ki-49).
:::

::: tip TL;DR
- Codes `501`–`508` are **warnings**: the grouper drops the bad secondary diagnosis or procedure code and keeps going. Every other code reads like an error that you must fix.
- Many codes are about the **eClaims XML** (sex, birth date, admission and discharge data), not the CF5. See [Where each checked value lives](#where-each-checked-value-lives).
- The `validateCF5` response format is undocumented ([KI-42](/known-issues#ki-42)). Match on the numeric code if the response has one, and fall back to the message text.
- Don't copy the workbook's solution texts into your UI unedited. Some are wrong ([KI-36](/known-issues#ki-36)).
- The solutions ask for codes from "the list of ICD-10 codes provided" and "the list of RVS codes provided". The CF5 form says those lists are in PhilHealth's DRG Manual, which is not in the DevKit ([KI-63](/known-issues#ki-63)).
:::

Abbreviations used in the workbook and on this page: ICD-10 = International Classification of Diseases, 10th revision (diagnosis codes); RVS = Relative Value Scale (procedure codes); LOS = length of stay. See the [glossary](/getting-started/glossary).

## What's in the workbook

| Sheet | Rows with content | Columns | What it is |
|---|---|---|---|
| **Claims Submission** | 41 codes: `101`–`110`, `201`–`228`, `301`–`303` | Error type, specific error, error message, code, solution | Checks when the CF5 and eClaims data are submitted, grouped as "Incomplete Entries", "Invalid Entries" and "XML Error" |
| **DRG Grouper** | 17 codes: `401`–`409`, `411`–`418` | Error type, specific error, error message, code, **DRG code**, solution | Checks done by the DRG grouper, each with a DRG code (`26509`, `26519` or `26539`) that nothing in the DevKit explains ([KI-63](/known-issues#ki-63)) |
| **Warning Codes** | 8 codes: `501`–`508` | Warning message, code, warning details | Problems that don't stop grouping: the bad code is dropped |
| **Summary of Errors** | 73 codes: `101`–`518` | Code, error message, solution, and an **unlabeled fourth column** | The consolidated list. It is the only sheet with `509` and `511`–`518` |
| **Sheet4** | 5 codes in two small tables | Same as the first two sheets | Copies of date-of-birth-related rows (`103`, `212`, `213`, `219`, `403`). Looks like scratch work ([KI-36](/known-issues#ki-36)) |

Other things in the file:

- Some cells are colour-highlighted. The workbook has no legend. In "Summary of Errors", the code cells for `101`–`303` are cyan, `401`–`418` green, `501`–`508` yellow, and `509`–`514` red; the message and solution cells of `219`–`221` are yellow, and the messages of `222` and `303` are red. "Claims Submission", "DRG Grouper" and "Sheet4" also have scattered yellow, red, orange and green cells.
- One cell in "Claims Submission" (code `303`, message "nullable value") carries a reviewer's comment in Filipino asking whether that is really the intended error message.

## Code ranges at a glance

| Range | Group (from the sheets) | Kind | What it covers |
|---|---|---|---|
| `101`–`110` | Incomplete Entries | Error | Required data missing: principal diagnosis, sex, birth date, admission/discharge date and time, disposition, newborn admission weight, time of birth |
| `201`–`228` | Invalid Entries | Error | Values that are present but wrong: unknown ICD-10 or RVS code, laterality, extension codes, sex code, date/time formats, impossible date order, claim number not in the eClaims XML, weight |
| `301`–`303` | XML Error | Error | Unreadable file, element missing per the DTD, empty hospital code |
| `401`–`409` | DRG Grouper: Incomplete Entries | Error | Same missing-data checks as `101`–`109`, at the grouping step |
| `411`–`418` | DRG Grouper: Invalid Entries | Error | Diagnosis not valid, an external cause, not for inpatients, or conflicting with age or sex; age outside 0–124; negative length of stay; weight under 0.3 kg |
| `501`–`508` | Warning Codes | **Warning** | A secondary diagnosis or procedure code is unknown, duplicated, or inappropriate for the patient's age or sex. It is dropped from grouping |
| `509`, `511`–`518` | Only in "Summary of Errors" | Not stated (they read like errors) | Hospital code not found in the eClaims XML; claim number missing, not found in the eClaims database, or already used for a CF5; series number not found; admission/discharge date and time formats |

The codes `410` and `510` do not exist in any sheet ([KI-36](/known-issues#ki-36)).

## Errors vs warnings

**Warnings (`501`–`508`)** are the only codes the workbook labels as warnings. Each one ends with the same kind of note: "ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code" (or "RVS code will be removed…"). So the claim still gets a DRG, but **without** that secondary diagnosis or procedure. That can change the result, so treat a warning as "fix it if you can".

**Everything else is an error.** The workbook doesn't say what happens on an error. The SSVTF asks your system to show both kinds: "Does the system display warning errors and major errors?" and "Does the system display the CF5 validation result?" ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)). We assume "major errors" means every non-warning code, and that you must fix it before you attach the CF5.

::: warning How codes appear in the response is not documented (KI-42)
The Guide does not document the `validateCF5` response at all (p. 16–18 end with the input sample; [KI-42](/known-issues#ki-42)), and no other DevKit document mentions this workbook ([KI-36](/known-issues#ki-36)). The workbook sits in the DevKit's CF5 folder and its messages name CF5 fields, so we assume these are the codes behind `validateCF5`, but the DevKit doesn't say so. We can't tell you whether the response carries the numeric code, the message text, or both. Match on the code if there is one, and fall back to the message text. Confirm the format with PhilHealth. See [`validateCF5`](/api/validate-cf5).
:::

### The DRG code column

The "DRG Grouper" sheet gives each error a DRG code. Neither the workbook nor any other DevKit document explains these values or describes the grouper ([KI-63](/known-issues#ki-63)). In the data:

- `26539` is used for `403` (no date of birth) and `416` (age out of range);
- `26519` is used for `413` (primary diagnosis not appropriate for inpatients);
- `26509` is used for every other code.

Recommendation (not from PhilHealth): log a DRG code if a response carries one, but don't build logic on it until PhilHealth explains what it means.

## Where each checked value lives

The CF5 XML holds only diagnoses, procedures, and the newborn weight. Many codes are about data in the **eClaims XML**, which you send to `validateCF5` in the same request. "Summary of Errors" has an unlabeled fourth column with the values `eclaims`, `DRG` and `N/A`. It seems to show which data a code is about: most `1xx` and `2xx` codes for sex, birth date, admission and discharge dates and times, and disposition are tagged `eclaims`, and most CF5-content codes are tagged `DRG`. The column is not labeled and not always consistent. For example, `109`/`409` (newborn admission weight) are tagged `eclaims`, but the weight is a CF5 attribute (`NewBornAdmWeight`). The patient's age, which decides whether the weight is required, does come from the eClaims XML, which may explain the tag.

The mapping below is **our reading** of the codes against the two DTDs. It is not a PhilHealth table.

| Codes | Field to fix | In which XML |
|---|---|---|
| `101`, `201`, `401`, `411`–`415` | `DRGCLAIM@PrimaryCode` | CF5 |
| `202`, `501`–`505` | `SECONDARYDIAG@SecondaryCode` | CF5 |
| `203`, `506`–`508` | `PROCEDURE@RvsCode` | CF5 |
| `204` | `PROCEDURE@Laterality` (`L`, `R`, `B`, `N`) | CF5 |
| `205`, `206` / `207`, `208` | `PROCEDURE@Ext1` / `PROCEDURE@Ext2` | CF5 |
| `109`, `227`, `228`, `409`, `418` | `DRGCLAIM@NewBornAdmWeight` (`228`/`418` accept exactly 0.3 kg, Annex E doesn't; see [KI-51](/known-issues#ki-51)) | CF5 (the age comes from the eClaims XML) |
| `303`, `509` | `CF5@pHospitalCode` (must equal `eCLAIMS@pHospitalCode`) | CF5 and eClaims |
| `222`, `511`–`513` | `DRGCLAIM@ClaimNumber` (must equal a `CLAIM@pClaimNumber`; see [KI-45](/known-issues#ki-45)) | CF5 and eClaims |
| `102`, `209`, `402` | `CF1@pPatientSex` (`M`/`F`) | eClaims |
| `103`, `212`, `213`, `403` | `CF1@pPatientBirthDate` | eClaims |
| `104`, `214`, `215`, `404`, `517` | `CF2@pAdmissionDate` | eClaims |
| `105`, `218`, `223`, `405`, `515` | `CF2@pAdmissionTime` | eClaims |
| `106`, `216`, `217`, `406`, `518` | `CF2@pDischargeDate` | eClaims |
| `107`, `224`, `225`, `407`, `516` | `CF2@pDischargeTime` | eClaims |
| `108`, `226`, `408` | `CF2@pDisposition` ("discharge code") | eClaims |
| `219`–`221`, `416`, `417` | Birth, admission and discharge dates and times relative to each other (age, length of stay) | eClaims |
| `110`, `210`, `211` | Newborn time of birth. **No such field exists** in the current CF5 DTD or for the patient in the eClaims DTD ([KI-36](/known-issues#ki-36)) | none |
| `514` | "Series Number". Removed from the CF5 in DTD v1.3 ([KI-36](/known-issues#ki-36)) | PhilHealth database |
| `301`, `302` | The whole file / its structure vs the DTD | CF5 (the workbook doesn't say whether these also apply to the eClaims XML) |

## Summary of Errors (full table)

All 73 rows of the "Summary of Errors" sheet, in sheet order, with the wording as written (typos included). "*(blank)*" means the cell is empty. The last column is the sheet's unlabeled column D.

| Code | Error message | Solution | Tag (unlabeled column D) |
|---|---|---|---|
| `101` | Principal diagnosis is required | Enter a valid diagnosis code from the ICD-10 library | *(blank)* |
| `102` | Patient sex is required | Enter patient sex, either M or F | `eclaims` |
| `103` | Patient date of birth is required | Enter patient date of birth (mm-dd-yyyy) format | `eclaims` |
| `104` | Date of admission is required / LOS is invalid | Enter date of admission (mm-dd-yyyy) format | `eclaims` |
| `105` | Time of admission is required / LOS is invalid | Enter time of admission (hh:mm) 24-hr format | `eclaims` |
| `106` | Discharge date is required / LOS is invalid | Enter date of discharge (mm-dd-yyyy) format | `eclaims` |
| `107` | Discharge time is required / LOS is invalid | Enter time of discharge (hh:mm) 24-hr format | `eclaims` |
| `108` | Patient disposition is required | Select the proper patient disposition | `eclaims` |
| `109` | Admission weight is required for patient less than 28 days old | Input admission weight when the patient is less than 28 days old | `eclaims` |
| `110` | Time of birth is required for patient less than 28 days old | Input time of birth when the patient is less than 28 days old | `eclaims` |
| `201` | Primary diagnosis is not a valid ICD-10 code | Primary diagnosis code must be in the list of ICD-10 codes provided | `DRG` |
| `202` | Secondary diagnosis is not a valid ICD-10 code | Secondary diagnosis code must be in the list of ICD-10 codes provided | `DRG` |
| `203` | RVS code not found | RVS code must be in the list of RVS codes provided | `DRG` |
| `204` | Laterality is invalid | Laterality must be in numerical value | `DRG` |
| `205` | Extension code 1 is invalid | Extension code 1 must be in numerical value | `DRG` |
| `206` | Extension code 1 should not exceed to 1 digit number | Extension code 1 is a single-digit number | `DRG` |
| `207` | Extension code 2 is invalid | Extension code 2 must be in numerical value | `DRG` |
| `208` | Extension code 2 should not exceed to 1 digit number | Extension code 2 is a single-digit number | `DRG` |
| `209` | Sex code is invalid | Sex code must be M or F | `eclaims` |
| `212` | Date of birth is invalid | Date of birth must not include non-numeric characters | `eclaims` |
| `213` | Date of birth should be in mm-dd-yyyy format | Date of birth must be in mm-dd-yyyy format | `eclaims` |
| `214` | Admission date should be in mm-dd-yyyy format | Date of admission must be in mm-dd-yyyy format | `eclaims` |
| `215` | Admission date is invalid | Date of admission must not include non-numeric characters | `eclaims` |
| `216` | Discharge date should be in mm-dd-yyyy format | Date of discharge must be in mm-dd-yyyy format | `eclaims` |
| `217` | Discharge date is invalid | Date of discharge must not include non-numeric characters | `eclaims` |
| `218` | Admission time is invalid | Time of admission must not include non-numeric characters | `eclaims` |
| `219` | Date of birth is Unacceptable | Date of Birth must be equal or later than the admission information | `DRG` |
| `220` | Admission information is unacceptable | Admission information must be equal or later than the discharge information | `DRG` |
| `221` | Discharge information is unacceptable | Discharge information must be equal or not later than the Admission Info | `DRG` |
| `222` | CF5 ClaimNumber not found in eClaims XML | Claim number must exist in eClaims XML (pClaimNumber 'xml attribute') | `DRG` |
| `223` | Admission time should be in HH:mm (24-hour format) | Time of admission must be in hh:mm 24-hour format | `N/A` |
| `224` | Discharge time should be in HH:mm (24-hour format) | Time of discharge must be in hh:mm 24-hour format | `N/A` |
| `225` | Discharge time is invalid | Time of discharge must not include non-numeric characters | `DRG` |
| `226` | Discharge code is invalid | Discharge code is not the available from the list discharge codes | `DRG` |
| `227` | Admission weight is invalid | Admission weight must be a numerical value | `DRG` |
| `228` | The minimum admission weight is 0.3 kg | Admission weight must not be lower than 0.3 kg | `DRG` |
| `301` | The file is unreadable or in unrecognized format | The file must be in XML file format | `DRG` |
| `302` | Required element not found | Required element is missing, kindly refer to the DTD provided. | `DRG` |
| `303` | CF5 pHospitalCode is required | CF5 pHospitalCode Value must not empty | `DRG` |
| `401` | Principal diagnosis is required | Enter a valid diagnosis code from the ICD-10 library | `DRG` |
| `402` | Patient sex is required | Enter patient sex, either M or F | `DRG` |
| `403` | Patient date of birth is required | Enter patient date of birth (mm/dd/yyyy) format | `DRG` |
| `404` | Date of admission is required / LOS is invalid | Date of admission must not be empty | `DRG` |
| `405` | Time of admission is required / LOS is invalid | Time of admission must not be empty | `DRG` |
| `406` | Discharge date is required / LOS is invalid | Date of discharge must not be empty | `DRG` |
| `407` | Discharge time is required / LOS is invalid | Time of discharge must not be empty | `DRG` |
| `408` | Patient disposition is required | Disposition type must not be empty | `DRG` |
| `409` | Admission weight is required for patient less than 28 days old | Input admission weight when the patient is less than 28 days old | `eclaims` |
| `411` | Primary diagnosis is not a valid ICD-10 code | Primary diagnosis code must be in the list of ICD-10 codes provided | *(blank)* |
| `412` | Primary diagnosis is for External Causes of Morbidity and Mortality | Primary diagnosis must not be for External Causes of Morbidity and Mortality | *(blank)* |
| `413` | Primary diagnosis is not appropriate for inpatients | Primary diagnosis must be appropriate for inpatients | *(blank)* |
| `414` | Principal diagnosis is having conflict with patient's age | Principal diagnosis must be appropriate for patient's age | *(blank)* |
| `415` | Principal diagnosis is having conflict with patient's sex | Principal diagnosis must be appropriate for patient's sex | *(blank)* |
| `416` | Age should not be less than 0 or more than 124 years | Age should not be less than 0 or more than 124 years | *(blank)* |
| `417` | Length of stay is invalid, it should be not less than 0 days or 0 hr | Length of stay should not be less than 0 days | *(blank)* |
| `418` | Minimum admission weight is less than 0.3 kg | Admission weight must be 0.3 kg and up | *(blank)* |
| `501` | Secodary diagnosis code is not found in the library | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. | *(blank)* |
| `502` | Secondary diagnosis is duplicate with primary diagnosis | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. | *(blank)* |
| `503` | Secondary diagnosis has duplicate | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. | *(blank)* |
| `504` | Secondary diagnosis is not appropriate for patient age | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. | *(blank)* |
| `505` | Secondary diagnosis is not appropriate for patient sex | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. | *(blank)* |
| `506` | Procedure code is not found from the library | RVS code will be removed from the grouping logic and will proceed in finding DRG code. | *(blank)* |
| `507` | Procedure code has duplicate | RVS code will be removed from the grouping logic and will proceed in finding DRG code. | *(blank)* |
| `508` | Procedure code is not appropriate for patient sex | RVS code will be removed from the grouping logic and will proceed in finding DRG code. | *(blank)* |
| `509` | CF5 pHospitalCode not found in eClaims XML | CF5 pHospitalCode Value must be found in eClaims XML or equal to pHospitalCode Value eClaims.xml | *(blank)* |
| `511` | CF5 ClaimNumber is required | CF5 ClaimNumber Value must not empty | *(blank)* |
| `512` | CF5 ClaimNumber not found in eClaims DB | *(blank)* | *(blank)* |
| `513` | CF5 ClaimNumber is already exist in CF5 DB with same series number | *(blank)* | *(blank)* |
| `514` | Series Number not found in eClaims DB | *(blank)* | *(blank)* |
| `515` | Invalid Admission Time Format | Admission Time Format must be hh:mm a (ex. 02:58 AM) | *(blank)* |
| `516` | Invalid Discharge Time Format | Discharge Time Format must be hh:mm a (ex. 02:58 AM) | *(blank)* |
| `517` | Invalid Admission Date Format | Admission Date Format must be MM-dd-yyyy (ex. 01-01-2024) | *(blank)* |
| `518` | Invalid Discharge Date Format | Discharge Date Format must be MM-dd-yyyy (ex. 01-01-2024) | *(blank)* |

## Warning Codes (full table)

All rows of the "Warning Codes" sheet.

| Code | Warning message | Warning details |
|---|---|---|
| `501` | Secodary diagnosis code is not found in the library | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. |
| `502` | Secondary diagnosis is duplicate with primary diagnosis | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. |
| `503` | Secondary diagnosis has duplicate | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. |
| `504` | Secondary diagnosis is not appropriate for patient age | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. |
| `505` | Secondary diagnosis is not appropriate for patient sex | ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code. |
| `506` | Procedure code is not found from the library | RVS code will be removed from the grouping logic and will proceed in finding DRG code. |
| `507` | Procedure code has duplicate | RVS code will be removed from the grouping logic and will proceed in finding DRG code. |
| `508` | Procedure code is not appropriate for patient sex | RVS code will be removed from the grouping logic and will proceed in finding DRG code. |

## Claims Submission sheet

All 41 rows. The sheet writes the error type only on the first row of each group; we repeat it on every row. Note the `mm/dd/yyyy` dates here, while "Summary of Errors" says `mm-dd-yyyy` for the same codes ([KI-36](/known-issues#ki-36)).

| Error type | Code | Specific error | Error message | Solution |
|---|---|---|---|---|
| Incomplete Entries | `101` | No principal diagnosis | Principal diagnosis is required | Enter a valid diagnosis code from the ICD-10 library |
| Incomplete Entries | `102` | No data for sex | Patient sex is required | Enter patient sex, either M or F |
| Incomplete Entries | `103` | No date of birth | Patient date of birth is required | Enter patient date of birth (mm/dd/yyyy) format |
| Incomplete Entries | `104` | No admission date | Date of admission is required / LOS is invalid | Enter date of admission (mm/dd/yyyy) format |
| Incomplete Entries | `105` | No admission time | Time of admission is required / LOS is invalid | Enter time of admission (hh:mm) 24-hr format |
| Incomplete Entries | `106` | No discharge date | Discharge date is required / LOS is invalid | Enter date of discharge (mm/dd/yyyy) format |
| Incomplete Entries | `107` | No discharge time | Discharge time is required / LOS is invalid | Enter time of discharge (hh:mm) 24-hr format |
| Incomplete Entries | `108` | No discharge code | Patient disposition is required | Select the proper patient disposition |
| Incomplete Entries | `109` | Admission weight is missing | Admission weight is required for patient less than 28 days old | Enter admission weight when the patient is less than 28 days old |
| Incomplete Entries | `110` | Time of birth is missing | Time of birth is required for patient less than 28 days old | Enter time of birth when the patient is less than 28 days old |
| Invalid Entries | `201` | Primary diagnosis not found in the library | Primary diagnosis is not a valid ICD-10 code | Primary diagnosis code must be in the list of ICD-10 codes provided |
| Invalid Entries | `202` | Secondary diagnosis not found in the library | Secondary diagnosis is not a valid ICD-10 code | Secondary diagnosis code must be in the list of ICD-10 codes provided |
| Invalid Entries | `203` | RVS code not found in the library | RVS code not found | RVS code must be in the list of RVS codes provided |
| Invalid Entries | `204` | Laterality has numeric value | Laterality is invalid | Laterality must be in numerical value |
| Invalid Entries | `205` | Extension code 1 has non-numeric value | Extension code 1 is invalid | Extension code 1 must be in numerical value |
| Invalid Entries | `206` | Extension code 1 has multiple digit number | Extension code 1 should not exceed to 1 digit number | Extension code 1 is a single-digit number |
| Invalid Entries | `207` | Extension code 2 has non-numeric value | Extension code 2 is invalid | Extension code 2 must be in numerical value |
| Invalid Entries | `208` | Extension code 2 has multiple digit number | Extension code 2 should not exceed to 1 digit number | Extension code 2 is a single-digit number |
| Invalid Entries | `209` | Sex code is not M or F | Sex code is invalid | Sex code must be M or F |
| Invalid Entries | `210` | Time of birth has non-numeric value | Time of birth is invalid | Time of birth must not include non-numeric characters |
| Invalid Entries | `211` | Invalid time of birth format | Time of birth should be hh:mm (24-hour format) | Time of birth must be in hh:mm 24-hour format |
| Invalid Entries | `212` | Date of birth has non-numeric value | Date of birth is invalid | Date of birth must not include non-numeric characters |
| Invalid Entries | `213` | Invalid date of birth format | Date of birth should be in mm/dd/yyyy format | Date of birth must be in mm/dd/yyyy format |
| Invalid Entries | `214` | Invalid admission date format | Admission date should be in mm/dd/yyyy format | Date of admission must be in mm/dd/yyyy format |
| Invalid Entries | `215` | Admission date has non-numeric value | Admission date is invalid | Date of admission must not include non-numeric characters |
| Invalid Entries | `216` | Invalid discharge date format | Discharge date should be in mm/dd/yyyy format | Date of discharge must be in mm/dd/yyyy format |
| Invalid Entries | `217` | Discharge date has non-numeric value | Discharge date is invalid | Date of discharge must not include non-numeric characters |
| Invalid Entries | `218` | Admission time has non-numeric value | Admission time is invalid | Time of admission must not include non-numeric characters |
| Invalid Entries | `219` | Date of birth is greather than admission info | Date of birth is Unacceptable | Date of Birth must be equal or later than the admission information |
| Invalid Entries | `220` | Admission information is greather than discharge information | Admission information is unacceptable | Admission information must be equal or later than the discharge information |
| Invalid Entries | `221` | Discharge Date is less than admission date | Discharge information is unacceptable | Discharge information must be equal or not later than the Admission Info |
| Invalid Entries | `222` | Claim number not found in eClaims XML | Claim number does not exist in eClaims XML | Claim number must exist in eClaims XML (pClaimNumber 'xml attribute') |
| Invalid Entries | `223` | Invalid admission time format | Admission time should be in hh:mm (24-hour format) | Time of admission must be in hh:mm 24-hour format |
| Invalid Entries | `224` | Invalid discharge time format | Discharge time should be in hh:mm (24-hour format) | Time of discharge must be in hh:mm 24-hour format |
| Invalid Entries | `225` | Discharge time has non-numeric value | Discharge time is invalid | Time of discharge must not include non-numeric characters |
| Invalid Entries | `226` | Discharge code is not invalid | Discharge code is invalid | Discharge code is not the available from the list discharge codes |
| Invalid Entries | `227` | Admission weight has non-numeric value | Admission weight is invalid | Admission weight must be a numerical value |
| Invalid Entries | `228` | Admission weight is less than 0.3 kg | The minimum admission weight is 0.3 kg | Admission weight must not be lower than 0.3 kg |
| XML Error | `301` | Malformed file / Unreadable File (format error) | The file is unreadable or in unrecognized format | The file must be in XML file format |
| XML Error | `302` | Required element not found | Required element not found | Required element is missing, kindly refer to the DTD provided. |
| XML Error | `303` | Hospital code is empty | nullable value | Hospital code is required |

## DRG Grouper sheet

All 17 rows. Error type is repeated on every row, as above.

| Error type | Code | Specific error | Error message | DRG code | Solution |
|---|---|---|---|---|---|
| Incomplete Entries | `401` | No principal diagnosis | Principal diagnosis is required | `26509` | Enter a valid diagnosis code from the ICD-10 library |
| Incomplete Entries | `402` | No data for sex | Patient sex is required | `26509` | Enter patient sex, either M or F |
| Incomplete Entries | `403` | No date of birth | Patient date of birth is required | `26539` | Enter patient date of birth (mm/dd/yyyy) format |
| Incomplete Entries | `404` | No admission date | Date of admission is required / LOS is invalid | `26509` | Enter date of admission (mm/dd/yyyy) format |
| Incomplete Entries | `405` | No admission time | Time of admission is required / LOS is invalid | `26509` | Enter time of admission (hh:mm) 24-hr format |
| Incomplete Entries | `406` | No discharge date | Discharge date is required / LOS is invalid | `26509` | Enter date of discharge (mm/dd/yyyy) format |
| Incomplete Entries | `407` | No discharge time | Discharge time is required / LOS is invalid | `26509` | Enter time of discharge (hh:mm) 24-hr format |
| Incomplete Entries | `408` | No discharge code | Patient disposition is required | `26509` | Select the proper patient disposition |
| Incomplete Entries | `409` | Admission weight is missing | Admission weight is required for patient less than 28 days old | `26509` | Input admission weight when the patient is less than 28 days old |
| Invalid Entries | `411` | Primary diagnosis code is not found in ICD-10 Library | Primary diagnosis is not a valid ICD-10 code | `26509` | Primary diagnosis code must be in the list of ICD-10 codes provided |
| Invalid Entries | `412` | Primary diagnosis code is for External Causes of Morbidity and Mortality | Primary diagnosis is for External Causes of Morbidity and Mortality | `26509` | Primary diagnosis must not be for External Causes of Morbidity and Mortality |
| Invalid Entries | `413` | Primary diagnosis is not appropriate for inpatients | Primary diagnosis is not appropriate for inpatients | `26519` | Primary diagnosis must be appropriate for inpatients |
| Invalid Entries | `414` | Principal diagnosis not valid for age | Principal diagnosis has conflict with patient's age | `26509` | Principal diagnosis must be appropriate for patient's age |
| Invalid Entries | `415` | Principal diagnosis not valid for sex | Principal diagnosis has conflict with patient's sex | `26509` | Principal diagnosis must be appropriate for patient's sex |
| Invalid Entries | `416` | Age is less than 0 or more than 124 years | Age should not be less than 0 or more than 124 years | `26539` | Age should not be less than 0 or more than 124 years |
| Invalid Entries | `417` | Length of stay is less than 0 | Length of stay is invalid, it should be not less than 0 days or 0 hr | `26509` | Length of stay should not be less than 0days or 0hr |
| Invalid Entries | `418` | Admission weight is less than 0.3 kg | Minimum admission weight is less than 0.3 kg | `26509` | Admission weight must be 0.3 kg and up |

## Sheet4

Two small tables that copy date-of-birth-related rows from the sheets above: four rows from "Claims Submission" and one from "DRG Grouper" (with its DRG code). We show them as one table. Row `219` is highlighted yellow. Nothing here is new. We reproduce it only for completeness.

| Code | Specific error | Error message | DRG code | Solution |
|---|---|---|---|---|
| `103` | No date of birth | Patient date of birth is required | | Enter patient date of birth (mm/dd/yyyy) format |
| `212` | Date of birth has non-numeric value | Date of birth is invalid | | Date of birth must not include non-numeric characters |
| `213` | Invalid date of birth format | Date of birth should be in mm/dd/yyyy format | | Date of birth must be in mm/dd/yyyy format |
| `219` | Date of birth is greather than admission info | Date of birth is Unacceptable | | Date of Birth must be equal or later than the admission information |
| `403` | No date of birth | Patient date of birth is required | `26539` | Enter patient date of birth (mm/dd/yyyy) format |

## Inconsistencies inside the workbook

We found the problems below while reproducing the sheets. [KI-36](/known-issues#ki-36) covers all of them, together with the gaps in the code ranges and the scratch sheet. Items 8 to 10 are minor.

::: warning Problems found in the workbook
1. **Three time formats.** `105`/`107`/`223`/`224` say `hh:mm` 24-hour. `515`/`516` say "hh:mm a (ex. 02:58 AM)". The eClaims data dictionary requires `HH:MM:SSAM/PM` ([Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)), as in the Guide's eClaims sample `pAdmissionTime="01:00:00PM"` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). Keep sending the eClaims format ([KI-49](/known-issues#ki-49)).
2. **Two date formats, even within one sheet.** "Summary of Errors" uses `mm-dd-yyyy` for `103`, `104`, `106`, `213`, `214` and `216`, but `mm/dd/yyyy` for `403`. `517`/`518` say "MM-dd-yyyy (ex. 01-01-2024)", which matches the eClaims `MM-DD-YYYY`.
3. **Laterality `204` is self-contradictory.** The specific error is "Laterality has numeric value", but the solution says "Laterality must be in numerical value". Valid values are the letters `L`, `R`, `B`, `N` (Annex E).
4. **Reversed solutions for `219`–`221`.** "Date of Birth must be equal or later than the admission information" and "Admission information must be equal or later than the discharge information" say the opposite of the checks they belong to ("Date of birth is greather than admission info", "Admission information is greather than discharge information"). `221` says "Discharge information must be equal or not later than the Admission Info". Our reading of the intended rule: birth ≤ admission ≤ discharge.
5. **Time-of-birth codes for a field that no longer exists.** `110`, `210`, `211` check the newborn's time of birth. The 20240604 revision removed "NewBornTimeOfBirth" from the CF5 XML, and [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.9 has no time-of-birth attribute for the patient (its only related field, `DELIVERY@pDeliveryTime`, records the mother's delivery in the maternity section). "Summary of Errors" keeps `110` but drops `210` and `211`.
6. **The same problem with two severities.** An unknown secondary diagnosis is error `202` and warning `501`. An unknown RVS code is error `203` and warning `506`. Missing data appears twice, as `101`–`109` and `401`–`409`. The workbook doesn't say which code you get when.
7. **`514` refers to a removed field.** "Series Number not found in eClaims DB". DTD v1.3 removed "Series" and "Lhio" from the CF5.
8. **Missing solutions.** `512`, `513`, `514` have no solution text. `101` and `411`–`518` have nothing in the unlabeled column.
9. **Different wording for the same code across sheets.** For example, `303` is "nullable value" / "Hospital code is required" in "Claims Submission" but "CF5 pHospitalCode is required" in "Summary of Errors". `417`'s solution says "0days or 0hr" in "DRG Grouper" but only "0 days" in "Summary of Errors".
10. **Typos.** "Secodary", "greather", "Discharge code is not invalid", "should not exceed to 1 digit number", "is already exist". They don't change the meaning, but don't copy the text into your UI unedited.
:::

## Using the codes in your system

::: tip Recommendation (not from PhilHealth)
- Load "Summary of Errors" into a lookup table keyed by code, with the message and solution. Add a `severity` field: `warning` for `501`–`508`, `error` for everything else.
- Map each code to the screen field that fixes it, using [the table above](#where-each-checked-value-lives). Many fixes belong in the patient or admission record (eClaims XML), not the CF5 screen.
- Rewrite the reversed or contradictory solution texts (`204`, `219`–`221`) before you show them to users.
- Log the raw `validateCF5` response. The format is undocumented ([KI-42](/known-issues#ki-42)), so you will want the original text when you talk to PhilHealth.
:::

```js
// Minimal lookup built from the "Summary of Errors" sheet (excerpt).
const DRG_CODES = {
  101: { message: 'Principal diagnosis is required', solution: 'Enter a valid diagnosis code from the ICD-10 library' },
  222: { message: 'CF5 ClaimNumber not found in eClaims XML', solution: "Claim number must exist in eClaims XML (pClaimNumber 'xml attribute')" },
  502: { message: 'Secondary diagnosis is duplicate with primary diagnosis', solution: 'ICD-10 code will be removed from the grouping logic and will proceed in finding the DRG code.' },
  // ...load the rest from the workbook
};

const severityOf = (code) => (code >= 501 && code <= 508 ? 'warning' : 'error');
```

## Related pages

- [Building CF5 (DRG)](/guides/cf5): the rules and workflow that avoid these errors
- [CF5 XML reference](/reference/cf5-xml)
- [`validateCF5`](/api/validate-cf5)
- [eClaims XML](/reference/eclaims-xml): sex, birth date, admission and discharge fields
- [Software certification (SSVTF)](/guides/certification)
- Known issues: [KI-36](/known-issues#ki-36) (this workbook), [KI-42](/known-issues#ki-42) (undocumented `validateCF5` response), [KI-45](/known-issues#ki-45) (CF5 `ClaimNumber`), [KI-49](/known-issues#ki-49) (date and time formats), [KI-51](/known-issues#ki-51) (0.3 kg newborn weight), [KI-63](/known-issues#ki-63) (DRG manuals and the grouper's DRG codes)
