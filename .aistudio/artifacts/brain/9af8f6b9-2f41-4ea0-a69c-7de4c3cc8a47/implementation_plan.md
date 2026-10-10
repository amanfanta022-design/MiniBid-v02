# Comprehensive Platform Upgrade & Issue Resolution Plan

This plan addresses all 9 specific requirements provided in your request.

---

### 1. Fix Email OTP Verification & Inbox Delivery
- **Problem**: When users register or verify email, codes must be deliverable to real inboxes while remaining verifiable in sandbox mode without external blockers.
- **Solution**:
  - Configure robust email sending via **Resend REST API** (using `RESEND_API_KEY` from environment variables) and standard **SMTP** transport fallback.
  - Enhance the `/api/auth/email-otp/send` and `/api/auth/email-otp/verify` endpoints with rich HTML email templates formatted with branded Ethiopian Birr styling, anti-phishing warnings, and a 10-minute expiry window.
  - Keep the instant **Developer Sandbox Inspector** modal popup accessible so administrators and testers can immediately inspect and auto-fill generated OTPs even without live mailbox access.
  - Automatically grant the **Verified Profile Badge** (🛡️) upon successful code entry.

---

### 2. Live Auction Timers: Days, Hours, Minutes, and Seconds
- **Problem**: Timers currently omit the "Days" count and only show hours/minutes in card views.
- **Solution**:
  - Upgrade the countdown calculation in:
    - `src/components/AuctionsList.tsx` (all live auction cards)
    - `src/components/AuctionDetailModal.tsx` (detail view for bidders and admins)
    - `src/components/SuperAdminLiveGameDesk.tsx` (live radar telemetry desk)
  - Display full dynamic breakdown: **`[D]d [H]h [M]m [S]s`** (e.g., `2d 14h 32m 05s`) in English and **`[D]ቀን [H]ሰዓት [M]ደቂቃ [S]ሰከንድ`** in Amharic.
  - Add visual pulsing/urgency indicators when the auction is under 1 hour or 5 minutes.

---

### 3. "How It Works" Animated Video Guide & Complete Onboarding Walkthrough
- **Problem**: Users need an interactive, visual, animated video-style guide covering:
  1. How to Register (Username, Ethiopian Phone, Password, optional Email)
  2. How to Login (using Username or Phone Number + Password)
  3. How to Deposit (Telebirr, CBE Birr, uploading payment receipt)
  4. How to Bid (Lowest Unique Bid strategy, fee rules)
  5. How to Check Results (Winner determination, live ranking, unique lowest bids)
- **Solution**:
  - Transform `src/components/HowItWorksModal.tsx` into an **Animated Interactive Video Player**:
    - Animated screen-recording mockups with progress scrubbing bar, play/pause controls, step auto-advance, and audio-visual transitions.
    - 5 full chapters (Registration, Login, Deposit & Approval, Bidding Mechanics, Viewing Results & Radar).
    - Interactive "Try a Bid Simulator" allowing users to simulate duplicate vs. unique lowest bids in real-time.

---

### 4. Enable Super Admin Live Auction Editing
- **Problem**: Superadmin was unable to edit active live auctions because the `SuperAdminEditAuctionModal` was not connected to the `AuctionDetailModal` header and control deck.
- **Solution**:
  - Wire the "Edit Auction Item" action button in `AuctionDetailModal.tsx` and `AdminWorkstation.tsx` directly to `SuperAdminEditAuctionModal`.
  - Connect the `PUT /api/superadmin/auctions/:id` backend route allowing Super Admins to edit:
    - Auction title and description
    - Image URL & category
    - Start price, bid increment, participation fee, internal cost
    - **Closing schedule extension/shortening** (End Date/Time) with audit trail logging in `audit_logs` and `system_movements`.

---

### 5. Flag Account on 3 Duplicate Transaction Attempts & Alert Super Admin
- **Problem**: When a user submits an already-used or duplicate transaction reference number 3 times, their account must be automatically flagged and Super Admin notified.
- **Solution**:
  - In `server/db.ts`: Update `createDepositRequest` condition from `> 3` to `>= 3` duplicate attempts.
  - Automatically mark `user.is_flagged = true` and `user.flag_reason = 'Exceeded 3 attempts to submit duplicate/used transaction numbers'`.
  - Immediately dispatch a high-priority `PlatformNotification` to all Super Admin accounts and write a `FRAUD_ALERT_TXN_REUSE` entry into `audit_logs`.
  - Display an audit warning badge in `AdminUsersTable.tsx` with Super Admin clearance action.

---

### 6. Auto-Compress Receipt Screenshots to Under 100KB on Deposit Approval
- **Problem**: High-resolution receipt screenshots take up significant storage in workspace memory and disk backups.
- **Solution**:
  - In `server/db.ts` (`approveDeposit`): Upon successful approval of a deposit request:
    - Check if `deposit.receipt_url` contains an image data URI.
    - Re-encode and compress the base64 image data (downscaling dimensions and applying JPEG/WebP quality compression) so the stored thumbnail/archive is strictly **under 100KB** in size.
    - Update `deposit.receipt_size_bytes` and store the lightweight compressed version for permanent storage, drastically freeing up RAM and JSON persistence size.

---

### 7. Scoped Admin Deposit Requests (Assigned Admin Only)
- **Problem**: Operations Admins were seeing all pending customer deposits instead of only the deposits specifically allocated to their admin account.
- **Solution**:
  - Update `GET /api/admin/deposits` in `server.ts`:
    - If `req.user.role === 'admin'`: Filter deposits where `deposit.assigned_admin_id === req.user.id` or `deposit.assigned_admin_username === req.user.username`.
    - If `req.user.role === 'superadmin'`: Retain executive view of all platform deposit requests.
  - In frontend `AdminWorkstation.tsx`: Show a clear banner indicating *"Showing your assigned deposit verification queue (Admin @username)"*.

---

### 8. Fix Super Admin Live Game Radar Navigation
- **Problem**: When Super Admin selected an auction in the radar/telemetry desk, the 3-second background polling refreshed and reset `selectedGameId` back to the newest live game (`auctionsList[0]`).
- **Solution**:
  - In `src/components/SuperAdminLiveGameDesk.tsx`:
    - Track `selectedGameId` via a React ref or functional state update.
    - During polling refresh, preserve the active selection if it still exists in the list (`prevId && auctionsList.some(g => g.id === prevId) ? prevId : auctionsList[0]?.id`).
    - Only default to the first game on initial mount or when the previously monitored auction concludes.

---

### 9. Platform-Wide Storage Optimization & Data Retention
- **Problem**: Unchecked growth of base64 receipts, redundant audit logs, and old completed auctions consume excessive workspace memory.
- **Solution**:
  - Implement scheduled cleanup in `server/db.ts`:
    - Automatically trim resolved sandbox OTP logs older than 24 hours.
    - Prune duplicate session entries.
    - Store receipts as compressed thumbnails upon verification.
    - Compact persistent JSON storage on disk to eliminate whitespace bloat.

---

## Verification & Testing
1. Compile the applet with `compile_applet`.
2. Verify all UI components, countdown timers (Days, Hours, Minutes, Seconds), and radar persistence.
3. Test deposit submission, 3-attempt duplicate detection flag, receipt compression (<100KB), and admin-specific filtering.
4. Test email OTP generation and Super Admin live auction edit modal.
