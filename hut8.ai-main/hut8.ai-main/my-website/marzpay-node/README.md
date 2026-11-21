# MarzPay API — Node.js version

A drop-in Node.js port of the Cloudflare Worker (`marzpay working former.txt`), built to run
from the VS Code terminal. Same routes, same JSON, same status codes — the frontend keeps
working after **one** change (`API_BASE`).

No dependencies. Node 18+ required (uses the global `fetch`); tested on Node 22.

---

## 1. Quick start

```bash
cd hut8.ai-main/hut8.ai-main/my-website/marzpay-node
npm start          # or:  node server.js
```

It prints:

```
MarzPay API (Node.js)
  Listening on   http://localhost:8787
  Health check   http://localhost:8787/health
  MarzPay keys   NOT configured — edit server.js
  KV folder      .../marzpay-node/.kv
  Callback URL   https://marzpay-api.investinginaionline.workers.dev/webhooks/marzpay
```

Open <http://localhost:8787/health> in a browser. `marzpayConfigured: true` means the keys
below are filled in.

Run `node test.js` any time to check all 12 route behaviours (no MarzPay account needed).

---

## 2. Put your API keys in

Open `server.js` and edit the block at the top:

```js
const MARZPAY_API_KEY    = 'PASTE_YOUR_MARZPAY_API_KEY_HERE';
const MARZPAY_API_SECRET = 'PASTE_YOUR_MARZPAY_API_SECRET_HERE';
const ALLOWED_ORIGIN     = '*';        // was env.ALLOWED_ORIGIN
const PORT               = 8787;        // process.env.PORT || 8787
```

Restart the server (`Ctrl+C`, then `npm start`). `/health` must show
`"marzpayConfigured": true` — otherwise `/collect-money` answers
`"MarzPay API credentials are not configured."` (same as the Worker).

Other settings in the same file:

| Worker `env` | Node replacement | Notes |
|---|---|---|
| `MARZPAY_API_KEY` | `MARZPAY_API_KEY` const | hardcoded, as requested |
| `MARZPAY_API_SECRET` | `MARZPAY_API_SECRET` const | hardcoded, as requested |
| `ALLOWED_ORIGIN` | `ALLOWED_ORIGIN` const | `'*'` = allow any page |
| `PAYMENTS_KV` | `./.kv` folder | one JSON file per reference, 24 h TTL (same `expirationTtl: 86400`) |
| `callback_url` (hardcoded) | `CALLBACK_URL` const | see §4 |

---

## 3. What to change in the frontend (only this)

In `protected/firestoreadminlogic.js` around **line 282**:

```js
// before
const API_BASE = 'https://marzpay-api.investinginaionline.workers.dev';

// after — local Node server
const API_BASE = 'http://localhost:8787';
```

That is the whole frontend change. Nothing else is touched:

- `fetch(API_BASE + '/collect-money', { POST, { userId, phone, amount } })` → unchanged
- `fetch(API_BASE + '/payment-status/' + ref)` → unchanged
- it still reads `d.data.transaction.reference`, `d.data.transaction.status`,
  `d.data.status`, `d.data.reference` → unchanged
- the paid/failed/cancelled/processing values are identical
- CORS is still answered (including the `OPTIONS` preflight), so a page served from
  `localhost:10000`, Live Server, or `file://` can call it

If your page is served over **https** (e.g. a deployed site or an https tunnel), a browser
will block calls to `http://localhost:8787`. In that case run an https tunnel and use its URL:

```bash
npx localtunnel --port 8787      # or: ngrok http 8787
# then: const API_BASE = 'https://your-tunnel-url';
```

---

## 4. Webhooks (the one thing that needs you)

The Worker's webhook lived at
`https://marzpay-api.investinginaionline.workers.dev/webhooks/marzpay`, which MarzPay cannot
reach once you run locally. Change `CALLBACK_URL` in `server.js` to a tunnel that forwards to
`localhost:8787`:

```js
const CALLBACK_URL = 'https://your-id.ngrok-free.app/webhooks/marzpay';
```

You can point MarzPay at it in their dashboard, or just leave the worker URL in place — the
`/payment-status/:reference` endpoint re-checks MarzPay directly, so the frontend poller still
flips `processing → paid` within a few seconds without any webhook. That is exactly the
Worker's behaviour.

---

## 5. Routes (identical to the Worker)

| Method | Path | Behaviour |
|---|---|---|
| `GET` | `/` | `{"status":"success","message":"MarzPay API Worker is running"}` |
| `GET` | `/health` | `{"status":"success","marzpayConfigured":bool,"kvConfigured":true}` |
| `POST` | `/collect-money` | validates `userId` / `amount` 500–10,000,000 / UG phone → MarzPay `/collect-money`, result proxied + stored |
| `POST` | `/webhooks/marzpay` | updates the stored payment from the event (`paid` never downgrades) |
| `GET` | `/payment-status/:reference` | local record, re-checked against MarzPay while `processing` |
| `OPTIONS` | any | `204` + CORS headers |
| other | — | `404 {"status":"error","message":"Endpoint not found."}` |

Test with curl:

```bash
curl http://localhost:8787/health
curl -X POST http://localhost:8787/collect-money \
  -H 'Content-Type: application/json' \
  -d '{"userId":"USER_ID","phone":"0771234567","amount":1000}'
curl http://localhost:8787/payment-status/<reference>
```

The stored payment JSON is in `./.kv/<reference>.json` if you want to inspect it.

---

## 6. Deploying later

Nothing in `server.js` depends on Cloudflare. On a host (Render/Railway/VPS) set `PORT` via the
environment and keep the file on `0.0.0.0` (already done). Remember the keys are hardcoded, so
keep this file out of any public repo — for production move them to `process.env` and point
`ALLOWED_ORIGIN` at your real site origin.
