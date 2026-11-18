import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto as crypto } from 'node:crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const messageAad = encoder.encode('SORAOTP|PUBLIC-CHAT|GLOBAL|MESSAGE|V1');

async function deriveEnvelopeKey(privateKey, peerPublicKey, localDeviceId, peerDeviceId) {
  const sharedBits = await crypto.subtle.deriveBits(
    { name: 'ECDH', public: peerPublicKey }, privateKey, 256,
  );
  const material = await crypto.subtle.importKey('raw', sharedBits, 'HKDF', false, ['deriveKey']);
  const pair = [String(localDeviceId), String(peerDeviceId)].sort().join('|');
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF', hash: 'SHA-256',
      salt: encoder.encode('SORAOTP|CHAT-KEY-WRAP|V1'), info: encoder.encode(pair),
    }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'],
  );
}

test('ECDH + HKDF derives the same device-to-device wrapping key', async () => {
  const alice = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const bob = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits']);
  const a = await deriveEnvelopeKey(alice.privateKey, bob.publicKey, 'alice-device', 'bob-device');
  const b = await deriveEnvelopeKey(bob.privateKey, alice.publicKey, 'bob-device', 'alice-device');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const sample = encoder.encode('room key test');
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, a, sample);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, b, ciphertext);
  assert.equal(decoder.decode(plaintext), 'room key test');
});

test('AES-256-GCM message encryption round-trips Unicode content', async () => {
  const roomKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const message = 'Halo SoraOTP 🔐 — pesan rahasia';
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: messageAad }, roomKey, encoder.encode(message));
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: messageAad }, roomKey, ciphertext);
  assert.equal(decoder.decode(plaintext), message);
});

test('AES-GCM rejects modified ciphertext', async () => {
  const roomKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: messageAad }, roomKey, encoder.encode('must be authenticated')));
  ciphertext[0] ^= 1;
  await assert.rejects(() => crypto.subtle.decrypt({ name: 'AES-GCM', iv, additionalData: messageAad }, roomKey, ciphertext));
});
