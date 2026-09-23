---
title: Overview
description: What PECWS 3.0 is, what is in PhilHealth's DevKit, what you need from PhilHealth before you start, and how this site is organized.
---

# Overview

This site helps developers connect a hospital's information system to **PhilHealth's electronic claims system**. It explains the PhilHealth e-Claims Web Service version 3.0 (**PECWS 3.0**) in plain language, and links every statement to the original DevKit files.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 1–7](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)
- [DevKit Revision History](/originals/implementation-guide/DevKit%20Revision%20History.pdf)
- [Software Solution Validation Test Form for PECWS 3.0 (rev. 20250217)](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf)
:::

## What is PECWS?

**PhilHealth** (Philippine Health Insurance Corporation) is the national health insurer of the Philippines. When a PhilHealth member is treated in an accredited **health facility (HF)**, the facility files a **claim** with PhilHealth to be paid for the covered part of the bill.

PhilHealth has run its **Electronic Claims (eClaims)** system since 2016 for the **All Case Rates (ACR)** payment scheme ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6)). The **Universal Health Care (UHC) Act of 2019** requires PhilHealth to move to paying providers by **Diagnosis-Related Groups (DRG)**. PECWS 3.0 is the enhanced eClaims web service that also collects the data needed for DRG grouping.

In practice, **PECWS is an HTTPS API**. Your hospital information system (HIS) or electronic medical record system (EMR) calls it to:

- check whether a patient is eligible for PhilHealth benefits,
- look up members, doctors, employers, and case rates,
- validate and submit claims (as encrypted XML), with encrypted supporting documents,
- track claim status and payments.

The Guide describes the API as "the gateway through which healthcare institutions and service providers can connect to and communicate with PhilHealth's infrastructure" ([Guide p. 7](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)).

## Who this is for

- **In-house developers** at hospitals and other health facilities.
- **IT service providers** that sell HIS/EMR software to health facilities. PhilHealth must certify your software before it can submit claims; see [Software certification](/guides/certification).

You should know HTTP, JSON, XML, and one programming language. You do **not** need to know PhilHealth terms, DTDs, or cryptography yet. The [Glossary](/getting-started/glossary) and the [Encryption guides](/guides/encryption/) cover those.

## What you need before you start

The DevKit assumes you already have these, and none of them are in the DevKit files. (Its only certificate is an expired test certificate.) Most come from PhilHealth; the facility's PAN and PMCC number come from the health facility. [Prerequisites](/getting-started/prerequisites) has the full checklist, including test-environment access, what you set up yourself, a request list for PhilHealth, and what you can build while you wait.

| Item | Used for | Where it's documented |
|---|---|---|
| The facility's **PhilHealth Accreditation Number (PAN)** | `getToken` header `accreditationNo` | [getToken](/api/get-token) |
| A **software certificate ID** for PECWS 3.0, issued when your software passes certification | `getToken` header; `pUserName` in the eClaims XML | [getToken](/api/get-token), [KI-03](/known-issues#ki-03) |
| The facility's **cipher key**, issued per certified software | Encrypting API request and response payloads | [API payload encryption](/guides/encryption/api-payloads) |
| PhilHealth's current **public-key certificate** | Encrypting attachments (PDF, CF4, CF5, eSOA files) | [Attachment encryption](/guides/encryption/attachments), [KI-01](/known-issues#ki-01) |
| The **PECWS host names** for test and production | Every API call (`https://{pecws.domain}/PHIC/Claims3.0/...`) | [API overview](/api/), [KI-30](/known-issues#ki-30) |
| Specs for the **eClaims Cloud Storage API (eCCSA)** | A required certification module | [KI-40](/known-issues#ki-40) |
| The facility's **PMCC number** | `eCLAIMS@pHospitalCode` and `CF5@pHospitalCode` ("For now PMCC number should be used") | [KI-48](/known-issues#ki-48) |
| **Test members (PINs)**, and which environment the dummy doctors work in | Testing `isClaimEligible` and `getMemberPIN`. The DevKit has no test members. | [Test data](/reference/test-data), [KI-11](/known-issues#ki-11) |

::: danger The bundled public key is expired
The DevKit's `pnpki_philhealth_eclaims_auth_cert.pem` is a **test** certificate that expired on **2014-12-29**. Get the current certificate from PhilHealth. See [KI-01](/known-issues#ki-01).
:::

## What's in the DevKit

PhilHealth distributes the DevKit as one zip file. You can [download the complete original bundle](/originals/philhealth-docs.zip) or browse the files individually in [Original source files](/sources/). The contents fall into these groups:

| Topic | Main files | Covered on this site |
|---|---|---|
| The API | Implementation Guide (188 pages), DevKit Revision History | [API reference](/api/) |
| Claim XML (CF1/CF2 data) | `eClaimsDef.dtd`, NetBeans validation how-to | [eClaims XML](/reference/eclaims-xml), [Validating XML](/guides/validating-xml) |
| Electronic Statement of Account (eSOA) | `ESOA.dtd`, circular PC 2023-0026, item and medicine libraries | [Building the eSOA](/guides/esoa), [eSOA XML](/reference/esoa-xml) |
| Claim Form 5 (CF5, DRG data) | `CF5.dtd`, DRG sample XML, CF5 form, DRG error codes | [Building CF5](/guides/cf5), [CF5 XML](/reference/cf5-xml) |
| Claim Form 4 (CF4, clinical data) | `CF4.dtd`, data dictionary, form, 16 code libraries | [Building CF4](/guides/cf4), [CF4 XML](/reference/cf4-xml) |
| Encryption | Attachment-encryption guideline, public key, C# and PHP demo kits | [Encryption](/guides/encryption/) |
| Switching software vendors | Data-migration DTD and data dictionary | [Data migration](/guides/data-migration) |
| Certification | Software Solution Validation Test Form (SSVTF) and annexes | [Software certification](/guides/certification) |
| Testing | Dummy doctors and employers | [Test data](/reference/test-data) |

## How this site is organized

This site follows the common "tutorials / how-to guides / reference / explanation" structure used by many developer documentation sites:

- **Getting started** explains the concepts. Start here.
- **Guides** give task-oriented steps: encrypting, building each XML file, submitting a claim, validating, migrating, and getting certified.
- **API reference** has one page per PECWS method, in the same layout on every page.
- **XML & data reference** covers every XML format, code table, and library, field by field.
- **Resources** holds the [original files](/sources/), the [known issues register](/known-issues), and the [revision history](/changelog).

Before you trust any single statement, read [How to read these docs](/getting-started/how-to-read). It explains the status badges and which official document wins when two of them disagree.

## Next steps

Follow the [suggested reading order](/getting-started/how-to-read#suggested-reading-order-for-new-developers). In short:

1. [Prerequisites](/getting-started/prerequisites): what you need before you can call PECWS.
2. [How to read these docs](/getting-started/how-to-read): badges, sources, and which document wins.
3. [The claims lifecycle](/getting-started/claims-lifecycle): how the pieces fit together.
4. [Encryption overview](/guides/encryption/): almost every API call depends on it.
5. [API overview & conventions](/api/), then [Submitting a claim](/guides/submitting-a-claim) end to end.
