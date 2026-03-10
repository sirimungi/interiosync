# INTERIOSYNC — Requirements & Platform Roadmap

This document maps the INTERIOSYNC research and user study to the existing Interior Designer Platform and defines the roadmap for closing gaps.

**Target market: India** — Platform is for interior design businesses operating in India. All monetary, legal, and locale choices (currency, tax, time zone, formats) follow Indian standards.

---

## 0. Indian market context

| Aspect | Choice | Notes |
|--------|--------|--------|
| **Currency** | INR (₹) | All amounts in Indian Rupee; display with Indian number grouping (e.g. ₹1,00,000). |
| **Tax** | GST | Quotations/invoices support GST: taxable amount, CGST, SGST (or IGST), total. Optional GSTIN on business profile. |
| **Time zone** | IST (Asia/Kolkata) | Scheduling, appointments, and “valid until” dates in IST. |
| **Date format** | DD/MM/YYYY | Common in India. |
| **Phone** | +91, 10 digits | Indian mobile; optional validation. |
| **Address** | State, PIN code | Indian address fields for client/business. |
| **Language** | English (primary) | UI in English; optional Hindi/regional later. |

Quotations and any future invoicing must be **GST-ready** (tax breakdown, compliance with Indian billing norms).

---

## 1. Problem statement (from research)

| Problem | Impact |
|--------|--------|
| Fragmented communication | Misunderstandings, delays |
| Time-consuming appointment scheduling for quotations | Administrative overhead |
| Managing multiple projects simultaneously | Overwhelm, poor tracking |
| Unclear dimensions and material details (customers) | Quoting errors, rework |
| Tracking progress and tasks (owners/workers) | Delays, lack of visibility |
| Manual quoting (90% of designers) | Inaccuracies, lost trust |
| No real-time updates / photo documentation | Stakeholders out of the loop |

---

## 2. User study — requested features

- **Automated quotations** — save time, reduce errors (70% want this).
- **Real-time updates and photo documentation** — all respondents want this.
- **Centralized communication** — one platform for all client comms.
- **Role-based access** — 70% want clearer task/responsibility delineation.
- **Client feedback integration** — 80% consider it extremely important.
- **Security** — material safety, controlled access to project info (physical: CCTV/keycard noted; app: auth + role-based access).

---

## 3. Current platform vs requirements

### Already in place

| Requirement | Current implementation | Notes |
|-------------|-------------------------|--------|
| Role-based access | JWT + roles: `designer`, `client`, `employee` | Strong base; can extend permissions |
| Centralized communication | Per-project **Messages** (chat-style) | Fits “one platform for client comms” |
| Project tracking | **Projects** + **Tasks** (todo / in_progress / done) | Good base; can add progress %, timelines |
| Multiple projects | CRUD projects; list filtered by role | Supported |
| File sharing | **Files** per project (upload + list) | Can be used for photos; need “photo doc” UX |
| Dashboards by role | Designer / Client / Employee dashboards | Aligned with role-based need |

### Gaps to address

| Gap | Priority | Description |
|-----|----------|-------------|
| **Automated quotations** | High | No quote/estimate flow. Need: dimensions, materials, quantities, pricing rules, and generated quotes (PDF/export optional). |
| **Appointment scheduling** | High | No calendar/slots for quotation meetings or site visits. Need: availability, booking, reminders. |
| **Dimensions & materials** | High | No structured “room/area + dimensions” or “material specs” on projects. Needed for accurate quoting and clarity for customers. |
| **Real-time updates** | Medium | Messages/files are request-response only. Need: live notifications or WebSockets for new messages, task updates, new photos. |
| **Photo documentation** | Medium | Files exist but no “project update” or “progress photo” concept with timestamps and optional captions. |
| **Client feedback on design** | Medium | No explicit “feedback/approval” on designs or quotes (could be comments + status on quotes or design files). |
| **Security (app-level)** | Low | JWT + RBAC done; optional: audit log, 2FA, or “view-only” links for clients. |

---

## 4. Proposed data model additions

### Quotations (India: INR + GST)

