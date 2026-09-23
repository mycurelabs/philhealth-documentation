---
title: getUploadedClaimsMap
description: Map your hospital's claim numbers to PhilHealth's 15-digit Claim Series LHIO numbers for the claims in one upload, identified by its receipt ticket number.
---

# getUploadedClaimsMap

For the claims in one upload, find the PhilHealth claim number (`pClaimSeriesLhio`) that belongs to each of your own claim numbers (`pClaimNumber`).

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getUploadedClaimsMap` |
| **Auth header** | `token` (from [getToken](/api/get-token)) |
| **Request** | No body. One query parameter: `receiptTicketNumber` ([KI-22](/known-issues#ki-22)). |
| **Response `result`** | Encrypted with your cipher key. Once decrypted it is JSON: `eCONFIRMATION` with a `MAPPING` of `pClaimNumber` to `pClaimSeriesLhio`, plus upload details. |

::: tip What you need to do
1. After a successful [uploadeClaims](/api/upload-eclaims), take the Receipt Ticket Number (RTN) from `eRECEIPT@pReceiptTicketNumber`.
2. Call `GET …/getUploadedClaimsMap?receiptTicketNumber=<RTN>` with a fresh `token` header. Use exactly that parameter name ([KI-22](/known-issues#ki-22)).
3. Decrypt `result` with your cipher key and parse the JSON.
4. Save `pClaimNumber` → `pClaimSeriesLhio` for every claim, as strings. Later methods ([getClaimStatus](/api/get-claim-status), [getVoucherDetails](/api/get-voucher-details), [addRequiredDocument](/api/add-required-document)) only know PhilHealth's number.
5. Accept `MAPPING` as a single object or as an array ([KI-42](/known-issues#ki-42)).
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 53–54: Get Uploaded Claims Map Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)
- [Implementation Guide, p. 3: revision history (20240423, 20241111)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 35–36: `eRECEIPT` returned by uploadeClaims](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)
- [Implementation Guide, p. 42: addRequiredDocument (`pSeriesLhioNo`, RTH claims)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=42)
- [Implementation Guide, p. 79 and p. 85: Annex C (`pClaimNumber`, `pClaimSeriesLhio`, `pReceiptTicketNumber`, `pReceivedDate`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 1 and p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=1)
- [eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd) (`eTRANSMITTAL (CLAIM+)`)
- [Software Solution Validation Test Form (rev. 20250217), p. 3: Module 2, item 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
:::

## When to use it

Call it **after a successful [uploadeClaims](/api/upload-eclaims)**. The upload returns an `eRECEIPT` whose `pReceiptTicketNumber` is the Receipt Ticket Number (RTN) of that upload. Pass the RTN to this method, and it returns the PhilHealth claim number for each claim in the upload.

```text
uploadeClaims ──► eRECEIPT@pReceiptTicketNumber (RTN)
                          │
                          ▼
getUploadedClaimsMap?receiptTicketNumber=RTN ──► pClaimNumber ↔ pClaimSeriesLhio
                                                             │
          ┌──────────────────────────────────────────────────┼─────────────────────┐
          ▼                                                  ▼                     ▼
getClaimStatus (serieslhionos)          addRequiredDocument (pSeriesLhioNo)   data-migration XML
getVoucherDetails output                                                     (CLAIM@pClaimSeriesLhio)
  (CLAIM[].pClaimSeriesLhio)
