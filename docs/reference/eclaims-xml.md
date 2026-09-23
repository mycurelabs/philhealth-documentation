---
title: eClaims XML
description: Element-by-element reference for the eClaims upload XML (eClaimsDef.dtd v1.9) used by uploadeClaims, eClaimsFileCheck and validateCF5, plus the eRECEIPT response.
---

# eClaims XML

<Badge type="tip" text="Current: DTD v1.9" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="danger" text="Tooling" />

The eClaims XML is the main claim file your system sends to PhilHealth. It carries the data of Claim Form 1 (CF1) and Claim Form 2 (CF2), the benefit being claimed, and links to the supporting documents. This page describes every element and attribute in `eClaimsDef.dtd` version 1.9, the extra rules from PhilHealth's data dictionary (Annex C of the Guide; see [how annexes are named](/getting-started/how-to-read#placeholders-and-conventions)), how to validate the file, and the `eRECEIPT` you get back. Use it when you build or debug the XML generator in your Hospital Information System (HIS).

::: info Sources
- [Implementation Guide (rev. 20250217), p. 19–20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19): uploadeClaims method
- [Implementation Guide, p. 21–28](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=21): eClaims DTD v1.9 (printed copy)
- [Implementation Guide, p. 29–35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29): sample eClaims XML and encrypted payloads
- [Implementation Guide, p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35): `eRECEIPT` samples
- [Implementation Guide, p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) (validateCF5) and [p. 44–45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44) (eClaimsFileCheck)
- [Implementation Guide, Annex C, p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79): data dictionary "eClaimsUpload"
- [Implementation Guide, revision history, p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) (v1.9, 2017-06-23)
- [Validating e-Claims XML File in Netbeans.pdf](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf) (2025-02-18)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5) (confirms the `pUserName` and `pUserPassword` rule)
- [Dummy Health Care Providers and Employers.pdf](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (test values used in the example)
- [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) (naming of the encrypted files)
- [PhilHealth Circular 2023-0026, p. 2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=2) (the terms HF and HCI)
:::

## TL;DR: what you need to do

1. Start from the unofficial example [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) and fill it from your own data. Keep the element order shown in the [element tree](#element-tree).
2. Write **every** attribute, even when it doesn't apply: `""` for text attributes, and one of the listed values for enumerated ones ([code tables](/reference/code-tables)).
3. Set `pUserName` to `":"` plus your software certificate ID, and `pUserPassword` to `""` ([KI-03](/known-issues#ki-03)).
4. Write dates as `MM-DD-YYYY`, times as `HH:MM:SSAM/PM` and amounts as `#######.##` ([formats](#formats)).
5. List each attachment in `DOCUMENTS` with its [document type code](/reference/document-types) and the HTTPS URL of the file, encrypted with PhilHealth's public key. Check the eSOA and CF5 with [validateeSOA](/api/validate-esoa) and [validateCF5](/api/validate-cf5) before you encrypt and host them.
6. Validate locally with [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) or, if your stack uses libxml2, with a [patched copy of the DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2). Plain lxml, xmllint and PHP can't validate this DTD reliably as published ([KI-43](/known-issues#ki-43)). Then check the final file, with the live attachment URLs, with [eClaimsFileCheck](/api/eclaims-file-check).
7. Encrypt the XML with your cipher key, send it to [uploadeClaims](/api/upload-eclaims), store the `eRECEIPT` you get back, and call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with its receipt ticket number.

## What the file contains

One eClaims XML file is one *transmittal*: a batch of one or more claims from one health facility. Each claim follows the paper claim forms.

| Element | What it holds |
|---|---|
| `eCLAIMS` | The sender: facility code, email, and your software certificate ID. |
| `eTRANSMITTAL` | The batch: your transmittal number and the number of claims. |
| `CLAIM` | One claim: your claim number, the claim type, inpatient or outpatient. |
| `CF1` | Claim Form 1 data: the member (the PhilHealth-insured person) and the patient (the member or a dependent). |
| `CF2` | Claim Form 2 data: confinement dates, diagnoses and procedures, special packages, doctors, charges, and the consent to access patient records. |
| `ALLCASERATE` or `ZBENEFIT` | The payment mechanism: the case rates or the Z-benefit package being claimed. |
| `CF3` | Optional Claim Form 3 data (clinical record, maternity record). When it is required is not documented ([KI-62](/known-issues#ki-62)). |
| `PARTICULARS` | Optional list of drugs, medicines and diagnostics the patient bought. |
| `RECEIPTS` | Optional official receipts. |
| `DOCUMENTS` | URLs of the encrypted supporting documents (scanned forms, CF4, CF5, eSOA). |

See the [glossary](/getting-started/glossary) for terms such as PIN, PAN, PEN and case rate.

## How the XML is sent

You never send the XML as plain text. You encrypt it with your facility's **cipher key** (the API payload scheme) and send the resulting JSON envelope. Three methods take it:

| Method | How the eClaims XML is used | Source |
|---|---|---|
| [uploadeClaims](/api/upload-eclaims) | The whole request body is the encrypted XML. The decrypted `result` is an `eRECEIPT` XML ([see below](#ereceipt-response)). | [Guide p. 19–20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19) |
| [eClaimsFileCheck](/api/eclaims-file-check) | Same body as `uploadeClaims`. It "allows the caller to validate the eClaims XML File". | [Guide p. 44–45](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=44) |
| [validateCF5](/api/validate-cf5) | The body has two keys: `cf5` (the encrypted CF5 XML) and `eclaims` ("The e-Claims XML text encrypted using cipher key of the HF"). | [Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) |

The Guide doesn't say whether the eClaims XML you send to `validateCF5` must already contain the final `DOCUMENTS` entries, or be identical to the file you upload later ([KI-62](/known-issues#ki-62)).

The envelope looks like this before you send it (values shortened):

```json
{
  "docMimeType": "text/xml",
  "hash": "<SHA-256 hash of the plain XML text>",
  "key1": "",
  "key2": "",
  "iv": "<base64 of the 16-byte AES initialization vector>",
  "doc": "<base64 of the AES-256-CBC encrypted XML>"
}
```

How to build it step by step is on [Encrypting API payloads](/guides/encryption/api-payloads).

Why the details matter: the Guide says `uploadeClaims` "ensures Document Type Definition (DTD) compliance and validates XML element attributes based on the eClaims XML Elements Attribute Definition table". The DevKit has no table with exactly that name ([KI-09](/known-issues#ki-09)). The closest match is Annex C ("Data Dictionary eClaimsUpload"), so assume the server checks both the DTD structure and the Annex C rules on this page. It also says "The transmission date serves as the official date received for the uploaded claims", which is used to measure the turnaround time (TAT) ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).

::: warning Two different encryption schemes
The eClaims XML itself is encrypted with your **cipher key** (`key1` and `key2` are empty strings). The files listed in `DOCUMENTS` are encrypted with **PhilHealth's public key** instead. The two schemes are easy to confuse. See [KI-12](/known-issues#ki-12) and [Encryption overview](/guides/encryption/).
:::

::: tip Recommendation (not from PhilHealth)
A safe order for each claim:

1. Build the XML files (eClaims, eSOA, CF5, CF4).
2. Check each one locally against its DTD ([see below](#validating-the-xml)).
3. Send the eSOA to [validateeSOA](/api/validate-esoa) and the CF5 to [validateCF5](/api/validate-cf5), and fix any reported problem.
4. Encrypt every attachment with PhilHealth's public key and publish it at an HTTPS URL.
5. Send the final eClaims XML, with the live URLs, to `eClaimsFileCheck`, and fix any reported problem.
6. Send the same XML to `uploadeClaims`.
7. Decrypt the `result`, parse the `eRECEIPT`, and store the receipt ticket number (RTN) and transmission control number (TCN) with the claim.
8. Call [getUploadedClaimsMap](/api/get-uploaded-claims-map) with the RTN to get PhilHealth's claim series number.

The DevKit doesn't say how PECWS treats a second upload of the same claim or transmittal, so make retries safe: store every `eRECEIPT`, and don't re-send a claim that already has one ([KI-62](/known-issues#ki-62)).
:::

## Element tree

`?` = optional (0 or 1), `*` = zero or more, `+` = one or more, no mark = exactly one. Order matters: children must appear in the order shown.

```text
eCLAIMS
└── eTRANSMITTAL
    └── CLAIM+
        ├── CF1                                  (empty element, attributes only)
        ├── CF2
        │   ├── DIAGNOSIS
        │   │   └── DISCHARGE+
        │   │       ├── ICDCODE*                 at least one ICDCODE or RVSCODES,
        │   │       └── RVSCODES*                ICDCODEs first
        │   ├── SPECIAL                          (required, may be empty)
        │   │   ├── PROCEDURES?
        │   │   │   └── HEMODIALYSIS | PERITONEAL | LINAC | COBALT | TRANSFUSION |
        │   │   │       BRACHYTHERAPHY | CHEMOTHERAPY | DEBRIDEMENT | IMRT   (1 or more)
        │   │   │       └── SESSIONS*
        │   │   ├── MCP?
        │   │   ├── TBDOTS?
        │   │   ├── ABP?
        │   │   ├── NCP?
        │   │   │   └── ESSENTIAL?
        │   │   ├── HIVAIDS?
        │   │   └── CATARACTINFO?
        │   ├── PROFESSIONALS+
        │   ├── CONSUMPTION
        │   │   └── either BENEFITS
        │   │       or     HCIFEES, PROFFEES, PURCHASES
        │   └── APR?
        │       └── one of APRBYPATSIG
        │                  APRBYPATREPSIG
        │                  ├── DEFINEDPATREPREL | OTHERPATREPREL
        │                  └── DEFINEDREASONFORSIGNING | OTHERREASONFORSIGNING
        │                  APRBYTHUMBMARK
        ├── ALLCASERATE          ┐ exactly one of the two
        │   └── CASERATE+        │
        │       └── CATARACT?    │ (deprecated)
        ├── ZBENEFIT             ┘
        ├── CF3?
        │   ├── CF3_OLD?
        │   │   ├── PHEX
        │   │   └── MATERNITY?
        │   │       ├── PRENATAL
        │   │       │   ├── CLINICALHIST
        │   │       │   ├── OBSTETRIC
        │   │       │   ├── MEDISURG
        │   │       │   └── CONSULTATION+
        │   │       ├── DELIVERY
        │   │       └── POSTPARTUM
        │   └── CF3_NEW?
        │       ├── ADMITREASON?
        │       │   ├── CLINICAL+
        │       │   ├── LABDIAG+
        │       │   └── PHEX
        │       └── COURSE?
        │           └── WARD+
        ├── PARTICULARS?
        │   └── DRGMED and/or XLSO   (see the PARTICULARS section)
        ├── RECEIPTS?
        │   └── RECEIPT+
        │       └── ITEM+
        └── DOCUMENTS
            └── DOCUMENT+
```

The DTD declares 71 elements. 37 of them are empty elements that carry data only in attributes. No element contains text.

## Rules that apply to every element

### Every attribute must be present

`eClaimsDef.dtd` declares 247 attributes (230 different names). **243 of them are `#REQUIRED`.** The exceptions are:

| Attribute | DTD rule |
|---|---|
| `eCLAIMS@pServiceProvider` | `#IMPLIED` (optional) |
| `CF2@pHasAttachedSOA` | `#IMPLIED` (optional) |
| `OTHERPATREPREL@pRelCode` | `#FIXED "O"` |
| `OTHERREASONFORSIGNING@pReasonCode` | `#FIXED "O"` |

`#REQUIRED` means the attribute must be written, not that it must have a value. When a value does not apply, **write the attribute with an empty string**. PhilHealth's own sample does this, for example `pTrackingNumber=""`, `pMemberSuffix=""`, `pLandlineNo=""`, `pExpiredDate=""`, `pExpiredTime=""`, `pReferralIHCPAccreCode=""`, and `pRVSCode=""` in a medical case rate ([Guide p. 29–31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)).

```xml
<!-- Wrong: the attribute is missing. -->
<CF2 pPatientReferred="N" pAdmissionDate="09-15-2026" ... />

<!-- Right: it is present and empty. -->
<CF2 pPatientReferred="N" pReferredIHCPAccreCode="" pAdmissionDate="09-15-2026" ... />
```

There are two limits to the empty-string approach:

- **Enumerated attributes cannot be empty.** An attribute declared with a list of values, such as `(Y|N)` or `(L|R|B|N)`, must hold one of those values. A validator reports `Value "" for attribute pWithCoPay of PROFESSIONALS is not among the enumerated set`. Every allowed value is listed on [Code tables](/reference/code-tables).
- **Required elements cannot be left out.** For example, `SPECIAL` must always be present, even with no content (`<SPECIAL/>`).

### Formats

| Kind | Format | Example | Source |
|---|---|---|---|
| Date | `MM-DD-YYYY` | `09-15-2026` | [Annex C](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| Time | `HH:MM:SSAM/PM` (12-hour clock, seconds, no space) | `01:00:00PM` | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| Amount | `#######.##` | `10000.00` | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| Flag | `Y` or `N` | `N` | DTD |
| Names | "Any value consisting of: 'A' to 'Z', 'Ñ'. Can include a space in between characters" | `DELA CRUZ` | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |

CF4 uses `YYYY-MM-DD` instead. Don't reuse a CF4 date formatter for the eClaims XML ([KI-08](/known-issues#ki-08)). Other PhilHealth samples and responses use still other date and time styles ([KI-49](/known-issues#ki-49)).

::: tip Recommendation (not from PhilHealth): encoding and writing Ñ
The DevKit doesn't state the character encoding of the eClaims XML, or whether an upload may include a `DOCTYPE` line ([KI-62](/known-issues#ki-62)). The DTD declares the entities `&Ntilde;` (Ñ), `&ntilde;` (ñ) and `&nbsp;`, but a parser only knows these names when it reads the DTD, and the Guide's sample has no `DOCTYPE` line.

- Write the file in UTF-8, and use UTF-8 when you hash and encrypt it too. The cipher-key procedure doesn't name an encoding either ([KI-60](/known-issues#ki-60)).
- Write Ñ as the literal character (UTF-8) or as the numeric reference `&#209;`. Both mean Ñ in any XML parser, with or without the DTD. Don't use `&Ntilde;`.
:::

### Lengths

The lengths (`String(n)`) come from Annex C, not from the DTD, so a DTD validator doesn't check them. The Guide says `uploadeClaims` validates attributes against an "eClaims XML Elements Attribute Definition table", which is presumably Annex C ([KI-09](/known-issues#ki-09)), so keep to them. Some lengths contradict PhilHealth's own samples ([KI-31](/known-issues#ki-31)), and this page notes each case. Recommendation (not from PhilHealth): make your database columns wider than the documented length and check the real limit with `eClaimsFileCheck`.

### Exact spelling

XML is case-sensitive. Copy names from the DTD exactly, including the odd ones:

- `BRACHYTHERAPHY` (not `BRACHYTHERAPY`)
- `pThyroidDisaster` (described as "Thyroid Disorder")
- `pMemberShipType` (capital `S`), `pPhilhealthClaimType` (lowercase `h` in `health`)
- `pMemberFirstName` and `pUterineMyomectomy` (Annex C misspells both, [KI-32](/known-issues#ki-32))
- `pObstetric_T`, `pObstetric_P`, `pObstetric_A`, `pObstetric_L` (with underscores) next to `pObstetricG` and `pObstetricP` (without)

### Conditional rules

The DTD can't say "required when…", so Annex C states these rules in words. Because almost every attribute is `#REQUIRED` anyway, "required" here means "must not be empty".

| When | Then | Source |
|---|---|---|
| `CLAIM@pPhilhealthClaimType="ALL-CASE-RATE"` | Use `ALLCASERATE` (not `ZBENEFIT`). | Sample comments, [Guide p. 31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=31) |
| `CLAIM@pPhilhealthClaimType="Z-BENEFIT"` | Use `ZBENEFIT` (not `ALLCASERATE`). | Sample comments, [Guide p. 31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=31) |
| `CF1@pPatientIs="M"` (patient is the member) | `pPatientFirstName` and `pPatientMiddleName` "can be blank since these are disregarded". Annex C's row for `pPatientLastName` gives no rule; it is probably disregarded too ([KI-50](/known-issues#ki-50)). | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `CF1@pMemberShipType` is not `S` or `G` | `pPEN` and `pEmployerName` "are disregarded". | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| Patient referred by another [IHCP](/getting-started/glossary#ihcp) (health facility) (`pPatientReferred="Y"`) | `pReferredIHCPAccreCode` is required. | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `CF2@pDisposition="E"` (expired) | `pExpiredDate` and `pExpiredTime` are required. | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `CF2@pDisposition="T"` (transferred/referred) | `pReferralIHCPAccreCode` and `pReferralReasons` are required (one merged Annex C cell covers both). | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| Operating room, surgeon and anesthesiologist claims | `RVSCODES@pRVSCode` is required. | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| Prenatal claims under a non-hospital facility | `MCP` check-up dates are required. | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| TB-DOTS claims | `TBDOTS@pTBType` and `pNTPCardNo` are required. | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| Animal Bite Package claims | `ABP` dates and `pABPSpecify` are required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| Newborn Care Package | `NCP` flags are required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `NCP@pNewbornScreeningTest="Y"` | `pFilterCardNo` is required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `NCP@pEssentialNewbornCare="Y"` | The `ESSENTIAL` flags are required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| Outpatient HIV/AIDS Treatment Package | `HIVAIDS@pLaboratoryNumber` is required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `PROFESSIONALS@pWithCoPay="Y"` | `pDoctorCoPay` is required. | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `CONSUMPTION@pEnoughBenefits="Y"` | Use `BENEFITS`. | DTD choice, sample comment, [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `CONSUMPTION@pEnoughBenefits="N"` | Use `HCIFEES`, `PROFFEES` and `PURCHASES`. | DTD choice, sample comment, [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `PURCHASES@pDrugsMedicinesSupplies="Y"` | `pDMSTotalAmount` is required. | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) ([KI-32](/known-issues#ki-32)) |
| `PURCHASES@pExaminations="Y"` | `pExamTotalAmount` is required. | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) ([KI-32](/known-issues#ki-32)) |
| Consent signed by a representative whose relation is not listed | Use `OTHERPATREPREL` with `pRelDesc`. | DTD, [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| Consent signed by a representative for another reason | Use `OTHERREASONFORSIGNING` with `pReasonDesc`. | DTD, [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

## Element reference

Each table merges two sources. **Required by DTD** and the enumerated values come from [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd). **Type / length**, formats, rules and descriptions come from Annex C (quoted text is verbatim; `[sic]` marks a typo in the source). "Enum" means the DTD lists the allowed values. "CDATA" means any text, including an empty string. The two sources don't list the same attributes: the DTD decides which attributes exist, and Annex C only adds lengths and rules ([KI-50](/known-issues#ki-50)).

### eCLAIMS (root)

The root element identifies the sender. Content: `(eTRANSMITTAL)`

**`eCLAIMS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pUserName` | Yes | CDATA · String(20) | Annex C: "To be provided by PhilHealth" (outdated, see [KI-03](/known-issues#ki-03)). Since revision 20241111: `":"` + software certificate ID | Provider user id | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pUserPassword` | Yes | CDATA · String(20) | Annex C: "To be provided by PhilHealth". The Guide sample sends `""` | Provider user password | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pHospitalCode` | Yes | CDATA · String(12) | "For now PMCC number should be used" | Facility Accreditation Number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pHospitalEmail` | Yes | CDATA · String(150) | "Must not be blank" | Hospital email address where communication will be sent | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pServiceProvider` | No (`#IMPLIED`) | CDATA · String(50) | — | Acronym or short name of the company/institution that provided the system used to submit the eClaims XML file | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

::: danger pUserName is the software certificate ID (KI-03)
Since Guide revision 20241111, "the correct value of the attribute pUserName must be colon plus software certificate ID", and the old `softwareCertifficateId` header was removed ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). The sample uses `pUserName=":SOFTWARE-CERTIFICATE-ID-HERE"` and `pUserPassword=""` ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)). The data-migration dictionary (2024-11-26) says the same: use ":" followed by the software certification ID, and set `pUserPassword` to an empty string ([p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)).

Annex C was not updated. It still says "To be provided by PhilHealth", and it lists a `pCertificateId` attribute that **does not exist in the DTD**. If you add `pCertificateId`, DTD validation fails with "No declaration for attribute". See [KI-03](/known-issues#ki-03).
:::

::: warning pUserName length (KI-03)
Annex C still gives `pUserName` a length of String(20), and gives the certificate number (`pCertificateId`) String(50). The DevKit doesn't say whether the 20-character limit still applies to `":"` plus the certificate ID. If your certificate ID is longer than 19 characters, confirm with PhilHealth. See [KI-03](/known-issues#ki-03).
:::

`pHospitalCode`: "For now PMCC number should be used". The Guide sample and this site's example both use the 6-digit value `123456`. Annex C allows String(12) here, while the CF5 data dictionary limits the same PMCC number to 6 characters ([KI-31](/known-issues#ki-31)). Annex C also calls this attribute the "Facility Accreditation Number", and the DevKit never says which facility identifier (PMCC number or accreditation number) each API method expects ([KI-48](/known-issues#ki-48)).

### eTRANSMITTAL

One batch of claims. Content: `(CLAIM+)`

**`eTRANSMITTAL` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pHospitalTransmittalNo` | Yes | CDATA · String(20) (p. 85; blank on p. 79) | "Generated by the Hospital own batching system. This should be unique per hospital." | Hospital Transmittal Number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pTotalClaims` | Yes | CDATA · String(3) | "Integer format" | Claims counter | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |

Annex C lists `pHospitalTransmittalNo` twice: without a length on p. 79 and as String(20) on p. 85 ([KI-50](/known-issues#ki-50)). Annex C only calls `pTotalClaims` a "Claims counter"; recommendation (not from PhilHealth): set it to the number of `CLAIM` elements in the file.

The transmittal number and the claim number "should be unique per hospital", but the DevKit doesn't say what happens when you upload the same number twice, or whether you may reuse a number after a rejected upload ([KI-62](/known-issues#ki-62)). Recommendation (not from PhilHealth): never reuse either number, and store every `eRECEIPT`. If an upload times out before you get a receipt, don't re-send it blindly: ask PhilHealth how to check whether it arrived.

### CLAIM

One claim. Content: `(CF1, CF2, (ALLCASERATE | ZBENEFIT), CF3?, PARTICULARS?, RECEIPTS?, DOCUMENTS)`

The order is fixed: `CF1`, `CF2`, then **exactly one** of `ALLCASERATE` or `ZBENEFIT`, then the optional `CF3`, `PARTICULARS` and `RECEIPTS`, and finally `DOCUMENTS`, which is required and must contain at least one `DOCUMENT`.

**`CLAIM` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pClaimNumber` | Yes | CDATA · String(12) | "Hospital Generated Claim Case #, this should be unique per hospital" | Hospital Claim Number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pTrackingNumber` | Yes | CDATA · String(20) | `####-####-####-####`; "Can be blank" | The Claims Eligibility Tracking number assigned if undergone the Online Eligibility Checking | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPhilhealthClaimType` | Yes | Enum · String(20) | One of `ALL-CASE-RATE`, `Z-BENEFIT` | Flag whether Claims Payment Mechanism | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPatientType` | Yes | Enum · String(1) | `I` Inpatient, `O` Outpatient | Patient Type | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pIsEmergency` | Yes | Enum · String(1) | `Y` Yes, `N` No | Flag if Emergency Case | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |

::: warning pClaimNumber length (KI-31)
Annex C says String(12), but the Guide sample uses `123456-20160930-2` (17 characters). Our example uses `202609170001`: 12 digits, so it fits Annex C's String(12) and also the 13-digit numeric format of the CF5 `ClaimNumber`, which this site recommends setting to the same value ([KI-45](/known-issues#ki-45)). Confirm the limit with `eClaimsFileCheck`. See [KI-31](/known-issues#ki-31).
:::

- `pTrackingNumber` is "The Claims Eligibility Tracking number assigned if undergone the Online Eligibility Checking" and "Can be blank". The [isClaimEligible](/api/is-claim-eligible) method's final call "generates a Tracking Number to confirm the member's eligibility" ([Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)) and returns it as `trackingno` ([p. 71](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=71)). The DevKit doesn't explicitly link the two, but the descriptions match.
- Annex C also lists `pClaimSeriesLhio` (String(15), "returned after the claim are uploaded"). It is **not** an attribute of the upload XML ([KI-50](/known-issues#ki-50)). You get it from [getUploadedClaimsMap](/api/get-uploaded-claims-map), and it is used in the [data-migration XML](/reference/migration-xml).

### CF1

Member and patient data from Claim Form 1. `CF1` is an empty element: all its data is in attributes.

The **member** is the PhilHealth member. The **patient** is either the member (`pPatientIs="M"`) or a dependent: spouse (`S`), child (`C`) or parent (`P`).

**`CF1` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pMemberPIN` | Yes | CDATA · String(12) | "The last character in the PIN is a modulus 11 check digit." | PhilHealth Identification Number (PIN), a unique 12-digit number assigned to a member | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberLastName` | Yes | CDATA · String(60) | "Any value consisting of: 'A' to 'Z', 'Ñ'. Can include a space in between characters" | Member's complete surname | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberFirstName` | Yes | CDATA · String(60) | Same as `pMemberLastName` | Member's complete first name (Annex C spells it `pMemberFirstname`, [KI-32](/known-issues#ki-32)) | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberSuffix` | Yes | CDATA · String(5) | `JR`, `SR`, `III`, etc. "Suffixes can be blank" | Member's suffix name | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberMiddleName` | Yes | CDATA · String(60) | Same as `pMemberLastName` | Member's complete middle name | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberBirthDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Member's birth date | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberShipType` | Yes | Enum · String(2) | One of `S`, `G`, `I`, `NS`, `NO`, `PS`, `PG`, `P`. See [code tables](/reference/code-tables#membership-type). Annex C says "Not limited to the following", but the DTD accepts only these 8 values ([KI-32](/known-issues#ki-32)) | PhilHealth membership type of the member | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMailingAddress` | Yes | CDATA · String(150) | "This is where the notices will be mailed." | Mailing address (where the benefit payment notice will be sent) | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pZipCode` | Yes | CDATA · String(4) | 4-digit ZIP code of the municipality/city | Philippine ZIP code of the municipality | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMemberSex` | Yes | Enum · String(1) | `M` Male, `F` Female | Member sex | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pLandlineNo` | Yes | CDATA · String(20) | "Can be blank" | Member's landline number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pMobileNo` | Yes | CDATA · String(20) | "Can be blank" | Member's cell number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pEmailAddress` | Yes | CDATA · String(150) | "Can be blank" | Email address | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPatientIs` | Yes | Enum · String(1) | `M` member (self), `S` spouse, `C` child, `P` parent | Whether the patient is the member or, if a dependent, the relationship to the member | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPatientPIN` | Yes | CDATA · String(12) | "The last character in the PIN is a modulus 11 check digit." | PIN of the patient | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPatientLastName` | Yes | CDATA · String(60) | Annex C's row gives no valid values. The note on p. 80 ("Same as for the member. These can be blank since these are disregarded if the value of pPatientIs is 'M'") is printed for the first and middle name only ([KI-50](/known-issues#ki-50)) | Patient's complete surname | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pPatientFirstName` | Yes | CDATA · String(60) | Same as for the member; can be blank when `pPatientIs` is `M` | Patient's complete first name | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pPatientSuffix` | Yes | CDATA · String(5) | `JR`, `SR`, `III`, etc. "Suffixes can be blank" | Patient's suffix name | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pPatientMiddleName` | Yes | CDATA · String(60) | Same as for the member; can be blank when `pPatientIs` is `M` | Patient's complete middle name | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pPatientBirthDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Patient's birth date | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pPatientSex` | Yes | Enum · String(1) | `M` Male, `F` Female | Patient sex (Annex C says "Member Sex") | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pPEN` | Yes | CDATA · String(12) | "These are disregarded if pMemberShipType is not ('S' or 'G')" | PhilHealth Employer Number (PEN), a unique 12-digit number assigned to an employer | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pEmployerName` | Yes | CDATA · String(100) | Disregarded if `pMemberShipType` is not `S` or `G` | The registered name of the employer | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

- When `pPatientIs="M"`, Annex C allows a blank patient first and middle name. The Guide sample repeats the member's data in all the patient fields instead, which is also valid. Recommendation (not from PhilHealth): do the same, so you never depend on which blank fields the server accepts.

::: warning pPEN format (KI-48)
Annex C describes the PhilHealth Employer Number (PEN) as "a unique 12 digit number", String(12). The Guide sample writes it with dashes: `pPEN="11-047400000-2"` (14 characters). The dummy employer list writes the same number as `110474000002`. Our example uses that 12-digit form without dashes, which matches Annex C. Confirm with `eClaimsFileCheck`. See [KI-48](/known-issues#ki-48) and [KI-31](/known-issues#ki-31).
:::

### CF2

Confinement data from Claim Form 2. Content: `(DIAGNOSIS, SPECIAL, PROFESSIONALS+, CONSUMPTION, APR?)`

**`CF2` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pPatientReferred` | Yes | Enum · String(1) | `Y` Yes, `N` No | Referred patient | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pReferredIHCPAccreCode` | Yes | CDATA · String(12) | "Required if the patient is referred by another IHCP" | Referring facility accreditation code | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pAdmissionDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Admission date | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pAdmissionTime` | Yes | CDATA · String(10) | `HH:MM:SSAM/PM`, for example `01:00:00PM` | Admission time | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pDischargeDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Discharge date | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pDischargeTime` | Yes | CDATA · String(10) | `HH:MM:SSAM/PM` | Discharge time | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pDisposition` | Yes | Enum · String(1) | `I` Improved, `R` Recovered, `H` Home/Discharged Against Medical Advise, `A` Absconded, `E` Expired, `T` Transferred/Referred | Patient's disposition | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pExpiredDate` | Yes | CDATA · String(10) | `MM-DD-YYYY`. **Required when `pDisposition` = `E`** | Date of death of patient | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pExpiredTime` | Yes | CDATA · String(10) | `HH:MM:SSAM/PM`. **Required when `pDisposition` = `E`** | Time of death of patient | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pReferralIHCPAccreCode` | Yes | CDATA · String(12) | **Required when `pDisposition` = `T`** | Referral facility accreditation code | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pReferralReasons` | Yes | CDATA · String(150) | Required when `pDisposition` = `T` (same merged cell) | Reason/s for referral/transfer | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pAccommodationType` | Yes | Enum · String(1) | `P` Private, `N` Non-Private (Charity/Service) | Type of accommodation | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pHasAttachedSOA` | No (`#IMPLIED`) | Enum · String(1) | `Y` With attached SOA, `N` Without attached SOA | Whether an SOA is attached (Annex C's description says "Type of Accommodation", [KI-32](/known-issues#ki-32)) | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

`pHasAttachedSOA` is optional in the DTD. Annex C's description of it ("Type of Accommodation") is wrong ([KI-32](/known-issues#ki-32)); its values mean "With attached SOA" and "Without attached SOA". The DevKit doesn't say whether it must be `Y` when you attach an eSOA (document type `ESA`), or whether it refers only to the scanned statement of account (`SOA`) ([KI-62](/known-issues#ki-62)). Our example attaches an `ESA` and sets `pHasAttachedSOA="Y"`; confirm with `eClaimsFileCheck` and PhilHealth.

#### DIAGNOSIS, DISCHARGE, ICDCODE, RVSCODES

`DIAGNOSIS` holds the admission diagnosis and one or more `DISCHARGE` diagnoses. Each `DISCHARGE` lists its ICD-10 codes (`ICDCODE`) and the procedures done (`RVSCODES`, coded with the Relative Value Scale).

- `DIAGNOSIS` content: `(DISCHARGE+)`
- `DISCHARGE` content: `((ICDCODE+, RVSCODES*)|(ICDCODE*, RVSCODES+))`

In plain words: each `DISCHARGE` needs **at least one** `ICDCODE` or `RVSCODES`, and all `ICDCODE`s come before all `RVSCODES`. This content model is "non-deterministic", which trips some validators; see [Validating the XML](#validating-the-xml).

**`DIAGNOSIS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pAdmissionDiagnosis` | Yes | CDATA · String(500) | "Can be multiple lines" | Admission diagnosis | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

**`DISCHARGE` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDischargeDiagnosis` | Yes | CDATA · String(500) | — | Discharge diagnosis | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

**`ICDCODE` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pICDCode` | Yes | CDATA · String(15) | "Refer to ICD10 library" | ICD-10 code of the illness | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

**`RVSCODES` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pRelatedProcedure` | Yes | CDATA · String(150) | "Any value consisting of: 'A' to 'Z', 'Ñ'. Can include a space in between characters" | Related procedure | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pRVSCode` | Yes | CDATA · String(6) | "See RVS Library". "Required for Operating Room, Surgeons and Anesthesiologist claims only" | Relative Value Scale (RVS) code of the procedure/operation performed | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pProcedureDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date of procedure | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pLaterality` | Yes | Enum · String(1) | `L` Left, `R` Right, `B` Both, `N` N/A | Laterality | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

::: warning pLaterality can't be blank here
In the eClaims XML, `pLaterality` is an enumerated attribute, so it must be `L`, `R`, `B` or `N`. An empty string fails validation. This differs from old CF5 guidance, which said to leave laterality blank ([KI-05](/known-issues#ki-05)). Use `N` when no side applies.
:::

#### SPECIAL

`SPECIAL` holds package-specific data. It has no attributes. It is **required**, but all of its children are optional, so `<SPECIAL/>` is valid for an ordinary claim. Content: `(PROCEDURES?, MCP?, TBDOTS?, ABP?, NCP?, HIVAIDS?, CATARACTINFO?)`

The children must appear in this order. The Guide sample labels each one with a comment ([Guide p. 30](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=30)):

| Child | Sample comment |
|---|---|
| `PROCEDURES` | "For Repetitive Procedures" |
| `MCP` | "For MCP Package" |
| `TBDOTS` | "For TB DOTS Package" |
| `ABP` | "For Animal Bite Package" |
| `NCP` | "For Newborn Care Package" |
| `HIVAIDS` | "For Outpatient HIV/AIDS Treatment Package" |
| `CATARACTINFO` | (no comment; DTD 1.8.0: "info about data like IOL sticker number for cataract operation") |

##### PROCEDURES and SESSIONS

`PROCEDURES` lists repetitive procedures, one element per procedure type, each with one `SESSIONS` element per session date. The nine procedure elements have no attributes; each has the content `(SESSIONS*)`.

`PROCEDURES` content: `((HEMODIALYSIS?, PERITONEAL?, LINAC?, COBALT?, TRANSFUSION?, BRACHYTHERAPHY?, CHEMOTHERAPY?, DEBRIDEMENT?, IMRT?), (HEMODIALYSIS|PERITONEAL|LINAC|COBALT|TRANSFUSION|BRACHYTHERAPHY|CHEMOTHERAPY|DEBRIDEMENT|IMRT))`

This model tries to say "at least one procedure type". Recommendation (not from PhilHealth): write each procedure type **at most once, in the DTD order** (HEMODIALYSIS, PERITONEAL, LINAC, COBALT, TRANSFUSION, BRACHYTHERAPHY, CHEMOTHERAPY, DEBRIDEMENT, IMRT). That pattern is always valid. The DTD technically also accepts a few other orders (the last element may be any type), but no source explains when you would need that. The patched DTD this site recommends for libxml2 tools accepts only the recommended pattern ([Validating the XML](#validating-the-xml)).

```xml
<SPECIAL>
  <PROCEDURES>
    <HEMODIALYSIS>
      <SESSIONS pSessionDate="09-01-2026"/>
      <SESSIONS pSessionDate="09-04-2026"/>
    </HEMODIALYSIS>
    <CHEMOTHERAPY>
      <SESSIONS pSessionDate="09-02-2026"/>
    </CHEMOTHERAPY>
  </PROCEDURES>
</SPECIAL>
```

**`SESSIONS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pSessionDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Inclusive date of session | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

##### MCP

**`MCP` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCheckUpDate1` | Yes | CDATA · String(10) | `MM-DD-YYYY`. "Required for prenatal claims under non-hospital facility" | 1st check-up date for MCP package | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pCheckUpDate2` | Yes | CDATA · String(10) | Same as `pCheckUpDate1` | 2nd check-up date for MCP package | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pCheckUpDate3` | Yes | CDATA · String(10) | Same as `pCheckUpDate1` | 3rd check-up date for MCP package | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pCheckUpDate4` | Yes | CDATA · String(10) | Same as `pCheckUpDate1` | 4th check-up date for MCP package | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

##### TBDOTS

**`TBDOTS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pTBType` | Yes | Enum · String(1) | `I` Intensive Phase, `M` Maintenance. For `I`, admission and discharge dates are the first and last days of treatment in the intensive phase; for `M`, in the maintenance phase. "Required for TB-DOTS claims only" | Type of TB-DOTS claim | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pNTPCardNo` | Yes | CDATA · String(10) | "Required for TB-DOTS claims only" | NTP card number | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |

##### ABP

Animal Bite Package dates. ARV = anti-rabies vaccine, RIG = rabies immunoglobulin (Annex C).

**`ABP` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDay0ARV` | Yes | CDATA · String(10) | `MM-DD-YYYY`. "Required for Animal Bite Package claims only" | Day 0 ARV (anti-rabies vaccine) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDay3ARV` | Yes | CDATA · String(10) | Same as `pDay0ARV` | Day 3 ARV (anti-rabies vaccine) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDay7ARV` | Yes | CDATA · String(10) | Same as `pDay0ARV` | Day 7 ARV (anti-rabies vaccine) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pRIG` | Yes | CDATA · String(10) | Same as `pDay0ARV` | RIG (rabies immunoglobulin) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pABPOthers` | Yes | CDATA · String(10) | Same as `pDay0ARV` | Other date | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pABPSpecify` | Yes | CDATA · String(50) | "Required for Animal Bite Package claims only" | Others (specify) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

##### NCP and ESSENTIAL

Newborn Care Package. Content of `NCP`: `(ESSENTIAL?)`

**`NCP` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pEssentialNewbornCare` | Yes | Enum · String(1) | `Y`/`N`. "Required for Newborn Care Package" | Essential newborn care | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pNewbornHearingScreeningTest` | Yes | Enum · String(1) | `Y`/`N`. Required for Newborn Care Package | Newborn hearing screening test | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pNewbornScreeningTest` | Yes | Enum · String(1) | `Y`/`N`. Required for Newborn Care Package | Newborn screening test | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pFilterCardNo` | Yes | CDATA · String(20) | **Required when `pNewbornScreeningTest` = `Y`** | Filter card number | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

**`ESSENTIAL` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDrying` | Yes | Enum · String(1) | One of `Y`, `N`. "Flag whether Yes (Y) or No (Y)" [sic] ([KI-32](/known-issues#ki-32)). Required when `pEssentialNewbornCare` = `Y` | Immediate drying of newborn | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pSkinToSkin` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Early skin-to-skin contact | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pCordClamping` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Timely cord clamping | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pProphylaxis` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Eye prophylaxis | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pWeighing` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Weighing of the newborn | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pVitaminK` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Vitamin K administration | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pBCG` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | BCG vaccination | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pNonSeparation` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Non-separation of mother/baby for early breastfeeding initiation | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pHepatitisB` | Yes | Enum · String(1) | One of `Y`, `N`. Required when `pEssentialNewbornCare` = `Y` | Hepatitis B vaccination | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

::: warning Newborn hearing attributes (KI-10)
The 2024 data-migration DTD adds `NCP@pNewbornHearingRegistryNo` and `NCP@pNewbornHearingScreeningTestResult (P|R|X)`. **They do not exist in `eClaimsDef.dtd` v1.9.** If you add them to an upload XML, validation against v1.9 fails. The meanings of `P`, `R` and `X` are not defined anywhere in the DevKit. See [KI-10](/known-issues#ki-10).
:::

##### HIVAIDS

**`HIVAIDS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pLaboratoryNumber` | Yes | CDATA · String(20) | "Required for Outpatient HIV/AIDS Treatment Package" | Laboratory number | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

##### CATARACTINFO

Cataract operation data, including the intraocular lens (IOL) sticker numbers and expiry dates for each eye. Added in DTD 1.8.0, which also says the older `CASERATE/CATARACT` element "will be deprecated later".

**`CATARACTINFO` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCataractPreAuth` | Yes | CDATA · String(20) | — | Cataract Pre-Authorization Application Number | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| `pLeftEyeIOLStickerNumber` | Yes | CDATA | — | Left-eye intraocular lens (IOL) sticker number (DTD 1.8.0). Not in Annex C | DTD only |
| `pLeftEyeIOLExpiryDate` | Yes | CDATA | — | Left-eye IOL expiry date (DTD 1.8.0). Not in Annex C | DTD only |
| `pRightEyeIOLStickerNumber` | Yes | CDATA | — | Right-eye IOL sticker number (DTD 1.8.0). Not in Annex C | DTD only |
| `pRightEyeIOLExpiryDate` | Yes | CDATA | — | Right-eye IOL expiry date (DTD 1.8.0). Not in Annex C | DTD only |

The four IOL attributes are in the DTD but **not in Annex C**, so the DevKit gives no length or format for them ([KI-50](/known-issues#ki-50)). Recommendation (not from PhilHealth): use `MM-DD-YYYY` for the expiry dates, like every other eClaims date, and `""` for the eye that was not operated on.

#### PROFESSIONALS

One element per doctor (at least one). `PROFESSIONALS` is an empty element.

**`PROFESSIONALS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDoctorAccreCode` | Yes | CDATA · String(12) | Annex C: "Formatted as: '####-######-##'". Samples and test data use `####-#######-#` (see note) | Doctor's accreditation number (PAN) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorLastName` | Yes | CDATA · String(60) | "Same as for the member." | Doctor's complete surname | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorFirstName` | Yes | CDATA · String(60) | Same as for the member | Doctor's complete first name | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorMiddleName` | Yes | CDATA · String(60) | Same as for the member | Doctor's complete middle name | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorSuffix` | Yes | CDATA · String(5) | `JR`, `SR`, `III`, etc. "Suffixes can be blank" | Doctor's suffix name | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pWithCoPay` | Yes | Enum · String(1) | `Y` With co-pay, `N` No co-pay | Whether the professional fee has co-pay | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorCoPay` | Yes | CDATA · String(12) | `#######.##`. **Required when `pWithCoPay` = `Y`** | Amount of co-pay | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDoctorSignDate` | Yes | CDATA | — | Doctor's signature date (added in DTD 1.7.3). Not in Annex C; the Guide sample uses `MM-DD-YYYY` | DTD only |

::: warning pDoctorAccreCode format (KI-48)
Annex C says String(12), "Formatted as: '####-######-##'" (4-6-2 digits, 14 characters with dashes). But every example PAN in the DevKit uses 4-7-1 digits: the Guide sample `1234-1527066-1`, the [getDoctorPAN](/api/get-doctor-pan) sample output `0000-0000000-0` ([Guide p. 50](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=50)), and the dummy doctors `1504-2400015-3` and `1100-2400002-5`. Recommendation (not from PhilHealth): use the 4-7-1 value exactly as `getDoctorPAN` and the test data give it, and confirm with `eClaimsFileCheck`. See [KI-48](/known-issues#ki-48).
:::

`pDoctorSignDate` is not in Annex C ([KI-50](/known-issues#ki-50)). It was added in DTD 1.7.3; the Guide sample uses `MM-DD-YYYY`.

#### CONSUMPTION, BENEFITS, HCIFEES, PROFFEES, PURCHASES

`CONSUMPTION` says whether the PhilHealth benefit covered everything. HCI means health care institution, the former term for a health facility (HF) ([PC 2023-0026 p. 2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=2)); here it stands for the facility's own charges. PF means professional fees (the doctors' charges). Content: `(BENEFITS|(HCIFEES, PROFFEES, PURCHASES))`

- `pEnoughBenefits="Y"`: write one `BENEFITS` element.
- `pEnoughBenefits="N"`: write `HCIFEES`, `PROFFEES` and `PURCHASES`, in that order.

```xml
<!-- Benefit was enough -->
<CONSUMPTION pEnoughBenefits="Y">
  <BENEFITS pTotalHCIFees="7000.00" pTotalProfFees="3000.00" pGrandTotal="10000.00"/>
</CONSUMPTION>

<!-- Benefit was not enough (values from the Guide sample, p. 31) -->
<CONSUMPTION pEnoughBenefits="N">
  <HCIFEES pTotalActualCharges="2000" pDiscount="1800" pPhilhealthBenefit="1500"
           pTotalAmount="300" pMemberPatient="Y" pHMO="N" pOthers="N"/>
  <PROFFEES pTotalActualCharges="3000" pDiscount="2500" pPhilhealthBenefit="1500"
            pTotalAmount="1000" pMemberPatient="Y" pHMO="Y" pOthers="N"/>
  <PURCHASES pDrugsMedicinesSupplies="Y" pDMSTotalAmount="1000"
             pExaminations="N" pExamTotalAmount=""/>
</CONSUMPTION>
```

**`CONSUMPTION` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pEnoughBenefits` | Yes | Enum · String(1) | `Y`/`N`. Decides which children `CONSUMPTION` must have | `Y` if the PhilHealth benefit is enough to cover HCI and PF charges (no purchases of drugs/medicines, supplies, diagnostics, and no co-pay for professional fees by the member/patient). `N` if the benefit was completely consumed prior to co-pay, or not completely consumed but with purchases/expenses for drugs/medicines, supplies, diagnostics and others | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

**`BENEFITS` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pTotalHCIFees` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `Y` | Total health care institution fees | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pTotalProfFees` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `Y` | Total professional fees | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pGrandTotal` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `Y` | "Grand Total is equal to the HCI and Prof Fees" | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

`HCIFEES` and `PROFFEES` have the same attributes.

**`HCIFEES` and `PROFFEES` attributes (identical)**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pTotalActualCharges` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `N` | Total actual charges | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDiscount` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `N` | "Amount after Application of Discount" | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pPhilhealthBenefit` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `N` | PhilHealth benefit | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pTotalAmount` | Yes | CDATA · String(12) | `#######.##`. Required when `pEnoughBenefits` = `N` | "Amount after PhilHealth Deduction" | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pMemberPatient` | Yes | Enum · String(1) | `Y`/`N` "if applicable" | Member/patient | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pHMO` | Yes | Enum · String(1) | `Y`/`N` if applicable | HMO | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pOthers` | Yes | Enum · String(1) | `Y`/`N` if applicable | Others (for example PCSO, promissory note) | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |

**`PURCHASES` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDrugsMedicinesSupplies` | Yes | Enum · String(1) | `Y`/`N` | `Y` if there are purchases of drugs/medicines and/or medical supplies bought by the patient/member within/outside the HCI during confinement; `N` none | [Annex C p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) |
| `pDMSTotalAmount` | Yes | CDATA · String(12) | `#######.##`. "Required when pDMSTotalAmount = 'Y'" [sic]: read as `pDrugsMedicinesSupplies` = `Y` ([KI-32](/known-issues#ki-32)) | Total amount for drugs, medicines and supplies | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pExaminations` | Yes | Enum · String(1) | `Y`/`N` | `Y` if there are diagnostic/laboratory examinations paid for by the patient/member within/outside the HCI during confinement; `N` none | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pExamTotalAmount` | Yes | CDATA · String(12) | `#######.##`. "Required when pExamTotalAmount = 'Y'" [sic]: read as `pExaminations` = `Y` ([KI-32](/known-issues#ki-32)) | Total amount for diagnostic | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |

::: warning Typos in the PURCHASES rules (KI-32)
Annex C says `pDMSTotalAmount` is "Required when pDMSTotalAmount = 'Y'" and `pExamTotalAmount` is "Required when pExamTotalAmount = 'Y'". An amount can't equal `Y`. Read them as "when `pDrugsMedicinesSupplies` = `Y`" and "when `pExaminations` = `Y`". See [KI-32](/known-issues#ki-32).
:::

#### APR (consent to access patient record)

`APR` records who signed the consent to access the patient record. DTD 1.8.0 added it "for saving the data of the Consent to Access Patient Record section of RF2". It is optional. Content: `(APRBYPATSIG|APRBYPATREPSIG|APRBYTHUMBMARK)`

`APRBYPATREPSIG` content: `((DEFINEDPATREPREL|OTHERPATREPREL), (DEFINEDREASONFORSIGNING|OTHERREASONFORSIGNING))`

Pick exactly one form:

| Element | Use when | Content |
|---|---|---|
| `APRBYPATSIG` | The patient signed. | Empty; `pDateSigned` |
| `APRBYPATREPSIG` | A representative signed. | `pDateSigned`; one of `DEFINEDPATREPREL` or `OTHERPATREPREL`, then one of `DEFINEDREASONFORSIGNING` or `OTHERREASONFORSIGNING` |
| `APRBYTHUMBMARK` | A thumbmark was used. | Empty; `pThumbmarkedBy` |

For a representative, choose `DEFINEDPATREPREL` when the relation is spouse, child, parent or sibling, and `OTHERPATREPREL` with a description otherwise. Then choose `DEFINEDREASONFORSIGNING` (patient incapacitated) or `OTHERREASONFORSIGNING` with a description.

```xml
<!-- From the Guide sample (p. 31) -->
<APR>
  <APRBYPATREPSIG pDateSigned="08-26-2009">
    <DEFINEDPATREPREL pRelCode="S" />
    <OTHERREASONFORSIGNING pReasonDesc="MEMBER IS MISSING" />
  </APRBYPATREPSIG>
</APR>
```

**`APRBYPATSIG` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDateSigned` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date the patient signed | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`APRBYPATREPSIG` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDateSigned` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date the representative signed | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`DEFINEDPATREPREL` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pRelCode` | Yes | Enum · String(1) | `S` Spouse, `C` Child, `P` Parent, `I` Sibling | Relation of the representative who signed the consent | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`OTHERPATREPREL` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pRelCode` | Fixed `"O"` | CDATA · String(1) | Fixed by the DTD; you may omit it or write `O` | Always `O` (Others) | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pRelDesc` | Yes | CDATA · String(50) | Required here (the DTD marks it `#REQUIRED`); Annex C: when `pRelCode` is `O`, "pRelDesc should have a value" | Relation of the representative when it is not one of the defined `pRelCode` values | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`DEFINEDREASONFORSIGNING` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pReasonCode` | Yes | Enum · String(1) | `I` Patient is incapacitated (the only value allowed here) | Reason why a representative signed | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`OTHERREASONFORSIGNING` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pReasonCode` | Fixed `"O"` | CDATA · String(1) | Fixed by the DTD; you may omit it or write `O` | Always `O` (other reasons) | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pReasonDesc` | Yes | CDATA · String(50) | Required here; the DTD comment says `O` reasons "Should be specified in pReasonDesc" | Reason why a representative signed the consent | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`APRBYTHUMBMARK` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pThumbmarkedBy` | Yes | Enum · String(1) | `P` of the patient/member, `R` of a representative | Whether the thumbmark is from the member/patient or from a representative | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

::: tip #FIXED attributes: write them anyway
The Guide sample leaves out `pReasonCode` on `OTHERREASONFORSIGNING`. That is valid, because the DTD supplies the fixed value `O`. But a parser only fills in that value when it reads the DTD. Recommendation (not from PhilHealth): write `pRelCode="O"` and `pReasonCode="O"` explicitly, so the value is there whether or not the receiver loads the DTD.
:::

Annex C describes `pReasonCode` `O` as "Patient is incapacitated", the same as `I`. The DTD comment says "O: Other reasons. Should be specified in pReasonDesc", which matches the element design ([KI-32](/known-issues#ki-32)).

### ALLCASERATE, CASERATE, CATARACT

Use `ALLCASERATE` when `pPhilhealthClaimType="ALL-CASE-RATE"`. It holds one or more `CASERATE` elements, one per case rate being claimed. Get the codes and amounts from [searchCaseRates](/api/search-case-rates).

- `ALLCASERATE` content: `(CASERATE+)`
- `CASERATE` content: `(CATARACT?)`

The Guide sample shows a medical case rate (ICD code filled, RVS code empty) and a procedure case rate (RVS code filled, ICD code empty):

```xml
<ALLCASERATE>
  <CASERATE pCaseRateCode="CR0001" pICDCode="A90" pRVSCode="" pCaseRateAmount="10000"/>
  <CASERATE pCaseRateCode="CR0002" pICDCode="" pRVSCode="90935" pCaseRateAmount="2600"/>
</ALLCASERATE>
```

**`CASERATE` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCaseRateCode` | Yes | CDATA · String(6) | "See Case Rate Library" (not in the DevKit, [KI-46](/known-issues#ki-46); use [searchCaseRates](/api/search-case-rates)) | Case rate codes for All Case Rates | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pICDCode` | Yes | CDATA · String(15) | "Refer to ICD10 library". The Guide sample leaves it `""` when the case rate is a procedure (`pRVSCode` filled) | ICD-10 code of the case rate (Annex C defines `pICDCode` once, for the illness) | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pRVSCode` | Yes | CDATA · String(6) | "See RVS Library". The Guide sample leaves it `""` when the case rate is a medical case (`pICDCode` filled) | RVS code of the case rate (Annex C defines `pRVSCode` once) | [Annex C p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80) |
| `pCaseRateAmount` | Yes | CDATA | — | Case rate amount (added in DTD 1.7.3). Not in Annex C; the Guide sample uses `10000` | DTD only |

**`CATARACT` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCataractPreAuth` | Yes | CDATA · String(20) | — | Cataract pre-authorization application number (deprecated location, [KI-07](/known-issues#ki-07)) | [Annex C p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |

::: warning CATARACT is deprecated (KI-07)
DTD 1.8.0 (2016) added `SPECIAL/CATARACTINFO` and says "The CATARACT element will be deprecated later". Both are still in v1.9. Put cataract data in `CATARACTINFO`. See [KI-07](/known-issues#ki-07).
:::

`pCaseRateAmount` is not in Annex C (it was added in DTD 1.7.3, [KI-50](/known-issues#ki-50)). The Guide sample writes `10000`; our example uses `10000.00` to match the `#######.##` format of the other amounts. The DevKit does not specify which is expected.

### ZBENEFIT

Use `ZBENEFIT` instead of `ALLCASERATE` when `pPhilhealthClaimType="Z-BENEFIT"`. It is an empty element.

**`ZBENEFIT` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pZBenefitCode` | Yes | Enum · String(7) | One of `Z0011`, `Z0012`, `Z0013`, `Z0021`, `Z0022`, `Z003`, `Z0041`, `Z0042`, `Z0051`, `Z0052`, `Z0061`, `Z0062`, `Z0071`, `Z0072`, `Z0081`, `Z0082`, `Z0091`, `Z0092`. See [code tables](/reference/code-tables#z-benefit-codes) | Z-Benefit codes | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pPreAuthDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Z-Benefit pre-authorization date | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

The Guide's commented-out example `<!--ZBENEFIT pZBenefitCode="Z0011"> </ZBENEFIT-->` has no `pPreAuthDate`. If you uncomment it, add that attribute, or validation fails. The full list of Z-benefit codes, with the packages and tranches they stand for, is on [Code tables](/reference/code-tables#z-benefit-codes).

### CF3 (Claim Form 3)

`CF3` is optional. It holds the clinical record in one of two layouts, `CF3_OLD` and `CF3_NEW`, both added in DTD 1.7.2. The DevKit doesn't say when `CF3` is required or which layout to use ([KI-62](/known-issues#ki-62)). The Guide sample fills `CF3_OLD` (with a maternity record) and leaves `CF3_NEW` commented out. Recommendation (not from PhilHealth): ask PhilHealth which benefits need `CF3` and which layout to use. This site's example, a medical claim for dengue fever, leaves `CF3` out.

- `CF3` content: `(CF3_OLD?, CF3_NEW?)`
- `CF3_OLD` content: `(PHEX, MATERNITY?)`
- `MATERNITY` content: `(PRENATAL, DELIVERY, POSTPARTUM)`
- `PRENATAL` content: `(CLINICALHIST, OBSTETRIC, MEDISURG, CONSULTATION+)`
- `CF3_NEW` content: `(ADMITREASON?, COURSE?)`
- `ADMITREASON` content: `(CLINICAL+, LABDIAG+, PHEX)`
- `COURSE` content: `(WARD+)`

`PHEX` (physical examination) appears in both layouts.

::: details CF3 attribute tables (CF3_OLD, PHEX, maternity, CF3_NEW)

#### CF3_OLD

**`CF3_OLD` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pChiefComplaint` | Yes | CDATA · String(200) | Text/Memo | Chief complaint or reason for admission | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pBriefHistory` | Yes | CDATA · String(2500) | Text/Memo | Brief history of present illness (OB score/OB history) | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pCourseWard` | Yes | CDATA · String(500) | Text/Memo | Course in the wards | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pPertinentFindings` | Yes | CDATA · String(500) | Text/Memo | Pertinent laboratory and diagnostic findings | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |

#### PHEX

**`PHEX` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pBP` | Yes | CDATA · String(20) | Text | Blood pressure | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pCR` | Yes | CDATA · String(20) | Text | (no description) | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pRR` | Yes | CDATA · String(20) | Text | Respiratory rate | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pTemp` | Yes | CDATA · String(20) | Text | Temperature | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pHEENT` | Yes | CDATA · String(20) | Text | Head, ears, eyes, nose and throat | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pChestLungs` | Yes | CDATA · String(20) | Text | Chest/lungs | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pCVS` | Yes | CDATA · String(20) | Text | (no description) | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pAbdomen` | Yes | CDATA · String(20) | Text | Abdomen | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pGUIE` | Yes | CDATA · String(20) | Text | (no description) | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pSkinExtremities` | Yes | CDATA · String(20) | Text | Skin extremities | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pNeuroExam` | Yes | CDATA · String(20) | Text | Neuro examination | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

#### PRENATAL

**`PRENATAL` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pPrenatalConsultation` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Initial prenatal consultation | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pMCPOrientation` | Yes | Enum · String(1) | `Y`/`N` | Orientation to MCP/availment of benefits | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pExpectedDeliveryDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Expected date of delivery | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |

#### CLINICALHIST

**`CLINICALHIST` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pVitalSigns` | Yes | Enum · String(1) | `Y`/`N` | Vital signs are normal | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pPregnancyLowRisk` | Yes | Enum · String(1) | `Y`/`N` | "Ascertain the Present. Pregnacy is low-risk" [sic] | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pLMP` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Last menstrual period | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pMenarcheAge` | Yes | CDATA · String(2) | "Must be an integer" | Age of menarche | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetricG` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetricP` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetric_T` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetric_P` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetric_A` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetric_L` | Yes | CDATA · String(10) | Text | Obstetric history | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |

#### OBSTETRIC (obstetric risk factors)

**`OBSTETRIC` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pMultiplePregnancy` | Yes | Enum · String(1) | Obstetric risk factor. `Y`/`N` | Multiple pregnancy | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pOvarianCyst` | Yes | Enum · String(1) | `Y`/`N` | Ovarian cyst | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pMyomaUteri` | Yes | Enum · String(1) | `Y`/`N` | Myoma uteri | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPlacentaPrevia` | Yes | Enum · String(1) | `Y`/`N` | Placenta previa | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pMiscarriages` | Yes | Enum · String(1) | `Y`/`N` | History of 3 miscarriages | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pStillBirth` | Yes | Enum · String(1) | `Y`/`N` | History of stillbirth | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPreEclampsia` | Yes | Enum · String(1) | `Y`/`N` | History of pre-eclampsia | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pEclampsia` | Yes | Enum · String(1) | `Y`/`N` | History of eclampsia | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPrematureContraction` | Yes | Enum · String(1) | `Y`/`N` | Premature contraction | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |

#### MEDISURG (medical and surgical risk factors)

**`MEDISURG` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pHypertension` | Yes | Enum · String(1) | Medical/surgical risk factor. `Y`/`N` | Hypertension | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pHeartDisease` | Yes | Enum · String(1) | `Y`/`N` | Heart disease | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pDiabetes` | Yes | Enum · String(1) | `Y`/`N` | Diabetes | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pThyroidDisaster` | Yes | Enum · String(1) | `Y`/`N` | Thyroid disorder (the attribute really is spelled `pThyroidDisaster`) | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObesity` | Yes | Enum · String(1) | `Y`/`N` | Obesity | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pAsthma` | Yes | Enum · String(1) | `Y`/`N` | Moderate to severe asthma | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pEpilepsy` | Yes | Enum · String(1) | `Y`/`N` | Epilepsy | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pRenalDisease` | Yes | Enum · String(1) | `Y`/`N` | Renal disease | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pBleedingDisorders` | Yes | Enum · String(1) | `Y`/`N` | Bleeding disorders | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPreviousCS` | Yes | Enum · String(1) | `Y`/`N` | History of previous caesarian section | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pUterineMyomectomy` | Yes | Enum · String(1) | `Y`/`N` | History of uterine myomectomy (Annex C spells it `pUrineMyomectomy`, [KI-32](/known-issues#ki-32)) | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |

#### CONSULTATION

**`CONSULTATION` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pVisitDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date of visit | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pAOGWeeks` | Yes | CDATA · String(3) | Text | AOG (age of gestation) in weeks | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pWeight` | Yes | CDATA · String(10) | Weight & vital signs | Weight | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pCardiacRate` | Yes | CDATA · String(10) | Weight & vital signs | Cardiac rate | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pRespiratoryRate` | Yes | CDATA · String(10) | Weight & vital signs | Respiratory rate | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pBloodPressure` | Yes | CDATA · String(10) | Weight & vital signs | Blood pressure | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pTemperature` | Yes | CDATA · String(10) | Weight & vital signs | Temperature | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |

#### DELIVERY

**`DELIVERY` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDeliveryDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date of delivery | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pDeliveryTime` | Yes | CDATA · String(10) | `HH:MM:SSAM/PM` (the Guide sample uses `12:00AM`, without seconds, [KI-49](/known-issues#ki-49)) | Time of delivery | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pObstetricIndex` | Yes | CDATA · String(50) | Text | Obstetric index | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pAOGLMP` | Yes | CDATA · String(50) | Text | AOG by LMP | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pDeliveryManner` | Yes | CDATA · String(50) | Text | Manner of delivery | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPresentation` | Yes | CDATA · String(50) | Text | Presentation | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pFetalOutcome` | Yes | CDATA · String(50) | Text | Fetal outcome | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pSex` | Yes | CDATA · String(1) | `M` Male, `F` Female (the DTD does not enumerate it) | Sex (of the baby) | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pBirthWeight` | Yes | CDATA · String(10) | "Must be an integer" | Birth weight (gram) | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pAPGARScore` | Yes | CDATA · String(10) | — | APGAR score | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPostpartum` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Scheduled postpartum follow-up consultation 1 week after delivery | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |

#### POSTPARTUM

**`POSTPARTUM` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pPerinealWoundCare` | Yes | Enum · String(1) | `Y`/`N` | Perineal wound care | [Annex C p. 83](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=83) |
| `pPerinealRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pMaternalComplications` | Yes | Enum · String(1) | `Y`/`N` | Signs of maternal postpartum complications | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pMaternalRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pBreastFeeding` | Yes | Enum · String(1) | `Y`/`N` | Breastfeeding and nutrition | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pBreastFeedingRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pFamilyPlanning` | Yes | Enum · String(1) | `Y`/`N` | Family planning | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pFamilyPlanningRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pPlanningService` | Yes | Enum · String(1) | `Y`/`N` | Provided family planning service to patient (as requested by patient) | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pPlanningServiceRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pSurgicalSterilization` | Yes | Enum · String(1) | `Y`/`N` | Referred to partner physician for voluntary surgical sterilization (as requested by patient) | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pSterilizationRemarks` | Yes | CDATA · String(100) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pFollowupSchedule` | Yes | Enum · String(1) | `Y`/`N` | Schedule the next postpartum follow-up | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pFollowupScheduleRemarks` | Yes | CDATA · (blank in Annex C) | Text/Memo | Remarks | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

#### ADMITREASON

**`ADMITREASON` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pBriefHistory` | Yes | CDATA · String(2500) | Text/Memo | Brief history of present illness (OB score/OB history) | [Annex C p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82) |
| `pReferredReason` | Yes | CDATA · String(500) | Text/Memo | Reason for referral from other HCI | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pIntensive` | Yes | Enum · String(1) | `Y`/`N` | Completed intensive phase | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pMaintenance` | Yes | Enum · String(1) | `Y`/`N` | Completed maintenance phase | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

#### CLINICAL and LABDIAG

Both have one attribute, `pCriteria`.

**`CLINICAL` and `LABDIAG` attributes (identical)**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCriteria` | Yes | CDATA · String(200) | Text/Memo | Clinical criteria and/or laboratory/diagnostic criteria | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

#### WARD

**`WARD` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCourseDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date in the course in the ward | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pFindings` | Yes | CDATA · String(200) | Text/Memo | Pertinent PE/lab findings | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pAction` | Yes | CDATA · String(200) | Text/Memo | Doctor's order/action | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

:::

### PARTICULARS (DRGMED, XLSO)

Optional list of drugs and medicines (`DRGMED`) and diagnostics, supplies and others (`XLSO`) bought by the patient. Content: `((DRGMED+|XLSO+), (DRGMED*|XLSO*))`

In plain words: a run of one type, optionally followed by a run of the other type. So `DRGMED DRGMED XLSO` and `XLSO DRGMED` are valid, but `DRGMED XLSO DRGMED` is not. Recommendation (not from PhilHealth): write all `DRGMED` elements first, then all `XLSO` elements, as the Guide sample does. Like `DISCHARGE`, this model is non-deterministic ([see below](#validating-the-xml)).

**`DRGMED` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pPurchaseDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date of purchase | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pDrugCode` | Yes | CDATA · String(20) | "Can be any format" | Hospital-assigned drug code | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pPNDFCode` | Yes | CDATA · String(20) | "Can be Blank for now" | PNDF code ("Blank until PNDF lib is available") | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pGenericName` | Yes | CDATA · String(50) | "Must not be blank" | Generic name of medicines/drugs taken | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pBrandName` | Yes | CDATA · String(50) | "Must not be blank" | Brand name of medicines/drugs taken | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pPreparation` | Yes | CDATA · String(30) | "Must not be blank" | Dose/cap/syrup/injectable/tab with ml/mg/gm content | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pQuantity` | Yes | CDATA · String(10) | "Integer format" | Unit quantity of item | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

**`XLSO` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDiagnosticDate` | Yes | CDATA · String(10) | `MM-DD-YYYY` | Date of diagnostic | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pDiagnosticType` | Yes | Enum · String(20) | `IMAGING`, `LABORATORY`, `SUPPLIES`, `OTHERS` | Type of diagnostic/test done | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pDiagnosticName` | Yes | CDATA · String(50) | "Must not be blank" | Name of the imaging procedure, laboratory procedure, supplies, or others | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pQuantity` | Yes | CDATA · String(10) | "Integer format" | Unit quantity of item | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |

### RECEIPTS, RECEIPT, ITEM

Optional official receipts, each with one or more line items.

- `RECEIPTS` content: `(RECEIPT+)`
- `RECEIPT` content: `(ITEM+)`

**`RECEIPT` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pCompanyName` | Yes | CDATA · String(100) | Text | Company's name | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pCompanyTIN` | Yes | CDATA · String(15) | `###-###-###-###` | Company's TIN | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pBIRPermitNumber` | Yes | CDATA · String(20) | — | BIR permit number | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pReceiptNumber` | Yes | CDATA · String(20) | — | Official receipt number | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pReceiptDate` | Yes | CDATA · String(12) | `MM-DD-YYYY` | Official receipt date | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pVATExemptSale` | Yes | CDATA · String(10) | `#######.##` | VAT-exempt sale | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pVAT` | Yes | CDATA · String(10) | `#######.##` | VAT (12%) | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pTotal` | Yes | CDATA · String(10) | `#######.##` | Total amount in the receipt | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

**`ITEM` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pQuantity` | Yes | CDATA · String(10) | "Integer format" | Unit quantity of item | [Annex C p. 84](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=84) |
| `pUnitPrice` | Yes | CDATA · String(10) | `#######.##` | Unit price of item | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pDescription` | Yes | CDATA · String(100) | Text | Item description | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pAmount` | Yes | CDATA · String(10) | `#######.##` | Total amount of the specific item | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

### DOCUMENTS, DOCUMENT

The supporting documents of the claim. `DOCUMENTS` is required and holds one or more `DOCUMENT` elements. Each one points to a file on **your** server; PhilHealth downloads it from there.

- `DOCUMENTS` content: `(DOCUMENT+)`

**`DOCUMENT` attributes**

| Attribute | Required by DTD | Type / length | Valid values / format / rules | Description | Source |
|---|---|---|---|---|---|
| `pDocumentType` | Yes | CDATA · String(3) | "See Document Library": [document type codes](/reference/document-types) | Document to support the claim | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pDocumentURL` | Yes | CDATA · String(250) | "The document must first be encrypted using philhealth public key before publishing online." | URL of the document, accessible via HTTPS | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

- `pDocumentType` is a 3-character code from Annex B, for example `CSF` (Claim Signature Form), `SOA`, `CF4`, `CF5` or `ESA` (eSOA). DTD 1.9.0 removed the list of codes from the DTD, so the DTD accepts any text; PhilHealth's server checks the code. All codes are on [Document type codes](/reference/document-types).
- `pDocumentURL` must be reachable over HTTPS, and the file must be "encrypted using philhealth public key before publishing online" ([Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). See [Encrypting attachments](/guides/encryption/attachments). The same row says "Please see the Annex for the guidelines for encryption", but the Guide's only encryption annex (Annex A) covers the cipher-key scheme; the public-key scheme is in the separate attachment guideline. The DevKit also doesn't cover hosting rules or the `docMimeType` of XML attachments ([KI-57](/known-issues#ki-57)), or the RSA padding mode; both demo kits use PKCS#1 v1.5 ([KI-59](/known-issues#ki-59)).
- The XML attachments work the same way: after validating the eSOA with [validateeSOA](/api/validate-esoa) and the CF5 with [validateCF5](/api/validate-cf5), you encrypt each with the public key and attach it with type `ESA` or `CF5` ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)).

## Minimal valid example

This is an **unofficial** example written for this site: one All Case Rates claim for an inpatient with dengue fever. It attaches a scanned Claim Signature Form (`CSF`) and the three XML attachment types (`ESA`, `CF4`, `CF5`). Which documents a real claim needs depends on the benefit, and the DevKit doesn't list them ([KI-62](/known-issues#ki-62)); see [Document type codes](/reference/document-types#all-codes). Download it: [eclaims-minimal.xml](/examples/eclaims-minimal.xml).

**How we validated it.** The example is valid against `eClaimsDef.dtd` v1.9. We checked it with Java's built-in validating parser (JAXP, Java 21) and with lxml plus a patched copy of the DTD; both methods are on [Validating XML](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml). Plain lxml, xmllint and PHP can't give a trustworthy answer for this DTD as published ([KI-43](/known-issues#ki-43)); the [test results](#validating-the-xml) are below.

The file starts with an XML declaration (`<?xml version="1.0" encoding="UTF-8"?>`), which the Guide's sample doesn't have. Both forms are valid XML, and the DevKit doesn't require either.

This is the site's **shared example claim**: the unofficial [eSOA](/examples/esoa-sample.xml), [CF5](/examples/cf5-sample.xml) and [CF4](/examples/cf4-sample.xml) examples describe the same hospital stay, and pages that show "our example claim" use the same identifiers.

::: warning The eSOA example's amounts don't match this file
The eSOA example ([`esoa-sample.xml`](/examples/esoa-sample.xml)) describes the same stay as this file. It has one physician (`1504-2400015-3`), and it puts this file's `BENEFITS` amounts (`pTotalHCIFees` 7000.00, `pTotalProfFees` 3000.00) into the eSOA's two `PhilHealth` totals, with zero balances to match `pEnoughBenefits="Y"`. That mapping is our choice: the DevKit doesn't say how the eSOA amounts must relate to the eClaims amounts ([KI-53](/known-issues#ki-53); see [Building the eSOA](/guides/esoa#tie-the-amounts-to-the-claim)). In a real claim, build the eSOA, CF2 and `PROFESSIONALS` from the same billing data.
:::

Where the values come from:

| Value | In this file | Where it comes from |
|---|---|---|
| Facility code (PMCC number) | `pHospitalCode="123456"` | The Guide sample ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)) |
| Member and patient | PIN `072007271094`, JUAN OCAMPO DELA CRUZ, male, born `09-19-1973` | The Guide sample (p. 29). It is a placeholder; the DevKit has no test members ([KI-11](/known-issues#ki-11)). |
| Case rate | `CR0001`, ICD-10 `A90`, `10000.00` | The Guide sample's first `CASERATE` (p. 31). Get real case rates from [searchCaseRates](/api/search-case-rates). |
| Diagnosis | ICD-10 `A90` | Listed in the [CF4 ICD library](/originals/cf4/libraries/lib_icd.xlsx), for example as "Dengue (fever) without warning signs" |
| Doctor | `1504-2400015-3`, LIFE GOES ON | PhilHealth's dummy test data ([Test data](/reference/test-data)); accredited only "up to 12/31/2026" ([KI-11](/known-issues#ki-11)) |
| Employer | PEN `110474000002`, JOSE A TERAMOTO ODM | PhilHealth's dummy test data. The Guide sample writes the same digits as `11-047400000-2` ([KI-48](/known-issues#ki-48)). |
| Sender | `pUserName=":SAMPLE-CERT-ID"`, `pHospitalEmail="eclaims@samplehospital.example"`, `pServiceProvider="SAMPLE HIS"` | Placeholders chosen for this site. Put `":"` plus your own software certificate ID in `pUserName` ([KI-03](/known-issues#ki-03)). |
| Your own numbers | Transmittal `TR20260917001`, claim `202609170001` | Placeholders chosen for this site. The claim number has 12 characters, so it fits Annex C's String(12) ([KI-31](/known-issues#ki-31)). |
| Stay | Admitted `09-15-2026` `01:00:00PM`, discharged `09-17-2026` `03:00:00PM` | Placeholders chosen for this site |
| Attachment URLs | `https://files.samplehospital.example/eclaims/202609170001/CSF.enc` and so on | `samplehospital.example` is under the reserved `.example` top-level domain. Each file name is the document type code plus `.enc`. The attachment guideline says the encrypted file "may be renamed using the original file name followed by '.enc'", so a name such as `CSF.pdf.enc` is fine too. |

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  UNOFFICIAL example eClaims XML (one All Case Rates claim).
  Written for the PhilHealth PECWS 3.0 developer docs; not a PhilHealth file.
  Valid against eClaimsDef.dtd v1.9 (Java JAXP and the patched DTD, KI-43).

  Placeholder and test values (the site's shared example claim):
  - pUserName: ":" + your software certificate ID (revision 20241111).
  - pHospitalCode "123456", member PIN "072007271094" and the member's name
    and birth date come from the Implementation Guide sample (p. 29).
  - Doctor 1504-2400015-3 (LIFE GOES ON) and employer 110474000002
    (JOSE A TERAMOTO ODM) come from "Dummy Health Care Providers and Employers.pdf".
  - CR0001 / 10000 are the Guide sample's case-rate values; get real values
    from searchCaseRates.
  - Document URLs use samplehospital.example (reserved .example domain). Each
    file must be encrypted with PhilHealth's public key and served over HTTPS.
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
        pIsEmergency="N">
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
      </CF2>
      <ALLCASERATE>
        <CASERATE
            pCaseRateCode="CR0001"
            pICDCode="A90"
            pRVSCode=""
            pCaseRateAmount="10000.00"/>
      </ALLCASERATE>
      <DOCUMENTS>
        <DOCUMENT
            pDocumentType="CSF"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CSF.enc"/>
        <DOCUMENT
            pDocumentType="ESA"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/ESA.enc"/>
        <DOCUMENT
            pDocumentType="CF4"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF4.enc"/>
        <DOCUMENT
            pDocumentType="CF5"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CF5.enc"/>
      </DOCUMENTS>
    </CLAIM>
  </eTRANSMITTAL>
</eCLAIMS>
```

## Validating the XML

::: tip Recommendation (not from PhilHealth): how to check this file locally
1. **Use Java if you can.** Java's built-in validating parser was the only validator we tested that checks `eClaimsDef.dtd` correctly as published. The validator, the command and our test output are on [Validating XML: Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml).
2. **If your stack uses libxml2** (Python lxml, xmllint, PHP), validate against a patched copy of the DTD. The script that makes it is on [Validating XML: The eClaims DTD and libxml2](/guides/validating-xml#the-eclaims-dtd-and-libxml2). It rewrites the three problem models [described below](#the-dtd-trips-libxml2-based-validators): `DISCHARGE` and `PARTICULARS` keep exactly the same meaning, and `PROCEDURES` becomes stricter (each procedure type at most once, in DTD order). So a file that passes the patched copy also passes the original DTD. The stricter rule may reject a few unusual procedure orders that the original accepts; check those with Java.
3. **Then send the final file to [eClaimsFileCheck](/api/eclaims-file-check).** A local check is only a pre-check. PhilHealth's endpoint has the final say ([KI-43](/known-issues#ki-43)).

Keep the original `eClaimsDef.dtd` untouched, and never send the patched copy anywhere.
:::

### PhilHealth's method: NetBeans

PhilHealth's one-page guide ([Validating e-Claims XML File in Netbeans.pdf](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf)) says:

1. Copy the eClaims XML file and `eClaimsDef.dtd` into the same folder.
2. Open the XML file in NetBeans.
3. Insert these lines at the top:

   ```xml
   <?xml version="1.0"?>
   <!DOCTYPE eCLAIMS PUBLIC "-//PHIC-ITMD//DTD eClaims File 1.0//EN" "eClaimsDef.dtd" >
   ```

4. Right-click the editor and choose **Validate XML**. The results appear below the editor.

The NetBeans guide doesn't say what to do with these lines afterwards, and the DevKit doesn't say whether the server accepts a `DOCTYPE` ([KI-62](/known-issues#ki-62)). Recommendation (not from PhilHealth): remove the `DOCTYPE` line again before you send the file, because the Guide's sample XML has none. If your file already starts with an XML declaration, replace it instead of adding a second one. More options are on [Validating XML](/guides/validating-xml).

### The DTD trips libxml2-based validators

::: warning KI-43: three content models in eClaimsDef.dtd confuse libxml2
The content models of `DISCHARGE`, `PROCEDURES` and `PARTICULARS` are **non-deterministic**: when a validator reads, say, an `ICDCODE` inside `DISCHARGE`, it can't tell from that element alone which branch of the model it is in. The XML 1.0 specification calls this an error "for compatibility" ([Appendix E, Deterministic Content Models](https://www.w3.org/TR/xml/#determinism)).

Validators built on **libxml2** (Python's lxml, `xmllint`, PHP's `DOMDocument::validate()`; we tested lxml and PHP) print `Content model of DISCHARGE is not deterministic` and then **don't check the order and number of the children** of `DISCHARGE`, `PROCEDURES` and `PARTICULARS`. They still check the attributes of those children. What happens next depends on the libxml2 version:

- **Newer libxml2** (we saw this with 2.13.9 and 2.14.6) treats the message as an error. Every eClaims XML contains a `DISCHARGE`, so *every* eClaims file fails, even a correct one.
- **Older libxml2** (we saw this with 2.9.10 and 2.9.14) treats it as a warning. Validation passes, but a wrong child order inside the three elements passes too.

Java's built-in validating parser (JAXP, whose implementation in the JDK is based on Apache Xerces) accepts the DTD and checks those elements normally. We did not test NetBeans itself, but it is a Java IDE.

PhilHealth's documents don't mention this; it is [KI-43](/known-issues#ki-43) in our register. It does not mean your file is wrong. It means you must read the libxml2 messages: don't treat a libxml2 failure as a real error, and don't treat a libxml2 pass as proof that the children of these three elements are in the right order.
:::

We ran these checks on 2026-09-23, on the current version of the example:

| File | lxml, external DTD | lxml, `DOCTYPE` + validating parser | PHP 8.3 `DOMDocument::validate()` | Java 21 JAXP (`setValidating(true)`) | lxml with the patched DTD |
|---|---|---|---|---|---|
| [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) | `False`: only "Content model of DISCHARGE is not deterministic" | Same error | Same error | **Valid**, no errors or warnings | **Valid** |
| Guide sample (p. 29–35), as printed | Not well-formed: `AttValue: " or ' expected` (unquoted `pHospitalEmail`, [KI-28](/known-issues#ki-28)) | Not well-formed | Not well-formed | Not well-formed | Not well-formed |
| Guide sample with `pHospitalEmail="email@yahoo.com"` quoted | `False`: only the 3 "not deterministic" errors (`DISCHARGE`, `PROCEDURES`, `PARTICULARS`) | Fails on the first of them (`DISCHARGE`) | Same 3 errors | **Valid**, no errors or warnings | **Valid** |

Versions: lxml 6.1.3 with libxml2 2.14.6; PHP 8.3.33 with libxml 2.13.9 (Docker image `php:8.3-cli-alpine`); OpenJDK 21.0.12 (Docker image `eclipse-temurin:21-jdk`). With an older libxml2 (PHP 8.3.33 with libxml 2.9.14 in `php:8.3-cli`, and PHP 7.4.33 with libxml 2.9.10 in `php:7.4-cli`), `DOMDocument::validate()` returned `true` for both files and printed the "not deterministic" messages as warnings. For Java, we added the NetBeans `DOCTYPE` line to a copy of each file, because Java validates against the DTD that the file names.

We also broke copies of the example on purpose:

- `pMemberSex="X"`, and `pLaterality="Q"` on an `RVSCODES` inside `DISCHARGE`: every tool reported the value as not in the enumerated set. So libxml2 still checks attributes everywhere, including on the children of the three problem elements.
- An `RVSCODES` moved before the `ICDCODE`, or an empty `DISCHARGE`: only Java and the patched DTD reported them. Plain libxml2 missed both. With libxml2 2.9.14, PHP even returned `true` for these broken files.

**So the Guide's own sample is valid once the email quotes are fixed**, and so is our example.

::: details What Java and the patched DTD reported for the broken copies
Java 21, original `eClaimsDef.dtd`:

- `RVSCODES` before `ICDCODE`: `The content of element type "DISCHARGE" must match "((ICDCODE+,RVSCODES*)|(ICDCODE*,RVSCODES+))".`
- Empty `DISCHARGE`: `The content of element type "DISCHARGE" is incomplete, it must match "((ICDCODE+,RVSCODES*)|(ICDCODE*,RVSCODES+))".`
- `pMemberSex="X"`: `Attribute "pMemberSex" with value "X" must have a value from the list "M F ".`

lxml with the patched DTD reported `Element DISCHARGE content does not follow the DTD` for the first two, and `Value "X" for attribute pMemberSex of CF1 is not among the enumerated set` for the third.
:::

To see the libxml2 problem yourself, download [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) and [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) into one folder, install lxml (`pip install lxml`), and run this in that folder:

```bash
python -c "from lxml import etree; d=etree.DTD('eClaimsDef.dtd'); t=etree.parse('eclaims-minimal.xml'); print(d.validate(t), d.error_log.filter_from_errors())"
```

Our output with lxml 6.1.3. The only error comes from the DTD itself, not from the file:

```text
False <string>:-1:0:ERROR:VALID:DTD_CONTENT_NOT_DETERMINIST: Content model of DISCHARGE is not deterministic: ((ICDCODE+ , RVSCODES*) | (ICDCODE* , RVSCODES+))
```

## eRECEIPT response

After a successful call, you decrypt `result.doc` from `uploadeClaims` and get an `eRECEIPT` XML document. The Guide describes it as "the XML text containing the Receipt Ticket Number and other data about the processing of the submitted e-claim data" ([Guide p. 20](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=20)).

::: warning The DevKit has no eRECEIPT DTD
The Guide says "Sample XML text and the DTD of the XML text is shown below", but what follows is the eClaims *request* DTD. The same paragraph describes `doc` as "the JSON object that contains the records of the matching benefit packages", which is the wording of `searchCaseRates` ([Guide p. 38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=38), [KI-47](/known-issues#ki-47)). The structure below comes only from the two samples and Annex C. Recommendation (not from PhilHealth): parse it defensively and keep the raw XML.
:::

### Successfully received

The sample as printed ([Guide p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)) is missing the `>` that closes the start tag ([KI-28](/known-issues#ki-28)). Fixed:

```xml
<eRECEIPT
    pUserName=""
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalTransmittalNo="001"
    pTotalClaims="1"
    pTransmissionControlNumber="1234-5601-1234-1253"
    pTransmissionDate="08-26-2009"
    pTransmissionTime="00:00:00AM"
    pReceiptTicketNumber="1234-5601-1234">
</eRECEIPT>
```

### Unsuccessfully received

Printed as-is (it is well-formed) ([Guide p. 36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=36)):

```xml
<eRECEIPT
    pUserName=""
    pUserPassword=""
    pHospitalCode="123456"
    pHospitalTransmittalNo="001"
    pTotalClaims="1"
    pTransmissionControlNumber=""
    pTransmissionDate="08-26-2009"
    pTransmissionTime="00:00:00AM" >
    <REMARKS pErrCode="T01" pErrDescription="Invalid parameter value: pAmtActual" />
    <REMARKS pErrCode="T02" pErrDescription="Invalid parameter value: pOperationDate" />
</eRECEIPT>
```

### eRECEIPT attributes

| Attribute | On | Length | Meaning | Source |
|---|---|---|---|---|
| `pUserName`, `pUserPassword` | `eRECEIPT` | — | Empty in both samples. | [Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35) |
| `pHospitalCode` | `eRECEIPT` | String(12) | Your facility code (the sample shows the same `123456` as the upload sample). | [Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35) |
| `pHospitalTransmittalNo` | `eRECEIPT` | String(20) | "Hospital Generated Transmittal Number". Presumably your `eTRANSMITTAL@pHospitalTransmittalNo`, but the samples don't match (upload `20160901`, receipt `001`). | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pTotalClaims` | `eRECEIPT` | String(3) | Claims counter (the sample shows `1`, the same as the upload sample). | [Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35) |
| `pTransmissionControlNumber` | `eRECEIPT` | String(18) | "Philhealth Generated Transmittal file control number" (TCN). "Will be blank if the transmission is failed". | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pTransmissionDate` | `eRECEIPT` | String(10) | `MM-DD-YYYY`. The official date received, used for TAT. | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85), [Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19) |
| `pTransmissionTime` | `eRECEIPT` | String(10) | `HH:MM:SSAM/PM`. | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pReceiptTicketNumber` | `eRECEIPT` | String(18) | "Philhealth Generated Upload Comfirmation [sic] Receipt ticket number" (RTN). Only in the success sample. | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pErrCode` | `REMARKS` | String(3) | "Claim file error Code", for example `T01`. | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pErrDescription` | `REMARKS` | String(100) | "Claim file error Description". | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pReceivedDate` | (not in the samples) | String(10) | "Date when the transmitted file received by PhilHealth", `MM-DD-YYYY`. Annex C lists it, but neither sample shows where it appears ([KI-50](/known-issues#ki-50)). | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

Notes:

- **Store the receipt ticket number.** You need it as `receiptTicketNumber` for [getUploadedClaimsMap](/api/get-uploaded-claims-map), which maps your claim numbers to PhilHealth's claim series numbers.
- The list of error codes (`T01`, `T02`, …) is not in the DevKit ([KI-42](/known-issues#ki-42)). The sample's descriptions name `pAmtActual` and `pOperationDate`, which are **not attributes of `eClaimsDef.dtd` v1.9**, so treat the sample messages as illustrations only ([KI-28](/known-issues#ki-28)).
- The DevKit doesn't say whether the envelope's `success` is `true` or `false` when the receipt has `REMARKS` ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): treat the upload as accepted only when `pTransmissionControlNumber` and `pReceiptTicketNumber` are non-empty and there is no `REMARKS` element. Log the whole receipt either way.

::: warning TCN and RTN formats (KI-31)
The success sample's transmission control number `1234-5601-1234-1253` is 19 characters, one more than the documented String(18). The receipt ticket number is `1234-5601-1234` here but `071311000005` in the [getUploadedClaimsMap](/api/get-uploaded-claims-map) sample. See [KI-31](/known-issues#ki-31). Recommendation (not from PhilHealth): store the TCN and RTN as text, exactly as returned, in wider columns.
:::

## Version history of the DTD

The `eClaimsDef.dtd` in the DevKit is version 1.9.0 (2017-06-23), and the DevKit contains no newer upload DTD. The 2025 Guide prints the same DTD on p. 21–28; the only difference is that the printed history ends with ": initial version" after the 1.0 entry. Highlights from the DTD's own history:

| Version | Date | What changed |
|---|---|---|
| 1.0 | 2010-11-12 | First version. |
| 1.1–1.2 | 2011–2012 | Case-rate requirements, package and case-rate codes. |
| 1.3 | 2012-06-01 | Document URLs (`DOCUMENTS`) and Z Benefit elements. |
| 1.5 | 2012-10-18 | Official receipt details. |
| 1.6, 1.6.1 | 2013-01 | New document-type coding; `CSF` added. |
| 1.7 | 2013-09-24 | "Major revision to cater all case rate policy". |
| 1.7.2 | 2013-12-16 | `PARTICULARS` moved out of CF3; `CF3_OLD` and `CF3_NEW` added. |
| 1.7.3 | 2014-01-28 | `pPreAuthDate`, `pCaseRateAmount`, `pDoctorSignDate`, `pPatientType`, `pIsEmergency` added; `pCataractPreAuth` moved to `CATARACT`. |
| 1.7.4–1.7.5 | 2014–2015 | Document types `MRF`, `ANR`, `HDR`; membership type `P` (Lifetime Member). |
| 1.8.0 | 2016-09-19 | `IMRT`, `APR`, `pHasAttachedSOA`, `CATARACTINFO` added; `CATARACT` to be deprecated. |
| **1.9.0** | **2017-06-23** | Removed the enumerated list of `pDocumentType` values "for flexibility of adding new elements"; added `pServiceProvider`. |

Changes since then happened *around* the XML, not in the DTD: the `uploadeClaims` method was added to the PECWS 3.0 Guide in revision 20240306, and the software certificate ID moved into `pUserName` in revision 20241111 ([KI-03](/known-issues#ki-03)). The 2024 data-migration DTD is a separate, derived format ([Data migration XML](/reference/migration-xml)); its extra newborn attributes may hint at a newer eClaims DTD outside this DevKit ([KI-10](/known-issues#ki-10)). The full list of changes is on [Revision history](/changelog).

::: details Raw DTD (eClaimsDef.dtd)
```xml
<!--
	Philippine Health Insurance Corporation
	eClaims Document Type Definition Version 1.9
	Version History
        1.9.0 06-23-2017 08:16PM (MSM)
            : removed the ennumerated list values for the pDocumentType attribute for flexibility of adding new elements
			: added pServiceProvider attribute to the eCLAIMS element to indicate the provider of the system used to encode and submit the e-claims XML file 
        1.8.0 09-19-2016 05:13PM (MSM)
            : added "IMRT" element as additional to the list of supported repetitive procedures
            : added "APR" element to CF2 for saving the data of the Consent to Access Patient Record section of RF2
            : added "pHasAttachedSOA" attribute to CF2 element
            : added new "CATARACTINFO" element to hold info about data like IOL sticker number for cataract operation. The "CATARACT" element will be deprecated later
            : changed the comments for the pThumbMarkedBy attribute
        1.7.6 07-31-2015 10:38PM 
            : remove "()" in this part (BENEFITS)
	1.7.5 revised : 06-23-2015 1:19PM
            : added "P" (Lifetime Member) in the pMemberShipType attribute acceptable values 
            : added "ANR" (Anesthesia Record) & "HDR" (Hemodialysis Record) in the pDocumentType attribute acceptable values
	1.7.4 revised : 11-03-2014 9:52am
            : added "MRF" (PhilHealth Member Registration Form) in the pDocumentType 
	1.7.3 revised : 01-28-2014 9:58am
            : added pPreAuthDate in ZBENEFIT element
            : added pCaseRateAmount in CASERATE element
            : added pDoctorSignDate in PROFESSIONALS element
            : added pPatientType & pIsEmergency in CLAIM element
            : transfer pCataractPreAuth to CATARACT element
	1.7.2 revised : 12-16-2013 5:03pm
            : abstracted the Particulars from CF3 outside
            : added the CF3_OLD and CF3_NEW elements
	1.7.1 revised : 11-04-2013 3:31pm
            : updated the elements based on the claim forms version 11_04_2013
        1.7 revised : 09-24-2013 08:56am
            : major revision to cater all case rate policy
        1.6.1 revised : 01-29-2013 01:29pm
            : added CSF in list of document types
        1.6 revised : 01-25-2013 01:11pm
            : updated the new coding of documents
        1.5 revised : 10-18-2012 10:01am
            : abstracted the Observation Codes from ZBenefit outside
            : added Official Receipt details
	1.4 revised : 07-16-2012 01:40pm
            : added support for observation for z-benefits
	1.3 revised : 06-01-2012 09:04am
            : added elements for document urls
            : added elements for Z Benefit
	1.2 revised : 02-24-2012 06:16pm
            : added code for packages
            : added codes for case-rates
	1.1 revised : 08-19-2011 11:02am
            : added requirements for case rate
	1.0 revised : 11-12-2010 04:42pm
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

<!ELEMENT CLAIM (CF1, CF2, (ALLCASERATE | ZBENEFIT), CF3?, PARTICULARS?, RECEIPTS?, DOCUMENTS)>
<!ATTLIST CLAIM
	pClaimNumber CDATA #REQUIRED
	pTrackingNumber CDATA #REQUIRED
	pPhilhealthClaimType (ALL-CASE-RATE|Z-BENEFIT) #REQUIRED
	pPatientType (I|O) #REQUIRED
	pIsEmergency (Y|N) #REQUIRED>

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
	pFilterCardNo CDATA #REQUIRED>

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
<!--    pRelCode:                  One of
                                    S: Spouse
                                    C: Child
                                    P: Parent
                                    I: Siblings
                                    O: Others
                                -->
<!ATTLIST DEFINEDPATREPREL
	pRelCode (S|C|P|I) #REQUIRED> 
<!ELEMENT OTHERPATREPREL EMPTY>
<!ATTLIST OTHERPATREPREL
        pRelCode CDATA #FIXED "O"
	pRelDesc CDATA #REQUIRED> 

<!ELEMENT DEFINEDREASONFORSIGNING EMPTY>
<!--    pReasonCode:    One of
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
<!--    pThumbmarkedBy:    One of
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

<!ELEMENT DOCUMENTS (DOCUMENT+)>
<!ELEMENT DOCUMENT EMPTY>
<!ATTLIST DOCUMENT
	pDocumentType CDATA #REQUIRED
	pDocumentURL CDATA #REQUIRED>
```
:::

## Common mistakes

- **Leaving out attributes that don't apply.** Write them with `""` instead. Only 2 attributes are optional.
- **Leaving an enumerated attribute empty.** `pLaterality=""`, `pWithCoPay=""` or `pTBType=""` fail validation. Pick a valid value.
- **Wrong date or time format.** Use `09-15-2026`, not `2026-09-15`, and `01:00:00PM`, not `13:00` or `1:00 PM`.
- **Wrong element order.** For example, `APR` after `CONSUMPTION`, and `DOCUMENTS` last in `CLAIM`.
- **Forgetting `<SPECIAL/>`.** It is required even when empty.
- **Both `ALLCASERATE` and `ZBENEFIT`**, or one that doesn't match `pPhilhealthClaimType`.
- **Sending the certificate ID the old way** (a header or a `pCertificateId` attribute) instead of in `pUserName` ([KI-03](/known-issues#ki-03)).
- **"Fixing" odd names** such as `BRACHYTHERAPHY` or `pThyroidDisaster`. Use the DTD spelling.
- **Adding migration-only attributes** such as `pClaimSeriesLhio` or the newborn hearing attributes to an upload file ([KI-10](/known-issues#ki-10)).
- **Encrypting with the wrong key**: the XML uses your cipher key; the attachments use PhilHealth's public key ([KI-12](/known-issues#ki-12)).
- **Plain `http://` or private URLs in `pDocumentURL`.** PhilHealth must be able to download the file over HTTPS.
- **Trusting a libxml2 result** (lxml, xmllint, PHP) without reading the messages. Depending on the version, libxml2 fails every eClaims file or passes a wrong child order inside `DISCHARGE`, `PROCEDURES` or `PARTICULARS`. See [Validating the XML](#validating-the-xml).
- **Using `&Ntilde;` without the DTD.** Write `Ñ` in UTF-8, or `&#209;`, instead ([KI-62](/known-issues#ki-62)).
- **Reusing a claim or transmittal number**, or re-sending an upload blindly after a timeout. The DevKit doesn't say how PECWS handles duplicates ([KI-62](/known-issues#ki-62)).

## Related pages

- [uploadeClaims](/api/upload-eclaims), [eClaimsFileCheck](/api/eclaims-file-check), [validateCF5](/api/validate-cf5)
- [Submitting a claim](/guides/submitting-a-claim)
- [Code tables](/reference/code-tables): every enumerated value
- [Document type codes](/reference/document-types)
- [Encrypting API payloads](/guides/encryption/api-payloads) and [Encrypting attachments](/guides/encryption/attachments)
- [Validating XML locally](/guides/validating-xml)
- [Data migration XML](/reference/migration-xml)
- [Known issues](/known-issues)
