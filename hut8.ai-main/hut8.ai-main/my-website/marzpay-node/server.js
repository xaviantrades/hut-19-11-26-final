// MarzPay Uganda mobile-money API — Node.js version (run from the VS Code terminal).
//
// This is a 1:1 port of the Cloudflare Worker. Routes, status codes and JSON
// shapes are byte-for-byte the same, so the existing frontend keeps working —
// the ONLY frontend change is API_BASE (see README.md).
//
// What replaced the Worker-specific pieces:
//   env.MARZPAY_API_KEY / env.MARZPAY_API_SECRET -> hardcoded constants below
//   env.ALLOWED_ORIGIN                           -> hardcoded constant below
//   env.PAYMENTS_KV (KV namespace)               -> tiny file store in ./.kv
//                                                   (same 86_400s TTL behaviour)
//   export default { fetch(req, env) }           -> node:http request router
//
// Requires Node 18+ (global fetch). Tested on Node 22.

'use strict';

const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

// ===========================================================================
// CONFIG — hardcoded, as requested. Paste your real keys here.
// ===========================================================================
const MARZPAY_API_KEY = 'PASTE_YOUR_MARZPAY_API_KEY_HERE';
const MARZPAY_API_SECRET = 'PASTE_YOUR_MARZPAY_API_SECRET_HERE';

// Same as the Worker's ALLOWED_ORIGIN var. '*' lets any page (localhost:10000,
// file://, live-server, etc.) call this API. Set it to your exact origin later.
const ALLOWED_ORIGIN = '*';

const PORT = Number(process.env.PORT || 8787);
const HOST = '0.0.0.0';

const BASE = 'https://wallet.wearemarz.com/api/v1';

// MarzPay sends the webhook here. For local testing change it to your tunnel,
// e.g. 'https://your-id.ngrok-free.app/webhooks/marzpay'.
// (If it stays unreachable the payment still settles, because /payment-status
// re-checks MarzPay directly — same as the Worker.)
const CALLBACK_URL = 'https://marzpay-api.investinginaionline.workers.dev/webhooks/marzpay';

const KV_DIR = path.join(__dirname, '.kv');
const KV_TTL_SECONDS = 86400; // identical to the Worker's expirationTtl

// ===========================================================================
// Response helpers (same output as the Worker's ok() / cors())
// ===========================================================================
function jsonResponse(data, status, headers = {}) {
  return {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data)
  };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// ===========================================================================
// PAYMENTS_KV replacement: one JSON file per reference, with the same TTL.
// get()  -> returns the stored object, or null when missing/expired
// put()  -> stores it with expirationTtl (defaults to 24h)
// ===========================================================================
const kv = {
  file(reference) {
    return path.join(KV_DIR, encodeURIComponent(reference) + '.json');
  },

  async get(reference) {
    const file = kv.file(reference);

    try {
      const record = JSON.parse(await fs.readFile(file, 'utf8'));
      const value = record && typeof record === 'object' && 'value' in record ? record.value : null;

      if (!value) return null;

      if (record.expiresAt && Date.now() > record.expiresAt) {
        await fs.unlink(file).catch(() => {});
        return null;
      }

      return value;
    } catch {
      return null; // missing key -> null, exactly like KV.get()
    }
  },

  async put(reference, value, options = {}) {
    await fs.mkdir(KV_DIR, { recursive: true });

    const ttl = options.expirationTtl ?? KV_TTL_SECONDS;
    const record = {
      value,
      expiresAt: ttl ? Date.now() + ttl * 1000 : null
    };

    await fs.writeFile(kv.file(reference), JSON.stringify(record));
  }
};

// ===========================================================================
// Shared business logic — copied verbatim from the Worker
// ===========================================================================
function phone(v) {
  if (typeof v !== 'string') return null;
  let p = v.trim().replace(/[\s()-]/g, '');
  if (/^0\d{9}$/.test(p)) p = '+256' + p.slice(1);
  if (/^256\d{9}$/.test(p)) p = '+' + p;
  return /^\+2567\d{8}$/.test(p) ? p : null;
}

function meta(a, k) {
  if (!Array.isArray(a)) return null;
  const x = a.find(i => i && Object.prototype.hasOwnProperty.call(i, k));
  return x ? x[k] : null;
}