```

The Guide describes the method like this: it "facilitates claim reconciliation and verification by mapping the health facility's system-generated ID to the PhilHealth Claim Series Number. The Claim Series Number serves as a common reference between the health facility and PhilHealth for a given claim" ([Guide p. 53](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=53)).

### Why this mapping matters

Your system knows a claim by **your** number (`pClaimNumber`, "Hospital Generated Claim Case #", Annex C p. 79). After upload, PhilHealth knows it by **its** number (`pClaimSeriesLhio`). Most of what happens next uses PhilHealth's number, so store the mapping as soon as you get it:

| Task | Why you need `pClaimSeriesLhio` | Source |
|---|---|---|
| **Reconciliation** | Annex C says `pClaimSeriesLhio` "Can be used by the hospital to reconcile their records with Philhealth". | Guide p. 79 |
| **Status tracking** | [getClaimStatus](/api/get-claim-status) takes a list of claim series numbers (`serieslhionos`), not your claim numbers. | Guide p. 46 |
| **Payment posting** | [getVoucherDetails](/api/get-voucher-details) lists paid claims by `pClaimSeriesLhio`, PhilHealth Identification Number (PIN) and patient name. It does **not** return your `pClaimNumber`. | Guide p. 56–59 |
| **Return-to-hospital (RTH) claims** | When PhilHealth returns a claim for missing requirements, [addRequiredDocument](/api/add-required-document) identifies the claim by `pSeriesLhioNo` ("Series Lhio Number"). | Guide p. 42 |
| **Changing IT service provider** | The data-migration XML adds `CLAIM@pClaimSeriesLhio`, "the 15-digit number returned by the GetUploadedClaimsMap API". It "enables the new service provider to process return-to-hospital (RTH) claims submitted via the previous provider's system". | Migration dictionary p. 1 |
| **Certification** | SSVTF Module 2, item 4: "Does the system provide mapping between the PhilHealth claim series number and the health facility claim ID?" | SSVTF p. 3 |

### What a `pClaimSeriesLhio` looks like

- 15 characters: String(15), "Philhealth Generated and Assigned Unique Number per Claim … This will be returned after the claim are uploaded to Philhealth" (Annex C, [p. 79](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)).
- The data-migration dictionary adds that "The first 13 digits represent the PhilHealth Claim Series number. The last two digits represent PhilHealth Regional Office (PRO) code representing the regional office that has processed the claim" ([Migration dictionary p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)).
- The DevKit never spells out "LHIO". Treat the value as an opaque identifier and store it as a **string**, not a number: sample values such as `090801990000199` start with `0`, and a numeric column would drop that leading zero.

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PhilHealth e-Claims Web Service (PECWS) authentication token from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). | Guide p. 53 |

### Query parameter

| Parameter | Value | Source |
|---|---|---|
| `receiptTicketNumber` | The receipt ticket number generated by the upload. It "must match the `pReceiptTicketNumber` attribute returned by the eClaimsUpload method for the corresponding set of claims". | Guide p. 53; revision 20241111, p. 3 |

```http
GET /PHIC/Claims3.0/getUploadedClaimsMap?receiptTicketNumber=071311000005 HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
```

`071311000005` is the RTN from the Guide's sample response. There is no request body, and nothing in the request is encrypted.

::: warning Parameter name: use `receiptTicketNumber` (KI-22)
The prose on p. 53 still says "The **receiptTicketNo** parameter must match…", while the parameter table on the same page says `receiptTicketNumber`. Revision 20241111 settles it: 'query parameter name "ReceiptTicketNo" is now "receiptTicketNumber"' ([Guide p. 3](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)). Use `receiptTicketNumber`, and remember that query-parameter names are case-sensitive. See [KI-22](/known-issues#ki-22).
:::

#### About the RTN value

- Annex C defines `pReceiptTicketNumber` as String(18), "Philhealth Generated Upload Comfirmation Receipt ticket number" ([p. 85](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=85)). No format is given.
- Recommendation (not from PhilHealth): store the RTN exactly as `uploadeClaims` returned it (as a string, with any dashes and leading zeros), and URL-encode it when you build the query string. Don't reformat it.

::: warning The RTN format differs between samples (KI-31)
The Guide's two samples use different shapes: `1234-5601-1234` (with dashes) in the uploadeClaims `eRECEIPT` ([p. 35](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=35)), and `071311000005` (12 digits, no dashes) in this method's response ([p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)). The DevKit doesn't say which is real, or whether PECWS normalizes dashes. Pass back exactly what `uploadeClaims` gave you. See [KI-31](/known-issues#ki-31).
:::

## Response

### Envelope

| Key | Value (Guide p. 53–54) |
|---|---|
| `success` | `true` when the operation succeeded. |
| `message` | The error message, if an error occurred. The DevKit lists no specific messages (for example, for an unknown RTN) ([KI-42](/known-issues#ki-42)). |
| `result` | An encrypted envelope, encrypted with **your health facility's cipher key**: `docMimeType` (documented as `"text/xml"`), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc`. |

