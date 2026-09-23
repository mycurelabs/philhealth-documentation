---
title: getDBServerDateTime
description: Get the current date and time of PhilHealth's database servers, which tells you whether the databases behind PECWS are reachable.
---

# getDBServerDateTime

Get the current date and time of PhilHealth's database servers. You can use it to check whether the databases behind the PhilHealth eClaims Web Service (PECWS) are reachable.

<Badge type="tip" text="Current" /> <Badge type="info" text="Typo" /> <Badge type="warning" text="Conflicting sources" />

| | |
|---|---|
| **Method** | `GET` |
| **Endpoint** | `https://{pecws.domain}/PHIC/Claims3.0/getDBServerDateTime` (the host is not in the DevKit: [KI-30](/known-issues#ki-30)) |
| **Auth header** | `token` (from [`getToken`](/api/get-token)) |
| **Request body** | None |
| **Response `result`** | **Not encrypted.** A JSON **array** of objects, each with `server`, `dateTime` (`datetime` in the sample) and `remarks` |

::: info Sources
- [Implementation Guide (rev. 20250217), p. 64–65: Get DB Server Date Time Method](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)
- [Implementation Guide, p. 66–67: Get Server Date Time Method (for comparison)](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=66)
:::

## When to use it

In the Guide's words, this method "retrieves the current database server date and time, allowing the caller to verify the availability of one of PhilHealth's databases and determine if it is down or inaccessible" ([Guide p. 64](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)).

It is a utility, not a step in the claims lifecycle. The difference from [`getServerDateTime`](/api/get-server-date-time) is what it checks:

| Method | Checks | `result` |
|---|---|---|
| [`getServerDateTime`](/api/get-server-date-time) | The PECWS API server | One object |
| `getDBServerDateTime` | PhilHealth's database server(s) behind the API | An array. The sample has one entry per database server (`DB Server 1`, `DB Server 2`). |

The API server can be up while a database behind it is not. Recommendation (not from PhilHealth): when claim calls fail unexpectedly, call both methods and include their output in your support log.

## Request

### Headers

| Header | Value (from the Guide) |
|---|---|
| `token` | "PECWS authentication token", the `result` of a fresh [`getToken`](/api/get-token) call |

### Body

None. The Guide lists no body and no parameters.

## Response

The standard envelope. `result` is a plain JSON array, with nothing to decrypt.

| Key | Type | Meaning (from the Guide) |
|---|---|---|
| `success` | boolean | "A value of 'true' indicates a successful operation" |
| `message` | string | "If an error was encountered during the execution of this method, this will contain the error message" |
| `result` | array | "The JSON Array containing the following key-value pairs" (below) |

### Each element of `result`

| Key (table) | Key (sample) | Type | Description in the Guide | Sample values |
|---|---|---|---|---|
| `server` | `server` | string | "Database Server" | `"DB Server 1"`, `"DB Server 2"` |
| `dateTime` | `datetime` | string | "Database current date and time" | `"01-01-2024 01:20:20 PM"` |
| `remarks` | `remarks` | string | No description | `""` |

The Guide doesn't state a format for `dateTime`. The sample looks like `MM-DD-YYYY hh:mm:ss AM/PM`, with a space before `PM`. Its date, `01-01-2024`, can't show whether the month or the day comes first. We assume month first, like every date format the Guide does state. Check a real response on a day of the month above 12. See [KI-49](/known-issues#ki-49).

## Example

### Request

```http
GET /PHIC/Claims3.0/getDBServerDateTime HTTP/1.1
Host: {pecws.domain}
token: <token from getToken>
```

### Response (Guide sample, p. 65)

This sample is valid JSON as printed.

```json
{
    "result": [{
                    "server": "DB Server 1",
                    "datetime": "01-01-2024 01:20:20 PM",
                    "remarks": ""
               },
               {
                    "server": "DB Server 2",
                    "datetime": "01-01-2024 01:20:20 PM",
                    "remarks": ""
               }],
    "success": true,
    "message": ""
}
```

### Code

These are unofficial examples, not from PhilHealth. They use the shared client from [API overview → Shared client setup](/api/#shared-client-setup), read the key case-insensitively (`dateTime` or `datetime`, [KI-19](/known-issues#ki-19)), and accept both AM/PM spellings ([KI-49](/known-issues#ki-49)). The date-time parser is the same as on the [getServerDateTime](/api/get-server-date-time#code) page, repeated here so that each snippet runs on its own.

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

export async function getDBServerDateTime() {
  const { result } = assertSuccess(await pecwsGet('getDBServerDateTime')); // plain JSON, not encrypted
  // result is an ARRAY here (getServerDateTime returns a single object)
  const servers = Array.isArray(result) ? result : [result];
  return servers.map((s) => {
    const raw = field(s, 'dateTime');
    return { server: s.server, raw, parts: raw ? parsePecwsDateTime(raw) : null, remarks: s.remarks ?? '' };
  });
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


def get_db_server_date_time() -> list:
    result = assert_success(pecws_get("getDBServerDateTime"))["result"]  # plain JSON, not encrypted
    servers = result if isinstance(result, list) else [result]  # an array, per the Guide
    out = []
    for s in servers:
        raw = field(s, "dateTime")
        out.append({"server": s.get("server"), "raw": raw,
                    "parsed": parse_pecws_datetime(raw) if raw else None,
                    "remarks": s.get("remarks", "")})
    return out
```

:::

## Notes and gotchas

::: warning Key name: `dateTime` or `datetime`?
The Output table names the key `dateTime`. The sample uses `datetime` ([Guide p. 64–65](/originals/implementation-guide/PhilHealth%20Electronic%20Claims%20Implementation%20Guide%20for%20PECWS%203.0%20%28Revised%2020250217%29.pdf#page=64)). JSON keys are case-sensitive, so read the key case-insensitively, as the code above does. See [KI-19](/known-issues#ki-19).
:::

- **Array, not object.** This is the only server utility whose `result` is an array, as its Output table says ("The JSON Array"). If you copy the parsing code from `getServerDateTime`, `result.datetime` will be `undefined` here.
- **How a down database is reported is not specified.** The Guide says the method lets you "determine if it is down or inaccessible". It doesn't say how that looks. A server might be missing from the array, have an empty `datetime`, have a non-empty `remarks`, or the call might fail with `success` not `true`. The DevKit does not specify this ([KI-42](/known-issues#ki-42)). Confirm with PhilHealth. Recommendation (not from PhilHealth): log the whole array, and show non-empty `remarks` to your support staff.
- **The server names are labels.** `"DB Server 1"` and `"DB Server 2"` are sample values. Don't hard-code the number or names of database servers.
- **Two AM/PM spellings.** The sample writes `01:20:20 PM`, with a space. Annex C uses `HH:MM:SSAM/PM`, with no space. Accept both when reading. See [Date and time formats](/api/#date-and-time-formats) and [KI-49](/known-issues#ki-49).
- **No time zone.** The DevKit does not specify the time zone. Confirm with PhilHealth ([KI-42](/known-issues#ki-42)).
- **You still need a token.** If `getToken` fails, you can't call this method.

## Related pages

- [API overview and conventions](/api/)
- [getServerDateTime](/api/get-server-date-time)
- [getServerVersion](/api/get-server-version)
- [getToken](/api/get-token)
- Known issues: [KI-19 (key casing)](/known-issues#ki-19), [KI-49 (date and time formats)](/known-issues#ki-49)