function status(s, e) {
  s = String(s || '').toLowerCase();
  e = String(e || '').toLowerCase();
  if (e === 'collection.completed' || s === 'completed' || s === 'successful') return 'paid';
  if (e === 'collection.failed' || s === 'failed') return 'failed';
  if (e === 'collection.cancelled' || s === 'cancelled') return 'cancelled';
  return 'processing';
}

function credentialsConfigured() {
  return (
    Boolean(MARZPAY_API_KEY && MARZPAY_API_SECRET) &&
    !MARZPAY_API_KEY.includes('PASTE_YOUR') &&
    !MARZPAY_API_SECRET.includes('PASTE_YOUR')
  );
}

function basicAuth() {
  // Same value btoa(`${key}:${secret}`) produced in the Worker.
  return 'Basic ' + Buffer.from(`${MARZPAY_API_KEY}:${MARZPAY_API_SECRET}`, 'utf8').toString('base64');
}

// Read + parse the request body. Throws on non-JSON, like req.json() did.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// ---------------------------------------------------------------------------
// POST /collect-money
// ---------------------------------------------------------------------------
async function create(req, h) {
  if (!credentialsConfigured()) {
    return jsonResponse(
      { status: 'error', message: 'MarzPay API credentials are not configured.' },
      500,
      h
    );
  }

  let b;
  try {
    b = await readJsonBody(req);
  } catch {
    return jsonResponse({ status: 'error', message: 'Invalid JSON.' }, 400, h);
  }

  const amount = Number(b.amount);
  const userId = String(b.userId || '').trim();
  const p = phone(b.phone || b.phone_number);

  if (!userId) return jsonResponse({ status: 'error', message: 'Missing userId.' }, 400, h);
  if (!Number.isInteger(amount) || amount < 500 || amount > 10000000) {
    return jsonResponse(
      { status: 'error', message: 'Amount must be between UGX 500 and UGX 10,000,000.' },
      400,
      h
    );
  }
  if (!p) {
    return jsonResponse(
      {
        status: 'error',
        message: 'Enter a valid Ugandan mobile number in E.164 or 0XXXXXXXXX form.'
      },
      400,
      h
    );
  }

  const reference = crypto.randomUUID();

  const local = {
    reference,
    userId,
    amount,
    currency: 'UGX',
    phone: p,
    status: 'processing',
    transactionUuid: null,
    provider: null,
    providerTransactionId: null,
    createdAt: new Date().toISOString()
  };

  await kv.put(reference, local);

  const mr = {
    amount,
    phone_number: p,
    reference,
    country: 'UG',
    description: `Website deposit - ${userId}`.slice(0, 255),
    callback_url: CALLBACK_URL,
    metadata: [{ userId }]
  };

  let r;
  let body;

  try {
    r = await fetch(BASE + '/collect-money', {
      method: 'POST',
      headers: {
        Authorization: basicAuth(),
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mr)
    });
    body = await r.json();
  } catch {
    await kv.put(reference, { ...local, status: 'failed' });
    return jsonResponse({ status: 'error', message: 'Could not connect to MarzPay.' }, 502, h);
  }

  if (!r.ok || body.status !== 'success') {
    await kv.put(reference, { ...local, status: 'failed', marzpayResponse: body });
    return jsonResponse(body, r.status || 502, h);
  }

  const t = body?.data?.transaction || {};
  const c = body?.data?.collection || {};

  await kv.put(reference, {
    ...local,
    status: t.status || 'processing',
    transactionUuid: t.uuid || null,
    provider: c.provider || null,
    marzpayResponse: body,
    updatedAt: new Date().toISOString()
  });

  return jsonResponse(body, r.status || 201, h);
}

