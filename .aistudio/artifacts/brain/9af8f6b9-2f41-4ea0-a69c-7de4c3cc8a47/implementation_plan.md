# Superadmin Security, Activity Movement Controller & Device Session Architecture

Executive security hardening and activity governance suite for the MiniBid platform. This implementation guarantees single Superadmin exclusivity, complete audit visibility over all system movements (registrations, deposit lifecycle, staff notifications, catalog changes, credential resets, and admin authentication), and real-time multi-device detection with remote session revocation for administrative staff.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following requirements and clarifications have been confirmed and will be enforced across both backend guards and frontend workstations:

- **Single Superadmin Exclusivity**: Enforced at the database and API level. Only one Superadmin account (`usr_superadmin`) is permitted in the system. The platform will permanently reject creating, assigning, or promoting any secondary Superadmin account.
- **Deposit Desk Separation**: Customer deposit verification and balance disbursements are strictly delegated to Operations Administrators. The Superadmin interface features a read-only audit view without accept/approve or reject buttons, preventing accidental executive interference while maintaining full supervisory oversight.
- **Active Users Privacy Boundary**: Standard Operations Admins viewing the active users directory are strictly restricted to regular customers and bidders. Only the Superadmin has clearance to view all platform accounts, staff credentials, and administrative profiles.
- **Multi-Device Detection & Remote Revocation**: If an administrator logs into an account from two or more devices simultaneously, the system immediately flags the account with an active security alert, lists all device specifications (browser, OS, IP address, login and heartbeat timestamps), and provides the Superadmin with instant remote session revocation controls.

---

## 1. Overview & Core Concept

### What It Does
1. **Single Superadmin Policy**: Restricts system architecture so only one Superadmin account can exist. Replaces all multi-superadmin creation vectors in both API endpoints and the admin management modal with a locked single-executive protocol.
2. **System Activity Control Section ("Movement Controller")**: An executive mission-control center logging every granular event in the platform classified by date and time:
   - User registrations
   - Customer deposit requests
   - Admin deposit approvals and rejections
   - Admin direct messages and notifications sent to users
   - Item and auction creation and modifications
   - Password changes and credential updates
   - Admin login and logout sessions
   - Superadmin executive balance adjustments and governance actions
3. **Admin Device & Session Security Section**: Real-time presence and concurrent device monitor tracking each administrator's connected hardware:
   - Online / Offline presence detection (based on active ping within the last 5 minutes)
   - Active device count per admin with automatic alerts whenever an admin account is active on $\ge 2$ devices simultaneously
   - Granular session inspector displaying device type, browser, OS, IP address, first login timestamp, and last heartbeat
   - One-click "Revoke Session" and "Revoke All Other Devices" buttons to remotely disconnect suspicious or unauthorized logins
4. **Deposit & User Directory Hardening**: Validates that standard Admins never see fellow admin records in user directories, and Superadmin deposit views are strictly non-executable audit streams.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. System Movement Controller (Activity Control Room)
- The Superadmin navigates to the **Executive Desk** and selects the **Activity Control Room** tab.
- At the top, executive metric counters display: Total Recorded Movements, Active Admin Sessions, 24-Hour Event Volume, and Security Alerts.
- A quick-filter category bar allows 1-click filtering:
  `All Movements` · `User Registrations` · `Deposit Lifecycle` · `Auctions & Items` · `Security & Auth` · `Staff Notifications` · `Admin Sessions` · `Superadmin Actions`.
- A date/time classifier allows viewing events by date grouping (Today, Yesterday, Older) with chronological descending order.
- Each event row displays:
  - Exact tabular timestamp (`YYYY-MM-DD HH:mm:ss`)
  - Actor indicator with role badge (e.g., `Customer @dawit`, `Admin @alex`, `Superadmin @superadmin`)
  - Movement type badge with semantic colors (Green for approvals, Amber for requests/changes, Crimson for suspensions/revocations, Purple for executive adjustments)
  - Detailed narrative description and affected target entity ID / username
  - Client IP address and device signature
- Real-time refresh toggle and live search input for filtering by username, action name, IP address, or description.

