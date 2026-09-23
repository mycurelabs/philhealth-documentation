---
title: Removed methods
description: requestQrAuthorization and inquireQrTrackingNo were added in revision 20240228 and removed in 20250217. Don't implement them.
---

# Removed methods

<Badge type="danger" text="Outdated" />

Two PhilHealth eClaims Web Service (PECWS) methods, `requestQrAuthorization` and `inquireQrTrackingNo`, appeared in earlier revisions of the Implementation Guide. They were **removed in revision 20250217**. This page explains where they came from, why you shouldn't implement them, and how to recognize an outdated copy of the Guide.

::: info Sources
- [Implementation Guide (rev. 20250217), p. 3–4: Revision history (entries 20240228 and 20250217)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 5: Table of contents (the 19 current methods)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)
- [DevKit Revision History (rev. 20250217), p. 1](/originals/implementation-guide/DevKit%20Revision%20History.pdf#page=1)
- [ESOA.dtd](/originals/esoa/ESOA.dtd) (version comment 0.5, 2025-02-17: the "Others" element and category)
- [Software Solution Validation Test Form (rev. 20250217)](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf) (checked: it doesn't mention these methods)
:::

## Summary

| Method | Added | Removed | Reason given | What to do |
|---|---|---|---|---|
| `requestQrAuthorization` | Rev. 20240228 | Rev. 20250217 | "this requirement has been deferred" | Don't implement |
| `inquireQrTrackingNo` | Rev. 20240228 | Rev. 20250217 | "this requirement has been deferred" | Don't implement |

See also [KI-02](/known-issues#ki-02).

## History

### Added in revision 20240228

The Guide's revision history says ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)):

> **20240228** · Added the requestQrAuthorization and inquireQrTrackingNo methods for the implementation of a use case for QR code of the eGov super app in the PhilHealth claims processing

That is all the 20250217 DevKit says about their purpose: a QR-code use case involving the eGov super app. The current DevKit contains no endpoint details, parameters or samples for either method.

### Removed in revision 20250217

The same revision history, and the separate DevKit Revision History file, both say:

> **20250217** · Removed the requestQrAuthorization and inquireQrTrackingNo methods as this requirement has been deferred.

([Guide p. 4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4); [DevKit Revision History p. 1](/originals/implementation-guide/DevKit%20Revision%20History.pdf#page=1))

The 20250217 table of contents lists exactly 19 methods, and neither of these is among them ([Guide p. 5](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)). The current list is in the [API overview](/api/#all-19-methods-at-a-glance).

## What this means for you

- **Don't implement them.** They are not part of the current PECWS 3.0 specification.
- **They are not needed for certification.** The 20250217 Software Solution Validation Test Form (SSVTF) doesn't mention QR codes, the eGov super app, or these methods. See [Software certification](/guides/certification).
- **If you already built them**, remove or disable the calls. Recommendation (not from PhilHealth): put any leftover code behind a feature flag that is off by default, so no production workflow depends on endpoints that may no longer exist.
- **"Deferred" is not "cancelled".** PhilHealth may bring the requirement back in a future revision, possibly in a different form. Don't reuse old specifications. Wait for a new DevKit revision, and confirm with PhilHealth.

## Older copies of the Guide still describe them

Guides from revision 20240228 up to 20241111 came out after the methods were added and before they were removed, so based on the revision history they would still describe these methods. Those older copies are **not** part of this DevKit, but they still circulate between developers.

Check which revision you have. The cover page of the current Guide says **"PECWS v3.0 20250217"** ([Guide p. 1](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=1)), and the last row of its revision history is 20250217.

An older Guide is outdated in other ways too. Here are the main changes the revision history lists after 20240228 that affect what you build ([Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). This isn't the whole history. See [Revision history](/changelog) for every entry.

| An older Guide may say | Current rule | Changed in | See |
|---|---|---|---|
| Send `softwareCertId` (20240418) or `softwareCertifficateId` (20240910) as a header on `uploadeClaims` | Don't send these headers. Put `":"` plus the software certificate ID in `eCLAIMS@pUserName`. | 20241111 (removed `softwareCertifficateId`; the current header table on [p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19) lists only `token`) | [KI-03](/known-issues#ki-03) |
| eSOA attribute `pActualCharges` | `pChargesNetOfApplicableVat` | 20240823 | [KI-04](/known-issues#ki-04) |
| `isClaimEligible` attribute `memberpPIN` | `memberPIN` | 20240910 | [isClaimEligible](/api/is-claim-eligible) |
| Older `patientIs` values in `isClaimEligible` | `M` (member/self), `S` (spouse), `C` (child), `P` (parent) | 20240823 | [isClaimEligible](/api/is-claim-eligible) |
| `getUploadedClaimsMap` query parameter `ReceiptTicketNo` | `receiptTicketNumber` | 20241111 | [KI-22](/known-issues#ki-22) |
| `addRequiredDocument` body format | "The body should be a raw JSON" | 20241111 | [addRequiredDocument](/api/add-required-document) |
| Older key names for `isDoctorAccredited` and `searchEmployer`, and older `isClaimEligible` and `generatePBEFPDF` documentation | "updated the key names documentation" (`isDoctorAccredited`, `searchEmployer`); `isClaimEligible` gained a definition for `hospitalCode` and an updated sample JSON result; `generatePBEFPDF` "updated the documentation" | 20241111 | [isDoctorAccredited](/api/is-doctor-accredited), [searchEmployer](/api/search-employer) ([KI-18](/known-issues#ki-18)), [isClaimEligible](/api/is-claim-eligible) ([KI-20](/known-issues#ki-20)), [generatePBEFPDF](/api/generate-pbef-pdf) ([KI-21](/known-issues#ki-21)). The current documentation of the last three still has errors. |
| CF5 `Laterality` left blank when not applicable | `N` (None) is the valid value | 20250217 | [KI-05](/known-issues#ki-05) |
| Older eSOA data dictionary and DTD | "Revised the Data Dictionary and Document Type Definition (DTD) of eSOA". The current `ESOA.dtd` (v0.5) adds the `Others` element and category. | 20250217 | [KI-04](/known-issues#ki-04) |
| Old eSOA Drug and Medicine Library | "Changed the Drug and Medicine Library for eSOA" | 20250217 | [eSOA libraries](/reference/libraries/esoa) |

::: warning The revision history is incomplete
The revision history doesn't record every method's arrival. For example, `isClaimEligible` is first mentioned in revision 20240823, where its `patientIs` values change. No entry says when the method itself was added. It isn't in the 20240215 initial release or the 20240423 list of added methods ([Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). So you can't use the history alone to tell which methods an older Guide describes. Compare that Guide's own table of contents with the 19 current methods instead. See [KI-09](/known-issues#ki-09).
:::

For the full, consolidated history, see [Revision history](/changelog).

## Common mistakes

- **Building from a Guide found online or passed along by a colleague** without checking its revision date. Always compare it with the 20250217 Guide in this DevKit.
- **Treating the eGov super app QR flow as a certification requirement.** It isn't in the 20250217 SSVTF.
- **Guessing endpoint details** for `requestQrAuthorization` or `inquireQrTrackingNo` from their names. The current DevKit specifies nothing about them.

## Related pages

- [API overview and conventions](/api/): the 19 current methods
- [Revision history](/changelog)
- [How to read these docs](/getting-started/how-to-read): source precedence rules
- [Known issues: KI-02](/known-issues#ki-02)
