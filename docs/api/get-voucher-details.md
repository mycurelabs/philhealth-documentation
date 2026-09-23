---
title: getVoucherDetails
description: Get the payment voucher for paid claims, with per-claim charges by payee and the checks issued, to reconcile PhilHealth payments.
---

# getVoucherDetails

Get the payment details of a PhilHealth voucher: the claims it pays, the amount per payee and category, and the checks issued.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getVoucherDetails` |
| **Auth header** | `token` (from [getToken](/api/get-token)) |
| **Request** | No body. One parameter: `voucherNo`. The Guide doesn't say where it goes; we send it in the query string (our inference, see [Parameter](#parameter) and [KI-61](/known-issues#ki-61)). |
| **Response `result`** | Encrypted with your cipher key. Once decrypted it is JSON: `VOUCHER` with `CLAIM[]` (each with `CHARGE[]`), a `SUMMARY` of `PAYEE[]` checks and totals, `pVoucherNo` and `pVoucherDate`. |

::: tip What you need to do
1. Get the voucher number (`pVoucherNo`). The Guide says it comes from [getClaimStatus](/api/get-claim-status), but its sample doesn't show one ([KI-23](/known-issues#ki-23)).
2. Call `GET …/getVoucherDetails?voucherNo=<voucher number>` with a fresh `token` header. The query-string placement is our inference ([KI-61](/known-issues#ki-61)).
3. Decrypt `result` with your cipher key and parse the JSON.
4. For each `CLAIM`, match `pClaimSeriesLhio` to your claim, using the mapping from [getUploadedClaimsMap](/api/get-uploaded-claims-map), and post the `CHARGE` amounts. Use `SUMMARY.PAYEE` for the checks.
5. Treat amounts as decimal strings, and don't hard-code the payee-type codes ([KI-42](/known-issues#ki-42)).
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 55–60: Get Voucher Details Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)
- [Implementation Guide, p. 46–48: getClaimStatus sample (no `pVoucherNo`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)
- [Implementation Guide, p. 3: revision history (20240423, 20241111)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Software Solution Validation Test Form (rev. 20250217), p. 4: Module 3, item 2](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)
:::

## When to use it

The Guide says this method "facilitates the reconciliation of paid claims by returning the voucher details and other payment information associated with claims. … Note that a single voucher may contain multiple claims" ([Guide p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)).

Use it at the end of the claims lifecycle, after PhilHealth has prepared a voucher (a payment document) for your claims:

1. [getClaimStatus](/api/get-claim-status) tracks the claim until a voucher is prepared.
2. **getVoucherDetails** gives you, for every claim on the voucher, how much PhilHealth pays to whom, and which check covers each payee.
3. Your accounting module posts these amounts against your receivables. For each claim, use the `pClaimSeriesLhio` → `pClaimNumber` mapping you saved from [getUploadedClaimsMap](/api/get-uploaded-claims-map), because this response does **not** include your own claim number.

Certification requires it. SSVTF Module 3, item 2 asks: "Does the system provide an interface for retrieving voucher information for approved claims?" ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)).

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PhilHealth e-Claims Web Service (PECWS) authentication token from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). | Guide p. 55 |

### Parameter

| Parameter | Value | Source |
|---|---|---|
| `voucherNo` | "Valid voucher number". The prose says it "should be set to the pVoucherNo attribute returned by the getClaimStatus method if a voucher has already been prepared for the claim's payment". | Guide p. 55 |

```http
GET /PHIC/Claims3.0/getVoucherDetails?voucherNo=201-062001-06I03 HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
```

`201-062001-06I03` is the voucher number from the Guide's sample response.

::: warning Not stated: where `voucherNo` goes (KI-61)
The Guide lists `voucherNo` under a "Parameter" heading and doesn't say where it goes. The getUploadedClaimsMap section uses the same "Parameter" heading, and revision 20241111 explicitly calls that one a "query parameter" ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). We therefore send `voucherNo` as a query parameter too. That is our inference, so confirm it with PhilHealth. See [KI-61](/known-issues#ki-61).
:::

Voucher numbers are free-form strings. The sample `201-062001-06I03` contains dashes and a letter `I`. Recommendation (not from PhilHealth): store it exactly as received and URL-encode it.

::: warning Where does `voucherNo` come from? (KI-23)
The Guide says you get `voucherNo` from `pVoucherNo` in the getClaimStatus result (p. 55). But the getClaimStatus sample (p. 47–48) has **no `pVoucherNo`**. In the DevKit, the key appears only in this method's own output. The DevKit documents no other way to get a voucher number. Recommendation (not from PhilHealth): until PhilHealth confirms where it appears, search the getClaimStatus result defensively (see the helper on the [getClaimStatus](/api/get-claim-status#turn-the-result-into-one-row-per-claim) page). See [KI-23](/known-issues#ki-23).
:::

## Response

### Envelope

| Key | Value (Guide p. 55–56) |
|---|---|
| `success` | `true` when the operation succeeded. |
| `message` | The error message, if an error occurred. No specific messages are listed (for example, for an unknown voucher, or one that belongs to another facility) ([KI-42](/known-issues#ki-42)). |
| `result` | An encrypted envelope, encrypted with **your health facility's cipher key**: `docMimeType` (documented as `"text/xml"`), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc`. |