#### B. Multi-Device & Session Security Monitor
- The Superadmin opens the **Device & Session Security** section.
- An alert banner is displayed at the top if any admin account is detected with $\ge 2$ active devices:
  `⚠️ Multi-Device Alert: Admin @alex is currently connected from 2 active devices (Chrome on MacOS, Mobile Safari on iOS).`
- An admin presence grid displays each registered administrator:
  - Avatar, username, and assigned 2-letter routing prefix (e.g., `ax`, `op`)
  - Presence status: Pulsing green dot for **Online** (heartbeat within 5m), muted dot for **Offline**
  - Active device count badge: Neutral for 1 device, Crimson alert for $\ge 2$ devices
  - Expandable device list showing each active session:
    * Device badge (Desktop / Mobile / Tablet)
    * Browser & OS (e.g., Chrome 124 on macOS Sonoma)
    * IP address & session creation timestamp
    * Last active heartbeat timestamp
    * Action button: **Disconnect Device** (invalidates the session token immediately)
    * Bulk action: **Revoke All Other Sessions** (preserves only the primary session)

#### C. Read-Only Deposit Audit View
- When the Superadmin views the **Customer Deposits** desk:
  - Action buttons (`Approve & Disburse`, `Reject Request`) are replaced with a clear informational notice:
    `🔒 Executive Audit View: Deposit verification and balance disbursement is strictly delegated to assigned Operations Admins.`
  - The assigned desk admin (e.g., `@alex`, prefix `ax`) and audit status are displayed with clear visual hierarchy.

#### D. Active Users Protection
- Standard Operations Admins browsing `/admin/users` strictly see customer/bidder accounts with phone numbers and balances. Other administrator accounts, permissions, and internal staff records are omitted both from the API response and table rendering.

### Visual Identity & Theme
- **Color Discipline**: Strict 60-30-10 distribution. Deep slate `#070709` and `#0c0c10` canvas (60%), structured surface borders `#27272a` with subtle zinc cards `#121215` (30%), and gold `#E5B842` / rose `#F43F5E` / emerald `#10B981` accents (10%).
- **Typography**: Clean sans headers (`Cabinet Grotesk` / `Plus Jakarta Sans`) paired with tabular monospace numerals (`font-mono tabular-nums`) for timestamps, IP addresses, session tokens, and currency amounts.
- **Zero-Pill Discipline**: Metadata uses clean inline text separated by typographic middots (`·`) rather than nested colored pills.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Single Superadmin Enforcement
- **Approach**: Hardcoded database constraint in `server/db.ts` and route validator in `server.ts`. If an account with `role === 'superadmin'` exists, any attempt to register, provision, or promote another account to `superadmin` fails with HTTP 400/403.
- **Why**: Eliminates privilege escalation risk and satisfies the user's explicit safety requirement.

### 2. Unified Movement Classification vs Separate Logs
- **Approach**: Comprehensive system movement pipeline (`system_activities` store) capturing all platform movements uniformly with structured fields (`category`, `action`, `actor_id`, `actor_username`, `actor_role`, `target_id`, `target_type`, `details`, `ip_address`, `user_agent`, `created_at`).
- **Why**: Allows the Superadmin to filter, search, and audit everything in one central console classified by date and time without fragmenting across disjointed logs.

### 3. Session Fingerprinting & Multi-Device Heartbeats
- **Approach**: Session store tracking active admin tokens with parsed User-Agent (OS, browser, device category), IP address, and last seen timestamp. When an admin makes API calls, their session heartbeat is refreshed.
- **Why**: Accurately detects whether an admin is logged in from multiple devices in real-time, displays human-readable device names, and enables instant remote revocation.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SUPERADMIN EXECUTIVE DESK                       │
├────────────────────┬───────────────────────┬───────────────────────────┤
│  Activity Control  │   Device & Sessions   │   Deposit Audit (Read-   │
│   Room (Timeline)  │   Security Monitor    │          Only)            │
└─────────┬──────────┴───────────┬───────────┴─────────────┬─────────────┘
          │                      │                         │
          ▼                      ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          EXPRESS API LAYER                             │
