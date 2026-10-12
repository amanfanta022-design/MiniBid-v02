# Implementation Plan: SuperAdmin SMTP & Gmail Settings Desk with Transparent OTP Delivery

This plan resolves the core issue where the system reported "OTP Sent" without delivering emails to real inboxes, by providing an in-app SuperAdmin SMTP & Gmail configuration desk and an honest, transparent verification experience.

---

## 1. Problem Summary & User Preferences
- **Root Cause**: Node.js cloud servers cannot send external emails without an authenticated SMTP relay or transactional API. In this environment, `SMTP_HOST` and `RESEND_API_KEY` were empty, causing the backend to silently capture OTPs in internal server memory while returning `success: true`.
- **False Positive UX**: The modal displayed a bright green "OTP Sent" badge, misleading the user into waiting for an email in their Gmail inbox.
- **User Decision**:
  1. Add a **SuperAdmin SMTP and Gmail settings desk** in the Admin Workstation to configure and test live email delivery.
  2. When email credentials are not yet configured, the UI will **show a clear sandbox notice with the code displayed on screen** and an auto-fill button.

---

## 2. Proposed Architecture & Changes

### A. Database & Persistent Email Settings (`server/db.ts`)
- Add `email_settings` schema to persistent database store:
  - `provider`: `'gmail_smtp' | 'custom_smtp' | 'resend_api' | 'sandbox'`
  - `smtp_host`: string (e.g., `smtp.gmail.com`)
  - `smtp_port`: number (e.g., `465` or `587`)
  - `smtp_secure`: boolean
  - `smtp_user`: string (e.g., admin Gmail address)
  - `smtp_pass`: string (e.g., 16-character Google App Password)
  - `from_name`: string (e.g., `MiniBid Ethiopia`)
  - `from_email`: string (e.g., `noreply@minibid.et` or Gmail address)
  - `resend_api_key`: string (optional)
  - `is_enabled`: boolean
  - `last_tested_at`: string
  - `last_test_status`: string
- Add `db.getEmailSettings()` and `db.saveEmailSettings()` with audit logging.

### B. Dynamic Email Service Reloading (`server/emailService.ts`)
- Enable `emailService` to initialize transports dynamically from:
  1. Saved database settings (primary priority)
  2. Environment variables (`SMTP_HOST`, `RESEND_API_KEY`) as fallback
  3. Sandbox mode when unconfigured
- Add `emailService.reloadConfig()` to refresh active Nodemailer transports immediately when updated from the UI without restarting the dev server.
- Add `emailService.sendTestEmail(toEmail, actor)` to allow SuperAdmin to test deliverability with live verification feedback.

### C. Backend API Routes (`server.ts`)
- `GET /api/superadmin/email-settings`: Authenticated endpoint (SuperAdmin only) to fetch current email gateway status, provider, and masked credentials.
- `POST /api/superadmin/email-settings`: Authenticated endpoint to save and test SMTP/Gmail credentials.
- `POST /api/superadmin/email-settings/test`: Send a test email to any specified recipient (e.g., `amanfanta022@gmail.com`) and return exact transport handshake details.
- Update `/api/auth/email-otp/send`: Return clear status (`is_live: boolean`, `provider: string`, `code: string` when in sandbox mode).

### D. SuperAdmin Email & SMTP Gateway Desk (`src/components/AdminEmailSmtpDesk.tsx`)
- Add new workstation tab **Email & SMTP Gateway** (`Mail` icon) in `AdminWorkstation.tsx`.
- Visual features:
  - Provider selector: **Google / Gmail SMTP (Recommended)**, **Custom SMTP Server**, or **Resend API**.
  - Built-in guide for Gmail App Passwords: Step-by-step instructions on generating a 16-character App Password at `myaccount.google.com/apppasswords`.
  - Credentials form: Host, Port, Secure SSL/TLS toggle, Username, Password, Sender Name, From Address.
  - Interactive "Live Test Dispatcher": Test input with recipient email, "Send Test Email" button, and live status indicator.
  - Recent dispatch activity log: Inspect sent OTPs, target emails, timestamps, and delivery providers.

### E. Honest & Transparent Verification UX (`src/components/EmailVerificationModal.tsx`)
- When `is_live === false` (no SMTP connected):
  - Do NOT show misleading "OTP Sent" badge.
  - Display prominent amber banner: **"Testing Sandbox Mode (No Live SMTP Connected)"**.
  - Explain: *"An external mail server is not yet configured in the Admin settings. Your verification code is displayed below:"*
  - Prominently render the 6-digit code with a 1-click **Auto-Fill Code** button so the user can verify without interruption.
  - Provide a link for SuperAdmin: *"Configure Live SMTP in Admin Workstation"*.
- When `is_live === true` (live SMTP connected):
  - Display green badge: **"Live Email Dispatched to Inbox"**.
  - Show delivery provider notice (e.g., *"Dispatched via Gmail SMTP to your inbox"*).

---

## 3. Verification & Testing Steps
1. Verify `tsc --noEmit` and `compile_applet` build with zero errors.
2. In SuperAdmin Workstation: open new **Email & SMTP Gateway** tab.
3. Test sandbox verification flow in customer modal: confirm clear sandbox indicator and 1-click auto-fill.
4. Test live SMTP configuration and test email dispatch endpoint.
