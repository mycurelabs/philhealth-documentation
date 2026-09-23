"""payload_crypto.py

UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
Test it against PhilHealth's own test environment before you use it.

Encrypts and decrypts PECWS 3.0 API payloads with the health facility's
cipher key, following "Annex A - Guidelines for the Data Encryption Using the
Cipher Key of the Health Facility" (Implementation Guide rev. 20250217,
PDF pages 75-76).

Requirements: Python 3.9+ and the "cryptography" package
    pip install cryptography

Use it as a module:
    from payload_crypto import encrypt_payload, decrypt_payload

Or from the command line (the cipher key comes from an environment variable
so that it does not end up in your shell history):
    PECWS_CIPHER_KEY='...' python payload_crypto.py encrypt text/xml claim.xml > body.json
    PECWS_CIPHER_KEY='...' python payload_crypto.py decrypt result.json > result.xml
    python payload_crypto.py selftest
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import sys
from typing import Optional, Union

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

AES_BLOCK = 16


def sha256_hex(data: bytes) -> str:
    """SHA-256 of some bytes, as 64 lowercase hex characters."""
    return hashlib.sha256(data).hexdigest()


def derive_key(cipher_key: str) -> bytes:
    """Annex A step 2: the AES-256 key is the SHA-256 digest of the cipher key.

    Use the RAW 32-byte digest, not its 64-character hex string (see KI-14).
    The key is hashed as UTF-8 text: the DevKit names no encoding (KI-60).
    """
    if not isinstance(cipher_key, str) or not cipher_key:
        raise ValueError("cipher_key must be a non-empty string")
    return hashlib.sha256(cipher_key.encode("utf-8")).digest()  # 32 bytes


def _zero_pad(data: bytes) -> bytes:
    """Annex A step 4b: pad with 0x00 only when the length is not a multiple of 16."""
    remainder = len(data) % AES_BLOCK
    return data if remainder == 0 else data + b"\x00" * (AES_BLOCK - remainder)


def encrypt_payload(plaintext: Union[str, bytes], cipher_key: str, doc_mime_type: str) -> dict:
    """Encrypts a request body (XML or JSON text) with the facility's cipher key.

    Strings are encoded as UTF-8. Returns the six-field envelope as a dict;
    send it with json.dumps(envelope).

    doc_mime_type: "text/xml" for XML. For JSON, "application/json" (Annex A);
    if the test server rejects it, use "text/xml" (what every Guide JSON sample
    and both demo kits use) and tell PhilHealth (KI-25).
    """
    if not doc_mime_type:
        raise ValueError('doc_mime_type is required, for example "text/xml"')
    data = plaintext.encode("utf-8") if isinstance(plaintext, str) else bytes(plaintext)

    digest = sha256_hex(data)      # step 1: hash of the data BEFORE encryption
    key = derive_key(cipher_key)   # step 2: raw SHA-256 digest of the cipher key
    iv = secrets.token_bytes(16)   # step 3: 16 cryptographically secure random bytes

    # Step 4: AES-256-CBC with Annex A's zero padding (no PKCS#7 padding).
    encryptor = Cipher(algorithms.AES(key), modes.CBC(iv)).encryptor()
    encrypted = encryptor.update(_zero_pad(data)) + encryptor.finalize()

    # Step 5: the JSON envelope. key1 and key2 are empty strings for this scheme.
    return {
        "docMimeType": doc_mime_type,
        "hash": digest,
        "key1": "",
        "key2": "",
        "iv": base64.b64encode(iv).decode("ascii"),
        "doc": base64.b64encode(encrypted).decode("ascii"),
    }


# ---------------------------------------------------------------------------
# Decryption
# ---------------------------------------------------------------------------

def _strip_trailing_zeros(data: bytes) -> bytes:
    return data.rstrip(b"\x00")


def _strip_php_kit_padding(data: bytes) -> Optional[bytes]:
    """The PHP demo kit pads to a multiple of 32 bytes: zeros, then one byte
    that holds the pad length (1-32). See KI-13."""
    if not data:
        return None
    n = data[-1]
    if not 1 <= n <= 32 or n > len(data):
        return None
    if any(b != 0 for b in data[len(data) - n:-1]):
        return None
    return data[:-n]


def _strip_pkcs7(data: bytes) -> Optional[bytes]:
    """Standard PKCS#7 (also called PKCS#5) padding, in case a sender used it."""
    if not data:
        return None
    n = data[-1]
    if not 1 <= n <= AES_BLOCK or n > len(data):
        return None
    if data[-n:] != bytes([n]) * n:
        return None
    return data[:-n]


class DecryptResult:
    def __init__(self, data: bytes, padding: str, hash_verified: bool):
        self.data = data
        self.padding = padding
        self.hash_verified = hash_verified

    @property
    def text(self) -> str:
        return self.data.decode("utf-8")


