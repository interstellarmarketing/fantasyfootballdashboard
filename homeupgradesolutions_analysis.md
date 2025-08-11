# Competitor HAR Analysis — **homeupgradesolutions.comv1.har**

## 1) Hidden API & Endpoint Detection

**Primary data APIs (client-visible)**  
- **Supabase (PostgREST):**  
  - `https://soipezeelqydxiezjzvi.supabase.co/rest/v1/leads?id=eq.<UUID>&select=*` — **PATCH**, many calls  
  - **Fields sent (examples across PATCHes):** `estimate_type ("roofing")`, `zip_code`, `estimate_options (JSON string e.g. {"roof_type":"cedar shake"})`, `property_type`, `first_name`, `last_name`, `email`, `phone`, `street_address`, `city`, `state`, `is_homeowner`, plus tracking/marketing fields `gclid`, `gbraid`, `fbp`, `fbc`, `fbclid`, `campaign_name`, `adset_name`, `ad_name`, `device_category`, `ip_address`, `landing_page` (full keyset seen ~60+ fields).  
  - **Suspected purpose:** Client writes each step into a single **lead row** (ID pinned by `?id=eq.<UUID>`). Backend will later pick it up server-side for routing/monetization.  
  - **Note:** Uses an **anon** Supabase key in headers (public; expected for browser writes).

- **TrustedForm (ActiveProspect):**  
  - `https://api.trustedform.com/certs` — **POST** → **201** (certificate created)  
  - `https://api.trustedform.com/certs/<cert_id>/activities` — **POST** → **204** (multiple)  
  - `https://api.trustedform.com/certs/<cert_id>/events` — **POST** → **204** (multiple)  
  - `https://api.trustedform.com/certs/<cert_id>/update` — **POST** → **204` (multiple)  
  - **Fields sent:** Activity/event metadata (TrustedForm standard; body obfuscated in HAR but pattern is canonical).  
  - **Suspected purpose:** Lead certification/consent proofing for compliance and resale.

**First-party “metrics” endpoints (likely proxies / obfuscation)**  
- `https://homeupgradesolutions.com/metrics/g/collect` — **GET** (many)  
  - **QS keys:** `v, tid, gtm, _p, gcs, gcd, npa, dma, …` → **GA4 shape**  
  - **Suspected purpose:** **Server-side GTM / GA4 proxy** on a **first-party path** to harden tracking/avoid blockers.

- `https://homeupgradesolutions.com/metrics/alxlcgxwu` — **GET/POST**  
  - **QS param `247cef2b` is Base64**; decodes to a GA4 collect path like:  
    `"/g/collect?v=2&tid=G-R2PMKTQZVK&…&en=page_view…"`  
  - **Suspected purpose:** Additional **GA4 cloaking/indirection** (encodes `/g/collect` in Base64) to reduce script/URL pattern detection.

**Other notable network**  
- **Google Places API (address capture):**  
  - `https://places.googleapis.com/$rpc/google.maps.places.v1.Places/AutocompleteSessionToken`, `/Autocomplete`, `/GetPlace` — **POST**  
  - **Purpose:** Address autocomplete & normalization.

- **Cloudflare instrumentation:**  
  - `https://homeupgradesolutions.com/cdn-cgi/zaraz/t` — **POST** (Zaraz SPA/page metrics)  
  - `https://homeupgradesolutions.com/cdn-cgi/rum` — **POST** (RUM/browser insights)

- **No GraphQL or batch multiplexers** spotted. No visible WebSockets.

---

## 2) Lead Data Collection & Routing Map

**Observed field capture (from Supabase PATCH bodies and step URLs):**  
- **PII/lead:** `first_name`, `last_name`, `email`, `phone`  
- **Address:** `street_address`, `city`, `state`, `zip_code` (Google Places assists via RPC)  
- **Qualification:** `is_homeowner`, `credit_score_eligible` (bool/nullable flag), `estimate_type ("roofing")`, `estimate_options` (JSON; e.g., `roof_type`), `property_type`  
- **Attribution/traffic:** `gclid`, `gbraid`, `fbp`, `fbc`, `fbclid`, `campaign_name`, `adset_name`, `ad_name`, `landing_page`, `device_category ("desktop")`, `ip_address`, possibly `utm_*` fields  
- **System fields:** `id` (UUID lead key), `created_at`, `action` (often `"replace"`), `buyer_id` (present but **null** in all client-side PATCHes)

**Step → write pattern (client-side):**
- **Step pages:**  
  - `/estimate/roofing/zip` (POST 200) → Supabase PATCH `zip_code`  
  - `/estimate/roofing/project-details`, `/action`, `/home-type`, `/credit-score`, `/contact`, `/email`, `/phone-number`, `/address` → at each step, **Supabase PATCH** appends/replaces fields  
- **Finalization:**  
  - `/estimate/roofing/thank-you` — **GET** (page render) + **POST 200** shortly after  
  - Surrounding that, **GA4 + Ads conversions + Zaraz** fire; **no client calls** to buyer endpoints seen.

**Routing/monetization hop (inferred):**  
- Client never hits Modernize/Angi/Thumbtack/etc. Instead, **server likely routes** after the **final POST to `/thank-you`**, using the **lead UUID** already populated in Supabase.  
- **`buyer_id` exists** in the schema but stays **null in the browser** → strong hint selection happens **server-side** post-submit (could be direct POST or ping-post auction).

---

## 3) Partner / Network Fingerprinting

**Direct evidence:**  
- **TrustedForm**: `api.trustedform.com` (cert creation; ongoing activity/events/updates) → standard for cert & resale.

