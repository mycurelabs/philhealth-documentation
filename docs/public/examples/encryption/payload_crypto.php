<?php
/*
 * payload_crypto.php
 *
 * UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
 * Test it against PhilHealth's own test environment before you use it.
 *
 * Encrypts and decrypts PECWS 3.0 API payloads with the health facility's
 * cipher key, following Annex A of the Implementation Guide (rev. 20250217,
 * PDF pages 75-76). A small, corrected alternative to the PHP demo kit's
 * encryptXmlPayloadData / decryptPayloadDataToXml (see /reference/demo-kits).
 *
 * Requirements: PHP 7.4 or 8.x with the openssl extension.
 * PHP strings are bytes: pass the cipher key and the XML/JSON text as UTF-8
 * (the DevKit names no encoding, KI-60).
 *
 *   require 'payload_crypto.php';
 *   $envelope = pecws_encrypt_payload($xml, getenv('PECWS_CIPHER_KEY'), 'text/xml');
 *   $body = json_encode($envelope);
 *   $plain = pecws_decrypt_payload($response['result'], getenv('PECWS_CIPHER_KEY'));
 */

/** Annex A step 2: the raw 32-byte SHA-256 digest of the cipher key (not the hex text). */
function pecws_derive_key(string $cipherKey): string
{
    if ($cipherKey === '') {
        throw new InvalidArgumentException('cipherKey must not be empty');
    }
    return hash('sha256', $cipherKey, true);
}

/**
 * Encrypts XML or JSON text. Returns the six-field envelope as an array.
 * $docMimeType: 'text/xml' for XML. For JSON, 'application/json' (Annex A);
 * if the test server rejects it, use 'text/xml' (what every Guide JSON sample
 * and both demo kits use) and tell PhilHealth (KI-25).
 */
function pecws_encrypt_payload(string $plaintext, string $cipherKey, string $docMimeType): array
{
    $iv = random_bytes(16);                          // new random IV for every message
    $remainder = strlen($plaintext) % 16;            // Annex A: pad with 0x00 only if needed
    $padded = $remainder === 0 ? $plaintext : $plaintext . str_repeat("\0", 16 - $remainder);
    // OPENSSL_ZERO_PADDING means "add no padding" in PHP: we already padded above.
    $encrypted = openssl_encrypt($padded, 'aes-256-cbc', pecws_derive_key($cipherKey),
        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv);
    if ($encrypted === false) {
        throw new RuntimeException('openssl_encrypt failed: ' . openssl_error_string());
    }
    return [
        'docMimeType' => $docMimeType,
        'hash' => hash('sha256', $plaintext),        // hex SHA-256 of the data BEFORE encryption
        'key1' => '',
        'key2' => '',
        'iv' => base64_encode($iv),
        'doc' => base64_encode($encrypted),
    ];
}

/**
 * Decrypts a cipher-key envelope (array, or its JSON text). Tries the known
 * padding schemes and keeps the one whose SHA-256 matches "hash" (KI-13).
 * Throws if none matches.
 */
function pecws_decrypt_payload($envelope, string $cipherKey): string
{
    $env = is_string($envelope) ? json_decode($envelope, true) : $envelope;
    if (!is_array($env) || !isset($env['iv'], $env['doc'])) {
        throw new InvalidArgumentException('Not an encrypted envelope: "iv" and "doc" are required');
    }
    if (!empty($env['key1']) || !empty($env['key2'])) {
        throw new InvalidArgumentException('key1/key2 are not empty: this is an attachment envelope; only PhilHealth can decrypt it');
    }
    $iv = base64_decode($env['iv']);
    $data = base64_decode($env['doc']);
    if (strlen($iv) !== 16 || $data === '' || strlen($data) % 16 !== 0) {
        throw new InvalidArgumentException('iv must be 16 bytes and doc a non-empty multiple of 16 bytes');
    }
    $padded = openssl_decrypt($data, 'aes-256-cbc', pecws_derive_key($cipherKey),
        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING, $iv);
    if ($padded === false) {
        throw new RuntimeException('openssl_decrypt failed: ' . openssl_error_string());
    }

    $candidates = [rtrim($padded, "\0"), $padded];   // Annex A zero padding, or none
    $n = ord(substr($padded, -1));
    if ($n >= 1 && $n <= 32 && $n <= strlen($padded)) {
        $candidates[] = substr($padded, 0, -$n);     // PHP demo kit or PKCS#7 padding
    }
    $expected = strtolower(trim((string)($env['hash'] ?? '')));
    foreach ($candidates as $candidate) {
        if ($expected !== '' && hash_equals($expected, hash('sha256', $candidate))) {
            return $candidate;
        }
    }
    throw new RuntimeException('Hash mismatch: wrong cipher key, corrupted data, or an unknown padding scheme');
}
