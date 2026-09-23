PECWS 3.0 ENCRYPTION EXAMPLES (UNOFFICIAL)
==========================================

These files are NOT from PhilHealth and are NOT certified. They were written
for the "PhilHealth eClaims Dev Docs" site to show how the two encryption
schemes in the PECWS 3.0 DevKit work. Test them against PhilHealth's own test
environment, and confirm the open questions (padding, MIME types, current
certificate) with PhilHealth before you go live.

Guides:
  /guides/encryption/               the two schemes side by side
  /guides/encryption/api-payloads   cipher-key encryption (Annex A)
  /guides/encryption/attachments    public-key encryption of attachments
  /reference/demo-kits              PhilHealth's C# and PHP demo kits


FILES
-----
payload-crypto.mjs      Node.js 18+  API payloads: encrypt, decrypt, hash check
payload_crypto.py       Python 3.9+  same, uses the "cryptography" package
payload_crypto.php      PHP 7.4/8.x  same (library functions only), uses the openssl extension
encrypt-attachment.mjs  Node.js 18+  attachments: encrypt with PhilHealth's certificate
encrypt_attachment.py   Python 3.9+  same, uses the "cryptography" package

The Node.js files use only the built-in node:crypto module.
For Python: pip install cryptography
There is no PHP attachment example; use openssl_public_encrypt (PKCS#1 v1.5)
and the steps in /guides/encryption/attachments.

The site's shared API client (../client/pecws-client.mjs and
../client/pecws_client.py, described at /api/#shared-client-setup) imports
payload-crypto.mjs / payload_crypto.py from this folder. Keep the "client" and
"encryption" folders side by side. Its seal() and unseal() helpers call
encryptPayload / decryptPayload with the PECWS_CIPHER_KEY environment variable.


QUICK START
-----------
API payloads (the cipher key is read from an environment variable):

  node payload-crypto.mjs selftest
  PECWS_CIPHER_KEY='your-cipher-key' node payload-crypto.mjs encrypt text/xml esoa.xml > body.json
  PECWS_CIPHER_KEY='your-cipher-key' node payload-crypto.mjs decrypt response.json > result.xml

  python payload_crypto.py selftest
  PECWS_CIPHER_KEY='your-cipher-key' python payload_crypto.py encrypt text/xml esoa.xml > body.json
  PECWS_CIPHER_KEY='your-cipher-key' python payload_crypto.py decrypt response.json > result.xml

Attachments (writes <file>.enc next to the input; the input is NOT deleted):

  node encrypt-attachment.mjs encrypt philhealth-cert.pem CSF.pdf
  python encrypt_attachment.py encrypt philhealth-cert.pem CF4.xml

Options for the attachment scripts:
  --padding=zero|pkcs7          AES padding; the guideline does not specify it (KI-13)
  --allow-expired-certificate   only to experiment with the DevKit's expired test
                                certificate (KI-01); never in production

docMimeType:
  API payloads   text/xml for XML. For JSON, application/json (Annex A); if the
                 test server rejects it, use text/xml (what every Guide JSON
                 sample and both demo kits use) and tell PhilHealth (KI-25).
  Attachments    application/pdf for PDFs. The DevKit names no type for XML
                 attachments; the attachment scripts use text/xml for .xml files
                 (KI-57). Pass the type as the third argument to override it.

Text encoding:
  UTF-8 for the cipher key and for all XML and JSON text. The DevKit names no
  encoding (KI-60).

RSA padding (attachments):
  PKCS#1 v1.5, as both demo kits use. The attachment guideline names no padding
  mode (KI-59); confirm with PhilHealth.


TESTING ATTACHMENTS WITH YOUR OWN THROWAWAY KEY PAIR
----------------------------------------------------
You cannot decrypt a real attachment: only PhilHealth has the private key.
To check your own output byte by byte, make a throwaway key pair, encrypt with
its certificate, and decrypt with its private key. Keep test keys out of your
repository.

  openssl req -x509 -newkey rsa:2048 -nodes -keyout test_private.pem \
      -out test_cert.pem -days 30 -subj "/CN=throwaway-test-only"
  node encrypt-attachment.mjs encrypt test_cert.pem sample.pdf
  node encrypt-attachment.mjs decrypt-test test_private.pem sample.pdf.enc sample.decrypted.pdf
  cmp sample.pdf sample.decrypted.pdf && echo "byte-for-byte identical"

"decrypt-test" in Node.js needs a version whose bundled OpenSSL supports RSA
"implicit rejection" (tested: 22.23 and 24.16 work; 18.20 and 20.20 refuse).
The Python version works everywhere.


WHAT WAS TESTED (September 2026)
--------------------------------
- Node.js <-> Python payload round trips for 71 inputs (1 to 1,000,003
  characters, including non-ASCII text), both directions.
- payload_crypto.php (PHP 7.4 and 8.3) <-> Node.js / Python: all identical.
- A known-answer test vector computed three ways (Node.js, Python
  "cryptography", OpenSSL command line) with identical results.
- Interoperability with the PHP demo kit (PHP 8.3 and 7.4): payloads encrypted
  by the kit decrypt correctly with these examples. Payloads encrypted by these
  examples decrypt correctly with the kit, EXCEPT when the plaintext length is
  an exact multiple of 16 bytes; then the kit usually returns an empty string
  and is right only by chance (KI-16). See /reference/demo-kits.
- Attachments encrypted by these examples and by the PHP kit, decrypted with a
  throwaway private key by Node.js, Python and the OpenSSL command line: the
  SHA-256 of every decrypted file matched the original.
- Files that end in 0x00 bytes (the DevKit's sample PDF ends with 15 of them):
  "decrypt-test" tries every zero-pad length (0-15) and lets the hash decide,
  so these files also round-trip exactly. With --padding=zero, "encrypt" prints
  a warning for such files, because a decryptor that strips every trailing
  zero would shorten them (KI-13).
