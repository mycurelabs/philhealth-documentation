"""encrypt_attachment.py

UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
Test it against PhilHealth's own test environment before you use it.

Encrypts one supporting document (a PDF, or an XML file such as CF4, CF5 or
eSOA) so that it can be published at the HTTPS URL given in
DOCUMENT/@pDocumentURL. Follows "Guidelines for the Encryption of e-Claim
Attachments" (PhilHealth, 2025-03-14).

Requirements: Python 3.9+ and the "cryptography" package
    pip install cryptography

Command line:
    python encrypt_attachment.py encrypt <philhealth-cert.pem> <file.pdf> [docMimeType]
        -> writes <file.pdf>.enc next to the input (the input is NOT deleted)
    python encrypt_attachment.py decrypt-test <YOUR-OWN-test-private-key.pem> <file.enc> <out-file>
        -> only for testing with a throwaway key pair you generated yourself
Options: --allow-expired-certificate   --padding=zero|pkcs7
"""

from __future__ import annotations

import base64
import datetime
import hashlib
import json
import os
import secrets
import sys

from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding as asym_padding
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes

AES_BLOCK = 16


def sha256_hex(data: bytes) -> str:
    """SHA-256 of some bytes, as 64 lowercase hex characters."""
    return hashlib.sha256(data).hexdigest()


def load_philhealth_public_key(pem: bytes, allow_expired: bool = False) -> rsa.RSAPublicKey:
    """Loads PhilHealth's public key from PEM bytes. Accepts an X.509
    certificate ("BEGIN CERTIFICATE") or a bare public key ("BEGIN PUBLIC KEY").
    Refuses an expired certificate unless allow_expired is True. The
    certificate bundled with the DevKit expired on 2014-12-29 (KI-01)."""
    begin = pem.find(b"-----BEGIN CERTIFICATE-----")
    if begin >= 0:
        # The DevKit's PEM file has "Bag Attributes" text before the certificate.
        cert = x509.load_pem_x509_certificate(pem[begin:])
        not_after = getattr(cert, "not_valid_after_utc", None) or \
            cert.not_valid_after.replace(tzinfo=datetime.timezone.utc)
        if not_after < datetime.datetime.now(datetime.timezone.utc) and not allow_expired:
            raise ValueError(f"The certificate ({cert.subject.rfc4514_string()}) expired on "
                             f"{not_after:%Y-%m-%d}. Get the current certificate from PhilHealth.")
        key = cert.public_key()
    else:
        key = serialization.load_pem_public_key(pem)
    if not isinstance(key, rsa.RSAPublicKey):
        raise ValueError("Expected an RSA public key")
    return key


def _pad(data: bytes, padding: str) -> bytes:
    remainder = len(data) % AES_BLOCK
    if padding == "zero":
        # Same rule as Annex A and the C# demo kit: add 0x00 bytes only if needed.
        return data if remainder == 0 else data + b"\x00" * (AES_BLOCK - remainder)
    if padding == "pkcs7":
        n = AES_BLOCK - remainder  # always 1-16 bytes, each equal to n
        return data + bytes([n]) * n
    raise ValueError(f'Unknown padding "{padding}" (use "zero" or "pkcs7")')


def _rsa_encrypt_b64(public_key: rsa.RSAPublicKey, data: bytes) -> str:
    """RSA with PKCS#1 v1.5 padding, like both demo kits. Returns base64.

    The attachment guideline doesn't name the RSA padding mode (KI-59); don't
    switch to OAEP unless PhilHealth tells you to.
    """
    return base64.b64encode(public_key.encrypt(data, asym_padding.PKCS1v15())).decode("ascii")


def encrypt_attachment(file_bytes: bytes, doc_mime_type: str, public_key: rsa.RSAPublicKey,
                       padding: str = "zero") -> dict:
    """Encrypts one attachment file and returns the six-field envelope.

    The attachment guideline does not say which AES padding to use (KI-13).
    Confirm with PhilHealth.
    """
    if not file_bytes:
        raise ValueError("file_bytes must not be empty")
    if not doc_mime_type:
        raise ValueError('doc_mime_type is required, for example "application/pdf"')

    digest = sha256_hex(file_bytes)        # hash of the file BEFORE encryption
    password1 = secrets.token_bytes(16)    # two random 16-byte arrays...
    password2 = secrets.token_bytes(16)
    password = password1 + password2       # ...form the 32-byte AES-256 key
    iv = secrets.token_bytes(16)           # random 16-byte IV

    encryptor = Cipher(algorithms.AES(password), modes.CBC(iv)).encryptor()
    encrypted = encryptor.update(_pad(file_bytes, padding)) + encryptor.finalize()

    return {
        "docMimeType": doc_mime_type,
        "hash": digest,
        "key1": _rsa_encrypt_b64(public_key, password1),  # each half encrypted separately
        "key2": _rsa_encrypt_b64(public_key, password2),
        "iv": _rsa_encrypt_b64(public_key, iv),           # the IV is encrypted too
        "doc": base64.b64encode(encrypted).decode("ascii"),
    }