│  • /api/superadmin/activities (classified events & date filters)       │
│  • /api/superadmin/devices (active sessions, online/offline, alerts)   │
│  • /api/superadmin/devices/revoke (remote session termination)         │
│  • /api/admin/users (strict customer-only filter for standard admins)   │
│  • /api/admin/deposits/approve (blocks superadmin execution)           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        IN-MEMORY & JSON DATABASE                       │
│  • db.logActivity(...) [records all movements automatically]          │
│  • db.registerDeviceSession(...) & db.revokeSession(...)               │
│  • db.getAdminDeviceStatuses() [detects multi-device usage]           │
│  • Single superadmin guard in createUser & createAdmin                 │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Models

#### 1. System Activity Movement Record
```typescript
interface SystemMovement {
  id: string;
  category: 
    | 'USER_LIFECYCLE'
    | 'DEPOSIT_LIFECYCLE'
    | 'AUCTIONS_ITEMS'
    | 'SECURITY_AUTH'
    | 'STAFF_NOTIFICATIONS'
    | 'SUPERADMIN_ACTION';
  action: string; // e.g., 'USER_REGISTERED', 'DEPOSIT_REQUESTED', 'DEPOSIT_APPROVED', 'PASSWORD_CHANGED', etc.
  actor_id: string;
  actor_username: string;
  actor_role: 'customer' | 'admin' | 'superadmin' | 'system';
  target_id?: string;
  target_username?: string;
  target_type?: string;
  details: string;
  metadata?: Record<string, any>;
  ip_address: string;
  user_agent?: string;
  created_at: string;
}
```

#### 2. Admin Active Device Session Record
```typescript
interface AdminDeviceSession {
  id: string;
  user_id: string;
  username: string;
  token_id: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip_address: string;
  is_online: boolean; // heartbeat < 5 minutes
  login_at: string;
  last_active_at: string;
}
```

### Step-by-Step Implementation Sequence
1. **Database & Backend Layer (`server/db.ts` & `server.ts`)**:
   - Enforce single Superadmin constraint in `createUser`, `createAdmin`, and `/api/superadmin/admins/create`.
   - Implement `logActivity` system that hooks into:
     * User registration (`/api/auth/register`)
     * Deposit requests (`/api/payments/deposit`)
     * Deposit approvals and rejections (`approveDeposit`, `rejectDeposit`)
     * Direct user messaging (`/api/admin/users/:id/message`)
     * Auction/Item creation and updates (`/api/admin/auctions`, `/api/admin/auctions/:id`)
     * Password changes and credential updates (`/api/auth/change-password`, `/api/auth/reset-password`)
     * Admin logins & logouts (`/api/auth/login`, `/api/auth/logout`)
     * Superadmin balance adjustments and staff provisioning
   - Implement active session and device tracker:
     * Register device session on login with parsed User-Agent
     * Update session heartbeat on authenticated requests
     * Remove session on logout or revocation
     * Expose `/api/superadmin/activities` with date, category, and search filters
     * Expose `/api/superadmin/devices` with multi-device detection flags and online/offline status
     * Expose `/api/superadmin/devices/revoke` for single or bulk revocation
2. **Frontend UI Components**:
   - Create `SuperAdminActivityController.tsx`: High-density classified movement timeline with category filters, date groupings, search, and real-time refresh.
   - Create `SuperAdminDeviceSecurity.tsx`: Admin device monitor with online/offline indicators, multi-device alert badges, session specifications, and revoke buttons.
   - Update `AdminWorkstation.tsx`: Add dedicated navigation tabs for **Activity Control Room** and **Device & Session Security**, and ensure clean routing.
   - Update `AdminDepositRequests.tsx`: Confirm read-only audit mode for Superadmin with no accept or reject action buttons.
   - Update `AdminUsersTable.tsx`: Confirm standard admins strictly see customers only, with other admin details hidden.
   - Update `SuperAdminAdmins.tsx`: Lock role creation to `admin` only with clear single-superadmin policy notice.
3. **Verification**:
   - Run `compile_applet` and test all endpoints to guarantee zero regressions.