- **Quote** — project_id, title, status (draft / sent / accepted / rejected), valid_until, **currency** (INR), **subtotal**, **gst_rate** (e.g. 18), **gst_amount**, **total_amount**, notes. Optional: **billing_address**, **client_gstin**.
- **QuoteLineItem** — quote_id, description, category (e.g. labour, material, furniture), quantity, unit, unit_price, **line_total**, **taxable** (bool), dimensions (optional text/JSON). Amounts in INR; GST calculated at quote level or per line as needed.

### Appointments (IST)

- **Appointment** — project_id (optional), type (e.g. quotation_meeting, site_visit), **scheduled_at** (store in UTC, display in IST), duration_minutes, status (scheduled / completed / cancelled), assigned_to (user_id), notes. All user-facing times shown in IST.
- Optional: **Availability** or **Slot** for designers (e.g. working hours, blocked times) if we do “book a slot” from client side.

### Dimensions & materials (on project or quote)

- **Room / Area** — project_id, name (e.g. “Living room”), dimensions (e.g. L×W×H or JSON), notes.
- **MaterialSpec** — project_id or quote_id, name, type (e.g. flooring, paint), quantity, unit, notes.  
Alternatively, dimensions and materials can live as structured fields or line items on **Quote** first; **Room** can be added later if needed.

### Project updates (photo documentation)

- **ProjectUpdate** — project_id, author_id, title, content (rich text or markdown), created_at; type: “progress_photo” | “general”.
- **File** already exists; add optional `project_update_id` and `file_type` (e.g. “photo_doc”) to link photos to updates, or treat “file uploaded with caption” as an update.

---

## 5. Phased implementation roadmap

### Phase 1 — Quotations & project clarity (high impact)

1. **Dimensions / materials on projects**  
   Add optional fields or related entities (e.g. Room, MaterialSpec or a simple JSON field) so quotes have context.

2. **Quotations (INR + GST)**  
   - Models: Quote, QuoteLineItem (amounts in INR; GST rate/amount on quote).  
   - CRUD API and basic calculation (line total, subtotal, GST, quote total).  
   - Designer: create/edit/send quote; Client: view and accept/reject (with optional comment).  
   - Simple list/detail UI; display amounts as ₹ with Indian number format.

3. **Appointments (IST)**  
   - Model: Appointment (project_id, type, scheduled_at, duration, status, assigned_to).  
   - CRUD API; store times in UTC, show in IST; optional “list my appointments” and filter by project.  
   - Calendar or list view on dashboards; designer can create; client can request (or view only in v1).

### Phase 2 — Real-time & photo documentation

4. **Project updates (photo documentation)**  
   - ProjectUpdate model; link Files to updates; “Add progress photo” flow.  
   - Timeline or feed on Project detail page.

5. **Real-time updates**  
   - WebSockets (e.g. FastAPI WebSocket) for project channel: new message, task change, new file, new quote.  
   - Frontend: subscribe per project and show toasts or live message list.

### Phase 3 — Polish & security

6. **Client feedback on designs/quotes**  
   - Comments on quotes; optional “approve with comments” and status transitions.

7. **Security & audit**  
   - Optional: audit log for sensitive actions; 2FA or link-based view for clients.

8. **Reporting / export**  
   - Export quote as PDF; simple project progress report.

---

## 6. Success metrics (from research)

- Reduced time spent on manual quoting (automated quotations).
- Fewer communication breakdowns (centralized comms + real-time).
- Better tracking and visibility (tasks, progress, photo docs).
- Higher client satisfaction (clear dimensions, materials, and feedback loop).
- Clearer roles and responsibilities (existing RBAC + appointments/quotations ownership).

---

## 7. Next step

Recommended **first implementation**: **Phase 1 — Quotations** (Quote + QuoteLineItem, dimensions/materials on project or quote, then Appointments). This directly addresses “automated quotations”, “dimensions and material details”, and “appointment scheduling” from the INTERIOSYNC document.

After that, we can add **Project updates + real-time** (Phase 2) to deliver “real-time updates and photo documentation” and “centralized communication” in a more live way.
