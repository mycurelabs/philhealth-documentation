---
title: Building the eSOA
description: How to build, check, validate, encrypt and attach the electronic Statement of Account (eSOA), how to fill in its amounts and item codes, and the PhilHealth Circular 2023-0026 rules behind it.
---

# Building the eSOA

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

The electronic Statement of Account (eSOA) is the patient's hospital bill, sent to PhilHealth as an XML file together with an All Case Rates (ACR) claim. This page starts with the developer workflow: build the XML, check it with `validateeSOA`, encrypt it, host it, and attach it to the claim as document type `ESA`. It then explains how to fill in each amount and item code, and ends with the policy behind the eSOA (PhilHealth Circular 2023-0026). For the element-by-element format, see the [eSOA XML reference](/reference/esoa-xml). For the code lists, see [eSOA libraries](/reference/libraries/esoa).

::: info Sources
- [PhilHealth Circular (PC) 2023-0026, "Electronic Data Submission of the Statement of Account (SOA) for All Case Rates (ACR) Claims and Identified PhilHealth Benefits (Revision 1)", 12 pages, scanned](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1): policy p. 1–8, PC 2023-0026 Annex A p. 9–11, PC 2023-0026 Annex B p. 12
- [Implementation Guide (rev. 20250217), p. 9–15: `validateeSOA`, eSOA DTD, sample XML](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)
- [Implementation Guide, p. 78: Annex B, document type `ESA`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78), [p. 81: Annex C, CF2 `CONSUMPTION`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81) and [p. 85: Annex C, `pDocumentURL`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)
- [Implementation Guide, p. 86–87: Annex D, eSOA data dictionary](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)
- [Implementation Guide, p. 89–188: Annex F, eSOA libraries](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=89)
- [Implementation Guide, p. 3–4: revision history](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3) and [DevKit Revision History.pdf](/originals/implementation-guide/DevKit%20Revision%20History.pdf)
- [`ESOA.dtd` (v0.5, 2025-02-17)](/originals/esoa/ESOA.dtd), [`Annex F - eSOA Item Library.xlsx`](/originals/esoa/Annex%20F%20-%20eSOA%20Item%20Library.xlsx), [`Annex F - Medicine Library.xlsx`](/originals/esoa/Annex%20F%20-%20Medicine%20Library.xlsx)
- [Software Solution Validation Test Form (SSVTF), rev. 20250217, p. 5–7, 9–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5) and [SSVTF Annex B, eSOA Minimum Data Elements](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf)
- [Guidelines for the Encryption of e-Claim Attachments (2025-03-14)](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf)
:::

On this page, "Annex B", "Annex C", "Annex D" and "Annex F" are the Implementation Guide's annexes. The circular's annexes are written "PC 2023-0026 Annex A/B", and the certification form's annex "SSVTF Annex B" ([How to read these docs](/getting-started/how-to-read)).

## TL;DR: what you need to do

