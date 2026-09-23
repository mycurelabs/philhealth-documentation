---
title: Glossary
description: Alphabetical list of the acronyms and terms used across the PhilHealth PECWS 3.0 DevKit, with plain-English explanations and links to where they appear.
outline: [2, 2]
---

# Glossary

The DevKit uses many acronyms from Philippine health insurance, hospital billing and cryptography, often without defining them. This page lists them alphabetically. Each entry gives the expansion, a one-line explanation, and where the term appears.

Most expansions come straight from the DevKit files, cited in the entry. Entries marked **(general)** are standard industry or government terms that the DevKit uses without defining. Their definitions are ours, so confirm anything PhilHealth-specific with PhilHealth.

::: info Sources
- [Implementation Guide (rev. 20250217)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6), especially p. 3–5 (revision history, contents), p. 6–8 (introduction, getToken), p. 75–188 (Annexes A–F)
- [PhilHealth Circular 2023-0026](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1), p. 1–7 (scope, definitions, policy), p. 9–12 (Annexes A and B)
- [SSVTF for PECWS 3.0 (rev. 20250217)](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)
- [Data Dictionary of the e-Claims XML for Data Migration](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=3), [CF5 claim form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf), [Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf), [CF4 files update](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf), [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd), [`CF4.dtd`](/originals/cf4/CF4.dtd), [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx), [SSVTF Annex A](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf), [SSVTF Annex B](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf), [CF4 data dictionary rev. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1), [Validating e-Claims XML File in NetBeans](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf), [`CF5.dtd`](/originals/cf5/CF5.dtd), [`ForEncryption.zip`](/originals/encryption/ForEncryption.zip) (demo kits), [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf)
:::

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [X](#x) · [Z](#z)

## A

### ABP {#abp}
**Animal Bite Package.** PhilHealth benefit package for animal bite treatment. The XML element `ABP` holds "Animal Bite Package Details": anti-rabies vaccine dates and rabies immunoglobulin. PC 2023-0026 calls it the "Animal Bite Treatment Package" (sometimes shortened to ABTP elsewhere; the DevKit doesn't use that acronym).

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`SPECIAL/ABP`), [eSOA guide](/guides/esoa) (scope)

### ACR {#acr}
**All Case Rates.** PhilHealth's current "provider payment mechanism", which pays a set case rate amount (`pCaseRateAmount`) for a condition or procedure. eClaims has been used for ACR since 2016 ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). In the XML, `pPhilhealthClaimType="ALL-CASE-RATE"` with an `ALLCASERATE` element.

*Appears in:* [The claims lifecycle](/getting-started/claims-lifecycle), [searchCaseRates](/api/search-case-rates), [eClaims XML](/reference/eclaims-xml)

### AES, AES-256-CBC {#aes}
**Advanced Encryption Standard (general),** with a 256-bit key in CBC mode. The symmetric cipher used by both DevKit encryption schemes, for API payloads and for attachments.

*Appears in:* [Encryption overview](/guides/encryption/), [API payloads](/guides/encryption/api-payloads), [Attachments](/guides/encryption/attachments)

### Annex {#annex}
An appendix to a document. Several DevKit documents have lettered annexes, so the same letter can mean different things. **On this site, "Annex A" to "Annex F" without a qualifier always means an annex of the Implementation Guide.** Other annexes are always named with their document, as in the table below ([How to read these docs](/getting-started/how-to-read#placeholders-and-conventions)).

| Name on this site | What it is | Where |
|---|---|---|
| Annex A | Payload encryption with the facility's cipher key ("Guidelines for the Data Encryption Using the Cipher Key of the Health Facility") | [Guide p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75) |
| Annex B | Document type codes ("Document Type Code and Description") | [Guide p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77) |
| Annex C | eClaims data dictionary ("Data Dictionary eClaimsUpload") | [Guide p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79) |
| Annex D | eSOA data dictionary ("Data Dictionary ValidateEsoa") | [Guide p. 86–87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86) |
| Annex E | CF5 data dictionary ("Data Dictionary validateCF5") | [Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88) |
| Annex F | eSOA libraries: the item, category, sub-category and medicine libraries. Two of them also ship as spreadsheets, [`Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) and [`Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx). | [Guide p. 89–188](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89) |
| SSVTF Annex A | "Data Requirements for CF4": the CF4 data your system must capture for certification | [Separate 1-page PDF](/originals/certification/SSVTF%20-%20Annex%20A%20-%20CF4%20Data%20Requirements.pdf) |
| SSVTF Annex B | "eSOA Minimum Data Elements": a sample Statement of Account, the same page as PC 2023-0026 Annex B | [Separate 1-page PDF](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf) |
| PC 2023-0026 Annex A | "Data Definitions and XML Format Summary of Fees, Professional Fees, and Itemized Charges", in business terms. The XML itself is defined by `ESOA.dtd` ([KI-04](/known-issues#ki-04)). | [PC 2023-0026 p. 9–11](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=9) |
| PC 2023-0026 Annex B | "Minimum Data Elements for the SOA": the sample SOA page | [PC 2023-0026 p. 12](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=12) |
| "Annex G" | The label printed on every page of the CF4 data dictionary, revision 4 (2021-02-23). It is not an annex of the Guide, and the DevKit doesn't say which document it belongs to. | [CF4 data dictionary](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1) |

The Guide has two slips here ([KI-09](/known-issues#ki-09)). Its table of contents labels the eSOA Item Library "Annex E" a second time. Revision 20241111 says "Moved the Annexes B to F to a different file", but the 20250217 Guide still contains Annexes A–F.

*Appears in:* nearly every page; see [How to read these docs](/getting-started/how-to-read#placeholders-and-conventions) and [Original source files](/sources/)

### AOG {#aog}
**Age of gestation (general).** Weeks of pregnancy. Not expanded in the DevKit. Appears as `pAOGWeeks` ("AOG in weeks") and `pAOGLMP` ("AOG by LMP") in CF3 maternity data.

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`CF3_OLD/MATERNITY`)

### API {#api}
**Application Programming Interface.** PECWS is "the primary interface for interactions with PhilHealth's electronic claims processing system" ([Guide p. 7](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)).

*Appears in:* [API overview](/api/)

### APR {#apr}
**Consent to Access Patient Records.** XML element in `CF2`, added in `eClaimsDef.dtd` 1.8.0 (2016), that records how consent was given: by the patient's signature (`APRBYPATSIG`), a representative's signature (`APRBYPATREPSIG`), or a thumbmark (`APRBYTHUMBMARK`).

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### ARV {#arv}
**Anti Rabies Vaccine.** In `ABP`, `pDay0ARV`, `pDay3ARV` and `pDay7ARV` are the vaccination dates ([Annex C](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). Here ARV does **not** mean antiretroviral.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

## B

### Base64 {#base64}
**(general)** A way to write binary data as ASCII text (A–Z, a–z, 0–9, `+`, `/`, `=` padding). Used for `iv`, `doc`, `key1` and `key2` in encrypted envelopes, for embedded documents in migration files, and for the PDF returned by `generatePBEFPDF`.

*Appears in:* [API payloads](/guides/encryption/api-payloads), [Data migration XML](/reference/migration-xml), [generatePBEFPDF](/api/generate-pbef-pdf)

### BIR {#bir}
**Bureau of Internal Revenue.** The Philippine tax authority. PC 2023-0026 (V.S) requires hospitals to follow BIR rules on VAT. The eClaims `RECEIPT` element has `pBIRPermitNumber`.

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`RECEIPTS`), [eSOA guide](/guides/esoa)

## C

### Case rate {#case-rate}
A fixed PhilHealth benefit amount for a condition (ICD-10 code) or procedure (RVS code) under All Case Rates. Case rates are identified by `pCaseRateCode` ("Case Rate Codes for All Case Rates") and looked up with `searchCaseRates`.

*Appears in:* [searchCaseRates](/api/search-case-rates), [eClaims XML](/reference/eclaims-xml) (`ALLCASERATE/CASERATE`)

### CBC {#cbc}
Two unrelated meanings in the DevKit:
1. **Cipher Block Chaining (general):** the AES mode in "AES-256-CBC". Each block is combined with the previous one, so it needs a random IV.
2. **Complete Blood Count Result:** document type code `CBC` in Annex B ([Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)). It also appears as a laboratory item in eSOA samples.

*Appears in:* [Encryption overview](/guides/encryption/), [Document type codes](/reference/document-types)

### CCIBP, CHIBP {#ccibp}
**COVID-19 Community Isolation Benefit Package** and **COVID-19 Home Isolation Benefit Package.** Claims for these are excluded from the eSOA requirement (PC 2023-0026, III).

*Appears in:* [eSOA guide](/guides/esoa)

### CF1–CF5 {#cf}
**Claim Form 1 to 5** (Annex B). The PhilHealth claim forms, and the XML parts that carry their data:
- **CF1**: member and patient information (XML element `CF1`).
- **CF2**: confinement, diagnosis, professionals and consumption of benefits (element `CF2`).
- **CF3**: clinical record (element `CF3`, with old and new formats `CF3_OLD` and `CF3_NEW`).
- **CF4**: clinical record submitted as a separate XML attachment (document type `CF4`), using the EPCB DTD.
- **CF5**: "Electronic Claim Form 5 (for DRG Shadow Billing)", the DRG supplementary form, sent as an XML attachment (document type `CF5`).

*Appears in:* [eClaims XML](/reference/eclaims-xml), [CF4 guide](/guides/cf4), [CF5 guide](/guides/cf5), [Document type codes](/reference/document-types)

### Cipher key {#cipher-key}
A secret key that "PhilHealth issues ... to the health facility for each certified software" ([Annex A, Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). Its SHA-256 digest is the AES key for API payloads and migration files. Both the facility and PhilHealth can decrypt data protected with it. The DevKit doesn't give the key's format or length, or the text encoding to use; treat it as an opaque string and use [UTF-8](#utf-8) ([KI-60](/known-issues#ki-60)).

*Appears in:* [API payloads](/guides/encryption/api-payloads), [Data migration](/guides/data-migration)

### Claim series number {#claim-series-number}
PhilHealth's own number for a claim, the "common reference between the health facility and PhilHealth" ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)). The 15-digit `pClaimSeriesLhio` = 13-digit claim series number + 2-digit PRO code. The same number goes by `pSeriesLhioNo` in `addRequiredDocument` and `serieslhionos` in `getClaimStatus`. The DevKit doesn't say whether `getClaimStatus` expects the 13-digit or the 15-digit form ([KI-64](/known-issues#ki-64)).

*Appears in:* [getUploadedClaimsMap](/api/get-uploaded-claims-map), [getClaimStatus](/api/get-claim-status), [Data migration XML](/reference/migration-xml)

### CSF {#csf}
**Claim Signature Form.** The form on which the member or patient and the facility sign the claim. PC 2023-0026 (V.O, V.R) uses it to attest the eSOA. It is document type `CSF`, typically a scanned PDF attachment.

*Appears in:* [Document type codes](/reference/document-types), [Attachment encryption](/guides/encryption/attachments)

## D

### Dagger–asterisk codes {#dagger-asterisk}
Paired ICD-10 codes (an underlying cause and a manifestation). The CF5 form says: input the **dagger** code as the primary diagnosis and the **asterisk** code as a secondary diagnosis.

*Appears in:* [CF5 guide](/guides/cf5)

### DOCTYPE {#doctype}
**Document type declaration (general).** The line at the top of an XML file that names its root element and the [DTD](#dtd) to validate against. PhilHealth's NetBeans guide tells you to add `<!DOCTYPE eCLAIMS PUBLIC "-//PHIC-ITMD//DTD eClaims File 1.0//EN" "eClaimsDef.dtd" >` before validating ([NetBeans guide](/originals/eclaims-xml/Validating%20e-Claims%20XML%20File%20in%20Netbeans.pdf)), and the standalone `CF5.dtd` shows `<!DOCTYPE CF5 SYSTEM "CF5.dtd">` as an example. The Guide's upload sample has no DOCTYPE, and the DevKit doesn't say whether PECWS accepts one in an upload ([KI-62](/known-issues#ki-62)).

*Appears in:* [Validating XML locally](/guides/validating-xml), [eClaims XML](/reference/eclaims-xml)

### DOH, DOH-MAP {#doh-map}
**Department of Health.** Annex D describes `pDOHMAP` as "The amount of Department of Health (DOHMAP) discount, if applicable". PC 2023-0026 Annex A lists "DOH-MAP" among other funding sources. **MAP** is not expanded in the DevKit. It is commonly the DOH Medical Assistance Program (general).

*Appears in:* [eSOA XML](/reference/esoa-xml) (`SummaryOfFee`)

### DRG {#drg}
**Diagnosis-Related Groups.** A payment system that groups cases by diagnosis and procedures. The Universal Health Care Act mandates PhilHealth "to shift to paying providers prospectively using Diagnosis-Related Groups" ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). CF5 collects the data for DRG grouping. The CF5 DTD comment spells it "Diagnostic Related Group".

*Appears in:* [CF5 guide](/guides/cf5), [DRG error codes](/reference/drg-error-codes)

### DRG grouper {#drg-grouper}
The software step that assigns a DRG code to a claim ("grouping"). The Guide says PECWS 3.0 "accommodates the collection of data required for DRG grouping" ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). The [DRG error-code workbook](/originals/cf5/DRG%20Error%20Codes.xlsx) has a sheet named "DRG Grouper" (codes `401`–`418`, each with a DRG code such as `26509`), and its warnings say a bad code "will be removed from the grouping logic and will proceed in finding the DRG code". The DevKit doesn't describe the grouper itself or explain its DRG codes ([KI-63](/known-issues#ki-63)). Judging from the error codes (our reading, not a PhilHealth statement), it uses the CF5 diagnoses and procedures plus patient and stay data such as age, sex and length of stay.

*Appears in:* [CF5 guide](/guides/cf5), [DRG error codes](/reference/drg-error-codes)

### DRGMED {#drgmed}
**"Drug particulars".** An eClaims XML element inside `PARTICULARS` for medicines bought, with `pDrugCode`, `pGenericName`, `pBrandName` and more. Despite the name, it has nothing to do with DRG.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### DSWD {#dswd}
**Department of Social Welfare and Development.** One of the eSOA discount/funding fields (`pDSWD`, Annex D).

*Appears in:* [eSOA XML](/reference/esoa-xml)

### DTD {#dtd}
**Document Type Definition.** A schema that lists which XML elements and attributes are allowed. PECWS methods check XML "against the Document Type Definition (DTD)" ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). The DevKit has five: eClaims, eSOA, CF5, CF4 (EPCB) and data migration. The CF5 DTD exists in two differing versions ([KI-06](/known-issues#ki-06)), and the eClaims and migration DTDs trip common libxml2-based validators ([KI-43](/known-issues#ki-43)). `ESOA.dtd` calls itself a "Data Type Definition".

*Appears in:* [Validating XML locally](/guides/validating-xml), [eClaims XML](/reference/eclaims-xml)

## E

### eCCSA {#eccsa}
**eClaims Cloud Storage API.** A required certification module (SSVTF Part II, IV): "Does the system has a feature to change or use multiple cloud storage to store eClaims file attachments?" The DevKit contains no specification for it ([KI-40](/known-issues#ki-40)).

*Appears in:* [Software certification](/guides/certification)

### eClaims {#eclaims}
**Electronic Claims.** PhilHealth's system for submitting claims electronically, in use since 2016. PC 2023-0026 defines the eClaims System as "an interconnected modular information system for claim reimbursement transactions".

*Appears in:* [Overview](/getting-started/), [Submitting a claim](/guides/submitting-a-claim)

### Encrypted envelope {#envelope}
Our name for the JSON object `{"docMimeType", "hash", "key1", "key2", "iv", "doc"}` that PECWS uses for encrypted data ([Annex A](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). `key1`/`key2` are empty in the cipher-key scheme and hold RSA-encrypted password halves in the attachment scheme.

*Appears in:* [Encryption overview](/guides/encryption/), [API overview](/api/)

### EPCB {#epcb}
The name of the CF4 DTD: "EPCB Document Type Definition Version 1.20", root element `EPCB`. In its `pPackageType` comment, "E - for EPCB" and "A - CF4". **Not expanded anywhere in the DevKit.** Outside the DevKit, EPCB is commonly expanded as PhilHealth's Expanded Primary Care Benefit package (general knowledge, not a DevKit statement). The DTD is shared with that primary-care program, which is why CF4 XML has many fields that are "not part of the CF4, but requirement for XML validation".

*Appears in:* [CF4 guide](/guides/cf4), [CF4 XML](/reference/cf4-xml)

### eRECEIPT {#ereceipt}
The XML returned (encrypted) by `uploadeClaims`. On success it carries `pTransmissionControlNumber` and `pReceiptTicketNumber`; on failure, `REMARKS` elements with `pErrCode` and `pErrDescription` ([Guide p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)).

*Appears in:* [uploadeClaims](/api/upload-eclaims)

### ESA {#esa}
The Annex B document type code for "Electronic Statement of Account (eSOA)". Use it when attaching the eSOA XML to a claim. The DevKit doesn't say whether `CF2@pHasAttachedSOA` must then be `Y` ([KI-62](/known-issues#ki-62)).

*Appears in:* [eSOA guide](/guides/esoa), [Document type codes](/reference/document-types)

### eSOA {#esoa}
**Electronic Statement of Account.** "The digital document of the statement of account in XML format" (PC 2023-0026, IV.B). It has three components: Summary of Fees, Professional Fees and Itemized Billing Items. It is checked with `validateeSOA`, then attached as `ESA`.

*Appears in:* [eSOA guide](/guides/esoa), [eSOA XML](/reference/esoa-xml), [validateeSOA](/api/validate-esoa)

### Extension codes (Ext1, Ext2) {#extension-codes}
CF5 procedure fields. `Ext1` is "the number of body sites" and `Ext2` "the number of times the procedure was done", each 1–9 ([Annex E, Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). On the paper [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) they go after the "+" sign next to each RVS code. The form says to "check the DRG Implementation Manual for specific rules on adding extension codes", but that manual is not in the DevKit. Both official CF5 samples also leave `Ext1` and `Ext2` empty, and nothing says whether blank is accepted. Ask PhilHealth for the manual ([KI-63](/known-issues#ki-63)).

*Appears in:* [CF5 XML](/reference/cf5-xml)

## H

### HCI {#hci}
**Health care institution.** The older term for a health facility: "Health Facility (HF) – formerly termed healthcare institution (HCI)" (PC 2023-0026, IV.C). It survives in field names (`pHciPan`, `pHciAccreNo`, `HCIFEES`).

*Appears in:* [eSOA XML](/reference/esoa-xml), [CF4 XML](/reference/cf4-xml)

### HCP {#hcp}
**Health care professional,** as in `getDoctorPAN` ("health care professional (HCP)", [Guide p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49)) and `isDoctorAccredited`: a doctor or other accredited professional. Watch for a second meaning: the test-data file name says "Health Care Providers" for the same two doctors, and the sample SOA in SSVTF Annex B (the same page as PC 2023-0026 Annex B, see [Annex](#annex)) uses "HCP Logo" and "Name of Health Care Provider" for the **facility** that issues the bill.

*Appears in:* [getDoctorPAN](/api/get-doctor-pan), [isDoctorAccredited](/api/is-doctor-accredited), [Test data](/reference/test-data)

### HEENT {#heent}
**Head, Ears, Eyes, Nose and Throat.** The physical-examination field `PHEX@pHEENT` in eClaims CF3 ([migration dictionary p. 11](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=11)), and a CF4 examination group with its own library (`lib_heent`, `pHeentId`).

*Appears in:* [eClaims XML](/reference/eclaims-xml), [CF4 XML](/reference/cf4-xml), [CF4 libraries](/reference/libraries/cf4)

### HF {#hf}
**Health Facility.** A public or private facility "devoted primarily to the provision of services for health promotion, prevention, diagnosis, treatment, rehabilitation, and palliation" (PC 2023-0026, IV.C). This is the PhilHealth-accredited hospital or clinic that submits claims.

*Appears in:* throughout; see [Overview](/getting-started/)

### HIS, EMR {#his-emr}
**Health Information System** and **Electronic Medical Record.** The Guide is addressed to "Health Information System / Electronic Medical Record (HIS/EMR) Service Providers" ([Guide p. 2](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=2)). That means the hospital software you are building or integrating.

*Appears in:* [Overview](/getting-started/)

### HMO {#hmo}
**Health maintenance organization.** A private health plan. Under PC 2023-0026 (V.T), HMO benefits are applied **after** PhilHealth benefits and mandatory discounts. Fields: eSOA `pHMO` (amount), eClaims `HCIFEES@pHMO`/`PROFFEES@pHMO` (Y/N).

*Appears in:* [eSOA guide](/guides/esoa), [eClaims XML](/reference/eclaims-xml)

## I

### ICD-10 {#icd-10}
**International Classification of Diseases, 10th Revision (general).** The WHO diagnosis code system. Used for `pICDCode` ("ICD 10 Code of the illness"), CF5 `PrimaryCode` and `SecondaryCode`, and the CF4 `lib_icd` library. For CF5, the form says "a list of valid ICD-10 codes can be found on PhilHealth's DRG Manual", which is not in the DevKit ([KI-63](/known-issues#ki-63)).

*Appears in:* [CF5 XML](/reference/cf5-xml), [eClaims XML](/reference/eclaims-xml), [CF4 libraries](/reference/libraries/cf4)

### IHCP {#ihcp}
Used in `pReferredIHCPAccreCode` ("Referring Facility Accreditation Code") and "referred by another IHCP". **Not expanded in the DevKit.** In PhilHealth usage it commonly means Institutional Health Care Provider, that is, a health facility (general).

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`CF2`)

### IMRT {#imrt}
**Intensity-modulated radiation therapy (general).** One of the repetitive procedures under `SPECIAL/PROCEDURES`, added in `eClaimsDef.dtd` 1.8.0.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### IOL {#iol}
**Intraocular lens (general).** The lens implanted in cataract surgery. `CATARACTINFO` records IOL sticker numbers and expiry dates for each eye.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### IV {#iv}
**Initialization vector (general).** 16 random bytes that start AES-CBC encryption, so the same data never encrypts the same way twice. In payloads the IV is sent in plain base64. In attachments it is RSA-encrypted.

*Appears in:* [API payloads](/guides/encryption/api-payloads), [Attachments](/guides/encryption/attachments)

## J

### JAO {#jao}
**Joint Administrative Order.** PC 2023-0026 (V.U) makes hospitals follow the order of charging in JAO No. 2020-0001, the operational guidelines for the Malasakit Centers Act.

*Appears in:* [eSOA guide](/guides/esoa)

### JAXP, Xerces {#jaxp}
<a id="xerces"></a>**Java API for XML Processing** and **Apache Xerces (general).** Java's built-in XML API and the parser behind it. In this site's tests it validated eClaims and migration XML against the original DTDs correctly, while [libxml2-based tools](#libxml2) did not, because of the DTDs' [non-deterministic content models](#non-deterministic) ([KI-43](/known-issues#ki-43)). This is why the site recommends Java for those two formats.

*Appears in:* [Validating XML locally](/guides/validating-xml), [eClaims XML](/reference/eclaims-xml)

## K

### Konsulta {#konsulta}
PhilHealth's primary care benefit package (general). Its claims are excluded from PC 2023-0026's eSOA requirement ("separate policies" will follow).

*Appears in:* [eSOA guide](/guides/esoa)

## L

### Laterality {#laterality}
Which side of the body a procedure was done on: `L` left, `R` right, `B` both, `N` none/not applicable. Used in CF5 `PROCEDURE@Laterality` and eClaims `RVSCODES@pLaterality`. The CF5 value for "none" changed in 2025 ([KI-05](/known-issues#ki-05)).

*Appears in:* [CF5 XML](/reference/cf5-xml), [eClaims XML](/reference/eclaims-xml)

### LHIO {#lhio}
**Not expanded in the DevKit.** In PhilHealth usage, LHIO commonly means Local Health Insurance Office, a PhilHealth branch office (general). In the DevKit it appears mainly in names for PhilHealth's claim number: `pClaimSeriesLhio`, `pSeriesLhioNo`, `serieslhionos` (and once in the CF5 DTD history, "Remove Attributes (Series,Lhio,Admission Time)"). `pClaimSeriesLhio` has 15 digits: "The first 13 digits represent the PhilHealth Claim Series number. The last two digits represent PhilHealth Regional Office (PRO) code" ([migration dictionary p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)). Keep it as text, because it can start with `0`. See [claim series number](#claim-series-number).

*Appears in:* [getClaimStatus](/api/get-claim-status), [Data migration XML](/reference/migration-xml)

### libxml2, lxml, xmllint {#libxml2}
<a id="lxml"></a><a id="xmllint"></a>**(general)** libxml2 is a widely used C library for XML. The command-line tool `xmllint`, Python's `lxml` package and PHP's DOM extension are built on it. With libxml2 2.13 and newer (for example, lxml 6.x), every eClaims and migration file fails validation, because those DTDs contain [non-deterministic content models](#non-deterministic). libxml2 2.9.x accepts the files but doesn't check the order of children inside `DISCHARGE`, `PROCEDURES` and `PARTICULARS`. The eSOA, CF5 and CF4 DTDs are not affected ([KI-43](/known-issues#ki-43)). For eClaims and migration XML, use [Java](#jaxp) or a patched copy of the DTD.

*Appears in:* [Validating XML locally](/guides/validating-xml), [eClaims XML](/reference/eclaims-xml), [Data migration XML](/reference/migration-xml)

### LINAC {#linac}
**Linear accelerator (general),** used for radiotherapy. The repetitive procedure `LINAC` is "Radiotherapy (LINAC)" in the migration dictionary.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### LMP {#lmp}
**Last Menstrual Period.** Maternity field `pLMP` in CF3.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### LOS {#los}
**Length of stay**, the time from admission to discharge. The DRG error-code workbook never spells out the acronym, but uses it in messages such as "Date of admission is required / LOS is invalid" (codes `104`–`107` and `404`–`407`), and code `417` says "Length of stay is invalid, it should be not less than 0 days or 0 hr" ([`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx)).

*Appears in:* [DRG error codes](/reference/drg-error-codes)

## M

### Malasakit {#malasakit}
The **Malasakit Centers Act of 2019** (Republic Act No. 11463) covers medical and financial assistance to indigent and financially incapacitated patients (PC 2023-0026, V.U). PC 2023-0026 lists Malasakit among the "other funding sources" on the SOA, and V.V says the balance left after PhilHealth, mandatory discounts, HMO or Malasakit is the out-of-pocket amount.

*Appears in:* [eSOA guide](/guides/esoa)

### MCP {#mcp}
The eClaims element `MCP` holds "MCP Package Details": four prenatal check-up dates, "Required for prenatal claims under non-hospital facility". **Not expanded in the DevKit.** It is commonly PhilHealth's Maternity Care Package (general).

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### MIME type {#mime-type}
**(general)** A label for a file format, such as `application/pdf`, `application/xml`, `application/json` or `text/xml`. It appears as `docMimeType` in encrypted envelopes and as `pMimeType` in migration files. Annex A says JSON data should be labeled `"application/json"` ([Guide p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76)), but every Guide JSON sample and both demo kits use `"text/xml"` ([KI-25](/known-issues#ki-25)). This site uses `text/xml` for XML and `application/json` for JSON. If the test server rejects `application/json`, switch to `text/xml` and tell PhilHealth.

*Appears in:* [API overview](/api/), [Data migration XML](/reference/migration-xml)

## N

### NCP {#ncp}
**Newborn Care Package.** The eClaims element `NCP` ("New Born Care Package Details") holds newborn screening and essential newborn care flags. In the migration DTD only, it also requires two newborn-hearing attributes ([KI-10](/known-issues#ki-10)).

*Appears in:* [eClaims XML](/reference/eclaims-xml), [Data migration XML](/reference/migration-xml)

### NClaims {#nclaims}
A PhilHealth application named in the SSVTF: documents must be "viewable in NClaims application", and eSOA/CF4 data must be "displayed in the NClaims Web" ([SSVTF p. 9–11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). The DevKit gives no further detail ([KI-56](/known-issues#ki-56)).

*Appears in:* [Software certification](/guides/certification)

### NHC, NHT {#nhc-nht}
Annex B document types: **NHC** "Newborn Hearing Registry Card (Blue Card)" and **NHT** "Newborn Hearing Screening Test Result".

*Appears in:* [Document type codes](/reference/document-types)

### NOMED {#nomed}
The CF4 "no medicine" code. Use `NOMED0000000000000000000000000` as `pDrugCode` and `NOMED` as `pGenericCode` when there is no medicine record ([CF4 files update, 2021-02-23](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf)). The same drug code appears in the eSOA medicine library.

*Appears in:* [CF4 guide](/guides/cf4), [eSOA libraries](/reference/libraries/esoa)

### Non-deterministic content model {#non-deterministic}
**(general)** A DTD rule for an element's children where a parser can't tell which branch of the rule a child belongs to without looking ahead. The XML 1.0 specification calls such models an error "for compatibility". Three rules in `eClaimsDef.dtd` and the migration DTD are non-deterministic: `DISCHARGE`, `PROCEDURES` and `PARTICULARS`. That is why [libxml2-based tools](#libxml2) fail on eClaims files, while [Java](#jaxp) validates them ([KI-43](/known-issues#ki-43)).

*Appears in:* [Validating XML locally](/guides/validating-xml), [eClaims XML](/reference/eclaims-xml), [Data migration XML](/reference/migration-xml)

### NTP {#ntp}
Appears in `pNTPCardNo` (TB DOTS) and document type "NTP Registry Card". **Not expanded in the DevKit.** It is commonly the National Tuberculosis Control Program (general).

*Appears in:* [eClaims XML](/reference/eclaims-xml), [Document type codes](/reference/document-types)

## O

### OAEP {#oaep}
**Optimal Asymmetric Encryption Padding (general).** A padding mode for [RSA](#rsa) encryption, and the modern alternative to [PKCS#1](#pkcs1) v1.5 padding. The attachment guideline never names an RSA padding mode. Both demo kits use PKCS#1 v1.5, not OAEP. Many libraries default to, or recommend, OAEP; if you use it, PhilHealth may not be able to decrypt your files ([KI-59](/known-issues#ki-59)).

*Appears in:* [Attachments](/guides/encryption/attachments), [Encryption overview](/guides/encryption/)

### OFFLINEDOCUMENT {#offlinedocument}
Element of the data migration XML whose text is the base64 content of a supporting document. It replaces the upload XML's `DOCUMENT` URL. Its required `pEncryptionUsed` attribute (`N`, `C` or `P`) is not defined anywhere in the DevKit ([KI-54](/known-issues#ki-54)).

*Appears in:* [Data migration XML](/reference/migration-xml)

### OFW {#ofw}
**Overseas Filipino Worker (general).** Membership type code `NO` in `pMemberShipType`.

*Appears in:* [Code tables](/reference/code-tables)

### OHAT {#ohat}
**Outpatient HIV/AIDS Treatment** package. It is included in the eSOA requirement (PC 2023-0026, III.A). The eClaims `HIVAIDS` element carries its laboratory number.

*Appears in:* [eSOA guide](/guides/esoa), [eClaims XML](/reference/eclaims-xml)

### OPD {#opd}
**Not expanded in the DevKit.** It appears in the `isClaimEligible` key `isForOPDHemodialysisClaim` ("If the purpose of checking eligibility is for hemodialysis claim", [Guide p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). It commonly means outpatient department (general).

*Appears in:* [isClaimEligible](/api/is-claim-eligible)

## P

### PA {#pa}
Cited in the SSVTF as "(PA 2024-0032)", the basis for applying for the CF5 and eSOA modules jointly or separately. **Not expanded in the DevKit.** It is presumably a PhilHealth Advisory (general). The advisory itself is not in the DevKit.

*Appears in:* [Software certification](/guides/certification)

### Padding (zero padding, PKCS#7) {#padding}
<a id="zero-padding"></a><a id="pkcs7"></a>**(general)** AES-CBC encrypts data in 16-byte blocks, so the data is padded to a multiple of 16 bytes before encryption, and the padding is removed after decryption. Two schemes matter here:

- **Zero padding:** append `0x00` bytes. Annex A prescribes it for API payloads: "Pad the data with null character (with hexadecimal value of '0x00') if it is not a multiple of 16 bytes" ([Guide p. 76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=76)).
- **PKCS#7 (general):** append N bytes that each have the value N (1–16). Most crypto libraries add it by default, so turn it off when you need zero padding. The DevKit doesn't mention it.

The attachment guideline doesn't name a padding, and the demo kits pad differently ([KI-13](/known-issues#ki-13)). Stripping trailing zeros is safe for XML and JSON text, but not for files: the DevKit's own sample PDF ends with 15 `0x00` bytes. For attachments, use *hash-guided unpadding* (try each pad length and keep the one whose SHA-256 matches `hash`), and confirm the padding with PhilHealth.

*Appears in:* [API payloads](/guides/encryption/api-payloads), [Attachments](/guides/encryption/attachments), [Demo kits](/reference/demo-kits)

### PAN {#pan}
**PhilHealth Accreditation Number.** The number of an accredited health facility (sent as the `accreditationNo` header of `getToken`) or health care professional (e.g. `1504-2400015-3`, returned by `getDoctorPAN`) ([Guide p. 8, 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). Formats disagree ([KI-48](/known-issues#ki-48)): Annex C documents a professional PAN as `####-######-##` in String(12), but every example is 4-7-1 digits (14 characters with dashes). The facility PAN in the eSOA (`pHciPan`) is 9 characters; the Guide's sample is `HXXXXX678`, and this site's examples use the placeholder `H12345678`. The DevKit doesn't say whether each method wants the facility's PAN or its [PMCC number](#pmcc).

*Appears in:* [getToken](/api/get-token), [getDoctorPAN](/api/get-doctor-pan), [Test data](/reference/test-data)

### PBEF {#pbef}
**PhilHealth Benefit Eligibility Form.** The eligibility printout generated as a PDF by `generatePBEFPDF`, using the reference number from `isClaimEligible` ([Guide p. 73](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)). The certification form mentions a "PBEF validator" and a "prescribed format" that the DevKit doesn't describe, and Annex B has no document type for the PBEF ([KI-56](/known-issues#ki-56)).

*Appears in:* [isClaimEligible](/api/is-claim-eligible), [generatePBEFPDF](/api/generate-pbef-pdf)

### PC {#pc}
**PhilHealth Circular.** An official policy issuance, for example PC 2023-0026 on the eSOA.

*Appears in:* [eSOA guide](/guides/esoa), [Revision history](/changelog)

### PCSO {#pcso}
**Philippine Charity Sweepstakes Office.** Its assistance is an eSOA funding/discount field (`pPCSO`, Annex D) and an example of "Others" in `HCIFEES@pOthers`.

*Appears in:* [eSOA XML](/reference/esoa-xml)

### PDF/A, PDF/A-1b {#pdf-a}
**(general)** Archival PDF (ISO 19005). The attachment guideline says scanned documents "should comply with the PDF/A standard", and the SSVTF checks "PDF/A-1b".

*Appears in:* [Attachments](/guides/encryption/attachments), [Software certification](/guides/certification)

### PDx, SDx {#pdx-sdx}
<a id="pdx"></a><a id="sdx"></a>**Primary Diagnosis (PDx)** and **Secondary Diagnosis (SDx)**, as the [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) writes them. CF5 takes exactly one PDx and up to 12 SDx [ICD-10](#icd-10) codes, with no repeats across secondary diagnoses or with the primary diagnosis. In the CF5 XML they are `DRGCLAIM@PrimaryCode` and `SECONDARYDIAG@SecondaryCode`.

*Appears in:* [CF5 guide](/guides/cf5)

### PECWS {#pecws}
**PhilHealth e-Claims Web Service.** The API this whole DevKit is about, version 3.0 ([Guide p. 7](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)). Endpoints follow `https://{pecws.domain}/PHIC/Claims3.0/<method>`.

*Appears in:* [API overview](/api/)

### PEN {#pen}
**PhilHealth Employer Number.** "A unique 12 digit number assigned to an employer". Used in `searchEmployer`, `isClaimEligible` (`pEN`) and `CF1@pPEN` for employed members. The dummy employers are written as 12 plain digits (for example `110474000002`), but the Guide's upload sample writes the same number with dashes, `11-047400000-2` ([KI-48](/known-issues#ki-48)).

*Appears in:* [searchEmployer](/api/search-employer), [Test data](/reference/test-data)

### PHI {#phi}
**Private health insurance** (PC 2023-0026, V.T). Like HMO benefits, it is applied after PhilHealth and mandatory discounts. In this DevKit, PHI does not mean "protected health information".

*Appears in:* [eSOA guide](/guides/esoa)

### PHIC {#phic}
**Not expanded in the DevKit;** it is the usual abbreviation of Philippine Health Insurance Corporation (general), that is, PhilHealth. It appears in every endpoint path (`https://{pecws.domain}/PHIC/Claims3.0/...`, [Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)) and in the public identifier of PhilHealth's `DOCTYPE` line for eClaims XML, `-//PHIC-ITMD//DTD eClaims File 1.0//EN`. ITMD is not expanded anywhere in the DevKit.

*Appears in:* [API overview](/api/), [Validating XML locally](/guides/validating-xml)

### PhilHealth {#philhealth}
**Philippine Health Insurance Corporation.** The Philippine national health insurer, which runs eClaims and publishes this DevKit.

*Appears in:* [Overview](/getting-started/)

### PII {#pii}
**Personally Identifiable Information.** The SSVTF asks: "Does the PDF and XML exclude Personally Identifiable Information (PII)?" The DevKit doesn't define what must be excluded, although claim XML necessarily contains names and PINs ([KI-56](/known-issues#ki-56)).

*Appears in:* [Software certification](/guides/certification)

### PIN {#pin}
**PhilHealth Identification Number.** "A unique 12 digit number assigned to a member" (or patient). The last digit is a modulus-11 check digit ([Annex C, Guide p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)), but Annex C gives no algorithm ([KI-64](/known-issues#ki-64)). Looked up with `getMemberPIN`. The DevKit has no test members or PINs ([KI-11](/known-issues#ki-11)); `072007271094`, used in this site's examples, is the Guide's sample value.

*Appears in:* [getMemberPIN](/api/get-member-pin), [eClaims XML](/reference/eclaims-xml)

### PKCS#1 {#pkcs1}
**Public-Key Cryptography Standards #1 (general),** the RSA standard. Both demo kits use PKCS#1 v1.5 padding when RSA-encrypting the attachment password halves and IV (C# `rsaObj.Encrypt(data, false)`, PHP `openssl_public_encrypt` with its default padding). The attachment guideline doesn't name a padding mode. Use PKCS#1 v1.5, not [OAEP](#oaep), and confirm with PhilHealth ([KI-59](/known-issues#ki-59)).

*Appears in:* [Attachments](/guides/encryption/attachments), [Demo kits](/reference/demo-kits)

### PMCC number {#pmcc}
"A unique code assigned by PhilHealth to the health facility, also known as the PMCC No.", 6 characters, format `999999` or `X99999` ([Annex E, Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). It goes into `pHospitalCode` ("For now PMCC number should be used"). The DevKit never expands PMCC, and this site doesn't guess an expansion. The DevKit also doesn't say whether the API methods that ask for an "accreditation number" expect the PMCC number or the facility's [PAN](#pan) ([KI-48](/known-issues#ki-48)).

*Appears in:* [CF5 XML](/reference/cf5-xml), [eClaims XML](/reference/eclaims-xml)

### PNDF {#pndf}
**Philippine National Drug Formulary (general).** `pPNDFCode` is "PNDF Code (Blank until PNDF lib is available)".

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`DRGMED`)

### PRO {#pro}
**PhilHealth Regional Office.** The last two digits of `pClaimSeriesLhio` are the PRO code of the office that processed the claim ([migration dictionary p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)). The SSVTF's Stage 1 is "for PhilHealth Regional Offices Use".

*Appears in:* [Data migration XML](/reference/migration-xml), [Software certification](/guides/certification)

### Public key (PhilHealth) {#public-key}
The RSA public key, in an X.509 certificate, that PhilHealth provides for encrypting **attachments**. Only PhilHealth can decrypt with the matching private key. The certificate bundled in the DevKit is an expired test certificate ([KI-01](/known-issues#ki-01)).

*Appears in:* [Attachments](/guides/encryption/attachments)

### PWD {#pwd}
**Person with Disability.** PWD discounts are mandatory discounts deducted before other benefits (PC 2023-0026, V.T). eSOA field `pPWDDiscount`.

*Appears in:* [eSOA XML](/reference/esoa-xml)

## Q

### QR methods {#qr}
**QR** is a Quick Response code (general). Revision 20240228 of the Guide added two methods, `requestQrAuthorization` and `inquireQrTrackingNo`, "for the implementation of a use case for QR code of the eGov super app". Revision 20250217 removed them "as this requirement has been deferred" ([Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). Don't implement them ([KI-02](/known-issues#ki-02)).

*Appears in:* [Removed methods](/api/removed-methods), [Revision history](/changelog)

## R

### RA {#ra}
**Republic Act.** A Philippine law. PC 2023-0026 cites RA 11223, the Universal Health Care Act ([p. 1](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1)), and RA 11463, the Malasakit Centers Act ([p. 5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)). The Implementation Guide names the Universal Health Care Act of 2019 but not its RA number.

*Appears in:* [eSOA guide](/guides/esoa)

### RIG {#rig}
**Rabies Immunoglobulin.** `ABP@pRIG` is the date it was given.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### RSA {#rsa}
**(general)** A public-key algorithm. In the attachment scheme, the two password halves and the IV are each RSA-encrypted with PhilHealth's public key (2048-bit in the bundled certificate).

*Appears in:* [Attachments](/guides/encryption/attachments)

### RTH {#rth}
**Return to Hospital.** A claim that PhilHealth returns to the facility, for example so that it can add required documents. The Guide cites "high numbers of 'Return-to-Hospital' claims" as a reason for PECWS 3.0. `addRequiredDocument` is used "in compliance with RTH claims" ([Guide p. 6, 42](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)).

*Appears in:* [addRequiredDocument](/api/add-required-document), [Data migration](/guides/data-migration)

### RTN {#rtn}
**Receipt Ticket Number** ([SSVTF p. 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)). `pReceiptTicketNumber` ("Philhealth Generated Upload Comfirmation [sic] Receipt ticket number", Annex C) is returned in the `eRECEIPT` after a successful upload, and you pass it to `getUploadedClaimsMap` as `receiptTicketNumber` ([KI-22](/known-issues#ki-22)). Annex C gives no format, and the Guide's two samples use different ones ([KI-31](/known-issues#ki-31)).

*Appears in:* [uploadeClaims](/api/upload-eclaims), [getUploadedClaimsMap](/api/get-uploaded-claims-map)

### RVS {#rvs}
**Relative Value Scale.** The procedure code system: `pRVSCode` is the "Relative Value Scale Code of the procedure/operation performed". CF5 takes up to 20 RVS codes. The CF5 form says valid codes are in "PhilHealth's DRG Manual", which is not in the DevKit ([KI-63](/known-issues#ki-63)).

*Appears in:* [CF5 XML](/reference/cf5-xml), [searchCaseRates](/api/search-case-rates)

## S

### SC {#sc}
**Senior citizen.** Senior citizen discounts are mandatory discounts (PC 2023-0026, V.T). eSOA field `pSeniorCitizenDiscount`.

*Appears in:* [eSOA XML](/reference/esoa-xml)

### SHA-256 {#sha-256}
**(general)** A hash function that turns any data into a 32-byte fingerprint (64 hex characters). It is used for the `hash` of every encrypted envelope (integrity check) and, applied to the cipher key, to derive the AES key.

*Appears in:* [API payloads](/guides/encryption/api-payloads)

### Shadow billing {#shadow-billing}
Submitting DRG data (CF5) alongside a normal claim without changing payment. The CF5 form says: "If you are utilizing this form, you are a health facility participating in the Shadow Billing of Diagnosis-Related Groups" and "the Health Facility filing this claim shall be reimbursed using All Case Rates." The DevKit doesn't say which facilities must take part, or how the paper form's patient-consent and physician-certification parts are handled electronically ([KI-63](/known-issues#ki-63)).

*Appears in:* [CF5 guide](/guides/cf5)

### SOA {#soa}
**Statement of Account.** "The document generated by the HF that reflects the summary of all service charges ... for the episode of care" (PC 2023-0026, IV.H). It is also document type `SOA` (PDF). Its XML form is the eSOA.

*Appears in:* [eSOA guide](/guides/esoa)

### SOAP {#soap}
In the CF4 materials, **SOAP** is the consultation part of the CF4 (EPCB) XML: the `SOAPS`/`SOAP` elements and the data dictionary group "SOAP - Consultation". **Not expanded in the DevKit.** In medical records it commonly means Subjective, Objective, Assessment, Plan (general). It has nothing to do with the SOAP web-service protocol: PECWS exchanges JSON over HTTPS.

*Appears in:* [CF4 XML](/reference/cf4-xml)

### Software certification ID {#software-certification-id}
The ID PhilHealth issues when a system passes certification. Send it as the `softwareCertificateId` header of `getToken`, and as `":" + ID` in `eCLAIMS@pUserName` ([KI-03](/known-issues#ki-03)).

*Appears in:* [getToken](/api/get-token), [uploadeClaims](/api/upload-eclaims), [Software certification](/guides/certification)

### SP {#sp}
**Service provider.** The IT company that provides a facility's HIS/EMR ("HCIs/SPs" in the attachment guideline).

*Appears in:* [Data migration](/guides/data-migration)

### SSVTF {#ssvtf}
**Software Solution Validation Test Form.** PhilHealth's certification checklist for PECWS 3.0 systems (revised 20250217). It comes with two separate files, SSVTF Annex A (CF4 data requirements) and SSVTF Annex B (eSOA minimum data elements); see [Annex](#annex). Part I covers completeness (claims eligibility, submission and status), document format and content, and offline mode. Part II covers the eSOA, CF5, CF4, eCCSA and data-migration modules. The criteria are checked in two stages: Stage 1 "for PhilHealth Regional Offices Use", and Stage 2 "for PhilHealth Central Office Use", which checks that the encrypted files are reachable, can be decrypted, and match the raw files byte by byte ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).

*Appears in:* [Software certification](/guides/certification)

## T

### TAT {#tat}
**Turnaround Time.** "The transmission date serves as the official date received for the uploaded claims, which will be used to measure the Turnaround Time (TAT)" ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).

*Appears in:* [uploadeClaims](/api/upload-eclaims)

### TB DOTS {#tb-dots}
PhilHealth's tuberculosis treatment package ("TB DOTS Package"). The `TBDOTS` element records the phase (`I` intensive, `M` maintenance) and NTP card number. **DOTS** is not expanded in the DevKit. It commonly means Directly Observed Treatment, Short-course (general).

*Appears in:* [eClaims XML](/reference/eclaims-xml), [eSOA guide](/guides/esoa)

### TCN {#tcn}
**Transmission Control Number.** `pTransmissionControlNumber`, "Philhealth Generated Transmittal file control number", returned on successful upload and "blank if the transmission is failed" ([Annex C, Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). The certification form nevertheless asks whether *your* system generates it ([KI-56](/known-issues#ki-56)). Annex C gives it String(18), but the Guide's sample value has 19 characters ([KI-31](/known-issues#ki-31)).

*Appears in:* [uploadeClaims](/api/upload-eclaims), [Software certification](/guides/certification)

### TIN {#tin}
**Taxpayer Identification Number (general).** It appears as `pCompanyTIN` in `RECEIPT` (format `###-###-###-###`) and in the test data.

*Appears in:* [eClaims XML](/reference/eclaims-xml), [Test data](/reference/test-data)

### Token {#token}
The short-lived authorization string from `getToken`, sent in the `token` header of every other method. The sample message says "Token is valid for 20 seconds" ([KI-26](/known-issues#ki-26)).

*Appears in:* [getToken](/api/get-token)

### Tracking number {#tracking-number}
The claims eligibility tracking number (`pTrackingNumber`, format `####-####-####-####`, "Can be blank"). The final `isClaimEligible` call "generates a Tracking Number".

*Appears in:* [isClaimEligible](/api/is-claim-eligible), [eClaims XML](/reference/eclaims-xml)

### Transmittal {#transmittal}
One batch of claims uploaded together (`eTRANSMITTAL`), numbered by the hospital's own `pHospitalTransmittalNo`, which "should be unique per hospital". The DevKit doesn't say what happens if you upload the same transmittal twice, or whether a rejected number can be reused ([KI-62](/known-issues#ki-62)).

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### TSeKaP {#tsekap}
The CF4 library spreadsheets have sheet names like `tsekap_lib_icd`. **Not expanded in the DevKit.** TSeKaP was PhilHealth's earlier primary care benefit package (general), which suggests the CF4 libraries come from the primary-care system.

*Appears in:* [CF4 libraries](/reference/libraries/cf4)

## U

### UHC {#uhc}
**Universal Health Care.** According to the Guide, the Universal Health Care Act of 2019 mandates PhilHealth "to shift to paying providers prospectively using Diagnosis-Related Groups", which drives PECWS 3.0 ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). PC 2023-0026 cites the same law as Republic Act No. 11223 in the rationale for the eSOA ([p. 1](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1)). The Guide itself gives no RA number.

*Appears in:* [Overview](/getting-started/)

### UHCST {#uhcst}
**Universal Health Care Surge Team.** The PhilHealth team named in the Implementation Guide's disclaimer as the provider of its content ("PhilHealth-UHCST", [Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)).

*Appears in:* [Overview](/getting-started/)

### UPECS-EMR {#upecs-emr}
**Unified PhilHealth Electronic Claims System – Electronic Medical Record** (the "UPECS-EMR Team"). The PhilHealth team that PC 2023-0026 (V.BB) tells facilities and service providers to coordinate with "for the updated version of DTD and eSOA XML formats".

*Appears in:* [How to read these docs](/getting-started/how-to-read), [eSOA guide](/guides/esoa)

### UTF-8 {#utf-8}
**(general)** The standard character encoding for text, which turns each character into one to four bytes. The DevKit never names a text encoding: not for hashing the cipher key, not for the XML and JSON you encrypt, and not for the eClaims XML itself ([KI-60](/known-issues#ki-60), [KI-62](/known-issues#ki-62)). The C# demo kit uses UTF-8; the PHP kit hashes and encrypts the string's bytes as they are. Characters such as `Ñ` give different bytes in other encodings, so the hash or the derived key would not match. This site uses UTF-8 everywhere; confirm with PhilHealth.

*Appears in:* [API payloads](/guides/encryption/api-payloads), [Attachments](/guides/encryption/attachments), [eClaims XML](/reference/eclaims-xml)

## V

### VAT {#vat}
**Value-added tax (general).** 12% in the eClaims `RECEIPT` (`pVAT`, "VAT – 12%"). eSOA amounts are "net of applicable VAT" (`pChargesNetOfApplicableVat`).

*Appears in:* [eSOA XML](/reference/esoa-xml)

### Voucher {#voucher}
A payment record that PhilHealth prepares for paid claims; "a single voucher may contain multiple claims". [`getVoucherDetails`](/api/get-voucher-details) "facilitates the reconciliation of paid claims by returning the voucher details and other payment information" ([Guide p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). Its `voucherNo` should come from the `pVoucherNo` that `getClaimStatus` returns once a voucher exists, but the `getClaimStatus` sample has no `pVoucherNo` ([KI-23](/known-issues#ki-23)).

*Appears in:* [getVoucherDetails](/api/get-voucher-details), [getClaimStatus](/api/get-claim-status)

## X

### X.509 certificate, PEM {#x509}
**(general)** The standard certificate format, here stored as Base64 text (PEM) between `-----BEGIN CERTIFICATE-----` lines. PhilHealth's public key is delivered this way (`pnpki_philhealth_eclaims_auth_cert.pem`).

*Appears in:* [Attachments](/guides/encryption/attachments), [Known issues: KI-01](/known-issues#ki-01)

### XLSO {#xlso}
An eClaims `PARTICULARS` element for "XRay,Lab,Supplies,etc..", with `pDiagnosticType` `IMAGING`, `LABORATORY`, `SUPPLIES` or `OTHERS`.

*Appears in:* [eClaims XML](/reference/eclaims-xml)

### XML {#xml}
**Extensible Markup Language.** "The data storage format used for electronic data submission of HF claims to PhilHealth" (PC 2023-0026, IV.J). eClaims, eSOA, CF4, CF5 and migration files are all XML. XML is case-sensitive.

*Appears in:* [Validating XML locally](/guides/validating-xml)

## Z

### Z-Benefits {#z-benefits}
PhilHealth benefit packages for specific high-cost conditions, paid in tranches. Codes `Z0011` to `Z0092` cover childhood acute lymphocytic leukemia, early breast cancer, prostate cancer, kidney transplant, coronary artery bypass graft (CABG), tetralogy of Fallot (TOF), ventricular septal defect (VSD) and cervical cancer ([migration dictionary p. 9](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=9)). Used with `pPhilhealthClaimType="Z-BENEFIT"`. Z Benefits claims are outside the eSOA requirement.

*Appears in:* [eClaims XML](/reference/eclaims-xml) (`ZBENEFIT`), [eSOA guide](/guides/esoa)

## Related pages

- [How to read these docs](/getting-started/how-to-read)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [Code tables](/reference/code-tables): the coded values behind many of these terms
- [Known issues](/known-issues)