**Indirect evidence (no direct buyer calls in browser):**  
- No XHR/Fetch/WebSocket to **Thumbtack, Modernize, Angi/HomeAdvisor, Networx, ServiceTitan, Leadspedia, boberdoo** (or similar).  
- Presence of `buyer_id` field in lead table (null client-side) **suggests downstream buyer selection exists**, but it’s **server-side**.

**Iframes/widgets:**  
- No third-party iframes (all steps are first-party routes). Data capture is native, not embedded buyer widgets.

---

## 4) Tracking & Attribution Deep Dive

**Google stack (server-side leaning):**  
- **GA4 via first-party proxy**  
  - `https://homeupgradesolutions.com/metrics/g/collect` (many GETs with GA4 query shape)  
  - `https://homeupgradesolutions.com/metrics/alxlcgxwu?247cef2b=<base64(/g/collect?...tid=G-R2PMKTQZVK…)`  
  - **Purpose:** conceal GA endpoints and sustain measurement despite blockers (server-side GTM pattern).

- **Google Ads conversion:**  
  - `https://www.googleadservices.com/pagead/conversion/810147275/…&label=OriMCIaAwcAaEMu7p4ID&en=purchase…` — **GET**  
  - **Purpose:** Paid conversion; **CID:** `810147275`, **Label:** `OriMCIaAwcAaEMu7p4ID` (maps to this funnel’s “success” event).

- **Consent Mode + sandbox hooks:**  
  - `https://google.com/ccm/form-data/810147275?...` — **GET 204** (Consent Mode)  
  - `https://analytics.google.com/g/s/collect?...` — **GET 204** (GA4 server endpoint)  
  - `https://www.google-analytics.com/privacy-sandbox/register-conversion` — **GET 204**

**PostHog analytics:**  
- `https://us.i.posthog.com/decide/`, `/i/v0/e/`, `/s/` — **POST**  
- **Purpose:** Product analytics/feature flags; **also** can be used to record lead lifecycle events (if they push custom events).

**Cloudflare Zaraz + RUM:**  
- `.../cdn-cgi/zaraz/t` — **POST** (SPA events)  
- `.../cdn-cgi/rum` — **POST 204** (real user monitoring)

**Facebook (inferred server-side):**  
- **No browser `facebook.com/tr`** calls.  
- Supabase payload stores `fbp`, `fbc`, `fbclid` → **perfect inputs for FB CAPI** (likely fired **server-side** via sGTM or backend after submit).

---

## 5) Ping-Post / Auction Clues

**What we see (browser):**  
- **Zero** direct POSTs from the client to any buyer/marketplace.  
- **`buyer_id`** field exists on the lead row but is **never set client-side** (remains `null`).  
- Rapid sequence at conversion: Supabase PATCH (final details) → load `/thank-you` → Ads/GA hits → **POST** to `/estimate/roofing/thank-you`.

**What this implies (educated guess):**  
- **Direct POST or server-side ping-post** likely occurs **after** `/thank-you` server receives the final POST (or via a background job).  
- If ping-post is used, you’d expect server logs (not browser) to show repeating POSTs with statuses like `rejected/accepted/price/bid/winner` and eventual `buyer_id` assigned to the lead.

**No browser evidence** of fields like `bid`, `price`, `winner`, or multiple buyer endpoints.

---

## 6) Suspicious / Uncommon Patterns

- **GA obfuscation/cloaking:**  
  - **Base64-encoded GA4 hits** on `/metrics/alxlcgxwu?247cef2b=<base64('/g/collect?...')>` — clearly designed to **hide standard GA endpoints**.  
  - Use of **first-party `/metrics/g/collect`** further suggests **server-side GTM** and **CNAME/proxy hardening**.

- **All partner routing hidden server-side:**  
  - UI is fully first-party; **no buyer iframe**; no outbound partner requests from browser.  
  - **TrustedForm** noise (activities/events/updates) ensures compliance but tells us nothing about who buys the lead.

- **Supabase from browser for PII:**  
  - Browsers issuing **PATCH** directly to `rest/v1/leads` with PII is unusual but valid with RLS/Policies; the presence of a public anon key implies **careful RLS** (worth probing for misconfig if you ever want a security angle).

---

# Bottom Line (Business Logic)

- **Lead write model:** Each form step **PATCHes the same Supabase row** by UUID; **all PII + attribution** is captured client-side.  
- **Conversion flow:** On final step, the site fires **Ads/GA** (mostly via **first-party/sGTM** routes) and posts to first-party `/thank-you`.  
- **Monetization:** **No client-side buyer calls**; routing is **server-side** after submit. The `buyer_id` field (null in browser) strongly implies a **downstream buyer selection** process (could be direct POST to a fixed buyer or a **ping-post auction**). The HAR doesn’t show the server calls, which is the point.

---

## What’s **uncertain** but worth probing

- **Ping-post vs direct POST:** Not observable in browser. You’d need server logs or to watch for **delayed `buyer_id` assignment** in the Supabase row after submit.  
- **FB CAPI usage:** Likely (given `fbc/fbp/fbclid` capture and GA4 server patterns), but actual server calls to Facebook are unseen here.  
- **`/metrics/alxlcgxwu` internals:** Confirm exactly where those requests land (Nginx route to sGTM? Cloudflare Worker to GA4?).

---

## Fast follow-ups (if you want me to dig deeper)

1) **Instrumented replay:** Diff multiple HARs (different geo/verticals) to see if `estimate_type` switches buyers/labels.  
2) **Server-side inference:** Share **server timestamps** or a **redacted DB snapshot** (lead row before/after submit) to trace when `buyer_id` flips and whether any **price/bid fields** exist server-side.  
3) **Endpoint fingerprinting:** If Modernize/Thumbtack/etc. suspected, match against a **server-side request signature cheat sheet** (payload keys, path patterns).