def decrypt_attachment_for_testing(envelope, private_key_pem: bytes):
    """TESTING ONLY. Decrypts an attachment envelope with the private key of a
    throwaway key pair that YOU generated, so that you can check your output
    byte by byte, the way PhilHealth does at certification (SSVTF Stage 2).
    You cannot decrypt real attachments: only PhilHealth has its private key.

    Returns (data, padding_removed, hash_verified).
    """
    env = json.loads(envelope) if isinstance(envelope, (str, bytes)) else envelope
    private_key = serialization.load_pem_private_key(private_key_pem, password=None)

    def rsa_decrypt(b64: str) -> bytes:
        return private_key.decrypt(base64.b64decode(b64), asym_padding.PKCS1v15())

    password = rsa_decrypt(env["key1"]) + rsa_decrypt(env["key2"])
    iv = rsa_decrypt(env["iv"])
    if len(password) != 32 or len(iv) != 16:
        raise ValueError("Unexpected key or IV length")

    decryptor = Cipher(algorithms.AES(password), modes.CBC(iv)).decryptor()
    padded = decryptor.update(base64.b64decode(env["doc"])) + decryptor.finalize()

    # The padding is not specified (KI-13), so use the hash to find the right one.
    candidates = [("none", padded)]
    # Zero padding adds 0-15 bytes of 0x00. The file itself may also end in 0x00
    # bytes (the DevKit's sample PDF ends in 15 of them), so "strip every trailing
    # zero" is not enough: try each possible pad length and let the hash decide.
    k = 1
    while k <= 15 and padded[-k] == 0:
        candidates.append((f"zero ({k} byte{'s' if k > 1 else ''})", padded[:-k]))
        k += 1
    n = padded[-1]
    if 1 <= n <= 16 and padded[-n:] == bytes([n]) * n:
        candidates.append(("pkcs7", padded[:-n]))
    if 1 <= n <= 32 and not any(padded[len(padded) - n:-1]):
        candidates.append(("php-kit", padded[:-n]))
    for name, data in candidates:
        if sha256_hex(data) == str(env["hash"]).lower():
            return data, name, True
    return padded, "unknown", False


# ---------------------------------------------------------------------------
# Command-line interface
# ---------------------------------------------------------------------------

MIME_BY_EXTENSION = {
    ".pdf": "application/pdf",
    # The DevKit does not name a MIME type for XML attachments (KI-57). PECWS payload
    # envelopes use "text/xml", so this example uses it too. Confirm with PhilHealth.
    ".xml": "text/xml",
}


def main(argv: list) -> None:
    flags = [a for a in argv if a.startswith("--")]
    args = [a for a in argv if not a.startswith("--")]
    allow_expired = "--allow-expired-certificate" in flags
    padding = next((f.split("=", 1)[1] for f in flags if f.startswith("--padding=")), "zero")

    if args[:1] == ["encrypt"] and len(args) in (3, 4):
        cert_file, input_file = args[1], args[2]
        mime = args[3] if len(args) == 4 else \
            MIME_BY_EXTENSION.get(os.path.splitext(input_file)[1].lower())
        if not mime:
            sys.exit("Cannot guess the MIME type; pass it as the third argument")
        with open(cert_file, "rb") as f:
            public_key = load_philhealth_public_key(f.read(), allow_expired=allow_expired)
        with open(input_file, "rb") as f:
            file_bytes = f.read()
        if padding == "zero" and file_bytes.endswith(b"\x00"):
            print("Warning: this file ends with 0x00 bytes. A decryptor that strips every trailing "
                  "zero would also remove them, and the byte-by-byte check would fail. Confirm the "
                  "padding with PhilHealth (KI-13).", file=sys.stderr)
        envelope = encrypt_attachment(file_bytes, mime, public_key, padding=padding)
        out_file = input_file + ".enc"
        with open(out_file, "w", encoding="ascii") as f:
            f.write(json.dumps(envelope, separators=(",", ":")))
        print(f"Wrote {out_file} (hash {envelope['hash']}, padding {padding})")
    elif args[:1] == ["decrypt-test"] and len(args) == 4:
        key_file, enc_file, out_file = args[1], args[2], args[3]
        with open(key_file, "rb") as f:
            key_pem = f.read()
        with open(enc_file, "r", encoding="utf-8") as f:
            data, name, ok = decrypt_attachment_for_testing(f.read(), key_pem)
        with open(out_file, "wb") as f:
            f.write(data)
        print(f"Wrote {out_file}; hash verified: {ok}; padding removed: {name}")
        if not ok:
            sys.exit(1)
    else:
        sys.exit("Usage:\n"
                 "  python encrypt_attachment.py encrypt <philhealth-cert.pem> <file> [docMimeType]"
                 " [--padding=zero|pkcs7] [--allow-expired-certificate]\n"
                 "  python encrypt_attachment.py decrypt-test <your-test-private-key.pem> <file.enc> <out-file>")


if __name__ == "__main__":
    main(sys.argv[1:])
