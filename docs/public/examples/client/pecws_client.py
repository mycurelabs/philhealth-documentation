"""pecws_client.py

UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
Test it against PhilHealth's own test environment before you use it.

A small client for the PhilHealth eClaims Web Service (PECWS 3.0). Every code
example on the "PhilHealth eClaims Dev Docs" site uses it, so the snippets on
different pages fit together. Setup: /api/#shared-client-setup

Requirements: Python 3.9+ and two packages:
    pip install requests cryptography
It needs this site's payload_crypto.py (/examples/encryption/payload_crypto.py).
Keep the two files in the site's layout (client/ and encryption/ side by side),
or put both files in one folder.

Configuration comes from four environment variables:
    PECWS_BASE_URL         https://<host from PhilHealth>/PHIC/Claims3.0  (KI-30)
    PHIC_FACILITY_PAN      the facility's accreditation number (getToken accreditationNo)
    PHIC_SOFTWARE_CERT_ID  the software certificate ID (getToken softwareCertificateId)
    PECWS_CIPHER_KEY       the facility's cipher key (never sent over the network)

Usage:
    from pecws_client import pecws_post, seal, unseal, assert_success
    env = assert_success(pecws_post("getDoctorPAN", seal(json.dumps(query), "application/json")))
    pan = json.loads(unseal(env["result"]))["pan"]

Quick connection test (getToken, then getServerVersion):
    python pecws_client.py smoketest
"""

from __future__ import annotations

import json
import os
import re
import sys
from typing import Any, Optional, Union
from urllib.parse import urlsplit

import requests

# Find payload_crypto.py in this site's layout (../encryption) or in this folder.
_HERE = os.path.dirname(os.path.abspath(__file__))
for _path in (os.path.join(_HERE, "..", "encryption"), _HERE):
    if os.path.isfile(os.path.join(_path, "payload_crypto.py")) and _path not in sys.path:
        sys.path.insert(0, _path)
        break

from payload_crypto import decrypt_payload, encrypt_payload  # noqa: E402

# Uploads can be large. The DevKit gives no timeout; this value is our choice.
TIMEOUT_SECONDS = 120


class PecwsError(RuntimeError):
    """A PECWS call failed. `envelope` and `http_status` hold the details."""

    def __init__(self, message: str, envelope: Optional[dict] = None,
                 http_status: Optional[int] = None):
        super().__init__(message)
        self.envelope = envelope
        self.http_status = http_status


class Envelope(dict):
    """The response JSON (success, message, result). A plain dict, plus the
    method name and HTTP status for error messages."""

    def __init__(self, data: dict, method: str, http_status: int):
        super().__init__(data)
        self.method = method
        self.http_status = http_status


def _require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise PecwsError(f"Set the {name} environment variable (see /api/#shared-client-setup)")
    return value


def _method_url(method: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9]+", method):
        raise ValueError('Use the method name exactly as in the endpoint, '
                         f'for example "uploadeClaims" (got {method!r})')
    base = _require_env("PECWS_BASE_URL").rstrip("/")
    parts = urlsplit(base)
    is_local = parts.hostname in ("localhost", "127.0.0.1", "::1")
    if parts.scheme != "https" and not (parts.scheme == "http" and is_local):
        # Plain http is allowed only for a local mock server.
        raise PecwsError("PECWS_BASE_URL must start with https://")
    return f"{base}/{method}"


