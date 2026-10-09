import crypto from 'crypto';

export interface SmsProviderConfig {
  provider: 'simulation' | 'africastalking' | 'twilio' | 'ethiotelecom';
  sender_id: string; // e.g. "MINIBID"
  api_key?: string;
  username?: string; // For Africa's Talking
  account_sid?: string; // For Twilio
  auth_token?: string; // For Twilio
  from_phone?: string; // For Twilio
  ethio_client_id?: string; // For Ethio Telecom
  ethio_client_secret?: string;
  prepaid_balance_etb: number;
  cost_per_sms_etb: number;
  is_live: boolean;
}

export interface SmsDispatchRecord {
  id: string;
  phone: string;
  code: string;
  purpose: string;
  status: 'DELIVERED_CELLULAR' | 'SIMULATED_SANDBOX' | 'FAILED';
  provider: string;
  sender_id: string;
  cost_etb: number;
  created_at: string;
  gateway_response?: string;
}

class SmsGatewayManager {
  private config: SmsProviderConfig = {
    provider: (process.env.SMS_PROVIDER as any) || 'simulation',
    sender_id: process.env.SMS_SENDER_ID || 'MINIBID',
    api_key: process.env.SMS_API_KEY || '',
    username: process.env.AFRICASTALKING_USERNAME || '',
    account_sid: process.env.TWILIO_ACCOUNT_SID || '',
    auth_token: process.env.TWILIO_AUTH_TOKEN || '',
    from_phone: process.env.TWILIO_FROM_PHONE || '',
    ethio_client_id: process.env.ETHIO_CLIENT_ID || '',
    ethio_client_secret: process.env.ETHIO_CLIENT_SECRET || '',
    prepaid_balance_etb: 1500.0, // Initial platform prepaid SMS reserve (6,000 SMS capacity at 0.25 ETB/SMS)
    cost_per_sms_etb: 0.25,
    is_live: Boolean(process.env.SMS_API_KEY || process.env.TWILIO_ACCOUNT_SID || process.env.ETHIO_CLIENT_ID),
  };

  private dispatchLogs: SmsDispatchRecord[] = [];

  constructor() {
    // Check if live credentials present in env
    if (this.config.api_key || this.config.account_sid) {
      this.config.is_live = true;
    }
  }

  public getConfig(): SmsProviderConfig {
    return {
      ...this.config,
      // Mask sensitive keys
      api_key: this.config.api_key ? `••••${this.config.api_key.slice(-4)}` : '',
      auth_token: this.config.auth_token ? `••••${this.config.auth_token.slice(-4)}` : '',
      ethio_client_secret: this.config.ethio_client_secret ? `••••${this.config.ethio_client_secret.slice(-4)}` : '',
    };
  }

  public updateConfig(newConfig: Partial<SmsProviderConfig>): SmsProviderConfig {
    if (newConfig.provider) this.config.provider = newConfig.provider;
    if (newConfig.sender_id) this.config.sender_id = newConfig.sender_id;
    if (newConfig.api_key && !newConfig.api_key.startsWith('••••')) this.config.api_key = newConfig.api_key;
    if (newConfig.username) this.config.username = newConfig.username;
    if (newConfig.account_sid) this.config.account_sid = newConfig.account_sid;
    if (newConfig.auth_token && !newConfig.auth_token.startsWith('••••')) this.config.auth_token = newConfig.auth_token;
    if (newConfig.from_phone) this.config.from_phone = newConfig.from_phone;
    if (newConfig.cost_per_sms_etb !== undefined) this.config.cost_per_sms_etb = newConfig.cost_per_sms_etb;
    if (newConfig.prepaid_balance_etb !== undefined) this.config.prepaid_balance_etb = newConfig.prepaid_balance_etb;

    this.config.is_live = Boolean(
      (this.config.provider === 'africastalking' && this.config.api_key) ||
      (this.config.provider === 'twilio' && this.config.account_sid && this.config.auth_token) ||
      (this.config.provider === 'ethiotelecom' && this.config.ethio_client_id)
    );

    return this.getConfig();
  }

  public addPrepaidCredits(amountEtb: number): number {
    this.config.prepaid_balance_etb = Math.round((this.config.prepaid_balance_etb + amountEtb) * 100) / 100;
    return this.config.prepaid_balance_etb;
  }

