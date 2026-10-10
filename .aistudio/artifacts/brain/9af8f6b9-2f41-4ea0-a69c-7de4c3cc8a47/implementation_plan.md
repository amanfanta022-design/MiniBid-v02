# Implementation Plan: Direct Username & Phone Auth with Email OTP Verified Badge

## 1. Executive Summary & Goals

### The Problem
- Physical SMS cellular delivery requires telecom carrier accounts and paid credits per text, causing confusion and delivery failures for phone-based OTP verification.
- Customer sign-up and login were blocked by phone OTP requirements.

### The Solution
- **Remove Phone OTP entirely**: Customers register directly using **Username**, **Password (at least 6 characters)**, and valid **Ethiopian Phone Number** (+2519..., +2517..., 09..., 07...).
- **Unified Password Login**: Customers sign in seamlessly in a single step using either their **Username or Phone Number** + **Password**.
- **Optional Email Address & Email OTP Verification**:
  - Customers can provide an email during registration or add one anytime from their Dashboard.
  - Adding an email triggers a 6-digit OTP sent to their inbox.
  - Verifying the email unlocks the official **"Verified" Profile Badge** displayed next to their username across the application.
- **Cost-Free Email Delivery Architecture**: Standard SMTP / Resend integration with an instant development inspection fallback so local and staging environments work smoothly without requiring paid telecom SMS.

---

## 2. Architecture & Data Flow

```
[Customer Sign-Up]
  ├── Username (>= 6 chars, alphanumeric)
  ├── Ethiopian Phone (+2519... / +2517... / 09... / 07...)
  ├── Password (>= 6 chars)
  └── Optional Email
        │
        ├── If Email Provided ──> Send Email OTP (Free SMTP / Resend / Sandbox fallback)
        │                            ├── Enter 6-digit Code ──> email_verified = true (Verified Badge Awarded!)
        │                            └── Skip / Verify Later ──> User created, can verify anytime in Dashboard
        └── If No Email ───────────> Account created immediately (Active, 0.00 ETB)

[Customer Sign-In]
  ├── Identifier: Username OR Ethiopian Phone Number
  └── Password
        └── Instant authentication (No OTP required)

[Customer Dashboard & Profile]
  ├── Profile Header displays "@username" + [Verified Badge] (if email_verified)
  └── Email Management Section:
        ├── If unverified: "Add/Verify email to earn your Verified Badge" [Send OTP]
        └── If verified: Green checkmark & verified email address with badge status
```

---

## 3. Detailed Implementation Steps

### Phase 1: Backend Data Model & Email OTP Service (`server.ts`, `server/db.ts`)
1. **Email OTP Store**:
   - Store active email OTP codes with expiration (10 minutes) and rate limiting.
   - Methods in `db.ts`:
     - `createEmailOtp(email, userId)`
     - `verifyEmailOtp(email, code, userId)`
     - `updateUserEmail(userId, email, isVerified)`
2. **Email Delivery Dispatcher (`server/emailService.ts`)**:
   - Configurable for Resend API or standard SMTP (e.g. Gmail / Brevo / Ethereal / Custom SMTP).
   - Instant Dev Sandbox Fallback: logs email dispatches to a memory buffer accessible via `/api/auth/email-otp/sandbox-preview` so developers and testers can verify codes during testing without waiting.
3. **API Endpoints**:
   - `POST /api/auth/register`: Update to accept `username`, `phone`, `password`, and optional `email`. Remove mandatory phone OTP code check.
   - `POST /api/auth/login`: Ensure `identifier` seamlessly accepts either username or Ethiopian phone number with standard password.
   - `POST /api/auth/email-otp/send`: Dispatches 6-digit OTP code to specified email address.
   - `POST /api/auth/email-otp/verify`: Validates email OTP and sets `email_verified: true` for the account.
   - `GET /api/auth/email-otp/sandbox-preview`: Provides instant inspection of the last sent email OTP for testing.
   - `PUT /api/auth/profile/email`: Allows authenticated users to update their email address and trigger OTP verification.

