/**
 * MiniBid Ethiopia — Email Verification & Delivery Service
 * Supports Google/Gmail SMTP, Custom SMTP, Resend REST API, and Developer Testing Sandbox.
 */

import nodemailer, { type Transporter } from 'nodemailer';

export interface EmailDispatchRecord {
  id: string;
  email: string;
  code: string;
  subject: string;
  timestamp: number;
  provider: 'GMAIL_SMTP' | 'SMTP' | 'RESEND' | 'SANDBOX_DEV';
  status: 'DELIVERED_INBOX' | 'QUEUED_SANDBOX' | 'FAILED';
  error_message?: string;
  html_preview: string;
}

export interface EmailGatewaySettings {
  provider: 'gmail_smtp' | 'custom_smtp' | 'resend_api' | 'sandbox';
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_pass: string;
  from_name: string;
  from_email: string;
  resend_api_key?: string;
  is_enabled: boolean;
  last_tested_at?: string;
  last_test_status?: 'success' | 'failed' | 'pending';
  last_test_message?: string;
}

class EmailService {
  private resendApiKey: string | null = null;
  private resendFromEmail: string = 'MiniBid Ethiopia <onboarding@resend.dev>';
  private smtpTransporter: Transporter | null = null;
  private activeProvider: 'gmail_smtp' | 'custom_smtp' | 'resend_api' | 'sandbox' = 'sandbox';
  private smtpFromEmail: string = 'MiniBid Ethiopia <noreply@minibid.et>';
  private fromName: string = 'MiniBid Ethiopia';
  private dispatches: Map<string, EmailDispatchRecord> = new Map();
  private dispatchHistory: EmailDispatchRecord[] = [];

  constructor() {
    this.initFromEnv();
  }

