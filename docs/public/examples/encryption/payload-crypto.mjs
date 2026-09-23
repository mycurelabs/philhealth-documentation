// payload-crypto.mjs
//
// UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
// Test it against PhilHealth's own test environment before you use it.
//
// Encrypts and decrypts PECWS 3.0 API payloads with the health facility's
// cipher key, following "Annex A - Guidelines for the Data Encryption Using
// the Cipher Key of the Health Facility" (Implementation Guide rev. 20250217,
// PDF pages 75-76).
//
// Requirements: Node.js 18 or newer. No npm packages.
//
// Use it as a module:
//   import { encryptPayload, decryptPayload } from './payload-crypto.mjs';
//
// Or from the command line (the cipher key comes from an environment variable
// so that it does not end up in your shell history):
//   PECWS_CIPHER_KEY='...' node payload-crypto.mjs encrypt text/xml claim.xml > body.json
//   PECWS_CIPHER_KEY='...' node payload-crypto.mjs decrypt result.json > result.xml
//   node payload-crypto.mjs selftest

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const AES_BLOCK = 16;

/** SHA-256 of some bytes, as 64 lowercase hex characters. */
export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Annex A step 2: the AES-256 key is the SHA-256 digest of the cipher key.
 * Use the RAW 32-byte digest, not its 64-character hex string (see KI-14).
 * The key is hashed as UTF-8 text: the DevKit names no encoding (KI-60).
 */
export function deriveKey(cipherKey) {
  if (typeof cipherKey !== 'string' || cipherKey.length === 0) {
    throw new Error('cipherKey must be a non-empty string');
  }
  return createHash('sha256').update(cipherKey, 'utf8').digest(); // 32 bytes
}

/** Annex A step 4b: pad with 0x00 bytes only when the length is not a multiple of 16. */
function zeroPad(bytes) {
  const remainder = bytes.length % AES_BLOCK;
  if (remainder === 0) return bytes;
  return Buffer.concat([bytes, Buffer.alloc(AES_BLOCK - remainder)]);
}

/**
 * Encrypts a request body (XML or JSON text) with the facility's cipher key.
 *
 * @param {string|Buffer} plaintext  The XML or JSON text (strings are encoded as UTF-8).
 * @param {string} cipherKey         The cipher key PhilHealth issued to the facility.
 * @param {string} docMimeType       'text/xml' for XML. For JSON, 'application/json' (Annex A);
 *                                   if the test server rejects it, use 'text/xml' (what every
 *                                   Guide JSON sample and both demo kits use) and tell PhilHealth (KI-25).
 * @returns {{docMimeType:string, hash:string, key1:string, key2:string, iv:string, doc:string}}
 */
export function encryptPayload(plaintext, cipherKey, docMimeType) {
  if (!docMimeType) throw new Error('docMimeType is required, for example "text/xml"');
  const data = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(String(plaintext), 'utf8');

  const hash = sha256Hex(data);     // step 1: hash of the data BEFORE encryption
  const key = deriveKey(cipherKey); // step 2: raw SHA-256 digest of the cipher key
  const iv = randomBytes(16);       // step 3: 16 cryptographically secure random bytes

  // Step 4: AES-256-CBC. Turn off Node's automatic PKCS#7 padding and apply
  // Annex A's zero padding instead.
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(zeroPad(data)), cipher.final()]);

  // Step 5: the JSON envelope. key1 and key2 are empty strings for this scheme.
  return {
    docMimeType,
    hash,
    key1: '',
    key2: '',
    iv: iv.toString('base64'),
    doc: encrypted.toString('base64'),
  };
}

// ---------------------------------------------------------------------------
// Decryption
// ---------------------------------------------------------------------------

function stripTrailingZeros(bytes) {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0x00) end--;
  return bytes.subarray(0, end);
}

// The PHP demo kit pads to a multiple of 32 bytes: zeros, then one byte that
// holds the pad length (1-32). See KI-13.
function stripPhpKitPadding(bytes) {
  if (bytes.length === 0) return null;
  const n = bytes[bytes.length - 1];
  if (n < 1 || n > 32 || n > bytes.length) return null;
  for (let i = bytes.length - n; i < bytes.length - 1; i++) {
    if (bytes[i] !== 0x00) return null;
  }
  return bytes.subarray(0, bytes.length - n);
}

// Standard PKCS#7 (also called PKCS#5) padding, in case a sender used it.
function stripPkcs7(bytes) {
  if (bytes.length === 0) return null;
  const n = bytes[bytes.length - 1];
  if (n < 1 || n > AES_BLOCK || n > bytes.length) return null;
  for (let i = bytes.length - n; i < bytes.length; i++) {
    if (bytes[i] !== n) return null;
  }
  return bytes.subarray(0, bytes.length - n);
}

