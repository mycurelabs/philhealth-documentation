---
title: Data migration XML
description: Element tree, attribute tables and DTD of the e-Claims XML file for data migration, and how it differs from the upload XML (eClaimsDef.dtd v1.9).
---

# Data migration XML

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" /> <Badge type="danger" text="Tooling" />

The data migration XML is the file format a health facility's old system exports and its new system imports when the facility switches IT service providers. It is the eClaims upload XML with three changes: a PhilHealth claim number on every claim, supporting documents embedded as base64 text instead of URLs, and two extra newborn-hearing attributes. This page is the field-level reference. For the step-by-step procedure, see [Migrating data between providers](/guides/data-migration).

::: info Sources
- [Data Dictionary of the e-Claims XML for Data Migration (rev. 20241126)](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1): p. 1 (purpose and key differences), p. 3–5 (element list), p. 5–12 (attribute definitions)
- [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) (v1.0.0.1, 2024-12-10)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) (v1.9, 2017-06-23): the upload DTD this format is based on
- [Implementation Guide (rev. 20250217), p. 53–54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53) (`getUploadedClaimsMap`, where `pClaimSeriesLhio` comes from), [p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) (Annex B document type codes), [p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) (Annex C, upload data dictionary)
:::

## TL;DR: what you need to do

1. Start from your upload XML writer. Add `CLAIM@pClaimSeriesLhio` (PhilHealth's 15-digit claim number from `getUploadedClaimsMap`), replace `DOCUMENTS` with `OFFLINEDOCUMENTS` (the base64 file content), and give every `NCP` the two required newborn-hearing attributes ([KI-10](/known-issues#ki-10)).
2. Where the migration dictionary and the DTD disagree, follow the DTD ([KI-37](/known-issues#ki-37)).
3. Validate the plain XML with [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or with a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2). A plain libxml2 check fails on the DTD itself ([KI-43](/known-issues#ki-43)).
4. Encrypt the whole file with the facility's cipher key ([Migrating data](/guides/data-migration#step-6-encrypt-the-whole-file)).
5. Agree on the open points (`pEncryptionUsed` values, which cipher key, blank claim numbers) with the other provider and PhilHealth ([KI-54](/known-issues#ki-54)).

## At a glance

| Item | Value |
|---|---|
| Root element | `eCLAIMS` (same as the upload XML) |
| DTD file | [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd), "eClaims for Migration Document Type Definition Version 1.0" |
| DTD versions | 1.0.0.0 (2024-11-25, initial release), 1.0.0.1 (2024-12-10, fixes) |
| Data dictionary | Revision 20241126, "Initial Release" |
| Based on | `eClaimsDef.dtd` v1.9 (the upload DTD). Every element and attribute not listed under [Differences](#differences-from-the-upload-xml) is identical. |
| Sent to PhilHealth? | No. The DevKit describes it only as an export/import file between service providers. No PECWS method accepts it. |
| Encryption | The **whole file** is encrypted with the health facility's cipher key, using the same procedure as PECWS request/response payloads ([Dictionary p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)). The key's format and the text encoding are not specified; use UTF-8 ([KI-60](/known-issues#ki-60)). See [API payload encryption](/guides/encryption/api-payloads). |
| Unofficial example | [`/examples/migration-sample.xml`](/examples/migration-sample.xml): valid against the migration DTD with Java's validator and with a patched copy of the DTD ([Validating a migration file](#validating-a-migration-file)). A plain libxml2 check fails on the DTD itself ([KI-43](/known-issues#ki-43)). See [Example](#example). |
| Open questions | Undefined `pEncryptionUsed` values, which cipher key to use, blank `pClaimSeriesLhio`, file size ([KI-54](/known-issues#ki-54)); undefined newborn-hearing attributes ([KI-10](/known-issues#ki-10)); dictionary vs DTD differences ([KI-37](/known-issues#ki-37)) |

## Element tree

The tree follows the DTD, not the dictionary's element list (the two differ, see [Dictionary vs DTD](#dictionary-vs-dtd)). Occurrence: no mark = exactly one, `?` = optional, `*` = zero or more, `+` = one or more, `|` = choose one.

```text
eCLAIMS
└── eTRANSMITTAL
    └── CLAIM +                              ← new required attribute pClaimSeriesLhio
        ├── CF1
        ├── CF2
        │   ├── DIAGNOSIS
        │   │   └── DISCHARGE +
        │   │       ├── ICDCODE *            ┐ at least one ICDCODE or RVSCODES;
        │   │       └── RVSCODES *           ┘ ICDCODE elements come first
        │   ├── SPECIAL                      (required, but may be empty: <SPECIAL/>)
        │   │   ├── PROCEDURES ?
        │   │   │   └── HEMODIALYSIS | PERITONEAL | LINAC | COBALT | TRANSFUSION |
        │   │   │       BRACHYTHERAPHY | CHEMOTHERAPY | DEBRIDEMENT | IMRT   (at least one)
        │   │   │       └── SESSIONS *       (EMPTY; one per session, carries pSessionDate)
        │   │   ├── MCP ?
        │   │   ├── TBDOTS ?
        │   │   ├── ABP ?
        │   │   ├── NCP ?                    ← 2 new required attributes
        │   │   │   └── ESSENTIAL ?
        │   │   ├── HIVAIDS ?
        │   │   └── CATARACTINFO ?
        │   ├── PROFESSIONALS +
        │   ├── CONSUMPTION
        │   │   └── BENEFITS | (HCIFEES, PROFFEES, PURCHASES)
        │   └── APR ?
        │       └── APRBYPATSIG | APRBYPATREPSIG | APRBYTHUMBMARK
        ├── ALLCASERATE | ZBENEFIT
        │   └── CASERATE +                   (inside ALLCASERATE)
        │       └── CATARACT ?               (deprecated, see KI-07)
        ├── CF3 ?
        │   ├── CF3_OLD ?
        │   │   ├── PHEX
        │   │   └── MATERNITY ?
        │   │       ├── PRENATAL
        │   │       │   ├── CLINICALHIST
        │   │       │   ├── OBSTETRIC
        │   │       │   ├── MEDISURG
        │   │       │   └── CONSULTATION +
        │   │       ├── DELIVERY
        │   │       └── POSTPARTUM
        │   └── CF3_NEW ?
        │       ├── ADMITREASON ?
        │       │   ├── CLINICAL +
        │       │   ├── LABDIAG +
        │       │   └── PHEX
        │       └── COURSE ?
        │           └── WARD +
        ├── PARTICULARS ?
        │   └── DRGMED / XLSO                (at least one of either)
        ├── RECEIPTS ?
        │   └── RECEIPT +
        │       └── ITEM +
        └── OFFLINEDOCUMENTS ?               ← NEW (replaces DOCUMENTS)
            └── OFFLINEDOCUMENT +            ← NEW; element text = base64 of the file
```

`APRBYPATREPSIG` contains `(DEFINEDPATREPREL | OTHERPATREPREL)` followed by `(DEFINEDREASONFORSIGNING | OTHERREASONFORSIGNING)`, exactly as in the upload DTD. For every element that is not new or changed, use the [eClaims XML reference](/reference/eclaims-xml).

## Differences from the upload XML

This is the complete list. We compared the two DTD files line by line (`diff -w`, ignoring whitespace). Everything else, including the `Ntilde`/`ntilde`/`nbsp` entities, is identical.

| # | What | `eClaimsDef.dtd` v1.9 (upload) | `eClaimsXmlForDataMigration.dtd` v1.0.0.1 (migration) |
|---|---|---|---|
| 1 | `CLAIM` content model | `(CF1, CF2, (ALLCASERATE \| ZBENEFIT), CF3?, PARTICULARS?, RECEIPTS?, DOCUMENTS)`: `DOCUMENTS` **required** | `(CF1, CF2, (ALLCASERATE \| ZBENEFIT), CF3?, PARTICULARS?, RECEIPTS?, OFFLINEDOCUMENTS?)`: `OFFLINEDOCUMENTS` **optional** |
| 2 | `CLAIM` attributes | `pClaimNumber`, `pTrackingNumber`, `pPhilhealthClaimType`, `pPatientType`, `pIsEmergency` | Same, plus **`pClaimSeriesLhio CDATA #REQUIRED`** |
| 3 | `NCP` attributes | `pEssentialNewbornCare`, `pNewbornHearingScreeningTest`, `pNewbornScreeningTest`, `pFilterCardNo` | Same, plus **`pNewbornHearingRegistryNo CDATA #REQUIRED`** and **`pNewbornHearingScreeningTestResult (P\|R\|X) #REQUIRED`** ([KI-10](/known-issues#ki-10)) |
| 4 | Supporting documents | `DOCUMENTS (DOCUMENT+)`; `DOCUMENT` is EMPTY with `pDocumentType`, `pDocumentURL` | Removed. No `DOCUMENTS` or `DOCUMENT` element exists. |
| 5 | Embedded documents | (none) | **`OFFLINEDOCUMENTS (OFFLINEDOCUMENT+)`**; **`OFFLINEDOCUMENT (#PCDATA)`** with `pDocumentType CDATA #REQUIRED`, `pMimeType CDATA #REQUIRED`, `pEncryptionUsed (N\|C\|P) #REQUIRED` (values undefined, [KI-54](/known-issues#ki-54)) |
| 6 | Header comment | "eClaims Document Type Definition Version 1.9" with history 1.0 (2010) to 1.9.0 (2017) | "eClaims for Migration Document Type Definition Version 1.0" with history 1.0.0.0 (2024-11-25) and 1.0.0.1 (2024-12-10) only |

The data dictionary (p. 1) describes only differences 1/4/5 (supporting documents) and 2 (`pClaimSeriesLhio`), plus the requirement to encrypt the file. It does not mention difference 3.

::: warning Don't mix the two formats
An upload XML that contains `pClaimSeriesLhio` ([KI-50](/known-issues#ki-50)), the two new `NCP` attributes ([KI-10](/known-issues#ki-10)), or `OFFLINEDOCUMENTS` fails validation against `eClaimsDef.dtd` v1.9. A migration file that contains `DOCUMENTS` fails validation against the migration DTD. We checked both cases with a validator. Keep two separate XML writers, or one writer with an explicit "mode".
:::

## Changed and new items

### eCLAIMS (changed guidance only)

The DTD declaration is unchanged. The migration dictionary updates the text for `pUserName`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pUserName` | Yes | CDATA, String(20) | `":"` followed by the software certification ID "issued by PhilHealth to the system used that will generate this XML file" | "User ID assigned to the health facility" | [Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5) |
| `pUserPassword` | Yes | CDATA, String(20) | Empty string | "Just set the value of this attribute to empety [sic] string" | [Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5) |
| `pServiceProvider` | No (`#IMPLIED`) | CDATA, String(50) | Free text | "The acronym or short name of the company/institution that provided the system used in submitting the e-claims XML file" | [Dict. p. 12](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=12) |

In a migration file, `pUserName` identifies the **exporting** system (the one that "will generate this XML file"). This matches the upload rule from Guide revision 20241111 ([KI-03](/known-issues#ki-03)). The upload dictionary (Annex C, [Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) still says "To be provided by PhilHealth" for both `pUserName` and `pUserPassword`; the migration dictionary has the newer wording.

### CLAIM@pClaimSeriesLhio (new)

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pClaimSeriesLhio` | Yes (`#REQUIRED`) | CDATA, String(15) | 15 digits. "The first 13 digits represent the PhilHealth Claim Series number. The last two digits represent PhilHealth Regional Office (PRO) code representing the regional office that has processed the claim." | "The 15-digit claim number representing a unique claim processed by PhilHealth." | [Dict. p. 1, p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6) |

- **Where it comes from.** The number "returned by the GetUploadedClaimsMap API" ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)). In the Guide's `getUploadedClaimsMap` sample, each `MAPPING` pairs `pClaimNumber` (the hospital's claim ID, Guide sample `09-08-01-006`) with `pClaimSeriesLhio` (Guide sample `090801990000199`) ([Guide p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)). In our [example](#example), claim `202609170001` maps to the illustrative value `260917990000101`. See [getUploadedClaimsMap](/api/get-uploaded-claims-map).
- **Why it exists.** It "enables the new service provider to process return-to-hospital (RTH) claims submitted via the previous provider's system." `getClaimStatus` (`serieslhionos`, "claims Series Nos") and `addRequiredDocument` (`pSeriesLhioNo`, "Series Lhio Number") take a claim series number as input. The Guide doesn't say whether they expect this 15-digit form or the 13-digit series without the regional office code ([KI-64](/known-issues#ki-64)).
- **Claims that were never uploaded.** The DTD requires the attribute but accepts an empty value (`pClaimSeriesLhio=""` passed our validation). The dictionary does not say whether blank is allowed for draft or offline-encoded claims that have no PhilHealth number yet ([KI-54](/known-issues#ki-54)). Confirm with PhilHealth.
- Keep it as a **string**. It can start with `0` (the Guide's sample `090801990000199` does), so storing it as a number corrupts it.

::: warning The upload dictionary also lists `pClaimSeriesLhio` ([KI-50](/known-issues#ki-50))
Annex C, the upload data dictionary, has a `pClaimSeriesLhio` row right after the `CLAIM` attributes: String(15), "Philhealth Generated and Assigned Unique Number per Claim", "Can be used by the hospital to reconcile their records with Philhealth. This will be returned after the claim are uploaded to Philhealth" ([Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). `eClaimsDef.dtd` v1.9 does not declare it, so an upload XML that contains it fails validation. In the upload flow it is a value PhilHealth **returns** (for example in the `getUploadedClaimsMap` result). Only the migration DTD makes it an attribute you write.
:::

### NCP (two new attributes)

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pNewbornHearingRegistryNo` | Yes (`#REQUIRED`) | CDATA; length not specified | Not specified | Not described anywhere in the DevKit | [DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd) only |
| `pNewbornHearingScreeningTestResult` | Yes (`#REQUIRED`) | Enumeration | `P`, `R` or `X`; the meanings are not defined anywhere in the DevKit | Not described anywhere in the DevKit | [DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd) only |

::: warning Undocumented, but required ([KI-10](/known-issues#ki-10))
These two attributes appear only in the migration DTD. They are not in `eClaimsDef.dtd` v1.9, not in the migration data dictionary (its NCP rows on [p. 8](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=8) list only the four upload attributes), and not in the migration DTD's own version history. Because they are `#REQUIRED`, **every `NCP` element in a migration file must carry both**, even for old newborn claims that were uploaded without them. `pNewbornHearingRegistryNo=""` passes the DTD, but the result code must be `P`, `R` or `X`.

The DevKit does not say what `P`, `R` and `X` mean, or which value to use when the result is unknown. Annex B has related document types: `NHC` "Newborn Hearing Registry Card (Blue Card)" and `NHT` "Newborn Hearing Screening Test Result" ([Guide p. 77](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)). Newborn hearing screening results are often reported as "pass" or "refer", which may explain `P` and `R`, but that is our guess, not PhilHealth's definition. Confirm the codes with PhilHealth before you export newborn claims.
:::

### OFFLINEDOCUMENTS (new)

Container for the claim's supporting documents. It replaces `DOCUMENTS`.

- **DTD:** `<!ELEMENT OFFLINEDOCUMENTS (OFFLINEDOCUMENT+)>`, optional inside `CLAIM`. If you write the element, it must contain at least one `OFFLINEDOCUMENT` (fix 1.0.0.1, 2024-12-10). If a claim has no documents, leave `OFFLINEDOCUMENTS` out. Don't write an empty `<OFFLINEDOCUMENTS/>`.
- **Dictionary:** "Supporting documents", occurrence "only once" ([p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)). The DTD makes it optional. Follow the DTD for validation.

### OFFLINEDOCUMENT (new)

One supporting document. The element's text is "the base-64 of the file content of the supporting document" ([Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)). The dictionary's reason: in the upload XML, `DOCUMENT` points to a file encrypted with PhilHealth's public key, "which providers cannot decrypt due to the lack of access to PhilHealth's private key". Embedding the file content makes it "accessible for the new provider" ([Dict. p. 1](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)).

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| (element text) | Not enforced (`#PCDATA` may be empty) | base64 text | Base64 of the file bytes | "The inner text of this element should be the base-64 of the file content of the supporting document" | [Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5) |
| `pDocumentType` | Yes | CDATA, String(3) | No list in the migration dictionary. The upload dictionary says "See Document Library", which is Annex B (`CSF`, `SOA`, `CF4`, `CF5`, `ESA`, `OPR`, ...). | "Document to support the claim" | [Dict. p. 11](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=11); [Guide p. 77–78, 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) |
| `pMimeType` | Yes | CDATA; dictionary says String(3) (see warning) | `application/pdf` for PDF, `application/xml` for XML | "Mime type of the document" | [Dict. p. 11–12](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=11) |
| `pEncryptionUsed` | Yes | Enumeration | `N`, `C` or `P`; meanings **not defined** in the DevKit ([KI-54](/known-issues#ki-54)) | Not described in the dictionary | [DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd) only |

The migration dictionary's `application/xml` differs from the `text/xml` used for API payloads. The DevKit never says which MIME type an XML attachment should carry ([KI-57](/known-issues#ki-57)). In a migration file, use the dictionary's values.

::: warning `pEncryptionUsed` is not documented ([KI-54](/known-issues#ki-54))
The data dictionary has no row for `pEncryptionUsed`. We checked every page, including the rendered tables. Only the DTD mentions it, with the values `N|C|P`. No other DevKit file uses the name.

**Our interpretation (not from PhilHealth):** the DevKit uses exactly two encryption schemes, the health facility's **C**ipher key and PhilHealth's **P**ublic key ([KI-12](/known-issues#ki-12)). So `N` most likely means "not encrypted" (the element holds the plain file), `C` "encrypted with the facility's cipher key", and `P` "encrypted with PhilHealth's public key". A `P` document is one the new provider cannot decrypt. It is still useful, because it can be re-hosted and referenced by URL as-is. The DevKit also does not say whether a `C` or `P` document's base64 wraps the JSON envelope (`docMimeType`, `hash`, `key1`, `key2`, `iv`, `doc`) or only the raw ciphertext. Confirm both points with PhilHealth before you rely on them.
:::

::: warning `pMimeType` length is wrong in the dictionary ([KI-37](/known-issues#ki-37))
The dictionary gives `pMimeType` a length of String(3), but both of its own valid values are 15 characters (`application/pdf`, `application/xml`). The DTD sets no length. Write the full MIME type. If your database column follows the dictionary literally, it truncates the value.
:::

## Dictionary vs DTD

The migration data dictionary was copied from the upload dictionary (Annex C) and edited. Where it disagrees with the DTD, **the DTD wins**, because a DTD validator decides what is accepted (see [How to read these docs](/getting-started/how-to-read)). The occurrence and length mismatches below are collected in [KI-37](/known-issues#ki-37).

| Item | Dictionary says | DTD says | Do this |
|---|---|---|---|
| `SESSIONS` / `SESSION` ([KI-37](/known-issues#ki-37)) | Each repetitive procedure contains `SESSIONS` ("List of Sessions"), which contains `SESSION` ("Session Detail"); occurrence cells are blank ([p. 3–4](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=3)) | `SESSIONS` is EMPTY with `pSessionDate` and repeats once per session (`HEMODIALYSIS (SESSIONS*)`). There is no `SESSION` element. | Write `<SESSIONS pSessionDate="MM-DD-YYYY"/>` once per session, as the Guide's upload sample does ([Guide p. 30](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=30)). A `SESSION` child fails validation. |
| `pEncryptionUsed` | Not listed | `(N\|C\|P) #REQUIRED` | See the warning above ([KI-54](/known-issues#ki-54)). |
| `NCP@pNewbornHearingRegistryNo`, `NCP@pNewbornHearingScreeningTestResult` | Not listed | `#REQUIRED` | See [NCP](#ncp-two-new-attributes) ([KI-10](/known-issues#ki-10)). |
| `OFFLINEDOCUMENTS` | "only once" | `?` (optional) | Omit it when a claim has no documents. |
| `OFFLINEDOCUMENT` | "0 or more" | `+` (at least one, if the parent exists) | Never write an empty container. |
| `SPECIAL` | "0 or 1" | Required in `CF2` (its children are all optional) | Always write `<SPECIAL/>` at least. |
| `ALLCASERATE`, `ZBENEFIT` | "only once" each ([p. 4](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=4)) | `(ALLCASERATE \| ZBENEFIT)`: exactly one of the two | Write the one that matches `pPhilhealthClaimType`. |
| `CLINICAL`, `LABDIAG` | "0 or more" | `+` inside `ADMITREASON` | Write at least one of each when you write `ADMITREASON`. |
| `ADMITREASON`, `COURSE` | "only once" | `?` inside `CF3_NEW` | Optional. |
| `pMimeType` length | String(3) | CDATA | Use the full MIME type. |
| `eRECEIPT` attributes (`pTransmissionControlNumber`, `pErrCode`, `pReceiptTicketNumber`, ...) | Listed ([p. 12](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=12)) | Not declared | Copied from the upload dictionary. They belong to the upload response, not to the migration file. Ignore them. |
| Annex C typos ([KI-32](/known-issues#ki-32)) | Repeated: `pMemberFirstname`, `pUrineMyomectomy`, "Required when pDMSTotalAmount = 'Y'", `pReasonCode` O = "Patient is incapacitated", `pHasAttachedSOA` = "Type of Accommodation", `pDrying` "Yes (Y) or No (Y)" | `pMemberFirstName`, `pUterineMyomectomy`, ... | Use the DTD spelling. XML is case-sensitive. |

## Field formats that did not change

All other attributes keep the upload rules. The most important ones for migration:

- Dates are `MM-DD-YYYY` and times are `HH:MM:SSAM/PM` ([Dict. p. 6–7](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)).
- `pClaimNumber` is the "Hospital Generated Claim Case #, this should be unique per hospital", String(12) ([Dict. p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)). Export it exactly as you uploaded it, because `getUploadedClaimsMap` maps this value to `pClaimSeriesLhio`. (Its length also contradicts the samples, see [KI-31](/known-issues#ki-31).)
- `pTotalClaims` is String(3), "Integer format". If that length is enforced, one file holds at most 999 claims, so a large history needs several files. The DevKit gives no other rules for file size or splitting ([KI-54](/known-issues#ki-54)).
- `pHospitalCode`: "For now PMCC number should be used", String(12).

For every other field, see the [eClaims XML reference](/reference/eclaims-xml) and [code tables](/reference/code-tables).

## Validating a migration file

Validate the **plain** XML against the migration DTD before you encrypt it (exporter) and after you decrypt it (importer). The DevKit does not provide a PECWS method for migration files, so validation is local only. See [Validating XML locally](/guides/validating-xml).

To validate in NetBeans, use the migration DTD with the same steps as PhilHealth's NetBeans note for upload files: put the XML and the DTD in one folder and add a DOCTYPE line such as `<!DOCTYPE eCLAIMS SYSTEM "eClaimsXmlForDataMigration.dtd">`.

::: warning libxml2-based validators complain about the DTD itself ([KI-43](/known-issues#ki-43))
The migration DTD copies three content models from `eClaimsDef.dtd` that are ambiguous ("non-deterministic" in XML 1.0 terms): `DISCHARGE`, `PROCEDURES` and `PARTICULARS`. libxml2 reports each one as soon as a document uses that element. Every claim contains a `DISCHARGE`, so every validation run hits at least that one; a claim with repetitive procedures or a `PARTICULARS` block also hits the other two. The same problem affects the upload DTD; see [Validating XML locally](/guides/validating-xml#the-eclaims-dtd-and-libxml2) and the [eClaims XML reference](/reference/eclaims-xml#validating-the-xml).

What happens depends on the validator and its libxml2 version. We ran these on 2026-09-23:

| Validator we ran | Result for our example (original DTD) |
|---|---|
| Python `lxml` 6.1.3 (libxml2 2.14.6) | `validate()` returns **False**. Only error: `Content model of DISCHARGE is not deterministic` |
| PHP 8.3.33 `DOMDocument::validate()` with libxml2 2.9.14 (Debian-based `php:8.3-cli` image) | Returns **true**, but logs `Content model of DISCHARGE is not determinist` |
| PHP 8.3.33 `DOMDocument::validate()` with libxml2 2.13.9 (Alpine-based `php:8.3-cli-alpine` image) | Returns **false**, with the same message |
| Java 21 built-in validating parser (JAXP, Xerces-based) | Valid, 0 errors. Copies with a `PROCEDURES` block and with a `PARTICULARS` block are also valid. |

With lxml, adding a `PROCEDURES` block adds `Content model of PROCEDURES is not deterministic`, and adding a `PARTICULARS` block adds `Content model of PARTICULARS is not deterministic`. We did not test NetBeans itself (PhilHealth's [validation note](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf) uses it). NetBeans runs on Java.
:::

::: tip Recommendation (not from PhilHealth): how to check a migration file locally
- **Use Java if you can.** It validates against the original migration DTD. The validator and the steps are on [Validating XML: Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml). Our example already contains the `DOCTYPE` line that Java needs.
- **If your stack uses libxml2**, validate against a patched copy of the DTD. The script on [Validating XML: The eClaims DTD and libxml2](/guides/validating-xml#the-eclaims-dtd-and-libxml2) works for the migration DTD as well as for `eClaimsDef.dtd`. It rewrites the three models: `DISCHARGE` and `PARTICULARS` keep exactly the same meaning, and `PROCEDURES` becomes stricter (each procedure type at most once, in DTD order). So a file that passes the patched copy also passes the original DTD. The stricter rule may reject some unusual procedure orders that the original accepts (for example `CHEMOTHERAPY` followed by `HEMODIALYSIS`); check those with Java.
- Keep the original DTD file untouched. There is no PhilHealth endpoint that validates migration files, so a local check is all you have.
:::

To try it, download [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) and [`migration-sample.xml`](/examples/migration-sample.xml) into one folder and run the Java validator, or the patch script and then your libxml2 tool, from that folder.

We ran both methods on the example (valid), on copies of it with two `HEMODIALYSIS` sessions and with a `PARTICULARS` block (both valid), and on a copy with an `RVSCODES` placed before the `ICDCODE` (invalid, as it should be). Java against the original DTD and lxml against the patched copy gave the same results.

What the DTD catches (we tested each case with lxml and the patched DTD):

| Mistake | Validator message (lxml) |
|---|---|
| `pClaimSeriesLhio` missing | `Element CLAIM does not carry attribute pClaimSeriesLhio` |
| `pEncryptionUsed="Y"` | `Value "Y" for attribute pEncryptionUsed of OFFLINEDOCUMENT is not among the enumerated set` |
| `pMimeType` missing | `Element OFFLINEDOCUMENT does not carry attribute pMimeType` |
| `<OFFLINEDOCUMENTS></OFFLINEDOCUMENTS>` | `Element OFFLINEDOCUMENTS content does not follow the DTD, expecting (OFFLINEDOCUMENT)+` |
| `DOCUMENTS` left in the file | `No declaration for element DOCUMENTS` |
| `NCP` without the two new attributes | `Element NCP does not carry attribute pNewbornHearingScreeningTestResult` (and `...pNewbornHearingRegistryNo`) |
| `<SPECIAL>` omitted | `Element CF2 content does not follow the DTD, expecting (DIAGNOSIS , SPECIAL , PROFESSIONALS+ , CONSUMPTION , APR?)` |
| `SESSIONS` containing `SESSION` | `Element SESSIONS was declared EMPTY this one has content` |

What the DTD does **not** catch: an empty `pClaimSeriesLhio`, an empty or non-base64 `OFFLINEDOCUMENT` text, a wrong `pMimeType`, wrong date formats, or wrong code values in `CDATA` attributes. Check those in your own code.

## Example

[`/examples/migration-sample.xml`](/examples/migration-sample.xml) is an **unofficial** example written for this site. PhilHealth does not provide a migration sample.

- **How we validated it.** Java 21's validating parser (JAXP, Xerces-based) reports 0 errors against the original `eClaimsXmlForDataMigration.dtd`, and lxml reports it valid against a patched copy of the DTD (both methods: [Validating a migration file](#validating-a-migration-file)). Plain lxml, and PHP with libxml2 2.13, report it invalid only because of the DTD's `DISCHARGE` model ([KI-43](/known-issues#ki-43)).
- **Encoding.** The file is UTF-8 and declares it. Neither the migration dictionary nor the upload documentation states an encoding ([KI-62](/known-issues#ki-62)); agree on UTF-8 with the other provider.
- **What it contains.** It is the same claim as the site's eClaims XML example ([`eclaims-minimal.xml`](/examples/eclaims-minimal.xml), explained on [eClaims XML](/reference/eclaims-xml)), after it was uploaded and exported for migration: facility code `123456`, transmittal `TR20260917001`, claim `202609170001`, member JUAN OCAMPO DELA CRUZ (PIN `072007271094`, the Guide's sample member; the DevKit has no test members, [KI-11](/known-issues#ki-11)), dengue fever (`A90`), admitted 09-15-2026 and discharged 09-17-2026. `pClaimSeriesLhio="260917990000101"` is an illustrative PhilHealth number. The doctor and employer come from the [test data](/reference/test-data).
- **Documents.** It embeds two documents: a 594-byte placeholder PDF (`CSF`) and a 161-byte CF5 XML (`CF5`, valid against `cf5/CF5.dtd`, with the same `ClaimNumber` as `CLAIM@pClaimNumber`, see [KI-45](/known-issues#ki-45)). A real export embeds every document of the claim.
- **Assumptions.** `pEncryptionUsed="N"` relies on our interpretation above ([KI-54](/known-issues#ki-54)).

This is the **plain** XML. Before you hand it to another provider, encrypt the whole file with the facility's cipher key ([guide](/guides/data-migration#step-6-encrypt-the-whole-file)).

::: details migration-sample.xml (full file)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE eCLAIMS SYSTEM "eClaimsXmlForDataMigration.dtd">
<!--
  UNOFFICIAL example of an e-Claims XML file for data migration.
  Written for this documentation site; it is not a PhilHealth sample.

  Validity: checked against eClaimsXmlForDataMigration.dtd (v1.0.0.1,
  2024-12-10) with Java's validating parser (JAXP) and with lxml against a
  patched copy of the DTD. A plain libxml2 check (lxml, xmllint, PHP) fails
  on the DTD itself, not on this file. See /known-issues#ki-43.

  Values: the site's shared sample scenario (the same claim as
  /examples/eclaims-minimal.xml). They are placeholders, not real data.
  - PIN 072007271094 and the member's name and birth date are the
    Implementation Guide's sample values (p. 29). No test member exists.
  - Doctor 1504-2400015-3 (LIFE GOES ON) and employer 110474000002
    (JOSE A TERAMOTO ODM) come from "Dummy Health Care Providers and
    Employers.pdf".
  - pClaimSeriesLhio 260917990000101 is an illustrative value. A real one
    comes from getUploadedClaimsMap.
  - pEncryptionUsed="N" assumes that N means "not encrypted". The DevKit
    defines N, C and P nowhere. See /known-issues#ki-54.

  Before handing this file to another provider, encrypt the WHOLE file with
  the health facility's cipher key (Annex A procedure).
-->
<eCLAIMS
    pUserName=":SAMPLE-CERT-ID"
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalEmail="eclaims@samplehospital.example"
    pServiceProvider="SAMPLE HIS">
  <eTRANSMITTAL
      pHospitalTransmittalNo="TR20260917001"
      pTotalClaims="1">
    <CLAIM
        pClaimNumber="202609170001"
        pTrackingNumber=""
        pPhilhealthClaimType="ALL-CASE-RATE"
        pPatientType="I"
        pIsEmergency="N"
        pClaimSeriesLhio="260917990000101">
      <CF1
          pMemberPIN="072007271094"
          pMemberLastName="DELA CRUZ"
          pMemberFirstName="JUAN"
          pMemberSuffix=""
          pMemberMiddleName="OCAMPO"
          pMemberBirthDate="09-19-1973"
          pMemberShipType="S"
          pMailingAddress="123 SAMPLE STREET, BARANGAY UNO, QUEZON CITY"
          pZipCode="1100"
          pMemberSex="M"
          pLandlineNo=""
          pMobileNo=""
          pEmailAddress=""
          pPatientIs="M"
          pPatientPIN="072007271094"
          pPatientLastName="DELA CRUZ"
          pPatientFirstName="JUAN"
          pPatientSuffix=""
          pPatientMiddleName="OCAMPO"
          pPatientBirthDate="09-19-1973"
          pPatientSex="M"
          pPEN="110474000002"
          pEmployerName="JOSE A TERAMOTO ODM"/>
      <CF2
          pPatientReferred="N"
          pReferredIHCPAccreCode=""
          pAdmissionDate="09-15-2026"
          pAdmissionTime="01:00:00PM"
          pDischargeDate="09-17-2026"
          pDischargeTime="03:00:00PM"
          pDisposition="I"
          pExpiredDate=""
          pExpiredTime=""
          pReferralIHCPAccreCode=""
          pReferralReasons=""
          pAccommodationType="N"
          pHasAttachedSOA="Y">
        <DIAGNOSIS pAdmissionDiagnosis="DENGUE FEVER">
          <DISCHARGE pDischargeDiagnosis="DENGUE FEVER WITHOUT WARNING SIGNS">
            <ICDCODE pICDCode="A90"/>
          </DISCHARGE>
        </DIAGNOSIS>
        <!-- SPECIAL is required by the DTD even when it is empty.
             A newborn claim would carry NCP here, and in this format NCP also
             requires pNewbornHearingRegistryNo and
             pNewbornHearingScreeningTestResult (P, R or X; undefined, see
             /known-issues#ki-10). Repetitive procedures use repeated
             SESSIONS elements; there is no SESSION element (/known-issues#ki-37). -->
        <SPECIAL/>
        <PROFESSIONALS
            pDoctorAccreCode="1504-2400015-3"
            pDoctorLastName="ON"
            pDoctorFirstName="LIFE"
            pDoctorMiddleName="GOES"
            pDoctorSuffix=""
            pWithCoPay="N"
            pDoctorCoPay=""
            pDoctorSignDate="09-17-2026"/>
        <CONSUMPTION pEnoughBenefits="Y">
          <BENEFITS
              pTotalHCIFees="7000.00"
              pTotalProfFees="3000.00"
              pGrandTotal="10000.00"/>
        </CONSUMPTION>
        <APR>
          <APRBYPATSIG pDateSigned="09-17-2026"/>
        </APR>
      </CF2>
      <ALLCASERATE>
        <CASERATE
            pCaseRateCode="CR0001"
            pICDCode="A90"
            pRVSCode=""
            pCaseRateAmount="10000.00"/>
      </ALLCASERATE>
      <!-- Supporting documents travel INSIDE the file as base64 text,
           instead of DOCUMENT/@pDocumentURL links. A real export embeds every
           document of the claim; to stay short, this example embeds only the
           CSF and the CF5 (the uploaded claim also had ESA and CF4). -->
      <OFFLINEDOCUMENTS>
        <!-- A 594-byte placeholder PDF whose only text is "SAMPLE CSF - NOT REAL". -->
        <OFFLINEDOCUMENT pDocumentType="CSF" pMimeType="application/pdf" pEncryptionUsed="N">JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAyMDAgNjBdIC9Db250ZW50cyA0IDAgUiAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiA+PgplbmRvYmoKNCAwIG9iago8PCAvTGVuZ3RoIDUxID4+CnN0cmVhbQpCVCAvRjEgMTAgVGYgMTAgMjUgVGQgKFNBTVBMRSBDU0YgLSBOT1QgUkVBTCkgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYSA+PgplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQwIDAwMDAwIG4gCjAwMDAwMDAzNDEgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0MTEKJSVFT0YK</OFFLINEDOCUMENT>
        <!-- A 161-byte CF5 XML (valid against cf5/CF5.dtd): pHospitalCode 123456,
             ClaimNumber 202609170001 (the same value as CLAIM@pClaimNumber,
             see /known-issues#ki-45), PrimaryCode A90. -->
        <OFFLINEDOCUMENT pDocumentType="CF5" pMimeType="application/xml" pEncryptionUsed="N">PENGNSBwSG9zcGl0YWxDb2RlPSIxMjM0NTYiPjxEUkdDTEFJTSBDbGFpbU51bWJlcj0iMjAyNjA5MTcwMDAxIiBQcmltYXJ5Q29kZT0iQTkwIiBOZXdCb3JuQWRtV2VpZ2h0PSIiIFJlbWFya3M9IiI+PFNFQ09OREFSWURJQUdTLz48UFJPQ0VEVVJFUy8+PC9EUkdDTEFJTT48L0NGNT4=</OFFLINEDOCUMENT>
      </OFFLINEDOCUMENTS>
    </CLAIM>
  </eTRANSMITTAL>
</eCLAIMS>
```
:::

## Raw DTD

::: details Raw DTD (eClaimsXmlForDataMigration.dtd), copied verbatim
```xml
<!--
    Philippine Health Insurance Corporation
    eClaims for Migration Document Type Definition Version 1.0
    Version History
    1.0.0.0 2024-11-25 06:43PM
      - Initial Release
    1.0.0.1 2024-12-10 04:44PM
      - Added the closing parenthesis in the declaration of the CLAIM element    
      - Added "+" after OFFLINEDOCUMENT in the declaration of the 
        OFFLINEDOCUMENTS element to specify that there should be at leasy
        on OFFLINEDOCUMENT element if OFFLINEDOCUMENTS element exist    
      - Added the (#PCDATA) in the the declaration of the OFFLINEDOCUMENT element  
-->

<!ENTITY Ntilde "&#209;">
<!ENTITY ntilde "&#241;">
<!ENTITY nbsp "&#160;">

<!ELEMENT eCLAIMS (eTRANSMITTAL)>
<!ATTLIST eCLAIMS
    pUserName CDATA #REQUIRED
    pUserPassword CDATA #REQUIRED
    pHospitalCode CDATA #REQUIRED
    pHospitalEmail CDATA #REQUIRED
    pServiceProvider CDATA #IMPLIED>

<!ELEMENT eTRANSMITTAL (CLAIM+)>
<!ATTLIST eTRANSMITTAL
    pHospitalTransmittalNo CDATA #REQUIRED
    pTotalClaims CDATA #REQUIRED>

<!ELEMENT CLAIM (CF1, CF2, (ALLCASERATE | ZBENEFIT), CF3?, PARTICULARS?, RECEIPTS?, OFFLINEDOCUMENTS?)>
<!ATTLIST CLAIM
    pClaimNumber CDATA #REQUIRED
    pTrackingNumber CDATA #REQUIRED
    pPhilhealthClaimType (ALL-CASE-RATE|Z-BENEFIT) #REQUIRED
    pPatientType (I|O) #REQUIRED
    pIsEmergency (Y|N) #REQUIRED
    pClaimSeriesLhio CDATA #REQUIRED>

<!ELEMENT CF1 EMPTY>
<!ATTLIST CF1
    pMemberPIN CDATA #REQUIRED
    pMemberLastName CDATA #REQUIRED
    pMemberFirstName CDATA #REQUIRED
    pMemberSuffix CDATA #REQUIRED
    pMemberMiddleName CDATA #REQUIRED
    pMemberBirthDate CDATA #REQUIRED
    pMemberShipType (S|G|I|NS|NO|PS|PG|P) #REQUIRED
    pMailingAddress CDATA #REQUIRED
    pZipCode CDATA #REQUIRED
    pMemberSex (M|F) #REQUIRED
    pLandlineNo CDATA #REQUIRED
    pMobileNo CDATA #REQUIRED
    pEmailAddress CDATA #REQUIRED
    pPatientIs (M|S|C|P) #REQUIRED
    pPatientPIN CDATA #REQUIRED
    pPatientLastName CDATA #REQUIRED
    pPatientFirstName CDATA #REQUIRED
    pPatientSuffix CDATA #REQUIRED
    pPatientMiddleName CDATA #REQUIRED
    pPatientBirthDate CDATA #REQUIRED
    pPatientSex (M|F) #REQUIRED
    pPEN CDATA #REQUIRED
    pEmployerName CDATA #REQUIRED>

<!ELEMENT CF2 (DIAGNOSIS, SPECIAL, PROFESSIONALS+, CONSUMPTION, APR?)>
<!ATTLIST CF2
    pPatientReferred (Y|N) #REQUIRED
    pReferredIHCPAccreCode CDATA #REQUIRED
    pAdmissionDate CDATA #REQUIRED
    pAdmissionTime CDATA #REQUIRED
    pDischargeDate CDATA #REQUIRED
    pDischargeTime CDATA #REQUIRED
    pDisposition (I|R|H|A|E|T) #REQUIRED
    pExpiredDate CDATA #REQUIRED
    pExpiredTime CDATA #REQUIRED
    pReferralIHCPAccreCode CDATA #REQUIRED
    pReferralReasons CDATA #REQUIRED
    pAccommodationType (P|N) #REQUIRED
    pHasAttachedSOA (Y|N) #IMPLIED>

<!ELEMENT DIAGNOSIS (DISCHARGE+)>
<!ATTLIST DIAGNOSIS
    pAdmissionDiagnosis CDATA #REQUIRED>

<!ELEMENT DISCHARGE ((ICDCODE+, RVSCODES*)|(ICDCODE*, RVSCODES+))>
<!ATTLIST DISCHARGE
    pDischargeDiagnosis CDATA #REQUIRED>

<!ELEMENT ICDCODE EMPTY>
<!ATTLIST ICDCODE
    pICDCode CDATA #REQUIRED>

<!ELEMENT RVSCODES EMPTY>
<!ATTLIST RVSCODES
    pRelatedProcedure CDATA #REQUIRED
    pRVSCode CDATA #REQUIRED
    pProcedureDate CDATA #REQUIRED
    pLaterality (L|R|B|N) #REQUIRED>

<!ELEMENT SPECIAL (PROCEDURES?, MCP?, TBDOTS?, ABP?, NCP?, HIVAIDS?, CATARACTINFO?)>

<!ELEMENT PROCEDURES ((HEMODIALYSIS?, PERITONEAL?, LINAC?, COBALT?, TRANSFUSION?, BRACHYTHERAPHY?, CHEMOTHERAPY?, DEBRIDEMENT?, IMRT?), (HEMODIALYSIS|PERITONEAL|LINAC|COBALT|TRANSFUSION|BRACHYTHERAPHY|CHEMOTHERAPY|DEBRIDEMENT|IMRT))>
<!ELEMENT HEMODIALYSIS (SESSIONS*)>
<!ELEMENT PERITONEAL (SESSIONS*)>
<!ELEMENT LINAC (SESSIONS*)>
<!ELEMENT COBALT (SESSIONS*)>
<!ELEMENT TRANSFUSION (SESSIONS*)>
<!ELEMENT BRACHYTHERAPHY (SESSIONS*)>
<!ELEMENT CHEMOTHERAPY (SESSIONS*)>
<!ELEMENT DEBRIDEMENT (SESSIONS*)>
<!ELEMENT IMRT (SESSIONS*)>

<!ELEMENT SESSIONS EMPTY>
<!ATTLIST SESSIONS
    pSessionDate CDATA #REQUIRED>

<!ELEMENT MCP EMPTY>
<!ATTLIST MCP
    pCheckUpDate1 CDATA #REQUIRED
    pCheckUpDate2 CDATA #REQUIRED
    pCheckUpDate3 CDATA #REQUIRED
    pCheckUpDate4 CDATA #REQUIRED>

<!ELEMENT TBDOTS EMPTY>
<!ATTLIST TBDOTS
    pTBType (I|M) #REQUIRED
    pNTPCardNo CDATA #REQUIRED>

<!ELEMENT ABP EMPTY>
<!ATTLIST ABP
    pDay0ARV CDATA #REQUIRED
    pDay3ARV CDATA #REQUIRED
    pDay7ARV CDATA #REQUIRED
    pRIG CDATA #REQUIRED
    pABPOthers CDATA #REQUIRED
    pABPSpecify CDATA #REQUIRED>

<!ELEMENT NCP (ESSENTIAL?)>
<!ATTLIST NCP
    pEssentialNewbornCare (Y|N) #REQUIRED
    pNewbornHearingScreeningTest (Y|N) #REQUIRED
    pNewbornScreeningTest (Y|N) #REQUIRED
    pFilterCardNo CDATA #REQUIRED
    pNewbornHearingRegistryNo CDATA #REQUIRED
    pNewbornHearingScreeningTestResult (P|R|X) #REQUIRED>

<!ELEMENT ESSENTIAL EMPTY>
<!ATTLIST ESSENTIAL
    pDrying (Y|N) #REQUIRED
    pSkinToSkin (Y|N) #REQUIRED
    pCordClamping (Y|N) #REQUIRED
    pProphylaxis (Y|N) #REQUIRED
    pWeighing (Y|N) #REQUIRED
    pVitaminK (Y|N) #REQUIRED
    pBCG (Y|N) #REQUIRED
    pNonSeparation (Y|N) #REQUIRED
    pHepatitisB (Y|N) #REQUIRED>

<!ELEMENT HIVAIDS EMPTY>
<!ATTLIST HIVAIDS
    pLaboratoryNumber CDATA #REQUIRED>

<!ELEMENT CATARACTINFO EMPTY>
<!ATTLIST CATARACTINFO
    pCataractPreAuth CDATA #REQUIRED
        pLeftEyeIOLStickerNumber CDATA #REQUIRED
        pLeftEyeIOLExpiryDate CDATA #REQUIRED
        pRightEyeIOLStickerNumber CDATA #REQUIRED
        pRightEyeIOLExpiryDate CDATA #REQUIRED>

<!ELEMENT PROFESSIONALS EMPTY>
<!ATTLIST PROFESSIONALS
    pDoctorAccreCode CDATA #REQUIRED
    pDoctorLastName CDATA #REQUIRED
    pDoctorFirstName CDATA #REQUIRED
    pDoctorMiddleName CDATA #REQUIRED
    pDoctorSuffix CDATA #REQUIRED
    pWithCoPay (Y|N) #REQUIRED
    pDoctorCoPay CDATA #REQUIRED
    pDoctorSignDate CDATA #REQUIRED>

<!ELEMENT CONSUMPTION (BENEFITS|(HCIFEES, PROFFEES, PURCHASES))>
<!ATTLIST CONSUMPTION
    pEnoughBenefits (Y|N) #REQUIRED>

<!ELEMENT APR (APRBYPATSIG|APRBYPATREPSIG|APRBYTHUMBMARK)>

<!ELEMENT APRBYPATSIG EMPTY>
<!ATTLIST APRBYPATSIG
    pDateSigned CDATA #REQUIRED>

<!ELEMENT APRBYPATREPSIG ((DEFINEDPATREPREL|OTHERPATREPREL), (DEFINEDREASONFORSIGNING|OTHERREASONFORSIGNING))>
<!ATTLIST APRBYPATREPSIG 
    pDateSigned CDATA #REQUIRED>

<!ELEMENT DEFINEDPATREPREL EMPTY>
<!--    pRelCode: One of
			S: Spouse
			C: Child
			P: Parent
			I: Siblings
			O: Others-->
<!ATTLIST DEFINEDPATREPREL
    pRelCode (S|C|P|I) #REQUIRED> 
<!ELEMENT OTHERPATREPREL EMPTY>
<!ATTLIST OTHERPATREPREL
        pRelCode CDATA #FIXED "O"
    pRelDesc CDATA #REQUIRED> 

<!ELEMENT DEFINEDREASONFORSIGNING EMPTY>
<!-- pReasonCode:    One of
    I: Patient is incapacitated
    O: Other reasons. Should be specified in pReasonDesc
    -->
<!ATTLIST DEFINEDREASONFORSIGNING
        pReasonCode (I) #REQUIRED> 
<!ELEMENT OTHERREASONFORSIGNING EMPTY>
<!ATTLIST OTHERREASONFORSIGNING
        pReasonCode CDATA #FIXED "O"
    pReasonDesc CDATA #REQUIRED> 


<!ELEMENT APRBYTHUMBMARK EMPTY>
<!--pThumbmarkedBy:    One of
        P: by patient/member
        R: by representative
    -->
<!ATTLIST APRBYTHUMBMARK
    pThumbmarkedBy (P|R) #REQUIRED>
    
<!ELEMENT BENEFITS EMPTY>
<!ATTLIST BENEFITS
    pTotalHCIFees CDATA #REQUIRED
    pTotalProfFees CDATA #REQUIRED
    pGrandTotal CDATA #REQUIRED>
    
<!ELEMENT HCIFEES EMPTY>
<!ATTLIST HCIFEES
    pTotalActualCharges CDATA #REQUIRED
    pDiscount CDATA #REQUIRED
    pPhilhealthBenefit CDATA #REQUIRED
    pTotalAmount CDATA #REQUIRED
    pMemberPatient (Y|N) #REQUIRED
    pHMO (Y|N) #REQUIRED
    pOthers (Y|N) #REQUIRED>    
    
<!ELEMENT PROFFEES EMPTY>
<!ATTLIST PROFFEES
    pTotalActualCharges CDATA #REQUIRED
    pDiscount CDATA #REQUIRED
    pPhilhealthBenefit CDATA #REQUIRED
    pTotalAmount CDATA #REQUIRED
    pMemberPatient (Y|N) #REQUIRED
    pHMO (Y|N) #REQUIRED
    pOthers (Y|N) #REQUIRED>
    
<!ELEMENT PURCHASES EMPTY>
<!ATTLIST PURCHASES
    pDrugsMedicinesSupplies (Y|N) #REQUIRED
    pDMSTotalAmount CDATA #REQUIRED
    pExaminations (Y|N) #REQUIRED
    pExamTotalAmount CDATA #REQUIRED>   

<!ELEMENT ALLCASERATE (CASERATE+)>
<!ELEMENT CASERATE (CATARACT?)>
<!ATTLIST CASERATE
    pCaseRateCode CDATA #REQUIRED
    pICDCode CDATA #REQUIRED
    pRVSCode CDATA #REQUIRED
    pCaseRateAmount CDATA #REQUIRED>
    
<!ELEMENT CATARACT EMPTY>
<!ATTLIST CATARACT
    pCataractPreAuth CDATA #REQUIRED>

<!ELEMENT ZBENEFIT EMPTY>
<!ATTLIST ZBENEFIT
    pZBenefitCode (Z0011|Z0012|Z0013|Z0021|Z0022|Z003|Z0041|Z0042|Z0051|Z0052|Z0061|Z0062|Z0071|Z0072|Z0081|Z0082|Z0091|Z0092) #REQUIRED
    pPreAuthDate CDATA #REQUIRED>

<!ELEMENT CF3 (CF3_OLD?, CF3_NEW?)>
<!ELEMENT CF3_OLD (PHEX, MATERNITY?)>
<!ATTLIST CF3_OLD
    pChiefComplaint CDATA #REQUIRED
    pBriefHistory CDATA #REQUIRED
    pCourseWard CDATA #REQUIRED
    pPertinentFindings CDATA #REQUIRED>
    
<!ELEMENT MATERNITY (PRENATAL, DELIVERY, POSTPARTUM)>   
<!ELEMENT PRENATAL (CLINICALHIST, OBSTETRIC, MEDISURG, CONSULTATION+)>
<!ATTLIST PRENATAL
    pPrenatalConsultation CDATA #REQUIRED
    pMCPOrientation (Y|N) #REQUIRED
    pExpectedDeliveryDate CDATA #REQUIRED>
    
<!ELEMENT CLINICALHIST EMPTY>
<!ATTLIST CLINICALHIST
    pVitalSigns (Y|N) #REQUIRED
    pPregnancyLowRisk (Y|N) #REQUIRED
    pLMP CDATA #REQUIRED
    pMenarcheAge CDATA #REQUIRED
    pObstetricG CDATA #REQUIRED
    pObstetricP CDATA #REQUIRED
    pObstetric_T CDATA #REQUIRED
    pObstetric_P CDATA #REQUIRED
    pObstetric_A CDATA #REQUIRED
    pObstetric_L CDATA #REQUIRED>
    
<!ELEMENT OBSTETRIC EMPTY>
<!ATTLIST OBSTETRIC
    pMultiplePregnancy (Y|N) #REQUIRED
    pOvarianCyst (Y|N) #REQUIRED
    pMyomaUteri (Y|N) #REQUIRED
    pPlacentaPrevia (Y|N) #REQUIRED
    pMiscarriages (Y|N) #REQUIRED
    pStillBirth (Y|N) #REQUIRED
    pPreEclampsia (Y|N) #REQUIRED
    pEclampsia (Y|N) #REQUIRED
    pPrematureContraction (Y|N) #REQUIRED>
    
<!ELEMENT MEDISURG EMPTY>
<!ATTLIST MEDISURG
    pHypertension (Y|N) #REQUIRED
    pHeartDisease (Y|N) #REQUIRED
    pDiabetes (Y|N) #REQUIRED
    pThyroidDisaster (Y|N) #REQUIRED
    pObesity (Y|N) #REQUIRED
    pAsthma (Y|N) #REQUIRED
    pEpilepsy (Y|N) #REQUIRED
    pRenalDisease (Y|N) #REQUIRED
    pBleedingDisorders (Y|N) #REQUIRED
    pPreviousCS (Y|N) #REQUIRED
    pUterineMyomectomy (Y|N) #REQUIRED>
    
<!ELEMENT CONSULTATION EMPTY>
<!ATTLIST CONSULTATION
    pVisitDate CDATA #REQUIRED
    pAOGWeeks CDATA #REQUIRED
    pWeight CDATA #REQUIRED
    pCardiacRate CDATA #REQUIRED
    pRespiratoryRate CDATA #REQUIRED
    pBloodPressure CDATA #REQUIRED
    pTemperature CDATA #REQUIRED>   
    
<!ELEMENT DELIVERY EMPTY>
<!ATTLIST DELIVERY
    pDeliveryDate CDATA #REQUIRED
    pDeliveryTime CDATA #REQUIRED
    pObstetricIndex CDATA #REQUIRED
    pAOGLMP CDATA #REQUIRED
    pDeliveryManner CDATA #REQUIRED
    pPresentation CDATA #REQUIRED
    pFetalOutcome CDATA #REQUIRED
    pSex CDATA #REQUIRED
    pBirthWeight CDATA #REQUIRED
    pAPGARScore CDATA #REQUIRED
    pPostpartum CDATA #REQUIRED>    
    
<!ELEMENT POSTPARTUM EMPTY>
<!ATTLIST POSTPARTUM
    pPerinealWoundCare (Y|N) #REQUIRED
    pPerinealRemarks CDATA #REQUIRED
    pMaternalComplications (Y|N) #REQUIRED
    pMaternalRemarks CDATA #REQUIRED
    pBreastFeeding (Y|N) #REQUIRED
    pBreastFeedingRemarks CDATA #REQUIRED
    pFamilyPlanning (Y|N) #REQUIRED
    pFamilyPlanningRemarks CDATA #REQUIRED
    pPlanningService (Y|N) #REQUIRED
    pPlanningServiceRemarks CDATA #REQUIRED
    pSurgicalSterilization (Y|N) #REQUIRED
    pSterilizationRemarks CDATA #REQUIRED
    pFollowupSchedule (Y|N) #REQUIRED
    pFollowupScheduleRemarks CDATA #REQUIRED>           

<!ELEMENT CF3_NEW (ADMITREASON?, COURSE?)>

<!ELEMENT ADMITREASON (CLINICAL+, LABDIAG+, PHEX)>
<!ATTLIST ADMITREASON
    pBriefHistory CDATA #REQUIRED
    pReferredReason CDATA #REQUIRED
    pIntensive (Y|N) #REQUIRED
    pMaintenance (Y|N) #REQUIRED>

<!ELEMENT CLINICAL EMPTY>
<!ATTLIST CLINICAL
    pCriteria CDATA #REQUIRED>

<!ELEMENT LABDIAG EMPTY>
<!ATTLIST LABDIAG
    pCriteria CDATA #REQUIRED>

<!ELEMENT PHEX EMPTY>
<!ATTLIST PHEX
    pBP CDATA #REQUIRED
    pCR CDATA #REQUIRED
    pRR CDATA #REQUIRED
    pTemp CDATA #REQUIRED
    pHEENT CDATA #REQUIRED
    pChestLungs CDATA #REQUIRED
    pCVS CDATA #REQUIRED
    pAbdomen CDATA #REQUIRED
    pGUIE CDATA #REQUIRED
    pSkinExtremities CDATA #REQUIRED
    pNeuroExam CDATA #REQUIRED>

<!ELEMENT COURSE (WARD+)>
<!ELEMENT WARD EMPTY>
<!ATTLIST WARD
    pCourseDate CDATA #REQUIRED
    pFindings CDATA #REQUIRED
    pAction CDATA #REQUIRED>    

<!ELEMENT PARTICULARS ((DRGMED+|XLSO+), (DRGMED*|XLSO*))>
<!ELEMENT DRGMED EMPTY>
<!ATTLIST DRGMED
    pPurchaseDate CDATA #REQUIRED
    pDrugCode CDATA #REQUIRED
    pPNDFCode CDATA #REQUIRED
    pGenericName CDATA #REQUIRED
    pBrandName CDATA #REQUIRED
    pPreparation CDATA #REQUIRED
    pQuantity CDATA #REQUIRED>
<!ELEMENT XLSO EMPTY>
<!ATTLIST XLSO
    pDiagnosticDate CDATA #REQUIRED
    pDiagnosticType (IMAGING|LABORATORY|SUPPLIES|OTHERS) #REQUIRED
    pDiagnosticName CDATA #REQUIRED
    pQuantity CDATA #REQUIRED>

<!ELEMENT RECEIPTS (RECEIPT+)>
<!ELEMENT RECEIPT (ITEM+)>
<!ATTLIST RECEIPT
    pCompanyName CDATA #REQUIRED
    pCompanyTIN CDATA #REQUIRED
    pBIRPermitNumber CDATA #REQUIRED
    pReceiptNumber CDATA #REQUIRED
    pReceiptDate CDATA #REQUIRED
    pVATExemptSale CDATA #REQUIRED
    pVAT CDATA #REQUIRED
    pTotal CDATA #REQUIRED>
<!ELEMENT ITEM EMPTY>
<!ATTLIST ITEM
    pQuantity CDATA #REQUIRED
    pUnitPrice CDATA #REQUIRED
    pDescription CDATA #REQUIRED
    pAmount CDATA #REQUIRED>


<!ELEMENT OFFLINEDOCUMENTS (OFFLINEDOCUMENT+)>
<!ELEMENT OFFLINEDOCUMENT (#PCDATA)>
<!ATTLIST OFFLINEDOCUMENT
	pDocumentType CDATA #REQUIRED
	pMimeType CDATA #REQUIRED
	pEncryptionUsed (N|C|P) #REQUIRED>	
```
:::

The typos in the version history ("at leasy on", "the the") are in PhilHealth's original file.

## Common mistakes

- **Reusing the upload writer unchanged.** It produces `DOCUMENTS` (invalid here) and omits `pClaimSeriesLhio` (required here).
- **Adding migration-only attributes to the upload XML.** `pClaimSeriesLhio` and the newborn-hearing attributes make an upload file invalid against v1.9.
- **Following the dictionary's `SESSION` element.** It doesn't exist in the DTD ([KI-37](/known-issues#ki-37)).
- **Embedding the `.enc` attachment and marking it `N`.** If the old system kept only the PhilHealth-public-key-encrypted copy, the new provider cannot open it. Say so in `pEncryptionUsed` (see the interpretation above and [KI-54](/known-issues#ki-54)), or embed the original file.
- **Truncating `pMimeType` to 3 characters** because the dictionary says String(3).
- **Storing `pClaimSeriesLhio` as a number.** It loses the leading zero.
- **Trusting a plain lxml `validate()` result** without reading the error log. It fails for every claim because of the `DISCHARGE` model (and also `PROCEDURES` and `PARTICULARS` when present) ([KI-43](/known-issues#ki-43)).
- **Patching only `DISCHARGE`.** A claim with repetitive procedures or `PARTICULARS` still fails in lxml. Patch all three models with the script on [Validating XML](/guides/validating-xml#the-eclaims-dtd-and-libxml2), or use [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml).

## Related pages

- [Migrating data between providers](/guides/data-migration): the export and import procedure
- [eClaims XML](/reference/eclaims-xml): all unchanged elements and attributes
- [Document type codes](/reference/document-types): values for `pDocumentType`
- [API payload encryption](/guides/encryption/api-payloads): how to encrypt the whole file
- [getUploadedClaimsMap](/api/get-uploaded-claims-map): source of `pClaimSeriesLhio`
- [Validating XML](/guides/validating-xml): the Java validator and the patched-DTD script
- [Known issues](/known-issues): [KI-10](/known-issues#ki-10), [KI-37](/known-issues#ki-37), [KI-43](/known-issues#ki-43), [KI-54](/known-issues#ki-54), [KI-60](/known-issues#ki-60), [KI-64](/known-issues#ki-64)
