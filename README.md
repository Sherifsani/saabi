# SAABI — The Engine of the Informal Economy

> **Nomba Hackathon 2026 submission — Team Starlight**

SAABI is a WhatsApp-native fintech that brings **zero-install digital payments,
service discovery, and wallet funding** to Nigeria's informal traders — built
entirely on top of **Nomba's** payout, virtual-account, and collection APIs.

- **Live site:** https://saabi.netlify.app
- **Live API:** https://saabi-juox.onrender.com  (`/docs` for the OpenAPI spec)
- **WhatsApp bot (Twilio sandbox):** send `join discussion-shot` to `+1 415 523 8886`, then chat.

---

## The Problem

Over **40 million** Nigerians work in the informal economy — traders, artisans,
service workers — and most are shut out of formal financial tooling:

1. **Payments are hard.** Sending or receiving money means bank apps, data,
   smartphones, and literacy barriers. Many traders only reliably use WhatsApp.
2. **Providers are invisible.** Finding a trusted plumber, tailor, or food
   vendor nearby happens by word of mouth, with no reputation or discovery layer.
3. **Institutions are blind.** Revenue services and lenders have no visibility
   into informal cashflow, so credit and policy never reach these traders.

## The Solution

SAABI meets users where they already are — **WhatsApp** — and uses Nomba as the
money rails underneath. Four capabilities, one conversational interface:

| Capability | How it works |
| --- | --- |
| **Send money** | "send 2500 to 0123456789 gtbank" → recipient name check → confirm with a PIN → real bank transfer via Nomba. |
| **Fund wallet** | "fund" → we mint a dedicated **Nomba virtual account**; any transfer into it credits the wallet instantly. |
| **Find a service** | "find a plumber in Yaba" → searches our provider network and replies with ranked matches. |
| **Register a service** | "register me as a tailor in Ikeja, 5000/hr" → lists the user as a discoverable provider. |

A React web dashboard adds a visual layer (transfers, virtual accounts,
checkout, provider search) for users who do have a browser.

---

## Using the WhatsApp bot

Connect first (Twilio sandbox): from WhatsApp, send `join discussion-shot` to
**+1 415 523 8886**. Then message the bot — it understands natural language, and
these are the recognized commands:

| Send this | What it does | Also understands |
| --- | --- | --- |
| `hi` | Greeting + intro | `hello`, `how far`, `hey` |
| `help` | Show the command menu | `menu`, `?`, `commands` |
| `balance` | Show your wallet balance | `bal`, `wallet` |
| `fund` | Get your Nomba virtual account number to top up | `top up`, `add money`, `deposit` |
| `send 2500 to 0123456789 gtbank` | Start a transfer — verifies the payee name, then asks for your PIN | `pay`, `transfer`, `wire`, `remit` |
| *your PIN* | Confirm the pending transfer (4–8 chars, **within 10 minutes**) | — |
| `cancel` | Cancel a pending transfer | `stop`, `abort` |
| `status` | Show your recent transactions | `recent`, `history`, `last` |
| `find a plumber in Yaba` | Search for service providers near a location | `looking for`, `need a`, `who can` |
| `register me as a tailor in Ikeja, 5000/hr` | List yourself as a discoverable provider | `i'm a`, `sign me up`, `list me` |

**How messages are understood:** amounts and 10-digit account numbers are parsed
with deterministic **regex** (never an LLM, so money values can't be
hallucinated); fuzzy phrasing for discovery/registration is resolved by
**Gemini**, with a regex keyword fallback. A payment is a **two-step confirm**:
the bot echoes the verified recipient, and only sends after you reply with your
Payment Confirmation Token (PCT).

Only **registered, verified** numbers can transact — new users onboard on the
web portal (phone OTP + Nomba bank-name match) before the bot will act for them.

---

## Nomba Integration

### Ledger architecture

Nomba holds a single **merchant-pool ledger** (our business account). SAABI
overlays a **per-user virtual `Wallet`** on top of it — Nomba has no notion of
our individual users. The invariant we preserve at all times:

```
Σ(user wallet balances)  ≤  Nomba merchant-ledger balance
```

Wallet balance is **only ever minted** by a signature-verified Nomba
`payment_success` webhook, and only ever debited **after** Nomba accepts a
payout. We never trust a balance change Nomba hasn't confirmed.

### Authentication

- OAuth2 **client-credentials** against `POST /v1/auth/token/issue`.
- Access tokens (~30 min TTL) are **cached process-wide and refreshed lazily**
  5 minutes before expiry, behind an async lock (`app/services/nomba.py`).
