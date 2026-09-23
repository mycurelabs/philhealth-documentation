---
title: CF5 XML (DRG)
description: Element-by-element reference for the CF5 (DRG shadow billing) XML, both DTD variants side by side, the DTD history, and a DTD-validated example.
---

# CF5 XML (DRG)

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

This page is the field reference for the Claim Form 5 (CF5) XML. The CF5 carries the Diagnosis-Related Groups (DRG) coding of one claim. It merges the DTD with the Annex E data dictionary, shows the two conflicting DTD versions side by side, and gives a DTD-validated example. For the rules behind each field and the submission workflow, read [Building CF5 (DRG)](/guides/cf5) first.

::: info Sources
- [`CF5.dtd`](/originals/cf5/CF5.dtd): standalone DTD (revision 20240604)
- [`20240604_ CF5 DTD_DRG XML EFORMS FORMAT.pdf`](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf): amendment history (p. 1), same DTD (p. 2–3), sample (p. 4)
- [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml): official sample
- [Implementation Guide (rev. 20250217), p. 16–18: `validateCF5`, "DRG E-Claims DTD" v1.3, sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)
- [Implementation Guide, p. 88: Annex E, "Data Dictionary validateCF5"](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)
- [Implementation Guide, p. 3–4: revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 29: eClaims XML sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29), [p. 79: Annex C `pHospitalCode`, `pClaimNumber`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [SSVTF (rev. 20250217), p. 7–8: CF5 data-completeness criteria](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)
- [CF5 paper form v0.4 (February 2024)](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf)
- [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)
:::

::: tip TL;DR
- Validate locally against the standalone [`CF5.dtd`](/originals/cf5/CF5.dtd), not the DTD printed in the Guide (our recommendation, [KI-06](/known-issues#ki-06)).
- Every attribute is required, even when its value is empty. Send `<SECONDARYDIAGS/>` and `<PROCEDURES/>` when there is nothing to list.
- Copy `pHospitalCode` and the claim number from the eClaims XML of the same claim (our recommendation for the claim number, [KI-45](/known-issues#ki-45)).
- `Laterality` is `L`, `R`, `B`, or `N`. Use `N`, not a blank, when no side applies ([KI-05](/known-issues#ki-05)). The newborn weight is in kg with one decimal. We accept 0.3 and above ([KI-51](/known-issues#ki-51)).
- Start from our [`cf5-sample.xml`](/examples/cf5-sample.xml). It is valid against the standalone `CF5.dtd` but not against the Guide's v1.3 DTD, because it has no secondary diagnosis and no procedure ([KI-06](/known-issues#ki-06)). Send it, or your own file, to [`validateCF5`](/api/validate-cf5) early.
- The DRG code lists and manuals are not in the DevKit, and nothing says whether blank `Ext1`/`Ext2` are accepted ([KI-63](/known-issues#ki-63)).
:::

::: warning Which DTD? (KI-06)
The DevKit has two CF5 DTDs that disagree on how many secondary diagnoses and procedures are allowed. **We recommend the standalone [`CF5.dtd`](/originals/cf5/CF5.dtd) (20240604).** Its revision is newer than the DTD printed in the Guide (v1.3, 2024-02-15; the Guide document itself was revised in 2025, but that DTD was not updated). It is also the only one that allows more than one secondary diagnosis ("up to 12") and zero or more procedures. Confirm with `validateCF5`. Details: [The two DTD variants](#the-two-dtd-variants) and [KI-06](/known-issues#ki-06).
:::

## Element tree

Occurrence follows the standalone `CF5.dtd` (`*` zero or more, `+` one or more; no marker means exactly one). No element has text content: `SECONDARYDIAG` and `PROCEDURE` are declared `EMPTY`, and all data lives in attributes.

```text
CF5                       @pHospitalCode
└── DRGCLAIM              @ClaimNumber @PrimaryCode @NewBornAdmWeight @Remarks
    ├── SECONDARYDIAGS    (always present, may be empty)
    │   └── SECONDARYDIAG*      @SecondaryCode @Remarks        (EMPTY; business rule: max 12)
    └── PROCEDURES        (always present, may be empty)
        └── PROCEDURE*          @RvsCode @Laterality @Ext1 @Ext2 @Remarks   (EMPTY; business rule: max 20)
```

In the Guide's v1.3 DTD, `SECONDARYDIAG` occurs exactly once (no marker) and `PROCEDURE` is `+`.

Things to know before you read the tables:

- **Abbreviations.** PDx = primary diagnosis; SDx = secondary diagnosis; ICD-10 = International Classification of Diseases, 10th revision (diagnosis codes); RVS = Relative Value Scale (procedure codes); SSVTF = Software Solution Validation Test Form (PhilHealth's certification checklist); PMCC No. = the facility code PhilHealth assigns (the DevKit does not spell out the acronym). See the [glossary](/getting-started/glossary).
- **Every attribute is `CDATA #REQUIRED`** in both DTDs. Each attribute must be present, even if its value is empty (`NewBornAdmWeight=""`). The DTD can't check codes, lengths, formats, or counts. The server-side checks are listed in [DRG error codes](/reference/drg-error-codes).
- **Element order is fixed.** `SECONDARYDIAGS` comes before `PROCEDURES` inside `DRGCLAIM`.
- **Names are case-sensitive.** Most CF5 attributes use PascalCase without the `p` prefix (`ClaimNumber`, `RvsCode`, `Ext1`). The exception is `pHospitalCode` on the root. This differs from the eClaims XML, which uses `p` prefixes everywhere (`pClaimNumber`, `pRVSCode`).
- **No DOCTYPE, no namespace.** Neither official sample has an XML declaration or a `DOCTYPE` line. The standalone DTD's comment shows `<!DOCTYPE CF5 SYSTEM "CF5.dtd">` as a usage example for local validation.

In the tables below, "Annex E" means [Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88). The Annex E types are `Varchar (n)` = text of up to *n* characters, and `Numeric (p,s)` = number.

## `CF5` (root)

Identifies the health facility. Contains exactly one `DRGCLAIM`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pHospitalCode` | Yes (`CDATA #REQUIRED`) | `Varchar (6)` | "6-digits alphanumeric code. Format: 999999 or X99999". Must equal `eCLAIMS@pHospitalCode` in the eClaims XML (error `509`); must not be empty (`303`) | "A unique code assigned by PhilHealth to the health facility, also known as the PMCC No." | DTD; Annex E; error codes `303`, `509` |

Sample values: `300806` (Guide p. 18) and `300829` (`DRG XML EFORMS FORMAT.xml`). Our examples use `123456` in both the CF5 and the eClaims XML. The eClaims XML types the same concept as `String(12)` ([KI-31](/known-issues#ki-31)), and the DevKit never says which facility identifier each API method expects ([KI-48](/known-issues#ki-48)).

## `DRGCLAIM`

The DRG data for one claim. Content: `(SECONDARYDIAGS, PROCEDURES)`, both required and in that order.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `ClaimNumber` | Yes | `Varchar (13)` | Annex E: "Format: 9999999999999". Error `222`: "Claim number must exist in eClaims XML (pClaimNumber 'xml attribute')". Must not be empty (`511`). See the warning below | Annex E: "A reference number assigned to the claim upon successful submission of claim via eClaims API" | DTD; Annex E; errors `222`, `511`–`513` |
| `PrimaryCode` | Yes | `Varchar (15)` | "Valid ICD10 codes". Exactly one code. Include the digits after the decimal point, for example `A01.0` (form). For dagger-asterisk pairs, the dagger code goes here (form) | "The corresponding ICD10 code for primary diagnosis" | DTD; Annex E; form; errors `101`, `201`, `401`, `411`–`415` |
| `NewBornAdmWeight` | Yes | `Numeric (2,1)` | Newborns (0–27 days old): weight in kg, "Formatted as: ##.#", "Up to one (1) decimal places only", "Should be greater than 0.3 kg" (Annex E) / "0.3 kg and up" (error `418`) ([KI-51](/known-issues#ki-51)). Everyone else: `""` | "This is applicable to newborn patients (0-27 days old), refers to the admission weight of newborn in kilogram (kg)" | DTD; Annex E; form; errors `109`, `227`, `228`, `409`, `418` |
| `Remarks` | Yes | `Varchar (2000)` | "Internal logs". All samples send `""` | "Logs for internal key per value validation" | DTD; Annex E |

::: warning ClaimNumber: which number? (KI-45)
Annex E says 13 digits "assigned … upon successful submission of claim via eClaims API". But `validateCF5` runs **before** submission, and error `222` requires the value to exist as `CLAIM@pClaimNumber` in the eClaims XML. Annex C calls that the "Hospital Generated Claim Case #". The official samples use `300806-20221216-1-1` (Guide p. 18) and `2601` (`DRG XML EFORMS FORMAT.xml`), and neither has 13 digits ([KI-31](/known-issues#ki-31)). On the other hand, codes `512` ("CF5 ClaimNumber not found in eClaims DB"), `513` and `514` ("Series Number not found in eClaims DB") suggest a lookup in PhilHealth's database, which fits Annex E better; the workbook doesn't say when they apply.

**Recommendation (not from PhilHealth):** use the claim's `pClaimNumber`, the only value available before upload, and confirm with PhilHealth. Our examples use `202609170001` in both files. It has 12 digits, so it fits Annex C's `String(12)` and Annex E's all-digit `Varchar (13)`. See [KI-45](/known-issues#ki-45).
:::

::: warning `NewBornAdmWeight`: `Numeric (2,1)` vs `##.#`, and the 0.3 kg boundary (KI-51)
- Read as a SQL type (our reading), `Numeric (2,1)` allows two digits in total, one after the point, so at most `9.9`. The format `##.#` and the paper form's two boxes before the point allow up to `99.9`. Newborn weights are well under 10 kg, so this rarely matters. Send one decimal place, for example `2.8` or `3.0`.
- Annex E says "Should be greater than 0.3 kg", which excludes 0.3. The form ("Admission weight less than 0.3kg is considered invalid") and errors `228`/`418` ("must not be lower than 0.3 kg", "0.3 kg and up") accept 0.3.

**Recommendation (not from PhilHealth):** accept 0.3 and above with one decimal place, and let `validateCF5` confirm. See [KI-51](/known-issues#ki-51) and [Building CF5](/guides/cf5#newborn-admission-weight).
:::

## `SECONDARYDIAGS` and `SECONDARYDIAG`

`SECONDARYDIAGS` is a required container with no attributes. Standalone DTD: `(SECONDARYDIAG)*`, zero or more. Guide v1.3: `(SECONDARYDIAG)`, exactly one. Send an empty `<SECONDARYDIAGS/>` when there are no secondary diagnoses.

`SECONDARYDIAG` is `EMPTY` (attributes only). Send one per secondary diagnosis, up to 12.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `SecondaryCode` | Yes | `Varchar (15)` | "Valid ICD10 codes". Up to 12 in total. No repeats among SDx or with the PDx (form, SSVTF). For dagger-asterisk pairs, the asterisk code goes here (form) | "The ICD-10 codes corresponding to the secondary conditions diagnosed, up to a total of 12 codes" | DTD; Annex E; form; error `202`; warnings `501`–`505` |
| `Remarks` | Yes | `Varchar (2000)` | "Internal logs". Send `""` | "Logs for internal key per value validation" | DTD; Annex E |

## `PROCEDURES` and `PROCEDURE`

`PROCEDURES` is a required container with no attributes. Standalone DTD: `(PROCEDURE)*`, zero or more. Guide v1.3: `(PROCEDURE)+`, one or more. Send an empty `<PROCEDURES/>` when no procedure was done.

`PROCEDURE` is `EMPTY`. Send one per procedure, up to 20.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `RvsCode` | Yes | `Varchar (6)` | "Valid RVS code". Up to 20 in total. Don't repeat a code (warning `507`) | "The RVS codes corresponding to the procedure performed, up to a total of 20 codes" | DTD; Annex E; form; error `203`; warnings `506`–`508` |
| `Laterality` | Yes | `Varchar (1)` | `L` = Left, `R` = Right, `B` = Both, `N` = None ([KI-05](/known-issues#ki-05): older sources say leave blank) | "Refer to the side of the body on which a procedure was performed, either left, right or both" | DTD; Annex E (rev. 20250217); error `204` |
| `Ext1` | Yes | `Numeric (1)` | `1`–`9` (single digit). Samples send `""`; whether blank is accepted is unspecified ([KI-63](/known-issues#ki-63)) | "Refer to the number of body sites" | DTD; Annex E; errors `205`, `206` |
| `Ext2` | Yes | `Numeric (1)` | `1`–`9` (single digit). Samples send `""`; whether blank is accepted is unspecified ([KI-63](/known-issues#ki-63)) | "Refer to the number of times the procedure was done" | DTD; Annex E; errors `207`, `208` |
| `Remarks` | Yes | `Varchar (2000)` | "Internal logs". Send `""` | "Logs for internal key per value validation" | DTD; Annex E |

## Rules the DTD cannot enforce

The DTD only checks structure. Your system must enforce these rules, and PhilHealth's `validateCF5` checks them on its side.

| Rule | Your system should | Server-side code if broken |
|---|---|---|
| Exactly 1 PDx | Allow one PDx and require it | `101`, `401` |
| PDx and SDx are valid ICD-10 codes | Use PhilHealth's DRG code list (not in the DevKit, [KI-63](/known-issues#ki-63)) | `201`, `411`; `202` / warning `501` |
| Up to 12 SDx | Cap the list at 12 | none listed |
| No repeated diagnosis codes | Block duplicates | warnings `502`, `503` |
| Up to 20 RVS codes | Cap the list at 20 | none listed |
| RVS code is valid | Use PhilHealth's RVS list (not in the DevKit, [KI-63](/known-issues#ki-63)) | `203` / warning `506` |
| No repeated RVS code | Block duplicates; use `Ext2` for repeat counts | warning `507` |
| Laterality is `L`, `R`, `B`, or `N` | Offer only these four | `204` |
| `Ext1`, `Ext2` are single digits 1–9 | Numeric input, one digit | `205`–`208` |
| Newborn weight required for ages 0–27 days, at least 0.3 kg, one decimal place ([KI-51](/known-issues#ki-51)) | Compute the age from the eClaims birth date and admission date | `109`, `227`, `228`, `409`, `418` |
| `pHospitalCode` and `ClaimNumber` match the eClaims XML ([KI-45](/known-issues#ki-45)) | Copy them from the claim you are submitting | `222`, `303`, `509`, `511` |

## The two DTD variants

The DevKit ships the CF5 DTD twice, and the two copies differ.

| | Standalone DTD | Guide DTD |
|---|---|---|
| File | [`cf5/CF5.dtd`](/originals/cf5/CF5.dtd), identical to p. 2–3 of the [20240604 PDF](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=2) | Printed in the [Implementation Guide p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17) |
| Label / date | Revision 20240604 (PDF amendment history) | "DRG E-Claims DTD History … Version 1.3 … 2024-02-15" |
| Header comment | Leftover editor-template placeholders ("TODO define vocabulary identification", "Put your DTDDoc comment here."), no version history | Version history 1.0–1.3 |

### Differences

| Declaration | Standalone `CF5.dtd` (20240604) | Guide v1.3 (2024-02-15) | Effect |
|---|---|---|---|
| `<!ELEMENT SECONDARYDIAGS …>` | `(SECONDARYDIAG)*`: zero or more | `(SECONDARYDIAG)`: **exactly one** | v1.3 rejects a claim with no SDx or with 2–12 SDx |
| `<!ELEMENT PROCEDURES …>` | `(PROCEDURE)*`: zero or more | `(PROCEDURE)+`: one or more | v1.3 rejects a claim with no procedure |
| `DRGCLAIM` attribute order | `ClaimNumber, PrimaryCode, NewBornAdmWeight, Remarks` | `PrimaryCode, NewBornAdmWeight, Remarks, ClaimNumber` | None. Attribute order never matters in XML |
| Everything else | same | same | `CF5 (DRGCLAIM)`, `DRGCLAIM (SECONDARYDIAGS,PROCEDURES)`, both leaf elements `EMPTY`, same attribute names, all `CDATA #REQUIRED` |

### What validates where

We validated test documents against both DTDs with `lxml` 6.1.3. The Guide's v1.3 DTD was re-typed from p. 17 for this test.

| Test document | Standalone `CF5.dtd` | Guide v1.3 |
|---|---|---|
| 0 SDx, 0 procedures (our [`cf5-sample.xml`](/examples/cf5-sample.xml) and the [newborn variant](#newborn-variant-fragment)) | valid | **invalid**: "expecting (SECONDARYDIAG), got" nothing, and "expecting (PROCEDURE)+, got" nothing |
| 0 SDx, 1 procedure | valid | **invalid**: "expecting (SECONDARYDIAG), got" nothing |
| 1 SDx, 1 procedure | valid | valid |
| 2 SDx, 3 procedures (our [variant with procedures](#variant-with-procedures-fragment)) | valid | **invalid**: "expecting (SECONDARYDIAG), got (SECONDARYDIAG SECONDARYDIAG)" |
| 13 SDx | valid (the DTD doesn't count) | invalid |
| 1 SDx, 0 procedures | valid | **invalid**: "expecting (PROCEDURE)+, got" nothing |
| 1 SDx, 21 procedures | valid (the DTD doesn't count) | valid |
| `NewBornAdmWeight` attribute omitted | **invalid** | **invalid** |
| `Laterality="X"` | valid (CDATA) | valid (CDATA) |
| Guide p. 18 sample | valid | valid |
| `DRG XML EFORMS FORMAT.xml` | valid | valid |

Both official samples pass both DTDs only because each has exactly one secondary diagnosis and at least one procedure.

::: tip Recommendation (not from PhilHealth)
Validate locally against the standalone `CF5.dtd`. It is the newer file, and it matches the "up to 12 SDx / up to 20 RVS" rules in Annex E, the form, and the SSVTF. Before go-live, send `validateCF5` a CF5 with **zero** SDx and one with **two or more** SDx. That shows which DTD PhilHealth's server uses. If the server rejects either one, report it to PhilHealth. See [KI-06](/known-issues#ki-06).
:::

### Raw DTDs

::: details Raw DTD (CF5.dtd, standalone, revision 20240604)
Copied verbatim from [`cf5/CF5.dtd`](/originals/cf5/CF5.dtd):

```xml
<?xml version='1.0' encoding='UTF-8'?>

<!--
    TODO define vocabulary identification
    PUBLIC ID: -//vendor//vocabulary//EN
    SYSTEM ID: http://server/path/CF5.dtd

-->

<!--
    An example how to use this DTD from your XML document:

    <?xml version="1.0"?>

    <!DOCTYPE CF5 SYSTEM "CF5.dtd">

    <CF5>
    ...
    </CF5>
-->

<!---
Put your DTDDoc comment here. -->
<!ELEMENT CF5 (DRGCLAIM)>
<!ATTLIST CF5 pHospitalCode CDATA #REQUIRED
  >

<!---
Put your DTDDoc comment here. -->
<!ELEMENT DRGCLAIM (SECONDARYDIAGS,PROCEDURES)>
<!ATTLIST DRGCLAIM
  ClaimNumber CDATA #REQUIRED
  PrimaryCode CDATA #REQUIRED
  NewBornAdmWeight CDATA #REQUIRED
  Remarks CDATA #REQUIRED
  >

<!---
Put your DTDDoc comment here. -->
<!ELEMENT SECONDARYDIAGS (SECONDARYDIAG)*>

<!---
Put your DTDDoc comment here. -->
<!ELEMENT SECONDARYDIAG EMPTY>
<!ATTLIST SECONDARYDIAG
  SecondaryCode CDATA #REQUIRED
  Remarks CDATA #REQUIRED
  >

<!---
Put your DTDDoc comment here. -->
<!ELEMENT PROCEDURES (PROCEDURE)*>

<!---
Put your DTDDoc comment here. -->
<!ELEMENT PROCEDURE EMPTY>
<!ATTLIST PROCEDURE
  RvsCode CDATA #REQUIRED
  Laterality CDATA #REQUIRED
  Ext1 CDATA #REQUIRED
  Ext2 CDATA #REQUIRED
  Remarks CDATA #REQUIRED>
```
:::

::: details Raw DTD (Guide p. 17, "DRG E-Claims DTD" v1.3)
Transcribed from the [Implementation Guide, p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17). Spelling ("thier") and version labels are kept as printed. Indentation may differ slightly from the PDF.

```xml
<?xml version='1.0' encoding='UTF-8'?>
<!--
    DRG E-Claims DTD History
    DIAGNOSTIC RELATED GROUP Version 1.0
    Version History
        1.0 2023-05-16 by JHEONARD
            : Testing part since e form not in thier final form

    DRG E-Claims DTD History
    DIAGNOSTIC RELATED GROUP Version 1.1
    Version History
        1.1 2023-06-7 by JHEONARD
            : Final Forms of DRG E-Forms
            : Add possible required for claims but not yet final

    DRG E-Claims DTD History
    DIAGNOSTIC RELATED GROUP Version 1.3
    Version History
        1.2 2023-07-12 by JHEONARD
            : Remove duplicate data

   DRG E-Claims DTD History
    DIAGNOSTIC RELATED GROUP Version 1.3
    Version History
        1.3 2024-02-15 by JHEONARD
            : Remove duplicate data
            : Remove Attributes (Series,Lhio,Admission Time)
            : Rename Tag (DRG - CF5)
-->

<!ELEMENT CF5 (DRGCLAIM)>
<!ATTLIST CF5 pHospitalCode CDATA #REQUIRED
   >

<!ELEMENT DRGCLAIM (SECONDARYDIAGS,PROCEDURES)>
<!ATTLIST DRGCLAIM
   PrimaryCode CDATA #REQUIRED
   NewBornAdmWeight CDATA #REQUIRED
   Remarks CDATA #REQUIRED
   ClaimNumber CDATA #REQUIRED
   >

<!ELEMENT SECONDARYDIAGS (SECONDARYDIAG)>
<!ELEMENT SECONDARYDIAG EMPTY>
<!ATTLIST SECONDARYDIAG
   SecondaryCode CDATA #REQUIRED
   Remarks CDATA #REQUIRED
                >
<!ELEMENT PROCEDURES (PROCEDURE)+>
<!ELEMENT PROCEDURE EMPTY>
<!ATTLIST PROCEDURE
   RvsCode CDATA #REQUIRED
   Laterality CDATA #REQUIRED
   Ext1 CDATA #REQUIRED
   Ext2 CDATA #REQUIRED
   Remarks CDATA #REQUIRED
>
```
:::

## DTD and format history

Collected from the Guide's DTD comment (p. 17), the 20240604 PDF (p. 1), and the Guide's revision history (p. 3–4).

| Date | Version / revision | Change (as written) | Source |
|---|---|---|---|
| 2023-05-16 | DTD 1.0 | "Testing part since e form not in thier final form" | Guide p. 17 |
| 2023-06-07 | DTD 1.1 | "Final Forms of DRG E-Forms"; "Add possible required for claims but not yet final" | Guide p. 17 |
| 2023-07-12 | DTD 1.2 | "Remove duplicate data". The block header above it says "Version 1.3", a copy-paste slip | Guide p. 17 |
| 2024-02-15 | DTD 1.3 | "Remove duplicate data"; "Remove Attributes (Series,Lhio,Admission Time)"; "Rename Tag (DRG - CF5)" | Guide p. 17 |
| 2024-02-15 | Guide 20240215 | "Initial Release for the SearchCaseRate, GenerateToken, ValidateEsoa and ValidateCF5 methods" | Guide p. 3 |
| Feb 2024 | Paper form v0.4 | "Supplementary Form for DRG, v0.4 revised February 2024" | [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) |
| 2024-06-04 | Revision 20240604 | "Remove the attributes of NewBornTimeOfBirth from CF5 XML". This is the standalone `CF5.dtd` | [20240604 PDF p. 1](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf#page=1) |
| 2024-08-23 | Guide 20240823 | "Added Data Dictionary of CF5" (Annex E) | Guide p. 3 |
| 2025-02-17 | Guide 20250217 | "Updated the Data Dictionary of CF5 to set 'N' (None) as the valid value for Laterality" | Guide p. 4; [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf) |

::: warning Version labels in the Guide's DTD comment
The block for "1.2 2023-07-12" is headed "DIAGNOSTIC RELATED GROUP Version 1.3", and so is the real 1.3 block below it. It looks like a copy-paste slip. The date "2023-06-7" (version 1.1) is also printed without a leading zero. Neither affects validation.
:::

Two consequences for developers:

- The CF5 no longer carries the attributes named "Series", "Lhio" and "Admission Time" (removed in v1.3), or the newborn time of birth (removed in 20240604). Our reading of the error codes: admission and discharge data now come from the eClaims XML you pass to `validateCF5`.
- The error-code workbook still lists time-of-birth errors (`110`, `210`, `211`) and a "Series Number not found" error (`514`), even though those fields were removed ([KI-36](/known-issues#ki-36)). See [DRG error codes](/reference/drg-error-codes#inconsistencies-inside-the-workbook).

## Examples

### Unofficial DTD-valid example

[`/examples/cf5-sample.xml`](/examples/cf5-sample.xml) is **our own example, not a PhilHealth sample**. It is the CF5 for the same claim as our eClaims example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml): an adult inpatient with dengue fever, no secondary diagnosis, and no procedure. It is **valid against the standalone `CF5.dtd`**, checked with `lxml` 6.1.3. It is **not** valid against the Guide's v1.3 DTD, which requires exactly one `SECONDARYDIAG` and at least one `PROCEDURE`.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CF5 pHospitalCode="123456">
  <DRGCLAIM ClaimNumber="202609170001" PrimaryCode="A90" NewBornAdmWeight="" Remarks="">
    <SECONDARYDIAGS/>
    <PROCEDURES/>
  </DRGCLAIM>
</CF5>
```

(The file also has a comment block explaining these choices. It is omitted here.)

What the example shows:

- `pHospitalCode="123456"` and `ClaimNumber="202609170001"` are the same values as `eCLAIMS@pHospitalCode` and `CLAIM@pClaimNumber` in the eClaims example (errors `509` and `222`). Putting the hospital's claim number here is our recommendation ([KI-45](/known-issues#ki-45)).
- `PrimaryCode="A90"` repeats the diagnosis code of the eClaims XML's `ICDCODE`. The DevKit's CF4 ICD library (`lib_icd.xlsx`) lists `A90` without a decimal part. Check real codes against PhilHealth's DRG code list, which is not in the DevKit ([KI-63](/known-issues#ki-63)).
- Because the file has no `SECONDARYDIAG` and no `PROCEDURE`, it is exactly the case KI-06 says to confirm. Send it to `validateCF5` early. A structural rejection (for example error `302`, "Required element not found") would suggest that the server still applies the Guide's v1.3 DTD; report it to PhilHealth ([KI-06](/known-issues#ki-06)).
- `<SECONDARYDIAGS/>` and `<PROCEDURES/>` are sent empty. `DRGCLAIM` requires both containers, even when there is nothing to list.
- `NewBornAdmWeight=""` and `Remarks=""`: required attributes sent empty. The patient is an adult, so no weight applies.

### Variant with procedures (fragment)

This fragment is a different claim at the same facility. It shows secondary diagnoses, procedures, `Laterality`, and the extension codes. The claim number `202609170002` is made up. The diagnosis and RVS codes are copied from PhilHealth's own CF5 samples, and the laterality values are illustrative only. The fragment is valid against the standalone DTD and invalid against v1.3, because it has two `SECONDARYDIAG` elements.

```xml
<CF5 pHospitalCode="123456">
  <DRGCLAIM ClaimNumber="202609170002" PrimaryCode="A01.0" NewBornAdmWeight="" Remarks="">
    <SECONDARYDIAGS>
      <SECONDARYDIAG SecondaryCode="A03.0" Remarks=""/>
      <SECONDARYDIAG SecondaryCode="A00.1" Remarks=""/>
    </SECONDARYDIAGS>
    <PROCEDURES>
      <PROCEDURE RvsCode="69000" Laterality="L" Ext1="1" Ext2="1" Remarks=""/>
      <PROCEDURE RvsCode="41108" Laterality="N" Ext1="1" Ext2="1" Remarks=""/>
      <PROCEDURE RvsCode="93631" Laterality="N" Ext1="1" Ext2="2" Remarks=""/>
    </PROCEDURES>
  </DRGCLAIM>
</CF5>
```

What the fragment shows:

- `Laterality="N"` where no side applies (rev. 20250217, [KI-05](/known-issues#ki-05)), and `L` where one does.
- `Ext1="1"`: one body site.
- `Ext2="2"` instead of listing `93631` twice. This is our reading of Annex E ("number of times the procedure was done") and warning `507`.

### Newborn variant (fragment)

A newborn claim with no secondary diagnosis and no procedure. It is valid against the standalone DTD and invalid against v1.3, which requires exactly one `SECONDARYDIAG` and at least one `PROCEDURE`. `P07.3` appears in the DevKit's CF4 ICD library as "Other preterm infants". The weight and the claim number `202609170003` are made up.

```xml
<CF5 pHospitalCode="123456">
  <DRGCLAIM ClaimNumber="202609170003" PrimaryCode="P07.3" NewBornAdmWeight="1.8" Remarks="">
    <SECONDARYDIAGS/>
    <PROCEDURES/>
  </DRGCLAIM>
</CF5>
```

### Official samples

Both official samples are well-formed and valid against both DTDs. They show structure, not good data.

::: code-group

```xml [Guide p. 18]
<CF5
    pHospitalCode="300806">
  <DRGCLAIM
    ClaimNumber="300806-20221216-1-1"
    PrimaryCode="A00.0"
    NewBornAdmWeight=""
    Remarks="">
    <SECONDARYDIAGS>
      <SECONDARYDIAG
        SecondaryCode="A00.1"
        Remarks=""/>
    </SECONDARYDIAGS>
    <PROCEDURES>
      <PROCEDURE
        RvsCode=""
        Laterality=""
        Ext1=""
        Ext2=""
        Remarks=""/>
    </PROCEDURES>
  </DRGCLAIM>
</CF5>
```

```xml [DRG XML EFORMS FORMAT.xml]
<CF5 pHospitalCode="300829">
	<DRGCLAIM ClaimNumber="2601" PrimaryCode="A01.0" NewBornAdmWeight="" Remarks="">
		<SECONDARYDIAGS>
			<SECONDARYDIAG SecondaryCode="A03.0" Remarks="" />
		</SECONDARYDIAGS>
		<PROCEDURES>
			<PROCEDURE RvsCode="219ss20" Laterality="" Ext1="" Ext2="" Remarks="" />
			<PROCEDURE RvsCode="69000" Laterality="" Ext1="" Ext2="" Remarks="" />
			<PROCEDURE RvsCode="41108" Laterality="" Ext1="" Ext2="" Remarks="" />
			<PROCEDURE RvsCode="93631" Laterality="" Ext1="" Ext2="" Remarks="" />
			<PROCEDURE RvsCode="93631" Laterality="" Ext1="" Ext2="" Remarks="" />
		</PROCEDURES>
	</DRGCLAIM>
</CF5>
```

:::

::: warning Problems with the official samples, if you copy them
- `Laterality=""` everywhere. Since 20250217, use `N` ([KI-05](/known-issues#ki-05)).
- The Guide sample's only procedure has `RvsCode=""`. Recommendation (not from PhilHealth): if no procedure was done, send an empty `<PROCEDURES/>` instead, which the standalone DTD allows.
- `RvsCode="219ss20"` is 7 characters, more than Annex E's `Varchar (6)`, and contains letters ([KI-28](/known-issues#ki-28)).
- `93631` appears twice, which would trigger warning `507` ("Procedure code has duplicate") ([KI-28](/known-issues#ki-28)).
- `Ext1=""` and `Ext2=""` everywhere, while Annex E lists only `1`–`9` as valid values. The DevKit doesn't say whether blank is accepted ([KI-63](/known-issues#ki-63)).
- `ClaimNumber` values `300806-20221216-1-1` and `2601` don't match Annex E's 13-digit format ([KI-31](/known-issues#ki-31)), and what the value should be is unclear ([KI-45](/known-issues#ki-45)).

The 20240604 PDF (p. 4) prints the same sample as the `.xml` file.
:::

## Validate locally

Download [`CF5.dtd`](/originals/cf5/CF5.dtd) and [`cf5-sample.xml`](/examples/cf5-sample.xml) (or your own file) into one folder and run this there. The command uses the `uv` Python runner; with plain Python, `pip install lxml` and run the same code with `python -c`.

```bash
uv run --quiet --with lxml python -c "from lxml import etree; d=etree.DTD(open('CF5.dtd','rb')); t=etree.parse('cf5-sample.xml'); print(d.validate(t), d.error_log.filter_from_errors())"
# Prints "True" (followed by an empty error log). An invalid file prints "False" and the DTD errors.
```

Local validation only proves the structure is right. Codes, counts, formats, and the match with the eClaims XML are checked by [`validateCF5`](/api/validate-cf5). More tools: [Validating XML locally](/guides/validating-xml).

## Related pages

- [Building CF5 (DRG)](/guides/cf5): rules and the end-to-end workflow
- [DRG error codes](/reference/drg-error-codes)
- [`validateCF5`](/api/validate-cf5)
- [eClaims XML](/reference/eclaims-xml): where `pHospitalCode`, `pClaimNumber` and the `DOCUMENT` for the CF5 live
- [Document type codes](/reference/document-types)
- [Validating XML locally](/guides/validating-xml)
- Known issues: [KI-05](/known-issues#ki-05) (laterality), [KI-06](/known-issues#ki-06) (two DTDs), [KI-28](/known-issues#ki-28) (invalid values in the official DRG sample), [KI-31](/known-issues#ki-31) (field lengths), [KI-36](/known-issues#ki-36) (error-code workbook), [KI-45](/known-issues#ki-45) (`ClaimNumber`), [KI-48](/known-issues#ki-48) (facility identifiers), [KI-51](/known-issues#ki-51) (newborn weight), [KI-63](/known-issues#ki-63) (DRG manuals, blank extension codes)
