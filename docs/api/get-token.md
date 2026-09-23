---
title: getToken
description: Get the short-lived authentication token that every other PECWS 3.0 method requires in its token header.
---

# getToken

Get a short-lived authentication token for your health facility and certified software. Every other PhilHealth eClaims Web Service (PECWS) method needs this token.

<Badge type="tip" text="Current" /> <Badge type="warning" text="Gap" /> <Badge type="warning" text="Conflicting sources" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getToken` (the host is not in the DevKit: [KI-30](/known-issues#ki-30)) |
| **Auth header** | None. This is the call that gives you a token. Send the `accreditationNo` and `softwareCertificateId` headers instead. |
| **Request body** | None |
| **Response `result`** | **Not encrypted.** A plain string: the token. |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 8: Get Token Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)
- [Implementation Guide, p. 3–4: Revision history (`GenerateToken` in 20240215; certificate-ID header changes)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=3)
- [Implementation Guide, p. 75: Annex A (cipher key)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)
- [Data Dictionary of the e-Claims XML for Data Migration, p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5) (who issues the software certification ID)
:::

## When to use it

Call `getToken` **first**. The other 18 methods all require a header named `token` whose value is "PECWS authentication token" ([Guide p. 9–74](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=9)). That includes the simple server utilities such as [`getServerVersion`](/api/get-server-version). Because the token may last only 20 seconds, we recommend (not a PhilHealth rule) getting a fresh token right before each call. See [Notes and gotchas](/api/get-token#notes-and-gotchas).

In the [claims lifecycle](/getting-started/claims-lifecycle), `getToken` is step zero. You call it before checking eligibility ([`isClaimEligible`](/api/is-claim-eligible)), before validating and uploading a claim ([`uploadeClaims`](/api/upload-eclaims)), and before checking a claim's status ([`getClaimStatus`](/api/get-claim-status)).

The Guide describes it as generating "a token as authorization key to access API methods" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). The revision history first lists this method as "GenerateToken" (revision 20240215). The endpoint name is `getToken`.

## Request

### Headers

| Header | Value (from the Guide) | Notes |
|---|---|---|
| `accreditationNo` | "The PhilHealth Accreditation Number (PAN) of the Health Facility" | Your hospital's or clinic's accreditation number, not a doctor's PAN. The Guide doesn't give a format for this header. Your facility also has a PMCC number, which the eClaims and CF5 XML use as `pHospitalCode`. Don't mix the two up, and confirm with PhilHealth which one each method expects ([KI-48](/known-issues#ki-48)). |
| `softwareCertificateId` | "The software certification ID for PECWS 3.0 of the Health Facility" | The ID that PhilHealth issues to your certified system. The data migration dictionary calls it the "software certification ID issued by PhilHealth to the system" ([p. 5](/originals/data-migration/Data%20Dictionary%20of%20the%20e-Claims%20XML%20for%20Data%20Migration.pdf#page=5)). The DevKit doesn't describe the issuing process or the ID's format. Confirm with PhilHealth and see [Software certification](/guides/certification). |

The Guide doesn't mark either header as optional, so send both.

### Body

None. `getToken` is a `GET` with headers only.

::: tip Where the three credentials come from
Your software needs three facility-specific values:

| Value | Used for | Sent over the network? |
|---|---|---|
| Facility PAN | `accreditationNo` header of `getToken` | Yes, in `getToken` |
| Software certificate ID | `softwareCertificateId` header of `getToken`. It also goes, with a leading colon, in `eCLAIMS@pUserName` of the upload XML ([KI-03](/known-issues#ki-03)). The CF4 XML uses it too (`EPCB@pUsername`); whether the colon applies there is unclear ([KI-55](/known-issues#ki-55)). | Yes |
| Cipher key | Encrypting request bodies and decrypting results ([Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)) | **No.** It stays on your side. |

Recommendation (not from PhilHealth): store all three as secrets in configuration, never in source code, and use separate values for test and production.
:::

## Response

`getToken` returns the standard envelope. Its `result` is a **plain string**, not an encrypted envelope, so there is nothing to decrypt.

| Key | Type | Meaning (from the Guide) |
|---|---|---|
| `success` | boolean | "A value of 'true' that data has been retrieved successfully" |
| `message` | string | "If an error was encountered during the execution of this method, this will contain the error message". In the success sample it carries information instead: `"Token is valid for 20 seconds"`. |
| `result` | string | "The generated Token" |

The DevKit does not document the failure response for a wrong PAN or certificate ID (HTTP status, `success` value, or message text). Confirm with PhilHealth. See [KI-42](/known-issues#ki-42).

## Example

### Request

The Guide shows no request sample. The values below are this site's illustrative example facility (PAN `H12345678`, software certificate ID `SAMPLE-CERT-ID`), not real credentials.

```http
GET /PHIC/Claims3.0/getToken HTTP/1.1
Host: {pecws.domain}
accreditationNo: H12345678
softwareCertificateId: SAMPLE-CERT-ID
```

### Response (Guide sample, p. 8)

```json
{
  "message":"Token is valid for 20 seconds",
  "result":"eyJhbGciOiJIUzI1N eyJhbGciOiJIUzI1Ni   ",
  "success":true
}
```

The `result` in this sample is a placeholder. It contains spaces and is cut short ([KI-27](/known-issues#ki-27)). A real token won't look exactly like this.

### Using the token on the next call

Send the `result` string unchanged, in a header named `token`:

```http
GET /PHIC/Claims3.0/getServerVersion HTTP/1.1
Host: {pecws.domain}
token: <the result string from getToken>
```

### Code

These are unofficial examples, not from PhilHealth. The Node.js and Python snippets use the shared client from [API overview → Shared client setup](/api/#shared-client-setup), which reads the host and credentials from the environment variables `PECWS_BASE_URL`, `PHIC_FACILITY_PAN` and `PHIC_SOFTWARE_CERT_ID`.

::: code-group

```bash [curl]
curl -sS "$PECWS_BASE_URL/getToken" \
  -H "accreditationNo: $PHIC_FACILITY_PAN" \
  -H "softwareCertificateId: $PHIC_SOFTWARE_CERT_ID"
