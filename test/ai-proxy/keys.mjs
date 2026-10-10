// makes a test signing key and DBK1 keys in the same format as issueLicense in seo-worker.js
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ', EPOCH = Date.UTC(2026, 0, 1);
const b32 = (bytes) => { let o = '', bits = 0, v = 0; for (const b of bytes) { v = (v << 8) | b; bits += 8; while (bits >= 5) { o += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } v &= (1 << bits) - 1; } if (bits) o += B32[(v << (5 - bits)) & 31]; return o; };
const kp = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
const jwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
const day = Math.floor((Date.now() - EPOCH) / 86400000);
async function key(tier, name, exp) {
  const nb = new TextEncoder().encode(name), p = new Uint8Array(12 + nb.length);
  p[0] = 1; p[1] = tier === 'P' ? 0x50 : 0x46; p[2] = day >> 8; p[3] = day & 255; p[4] = (exp >> 8) & 255; p[5] = exp & 255;
  crypto.getRandomValues(p.subarray(6, 12)); p.set(nb, 12);
  const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, p));
  const all = new Uint8Array(p.length + 64); all.set(p); all.set(sig, p.length);
  return { key: 'DBK1-' + b32(all).match(/.{1,5}/g).join('-'), id: Buffer.from(p.subarray(6, 12)).toString('hex') };
}
const out = { pro: await key('P', 'Pro User', day + 300), free: await key('F', 'Free User', 0), expired: await key('P', 'Old User', day - 2), blocked: await key('P', 'Refund User', day + 300) };
fs.writeFileSync(new URL('keys.json', import.meta.url), JSON.stringify(out, null, 1));
fs.writeFileSync(new URL('../../.dev.vars', import.meta.url), "LICENSE_PRIVATE_KEY='" + JSON.stringify(jwk) + "'" + '\nANTHROPIC_API_KEY=test-key\nANTHROPIC_BASE_URL=http://127.0.0.1:8799\nADDINS_ADMIN_KEY=admin-key-for-local-test-only-1234\nAI_FREE_PER_DAY=2\n');
