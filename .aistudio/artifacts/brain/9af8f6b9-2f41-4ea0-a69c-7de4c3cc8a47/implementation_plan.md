# 15-Minute Deposit SLA Monitoring & Admin Escalation System

A real-time financial SLA oversight and escalation engine that detects customer deposit requests pending over 15 minutes, alerts the Super Admin via an audio alarm and glowing SLA breach badge, and empowers the Super Admin to issue urgent speed warnings to the assigned Admin or reassign and directly process the request.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed during Phase 1 clarification:
> - **Super Admin Alert Channel**: Audio alarm and glowing SLA breach badge in the executive workstation header and deposit desk.
> - **Admin Warning Protocol**: In-app urgent warning notification with high-priority audio alert delivered straight to the assigned Admin's workstation.
> - **Super Admin Executive Authority**: If the assigned Admin is unresponsive, the Super Admin has the power to either reassign the deposit to another active admin or directly approve/decline the request via executive override.

---

## 1. Overview & Core Concept

When players submit ETB deposits (via CBE, Telebirr, Awash Bank), funds must be confirmed swiftly so players can enter live auctions without friction. If an assigned Operations Administrator delays or goes idle, deposit requests could sit unattended.

This system provides:
1. **Automated 15-Minute SLA Watchdog**: A background and real-time evaluator that tracks elapsed time for every `pending` deposit.
2. **Super Admin Glowing SLA Breach HUD & Audio Alarm**: Real-time visual and acoustic alerting when any request crosses the 15-minute threshold.
3. **1-Click Urgent Speed Warning Dispatch**: Super Admin can immediately issue high-urgency notifications to the specific assigned Admin (`alex`, `admin_ops`, etc.), logging an official warning in the activity ledger.
4. **Assigned Admin Urgent Warning Rail**: The assigned Admin's workstation triggers a high-priority alert chime and displays a prominent flashing warning banner on their allocated deposit card.
5. **Executive Intervention & Reassignment**: If the assigned admin remains inactive, Super Admin can reassign the deposit to another active admin or execute a direct approval/rejection override.

---

## 2. User Experience & Visual Design

### Super Admin Executive Workstation Flow
1. **Header SLA Breach Indicator**:
   - In `AdminWorkstation.tsx`, beside the deposit tab, if any pending deposit exceeds 15 minutes, a pulsing rose-amber badge displays: `⚠️ 15m+ Delayed (N)`.
   - An audible procedural alert tone plays once when new SLA breaches are detected (with an audio mute/toggle option).
2. **Deposit Verification Desk - SLA Warning Radar**:
   - Above the standard deposits queue, an **"SLA Breach Escalation Radar"** card highlights all requests older than 15 minutes with elapsed time counters (`16m elapsed`, `23m elapsed`, etc.).
   - Each delayed deposit card provides:
     - **"Send Speed Warning"**: Dispatches an urgent escalation notification to the assigned Admin.
     - **"Reassign Admin"**: Opens a dropdown to transfer the ticket to another active operations administrator.
     - **"Direct Executive Action"**: Allows Super Admin to directly approve (crediting the user) or decline with a reason.

### Operations Admin Workstation Flow
1. **Urgent Escalation Banner**:
   - When an assigned Admin receives a speed warning, an urgent notification pill appears in their workstation, accompanied by a double-pulse audio chime.
   - The delayed deposit card in their queue flashes with an amber border and a badge: `⚠️ SUPER ADMIN SPEED WARNING: Approve or Decline Immediately`.

---

## 3. Key Product Decisions & Trade-Offs

- **Real-Time Client-Side Ticker & Server Validation**:
  - *Approach*: Server evaluates elapsed time and includes `elapsed_minutes` and `is_sla_breached` flags in `/api/admin/deposits` and `/api/superadmin/deposits/sla-breaches`. Frontend maintains a 1-second interval ticker for live minute/second countdowns.
  - *Why*: Guarantees zero latency on the UI without requiring heavy polling, while keeping the server authoritative.