```

```js [Node.js]
import { getToken } from './pecws-client.mjs';

const token = await getToken(); // plain string, not encrypted
```

```python [Python]
from pecws_client import get_token

token = get_token()  # plain string, not encrypted
```

:::

`getToken()` / `get_token()` sends the two headers, checks that `success` is exactly `true`, and returns `result`. Otherwise it throws an error with the server's `message` and the HTTP status.

You rarely call it yourself. The client's `pecwsGet`, `pecwsGetWithBody` and `pecwsPost` (`pecws_get`, `pecws_get_with_body`, `pecws_post` in Python) call it right before every request, so each call gets a fresh token ([KI-26](/known-issues#ki-26)). For a first test of your host and credentials, run `node pecws-client.mjs smoketest` or `python pecws_client.py smoketest`. It calls `getToken` and then [`getServerVersion`](/api/get-server-version).

## Notes and gotchas

::: warning The token may last only 20 seconds
The Guide never states the token lifetime. The only clue is the sample message `"Token is valid for 20 seconds"` ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). See [KI-26](/known-issues#ki-26).

Recommendation (not from PhilHealth):
- Build and encrypt your payload **first**, then call `getToken`, then send the request right away.
- Don't cache tokens across user actions or batch items.
- Read the `message` text in your logs. If PhilHealth changes the lifetime, it will probably show there.
- If a call fails in a way that looks like an expired token, get a new token and retry **once**. Don't retry in a loop. The DevKit doesn't say what an expired or invalid token returns ([KI-42](/known-issues#ki-42)), so log the HTTP status and `message` of the failed call.
:::

::: warning "Encrypted" accreditation number and certificate ID?
The method description says the token is generated "using the **encrypted** Accreditation Number and Sofware Certification ID of the health facility" ([Guide p. 8](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=8)). The header table on the same page describes plain values: the PAN and the certification ID. It says nothing about encrypting them, and Annex A only describes encrypting request bodies.

The DevKit does not specify whether or how these header values are encrypted. Confirm with PhilHealth. Until then, send the plain values as the header table says. See [KI-44](/known-issues#ki-44).
:::

- **The header name is `token`.** Don't use `Authorization: Bearer ...`. The Guide lists the header key as `token` on every other method page.
- **Treat the token as an opaque string.** The sample begins with `eyJhbGciOiJIUzI1N`, which is how a JSON Web Token (JWT) with the HS256 algorithm usually begins. That is our observation, not a PhilHealth statement. Don't decode the token or rely on anything inside it.
- **Spell the header names exactly.** Use `accreditationNo` and `softwareCertificateId`. Older Guide revisions added `softwareCertId` (20240418) and the misspelled `softwareCertifficateId` (20240910) as headers on `uploadeClaims`. Revision 20241111 removed `softwareCertifficateId` and moved the ID into the eClaims XML as `pUserName = ":" + certificate ID`. The current `uploadeClaims` header table lists only `token`, so `softwareCertId` is gone too ([Guide p. 19](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=19); [KI-03](/known-issues#ki-03)). Neither belongs on `getToken`.
- **No colon in the header.** The colon-plus-ID rule applies to the `pUserName` XML attribute only. The Guide doesn't say to add a colon to `softwareCertificateId`.
- **Don't send the cipher key.** No PECWS request includes it. It is used locally for encryption ([Guide p. 75](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=75)).
- **Don't log tokens or credentials.** Recommendation (not from PhilHealth): mask them in logs and error reports.
- **Header-name case.** HTTP header names are case-insensitive by standard, and some proxies and all HTTP/2 connections send them in lowercase (`accreditationno`). The DevKit doesn't say how the PECWS server treats case. The shared client sends the names exactly as the Guide writes them. If you get unexplained authentication failures, compare the exact headers your client sends with the Guide.

## Related pages

- [API overview and conventions](/api/): the full authentication flow and the envelopes
- [Shared client setup](/api/#shared-client-setup): the environment variables and the client every code example uses
- [getServerVersion](/api/get-server-version): the simplest call to test your token
- [Encrypting API payloads (cipher key)](/guides/encryption/api-payloads)
- [Software certification (SSVTF)](/guides/certification)
- Known issues: [KI-26 (token lifetime)](/known-issues#ki-26), [KI-44 ("encrypted" header values)](/known-issues#ki-44), [KI-03 (software certificate ID)](/known-issues#ki-03)