- Every call sends the **parent `accountId`** header; our sub-account id is
  carried in config for scoping.

### Nomba APIs used

| Nomba endpoint | Method | What SAABI uses it for | Code |
| --- | --- | --- | --- |
| `/v1/auth/token/issue` | POST | Obtain & refresh the bearer token | `nomba._auth_headers` |
| `/v1/transfers/banks` | GET | Fetch the official bank-code list that drives name→code resolution | `services/banks.py` |
| `/v1/transfers/bank/lookup` | POST | Verify a recipient's account name — at registration (identity match) and before every transfer | `nomba.lookup_bank_account` |
| `/v2/transfers/bank` | POST | Outbound bank transfer (send money); `merchantTxRef` is our idempotency key | `nomba.transfer` → `payments.confirm` |
| `/v1/accounts/virtual` | POST | Create static (wallet funding) and dynamic (one-off collection) virtual accounts | `nomba.create_virtual_account` → `funding.ensure_virtual_account` |
| `/v1/checkout/order` | POST | Hosted card/USSD/transfer checkout link for the web dashboard | `nomba.create_checkout_order` → `routers/nomba_api.py` |
| **Webhooks (inbound)** | POST | `payment_success` → credit wallet; `payout_success` / `payout_failed` / `payout_refund` → reconcile & refund | `routers/webhooks.py` |

### Money flows

**Send money (WhatsApp):** parse intent → `bank/lookup` to confirm the payee →
fraud screen → hold funds pending a PIN → on PIN, `/v2/transfers/bank` → debit
the wallet → the `payout_*` webhook later confirms or reverses.

**Fund wallet (WhatsApp):** `/v1/accounts/virtual` mints the user a permanent
account number → user transfers into it from any bank → Nomba fires a signed
`payment_success` → we credit the wallet exactly once and send a WhatsApp
confirmation.

### Webhook security

Nomba signs each webhook with **HMAC-SHA256 (Base64)** over a colon-delimited
string of nine fields — `event_type`, `requestId`, `data.merchant.userId`,
`data.merchant.walletId`, `data.transaction.transactionId`, `.type`, `.time`,
`.responseCode`, and the **`nomba-timestamp` header**. We recompute it with our
signing key and compare in constant time before trusting a single byte
(`nomba.verify_webhook_signature`). This matters most for the funding path,
which mints balance. Credits are idempotent on Nomba's `transactionId`.

---

## Other integrations

- **Twilio WhatsApp** — the entire user surface. Inbound messages hit
  `POST /webhooks/twilio/whatsapp`; OTP delivery uses Twilio Verify.
- **Google Gemini** — fuzzy intent classification and field extraction for
  discovery/registration. Money-moving values (amount, account number) stay on
  deterministic **regex** so they can never be hallucinated.
- **Neon** — serverless Postgres (SQLAlchemy + Alembic).

## Architecture

```
WhatsApp  ──Twilio──▶  FastAPI  ──▶  intent parser (regex + Gemini)
                          │
                          ├─▶  payments / funding / discovery services
                          │          │
                          │          ▼
                          │        Nomba API  (auth · lookup · transfer · virtual accounts · checkout)
                          │          ▲
                          └─▶  Nomba webhooks ──▶ verify signature ──▶ credit / reconcile wallet
                          │
                          ▼
                    Neon Postgres (users · wallets · transactions · fundings · workers)
```

## Tech stack

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, httpx, Celery/Redis, Twilio, google-genai
- **Database:** Neon (serverless Postgres)
- **Frontend:** React 19, TypeScript, Tailwind 4, Three.js, Chart.js
- **Infra:** Docker, Render (API), Netlify (web)

## Repository layout

| Path | What |
| --- | --- |
| `saabi-api/` | FastAPI backend + Nomba integration — see [saabi-api/README.md](saabi-api/README.md) for setup |
| `saabi-ui/` | React web dashboard — see [saabi-ui/README.md](saabi-ui/README.md) |
| `render.yaml` | Render Blueprint for deploying the API |

---

## Team Starlight

| Member | Role | GitHub |
| -------- | ------ | -------- |
| @C-J7 | UI/UX Designer, Fullstack Dev | [github.com/c-j7](https://github.com/c-j7) |
| @Uwana-a | Technical PM | [github.com/Uwana-a](https://github.com/Uwana-a) |
| @dev-xero | ML, Backend Dev | [github.com/dev-xero](https://github.com/dev-xero) |
| @okikday | Mobile Dev, WhatsApp Integrator | [github.com/okikday](https://github.com/okikday) |
