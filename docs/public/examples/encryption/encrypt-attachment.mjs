// encrypt-attachment.mjs
//
// UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
// Test it against PhilHealth's own test environment before you use it.
//
// Encrypts one supporting document (a PDF, or an XML file such as CF4, CF5 or
// eSOA) so that it can be published at the HTTPS URL given in
// DOCUMENT/@pDocumentURL. Follows "Guidelines for the Encryption of e-Claim
// Attachments" (PhilHealth, 2025-03-14).
//
// Requirements: Node.js 18 or newer. No npm packages.
// ("decrypt-test" needs a newer Node.js; see decryptAttachmentForTesting below.)
//
// Command line:
//   node encrypt-attachment.mjs encrypt <philhealth-cert.pem> <file.pdf> [docMimeType]
//        -> writes <file.pdf>.enc next to the input (the input is NOT deleted)
//   node encrypt-attachment.mjs decrypt-test <YOUR-OWN-test-private-key.pem> <file.enc> <out-file>
//        -> only for testing with a throwaway key pair you generated yourself
// Options: --allow-expired-certificate   --padding=zero|pkcs7

import {
  X509Certificate,
  constants,
  createCipheriv,
  createDecipheriv,
  createHash,
  createPrivateKey,
  createPublicKey,
  privateDecrypt,
  publicEncrypt,
  randomBytes,
} from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const AES_BLOCK = 16;

/** SHA-256 of some bytes, as 64 lowercase hex characters. */
export function sha256Hex(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Loads PhilHealth's public key from a PEM file's text. Accepts an X.509
 * certificate ("BEGIN CERTIFICATE") or a bare public key ("BEGIN PUBLIC KEY").
 * Refuses an expired certificate unless allowExpired is true. The certificate
 * bundled with the DevKit expired on 2014-12-29 (KI-01).
 */
export function loadPhilHealthPublicKey(pemText, { allowExpired = false } = {}) {
  const text = String(pemText);
  const begin = text.indexOf('-----BEGIN CERTIFICATE-----');
  let key;
  if (begin >= 0) {
    // The DevKit's PEM file has "Bag Attributes" text before the certificate.
    const cert = new X509Certificate(text.slice(begin));
    if (new Date(cert.validTo) < new Date() && !allowExpired) {
      throw new Error(
        `The certificate (${cert.subject.replace(/\n/g, ', ')}) expired on ${cert.validTo}. ` +
          'Get the current certificate from PhilHealth.',
      );
    }
    key = cert.publicKey;
  } else {
    key = createPublicKey(text);
  }
  if (key.asymmetricKeyType !== 'rsa') {
    throw new Error(`Expected an RSA public key, got ${key.asymmetricKeyType}`);
  }
  return key;
}

function pad(bytes, padding) {
  const remainder = bytes.length % AES_BLOCK;
  if (padding === 'zero') {
    // Same rule as Annex A and the C# demo kit: add 0x00 bytes only if needed.
    return remainder === 0 ? bytes : Buffer.concat([bytes, Buffer.alloc(AES_BLOCK - remainder)]);
  }
  if (padding === 'pkcs7') {
    const n = AES_BLOCK - remainder; // always 1-16 bytes, each equal to n
    return Buffer.concat([bytes, Buffer.alloc(n, n)]);
  }
  throw new Error(`Unknown padding "${padding}" (use "zero" or "pkcs7")`);
}

/**
 * RSA with PKCS#1 v1.5 padding, like both demo kits. Returns base64.
 * The attachment guideline doesn't name the RSA padding mode (KI-59); don't
 * switch to OAEP unless PhilHealth tells you to.
 */
function rsaEncryptBase64(publicKey, bytes) {
  return publicEncrypt({ key: publicKey, padding: constants.RSA_PKCS1_PADDING }, bytes)
    .toString('base64');
}

/**
 * Encrypts one attachment file.
 *
 * @param {Buffer} fileBytes     The exact bytes of the PDF or XML file.
 * @param {string} docMimeType   For example 'application/pdf'.
 * @param {import('node:crypto').KeyObject} publicKey  From loadPhilHealthPublicKey().
 * @param {{padding?: 'zero'|'pkcs7'}} [options]  The attachment guideline does not
 *        say which AES padding to use (KI-13). Confirm with PhilHealth.
 */
export function encryptAttachment(fileBytes, docMimeType, publicKey, { padding = 'zero' } = {}) {
  if (!Buffer.isBuffer(fileBytes) || fileBytes.length === 0) throw new Error('fileBytes must be a non-empty Buffer');
  if (!docMimeType) throw new Error('docMimeType is required, for example "application/pdf"');

  const hash = sha256Hex(fileBytes);      // hash of the file BEFORE encryption
  const password1 = randomBytes(16);      // two random 16-byte arrays...
  const password2 = randomBytes(16);
  const password = Buffer.concat([password1, password2]); // ...form the 32-byte AES-256 key
  const iv = randomBytes(16);             // random 16-byte IV

  const cipher = createCipheriv('aes-256-cbc', password, iv);
  cipher.setAutoPadding(false); // padding is applied explicitly by pad()
  const encrypted = Buffer.concat([cipher.update(pad(fileBytes, padding)), cipher.final()]);

  return {
    docMimeType,
    hash,
    key1: rsaEncryptBase64(publicKey, password1), // each half encrypted separately
    key2: rsaEncryptBase64(publicKey, password2),
    iv: rsaEncryptBase64(publicKey, iv),         // the IV is encrypted too
    doc: encrypted.toString('base64'),
  };
}

/**
 * TESTING ONLY. Decrypts an attachment envelope with the private key of a
 * throwaway key pair that YOU generated, so that you can check your output
 * byte by byte, the way PhilHealth does at certification (SSVTF Stage 2).
 * You cannot decrypt real attachments: only PhilHealth has its private key.
 *
 * Node.js refuses RSA PKCS#1 v1.5 *decryption* when its bundled OpenSSL lacks
 * "implicit rejection" (CVE-2023-46809). Tested: Node.js 18.20 and 20.20
 * refuse; Node.js 22.23 and 24.16 work. On older versions, use the Python
 * example or the OpenSSL command line for this test. Encryption works on all.
 */
export function decryptAttachmentForTesting(envelope, privateKeyPem) {
  const env = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
  const privateKey = createPrivateKey(privateKeyPem);
  const rsa = (b64) => {
    try {
      return privateDecrypt({ key: privateKey, padding: constants.RSA_PKCS1_PADDING }, Buffer.from(b64, 'base64'));
    } catch (err) {
      if (/RSA_PKCS1_PADDING/.test(err.message)) {
        throw new Error('This Node.js version cannot decrypt RSA PKCS#1 v1.5. Use Node.js 22.23+/24, ' +
          'or run the Python example (encrypt_attachment.py decrypt-test) instead.');
      }
      throw err;
    }
  };
  const password = Buffer.concat([rsa(env.key1), rsa(env.key2)]);
  const iv = rsa(env.iv);
  if (password.length !== 32 || iv.length !== 16) throw new Error('Unexpected key or IV length');

  const decipher = createDecipheriv('aes-256-cbc', password, iv);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(Buffer.from(env.doc, 'base64')), decipher.final()]);

  // The padding is not specified (KI-13), so use the hash to find the right one.
  const candidates = { none: padded };
  // Zero padding adds 0-15 bytes of 0x00. The file itself may also end in 0x00
  // bytes (the DevKit's sample PDF ends in 15 of them), so "strip every trailing
  // zero" is not enough: try each possible pad length and let the hash decide.
  for (let k = 1; k <= 15 && padded[padded.length - k] === 0; k++) {
    candidates[`zero (${k} byte${k > 1 ? 's' : ''})`] = padded.subarray(0, padded.length - k);
  }
  const n = padded[padded.length - 1];
  if (n >= 1 && n <= 16 && padded.subarray(padded.length - n).every((b) => b === n)) {
    candidates.pkcs7 = padded.subarray(0, padded.length - n);
  }
  if (n >= 1 && n <= 32 && padded.subarray(padded.length - n, padded.length - 1).every((b) => b === 0)) {
    candidates['php-kit'] = padded.subarray(0, padded.length - n);
  }
  for (const [padding, data] of Object.entries(candidates)) {
    if (sha256Hex(data) === String(env.hash).toLowerCase()) return { data, padding, hashVerified: true };
  }
  return { data: padded, padding: 'unknown', hashVerified: false };
}