// ---------------------------------------------------------------------------
// POST /webhooks/marzpay
// ---------------------------------------------------------------------------
async function webhook(req, h) {
  let p;
  try {
    p = await readJsonBody(req);
  } catch {
    return jsonResponse({ status: 'error', message: 'Invalid webhook JSON.' }, 400, h);
  }

  const d = p?.data?.transaction ? p : p; // (kept identical to the Worker)
  const ev = d?.event_type || '';
  const t = d?.transaction || {};
  const c = d?.collection || {};
  const m = d?.metadata || [];
  const ref = t.reference || '';

  if (!ref) {
    return jsonResponse(
      { status: 'error', message: 'Webhook does not contain transaction.reference.' },
      400,
      h
    );
  }

  const old = await kv.get(ref);

  if (!old) {
    return jsonResponse(
      { status: 'success', message: 'Webhook received; reference not found locally.' },
      200,
      h
    );
  }

  let st = status(t.status, ev);
  if (old.status === 'paid') st = 'paid';

  const updated = {
    ...old,
    status: st,
    transactionUuid: t.uuid || old.transactionUuid,
    provider: c.provider || t.provider || old.provider,
    providerTransactionId: c.provider_transaction_id || old.providerTransactionId,
    userId: old.userId || meta(m, 'userId'),
    lastEventType: ev,
    webhookReceivedAt: new Date().toISOString(),
    webhookPayload: p,
    updatedAt: new Date().toISOString()
  };

  await kv.put(ref, updated);

  return jsonResponse({ status: 'success', message: 'Webhook received.' }, 200, h);
}

// ---------------------------------------------------------------------------
// MarzPay "get collection" call used by /payment-status
// ---------------------------------------------------------------------------
async function remote(uuid) {
  try {
    const r = await fetch(BASE + '/collect-money/' + encodeURIComponent(uuid), {
      headers: { Authorization: basicAuth(), Accept: 'application/json' }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GET /payment-status/:reference
// ---------------------------------------------------------------------------
async function stat(reference, h) {
  if (!reference) {
    return jsonResponse({ status: 'error', message: 'Reference is required.' }, 400, h);
  }

  let x = await kv.get(reference);

  if (!x) {
    return jsonResponse({ status: 'error', message: 'Payment not found.' }, 404, h);
  }

  if (x.status === 'processing' && x.transactionUuid) {
    const r = await remote(x.transactionUuid);
    const t = r?.data?.transaction || r?.transaction || {};
    const c = r?.data?.collection || r?.collection || {};

    if (t.status) {
      x = {
        ...x,
        status: status(t.status, ''),
        transactionUuid: t.uuid || x.transactionUuid,
        provider: c.provider || t.provider || x.provider,
        providerTransactionId: c.provider_transaction_id || x.providerTransactionId,
        updatedAt: new Date().toISOString()
      };

      await kv.put(reference, x);
    }
  }

  return jsonResponse(
    {
      status: 'success',
      data: {
        reference: x.reference,
        userId: x.userId,
        amount: x.amount,
        currency: x.currency,
        phone: x.phone,
        status: x.status,
        provider: x.provider,
        transactionUuid: x.transactionUuid,
        providerTransactionId: x.providerTransactionId || null
      }
    },
    200,
    h
  );
}

// ===========================================================================
// Router — same endpoints, same order, same fallbacks as the Worker
// ===========================================================================
const server = http.createServer(async (req, res) => {
  const h = corsHeaders();
  let out;

  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    console.log(`${req.method} ${pathname}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, h);
      res.end();
      return;
    }

    if (req.method === 'GET' && pathname === '/') {
      out = jsonResponse(
        { status: 'success', message: 'MarzPay API Worker is running' },
        200,
        h
      );
    } else if (req.method === 'GET' && pathname === '/health') {
      out = jsonResponse(
        {
          status: 'success',
          marzpayConfigured: credentialsConfigured(),
          kvConfigured: true
        },
        200,
        h
      );
    } else if (req.method === 'POST' && pathname === '/collect-money') {
      out = await create(req, h);
    } else if (req.method === 'POST' && pathname === '/webhooks/marzpay') {
      out = await webhook(req, h);
    } else if (req.method === 'GET' && pathname.startsWith('/payment-status/')) {
      out = await stat(decodeURIComponent(pathname.slice(16)), h);
    } else {
      out = jsonResponse({ status: 'error', message: 'Endpoint not found.' }, 404, h);
    }
  } catch (err) {
    console.error('Unhandled error:', err);
    out = jsonResponse({ status: 'error', message: 'Internal server error.' }, 500, h);
  }

  res.writeHead(out.status, out.headers);
  res.end(out.body);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('MarzPay API (Node.js)');
  console.log(`  Listening on   http://localhost:${PORT}`);
  console.log(`  Health check   http://localhost:${PORT}/health`);
  console.log(`  MarzPay keys   ${credentialsConfigured() ? 'configured' : 'NOT configured — edit server.js'}`);
  console.log(`  KV folder      ${KV_DIR}`);
  console.log(`  Callback URL   ${CALLBACK_URL}`);
  console.log('');
});
