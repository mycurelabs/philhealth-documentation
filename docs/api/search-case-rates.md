---
title: searchCaseRates
description: Look up PhilHealth case-rate codes and amounts for a benefit package by ICD code, RVS code or description, for one date or for every period the rate has been in effect.
---

# searchCaseRates

Look up the case-rate code and PhilHealth's amounts for a benefit package, either for one date (for example, an admission date) or for every period the rate has been in effect.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

| | |
|---|---|
| **Method** | `POST` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/searchCaseRates` (the host is not in the DevKit: [KI-30](/known-issues#ki-30)) |
| **Auth header** | `token` (from [getToken](/api/get-token)) |
| **Request body** | Plain JSON object with `icdcode`, `rvscode`, `description` and `targetdate`. The Guide does not describe it as encrypted. A revision note contradicts this format ([KI-46](/known-issues#ki-46)). |
| **Response `result`** | Encrypted with your cipher key. Once decrypted it is JSON: `eCASERATES.CASERATES[]`, one entry per case rate per effectivity period. |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 37–41: Search Case Rates Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)
- [Implementation Guide, p. 3: revision history (20240215, 20240216)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 25 and p. 31: `CASERATE` in the eClaims DTD and upload sample](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=31)
- [Implementation Guide, p. 80–82: Annex C data dictionary (`pICDCode`, `pRVSCode`, HCI fees, `pCaseRateCode`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)
- [Implementation Guide, p. 75–76: Annex A, cipher-key encryption](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Software Solution Validation Test Form (rev. 20250217), p. 3: Module 2, item 5](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [PhilHealth Claim Form 4 (February 2020), p. 1: "1st / 2nd Case Rate Code"](/originals/cf4/PhilHealth_ClaimForm4_February_2020.pdf#page=1)
:::

::: tip TL;DR
1. Get a fresh token, then `POST` a **plain** JSON body with all four keys: `icdcode`, `rvscode`, `description`, `targetdate`. Use `""` for keys you don't need, and `mm-dd-yyyy` (usually the admission date) for `targetdate`. The [shared client](/api/#shared-client-setup)'s `pecwsPost` does both.
2. Decrypt `result` with your cipher key (`unseal()` in the shared client). The decrypted content is **JSON** (`eCASERATES.CASERATES[]`), although the Guide calls it XML ([KI-47](/known-issues#ki-47)).
3. Pick the entry whose effectivity period covers the admission date. Don't assume the first entry is the current one.
4. Copy `pCaseRateCode` and the amount into `CASERATE` in the eClaims XML.

The input format, the samples and several output fields are contradictory or undefined ([KI-46](/known-issues#ki-46), [KI-42](/known-issues#ki-42)), so test against PhilHealth's test environment.
:::

## When to use it

A **case rate** is the amount PhilHealth pays for a benefit package under the All Case Rates (ACR) provider payment mechanism ([Guide p. 6](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=6), p. 37). You find a package by its diagnosis code (an International Classification of Diseases, ICD-10, code), its procedure code (a Relative Value Scale, RVS, code) or its name. That is why the method has `icdcode`, `rvscode` and `description` inputs. See the [glossary](/getting-started/glossary) for these terms.

Use `searchCaseRates` in these situations:

1. **While building the claim XML.** Every `ALLCASERATE/CASERATE` element in the [eClaims XML](/reference/eclaims-xml) needs `pCaseRateCode`, `pICDCode`, `pRVSCode` and `pCaseRateAmount` (eClaims DTD, [Guide p. 25](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=25)). Annex C says of `pCaseRateCode`: "See Case Rate Library" ([p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82)). The DevKit contains no case-rate library file, so this method is the documented way to look codes and amounts up.
2. **To show billing staff the expected PhilHealth amount** for an admission, using the admission date as `targetdate`.
3. **For certification.** The Software Solution Validation Test Form (SSVTF) Module 2, item 5 asks: "Does the system provide an interface for searching case rates?" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

::: tip Recommendation (not from PhilHealth)
The response field names match the upload XML attributes: `pCaseRateCode` goes to `CASERATE@pCaseRateCode`, and the amount goes to `CASERATE@pCaseRateAmount`. PhilHealth does not state this mapping, so confirm which amount (primary or secondary) belongs in `pCaseRateAmount` for a second case rate.
:::

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PhilHealth e-Claims Web Service (PECWS) authentication token from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). | Guide p. 37 |
| `Content-Type` | `application/json` | Not specified by the DevKit. Recommendation (not from PhilHealth): send it because the body is JSON. |

### Body

The body is a **plain JSON object**, not the encrypted envelope used by [uploadeClaims](/api/upload-eclaims). The Guide calls it "The JSON object" and shows it unencrypted ([Guide p. 37–38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)).

```json
{
  "icdcode": "",
  "rvscode": "",
  "description": "DENGUE",
  "targetdate": "02-14-2024"
}
```

| Key | Type / format | Description (Guide p. 37) |
|---|---|---|
| `icdcode` | String (as in the sample) | "The ICD code of the target benefit package". Annex C describes `pICDCode` as the "ICD 10 Code of the illness", String(15) ([p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). |
| `rvscode` | String (as in the sample) | "The RVS code of the target benefit package". Annex C describes `pRVSCode` as the "Relative Value Scale Code of the procedure/operation performed", String(6). |
| `description` | String (as in the sample) | "Substring or full text of the name or description of the target benefit packages". |
| `targetdate` | `mm-dd-yyyy`, or `""` | "Format: mm-dd-yyyy". Normally the admission date of the claim. With a valid date, the method returns only the record for the period that covers that date. With an empty string, it returns **all** the periods of the matching packages. |

#### How `targetdate` changes the result

- `"targetdate": "02-14-2024"` should return only the record whose effectivity period includes 14 February 2024.
- `"targetdate": ""` returns "all the applicable periods of the target benefit packages" (Guide p. 37).

::: warning The filter rules are not specified
The DevKit does **not** say:

- which keys are required, or whether you may omit a key instead of sending `""`;
- whether several filters combine as AND or OR;
- whether `description` matching is case-sensitive;
- what happens when `targetdate` is not a valid `mm-dd-yyyy` date.

Confirm these with PhilHealth. See [KI-46](/known-issues#ki-46). Recommendation (not from PhilHealth): send all four keys, with `""` for the ones you don't use, exactly as the official sample does.
:::

::: warning Conflicting sources: "comma separated list" vs JSON object
Revision **20240216** of the Guide says: "Changed the parameter of SearchCaseRate method from object input parameters to comma separated list of input parameters" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

The method section of the same Guide (rev. 20250217) documents a **JSON object** body with four named keys and shows a JSON object sample ([p. 37–38](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=37)). The DevKit shows no comma-separated example.

**We recommend the JSON object** because it is the only concrete, complete specification in the current Guide, and the revision note does not say what the "comma separated list" looks like. It may simply describe the flat key-value pairs of the JSON object. If PECWS rejects the JSON body, ask PhilHealth for the exact format. See [KI-46](/known-issues#ki-46).
:::

## Response

### Envelope

| Key | Value (Guide p. 38) |
|---|---|
| `success` | `true` when the operation succeeded. |
| `message` | The error message, if an error occurred. The DevKit lists no error codes or messages for this method ([KI-42](/known-issues#ki-42)). |
| `result` | An encrypted envelope, encrypted with **your health facility's cipher key**: `docMimeType` (documented as `"text/xml"`), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc`. |