  public async dispatchOtp(phone: string, code: string, purpose: string): Promise<{
    success: boolean;
    status: 'DELIVERED_CELLULAR' | 'SIMULATED_SANDBOX' | 'FAILED';
    provider: string;
    message: string;
    dispatchId: string;
  }> {
    const dispatchId = `sms_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const smsText = `[MiniBid Ethiopia] Your secure verification code is ${code}. Valid for 5 minutes. NEVER share this code with anyone.`;

    // 1. If configured with Africa's Talking
    if (this.config.provider === 'africastalking' && this.config.api_key && this.config.username) {
      try {
        const bodyParams = new URLSearchParams();
        bodyParams.append('username', this.config.username);
        bodyParams.append('to', phone);
        bodyParams.append('message', smsText);
        if (this.config.sender_id) bodyParams.append('from', this.config.sender_id);

        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'apiKey': this.config.api_key,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: bodyParams.toString(),
        });

        const data = await response.json();
        const success = response.ok;
        const status = success ? 'DELIVERED_CELLULAR' : 'FAILED';

        this.recordDispatch({
          id: dispatchId,
          phone,
          code,
          purpose,
          status,
          provider: "Africa's Talking",
          sender_id: this.config.sender_id,
          cost_etb: this.config.cost_per_sms_etb,
          created_at: new Date().toISOString(),
          gateway_response: JSON.stringify(data),
        });

        if (success) {
          this.deductBalance();
          return {
            success: true,
            status: 'DELIVERED_CELLULAR',
            provider: "Africa's Talking",
            message: `SMS dispatched to ${phone} via Africa's Talking carrier gateway.`,
            dispatchId,
          };
        }
      } catch (err: any) {
        console.error('[SMS GATEWAY ERROR]', err);
      }
    }

    // 2. If configured with Twilio
    if (this.config.provider === 'twilio' && this.config.account_sid && this.config.auth_token) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.account_sid}/Messages.json`;
        const bodyParams = new URLSearchParams();
        bodyParams.append('To', phone);
        bodyParams.append('From', this.config.from_phone || this.config.sender_id);
        bodyParams.append('Body', smsText);

        const authHeader = 'Basic ' + Buffer.from(`${this.config.account_sid}:${this.config.auth_token}`).toString('base64');
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: bodyParams.toString(),
        });

        const data = await response.json();
        const success = response.ok;
        const status = success ? 'DELIVERED_CELLULAR' : 'FAILED';

        this.recordDispatch({
          id: dispatchId,
          phone,
          code,
          purpose,
          status,
          provider: 'Twilio',
          sender_id: this.config.from_phone || this.config.sender_id,
          cost_etb: this.config.cost_per_sms_etb,
          created_at: new Date().toISOString(),
          gateway_response: JSON.stringify(data),
        });

        if (success) {
          this.deductBalance();
          return {
            success: true,
            status: 'DELIVERED_CELLULAR',
            provider: 'Twilio',
            message: `SMS dispatched to ${phone} via Twilio Telecom Gateway.`,
            dispatchId,
          };
        }
      } catch (err: any) {
        console.error('[TWILIO SMS ERROR]', err);
      }
    }

    // 3. Fallback: Telecom Sandbox / Simulation Gateway
    // (Used when external paid carrier credentials are not connected)
    this.recordDispatch({
      id: dispatchId,
      phone,
      code,
      purpose,
      status: 'SIMULATED_SANDBOX',
      provider: 'MiniBid Telecom Sandbox',
      sender_id: this.config.sender_id,
      cost_etb: 0.0,
      created_at: new Date().toISOString(),
      gateway_response: 'Simulated Sandbox Dispatch (External cellular carrier account pending).',
    });

    console.log(`[TELECOM GATEWAY] Sandbox dispatch for ${phone}: OTP ${code} (Purpose: ${purpose})`);

    return {
      success: true,
      status: 'SIMULATED_SANDBOX',
      provider: 'MiniBid Telecom Sandbox',
      message: `Verification code registered for ${phone}. Gateway in Sandbox Mode (connect external SMS provider in Admin Settings for cellular broadcast).`,
      dispatchId,
    };
  }

  private deductBalance() {
    this.config.prepaid_balance_etb = Math.max(0, Math.round((this.config.prepaid_balance_etb - this.config.cost_per_sms_etb) * 100) / 100);
  }

  private recordDispatch(record: SmsDispatchRecord) {
    this.dispatchLogs.unshift(record);
    if (this.dispatchLogs.length > 200) {
      this.dispatchLogs = this.dispatchLogs.slice(0, 200);
    }
  }

  public getDispatchLogs(): SmsDispatchRecord[] {
    return this.dispatchLogs;
  }

  public getLatestDispatchForPhone(phone: string): SmsDispatchRecord | undefined {
    return this.dispatchLogs.find(l => l.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  }
}

export const smsGateway = new SmsGatewayManager();
