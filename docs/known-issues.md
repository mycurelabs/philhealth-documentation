---
title: Known issues & discrepancies
description: Every outdated, conflicting, or incorrect item found in the PhilHealth PECWS 3.0 DevKit, with what to do about it.
---

# Known issues & discrepancies

The PhilHealth DevKit was written by several teams over about 15 years (2010–2025), so some parts of it are **outdated**, **contradict each other**, or contain **typos**. This page lists every problem we found. Each one has an ID (`KI-01`, `KI-02`, …) so the rest of the site can link to it.

Each entry covers:

- **What the sources say**, with links to the original files.
- **Why it matters** to a developer.
- **What to do**. When a recommendation is ours and not PhilHealth's, the entry says so.

::: tip How we decide which source wins
We apply the [precedence rules](/getting-started/how-to-read#which-source-wins-precedence-rules) consistently. In short: the newest dated document wins, a DTD beats prose for XML structure, samples are only illustrations, and PhilHealth's validator endpoints have the final say. When in doubt, ask PhilHealth.
:::

::: tip Start here: the high-impact issues
If you read nothing else, read these:

- [KI-01](#ki-01): Bundled public key is an expired test certificate. **Get the current certificate from PhilHealth.**
- [KI-03](#ki-03): Software certificate ID moved from a header into `pUserName`. **Send `pUserName=":<certificate ID>"`, no extra headers.**
- [KI-12](#ki-12): Two encryption schemes that are easy to confuse. **Cipher key for payloads, public key for attachments.**
- [KI-13](#ki-13): AES padding differs between guide and demo kits. **Zero-pad payloads; confirm attachment padding.**
- [KI-15](#ki-15): C# demo kit uses a fixed IV and a non-secure random generator. **Don't copy the C# kit's IV, random, or logging code.**
- [KI-30](#ki-30): The PECWS host name is not in the DevKit. **Get the host names from PhilHealth; make the URL configurable.**
- [KI-40](#ki-40): eClaims Cloud Storage API (eCCSA) is not specified. **Ask PhilHealth for the eCCSA specification.**
- [KI-43](#ki-43): The eClaims and migration DTDs break common XML validators. **Validate eClaims/migration XML with Java or a patched DTD.**
- [KI-45](#ki-45): What goes in the CF5 `ClaimNumber` is unclear. **Use `CLAIM@pClaimNumber`; confirm with `validateCF5`.**
- [KI-48](#ki-48): Identifier formats (PAN, PEN, facility code) are inconsistent. **Store IDs as text; ask which facility ID each method expects.**
- [KI-59](#ki-59): RSA padding for attachments is not specified. **Use RSA PKCS#1 v1.5 like both kits; confirm.**
:::

## Summary

Detailed entries are grouped by topic below. Within each topic they are in number order, so an ID's position in the page doesn't follow the numbers exactly. The links always work.

| ID | Issue | Category | Impact | Do this |
|---|---|---|---|---|
| [KI-01](#ki-01) | Bundled public key is an expired test certificate | Outdated | High | Get the current certificate from PhilHealth |
| [KI-02](#ki-02) | QR methods were removed | Outdated | Low | Don't implement the QR methods |
| [KI-03](#ki-03) | Software certificate ID moved from a header into `pUserName` | Outdated | High | Send `pUserName=":<certificate ID>"`, no extra headers |
| [KI-04](#ki-04) | eSOA attribute renamed; "Others" category added | Outdated | Medium | Build eSOA XML from `ESOA.dtd` v0.5 |
| [KI-05](#ki-05) | CF5 laterality: blank (old) vs `N` (new) | Conflicting sources | Medium | Use `N` when no laterality applies |
| [KI-06](#ki-06) | Two different CF5 DTDs | Conflicting sources | Medium | Use the standalone `CF5.dtd`; confirm with `validateCF5` |
| [KI-07](#ki-07) | `CATARACT` element is deprecated | Outdated | Low | Use `CATARACTINFO` |
| [KI-08](#ki-08) | CF4 material is old (2019–2021) and uses a different date format | Outdated | Medium | Follow the 2021 dictionary; CF4 dates are `YYYY-MM-DD` |
| [KI-09](#ki-09) | Implementation Guide housekeeping errors | Typo | Low | Use the endpoint spellings from the URLs |
| [KI-10](#ki-10) | Migration DTD has newborn attributes not in the upload DTD | Conflicting sources | Low | Use those attributes only in migration files |
| [KI-11](#ki-11) | Dummy doctors' accreditation ends 2026-12-31; no test members | Expires 2026-12-31 | Medium | Ask PhilHealth for new test doctors and test members |
| [KI-12](#ki-12) | Two encryption schemes that are easy to confuse | Easy to confuse | High | Cipher key for payloads, public key for attachments |
| [KI-13](#ki-13) | AES padding differs between guide and demo kits | Conflicting sources | High | Zero-pad payloads; confirm attachment padding |
| [KI-14](#ki-14) | Confusing wording for the AES key derivation | Easy to confuse | Medium | AES key = raw 32-byte SHA-256 of the cipher key |
| [KI-15](#ki-15) | C# demo kit uses a fixed IV and a non-secure random generator | Security | High | Don't copy the C# kit's IV, random, or logging code |
| [KI-16](#ki-16) | PHP demo kit bugs | Bug | Medium | Use the PHP kit as a reference only |
| [KI-17](#ki-17) | `getClaimStatus` is a GET request with a body | Conflicting sources | Medium | Use a client that can send a body with GET |
| [KI-18](#ki-18) | `searchEmployer` key names don't match the sample | Conflicting sources | Medium | Test both key spellings; confirm |
| [KI-19](#ki-19) | Server date-time key casing; invalid sample JSON | Typo | Low | Read `dateTime` case-insensitively |
| [KI-20](#ki-20) | `isClaimEligible` documentation errors | Conflicting sources | Medium | Follow the sample key names; the result is JSON |
| [KI-21](#ki-21) | `generatePBEFPDF` input description and sample errors | Typo | Low | Send `accreno` and `referenceno` as JSON |
| [KI-22](#ki-22) | `getUploadedClaimsMap` parameter name | Conflicting sources | Medium | Use `receiptTicketNumber` |
| [KI-23](#ki-23) | Where `voucherNo` comes from is unclear | Gap | Medium | Treat `pVoucherNo` as optional; confirm |
| [KI-24](#ki-24) | `isDoctorAccredited` output is under-documented | Gap | Low | Parse the result defensively |
| [KI-25](#ki-25) | `docMimeType` is always shown as `text/xml` | Conflicting sources | Low | Choose the parser by method, not by `docMimeType` |
| [KI-26](#ki-26) | Token lifetime is not specified | Gap | Medium | Get a fresh token right before each call |
| [KI-27](#ki-27) | Sample hashes and ciphertexts are placeholders | Easy to confuse | Low | Test with your own round trips |
| [KI-28](#ki-28) | Some official XML samples are not well-formed | Typo | Low | Use this site's validated examples |
| [KI-29](#ki-29) | `addRequiredDocument` success result is undocumented | Gap | Low | Treat `success: true` as success |
| [KI-30](#ki-30) | The PECWS host name is not in the DevKit | Gap | High | Get the host names from PhilHealth; make the URL configurable |
| [KI-31](#ki-31) | Field lengths contradict the samples | Conflicting sources | Medium | Size columns generously; validate with PhilHealth |
| [KI-32](#ki-32) | Typos in the eClaims data dictionary (Annex C) | Typo | Medium | Use the DTD spelling |
| [KI-33](#ki-33) | eSOA data dictionary names differ from the DTD | Conflicting sources | Medium | Use the `ESOA.dtd` spelling |
| [KI-34](#ki-34) | eSOA sample numbers don't add up | Typo | Low | Use this site's consistent eSOA example |
| [KI-35](#ki-35) | CF4 listed twice in the document type codes | Typo | Low | Nothing (harmless) |
| [KI-36](#ki-36) | DRG error-code workbook is inconsistent and partly stale | Conflicting sources | Low | Use the workbook only to explain messages |
| [KI-37](#ki-37) | Migration dictionary disagrees with its DTD on occurrences | Conflicting sources | Low | Follow the DTD |
| [KI-38](#ki-38) | CF4 `pEffYear` length vs format | Typo | Low | Send a four-digit year |
| [KI-39](#ki-39) | Library spreadsheets have data-quality problems | Data quality | Medium | Load as text, match on codes, use active entries only |
| [KI-40](#ki-40) | eClaims Cloud Storage API (eCCSA) is not specified | Gap | High | Ask PhilHealth for the eCCSA specification |
| [KI-41](#ki-41) | Java encryption demo kit is missing | Gap | Low | Use the C#/PHP kits or this site's examples |
| [KI-42](#ki-42) | Errors, failure responses, and several results are undocumented | Gap | Medium | Log full responses; parse defensively |
| [KI-43](#ki-43) | The eClaims and migration DTDs break common XML validators | Tooling | High | Validate eClaims/migration XML with Java or a patched DTD |
| [KI-44](#ki-44) | `getToken` says its header values are "encrypted" | Conflicting sources | Medium | Send plain header values; confirm |
| [KI-45](#ki-45) | What goes in the CF5 `ClaimNumber` is unclear | Conflicting sources | High | Use `CLAIM@pClaimNumber`; confirm with `validateCF5` |
| [KI-46](#ki-46) | `searchCaseRates` input format and sample contradict each other | Conflicting sources | Medium | Send a JSON body; confirm |
| [KI-47](#ki-47) | Result descriptions were copied between methods | Typo | Low | Trust samples over copied descriptions |
| [KI-48](#ki-48) | Identifier formats (PAN, PEN, facility code) are inconsistent | Conflicting sources | High | Store IDs as text; ask which facility ID each method expects |
| [KI-49](#ki-49) | Date and time formats vary | Conflicting sources | Medium | Send formats exactly per the dictionary; read leniently |
| [KI-50](#ki-50) | Annex C and the eClaims DTD list different attributes | Conflicting sources | Medium | The DTD decides which attributes exist |
| [KI-51](#ki-51) | CF5 newborn weight: is 0.3 kg valid? | Conflicting sources | Low | Accept 0.3 kg and above |
| [KI-52](#ki-52) | eSOA certification criteria don't match the eSOA DTD | Conflicting sources | Medium | Capture what the form asks; map it to the DTD |
| [KI-53](#ki-53) | eSOA balance and funding-source rules are incomplete | Gap | Medium | Keep the arithmetic consistent; check with `validateeSOA` |
| [KI-54](#ki-54) | Data-migration format has undefined values and open questions | Gap | Medium | Agree the details with the other provider; confirm |
| [KI-55](#ki-55) | CF4 dictionary gaps and mismatches with its DTD | Conflicting sources | Medium | DTD for names, dictionary for values |
| [KI-56](#ki-56) | Certification form items the DevKit doesn't explain | Gap | Medium | Ask the certification team before testing |
| [KI-57](#ki-57) | Attachment format and hosting details are unspecified | Gap | Medium | HTTPS, PDF/A, lowercase hex; confirm the XML MIME type |
| [KI-58](#ki-58) | Filing deadlines differ between forms; none is given for the upload | Gap | Medium | Track days since discharge; confirm the deadlines |
| [KI-59](#ki-59) | RSA padding for attachments is not specified | Gap | High | Use RSA PKCS#1 v1.5 like both kits; confirm |
| [KI-60](#ki-60) | Cipher key format and text encoding are not specified | Gap | Medium | Use UTF-8; confirm the key's format |
| [KI-61](#ki-61) | Some methods don't say whether the request body is encrypted, or where parameters go | Gap | Medium | Follow each sample; confirm |
| [KI-62](#ki-62) | Submission rules the DevKit doesn't cover | Gap | Medium | Make retries safe; ask for the business rules |
| [KI-63](#ki-63) | CF5/DRG reference material and rules are missing | Gap | Medium | Get the DRG manuals; let `validateCF5` check codes |
| [KI-64](#ki-64) | Lookup and status methods have unstated behaviors | Gap | Low | Handle ambiguous lookup results defensively |

---

## Outdated, superseded, and conflicting versions

### KI-01: Bundled public key is an expired test certificate {#ki-01}

<Badge type="danger" text="Outdated" />

**What the sources say.** The DevKit ships one "PhilHealth public key": [`pnpki_philhealth_eclaims_auth_cert.pem`](/originals/encryption/pnpki_philhealth_eclaims_auth_cert.pem). The same file is also inside both demo kits in [`ForEncryption.zip`](/originals/encryption/ForEncryption.zip). If you inspect it with `openssl x509 -in pnpki_philhealth_eclaims_auth_cert.pem -noout -subject -issuer -dates`, you get:

| Field | Value |
|---|---|
| Subject | `CN = eclaims-test.philhealth.gov.ph, serialNumber = 100000000A, OU = TMD, O = Philhealth, C = PH` |
| Issuer | `CN = Gov Authentication Test CA, O = DOST, C = PH` |
| Valid from | 2014-09-30 08:25:06 GMT |
| Valid until | **2014-12-29 08:25:06 GMT** |
| Key | RSA 2048-bit |
| SHA-256 fingerprint | `B2:7A:95:47:8C:AA:6F:A8:68:C8:DF:72:F7:CA:48:FB:4A:05:CE:04:2D:11:A5:B6:AE:E2:58:5D:72:A2:5A:9F` |

**Why it matters.** It is a **test** certificate (host name `eclaims-test…`, issued by a *test* CA), and it expired more than ten years ago. Most encryption libraries don't check expiry when you only extract the public key, so your code will "work". But PhilHealth can only decrypt attachments encrypted with a key they still hold.

**What to do.** Ask PhilHealth for the current certificate for each environment (test and production), and store it as configuration, not in code. Use the bundled file only to try out the demo kits. See [Encrypting attachments](/guides/encryption/attachments).

### KI-02: QR methods were removed {#ki-02}

<Badge type="danger" text="Outdated" />

**What the sources say.** Revision 20240228 of the Implementation Guide added `requestQrAuthorization` and `inquireQrTrackingNo` for a QR-code use case of the eGov super app. Revision 20250217 **removed** them "as this requirement has been deferred" ([Guide, p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3); [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf)).

**What to do.** Don't implement them. If you find them in an older copy of the Guide, ignore them. See [Removed methods](/api/removed-methods).

### KI-03: Software certificate ID moved from a header into `pUserName` {#ki-03}

<Badge type="danger" text="Outdated" />

**What the sources say.** The way you send the software certificate ID to `uploadeClaims` changed three times ([Guide, p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)):

| Revision | Change |
|---|---|
| 20240418 | Added a `softwareCertId` header to `uploadeClaims`. |
| 20240910 | Added a `softwareCertifficateId` header ("to be removed on the next version"). |
| **20241111** | "The correct value of the attribute `pUserName` must be colon plus software certificate ID; Removed the `softwareCertifficateId` header." |

Only the removal of `softwareCertifficateId` is recorded. The removal of the earlier `softwareCertId` header is implied by the current `uploadeClaims` header table, which lists only `token` ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).

The eClaims XML sample on [Guide p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29) follows the new rule: `pUserName=":SOFTWARE-CERTIFICATE-ID-HERE"` and `pUserPassword=""`. However, the data dictionary in Annex C was not updated:

- It still describes `pUserName` as "Provider user id, String(20), to be provided by PhilHealth" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).
- It lists a `pCertificateId` attribute ([p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)) that does not exist in [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd).

Annex C also still gives `pUserName` a length of String(20), while the certificate number (`pCertificateId`) is String(50), so a long certificate ID might not fit.

**What to do.** Set `pUserName` to `":"` followed by your certificate ID, and do not send the old headers. `getToken` still takes the ID in its `softwareCertificateId` header, which is a different method and a different rule. See [uploadeClaims](/api/upload-eclaims) and [getToken](/api/get-token).

### KI-04: eSOA attribute renamed; "Others" category added {#ki-04}

<Badge type="danger" text="Outdated" />

**What the sources say.**

- `pActualCharges` was renamed to `pChargesNetOfApplicableVat`. This happened in [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.4 (2023-08-14) and was announced in Guide revision 20240823.
- The `Others` element and `Others` category were added in `ESOA.dtd` v0.5 (2025-02-17).
- The eSOA circular [PC 2023-0026](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=9) (Annexes A and B) uses business terms such as "Amount" and "Discount" and shows only five fee categories.
- The header comment of `ESOA.dtd` still says "Version 0.1", although its change log runs to 0.5. The declarations match the copy printed in the Guide (p. 11–12), so treat the file as v0.5.

**What to do.** Build the XML from `ESOA.dtd` v0.5. Use the circular for the policy rules, not for field names. See [eSOA XML](/reference/esoa-xml).

### KI-05: CF5 laterality: blank (old) vs `N` (new) {#ki-05}

<Badge type="warning" text="Conflicting sources" />

**What the sources say.**

- The paper [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) (v0.4, revised February 2024) says: "If there is no laterality applicable, leave the field blank."
- Both CF5 samples use `Laterality=""`: [Guide p. 18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=18) and [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml).
- Revision **20250217** "Updated the Data Dictionary of CF5 to set 'N' (None) as the valid value for Laterality". Annex E lists `L`, `R`, `B`, `N` ([Guide p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)).

**What to do.** Use `N` when laterality does not apply. It is the newest rule. See [CF5 XML](/reference/cf5-xml).

### KI-06: Two different CF5 DTDs {#ki-06}

<Badge type="warning" text="Conflicting sources" />

**What the sources say.** The Guide prints "DRG E-Claims DTD" v1.3, dated 2024-02-15 ([p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17)). The standalone [`CF5.dtd`](/originals/cf5/CF5.dtd) and the [20240604 CF5 DTD PDF](/originals/cf5/20240604_%20CF5%20DTD_DRG%20XML%20EFORMS%20FORMAT.pdf) differ from it:

| Declaration | Guide (v1.3, 2024-02-15) | Standalone `CF5.dtd` (20240604) |
|---|---|---|
| `SECONDARYDIAGS` | `(SECONDARYDIAG)`: exactly one | `(SECONDARYDIAG)*`: zero or more |
| `PROCEDURES` | `(PROCEDURE)+`: one or more | `(PROCEDURE)*`: zero or more |

The 20240604 amendment says "Remove the attributes of NewBornTimeOfBirth from CF5 XML". Neither DTD contains that attribute any more.

**Why it matters.** The data dictionary and the certification checklist both say "up to 12" secondary diagnoses and "up to 20" procedures. The Guide's DTD can't express that: it allows exactly one secondary diagnosis and requires at least one procedure.

Both official samples validate against *both* DTDs, because each has exactly one secondary diagnosis and at least one procedure. The difference only appears with zero or two-plus secondary diagnoses, or with zero procedures.

**What to do (our recommendation).** Use the standalone `CF5.dtd`. Its own revision date (20240604) is newer than the Guide's DTD (v1.3, 2024-02-15), and it matches the business rules. This compares the two DTDs' revision dates, not the documents they appear in: the Guide as a whole is newer (rev. 20250217) but still prints the older DTD. Confirm with the [`validateCF5`](/api/validate-cf5) endpoint, especially for claims with no secondary diagnosis or no procedure.

### KI-07: `CATARACT` element is deprecated {#ki-07}

<Badge type="danger" text="Outdated" />

**What the sources say.** [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) v1.8.0 (2016-09-19) added `CATARACTINFO`, which holds the pre-authorization number and the IOL sticker and expiry data. It notes: "The `CATARACT` element will be deprecated later". Both elements are still in v1.9.

**What to do.** Put cataract data in `SPECIAL/CATARACTINFO`. See [eClaims XML](/reference/eclaims-xml).

### KI-08: CF4 material is old (2019–2021) and uses a different date format {#ki-08}

<Badge type="danger" text="Outdated" />

**What the sources say.**

- The CF4 files are the oldest still in use: [`CF4.dtd`](/originals/cf4/CF4.dtd) is the "EPCB DTD Version 1.20", last changed 2019-02-26. The [data dictionary rev. 4](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf) and the [files update note](/originals/cf4/CF4_FILES_UPDATE%2802232021%29.pdf) are dated 2021-02-23, and the [CF4 form](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf) is from February 2020.
- The CF4 XML uses the DTD of PhilHealth's EPCB primary-care program, so many required attributes are "not part of the CF4, but requirement for XML validation" and take fixed default values (data dictionary).
- The 2025 [certification form](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8) still requires CF4. It turned two existing dictionary rules into certification checks: blood pressure `1/1` when BP is not available or not required and `2/2` for palpatory measurement ([dictionary p. 10–11](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=10)), and the "no medicine" (NOMED) library codes ([dictionary p. 13–14](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=13)). The 2021 files update note mentions NOMED but not the `1/1` and `2/2` values.
- CF4 dates use `YYYY-MM-DD`, while eClaims and the API use `MM-DD-YYYY`.

**What to do.** Follow the 2021 data dictionary. It still applies, and SSVTF 2025 tests some of its rules. Watch the date format when you reuse code between CF4 and eClaims. See [Building CF4](/guides/cf4) and [KI-55](#ki-55).

### KI-09: Implementation Guide housekeeping errors {#ki-09}

<Badge type="info" text="Typo" />

**What the sources say.**

- Revision 20241111 says "Moved the Annexes B to F to a different file", but the 20250217 Guide still contains Annexes A–F.
- The table of contents ([p. 5](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)) labels two entries "Annex E". The eSOA Item Library is actually Annex F ([p. 89](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89)).
- Non-endpoint names appear throughout. The revision history uses "SearchCaseRate", "GenerateToken", and "ValidateEsoa". The method prose says "EclaimsUpload method" ([p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) and "eClaimsUpload method" ([p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)). The annexes are titled "Data Dictionary eClaimsUpload" and "Data Dictionary ValidateEsoa".
- The revision history never records when `isClaimEligible` was added. It is not in the 20240215 release or in the 20240423 list of new methods; its first mention is a change in 20240823.
- In the CF5 DTD history printed on [p. 17](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=17), the 1.2 entry (2023-07-12) sits under a heading that says "Version 1.3".
- The `uploadeClaims` description says it validates attributes "based on the eClaims XML Elements Attribute Definition table" ([p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)). No table has that name; Annex C ("Data Dictionary eClaimsUpload") is presumably meant.

**What to do.** Use the endpoint spelling from each method's "Endpoint" line: `searchCaseRates`, `getToken`, `validateeSOA`, `uploadeClaims`. See [API overview](/api/).

### KI-10: Migration DTD has newborn attributes not in the upload DTD {#ki-10}

<Badge type="warning" text="Conflicting sources" />

**What the sources say.** The data-migration DTD [`eClaimsXmlForDataMigration.dtd`](/originals/data-migration/eClaimsXmlForDataMigration.dtd) (2024-11/12) adds `NCP@pNewbornHearingRegistryNo` and `NCP@pNewbornHearingScreeningTestResult (P|R|X)`. Neither attribute exists in the upload DTD `eClaimsDef.dtd` v1.9.

Both attributes are `#REQUIRED`, so every `NCP` element in a migration file must carry them, including newborn claims that were uploaded without them. Neither the migration data dictionary nor the DTD's version history mentions them, and the values `P`, `R`, and `X` are not defined anywhere.

**Why it matters.** This hints that a newer eClaims DTD may exist outside this DevKit. If you add these attributes to an upload XML, it fails validation against v1.9.

**What to do.** Only use them in migration files. Ask PhilHealth whether a newer upload DTD exists and what `P`/`R`/`X` mean. See [Data migration XML](/reference/migration-xml).

### KI-11: Dummy doctors' accreditation ends 2026-12-31; no test members {#ki-11}

<Badge type="danger" text="Expires 2026-12-31" />

**What the sources say.** [Dummy Health Care Providers and Employers](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (2024-08-01, per the PDF's metadata) lists two doctors "with Accreditation up to 12/31/2026". The table header repeats `FIRST_NAME`; the third name column is probably the last name. The TIN values are truncated (`100-123-456-`). The four employers have no stated validity date, and their number column is labeled `EMPID_NO`, not PEN. There are **no dummy members or PINs**, so you can't test `getMemberPIN` or `isClaimEligible` with DevKit data. The file also doesn't say which environment these records exist in, and the `PROF_CLASS` values (`MS`, `GP`) are not defined anywhere.

**What to do.** Expect the doctor accounts to stop working after 2026-12-31. Ask PhilHealth for new test data and for test members. See [Test data](/reference/test-data).

---

## Encryption

### KI-12: Two encryption schemes that are easy to confuse {#ki-12}

<Badge type="warning" text="Easy to confuse" />

**What the sources say.** The DevKit uses two different schemes, and they are written up in two different documents:

1. **API payloads** use the facility's **cipher key**, and `key1`/`key2` are empty ([Guide Annex A, p. 75–76](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)).
2. **Attachments** use a random password that is encrypted with **PhilHealth's public key**, and `key1`/`key2` are filled in ([Guidelines for the Encryption of e-Claim Attachments](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)).

Both produce the same six-field JSON envelope, so they look alike. The eSOA and CF5 XML files need *both*: first the cipher key to call the validator, then the public key when you attach the file to a claim ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)).

**What to do.** Read [Encryption overview](/guides/encryption/) before writing any code. (Calling this "easy to confuse" is our assessment, not a PhilHealth statement.)

### KI-13: AES padding differs between guide and demo kits {#ki-13}

<Badge type="warning" text="Conflicting sources" />

**What the sources say.**

| Source | Padding |
|---|---|
| Guide Annex A (API payloads) | "Pad the data with null character (0x00) if it is not a multiple of 16 bytes." |
| Attachment guideline (2025) | Not specified. |
| C# demo kit | `PaddingMode.Zeros`: adds nothing when the data is already a multiple of 16. |
| PHP demo kit | Custom `pad()`: pads to a multiple of **32** bytes with zeros and a final byte equal to the pad length, and always adds at least one byte. |

The demo kits' sample outputs for the same 4,496-byte PDF have encrypted payloads of 4,496 bytes (C#), 4,512 bytes (PHP), and 4,512 bytes (Java). Part II Stage 2 of the certification form checks that decrypted files match the raw files **byte by byte** ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)).

Neither kit's decrypt function handles padding cleanly. The C# decrypt leaves the zero padding in the returned string. For some input lengths, the PHP decrypt returns an empty or corrupted string, even for payloads padded exactly as Annex A describes. We tested this; see [Encryption demo kits](/reference/demo-kits).

**What to do (our recommendation).**

- For API payloads, follow Annex A: zero-pad to a multiple of 16. After decrypting a response, remove trailing `0x00` bytes. This is safe for payloads, because XML, JSON, and base64 text never end in a NUL byte.
- For attachments, **don't** strip trailing zeros blindly. The DevKit's own sample PDF (`SAMPLE_BIRTH_CERTIFICATE.orig.pdf`, 4,496 bytes) ends with 15 `0x00` bytes after `%%EOF`, so stripping them changes the file, and the SHA-256 hash and the byte-by-byte check fail. Only hash-guided unpadding (try each pad length and compare the hash) or PKCS#7 is unambiguous. Confirm the expected padding with PhilHealth before certification, and test that a decrypted file matches the original byte for byte.

See [Encrypting API payloads](/guides/encryption/api-payloads) and [Encryption demo kits](/reference/demo-kits).

### KI-14: Confusing wording for the AES key derivation {#ki-14}

<Badge type="warning" text="Easy to confuse" />

**What the sources say.** Annex A step 2 says to hash the cipher key with SHA-256, "use the first 32 bytes of the resulting hash value", and "pad with null character if … less than 32 bytes" ([p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). A SHA-256 digest is always exactly 32 bytes, so no truncation or padding ever happens. Both demo kits use the raw 32-byte digest as the AES-256 key: PHP calls `hash('sha256', $passphrase, true)`, and C# calls `SHA256.ComputeHash` on the UTF-8 bytes.

Step 1 also has a wording slip: it says to hash "the data to be decrypted", while Figure 1 on the same page and both kits hash the plaintext *before* encryption.

**What to do.** Use the **raw 32-byte digest**, not the 64-character hex string. Taking the "first 32 characters" of the hex string is a common mistake, and it produces a different key.

### KI-15: C# demo kit uses a fixed IV and a non-secure random generator {#ki-15}

<Badge type="danger" text="Security" />

**What the sources say.** In [`PhilHealthEClaimsEncryptor.cs`](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20CSharp/PhilHealthEClaimsEncryptionDemoApp/PhilHealthEClaimsEncryptor.cs), `const bool UsesDummyInitVector = true; //for debugging only` makes every IV the ASCII string `"0123456789ABCDEF"`. The demo app uses this class for **attachments as well as payloads**. The other class, `PhilHealthEClaimsDocEncryption.cs`, is not in the project's compile list. Both classes generate key and IV bytes with `System.Random`, which is not a cryptographically secure generator. Other problems:

- `DecryptPayloadDataToXml` doesn't strip the zero padding from the text it returns.
- With logging on, which every demo screen turns on, the class logs the full plaintext **and the cipher key** as hex. The key is logged because it goes through the same hashing helper, which logs its input.

**What to do.** Never copy these parts. Use a secure generator: `RandomNumberGenerator` in .NET, `crypto.randomBytes` in Node.js, `secrets`/`os.urandom` in Python, or `random_bytes` in PHP. Generate a new IV for every message, and never log keys or plaintext.

### KI-16: PHP demo kit bugs {#ki-16}

<Badge type="danger" text="Bug" />

**What the sources say.** [`PhilHealthEClaimsEncryptor.php`](/originals/encryption/demo-kits-source/Demo%20Kit%20for%20PHP/EClaimsEncryption/PhilHealthEClaimsEncryptor.php) has these problems. We ran the kit on PHP 7.4 and PHP 8.3 in Docker to confirm them.

- **Attachment encryption crashes on PHP 8.** In `encryptImageFile`, a log message joins strings with `+` instead of `.`. PHP 8.3 throws `TypeError: Unsupported operand types: string + string` after encrypting but before writing, so no `.enc` file is created. PHP 7.4 only warns, then writes the file and deletes the source file.
- **Decryption is unreliable.** `decryptUsingAES` pads the *ciphertext* before decrypting, then cuts the text at the first NUL byte. When there is no NUL byte, `if ($nullCharPos >= 0)` still passes, because `strpos` returns `false`, and the result is an empty string. In our tests on PHP 7.4 and 8.3, the kit's own output never decrypts correctly for plaintext lengths of 31 mod 32. Payloads zero-padded per Annex A decrypt correctly unless their length is an exact multiple of 16 bytes; then they almost always come back empty or with extra bytes.
- **The IV and password are reused.** `getIV()`, `getPassword1()`, and `getPassword2()` cache their random bytes in the object, so every encryption made with the same object reuses the same IV and AES password. `resetPasswordAndIV()` exists, but the demos never call it.
- **Secrets are logged.** With logging on, the cipher key (passphrase) and the derived AES key are logged.
- **The attachment demo page is unsafe to deploy.** `encryptEclaimsAttachment.php` takes server file paths from a web form, then deletes the input file. Run it locally only.
- The XML test page reads a "Cipher IV" form field that it never uses, which is harmless but misleading.
- The `else` branch of `getPassphraseHash` joins the hash *length* instead of the hash. This is dead code, because a SHA-256 digest is always 32 bytes.

Details and test results: [Encryption demo kits](/reference/demo-kits).

**What to do.** Treat the kits as a reference for the algorithm, not as production code. The tested examples on [Encrypting API payloads](/guides/encryption/api-payloads) avoid these problems.

### KI-59: RSA padding for attachments is not specified {#ki-59}

<Badge type="warning" text="Gap" />

The attachment guideline says the password halves and the IV are encrypted "using the public key provided by PhilHealth", but never names the RSA padding mode ([guideline p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). Both demo kits use **PKCS#1 v1.5**: C# calls `rsaObj.Encrypt(data, false)`, and PHP calls `openssl_public_encrypt` with its default padding. Many modern libraries default to, or recommend, OAEP instead. If you use OAEP, PhilHealth may not be able to decrypt your files.

**What to do.** Use PKCS#1 v1.5, as both kits do, and confirm with PhilHealth. See [Encrypting attachments](/guides/encryption/attachments).

### KI-60: Cipher key format and text encoding are not specified {#ki-60}

<Badge type="warning" text="Gap" />

Annex A only says that PhilHealth "issues a cipher key to the health facility for each certified software" ([p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)). It doesn't give the key's format or length, how it is delivered, or which character encoding to use when you hash the key and encrypt text. The C# kit uses UTF-8. The PHP kit hashes the string's raw bytes. Characters such as `Ñ` produce different bytes in other encodings, so the derived key or the hash would not match.

**What to do.** Treat the cipher key as an opaque string, and use UTF-8 for the key and for all XML and JSON text. Confirm the key format with PhilHealth. See [Encrypting API payloads](/guides/encryption/api-payloads).

---

## API documentation

### KI-17: `getClaimStatus` is a GET request with a body {#ki-17}

<Badge type="warning" text="Conflicting sources" />

The Guide lists the HTTP method as `GET` but also documents a JSON body, `{"serieslhionos": ["1","2"]}` ([p. 46–47](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)). Many HTTP clients, proxies, and API gateways drop or reject a body on a GET request.

**What to do.** Use an HTTP client that can send a body with GET. Python `requests`, curl (`curl -X GET -d '…'`), and Node's low-level `http.request` all can. `fetch()`, in browsers and in Node, refuses with a `TypeError`. Confirm the expected method with PhilHealth. See [getClaimStatus](/api/get-claim-status).

### KI-18: `searchEmployer` key names don't match the sample {#ki-18}

<Badge type="warning" text="Conflicting sources" />

The input table lists `philhealthno` and `employername`. The sample uses `"PEN"` and `"employerName"`, and the sample is not valid JSON (`"PEN": “123456789012,`) ([p. 62–63](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=62)). Revision 20241111 says the key names documentation was "updated", but it doesn't say which version is correct.

**What to do.** Test both spellings against the test environment, or ask PhilHealth. See [searchEmployer](/api/search-employer).

### KI-19: Server date-time key casing; invalid sample JSON {#ki-19}

<Badge type="info" text="Typo" />

The tables for `getDBServerDateTime` and `getServerDateTime` say the key is `dateTime`, but the samples use `datetime`. The `getServerDateTime` sample is also missing a comma ([p. 64–67](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)). **What to do:** read the key case-insensitively.

### KI-20: `isClaimEligible` documentation errors {#ki-20}

<Badge type="warning" text="Conflicting sources" />

On [p. 69–72](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69):

- The list of membership-type codes is printed under `pEN`. It belongs to `membershipType`.
- The "Sample encrypted JSON input payload" is wrapped in `"result"`, like an output.
- A closing note says "Decrypt the result which is an encrypted base64 PDF document". That note seems to be copied from `generatePBEFPDF`. The documented result of this method is `isok`, `referenceno`, `trackingno`, `asof`.
- Key casing varies: `memberBasicInformation`, and `PatientBasicInformation` in the table vs `patientBasicInformation` in the sample.
- The output sample is missing a comma, and the encrypted input sample is missing its outer closing brace.
- No decrypted output sample is shown, although revision 20241111 says the "sample JSON result documentation" was updated.
- Membership code `G` is printed "Employer Government" (probably *Employed* Government), here and in Annex C.
- Nothing says which result fields are filled on the initial call versus the final call, or what to do when `isok` is `NO`.

**What to do.** Follow the sample's key names, and treat the result as JSON. See [isClaimEligible](/api/is-claim-eligible).

### KI-21: `generatePBEFPDF` input description and sample errors {#ki-21}

<Badge type="info" text="Typo" />

The inputs are labeled "Parameter", but the sample is a JSON body. The sample contains `"referenceno: ""` (a missing quote), and the output sample is missing a comma ([p. 73–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=73)). See [generatePBEFPDF](/api/generate-pbef-pdf).

### KI-22: `getUploadedClaimsMap` parameter name {#ki-22}

<Badge type="warning" text="Conflicting sources" />

The description calls the parameter `receiptTicketNo`. The parameter table and revision 20241111 say it is now `receiptTicketNumber` ([p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3), [p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)). **What to do:** use `receiptTicketNumber`. See [getUploadedClaimsMap](/api/get-uploaded-claims-map).

### KI-23: Where `voucherNo` comes from is unclear {#ki-23}

<Badge type="warning" text="Gap" />

`getVoucherDetails` says `voucherNo` "should be set to the `pVoucherNo` attribute returned by the `getClaimStatus` method" ([p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). However, the `getClaimStatus` sample contains no `pVoucherNo` ([p. 47–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=47)). **What to do:** handle `pVoucherNo` as an optional field that probably appears only once a voucher exists, and confirm with PhilHealth.

### KI-24: `isDoctorAccredited` output is under-documented {#ki-24}

<Badge type="warning" text="Gap" />

The result is described as encrypted "XML text", but the listed keys look like JSON: `isaccredited`, `accrecode`, `admissiondate`, `dischargedate`, `accreditationstart`, `accreditationend`. The `isaccredited` row has no description or list of values. The table wraps two key names across lines ("accreditation / start"), so their exact spelling is uncertain. There is no output sample, and the request body is not described as encrypted ([KI-61](#ki-61)) ([p. 60–61](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=60)). See [isDoctorAccredited](/api/is-doctor-accredited).

### KI-25: `docMimeType` is always shown as `text/xml` {#ki-25}

<Badge type="warning" text="Conflicting sources" />

Every response envelope in the Guide shows `"docMimeType": "text/xml"`, even when the decrypted content is JSON (for example, `getDoctorPAN`) or a base64 PDF (`generatePBEFPDF`). So do the *request* samples with JSON content: `getDoctorPAN` (p. 50), `getMemberPIN` (p. 52), and `isClaimEligible` (p. 71). The `addRequiredDocument` sample uses `""`. Annex A says `docMimeType` should be the MIME type of the data, such as `application/json`.

**What to do.** Decide how to parse a result from the method you called, not from `docMimeType`. For requests, this site follows Annex A, which is the only normative statement: `text/xml` for XML and `application/json` for JSON. If PhilHealth's test server rejects `application/json`, switch to `text/xml`, which every Guide sample uses, and tell PhilHealth.

### KI-26: Token lifetime is not specified {#ki-26}

<Badge type="warning" text="Gap" />

The only hint is the sample message in `getToken`: "Token is valid for 20 seconds" ([p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). **What to do (our recommendation):** request a fresh token right before each call, or again whenever a call fails with an authorization error. Don't cache tokens for minutes. See [getToken](/api/get-token).

### KI-27: Sample hashes and ciphertexts are placeholders {#ki-27}

<Badge type="warning" text="Easy to confuse" />

The `hash`, `iv`, and `doc` values in the Guide's samples are shortened, contain spaces or "…", or are reused across methods. They were not produced by real encryption, so you can't use them as test vectors. Masked sample data is also inconsistent. For example, in the `getVoucherDetails` sample, the same member and hospital are masked differently in `CHARGE` and in `SUMMARY`. Its `SUMMARY` row for the doctors' fees (payee type `C`) also carries the hospital's payee code and name. To test your code, round-trip your own data, or use the demo-kit sample outputs (see [Encryption demo kits](/reference/demo-kits)).

### KI-28: Some official XML samples are not well-formed {#ki-28}

<Badge type="info" text="Typo" />

- The eClaims sample has `pHospitalEmail=email@yahoo.com` without quotes ([p. 29](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=29)).
- The "Successfully Received" `eRECEIPT` sample is missing the `>` that closes its start tag ([p. 35–36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)).

Neither will parse as written. The "Unsuccessfully Received" sample also reports errors for `pAmtActual` and `pOperationDate`, attributes that don't exist in any DTD in the DevKit, so it probably predates the current format. The official CF5 sample [`DRG XML EFORMS FORMAT.xml`](/originals/cf5/DRG%20XML%20EFORMS%20FORMAT.xml) parses, but it contains an invalid procedure code, `RvsCode="219ss20"` (7 characters with letters; Annex E allows Varchar(6)), and lists `93631` twice, which would trigger warning 507, "Procedure code has duplicate". Use the validated examples on [eClaims XML](/reference/eclaims-xml) and [CF5 XML](/reference/cf5-xml) instead.

### KI-29: `addRequiredDocument` success result is undocumented {#ki-29}

<Badge type="warning" text="Gap" />

Only two possible results are listed, and both are failures: "Claims has already been paid" and "Claims has already been denied" ([p. 42–43](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)). **What to do:** treat `success: true` as the success signal, and log `result` as text. See [addRequiredDocument](/api/add-required-document).

### KI-30: The PECWS host name is not in the DevKit {#ki-30}

<Badge type="warning" text="Gap" />

Every endpoint is written as `https://{pecws.domain}/PHIC/Claims3.0/<method>`. The actual test and production host names are not given anywhere. The only real host name in the DevKit is in the expired test certificate ([KI-01](#ki-01)), and that is not an API address. **What to do:** get the host names from PhilHealth, and make the base URL configurable.

### KI-44: `getToken` says its header values are "encrypted" {#ki-44}

<Badge type="warning" text="Conflicting sources" />

The method description says the token is generated "using the **encrypted** Accreditation Number and Sofware Certification ID of the health facility". The header table on the same page describes plain values, and no document says how or with which key the headers would be encrypted ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). **What to do:** send the plain values, as the header table says, and confirm with PhilHealth. See [getToken](/api/get-token).

### KI-46: `searchCaseRates` input format and sample contradict each other {#ki-46}

<Badge type="warning" text="Conflicting sources" />

- Revision 20240216 says the parameters changed "from object input parameters to comma separated list of input parameters". The current method section still documents a JSON object body `{icdcode, rvscode, description, targetdate}` ([p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3), [p. 37–38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)).
- The sample request searches for "DENGUE" on 02-14-2024, but the sample response lists only dialysis case rates (CR0389) and all four of their effectivity periods.
- The decrypted sample is invalid JSON: it contains a typographic quote (`"F”`).
- The input rules are unstated. It isn't said which of the four keys are required, whether filters combine with AND or OR, whether `description` matching is case-sensitive, or what an invalid `targetdate` does.
- Annex C says `pCaseRateCode` values are in a "Case Rate Library", which is not in the DevKit.

**What to do:** follow the method section (a JSON body), and confirm with PhilHealth. See [searchCaseRates](/api/search-case-rates).

### KI-47: Result descriptions were copied between methods {#ki-47}

<Badge type="info" text="Typo" />

Several output tables reuse text written for other methods, so they describe the wrong content:

- **Seven methods** describe `result.doc` as "records of the matching benefit packages. Sample XML text and the DTD of the XML text is shown below": `uploadeClaims`, `searchCaseRates`, `eClaimsFileCheck`, `getClaimStatus`, `getUploadedClaimsMap`, `getVoucherDetails`, and `searchEmployer` (p. 20, 38, 45, 47, 54, 56, 63). The wording only fits `searchCaseRates`. No such DTD is shown anywhere, and there is no DTD for the `eRECEIPT` response.
- **`getMemberPIN`'s result row** says the method returns a "PAN" (p. 51). It returns a PIN.
- **`getServerDateTime`'s field descriptions** ("Database Server", "Database current date and time") are copied from `getDBServerDateTime` (p. 64, 66).
- **`validateeSOA`'s result `doc`** is described as "the encryption of eSOA XML text" (p. 10). That is the request description; the result carries validation errors.
- **`generatePBEFPDF`** first calls its result "the JSON object containing the detailed result of the PBEF inquiry", then says it is a base64 PDF (p. 73–74).

- The `result` row is copied too. `getClaimStatus`, `getVoucherDetails`, and `searchEmployer` describe `result` as the encryption "of the XML text containing the Receipt Ticket Number and other data about the processing of the submitted e-claim data", which is `uploadeClaims`' wording (p. 46, 55, 62).

**What to do:** trust each method's samples and its purpose over these copied descriptions. Our API pages describe what each method actually returns, and flag anything uncertain.

### KI-49: Date and time formats vary {#ki-49}

<Badge type="warning" text="Conflicting sources" />

| Where | Format |
|---|---|
| eClaims XML, eSOA XML, API inputs (Annex C) | Dates `MM-DD-YYYY`; times `HH:MM:SSAM/PM` with no space, for example `01:00:00PM` |
| eRECEIPT and `getClaimStatus` samples | `00:00:00AM`, `04:46:23PM` (no space) |
| Server date-time samples | `01-01-2024 01:20:20 PM` (space before PM). The day and month are equal, so their order can't be confirmed |
| CF4 XML | `YYYY-MM-DD` ([KI-08](#ki-08)) |
| DRG error-code messages | `mm/dd/yyyy`, `mm-dd-yyyy`, `hh:mm` 24-hour, and `hh:mm a` ([KI-36](#ki-36)) |
| eClaims sample `pDeliveryTime` | `12:00AM` (no seconds) |

**What to do.** When sending, use each format's data dictionary exactly. When reading, accept both "with space" and "without space" AM/PM forms, and check a real server response on a day above 12 before assuming month-first order.

### KI-61: Some methods don't say whether the request body is encrypted, or where parameters go {#ki-61}

<Badge type="warning" text="Gap" />

`getDoctorPAN`, `getMemberPIN`, and `isClaimEligible` say "The body is in JSON format as encrypted using the cipher key of the Health Facility" ([p. 49](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=49), [p. 51](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=51), [p. 69](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=69)). The sections for `isDoctorAccredited` (p. 60), `searchEmployer` (p. 62), and `generatePBEFPDF` (p. 73) don't say, and their samples are plain JSON. `getVoucherDetails` lists `voucherNo` under "Parameter" without saying whether it goes in the query string or the body (p. 55). Revision 20241111 calls the similar parameter of `getUploadedClaimsMap` a "query parameter".

`addRequiredDocument` never names the key that encrypts its `pXML` value (the empty `key1`/`key2` suggest the cipher key), and doesn't say whether sending a document type the claim already has adds a copy or replaces it (p. 42–43).

**What to do.** Follow each method's sample: plain JSON bodies, and `voucherNo` as a query parameter. If the server rejects that, try the encrypted envelope, and confirm with PhilHealth.

### KI-64: Lookup and status methods have unstated behaviors {#ki-64}

<Badge type="warning" text="Gap" />

- **`getClaimStatus`: which "series number" to send.** The migration dictionary says `pClaimSeriesLhio` is a 13-digit claim series plus a 2-digit regional office code, so it's unclear whether the 13- or 15-digit form is expected. The DevKit also doesn't give a per-call limit or a result order. Its sample returns two entries with the same series number ([p. 46–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)).
- **`getUploadedClaimsMap`: availability.** When the mapping becomes available after an upload, and for how long.
- **`getMemberPIN`: dependents.** Whether it also finds dependents' PINs.
- **The PIN check digit.** Annex C says the last digit of a PIN is a "modulus 11 check digit", but gives no algorithm ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).
- **`isDoctorAccredited`: patients still admitted.** What `dischargedate` to send before discharge.

**What to do.** Code defensively. Handle both the 13- and 15-digit series numbers, empty results, and repeated entries. Confirm with PhilHealth.

---

## Data dictionaries and XML formats

### KI-31: Field lengths contradict the samples {#ki-31}

<Badge type="warning" text="Conflicting sources" />

| Field | Dictionary says | Sample shows |
|---|---|---|
| eClaims `CLAIM@pClaimNumber` | String(12) ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)) | `123456-20160930-2` (17 characters) |
| CF5 `DRGCLAIM@ClaimNumber` | Varchar(13), "Format: 9999999999999", "assigned to the claim upon successful submission of claim via eClaims API" ([p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)) | `300806-20221216-1-1` (Guide p. 18) and `2601` (`DRG XML EFORMS FORMAT.xml`) |
| eSOA `eSOA@pHciPan` | Varchar2(9) ([p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)) | `HXXXXX678` |
| eClaims `PROFESSIONALS@pDoctorAccreCode` | String(12), "Formatted as: '####-######-##'" (p. 81) | `1234-1527066-1` and the dummy doctors' PANs, which are all 4-7-1 digits (14 characters with dashes) |
| eClaims `CF1@pPEN` | String(12), "a unique 12 digit number" (p. 80) | `11-047400000-2` (14 characters with dashes) |
| `eRECEIPT@pTransmissionControlNumber` | String(18) (p. 85) | `1234-5601-1234-1253` (19 characters) |
| `pReceiptTicketNumber` | String(18), no format given | `1234-5601-1234` in the eRECEIPT sample, `071311000005` in `getUploadedClaimsMap` |

The facility code has the opposite problem. The samples fit their own lengths, but the same value is String(12) in Annex C (`eCLAIMS@pHospitalCode`, "For now PMCC number should be used") and Varchar(6) in Annex E (`CF5@pHospitalCode`) ([KI-48](#ki-48)).

**What to do.** Keep your database columns wider than the documented lengths. Store identifiers exactly as PhilHealth returns them, and check the real values with PhilHealth's validator endpoints. See also [KI-45](#ki-45) (CF5 claim number) and [KI-48](#ki-48) (identifier formats).

### KI-32: Typos in the eClaims data dictionary (Annex C) {#ki-32}

<Badge type="info" text="Typo" />

On [Guide p. 79–85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79):

- `pDMSTotalAmount` is "Required when `pDMSTotalAmount` = 'Y'". It should say `pDrugsMedicinesSupplies`.
- `pExamTotalAmount` is "Required when `pExamTotalAmount` = 'Y'". It should say `pExaminations`.
- `pReasonCode` `O` is described as "Patient is incapacitated". The DTD comment says "O: Other reasons. Should be specified in pReasonDesc".
- `pHasAttachedSOA` is described as "Type of Accommodation".
- `pDrying` says "Flag whether Yes (Y) or No (Y)".
- The dictionary spells `pUrineMyomectomy` and `pMemberFirstname`. The DTD spells them `pUterineMyomectomy` and `pMemberFirstName`.
- `pPatientSex` is described as "Member Sex".
- `pMemberShipType` says the values are "not limited to" the eight listed, but the DTD allows exactly those eight: `S|G|I|NS|NO|PS|PG|P`.
- The `pDiagnosticName` description is garbled for the `OTHERS` type ("… Name of Supplies for Supplies or Others for Supplies and Others").
- The DTD itself has misspellings that you must copy exactly, because the DTD is what validates: `BRACHYTHERAPHY` and `pThyroidDisaster`, which means thyroid disorder.

**What to do.** Use the DTD spelling. XML attribute names are case-sensitive.

### KI-33: eSOA data dictionary names differ from the DTD {#ki-33}

<Badge type="warning" text="Conflicting sources" />

Annex D ([p. 86–87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)) writes `pTransmittalId`, but the DTD has `pHciTransmittalId`. Annex D also capitalizes names differently: `PChargesNetOfApplicableVat`, `PSeniorCitizenDiscount`, `pPWDDIscount`, `PTotalCaseRateAmount`. It gives `pDescription` the type "Varchar (10,2)". **What to do:** use the [`ESOA.dtd`](/originals/esoa/ESOA.dtd) spelling exactly.

### KI-34: eSOA sample numbers don't add up {#ki-34}

<Badge type="info" text="Typo" />

In the eSOA sample ([p. 12–15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)), `HEMATOLOGY: CBC` has `pUnitPrice="500.00"` and `pQuantity="3"`, but `pTotalAmount="4000.00"`. Another item has `pItemCode=" 1898"`, with a leading space. The sample only shows the structure. For a consistent example, see [eSOA XML](/reference/esoa-xml).

### KI-35: CF4 listed twice in the document type codes {#ki-35}

<Badge type="info" text="Typo" />

Annex B lists `CF4 – Claim Form 4` twice ([p. 77–78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=77)). This is harmless. See [Document type codes](/reference/document-types).

### KI-36: DRG error-code workbook is inconsistent and partly stale {#ki-36}

<Badge type="warning" text="Conflicting sources" />

In [`DRG Error Codes.xlsx`](/originals/cf5/DRG%20Error%20Codes.xlsx) (created 2024-09-27, last modified 2025-02-18, according to its file properties):

- **Date formats are mixed.** Most messages ask for `mm/dd/yyyy`. The "Summary of Errors" sheet uses `mm-dd-yyyy` for some codes, `mm/dd/yyyy` for code 403, and `MM-dd-yyyy` for codes 517 and 518.
- **Time formats are mixed.** There are three: "hh:mm 24-hr" (105, 107, 223, 224), "hh:mm a (ex. 02:58 AM)" (515, 516), and eClaims' own `HH:MM:SSAM/PM`.
- **Some messages contradict themselves.** Code 204 reads "Laterality has numeric value … Laterality must be in numerical value", although laterality values are letters (`L`/`R`/`B`/`N`). The fixes for codes 219–221 have the date comparisons reversed.
- **Some codes are stale.** Codes 110, 210, and 211 check a newborn time of birth, a field removed from CF5 in 20240604 that has no eClaims equivalent. Code 514 refers to a "Series Number" removed from CF5 in DTD v1.3.
- **Codes duplicate each other.** Codes 101–109 repeat as 401–409 in the grouper sheet. The same condition is an error in one place and a warning in another (202 vs 501, 203 vs 506).
- **The ranges have gaps.** There is no 410 and no 510.
- **The workbook is unpolished.** Codes 512–514 have no fix text. An unlabeled column tags some codes "eclaims" inconsistently. The same code is worded differently across sheets. There are typos ("Secodary", "greather") and a reviewer's comment in Filipino on code 303.
- "Sheet4" looks like scratch work.
- No other DevKit document mentions this workbook, so it's not certain which step returns these codes.

**What to do.** Send dates and times exactly as each XML format's data dictionary specifies. Use the workbook to understand the messages you receive, not as a specification. See [DRG error codes](/reference/drg-error-codes).

### KI-37: Migration dictionary disagrees with its DTD on occurrences {#ki-37}

<Badge type="warning" text="Conflicting sources" />

The [data-migration dictionary](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=3) shows a `SESSIONS` → `SESSION` hierarchy under each repetitive procedure. In the [migration DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd), as in the upload DTD, `SESSIONS` is an empty element that repeats and carries `pSessionDate`, and there is no `SESSION` element.

Other occurrence counts in the dictionary's element list also disagree with the DTD:

| Element | Dictionary | DTD |
|---|---|---|
| `OFFLINEDOCUMENTS` | "only once" | optional (`?`) |
| `OFFLINEDOCUMENT` | "0 or more" | one or more (`+`) |
| `SPECIAL` | "0 or 1" | required inside `CF2` |
| `CLINICAL`, `LABDIAG` | "0 or more" | one or more (`+`) |
| `ADMITREASON`, `COURSE` | "only once" | optional |
| `ALLCASERATE`, `ZBENEFIT` | "only once" each | a choice: exactly one of the two |

The dictionary also gives `pMimeType` a length of String(3), although its own valid values (`application/pdf`, `application/xml`) are 15 characters long.

**What to do.** Follow the DTD. See [Data migration XML](/reference/migration-xml).

### KI-38: CF4 `pEffYear` length vs format {#ki-38}

<Badge type="info" text="Typo" />

In the [CF4 data dictionary](/originals/cf4/Claim_Form_4_Data_Dictionary_Revision_4%2802232021%29_ANNEX-G.pdf#page=1), `pEffYear` is VARCHAR2(4) with the description "Use the current year", but its FORMAT column says `YYYY-MM-DD`. **What to do:** send a four-digit year, for example `2026`. See [CF4 XML](/reference/cf4-xml).

### KI-39: Library spreadsheets have data-quality problems {#ki-39}

<Badge type="warning" text="Data quality" />

We found these problems when we loaded the library spreadsheets programmatically:

- **Excel damaged some values.** 36 percentage strengths are stored as fractions in [`lib_medicine_strength.xlsx`](/originals/cf4/libraries/lib_medicine_strength.xlsx) and [`lib_medicine_unit.xlsx`](/originals/cf4/libraries/lib_medicine_unit.xlsx). For example, code `00073` is `4E-5` or `4e-05`, or shows as `0.00%` in Excel, when it should be 0.004% (from "TRAVOPROST 0.004% SOLUTION").
- **The unit file is a copy of the strength list.** `lib_medicine_unit.xlsx` holds essentially the same 871 codes as the strength file.
- **Two drug codes break the pattern.** Every other drug code in the Medicine Library is 30 characters in the order Generic + Salt + Strength + Form + Unit + Package. `LOSA100000014650000000000` is only 25 characters (its form segment is missing), and `TOLNA00000CREA30008200227TUB01` has the form and strength segments swapped. The problem is identical in the eSOA library, CF4 `lib_medicine.xlsx`, and the Guide's printout.
- **Some descriptions are cut short.** Descriptions are truncated at 100 characters: 36 medicines, some cut mid-word, and 144 ICD-10 entries. Eight medicine descriptions are shared by several codes, so match on the **code**, never on the description.
- **There are duplicates and stray rows.** In `lib_icd.xlsx`, 544 codes appear more than once, almost all with different descriptions, and 25 rows are exact duplicates. It also has and some odd codes (`4660`, `E90*`). `lib_medicine_form.xlsx` has a repeated header row, and `lib_medicine_package.xlsx` has an `XXXX` placeholder. `lib_genitourinary.xlsx` puts its status legend inside the data column. Two generic codes (`BMHI`, `UREA`) are only 4 characters.
- **IDs are stored as numbers.** Several physical-exam libraries store IDs as floating-point numbers (`7.0`).

**What to do.** Load every column as **text**, so you keep leading zeros such as `00000`. Skip rows without an ID, match on codes, and check suspicious values against the Implementation Guide's printed libraries. Use only entries whose library status is active (`1`). See [CF4 libraries](/reference/libraries/cf4) and [eSOA libraries](/reference/libraries/esoa).

### KI-45: What goes in the CF5 `ClaimNumber` is unclear {#ki-45}

<Badge type="warning" text="Conflicting sources" />

**The evidence points two ways.**

| Suggests "the hospital's claim number (`CLAIM@pClaimNumber` in the eClaims XML)" | Suggests "a number PhilHealth assigns after submission" |
|---|---|
| `validateCF5` runs **before** `uploadeClaims` and receives the eClaims XML with the CF5 ([Guide p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)) | Annex E: "A reference number assigned to the claim upon successful submission of claim via eClaims API", Varchar(13), format `9999999999999` ([p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)) |
| DRG error 222: "Claim number must exist in eClaims XML (pClaimNumber 'xml attribute')" | DRG errors 512–514: "CF5 ClaimNumber not found in eClaims DB", "… already exist in CF5 DB with same series number", "Series Number not found in eClaims DB" |
| DRG error 509: CF5 `pHospitalCode` must equal the eClaims `pHospitalCode` | |
| The Guide's CF5 sample `300806-20221216-1-1` has the same shape as the eClaims sample `pClaimNumber` `123456-20160930-2` | |

**What to do (our recommendation).** Use the same value as `CLAIM@pClaimNumber` in the eClaims XML, check it with `validateCF5`, and confirm with PhilHealth. See [CF5 XML](/reference/cf5-xml) and [validateCF5](/api/validate-cf5).

### KI-48: Identifier formats (PAN, PEN, facility code) are inconsistent {#ki-48}

<Badge type="warning" text="Conflicting sources" />

- **Professional PAN** (doctor's accreditation number). Annex C says `####-######-##` (4-6-2 digits) in String(12). Every example is 4-7-1 digits: `1234-1527066-1`, `0000-0000000-0`, and the dummy doctors `1504-2400015-3` and `1100-2400002-5`. That is 14 characters with dashes. The `isDoctorAccredited` sample uses `1234567890` (10 digits, no dashes), and eSOA `pPAN` is Varchar(14).
- **PEN** (employer number). It is "a unique 12 digit number" in String(12), and it appears without dashes in the `searchEmployer` sample and in the dummy data (`110474000002`). The eClaims sample writes the same number as `11-047400000-2`.
- **Facility identifier.** `getToken` (`accreditationNo`), `isClaimEligible` (`hospitalCode`), and `generatePBEFPDF` (`accreno`) all ask for the facility's *accreditation number*. The eClaims XML `pHospitalCode` is also called an accreditation number, but "For now PMCC number should be used" (6 characters). The CF5 `pHospitalCode` is the "PMCC No." (`999999` or `X99999`). The eSOA uses `pHciPan` (9 characters, sample `HXXXXX678`). The DevKit never expands "PMCC", and never says whether the API methods expect the PAN or the PMCC number.

**What to do.** Store identifiers as text, exactly as PhilHealth issues them. Ask PhilHealth which facility identifier each method expects, and whether dashes are required. See [Glossary](/getting-started/glossary) and [KI-31](#ki-31).

### KI-50: Annex C and the eClaims DTD list different attributes {#ki-50}

<Badge type="warning" text="Conflicting sources" />

- **In the DTD but missing from Annex C** (so they have no documented length or format): `CASERATE@pCaseRateAmount`, `PROFESSIONALS@pDoctorSignDate`, and the four `CATARACTINFO` IOL sticker and expiry attributes.
- **In Annex C but not in the upload DTD:** `pClaimSeriesLhio`, `pCertificateId` ([KI-03](#ki-03)), and response attributes such as `pTransmissionControlNumber`, `pReceiptTicketNumber`, `pErrCode`, and `pReceivedDate`. Putting `pClaimSeriesLhio` in an upload XML fails validation; only the migration DTD allows it.
- **Listed twice:** `pHospitalTransmittalNo` (no length on p. 79, String(20) on p. 85).
- **Blank-name rule:** the "can be blank if `pPatientIs` = M" note covers the patient's first and middle name but not the last name.

**What to do.** The DTD decides which attributes exist; Annex C only adds lengths and rules. For `pCaseRateAmount`, use the `#######.##` format Annex C gives other amounts (our recommendation), and confirm with PhilHealth. See [eClaims XML](/reference/eclaims-xml).

### KI-51: CF5 newborn weight: is 0.3 kg valid? {#ki-51}

<Badge type="warning" text="Conflicting sources" />

Annex E says the newborn admission weight "Should be greater than 0.3 kg", so exactly 0.3 would be invalid. The CF5 form ("less than 0.3kg is considered invalid") and DRG error codes 228 ("must not be lower than 0.3 kg") and 418 ("0.3 kg and up") accept 0.3. Annex E also types the field `Numeric (2,1)`, which in SQL terms allows at most 9.9, but gives the format `##.#`. **What to do:** accept 0.3 and above with one decimal place, and let `validateCF5` confirm. See [CF5 XML](/reference/cf5-xml).

### KI-52: eSOA certification criteria don't match the eSOA DTD {#ki-52}

<Badge type="warning" text="Conflicting sources" />

The certification form asks whether your system captures these Summary of Fees elements: "Particulars, Actual Charges, **VAT Exemption**, Senior Citizen/PWD, **Case Rate 1, Case Rate 2**, Other Funding Sources, Balance". For professional fees it adds "Mandatory Discount" and "PhilHealth Benefits" ([SSVTF p. 5–6](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)). `ESOA.dtd` v0.5 has no VAT-exemption attribute and only one `PhilHealth@pTotalCaseRateAmount` per component. The referenced [SSVTF Annex B](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf) is a scanned copy of the circular's sample SOA, with five categories and no "Others". **What to do:** capture the data in your system as the form asks, map it to the DTD as shown on [Building the eSOA](/guides/esoa), and confirm the mapping with PhilHealth.

### KI-53: eSOA balance and funding-source rules are incomplete {#ki-53}

<Badge type="warning" text="Gap" />

- **Annex D's `Balance@pAmount` definition** names only five categories. It omits "Others" (added in DTD 0.5), other funding sources, and the professional-fee balance ([Guide p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)).
- **The professional-fee balance.** The circular defines it as "Amount with the Discount, PhilHealth, and HMO deducted", but its own sample also deducts other funding sources. In the DTD, `ProfessionalFee` has no `OtherFundSource`, and `PhilHealth` and `Balance` are single totals, not per-physician values ([PC 2023-0026 p. 10](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=10)).
- **The unit of measurement for drugs.** The Guide's sample gives an unlisted drug a unit of measurement (`SAMPLE UNIT`), but Annex D says to keep it blank for all drugs and medicines.
- **The success result of `validateeSOA`** is not documented.
- **Linking the eSOA to the claim.** Nothing says whether `eSOA@pHciTransmittalId` must equal `CLAIM@pClaimNumber`, the transmittal number, or something else. This site uses the claim number.
- **Relation to the eClaims amounts.** Nothing says how to split the case rate between the two `PhilHealth` elements, or whether they must equal `CASERATE@pCaseRateAmount` or the CF2 `BENEFITS` totals. The circular only requires the eSOA, CF2, and billing statement to be consistent (V.Q).
- **Edge cases.** Nothing covers:
  - a claim with no professional fees: does it count as "lacking a component" under V.N?
  - whether a stay with no drugs needs a `NOMED` line,
  - negative balances,
  - fractional quantities (`pQuantity` is Number(4,0)),
  - which number formats `validateeSOA` accepts (the Guide sample mixes `3800`, `0`, and `2000.00`).

**What to do.** Follow the DTD and Annex D. Keep your arithmetic internally consistent, and use `validateeSOA` to check. See [Building the eSOA](/guides/esoa).

### KI-54: Data-migration format has undefined values and open questions {#ki-54}

<Badge type="warning" text="Gap" />

- `OFFLINEDOCUMENT@pEncryptionUsed (N|C|P)` is required, but it is defined **only** in the DTD; the dictionary never mentions it. `N` = none, `C` = cipher key, `P` = PhilHealth public key is a reasonable guess, not a documented fact.
- The whole file must be encrypted with "the cipher key of the health facility". PhilHealth issues a cipher key "for each certified software", so the exporting and importing systems may hold different keys, and nothing says which one to use.
- `CLAIM@pClaimSeriesLhio` is required, but nothing says what to put for claims that were never uploaded.
- There are no rules for file size, splitting, naming, or delivery. `pTotalClaims` is String(3), which suggests at most 999 claims per file.

**What to do.** Agree on these details with the other service provider, and confirm with PhilHealth. See [Migrating data](/guides/data-migration) and [KI-10](#ki-10), [KI-37](#ki-37).

### KI-55: CF4 dictionary gaps and mismatches with its DTD {#ki-55}

<Badge type="warning" text="Conflicting sources" />

- **Name casing.** The dictionary writes `pEClaimID` and `pEClaimsTransmittalID`; the DTD has `pEClaimId` and `pEClaimsTransmittalId`. Use the DTD spelling.
- **`ICDS@pIcdCode` default.** The description says `000` ("Essentially well individual"), but the DEFAULT column says `0000`. `lib_icd.xlsx` contains only `000`.
- **The no-medicine record.** The dictionary also requires `pQuantity` `0` and `pTotalAmtPrice` `0.00`, which the 2021 update note omits. Neither says which `pIsApplicable` or `pGenericName` to send.
- **Missing libraries.** The dictionary names `lib_diagnostic` and `lib_management`, which are not in the DevKit. CF4 only uses their default value `0`.
- **Required data with no XML field.** The certification form's CF4 Annex A requires the HCI name, HCI address, and patient age, but the XML has no field for the HCI name or address. Age can be derived from the birth date.
- **The `pUsername` colon.** For `EPCB@pUsername`, the dictionary says "Use the EClaims Software Certificate ID". It doesn't say whether the eClaims `":"` prefix rule ([KI-03](#ki-03)) also applies here.
- **Smaller dictionary-vs-DTD differences.** `MEDICINE@pModule`: the STANDARD column says `CF4`, but VALID VALUES lists only `HAS` and `SOAP`. `ADVICE@pReportStatus` is plain CDATA, unlike every other `pReportStatus`. `PEGENSURVEY@pGenSurveyId` is CDATA, although the DTD history says `1|2`. `pPackageType` `A` means "CF4" in the DTD history but "All Case Rate" in the dictionary. `pAvailFreeService` has no DEFAULT, although its description says `X`.
- **Unanswered clinical questions.** How do you encode several physical-exam findings for one body system? `PEMISC` repeats, but nothing says what goes in its other ID attributes. Many attributes are listed with a name only, although the DTD requires all of them. What do you write when a patient has no past medical history, given that "none" and "N/A" are rejected? On which date do you compute the patient's age for the three-year blood-pressure rule? What codes do you send for a drug that is not in the library?
- **No validator or official sample.** There is no PECWS endpoint for validating CF4, and the DevKit has no official CF4 sample XML.

**What to do.** Follow the DTD for names and structure and the dictionary for values. Validate locally, and confirm the open points with PhilHealth. See [CF4 XML](/reference/cf4-xml).

### KI-63: CF5/DRG reference material and rules are missing {#ki-63}

<Badge type="warning" text="Gap" />

- **The DRG manuals.** The [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) points to "PhilHealth's DRG Manual" for valid ICD-10 and RVS codes and to the "DRG Implementation Manual" for extension-code rules. Neither is in the DevKit, so you can't check codes locally.
- **Blank values in the samples.** Annex E lists `Ext1`/`Ext2` values `1`–`9`, but both official samples send empty strings. The Guide's sample (p. 18) also has an empty procedure code, `RvsCode=""`. Nothing says whether blank is accepted when no extension applies.
- **DRG codes in the grouper sheet.** The DRG Grouper sheet of the error-code workbook gives DRG codes (`26509`, `26519`, `26539`) that nothing explains.
- **Shadow billing.** Nothing says which facilities must take part in DRG shadow billing. It also isn't said how the paper form's Part II (patient consent and thumb mark) and Part III (physician certification) are handled electronically, since the XML carries only Part I.

**What to do.** Ask PhilHealth for the DRG manuals, and let `validateCF5` check codes. Confirm before sending blank `Ext1`/`Ext2`. See [Building CF5](/guides/cf5).

---

## Validation tooling

### KI-43: The eClaims and migration DTDs break common XML validators {#ki-43}

<Badge type="danger" text="Tooling" />

**What the sources say.** Three content models in [`eClaimsDef.dtd`](/originals/eclaims-xml/eClaimsDef.dtd) are *non-deterministic*. The same three are in the [migration DTD](/originals/data-migration/eClaimsXmlForDataMigration.dtd).

```text
DISCHARGE    ((ICDCODE+, RVSCODES*) | (ICDCODE*, RVSCODES+))
PROCEDURES   ((HEMODIALYSIS?, …, IMRT?), (HEMODIALYSIS | … | IMRT))
PARTICULARS  ((DRGMED+ | XLSO+), (DRGMED* | XLSO*))
```

A non-deterministic model is one where a parser reading an element can't tell which branch of the rule it is in without looking ahead. The XML 1.0 specification (Appendix E) calls such models an error "for compatibility". Validators built on **libxml2** (Python `lxml`, `xmllint`, PHP `DOMDocument::validate`) report "Content model of DISCHARGE is not deterministic". Every eClaims file has a `DISCHARGE`, and we observed these results:

| Validator | Result for a correct eClaims file |
|---|---|
| lxml 6.1.3 (libxml2 2.14.6), xmllint/PHP with libxml2 2.13.x | **Always invalid** |
| libxml2 2.9.x (for example, Ubuntu 24.04's xmllint, PHP 7.4/8.3 on Debian) | Valid, but the order of children inside the three elements is **not checked** (false passes) |
| Java JAXP (Xerces), Java 21 | Validates correctly |

The eSOA, CF5, and CF4 DTDs are not affected.

**What to do.** Validate eClaims and migration XML with Java, or with a patched copy of the DTD. Both methods are on [Validating XML](/guides/validating-xml): [Java](/guides/validating-xml#java-recommended-for-eclaims-and-migration-xml) and the [patched DTD](/guides/validating-xml#the-eclaims-dtd-and-libxml2). PhilHealth's own [`eClaimsFileCheck`](/api/eclaims-file-check) endpoint is the final check. Never ship a validator that silently ignores these errors.

---

## Gaps (missing from the DevKit)

### KI-40: eClaims Cloud Storage API (eCCSA) is not specified {#ki-40}

<Badge type="warning" text="Gap" />

The certification form requires an "eClaims Cloud Storage API (eCCSA)" module: the ability to change or use multiple cloud storages for eClaims attachments, view attachments in NClaims, and download them ([SSVTF p. 8–9](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). The DevKit contains no specification for it. **What to do:** ask PhilHealth for the eCCSA documentation. See [Software certification](/guides/certification).

### KI-41: Java encryption demo kit is missing {#ki-41}

<Badge type="warning" text="Gap" />

[`ForEncryption.zip`](/originals/encryption/ForEncryption.zip) contains C# and PHP kits only. A Java-produced sample output (`SAMPLE_BIRTH_CERTIFICATE--UsingJava.pdf.enc`) is included, but the Java source is not.

### KI-42: Errors, failure responses, and several results are undocumented {#ki-42}

<Badge type="warning" text="Gap" />

- **Upload error codes.** A failed upload returns `REMARKS` elements with `pErrCode` and `pErrDescription` (for example `T01`, `T02`), but no list of error codes exists in the DevKit ([p. 36](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=36)). The Guide doesn't say whether `success` is `false` when the eRECEIPT contains `REMARKS`.
- **`validateCF5` has no Output section at all** ([p. 16–18](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)). Nothing says whether its result is encrypted or what it contains, although the certification form requires your system to display CF5 warnings, errors, and the validation result. For `validateeSOA`, only the error shape `{"errors": [...]}` is shown; a passing result isn't.
- **Results documented only by example.** `searchCaseRates`, `getUploadedClaimsMap`, `getClaimStatus`, `getVoucherDetails`, and `addRequiredDocument` have no field dictionaries, only examples. `eClaimsFileCheck` has no decrypted example at all. Examples of undefined values:
  - the `pStatus` values of `getClaimStatus` (only `IN PROCESS` appears),
  - the `pPayeeType` codes (`C`/`H`/`M`) and fee abbreviations of `getVoucherDetails`,
  - the `pCheckFacility*` flags of `searchCaseRates`,
  - whether `getUploadedClaimsMap` returns an array for multi-claim uploads.
- **No method documents its failures.** Nothing covers HTTP status codes, what an invalid or expired token returns, the `Content-Type` header for requests, or the time zone of returned date-times.

**What to do.** Log the full decrypted responses (without secrets). Display `pErrDescription` and any error text to users. Write parsers that tolerate missing fields and both single-object and array shapes. Send `Content-Type: application/json` for JSON bodies (our recommendation), and confirm the details with PhilHealth.

### KI-56: Certification form items the DevKit doesn't explain {#ki-56}

<Badge type="warning" text="Gap" />

Several items in the [Software Solution Validation Test Form](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) refer to processes that no DevKit document describes:

- "send the RAW Image via email", and "retrieve the XML in the eClaims database using the RTN/TCN" (no PECWS method returns uploaded XML).
- The "PBEF validator" and the PBEF "prescribed format".
- "exclude Personally Identifiable Information (PII)" (undefined; claim XML necessarily contains names and PINs).
- "NClaims Web".
- The eCCSA module ([KI-40](#ki-40)).
- The Data Migration module: which file the evaluator supplies for the import test, and which cipher key protects it ([KI-54](#ki-54)).
- Where the PBEF goes: Annex B has no document type for it; the closest is COE, "Certificate of Eligibility".

The form also asks whether *your* system "generate[s] the Transmission Control Number", while Annex C says PhilHealth generates it. Stage 2 compares the decrypted "raw eClaims XML" (not an attachment) and doesn't list CF4. The CF5 laterality item mentions left, right, or both but not `N` ([KI-05](#ki-05)).

**What to do.** Ask PhilHealth's certification team what each item expects before your test cycle. See [Software certification](/guides/certification).

### KI-57: Attachment format and hosting details are unspecified {#ki-57}

<Badge type="warning" text="Gap" />

- **`docMimeType` for XML attachments** (CF4, CF5, eSOA) is not given: `text/xml` or `application/xml`? The attachment guideline only shows `application/pdf`. The migration dictionary uses `application/xml`, and API payloads use `text/xml`.
- **The hash format.** Neither Annex A nor the guideline says the SHA-256 hash is lowercase hex; that is only inferred from the demo kits and samples.
- **Hosting.** Nothing covers authentication, retention, or allowed hosts for the HTTPS URLs where you publish encrypted attachments ([KI-40](#ki-40)).
- **A wrong cross-reference.** Annex C's `pDocumentURL` row says "Please see the Annex for the guidelines for encryption", but the Guide's only encryption annex (Annex A) covers the *cipher-key* scheme, not the public-key scheme.
- **Samples use `http://`.** The `addRequiredDocument` sample URLs start with `http://`, although Annex C requires HTTPS.
- **An Excel document type.** Annex B still lists `ITX`, "Itemized Billing (MS Excel Format)", but the 2025 guideline allows only PDF or XML attachments.

**What to do.** Use HTTPS URLs, PDF/A for scanned documents, and lowercase hex hashes. Choose one XML MIME type and confirm it with PhilHealth. See [Encrypting attachments](/guides/encryption/attachments).

### KI-58: Filing deadlines differ between forms; none is given for the upload {#ki-58}

<Badge type="warning" text="Gap" />

The paper [CF4 form](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf) (February 2020) says it "should be filed within sixty (60) calendar days from date of discharge". The [CF5 form](/originals/cf5/DRG-Claim-Form.xlsx-CF5-Shadow-Billing.pdf) (v0.4, February 2024) says "within thirty (30) calendar days from date of discharge". Neither the Implementation Guide nor PC 2023-0026 gives a deadline for the `uploadeClaims` transmission itself. The Guide only says the transmission date counts as the official date received ([p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19)).

**What to do.** Show the discharge date and days elapsed in your claims queue, and alert users well before 30 days. Confirm the applicable filing period with PhilHealth. See [The claims lifecycle](/getting-started/claims-lifecycle).

### KI-62: Submission rules the DevKit doesn't cover {#ki-62}

<Badge type="warning" text="Gap" />

The DevKit is silent on several rules that affect how you build and send claims:

- **Duplicates and retries.** How PECWS treats a second upload of the same claim (`pClaimNumber`) or transmittal (`pHospitalTransmittalNo`), and whether a rejected transmittal number can be reused. Annex C only says both "should be unique per hospital" ([p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)). This matters when an upload times out and you don't know whether it arrived.
- **Required documents.** Which supporting documents each benefit or claim type needs. Annex B only lists the codes.
- **CF3.** When CF3 is required, and whether to use `CF3_OLD` or `CF3_NEW`.
- **`CF2@pHasAttachedSOA`.** Whether it must be `Y` when an eSOA (`ESA`) is attached.
- **Encoding and DOCTYPE.** The XML character encoding, and whether uploads may include a `DOCTYPE`. The DTD's `&Ntilde;` entity only works when the DTD is loaded.
- **The PBEF.** Whether and how the PBEF from `generatePBEFPDF` is attached to a claim. Annex B has no PBEF code ([KI-56](#ki-56)).
- **Validating before upload.** Whether the eClaims XML sent to `validateCF5` must already contain the final `DOCUMENTS` entries and be identical to the file uploaded later ([p. 16](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=16)).

**What to do.** Make retries safe. Store every eRECEIPT, and use `getUploadedClaimsMap` for any Receipt Ticket Number (RTN) you did receive. After a timeout with no RTN, don't re-send until PhilHealth confirms how duplicates are handled. Use UTF-8, and write `Ñ` as the literal character or `&#209;`. Ask PhilHealth for the business rules. See [Submitting a claim](/guides/submitting-a-claim).

---

## Found another problem?

Use the "Suggest a change to this page" link at the bottom of any page, and include the original file name and PDF page number.