### Phase 2: Frontend Auth Modal Simplification (`src/components/AuthModal.tsx`)
1. **Login Tab**:
   - Single clean input form:
     - "Username or Phone Number" (+2519..., 09..., or username handle)
     - "Password" with show/hide toggle
     - "Sign In" button with loading state
   - Remove phone OTP input, send OTP button, and countdown timer from login.
2. **Registration Tab**:
   - Form fields:
     - Username (alphanumeric, >= 6 characters)
     - Ethiopian Phone Number (+2519..., +2517..., 09..., 07...)
     - Password (>= 6 characters)
     - Optional Email field with a badge incentive pill: *"Add email to get a Verified Badge"*
   - Remove phone SMS OTP requirement from registration.
   - If user enters an email during registration, offer an optional email OTP step or allow instant completion with prompt to verify email in dashboard.
3. **Remove Clutter**:
   - Remove obsolete SMS gateway sandbox drawer and telecom gateway errors from player-facing modal.

### Phase 3: Verified Badge & Dashboard Email Management (`src/components/`)
1. **Verified Badge Component**:
   - Visual styling: Glowing emerald/gold badge with `CheckCircle2` icon and label *"Verified"*.
   - Render in `Header.tsx` (next to `@username` in player header).
   - Render in `AuctionsList.tsx` (in the VIP Dashboard greeting).
   - Render in `UserDashboard.tsx` (in the player identity card).
2. **Email Verification Module in `UserDashboard.tsx`**:
   - Dedicated card in the profile view:
     - If verified: Displays verified email with checkmark and active badge indicator.
     - If not verified: Input field for email, "Send OTP" button, and 6-digit code entry modal/drawer.
     - Instant dev preview helper button for local/sandbox testing.
3. **Context Updates (`src/context/AuthContext.tsx`)**:
   - Add `sendEmailOtp(email)`, `verifyEmailOtp(email, code)`, and `updateEmail(email)` helper methods.

### Phase 4: Localization & Validation Polish (`src/utils/i18n.ts`)
1. Provide bilingual translations (Amharic & English) for:
   - "Username or Phone Number" / "የተጠቃሚ ስም ወይም ስልክ ቁጥር"
   - "Optional Email (for Verified Badge)" / "አማራጭ ኢሜይል (የተረጋገጠ ባጅ ለማግኘት)"
   - "Email OTP Verification" / "የኢሜይል OTP ማረጋገጫ"
   - "Verified Badge" / "የተረጋገጠ ባጅ"
   - "Enter 6-digit code sent to your email" / "ወደ ኢሜይልዎ የተላከውን ባለ 6 አሃዝ ኮድ ያስገቡ"

---

## 4. User Experience Flow

| Step | User Action | System Response |
|------|-------------|-----------------|
| **1. Register** | Enters `@johndoe`, `+251912345678`, password, optional email `john@example.com` | Account created instantly; welcome message displayed; if email entered, OTP dispatched. |
| **2. Login** | Enters `0912345678` (or `@johndoe`) and password | Authenticates immediately without SMS codes or waiting. |
| **3. Verify Email** | Clicks "Verify Email" in Dashboard or during signup, enters 6-digit email code | Email marked verified; **"Verified" Badge** illuminates on profile & header. |

---

## 5. Verification & Testing Checklist
- [ ] Register new account with Username + Phone + Password (without email) -> Succeeds immediately without OTP.
- [ ] Sign out and log in using Phone Number + Password -> Logs in immediately.
- [ ] Sign out and log in using Username + Password -> Logs in immediately.
- [ ] Register with optional email -> Dispatches email OTP, validates code, awards Verified Badge.
- [ ] From User Dashboard, add/verify email on an unverified account -> OTP sent, code verified, badge appears.
- [ ] Verified badge renders consistently across Header, Dashboard, and Auctions List.
- [ ] Build succeeds with zero errors via `compile_applet`.
