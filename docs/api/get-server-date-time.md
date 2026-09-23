---
title: getServerDateTime
description: Get the current date and time of the PECWS server, which also tells you whether the API is up.
---

# getServerDateTime

Get the current date and time of the PhilHealth eClaims Web Service (PECWS) server. You can use it to check whether the API is up.

<Badge type="tip" text="Current" /> <Badge type="info" text="Typo" /> <Badge type="warning" text="Conflicting sources" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getServerDateTime` (the host is not in the DevKit: [KI-30](/known-issues#ki-30)) |
| **Auth header** | `token` (from [`getToken`](/api/get-token)) |
| **Request body** | None |
| **Response `result`** | **Not encrypted.** A single JSON **object** with `server`, `dateTime` (`datetime` in the sample) and `remarks` |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 66–67: Get Server Date Time Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66)
- [Implementation Guide, p. 64–65: Get DB Server Date Time Method (for comparison)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)
- [Implementation Guide, p. 80: Annex C time format `HH:MM:SSAM/PM`](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)
- [Software Solution Validation Test Form (rev. 20250217), p. 4: Offline criteria](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)
:::

## When to use it

In the Guide's words, this method "retrieves the current server date and time, allowing the caller to monitor the system's operational status and determine whether the API or server is active or experiencing downtime" ([Guide p. 66](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66)).

It is a utility, not a step in the claims lifecycle. Recommendation (not from PhilHealth), typical uses:

- **Status indicator.** Before a user starts a batch upload, call this to show "PhilHealth service online" or "offline". If it fails, keep the claims queued locally and try again later. The certification form, the Software Solution Validation Test Form (SSVTF), asks whether your system supports offline encoding and "can the system submit offline data to PhilHealth eClaims WebService once online?" ([SSVTF p. 4](/originals/certification/Software%20Solution%20Validation%20Test%20Form%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=4)). See [Software certification](/guides/certification).
- **Clock comparison.** Compare the server time with your own clock and log large differences. This helps when you investigate date-related validation errors.

Compare it with [`getDBServerDateTime`](/api/get-db-server-date-time), which reports the time of PhilHealth's **database** servers and returns an array.

## Request

### Headers

| Header | Value (from the Guide) |
|---|---|
| `token` | "PECWS authentication token", the `result` of a fresh [`getToken`](/api/get-token) call |

### Body

None. The Guide lists no body and no parameters.

## Response

The standard envelope. `result` is a plain JSON object, with nothing to decrypt.

| Key | Type | Meaning (from the Guide) |
|---|---|---|
| `success` | boolean | "A value of 'true' indicates a successful operation" |
| `message` | string | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | object | "The JSON Object containing the following key-value pairs" (below) |

### `result` object

| Key (table) | Key (sample) | Type | Description in the Guide | Sample value |
|---|---|---|---|---|
| `server` | `server` | string | "Database Server" (see the warning below) | `"DB Server 1"` |
| `dateTime` | `datetime` | string | "Database current date and time" | `"01-01-2024 01:20:20 PM"` |
| `remarks` | `remarks` | string | No description | `""` |

The Guide doesn't state a format for `dateTime`. The sample looks like `MM-DD-YYYY hh:mm:ss AM/PM`, with a space before `PM`. Its date, `01-01-2024`, can't show whether the month or the day comes first. We assume month first, like every date format the Guide does state (for example Annex C, [p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). See [KI-49](/known-issues#ki-49).

## Example

### Request

```http
GET /PHIC/Claims3.0/getServerDateTime HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
```

### Response

This is the Guide's sample from p. 66–67. **We added the missing comma** after the `result` object. The original is invalid JSON ([KI-19](/known-issues#ki-19)).

```json
{
    "result": {
        "server": "DB Server 1",
        "datetime": "01-01-2024 01:20:20 PM",
        "remarks": ""
    },
    "success": true,
    "message": ""
}
```

### Code

These are unofficial examples, not from PhilHealth. They use the shared client from [API overview → Shared client setup](/api/#shared-client-setup), read the key case-insensitively (`dateTime` or `datetime`, [KI-19](/known-issues#ki-19)), and accept both AM/PM spellings ([KI-49](/known-issues#ki-49)).

::: code-group

```js [Node.js]
import { pecwsGet, assertSuccess } from './pecws-client.mjs';

// Reads a key whatever its case: the table says dateTime, the sample says datetime (KI-19).
const field = (obj, name) => obj[Object.keys(obj).find((k) => k.toLowerCase() === name.toLowerCase())];