1. **Decide whether the claim needs an eSOA.** All Case Rates (ACR) claims do, plus five outpatient packages. Some benefits are excluded ([Scope](#scope-and-exclusions)).
2. **Build the XML** from `ESOA.dtd` v0.5, from the same billing data as Claim Form 2 (CF2) and your printed bill. It has three required parts: summary of fees, professional fees and itemized lines. All six categories are required, including `Others` ([Step 1](#step-1-build-the-xml)).
3. **Compute the amounts** so they add up: balance = charges − discounts − PhilHealth − other funding sources. The sources leave gaps here, including how the `PhilHealth` amounts relate to the claim ([KI-53](/known-issues#ki-53)); see [How to compute each amount](#how-to-compute-each-amount).
4. **Fill in item codes** from the Annex F libraries. Unlisted items get a blank code and a full description, and drug lines get a blank unit ([Item codes and names](#item-codes-and-names)).
5. **Check it** locally, then with [`validateeSOA`](/api/validate-esoa) (body encrypted with your cipher key).
6. **Encrypt the same bytes** with PhilHealth's public key, host the file at an HTTPS URL, attach it to the claim as document type `ESA`, then check and upload the claim ([Developer workflow](#developer-workflow)).
7. **Before certification,** capture the extra fields the certification form asks for, which the DTD has no place for ([KI-52](/known-issues#ki-52)).

Start from our [sample eSOA](/reference/esoa-xml#sample). It is the eSOA of this site's example claim, so it matches [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) and [`cf4-sample.xml`](/examples/cf4-sample.xml).

## The eSOA at a glance

| Question | Answer | Source |
|---|---|---|
| What is it? | "the digital document of the statement of account in XML format" | [PC 2023-0026 IV.B, p. 2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=2) |
| Which claims need it? | ACR claims from accredited health facilities (HFs), plus five outpatient packages. Some benefits are excluded. See [Scope](#scope-and-exclusions). | [PC III, p. 1–2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1) |
| What must it contain? | Three components: summary of fees, professional fees, itemized charges | [PC V.B, V.N, p. 3–4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=3) |
| What format? | XML that follows the Document Type Definition (DTD) file [`ESOA.dtd`](/originals/esoa/ESOA.dtd) v0.5 (root element `eSOA`) | [Guide p. 11–12](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11) |
| How is it checked? | `validateeSOA` endpoint, body encrypted with the HF's cipher key | [Guide p. 9–10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) |
| How is it sent? | Encrypted with PhilHealth's **public key**, then attached to the claim with document type `ESA` | [Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9), [p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78) |

If PhilHealth terms such as HF, ACR or PhilHealth Accreditation Number (PAN) are new to you, keep the [glossary](/getting-started/glossary) open.

## Developer workflow

The Guide gives only the core rule: validate the eSOA with `validateeSOA`, and "after successful validation", encrypt it with PhilHealth's public key and attach it to the claim as document type `ESA` ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). The steps below fit that rule into the order this site recommends for the whole claim.

::: tip Recommendation (not from PhilHealth): one submission order for the whole claim
1 Build the XML files → 2 local DTD checks → 3 `validateeSOA` and `validateCF5` → 4 encrypt the attachments with PhilHealth's public key and host them at HTTPS URLs → 5 `eClaimsFileCheck` on the final eClaims XML with the live URLs → 6 `uploadeClaims` → 7 store the eRECEIPT (RTN/TCN) → 8 `getUploadedClaimsMap`. The [claims lifecycle](/getting-started/claims-lifecycle) and [Submitting a claim](/guides/submitting-a-claim) use the same order.
:::

```text
 HIS billing data (the same data as CF2 and the printed bill)
      │
      ▼
 1. Build the eSOA XML (ESOA.dtd v0.5)
      │
      ▼
 2. Check it locally: DTD + arithmetic + library codes
      │
      ▼
 3. validateeSOA  ◄── body encrypted with the HF CIPHER KEY
      │   decrypt the result, show the errors, fix, repeat
      ▼
 4. Encrypt the SAME XML bytes with PhilHealth's PUBLIC KEY  (attachment scheme)
      │
      ▼
 5. Host the encrypted file at an HTTPS URL
      │
      ▼
 6. <DOCUMENT pDocumentType="ESA" pDocumentURL="https://..."/> in the eClaims XML
      │
      ▼
 7. eClaimsFileCheck (final eClaims XML, live URLs) → uploadeClaims
    → store the eRECEIPT → getUploadedClaimsMap
```

### Step 1: Build the XML

Follow the [eSOA XML reference](/reference/esoa-xml), and start from our [sample](/reference/esoa-xml#sample). The rules that trip people up:

- **Element order is fixed.** `SummaryOfFees` must contain `RoomAndBoard`, `DrugsAndMedicine`, `LaboratoryAndDiagnostic`, `OperatingRoomFees`, `MedicalSupplies`, `Others`, `PhilHealth`, `Balance`, in exactly that order. All six category elements are required, even when a category has zero charges. A medical case with no operation still sends `OperatingRoomFees`, with every amount `0.00`.
- **Every attribute is `#REQUIRED`.** When something doesn't apply, send an empty string (`pSuffixName=""`) or `0.00`. Don't omit the attribute.
- **Names are case-sensitive.** Use the DTD spelling (`pChargesNetOfApplicableVat`, `pPWDDiscount`), not the Annex D spelling (`PChargesNetOfApplicableVat`, `pPWDDIscount`) ([KI-33](/known-issues#ki-33)).
- **Dates** use `mm-dd-yyyy` ([KI-49](/known-issues#ki-49)). **Amounts** fit Annex D's numeric sizes, for example Number(10,2) = `0.00` to `99999999.99`. **Quantities** are whole numbers, Number(4,0) = `0` to `9999`.

::: tip Recommendation (not from PhilHealth)
- Write amounts with exactly two decimals (`"2000.00"`). The Guide sample mixes `"3800"`, `"12000"` and `"2000.00"`, and the DevKit doesn't say which forms the validator accepts ([KI-53](/known-issues#ki-53)). Two decimals always match Annex D's Number(n,2).
- Compute money with a decimal type or integer centavos, never binary floating point.
- Generate the XML with an XML library, so that characters such as `&` and `"` in item names are escaped. For example, `PITS & FISSURE SEALANT` must appear as `PITS &amp; FISSURE SEALANT` inside the attribute.
- Save the file as UTF-8. The DevKit doesn't specify an encoding for XML files ([KI-60](/known-issues#ki-60), [KI-62](/known-issues#ki-62)).
:::

### Step 2: Check it locally

Validate against the DTD and re-check the arithmetic before calling PhilHealth. PhilHealth's endpoint needs a fresh token and an encrypted body, so local checks are much faster to iterate on.

Download [`ESOA.dtd`](/originals/esoa/ESOA.dtd) and [`esoa-sample.xml`](/examples/esoa-sample.xml) into one folder, then run either check. Replace `esoa-sample.xml` with your own file. The Python check needs lxml (`pip install lxml`).

::: code-group

```bash [xmllint]
# DTD check (the eSOA XML has no DOCTYPE, so pass the DTD explicitly)
xmllint --noout --dtdvalid ESOA.dtd esoa-sample.xml && echo "DTD valid"
```

```python [Python (lxml)]
from decimal import Decimal as D
from lxml import etree

dtd = etree.DTD(open("ESOA.dtd", "rb"))
doc = etree.parse("esoa-sample.xml")
if not dtd.validate(doc):
    raise SystemExit(dtd.error_log.filter_from_errors())

root = doc.getroot()
CATS = ["RoomAndBoard", "DrugsAndMedicine", "LaboratoryAndDiagnostic",
        "OperatingRoomFees", "MedicalSupplies", "Others"]
DEDUCTIONS = ["pSeniorCitizenDiscount", "pPWDDiscount", "pPCSO", "pDSWD", "pDOHMAP", "pHMO"]
items = root.findall("ItemizedBillingItems/ItemizedBillingItem")


def amt(el, attr):
    return D(el.get(attr))


# Annex D: pTotalAmount = pQuantity x pUnitPrice
for it in items:
    assert amt(it, "pUnitPrice") * amt(it, "pQuantity") == amt(it, "pTotalAmount"), it.attrib

# PC 2023-0026 Annex A: Balance = Amount - Discount - PhilHealth - Other Funding Sources
charges = deductions = D("0")
for cat in CATS:
    el = root.find(f"SummaryOfFees/{cat}")
    fee = el.find("SummaryOfFee")
    cat_charges = amt(fee, "pChargesNetOfApplicableVat")
    # Our consistency rule, not a documented one: the category's lines add up to its charges
    lines = sum((amt(it, "pTotalAmount") for it in items if it.get("pCategory") == cat), D("0"))
    assert lines == cat_charges, (cat, lines, cat_charges)
    charges += cat_charges
    deductions += sum(amt(fee, a) for a in DEDUCTIONS)
    deductions += sum((amt(o, "pAmount") for o in el.findall("OtherFundSource")), D("0"))
philhealth = amt(root.find("SummaryOfFees/PhilHealth"), "pTotalCaseRateAmount")
balance = amt(root.find("SummaryOfFees/Balance"), "pAmount")
assert charges - deductions - philhealth == balance, (charges, deductions, philhealth, balance)

# Professional fees: sum of (charges - deductions) - PhilHealth
net = sum((amt(f, "pChargesNetOfApplicableVat") - sum(amt(f, a) for a in DEDUCTIONS)
           for f in root.findall("ProfessionalFees/ProfessionalFee/SummaryOfFee")), D("0"))
pf_philhealth = amt(root.find("ProfessionalFees/PhilHealth"), "pTotalCaseRateAmount")
pf_balance = amt(root.find("ProfessionalFees/Balance"), "pAmount")
assert net - pf_philhealth == pf_balance, (net, pf_philhealth, pf_balance)
print("OK")
```

:::

Both print a success message for `esoa-sample.xml` (the Python check prints `OK`). The check that each category's itemized lines add up to its `pChargesNetOfApplicableVat` is our recommendation. It follows PC 2023-0026 V.Q (consistency with the billing statement), but it is not a documented validator rule.

### Step 3: Validate with `validateeSOA`

The Guide says this method "validates an encrypted eSOA XML file against the Document Type Definition (DTD), ensuring compliance with the required data format and valid values set by PhilHealth" ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). It does not list which data-format and value checks it runs.

`POST https://{pecws.domain}/PHIC/Claims3.0/validateeSOA` with header `token` (from [`getToken`](/api/get-token)). The body is the eSOA XML encrypted with **the cipher key PhilHealth issued to your health facility**. It uses the API-payload envelope: `docMimeType` `"text/xml"`, `hash` (SHA-256 of the plain XML), `key1` `""`, `key2` `""`, `iv`, `doc` ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). See [Encrypting API payloads](/guides/encryption/api-payloads).

```json
{
  "docMimeType": "text/xml",
  "hash": "<SHA-256 hex of the plain eSOA XML>",
  "key1": "",
  "key2": "",
  "iv": "<base64 of the 16-byte IV>",
  "doc": "<base64 of the AES-256-CBC ciphertext>"
}
```

The response has `success`, `message` and an encrypted `result`. When decrypted, the result "may contain" a JSON object with an array of errors: `{"errors": ["string1", "string2", "string3"]}` ([Guide p. 10](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=10)). The Guide's sample success response has `"success": true` and `"message": ""`. It does not document the decrypted content of a successful result ([KI-53](/known-issues#ki-53), [KI-42](/known-issues#ki-42)). The envelope says `docMimeType` `"text/xml"` even though the decrypted content is JSON ([KI-25](/known-issues#ki-25)).

The call itself uses the shared client from [API overview → Shared client setup](/api/#shared-client-setup):

::: code-group

```js [Node.js]
import { readFileSync } from 'node:fs';
import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';

const esoaBytes = readFileSync('esoa-sample.xml'); // validate, and later attach, these exact bytes
const env = assertSuccess(await pecwsPost('validateeSOA', seal(esoaBytes, 'text/xml')));
const { errors = [] } = JSON.parse(unseal(env.result)); // success result is undocumented (KI-53)
errors.forEach((e) => console.log('eSOA error:', e));
```

```python [Python]
import json
from pecws_client import pecws_post, seal, unseal, assert_success

with open("esoa-sample.xml", "rb") as f:
    esoa_bytes = f.read()  # validate, and later attach, these exact bytes
env = assert_success(pecws_post("validateeSOA", seal(esoa_bytes, "text/xml")))
errors = json.loads(unseal(env["result"])).get("errors") or []  # success result is undocumented (KI-53)
for e in errors:
    print("eSOA error:", e)
```

:::

We ran both snippets against a local mock server, not against PECWS. How to handle an empty or non-JSON result, and the complete validate-then-encrypt code, are on the [validateeSOA](/api/validate-esoa) page. Show the result to the user. SSVTF Part II C.II asks: "Does the system display warning errors and major errors?" and "Does the system display the eSOA validation result?" ([SSVTF p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11)).

### Step 4: Encrypt the eSOA for attachment

"After successful validation, the eSOA XML must be encrypted using the PhilHealth Public Key and submitted as an attachment" ([Guide p. 9](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). This is a **different scheme** from step 3 ([KI-12](/known-issues#ki-12)). Step 3 uses your cipher key, so your HF and PhilHealth can both decrypt it. Step 4 uses a random password and IV, each encrypted with PhilHealth's public key, so only PhilHealth can decrypt it. The full comparison is in [the two schemes side by side](/guides/encryption/#the-two-schemes-side-by-side).

Follow [Encrypting attachments](/guides/encryption/attachments). The public-key certificate bundled in the DevKit is an **expired test certificate**, so get the current one from PhilHealth ([KI-01](/known-issues#ki-01)). The attachment guideline doesn't name the RSA padding mode. Both demo kits use PKCS#1 v1.5 ([KI-59](/known-issues#ki-59)). The guideline says the encrypted file "may be renamed using the original file name followed by ".enc" extension" ([encryption guideline, p. 1](/originals/encryption/Guidelines%20for%20the%20Encryption%20of%20e-Claim%20Attachments.pdf#page=1)). Its `docMimeType` is the "MIME type of the attachment file", and the guideline's only example is `application/pdf` (p. 2). The DevKit doesn't say whether an XML attachment should use `text/xml` or `application/xml` ([KI-57](/known-issues#ki-57)). This site's examples use `text/xml`. Confirm with PhilHealth.

Encrypt **exactly the bytes you validated**. SSVTF Stage 2 checks that "the data of the decrypted file [are] the same as data in the raw eSOA XML file", and that raw and decrypted files are "the same using byte-by-byte comparison" ([SSVTF p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). Padding differences between the demo kits can break that comparison ([KI-13](/known-issues#ki-13)).

### Step 5: Host it at an HTTPS URL

Annex C describes `pDocumentURL` as the "URL of the document accessible via https", String(250). It adds: "The document must first be encrypted using philhealth public key before publishing online" ([Guide p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). SSVTF Stage 2 checks that the URLs "are accessible to PHILHEALTH via a web browser" and that the files are downloadable ([SSVTF p. 12](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)). The DevKit says nothing about authentication, retention or allowed hosts for these URLs ([KI-57](/known-issues#ki-57)).

### Step 6: Reference it in the eClaims XML

Add a `DOCUMENT` with type `ESA` ("Electronic Statement of Account (eSOA)", Annex B, [Guide p. 78](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=78)) to the claim's `DOCUMENTS`:

```xml
<DOCUMENTS>
  <DOCUMENT pDocumentType="CSF" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/CSF.enc"/>
  <DOCUMENT pDocumentType="ESA" pDocumentURL="https://files.samplehospital.example/eclaims/202609170001/ESA.enc"/>
</DOCUMENTS>
```

These URLs belong to this site's example claim (claim number `202609170001`, see [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml)) and are our own illustration. The Guide's eClaims sample uses the pattern `https://hospitalwebserver/eclaims/claimnumber/yyyymmdd000001.pdf` ([Guide p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)). Don't confuse `ESA` with `SOA` ("Statement of Account"). The Guide's eClaims sample attaches a `.pdf` file as `SOA`. See [Document types](/reference/document-types).

::: warning `CF2@pHasAttachedSOA` with an `ESA` attachment
The DevKit doesn't say whether `CF2@pHasAttachedSOA` must be `Y` when you attach an `ESA` document, or whether the flag refers only to the PDF `SOA` document type ([KI-62](/known-issues#ki-62)). Annex C also describes the attribute as "Type of Accommodation", a copy-paste error; its values are "With attached SOA" and "Without attached SOA" ([KI-32](/known-issues#ki-32)). Our example claim sets `pHasAttachedSOA="Y"` because it attaches an eSOA. That is our choice. Confirm with PhilHealth.
:::

### Step 7: Check and upload the claim

Once every attachment is hosted, run [`eClaimsFileCheck`](/api/eclaims-file-check) on the final eClaims XML, with the live URLs. Then send the same XML with [`uploadeClaims`](/api/upload-eclaims), store the eRECEIPT it returns (the RTN and TCN), and look the claim up with [`getUploadedClaimsMap`](/api/get-uploaded-claims-map). The Guide calls the upload method "EclaimsUpload" in the `validateeSOA` note, but the endpoint name is `uploadeClaims` ([KI-09](/known-issues#ki-09)).

The DevKit doesn't say how PECWS treats a second upload of the same claim. If an upload times out, check `getUploadedClaimsMap` before you send it again ([KI-62](/known-issues#ki-62)). The whole claim flow is in [Submitting a claim](/guides/submitting-a-claim).

## How to compute each amount

This section lists only what the sources define. Where they are silent, it says so.

### What each number means

| XML attribute | Definition (Annex D, [Guide p. 86–87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=86)) | Notes |
|---|---|---|
| `pChargesNetOfApplicableVat` | "Refed to the total charges net of applicable vat" | The DevKit does not give a VAT formula. Apply Bureau of Internal Revenue (BIR) rules (PC 2023-0026 V.S). |
| `pSeniorCitizenDiscount` | "The amount of senior citizen (SC) discount, if applicable" | Mandatory discount (PC 2023-0026 V.T). The rate comes from Republic Act (RA) 9994, not the DevKit. |
| `pPWDDiscount` | "The amount of Person with Disability (PWD) discount, if applicable" | Mandatory discount (PC 2023-0026 V.T). The rate comes from RA 10754, not the DevKit. |
| `pPCSO`, `pDSWD`, `pDOHMAP`, `pHMO` | "The amount of [PCSO / DSWD / DOHMAP / HMO] discount, if applicable" | PC 2023-0026 Annex A groups these under "Other Funding Sources". |
| `OtherFundSource@pAmount` | "The amount of other funding source discount, if applicable" (`pDescription` names the source) | Use it for sources without their own attribute. PC 2023-0026 Annex A lists examples: private health insurance, employee discounts, Malasakit, PIDAF. |
| `PhilHealth@pTotalCaseRateAmount` | "The amount of case rate package being claimed" | One total for `SummaryOfFees` and one for `ProfessionalFees`. See [Tie the amounts to the claim](#tie-the-amounts-to-the-claim). |
| `Balance@pAmount` | "The difference between the total amount of charges, net of applicable vat, for the room and board, drugs and medicine, laboratory and diagnostic, operating room and medical supplies charges, less applicable discounts and the case rate amount." | See the formula below. |
| `ItemizedBillingItem@pTotalAmount` | "i.e pTotalAmount = pQuantity x pUnitPrice" | PC 2023-0026 Annex A says the same: "This should equal the Price multiplied by the Quantity." |

PCSO is the Philippine Charity Sweepstakes Office, DSWD the Department of Social Welfare and Development, and DOH the Department of Health (Annex D). HMO means health maintenance organization (PC 2023-0026 V.T).

### The balance formula, as the sources define it

The circular gives the rule in plain words. For the Summary of Fees, the balance "represents the final balance that is directly charged to the patient. It should equal the Amount column with the Discount, PhilHealth, and Other Funding Sources deducted" ([PC 2023-0026 Annex A, p. 9](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=9)). Written with the XML attributes, using the [mapping of the circular's terms](#how-the-circular-s-annexes-relate-to-the-xml):

```text
SummaryOfFees/Balance@pAmount
  =   sum over the 6 categories of  SummaryOfFee@pChargesNetOfApplicableVat
    - sum over the 6 categories of (@pSeniorCitizenDiscount + @pPWDDiscount)          "Discount"
    - SummaryOfFees/PhilHealth@pTotalCaseRateAmount                                    "PhilHealth"
    - sum over the 6 categories of (@pPCSO + @pDSWD + @pDOHMAP + @pHMO
                                    + every OtherFundSource@pAmount)                   "Other Funding Sources"
```

For professional fees, PC 2023-0026 Annex A describes the balance as "The Amount with the Discount, PhilHealth, and HMO deducted" ([PC p. 10](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=10)). Its worked example also deducts "Other Funding Sources" (see below). In the XML, `ProfessionalFee` has no `OtherFundSource` child, so other funding for a professional fee can only go in `pPCSO`, `pDSWD`, `pDOHMAP` or `pHMO`:

```text
ProfessionalFees/Balance@pAmount
  =   sum over every ProfessionalFee of ( @pChargesNetOfApplicableVat
                                          - @pSeniorCitizenDiscount - @pPWDDiscount
                                          - @pPCSO - @pDSWD - @pDOHMAP - @pHMO )
    - ProfessionalFees/PhilHealth@pTotalCaseRateAmount
```

::: warning Gaps in the sources (KI-53)
- The Annex D balance definition lists only the five original categories. It doesn't mention `Others` (added in DTD 0.5), `OtherFundSource`, or the professional-fee balance ([KI-53](/known-issues#ki-53)). The formulas above include them because PC 2023-0026 Annex A deducts all "Other Funding Sources". That is our reading. Confirm with `validateeSOA` and PhilHealth.
- The circular's professional-fee balance deducts "Discount, PhilHealth, and HMO", but its own sample also deducts other funding sources. The XML has no `OtherFundSource` for professional fees, and one `PhilHealth` total for all physicians ([KI-53](/known-issues#ki-53)).
- The DevKit does not say how to split the case rate between `SummaryOfFees/PhilHealth` and `ProfessionalFees/PhilHealth`, or whether these amounts must match the case rate or the CF2 totals in the eClaims XML ([KI-53](/known-issues#ki-53)). The certification form's "Case Rate 1" and "Case Rate 2" have no place in the XML ([KI-52](/known-issues#ki-52)).
- All amounts must be between `0.00` and the Annex D maximum. The DevKit does not say what to do when deductions exceed charges, and a negative balance is outside the valid range ([KI-53](/known-issues#ki-53)).
- The DevKit does not document whether `validateeSOA` checks any of this arithmetic. Check it yourself before you send.
:::

### Tie the amounts to the claim

PC 2023-0026 V.Q requires "the integrity, accuracy, and consistency of data entries on the eSOA, Claim Form 2 (CF2), and hospital billing statement", but no DevKit document says which eSOA amount must equal which eClaims value ([KI-53](/known-issues#ki-53)).

::: tip Recommendation (not from PhilHealth): our mapping
Put the PhilHealth amounts from CF2 into the eSOA, and list the same professionals. Our [sample eSOA](/reference/esoa-xml#sample) and [`eclaims-minimal.xml`](/examples/eclaims-minimal.xml) follow this mapping:

| eSOA | eClaims XML | Our example |
|---|---|---:|
| `SummaryOfFees/PhilHealth@pTotalCaseRateAmount` | CF2 `BENEFITS@pTotalHCIFees` | 7,000.00 |
| `ProfessionalFees/PhilHealth@pTotalCaseRateAmount` | CF2 `BENEFITS@pTotalProfFees` | 3,000.00 |
| Sum of the two | `BENEFITS@pGrandTotal` and `CASERATE@pCaseRateAmount` | 10,000.00 |
| One `ProfessionalFee` per professional, `ProfessionalInfo@pPAN` | `PROFESSIONALS@pDoctorAccreCode` | `1504-2400015-3` |
| `eSOA@pHciTransmittalId` | `CLAIM@pClaimNumber` | `202609170001` |

In the example, CF2 says `pEnoughBenefits="Y"`: "the PhilHealth benefit is enough to cover HCI and PF charges" (HCI is the facility, PF the professional fees), with no purchases or professional-fee co-pay by the member ([Annex C, Guide p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). So the eSOA's charges equal the PhilHealth amounts, and both balances are `0.00`. When the benefit doesn't cover the whole bill, Annex C asks for `pEnoughBenefits="N"` and the `HCIFEES` and `PROFFEES` elements instead, each with its own `pPhilhealthBenefit`. Use the same PhilHealth amounts in both files.
:::

The [sample arithmetic](/reference/esoa-xml#sample-arithmetic) on the reference page explains every number of the sample.

### Worked example from the circular

PC 2023-0026 Annex A has a small sample for each component ([PC p. 9–11](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=9)). The same numbers appear on the PC 2023-0026 Annex B sample SOA (p. 12), which the DevKit also ships as [SSVTF Annex B](/originals/certification/SSVTF%20-%20Annex%20B%20-%20%20eSOA%20Minimum%20Data%20Elements.pdf). These numbers add up.

::: info This is the circular's illustration, not our XML sample
The tables below show the circular's own numbers: a different bill, with 2021 dates, discounts, other funding sources and two physicians. They are here to show how the deductions work. They are not in [`esoa-sample.xml`](/examples/esoa-sample.xml), which is the eSOA of this site's example claim.
:::

**Summary of Fees.** The sample gives deductions only as totals:

| Fee particulars | Amount | Discount | PhilHealth | Other funding sources | Balance |
|---|---:|---:|---:|---:|---:|
| Room and Board | 5,000.00 | | | | |
| Drugs and Medicines | 3,500.00 | | | | |
| Laboratory and Diagnostics | 4,000.00 | | | | |
| Operating Room Fees | 7,000.00 | | | | |
| Medical Supplies | 2,000.00 | | | | |
| **Total** | **21,500.00** | **(4,300.00)** | **(6,500.00)** | **(2,000.00)** | **8,700.00** |

Check: 21,500.00 − 4,300.00 − 6,500.00 − 2,000.00 = **8,700.00**.

**Professional Fees:**

| Physician | Amount | Discount | PhilHealth | Other funding sources | Balance |
|---|---:|---:|---:|---:|---:|
| Dr. Juan dela Cruz (123456) | 18,750.00 | (3,750.00) | 0.00 | 0.00 | 15,000.00 |
| Dr. Angel Santos (654321) | 21,000.00 | (4,000.00) | (2,000.00) | (3,000.00) | 12,000.00 |
| **Total** | | | | | **27,000.00** |

Check: 18,750.00 − 3,750.00 = 15,000.00, and 21,000.00 − 4,000.00 − 2,000.00 − 3,000.00 = 12,000.00. Their sum is **27,000.00**.

**Itemized Charges:**

| Service date | Item | Unit | Price | Quantity | Amount |
|---|---|---|---:|---:|---:|
| 2021-06-30 | Gloves | Box | 373.00 | 2 | 746.00 |
| 2021-07-01 | N95 Face Mask | Box | 246.00 | 2 | 492.00 |
| **Total** | | | | | **1,238.00** |

Check: 373.00 × 2 = 746.00, 246.00 × 2 = 492.00, and the total is **1,238.00**.

To encode a bill like this in XML:

- **Discounts.** The circular gives only the total discount. In the XML, each category's `SummaryOfFee` carries its own `pSeniorCitizenDiscount` or `pPWDDiscount`, so you must record the discount per category.
- **Other funding sources** go in `pPCSO`, `pDSWD`, `pDOHMAP` or `pHMO`, or in an `OtherFundSource` element with a description.
- **Professional fees.** The second physician's 2,000.00 PhilHealth amount goes into the single `ProfessionalFees/PhilHealth` total, and his 3,000.00 other funding must go into one of the four attributes, because `ProfessionalFee` has no `OtherFundSource` ([KI-53](/known-issues#ki-53)).
- **Dates** become `mm-dd-yyyy`, for example `06-30-2021`.

::: danger The Guide's own sample XML does not add up
The sample eSOA in the Implementation Guide ([p. 12–15](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12)) is valid against the DTD (we checked it with lxml), but its numbers are illustrative only ([KI-34](/known-issues#ki-34)):

- Charges total 23,900.00. The deductions are SC 1,000.00, PCSO 2,000.00, DSWD 1,000.00 and other fund source 3,000.00, and PhilHealth is 15,000.00. That leaves 1,900.00, but `Balance` says 3,500.00.
- `RoomAndBoard` has 2,000.00 in charges but 5,000.00 in deductions (PCSO 2,000.00 plus "Hello World Foundation" 3,000.00). There is also no room-and-board itemized line.
- The professional fee has charges of `0`, PhilHealth `2000.00`, and `Balance` `27180.00`.
- The complete blood count (CBC) line has `pUnitPrice="500.00" pQuantity="3" pTotalAmount="4000.00"`, but 500 × 3 is 1,500.
- `pItemCode=" 1898"` has a leading space.

Don't use it as a test vector. Use it only to see the shape of the XML.
:::

## Item codes and names

Every itemized line needs `pItemCode`, `pItemName` and `pUnitOfMeasurement`. The attributes are always present, but some values are empty. Annex D ([Guide p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87)) sets these rules:

| Case | `pItemCode` | `pItemName` | `pUnitOfMeasurement` |
|---|---|---|---|
| Item in the **eSOA Item Library** (supplies, laboratory, room and board, operating room) | The library code, for example `1545` | As listed in the library, for example `HEMATOLOGY: CBC` | The unit used, for example `PIECE`, `DAY` |
| Drug in the **Medicine Library** (`DrugsAndMedicine`) | The **30-character Drug Code**, for example `PARAC0000000047TAB490000000000` | The Medicine Library description, for example `PARACETAMOL 500 mg TABLET`. Annex D only says "as listed in eSOA and Item Library"; the Guide's sample uses the Medicine Library description. | **Blank** (`""`): "For Drug and Medicine Category, keep it blank." |
| Item **not in any library** | **Blank** (`""`): "For other item not included in the library, keep it blank" | "provide the complete description", for example `DENGUE NS1 ANTIGEN RAPID TEST` in our sample | The unit used (blank for drugs) |

Things to know about the libraries (details on the [eSOA libraries](/reference/libraries/esoa) page):

- The Item Library has 1,898 items in only four categories: `MedicalSupplies` (1,539), `LaboratoryAndDiagnostic` (357), `RoomAndBoard` (1: code `1897`), `OperatingRoomFees` (1: code `1898`). It has **no** `DrugsAndMedicine` or `Others` items. Drugs use the Medicine Library, and `Others` lines are always unlisted items (blank code).
- A keyword search of the laboratory items finds no imaging procedures (X-ray, ultrasound, CT, MRI, ECG) and no dengue test. Send those as unlisted items with a complete description.
- The SSVTF checks this directly: "Does the system capture other items not included in the provided library?" ([SSVTF p. 7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7)). Your HIS must allow free-text items.
- Annex D asks for 30-character drug codes, but one Medicine Library code has only 25 characters (`LOSA100000014650000000000`), and another has two segments swapped ([KI-39](/known-issues#ki-39)). Copy codes from the library. Don't build or pad them yourself.
- `pCategory` must be one of the six DTD values. For drugs it is `DrugsAndMedicine`, and the DTD doesn't check that the code "looks like" a drug. Keep your mapping tables clean.
- The Medicine Library ends with `NOMED0000000000000000000000000` ("DRUGS AND MEDICINES NOT NEEDED DURING THIS PARTICULAR EPISODE OF CARE"). This code is used in CF4. Annex D does not say whether an eSOA needs a `NOMED` line when no drugs were given ([KI-53](/known-issues#ki-53)). Confirm with PhilHealth before you add one.

::: warning Guide sample vs Annex D: unit of measurement for drugs
The Guide's sample XML ([p. 14](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=14)) has an unlisted drug line with `pCategory="DrugsAndMedicine"` and `pUnitOfMeasurement="SAMPLE UNIT"`. Annex D says that for the Drug and Medicine category you should keep the unit of measurement blank, and it makes no exception for unlisted drugs ([KI-53](/known-issues#ki-53)). We recommend following Annex D (blank) for every `DrugsAndMedicine` line. Check the `validateeSOA` response to confirm.
:::

`pServiceDate` also depends on the item type. It is "the date of service for room and board, laboratory and diagnostic service and operating room fees; the date of issuance for drugs and medicine and medical supplies" (Annex D).

## Header identifiers

| Attribute | Meaning (Annex D) | Tips |
|---|---|---|
| `eSOA@pHciPan` | "The accreditation number issued by PhilHealth to the health facility", Varchar2(9) | The Guide sample uses the placeholder `HXXXXX678`; our example uses `H12345678`. Lengths and formats of PhilHealth identifiers are inconsistent across the DevKit, and it doesn't say which facility identifier (PAN or PMCC number) each API method expects ([KI-31](/known-issues#ki-31), [KI-48](/known-issues#ki-48)). |
| `eSOA@pHciTransmittalId` | "A UNIQUE reference number assigned to the claim by the submitting health facility", Varchar2(50) | Annex D calls it `pTransmittalId`, but the DTD name is `pHciTransmittalId` ([KI-33](/known-issues#ki-33)). The DevKit does not say whether it must equal the eClaims `CLAIM@pClaimNumber` or `eTRANSMITTAL@pHospitalTransmittalNo` ([KI-53](/known-issues#ki-53)). Our examples use the claim number (`202609170001`); that is our choice. Keep a stored mapping, and confirm with PhilHealth. |
| `ProfessionalInfo@pPAN` | "The corresponding PhilHealth Accreditation Number (PAN) of the attending Physician", Varchar(14) | 14 characters fits the dashed form of PhilHealth's dummy test PANs, for example `1504-2400015-3` ([test data](/reference/test-data)). Annex C gives professional PANs a different format ([KI-48](/known-issues#ki-48)). |

The eSOA has no patient name, PhilHealth Identification Number (PIN) or diagnosis. It is linked to the patient through the claim: it is attached to that claim as an `ESA` document, and `pHciTransmittalId` is the facility's reference number for the claim.

## How the circular's annexes relate to the XML

PC 2023-0026 Annex A and Annex B are **conceptual**. They describe the data in business terms ("Amount", "Discount", "Other Funding Sources") and show only **five** categories. The real XML format is `ESOA.dtd` v0.5, which uses different names and adds a sixth category, `Others` ([KI-04](/known-issues#ki-04)). Use this mapping:

| PC 2023-0026 Annex A column | XML attribute(s) in `ESOA.dtd` v0.5 |
|---|---|
| Summary of Fees: Particular (Room and Board, Laboratory, ...) | The category element: `RoomAndBoard`, `DrugsAndMedicine`, `LaboratoryAndDiagnostic`, `OperatingRoomFees`, `MedicalSupplies`, `Others` |
| Amount ("The total amount being charged for the cost item") | `SummaryOfFee@pChargesNetOfApplicableVat` (called `pActualCharges` before DTD 0.4) |
| Discount ("discounts for persons with disabilities (PWD) or senior citizens (SC)") | `@pSeniorCitizenDiscount`, `@pPWDDiscount` |
| Other Funding Sources ("HMO, private health insurance, employee discounts, PCSO-IMAP, DOH-MAP, Malasakit, PIDAF") | `@pPCSO`, `@pDSWD`, `@pDOHMAP`, `@pHMO`, plus any number of `OtherFundSource` elements (`pDescription`, `pAmount`) |
| PhilHealth ("The amount of benefit coverage provided by PhilHealth") | `PhilHealth@pTotalCaseRateAmount`, **one total** per component, not per category |
| Balance | `Balance@pAmount`, **one total** per component |
| Professional Fees: Physician Accreditation Number, Physician Name | `ProfessionalInfo@pPAN`, `@pFirstName`, `@pMiddleName`, `@pLastName`, `@pSuffixName` |
| Itemized Charges: Service Date, Item Name, Unit of Measurement, Price, Quantity, Amount | `ItemizedBillingItem@pServiceDate`, `@pItemName`, `@pUnitOfMeasurement`, `@pUnitPrice`, `@pQuantity`, `@pTotalAmount`, plus `@pItemCode` and `@pCategory` (not in PC 2023-0026 Annex A) |

The Annex F sub-category library lists a "DOH MEDICAL ASSISTANCE PROGRAM" entry, which matches `pDOHMAP` ([libraries](/reference/libraries/esoa#c-sub-category-library)).

The circular's samples also use date styles that the XML does not accept: PC 2023-0026 Annex A shows `2021-06-30` and PC 2023-0026 Annex B shows `6/30/2021`. In the XML, `pServiceDate` is `mm-dd-yyyy`, for example `06-30-2021` ([Annex D, Guide p. 87](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=87)).

The PC 2023-0026 Annex B sample SOA also has a header block: SOA reference number, health care provider name and address, patient name, age and address, final and other diagnoses, and admission and discharge date and time ([PC p. 12](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=12)). Its Summary of Fees column is labeled "Mandatory Discount" rather than "Discount". `ESOA.dtd` has no attributes for the header fields. The XML carries only the facility PAN, a transmittal ID and the three components.

::: warning Certification checklist lists fields the DTD doesn't have
The SSVTF (Part II, A.I.1.a, [p. 5](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5)) asks whether the system captures these Summary of Fees elements: "Particulars, Actual Charges, **VAT Exemption**, Senior Citizen/PWD, **Case Rate 1**, **Case Rate 2**, Other Funding Sources, Balance" ("See Annex B", meaning SSVTF Annex B).

`ESOA.dtd` v0.5 has no VAT-exemption attribute and no separate first/second case rate. It has `pChargesNetOfApplicableVat` and a single `PhilHealth@pTotalCaseRateAmount`. SSVTF Annex B doesn't show those columns either ([KI-52](/known-issues#ki-52)). The DevKit doesn't explain how the checklist items map to the XML. Our reading: the VAT exemption is already reflected in the "net of applicable VAT" amount, and the word "Total" suggests the sum of the case rates. That is an interpretation, not a PhilHealth statement. Capture the separate values in your HIS anyway, and confirm the mapping with PhilHealth before certification.
:::

## Background: PhilHealth Circular 2023-0026

You don't need this section to write the XML. It explains where the rules above come from, and it decides which claims need an eSOA.

| Item | Value |
|---|---|
| Title | Electronic Data Submission of the Statement of Account (SOA) for All Case Rates (ACR) Claims and Identified PhilHealth Benefits (Revision 1) |
| Signed | 11/14/2023, by Emmanuel R. Ledesma, Jr., President and CEO ([PC p. 8](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=8)) |
| Effectivity | "fifteen (15) days after the completion of its publication in a newspaper of general circulation" (section X) |
| Repeals | PhilHealth Circular No. 2023-0004, the earlier eSOA circular (section IX, [PC p. 7](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=7)) |
| Annexes | PC 2023-0026 Annex A "Data Definitions and XML Format for the Summary of Fees, Professional Fees, and Itemized Charges" (p. 9–11); PC 2023-0026 Annex B "Minimum Data Elements of the eSOA" (p. 12) |

The PDF in the DevKit is a scanned image. It has no text layer, so you can't search it. The quotes on this page were transcribed from the page images.

### Terms the circular defines

Circular 2023-0026 (section IV) defines the terms you will meet in the XML ([PC p. 2–3](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=2)):

| Term | Definition in PC 2023-0026 | Where it lives in the XML |
|---|---|---|
| Statement of Account (SOA) | "the document generated by the HF that reflects the summary of all service charges, including professional and reader's fees, for the episode of care. The SOA does not reflect charges for services before or after patient confinement." | The whole `eSOA` document |
| Summary of Fees | "the SOA component that summarizes the main cost items for the hospital confinement or episode of care. It includes total charges, deductions, and balances." | `SummaryOfFees` |
| Professional Fees | "the component of the SOA detailing the charges declared by the attending physicians, specialists, and other attending healthcare professionals ... Reader's fee is also considered a professional fee." | `ProfessionalFees` |
| Itemized Charges | "the hospital charges for all services delivered during the episode of care", for example room and board, drugs and medicines, laboratory tests, supplies, professional fees, blood bank, dietary, laundry | `ItemizedBillingItems` |
| Out-of-Pocket Payment | "the balance of healthcare provider charges that are paid directly by the patients" | The `Balance` elements |

"Health Facility (HF)" was "formerly termed healthcare institution (HCI)" (IV.C). That older term probably explains DTD names like `pHciPan`; the DevKit doesn't say so explicitly.

### Why PhilHealth wants it

The circular's rationale ([PC I, p. 1](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1)) ties the eSOA to the Universal Health Care Act (Republic Act No. 11223): PhilHealth wants to monitor "the support value of its benefits packages". It says: "the eSOA serves as a data source not only for accurate claims processing and reimbursement but also to improve understanding of the cost drivers, especially for inpatient episodes of care, that are useful for policy research."

Section V.A adds that PhilHealth uses the eSOA to "verify services provided", and for "policy research, describing health-related expenses and cost drivers, costing analyses, understanding provider practice, utilization reviews, monitoring, etc." ([PC p. 3](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=3)).

For you as a developer, this means the numbers must be **real and internally consistent**. PhilHealth reads the eSOA as data, not just as a picture of a bill.

### Scope and exclusions

Section III ([PC p. 1–2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=1)):

- **Applies to** "all accredited HFs that will submit eClaims for ACR".
- **Covers** the ACR claims of PhilHealth members in all accredited HFs.
- **Excludes** claims for the COVID-19 Community Isolation Benefit Package (CCIBP), the COVID-19 Home Isolation Benefit Package (CHIBP), *Konsulta*, and Z Benefits. "PhilHealth shall disseminate separate policies for the submission of SOA for *Konsulta* and the Z Benefits."
- **Also includes** these outpatient benefit packages:
  1. Outpatient HIV/AIDS Treatment (OHAT)
  2. TB DOTS Package
  3. Outpatient Malaria Package
  4. Animal Bite Treatment Package
  5. Hemodialysis covering 156 sessions

Two more rules narrow or redirect the scope:

- **Members confined abroad**: "PhilHealth will not require the submission of SOA in XML format". The member submits equivalent documents instead (V.J, [p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)).
- **Medical Detoxification Package** and **Outpatient Benefit Package for the Secondary Prevention of Rheumatic Fever/Rheumatic Heart Disease** follow the SOA rules in Section V.B of PhilHealth Circular No. 2022-0024 instead (V.Y, [p. 6](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=6)). That circular is not in the DevKit.

::: tip Recommendation (not from PhilHealth)
Put the "does this claim need an eSOA?" decision in one function of your hospital information system (HIS). Base it on the benefit type and confinement location, and cover it with tests for each excluded package. The rules above come from different sections of the circular and are easy to miss one by one.
:::

### The three components, and what happens if one is missing

- V.B: the eSOA "includes the three (3) major components: summary of fees, professional and reader's fees, and the itemized charges" ([p. 3](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=3)).
- V.N: "A complete and proper SOA submission in XML format should reflect three (3) major components ... **PhilHealth shall return to the HF any claim that lacks any of the three (3) major components of the SOA.**" ([p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4))

The DTD enforces the three components as the required children `SummaryOfFees`, `ProfessionalFees` and `ItemizedBillingItems`, in that order. It also requires at least one `ItemizedBillingItem`. However, the DTD allows a `ProfessionalFees` element with **zero** `ProfessionalFee` children (`ProfessionalFee*`). The DevKit does not say whether PhilHealth treats a claim with no professional fees as "lacking" that component ([KI-53](/known-issues#ki-53)). Confirm with PhilHealth.

### Other rules that affect your software

| Section | Rule (quoted or closely paraphrased) | What it means for your HIS |
|---|---|---|
| V.C ([p. 3](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=3)) | PhilHealth "shall not prescribe a format for the SOA generated by the HF as long as it contains the three (3) major components". HFs "can use the suggested SOA format (Annex B ...) if it does not generate a document that includes the three (3) major components". | Your printed SOA can keep its own layout. The **XML** must still follow the DTD. The "Annex B" here is PC 2023-0026 Annex B. |
| V.K ([p. 4](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)) | No member or patient signature is required in the eSOA, "except when the system for eSOA enables the requirement such as a digital signature or digital fingerprint". | The DTD has no signature fields. |
| V.O, V.R ([p. 4–5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=4)) | The member/patient (or representative) and the HF billing section attest to the eSOA in the claims signature form (CSF). The HF's authorized signatory certifies it "in the CSF or using a system-generated signature indicating the authorized signatory's name and official designation". | The attestation happens on the CSF, which is a separate attachment. |
| V.Q ([p. 5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)) | "The HF shall ensure the integrity, accuracy, and consistency of data entries on the eSOA, Claim Form 2 (CF2), and hospital billing statement." | Generate the eSOA from the same billing data as your printed bill and CF2. Don't re-key it. See [Tie the amounts to the claim](#tie-the-amounts-to-the-claim). |
| V.S ([p. 5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)) | HFs follow Republic Act (RA) No. 9994 (Expanded Senior Citizens Act of 2010), RA 10754 (benefits of persons with disability) and Bureau of Internal Revenue (BIR) rules on value-added tax (VAT). | Discount rates and VAT rules come from these laws, not from the DevKit. |
| V.W ([p. 5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)) | "The HF may provide a printed or electronic copy of the SOA to the member or patient free of charge." | Optional feature. |
| V.BB ([p. 6](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=6)) | "PhilHealth may update the DTD and eSOA XML formats as necessary." HFs and service providers should coordinate with the Unified PhilHealth Electronic Claims System – Electronic Medical Record (UPECS-EMR) Team for the latest versions. | Check that you have the newest `ESOA.dtd` before certification. |

### Deduction order

Three sections define who pays first ([PC V.T–V.V, p. 5](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)):

1. **V.T** "PhilHealth benefits and all mandatory discounts provided by law, such as, but not limited to, senior citizen and PWD discounts, shall be deducted **first** from the total hospital bill of the patient. Benefits from private health insurance (PHI), health maintenance organizations (HMO), or employee benefits shall be applied **after** PhilHealth deductions and complement the PhilHealth benefits packages. Accredited HFs shall reflect all benefits and discounts in the itemized billing statement and eSOA."
2. **V.U** HFs "shall follow the order of charging based on Joint Administrative Order No. 2020-0001", the operational guidelines for the Medical and Financial Assistance to Indigent and Financially-Incapacitated Patients under Republic Act No. 11463 ("Malasakit Centers Act of 2019"). That order is not in the DevKit.
3. **V.V** "After the accredited HF deducts the PhilHealth benefits, mandatory discounts, HMO, or Malasakit, the remaining chargeable amount is the out-of-pocket."

PWD means persons with disability.

### Treatments with many visits

If a patient has "a treatment cycle necessitating several episodes of care or more than one encounter", the eSOA "should reflect all the service charges for the applicable period or treatment cycle" (V.X, [PC p. 5–6](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=5)):

| Package | What one eSOA covers |
|---|---|
| Outpatient HIV/AIDS Treatment (OHAT) | The charges for services provided during the applicable **quarter**, "while ensuring privacy and protection of patient identification in processing OHAT claims" |
| TB DOTS Package | Charges for services provided during the **entire treatment phase** (intensive phase or continuation phase) |
| Outpatient Malaria Package | Charges for complete health services "including consultations, laboratory tests, treatment, and follow-up malarial smear during the entire treatment phase" |
| Animal Bite Treatment Package | Charges for the health services given "during the entire course of vaccination and treatment of animal bite" |
| Hemodialysis | Services **per session** of patients with chronic kidney disease stage 5 (CKD5) who are registered in the PhilHealth dialysis database (PDD) |
| Other benefits "such as chemotherapy, radiotherapy, etc." | All prospective benefit packages "necessitating several episodes of care or repetitive procedures" follow the same principle |

In the XML, this means one `eSOA` holds many `ItemizedBillingItem` rows with different `pServiceDate` values. The DevKit does not give more detail (for example, how to date an OHAT quarter). Confirm with PhilHealth.

### Transitory clause

Section VII ([PC p. 7](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=7)) sets the rollout:

- **A.** "Upon effectivity of this PhilHealth Circular", PhilHealth starts eSOA certification of service providers "within two months (2) or upon completion of the software system for the implementation of a functional enhanced eClaims system with integrated eSOA module, whichever comes available".
- **B.** All accredited HFs "shall submit the eSOA in an XML format via the eClaims system within two (2) months from the orientation of service providers on the enhanced eClaims system and/or issuance of the eSOA certification for service providers".
- **C.** PhilHealth will issue a separate advisory on implementing the eSOA/XML submission via the enhanced eClaims system, and on revising the claim signature form (CSF).
- **D.** "While the certification of the hospital information system (HIS) for the submission of eSOA is on-process, the concerned HFs may submit the PDF copy of the SOA following PC no. 2017-0014".

The DevKit does not include the advisories that set actual dates. Confirm the deadline that applies to you with PhilHealth.

## Certification checklist (SSVTF Part II, eSOA)

The eSOA module can be certified "jointly or separately" with the CF5 module (PA 2024-0032) ([SSVTF p. 13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=13)). The eSOA items are:

| Stage / part | Criterion (abridged) | Page |
|---|---|---|
| Stage 1, A.I.1 | Captures the eSOA data elements (see SSVTF Annex B): **a.** Summary of Fees (Particulars, Actual Charges, VAT Exemption, Senior Citizen/PWD, Case Rate 1, Case Rate 2, Other Funding Sources, Balance); **b.** Professional Fees (PAN, Physician Name, Amount, Mandatory Discount, PhilHealth Benefits, Other Funding Sources, Balance); **c.** Itemized Billing (Service Date, Item Name, Unit of Measurement, Price, Quantity, Amount). Some of these have no place in the DTD ([KI-52](/known-issues#ki-52)). | [p. 5–6](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=5) |
| Stage 1, A.I.2 | Captures Summary of Fees and Itemized Billing items for Room And Board, Drugs And Medicine, Laboratory And Diagnostic, Operating Room Fee, Medical Supplies, Others | [p. 6–7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6) |
| Stage 1, A.I.3 | Captures items not in the provided library | [p. 7](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=7) |
| Stage 1, B.I | Generates the eSOA XML; uploads and attaches the encrypted eSOA to the claim; eSOA is displayed in the NClaims Web (not described in the DevKit, [KI-56](/known-issues#ki-56)) | [p. 9–10](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9) |
| Stage 1, C.II | Displays warning and major errors, and the eSOA validation result | [p. 11](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=11) |
| Stage 2, A–B | Encrypted file reachable by URL and downloadable; decryptable; decrypted data equals the raw eSOA XML, byte for byte | [p. 12–13](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=12) |

See [Certification](/guides/certification) for the whole form.

## Known issues that touch the eSOA

- [KI-53](/known-issues#ki-53): the balance and funding-source rules are incomplete. Nothing links `pHciTransmittalId` or the `PhilHealth` amounts to the eClaims XML. The edge cases (no professional fee, `NOMED`, negative balances, fractional quantities, number formats) are not covered, and the `validateeSOA` success result is undocumented.
- [KI-52](/known-issues#ki-52): the certification form asks for fields the DTD doesn't have (VAT exemption, Case Rate 1 and 2).
- [KI-62](/known-issues#ki-62): submission rules the DevKit doesn't cover, including `CF2@pHasAttachedSOA` with an `ESA` attachment, XML encoding, and duplicate uploads.
- [KI-04](/known-issues#ki-04): naming and format history (`pActualCharges` became `pChargesNetOfApplicableVat`; `Others` was added in DTD 0.5; the circular's annexes use business names and five categories).
- [KI-33](/known-issues#ki-33): Annex D attribute names differ from the DTD (`pTransmittalId`, `PChargesNetOfApplicableVat`, `pPWDDIscount`, `PTotalCaseRateAmount`). Use the DTD.
- [KI-34](/known-issues#ki-34): the Guide's sample XML doesn't add up and has a leading space in `" 1898"`.
- [KI-31](/known-issues#ki-31), [KI-48](/known-issues#ki-48): identifier lengths and formats (`pHciPan`, `pPAN`).
- [KI-39](/known-issues#ki-39): data-quality problems in the libraries, including two irregular drug codes.
- [KI-12](/known-issues#ki-12), [KI-01](/known-issues#ki-01), [KI-13](/known-issues#ki-13), [KI-59](/known-issues#ki-59): the two encryption schemes, the expired test certificate, padding, and the RSA padding mode.
- [KI-25](/known-issues#ki-25): `docMimeType` in responses. [KI-57](/known-issues#ki-57): `docMimeType` and hosting for XML attachments. [KI-60](/known-issues#ki-60): text encoding.
- [KI-32](/known-issues#ki-32): Annex C describes `pHasAttachedSOA` as "Type of Accommodation".
- [KI-09](/known-issues#ki-09): the Guide calls `uploadeClaims` "EclaimsUpload".

## Common mistakes

- **Using Annex D spellings or pre-v0.4 names in the XML.** `pTransmittalId` and `PChargesNetOfApplicableVat` (Annex D) and `pActualCharges` (DTD before v0.4) all fail DTD validation. For example, lxml reports `No declaration for attribute pActualCharges of element SummaryOfFee`.
- **Leaving out an empty category.** Without `<Others>`, lxml reports `Element SummaryOfFees content does not follow the DTD, expecting (RoomAndBoard , DrugsAndMedicine , LaboratoryAndDiagnostic , OperatingRoomFees , MedicalSupplies , Others , PhilHealth , Balance)`. The same happens when a medical case leaves out `OperatingRoomFees`.
- **Omitting "empty" attributes.** `pSuffixName` must be present even when it is `""`.
- **Writing categories as labels.** `pCategory="Medical Supplies"` fails. The value must be `MedicalSupplies`.
- **Encrypting the attachment with the cipher key**, or the `validateeSOA` body with the public key. These are different schemes.
- **Building drug codes from drug names.** Omeprazole's codes start with `ESOM1`, not `OMEPR`. Always look codes up in the Medicine Library.
- **Storing library codes as numbers.** Leading or trailing spaces and number formatting change the code. Keep codes as text.
- **Filling a unit of measurement for drugs.** Annex D says to keep it blank.
- **Letting the eSOA and CF2 disagree.** Different professionals, or `PhilHealth` amounts that don't match the CF2 benefit, break PC 2023-0026 V.Q consistency. Build both from the same billing data ([Tie the amounts to the claim](#tie-the-amounts-to-the-claim)).
- **Treating the Guide sample as correct arithmetic** ([KI-34](/known-issues#ki-34)).

## Related pages

- [eSOA XML reference](/reference/esoa-xml): every element and attribute, the raw DTD, and a DTD-valid sample with its arithmetic
- [eSOA libraries](/reference/libraries/esoa): Item, Category, Sub-Category, Bill Type and Medicine libraries
- [validateeSOA](/api/validate-esoa): the API method, with complete validate-then-encrypt code
- [Encryption overview](/guides/encryption/), [Encrypting API payloads](/guides/encryption/api-payloads) and [Encrypting attachments](/guides/encryption/attachments)
- [Submitting a claim](/guides/submitting-a-claim), [Claims lifecycle](/getting-started/claims-lifecycle) and [Document types](/reference/document-types)
- [Validating XML](/guides/validating-xml)
- [Certification](/guides/certification)
- [Known issues](/known-issues)