Decrypt `result` as described in [API payload encryption](/guides/encryption/api-payloads). The decrypted sample is **JSON**, although `docMimeType` says `text/xml` ([KI-25](/known-issues#ki-25)) and the output table calls the content "XML text" ([KI-47](/known-issues#ki-47)).

### Decrypted result structure

```text
eCONFIRMATION
├── MAPPING                    one object in the sample (see "Uploads with several claims")
│   ├── pClaimNumber           ← your CLAIM@pClaimNumber
│   ├── pPatientLastName
│   ├── pPatientFirstName
│   ├── pPatientMiddleName
│   ├── pPatientSuffix
│   ├── pAdmissionDate
│   ├── pDischargeDate
│   └── pClaimSeriesLhio       ← PhilHealth's claim number
├── pReceiptTicketNumber
├── pHospitalCode
├── pHospitalTransmittalNo
├── pTotalClaims
└── pReceivedDate
```

The Guide gives no field dictionary for this output, only the sample ([p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54); [KI-42](/known-issues#ki-42)). Most keys share their names with attributes in the upload XML ([eClaims XML](/reference/eclaims-xml)) or with Annex C entries, and the table below points to those.

#### `MAPPING`

| Key | Sample value | Meaning |
|---|---|---|
| `pClaimNumber` | `"09-08-01-006"` | Your hospital claim number, as sent in `CLAIM@pClaimNumber`. Annex C: "Hospital Claim Number", "Hospital Generated Claim Case #, this should be unique per hospital". |
| `pPatientLastName` | `"LASTNAME"` | Patient's last name (same name as `CF1@pPatientLastName`). |
| `pPatientFirstName` | `"MARIA"` | Patient's first name (`CF1@pPatientFirstName`). |
| `pPatientMiddleName` | `"C"` | Patient's middle name (`CF1@pPatientMiddleName`). |
| `pPatientSuffix` | `""` | Suffix such as JR or III; may be empty (`CF1@pPatientSuffix`). |
| `pAdmissionDate` | `"08-25-2009"` | Admission date, `mm-dd-yyyy` (`CF2@pAdmissionDate`). |
| `pDischargeDate` | `"08-25-2009"` | Discharge date, `mm-dd-yyyy` (`CF2@pDischargeDate`). |
| `pClaimSeriesLhio` | `"090801990000199"` | PhilHealth's 15-digit claim number for this claim. |

#### `eCONFIRMATION` (upload-level fields)

| Key | Sample value | Meaning |
|---|---|---|
| `pReceiptTicketNumber` | `"071311000005"` | The RTN you asked about. Check that it matches. |
| `pHospitalCode` | `"300832"` | Your facility code (same name as `eCLAIMS@pHospitalCode`; Annex C: "For now PMCC number should be used". Annex E describes the PMCC No. as "A unique code assigned by PhilHealth to the health facility", [p. 88](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=88)). The sample's 6 digits look like a PMCC number, not a PAN, but the DevKit doesn't say ([KI-48](/known-issues#ki-48)). For this site's example claim you'd expect `123456`. |
| `pHospitalTransmittalNo` | `"3008321107000008"` | Your transmittal number (`eTRANSMITTAL@pHospitalTransmittalNo`; Annex C: "Generated by the Hospital own batching system"). |
| `pTotalClaims` | `"1"` | Number of claims in the upload (`eTRANSMITTAL@pTotalClaims`, "Claims counter"). A string. |
| `pReceivedDate` | `"09-13-2009"` | Annex C p. 85: "Date when the transmitted file received by PhilHealth", `MM-DD-YYYY`. |

### Uploads with several claims

One upload can contain many claims: the DTD says `<!ELEMENT eTRANSMITTAL (CLAIM+)>` ([eClaimsDef.dtd](/originals/eclaims-xml/eClaimsDef.dtd)). The only sample has `pTotalClaims` = `"1"` and a **single `MAPPING` object**. The DevKit doesn't show what the response looks like for two or more claims. It could be a `MAPPING` array, as `CASERATES` and `CLAIMS` are in other methods, but that is not documented.

::: warning Undocumented: the response for several claims (KI-42)
Recommendation (not from PhilHealth): accept both shapes, and wrap a single `MAPPING` object in an array before you process it. Then compare the number of mappings with `pTotalClaims`, and alert someone if they differ. Test this with a multi-claim upload in PhilHealth's test environment before go-live. See [KI-42](/known-issues#ki-42).
:::

## Example

### Request

```bash
# Needs jq (https://jqlang.github.io/jq/) to read the token from the JSON response.
TOKEN=$(curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID" | jq -r '.result')

curl -sS -G "$PECWS_BASE_URL/getUploadedClaimsMap" \
  -H "token: $TOKEN" \
  --data-urlencode "receiptTicketNumber=071311000005"
```

`-G` tells curl to put the `--data-urlencode` value in the query string of a GET request. The environment variables are the ones from [API overview → Shared client setup](/api/#shared-client-setup). The RTN is the Guide's sample value; use the one your upload returned.

### Encrypted response (PhilHealth sample, p. 54)

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

This envelope is a placeholder. The same `hash` and `doc` values appear in the samples of several other methods, for example uploadeClaims, getClaimStatus, getVoucherDetails and searchEmployer, and they cannot be decrypted ([KI-27](/known-issues#ki-27)).

### Decrypted `result` (PhilHealth sample, p. 54)

```json
{
  "eCONFIRMATION": {
    "MAPPING": {
      "pClaimNumber": "09-08-01-006",
      "pPatientLastName": "LASTNAME",
      "pPatientFirstName": "MARIA",
      "pPatientMiddleName": "C",
      "pPatientSuffix": "",
      "pAdmissionDate": "08-25-2009",
      "pDischargeDate": "08-25-2009",
      "pClaimSeriesLhio": "090801990000199"
    },
    "pReceiptTicketNumber": "071311000005",
    "pHospitalCode": "300832",
    "pHospitalTransmittalNo": "3008321107000008",
    "pTotalClaims": "1",
    "pReceivedDate": "09-13-2009"
  }
}
```

The sample is valid JSON; only the indentation has been changed. Names and dates are illustrative.

### Call the method and build the map

The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsGet` / `pecws_get` gets a fresh token and sends the GET with the query parameter URL-encoded. `assertSuccess` / `assert_success` throws unless `success` is `true`. `unseal` decrypts `result` with your cipher key and returns the decrypted **text**; it throws when the hash doesn't match. The PHP tab is self-contained, because there is no shared PHP client: it uses `pecws_decrypt_payload` from this site's [`payload_crypto.php`](/examples/encryption/payload_crypto.php), which also returns the decrypted text. The map-building helpers are a recommendation, not PhilHealth code.

::: code-group

```js [Node.js 18+]
import { pecwsGet, unseal, assertSuccess } from './pecws-client.mjs';

const toArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);

// Returns Map<pClaimNumber, pClaimSeriesLhio> for one upload (one RTN).
export function seriesByClaimNumber(decrypted, expectedRtn) {
  const conf = decrypted.eCONFIRMATION;
  if (conf.pReceiptTicketNumber !== expectedRtn) {
    throw new Error(`Asked for RTN ${expectedRtn}, got ${conf.pReceiptTicketNumber}`);
  }
  const mappings = toArray(conf.MAPPING); // one object in the sample; be ready for a list
  if (mappings.length !== Number(conf.pTotalClaims)) {
    console.warn(`pTotalClaims=${conf.pTotalClaims} but ${mappings.length} MAPPING entries`);
  }
  return new Map(mappings.map((m) => [m.pClaimNumber, m.pClaimSeriesLhio]));
}

// Usage. The RTN is eRECEIPT@pReceiptTicketNumber from your upload, stored as a string.
const rtn = '071311000005';
const env = assertSuccess(await pecwsGet('getUploadedClaimsMap', { receiptTicketNumber: rtn }));
const map = seriesByClaimNumber(JSON.parse(unseal(env.result)), rtn);
// With PhilHealth's sample: Map(1) { '09-08-01-006' => '090801990000199' }
// For this site's example claim you'd get something like '202609170001' => '260917990000101'.
```

```python [Python 3.9+]
import json
import logging

from pecws_client import pecws_get, unseal, assert_success


def to_list(x):
    return [] if x is None else x if isinstance(x, list) else [x]


def series_by_claim_number(decrypted: dict, expected_rtn: str) -> dict[str, str]:
    """{pClaimNumber: pClaimSeriesLhio} for one upload (one RTN)."""
    conf = decrypted["eCONFIRMATION"]
    if conf["pReceiptTicketNumber"] != expected_rtn:
        raise ValueError(f"Asked for RTN {expected_rtn}, got {conf['pReceiptTicketNumber']}")
    mappings = to_list(conf.get("MAPPING"))  # one object in the sample; be ready for a list
    if len(mappings) != int(conf["pTotalClaims"]):
        logging.warning("pTotalClaims=%s but %d MAPPING entries", conf["pTotalClaims"], len(mappings))
    return {m["pClaimNumber"]: m["pClaimSeriesLhio"] for m in mappings}


# Usage. The RTN is eRECEIPT@pReceiptTicketNumber from your upload, stored as a string.
rtn = "071311000005"
env = assert_success(pecws_get("getUploadedClaimsMap", {"receiptTicketNumber": rtn}))
mapping = series_by_claim_number(json.loads(unseal(env["result"])), rtn)
# With PhilHealth's sample: {'09-08-01-006': '090801990000199'}
```

```php [PHP 7.4+]
<?php
// Self-contained: there is no shared PHP client. Needs the curl and openssl extensions.
// Save /examples/encryption/payload_crypto.php next to this file.
require __DIR__ . '/payload_crypto.php';

// Sends one request and returns the response envelope. Throws unless success is true.
function pecws_call(string $url, array $headers): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
    ]);
    $response = curl_exec($ch);
    if ($response === false) {
        throw new RuntimeException(curl_error($ch));
    }
    $envelope = json_decode($response, true);
    if (($envelope['success'] ?? false) !== true) {
        throw new RuntimeException('PECWS call failed: ' . ($envelope['message'] ?? $response));
    }
    return $envelope;
}

$base = getenv('PECWS_BASE_URL'); // https://<host from PhilHealth>/PHIC/Claims3.0

// 1. A fresh token right before the call (KI-26).
$token = pecws_call("$base/getToken", [
    'accreditationNo: ' . getenv('PHIC_FACILITY_PAN'),
    'softwareCertificateId: ' . getenv('PHIC_SOFTWARE_CERT_ID'),
])['result'];

// 2. The call. The RTN (eRECEIPT@pReceiptTicketNumber, as a string) goes in the query string.
$rtn = '071311000005';
$envelope = pecws_call(
    "$base/getUploadedClaimsMap?" . http_build_query(['receiptTicketNumber' => $rtn]),
    ["token: $token"]
);

// 3. Decrypt. pecws_decrypt_payload() returns the text and throws if the hash doesn't match.
$decrypted = json_decode(pecws_decrypt_payload($envelope['result'], getenv('PECWS_CIPHER_KEY')), true);
$mappings = $decrypted['eCONFIRMATION']['MAPPING'];
if (isset($mappings['pClaimNumber'])) {
    $mappings = [$mappings]; // one object in the sample; be ready for a list
}
$seriesByClaimNumber = array_column($mappings, 'pClaimSeriesLhio', 'pClaimNumber');
// With PhilHealth's sample: ['09-08-01-006' => '090801990000199']
```

:::

We ran these snippets and the curl example (Node.js 24, Python 3.9, PHP 7.4 and 8.3) against a local mock server, not PECWS, that answers with PhilHealth's decrypted sample.

### Suggested storage

This is a recommendation, not a PhilHealth requirement. Keep one row per claim that links every identifier you will need later:

| Column | Filled from | When | Example claim (illustrative) |
|---|---|---|---|
| `claim_number` | your `CLAIM@pClaimNumber` | when you build the XML | `202609170001` |
| `hospital_transmittal_no` | your `eTRANSMITTAL@pHospitalTransmittalNo` | when you build the XML | `TR20260917001` |
| `receipt_ticket_number` | `eRECEIPT@pReceiptTicketNumber` | after `uploadeClaims` | returned by PhilHealth, for example `071311000005` |
| `transmission_control_number` | `eRECEIPT@pTransmissionControlNumber` | after `uploadeClaims` | returned by PhilHealth |
| `claim_series_lhio` | `MAPPING.pClaimSeriesLhio` | after `getUploadedClaimsMap` | returned by PhilHealth, for example `260917990000101` |
| `last_status`, `status_as_of` | `pStatus`, `pAsOf` + `pAsOfTime` | after each `getClaimStatus` | `IN PROCESS`, `09-18-2026 04:46:23PM` |
| `voucher_no` | `pVoucherNo` | when you learn it ([KI-23](/known-issues#ki-23)) | |

## Notes and gotchas

- **When is the mapping available?** The DevKit doesn't say whether the mapping exists right after upload or only after some processing, or how long it stays available ([KI-64](/known-issues#ki-64)). Recommendation (not from PhilHealth): call it right after a successful upload. If it fails, keep the RTN and retry later with backoff instead of re-uploading the claims. How PECWS treats a second upload of the same claim is not documented either ([KI-62](/known-issues#ki-62)), so check this method before you re-send anything.
- **"eClaimsUpload" means `uploadeClaims`.** The prose on p. 53 names the upload method "eClaimsUpload", but the endpoint is `uploadeClaims` ([KI-09](/known-issues#ki-09)).
- **Everything is a string.** `pTotalClaims` is `"1"`, not `1`. Convert it before you compare.
- **Match on RTN and claim number, not on patient name** (recommendation, not from PhilHealth). Names can repeat, and the sample's `"LASTNAME"` is a placeholder.

::: warning Output description copied from other methods (KI-47)
The Guide's `doc` row says it holds "the records of the matching benefit packages. Sample XML text and the DTD of the XML text is shown below" (the searchCaseRates wording, [Guide p. 54](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=54)). No DTD is shown, and the decrypted sample is the `eCONFIRMATION` JSON above. (The `result` row's "Receipt Ticket Number and other data about the processing of the submitted e-claim data" does at least fit this method, apart from calling the content "XML text".) See [KI-47](/known-issues#ki-47).
:::

### Common mistakes

| Mistake | What happens | Do this instead |
|---|---|---|
| Using `receiptTicketNo` or `ReceiptTicketNo` | These are the old names; the server likely won't find the parameter | Use `receiptTicketNumber` ([KI-22](/known-issues#ki-22)) |
| Sending the RTN in a JSON body | GET bodies are often dropped, and this method documents a parameter, not a body | Put it in the query string |
| Passing the Transmission Control Number (TCN) instead of the RTN | Wrong identifier | Use `eRECEIPT@pReceiptTicketNumber` |
| Storing `pClaimSeriesLhio` as an integer | Leading zeros are lost (`090801990000199`) | Store it as a 15-character string |
| Assuming `MAPPING` is always an object | Code breaks on a multi-claim upload if an array comes back | Normalize to a list |
| Parsing `result` without decrypting it | You get the envelope keys (`iv`, `doc`, …), not `eCONFIRMATION` | Parse the text from `unseal(env.result)`. If you call `decryptPayload` yourself, parse its `.text`: it returns an object. |
| Not saving the mapping | You can't tie later statuses, vouchers or RTH requests to your claims | Save it right away (see [Suggested storage](#suggested-storage)) |

## Related pages

- [uploadeClaims](/api/upload-eclaims) (returns the RTN)
- [getClaimStatus](/api/get-claim-status)
- [getVoucherDetails](/api/get-voucher-details)
- [addRequiredDocument](/api/add-required-document)
- [Migrating data between providers](/guides/data-migration)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [API payload encryption (cipher key)](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- Known issues: [KI-22](/known-issues#ki-22), [KI-31](/known-issues#ki-31), [KI-42](/known-issues#ki-42), [KI-47](/known-issues#ki-47), [KI-62](/known-issues#ki-62), [KI-64](/known-issues#ki-64)