// "MM-DD-YYYY hh:mm:ss AM/PM"; the space before AM/PM is optional (KI-49)
export function parsePecwsDateTime(s) {
  const m = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)$/i.exec(s.trim());
  if (!m) throw new Error(`Unexpected PECWS date-time: ${s}`);
  const [, mm, dd, yyyy, hh, mi, ss, ampm] = m;
  let hour = Number(hh) % 12;
  if (ampm.toUpperCase() === 'PM') hour += 12;
  // The DevKit specifies no time zone, so return the parts, not a Date.
  return { year: +yyyy, month: +mm, day: +dd, hour, minute: +mi, second: +ss };
}

export async function getServerDateTime() {
  const { result } = assertSuccess(await pecwsGet('getServerDateTime')); // plain object, not encrypted
  const raw = field(result, 'dateTime');
  return { server: result.server, raw, parts: parsePecwsDateTime(raw), remarks: result.remarks };
}
```

```python [Python]
import re
from datetime import datetime

from pecws_client import pecws_get, assert_success

_PECWS_DT = re.compile(
    r"^(\d{2})-(\d{2})-(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*([AP]M)$", re.I
)


def field(obj: dict, name: str):
    """Reads a key whatever its case: dateTime (table) or datetime (sample), KI-19."""
    return next((v for k, v in obj.items() if k.lower() == name.lower()), None)


def parse_pecws_datetime(s: str) -> datetime:
    """Parses 'MM-DD-YYYY hh:mm:ss AM/PM' (space before AM/PM optional, KI-49).
    Returns a naive datetime: the DevKit specifies no time zone."""
    m = _PECWS_DT.match(s.strip())
    if not m:
        raise ValueError(f"Unexpected PECWS date-time: {s!r}")
    mm, dd, yyyy, hh, mi, ss, ampm = m.groups()
    hour = int(hh) % 12 + (12 if ampm.upper() == "PM" else 0)
    return datetime(int(yyyy), int(mm), int(dd), hour, int(mi), int(ss))


def get_server_date_time() -> dict:
    result = assert_success(pecws_get("getServerDateTime"))["result"]  # plain object, not encrypted
    raw = field(result, "dateTime")
    return {"server": result.get("server"), "raw": raw,
            "parsed": parse_pecws_datetime(raw), "remarks": result.get("remarks")}
```

:::

## Notes and gotchas

::: warning Key name: `dateTime` or `datetime`?
The Output table names the key `dateTime`. The sample uses `datetime` ([Guide p. 66](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66)). JSON keys are case-sensitive, so `result.dateTime` would be `undefined` if the server really sends `datetime`. Read the key case-insensitively, as the code above does. See [KI-19](/known-issues#ki-19).
:::

::: warning The field descriptions look copied from getDBServerDateTime
This method is about the **API server**. Its Output table still describes `server` as "Database Server" and `dateTime` as "Database current date and time", and the sample's `server` value is `"DB Server 1"`. Those are exactly the descriptions used for [`getDBServerDateTime`](/api/get-db-server-date-time) ([Guide p. 64](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)). The DevKit does not say what `server` contains for this method. Treat it as a label to log, not as something to parse. See [KI-47](/known-issues#ki-47).
:::

- **Object here, array there.** `getServerDateTime` returns one object. `getDBServerDateTime` returns an array of objects, as its Output table says. Don't reuse the same parsing code for both without checking.
- **Two AM/PM spellings.** This sample writes `01:20:20 PM`, with a space. Annex C prescribes `HH:MM:SSAM/PM`, with no space, for times you send in eClaims XML ([Guide p. 80](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=80)). When reading, accept both. When writing XML, follow Annex C ([KI-49](/known-issues#ki-49)).
- **Month first (assumed).** The code above reads `01-02-2024` as January 2, matching the Guide's other date formats. The sample can't confirm this, so check a real response on a day of the month above 12 ([KI-49](/known-issues#ki-49)).
- **No time zone.** The DevKit does not specify the time zone of the returned value. Confirm with PhilHealth before you compare it with UTC timestamps ([KI-42](/known-issues#ki-42)).
- **`remarks` is undocumented.** It is empty in the sample. Log it if it is ever non-empty.
- **You still need a token.** A failing `getToken` can mean the service is down, or that your credentials are wrong. The DevKit doesn't document `getToken`'s error responses ([KI-42](/known-issues#ki-42)). Log the HTTP status and `message` to help tell which.

## Related pages

- [API overview and conventions](/api/): date and time formats
- [getDBServerDateTime](/api/get-db-server-date-time)
- [getServerVersion](/api/get-server-version)
- [getToken](/api/get-token)
- Known issues: [KI-19 (key casing, invalid sample)](/known-issues#ki-19), [KI-47 (copied descriptions)](/known-issues#ki-47), [KI-49 (date and time formats)](/known-issues#ki-49)