def decrypt_payload(envelope: Union[dict, str], cipher_key: str,
                    require_valid_hash: bool = True) -> DecryptResult:
    """Decrypts an envelope that was encrypted with the facility's cipher key,
    for example the "result" of an API response.

    Annex A only says "pad with 0x00". Because the demo kits pad differently
    (KI-13), this function tries several ways to remove the padding and keeps
    the one whose SHA-256 matches the envelope's "hash".
    """
    env = json.loads(envelope) if isinstance(envelope, str) else envelope
    if not isinstance(env, dict) or not isinstance(env.get("iv"), str) \
            or not isinstance(env.get("doc"), str):
        raise ValueError('Not an encrypted envelope: "iv" and "doc" are required')
    if env.get("key1") or env.get("key2"):
        raise ValueError("key1/key2 are not empty. This is an attachment envelope encrypted "
                         "with PhilHealth's public key; only PhilHealth can decrypt it.")

    iv = base64.b64decode(env["iv"])
    if len(iv) != 16:
        raise ValueError(f"iv must decode to 16 bytes, got {len(iv)}")
    encrypted = base64.b64decode(env["doc"])
    if not encrypted or len(encrypted) % AES_BLOCK:
        raise ValueError(f"doc must decode to a non-empty multiple of 16 bytes, got {len(encrypted)}")

    decryptor = Cipher(algorithms.AES(derive_key(cipher_key)), modes.CBC(iv)).decryptor()
    padded = decryptor.update(encrypted) + decryptor.finalize()

    candidates = [
        ("zero", _strip_trailing_zeros(padded)),  # Annex A
        ("none", padded),
        ("php-kit", _strip_php_kit_padding(padded)),
        ("pkcs7", _strip_pkcs7(padded)),
    ]

    expected = str(env.get("hash") or "").strip().lower()
    if expected:
        for padding, data in candidates:
            if data is not None and sha256_hex(data) == expected:
                return DecryptResult(data, padding, True)
    if require_valid_hash:
        raise ValueError("Hash mismatch: wrong cipher key, corrupted data, or an unknown "
                         "padding scheme" if expected else "The envelope has no hash to verify")
    return DecryptResult(candidates[0][1], "zero", False)


# ---------------------------------------------------------------------------
# Command-line interface
# ---------------------------------------------------------------------------

def _cipher_key_from_env() -> str:
    key = os.environ.get("PECWS_CIPHER_KEY")
    if not key:
        sys.exit("Set the PECWS_CIPHER_KEY environment variable to your cipher key.")
    return key


def _self_test() -> None:
    cipher_key = "test-cipher-key-not-a-real-one"
    samples = [
        "<eSOA/>",                                       # 7 bytes: needs padding
        '{"lastname":"DELA CRUZ","firstname":"JUAN"}',  # JSON body
        "x" * 32,                                        # exact multiple of 16: no padding
        "Niño Señor",                                    # non-ASCII text: UTF-8 bytes
    ]
    for text in samples:
        env = encrypt_payload(text, cipher_key, "text/xml")
        out = decrypt_payload(env, cipher_key)
        assert out.text == text and out.hash_verified, f"round trip failed for {text!r}"
    try:
        decrypt_payload(encrypt_payload("<a/>", cipher_key, "text/xml"), "wrong-key")
    except ValueError:
        pass
    else:
        raise AssertionError("a wrong cipher key was not detected")
    print("selftest OK")


def main(argv: list) -> None:
    if len(argv) == 3 and argv[0] == "encrypt":
        mime_type, path = argv[1], argv[2]
        with open(path, "rb") as f:
            envelope = encrypt_payload(f.read(), _cipher_key_from_env(), mime_type)
        print(json.dumps(envelope))
    elif len(argv) == 2 and argv[0] == "decrypt":
        with open(argv[1], "r", encoding="utf-8") as f:
            doc = json.load(f)
        if isinstance(doc.get("result"), dict):  # a whole API response
            doc = doc["result"]
        out = decrypt_payload(doc, _cipher_key_from_env())
        print(f"hash verified: {out.hash_verified}; padding removed: {out.padding}",
              file=sys.stderr)
        sys.stdout.buffer.write(out.data)
    elif argv == ["selftest"]:
        _self_test()
    else:
        sys.exit("Usage:\n"
                 "  PECWS_CIPHER_KEY=... python payload_crypto.py encrypt <mimeType> <file>\n"
                 "  PECWS_CIPHER_KEY=... python payload_crypto.py decrypt <envelope-or-response.json>\n"
                 "  python payload_crypto.py selftest")


if __name__ == "__main__":
    main(sys.argv[1:])