- **Dedicated Warning Dispatch Endpoint**:
  - *Approach*: `POST /api/superadmin/deposits/:id/warn-admin` creates an urgent notification, logs the event in `system_movements` and `audit_logs`, and marks `warning_sent_at` on the deposit.
  - *Why*: Creates an immutable accountability trail showing which admin was warned, by whom, and when.
- **Executive Direct Action Bypass**:
  - *Approach*: Extend `approveDeposit` and `rejectDeposit` in `server/db.ts` to allow `superadmin` role execution when invoked with `executiveOverride: true`, bypassing the operational admin restriction for emergency unblocking.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MINIBID DEPOSIT SLA ENGINE                      │
└────────────────────────────────────────────────────────────────────────┘

  Customer Deposits (Pending Queue)
         │
         ▼
  ┌────────────────────────────────────────────────────────┐
  │ Background SLA Evaluator (Date.now() - created_at)     │
  │ > 15 Minutes Threshold Check                           │
  └──────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
  ┌───────────────────────────┐    ┌───────────────────────────────────┐
  │ Normal (< 15 mins)        │    │ SLA Breach (> 15 mins)            │
  │ Standard Admin Queue      │    │ 1. Glowing SLA Badge in Header    │
  └───────────────────────────┘    │ 2. Procedural Audio Alarm         │
                                   │ 3. Super Admin Breach Radar Card  │
                                   └─────────────────┬─────────────────┘
                                                     │
                             ┌───────────────────────┴───────────────────────┐
                             │ Super Admin Actions                           │
                             ├───────────────────────────────────────────────┤
                             │ • POST /api/superadmin/deposits/:id/warn-admin│
                             │ • POST /api/superadmin/deposits/:id/reassign  │
                             │ • Direct Approve / Decline Override           │
                             └───────────────────────┬───────────────────────┘
                                                     │
                                                     ▼
                                    ┌─────────────────────────────────┐
                                    │ Assigned Admin Urgent Notice    │
                                    │ • Urgent Notification & Chime   │
                                    │ • Flashing Priority Alert Badge │
                                    └─────────────────────────────────┘
```

### Endpoints & Interfaces

1. `GET /api/superadmin/deposits/sla-breaches`
   - Returns all pending deposits where `elapsed_seconds >= 900` (15 mins), with assigned admin info and warning history.
2. `POST /api/superadmin/deposits/:id/warn-admin`
   - Dispatches high-urgency notification to assigned admin, updates `warning_count` and `last_warned_at`.
3. `POST /api/superadmin/deposits/:id/reassign`
   - Reassigns deposit to target admin ID, updates `deposit_code` prefix if needed, and logs movement.
4. `POST /api/admin/deposits/:id/approve` & `POST /api/admin/deposits/:id/reject`
   - Allow `superadmin` role with `executive_override: true` to directly process delayed deposits.
5. `src/utils/audio.ts`
   - Add `playSlaBreachAlarm()` and `playUrgentAdminWarningBeep()` via Web Audio API.

---

## 5. Verification & Completion Status

- [x] **Database & Endpoints**: Added `getSlaBreachedDeposits`, `warnAssignedAdmin`, `reassignDepositAdmin`, and executive override capability in `approveDeposit` / `rejectDeposit`.
- [x] **Web Audio API**: Implemented procedural `playSlaBreachAlarm` (pulsing dual-tone sawtooth) and `playUrgentAdminWarningBeep` (high-urgency alert beep) in `src/utils/audio.ts`.
- [x] **Super Admin Visual & Sound Alert**: Glowing animated SLA breach badge in the workstation header and deposit tab with automated audio triggers on new breaches.
- [x] **15-Minute SLA Radar HUD**: Integrated real-time countdown timer, warning history badges, 1-click **Warn Admin**, **Reassign**, and **Direct Approve/Decline Override**.
- [x] **Assigned Admin Notification & Desk Banner**: Flashing high-priority alert rail and audio alert on the assigned Operations Admin's desk when a breach or warning is active.
- [x] **Build & Runtime Verification**: `compile_applet` passed, TypeScript typecheck passed with 0 errors, endpoints verified via live API tests.