Decrypt `result` as described in [API payload encryption](/guides/encryption/api-payloads). The decrypted sample is **JSON**, even though `docMimeType` says `text/xml` ([KI-25](/known-issues#ki-25)) and the output table calls the content "XML text" ([KI-47](/known-issues#ki-47)).

### Decrypted result structure

```text
VOUCHER
├── CLAIM[]                       one entry per claim paid by this voucher
│   ├── CHARGE[]                  one entry per payee of this claim
│   │   ├── pPayeeType            "C", "H" or "M" in the sample
│   │   ├── pPayeeCode
│   │   ├── pPayeeName
│   │   ├── pRMBD      ─┐
│   │   ├── pDRUGS      │
│   │   ├── pXRAY       │
│   │   ├── pOPRM       │ amount per category
│   │   ├── pSPFee      │
│   │   ├── pGPFee      │
│   │   ├── pSURFee     │
│   │   ├── pANESFee   ─┘
│   │   ├── pGrossAmount
│   │   ├── pTaxAmount
│   │   └── pNetAmount
│   ├── pClaimSeriesLhio
│   ├── pPin
│   ├── pPatientLastName
│   ├── pPatientFirstName
│   ├── pPatientMiddleName
│   ├── pPatientSuffix
│   ├── pAdmissionDate
│   ├── pDischargeDate
│   ├── pClaimDateReceived
│   ├── pClaimDateRefile
│   └── pIsAdjustment
├── SUMMARY
│   ├── PAYEE[]                   one entry per payee, i.e. per check
│   │   ├── (the same 14 keys as CHARGE)
│   │   ├── pCheckNo
│   │   └── pCheckDate
│   ├── pTotalAmount
│   └── pNumberOfClaims
├── pVoucherNo
└── pVoucherDate
```

The Guide gives **no field dictionary** for this output, only the sample ([p. 56–60](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=56); [KI-42](/known-issues#ki-42)). The meanings below come from the key names and from the sample values. Everything inferred is labeled. All values, including amounts, are **strings** such as `"5791.90"`.

#### `VOUCHER`

| Key | Sample value | Meaning |
|---|---|---|
| `CLAIM` | array of 2 | The claims on this voucher. |
| `SUMMARY` | object | Per-payee totals and the checks issued. |
| `pVoucherNo` | `"201-062001-06I03"` | The voucher number. |
| `pVoucherDate` | `"06-14-2006"` | Voucher date (`mm-dd-yyyy`). In the sample, the checks are dated five days later (`06-19-2006`). |

#### `CLAIM[]`

| Key | Sample value | Meaning |
|---|---|---|
| `CHARGE` | array | What PhilHealth pays for this claim, one row per payee (see below). |
| `pClaimSeriesLhio` | `"060516030019903"` | PhilHealth's 15-digit claim number. Map it to your claim with the data from [getUploadedClaimsMap](/api/get-uploaded-claims-map). |
| `pPin` | `"192003610605"` | From the name, a PhilHealth Identification Number (PIN), 12 digits in the sample (inference). Not stated whether it is the member's or the patient's. |
| `pPatientLastName` | `"ALOXXX"` | Patient's last name (masked in the sample). |
| `pPatientFirstName` | `"BERNAXXX"` | Patient's first name. |
| `pPatientMiddleName` | `"B"` | Patient's middle name. |
| `pPatientSuffix` | `""` | Name suffix; may be empty. |
| `pAdmissionDate` | `"04-18-2006"` | Admission date. |
| `pDischargeDate` | `"04-20-2006"` | Discharge date. |
| `pClaimDateReceived` | `"05-12-2006"` | From the name, the date PhilHealth received the claim (inference). |
| `pClaimDateRefile` | `""` | From the name, the refiling date if the claim was refiled (inference). |
| `pIsAdjustment` | `"F"` | `"F"` for both sample claims; probably a `T`/`F` flag like the other flags in PECWS output (inference). From the name, whether this entry is an adjustment to an earlier payment rather than a regular payment (inference; not defined in the DevKit). |

#### `CHARGE[]` and `SUMMARY.PAYEE[]` amount keys

`CHARGE` rows and `PAYEE` rows share these 14 keys. `PAYEE` rows add `pCheckNo` and `pCheckDate`.

| Key | Sample value | Meaning |
|---|---|---|
| `pPayeeType` | `"C"`, `"H"`, `"M"` | Who is paid. See [Payee types](#payee-types). |
| `pPayeeCode` | `"30XX04"`, `"2XX25"`, `"P192003617072"` | The payee's code (masked with `X` in the sample). |
| `pPayeeName` | `"XXXX CITY XXXXXX HOSPITAL"` | The payee's name (masked). May carry trailing spaces: the sample has `"HC- XXXX CITY XXXXX HOSPITAL "`. |
| `pRMBD` | `"800.00"` | Amount for a charge category. Not defined; the abbreviation suggests room and board (inference). |
| `pDRUGS` | `"507.50"` | Amount for a charge category. Not defined; suggests drugs and medicines (inference). |
| `pXRAY` | `"994.40"` | Amount for a charge category. Not defined; suggests X-ray, possibly other diagnostic procedures too (inference). |
| `pOPRM` | `"3490.00"` | Amount for a charge category. Not defined; suggests operating room (inference). |
| `pSPFee` | `"0.00"` | Professional-fee category. Not defined; possibly specialist (inference). `0.00` in every sample row. |
| `pGPFee` | `"600.00"` | Professional-fee category. Not defined; suggests general practitioner (inference). |
| `pSURFee` | `"4000.00"` | Professional-fee category. Not defined; suggests surgeon (inference). |
| `pANESFee` | `"1200.00"` | Professional-fee category. Not defined; suggests anesthesiologist (inference). |
| `pGrossAmount` | `"5791.90"` | Gross amount. In every sample row it equals the sum of the eight category amounts. |
| `pTaxAmount` | `"0.00"` | Tax amount. `0.00` in every sample row, so the sample doesn't show how tax is applied. |
| `pNetAmount` | `"5791.90"` | Net amount. Equals `pGrossAmount` in every sample row, where tax is always zero. |
| `pCheckNo` | `"0000XXX430"` | `PAYEE` only. The check number (masked). |
| `pCheckDate` | `"06-19-2006"` | `PAYEE` only. The check date. |

#### `SUMMARY`

| Key | Sample value | Meaning |
|---|---|---|
| `PAYEE` | array of 4 | One row per payee, each with its own check. |
| `pTotalAmount` | `"19608.65"` | Total of the voucher. In the sample it equals the sum of the `PAYEE` `pNetAmount` values, and also the sum of all `CHARGE` `pNetAmount` values. |
| `pNumberOfClaims` | `"2"` | Number of claims. Equals the number of `CLAIM` entries in the sample. |

### Payee types

The DevKit does **not** define `pPayeeType` or its values, or the fee abbreviations such as `pRMBD` and `pSPFee` ([KI-42](/known-issues#ki-42)). The sample uses `C`, `H` and `M`. The table below is **our inference** from the sample names and amounts. PhilHealth doesn't state it.

| `pPayeeType` | Appears to be (inference) | Evidence in the sample (Guide p. 56–59) |
|---|---|---|
| `H` | The health facility (hospital) | `pPayeeName` is `"XXXX CITY XXXXXX HOSPITAL"`, and the amounts are only in `pRMBD`, `pDRUGS`, `pXRAY` and `pOPRM`. |
| `C` | Professional fees of doctors | In `CHARGE`, every `C` name starts with `"DR."` (for example `"DR. DJXXXXX XXX X. SXXX"`), and the amounts are only in `pSURFee`, `pANESFee` or `pGPFee`. In `SUMMARY`, the single `C` row carries the **hospital's** payee code `30XX04` and the name `"HC- XXXX CITY XXXXX HOSPITAL "`. It adds up all doctors' fees on the voucher (4000.00 + 1200.00 + 600.00 = 5800.00). |
| `M` | The member / patient | `pPayeeName` matches the claim's patient (`"ALOXXX , BERNAXXX X"` on the claim for `ALOXXX`, `BERNAXXX`). `pPayeeCode` starts with `P`, and the amounts are only in `pDRUGS` and `pXRAY`. |

::: warning Confirm before you post money
Don't post `M` amounts as patient refunds, or `C` amounts as doctor payables, on this inference alone. Ask PhilHealth for the official meaning of each `pPayeeType`, and whether values other than `C`, `H` and `M` exist. Also ask why the summary's `C` row is paid under the hospital's code.
:::

### How the sample adds up

We checked every number in PhilHealth's sample. These relationships hold there, but the DevKit does not state them as rules:

| Check | Sample |
|---|---|
| For each `CHARGE` row, the eight category amounts add up to `pGrossAmount` | `H`, claim 1: 800.00 + 507.50 + 994.40 + 3490.00 = **5791.90** |
| `pNetAmount` = `pGrossAmount` when `pTaxAmount` is `0.00` | all rows |
| `SUMMARY` `H` row = sum of the `H` rows of all claims | 5791.90 + 3311.25 = **9103.15** |
| `SUMMARY` `C` row = sum of the `C` rows of all claims | 4000.00 + 1200.00 + 600.00 = **5800.00** |
| `SUMMARY` has one `M` row per claim | 2685.00 and 2020.50 |
| `pTotalAmount` = sum of the `SUMMARY` `pNetAmount` values | 5800.00 + 9103.15 + 2685.00 + 2020.50 = **19608.65** |
| `pNumberOfClaims` = number of `CLAIM` entries | 2 |
| One check per `PAYEE` row | `0000XXX429` … `0000XXX432` |

## Example

### Request

```bash
# Needs jq (https://jqlang.github.io/jq/) to read the token from the JSON response.
TOKEN=$(curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID" | jq -r '.result')

curl -sS -G "$PECWS_BASE_URL/getVoucherDetails" \
  -H "token: $TOKEN" \
  --data-urlencode "voucherNo=201-062001-06I03"
```

The voucher number is the Guide's sample value. `-G` puts it in the query string, which is our inference ([see above](#parameter)). The environment variables are the ones from [API overview → Shared client setup](/api/#shared-client-setup).

### Encrypted response (PhilHealth sample, p. 56)

```json
{
    "result": {
    "docMimeType": "text/xml",
    "hash": "dc8f4d74d977dfe701c0c9bbca0678300540591fac928f71a3841317e7a99aec",
    "key1": "",
    "key2": "",
    "iv": "y1jPMxvQE2aJPVnqqn1pDQ==",
    "doc": "PMs1FWFZT+odAp0qf2zManmroSUr3lYgDFnhYeJqBkuhJNMJU5geEN=="
  },
    "success": true,
    "message": ""
}
```

This is a placeholder that cannot be decrypted ([KI-27](/known-issues#ki-27)).

### Decrypted `result` (PhilHealth sample, p. 56–60)

The sample is valid JSON as published; only the indentation has been changed. Names, codes and check numbers are masked with `X`, and the masking is inconsistent ([KI-27](/known-issues#ki-27)). For example, the same member's payee code is `P192003617072` in `CHARGE` but `P1920XX987072` in `SUMMARY`. Don't use these values as test data.

::: details Show the full decrypted sample
```json
{
  "VOUCHER": {
    "CLAIM": [
      {
        "CHARGE": [
          {
            "pPayeeType": "C",
            "pPayeeCode": "2XX25",
            "pPayeeName": "DR. DJXXXXX XXX X. SXXX",
            "pRMBD": "0.00",
            "pDRUGS": "0.00",
            "pXRAY": "0.00",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "4000.00",
            "pANESFee": "0.00",
            "pGrossAmount": "4000.00",
            "pTaxAmount": "0.00",
            "pNetAmount": "4000.00"
          },
          {
            "pPayeeType": "C",
            "pPayeeCode": "3XX25",
            "pPayeeName": "DR. IXX OLXXXX A. CANXXXX",
            "pRMBD": "0.00",
            "pDRUGS": "0.00",
            "pXRAY": "0.00",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "0.00",
            "pANESFee": "1200.00",
            "pGrossAmount": "1200.00",
            "pTaxAmount": "0.00",
            "pNetAmount": "1200.00"
          },
          {
            "pPayeeType": "H",
            "pPayeeCode": "30XX04",
            "pPayeeName": "XXXX CITY XXXXXX HOSPITAL",
            "pRMBD": "800.00",
            "pDRUGS": "507.50",
            "pXRAY": "994.40",
            "pOPRM": "3490.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "0.00",
            "pANESFee": "0.00",
            "pGrossAmount": "5791.90",
            "pTaxAmount": "0.00",
            "pNetAmount": "5791.90"
          },
          {
            "pPayeeType": "M",
            "pPayeeCode": "P192003617072",
            "pPayeeName": "ALOXXX , BERNAXXX X",
            "pRMBD": "0.00",
            "pDRUGS": "2544.00",
            "pXRAY": "141.00",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "0.00",
            "pANESFee": "0.00",
            "pGrossAmount": "2685.00",
            "pTaxAmount": "0.00",
            "pNetAmount": "2685.00"
          }
        ],
        "pClaimSeriesLhio": "060516030019903",
        "pPin": "192003610605",
        "pPatientLastName": "ALOXXX",
        "pPatientFirstName": "BERNAXXX",
        "pPatientMiddleName": "B",
        "pPatientSuffix": "",
        "pAdmissionDate": "04-18-2006",
        "pDischargeDate": "04-20-2006",
        "pClaimDateReceived": "05-12-2006",
        "pClaimDateRefile": "",
        "pIsAdjustment": "F"
      },
      {
        "CHARGE": [
          {
            "pPayeeType": "C",
            "pPayeeCode": "27XX2",
            "pPayeeName": "DR. VIRXXX XX. X. DXXXO",
            "pRMBD": "0.00",
            "pDRUGS": "0.00",
            "pXRAY": "0.00",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "600.00",
            "pSURFee": "0.00",
            "pANESFee": "0.00",
            "pGrossAmount": "600.00",
            "pTaxAmount": "0.00",
            "pNetAmount": "600.00"
          },
          {
            "pPayeeType": "H",
            "pPayeeCode": "3XXX04",
            "pPayeeName": "XXXX CITY XXXXX HOSPITAL",
            "pRMBD": "2400.00",
            "pDRUGS": "240.00",
            "pXRAY": "671.25",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "0.00",
            "pANESFee": "0.00",
            "pGrossAmount": "3311.25",
            "pTaxAmount": "0.00",
            "pNetAmount": "3311.25"
          },
          {
            "pPayeeType": "M",
            "pPayeeCode": "P19200XX31034",
            "pPayeeName": "ANDXXX , CONCHXXX X",
            "pRMBD": "0.00",
            "pDRUGS": "1157.50",
            "pXRAY": "863.00",
            "pOPRM": "0.00",
            "pSPFee": "0.00",
            "pGPFee": "0.00",
            "pSURFee": "0.00",
            "pANESFee": "0.00",
            "pGrossAmount": "2020.50",
            "pTaxAmount": "0.00",
            "pNetAmount": "2020.50"
          }
        ],
        "pClaimSeriesLhio": "060516030031234",
        "pPin": "192005981034",
        "pPatientLastName": "ANDXXX",
        "pPatientFirstName": "CONCHXXX",
        "pPatientMiddleName": "XXXX",
        "pPatientSuffix": "",
        "pAdmissionDate": "04-21-2006",
        "pDischargeDate": "04-27-2006",
        "pClaimDateReceived": "05-12-2006",
        "pClaimDateRefile": "",
        "pIsAdjustment": "F"
      }
    ],
    "SUMMARY": {
      "PAYEE": [
        {
          "pPayeeType": "C",
          "pPayeeCode": "30XX04",
          "pPayeeName": "HC- XXXX CITY XXXXX HOSPITAL ",
          "pRMBD": "0.00",
          "pDRUGS": "0.00",
          "pXRAY": "0.00",
          "pOPRM": "0.00",
          "pSPFee": "0.00",
          "pGPFee": "600.00",
          "pSURFee": "4000.00",
          "pANESFee": "1200.00",
          "pGrossAmount": "5800.00",
          "pTaxAmount": "0.00",
          "pNetAmount": "5800.00",
          "pCheckNo": "0000XXX429",
          "pCheckDate": "06-19-2006"
        },
        {
          "pPayeeType": "H",
          "pPayeeCode": "30XX04",
          "pPayeeName": "XXXX CITY XXXXX HOSPITAL",
          "pRMBD": "3200.00",
          "pDRUGS": "747.50",
          "pXRAY": "1665.65",
          "pOPRM": "3490.00",
          "pSPFee": "0.00",
          "pGPFee": "0.00",
          "pSURFee": "0.00",
          "pANESFee": "0.00",
          "pGrossAmount": "9103.15",
          "pTaxAmount": "0.00",
          "pNetAmount": "9103.15",
          "pCheckNo": "0000XXX430",
          "pCheckDate": "06-19-2006"
        },
        {
          "pPayeeType": "M",
          "pPayeeCode": "P1920XX987072",
          "pPayeeName": "ALOXXX , BERNXXXX X",
          "pRMBD": "0.00",
          "pDRUGS": "2544.00",
          "pXRAY": "141.00",
          "pOPRM": "0.00",
          "pSPFee": "0.00",
          "pGPFee": "0.00",
          "pSURFee": "0.00",
          "pANESFee": "0.00",
          "pGrossAmount": "2685.00",
          "pTaxAmount": "0.00",
          "pNetAmount": "2685.00",
          "pCheckNo": "0000XXX431",
          "pCheckDate": "06-19-2006"
        },
        {
          "pPayeeType": "M",
          "pPayeeCode": "P1920XX731034",
          "pPayeeName": "ANXXXX , CONXXXXX X",
          "pRMBD": "0.00",
          "pDRUGS": "1157.50",
          "pXRAY": "863.00",
          "pOPRM": "0.00",
          "pSPFee": "0.00",
          "pGPFee": "0.00",
          "pSURFee": "0.00",
          "pANESFee": "0.00",
          "pGrossAmount": "2020.50",
          "pTaxAmount": "0.00",
          "pNetAmount": "2020.50",
          "pCheckNo": "0000XXX432",
          "pCheckDate": "06-19-2006"
        }
      ],
      "pTotalAmount": "19608.65",
      "pNumberOfClaims": "2"
    },
    "pVoucherNo": "201-062001-06I03",
    "pVoucherDate": "06-14-2006"
  }
}
```
:::

### Call the method and summarize the voucher

The snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsGet` / `pecws_get` gets a fresh token and sends the GET with `voucherNo` URL-encoded in the query string. `assertSuccess` / `assert_success` throws unless `success` is `true`. `unseal` decrypts `result` with your cipher key and returns the decrypted **text**; it throws when the hash doesn't match. The summarizing helper is a recommendation, not PhilHealth code.

::: code-group

```js [Node.js 18+]
import { pecwsGet, unseal, assertSuccess } from './pecws-client.mjs';

const toArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
// Amounts arrive as strings ("5791.90"). Work in integer centavos.
const centavos = (s) => Math.round(Number(s) * 100);

export function summarizeVoucher(decrypted) {
  const v = decrypted.VOUCHER;
  const claims = toArray(v.CLAIM).map((c) => ({
    seriesLhio: c.pClaimSeriesLhio,
    isAdjustment: c.pIsAdjustment === 'T',
    netByPayeeType: toArray(c.CHARGE).reduce((acc, ch) => {
      acc[ch.pPayeeType] = (acc[ch.pPayeeType] ?? 0) + centavos(ch.pNetAmount);
      return acc;
    }, {}),
  }));
  const checks = toArray(v.SUMMARY?.PAYEE).map((p) => ({
    payeeType: p.pPayeeType,
    payeeCode: p.pPayeeCode,
    payeeName: p.pPayeeName.trim(), // the sample has a trailing space
    net: centavos(p.pNetAmount),
    checkNo: p.pCheckNo,
    checkDate: p.pCheckDate,
  }));

  // Sanity checks that hold in PhilHealth's sample. If one fails, investigate;
  // the DevKit does not state these rules.
  const warnings = [];
  const checksTotal = checks.reduce((s, c) => s + c.net, 0);
  if (checksTotal !== centavos(v.SUMMARY.pTotalAmount)) warnings.push('PAYEE nets != pTotalAmount');
  if (claims.length !== Number(v.SUMMARY.pNumberOfClaims)) warnings.push('CLAIM count != pNumberOfClaims');

  return { voucherNo: v.pVoucherNo, voucherDate: v.pVoucherDate, claims, checks, warnings };
}

// Usage. voucherNo in the query string is our inference (KI-61).
const env = assertSuccess(await pecwsGet('getVoucherDetails', { voucherNo: '201-062001-06I03' }));
const summary = summarizeVoucher(JSON.parse(unseal(env.result)));
// With PhilHealth's sample: claims[0].netByPayeeType = { C: 520000, H: 579190, M: 268500 },
// four checks, warnings = []
```

```python [Python 3.9+]
import json
from collections import defaultdict
from decimal import Decimal

from pecws_client import pecws_get, unseal, assert_success


def to_list(x):
    return [] if x is None else x if isinstance(x, list) else [x]


def summarize_voucher(decrypted: dict) -> dict:
    v = decrypted["VOUCHER"]
    claims = []
    for c in to_list(v.get("CLAIM")):
        net_by_type = defaultdict(Decimal)
        for ch in to_list(c.get("CHARGE")):
            net_by_type[ch["pPayeeType"]] += Decimal(ch["pNetAmount"])  # never float
        claims.append({
            "series_lhio": c["pClaimSeriesLhio"],
            "is_adjustment": c.get("pIsAdjustment") == "T",
            "net_by_payee_type": dict(net_by_type),
        })
    checks = [{
        "payee_type": p["pPayeeType"],
        "payee_code": p["pPayeeCode"],
        "payee_name": p["pPayeeName"].strip(),  # the sample has a trailing space
        "net": Decimal(p["pNetAmount"]),
        "check_no": p["pCheckNo"],
        "check_date": p["pCheckDate"],
    } for p in to_list(v["SUMMARY"].get("PAYEE"))]

    # Sanity checks that hold in PhilHealth's sample. If one fails, investigate;
    # the DevKit does not state these rules.
    warnings = []
    if sum(c["net"] for c in checks) != Decimal(v["SUMMARY"]["pTotalAmount"]):
        warnings.append("PAYEE nets != pTotalAmount")
    if len(claims) != int(v["SUMMARY"]["pNumberOfClaims"]):
        warnings.append("CLAIM count != pNumberOfClaims")

    return {"voucher_no": v["pVoucherNo"], "voucher_date": v["pVoucherDate"],
            "claims": claims, "checks": checks, "warnings": warnings}


# Usage. voucherNo in the query string is our inference (KI-61).
env = assert_success(pecws_get("getVoucherDetails", {"voucherNo": "201-062001-06I03"}))
summary = summarize_voucher(json.loads(unseal(env["result"])))
# With PhilHealth's sample: claims[0]["net_by_payee_type"] ==
#   {"C": Decimal("5200.00"), "H": Decimal("5791.90"), "M": Decimal("2685.00")}
```

:::

We ran these snippets and the curl example (Node.js 24, Python 3.9) against a local mock server, not PECWS, that answers with PhilHealth's decrypted sample.

## Notes and gotchas

- **Voucher number source is unclear** ([KI-23](/known-issues#ki-23)), and so is where the parameter goes ([KI-61](/known-issues#ki-61)). See the warnings under [Parameter](#parameter).
- **One voucher, many claims.** A voucher can pay several claims (Guide p. 55), and a claim's payment is split across payees and checks. Post payments per claim from `CHARGE`, and match checks per payee from `SUMMARY.PAYEE`.
- **Your claim number isn't in the response.** Link `pClaimSeriesLhio` back to your `pClaimNumber` with the mapping saved from [getUploadedClaimsMap](/api/get-uploaded-claims-map).
- **Amounts are strings.** Recommendation (not from PhilHealth): use integer centavos or `Decimal`, never binary floating point. Most centavo amounts have no exact binary representation, so float sums and equality checks can be off by a tiny amount.
- **No field dictionary** ([KI-42](/known-issues#ki-42)). Payee types, category abbreviations and `pIsAdjustment` are undefined in the DevKit. Our readings are labeled as inference above.
- **`docMimeType` says `text/xml`, the content is JSON** ([KI-25](/known-issues#ki-25)).
- **Sample data is masked and old** (2006 dates, `X`-masked names and codes). It shows structure only; PhilHealth's samples are illustrative. The encrypted envelope is a placeholder that can't be decrypted ([KI-27](/known-issues#ki-27)).

::: warning Output description copied from other methods (KI-47)
The Guide's `result` row says it contains "the Receipt Ticket Number and other data about the processing of the submitted e-claim data" (the uploadeClaims wording). The `doc` row mentions "the records of the matching benefit packages" and a DTD (the searchCaseRates wording) ([Guide p. 55–56](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). None of that applies: the decrypted sample is the `VOUCHER` JSON above, and no DTD is shown. See [KI-47](/known-issues#ki-47).
:::

::: warning The sample masks the same payee differently (KI-27)
The sample's masking is inconsistent. The first claim's member is `P192003617072` in `CHARGE` but `P1920XX987072` in `SUMMARY`, and the second claim's hospital is `3XXX04` in `CHARGE` but `30XX04` in `SUMMARY`. Match payees by `pPayeeType` and your own records, and test with real data from PhilHealth's test environment. See [KI-27](/known-issues#ki-27).
:::

### Common mistakes

| Mistake | What happens | Do this instead |
|---|---|---|
| Summing amounts with `parseFloat` / `float` | Centavo rounding errors | Integer centavos or `Decimal` |
| Using `pTotalAmount` as "the amount for my claim" | It's the total for **all** claims and payees on the voucher | Sum that claim's `CHARGE` rows |
| Treating `SUMMARY.PAYEE` as per-claim | `H` and `C` rows combine several claims | Use `CLAIM[].CHARGE[]` for per-claim amounts |
| Hard-coding `pPayeeType` meanings | They are undocumented | Keep a configurable mapping; confirm with PhilHealth |
| Comparing payee names without trimming | `"HC- … HOSPITAL "` has a trailing space | Trim before you compare or display |
| Assuming `CLAIM` / `CHARGE` / `PAYEE` are always arrays | Code may break on a one-item voucher if it comes back as an object | Normalize to a list (the helpers do) |
| Parsing `result` without decrypting it | You get the envelope keys (`iv`, `doc`, …), not `VOUCHER` | Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object. |

## Related pages

- [getClaimStatus](/api/get-claim-status)
- [getUploadedClaimsMap](/api/get-uploaded-claims-map)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [API overview and conventions](/api/) and its [Shared client setup](/api/#shared-client-setup)
- [API payload encryption (cipher key)](/guides/encryption/api-payloads)
- Known issues: [KI-23](/known-issues#ki-23), [KI-27](/known-issues#ki-27), [KI-42](/known-issues#ki-42), [KI-47](/known-issues#ki-47), [KI-61](/known-issues#ki-61)
