// pecws-client.mjs
//
// UNOFFICIAL EXAMPLE. This file is not from PhilHealth. It is not certified.
// Test it against PhilHealth's own test environment before you use it.
//
// A small client for the PhilHealth eClaims Web Service (PECWS 3.0). Every
// code example on the "PhilHealth eClaims Dev Docs" site uses it, so the
// snippets on different pages fit together. Setup: /api/#shared-client-setup
//
// Requirements: Node.js 18 or newer. No npm packages. It needs this site's
// payload-crypto.mjs (/examples/encryption/payload-crypto.mjs). Keep the two
// files in the site's layout (client/ and encryption/ side by side), or put
// both files in one folder.
//
// Configuration comes from four environment variables:
//   PECWS_BASE_URL         https://<host from PhilHealth>/PHIC/Claims3.0  (KI-30)
//   PHIC_FACILITY_PAN      the facility's accreditation number (getToken accreditationNo)
//   PHIC_SOFTWARE_CERT_ID  the software certificate ID (getToken softwareCertificateId)
//   PECWS_CIPHER_KEY       the facility's cipher key (never sent over the network)
//
// Usage:
//   import { pecwsPost, seal, unseal, assertSuccess } from './pecws-client.mjs';
//   const env = assertSuccess(await pecwsPost('getDoctorPAN', seal(JSON.stringify(query), 'application/json')));
//   const { pan } = JSON.parse(unseal(env.result));
//
// Quick connection test (getToken, then getServerVersion):
//   node pecws-client.mjs smoketest

import http from 'node:http';
import https from 'node:https';
import { pathToFileURL } from 'node:url';

// Load the encryption helpers from this site's layout, or from the same folder.
async function loadPayloadCrypto() {
  try {
    return await import('../encryption/payload-crypto.mjs');
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    return import('./payload-crypto.mjs');
  }
}
const { encryptPayload, decryptPayload } = await loadPayloadCrypto();

// Uploads can be large. The DevKit gives no timeout; this value is our choice.
const TIMEOUT_MS = 120_000;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Set the ${name} environment variable (see /api/#shared-client-setup)`);
  return value;
}

function methodUrl(method, query) {
  if (!/^[A-Za-z0-9]+$/.test(method)) {
    throw new Error(`Use the method name exactly as in the endpoint, for example "uploadeClaims" (got "${method}")`);
  }
  const url = new URL(`${requireEnv('PECWS_BASE_URL').replace(/\/+$/, '')}/${method}`);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocal)) {
    // Plain http is allowed only for a local mock server.
    throw new Error('PECWS_BASE_URL must start with https://');
  }
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value)); // URL-encoded
  }
  return url;
}

// One HTTP request, with node:http/https rather than fetch: getClaimStatus is a
// GET with a body (KI-17), and fetch refuses to send one. Header names are sent
// exactly as written here (accreditationNo, softwareCertificateId).
function send(httpMethod, method, { headers = {}, query, body } = {}) {
  const url = methodUrl(method, query);
  const allHeaders = { ...headers };
  let payload;
  if (body !== undefined) {
    // An object is sent as JSON. A string must already hold JSON text.
    payload = Buffer.from(typeof body === 'string' ? body : JSON.stringify(body), 'utf8');
    allHeaders['Content-Type'] = 'application/json'; // not specified by the DevKit (KI-42)
    allHeaders['Content-Length'] = payload.length;
  }
  const transport = url.protocol === 'http:' ? http : https;

  return new Promise((resolve, reject) => {
    const req = transport.request(url, { method: httpMethod, headers: allHeaders }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('error', reject);
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        let envelope;
        try {
          envelope = JSON.parse(text);
        } catch {
          envelope = undefined;
        }
        if (envelope === null || typeof envelope !== 'object' || Array.isArray(envelope)) {
          reject(new Error(`${method}: HTTP ${res.statusCode}, the response is not a JSON object: ${text.slice(0, 200)}`));
          return;
        }
        // Kept for error messages; not part of the JSON (non-enumerable).
        Object.defineProperty(envelope, 'httpStatus', { value: res.statusCode });
        Object.defineProperty(envelope, 'pecwsMethod', { value: method });
        resolve(envelope);
      });
    });
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error(`${method}: no response after ${TIMEOUT_MS / 1000} s`)));
    req.on('error', reject);
    req.end(payload);
  });
}

/**
 * Returns the envelope if `success` is exactly true. Otherwise throws an Error
 * with the server's `message`. Failure responses are undocumented (KI-42), so
 * the error also carries the HTTP status and the whole envelope.
 */
export function assertSuccess(envelope) {
  if (envelope?.success === true) return envelope;
  const where = envelope?.pecwsMethod ?? 'PECWS call';
  const status = envelope?.httpStatus ? ` (HTTP ${envelope.httpStatus})` : '';
  const err = new Error(`${where} failed${status}: ${envelope?.message || 'success is not true'}`);
  err.envelope = envelope;
  err.httpStatus = envelope?.httpStatus;
  throw err;
}

/** Calls getToken and returns the plain token string. */
export async function getToken() {
  const envelope = await send('GET', 'getToken', {
    headers: {
      accreditationNo: requireEnv('PHIC_FACILITY_PAN'),
      softwareCertificateId: requireEnv('PHIC_SOFTWARE_CERT_ID'), // plain value (KI-44)
    },
  });
  const { result } = assertSuccess(envelope);
  if (typeof result !== 'string' || result === '') throw new Error('getToken: result is not a token string');
  return result;
}

// Every call gets a fresh token right before it is sent: the token may last
// only 20 seconds (KI-26). There is no automatic retry, because retrying an
// upload could send the same claim twice (KI-62).

/** GET with optional query parameters. Returns the response envelope. */
export async function pecwsGet(method, query = {}) {
  const token = await getToken();
  return send('GET', method, { headers: { token }, query });
}

/** GET with a JSON body (getClaimStatus, KI-17). Returns the response envelope. */
export async function pecwsGetWithBody(method, body) {
  if (body === undefined) throw new Error(`${method}: a body is required`);
  const token = await getToken();
  return send('GET', method, { headers: { token }, body });
}

/** POST with a JSON body (an object, or a string of JSON). Returns the response envelope. */
export async function pecwsPost(method, body) {
  if (body === undefined) throw new Error(`${method}: a body is required`);
  const token = await getToken();
  return send('POST', method, { headers: { token }, body });
}

/**
 * Encrypts XML or JSON text with the cipher key (Annex A) and returns the
 * envelope object. docMimeType: 'text/xml' for XML; 'application/json' for
 * JSON, or 'text/xml' if the test server rejects it (KI-25).
 */
export function seal(plaintext, docMimeType) {
  return encryptPayload(plaintext, requireEnv('PECWS_CIPHER_KEY'), docMimeType);
}

/** Decrypts an envelope with the cipher key and returns the text. Throws if the hash doesn't match. */
export function unseal(envelope) {
  return decryptPayload(envelope, requireEnv('PECWS_CIPHER_KEY')).text;
}

// Command line: node pecws-client.mjs smoketest
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === 'smoketest') {
    try {
      const { result } = assertSuccess(await pecwsGet('getServerVersion'));
      console.log(`getToken OK; getServerVersion: ${result}`);
    } catch (err) {
      console.error(err.message);
      process.exit(1);
    }
  } else {
    console.error('Usage: node pecws-client.mjs smoketest');
    process.exit(2);
  }
}
