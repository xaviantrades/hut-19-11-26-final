// Quick smoke test for the Node port — no real MarzPay calls are required.
//
//   node test.js
//
// It starts the server (with throwaway API keys, copied to a temp folder so your
// real keys/hardcoded config in server.js are untouched) and checks that every
// route answers with exactly the same status codes and JSON the Worker produced.

'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert');

const PORT = 8799;
const root = __dirname;

// Throwaway copy with dummy keys so the auth/validation paths are exercised.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'marzpay-test-'));
const source = fs
  .readFileSync(path.join(root, 'server.js'), 'utf8')
  .replace("'PASTE_YOUR_MARZPAY_API_KEY_HERE'", "'test-key'")
  .replace("'PASTE_YOUR_MARZPAY_API_SECRET_HERE'", "'test-secret'")
  .replace('Number(process.env.PORT || 8787)', `Number(process.env.PORT || ${PORT})`)
  .replace("path.join(__dirname, '.kv')", `path.join(${JSON.stringify(tmp)}, '.kv')`);

fs.writeFileSync(path.join(tmp, 'server.js'), source);

const child = spawn(process.execPath, [path.join(tmp, 'server.js')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', () => {});
child.stderr.on('data', d => process.stderr.write(d));

const base = `http://127.0.0.1:${PORT}`;
let passed = 0;

async function check(name, fn) {
  await fn();
  passed++;
  console.log('ok   ' + name);
}

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      await fetch(base + '/');
      return;
    } catch {
      await new Promise(r => setTimeout(r, 100));
    }
  }
  throw new Error('server did not start');
}

const post = (p, body, raw = false) =>
  fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body)
  });

(async () => {
  try {
    await waitForServer();

    await check('GET /', async () => {
      const r = await fetch(base + '/');
      const d = await r.json();
      assert.equal(r.status, 200);
      assert.deepEqual(d, { status: 'success', message: 'MarzPay API Worker is running' });
      assert.equal(r.headers.get('access-control-allow-origin'), '*');
    });

    await check('GET /health', async () => {
      const r = await fetch(base + '/health');
      const d = await r.json();
      assert.equal(r.status, 200);
      assert.deepEqual(d, { status: 'success', marzpayConfigured: true, kvConfigured: true });
    });

    await check('OPTIONS preflight -> 204 + CORS', async () => {
      const r = await fetch(base + '/collect-money', { method: 'OPTIONS' });
      assert.equal(r.status, 204);
      assert.equal(r.headers.get('access-control-allow-methods'), 'GET,POST,OPTIONS');
      assert.equal(r.headers.get('access-control-allow-headers'), 'Content-Type');
    });

    await check('POST /collect-money invalid JSON -> 400', async () => {
      const r = await post('/collect-money', 'not-json{', true);
      assert.equal(r.status, 400);
      assert.deepEqual(await r.json(), { status: 'error', message: 'Invalid JSON.' });
    });

    await check('POST /collect-money missing userId -> 400', async () => {
      const r = await post('/collect-money', { phone: '0771234567', amount: 1000 });
      assert.equal(r.status, 400);
      assert.equal((await r.json()).message, 'Missing userId.');
    });

    await check('POST /collect-money bad amount -> 400', async () => {
      const r = await post('/collect-money', { userId: 'u1', phone: '0771234567', amount: 100 });
      assert.equal(r.status, 400);
      assert.equal((await r.json()).message, 'Amount must be between UGX 500 and UGX 10,000,000.');
    });

    await check('POST /collect-money bad phone -> 400', async () => {
      const r = await post('/collect-money', { userId: 'u1', phone: '12345', amount: 1000 });
      assert.equal(r.status, 400);
      assert.match((await r.json()).message, /valid Ugandan mobile number/);
    });

    await check('POST /collect-money valid input -> 502 (MarzPay unreachable offline)', async () => {
      const r = await post('/collect-money', { userId: 'u1', phone: '0771234567', amount: 1000 });
      assert.equal(r.status, 502);
      assert.deepEqual(await r.json(), {
        status: 'error',
        message: 'Could not connect to MarzPay.'
      });
    });

    await check('POST /webhooks/marzpay without reference -> 400', async () => {
      const r = await post('/webhooks/marzpay', { event_type: 'collection.completed' });
      assert.equal(r.status, 400);
      assert.equal(
        (await r.json()).message,
        'Webhook does not contain transaction.reference.'
      );
    });

    await check('POST /webhooks/marzpay unknown reference -> 200', async () => {
      const r = await post('/webhooks/marzpay', {
        event_type: 'collection.completed',
        transaction: { reference: 'does-not-exist', status: 'completed' }
      });
      assert.equal(r.status, 200);
      assert.equal((await r.json()).message, 'Webhook received; reference not found locally.');
    });

    await check('GET /payment-status/unknown -> 404', async () => {
      const r = await fetch(base + '/payment-status/nope');
      assert.equal(r.status, 404);
      assert.deepEqual(await r.json(), { status: 'error', message: 'Payment not found.' });
    });

    await check('unknown path -> 404', async () => {
      const r = await fetch(base + '/nope');
      assert.equal(r.status, 404);
      assert.deepEqual(await r.json(), { status: 'error', message: 'Endpoint not found.' });
    });

    console.log(`\n${passed} checks passed.`);
  } catch (err) {
    console.error('\nFAILED:', err.message);
    process.exitCode = 1;
  } finally {
    child.kill('SIGTERM');
    fs.rmSync(tmp, { recursive: true, force: true });
  }
})();
