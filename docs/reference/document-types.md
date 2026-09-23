---
title: Document type codes
description: All Annex B codes for DOCUMENT@pDocumentType, which codes carry the XML attachments (CF4, CF5, ESA), and the encryption and HTTPS rules for every attached file.
---

# Document type codes

<Badge type="tip" text="Current: Annex B (rev. 20250217)" /> <Badge type="warning" text="Gap" />

Every claim in the [eClaims XML](/reference/eclaims-xml) lists its supporting documents in `DOCUMENTS/DOCUMENT`. Each entry has a 3-letter document type code and the URL of an encrypted file on your server. This page lists every code from Annex B of the Implementation Guide, shows which codes carry XML files (CF4, CF5, eSOA), and explains the rules for the file behind each URL.

::: info Sources
- [Implementation Guide (rev. 20250217), Annex B, p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77): Document Type Code and Description
- [Implementation Guide, Annex C, p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85): `pDocumentType` and `pDocumentURL`
- [Implementation Guide, p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) (eSOA as `ESA`), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16) (CF5 as `CF5`), [p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35) (upload sample), [p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42) (addRequiredDocument)
- [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.9 (version history of the document codes)
- [Guidelines for the Encryption of e-Claim Attachments.pdf](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf) (2025-03-14)
- [Software Solution Validation Test Form (rev. 20250217), p. 4, 9, 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)
:::

## How the codes are used

Put one `DOCUMENT` element per file inside the claim's `DOCUMENTS` element:

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="CSF"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CSF.enc"/>
  <DOCUMENT pDocumentType="ESA"
            pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/ESA.enc"/>
</DOCUMENTS>
```

These two entries come from this site's example claim, [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) (claim number `202609170001`).

| Attribute | Rule | Source |
|---|---|---|
| `pDocumentType` | String(3). "Document to support the claim". "See Document Library", which is the Annex B list below. | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |
| `pDocumentURL` | String(250). "URL of the document accessible via https." "The document must first be encrypted using philhealth public key before publishing online." | [Annex C p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85) |

`DOCUMENTS` is required in every claim and must contain at least one `DOCUMENT`. The same `<DOCUMENTS>` XML is also the payload of [addRequiredDocument](/api/add-required-document), which adds documents to a claim that was returned to the hospital (RTH).

## All codes

Annex B lists 42 rows, which are 41 distinct codes: `CF4` appears twice. The table keeps PhilHealth's order and wording.

| Code | Description (Annex B) | Note |
|---|---|---|
| `CAB` | Clinical Abstract | |
| `CAE` | Certification of Approval/Agreement from the Employer | |
| `CF1` | Claim Form 1 | |
| `CF2` | Claim Form 2 | |
| `CF3` | Claim Form 3 | |
| `CF4` | Claim Form 4 | XML attachment ([see below](#xml-attachments-cf4-cf5-and-esa)); listed twice |
| `COE` | Certificate of Eligibility | |
| `CSF` | Claim Signature Form | Added in DTD 1.6.1 (2013); the attachment guideline's example of a scanned PDF |
| `CTR` | Confirmatory Test Results by SACCL or RITM | |
| `DTR` | Diagnostic Test Result | |
| `ITB` | Itemized Billing (PDF format) | |
| `ITX` | Itemized Billing (MS Excel Format) | See the [format warning](#file-formats) ([KI-57](/known-issues#ki-57)) |
| `MBC` | Member's Birth Certificate | |
| `MDR` | Proof of MDR with Payment Details | |
| `MEF` | Member Empowerment Form | |
| `MMC` | Member's Marriage Contract | |
| `MSR` | Malarial Smear Results | |
| `NHC` | Newborn Hearing Registry Card (Blue Card) | |
| `NHT` | Newborn Hearing Screening Test Result | |
| `MWV` | Waiver for Consent for Release of Confidential Patient Health Information | |
| `NTP` | NTP Registry Card | |
| `OPR` | Operative Record | |
| `ORS` | Official Receipts | |
| `PAC` | Pre-Authorization Clearance | |
| `PBC` | Patient's Birth Certificate | |
| `PIC` | Valid Philhealth Indigent ID | |
| `POR` | PhilHealth Official Receipts | |
| `SOA` | Statement of Account | The paper/PDF statement of account |
| `STR` | HIV Screening Test Result | |
| `TCC` | TB-Diagnostic Committee Certification (-) Sputum | |
| `TYP` | Three Years Payment of (2400 x 3 years of proof of payment) | |
| `MRF` | PhilHealth Member Registration Form | Added in DTD 1.7.4 (2014) |
| `ANR` | Anesthesia Record | Added in DTD 1.7.5 (2015) |
| `HDR` | Hemodialysis Record | Added in DTD 1.7.5 (2015) |
| `CF4` | Claim Form 4 | Second listing of `CF4` ([KI-35](/known-issues#ki-35)) |
| `CF5` | Electronic Claim Form 5 (for DRG Shadow Billing) | XML attachment |
| `ESA` | Electronic Statement of Account (eSOA) | XML attachment |
| `NIR` | Neuroimaging Result | |
| `RGR` | Radiographic Result | |
| `BCR` | Blood Culture Result | |
| `CBC` | Complete Blood Count Result | |
| `OTH` | Other documents | |

The Guide's upload sample attaches `CSF`, `OPR` and `SOA` ([p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)); the `addRequiredDocument` sample attaches `CF1`, `CF2` and `OPR` ([p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)).

::: warning Which documents does a claim need?
The DevKit does not list which documents each claim type or benefit package requires; Annex B only lists the codes ([KI-62](/known-issues#ki-62)). The certification form checks that "the required documents (CF4, CSF, SOA)" are viewable in PhilHealth's system ([SSVTF p. 9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)), and PhilHealth Circular 2023-0026 covers when the eSOA is required ([Building the eSOA](/guides/esoa)). For everything else, follow PhilHealth's benefit circulars or ask PhilHealth.

The PhilHealth Benefit Eligibility Form (PBEF) that [generatePBEFPDF](/api/generate-pbef-pdf) returns has **no code** in Annex B, and the DevKit doesn't say whether you attach it to a claim. The closest code is `COE` (Certificate of Eligibility), but the DevKit doesn't connect the two ([KI-56](/known-issues#ki-56)). Ask PhilHealth before you attach a PBEF.
:::

## Notes

### CF4 is listed twice

`CF4 – Claim Form 4` appears on p. 77 and again on p. 78, with the same description. It is the same code; use `CF4` once per CF4 file. See [KI-35](/known-issues#ki-35).

### The DTD no longer checks the codes

Up to version 1.8.0, `eClaimsDef.dtd` listed the allowed `pDocumentType` values; codes such as `CSF` (1.6.1), `MRF` (1.7.4), `ANR` and `HDR` (1.7.5) were added by changing the DTD. **Version 1.9.0 (2017-06-23) "removed the ennumerated list values for the pDocumentType attribute for flexibility of adding new elements".** Since then, `pDocumentType` is plain CDATA.

What this means for you:

- PhilHealth can add codes by updating Annex B only, without a new DTD. For example, `ESA` stands for the eSOA, a format that dates from 2022 (`ESOA.dtd` 0.1 is dated 2022-08-19), five years after DTD 1.9.
- **A DTD validator no longer catches a bad code.** `"cf4"`, `"CF 4"` or `"XYZ"` all pass DTD validation. Only PhilHealth's server rejects them.

::: tip Recommendation (not from PhilHealth)
Keep the Annex B list as a lookup table in your system, and check each `pDocumentType` against it before you build the XML. Use the exact uppercase codes. When PhilHealth publishes new codes, update the table.
:::

### XML attachments: CF4, CF5 and ESA

Three codes carry XML files instead of scanned documents. They are attached like any other document: encrypted with PhilHealth's public key and referenced by URL. They are **not** embedded in the eClaims XML.

| Code | File | Check it first with | What the Guide says |
|---|---|---|---|
| `ESA` | eSOA XML ([eSOA XML](/reference/esoa-xml)) | [validateeSOA](/api/validate-esoa) | "After successful validation, the eSOA XML must be encrypted using the PhilHealth Public Key and submitted as an attachment to electronic claims through the EclaimsUpload method, with the Document Type set to ESA." ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)) |
| `CF5` | CF5 XML for DRG ([CF5 XML](/reference/cf5-xml)) | [validateCF5](/api/validate-cf5) | "After successful validation, CF5 XML should be encrypted using PhilHealth Public Key and submitted as attachment to electronic claims using the EclaimsUpload Method, with the Document Type set to CF5." ([p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) |
| `CF4` | CF4 XML ([CF4 XML](/reference/cf4-xml)) | The DevKit documents no PECWS 3.0 method that validates CF4. Validate it locally against [`CF4.dtd`](/originals/cf4/CF4.dtd). | The attachment guideline names CF4 as its example of an XML supporting document. |

"EclaimsUpload" is the Guide's informal name for [uploadeClaims](/api/upload-eclaims); the endpoint is spelled `uploadeClaims` ([KI-09](/known-issues#ki-09)). The DevKit does not say whether `CF2@pHasAttachedSOA` must be `Y` when you attach `SOA` or `ESA` ([KI-62](/known-issues#ki-62)); the [example eClaims XML](/examples/eclaims-minimal.xml) on this site sets it to `Y`.

### Every file is encrypted with PhilHealth's public key and served over HTTPS

This applies to every code, PDF and XML alike.

1. **Encrypt each file on its own** with PhilHealth's public key, following the [attachment guideline](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf): SHA-256 hash of the original file, AES-256-CBC with a random 32-byte password (two random 16-byte halves) and a random 16-byte IV, each encrypted with the public key, all packed in one JSON file. The guideline doesn't name the RSA padding mode; both demo kits use PKCS#1 v1.5 ([KI-59](/known-issues#ki-59)). "PECWS does not provide a service or method for encryption of the e-claim attachments." Set `docMimeType` to `application/pdf` for PDFs. For XML attachments the DevKit doesn't give a value; this site's examples use `text/xml` ([KI-57](/known-issues#ki-57)). Step by step: [Encrypting attachments](/guides/encryption/attachments).
2. **Publish the encrypted file** at a URL that PhilHealth can reach over HTTPS. The guideline says the encrypted file "may be renamed using the original file name followed by '.enc'" (for example `CSF.pdf.enc`); this site's examples use the document type code plus `.enc` (for example `CSF.enc`). The URL must fit in 250 characters.
3. **Put the URL in `pDocumentURL`.**

The certification test checks exactly this: whether "the URLs of the encrypted PDF and XML files [are] accessible to PHILHEALTH via a web browser", whether they are downloadable, whether PhilHealth can decrypt them, and whether the decrypted file is the same as the raw file "using byte-by-byte comparison" ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).

::: danger Use the right key and a current certificate
- Attachments use **PhilHealth's public key**. The eClaims XML itself uses your **cipher key**. Don't mix them up ([KI-12](/known-issues#ki-12)).
- The public key file in the DevKit is an **expired test certificate** (valid until 2014-12-29). Get the current certificate from PhilHealth ([KI-01](/known-issues#ki-01)).
:::

The DevKit does not say how long the files must stay online, or whether the URL may require authentication ([KI-57](/known-issues#ki-57)). Recommendation (not from PhilHealth): because PhilHealth must be able to open the URL "via a web browser", don't use `localhost`, intranet addresses or links that need a login unless PhilHealth tells you otherwise. The certification form also requires a cloud-storage feature for attachments (eCCSA), which the DevKit does not specify ([KI-40](/known-issues#ki-40)).

::: warning addRequiredDocument sample uses http:// (KI-57)
The `addRequiredDocument` sample uses URLs such as `http://sample/file/other/cf1.pdf` ([p. 43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=43)), and even the upload sample's URLs have no real host name (`https://hospitalwebserver/...`). Annex C requires HTTPS. Treat the samples as placeholders and always use `https://` URLs on a host PhilHealth can resolve. See [KI-57](/known-issues#ki-57).
:::

### File formats

The attachment guideline says: "Supporting documents for e-claims must be in PDF (e.g., scanned Claim Signature Form (CSF)) or XML format (e.g., Claim Form 4 (CF4))", and "Scanned documents should comply with the PDF/A standard". The certification form checks for **PDF/A-1b** ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)).

