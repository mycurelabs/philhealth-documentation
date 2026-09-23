---
title: getClaimStatus
description: Get the processing status and stage-by-stage trail of one or more uploaded claims, identified by their PhilHealth claim series numbers.
---

# getClaimStatus

Get the current processing status, and the trail of processing stages, for one or more claims you have already uploaded.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Conflicting sources" /> <Badge type="warning" text="Gap" />

| | |
|---|---|
| **Method** | `GET`, with a JSON request body ([KI-17](/known-issues#ki-17)) |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getClaimStatus` |
| **Auth header** | `token` (from [getToken](/api/get-token)) |
| **Request body** | Plain JSON: `{"serieslhionos": ["…", "…"]}`. The Guide does not describe it as encrypted. |
| **Response `result`** | Encrypted with your cipher key. Once decrypted it is JSON: `CLAIMS[]`, each with `STATUS.CLAIM` (patient, dates, `pStatus`, `TRAIL.PROCESS[]`) plus `pAsOf` / `pAsOfTime`. |

::: tip What you need to do
1. Get each claim's `pClaimSeriesLhio` from [getUploadedClaimsMap](/api/get-uploaded-claims-map) and store it as a string.
2. Send `GET …/getClaimStatus` with a fresh `token` header and a JSON body `{"serieslhionos": [...]}`. Use an HTTP client that can send a body with GET; `fetch()` can't ([KI-17](/known-issues#ki-17)).
3. Decrypt `result` with your cipher key and parse the JSON.
4. Match each entry to your claim by `pClaimSeriesLhio`, and store `pStatus` and the stages exactly as received. Status values are not listed anywhere ([KI-42](/known-issues#ki-42)).
5. Look for a `pVoucherNo` anywhere in the result; its location is undocumented ([KI-23](/known-issues#ki-23)).
:::

::: info Sources
- [Implementation Guide (rev. 20250217), p. 46–48: Get Claim Status Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)
- [Implementation Guide, p. 55: getVoucherDetails refers to `pVoucherNo` "returned by the getClaimStatus method"](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)
- [Implementation Guide, p. 3: revision history (20240423, method added)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 79: Annex C (`pClaimSeriesLhio`, `pMemberPIN`)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=79)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 6: structure of `pClaimSeriesLhio`](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)
- [Software Solution Validation Test Form (rev. 20250217), p. 3: Module 3, item 1](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
:::

## When to use it

The Guide says the method "allows the retrieval of the processing status of one or more claims using claim series numbers" ([Guide p. 46](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)). Here is where it fits in the lifecycle:

1. [uploadeClaims](/api/upload-eclaims) returns a Receipt Ticket Number (RTN).
2. [getUploadedClaimsMap](/api/get-uploaded-claims-map) turns the RTN into one `pClaimSeriesLhio` per claim.
3. **getClaimStatus** takes those series numbers and tells you where each claim is in PhilHealth's processing.
4. When a voucher has been prepared for payment, [getVoucherDetails](/api/get-voucher-details) gives the payment breakdown. The Guide says you get the voucher number from this method, but see [KI-23](/known-issues#ki-23).

Certification requires it. SSVTF Module 3 ("Claims Status Verification"), item 1 asks: "Does the system provide an interface for retrieving the status of claims?" ([SSVTF p. 3](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)).

## Request

### Headers

| Header | Value | Source |
|---|---|---|
| `token` | PhilHealth e-Claims Web Service (PECWS) authentication token from [getToken](/api/get-token). Get a fresh one right before the call ([KI-26](/known-issues#ki-26)). | Guide p. 46 |
| `Content-Type` | `application/json` | Not specified by the DevKit ([KI-42](/known-issues#ki-42)). Recommendation (not from PhilHealth): send it, because there is a JSON body. |

### Body

```json
{"serieslhionos": ["260917990000101"]}
```

`260917990000101` is an illustrative 15-digit `pClaimSeriesLhio` for this site's example claim. Real values come from [getUploadedClaimsMap](/api/get-uploaded-claims-map). Put several in the array to check several claims in one call.

| Key | Type | Description |
|---|---|---|
| `serieslhionos` | Array of strings | "JSON Object list of Strings containing multiple claims Series Nos" ([Guide p. 46](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)). The official sample is `{"serieslhionos": ["1","2"]}` (p. 47). |

The Guide shows the body as plain JSON ("Sample JSON input payload") and does not describe it as encrypted.

::: warning Which number goes in the list? (KI-64)
The Guide says only "claims Series Nos", and its sample sends `"1"` and `"2"`. The response identifies each claim by `pClaimSeriesLhio`, the 15-digit number that [getUploadedClaimsMap](/api/get-uploaded-claims-map) returns. The migration dictionary explains that its first 13 digits are the "PhilHealth Claim Series number" and the last two are the PhilHealth Regional Office (PRO) code ([p. 6](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=6)). So "series number" could mean either the 13-digit or the 15-digit form ([KI-64](/known-issues#ki-64)).

Recommendation (not from PhilHealth): send the full 15-digit `pClaimSeriesLhio` values as strings, because that is what the response echoes. Confirm with PhilHealth that the 13-digit form isn't expected.
:::

The DevKit does **not** specify ([KI-64](/known-issues#ki-64), [KI-42](/known-issues#ki-42)):

- the maximum number of series numbers per call;
- whether the order of `CLAIMS[]` follows the order of your list;
- what happens when a series number is unknown or belongs to another facility.

### Sending a body with GET

This is [KI-17](/known-issues#ki-17). HTTP allows a GET request to carry a body, but gives that body no defined meaning, and many tools refuse to send one or silently drop it. You must use a client that **keeps the method as GET and still sends the body**.

| Client | Sends a GET body? | How |
|---|---|---|
| curl | Yes | `-X GET --data '…'`. Don't add `-G`: it moves the data into the URL. |
| Python `requests` | Yes | `requests.request("GET", url, json=…)` |
| PHP cURL | Yes | `CURLOPT_CUSTOMREQUEST => 'GET'` plus `CURLOPT_POSTFIELDS` |
| Node.js `http` / `https` | Yes | `https.request({ method: 'GET', … })`, then `req.end(body)` |
| `fetch()` (browsers, Node.js 18+) | **No** | Throws `TypeError: Request with GET/HEAD method cannot have body.` |

We checked the "Yes" rows (curl 8, Python `requests`, PHP 8.3 cURL, Node.js 24) and the `fetch()` error against a local mock server, **not** against PECWS. Proxies, API gateways and web application firewalls between you and PhilHealth may still strip the body.

::: tip Recommendation (not from PhilHealth)
- Make sure the request carries a `Content-Length` header, so the body isn't sent with chunked encoding, which some servers ignore on GET. curl, Python `requests`, PHP cURL and the shared client set it for you. If you write your own Node.js request with `https.request`, set it yourself.
- If PECWS answers as if you sent no series numbers, check that the body actually left your network (for example with a request logger), before you debug anything else.
- Don't switch to POST or to query parameters on your own. If your stack can't send a GET body, ask PhilHealth which alternative is supported.
:::

## Response

### Envelope

| Key | Value (Guide p. 46–47) |
|---|---|
| `success` | `true` when the operation succeeded. |
| `message` | The error message, if an error occurred. No specific messages are listed ([KI-42](/known-issues#ki-42)). |
| `result` | An encrypted envelope, encrypted with **your health facility's cipher key**: `docMimeType` (documented as `"text/xml"`), `hash`, `key1` (`""`), `key2` (`""`), `iv`, `doc`. |

Decrypt `result` as described in [API payload encryption](/guides/encryption/api-payloads). The decrypted sample is **JSON**, even though `docMimeType` says `text/xml` ([KI-25](/known-issues#ki-25)) and the output table calls the content "XML text" ([KI-47](/known-issues#ki-47)).

### Decrypted result structure

```text
CLAIMS[]                          one entry per claim
└── STATUS
    ├── CLAIM
    │   ├── TRAIL
    │   │   └── PROCESS[]         processing history
    │   │       ├── pProcessStage
    │   │       └── pProcessDate
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
    │   └── pStatus
    ├── pAsOf
    └── pAsOfTime
```

Note that `pAsOf` and `pAsOfTime` are siblings of `CLAIM` inside `STATUS`, not children of `CLAIM`.

The Guide provides **no field dictionary** for this output, only the sample ([p. 47–48](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=47); [KI-42](/known-issues#ki-42)). The meanings below come from the key names and sample values. Anything inferred is labeled as such. All values are strings.

#### `STATUS.CLAIM`

| Key | Sample value | Meaning |
|---|---|---|
| `TRAIL.PROCESS[]` | array of stages | The claim's processing history (next table). |
| `pClaimSeriesLhio` | `"120723190000119"` | PhilHealth's 15-digit claim number. Use it to match the entry to your claim. |
| `pPin` | `"190892937993"` | From the name, a PhilHealth Identification Number (PIN), 12 digits in the sample (inference). The DevKit doesn't say whether it is the member's or the patient's PIN. |
| `pPatientLastName` | `"LASTNAME"` | Patient's last name. |
| `pPatientFirstName` | `"FIRSTNAME"` | Patient's first name. |
| `pPatientMiddleName` | `"MIDDLENAME"` | Patient's middle name. |
| `pPatientSuffix` | `""` or `"III"` | Name suffix; may be empty. |
| `pAdmissionDate` | `"05-02-2012"` | Admission date (`mm-dd-yyyy`). |
| `pDischargeDate` | `"05-06-2012"` | Discharge date (`mm-dd-yyyy`). |
| `pClaimDateReceived` | `"05-15-2012"` | The date PhilHealth received the claim, as the name suggests (inference). |
| `pClaimDateRefile` | `""` | Empty in the sample. From the name, the date the claim was refiled, for example after being returned to the hospital (inference). |
| `pStatus` | `"IN PROCESS"` | The claim's current status. `"IN PROCESS"` is the **only** value shown anywhere in the DevKit. |

#### `TRAIL.PROCESS[]`

| Key | Sample values | Meaning |
|---|---|---|
| `pProcessStage` | `"RECEIVING"`, `"ENCODING"`, `"EDITING (RECEIVING)"`, `"VALIDATION"`, `"EDITING"` | Name of a processing stage. These five are the only values shown in the DevKit. |
| `pProcessDate` | `"07-23-2012"` | Date of that stage (`mm-dd-yyyy`, no time). |

What the sample trail shows:

- **Newest first.** The two 07-25-2012 entries come before the four 07-23-2012 entries.
- **Stages can repeat.** `VALIDATION` appears twice (07-23-2012 and 07-25-2012). `EDITING (RECEIVING)` on 07-23 is followed by `EDITING` on 07-25.
- **Same-day entries have no time**, so the DevKit gives you no way to order them other than the order in the array.

#### `STATUS` (snapshot time)

| Key | Sample value | Meaning |
|---|---|---|
| `pAsOf` | `"07-25-2012"` | From the name, the date the status snapshot is valid for (inference; `mm-dd-yyyy`). |
| `pAsOfTime` | `"04:46:23PM"` | Time for `pAsOf`, in the `HH:MM:SSAM/PM` format used elsewhere in the eClaims data (Annex C), with no space before `PM`. Other PECWS samples do put a space there ([KI-49](/known-issues#ki-49)). |

::: warning Status values are not enumerated
Only `pStatus: "IN PROCESS"` appears in the DevKit ([KI-42](/known-issues#ki-42)). Don't build your logic on a guessed list of statuses.

Recommendation (not from PhilHealth): store `pStatus` and each `pProcessStage` exactly as received, show them to users verbatim, and alert someone when a value you haven't seen before appears. Ask PhilHealth for the full list of statuses (including paid, denied and returned-to-hospital) before you automate anything on them.
:::

::: warning Where is the voucher number? (KI-23)
The getVoucherDetails section says: "The voucherNo parameter should be set to the pVoucherNo attribute returned by the getClaimStatus method if a voucher has already been prepared for the claim's payment" ([Guide p. 55](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=55)). But the getClaimStatus sample (p. 47–48) contains **no `pVoucherNo`**, so the DevKit doesn't show where it appears.

Recommendation (not from PhilHealth): search the whole `STATUS` object for a `pVoucherNo` key instead of assuming a fixed path (the helper below does this). Confirm the location with PhilHealth. See [KI-23](/known-issues#ki-23).
:::

## Example

### Request (PhilHealth sample, p. 47)

```http
GET /PHIC/Claims3.0/getClaimStatus HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
Content-Type: application/json

{"serieslhionos": ["1","2"]}
```

The body is PhilHealth's sample; the request line and headers are ours (the Guide shows only the body and does not mention `Content-Type`). `"1"` and `"2"` are placeholders. Real calls send claim series numbers.

### Encrypted response (PhilHealth sample, p. 47)

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

### Decrypted `result` (PhilHealth sample, p. 47–48)

```json
{
  "CLAIMS": [
    {
      "STATUS": {
        "CLAIM": {
          "TRAIL": {
            "PROCESS": [
              { "pProcessStage": "VALIDATION", "pProcessDate": "07-25-2012" },
              { "pProcessStage": "EDITING", "pProcessDate": "07-25-2012" },
              { "pProcessStage": "VALIDATION", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "EDITING (RECEIVING)", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "ENCODING", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "RECEIVING", "pProcessDate": "07-23-2012" }
            ]
          },
          "pClaimSeriesLhio": "120723190000119",
          "pPin": "190892937993",
          "pPatientLastName": "LASTNAME",
          "pPatientFirstName": "FIRSTNAME",
          "pPatientMiddleName": "MIDDLENAME",
          "pPatientSuffix": "",
          "pAdmissionDate": "05-02-2012",
          "pDischargeDate": "05-06-2012",
          "pClaimDateReceived": "05-15-2012",
          "pClaimDateRefile": "",
          "pStatus": "IN PROCESS"
        },
        "pAsOf": "07-25-2012",
        "pAsOfTime": "04:46:23PM"
      }
    },
    {
      "STATUS": {
        "CLAIM": {
          "TRAIL": {
            "PROCESS": [
              { "pProcessStage": "VALIDATION", "pProcessDate": "07-25-2012" },
              { "pProcessStage": "EDITING", "pProcessDate": "07-25-2012" },
              { "pProcessStage": "VALIDATION", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "EDITING (RECEIVING)", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "ENCODING", "pProcessDate": "07-23-2012" },
              { "pProcessStage": "RECEIVING", "pProcessDate": "07-23-2012" }
            ]
          },
          "pClaimSeriesLhio": "120723190000119",
          "pPin": "190592937994",
          "pPatientLastName": "LASTNAME",
          "pPatientFirstName": "FIRSTNAME",
          "pPatientMiddleName": "MIDDLENAME",
          "pPatientSuffix": "III",
          "pAdmissionDate": "05-02-2012",
          "pDischargeDate": "05-06-2012",
          "pClaimDateReceived": "05-15-2012",
          "pClaimDateRefile": "",
          "pStatus": "IN PROCESS"
        },
        "pAsOf": "07-25-2012",
        "pAsOfTime": "04:46:23PM"
      }
    }
  ]
}
```

The sample is valid JSON as published. We only compacted each `PROCESS` entry onto one line. Both entries carry the **same** `pClaimSeriesLhio` (`120723190000119`) with different PINs, and the dates are from 2012. The sample is illustrative only.

### Call the method

The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsGetWithBody` / `pecws_get_with_body` gets a fresh token and sends a GET request **with** a JSON body. The Node.js version uses `node:https` instead of `fetch()`, which can't send one ([KI-17](/known-issues#ki-17)). `assertSuccess` / `assert_success` throws unless `success` is `true`. `unseal` decrypts `result` with your cipher key and returns the decrypted **text**; it throws when the hash doesn't match. The PHP tab is self-contained, because there is no shared PHP client: it uses `pecws_decrypt_payload` from this site's [`payload_crypto.php`](/examples/encryption/payload_crypto.php), which also returns the decrypted text. The examples ask about this site's example claim, `260917990000101`.

::: code-group

```bash [curl]
# Needs jq (https://jqlang.github.io/jq/) to read the token from the JSON response.
TOKEN=$(curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID" | jq -r '.result')

# -X GET keeps the verb; --data sends the body. Do NOT add -G.
curl -sS -X GET "$PECWS_BASE_URL/getClaimStatus" \
  -H "token: $TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"serieslhionos": ["260917990000101"]}'
```

```js [Node.js 18+]
import { pecwsGetWithBody, unseal, assertSuccess } from './pecws-client.mjs';

// getClaimStatus is documented as GET *with* a JSON body (KI-17).
const env = assertSuccess(
  await pecwsGetWithBody('getClaimStatus', { serieslhionos: ['260917990000101'] }),
);
const decrypted = JSON.parse(unseal(env.result)); // { CLAIMS: [...] }
```

```python [Python 3.9+]
import json

from pecws_client import pecws_get_with_body, unseal, assert_success

# getClaimStatus is documented as GET *with* a JSON body (KI-17).
env = assert_success(pecws_get_with_body("getClaimStatus", {"serieslhionos": ["260917990000101"]}))
decrypted = json.loads(unseal(env["result"]))  # {"CLAIMS": [...]}
```

```php [PHP 7.4+]
<?php
// Self-contained: there is no shared PHP client. Needs the curl and openssl extensions.
// Save /examples/encryption/payload_crypto.php next to this file.
require __DIR__ . '/payload_crypto.php';

// Sends one request and returns the response envelope. Throws unless success is true.
// With $getBody, it sends a GET request that carries a body (KI-17).
function pecws_call(string $url, array $headers, ?string $getBody = null): array
{
    $options = [
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 30,
    ];
    if ($getBody !== null) {
        $options[CURLOPT_CUSTOMREQUEST] = 'GET'; // keep the verb GET...
        $options[CURLOPT_POSTFIELDS] = $getBody; // ...but send a body
    }
    $ch = curl_init($url);
    curl_setopt_array($ch, $options);
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

// 2. The call: GET with a JSON body.
$envelope = pecws_call(
    "$base/getClaimStatus",
    ["token: $token", 'Content-Type: application/json'],
    json_encode(['serieslhionos' => ['260917990000101']])
);

// 3. Decrypt. pecws_decrypt_payload() returns the text and throws if the hash doesn't match.
$decrypted = json_decode(pecws_decrypt_payload($envelope['result'], getenv('PECWS_CIPHER_KEY')), true);
// $decrypted['CLAIMS'] holds one entry per claim.
```

:::

### Turn the result into one row per claim

This is a recommendation, not PhilHealth code. It flattens the nested result, finds the latest stage, and looks for a voucher number wherever it might appear.

::: code-group

```js [Node.js 18+]
const toArray = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const sortable = (d) => { const [mm, dd, yyyy] = d.split('-'); return yyyy + mm + dd; };

// Depth-first search for a key anywhere inside an object.
function findKey(obj, key) {
  if (obj == null || typeof obj !== 'object') return undefined;
  if (key in obj) return obj[key];
  for (const v of Object.values(obj)) {
    const hit = findKey(v, key);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

// Turn the decrypted getClaimStatus result into one flat row per claim.
export function summarizeStatuses(decrypted) {
  return toArray(decrypted.CLAIMS).map(({ STATUS }) => {
    const claim = STATUS.CLAIM;
    const trail = toArray(claim.TRAIL?.PROCESS)
      .slice() // stable sort: same-day entries keep PhilHealth's order
      .sort((a, b) => sortable(b.pProcessDate).localeCompare(sortable(a.pProcessDate)));
    return {
      seriesLhio: claim.pClaimSeriesLhio,
      status: claim.pStatus,              // store as-is; values are not enumerated
      latestStage: trail[0]?.pProcessStage ?? null,
      asOf: `${STATUS.pAsOf} ${STATUS.pAsOfTime}`,
      voucherNo: findKey(STATUS, 'pVoucherNo') ?? null, // not in the sample (KI-23)
    };
  });
}

// With PhilHealth's sample, each row is:
// { seriesLhio: '120723190000119', status: 'IN PROCESS', latestStage: 'VALIDATION',
//   asOf: '07-25-2012 04:46:23PM', voucherNo: null }
```

```python [Python 3.9+]
def to_list(x):
    return [] if x is None else x if isinstance(x, list) else [x]


def sortable(d: str) -> str:
    mm, dd, yyyy = d.split("-")
    return yyyy + mm + dd


def find_key(obj, key):
    """Depth-first search for a key anywhere inside nested dicts/lists."""
    if isinstance(obj, dict):
        if key in obj:
            return obj[key]
        children = obj.values()
    elif isinstance(obj, list):
        children = obj
    else:
        return None
    for v in children:
        hit = find_key(v, key)
        if hit is not None:
            return hit
    return None


def summarize_statuses(decrypted: dict) -> list[dict]:
    rows = []
    for item in to_list(decrypted.get("CLAIMS")):
        status = item["STATUS"]
        claim = status["CLAIM"]
        trail = to_list((claim.get("TRAIL") or {}).get("PROCESS"))
        # sorted() is stable: same-day entries keep PhilHealth's order
        trail = sorted(trail, key=lambda p: sortable(p["pProcessDate"]), reverse=True)
        rows.append({
            "series_lhio": claim["pClaimSeriesLhio"],
            "status": claim["pStatus"],          # store as-is; values are not enumerated
            "latest_stage": trail[0]["pProcessStage"] if trail else None,
            "as_of": f'{status["pAsOf"]} {status["pAsOfTime"]}',
            "voucher_no": find_key(status, "pVoucherNo"),  # not in the sample (KI-23)
        })
    return rows
```

:::

We ran the request snippets (curl, Node.js 24, Python 3.9, PHP 7.4 and 8.3) against a local mock server, not PECWS, and the helpers against PhilHealth's decrypted sample.

## Notes and gotchas

- **GET with a body** ([KI-17](/known-issues#ki-17)). See [Sending a body with GET](#sending-a-body-with-get).
- **Voucher number location unknown** ([KI-23](/known-issues#ki-23)). See the warning above.
- **No field dictionary or status list** ([KI-42](/known-issues#ki-42)). Everything on this page about the output comes from one sample.
- **`docMimeType` says `text/xml`, the content is JSON** ([KI-25](/known-issues#ki-25)).
- **Parse text, not objects.** `unseal()` returns the decrypted text. If you call the example modules' `decryptPayload` / `decrypt_payload` yourself, they return an object: parse its `.text`.
- **Poll politely.** The DevKit sets no polling interval or rate limit. Recommendation (not from PhilHealth): send many series numbers per call rather than one call per claim, poll open claims on a schedule (for example once or twice a day), and stop polling claims that have reached a final status.
- **Match by `pClaimSeriesLhio`, not by position**, because the DevKit doesn't promise that the results come back in request order.

::: warning Output description copied from other methods (KI-47)
The Guide's `result` row says it contains "the Receipt Ticket Number and other data about the processing of the submitted e-claim data" (the uploadeClaims wording). The `doc` row says "records of the matching benefit packages. Sample XML text and the DTD of the XML text is shown below" (the searchCaseRates wording) ([Guide p. 46–47](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=46)). Neither applies here: the decrypted sample is the `CLAIMS` JSON above, with no receipt ticket number and no DTD. Rely on the sample structure, not on those two sentences. See [KI-47](/known-issues#ki-47).
:::

::: warning The sample repeats one series number (KI-64)
Both entries in the decrypted sample carry the same `pClaimSeriesLhio` (`120723190000119`) but different PINs, in answer to a request for `"1"` and `"2"`. You would expect one entry per requested claim, but the DevKit doesn't say so. Don't use the sample to test matching logic, and make your code tolerate repeated entries ([KI-64](/known-issues#ki-64)).
:::

### Common mistakes

| Mistake | What happens | Do this instead |
|---|---|---|
| Using `fetch()` or a browser `XMLHttpRequest` | `fetch()` throws; browsers drop GET bodies | Use a client that sends GET bodies (see the table above) |
| Using `curl -G` | The JSON goes into the URL; the body is empty | `curl -X GET --data '…'` |
| Sending your own `pClaimNumber` values | They are your numbers, not PhilHealth's | Send `pClaimSeriesLhio` from [getUploadedClaimsMap](/api/get-uploaded-claims-map) |
| Sending a bare array `["…"]` | The body must be an object | `{"serieslhionos": ["…"]}` |
| Reading `pAsOf` from inside `CLAIM` | It's `undefined`/`None` | Read `STATUS.pAsOf` and `STATUS.pAsOfTime` |
| Hard-coding a status enum | Breaks on the first unexpected value | Store raw strings; map them in configuration |

## Related pages

- [getUploadedClaimsMap](/api/get-uploaded-claims-map) (get the series numbers)
- [getVoucherDetails](/api/get-voucher-details) (payment details)
- [addRequiredDocument](/api/add-required-document) (for claims returned to the hospital)
- [The claims lifecycle](/getting-started/claims-lifecycle)
- [API overview and conventions](/api/)
- [API payload encryption (cipher key)](/guides/encryption/api-payloads)
- [API overview → Shared client setup](/api/#shared-client-setup)
- Known issues: [KI-17](/known-issues#ki-17), [KI-23](/known-issues#ki-23), [KI-42](/known-issues#ki-42), [KI-47](/known-issues#ki-47), [KI-64](/known-issues#ki-64)