def _send(http_method: str, method: str, headers: dict,
          query: Optional[dict] = None, body: Any = None) -> Envelope:
    """One HTTP request. requests sends header names exactly as written here,
    and it can send a body with GET (getClaimStatus, KI-17)."""
    url = _method_url(method)
    all_headers = dict(headers)
    data = None
    if body is not None:
        # A dict or list is sent as JSON. A string must already hold JSON text.
        text = body if isinstance(body, str) else json.dumps(body, ensure_ascii=False)
        data = text.encode("utf-8")
        all_headers["Content-Type"] = "application/json"  # not specified by the DevKit (KI-42)
    params = {k: str(v) for k, v in (query or {}).items() if v is not None}  # URL-encoded

    res = requests.request(http_method, url, headers=all_headers, params=params or None,
                           data=data, timeout=TIMEOUT_SECONDS)
    try:
        payload = res.json()
    except ValueError:
        payload = None
    if not isinstance(payload, dict):
        raise PecwsError(f"{method}: HTTP {res.status_code}, the response is not a JSON object: "
                         f"{res.text[:200]}", http_status=res.status_code)
    return Envelope(payload, method, res.status_code)


def assert_success(envelope: dict) -> dict:
    """Returns the envelope if `success` is exactly True. Otherwise raises
    PecwsError with the server's `message`. Failure responses are undocumented
    (KI-42), so the error also carries the HTTP status and the whole envelope."""
    if isinstance(envelope, dict) and envelope.get("success") is True:
        return envelope
    where = getattr(envelope, "method", "PECWS call")
    http_status = getattr(envelope, "http_status", None)
    status = f" (HTTP {http_status})" if http_status else ""
    message = (envelope.get("message") if isinstance(envelope, dict) else None) or "success is not true"
    raise PecwsError(f"{where} failed{status}: {message}", envelope, http_status)


def get_token() -> str:
    """Calls getToken and returns the plain token string."""
    envelope = _send("GET", "getToken", headers={
        "accreditationNo": _require_env("PHIC_FACILITY_PAN"),
        "softwareCertificateId": _require_env("PHIC_SOFTWARE_CERT_ID"),  # plain value (KI-44)
    })
    result = assert_success(envelope).get("result")
    if not isinstance(result, str) or not result:
        raise PecwsError("getToken: result is not a token string", envelope, envelope.http_status)
    return result


# Every call gets a fresh token right before it is sent: the token may last
# only 20 seconds (KI-26). There is no automatic retry, because retrying an
# upload could send the same claim twice (KI-62).

def pecws_get(method: str, query: Optional[dict] = None) -> dict:
    """GET with optional query parameters. Returns the response envelope."""
    return _send("GET", method, headers={"token": get_token()}, query=query)


def pecws_get_with_body(method: str, body: Any) -> dict:
    """GET with a JSON body (getClaimStatus, KI-17). Returns the response envelope."""
    if body is None:
        raise ValueError(f"{method}: a body is required")
    return _send("GET", method, headers={"token": get_token()}, body=body)


def pecws_post(method: str, body: Any) -> dict:
    """POST with a JSON body (a dict, or a string of JSON). Returns the response envelope."""
    if body is None:
        raise ValueError(f"{method}: a body is required")
    return _send("POST", method, headers={"token": get_token()}, body=body)


def seal(plaintext: Union[str, bytes], doc_mime_type: str) -> dict:
    """Encrypts XML or JSON text with the cipher key (Annex A) and returns the
    envelope dict. doc_mime_type: "text/xml" for XML; "application/json" for
    JSON, or "text/xml" if the test server rejects it (KI-25)."""
    return encrypt_payload(plaintext, _require_env("PECWS_CIPHER_KEY"), doc_mime_type)


def unseal(envelope: Union[dict, str]) -> str:
    """Decrypts an envelope with the cipher key and returns the text.
    Raises ValueError if the hash doesn't match."""
    return decrypt_payload(envelope, _require_env("PECWS_CIPHER_KEY")).text


if __name__ == "__main__":
    if sys.argv[1:] == ["smoketest"]:
        try:
            version = assert_success(pecws_get("getServerVersion"))["result"]
        except (PecwsError, requests.RequestException) as err:
            sys.exit(str(err))
        print(f"getToken OK; getServerVersion: {version}")
    else:
        print("Usage: python pecws_client.py smoketest", file=sys.stderr)
        sys.exit(2)
