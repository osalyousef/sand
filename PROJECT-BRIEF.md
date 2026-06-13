# سند (Sanad) — Hajj Pilgrim Health Platform
## Full Project Brief for Hackathon Slide Generation

> **Note to the AI reading this:** This document fully describes a hackathon project called "سند / Sanad". Use it to design presentation slides. The project is an **AI-powered health command-and-response system for Hajj pilgrims**, built for the Saudi Ministry of Hajj and Umrah. It consists of TWO connected applications + a shared database. Everything is bilingual (Arabic-first, RTL) with a warm "Nusuk" light/dark theme. Below is every detail: the problem, the solution, both apps screen-by-screen, the 7-agent AI layer, the data model, the tech stack, and the demo flow.

---

## 1. THE PROBLEM (why this exists)

During Hajj, **~2 million pilgrims** gather in a tiny geographic corridor (Mecca → Mina → Muzdalifah → Arafat) in extreme heat (feels-like 47–51°C). Pilgrims are:
- **Elderly** (many 60–75+) with chronic conditions (heart disease, diabetes, hypertension).
- **Multilingual** — they speak Urdu, Bengali, Indonesian, Turkish, Persian, etc., and usually no Arabic.
- **Densely packed** — heat stroke, dehydration, cardiac events, and "lost from group" cases surge in clusters.

The operational pain points:
1. **Language barrier** in emergencies — a panicking pilgrim can't describe symptoms to a hotline operator.
2. **No medical context** — responders arrive blind to the pilgrim's history.
3. **Reactive, not predictive** — crises are discovered after they explode, not before.
4. **Information overload** in the ops room — thousands of vital-sign and location data points, impossible to read manually.
5. **Slow documentation & shift handoffs** — doctors waste time writing reports.

---

## 2. THE SOLUTION (one sentence)

> **سند** is an AI command center where **seven specialized AI agents suggest, and a human approves** — covering every critical decision moment in a pilgrim's journey: prediction → live response in the pilgrim's own language → field dispatch → documentation → shift handoff.

**Core product principle (repeat on a slide):** *The agent SUGGESTS, a human APPROVES.* Every agent shows its reasoning and a confidence score; nothing executes without a documented human approval. Critical for a government/medical context.

---

## 3. SYSTEM ARCHITECTURE (the big picture)

Three pieces, all sharing the same data contract (`Pilgrim` / `Vitals` / `RiskAssessment` / `PilgrimLocation`):

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│  DASHBOARD (web · Next.js)  │         │   MOBILE (field · Expo/RN)   │
│  Ops-room command center    │ ◀─────▶ │   Responders + pilgrims      │
│  → the 7 AI agents live here│         │   → consumes ops decisions   │
└──────────────┬──────────────┘         └───────────────┬──────────────┘
               │                                         │
               └──────────────┬──────────────────────────┘
                              ▼
                  ┌────────────────────────┐
                  │  Supabase (Postgres)   │  ← shared schema + Realtime
                  │  + FastAPI risk model  │  ← AI endpoint (mock today)
                  └────────────────────────┘
