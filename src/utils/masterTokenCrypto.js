const PBKDF2_ITERATIONS = 250000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const KEY_LENGTH = 256;

function getRandomBytes(length) {
  const buf = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  }
  return buf;
}

function base64Encode(bytes) {
  const bin = String.fromCharCode(...bytes);
  return btoa(bin);
}

function base64Decode(str) {
  const bin = atob(str);
  return new Uint8Array([...bin].map((c) => c.charCodeAt(0)));
}

/**
 * Encrypt plaintext with password. Returns base64 string: salt.iv.ciphertext
 */
export async function encryptMasterToken(plaintext, password) {
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Web Crypto not available');
  const salt = getRandomBytes(SALT_LENGTH);
  const iv = getRandomBytes(IV_LENGTH);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    enc.encode(plaintext)
  );

  const saltB64 = base64Encode(salt);
  const ivB64 = base64Encode(iv);
  const ctB64 = base64Encode(new Uint8Array(ciphertext));
  return `${saltB64}.${ivB64}.${ctB64}`;
}

/**
 * Decrypt payload (base64 salt.iv.ciphertext) with password. Returns plaintext string.
 */
export async function decryptMasterToken(payload, password) {
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Web Crypto not available');
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error('Invalid payload');
  const [saltB64, ivB64, ctB64] = parts;
  const salt = base64Decode(saltB64);
  const iv = base64Decode(ivB64);
  const ciphertext = base64Decode(ctB64);

  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['decrypt']
  );

  const dec = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );

  return new TextDecoder().decode(dec);
}
