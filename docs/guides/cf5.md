---
title: Building CF5 (DRG)
description: What Claim Form 5 is, the coding rules it enforces, and the step-by-step workflow to build, validate, encrypt and attach the CF5 XML to an eClaims submission.
---

# Building CF5 (DRG)

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

Claim Form 5 (CF5) is PhilHealth's supplementary form for Diagnosis-Related Groups (DRG) shadow billing. It carries the clinical coding of a claim: one primary diagnosis, up to 12 secondary diagnoses, and up to 20 procedures. This page explains the form's rules and walks you through the developer workflow: build the CF5 XML, check it with the `validateCF5` endpoint, encrypt it, and attach it to the claim. Read it before you build a CF5 feature into a Hospital Information System (HIS).

::: info Sources
- [Implementation Guide (rev. 20250217), p. 6: introduction and DRG context](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)
- [Implementation Guide, p. 16–18: `validateCF5`, CF5 DTD v1.3, samples](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)
- [Implementation Guide, p. 78: Annex B document type `CF5`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78), [p. 85: `pDocumentURL`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85), [p. 88: Annex E, CF5 data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)
- [Implementation Guide, p. 3–4: revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) and [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf)
- [Implementation Guide, p. 10: `validateeSOA` output (for comparison)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10), [p. 29: eClaims XML sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29), [p. 75–76: Annex A, encryption with the cipher key](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75), [p. 79–80: Annex C, eClaims data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd)
- [CF5 paper form, v0.4 revised February 2024 (`DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf`)](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)
- [`CF5.dtd`](/originals/cf5/CF5.dtd), [`20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf`](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf), [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml)
- [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)
- [Software Solution Validation Test Form (SSVTF), rev. 20250217, p. 7–8, 10–11, 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)
- [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
:::

::: tip TL;DR: what you need to do
1. In your coding screen, accept one primary diagnosis, up to 12 secondary diagnoses, and up to 20 procedures. Each procedure gets a laterality (`L`, `R`, `B`, or `N`) and extension codes `Ext1`/`Ext2`.
2. Build one CF5 XML per claim against the standalone [`CF5.dtd`](/originals/cf5/CF5.dtd) (our recommendation, [KI-06](/known-issues#ki-06)). Copy `pHospitalCode` and the claim number from the eClaims XML (our recommendation for the claim number, [KI-45](/known-issues#ki-45)). Start from our [`cf5-sample.xml`](/examples/cf5-sample.xml). It is valid against the standalone `CF5.dtd`, but not against the older v1.3 DTD printed in the Guide, because it has no secondary diagnosis and no procedure ([KI-06](/known-issues#ki-06)). Run it through `validateCF5` early to learn which DTD PhilHealth's server applies.
3. Encrypt the CF5 and the eClaims XML with your **cipher key**, and call [`validateCF5`](/api/validate-cf5). Its response is undocumented ([KI-42](/known-issues#ki-42)), so log it and parse it defensively.
4. Encrypt the **same** CF5 bytes with PhilHealth's **public key**, publish the file at an HTTPS URL, and add `<DOCUMENT pDocumentType="CF5" …/>` to the claim. Run [`eClaimsFileCheck`](/api/eclaims-file-check) on that final eClaims XML, then [`uploadeClaims`](/api/upload-eclaims) ([order](#the-whole-submission-order)).
5. The DRG manuals, the grouper's DRG codes and the shadow-billing rules are not in the DevKit ([KI-63](/known-issues#ki-63)). Let `validateCF5` check your codes.
:::

## What CF5 is and why it exists

### DRG in one paragraph

The Implementation Guide's introduction gives the background ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). PhilHealth has run eClaims since 2016 for the All Case Rates (ACR) payment mechanism. The Universal Health Care Act of 2019 mandates PhilHealth "to shift to paying providers prospectively using Diagnosis-Related Groups (DRG)". A key component of that reform, the Guide says, is "an enhanced version of the current eClaims system which accommodates the collection of data required for DRG grouping". That system is the PhilHealth e-Claims Web Service (PECWS) 3.0 that this site documents.

"Grouping" is the step where PhilHealth's software assigns a DRG code to a claim. The [DRG error-code workbook](/reference/drg-error-codes) calls this software the "DRG Grouper". Its warnings say that a bad code "will be removed from the grouping logic and [the grouper] will proceed in finding the DRG code." Judging from the error codes (our reading, not a PhilHealth statement), the grouper needs your coded diagnoses and procedures (from CF5) plus patient and stay data such as age, sex and length of stay (from the eClaims XML). The workbook's "DRG Grouper" sheet also gives DRG codes (`26509`, `26519`, `26539`) that no DevKit document explains ([KI-63](/known-issues#ki-63)).

### What "shadow billing" means here

The paper CF5 form states the arrangement in its "Important reminders" ([CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)):

- "If you are utilizing this form, you are a health facility participating in the Shadow Billing of Diagnosis-Related Groups. Please fill up this supplementary form."
- "Please be reminded that the Health Facility filing this claim shall be reimbursed using All Case Rates."

So, according to the form, the claim is still paid under All Case Rates. The CF5 data travels alongside the claim. Annex B names the document type the same way: `CF5` is "Electronic Claim Form 5 (for DRG Shadow Billing)" ([Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)).

::: warning Not in the DevKit (KI-63)
The DevKit does not say which health facilities must participate in shadow billing, or from when. It also doesn't include the "DRG Manual" and "DRG Implementation Manual" that the form refers to for valid codes and extension-code rules. Confirm both with PhilHealth ([KI-63](/known-issues#ki-63)). For software certification, the SSVTF notes that the "CF5 module and eSOA module can be jointly or separately applied for certification (PA 2024-0032)" ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)).
:::

### What goes in the CF5 XML, and what doesn't

The paper form has three parts. Only **Part I, "DRG Information"**, is in the XML:

| Paper form (Part I) | XML ([`CF5.dtd`](/originals/cf5/CF5.dtd)) |
|---|---|
| 1. Primary Diagnosis (PDx), one ICD-10 code | `DRGCLAIM@PrimaryCode` |
| 2. Secondary Diagnosis (SDx 1–12) | `SECONDARYDIAGS/SECONDARYDIAG@SecondaryCode` (one element per code) |
| 3. Applicable Procedures (RVS 1–20), each with L/R/B boxes and a "+" extension | `PROCEDURES/PROCEDURE` with `RvsCode`, `Laterality`, `Ext1`, `Ext2` |
| 4. Newborn Data: admission weight | `DRGCLAIM@NewBornAdmWeight` |
| (Health facility, claim) | `CF5@pHospitalCode`, `DRGCLAIM@ClaimNumber` |

ICD-10 is the International Classification of Diseases, 10th revision. RVS is the Relative Value Scale, PhilHealth's procedure code list (Annex C describes `pRVSCode` as the "Relative Value Scale Code of the procedure/operation performed").

The CF5 XML has **no** patient sex, birth date, admission or discharge date and time, or disposition. Those values live in the **eClaims XML** (for example `CF1@pPatientSex`, `CF1@pPatientBirthDate`, `CF2@pAdmissionDate`, `CF2@pDisposition` in [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd)), and the workbook's "Summary of Errors" sheet tags many of the codes for those fields `eclaims`. That is most likely why `validateCF5` asks for **both** XML files (our reading; see [Step 4](#step-4-call-validatecf5)).

Parts II and III of the paper form are consent and certification sections with signatures and a thumb mark. The DevKit does not say how to handle them electronically ([KI-63](/known-issues#ki-63)). Ask PhilHealth whether the signed paper form must also be kept or scanned.

## CF5 at a glance

| Item | Value | Source |
|---|---|---|
| Root element | `CF5`, with exactly one `DRGCLAIM` | [`CF5.dtd`](/originals/cf5/CF5.dtd) |
| DTD to use | Standalone `CF5.dtd` (revision 20240604), our recommendation. The Guide prints a different v1.3 ([KI-06](/known-issues#ki-06)) | [CF5 XML reference](/reference/cf5-xml) |
| Validation endpoint | `POST https://{pecws.domain}/PHIC/Claims3.0/validateCF5` | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |
| Encryption for `validateCF5` | Health facility's **cipher key** (`key1`/`key2` empty) | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |
| Encryption for the attachment | PhilHealth **public key** | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |
| Document type code | `CF5` | [Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78) |
| Filing deadline | "This form, together with suporting documents should be filed within thirty (30) calendar days from date of discharge." (spelling as printed). The CF4 form says 60 days, and no deadline is given for the upload itself ([KI-58](/known-issues#ki-58)) | [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) |
| Completeness | "claim forms with incomplete information shall not be processed" | [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) |

## The form's rules

These rules come from the paper form (v0.4, February 2024), the Annex E data dictionary ([Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)), and the SSVTF certification checklist, Part II, A.II "Claim Form 5 (CF5)" ([SSVTF p. 7–8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)).

**The DTD enforces almost none of them.** Every CF5 attribute is plain text (`CDATA`), and the standalone DTD does not limit how many diagnoses or procedures you send. (The Guide's v1.3 DTD goes the other way and allows exactly one secondary diagnosis; see [KI-06](/known-issues#ki-06).) Your system must enforce the rules; `validateCF5` then checks them again on PhilHealth's side.

| Rule | Detail | Sources |
|---|---|---|
| Exactly one primary diagnosis | "Input only 1 valid ICD-10 code." | Form; Annex E; SSVTF A.II.1 |
| Up to 12 secondary diagnoses | "Input up to 12 valid ICD-10 codes." | Form; Annex E ("up to a total of 12 codes"); SSVTF A.II.2 |
| No repeated diagnosis codes | "Ensure there are no repeat codes across all secondary diagnoses, and with the primary diagnosis." | Form; SSVTF A.II.5; warnings `502`, `503` |
| Dagger-asterisk pairs | Dagger code goes in PDx; asterisk code goes in SDx | Form |
| Full ICD-10 code | "Please make sure to input the value after the decimal point of the ICD code, as applicable." | Form |
| Up to 20 procedures | "Input up to 20 valid RVS codes." | Form; Annex E ("up to a total of 20 codes"); SSVTF A.II.3 |
| Laterality per procedure | `L`, `R`, `B`, or `N` (none). SSVTF A.II.4 asks only whether the system accepts "laterality left right or both, as applicable" ([KI-56](/known-issues#ki-56)) | Annex E (rev. 20250217); SSVTF A.II.4 ([KI-05](/known-issues#ki-05)) |
| Extension codes per procedure | `Ext1` = number of body sites, `Ext2` = number of times the procedure was done; each `1`–`9` | Annex E; form; SSVTF A.II.6 |
| Newborn admission weight | For patients 0–27 days old, in kg, up to one decimal place, not below 0.3 kg (the sources disagree on exactly 0.3 kg; see [below](#newborn-admission-weight) and [KI-51](/known-issues#ki-51)) | Form; Annex E; SSVTF A.II.7; errors `109`, `228` |

### Primary diagnosis (PDx)

- Send exactly one ICD-10 code in `DRGCLAIM@PrimaryCode`. Annex E gives it `Varchar (15)` with valid values "Valid ICD10 codes".
- Include the digits after the decimal point where the code has them, for example `A01.0`, not `A01`. PhilHealth's CF5 samples always keep the dot (`A00.0`, `A01.0`). The form says "as applicable": our example's `A90` (dengue fever) appears without a decimal part in the DevKit's CF4 ICD library (`lib_icd.xlsx`), so it is sent as `A90`.
- The form says the list of valid codes "can be found on PhilHealth's DRG Manual". That manual is not in the DevKit ([KI-63](/known-issues#ki-63)).
- Errors you may get: `101`/`401` (missing), `201`/`411` (not a valid ICD-10 code), `412` (an "External Causes of Morbidity and Mortality" code), `413` (not appropriate for inpatients), `414`/`415` (conflicts with the patient's age or sex). See [DRG error codes](/reference/drg-error-codes).

### Secondary diagnoses (SDx)

- Send 0 to 12 `SECONDARYDIAG` elements, one code each, inside `SECONDARYDIAGS`.
- Don't repeat a code, and don't repeat the primary diagnosis.
- Most problems with a secondary code produce a **warning**, not a rejection. The grouper drops the code and keeps going: `501` (not in the library), `502` (same as PDx), `503` (duplicate), `504`/`505` (not appropriate for the patient's age or sex). A dropped code does not count toward the DRG. The "Claims Submission" sheet also lists an **error** `202`, "Secondary diagnosis is not a valid ICD-10 code". The workbook doesn't say when you get `202` and when you get `501`.

::: warning The Guide's DTD allows exactly one SDx
The DTD printed in the Guide (v1.3) declares `SECONDARYDIAGS (SECONDARYDIAG)`, which means exactly one. The standalone `CF5.dtd` (20240604) declares `(SECONDARYDIAG)*`, zero or more, which matches the "up to 12" rule. We recommend the standalone DTD. See [KI-06](/known-issues#ki-06) and [CF5 XML reference](/reference/cf5-xml#the-two-dtd-variants).
:::

### Dagger and asterisk codes

The form has one instruction on each side:

- PDx: "For dagger-asterisk codes, please input the DAGGER code as the Primary Diagnosis."
- SDx: "For dagger-asterisk codes, please input the ASTERISK code as a Secondary Diagnosis."

Background (general ICD-10 knowledge, not from the DevKit): ICD-10 codes some conditions as a pair. The dagger (†) code describes the underlying disease. The asterisk (\*) code describes how it shows up in a particular organ or body site. For example, WHO ICD-10 pairs `A17.0†` (tuberculous meningitis) with `G01*` (meningitis in bacterial diseases classified elsewhere). On CF5, `A17.0` goes in `PrimaryCode` and `G01` goes in a `SecondaryCode`. Look up the real pairs in PhilHealth's DRG Manual, which you have to request from PhilHealth ([KI-63](/known-issues#ki-63)).

::: tip Recommendation (not from PhilHealth)
Send the bare code, without the † or \* symbol. PhilHealth's samples show only plain codes. The DevKit does not say whether the symbols are accepted, so test with `validateCF5` if your coding system stores them.
:::

### Procedures (RVS codes)

- Send 0 to 20 `PROCEDURE` elements inside `PROCEDURES`. Annex E gives `RvsCode` the type `Varchar (6)`, valid values "Valid RVS code".
- The form says valid RVS codes "can be found on PhilHealth's DRG Manual, or the PhilHealth's website". Neither list is in the DevKit ([KI-63](/known-issues#ki-63)).
- Unknown codes can produce error `203` ("RVS code not found") or warning `506` ("Procedure code is not found from the library"). The workbook doesn't say which one applies when. Fix the code either way.
- A repeated RVS code triggers warning `507` ("Procedure code has duplicate"): the "RVS code will be removed from the grouping logic". The workbook doesn't say whether only the repeat or every copy is removed.

::: tip Recommendation (not from PhilHealth)
If a procedure was done more than once, send the RVS code **once** and put the count in `Ext2` ("the number of times the procedure was done", Annex E). Don't repeat the code. PhilHealth's own `DRG XML EFORMS FORMAT.xml` sample lists `RvsCode="93631"` twice ([KI-28](/known-issues#ki-28)), and warning `507` says a duplicated RVS code is removed from the grouping logic.
:::

### Laterality

Laterality says which side of the body the procedure was performed on. Annex E lists `L` = Left, `R` = Right, `B` = Both, `N` = None. This matches `pLaterality (L|R|B|N)` in the eClaims XML ([`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd), Annex C p. 80 "'N' – N/A").

::: warning KI-05: blank vs `N`
The paper form (v0.4) says "If there is no laterality applicable, leave the field blank", and both official CF5 samples use `Laterality=""`. Revision **20250217** changed this: "Updated the Data Dictionary of CF5 to set 'N' (None) as the valid value for Laterality" ([Guide p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4), [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf)). **Send `N`** when laterality doesn't apply. See [KI-05](/known-issues#ki-05).
:::

The DTD accepts any text in `Laterality`, so it won't catch a wrong value. The server can return error `204` ("Laterality is invalid"). The workbook's solution text for `204` says "Laterality must be in numerical value", which contradicts the letter codes (and its own "specific error" text, "Laterality has numeric value"). We read that as a mistake in the workbook, not a rule ([KI-36](/known-issues#ki-36)).

### Extension codes

Each procedure on the paper form has a "+" followed by two small boxes. The form says: "Extension codes shall be indicated for each procedure, as necessary (after the '+' sign). Please check the DRG Implementation Manual for specific rules on adding extension codes." That manual is not in the DevKit ([KI-63](/known-issues#ki-63)).

| Attribute | Meaning (Annex E) | Type | Valid values |
|---|---|---|---|
| `Ext1` | "Refer to the number of body sites" | `Numeric (1)` | `1`–`9` |
| `Ext2` | "Refer to the number of times the procedure was done" | `Numeric (1)` | `1`–`9` |

Errors `205`–`208` fire when an extension code is not numeric or has more than one digit.

::: warning Not specified: what to send when no extension applies (KI-63)
Annex E lists only `1`–`9`. Both official samples send `Ext1=""` and `Ext2=""`, and the form says "as necessary". The DevKit doesn't say whether an empty value is accepted ([KI-63](/known-issues#ki-63)). Test both cases with `validateCF5`, and confirm with PhilHealth before you send blanks. Our [variant with procedures](/reference/cf5-xml#variant-with-procedures-fragment) uses `1` for a single body site and a single occurrence.
:::

### Newborn admission weight

| Source | What it says |
|---|---|
| Form, Part I.4 | "Fill up this portion only when the claim is for a newborn"; "Admission weight less than 0.3kg is considered invalid"; "Provide the admissioon weight for newborn infant patients aged 0-27 days" (spelling as printed); "Admission weight (up to 1 decimal point)", with two digit boxes before the point and one after, in kg |
| Annex E | `NewBornAdmWeight`, `Numeric (2,1)`: "applicable to newborn patients (0-27 days old)", "admission weight of newborn in kilogram (kg)"; valid values "Should be greater than 0.3 kg", "Formatted as: ##.#", "Up to one (1) decimal places only" |
| SSVTF A.II.7 | "Does the system accept admission weight for newborn patients in kilograms (kg) up to one (1) decimal place?" |
| Error codes | `109`/`409` "Admission weight is required for patient less than 28 days old"; `227` must be numeric; `228` "The minimum admission weight is 0.3 kg"; `418` "Admission weight must be 0.3 kg and up" |

What this means for your code:

- The patient's age decides whether the field is needed. The CF5 has no birth date, so compute the age from the eClaims XML's `pPatientBirthDate` and `pAdmissionDate` (our reading, based on error `109` being tagged `eclaims`).
- For a newborn (0–27 days old), send the weight in kilograms with at most one decimal, for example `NewBornAdmWeight="2.8"`. Don't add a unit, and don't send grams.
- For everyone else, send an empty value: `NewBornAdmWeight=""`. The attribute is `#REQUIRED` in the DTD, so it must be present even when empty. That's what both official samples do.

::: warning Is exactly 0.3 kg valid? (KI-51)
Annex E says "greater than 0.3 kg", which excludes 0.3. The form ("less than 0.3kg is considered invalid") and error codes `228`/`418` ("must not be lower than 0.3 kg", "0.3 kg and up") accept 0.3.

**Recommendation (not from PhilHealth):** accept 0.3 kg and above with one decimal place, and let `validateCF5` confirm. The error codes describe what the validator checks, so we treat 0.3 as the minimum valid value. See [KI-51](/known-issues#ki-51).
:::

### Identifiers that tie CF5 to its claim

Two CF5 values must match the eClaims XML that you send alongside it. The error codes say so:

| CF5 attribute | Must match | Evidence |
|---|---|---|
| `CF5@pHospitalCode` | `eCLAIMS@pHospitalCode` | `509`: "CF5 pHospitalCode Value must be found in eClaims XML or equal to pHospitalCode Value eClaims.xml"; `303`: must not be empty |
| `DRGCLAIM@ClaimNumber` | `CLAIM@pClaimNumber` of the claim this CF5 belongs to | `222`: "Claim number must exist in eClaims XML (pClaimNumber 'xml attribute')"; `511`: must not be empty |

Annex E describes `pHospitalCode` as the "PMCC No.", `Varchar (6)`, "6-digits alphanumeric code, Format: 999999 or X99999". In the eClaims XML the same value goes in `eCLAIMS@pHospitalCode` ("For now PMCC number should be used", Annex C p. 79). The DevKit never expands "PMCC", and the eClaims attribute is `String(12)` ([KI-48](/known-issues#ki-48), [KI-31](/known-issues#ki-31)). Our examples use `123456` in both files.

::: warning KI-45: what is `ClaimNumber`?
Annex E describes `ClaimNumber` as `Varchar (13)`, "Format: 9999999999999", "A reference number assigned to the claim upon successful submission of claim via eClaims API". But:

- you call `validateCF5` **before** you upload the claim, so no PhilHealth-assigned number exists yet;
- error `222` requires the value to exist as `pClaimNumber` in the eClaims XML, and Annex C defines `pClaimNumber` as the "Hospital Generated Claim Case #" (p. 79);
- the Guide's CF5 sample uses `ClaimNumber="300806-20221216-1-1"`, the same style as the Guide's eClaims sample `pClaimNumber="123456-20160930-2"`. Neither has 13 digits ([KI-31](/known-issues#ki-31)).

On the other side, codes `512` ("CF5 ClaimNumber not found in eClaims DB"), `513` ("CF5 ClaimNumber is already exist in CF5 DB with same series number") and `514` ("Series Number not found in eClaims DB") point to a check against claims PhilHealth already holds, which fits Annex E's description better. The workbook doesn't say when these codes apply.

**Recommendation (not from PhilHealth):** set `ClaimNumber` to the same value as the claim's `CLAIM@pClaimNumber`, because that is the only reading that works for a CF5 validated before upload, and confirm with PhilHealth. Our examples use `202609170001` in both files: 12 digits, which fits Annex C's `String(12)` and Annex E's all-digit `Varchar (13)`. See [KI-45](/known-issues#ki-45).
:::

## Developer workflow

```text
 HIS coding screen
      |
      v
 1. Capture and check PDx, SDx, RVS, laterality, extensions, newborn weight
      |
      v
 2. Build CF5 XML  (one CF5 per claim; pHospitalCode and ClaimNumber match the eClaims XML)
      |
      v
 3. Validate locally against CF5.dtd
      |
      v
 4. validateCF5  <-- body {cf5, eclaims}, both encrypted with the HF CIPHER KEY
      |
      v
 5. Decrypt the result, show errors and warnings, fix, repeat 4
      |
      v
 6. Encrypt the same CF5 XML with PhilHealth's PUBLIC KEY, host it at an HTTPS URL
      |
      v
 7. Add <DOCUMENT pDocumentType="CF5" pDocumentURL="https://..."/> to the claim,
    run eClaimsFileCheck on that final eClaims XML, then uploadeClaims
```

The Guide's `validateCF5` section covers step 4, and its "Important Note" covers steps 6 and 7: "After successful validation, CF5 XML should be encrypted using PhilHealth Public Key and submitted as attachment to electronic claims using the EclaimsUpload Method, with the Document Type set to CF5" ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). "EclaimsUpload" is the endpoint [`uploadeClaims`](/api/upload-eclaims) ([KI-09](/known-issues#ki-09)).

### The whole submission order

CF5 is one part of a claim. This site uses one order for the whole submission on every page.

::: tip Recommendation (not from PhilHealth): submission order
1. Build the XML files: eClaims, eSOA, CF5 and CF4 ([Steps 1–2](#step-1-capture-and-check-the-data) here).
2. Check each file locally against its DTD ([Step 3](#step-3-validate-locally-against-the-dtd)).
3. Call [`validateeSOA`](/api/validate-esoa) and [`validateCF5`](/api/validate-cf5) ([Steps 4–5](#step-4-call-validatecf5)).
4. Encrypt the attachments, CF5 included, with PhilHealth's public key, and host them at HTTPS URLs ([Step 6](#step-6-encrypt-the-cf5-for-attachment)).
5. Run [`eClaimsFileCheck`](/api/eclaims-file-check) on the final eClaims XML, with the live attachment URLs ([Step 7](#step-7-attach-it-to-the-claim-check-and-upload)).
6. Upload with [`uploadeClaims`](/api/upload-eclaims).
7. Store the eRECEIPT, with its receipt ticket number (RTN) and transmission control number (TCN).
8. Check the result with [`getUploadedClaimsMap`](/api/get-uploaded-claims-map).

The full walkthrough is in [Submitting a claim](/guides/submitting-a-claim).
:::

### Step 1: Capture and check the data

Enforce the form's rules in your data-entry screen, before any XML exists. The SSVTF evaluator checks that your system accepts only one PDx, up to 12 SDx and up to 20 RVS codes; ensures there are no repeated diagnosis codes; accepts laterality and extension codes; and accepts the newborn weight in kg with one decimal ([SSVTF p. 7–8](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)).

A minimal checker, in Python (our code, not PhilHealth's):

```python
import re
from datetime import date

LATERALITY = {"L", "R", "B", "N"}   # Annex E, rev. 20250217

def check_cf5_rules(pdx, sdx, procedures, birth_date: date, admission_date: date, weight_kg):
    """Return a list of problems. Rules from CF5 form v0.4, Annex E (Guide p. 88), SSVTF Part II A.II."""
    problems = []
    if not pdx:
        problems.append("Exactly one primary diagnosis (PDx) is required")
    if len(sdx) > 12:
        problems.append("At most 12 secondary diagnoses (SDx)")
    codes = [pdx] + list(sdx)
    if len(set(codes)) != len(codes):
        problems.append("No repeated codes across PDx and SDx")
    if len(procedures) > 20:
        problems.append("At most 20 RVS procedures")
    for p in procedures:
        if p["laterality"] not in LATERALITY:
            problems.append(f"{p['rvs']}: laterality must be L, R, B or N")
        for ext in ("ext1", "ext2"):
            # Blank is allowed here because the official samples use it (unconfirmed).
            if p[ext] and not re.fullmatch(r"[1-9]", p[ext]):
                problems.append(f"{p['rvs']}: {ext} must be a single digit 1-9")
    age_days = (admission_date - birth_date).days
    if age_days <= 27:                      # newborn: 0-27 days old
        if weight_kg is None:
            problems.append("Newborn admission weight is required (0-27 days old)")
        elif weight_kg < 0.3:               # 0.3 kg itself is accepted (KI-51)
            problems.append("Admission weight below 0.3 kg is invalid")
    return problems
```

### Step 2: Build the CF5 XML

Build one CF5 document per claim. The root holds exactly one `DRGCLAIM`, and `ClaimNumber` points at one `CLAIM` in the eClaims XML.

```python
import xml.etree.ElementTree as ET

def build_cf5(hospital_code, claim_number, pdx, sdx, procedures, weight_kg=None) -> bytes:
    root = ET.Element("CF5", pHospitalCode=hospital_code)       # = eCLAIMS@pHospitalCode
    claim = ET.SubElement(root, "DRGCLAIM", {
        "ClaimNumber": claim_number,                             # = CLAIM@pClaimNumber (KI-45)
        "PrimaryCode": pdx,
        # Every attribute is #REQUIRED in the DTD: send "" when the patient is not a newborn.
        "NewBornAdmWeight": "" if weight_kg is None else f"{weight_kg:.1f}",
        "Remarks": "",                                           # "Internal logs" (Annex E)
    })
    sd = ET.SubElement(claim, "SECONDARYDIAGS")                  # always present, may be empty
    for code in sdx:
        ET.SubElement(sd, "SECONDARYDIAG", SecondaryCode=code, Remarks="")
    pr = ET.SubElement(claim, "PROCEDURES")                      # always present, may be empty
    for p in procedures:
        ET.SubElement(pr, "PROCEDURE", {
            "RvsCode": p["rvs"], "Laterality": p["laterality"],
            "Ext1": p["ext1"], "Ext2": p["ext2"], "Remarks": "",
        })
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)  # UTF-8 bytes (KI-60)

# Our example claim (same as eclaims-minimal.xml): dengue fever, no SDx, no procedure.
cf5_xml = build_cf5("123456", "202609170001", "A90", [], [])

# A claim with procedures. The codes come from PhilHealth's own CF5 samples;
# the codes and laterality values are for illustration only.
procedures = [
    {"rvs": "69000", "laterality": "L", "ext1": "1", "ext2": "1"},
    {"rvs": "41108", "laterality": "N", "ext1": "1", "ext2": "1"},  # N = None (no side applies)
    {"rvs": "93631", "laterality": "N", "ext1": "1", "ext2": "2"},  # done twice: Ext2="2", listed once
]
other_xml = build_cf5("123456", "202609170002", "A01.0", ["A03.0", "A00.1"], procedures)
```

`cf5_xml` matches our [unofficial sample `cf5-sample.xml`](/examples/cf5-sample.xml) (without its comment and indentation). It is the same claim as our eClaims example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml): facility `123456`, claim number `202609170001`, and diagnosis `A90`. `other_xml` matches the [variant with procedures](/reference/cf5-xml#variant-with-procedures-fragment) on the reference page. We checked both outputs against `CF5.dtd` with lxml. For every attribute, see the [CF5 XML reference](/reference/cf5-xml).

::: tip What to put in `Remarks`
Annex E describes all three `Remarks` attributes as "Logs for internal key per value validation" with valid value "Internal logs". Every official sample sends `Remarks=""`. Do the same.
:::

### Step 3: Validate locally against the DTD

Catch structural mistakes before calling PhilHealth. Download [`CF5.dtd`](/originals/cf5/CF5.dtd) and [`cf5-sample.xml`](/examples/cf5-sample.xml) (or your own file) into one folder, then run this there:

```bash
uv run --quiet --with lxml python -c "from lxml import etree; d=etree.DTD(open('CF5.dtd','rb')); t=etree.parse('cf5-sample.xml'); print(d.validate(t), d.error_log.filter_from_errors())"
# Prints "True" and an empty error log. An invalid file prints "False" and the DTD errors.
```

The command uses the `uv` Python runner. With plain Python, run `pip install lxml` and the same code with `python -c`. Use the standalone `CF5.dtd`, not the Guide's v1.3 ([KI-06](/known-issues#ki-06)). The DTD only checks structure: element nesting, and that every required attribute is present. It does not check codes, counts, laterality values, or weights. See [Validating XML locally](/guides/validating-xml).

### Step 4: Call validateCF5

According to the Guide, this method "validates an encrypted CF5 XML file against the Document Type Definition (DTD), ensuring compliance with the required data format and values set by PhilHealth". It takes a JSON body with **two** encrypted envelopes ([Guide p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)):

| Key | Value |
|---|---|
| `cf5` | "The CF5 XML text encrypted using cipher key of the HF" |
| `eclaims` | "The e-Claims XML text encrypted using cipher key of the HF" |

HF is the health facility. The cipher key is the secret PhilHealth issues to the health facility for its certified software. The request also needs the `token` header from [`getToken`](/api/get-token). Both envelopes use the **cipher-key** scheme from Annex A: AES-256-CBC, key = SHA-256 of the cipher key, `key1` and `key2` empty. Use `"docMimeType": "text/xml"` for both XML payloads, as in the Guide's sample. Encode both XML texts as UTF-8; the DevKit doesn't name an encoding ([KI-60](/known-issues#ki-60)). Full details: [Encrypting API payloads](/guides/encryption/api-payloads).

The code uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `seal()` encrypts a text with your cipher key (`PECWS_CIPHER_KEY`), and `pecwsPost()` gets a fresh token and sends the JSON body.

::: code-group

```js [Node.js]
import { pecwsPost, seal } from './pecws-client.mjs'

// cf5Xml, eclaimsXml: the XML texts (or Buffers) you built
const body = {
  cf5: seal(cf5Xml, 'text/xml'),         // own random IV
  eclaims: seal(eclaimsXml, 'text/xml'), // the eClaims XML you will upload
}
const env = await pecwsPost('validateCF5', body)
console.log(JSON.stringify(env)) // keep the raw response: its format is undocumented (KI-42)
```

```python [Python]
import json
from pecws_client import pecws_post, seal

# cf5_xml, eclaims_xml: the XML texts (or bytes) you built
body = {
    "cf5": seal(cf5_xml, "text/xml"),          # own random IV
    "eclaims": seal(eclaims_xml, "text/xml"),  # the eClaims XML you will upload
}
env = pecws_post("validateCF5", body)
print(json.dumps(env))  # keep the raw response: its format is undocumented (KI-42)
```

:::

Each `seal()` call uses a new random initialization vector (IV). The DevKit does not give the host name, so set `PECWS_BASE_URL` from what PhilHealth tells you ([KI-30](/known-issues#ki-30)). Nor does it give the token lifetime, so the client gets a fresh token for every call ([KI-26](/known-issues#ki-26)). The code logs the whole envelope before it checks anything, instead of calling `assertSuccess()` right away: the DevKit doesn't say whether a failed validation comes back with `success: false`, and you need the error details either way. For more on the response, see [`validateCF5`](/api/validate-cf5#example).

::: tip Recommendation (not from PhilHealth): which eClaims XML to send
Send the eClaims XML that you are about to upload, containing the claim whose `pClaimNumber` equals the CF5 `ClaimNumber`. The encrypted CF5's URL may not exist yet at this point. To keep the validated file and the uploaded file identical, decide the CF5 attachment URL before you validate, for example from a fixed storage path. The DevKit doesn't say whether the `DOCUMENTS` section must already be final when you call `validateCF5` ([KI-62](/known-issues#ki-62)).
:::

### Step 5: Read the result: errors vs warnings

::: warning The `validateCF5` response is not documented (KI-42)
The Guide's `validateCF5` section stops after the "Sample Input Payload" (p. 18). It has no "Output" table or response sample, unlike `validateeSOA` (p. 10), so nothing says whether `result` is encrypted or what it contains ([KI-42](/known-issues#ki-42)). Our assumption, not a PhilHealth statement: expect the envelope (`success`, `message`, `result`) that every documented method returns, and confirm the exact shape with PhilHealth. For `validateeSOA`, the Guide says that when decrypted, `result` "may contains a response JSON object containing the error details", shown as `{"errors": ["string1", "string2", "string3"]}`. `validateCF5` may behave the same way, but the DevKit doesn't say so.
:::

If `result` comes back as an encrypted envelope (as it does for `validateeSOA`), decrypt it with the same cipher key: `unseal(env.result)` in Node.js or `unseal(env["result"])` in Python, from the same shared client. `unseal()` removes the zero padding, checks the SHA-256 hash and returns the text. The [`validateCF5` page](/api/validate-cf5#example) shows code that also handles a plain-text `result`.

The DevKit doesn't say whether `validateCF5` returns the codes of the [DRG error-code workbook](/reference/drg-error-codes), or in what format ([KI-36](/known-issues#ki-36), [KI-42](/known-issues#ki-42)). If it does, classify each message like this:

| Kind | Codes | What happens | What you do |
|---|---|---|---|
| **Warning** | `501`–`508` (sheet "Warning Codes") | "ICD-10 code / RVS code will be removed from the grouping logic and will proceed in finding the DRG code." | Grouping continues, so we read a warning as non-blocking (the DevKit doesn't say so outright). The removed code does not count toward the DRG, so fix the coding if you can. |
| **Error** | `101`–`110`, `201`–`228`, `301`–`303`, `401`–`409`, `411`–`418`, `509`, `511`–`518` | The workbook doesn't define what an error does. We assume it blocks the CF5. | Fix the data (CF5 or eClaims XML) and call `validateCF5` again. |

The SSVTF requires your system to show these results to the user: "Does the system display warning errors and major errors?" and "Does the system display the CF5 validation result?" ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11), Part II C.I). Recommendation (not from PhilHealth): show the message, the workbook's "Solution" text, and which field to fix.

Many errors are about the **eClaims XML**, not the CF5: sex, birth date, admission and discharge dates and times, and disposition. Send those in the formats the eClaims data dictionary requires (`MM-DD-YYYY`, `HH:MM:SSAM/PM`), even though the workbook's messages mention other formats ([KI-36](/known-issues#ki-36), [KI-49](/known-issues#ki-49)).

### Step 6: Encrypt the CF5 for attachment

Encrypt the **same CF5 XML bytes** again, this time with the attachment scheme:

- a random 32-byte AES password and a random 16-byte IV;
- AES-256-CBC;
- the password halves (`key1`, `key2`) and the IV encrypted with **PhilHealth's public key** (RSA; the padding isn't specified, and both demo kits use PKCS#1 v1.5, [KI-59](/known-issues#ki-59));
- the output wrapped in the same six-key JSON.

Follow [Encrypting attachments](/guides/encryption/attachments). The attachment guideline allows XML attachments ("e.g., Claim Form 4 (CF4)") and says PECWS "does not provide a service or method for encryption of the e-claim attachments" ([encryption guideline, p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). Don't use the bundled test certificate. It expired in 2014 ([KI-01](/known-issues#ki-01)).

The DevKit doesn't give a `docMimeType` for XML attachments. Our examples use `text/xml`; confirm with PhilHealth ([KI-57](/known-issues#ki-57)). With the site's example modules [`encrypt-attachment.mjs`](/examples/encryption/encrypt-attachment.mjs) and [`encrypt_attachment.py`](/examples/encryption/encrypt_attachment.py):

::: code-group

```python [Python]
import json

from encrypt_attachment import encrypt_attachment, load_philhealth_public_key  # from /examples/encryption/

with open("philhealth-cert.pem", "rb") as f:
    public_key = load_philhealth_public_key(f.read())  # current certificate from PhilHealth (KI-01)
attachment = encrypt_attachment(cf5_xml, "text/xml", public_key)  # the same bytes you validated
with open("CF5.enc", "w", encoding="ascii") as f:
    json.dump(attachment, f)
# Publish CF5.enc at, for example, https://files.samplehospital.example/eclaims/202609170001/CF5.enc
```

```js [Node.js]
import { readFileSync, writeFileSync } from 'node:fs';
import { encryptAttachment, loadPhilHealthPublicKey } from './encrypt-attachment.mjs'; // from /examples/encryption/

const publicKey = loadPhilHealthPublicKey(readFileSync('philhealth-cert.pem', 'utf8')); // current certificate from PhilHealth (KI-01)
const attachment = encryptAttachment(cf5Xml, 'text/xml', publicKey); // cf5Xml: a Buffer with the same bytes you validated
writeFileSync('CF5.enc', JSON.stringify(attachment));
// Publish CF5.enc at, for example, https://files.samplehospital.example/eclaims/202609170001/CF5.enc
```

:::

We ran both snippets with a throwaway certificate and decrypted the output with its private key: the result matched the input (`cf5_xml`, and the `cf5-sample.xml` file) byte for byte. Only PhilHealth can decrypt a file encrypted with its real certificate.

Host the encrypted file at an HTTPS URL that PhilHealth can reach. Annex C: `pDocumentURL` is the "URL of the document accessible via https. The document must first be encrypted using philhealth public key before publishing online" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). The SSVTF Stage 2 checks that PhilHealth can download the file, decrypt it, and get data identical to "the raw CF5 XML file", byte by byte ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).

### Step 7: Attach it to the claim, check and upload

Add a `DOCUMENT` to the `DOCUMENTS` element of the **matching `CLAIM`** in the eClaims XML. Once every attachment URL is live, run [`eClaimsFileCheck`](/api/eclaims-file-check) on that final eClaims XML, then upload it with [`uploadeClaims`](/api/upload-eclaims) and store the eRECEIPT ([submission order](#the-whole-submission-order)):

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="CSF" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CSF.enc"/>
  <DOCUMENT pDocumentType="CF5" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF5.enc"/>
</DOCUMENTS>
```

The URLs are made-up examples for our sample claim `202609170001`. Which other documents a claim needs depends on the benefit ([Document type codes](/reference/document-types)); [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) shows a whole claim. For the submission flow, see [Submitting a claim](/guides/submitting-a-claim).

::: info What the certification evaluator checks for CF5
SSVTF Part II ([p. 7–8, 10–11, 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)):
- **A.II Data completeness** (items 1–7): the form rules in the table above.
- **B.II Process requirement**: "generate the CF5 in XML format", "upload and attach the encrypted CF5 XML data to the claim", and "Can the CF5 data be viewed on PhilHealth's side?"
- **C.I Controls and validations**: display warnings and major errors, and display the CF5 validation result.
- **Stage 2, B.5**: the decrypted file matches the raw CF5 XML.

Details: [Software certification](/guides/certification).
:::

## Common mistakes

- **Using the wrong key.** The `validateCF5` body uses the health facility's **cipher key**. The attached CF5 file uses **PhilHealth's public key**. Each channel expects its own scheme, so swapping them makes decryption fail on PhilHealth's side ([KI-12](/known-issues#ki-12)).
- **Sending only the CF5 to `validateCF5`.** The body needs both `cf5` and `eclaims`. The grouper takes patient and stay data from the eClaims XML.
- **Mismatched identifiers.** A `ClaimNumber` or `pHospitalCode` that doesn't match the eClaims XML gives `222` or `509`.
- **Leaving out "empty" attributes.** Every attribute is `#REQUIRED`. Write `NewBornAdmWeight=""`, `Remarks=""`, and so on. An omitted attribute fails the DTD.
- **Leaving out empty containers.** `DRGCLAIM` requires both `SECONDARYDIAGS` and `PROCEDURES`, even when they are empty. Write `<SECONDARYDIAGS/>`.
- **Blank laterality.** The old form said to leave it blank. Since 20250217, send `N` ([KI-05](/known-issues#ki-05)).
- **Repeating codes.** A secondary diagnosis equal to the PDx, a duplicate SDx, or a repeated RVS code produces warnings `502`, `503` or `507`, and the grouper drops the code.
- **Weight in grams or with a unit.** Send `"2.8"`, not `"2800"` or `"2.8 kg"`.
- **Trusting the Guide's DTD for multiple diagnoses.** The Guide's v1.3 DTD rejects zero or several SDx. Use the standalone `CF5.dtd` ([KI-06](/known-issues#ki-06)).
- **Copying PhilHealth's samples as-is.** They use `Laterality=""`, an empty `RvsCode=""` (Guide p. 18), an odd 7-character `RvsCode="219ss20"`, and a duplicated `93631` (`DRG XML EFORMS FORMAT.xml`, [KI-28](/known-issues#ki-28)). They show the structure, not valid data.
- **Using the hex string of the cipher-key hash as the AES key.** Use the raw 32-byte digest ([KI-14](/known-issues#ki-14)).

## Known issues touching CF5

- [KI-05](/known-issues#ki-05): laterality, blank vs `N`.
- [KI-06](/known-issues#ki-06): two CF5 DTDs.
- [KI-12](/known-issues#ki-12): the cipher key for `validateCF5` vs the public key for the attachment.
- [KI-28](/known-issues#ki-28): the official `DRG XML EFORMS FORMAT.xml` sample has an invalid RVS code (`219ss20`) and a duplicated one (`93631`).
- [KI-31](/known-issues#ki-31): `ClaimNumber` and `pHospitalCode` lengths.
- [KI-36](/known-issues#ki-36): the error-code workbook's mixed date and time formats, contradictory or reversed solution texts (`204`, `219`–`221`), and codes for removed fields.
- [KI-42](/known-issues#ki-42): the `validateCF5` response is undocumented (see [Step 5](#step-5-read-the-result-errors-vs-warnings)).
- [KI-45](/known-issues#ki-45): whether `ClaimNumber` is the hospital's claim number or a number PhilHealth assigns.
- [KI-48](/known-issues#ki-48): facility identifiers (PMCC number vs accreditation number).
- [KI-51](/known-issues#ki-51): newborn weight, "greater than 0.3 kg" vs "0.3 kg and up".
- [KI-56](/known-issues#ki-56): the SSVTF laterality item mentions left, right, or both, but not `N`.
- [KI-57](/known-issues#ki-57): no `docMimeType` is given for XML attachments.
- [KI-58](/known-issues#ki-58): the CF5 form's 30-day filing deadline vs 60 days on the CF4 form.
- [KI-59](/known-issues#ki-59): the RSA padding for the attachment is not specified.
- [KI-60](/known-issues#ki-60): the text encoding is not specified (use UTF-8).
- [KI-62](/known-issues#ki-62): whether the eClaims XML sent to `validateCF5` must already contain its final `DOCUMENTS` section and be identical to the uploaded file.
- [KI-63](/known-issues#ki-63): the DRG manuals (ICD-10 and RVS code lists, extension-code rules), blank `Ext1`/`Ext2`, the grouper's DRG codes, and shadow billing (which facilities take part; the paper form's Part II/III signatures).

## Related pages

- [CF5 XML reference](/reference/cf5-xml): every element and attribute, both DTDs, and the validated sample
- [DRG error codes](/reference/drg-error-codes): all codes, warnings vs errors
- [`validateCF5`](/api/validate-cf5): endpoint reference
- [Encrypting API payloads](/guides/encryption/api-payloads) and [Encrypting attachments](/guides/encryption/attachments)
- [Submitting a claim](/guides/submitting-a-claim) and [`uploadeClaims`](/api/upload-eclaims)
- [Software certification (SSVTF)](/guides/certification)
- [Glossary](/getting-started/glossary)