  private initFromEnv() {
    this.resendApiKey = process.env.RESEND_API_KEY || null;
    if (process.env.RESEND_FROM_EMAIL) {
      this.resendFromEmail = process.env.RESEND_FROM_EMAIL;
    }

    if (process.env.SMTP_HOST) {
      const port = parseInt(process.env.SMTP_PORT || '465', 10);
      const secure = port === 465 || process.env.SMTP_SECURE === 'true';
      this.smtpFromEmail = process.env.SMTP_FROM || process.env.SMTP_USER || this.smtpFromEmail;

      this.smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure,
        auth: process.env.SMTP_USER
          ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS || '',
            }
          : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });
      this.activeProvider = process.env.SMTP_HOST.includes('gmail') ? 'gmail_smtp' : 'custom_smtp';
      console.log(`[EmailService] Env SMTP initialized: ${process.env.SMTP_HOST}:${port} (secure: ${secure})`);
    } else if (this.resendApiKey) {
      this.activeProvider = 'resend_api';
    } else {
      this.activeProvider = 'sandbox';
    }
  }

  /**
   * Dynamically reload email transport configuration from database settings
   */
  public reloadConfig(settings: EmailGatewaySettings) {
    console.log(`[EmailService] Reloading email configuration: provider=${settings.provider}, enabled=${settings.is_enabled}`);
    
    if (!settings.is_enabled || settings.provider === 'sandbox') {
      this.smtpTransporter = null;
      this.resendApiKey = null;
      this.activeProvider = 'sandbox';
      return;
    }

    this.fromName = settings.from_name || 'MiniBid Ethiopia';
    this.activeProvider = settings.provider;

    if (settings.provider === 'gmail_smtp' || settings.provider === 'custom_smtp') {
      const host = settings.provider === 'gmail_smtp' ? (settings.smtp_host || 'smtp.gmail.com') : settings.smtp_host;
      const port = Number(settings.smtp_port) || (settings.provider === 'gmail_smtp' ? 465 : 587);
      const secure = settings.smtp_secure !== undefined ? Boolean(settings.smtp_secure) : (port === 465);

      const senderEmail = settings.from_email || settings.smtp_user || 'noreply@minibid.et';
      this.smtpFromEmail = `${this.fromName} <${senderEmail}>`;

      this.smtpTransporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: settings.smtp_user
          ? {
              user: settings.smtp_user.trim(),
              pass: settings.smtp_pass ? settings.smtp_pass.replace(/\s+/g, '') : '',
            }
          : undefined,
        tls: {
          rejectUnauthorized: false,
        },
      });

      console.log(`[EmailService] SMTP transporter active for ${host}:${port} (user: ${settings.smtp_user})`);
    } else if (settings.provider === 'resend_api') {
      this.smtpTransporter = null;
      this.resendApiKey = settings.resend_api_key || null;
      if (settings.from_email) {
        this.resendFromEmail = `${this.fromName} <${settings.from_email}>`;
      }
    }
  }

  public getConfig() {
    const isLive = Boolean(
      (this.smtpTransporter && (this.activeProvider === 'gmail_smtp' || this.activeProvider === 'custom_smtp')) ||
      (this.resendApiKey && this.activeProvider === 'resend_api')
    );

    let providerName = 'Developer Testing Sandbox (Local Dev)';
    if (this.activeProvider === 'gmail_smtp') providerName = 'Google / Gmail SMTP Relay';
    else if (this.activeProvider === 'custom_smtp') providerName = 'Custom SMTP Relay';
    else if (this.activeProvider === 'resend_api') providerName = 'Resend REST API';

    return {
      is_live: isLive,
      provider: providerName,
      provider_type: this.activeProvider,
      sender_address: this.activeProvider === 'resend_api' ? this.resendFromEmail : this.smtpFromEmail,
    };
  }

  public getLatestDispatchForEmail(rawEmail: string): EmailDispatchRecord | undefined {
    const email = rawEmail.trim().toLowerCase();
    return this.dispatches.get(email);
  }

  public getAllDispatches(): EmailDispatchRecord[] {
    return [...this.dispatchHistory].reverse();
  }

  /**
   * Verify SMTP credentials by sending a live test email and verifying handshake
   */
  public async testConnection(
    targetEmail: string,
    overrideSettings?: Partial<EmailGatewaySettings>
  ): Promise<{
    success: boolean;
    provider: string;
    message: string;
    messageId?: string;
    diagnosticDetails?: string;
  }> {
    const email = targetEmail.trim().toLowerCase();
    const testCode = Math.floor(100000 + Math.random() * 900000).toString();
    const subject = `[MiniBid Ethiopia] SMTP Gateway Test Handshake #${testCode}`;

    let transporterToUse = this.smtpTransporter;
    let senderAddress = this.smtpFromEmail;
    let providerLabel = this.activeProvider === 'gmail_smtp' ? 'Gmail SMTP' : 'Custom SMTP';

    // If override settings provided, build ephemeral transport to test before saving
    if (overrideSettings && (overrideSettings.provider === 'gmail_smtp' || overrideSettings.provider === 'custom_smtp')) {
      const host = overrideSettings.provider === 'gmail_smtp' ? (overrideSettings.smtp_host || 'smtp.gmail.com') : overrideSettings.smtp_host;
      const port = Number(overrideSettings.smtp_port) || (overrideSettings.provider === 'gmail_smtp' ? 465 : 587);
      const secure = overrideSettings.smtp_secure !== undefined ? Boolean(overrideSettings.smtp_secure) : (port === 465);
      const user = overrideSettings.smtp_user?.trim() || '';
      const pass = overrideSettings.smtp_pass ? overrideSettings.smtp_pass.replace(/\s+/g, '') : '';
      const fromName = overrideSettings.from_name || 'MiniBid Ethiopia';
      const fromEmail = overrideSettings.from_email || user || 'noreply@minibid.et';
      senderAddress = `${fromName} <${fromEmail}>`;
      providerLabel = overrideSettings.provider === 'gmail_smtp' ? 'Gmail SMTP' : 'Custom SMTP';

      transporterToUse = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: user ? { user, pass } : undefined,
        tls: { rejectUnauthorized: false },
      });
    }

    if (transporterToUse) {
      try {
        // First verify connection handshake
        await transporterToUse.verify();

        // Second dispatch actual test email to verify mailbox receipt
        const html = `
          <div style="font-family: sans-serif; background: #0c0c0e; color: #fff; padding: 24px; border-radius: 12px; border: 1px solid #333;">
            <h2 style="color: #E5B842; margin-top: 0;">MiniBid Ethiopia — SMTP Delivery Verified!</h2>
            <p>Congratulations! Your mail server handshake is functional and verified.</p>
            <div style="background: #1a1a20; padding: 12px; border-radius: 8px; font-family: monospace; color: #34d399; margin: 16px 0;">
              STATUS: 250 OK - SMTP Handshake Confirmed<br/>
              TEST TOKEN: ${testCode}<br/>
              TIMESTAMP: ${new Date().toISOString()}
            </div>
            <p style="font-size: 12px; color: #888;">This message confirms your email gateway is active. Players will now receive their 6-digit OTP codes in their inbox.</p>
          </div>
        `;

        const info = await transporterToUse.sendMail({
          from: senderAddress,
          to: email,
          subject,
          html,
        });

        return {
          success: true,
          provider: providerLabel,
          message: `Live test email successfully delivered to ${email}. Check your inbox!`,
          messageId: info.messageId,
          diagnosticDetails: `SMTP response: ${info.response || '250 OK'}`,
        };
      } catch (err: any) {
        console.error('[EmailService] SMTP handshake error:', err);
        let guidance = '';
        if (err.message && err.message.includes('Username and Password not accepted')) {
          guidance = ' Google rejected your credentials. You must use a 16-character Google App Password (not your standard Google account password). Go to Google Account -> Security -> 2-Step Verification -> App Passwords.';
        } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          guidance = ' Connection timed out or refused. Check your SMTP host and port (465 with SSL or 587 with STARTTLS).';
        }

        return {
          success: false,
          provider: providerLabel,
          message: `SMTP Handshake Failed: ${err.message}.${guidance}`,
          diagnosticDetails: `Error Code: ${err.code || 'UNKNOWN'} | Command: ${err.command || 'AUTH'}`,
        };
      }
    }

    // Resend API test
    const resendKey = overrideSettings?.resend_api_key || this.resendApiKey;
    if (resendKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendKey}`,
          },
          body: JSON.stringify({
            from: this.resendFromEmail,
            to: [email],
            subject,
            html: `<p>MiniBid Resend API test email. Token: ${testCode}</p>`,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { id: string };
          return {
            success: true,
            provider: 'Resend API',
            message: `Test email successfully dispatched via Resend to ${email}.`,
            messageId: data.id,
          };
        } else {
          const errText = await response.text();
          return {
            success: false,
            provider: 'Resend API',
            message: `Resend API returned error: ${errText}`,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          provider: 'Resend API',
          message: `Resend test failed: ${err.message}`,
        };
      }
    }

    return {
      success: false,
      provider: 'Sandbox',
      message: 'No SMTP or Resend credentials configured to test. Please fill in the SMTP credentials below.',
    };
  }

  public async dispatchEmailOtp(
    targetEmail: string,
    code: string,
    username?: string
  ): Promise<{
    success: boolean;
    provider: string;
    status: 'DELIVERED_INBOX' | 'QUEUED_SANDBOX';
    messageId?: string;
  }> {
    const email = targetEmail.trim().toLowerCase();
    const displayName = username ? `@${username}` : 'Valued Bidder';

    const subject = `[MiniBid Ethiopia] Your Email Verification Code: ${code}`;
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0c0e; color: #f4f4f5; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background: #141418; border: 1px solid #27272a; border-radius: 16px; padding: 32px; }
          .brand { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; background: #E5B842; color: #000; font-weight: 900; font-size: 20px; padding: 8px 16px; border-radius: 8px; letter-spacing: 2px; }
          .title { font-size: 20px; font-weight: 700; color: #ffffff; text-align: center; margin-top: 16px; }
          .badge-banner { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px; text-align: center; color: #34d399; font-size: 13px; font-weight: 600; margin: 20px 0; }
          .code-box { background: #09090b; border: 2px dashed #E5B842; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .code { font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #E5B842; }
          .info { font-size: 13px; color: #a1a1aa; line-height: 1.6; text-align: center; }
          .footer { margin-top: 32px; border-top: 1px solid #27272a; padding-top: 16px; font-size: 11px; color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="brand">
            <div class="logo">MINIBID</div>
            <div class="title">Email Verification Code</div>
          </div>
          
          <div class="badge-banner">
            🛡️ Verifying this email awards you the Verified Profile Badge on your account!
          </div>

          <p class="info">
            Hello ${displayName},<br/>
            Please use the following 6-digit One-Time Password (OTP) to verify your email address on MiniBid Ethiopia:
          </p>

          <div class="code-box">
            <div class="code">${code}</div>
          </div>

          <p class="info">
            This verification code is valid for <strong>10 minutes</strong>. Never share this code with anyone. Platform administrators will never ask for your verification code.
          </p>

          <div class="footer">
            MiniBid Ethiopia • The Lowest Unique Bid Auction Platform<br/>
            Addis Ababa, Ethiopia
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Try sending via standard SMTP if configured
    if (this.smtpTransporter && (this.activeProvider === 'gmail_smtp' || this.activeProvider === 'custom_smtp')) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: this.smtpFromEmail,
          to: email,
          subject,
          html: htmlBody,
        });

        console.log(`[EmailService] Live SMTP email delivered to ${email} (MessageId: ${info.messageId})`);
        const record: EmailDispatchRecord = {
          id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          email,
          code,
          subject,
          timestamp: Date.now(),
          provider: this.activeProvider === 'gmail_smtp' ? 'GMAIL_SMTP' : 'SMTP',
          status: 'DELIVERED_INBOX',
          html_preview: htmlBody,
        };
        this.dispatches.set(email, record);
        this.dispatchHistory.push(record);
        if (this.dispatchHistory.length > 50) this.dispatchHistory.shift();

        return {
          success: true,
          provider: this.activeProvider === 'gmail_smtp' ? 'Gmail SMTP Server' : 'Custom SMTP Server',
          status: 'DELIVERED_INBOX',
          messageId: info.messageId,
        };
      } catch (err: any) {
        console.warn(`[EmailService] Live SMTP send failed: ${err.message}.`);
      }
    }

    // 2. Try sending with Resend if API key is provided
    if (this.resendApiKey && this.activeProvider === 'resend_api') {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.resendApiKey}`,
          },
          body: JSON.stringify({
            from: this.resendFromEmail,
            to: [email],
            subject,
            html: htmlBody,
          }),
        });

        if (response.ok) {
          const data = (await response.json()) as { id: string };
          console.log(`[EmailService] Resend email successfully dispatched to ${email} (ID: ${data.id})`);
          const record: EmailDispatchRecord = {
            id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            email,
            code,
            subject,
            timestamp: Date.now(),
            provider: 'RESEND',
            status: 'DELIVERED_INBOX',
            html_preview: htmlBody,
          };
          this.dispatches.set(email, record);
          this.dispatchHistory.push(record);
          if (this.dispatchHistory.length > 50) this.dispatchHistory.shift();

          return {
            success: true,
            provider: 'Resend API',
            status: 'DELIVERED_INBOX',
            messageId: data.id,
          };
        } else {
          const errText = await response.text();
          console.warn(`[EmailService] Resend dispatch returned non-200: ${errText}. Falling back to sandbox.`);
        }
      } catch (err: any) {
        console.warn(`[EmailService] Failed to send via Resend API: ${err.message}. Falling back to sandbox.`);
      }
    }

    // 3. Developer Sandbox / Dev Testing Record (Transparent fallback)
    console.log(`\n======================================================`);
    console.log(`📧 [MiniBid Email OTP Dispatch - Dev/Sandbox Delivery]`);
    console.log(`Recipient: ${email} (${displayName})`);
    console.log(`OTP Code : >>> ${code} <<<`);
    console.log(`Valid for: 10 minutes`);
    console.log(`Notice   : Live SMTP not configured. OTP displayed in UI.`);
    console.log(`======================================================\n`);

    const record: EmailDispatchRecord = {
      id: `disp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email,
      code,
      subject,
      timestamp: Date.now(),
      provider: 'SANDBOX_DEV',
      status: 'QUEUED_SANDBOX',
      html_preview: htmlBody,
    };
    this.dispatches.set(email, record);
    this.dispatchHistory.push(record);
    if (this.dispatchHistory.length > 50) this.dispatchHistory.shift();

    return {
      success: true,
      provider: 'Developer Testing Sandbox',
      status: 'QUEUED_SANDBOX',
    };
  }
}

export const emailService = new EmailService();
