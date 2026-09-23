---
title: eSOA XML reference
description: Element-by-element reference for the electronic Statement of Account (eSOA) XML defined by ESOA.dtd v0.5, merged with the Annex D data dictionary, plus the raw DTD, its version history and a DTD-valid sample.
---

# eSOA XML reference

<Badge type="tip" text="Current: ESOA.dtd v0.5 (2025-02-17)" /> <Badge type="warning" text="Conflicting sources" />

This page describes every element and attribute of the electronic Statement of Account (eSOA) XML. It merges the structure from the Document Type Definition (DTD) file [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5 with the lengths, formats and rules from the Annex D data dictionary. Use it while you write the code that generates the eSOA. For the policy, the workflow and how to compute the amounts, read [Building the eSOA](/guides/esoa) first.

::: info Sources
- [`ESOA.dtd`](/originals/esoa/ESOA.dtd) (change log up to v0.5, 2025-02-17)
- [Implementation Guide (rev. 20250217), p. 9–15: `validateeSOA`, printed eSOA DTD, sample XML](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)
- [Implementation Guide, p. 86–87: Annex D, "Data Dictionary ValidateEsoa"](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)
- [Implementation Guide, p. 130: Annex F, Category Library](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=130)
- [Implementation Guide, p. 3–4: revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) and [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf)
- [Implementation Guide, p. 81: Annex C, CF2 `CONSUMPTION` attributes](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) (how the sample's amounts tie to the claim)
- [PhilHealth Circular (PC) 2023-0026, Annex A, p. 9–11](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=9) (business definitions of the amounts)
- [`Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx) and [`Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx) (codes in the sample)
- [Dummy Health Care Providers and Employers.pdf](/originals/test-data/Dummy%20Health%20Care%20Providers%20and%20Employers.pdf) (physician PAN in the sample)
:::

"Annex C", "Annex D" and "Annex F" on this page are the Implementation Guide's annexes. The circular's annexes are always written "PC 2023-0026 Annex A/B" ([How to read these docs](/getting-started/how-to-read)).

## TL;DR

- Build the XML from [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5: root `eSOA` with `SummaryOfFees`, `ProfessionalFees` and `ItemizedBillingItems`, in that order.
- All data is in attributes, and **every attribute is required**. Send `""` or `0.00` when a value doesn't apply.
- All six category elements are required, including `Others`, even when a category has no charges.
- Use the DTD spelling of every name, not the Annex D spelling ([KI-33](/known-issues#ki-33)).
- Dates are `mm-dd-yyyy` ([KI-49](/known-issues#ki-49)). Amounts are plain decimals such as `2000.00`.
- The DTD can't check amounts or lengths. Check the arithmetic yourself ([KI-53](/known-issues#ki-53)), then call [`validateeSOA`](/api/validate-esoa).
- Start from the [sample](#sample): unofficial but DTD-valid, and the eSOA of the same example claim as this site's eClaims and CF4 examples.

## At a glance

| Property | Value |
|---|---|
| Root element | `eSOA` |
| Authoritative definition | [`ESOA.dtd`](/originals/esoa/ESOA.dtd). The copy printed in the Guide (p. 11–12) has identical declarations. |
| Namespace | None |
| `DOCTYPE` | The Guide's sample has none. Validate by passing the DTD to your validator (see [Validating XML](/guides/validating-xml)). The DevKit doesn't say whether a `DOCTYPE` or a particular character encoding is accepted; [KI-62](/known-issues#ki-62) records the same question for the eClaims XML. Our sample uses UTF-8 ([KI-60](/known-issues#ki-60)). |
| Content of elements | Every element is either a container or `EMPTY`. All data is in **attributes**. |
| Attributes | **All `#REQUIRED`.** Send `""` or `0.00` when a value doesn't apply. |
| Enumerated attributes | Only `ItemizedBillingItem@pCategory` |
| Dates | `mm-dd-yyyy` (Annex D), for example `06-30-2021` |
| Amounts | Plain decimal numbers such as `2000.00`, within the Annex D sizes (for example Number(10,2) = `0.00` to `99999999.99`) |
| How it is sent | Encrypted with the health facility's (HF's) cipher key for [`validateeSOA`](/api/validate-esoa). Encrypted with PhilHealth's public key as a document of type `ESA` attached to the eClaims XML. See [Building the eSOA](/guides/esoa#developer-workflow). |

## Element tree

`?` = optional, `*` = zero or more, `+` = one or more. Elements without a marker occur exactly once. Order matters.

```text
eSOA                                   @pHciPan @pHciTransmittalId
├── SummaryOfFees
│   ├── RoomAndBoard
│   │   ├── SummaryOfFee               @pChargesNetOfApplicableVat @pSeniorCitizenDiscount
│   │   │                              @pPWDDiscount @pPCSO @pDSWD @pDOHMAP @pHMO
│   │   └── OtherFundSource *          @pDescription @pAmount
│   ├── DrugsAndMedicine               (SummaryOfFee, OtherFundSource*)
│   ├── LaboratoryAndDiagnostic        (SummaryOfFee, OtherFundSource*)
│   ├── OperatingRoomFees              (SummaryOfFee, OtherFundSource*)
│   ├── MedicalSupplies                (SummaryOfFee, OtherFundSource*)
│   ├── Others                         (SummaryOfFee, OtherFundSource*)      added in v0.5
│   ├── PhilHealth                     @pTotalCaseRateAmount
│   └── Balance                        @pAmount
├── ProfessionalFees
│   ├── ProfessionalFee *
│   │   ├── ProfessionalInfo           @pPAN @pFirstName @pMiddleName @pLastName @pSuffixName
│   │   └── SummaryOfFee               (same 7 attributes as above; no OtherFundSource here)
│   ├── PhilHealth                     @pTotalCaseRateAmount
│   └── Balance                        @pAmount
└── ItemizedBillingItems
    └── ItemizedBillingItem +          @pServiceDate @pItemCode @pItemName @pUnitOfMeasurement
                                       @pUnitPrice @pQuantity @pTotalAmount @pCategory
```

The three children of `eSOA` are the "three (3) major components" of PhilHealth Circular 2023-0026. A claim that lacks any of them is returned to the health facility (V.N).

## How to read the attribute tables

- **Required by DTD**: always "Yes (`#REQUIRED`)". The attribute must be present, but the DTD does not stop it from being empty.
- **Type / length**: the DTD type is `CDATA` (free text) for everything except `pCategory`. The length comes from Annex D. Annex D uses database-style sizes: Number(10,2) means up to 10 digits in total, 2 of them after the decimal point.
- **Valid values / format**: from the "Valid Values" column of Annex D, or the DTD enumeration.
- The DTD cannot check numbers, dates or lengths. Those rules are enforced, if at all, by PhilHealth's [`validateeSOA`](/api/validate-esoa). Check them yourself before sending.
- Annex D spells several names differently from the DTD. **XML is case-sensitive, so use the DTD spelling** ([KI-33](/known-issues#ki-33)). The differences are listed in [Annex D vs DTD names](#annex-d-vs-dtd-names).

Abbreviations in the Source column: **DTD** = [`ESOA.dtd`](/originals/esoa/ESOA.dtd); **D86**, **D87** = [Annex D p. 86](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86) / [p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87).

## `eSOA` (root)

Content: `(SummaryOfFees, ProfessionalFees, ItemizedBillingItems)`, all three required, in this order.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pHciPan` | Yes | CDATA; Varchar2(9) | Not specified. Guide sample: `HXXXXX678` | "The accreditation number issued by PhilHealth to the health facility" | DTD, D86 |
| `pHciTransmittalId` | Yes | CDATA; Varchar2(50) | Unique | "A UNIQUE reference number assigned to the claim by the submitting health facility". Annex D calls it `pTransmittalId`. | DTD, D86 |

"Hci" probably refers to "healthcare institution (HCI)", the former term for a health facility (PC 2023-0026 IV.C); the DevKit doesn't expand it.

- **`pHciPan`** is the facility's accreditation number. The DevKit uses several facility identifiers (the PAN, the PMCC number) and doesn't say which one each API method expects ([KI-48](/known-issues#ki-48)). Its length, Varchar2(9), fits the Guide's sample `HXXXXX678` and the `H12345678` in our example ([KI-31](/known-issues#ki-31)).
- **`pHciTransmittalId`**: the DevKit does not say whether it must equal a number in the eClaims XML, such as `CLAIM@pClaimNumber` or `eTRANSMITTAL@pHospitalTransmittalNo` ([KI-53](/known-issues#ki-53)). Our [sample](#sample) uses the example claim's `CLAIM@pClaimNumber` (`202609170001`). That is our choice, not a PhilHealth rule. Confirm with PhilHealth.

## `SummaryOfFees`

Content: `(RoomAndBoard, DrugsAndMedicine, LaboratoryAndDiagnostic, OperatingRoomFees, MedicalSupplies, Others, PhilHealth, Balance)`. It has no attributes.

This is the health facility's (hospital's) part of the bill. **All six category elements are required**, even when a category has no charges. In that case send a `SummaryOfFee` with every amount `0.00`, as `Others` does in the [sample](#sample).

### Category elements

`RoomAndBoard`, `DrugsAndMedicine`, `LaboratoryAndDiagnostic`, `OperatingRoomFees`, `MedicalSupplies`, `Others`

Content of each: `(SummaryOfFee, OtherFundSource*)`, meaning one `SummaryOfFee` followed by zero or more `OtherFundSource`. They have no attributes.

The element names equal the `cat_id` values of the Annex F Category Library (billtype `I`, "HEALTH CARE INSTITUTION") and the `pCategory` values of itemized lines. `Others` was added in DTD v0.5. The DevKit does not define which charges belong in `Others`. See [eSOA libraries](/reference/libraries/esoa#b-category-library).

### `SummaryOfFee`

`EMPTY`. It appears inside each category element **and** inside each `ProfessionalFee`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pChargesNetOfApplicableVat` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "Refed to the total charges net of applicable vat". Named `pActualCharges` before DTD v0.4 ([KI-04](/known-issues#ki-04)). Annex D spells it `PChargesNetOfApplicableVat`. | DTD, D86 |
| `pSeniorCitizenDiscount` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of senior citizen (SC) discount, if applicable". Annex D: `PSeniorCitizenDiscount`. | DTD, D86 |
| `pPWDDiscount` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of Person with Disability (PWD) discount, if applicable". Annex D: `pPWDDIscount`. | DTD, D86 |
| `pPCSO` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of Philippine Charity Sweepstakes Office (PCSO) discount, if applicable" | DTD, D86 |
| `pDSWD` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of Department of Social Welfare and Development (DSWD) discount, if applicable" | DTD, D86 |
| `pDOHMAP` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of Department of Health (DOHMAP) discount, if applicable". The Annex F sub-category library lists "DOH MEDICAL ASSISTANCE PROGRAM". | DTD, D86 |
| `pHMO` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of HMO discount, if applicable". HMO means health maintenance organization. | DTD, D86 |

The seven attributes appear in the same order as the seven entries of the Annex F Sub-Category Library ("ACTUAL CHARGES", "SENIOR CITIZEN DISCOUNT", "PWD DISCOUNT", ...). The Guide does not say how the two relate.

### `OtherFundSource`

`EMPTY`. Zero or more per category element, after the `SummaryOfFee`. Use it for funding that has no dedicated attribute. PC 2023-0026 Annex A gives examples of other funding sources: private health insurance, employee discounts, Malasakit, PIDAF.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pDescription` | Yes | CDATA; Annex D says "Varchar (10,2)" | Free text | "The description of other funding source, if applicable". The length "(10,2)" looks copied from a numeric row ([KI-33](/known-issues#ki-33)). The real maximum is not specified. | DTD, D86 |
| `pAmount` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The amount of other funding source discount, if applicable" | DTD, D86 |

### `PhilHealth`

`EMPTY`. One inside `SummaryOfFees` and one inside `ProfessionalFees`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pTotalCaseRateAmount` | Yes | CDATA; Number(8,2) | `0.00` to `999999.99` | "The amount of case rate package being claimed". Annex D: `PTotalCaseRateAmount`. | DTD, D86 |

This is a single total, not a per-category amount. The DevKit does not explain how to split the case rate between the two `PhilHealth` elements, or whether they must equal amounts in the eClaims XML ([KI-53](/known-issues#ki-53)). Our [sample](#sample) uses the claim's CF2 `BENEFITS` totals: `pTotalHCIFees` in `SummaryOfFees/PhilHealth` and `pTotalProfFees` in `ProfessionalFees/PhilHealth`. That mapping is our choice. The certification form asks for a separate "Case Rate 1" and "Case Rate 2", which the DTD can't hold ([KI-52](/known-issues#ki-52)).

### `Balance`

`EMPTY`. One inside `SummaryOfFees` and one inside `ProfessionalFees`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pAmount` | Yes | CDATA; Number(10,2) | `0.00` to `99999999.99` | "The difference between the total amount of charges, net of applicable vat, for the room and board, drugs and medicine, laboratory and diagnostic, operating room and medical supplies charges, less applicable discounts and the case rate amount." | DTD, D86 |

The Annex D wording names only the five original categories, not `Others`, and doesn't mention other fund sources ([KI-53](/known-issues#ki-53)). This is despite Guide revision 20250217, which says it "Revised the Data Dictionary and Document Type Definition (DTD) of eSOA". PC 2023-0026 Annex A defines the balance as Amount minus Discount, PhilHealth and Other Funding Sources. See [the balance formula](/guides/esoa#the-balance-formula-as-the-sources-define-it).

## `ProfessionalFees`

Content: `(ProfessionalFee*, PhilHealth, Balance)`. It has no attributes.

This holds the professional and reader's fees ("Reader's fee is also considered a professional fee", PC 2023-0026 IV.G). The DTD allows zero `ProfessionalFee` elements, but `PhilHealth` and `Balance` are always required. The DevKit doesn't say whether an eSOA with no `ProfessionalFee` counts as "lacking" the professional-fee component, which would make PhilHealth return the claim (PC 2023-0026 V.N, [KI-53](/known-issues#ki-53)).

### `ProfessionalFee`

Content: `(ProfessionalInfo, SummaryOfFee)`. It has no attributes. There is one per attending professional. It uses the same `SummaryOfFee` as the categories (see [above](#summaryoffee)). Unlike the categories, it has **no** `OtherFundSource`, and `PhilHealth` and `Balance` are single totals for all professionals, not per-physician values ([KI-53](/known-issues#ki-53)).

### `ProfessionalInfo`

`EMPTY`.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pPAN` | Yes | CDATA; Varchar(14) | Not specified. Dummy test PANs look like `1504-2400015-3` (14 characters). Annex C gives professional PANs a different format ([KI-48](/known-issues#ki-48)). | "The corresponding PhilHealth Accreditation Number (PAN) of the attending Physician" | DTD, D86 |
| `pFirstName` | Yes | CDATA; Varchar(60) | | "The first name of the attending physician" | DTD, D86 |
| `pMiddleName` | Yes | CDATA; "varchar" (no length given) | | "The middle name of the attending physician" | DTD, D86 |
| `pLastName` | Yes | CDATA; Varchar(60) | | "The last name of the attending physician" | DTD, D86 |
| `pSuffixName` | Yes | CDATA; Varchar(60) | `""` if none | "The suffix or extension name of the attending physician (ex. Jr., Sr. II, IIII and so on)" | DTD, D87 |

## `ItemizedBillingItems`

Content: `(ItemizedBillingItem+)`, meaning at least one line. It has no attributes.

### `ItemizedBillingItem`

`EMPTY`. There is one per billed line. Attribute order doesn't matter in XML. The Guide sample puts `pCategory` second, and the DTD lists it last.

| Attribute | Required by DTD | Type / length | Valid values / format | Description | Source |
|---|---|---|---|---|---|
| `pServiceDate` | Yes | CDATA; Date | `mm-dd-yyyy` | "the date of service for room and board, laboratory and diagnostic service and operating room fees; the date of issuance for drugs and medicine and medical supplies" | DTD, D87 |
| `pItemCode` | Yes | CDATA; Varchar(30) | "as listed in eSOA Item Library". "For Drug and Medicine Category, use the Drug Code (30 characters) from the Medicine Library." "For other item not included in the library, keep it blank." | "Refer to the code of the item in the electronic Statement of Account (eSOA)" | DTD, D87 |
| `pItemName` | Yes | CDATA; Varchar(300) | "as listed in eSOA and Item Library". "For other item not included in the library, provide the complete description." | "Refer to the description of an item in the electronic Statement of Account (eSOA)" | DTD, D87 |
| `pUnitOfMeasurement` | Yes | CDATA; Varchar(50) | "For Drug and Medicine Category, keep it blank." | "Refer to the unit of measurement used for an item in the electronic Statement of Account (eSOA)" | DTD, D87 |
| `pUnitPrice` | Yes | CDATA; Number(8,2) | `0.00` to `999999.99` | "Refer to the unit amount of an item in the electronic Statement of Account (eSOA)" | DTD, D87 |
| `pQuantity` | Yes | CDATA; Number(4,0) | `0` to `9999` (whole numbers only) | "Refer to the total number or quantity of an item in the electronic Statement of Account (eSOA)" | DTD, D87 |
| `pTotalAmount` | Yes | CDATA; Number(11,2) | `0.00` to `999999999.99` | "Refer to the total amount of of an item ... i.e pTotalAmount = pQuantity x pUnitPrice)" | DTD, D87 |
| `pCategory` | Yes | Enumeration (DTD); Varchar(50) (Annex D) | `RoomAndBoard`, `DrugsAndMedicine`, `LaboratoryAndDiagnostic`, `OperatingRoomFees`, `MedicalSupplies`, `Others` | "Refer to eSOA category", "as listed in eSOA and Category Library". Added in DTD v0.3. `Others` was added in v0.5. | DTD, D87 |

Notes:

- `pQuantity` is Number(4,0), a whole number. The DevKit does not say how to bill fractional quantities (for example half a tablet) ([KI-53](/known-issues#ki-53)). Confirm with PhilHealth.
- Library codes are text. Item Library codes are the numbers `1` to `1898` written without spaces or leading zeros. The Guide sample's `" 1898"` has a leading space ([KI-34](/known-issues#ki-34)). Drug codes are copied as-is from the Medicine Library. See [eSOA libraries](/reference/libraries/esoa).
- The Guide sample gives an unlisted `DrugsAndMedicine` line `pUnitOfMeasurement="SAMPLE UNIT"`, which contradicts Annex D's "keep it blank". Follow Annex D ([KI-53](/known-issues#ki-53)).
- One Medicine Library code has only 25 characters, and another has two segments swapped ([KI-39](/known-issues#ki-39)). Copy drug codes exactly as listed.

## Annex D vs DTD names

| Element | DTD (use this) | Annex D spelling | Issue |
|---|---|---|---|
| `eSOA` | `pHciTransmittalId` | `pTransmittalId` | Different name |
| `SummaryOfFee` | `pChargesNetOfApplicableVat` | `PChargesNetOfApplicableVat` | Capital `P` |
| `SummaryOfFee` | `pSeniorCitizenDiscount` | `PSeniorCitizenDiscount` | Capital `P` |
| `SummaryOfFee` | `pPWDDiscount` | `pPWDDIscount` | Capital `I` |
| `PhilHealth` | `pTotalCaseRateAmount` | `PTotalCaseRateAmount` | Capital `P` |
| `OtherFundSource` | `pDescription` | `pDescription`, "Varchar (10,2)" | Odd length |

Annex D groups the attributes under labels in its "Element" column ("eSOA", "Summary of Fees", "Other Funding Source", "PhilHealth", "Balance", "Professional Information", "Itemized Billing"). Several of these are business labels, not element names. It doesn't list the six category elements (`RoomAndBoard` ... `Others`) or the containers `ProfessionalFees`, `ProfessionalFee` and `ItemizedBillingItems`. Its `Balance` definition still names only the five original categories. See [KI-33](/known-issues#ki-33).

## DTD version history

From the comment at the top of `ESOA.dtd` and the Guide's revision history ([Guide p. 3–4](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)):

| DTD version | Date and time (DTD comment) | Change (DTD comment) | Related Guide revision |
|---|---|---|---|
| 0.1 | 2022-08-19 12:24pm | "Initial" | None. The Guide's first revision, 20240215, is the "Initial Release for the SearchCaseRate, GenerateToken, ValidateEsoa and ValidateCF5 methods". |
| 0.2 | 2023-02-13 03:51pm | "Revised" (no details) | None |
| 0.3 | 2023-05-30 09:14am | "Added pCategory in ItemizedBillingItem" | None |
| 0.4 | 2023-08-14 05:17pm | "Changed pActualCharges to pChargesNetOfApplicableVat" | 20240823: "Changed the attribute pActualCharges to pChargesNetOfApplicableVat in eSOA XML" |
| 0.5 | 2025-02-17 01:08pm | "Added the specs for the "Others" element and "Others" category" | 20250217: "Revised the Data Dictionary and Document Type Definition (DTD) of eSOA." |

Other eSOA entries in the Guide's revision history: 20240306 "Added Annex B, C, D, E, F"; 20240823 "Added eSOA Libraries"; 20240911 "Added Medicine Library in the eSOA Library (Annex F)"; 20250217 "Changed the Drug and Medicine Library for eSOA" (also in [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf)). The DevKit contains only the v0.5 DTD, so you can't see exactly what versions 0.1 and 0.2 looked like.

::: warning The DTD header still says "Version 0.1"
The standalone file's comment reads "Electronic Statement of Account Data Type Definition Version 0.1", followed by a change log that ends at 0.5. The copy printed in the Guide (p. 11) reads "... Data Type Definition Version" with no number. Both have identical declarations (we compared them). Treat the file as **v0.5**. If you store "the DTD version" in your system, take it from the last change-log line, not the header.
:::

::: details Raw DTD (ESOA.dtd)
```xml
<!--
    Philippine Health Insurance Corporation
    Electronic Statement of Account Data Type Definition Version 0.1
    0.1 : 2022-08-19 12:24pm : Initial
    0.2 : 2023-02-13 03:51pm : Revised
	0.3	: 2023-05-30 09:14am : Added pCategory in ItemizedBillingItem
	0.4	: 2023-08-14 05:17pm : Changed pActualCharges to pChargesNetOfApplicableVat
	0.5	: 2025-02-17 01:08pm : Added the specs for the "Others" element and "Others" category
-->

<!ELEMENT eSOA (SummaryOfFees, ProfessionalFees, ItemizedBillingItems)>

<!ATTLIST eSOA
    pHciPan CDATA #REQUIRED
    pHciTransmittalId CDATA #REQUIRED>

<!ELEMENT SummaryOfFees (RoomAndBoard, DrugsAndMedicine, LaboratoryAndDiagnostic, OperatingRoomFees, MedicalSupplies, Others, PhilHealth, Balance)>

<!ELEMENT ProfessionalFees (ProfessionalFee*, PhilHealth, Balance)>

<!ELEMENT ItemizedBillingItems (ItemizedBillingItem+)>

<!ELEMENT PhilHealth EMPTY>
<!ATTLIST PhilHealth
	pTotalCaseRateAmount CDATA #REQUIRED
>

<!ELEMENT Balance EMPTY>
<!ATTLIST Balance
	pAmount CDATA #REQUIRED
>


<!ELEMENT OtherFundSource EMPTY>
<!ATTLIST OtherFundSource
	pDescription CDATA #REQUIRED
	pAmount CDATA #REQUIRED>

<!ELEMENT SummaryOfFee EMPTY>
<!ATTLIST SummaryOfFee 
    pChargesNetOfApplicableVat CDATA #REQUIRED
    pSeniorCitizenDiscount CDATA #REQUIRED
    pPWDDiscount CDATA #REQUIRED
    pPCSO CDATA #REQUIRED
    pDSWD CDATA #REQUIRED
    pDOHMAP CDATA #REQUIRED
    pHMO CDATA #REQUIRED
  >

<!ELEMENT RoomAndBoard (SummaryOfFee, OtherFundSource*)>

<!ELEMENT DrugsAndMedicine (SummaryOfFee, OtherFundSource*)>

<!ELEMENT LaboratoryAndDiagnostic (SummaryOfFee, OtherFundSource*)>

<!ELEMENT OperatingRoomFees (SummaryOfFee, OtherFundSource*)>

<!ELEMENT MedicalSupplies (SummaryOfFee, OtherFundSource*)>

<!ELEMENT Others (SummaryOfFee, OtherFundSource*)>

<!ELEMENT ProfessionalFee (ProfessionalInfo, SummaryOfFee)>


<!ELEMENT ProfessionalInfo EMPTY>
<!ATTLIST ProfessionalInfo
    pPAN  CDATA #REQUIRED
    pFirstName CDATA #REQUIRED
    pMiddleName CDATA #REQUIRED
    pLastName CDATA #REQUIRED
    pSuffixName CDATA #REQUIRED
>

<!ELEMENT ItemizedBillingItem EMPTY>
<!ATTLIST ItemizedBillingItem
    pServiceDate CDATA #REQUIRED
    pItemCode CDATA #REQUIRED
    pItemName CDATA #REQUIRED
    pUnitOfMeasurement CDATA #REQUIRED
    pUnitPrice CDATA #REQUIRED
    pQuantity CDATA #REQUIRED
    pTotalAmount CDATA #REQUIRED
	pCategory (RoomAndBoard|DrugsAndMedicine|LaboratoryAndDiagnostic|OperatingRoomFees|MedicalSupplies|Others) #REQUIRED
>
```
:::

## Sample

The file below is **unofficial but DTD-valid**. Download it as [`esoa-sample.xml`](/examples/esoa-sample.xml). All values are fictitious. It is the eSOA of this site's shared example claim: the same stay, physician, drugs and PhilHealth amounts as [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) and [`cf4-sample.xml`](/examples/cf4-sample.xml), so you can use the files together as one consistent test set.

| Value in the sample | Meaning | Matches in the other examples |
|---|---|---|
| `pHciPan="H12345678"` | The example facility's accreditation number (PAN), a placeholder | CF4 `EPCB@pHciAccreNo` |
| `pHciTransmittalId="202609170001"` | The example claim number. Using it here is our choice; the DevKit doesn't say what this ID must equal ([KI-53](/known-issues#ki-53)). | eClaims `CLAIM@pClaimNumber` |
| `pServiceDate` from `09-15-2026` to `09-17-2026` | The stay: admitted 09-15-2026 01:00:00PM, discharged 09-17-2026 03:00:00PM, for dengue fever without warning signs (ICD-10 `A90`) | eClaims `CF2` dates, CF4 `COURSEWARD` dates |
| `ProfessionalInfo@pPAN="1504-2400015-3"` | The attending doctor, LIFE GOES ON, a dummy test provider. It is the only physician. | eClaims `PROFESSIONALS@pDoctorAccreCode` |
| Three `DrugsAndMedicine` lines | 0.9% sodium chloride 4 × 150.00, paracetamol 20 × 10.00, omeprazole 6 × 50.00 | CF4 `MEDICINE`: the same drug codes, quantities and totals |
| `SummaryOfFees/PhilHealth` `7000.00` and `ProfessionalFees/PhilHealth` `3000.00` | The PhilHealth benefit for the facility and for the physician | CF2 `BENEFITS@pTotalHCIFees` and `@pTotalProfFees`, which add up to `CASERATE@pCaseRateAmount` `10000.00`. This mapping is our choice ([KI-53](/known-issues#ki-53)). |
| Both `Balance@pAmount="0.00"` | The patient pays nothing | CF2 `CONSUMPTION@pEnoughBenefits="Y"` |

Other things to know about the sample:

- **It is a medical case.** There was no operation, so `OperatingRoomFees` has every amount `0.00` and no itemized line. The DTD still requires the element. `Others` works the same way.
- **There are no discounts or other funding sources.** The patient is 52 years old and not a person with disability, and no HMO or other fund pays. Every deduction attribute is `0.00`, and there is no `OtherFundSource`. For an example with discounts, other funding sources and two physicians, see the [circular's worked example](/guides/esoa#worked-example-from-the-circular) on Building the eSOA. It is shown there as a table only, because it doesn't describe this claim.
- **The balances are zero because of CF2.** `eclaims-minimal.xml` sets `pEnoughBenefits="Y"`. Annex C defines it as "the PhilHealth benefit is enough to cover HCI and PF charges. No purchases of drugs/medicines, supplies, diagnostics, and co-pay for professional fees by the member/patient" (HCI is the facility, PF the professional fees) ([Guide p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). So the charges equal the benefit, and nothing is left for the patient. If the benefit doesn't cover the whole bill, the eSOA balance is above `0.00`, and Annex C asks for `pEnoughBenefits="N"` with `HCIFEES`, `PROFFEES` and `PURCHASES` instead of `BENEFITS` (see [`CONSUMPTION`](/reference/eclaims-xml#consumption-benefits-hcifees-proffees-purchases)).
- **The physician's name** comes from PhilHealth's dummy test data, whose third name column is labeled `FIRST_NAME` again; we use it as the last name. The dummy accreditations are valid only up to 12/31/2026 ([KI-11](/known-issues#ki-11), [test data](/reference/test-data)).
- **Codes and names** are copied from the Annex F libraries. The dengue NS1 antigen test is not in the Item Library, so its line has a blank code and a complete description (Annex D).
- **Prices are made up.** They are neither PhilHealth rates nor market prices.

### Validate the sample

Download [`ESOA.dtd`](/originals/esoa/ESOA.dtd) and [`esoa-sample.xml`](/examples/esoa-sample.xml) into one folder, then run this (it needs Python with lxml: `pip install lxml`):

```bash
python3 -c "from lxml import etree; d=etree.DTD(open('ESOA.dtd','rb')); t=etree.parse('esoa-sample.xml'); print(d.validate(t), d.error_log.filter_from_errors())"
# True
```

A second script checked the rest. Every `pTotalAmount` equals `pUnitPrice × pQuantity`. Each category's lines add up to its charges, and both balances follow the formula below. Every code and name matches its library row. The claim number, the physician, the drugs and the PhilHealth amounts match `eclaims-minimal.xml` and `cf4-sample.xml`. It found no errors. The [local check on Building the eSOA](/guides/esoa#step-2-check-it-locally) runs the same arithmetic checks on your own files.

### The sample file

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
  Unofficial eSOA example - NOT an official PhilHealth sample.
  Valid against esoa/ESOA.dtd v0.5 (2025-02-17), checked with lxml.
  All values are fictitious.

  This is the eSOA of this site's shared example claim, the same stay as
  eclaims-minimal.xml and cf4-sample.xml (see /reference/esoa-xml#sample):
    pHciPan            H12345678     example facility accreditation number (PAN)
    pHciTransmittalId  202609170001  the claim's CLAIM@pClaimNumber (our choice;
                                     the DevKit doesn't say what it must equal, KI-53)
    Stay               09-15-2026 01:00:00PM to 09-17-2026 03:00:00PM, dengue fever
                       without warning signs (ICD-10 A90): a medical case, no procedure
    Physician          1504-2400015-3 (LIFE GOES ON), the claim's only PROFESSIONALS
                       entry, a dummy test provider
    Drugs              the three MEDICINES of cf4-sample.xml, with the same codes,
                       quantities and totals

  Amounts (our choice, KI-53): the two PhilHealth amounts equal the CF2 BENEFITS
  totals in eclaims-minimal.xml (pTotalHCIFees 7000.00, pTotalProfFees 3000.00;
  together CASERATE@pCaseRateAmount 10000.00). CF2 says pEnoughBenefits="Y" (the
  benefit covers the HCI and PF charges), so the charges equal the benefit and both
  balances are 0.00. The patient is 52 and not a person with disability, so there
  are no mandatory discounts, and no other funding source applies.

  Arithmetic (see /reference/esoa-xml#sample-arithmetic):
    SummaryOfFees charges     2500.00 + 1100.00 + 2950.00 + 0.00 + 450.00 + 0.00 = 7000.00
    SummaryOfFees Balance     7000.00 - 0.00 (discounts) - 7000.00 (PhilHealth)
                              - 0.00 (other funding) = 0.00
    ProfessionalFees Balance  3000.00 - 0.00 (discounts) - 3000.00 (PhilHealth) = 0.00
    Each ItemizedBillingItem  pTotalAmount = pUnitPrice x pQuantity
    The items of each pCategory add up to that category's pChargesNetOfApplicableVat.
-->
<eSOA pHciPan="H12345678" pHciTransmittalId="202609170001">
  <SummaryOfFees>
    <RoomAndBoard>
      <SummaryOfFee pChargesNetOfApplicableVat="2500.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </RoomAndBoard>
    <DrugsAndMedicine>
      <SummaryOfFee pChargesNetOfApplicableVat="1100.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </DrugsAndMedicine>
    <LaboratoryAndDiagnostic>
      <SummaryOfFee pChargesNetOfApplicableVat="2950.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </LaboratoryAndDiagnostic>
    <!-- No operation (medical case). The DTD still requires the element, so every amount is 0.00. -->
    <OperatingRoomFees>
      <SummaryOfFee pChargesNetOfApplicableVat="0.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </OperatingRoomFees>
    <MedicalSupplies>
      <SummaryOfFee pChargesNetOfApplicableVat="450.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </MedicalSupplies>
    <!-- "Others" is required by the DTD even when the patient has no such charges. -->
    <Others>
      <SummaryOfFee pChargesNetOfApplicableVat="0.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </Others>
    <!-- = CF2 BENEFITS@pTotalHCIFees in eclaims-minimal.xml (our choice, KI-53) -->
    <PhilHealth pTotalCaseRateAmount="7000.00"/>
    <Balance pAmount="0.00"/>
  </SummaryOfFees>
  <ProfessionalFees>
    <ProfessionalFee>
      <ProfessionalInfo pPAN="1504-2400015-3" pFirstName="LIFE" pMiddleName="GOES" pLastName="ON" pSuffixName=""/>
      <SummaryOfFee pChargesNetOfApplicableVat="3000.00" pSeniorCitizenDiscount="0.00" pPWDDiscount="0.00"
                    pPCSO="0.00" pDSWD="0.00" pDOHMAP="0.00" pHMO="0.00"/>
    </ProfessionalFee>
    <!-- = CF2 BENEFITS@pTotalProfFees in eclaims-minimal.xml (our choice, KI-53) -->
    <PhilHealth pTotalCaseRateAmount="3000.00"/>
    <Balance pAmount="0.00"/>
  </ProfessionalFees>
  <ItemizedBillingItems>
    <!-- RoomAndBoard: 1250.00 + 1250.00 = 2500.00 (item 1897 from the eSOA Item Library).
         One line per day, for 09-15 and 09-16 (our choice; the DevKit doesn't say how to count days). -->
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="1897" pItemName="ROOM AND BOARD"
                         pUnitOfMeasurement="DAY" pUnitPrice="1250.00" pQuantity="1" pTotalAmount="1250.00"
                         pCategory="RoomAndBoard"/>
    <ItemizedBillingItem pServiceDate="09-16-2026" pItemCode="1897" pItemName="ROOM AND BOARD"
                         pUnitOfMeasurement="DAY" pUnitPrice="1250.00" pQuantity="1" pTotalAmount="1250.00"
                         pCategory="RoomAndBoard"/>
    <!-- DrugsAndMedicine: 600.00 + 200.00 + 300.00 = 1100.00
         The same drugs as cf4-sample.xml MEDICINES: 30-character Drug Codes from the Medicine
         Library, same quantities and totals. Unit of measurement left blank for drugs (Annex D). -->
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="09SOD0000000000SOL3200247BOTTL"
                         pItemName="0.9% SODIUM CHLORIDE SOLUTION 1 L BOTTLE"
                         pUnitOfMeasurement="" pUnitPrice="150.00" pQuantity="4" pTotalAmount="600.00"
                         pCategory="DrugsAndMedicine"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="PARAC0000000047TAB490000000000"
                         pItemName="PARACETAMOL 500 mg TABLET"
                         pUnitOfMeasurement="" pUnitPrice="10.00" pQuantity="20" pTotalAmount="200.00"
                         pCategory="DrugsAndMedicine"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="ESOM10000000036CAPSU0000000000"
                         pItemName="OMEPRAZOLE 40 mg CAPSULE"
                         pUnitOfMeasurement="" pUnitPrice="50.00" pQuantity="6" pTotalAmount="300.00"
                         pCategory="DrugsAndMedicine"/>
    <!-- LaboratoryAndDiagnostic: 300.00 + 150.00 + 150.00 + 1000.00 + 600.00 + 300.00 + 300.00 + 150.00 = 2950.00
         "CBC with platelet count every 12 hours" (CF4 course in the ward): items 1545 and 1566,
         four draws (one on 09-15, two on 09-16, one on 09-17). -->
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="1545" pItemName="HEMATOLOGY: CBC"
                         pUnitOfMeasurement="" pUnitPrice="300.00" pQuantity="1" pTotalAmount="300.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="1566" pItemName="HEMATOLOGY: PLATELET COUNT"
                         pUnitOfMeasurement="" pUnitPrice="150.00" pQuantity="1" pTotalAmount="150.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="1704" pItemName="MICROSCOPY: URINE-URINALYSIS"
                         pUnitOfMeasurement="" pUnitPrice="150.00" pQuantity="1" pTotalAmount="150.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <!-- A test that is not in the Item Library: blank code, complete description (Annex D). -->
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="" pItemName="DENGUE NS1 ANTIGEN RAPID TEST"
                         pUnitOfMeasurement="" pUnitPrice="1000.00" pQuantity="1" pTotalAmount="1000.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-16-2026" pItemCode="1545" pItemName="HEMATOLOGY: CBC"
                         pUnitOfMeasurement="" pUnitPrice="300.00" pQuantity="2" pTotalAmount="600.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-16-2026" pItemCode="1566" pItemName="HEMATOLOGY: PLATELET COUNT"
                         pUnitOfMeasurement="" pUnitPrice="150.00" pQuantity="2" pTotalAmount="300.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-17-2026" pItemCode="1545" pItemName="HEMATOLOGY: CBC"
                         pUnitOfMeasurement="" pUnitPrice="300.00" pQuantity="1" pTotalAmount="300.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <ItemizedBillingItem pServiceDate="09-17-2026" pItemCode="1566" pItemName="HEMATOLOGY: PLATELET COUNT"
                         pUnitOfMeasurement="" pUnitPrice="150.00" pQuantity="1" pTotalAmount="150.00"
                         pCategory="LaboratoryAndDiagnostic"/>
    <!-- MedicalSupplies: 150.00 + 200.00 + 25.00 + 50.00 + 25.00 = 450.00
         IV line on admission; one syringe per blood draw, dated by issuance (Annex D). -->
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="352" pItemName="IV CATHETER G. 20"
                         pUnitOfMeasurement="PIECE" pUnitPrice="150.00" pQuantity="1" pTotalAmount="150.00"
                         pCategory="MedicalSupplies"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="313" pItemName="I.V. ADMINISTRATION SET, ADULT (MACROSET)"
                         pUnitOfMeasurement="SET" pUnitPrice="200.00" pQuantity="1" pTotalAmount="200.00"
                         pCategory="MedicalSupplies"/>
    <ItemizedBillingItem pServiceDate="09-15-2026" pItemCode="117" pItemName="SYRINGE DISP,5CC G. 23 X 1, LUER LOCK"
                         pUnitOfMeasurement="PIECE" pUnitPrice="25.00" pQuantity="1" pTotalAmount="25.00"
                         pCategory="MedicalSupplies"/>
    <ItemizedBillingItem pServiceDate="09-16-2026" pItemCode="117" pItemName="SYRINGE DISP,5CC G. 23 X 1, LUER LOCK"
                         pUnitOfMeasurement="PIECE" pUnitPrice="25.00" pQuantity="2" pTotalAmount="50.00"
                         pCategory="MedicalSupplies"/>
    <ItemizedBillingItem pServiceDate="09-17-2026" pItemCode="117" pItemName="SYRINGE DISP,5CC G. 23 X 1, LUER LOCK"
                         pUnitOfMeasurement="PIECE" pUnitPrice="25.00" pQuantity="1" pTotalAmount="25.00"
                         pCategory="MedicalSupplies"/>
  </ItemizedBillingItems>
</eSOA>
```

### Sample arithmetic

Every amount in the sample follows from its itemized lines. Nothing is rounded.

**Itemized lines** (Annex D: `pTotalAmount = pQuantity x pUnitPrice`), in file order:

| Date | Code | Name | Unit | Price × Qty | Total |
|---|---|---|---|---|---:|
| 09-15-2026 | `1897` | ROOM AND BOARD | DAY | 1,250.00 × 1 | 1,250.00 |
| 09-16-2026 | `1897` | ROOM AND BOARD | DAY | 1,250.00 × 1 | 1,250.00 |
| 09-15-2026 | `09SOD0000000000SOL3200247BOTTL` | 0.9% SODIUM CHLORIDE SOLUTION 1 L BOTTLE | (blank) | 150.00 × 4 | 600.00 |
| 09-15-2026 | `PARAC0000000047TAB490000000000` | PARACETAMOL 500 mg TABLET | (blank) | 10.00 × 20 | 200.00 |
| 09-15-2026 | `ESOM10000000036CAPSU0000000000` | OMEPRAZOLE 40 mg CAPSULE | (blank) | 50.00 × 6 | 300.00 |
| 09-15-2026 | `1545` | HEMATOLOGY: CBC | (blank) | 300.00 × 1 | 300.00 |
| 09-15-2026 | `1566` | HEMATOLOGY: PLATELET COUNT | (blank) | 150.00 × 1 | 150.00 |
| 09-15-2026 | `1704` | MICROSCOPY: URINE-URINALYSIS | (blank) | 150.00 × 1 | 150.00 |
| 09-15-2026 | (blank) | DENGUE NS1 ANTIGEN RAPID TEST | (blank) | 1,000.00 × 1 | 1,000.00 |
| 09-16-2026 | `1545` | HEMATOLOGY: CBC | (blank) | 300.00 × 2 | 600.00 |
| 09-16-2026 | `1566` | HEMATOLOGY: PLATELET COUNT | (blank) | 150.00 × 2 | 300.00 |
| 09-17-2026 | `1545` | HEMATOLOGY: CBC | (blank) | 300.00 × 1 | 300.00 |
| 09-17-2026 | `1566` | HEMATOLOGY: PLATELET COUNT | (blank) | 150.00 × 1 | 150.00 |
| 09-15-2026 | `352` | IV CATHETER G. 20 | PIECE | 150.00 × 1 | 150.00 |
| 09-15-2026 | `313` | I.V. ADMINISTRATION SET, ADULT (MACROSET) | SET | 200.00 × 1 | 200.00 |
| 09-15-2026 | `117` | SYRINGE DISP,5CC G. 23 X 1, LUER LOCK | PIECE | 25.00 × 1 | 25.00 |
| 09-16-2026 | `117` | SYRINGE DISP,5CC G. 23 X 1, LUER LOCK | PIECE | 25.00 × 2 | 50.00 |
| 09-17-2026 | `117` | SYRINGE DISP,5CC G. 23 X 1, LUER LOCK | PIECE | 25.00 × 1 | 25.00 |

**Summary of Fees.** The lines of each category add up to that category's `pChargesNetOfApplicableVat`. "Deductions" means the six discount and funding attributes plus any `OtherFundSource`.

| Category | `pChargesNetOfApplicableVat` | Deductions | Sum of the category's itemized lines |
|---|---:|---:|---|
| `RoomAndBoard` | 2,500.00 | 0.00 | 1,250.00 + 1,250.00 = 2,500.00 |
| `DrugsAndMedicine` | 1,100.00 | 0.00 | 600.00 + 200.00 + 300.00 = 1,100.00 |
| `LaboratoryAndDiagnostic` | 2,950.00 | 0.00 | 300.00 + 150.00 + 150.00 + 1,000.00 + 600.00 + 300.00 + 300.00 + 150.00 = 2,950.00 |
| `OperatingRoomFees` | 0.00 | 0.00 | No lines (no procedure) |
| `MedicalSupplies` | 450.00 | 0.00 | 150.00 + 200.00 + 25.00 + 50.00 + 25.00 = 450.00 |
| `Others` | 0.00 | 0.00 | No lines |
| **Total** | **7,000.00** | **0.00** | **7,000.00** |

`SummaryOfFees/Balance@pAmount` = 7,000.00 (charges) − 0.00 (discounts) − 7,000.00 (`PhilHealth`) − 0.00 (other funding sources) = **0.00**.

**Professional Fees.** One physician, `1504-2400015-3`, with 3,000.00 in charges and no discounts. `ProfessionalFees/Balance@pAmount` = 3,000.00 − 0.00 − 3,000.00 (`PhilHealth`) = **0.00**.

**How the amounts tie to the eClaims XML.** This mapping is our choice. The DevKit doesn't say how the eSOA's `PhilHealth` amounts relate to the claim ([KI-53](/known-issues#ki-53)).

| eSOA | Value | `eclaims-minimal.xml` |
|---|---:|---|
| `SummaryOfFees/PhilHealth@pTotalCaseRateAmount` | 7,000.00 | `BENEFITS@pTotalHCIFees` |
| `ProfessionalFees/PhilHealth@pTotalCaseRateAmount` | 3,000.00 | `BENEFITS@pTotalProfFees` |
| Sum of the two | 10,000.00 | `BENEFITS@pGrandTotal` and `CASERATE@pCaseRateAmount` |
| Both `Balance@pAmount` | 0.00 | `CONSUMPTION@pEnoughBenefits="Y"` |

Why some fields look the way they do:

- **Drug lines** have a blank unit of measurement (Annex D). They repeat the CF4 sample's `MEDICINE` rows. CF4 leaves `pActualUnitPrice` blank, so the unit prices here are the CF4 totals divided by the quantities.
- **The dengue NS1 antigen test** is an unlisted item. A keyword search found no dengue test in the Item Library, so the line has a blank code and a complete description.
- **CBC with platelet count.** The CF4 sample's course in the ward orders "CBC WITH PLATELET COUNT EVERY 12 HOURS". We bill each draw as `1545` HEMATOLOGY: CBC plus `1566` HEMATOLOGY: PLATELET COUNT: one draw on 09-15, two on 09-16 and one on 09-17, with one line per date. How to split a combined order into library items is our choice.
- **Units** such as `DAY`, `PIECE` and `SET` are our choices. The DevKit has no unit-of-measurement library for non-drug items. The laboratory lines leave the unit blank, as the Guide's sample does.
- **Omeprazole's** code starts with `ESOM1`. Drug codes don't always look like the drug name, so always look them up.
- **Dates** fall within the stay. Room and board has one line per day for 09-15 and 09-16; the DevKit doesn't say how to count the days of a stay that ends in the afternoon of the third day. Laboratory lines use the date of service, and drugs and supplies the date of issuance (Annex D).
- **Matching category totals.** Each category's itemized lines add up to its `pChargesNetOfApplicableVat`. This is our consistency choice (PC 2023-0026 V.Q asks for consistency with the billing statement), not a documented validator rule.

## The Guide's official sample

The sample on [Guide p. 12–15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12) **is DTD-valid** (we extracted it and validated it with lxml: `True`). Its numbers are placeholders ([KI-34](/known-issues#ki-34)):

| Check | Guide sample | Result |
|---|---|---|
| Summary balance | Charges 23,900.00. Deductions: SC 1,000.00 + PCSO 2,000.00 + DSWD 1,000.00 + `OtherFundSource` 3,000.00 = 7,000.00. PhilHealth 15,000.00. | Computed 1,900.00. Declared `3500.00`. |
| `RoomAndBoard` | Charges 2,000.00. PCSO 2,000.00 + "Hello World Foundation" 3,000.00. | Deductions exceed charges, which the DevKit has no rule for ([KI-53](/known-issues#ki-53)). No room-and-board line. |
| Professional fees | One physician with charges `0`. PhilHealth `2000.00`. | Declared balance `27180.00` can't be derived. |
| CBC line | `pUnitPrice="500.00" pQuantity="3" pTotalAmount="4000.00"` | 500 × 3 = 1,500 |
| Operating room line | `pItemCode=" 1898"` | Leading space |
| Unlisted drug line | `pCategory="DrugsAndMedicine" pUnitOfMeasurement="SAMPLE UNIT"` | Contradicts Annex D ("keep it blank") ([KI-53](/known-issues#ki-53)) |
| Amount formats | `"3800"`, `"12000"`, `"500"`, `"0"` next to `"2000.00"` | The DevKit doesn't say which forms are accepted ([KI-53](/known-issues#ki-53)). |

The item codes in the Guide sample do match the libraries: `1545` HEMATOLOGY: CBC, `1898` OPERATING ROOM, `175` GLOVES STERILE, S-6.0 NON LATEX, `1288` FACE MASK (EAR LOOP)DISPOSABLE, and drug `PARAC0000000015SUPP40000000000` PARACETAMOL 250 mg SUPPOSITORY.

## Common validation errors

These are the messages lxml prints for typical mistakes, produced by changing our sample. PhilHealth's `validateeSOA` wording may differ.

| Mistake | lxml message |
|---|---|
| Old attribute name `pActualCharges` | `No declaration for attribute pActualCharges of element SummaryOfFee` and `Element SummaryOfFee does not carry attribute pChargesNetOfApplicableVat` |
| Annex D name `pTransmittalId` | `No declaration for attribute pTransmittalId of element eSOA` and `Element eSOA does not carry attribute pHciTransmittalId` |
| `Others` left out | `Element SummaryOfFees content does not follow the DTD, expecting (RoomAndBoard , DrugsAndMedicine , LaboratoryAndDiagnostic , OperatingRoomFees , MedicalSupplies , Others , PhilHealth , Balance), got (...)` |
| `pCategory="Medical Supplies"` | `Value "Medical Supplies" for attribute pCategory of ItemizedBillingItem is not among the enumerated set` |
| `pSuffixName` omitted instead of `""` | `Element ProfessionalInfo does not carry attribute pSuffixName` |
| No itemized lines | `Element ItemizedBillingItems content does not follow the DTD, expecting (ItemizedBillingItem)+, got` |

## Related pages

- [Building the eSOA](/guides/esoa): workflow, computation rules, policy, and the circular's worked example
- [eSOA libraries](/reference/libraries/esoa): the code lists for `pItemCode`, `pItemName` and `pCategory`
- [validateeSOA](/api/validate-esoa)
- [Validating XML](/guides/validating-xml)
- [Document types](/reference/document-types) (`ESA`)
- [eClaims XML](/reference/eclaims-xml) and [CF4 XML](/reference/cf4-xml): the other files of the same example claim
- [Known issues](/known-issues)