/**
 * Decrypts an envelope that was encrypted with the facility's cipher key,
 * for example the `result` of an API response.
 *
 * Annex A only says "pad with 0x00". Because the demo kits pad differently
 * (KI-13), this function tries several ways to remove the padding and keeps
 * the one whose SHA-256 matches the envelope's `hash`.
 *
 * @param {object|string} envelope  The envelope object, or its JSON text.
 * @param {string} cipherKey
 * @param {{requireValidHash?: boolean}} [options]  Default: throw if no candidate matches the hash.
 * @returns {{data: Buffer, text: string, padding: string, hashVerified: boolean}}
 */
export function decryptPayload(envelope, cipherKey, { requireValidHash = true } = {}) {
  const env = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
  if (!env || typeof env.iv !== 'string' || typeof env.doc !== 'string') {
    throw new Error('Not an encrypted envelope: "iv" and "doc" are required');
  }
  if (env.key1 || env.key2) {
    throw new Error(
      'key1/key2 are not empty. This is an attachment envelope encrypted with ' +
        "PhilHealth's public key; only PhilHealth can decrypt it.",
    );
  }

  const iv = Buffer.from(env.iv, 'base64');
  if (iv.length !== 16) throw new Error(`iv must decode to 16 bytes, got ${iv.length}`);
  const encrypted = Buffer.from(env.doc, 'base64');
  if (encrypted.length === 0 || encrypted.length % AES_BLOCK !== 0) {
    throw new Error(`doc must decode to a non-empty multiple of 16 bytes, got ${encrypted.length}`);
  }

  const decipher = createDecipheriv('aes-256-cbc', deriveKey(cipherKey), iv);
  decipher.setAutoPadding(false); // we remove the padding ourselves, below
  const padded = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  const candidates = [
    ['zero', stripTrailingZeros(padded)], // Annex A
    ['none', padded],
    ['php-kit', stripPhpKitPadding(padded)],
    ['pkcs7', stripPkcs7(padded)],
  ];

  const expected = String(env.hash || '').trim().toLowerCase();
  if (expected) {
    for (const [padding, data] of candidates) {
      if (data && sha256Hex(data) === expected) {
        return { data, text: data.toString('utf8'), padding, hashVerified: true };
      }
    }
  }
  if (requireValidHash) {
    throw new Error(
      expected
        ? 'Hash mismatch: wrong cipher key, corrupted data, or an unknown padding scheme'
        : 'The envelope has no hash to verify',
    );
  }
  const data = candidates[0][1];
  return { data, text: data.toString('utf8'), padding: 'zero', hashVerified: false };
}

// ---------------------------------------------------------------------------
// Command-line interface
// ---------------------------------------------------------------------------

function cipherKeyFromEnv() {
  const key = process.env.PECWS_CIPHER_KEY;
  if (!key) {
    console.error('Set the PECWS_CIPHER_KEY environment variable to your cipher key.');
    process.exit(2);
  }
  return key;
}

function selfTest() {
  const cipherKey = 'test-cipher-key-not-a-real-one';
  const samples = [
    '<eSOA/>',                                       // 7 bytes: needs padding
    '{"lastname":"DELA CRUZ","firstname":"JUAN"}',  // JSON body
    'x'.repeat(32),                                  // exact multiple of 16: no padding
    'Niño Señor',                                    // non-ASCII text: UTF-8 bytes
  ];
  for (const text of samples) {
    const env = encryptPayload(text, cipherKey, 'text/xml');
    const out = decryptPayload(env, cipherKey);
    if (out.text !== text || !out.hashVerified) throw new Error(`round trip failed for ${text}`);
  }
  let rejected = false;
  try {
    decryptPayload(encryptPayload('<a/>', cipherKey, 'text/xml'), 'wrong-key');
  } catch {
    rejected = true;
  }
  if (!rejected) throw new Error('a wrong cipher key was not detected');
  console.log('selftest OK');
}

function main(argv) {
  const [command, ...args] = argv;
  if (command === 'encrypt' && args.length === 2) {
    const [mimeType, file] = args;
    const envelope = encryptPayload(readFileSync(file), cipherKeyFromEnv(), mimeType);
    process.stdout.write(JSON.stringify(envelope) + '\n');
  } else if (command === 'decrypt' && args.length === 1) {
    let json = JSON.parse(readFileSync(args[0], 'utf8'));
    if (json.result && typeof json.result === 'object') json = json.result; // whole API response
    const out = decryptPayload(json, cipherKeyFromEnv());
    console.error(`hash verified: ${out.hashVerified}; padding removed: ${out.padding}`);
    process.stdout.write(out.data);
  } else if (command === 'selftest') {
    selfTest();
  } else {
    console.error('Usage:\n' +
      '  PECWS_CIPHER_KEY=... node payload-crypto.mjs encrypt <mimeType> <file>\n' +
      '  PECWS_CIPHER_KEY=... node payload-crypto.mjs decrypt <envelope-or-response.json>\n' +
      '  node payload-crypto.mjs selftest');
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