// ---------------------------------------------------------------------------
// Command-line interface
// ---------------------------------------------------------------------------

const MIME_BY_EXTENSION = {
  '.pdf': 'application/pdf',
  // The DevKit does not name a MIME type for XML attachments (KI-57). PECWS payload
  // envelopes use "text/xml", so this example uses it too. Confirm with PhilHealth.
  '.xml': 'text/xml',
};

function main(argv) {
  const flags = argv.filter((a) => a.startsWith('--'));
  const args = argv.filter((a) => !a.startsWith('--'));
  const allowExpired = flags.includes('--allow-expired-certificate');
  const paddingFlag = flags.find((f) => f.startsWith('--padding='));
  const padding = paddingFlag ? paddingFlag.split('=')[1] : 'zero';
  const [command, ...rest] = args;

  if (command === 'encrypt' && (rest.length === 2 || rest.length === 3)) {
    const [certFile, inputFile, mimeArg] = rest;
    const docMimeType = mimeArg || MIME_BY_EXTENSION[extname(inputFile).toLowerCase()];
    if (!docMimeType) throw new Error('Cannot guess the MIME type; pass it as the third argument');
    const publicKey = loadPhilHealthPublicKey(readFileSync(certFile, 'utf8'), { allowExpired });
    const fileBytes = readFileSync(inputFile);
    if (padding === 'zero' && fileBytes[fileBytes.length - 1] === 0) {
      console.error('Warning: this file ends with 0x00 bytes. A decryptor that strips every trailing ' +
        'zero would also remove them, and the byte-by-byte check would fail. Confirm the padding ' +
        'with PhilHealth (KI-13).');
    }
    const envelope = encryptAttachment(fileBytes, docMimeType, publicKey, { padding });
    const outFile = `${inputFile}.enc`;
    writeFileSync(outFile, JSON.stringify(envelope));
    console.log(`Wrote ${outFile} (hash ${envelope.hash}, padding ${padding})`);
  } else if (command === 'decrypt-test' && rest.length === 3) {
    const [keyFile, encFile, outFile] = rest;
    const result = decryptAttachmentForTesting(readFileSync(encFile, 'utf8'), readFileSync(keyFile, 'utf8'));
    writeFileSync(outFile, result.data);
    console.log(`Wrote ${outFile}; hash verified: ${result.hashVerified}; padding removed: ${result.padding}`);
    if (!result.hashVerified) process.exitCode = 1;
  } else {
    console.error('Usage:\n' +
      '  node encrypt-attachment.mjs encrypt <philhealth-cert.pem> <file> [docMimeType] [--padding=zero|pkcs7] [--allow-expired-certificate]\n' +
      '  node encrypt-attachment.mjs decrypt-test <your-test-private-key.pem> <file.enc> <out-file>');
    process.exit(2);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
