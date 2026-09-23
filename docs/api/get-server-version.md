---
title: getServerVersion
description: Get the version string of the PECWS server, such as "PECWS 3.0". This is the simplest authenticated call.
---

# getServerVersion

Get the current version of the PhilHealth eClaims Web Service (PECWS) server.

<Badge type="tip" text="Current" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getServerVersion` (the host is not in the DevKit: [KI-30](/known-issues#ki-30)) |
| **Auth header** | `token` (from [`getToken`](/api/get-token)) |
| **Request body** | None |
| **Response `result`** | **Not encrypted.** A plain string, the "PECWS Version". The sample is `"PECWS 3.0"`. |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 68: Get Server Version Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=68)
- [Implementation Guide, p. 3: Revision history (method added in 20240423)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
:::

## When to use it

The Guide says only that this method "retrieves the current server version" ([Guide p. 68](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=68)). It is not a step in the claims lifecycle. It is a utility.

Recommendation (not from PhilHealth), some good uses:

- **First integration test.** This is the simplest call that needs a token. It has no body and no encryption. If `getToken` followed by `getServerVersion` works, your host, credentials and `token` header are right. Then you can move on to encrypted methods.
- **Diagnostics.** Show the version on an "About" or "Connection status" screen, and record it in your logs with each upload batch. This helps when you report a problem to PhilHealth.
- **Change detection.** Log a warning when the value changes, so your team knows to check for a new DevKit.

## Request

### Headers

| Header | Value (from the Guide) |
|---|---|
| `token` | "PECWS authentication token", the `result` of a fresh [`getToken`](/api/get-token) call |

### Body

None. The Guide lists no body and no parameters.

## Response

The standard envelope. `result` is a plain string, with nothing to decrypt.

| Key | Type | Meaning (from the Guide) |
|---|---|---|
| `success` | boolean | "A value of 'true' indicates a successful operation" |
| `message` | string | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | string | "PECWS Version" |

## Example

### Request

```http
GET /PHIC/Claims3.0/getServerVersion HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
```

### Response (Guide sample, p. 68)

```json
{
    "result": "PECWS 3.0",
    "success": true,
    "message": ""
}
```

### Code

These are unofficial examples, not from PhilHealth. The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup). `pecwsGet` / `pecws_get` gets a fresh token right before the call.

::: code-group

```bash [curl]
# Needs jq (https://jqlang.github.io/jq/) to read the token from the JSON response.
TOKEN=$(curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID" | jq -r '.result')

curl -sS "$PECWS_BASE_URL/getServerVersion" -H "token: $TOKEN"
```

```js [Node.js]
import { pecwsGet, assertSuccess } from './pecws-client.mjs';

const { result: version } = assertSuccess(await pecwsGet('getServerVersion'));
console.log(version); // "PECWS 3.0" in the Guide's sample; not encrypted
```

```python [Python]
from pecws_client import pecws_get, assert_success

version = assert_success(pecws_get("getServerVersion"))["result"]
print(version)  # "PECWS 3.0" in the Guide's sample; not encrypted
```

:::

The client's smoke test does exactly this: `node pecws-client.mjs smoketest` or `python pecws_client.py smoketest`.

## Notes and gotchas

- **The version string format is not specified.** The only example is `"PECWS 3.0"`. The Guide doesn't say whether minor versions or build numbers are ever added. Recommendation (not from PhilHealth): log and display the string as-is. Don't make your software refuse to work because the string isn't exactly `"PECWS 3.0"`.
- **It doesn't tell you the DevKit revision.** The server version and the DevKit document revision (for example `20250217`) are different things. The Guide doesn't link them.
- **You still need a token.** Even this simple call requires the `token` header, so it can't be used to check connectivity before authentication. If `getToken` itself fails, that already tells you something is wrong with the host, the network or your credentials.
- **The `result` is not encrypted.** Don't try to decrypt it. Only methods whose Output table describes an encrypted `result` need decryption. See the [method table](/api/#all-19-methods-at-a-glance).

## Related pages

- [API overview and conventions](/api/)
- [getToken](/api/get-token)
- [getServerDateTime](/api/get-server-date-time): check that the API server is up
- [getDBServerDateTime](/api/get-db-server-date-time): check that PhilHealth's databases are reachable