::: warning ITX (MS Excel) conflicts with the 2025 guideline (KI-57)
Annex B still lists `ITX – Itemized Billing (MS Excel Format)`. The 2025 attachment guideline allows only PDF or XML ([KI-57](/known-issues#ki-57)). Recommendation (not from PhilHealth): send itemized billing as `ITB` (PDF) or through the eSOA (`ESA`), and ask PhilHealth before sending an Excel file.
:::

## Common mistakes

- **Lowercase or misspelled codes** (`csf`, `CF-4`). The DTD won't catch them; the server will.
- **Linking the plain file.** Every file must be encrypted with PhilHealth's public key first.
- **Encrypting attachments with the cipher key** (the key for API payloads).
- **`http://`, `localhost` or intranet URLs.** PhilHealth must download the file over HTTPS.
- **Putting the eSOA or CF5 XML inside the eClaims XML.** They are separate, encrypted files referenced by URL.
- **Sending a scanned PDF that is not PDF/A.** The certification checks PDF/A-1b.

## Related pages

- [eClaims XML](/reference/eclaims-xml#documents-document): the `DOCUMENTS` element
- [Encrypting attachments](/guides/encryption/attachments)
- [addRequiredDocument](/api/add-required-document)
- [validateeSOA](/api/validate-esoa) and [validateCF5](/api/validate-cf5)
- [Code tables](/reference/code-tables)
- [Known issues](/known-issues): [KI-35](/known-issues#ki-35), [KI-56](/known-issues#ki-56), [KI-57](/known-issues#ki-57), [KI-59](/known-issues#ki-59), [KI-62](/known-issues#ki-62)
