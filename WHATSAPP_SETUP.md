# WhatsApp OTP Setup — Shivrudra Taxi

> **Fast path (recommended): Renflair gateway.** The site now sends OTPs through
> Renflair's WhatsApp OTP API (`https://renflair.in/wp-otp.php`, ~₹0.12/message).
> You only need **one** env var — no Meta app, token, or template approval needed.
>
> 1. Get your API key from the Renflair dashboard (WP OTP section).
> 2. Vercel → Project → Settings → Environment Variables → add
>    `RENFLAIR_API_KEY` = your key. Apply to Production + Preview.
> 3. **Redeploy** so the serverless functions pick it up.
> 4. Test: open `/book`, enter your own WhatsApp number, tap **Verify OTP**.
>    You should receive the OTP on WhatsApp within seconds.
> 5. Top up / monitor balance in the Renflair dashboard (each OTP ≈ ₹0.12).
>
> Notes:
> - Keep the key **only** in Vercel env vars (and `.env.local` for local `vercel dev`);
>   `.env*` is gitignored so it never lands in the repo. If a key is ever shared
>   publicly, regenerate it in the Renflair dashboard.
> - If the gateway rejects a send, the API returns a clear error and **never**
>   exposes the OTP. The on-screen demo OTP only appears when *no* channel is
>   configured (local/dev convenience).
>
> The Meta Cloud API path below remains as a free/self-hosted alternative.

This guide turns the booking funnel's **test-mode OTP** into real WhatsApp OTPs.
The code side is already done (`api/send-whatsapp-otp.js` + `api/verify-whatsapp-otp.js`);
you only need to create the Meta app, get credentials, approve a template, and add
4 environment variables in Vercel.

---

## 1. Prerequisites

- A Facebook account you can use for business.
- A phone number to send OTPs **from** that is **not** already registered on WhatsApp /
  WhatsApp Business (you can use a second SIM or a virtual number). Call it the *sender number*.
- Ideally a verified business on [business.facebook.com](https://business.facebook.com)
  (needed for higher limits and a permanent token; you can start in test mode without it).

---

## 2. Create the app + add WhatsApp

1. Go to <https://developers.facebook.com/apps> → **Create app**.
2. App type: **Business**. Give it a name (e.g. "Shivrudra Taxi Booking").
3. In the app dashboard, find **WhatsApp** → **Set up**.
4. You get a **test sender number** immediately (good for testing to up to 5 verified recipients).

## 3. Add your own sender number

1. WhatsApp → **API Setup** → **Add phone number**.
2. Enter a display name (must follow Meta naming rules, e.g. "Shivrudra Taxi") and the sender number.
3. Verify it by SMS/call. Note down its **Phone number ID** (not the phone number itself).

## 4. Create a permanent access token (important)

The token shown on the API Setup page is **temporary (24h)**. For production:

1. [business.facebook.com](https://business.facebook.com) → **Business Settings** →
   **Users → System users** → **Add** (role: Admin).
2. With the system user selected → **Add assets** → **Apps** → your app → enable
   **Manage app** + **WhatsApp Management** (or assign the WhatsApp account).
3. Click **Generate new token** → select your app → scopes:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Token expiry: **Never**. Copy it — this is `WHATSAPP_TOKEN`.

## 5. Create & approve the OTP template

1. App dashboard → **WhatsApp → Message templates → Create template**.
2. **Category: Authentication** (required for OTP templates — this gives the one-tap
   "Copy code" button and is priced as authentication).
3. **Name:** `otp_verification` (or any name; must match `WHATSAPP_OTP_TEMPLATE`).
4. **Language:** English (US) → `en_US` (must match `WHATSAPP_OTP_LANG`).
5. **Body** (with one variable):
   ```
   {{1}} is your Shivrudra Taxi verification code. Do not share it with anyone.
   ```
   Meta will add the **Copy code** button automatically for authentication templates.
6. Submit. Approval usually takes a few minutes to 24 hours.

> If Meta rejects the name "otp_verification", pick another like `shivrudra_otp`
> and set `WHATSAPP_OTP_TEMPLATE` to match.

## 6. Add billing

WhatsApp Manager → **Account tools → Billing / Payment settings** → add a card or
UPI. Authentication conversations in India are charged per message (see Meta's latest
pricing). Without a payment method, sending fails after the free test allowance.

## 7. Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Value | Notes |
|---|---|---|
| `WHATSAPP_TOKEN` | permanent system-user token | required |
| `WHATSAPP_PHONE_ID` | Phone number ID from step 3 | required |
| `WHATSAPP_OTP_TEMPLATE` | `otp_verification` | must match the approved template name |
| `WHATSAPP_OTP_LANG` | `en_US` | must match the approved template language |
| `WHATSAPP_OTP_BUTTON` | `true` | set `false` only if the template has no copy-code button |

Optional fallbacks already supported by the code (use if you prefer SMS as backup):

| Variable | Purpose |
|---|---|
| `FAST2SMS_API_KEY` | India SMS fallback |
| `TWOFACTOR_API_KEY` | 2Factor.in SMS fallback |
| `CUSTOM_OTP_API_URL` | Your own gateway (receives `{phone, otp, name}`) |
| `OTP_SECRET` | HMAC secret for OTP tokens (defaults to a built-in value — set your own in production) |

After adding variables, **redeploy** so the serverless functions pick them up.

## 8. Test

With env vars set, open any booking, enter a name + a real WhatsApp number, and tap
**Verify OTP**. You should receive the template message on WhatsApp.

To test the API directly:

```powershell
curl -X POST https://your-domain/api/send-whatsapp-otp `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","phone":"9876543210"}'
```

- Success → `{ "success": true, "channel": "whatsapp", ... }` (no `testOtp`).
- If Meta is configured but the send fails, the API now returns a `4xx/5xx` error with
  Meta's reason **instead of** leaking the OTP (good — the old behaviour leaked it).

## 9. Behaviour in the funnel

- No env vars → **test mode**: the OTP is shown on screen so you can build/demo.
- Env vars set → real WhatsApp message; the on-screen demo notice disappears.
- After the customer verifies, the site creates a **lightweight account** (name + phone +
  verified flag) and remembers it for the next booking — no password, no login wall.

## 10. If you'd rather not run the API yourself

Instead of Meta Cloud API directly, a Business Solution Provider (BSP) can manage the
template + token for you: **AiSensy, Interakt, Gupshup, Wati**. They all expose a simple
"send OTP" REST call. If you choose one, point `CUSTOM_OTP_API_URL` at a small proxy
function that calls the BSP with your key — no other code changes needed.

---

### Quick checklist

- [ ] App created, WhatsApp added
- [ ] Sender number verified → Phone number ID noted
- [ ] System-user permanent token generated
- [ ] Authentication template `otp_verification` (en_US) approved
- [ ] Billing method added
- [ ] 5 Vercel env vars set
- [ ] Redeployed
- [ ] Real WhatsApp OTP received