Decrypt `result` as described in [API payload encryption](/guides/encryption/api-payloads). The Output table mixes formats: the `result` row calls the content "the XML text", the `doc` row calls it "the JSON object" and promises "Sample XML text and the DTD of the XML text", and the sample's heading says "Sample Decrypted XML Text". The sample itself is **JSON**, and no DTD is shown ([p. 38–39](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=38); [KI-47](/known-issues#ki-47)). Parse it as JSON, and don't choose the parser from `docMimeType` ([KI-25](/known-issues#ki-25)).

### Decrypted result structure

```text
eCASERATES
└── CASERATES[]                 one entry per case rate per effectivity period
    ├── AMOUNT
    │   ├── pPrimaryCaseRate
    │   ├── pPrimaryHCIFee
    │   ├── pPrimaryProfFee
    │   ├── pSecondaryCaseRate
    │   ├── pSecondaryHCIFee
    │   ├── pSecondaryProfFee
    │   └── pCheckFacility…     18 flags, each "T" or "F"
    ├── pCaseRateCode
    ├── pCaseRateDescription
    ├── pItemCode
    ├── pItemDescription
    ├── pEffectivityDate
    └── pEffectivityEndDate
```

The Guide gives **no field dictionary** for this output, only the sample ([p. 39–41](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=39); [KI-42](/known-issues#ki-42)). The descriptions below come from the key names, the sample values and related Annex C definitions. Anything inferred is labeled as such. All values in the sample are **strings**, including amounts and flags.

#### `CASERATES[]` entry

| Key | Sample value | Meaning |
|---|---|---|
| `AMOUNT` | object | The amounts and facility flags for this period (next table). |
| `pCaseRateCode` | `"CR0389"` | The case-rate code. Same name and 6-character format as `CASERATE@pCaseRateCode` in the upload XML (Annex C: String(6), "Case Rate Codes for All Case Rates"; the upload sample uses `CR0001`, `CR0002`). |
| `pCaseRateDescription` | `"DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)"` | Name of the benefit package. |
| `pItemCode` | `"90945"` | Not defined in the DevKit. It appears to be the ICD or RVS code the case rate is attached to (inference). In the sample, `90945` describes a procedure and has the same 5-digit form as the RVS codes in the Guide's upload sample, for example `90935` for hemodialysis (p. 29). |
| `pItemDescription` | same text as `pCaseRateDescription` | From the name, the description of `pItemCode` (inference). Identical to `pCaseRateDescription` in all four sample entries. |
| `pEffectivityDate` | `"02-14-2024"` | First day this entry applies (`mm-dd-yyyy`). |
| `pEffectivityEndDate` | `"12-31-9999"` | Last day this entry applies. `12-31-9999` means the period has no end date yet (see [Effectivity periods](#effectivity-periods)). |

#### `AMOUNT` object

| Key | Sample value (current period) | Meaning |
|---|---|---|
| `pPrimaryCaseRate` | `"3380.0"` | From the name, the total case-rate amount (inference). In all four sample entries it equals `pPrimaryHCIFee + pPrimaryProfFee` (for example 2925.0 + 455.0 = 3380.0). |
| `pPrimaryHCIFee` | `"2925.0"` | From the name, the Health Care Institution (HCI) share, that is, the facility's portion (inference). HCI is PhilHealth's former term for a health facility (HF) ([PC 2023-0026 p. 2](/originals/esoa/Electronic%20Submission%20of%20the%20Statement%20Of%20Account%20%28PC2023-0026%29.pdf#page=2)). Annex C defines the related `pTotalHCIFees` as "Total Health Care Institution Fees" ([p. 81](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)). |
| `pPrimaryProfFee` | `"455.0"` | From the name, the professional-fee (PF) share, the doctors' portion (inference; compare Annex C `pTotalProfFees`, "Total Professional Fees"). |
| `pSecondaryCaseRate` | `"0.00"` | Secondary total (see the note below the table). `0.00` in every sample entry. |
| `pSecondaryHCIFee` | `"0.00"` | Secondary HCI share. `0.00` in every sample entry. |
| `pSecondaryProfFee` | `"0.00"` | Secondary professional-fee share. `0.00` in every sample entry. |
| `pCheckFacilityMAT` … `pCheckFacilityPCB` | `"T"` / `"F"` | 18 flags; see [Facility flags](#facility-flags-pcheckfacility). |

"Primary" and "secondary" are not defined in the DevKit. A claim can carry more than one case rate: the DTD allows `CASERATE+`, and Claim Form 4 has separate "1st Case Rate Code" and "2nd Case Rate Code" fields. The two sets therefore most likely hold the amounts for a first and a second case rate (inference). Confirm with PhilHealth before you use the secondary amounts.

::: tip Amounts are strings with inconsistent decimals
The sample mixes one decimal (`"2600.0"`) and two decimals (`"0.00"`). Recommendation (not from PhilHealth): parse amounts with a decimal type (JavaScript: integer centavos or a decimal library; Python: `decimal.Decimal`), never binary floating point, and format them yourself before you put them in the upload XML.
:::

::: warning Format of `pCaseRateAmount` not specified
Annex C formats most amounts in the upload XML as `#######.##` ([p. 81–82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=81)), but it has no entry for `CASERATE@pCaseRateAmount`. The upload sample uses whole numbers there (`pCaseRateAmount="10000"` and `"2600"`, [p. 31](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=31)), while this method returns strings such as `"2600.0"`. The DevKit doesn't say which format the upload expects ([KI-50](/known-issues#ki-50)).

Recommendation (not from PhilHealth): write it in the `#######.##` format that Annex C gives the other amounts, for example `3380.00`. This site's [eClaims XML example](/reference/eclaims-xml) does the same (`10000.00`). Confirm with PhilHealth, or test with [eClaimsFileCheck](/api/eclaims-file-check).
:::

#### Facility flags (`pCheckFacility…`)

Each `AMOUNT` object in the sample contains these 18 keys, each with the value `"T"` or `"F"`:

| | | | | | |
|---|---|---|---|---|---|
| `pCheckFacilityMAT` | `pCheckFacilityH1` | `pCheckFacilityH2` | `pCheckFacilityH3` | `pCheckFacilityFSDC` | `pCheckFacilityASC` |
| `pCheckFacilityPCF` | `pCheckFacilityTSEKAP` | `pCheckFacilityABTC` | `pCheckFacilityTBDOTSC` | `pCheckFacilityOPMC` | `pCheckFacilityRHU` |
| `pCheckFacilityDATRC` | `pCheckFacilityHIVTH` | `pCheckFacilityFPC` | `pCheckFacilityCIU` | `pCheckFacilityDSP` | `pCheckFacilityPCB` |

In all four sample entries, only `pCheckFacilityPCF` is `"T"`.

::: warning Meaning not defined in the DevKit
The DevKit does not explain these flags or their suffixes (MAT, H1, FSDC, PCF and so on). From the names, they **appear to be facility-type flags**. That is our inference; PhilHealth does not say so. Do not hard-code business rules on them. Store all 18 as you receive them, and ask PhilHealth what each flag means before you use one, for example to hide packages that don't apply to your facility. See [KI-42](/known-issues#ki-42).
:::

### Effectivity periods

Case-rate amounts change over time, so the same package has one entry per period. Every entry has its own `pEffectivityDate` and `pEffectivityEndDate`. Here are the four sample entries for `CR0389`, sorted by date (the Guide lists them in a different order):

| `pEffectivityDate` | `pEffectivityEndDate` | `pPrimaryCaseRate` | `pPrimaryHCIFee` | `pPrimaryProfFee` |
|---|---|---|---|---|
| `01-01-2014` | `12-01-2014` | 4000.0 | 3500.0 | 500.0 |
| `12-02-2014` | `09-14-2015` | 4000.0 | 3500.0 | 500.0 |
| `09-15-2015` | `02-13-2024` | 2600.0 | 2250.0 | 350.0 |
| `02-14-2024` | `12-31-9999` | 3380.0 | 2925.0 | 455.0 |

What the sample shows:

- **`12-31-9999` means open-ended.** The period has no end date yet, so it is the rate currently in effect. The DevKit never defines this value; we read it from the sample.
- **Periods don't overlap and leave no gaps.** Each period starts the day after the previous one ends (for example `02-13-2024` → `02-14-2024`). Both dates therefore appear to be **inclusive** (inference): a claim admitted on `02-13-2024` would use the 2600.0 rate, and one admitted on `02-14-2024` the 3380.0 rate.
- **The response order is not chronological.** The first entry in the sample is the 2015–2024 period. Never assume `CASERATES[0]` is the current rate.

::: tip Recommendation (not from PhilHealth): pick the period yourself
Even when you send `targetdate`, check that the entry you use really covers the date. If you cache all periods (by calling with `targetdate: ""`), select the period in code, as in the [example below](#pick-the-period-for-an-admission-date). Store `12-31-9999` as "no end date" (for example SQL `NULL`) if your database date type cannot hold year 9999.
:::

## Example

### Request (PhilHealth's sample body, p. 37–38)

```http
POST /PHIC/Claims3.0/searchCaseRates HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{
  "icdcode": "",
  "rvscode": "",
  "description": "DENGUE",
  "targetdate": "02-14-2024"
}
```

The body is PhilHealth's sample. The request line and headers are ours: the Guide shows only the body, and it does not mention `Content-Type`.

### Encrypted response (PhilHealth sample, p. 38)

```json
{
  "success": true,
  "message": "",
  "result": {
      "docMimeType": "text/xml",
      "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591fac928f71a3841317e7c",
      "key1": "",
      "key2": "",
      "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
      "doc":"PMs1FWFZT+odArTp0qf2zMmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
    }
}
```

These values are placeholders and cannot be decrypted. The `hash` is only 59 hex characters (a SHA-256 hex digest has 64), and `doc` decodes to 40 bytes, which is not a multiple of the 16-byte AES block ([KI-27](/known-issues#ki-27)).

### Decrypted `result` (PhilHealth sample, one entry shown)

```json
{
  "eCASERATES": {
    "CASERATES": [
      {
        "AMOUNT": {
          "pPrimaryProfFee": "455.0",
          "pPrimaryHCIFee": "2925.0",
          "pCheckFacilityMAT": "F",
          "pPrimaryCaseRate": "3380.0",
          "pSecondaryHCIFee": "0.00",
          "pSecondaryProfFee": "0.00",
          "pSecondaryCaseRate": "0.00",
          "pCheckFacilityH1": "F",
          "pCheckFacilityH2": "F",
          "pCheckFacilityFSDC": "F",
          "pCheckFacilityH3": "F",
          "pCheckFacilityASC": "F",
          "pCheckFacilityPCF": "T",
          "pCheckFacilityTSEKAP": "F",
          "pCheckFacilityABTC": "F",
          "pCheckFacilityTBDOTSC": "F",
          "pCheckFacilityOPMC": "F",
          "pCheckFacilityRHU": "F",
          "pCheckFacilityDATRC": "F",
          "pCheckFacilityHIVTH": "F",
          "pCheckFacilityFPC": "F",
          "pCheckFacilityCIU": "F",
          "pCheckFacilityDSP": "F",
          "pCheckFacilityPCB": "F"
        },
        "pCaseRateCode": "CR0389",
        "pCaseRateDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pItemCode": "90945",
        "pItemDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pEffectivityDate": "02-14-2024",
        "pEffectivityEndDate": "12-31-9999"
      }
    ]
  }
}
```

::: details Full decrypted sample (all four entries, fixed to be valid JSON)
We made two changes to PhilHealth's sample (p. 39–41) and nothing else. In the first entry, `"pCheckFacilityPCB": "F”` ends with a typographic quote (`”`), which makes the JSON invalid; we replaced it with a straight quote. We also rejoined description strings that the PDF wraps across lines, and removed the extra spaces the PDF's justified layout adds.

```json
{
  "eCASERATES": {
    "CASERATES": [
      {
        "AMOUNT": {
          "pPrimaryProfFee": "350.0",
          "pPrimaryHCIFee": "2250.0",
          "pCheckFacilityMAT": "F",
          "pPrimaryCaseRate": "2600.0",
          "pSecondaryHCIFee": "0.00",
          "pSecondaryProfFee": "0.00",
          "pSecondaryCaseRate": "0.00",
          "pCheckFacilityH1": "F",
          "pCheckFacilityH2": "F",
          "pCheckFacilityFSDC": "F",
          "pCheckFacilityH3": "F",
          "pCheckFacilityASC": "F",
          "pCheckFacilityPCF": "T",
          "pCheckFacilityTSEKAP": "F",
          "pCheckFacilityABTC": "F",
          "pCheckFacilityTBDOTSC": "F",
          "pCheckFacilityOPMC": "F",
          "pCheckFacilityRHU": "F",
          "pCheckFacilityDATRC": "F",
          "pCheckFacilityHIVTH": "F",
          "pCheckFacilityFPC": "F",
          "pCheckFacilityCIU": "F",
          "pCheckFacilityDSP": "F",
          "pCheckFacilityPCB": "F"
        },
        "pCaseRateCode": "CR0389",
        "pCaseRateDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pItemCode": "90945",
        "pItemDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pEffectivityDate": "09-15-2015",
        "pEffectivityEndDate": "02-13-2024"
      },
      {
        "AMOUNT": {
          "pPrimaryProfFee": "500.0",
          "pPrimaryHCIFee": "3500.0",
          "pCheckFacilityMAT": "F",
          "pPrimaryCaseRate": "4000.0",
          "pSecondaryHCIFee": "0.00",
          "pSecondaryProfFee": "0.00",
          "pSecondaryCaseRate": "0.00",
          "pCheckFacilityH1": "F",
          "pCheckFacilityH2": "F",
          "pCheckFacilityFSDC": "F",
          "pCheckFacilityH3": "F",
          "pCheckFacilityASC": "F",
          "pCheckFacilityPCF": "T",
          "pCheckFacilityTSEKAP": "F",
          "pCheckFacilityABTC": "F",
          "pCheckFacilityTBDOTSC": "F",
          "pCheckFacilityOPMC": "F",
          "pCheckFacilityRHU": "F",
          "pCheckFacilityDATRC": "F",
          "pCheckFacilityHIVTH": "F",
          "pCheckFacilityFPC": "F",
          "pCheckFacilityCIU": "F",
          "pCheckFacilityDSP": "F",
          "pCheckFacilityPCB": "F"
        },
        "pCaseRateCode": "CR0389",
        "pCaseRateDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pItemCode": "90945",
        "pItemDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pEffectivityDate": "12-02-2014",
        "pEffectivityEndDate": "09-14-2015"
      },
      {
        "AMOUNT": {
          "pPrimaryProfFee": "500.0",
          "pPrimaryHCIFee": "3500.0",
          "pCheckFacilityMAT": "F",
          "pPrimaryCaseRate": "4000.0",
          "pSecondaryHCIFee": "0.00",
          "pSecondaryProfFee": "0.00",
          "pSecondaryCaseRate": "0.00",
          "pCheckFacilityH1": "F",
          "pCheckFacilityH2": "F",
          "pCheckFacilityFSDC": "F",
          "pCheckFacilityH3": "F",
          "pCheckFacilityASC": "F",
          "pCheckFacilityPCF": "T",
          "pCheckFacilityTSEKAP": "F",
          "pCheckFacilityABTC": "F",
          "pCheckFacilityTBDOTSC": "F",
          "pCheckFacilityOPMC": "F",
          "pCheckFacilityRHU": "F",
          "pCheckFacilityDATRC": "F",
          "pCheckFacilityHIVTH": "F",
          "pCheckFacilityFPC": "F",
          "pCheckFacilityCIU": "F",
          "pCheckFacilityDSP": "F",
          "pCheckFacilityPCB": "F"
        },
        "pCaseRateCode": "CR0389",
        "pCaseRateDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pItemCode": "90945",
        "pItemDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pEffectivityDate": "01-01-2014",
        "pEffectivityEndDate": "12-01-2014"
      },
      {
        "AMOUNT": {
          "pPrimaryProfFee": "455.0",
          "pPrimaryHCIFee": "2925.0",
          "pCheckFacilityMAT": "F",
          "pPrimaryCaseRate": "3380.0",
          "pSecondaryHCIFee": "0.00",
          "pSecondaryProfFee": "0.00",
          "pSecondaryCaseRate": "0.00",
          "pCheckFacilityH1": "F",
          "pCheckFacilityH2": "F",
          "pCheckFacilityFSDC": "F",
          "pCheckFacilityH3": "F",
          "pCheckFacilityASC": "F",
          "pCheckFacilityPCF": "T",
          "pCheckFacilityTSEKAP": "F",
          "pCheckFacilityABTC": "F",
          "pCheckFacilityTBDOTSC": "F",
          "pCheckFacilityOPMC": "F",
          "pCheckFacilityRHU": "F",
          "pCheckFacilityDATRC": "F",
          "pCheckFacilityHIVTH": "F",
          "pCheckFacilityFPC": "F",
          "pCheckFacilityCIU": "F",
          "pCheckFacilityDSP": "F",
          "pCheckFacilityPCB": "F"
        },
        "pCaseRateCode": "CR0389",
        "pCaseRateDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pItemCode": "90945",
        "pItemDescription": "DIALYSIS PROCEDURE OTHER THAN HEMODIALYSIS (E.G. PERITONEAL, HEMOFILTRATION)",
        "pEffectivityDate": "02-14-2024",
        "pEffectivityEndDate": "12-31-9999"
      }
    ]
  }
}
```
:::

### Call the method

These are unofficial examples, not from PhilHealth. The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup): `pecwsPost` / `pecws_post` sends the plain JSON body with a fresh token, `assertSuccess` / `assert_success` throws unless `success` is `true`, and `unseal` decrypts `result` and returns the text (it throws if the hash doesn't match). The usage line looks up this site's example claim: dengue fever (ICD-10 `A90`), admitted 09-15-2026.

::: code-group

```bash [curl]
# Needs jq (https://jqlang.github.io/jq/) to read the token from the JSON response.
TOKEN=$(curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID" | jq -r '.result')

curl -sS -X POST "$PECWS_BASE_URL/searchCaseRates" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"icdcode": "A90", "rvscode": "", "description": "", "targetdate": "09-15-2026"}' \
  > response.json

# Decrypt "result" with the example module payload-crypto.mjs (reads PECWS_CIPHER_KEY).
node payload-crypto.mjs decrypt response.json > caserates.json
```

```js [Node.js]
import { pecwsPost, unseal, assertSuccess } from './pecws-client.mjs';

export async function searchCaseRates({ icdcode = '', rvscode = '', description = '', targetdate = '' } = {}) {
  // Plain JSON, not an envelope. Send all four keys, as in PhilHealth's sample; unused ones as "" (KI-46).
  const env = assertSuccess(await pecwsPost('searchCaseRates', { icdcode, rvscode, description, targetdate }));
  // The result is encrypted; its content is JSON, whatever docMimeType says (KI-25, KI-47).
  return JSON.parse(unseal(env.result)).eCASERATES.CASERATES;
}

// Usage: this site's example claim (dengue, A90), admitted 09-15-2026
const caseRates = await searchCaseRates({ icdcode: 'A90', targetdate: '09-15-2026' });
```

```python [Python]
import json

from pecws_client import pecws_post, unseal, assert_success


def search_case_rates(icdcode: str = "", rvscode: str = "",
                      description: str = "", targetdate: str = "") -> list:
    # Plain JSON, not an envelope. Send all four keys, as in PhilHealth's sample; unused ones as "" (KI-46).
    body = {"icdcode": icdcode, "rvscode": rvscode, "description": description, "targetdate": targetdate}
    env = assert_success(pecws_post("searchCaseRates", body))
    # The result is encrypted; its content is JSON, whatever docMimeType says (KI-25, KI-47).
    return json.loads(unseal(env["result"]))["eCASERATES"]["CASERATES"]


# Usage: this site's example claim (dengue, A90), admitted 09-15-2026
case_rates = search_case_rates(icdcode="A90", targetdate="09-15-2026")
```

:::

### Pick the period for an admission date

This is a recommendation, not PhilHealth code. It works on the `CASERATES` array, for example one you cached with `targetdate: ""`. Dates are compared as `YYYYMMDD` strings, which also handles `12-31-9999` without date-library overflow.

::: code-group

```js [Node.js]
// "MM-DD-YYYY" -> "YYYYMMDD", so plain string comparison sorts correctly
function sortable(mmddyyyy) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(mmddyyyy);
  if (!m) throw new Error(`Expected MM-DD-YYYY, got "${mmddyyyy}"`);
  return m[3] + m[1] + m[2];
}

// Returns the CASERATES entry whose effectivity period covers `date`
// (both ends inclusive), or undefined if none does.
export function caseRateFor(caseRates, date) {
  const d = sortable(date);
  return caseRates.find(
    (r) => sortable(r.pEffectivityDate) <= d && d <= sortable(r.pEffectivityEndDate),
  );
}

// With PhilHealth's sample:
// caseRateFor(caseRates, '02-13-2024').AMOUNT.pPrimaryCaseRate -> "2600.0"
// caseRateFor(caseRates, '02-14-2024').AMOUNT.pPrimaryCaseRate -> "3380.0"
// caseRateFor(caseRates, '12-31-2013')                         -> undefined
```

```python [Python 3.10+]
import re


def sortable(mmddyyyy: str) -> str:
    """'MM-DD-YYYY' -> 'YYYYMMDD', so plain string comparison sorts correctly."""
    m = re.fullmatch(r"(\d{2})-(\d{2})-(\d{4})", mmddyyyy)
    if not m:
        raise ValueError(f"Expected MM-DD-YYYY, got {mmddyyyy!r}")
    return m[3] + m[1] + m[2]


def case_rate_for(case_rates: list[dict], date: str) -> dict | None:
    """The CASERATES entry whose period covers `date` (both ends inclusive)."""
    d = sortable(date)
    return next((r for r in case_rates
                 if sortable(r["pEffectivityDate"]) <= d <= sortable(r["pEffectivityEndDate"])),
                None)

# With PhilHealth's sample:
# case_rate_for(case_rates, "02-13-2024")["AMOUNT"]["pPrimaryCaseRate"] -> "2600.0"
# case_rate_for(case_rates, "02-14-2024")["AMOUNT"]["pPrimaryCaseRate"] -> "3380.0"
```

:::

We ran the request snippets (Node.js, Python, and curl with the example module's `decrypt` command) against a local mock server, not PECWS. The mock returned case-rate entries in the format of PhilHealth's decrypted sample, encrypted with a test cipher key. We tested the period helpers against PhilHealth's sample data.

## Notes and gotchas

- **Request format conflict.** See the [warning above](#body): revision 20240216 mentions a "comma separated list", but the current method section documents a JSON object ([KI-46](/known-issues#ki-46)).
- **"XML" in the prose, JSON in the sample.** Parse the decrypted `doc` as JSON. `docMimeType` is documented as `"text/xml"` even though the content is JSON ([KI-25](/known-issues#ki-25)), and the promised DTD doesn't exist ([KI-47](/known-issues#ki-47)).
- **Sample values are placeholders** ([KI-27](/known-issues#ki-27)). The encrypted sample can't be decrypted, and the decrypted sample is illustrative.
- **Name variants.** The revision history calls this method "SearchCaseRate" and the section title says "Search Case Rates" ([KI-09](/known-issues#ki-09)). The endpoint is `searchCaseRates`, with a lowercase `s` and a final `s`.
- **No error catalogue.** The DevKit does not list the `message` values for bad input or no matches ([KI-42](/known-issues#ki-42)). Log `message` verbatim.
- **Tokens are short-lived.** The `getToken` sample says "Token is valid for 20 seconds" ([KI-26](/known-issues#ki-26)). Get a fresh token right before each call.

::: warning Sample request and sample response don't match
The sample request searches for `"description": "DENGUE"` with `"targetdate": "02-14-2024"` (p. 38). The sample response (p. 39–41) has two problems:

- It contains only `CR0389` **dialysis** entries, not dengue.
- It returns **four** periods, even though a valid `targetdate` should return only the one covering 02-14-2024 (the `02-14-2024` → `12-31-9999` entry).

The decrypted sample is also not valid JSON as printed: in the first entry, `"pCheckFacilityPCB": "F”` closes with a typographic quote (`”`).

Both samples are only illustrations of the format. Don't use them as a test case for filtering behavior. Test against PhilHealth's test environment instead. See [KI-46](/known-issues#ki-46).
:::

::: warning "See Case Rate Library", but no library in the DevKit
Annex C says of `pCaseRateCode`: "See Case Rate Library" ([Guide p. 82](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=82)). No case-rate library file is included in the DevKit ([KI-46](/known-issues#ki-46)), and the Guide doesn't define `pItemCode`, "primary" versus "secondary" amounts, or the `pCheckFacility…` flags ([KI-42](/known-issues#ki-42)). Ask PhilHealth whether a downloadable case-rate library exists, or whether `searchCaseRates` is the only source.
:::

### Common mistakes

| Mistake | What happens | Do this instead |
|---|---|---|
| Sending `targetdate` as `2024-02-14` or an ISO timestamp | Undocumented behavior; you may get no match or an error | Use `mm-dd-yyyy`, for example `02-14-2024` |
| Treating `CASERATES[0]` as the current rate | The sample's first entry is an expired period | Select by date (see the [helper](#pick-the-period-for-an-admission-date)) |
| Treating `pEffectivityEndDate` as exclusive | Claims admitted on the last day of a period get the next period's rate | Treat both dates as inclusive (they are contiguous in the sample) |
| Parsing amounts with `parseFloat` and summing | Rounding errors in totals | Use integer centavos or a decimal type |
| Wrapping the request in the encrypted envelope | The server may not find `icdcode` and the other keys; the Guide documents a plain JSON body | Send plain JSON; only the `result` is encrypted |
| Choosing the parser for the decrypted `doc` from `docMimeType` | You try to parse JSON as XML | Always parse it as JSON |

## Related pages

- [API overview and conventions](/api/) and its [shared client](/api/#shared-client-setup)
- [API payload encryption (cipher key)](/guides/encryption/api-payloads)
- [eClaims XML reference](/reference/eclaims-xml) (the `ALLCASERATE` / `CASERATE` elements)
- [Submitting a claim](/guides/submitting-a-claim)
- [isClaimEligible](/api/is-claim-eligible)
- Known issues: [KI-46 (input format and samples)](/known-issues#ki-46), [KI-47 (copied descriptions)](/known-issues#ki-47), [KI-42 (undocumented results)](/known-issues#ki-42), [KI-50 (`pCaseRateAmount`)](/known-issues#ki-50)