```

- **DASHBOARD** = the brain (ops room / Ministry command center). Hosts all 7 AI agents.
- **MOBILE** = the hands & the pilgrim. Field responders receive dispatches; pilgrims carry a health card + QR bracelet.
- **Supabase** = shared Postgres DB with Realtime subscriptions (live updates).
- **AI hook** = `lib/ai.ts` in each app calls `POST {AI_URL}/predict` for risk scoring (currently returns a deterministic mock; swap to live FastAPI/LLM with zero UI changes).

**Demo data is deterministic mock** (seeded, no randomness) so server & client always agree — no hydration errors, no backend required to run.

---

## 4. THE DASHBOARD (web command center) — screen by screen

**Tech:** Next.js 16, React 19, TypeScript, Tailwind 4, Leaflet + CARTO maps, zustand, lucide-react.
**Live deployed at:** Vercel (permanent link).

The dashboard has a top header (logo "سند · Ministry of Hajj and Umrah", "Hajj season active" badge, notifications bell with critical count, dark/light theme toggle) and **5 tabs**:

### Tab 1 — «مباشر» (Live / Geo-Command)
The main operations screen. Three regions:
- **Center: thermal heat map** — a 100m×100m gridded density field over Mina/Arafat, colored by case density + temperature (blue=quiet → red=hot cores). Toggle buttons: **"الآن" (Now)** / **"متوقع +٤ ساعات" (Forecast +4h)** / **"المنشآت" (Facilities)**. Click any hot cell → a detail card pops up.
- **Right sidebar: Alerts & Insights feed** — live alerts with full lifecycle (🔴 New → 🟡 Dispatched → 🔵 Treating → ✅ Resolved / 🏥 Transferred), plus the Ops Agent's area-level insights with confidence %.
- **Left sidebar: Field Teams panel** — 5 teams, each with a fatigue indicator (hours on shift; red ≥9h on a 12h shift).
- **Environmental bar (top):** per-site readings (Mina / Arafat / Muzdalifah) — temperature, feels-like, UV index, humidity, wind, crowd level.
- **Status bar (bottom):** live counters — 21 critical / 17 warning / 2 safe, "40 pilgrims under monitoring", "+23 cases resolved since midnight".

### Tab 2 — «الخط الساخن» (Hotline / Crisis Management)
- **Queue (left):** incoming calls & chats, auto-ordered by the Triage Agent (severity × wait time), with **live SLA timers** that turn red after 2 minutes.
- **Session (center):** open a call or chat → real-time bilingual translation. A call shows transcript + Arabic translation; chat shows pilgrim messages + translations.
- **Health snapshot (right):** the pilgrim's medical record embedded in the session (conditions, meds, vitals).
- **The Response Agent card** (the star) lives inside every session — see §6.

### Tab 3 — «المنشآت الصحية» (Health Institutions)
- 7 facilities: field hospital, medical centers, first-aid points, mobile units.
- Each shows: bed capacity & occupancy %, specialties, distance + ETA from the current worst hotspot (Jamarat), cases today, radio channel, status (Operational / Overwhelmed / Full).
- Click a facility → the map flies to it. Network occupancy summary at top.
- Example: "Jamarat Bridge Clinics — 60/60 beds, FULL" vs "Mina Field Hospital — 142/200, Operational, ETA 6 min".

### Tab 4 — «البحث» (Search / Pilgrim Health Record)
- Search any pilgrim → full profile: live vitals, chronological medical timeline (hotline call → dispatch → field treatment → transfer → discharge), recovery/discharge flow.
- The **Documentation Agent** drafts discharge summaries here (see §6).
- "Register recovery" button + "locate on map" (jumps to Live tab, map flies to pilgrim).

### Tab 5 — «البيانات» (Data / Analytics)
- Recovery counter (23 today vs 19 yesterday), interactive 24-hour chart, AI KPIs (e.g. "risk-prediction accuracy 94%").
- **Shift management panel** — the Handoff Agent drafts the shift-handoff report (see §6).
- **Export daily PDF report** (RTL print window) — bundles KPIs, facilities, agent insights, and the shift summary.

---

## 5. THE MOBILE APP (field operations) — screen by screen

**Tech:** React Native 0.85, Expo 56, expo-router, react-native-maps, expo-camera, react-native-qrcode-svg. Arabic RTL, warm "Nusuk" paper theme (#f7f0e1 background, #f97316 orange accent).

The mobile app serves **two personas** through a 5-tab bottom nav:

### The 5 tabs:
1. **«الرئيسية» (Home)** — heat alert banner, a **Tinder-style swipeable environmental deck** (per-site feels-like temp, humidity, wind, crowd level — swipe through Mina/Arafat/Muzdalifah), a quick-link to Health Institutions, and a **راصد ops-insights summary** (2 cards + «عرض الكل» → the `/insights` feed).
2. **«الحجاج» (Pilgrims)** — list of recently scanned pilgrims with risk level, vitals, time-ago. Tap → full record.
3. **«الخريطة» (Map)** — native map of the Hajj corridor (Haram→Mina→Muzdalifah→Arafat) with the same 100m thermal heat field as the web dashboard, plus pilgrim pins. Deep-linkable to focus a specific pilgrim.
4. **«المسح» (Scan)** — **QR bracelet scanner** (expo-camera). Scan a pilgrim's wristband QR → instantly resolves their full medical record. Has a "simulate scan for demo" button. The QR carries only the pilgrim ID; the record is fetched from the registry / health platform.
5. **«البلاغات» (Dispatch / Reports)** — field responder's inbox. Live dispatches from the ops room ("operations room connected" status), each with risk, zone, vitals, reason. Responder taps → "Accept mission — I'm on my way" (status → en-route) or "Locate on map".

### Key mobile screens (outside tabs):
- **Pilgrim Health Card (`pilgrim.tsx`)** — the PILGRIM's own view. A tabbed home: **«اليوم» (Today)** = a **مُغيث health-assistant card** (live assessment + guidance addressed to the pilgrim) + medication schedule (taken/now/upcoming) + a **حارس preventive-guardian card** (one prioritised heat/hydration/meds nudge); **«بطاقتي» (My Card)** = Nusuk health card with QR of their bracelet ID + risk level + conditions; **«الطوارئ» (Emergency)** = one-tap call/chat to the hotline.
- **Call screen (`call.tsx`)** — simulated emergency call with a pre-scripted **bilingual exchange** (e.g. an Indonesian pilgrim: "Halo, tolong! Saya tersesat di Mina..." → live Arabic translation "مرحبًا، أرجوكم! أنا تائهة في منى..."), with typing animation, AI translation indicators, mute/speaker controls.
- **Pilgrim detail (`pilgrim/[id].tsx`)** — full scanned record: conditions, medications, vitals, risk.

### Mobile ↔ Backend integration (already wired, falls back gracefully):
- `lib/pilgrim-registry.ts` — bracelet ID → pilgrim record (6 seeded pilgrims with full medical data across nationalities: Nigeria, Egypt, Indonesia, Turkey, Malaysia, Pakistan).
- `lib/health-platform.ts` — client for a teammate's Django "Hajj Health Platform" backend; overlays unified medical history (diseases, meds, allergies, vaccinations, confidence score) onto the local record. Falls back to local registry if the platform is offline, so the scan flow never breaks.
- `lib/ai.ts` — `getRiskLevel(vitals)` → risk prediction via FastAPI (mock today).
- `lib/agents.ts` — **the mobile app now has its own on-device agent layer** (mirrors the dashboard's brain). It hosts 5 agents tuned to the field/pilgrim context: مُغيث, راصد, دليل (ported from the dashboard) + مُهيّئ and حارس (field/pilgrim-native). See §6.

---

## 6. THE 7 AI AGENTS (the heart of the project)

All agent brains live in ONE file: `dashboard2/lib/agents.ts` — the single swap point for the LLM backend. Each agent has an Arabic name + a clear role, so staff know which "colleague" produced each suggestion.

| # | Agent | Name (AR) | Role | Where in the app |
|---|-------|-----------|------|------------------|
| 1 | Response | **مُغيث** | Medical response copilot | Hotline → inside every call/chat |
| 2 | Ops | **راصد** | Area-level operations intelligence | Live tab → alerts feed |
| 3 | Routing | **دليل** | Team & hospital routing | Live tab → click a map cell |
| 4 | Prediction | **بصير** | +4h forecast layer | Live tab → "Forecast +4h" button |
| 5 | Triage | **فارز** | Hotline queue ordering | Hotline → top of queue |
| 6 | Discharge | **موثِّق** | Discharge summary drafting | Search → pilgrim recovery section |
| 7 | Handoff | **مُسلِّم** | Shift-handoff report drafting | Data → shift panel |

### Agent 1 — مُغيث (Response Agent) ⭐ THE STAR
Inside a live hotline call/chat, from the transcript + the pilgrim's health record, it produces 5 outputs **in the order a clinician thinks**:
1. **Clinical diagnosis** (read by the care provider, not the pilgrim) — e.g. "Suspected Acute Coronary Syndrome (ACS)", with severity (Critical / Urgent / Normal).
2. **Immediate pilgrim guidance** — stabilize FIRST, before any questions. On approval, it's **voice-broadcast to the pilgrim in their own language** (e.g. "Stay where you are, don't exert yourself, sit upright").
3. **Triage questions** — each one broadcasts by voice (call) or prefills the reply (chat).
4. **Operational action** — e.g. "Dispatch cardiac team now (nearest: Team C ~4 min) + notify Mina field hospital to prep a cardiac bed." Executes only on "Approve & Execute".
5. **Organized field brief** — bullet summary pushed to the responding team's device so they arrive knowing the case.
**Core value:** turns an operator with zero medical training and zero knowledge of the pilgrim's language into someone who can confidently manage a critical cardiac case — diagnosis + translation + team brief in seconds, every step human-approved.

### Agent 2 — راصد (Ops Agent)
Watches the live vitals + location + environmental stream and surfaces area-level intelligence in 4 types, each with a confidence score:
- **Surge:** "140 critical cases within 300m of Jamarat, 71% heat exhaustion, clinics full → prep mobile cooling unit + reroute intake to Mina field hospital" (92%).
- **Prediction:** "AC failure + incoming heat peak → +40% cases in camp C3 within 2 hours" (87%).
- **Logistics:** "Mobile unit M2 IV-fluid stock at 80% → resupply before 16:00" (95%).
- **Anomaly:** "11 lost-person reports from the same point in 40 min → possible path blockage" (78%).
**Core value:** saves the "reading & analysis" time — the ops officer doesn't have to stare at thousands of map points to discover a crisis; the agent extracts it as 2 sentences. Shrinks crisis-detection time.

### Agent 3 — دليل (Routing Agent)
Click a hot map cell → computes case density vs nearby facility occupancy and recommends: how many teams (1, or 2 + cooling unit), which hospital (with ETA), or "low density — next patrol covers it, don't pull a team from a hotter zone."
**Core value:** the "how many teams, where to" decision normally needs live knowledge of every facility's occupancy + distances; the agent computes it instantly — prevents over/under-dispatch and routing to an already-full hospital.

### Agent 4 — بصير (Prediction Agent)
One button flips the whole map from "now" to "critical zones in 4 hours" — fusing the incoming heat curve, current case buildup, and known infrastructure failures (AC outages).
**Core value:** the difference between a system that alerts you to the fire and one that tells you where the fire will start in 2 hours. Teams move *before* the peak — proactive, not reactive.

### Agent 5 — فارز (Triage Agent)
Auto-orders the hotline queue by **severity × wait time** instead of first-come-first-served, with live SLA timers turning red after 2 min.
**Core value:** in a mass-casualty event with thousands of calls, ensures a critical cardiac case never waits behind 10 "lost from group" calls — potentially life-or-death.

### Agent 6 — موثِّق (Documentation Agent)
After a pilgrim recovers, auto-drafts a full discharge summary from the record (condition, treatment, doctor, team, discharge time, follow-up notes). The doctor reviews, edits, approves — both the doctor's and the agent's names are logged.
**Core value:** saves the doctor's documentation time per case, ensures the record is read quickly in a unified, editable format, and standardizes documentation across health facilities so any other doctor instantly understands the case history.

### Agent 7 — مُسلِّم (Handoff Agent)
As the shift change nears, auto-compiles: cases resolved (vs yesterday), avg response time, top pressure points, ongoing risks (e.g. unresolved AC failure), team fatigue (who exceeded 11h), and an opening recommendation for the next shift. Becomes editable text the outgoing supervisor edits/approves; also feeds the daily PDF report.
**Core value:** "zero wasted time" writing the handoff — the info is already in the system, the agent just organizes it into human-readable prose, ensuring a clean, complete shift-to-shift transition with no lost information.

---

### Mobile-side agents (the field app has its OWN agent layer)

The 7 above live in the ops-room dashboard. The **mobile app has its own agent layer** (`mobile/lib/agents.ts`) tuned to two field personas — the **responder** in the field and the **pilgrim** in their pocket. Three are ported from the dashboard (مُغيث / راصد / دليل), and **two are field/pilgrim-native** (مُهيّئ / حارس).

| Agent | Name (AR) | Role | Where in the mobile app |
|-------|-----------|------|-------------------------|
| Response | **مُغيث** | Medical copilot | Pilgrim home + scan-detail (live assessment for the pilgrim/responder) |
| Ops | **راصد** | Operations insights | Home summary + `/insights` screen |
| Routing | **دليل** | Team/hospital routing | Map cell recommendations |
| **Pre-Arrival** | **مُهيّئ** | Preps the responder en-route | Dispatch tab → accept a mission → prep card appears |
| **Guardian** | **حارس** | Proactive pilgrim guardian | Pilgrim home → "Today" tab |

#### NEW Agent — مُهيّئ (Pre-Arrival Agent) — responder-side
The strongest field-only agent. The moment a responder taps **"Accept mission — I'm on my way"**, it turns the travel time into preparation. From the dispatch (complaint + vitals + nationality + age) it derives:
1. **The pilgrim's likely language + a reassuring phrase IN that language** (Urdu, Hausa, Indonesian, Turkish, Persian, Bengali…) — so the responder can say the first words the pilgrim actually understands.
2. **An equipment/medication checklist tuned to the suspected condition** — cardiac → ECG + aspirin + AED; heat → cooling packs + cold IV fluids; diabetic → glucometer + glucagon, etc.
3. **Critical heads-up flags** — elderly pilgrim, low SpO₂, cardiac suspicion (alert the hospital to prep a bed), and always "verify drug allergy before administering."
**Core value:** the responder arrives already knowing the case and able to speak to the pilgrim — instead of arriving blind. Closes the loop with the dashboard's مُغيث (dashboard suggests dispatch → mobile مُهيّئ preps the responder).
**Code:** `getPreArrivalBrief({ nationality, reason, vitals, age })` in `mobile/lib/agents.ts`.

#### NEW Agent — حارس (Preventive Guardian Agent) — pilgrim-side
Lives in the pilgrim's pocket. Instead of waiting for an emergency, it watches the pilgrim's own context — heat, time since last water, due medication — and raises **one prioritised preventive nudge**, color-coded by severity, with the single action to take now. Example: "feels-like 44°C + no water in 2h → 🔴 imminent dehydration risk → drink now and move to shade" — *before a case is ever opened*.
**Core value:** prevention upstream of every other agent. The cheapest case to handle is the one that never happens. Speaks to the pilgrim directly, in their own health context.
**Code:** `getGuardianAdvisory({ tempC, hoursSinceWater, medDueNow, medName })` in `mobile/lib/agents.ts`.

**Updated count:** 7 dashboard agents + 2 new mobile-native agents (مُهيّئ، حارس) = **9 distinct agents** across the product (with 3 shared brains ported to mobile).

---

## 6.5 HOW THE AGENTS WORK & HOW TO TALK TO THEM (integration architecture)

This is the part judges love: the agents are built so the **demo runs with zero backend today**, yet every agent becomes a real LLM call by editing **one function body** — no UI changes.

### The contract: each agent = a pure function with a typed input → typed output
Every agent is a plain TypeScript function in `lib/agents.ts`. The UI calls it and renders the result. Today the body returns deterministic mock intelligence; tomorrow the body `await`s an LLM/FastAPI call and returns the same shape.

```
UI screen  ──calls──►  agent function (lib/agents.ts)  ──returns──►  typed result  ──►  rendered card
                                  │
                          (swap THIS body)
                                  ▼
                       LLM / FastAPI / RAG call
