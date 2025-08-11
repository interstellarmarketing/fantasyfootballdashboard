# Competitor HAR Analysis — **zip-estimate.com**

## TL;DR (What Matters)
- **All partner/buyer integrations are server-side.** The browser only talks to first-party WP endpoints and a first-party “open-bridge” events endpoint. No Modernize/Thumbtack/HomeAdvisor/Angi/Networx calls appear client-side.
- **Lead capture is WordPress AJAX** → returns a **`lead_id` + `token`** immediately, then a custom **contractor REST API** fetches matched contractors by **`zip_code`**/**`job_type`**.
- **Facebook CAPI is active via a first-party relay** (`?ob=open-bridge/events`) with **hashed PII** (`fn/ln/ct/st/zp`), firing `Lead` and `Schedule` server-side events tied to **Pixel ID `235800222956118`**.
- **Attribution:** GA4 + Microsoft Clarity + a **first-party tracking subdomain** (`tracking.zip-estimate.com/view?clickid=...`). Form also carries a **`redtrackid`** → probable RedTrack or similar postback workflow **server-side**.
- **Contractor exposure:** Their own REST route returns matched contractor(s) **with phone and business hours** (e.g., **“PBH Builders”**); this is the on-site “2–4 local contractors” reveal.

---

## 1) Hidden API & Endpoint Detection

### First-party endpoints doing the real work
| Endpoint | Method | Data (key fields) | What it’s doing | Confidence |
|---|---|---|---|---|
| `https://zip-estimate.com/wp-admin/admin-ajax.php` `action=ac_save_lead` | **POST** (multipart) | `first_name, last_name, email, cell, street_address, city, state, zipcode, home_owner, category, details, utm_* (id/source/medium/campaign/source_platform/term/content), redtrackid` | **Creates lead** in WP backend; response returns **`{"lead_id":24586,"token":"...uuid..."}`** | **High** |
| `https://zip-estimate.com/wp-json/contractor-service/v1/contractors?job_type=kitchen&lead_id=24586&zip_code=92008&utm_campaign=...` | **GET** | Query: `job_type, lead_id, zip_code, utm_campaign` → Response fields: `[id, name, phone, min_time_for_apt, business_hours, number]` | **Fetches matched contractors** to display on page (e.g., **PBH Builders** with phone + hours) | **High** |
| `https://zip-estimate.com/wp-admin/admin-ajax.php` `action=ac_set_booking_date` | **POST** (multipart) | `lead_id, token, contractor_id, contractor_number, selected_date` | **Schedules/records booking** for a specific contractor; response `{"saved":true}` | **High** |

### First-party “event bridge” for server-side pixels
| Endpoint | Method | Data (key fields) | What it’s doing | Confidence |
|---|---|---|---|---|
| `https://zip-estimate.com/?ob=open-bridge/events` | **POST** (JSON) | `event_name` (`PageView`, `FindLocation`, `InputData`, **`Lead`**, **`Schedule`**), `event_id`, `website_context.{location,referrer}`, `fb.pixel_id` (**235800222956118**), `fb.fbp`, **`fb.advanced_matching.{fn,ln,ct,st,zp}`** (SHA-256 hashes) | **First-party relay to Facebook CAPI** (and possibly other s2s endpoints). Fires **Lead** & **Schedule** with hashed PII. | **High** |

### Other network activity
| Endpoint | Method | Purpose |
|---|---|---|
| `https://tracking.zip-estimate.com/view?clickid=...&referrer=...` | **GET** (204) | First-party **view/click tracker**. Likely s2s postbacks/CNAME’d to a tracker vendor (investigate DNS). |
| `https://www.google-analytics.com/g/collect?...` | **POST** | GA4 event collection. |
| `https://i.clarity.ms/collect` | **POST** | Microsoft Clarity session recording/UX telemetry. |
| `https://maps.googleapis.com/maps/api/mapsjs/gen_204?csp_test=true` | **GET** | Maps script CSP test; not relevant to routing. |

---

## 2) Lead Data Collection & Routing Map

### Fields captured at submit (from `ac_save_lead`)
- **Identity/Contact:** `first_name, last_name, email, cell`
- **Location:** `street_address, street, city, state, zipcode`
- **Eligibility/Meta:** `home_owner, category (e.g., kitchen), details`
- **Attribution:** `utm_id, utm_source, utm_medium, utm_campaign, utm_source_platform, utm_term, utm_content`, **`redtrackid`**
- **Server response:** `lead_id`, `token` (used to authorize subsequent actions)

### Event-driven triggers
- **On various steps:** multiple **`InputData`** and **`FindLocation`** events to `?ob=open-bridge/events`
- **On submit:** `ac_save_lead` → immediately followed by **`Lead`** event (CAPI relay, hashed PII)
- **On booking selection:** `ac_set_booking_date` → **`Schedule`** event (CAPI relay, hashed PII)

### Real-time vs batched
- **Real-time.** `ac_save_lead` and `Lead` event fire in the same second. Contractor fetch and booking happen immediately after.

### Hop-by-hop map
1. **Form submit** → `ac_save_lead` (POST) → `lead_id` + `token`
2. **Lead event** → `?ob=open-bridge/events` (hashed PII, Pixel `235800222956118`)
3. **Fetch contractors** → `/contractor-service/v1/contractors` (GET)
4. **User schedules** → `ac_set_booking_date` (POST)
5. **Schedule event** → `?ob=open-bridge/events` (hashed PII)
6. **Tracking** → GA4, Clarity, `tracking.zip-estimate.com`

---

## 3) Partner / Network Fingerprinting
- **Direct networks in browser:** None detected.
- **Server-side clues:**
  - `open-bridge/events` → CAPI relay
  - `tracking.zip-estimate.com` + `redtrackid` → likely RedTrack or similar
  - `contractor-service` API exposes contractors with full details (internal DB)

**Example contractor from API:**
- **Name:** PBH Builders
- **Phone:** (619) 719-5431
- **Hours:** Present in `business_hours`

---

## 4) Tracking & Attribution
- **Facebook CAPI:** First-party relay, Pixel `235800222956118`, hashed PII
- **GA4:** Standard analytics
- **Clarity:** Session recording
- **First-party tracker:** Possible CNAME-cloaked vendor

---

## 5) Ping-Post / Auction Clues
- No visible client-side ping-post artifacts (`bid`, `price`, etc.)
- Likely server-side auctioning/fallback

---

## 6) Suspicious / Uncommon Patterns
- Query-param router (`?ob=`) for CAPI relay
- `tracking.zip-estimate.com` → possible CNAME cloaking
- Custom WP REST namespace (`contractor-service/v1`)

---

## Next Steps for Investigation
1. Check DNS for `tracking.zip-estimate.com`
2. Enumerate `wp-json` namespaces
3. Capture longer sessions for delayed calls
4. Compare contractor API responses across zips and categories