```

### The agent functions and their I/O (the "API" of each agent)

| Agent | Function (where) | Input | Output |
|-------|------------------|-------|--------|
| مُغيث (Response) | `getResponseSuggestion(entry)` · mobile + `getContactSuggestion(contact)` · web | scanned pilgrim record (vitals + conditions) / hotline contact | `{ diagnosis, treatment, questions[], guidance, fieldBrief[] }` |
| راصد (Ops) | `OPS_INSIGHTS[]` | live vitals/location/env stream | `{ type, severity, area, title, detail, action, confidence }[]` |
| دليل (Routing) | `getCellRecommendation(intensity, landmark)` | map-cell density + nearest landmark | `{ headline, teams }` |
| بصير (Prediction) | forecast layer (web) | heat curve + case buildup + outages | future-risk heat field |
| فارز (Triage) | queue sort (web) | queue of contacts | ordered queue (severity × wait) |
| موثِّق (Discharge) | `getDischarge(p)` / `buildAgentDraft()` | pilgrim record | discharge summary draft |
| مُسلِّم (Handoff) | `buildHandoffReport(variant)` | shift stats + risks + fatigue | handoff report text |
| **مُهيّئ (Pre-Arrival)** | `getPreArrivalBrief({ nationality, reason, vitals, age })` | the dispatch | `{ language, greeting, prep[], flags[] }` |
| **حارس (Guardian)** | `getGuardianAdvisory({ tempC, hoursSinceWater, medDueNow, medName })` | pilgrim's live context | `{ severity, title, detail, action }` |

### How to connect a real AI (the swap, step by step)
1. **Risk scoring** is already wired: `lib/ai.ts → getRiskLevel(vitals)` calls `POST {AI_URL}/predict` and returns `{ risk_level, score }`. It falls back to a mock when `AI_URL`/`EXPO_PUBLIC_AI_URL` is empty. Point the env var at the FastAPI model → live risk, no other change.
2. **The LLM agents:** replace the body of any agent function with a call to Claude (e.g. `claude-opus-4-8` / `claude-sonnet-4-6`) — pass the same typed input as context, ask for the same typed output (JSON), parse, return. Because the function signature is unchanged, **every screen keeps working untouched.**
3. **Health records** come from the Django "Hajj Health Platform" via `lib/health-platform.ts` (overlay on scan); **live data** comes from Supabase Realtime. Agents read these as their context.

### The "agent suggests, human approves" mechanism (in code)
Every agent card renders its suggestion + reasoning + (where relevant) a confidence %, then an explicit approval control:
- **Dashboard مُغيث:** "Approve & voice-broadcast", per-question send buttons, "Approve & Execute" (dispatch), "Send field brief" — each is a button that fires the real action only on tap, and updates the shared `zustand` store so all tabs reflect it live.
- **Mobile مُهيّئ:** the prep card only appears *after* the responder taps "Accept mission".
- **Mobile حارس:** advisory + the single recommended action, shown to the pilgrim to act on.
Nothing auto-executes. The human is always the trigger.

### Cross-app agent loop (worth a slide)
A single case flows through multiple agents across both apps:
**راصد** spots a surge → **دليل** routes teams → operator dispatches → **مُغيث** (dashboard) guides the call & sends a field brief → **مُهيّئ** (mobile) preps the responder en-route in the pilgrim's language → responder scans the QR → **موثِّق** drafts the discharge → **مُسلِّم** rolls it into the shift handoff. Meanwhile **حارس** works upstream to prevent the case from ever opening.

### Tools vs Agents — an honest distinction (be ready for this judge question)
We deliberately do NOT inflate the agent count by labelling every AI capability an "agent." There's a clean line:

- **A capability / tool** = a transform with no judgment: input → output. Examples in Sanad: **real-time translation** (Arabic ↔ pilgrim's language), **speech-to-text / voice broadcast**, **OCR/QR decode**, the **risk-scoring model** (`getRiskLevel`). These don't *decide* anything — they convert.
- **An agent** = something that reasons toward a goal and *suggests an action with a rationale*. مُغيث doesn't translate — it **diagnoses and decides** "suspected heat stress, dispatch a team," then uses translation as a tool to deliver its guidance in the pilgrim's language.

So **real-time translation is a tool the agents use, not an agent.** Saying this out loud earns credibility with technical judges. (If we ever wanted a translation *agent* — «مُترجم» — it would have to add judgment on top of translation: auto-detect the pilgrim's language, pick the right dialect, preserve medical urgency in tone, and simplify clinical terms for a layperson. Until it makes those decisions, it stays a tool.)

---

## 7. DATA MODEL (shared contract)

**Supabase Postgres schema** (`supabase/migrations/0001_init.sql`):
- `pilgrims` — id, full_name, age, nationality, passport_number, has_diabetes/heart_condition/hypertension, medications[].
- `vitals` — pilgrim_id, heart_rate, temperature, oxygen_level, recorded_at.
- `risk_assessments` — pilgrim_id, risk_level (green/yellow/red), score, assessed_at.
- `locations` — pilgrim_id, latitude, longitude, recorded_at.
- **Realtime** enabled on vitals, risk_assessments, locations → dashboard subscribes for live updates.
- Indexed on (pilgrim_id, time desc) for fast latest-reading queries.

**Risk levels:** `green` (#22c55e, low) / `yellow` (#eab308, elevated) / `red` (#ef4444, critical).

**AI contract:** `VitalsInput { age, heart_rate, temperature, oxygen_level, has_diabetes, has_heart_condition, has_hypertension }` → `AIPrediction { risk_level, score }`.

---

## 8. TECH STACK SUMMARY (for a slide)

| Layer | Technology |
|-------|-----------|
| Web dashboard | Next.js 16, React 19, TypeScript, Tailwind 4, Leaflet/CARTO, zustand, lucide-react |
| Mobile app | React Native 0.85, Expo 56, expo-router, react-native-maps, expo-camera, QR codes |
| Database | Supabase (Postgres + Realtime), open RLS for demo |
| AI | FastAPI risk endpoint + 9-agent LLM layer (7 dashboard + 2 mobile-native; single swap point `lib/agents.ts`) |
| Health records | Django "Hajj Health Platform" integration (teammates' backend) |
| Hosting | Vercel (dashboard, permanent link) |
| Design | Arabic-first RTL, warm "Nusuk" light/dark theme, deterministic seeded mock data |

---

## 9. SUGGESTED DEMO FLOW (2–3 minutes, for the closing slide)

1. **Live tab:** راصد flags the Jamarat surge → click the cell (دليل recommends teams + hospital) → hit "+4h" (بصير forecasts the escalation).
2. **Hotline:** فارز has ordered the queue → open the critical call (C001, suspected heart attack) → مُغيث diagnoses, voice-broadcasts guidance in the pilgrim's language, and sends an instant field brief.
3. **Mobile (field):** the responder receives the dispatch, accepts "I'm on my way" → **مُهيّئ** instantly preps them (pilgrim's language + a greeting phrase, equipment checklist, critical flags); they scan the pilgrim's QR bracelet → full medical record appears. Meanwhile on the pilgrim's own phone, **حارس** had already warned them to hydrate before it escalated.
4. **Search:** register the pilgrim's recovery → موثِّق writes the discharge summary.
5. **Data:** مُسلِّم prepares the shift report → export PDF.

**Closing line:** *"7 agents, each covering a critical decision moment in the pilgrim's journey — prediction, instant response in their own language, documentation, handoff. All in one file, ready to connect to any real LLM, all under one rule: the agent suggests, the human approves."*

---

## 10. WHAT MAKES IT STAND OUT (judging criteria angles)

- **Human-in-the-loop AI** — responsible AI for a high-stakes medical/government context. Confidence scores + named agents + mandatory approval.
- **End-to-end vertical** — two connected apps (command + field) + pilgrim-facing card, not just a dashboard.
- **Real-world grounded** — actual Hajj geography, real heat data ranges, real medical conditions, multilingual reality.
- **Production-ready architecture** — clean swap points for LLM + Supabase, deterministic demo data, graceful backend fallbacks.
- **Bilingual & RTL-native** — Arabic-first, voice translation to the pilgrim's language at the core of the response loop.
