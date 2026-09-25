import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Auction,
  Bid,
  DepositRequest,
  Transaction,
  PlatformNotification,
  AuditLog,
  FinancialReport,
  AuctionPnL,
  UserRole,
  AdminFloatRequest,
  FinancialLedgerEntry,
  BlockedApprovalAttempt,
} from '../src/types.js';

// ========================================================
// CRITICAL FINANCIAL INTEGRITY ERROR CLASSES
// ========================================================
export class DuplicateTransactionNumberError extends Error {
  constructor(message = 'This transaction number has already been submitted.') {
    super(message);
    this.name = 'DuplicateTransactionNumberError';
  }
}

export class ConcurrentApprovalConflictError extends Error {
  constructor(message = 'This deposit has already been processed by another administrator.') {
    super(message);
    this.name = 'ConcurrentApprovalConflictError';
  }
}

export class LedgerConstraintViolationError extends Error {
  constructor(message = 'Financial integrity violation: Multiple ledger entries detected for deposit.') {
    super(message);
    this.name = 'LedgerConstraintViolationError';
  }
}

export class InsufficientFloatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientFloatError';
  }
}

export class InvalidReceiptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidReceiptError';
  }
}

// Receipt Validation Helper (File size <= 5MB, MIME, binary magic bytes)
export function validateReceiptPayload(payload: {
  receipt_url?: string;
  receipt_name?: string;
  receipt_mime?: string;
  receipt_size_bytes?: number;
}): { valid: boolean; error?: string } {
  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

  if (payload.receipt_size_bytes && payload.receipt_size_bytes > MAX_BYTES) {
    return { valid: false, error: 'Receipt attachment exceeds strict 5MB limit. Please compress your file.' };
  }

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (payload.receipt_mime && !allowedMimes.includes(payload.receipt_mime.toLowerCase())) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and WebP receipts are accepted.' };
  }

  if (payload.receipt_url && payload.receipt_url.startsWith('data:')) {
    const commaIdx = payload.receipt_url.indexOf(',');
    if (commaIdx === -1) {
      return { valid: false, error: 'Malformed receipt image payload.' };
    }
    const base64Data = payload.receipt_url.substring(commaIdx + 1);
    const approxBytes = Math.floor((base64Data.length * 3) / 4);
    if (approxBytes > MAX_BYTES) {
      return { valid: false, error: 'Uploaded receipt file exceeds 5MB size limit.' };
    }

    // Magic bytes header inspection
    try {
      const headerBuffer = Buffer.from(base64Data.substring(0, 32), 'base64');
      if (headerBuffer.length >= 4) {
        const isJpeg = headerBuffer[0] === 0xff && headerBuffer[1] === 0xd8 && headerBuffer[2] === 0xff;
        const isPng = headerBuffer[0] === 0x89 && headerBuffer[1] === 0x50 && headerBuffer[2] === 0x4e && headerBuffer[3] === 0x47;
        const isWebp = headerBuffer.toString('ascii', 0, 4) === 'RIFF';

        if (!isJpeg && !isPng && !isWebp) {
          return {
            valid: false,
            error: 'Receipt binary integrity check failed. File signature does not match a valid JPEG, PNG, or WebP image.',
          };
        }
      }
    } catch {
      return { valid: false, error: 'Failed to parse receipt image binary.' };
    }
  }

  return { valid: true };
}

interface DatabaseSchema {
  users: (User & { password_hash: string; salt: string })[];
  auctions: Auction[];
  bids: Bid[];
  deposits: DepositRequest[];
  financial_ledger: FinancialLedgerEntry[];
  blocked_approval_attempts: BlockedApprovalAttempt[];
  idempotency_cache: Record<string, { deposit_id: string; result: any; created_at: string }>;
  admin_float_requests: AdminFloatRequest[];
  transactions: Transaction[];
  notifications: PlatformNotification[];
  audit_logs: AuditLog[];
  brand_logo_url?: string | null;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'minibid_db.json');

// Simple PBKDF2 password hashing
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const finalSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, finalSalt, 1000, 32, 'sha256').toString('hex');
  return { hash, salt: finalSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const result = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return result === hash;
}

// Initial seed data generator
function getInitialSeed(): DatabaseSchema {
  const superadminPass = hashPassword('admin123', 'seed_salt_superadmin');
  const adminPass = hashPassword('admin123', 'seed_salt_admin');
  const bidder1Pass = hashPassword('bidder123', 'seed_salt_bidder1');
  const bidder2Pass = hashPassword('bidder123', 'seed_salt_bidder2');
  const bidder3Pass = hashPassword('bidder123', 'seed_salt_bidder3');

  const now = new Date();
  const isoNow = now.toISOString();

  const users: DatabaseSchema['users'] = [
    {
      id: 'usr_superadmin',
      username: 'superadmin',
      email: 'superadmin@minibid.et',
      phone: '+251900000001',
      role: 'superadmin',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      password_hash: superadminPass.hash,
      salt: superadminPass.salt,
    },
    {
      id: 'usr_admin_ops',
      username: 'admin_ops',
      email: 'ops@minibid.et',
      phone: '+251900000002',
      role: 'admin',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      password_hash: adminPass.hash,
      salt: adminPass.salt,
    },
    {
      id: 'usr_aman',
      username: 'aman_bidder',
      email: 'aman@minibid.et',
      phone: '+251911223344',
      role: 'customer',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      password_hash: bidder1Pass.hash,
      salt: bidder1Pass.salt,
    },
    {
      id: 'usr_selam',
      username: 'selam_tech',
      email: 'selam@minibid.et',
      phone: '+251922334455',
      role: 'customer',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      password_hash: bidder2Pass.hash,
      salt: bidder2Pass.salt,
    },
    {
      id: 'usr_dawit',
      username: 'dawit_crypto',
      email: 'dawit@minibid.et',
      phone: '+251933445566',
      role: 'customer',
      wallet_balance: 0,
      status: 'active',
      email_verified: false,
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      password_hash: bidder3Pass.hash,
      salt: bidder3Pass.salt,
    },
  ];

  const auctions: Auction[] = [
    {
      id: 'auc_iphone16pro',
      title: 'Apple iPhone 16 Pro Max 256GB — Desert Titanium',
      category: 'Tech',
      description: 'Brand new factory-sealed Apple iPhone 16 Pro Max featuring Grade 5 Titanium finish, A18 Pro Bionic processor, 48MP Fusion Camera, and 1-year Apple international warranty.',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      start_price: 185000,
      bid_increment: 0.05,
      participation_fee: 40,
      internal_cost: 115000, // CONFIDENTIAL
      status: 'active',
      start_time: new Date(Date.now() - 2 * 3600000).toISOString(),
      end_time: new Date(Date.now() + 48 * 3600000).toISOString(), // 48 hours
      total_bids: 4,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
      id: 'auc_ps5pro',
      title: 'Sony PlayStation 5 Pro 2TB Digital Edition Console',
      category: 'Tech',
      description: 'Next-gen gaming beast with enhanced Ray Tracing, PlayStation Spectral Super Resolution (PSSR), and 2TB high-speed NVMe SSD with DualSense Wireless Controller in Midnight Black.',
      image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
      start_price: 85000,
      bid_increment: 0.05,
      participation_fee: 30,
      internal_cost: 68000, // CONFIDENTIAL
      status: 'active',
      start_time: new Date(Date.now() - 3600000).toISOString(),
      end_time: new Date(Date.now() + 25 * 60000).toISOString(), // 25 mins remaining for urgent excitement
      total_bids: 5,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'auc_rolex_submariner',
      title: 'Rolex Submariner Date 41mm — Oystersteel & Cerachrom',
      category: 'Luxury',
      description: 'Ref 126610LN iconic dive watch in 904L Oystersteel, black Cerachrom bezel, luminescent Chromalight display, and Calibre 3235 automatic movement with 70-hour power reserve. Box & Papers included.',
      image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      start_price: 1250000,
      bid_increment: 0.10,
      participation_fee: 150,
      internal_cost: 890000, // CONFIDENTIAL
      status: 'active',
      start_time: new Date(Date.now() - 10 * 3600000).toISOString(),
      end_time: new Date(Date.now() + 72 * 3600000).toISOString(),
      total_bids: 3,
      created_at: new Date(Date.now() - 10 * 3600000).toISOString(),
    },
    {
      id: 'auc_gold_cross',
      title: '18K Yellow Gold Ethiopian Lalibela Cross Pendant & Chain',
      category: 'Jewelry',
      description: 'Handcrafted solid 18k yellow gold traditional Ethiopian Lalibela filigree cross pendant weighing 28.5 grams with a 24-inch Italian wheat chain. Certified purity appraisal included.',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
      start_price: 145000,
      bid_increment: 0.05,
      participation_fee: 50,
      internal_cost: 82000, // CONFIDENTIAL
      status: 'active',
      start_time: new Date(Date.now() - 8 * 3600000).toISOString(),
      end_time: new Date(Date.now() + 36 * 3600000).toISOString(),
      total_bids: 2,
      created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
      id: 'auc_delonghi_espresso',
      title: "De'Longhi La Specialista Maestro Dual-Boiler Espresso Machine",
      category: 'Appliances',
      description: 'Sensor Grinding Technology, active temperature control with 5 infusion profiles, dynamic pre-infusion, and proprietary LatteCrema milk frothing system.',
      image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1000&q=80',
      start_price: 95000,
      bid_increment: 0.05,
      participation_fee: 35,
      internal_cost: 92000, // CONFIDENTIAL
      status: 'active',
      start_time: new Date(Date.now() - 4 * 3600000).toISOString(),
      end_time: new Date(Date.now() + 18 * 3600000).toISOString(),
      total_bids: 2,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    // Concluded auctions for Winners Showcase & Master Winners Audit
    {
      id: 'auc_macbook_m3max',
      title: 'Apple MacBook Pro 16" M3 Max 64GB / 1TB SSD — Space Black',
      category: 'Tech',
      description: 'Concluded flagship reverse auction with 4,200 unique and shared bids.',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      start_price: 260000,
      bid_increment: 0.05,
      participation_fee: 50,
      internal_cost: 260000, // CONFIDENTIAL
      status: 'ended',
      start_time: new Date(Date.now() - 7 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 2 * 86400000).toISOString(),
      total_bids: 6150,
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      winner_user_id: 'usr_dawit',
      winner_username: 'dawit_crypto',
      winner_phone: '+251933445566',
      winner_email: 'dawit@minibid.et',
      winning_bid_amount: 3.45,
    },
    {
      id: 'auc_samsung_s24ultra',
      title: 'Samsung Galaxy S24 Ultra 512GB — Titanium Violet',
      category: 'Tech',
      description: 'Concluded reverse auction won by lowest unique bidder.',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
      start_price: 175000,
      bid_increment: 0.05,
      participation_fee: 35,
      internal_cost: 98000, // CONFIDENTIAL
      status: 'ended',
      start_time: new Date(Date.now() - 14 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 5 * 86400000).toISOString(),
      total_bids: 3420,
      created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
      winner_user_id: 'usr_selam',
      winner_username: 'selam_tech',
      winner_phone: '+251922334455',
      winner_email: 'selam@minibid.et',
      winning_bid_amount: 1.85,
    },
  ];

  const bids: Bid[] = [
    // Bids on iPhone 16 Pro
    {
      id: 'bid_1',
      auction_id: 'auc_iphone16pro',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      bid_amount: 1.25,
      fee_paid: 40,
      created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    },
    {
      id: 'bid_2',
      auction_id: 'auc_iphone16pro',
      user_id: 'usr_selam',
      username: 'selam_tech',
      bid_amount: 1.25, // duplicate with aman!
      fee_paid: 40,
      created_at: new Date(Date.now() - 80 * 60000).toISOString(),
    },
    {
      id: 'bid_3',
      auction_id: 'auc_iphone16pro',
      user_id: 'usr_dawit',
      username: 'dawit_crypto',
      bid_amount: 2.10, // unique! And lowest unique!
      fee_paid: 40,
      created_at: new Date(Date.now() - 40 * 60000).toISOString(),
    },
    {
      id: 'bid_4',
      auction_id: 'auc_iphone16pro',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      bid_amount: 3.50, // unique, but higher
      fee_paid: 40,
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },

    // Bids on PS5 Pro
    {
      id: 'bid_5',
      auction_id: 'auc_ps5pro',
      user_id: 'usr_selam',
      username: 'selam_tech',
      bid_amount: 0.85,
      fee_paid: 30,
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
    },
    {
      id: 'bid_6',
      auction_id: 'auc_ps5pro',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      bid_amount: 0.85, // duplicate!
      fee_paid: 30,
      created_at: new Date(Date.now() - 28 * 60000).toISOString(),
    },
    {
      id: 'bid_7',
      auction_id: 'auc_ps5pro',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      bid_amount: 1.05, // unique & lowest unique!
      fee_paid: 30,
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: 'bid_8',
      auction_id: 'auc_ps5pro',
      user_id: 'usr_dawit',
      username: 'dawit_crypto',
      bid_amount: 1.55,
      fee_paid: 30,
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 'bid_9',
      auction_id: 'auc_ps5pro',
      user_id: 'usr_selam',
      username: 'selam_tech',
      bid_amount: 2.20,
      fee_paid: 30,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
    },

    // Rolex Bids
    {
      id: 'bid_10',
      auction_id: 'auc_rolex_submariner',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      bid_amount: 4.80,
      fee_paid: 150,
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
      id: 'bid_11',
      auction_id: 'auc_rolex_submariner',
      user_id: 'usr_selam',
      username: 'selam_tech',
      bid_amount: 3.20,
      fee_paid: 150,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    {
      id: 'bid_12',
      auction_id: 'auc_rolex_submariner',
      user_id: 'usr_dawit',
      username: 'dawit_crypto',
      bid_amount: 3.20, // duplicate with selam!
      fee_paid: 150,
      created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
  ];

  const deposits: DepositRequest[] = [
    {
      id: 'dep_1',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      user_phone: '+251911223344',
      user_email: 'aman@minibid.et',
      amount: 1000,
      payment_channel: 'Commercial Bank of Ethiopia (CBE)',
      reference_code: 'FT24264589211029',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      receipt_name: 'cbe_receipt_1000etb.jpg',
      receipt_mime: 'image/jpeg',
      status: 'pending',
      created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    },
    {
      id: 'dep_2',
      user_id: 'usr_selam',
      username: 'selam_tech',
      user_phone: '+251922334455',
      user_email: 'selam@minibid.et',
      amount: 1500,
      payment_channel: 'Telebirr',
      reference_code: 'TB994018283401',
      receipt_url: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&w=600&q=80',
      receipt_name: 'telebirr_receipt.png',
      receipt_mime: 'image/png',
      status: 'pending',
      created_at: new Date(Date.now() - 20 * 60000).toISOString(),
    },
    {
      id: 'dep_3',
      user_id: 'usr_dawit',
      username: 'dawit_crypto',
      user_phone: '+251933445566',
      user_email: 'dawit@minibid.et',
      amount: 2000,
      payment_channel: 'Awash Bank',
      reference_code: 'AWB-2024-8849102',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
      receipt_name: 'awash_wire.jpg',
      receipt_mime: 'image/jpeg',
      status: 'approved',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      reviewed_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
      reviewed_by: 'admin_ops',
    },
    {
      id: 'dep_4',
      user_id: 'usr_aman',
      username: 'aman_bidder',
      user_phone: '+251911223344',
      user_email: 'aman@minibid.et',
      amount: 500,
      payment_channel: 'Dashen Bank',
      reference_code: 'DASH-002931-ERR',
      receipt_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      receipt_name: 'unclear_receipt.jpg',
      receipt_mime: 'image/jpeg',
      status: 'rejected',
      rejection_reason: 'Transaction reference number could not be matched with Dashen Bank clearing records. Please upload a clear photo of your bank slip.',
      created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      reviewed_at: new Date(Date.now() - 5 * 86400000 + 3600000).toISOString(),
      reviewed_by: 'admin_ops',
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx_1',
      user_id: 'usr_dawit',
      type: 'deposit',
      amount: 2000,
      description: 'Approved Deposit via Awash Bank (Ref: AWB-2024-8849102)',
      reference_id: 'dep_3',
      balance_after: 2000,
      created_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    },
    {
      id: 'tx_2',
      user_id: 'usr_aman',
      type: 'deposit',
      amount: 3600,
      description: 'Approved Deposit via Commercial Bank of Ethiopia (CBE)',
      reference_id: 'dep_init_aman',
      balance_after: 3600,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: 'tx_3',
      user_id: 'usr_aman',
      type: 'bid_fee',
      amount: -40,
      description: 'Participation Fee for Apple iPhone 16 Pro Max',
      reference_id: 'bid_1',
      balance_after: 3560,
      created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    },
    {
      id: 'tx_4',
      user_id: 'usr_aman',
      type: 'bid_amount',
      amount: -1.25,
      description: 'Bid Lock for Apple iPhone 16 Pro Max',
      reference_id: 'bid_1',
      balance_after: 3558.75,
      created_at: new Date(Date.now() - 100 * 60000).toISOString(),
    },
  ];

  const notifications: PlatformNotification[] = [
    {
      id: 'notif_welcome',
      recipient_type: 'all',
      title: 'Welcome to MiniBid Official Platform',
      message: 'Experience the lowest unique bid auction mechanism. Hidden bids, certified transparency, and high-end luxury items in Ethiopia.',
      type: 'info',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
      read_by: ['usr_aman'],
    },
    {
      id: 'notif_urgent_ps5',
      recipient_type: 'all',
      title: 'Auction Final Countdown: Sony PlayStation 5 Pro 2TB',
      message: 'The PS5 Pro auction has entered its final countdown phase! Place your lowest unique bid now.',
      type: 'urgent',
      created_at: new Date(Date.now() - 10 * 60000).toISOString(),
      read_by: [],
    },
    {
      id: 'notif_dep_dawit',
      recipient_type: 'user',
      target_user_id: 'usr_dawit',
      target_username: 'dawit_crypto',
      title: 'Deposit Approved: 2,000 ETB Credited',
      message: 'Your Awash Bank deposit of 2,000 ETB (Ref: AWB-2024-8849102) has been approved by operations.',
      type: 'success',
      created_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
      read_by: ['usr_dawit'],
    },
  ];

  const audit_logs: AuditLog[] = [
    {
      id: 'aud_1',
      actor_id: 'usr_superadmin',
      actor_username: 'superadmin',
      actor_role: 'superadmin',
      action: 'PLATFORM_INITIALIZATION',
      details: 'Initialized MiniBid core reverse-auction engine and seeded luxury catalog.',
      ip_reference: '197.156.103.42 (Addis Ababa)',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 'aud_2',
      actor_id: 'usr_admin_ops',
      actor_username: 'admin_ops',
      actor_role: 'admin',
      action: 'DEPOSIT_APPROVAL',
      details: 'Approved 2,000 ETB deposit for dawit_crypto (Awash Bank Ref: AWB-2024-8849102)',
      ip_reference: '197.156.98.11 (Bole, Addis Ababa)',
      created_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    },
  ];

  const financial_ledger: FinancialLedgerEntry[] = [
    {
      id: 'led_init_dep_3',
      deposit_request_id: 'dep_3',
      customer_id: 'usr_dawit',
      customer_username: 'dawit_crypto',
      amount: 2000,
      currency: 'ETB',
      type: 'DEPOSIT',
      status: 'COMPLETED',
      payment_method: 'Awash Bank',
      transaction_number: 'AWB-2024-8849102',
      approved_by: 'admin_ops',
      approved_by_id: 'usr_admin_ops',
      balance_before: 0,
      balance_after: 2000,
      created_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    },
  ];

  return {
    users,
    auctions,
    bids,
    deposits,
    financial_ledger,
    blocked_approval_attempts: [],
    idempotency_cache: {},
    admin_float_requests: [],
    transactions,
    notifications,
    audit_logs,
  };
}

class Database {
  private memoryData: DatabaseSchema;
  private isWriting = false;
  private depositMutexes = new Map<string, Promise<void>>();

  constructor() {
    this.ensureDirectory();
    this.memoryData = this.loadData();
  }

  private ensureDirectory() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
    } catch {
      // ignore
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.auctions && parsed.bids) {
          if (!parsed.admin_float_requests) {
            parsed.admin_float_requests = [];
          }
          if (!parsed.blocked_approval_attempts) {
            parsed.blocked_approval_attempts = [];
          }
          if (!parsed.idempotency_cache) {
            parsed.idempotency_cache = {};
          }
          if (!parsed.financial_ledger) {
            parsed.financial_ledger = [];
          }

          // Migrate any existing approved deposits to financial_ledger if not present
          for (const dep of parsed.deposits || []) {
            if (
              (dep.status === 'approved' || dep.status === 'APPROVED') &&
              !parsed.financial_ledger.some((l: any) => l.deposit_request_id === dep.id)
            ) {
              parsed.financial_ledger.push({
                id: `led_migrated_${dep.id}`,
                deposit_request_id: dep.id,
                customer_id: dep.user_id,
                customer_username: dep.username,
                amount: dep.amount,
                currency: 'ETB',
                type: 'DEPOSIT',
                status: 'COMPLETED',
                payment_method: dep.payment_channel || dep.payment_method || 'Commercial Bank of Ethiopia (CBE)',
                transaction_number: dep.reference_code || dep.transaction_number || 'LEGACY_REF',
                approved_by: dep.reviewed_by || dep.approved_by || 'admin_ops',
                approved_by_id: 'usr_admin_ops',
                balance_before: 0,
                balance_after: dep.amount,
                created_at: dep.reviewed_at || dep.approved_at || dep.created_at,
              });
            }
          }

          // Normalize start_price for items that previously had low fraction placeholders
          const priceMap: Record<string, number> = {
            auc_iphone16pro: 185000,
            auc_ps5pro: 85000,
            auc_rolex_submariner: 1250000,
            auc_gold_cross: 145000,
            auc_delonghi_espresso: 95000,
            auc_macbook_m3max: 260000,
            auc_samsung_s24ultra: 175000,
          };
          for (const a of parsed.auctions) {
            if (priceMap[a.id] && (!a.start_price || a.start_price < 10)) {
              a.start_price = priceMap[a.id];
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load DB file, using fresh seed', e);
    }

    const seed = getInitialSeed();
    this.persist(seed);
    return seed;
  }

  public reload(): void {
    this.memoryData = this.loadData();
  }

  private persist(data: DatabaseSchema) {
    if (this.isWriting) return;
    this.isWriting = true;
    try {
      this.ensureDirectory();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      // Fallback: in-memory state remains untouched
      console.error('Persistence error, using in-memory state:', err);
    } finally {
      this.isWriting = false;
    }
  }

  // --- Read Operations ---
  public getBrandLogo(): string {
    return this.memoryData.brand_logo_url || '/assets/images/sunfyre_luxury_crest.jpg';
  }

  public setBrandLogo(logoUrl: string | null): void {
    this.memoryData.brand_logo_url = logoUrl || null;
    this.persist(this.memoryData);
  }

  public getUsers() {
    return this.memoryData.users;
  }

  public findUserById(id: string) {
    return this.memoryData.users.find(u => u.id === id);
  }

  public findUserByUsername(username: string) {
    return this.memoryData.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public findUserByPhone(phone: string) {
    const clean = phone.replace(/[\s\-\(\)]/g, '').trim();
    const normalize = (p: string) => {
      let c = p.replace(/[\s\-\(\)]/g, '').trim();
      if (c.startsWith('+251')) c = '0' + c.slice(4);
      else if (c.startsWith('251')) c = '0' + c.slice(3);
      else if (c.startsWith('9') && c.length === 9) c = '0' + c;
      return c;
    };
    const targetNorm = normalize(clean);
    return this.memoryData.users.find(u => normalize(u.phone) === targetNorm);
  }

  public findUserByEmail(email: string) {
    return this.memoryData.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
  }

  public getAuctions() {
    return this.memoryData.auctions;
  }

  public findAuctionById(id: string) {
    return this.memoryData.auctions.find(a => a.id === id);
  }

  public getBids(auctionId?: string) {
    if (auctionId) {
      return this.memoryData.bids.filter(b => b.auction_id === auctionId);
    }
    return this.memoryData.bids;
  }

  public getDeposits() {
    return this.memoryData.deposits;
  }

  public getTransactions(userId?: string) {
    if (userId) {
      return this.memoryData.transactions.filter(t => t.user_id === userId);
    }
    return this.memoryData.transactions;
  }

  public getNotifications(userId?: string, userRole?: UserRole) {
    if (!userId) return [];
    return this.memoryData.notifications.filter(n => {
      // 1. Super Admin sees EVERYTHING (public, customer alerts, admin operations, fraud alerts)
      if (userRole === 'superadmin') {
        return true;
      }
      // 2. Admins see public ('all'), notifications addressed directly to them ('user' with target_user_id === userId), and staff admin notifications ('admin')
      if (userRole === 'admin') {
        return (
          n.recipient_type === 'all' ||
          (n.recipient_type === 'user' && n.target_user_id === userId) ||
          n.recipient_type === 'admin'
        );
      }
      // 3. Customers ONLY see public notifications ('all') or ones addressed directly to their personal user ID.
      // Customers MUST NEVER see 'admin' or 'superadmin' notifications!
      return n.recipient_type === 'all' || (n.recipient_type === 'user' && n.target_user_id === userId);
    });
  }

  public getAuditLogs() {
    return this.memoryData.audit_logs;
  }

  public addAuditLog(entry: Omit<AuditLog, 'id' | 'created_at'>) {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      created_at: new Date().toISOString(),
      ...entry,
    };
    this.memoryData.audit_logs.unshift(newLog);
    if (this.memoryData.audit_logs.length > 500) {
      this.memoryData.audit_logs = this.memoryData.audit_logs.slice(0, 500);
    }
    this.persist(this.memoryData);
    return newLog;
  }

  // --- Lowest Unique Bid Evaluation Engine ---
  public evaluateAuctionBids(auctionId: string) {
    const bids = this.memoryData.bids.filter(b => b.auction_id === auctionId);
    const amountCounts: Record<number, number> = {};

    for (const b of bids) {
      const amt = Number(b.bid_amount.toFixed(2));
      amountCounts[amt] = (amountCounts[amt] || 0) + 1;
    }

    const uniqueAmounts: number[] = [];
    for (const [amtStr, count] of Object.entries(amountCounts)) {
      if (count === 1) {
        uniqueAmounts.push(Number(amtStr));
      }
    }

    uniqueAmounts.sort((a, b) => a - b);
    const lowestUnique = uniqueAmounts.length > 0 ? uniqueAmounts[0] : null;

    // Attach status to bids
    return bids.map(b => {
      const amt = Number(b.bid_amount.toFixed(2));
      let status: 'unique_lowest' | 'unique_not_lowest' | 'not_unique' = 'not_unique';

      if (amountCounts[amt] === 1) {
        if (lowestUnique !== null && amt === lowestUnique) {
          status = 'unique_lowest';
        } else {
          status = 'unique_not_lowest';
        }
      } else {
        status = 'not_unique';
      }

      return {
        ...b,
        status,
      };
    });
  }

  // Check and conclude ended auctions
  public checkAndConcludeAuctions() {
    const now = Date.now();
    let updated = false;

    for (const auction of this.memoryData.auctions) {
      if (auction.status === 'active' && new Date(auction.end_time).getTime() <= now) {
        auction.status = 'ended';
        updated = true;

        const evaluatedBids = this.evaluateAuctionBids(auction.id);
        const winningBid = evaluatedBids.find(b => b.status === 'unique_lowest');

        if (winningBid) {
          auction.winner_user_id = winningBid.user_id;
          auction.winner_username = winningBid.username;
          auction.winning_bid_amount = winningBid.bid_amount;

          const winner = this.findUserById(winningBid.user_id);
          if (winner) {
            auction.winner_phone = winner.phone;
            auction.winner_email = winner.email;

            // Send notification to winner
            this.memoryData.notifications.unshift({
              id: `notif_win_${Date.now()}`,
              recipient_type: 'user',
              target_user_id: winner.id,
              target_username: winner.username,
              title: `🎉 Congratulations! You Won: ${auction.title}`,
              message: `Your bid of ${winningBid.bid_amount.toFixed(2)} ETB was the Lowest Unique Bid! Contact MiniBid administration to claim your item.`,
              type: 'success',
              created_at: new Date().toISOString(),
              read_by: [],
            });
          }
        }
      }
    }

    if (updated) {
      this.persist(this.memoryData);
    }
  }

  // --- Mutex / Write Operations ---

  // User Registration (All users start with 0.00 ETB)
  public createUser(userData: {
    username: string;
    email?: string;
    phone: string;
    password: string;
    role?: UserRole;
    initial_balance?: number;
    phone_verified?: boolean;
  }): User {
    const { hash, salt } = hashPassword(userData.password);
    const initialBalance = userData.initial_balance || 0;
    const finalEmail = userData.email?.trim().toLowerCase() || `${userData.username.trim().toLowerCase()}@user.minibid.et`;
    const newUser: DatabaseSchema['users'][0] = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: userData.username.trim(),
      email: finalEmail,
      phone: userData.phone.trim(),
      role: userData.role || 'customer',
      wallet_balance: initialBalance, // Exactly 0.00 ETB at start
      status: 'active',
      email_verified: false,
      created_at: new Date().toISOString(),
      password_hash: hash,
      salt,
    };

    this.memoryData.users.push(newUser);

    if (initialBalance > 0) {
      this.memoryData.transactions.unshift({
        id: `tx_init_${Date.now()}`,
        user_id: newUser.id,
        type: 'deposit',
        amount: initialBalance,
        description: 'Initial Wallet Balance Allocation',
        balance_after: initialBalance,
        created_at: new Date().toISOString(),
      });
    }

    this.persist(this.memoryData);

    const { password_hash, salt: _s, ...cleanUser } = newUser;
    return cleanUser;
  }

  // Super Admin adds & provisions Admin (with optional initial float deposit)
  public createAdmin(adminData: {
    username: string;
    email?: string;
    phone: string;
    password: string;
    role?: UserRole;
    initial_deposit?: number;
    actor: { id: string; username: string; role: UserRole };
  }): User {
    const initialDeposit = typeof adminData.initial_deposit === 'number' && adminData.initial_deposit > 0 
      ? adminData.initial_deposit 
      : 0;

    const newAdmin = this.createUser({
      username: adminData.username,
      email: adminData.email,
      phone: adminData.phone,
      password: adminData.password,
      role: adminData.role || 'admin',
      initial_balance: initialDeposit,
    });

    if (initialDeposit > 0) {
      this.memoryData.transactions.unshift({
        id: `tx_sinit_${Date.now()}`,
        user_id: newAdmin.id,
        type: 'admin_float_credit',
        amount: initialDeposit,
        description: `Initial Super Admin Float Allocation for Staff Administration`,
        balance_after: initialDeposit,
        created_at: new Date().toISOString(),
      });
    }

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: adminData.actor.id,
      actor_username: adminData.actor.username,
      actor_role: adminData.actor.role,
      action: 'PROVISION_ADMIN',
      details: `Provisioned staff ${newAdmin.role}: ${newAdmin.username} (${newAdmin.email}) with initial float deposit of ${initialDeposit.toFixed(2)} ETB`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return newAdmin;
  }

  // Update user profile (username, phone, password for users, admins, superadmin)
  public updateUserProfile(
    userId: string,
    data: {
      username?: string;
      phone?: string;
      password?: string;
      email?: string;
      email_verified?: boolean;
    }
  ): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;

    // 1. Username update & uniqueness
    if (data.username && data.username.trim() !== user.username) {
      const cleanUsername = data.username.trim();
      if (cleanUsername.length <= 5) {
        throw new Error('Username must be more than 5 characters.');
      }
      const existingUser = this.findUserByUsername(cleanUsername);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('This username is already taken by another person.');
      }
      user.username = cleanUsername;
    }

    // 2. Phone update & uniqueness (strict Ethiopian formats)
    if (data.phone && data.phone.trim() !== user.phone) {
      const cleanPhone = data.phone.trim();
      const phoneRegex = /^(\+251[79]\d{8}|0[79]\d{8})$/;
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Phone number must match Ethiopian format (+2519..., 09..., or 07...) with exact digits.');
      }
      const existingPhone = this.findUserByPhone(cleanPhone);
      if (existingPhone && existingPhone.id !== userId) {
        throw new Error('This phone number is already registered to another person.');
      }
      user.phone = cleanPhone;
    }

    // 3. Password update
    if (data.password) {
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      const { hash, salt } = hashPassword(data.password);
      user.password_hash = hash;
      user.salt = salt;
    }

    // 4. Optional email update
    if (data.email) user.email = data.email.trim().toLowerCase();
    if (data.email_verified !== undefined) user.email_verified = data.email_verified;

    this.persist(this.memoryData);
    const { password_hash, salt, ...clean } = user;
    return clean;
  }

  // Toggle user status (Active vs Suspended)
  public toggleUserStatus(userId: string, status: 'active' | 'suspended', actor: { id: string; username: string; role: UserRole }): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;

    user.status = status;
    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'USER_STATUS_CHANGE',
      details: `Admin ${actor.username} changed status of ${user.username} to ${status.toUpperCase()}`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    // Super Admin sees every admin's operation (e.g. when they suspend users)
    if (actor.role !== 'superadmin') {
      this.memoryData.notifications.unshift({
        id: `notif_sa_op_sus_${Date.now()}`,
        recipient_type: 'superadmin',
        target_username: 'superadmin',
        title: `Admin User Action: @${actor.username}`,
        message: `Admin @${actor.username} set user @${user.username} account status to ${status.toUpperCase()}.`,
        type: status === 'suspended' ? 'alert' : 'info',
        created_at: new Date().toISOString(),
        read_by: [],
      });
    }

    this.persist(this.memoryData);
    const { password_hash, salt, ...clean } = user;
    return clean;
  }

  // Atomic Place Bid
  public placeBid(userId: string, auctionId: string, bidAmount: number): { success: boolean; error?: string; bid?: Bid; new_balance?: number } {
    this.checkAndConcludeAuctions();

    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'User not found' };
    if (user.status === 'suspended') return { success: false, error: 'Your account is suspended' };

    const auction = this.findAuctionById(auctionId);
    if (!auction) return { success: false, error: 'Auction not found' };
    if (auction.status !== 'active') return { success: false, error: `Auction is ${auction.status}` };

    if (new Date(auction.end_time).getTime() <= Date.now()) {
      auction.status = 'ended';
      this.persist(this.memoryData);
      return { success: false, error: 'Auction has already ended' };
    }

    const roundedBid = Number(bidAmount.toFixed(2));
    if (roundedBid < 1.00) return { success: false, error: 'Bid amount must be at least 1.00 ETB. You may place any decimal amount starting from 1.00 ETB (e.g. 1.25 ETB).' };

    const totalDeduction = auction.participation_fee + roundedBid;

    // ACID Check: Atomic balance validation
    if (user.wallet_balance < totalDeduction) {
      return {
        success: false,
        error: `Insufficient balance. Required: ${totalDeduction.toFixed(2)} ETB (Fee: ${auction.participation_fee} ETB + Bid: ${roundedBid.toFixed(2)} ETB). Your Balance: ${user.wallet_balance.toFixed(2)} ETB. Please top up your wallet.`,
      };
    }

    // Atomic debit
    user.wallet_balance = Number((user.wallet_balance - totalDeduction).toFixed(2));
    auction.total_bids += 1;

    const newBid: Bid = {
      id: `bid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      auction_id: auction.id,
      user_id: user.id,
      username: user.username,
      bid_amount: roundedBid,
      fee_paid: auction.participation_fee,
      created_at: new Date().toISOString(),
    };

    this.memoryData.bids.push(newBid);

    // Record transactions
    this.memoryData.transactions.unshift({
      id: `tx_fee_${Date.now()}`,
      user_id: user.id,
      type: 'bid_fee',
      amount: -auction.participation_fee,
      description: `Participation fee for ${auction.title}`,
      reference_id: newBid.id,
      balance_after: Number((user.wallet_balance + roundedBid).toFixed(2)),
      created_at: new Date().toISOString(),
    });

    this.memoryData.transactions.unshift({
      id: `tx_bid_${Date.now() + 1}`,
      user_id: user.id,
      type: 'bid_amount',
      amount: -roundedBid,
      description: `Locked bid (${roundedBid.toFixed(2)} ETB) for ${auction.title}`,
      reference_id: newBid.id,
      balance_after: user.wallet_balance,
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);

    // Evaluate uniqueness
    const evaluated = this.evaluateAuctionBids(auction.id);
    const currentBidEvaluated = evaluated.find(b => b.id === newBid.id);

    return {
      success: true,
      bid: currentBidEvaluated || newBid,
      new_balance: user.wallet_balance,
    };
  }

  // --- Database Constraints & Concurrency Lock ---
  private checkTransactionNumberUniqueness(
    paymentMethod: string,
    transactionNumber: string,
    userId?: string,
    excludeDepositId?: string
  ): { attemptNumber: number } {
    const normMethod = (paymentMethod || '').trim().toLowerCase();
    const normTxn = (transactionNumber || '').trim().toLowerCase();

    if (!normTxn) {
      throw new Error('Transaction reference number is required.');
    }

    // 1. SUPREME RULE (Requirement 4):
    // "even in the first attempt the admin approves thier deposte request that transaction number should not be used by anyone! anyone!!"
    const approvedDuplicate = this.memoryData.deposits.find(d => {
      if (excludeDepositId && d.id === excludeDepositId) return false;
      const dTxn = (d.reference_code || d.transaction_number || '').trim().toLowerCase();
      return dTxn === normTxn && (d.status === 'approved' || d.status === 'APPROVED');
    });

    if (approvedDuplicate) {
      throw new DuplicateTransactionNumberError(
        'This transaction number has already been verified and approved by administration. Approved transaction numbers can never be used again by anyone.'
      );
    }

    // 2. UNAPPROVED RETRY RULE (Requirement 4):
    // "users can use same transaction number if it's not approved by admins (if there pervoius rquest not approved they can use the transaction number 3 times)"
    const existingSameTxn = this.memoryData.deposits.filter(d => {
      if (excludeDepositId && d.id === excludeDepositId) return false;
      const dTxn = (d.reference_code || d.transaction_number || '').trim().toLowerCase();
      return dTxn === normTxn;
    });

    if (existingSameTxn.length > 0) {
      if (userId) {
        // Disallow other persons from claiming an unapproved transaction number submitted by someone else
        const otherUser = existingSameTxn.find(d => d.user_id !== userId);
        if (otherUser) {
          throw new DuplicateTransactionNumberError(
            'This transaction number has already been submitted under another user account.'
          );
        }

        // Count previous attempts by this user
        const sameUserAttempts = existingSameTxn.filter(d => d.user_id === userId).length;
        if (sameUserAttempts >= 3) {
          throw new DuplicateTransactionNumberError(
            'This unapproved transaction number has reached the maximum allowed limit of 3 submission attempts.'
          );
        }

        return { attemptNumber: sameUserAttempts + 1 };
      }

      if (existingSameTxn.length >= 3) {
        throw new DuplicateTransactionNumberError(
          'This transaction number has reached the maximum allowed submission attempts.'
        );
      }
      return { attemptNumber: existingSameTxn.length + 1 };
    }

    return { attemptNumber: 1 };
  }

  private checkLedgerUniqueness(depositRequestId: string): void {
    if (!this.memoryData.financial_ledger) {
      this.memoryData.financial_ledger = [];
    }
    const exists = this.memoryData.financial_ledger.some(l => l.deposit_request_id === depositRequestId);
    if (exists) {
      throw new LedgerConstraintViolationError(
        `Financial integrity violation: Deposit #${depositRequestId} has already generated a financial ledger entry.`
      );
    }
  }

  private async withDepositLock<T>(depositId: string, fn: () => Promise<T> | T): Promise<T> {
    const current = this.depositMutexes.get(depositId) || Promise.resolve();
    let release: () => void;
    const next = new Promise<void>(resolve => {
      release = resolve;
    });
    this.depositMutexes.set(depositId, current.then(() => next));

    await current;
    try {
      return await fn();
    } finally {
      release!();
      if (this.depositMutexes.get(depositId) === current.then(() => next)) {
        this.depositMutexes.delete(depositId);
      }
    }
  }

  // Create Deposit Request
  public createDepositRequest(depositData: {
    user_id: string;
    amount: number;
    payment_channel: string;
    reference_code: string;
    receipt_url: string;
    receipt_name?: string;
    receipt_mime?: string;
    receipt_size_bytes?: number;
  }): { success: boolean; deposit?: DepositRequest; error?: string; is_flagged?: boolean; attempts?: number } {
    const user = this.findUserById(depositData.user_id);
    if (!user) return { success: false, error: 'User not found' };

    if (typeof depositData.amount !== 'number' || isNaN(depositData.amount) || depositData.amount < 50) {
      return { success: false, error: 'Minimum deposit is 50 ETB.' };
    }

    if (!depositData.payment_channel || !depositData.payment_channel.trim()) {
      return { success: false, error: 'Payment method is required.' };
    }

    if (!depositData.reference_code || !depositData.reference_code.trim()) {
      return { success: false, error: 'Transaction number is required and cannot be blank.' };
    }

    // Backend receipt validation: strict <= 5MB limit and magic bytes inspection
    const receiptValidation = validateReceiptPayload({
      receipt_url: depositData.receipt_url,
      receipt_name: depositData.receipt_name,
      receipt_mime: depositData.receipt_mime,
      receipt_size_bytes: depositData.receipt_size_bytes,
    });
    if (!receiptValidation.valid) {
      return { success: false, error: receiptValidation.error || 'Invalid receipt upload.' };
    }

    const cleanRef = depositData.reference_code.trim();
    const cleanMethod = depositData.payment_channel.trim();

    // DATABASE CONSTRAINT:
    // 1. If approved, cannot be reused by ANYONE
    // 2. If unapproved, the same user can reuse it up to 3 times
    let attemptNumber = 1;
    try {
      const checkRes = this.checkTransactionNumberUniqueness(cleanMethod, cleanRef, depositData.user_id);
      attemptNumber = checkRes.attemptNumber;
    } catch (err: any) {
      // Track duplicate attempts for fraud detection
      user.duplicate_txn_attempts = (user.duplicate_txn_attempts || 0) + 1;
      if (user.duplicate_txn_attempts > 3) {
        user.is_flagged = true;
        user.flag_reason = `Attempted ${user.duplicate_txn_attempts} times to reuse submitted transaction number: ${cleanRef}`;
        user.flagged_at = new Date().toISOString();

        this.memoryData.audit_logs.unshift({
          id: `aud_fraud_${Date.now()}`,
          actor_id: user.id,
          actor_username: user.username,
          actor_role: user.role,
          action: 'FRAUD_ALERT_TXN_REUSE',
          details: `CRITICAL FRAUD ALERT: User @${user.username} repeatedly attempted to reuse transaction number "${cleanRef}" (${user.duplicate_txn_attempts} attempts). Account flagged.`,
          ip_reference: '197.156.103.1',
          created_at: new Date().toISOString(),
        });
      }

      this.persist(this.memoryData);
      return {
        success: false,
        error: err.message || 'This transaction number cannot be submitted.',
        is_flagged: user.is_flagged,
        attempts: user.duplicate_txn_attempts,
      };
    }

    const newDeposit: DepositRequest = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      username: user.username,
      user_phone: user.phone,
      user_email: user.email,
      amount: Number(depositData.amount.toFixed(2)),
      payment_channel: cleanMethod,
      payment_method: cleanMethod,
      reference_code: cleanRef,
      transaction_number: cleanRef,
      receipt_url: depositData.receipt_url,
      receipt_name: depositData.receipt_name || 'receipt_attachment',
      receipt_mime: depositData.receipt_mime || 'image/jpeg',
      receipt_size_bytes: depositData.receipt_size_bytes || 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      attempt_number: attemptNumber,
    };

    this.memoryData.deposits.unshift(newDeposit);
    this.persist(this.memoryData);

    return { success: true, deposit: newDeposit };
  }

  // Direct Admin Messaging to a specific user (Requirement 7)
  public sendDirectMessage(
    sender: { id: string; username: string; role: UserRole },
    targetUserId: string,
    title: string,
    message: string
  ): PlatformNotification {
    const targetUser = this.findUserById(targetUserId);
    const newNotif: PlatformNotification = {
      id: `notif_msg_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      recipient_type: 'user',
      target_user_id: targetUserId,
      target_username: targetUser?.username,
      title: title.trim(),
      message: message.trim(),
      type: 'info',
      created_at: new Date().toISOString(),
      read_by: [],
    };
    this.memoryData.notifications.unshift(newNotif);

    this.memoryData.audit_logs.unshift({
      id: `aud_msg_${Date.now()}`,
      actor_id: sender.id,
      actor_username: sender.username,
      actor_role: sender.role,
      action: 'ADMIN_DIRECT_MESSAGE',
      details: `Admin @${sender.username} sent direct message to user @${targetUser?.username || targetUserId}: "${title}"`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return newNotif;
  }

  // Clear user fraud flag (Super Admin Governance)
  public clearUserFlag(userId: string, adminUser: { id: string; username: string }): { success: boolean; error?: string; user?: User } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    user.is_flagged = false;
    user.flag_reason = undefined;
    user.flagged_at = undefined;
    user.duplicate_txn_attempts = 0;

    this.memoryData.audit_logs.unshift({
      id: `aud_unflag_${Date.now()}`,
      actor_id: adminUser.id,
      actor_username: adminUser.username,
      actor_role: 'superadmin',
      action: 'USER_FLAG_CLEARED',
      details: `Super Admin @${adminUser.username} cleared the fraud flag and reset attempt count for user @${user.username} (ID: ${user.id}).`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return { success: true, user };
  }

  // Approve Deposit Request (Atomic CAS, Financial Ledger, Concurrency Protection, Zero Double Credit)
  public async approveDeposit(
    depositId: string,
    reviewer: { id: string; username: string; role: UserRole },
    options?: { idempotencyKey?: string; simulateFailure?: boolean }
  ): Promise<{ success: boolean; error?: string; deposit?: DepositRequest; ledger?: FinancialLedgerEntry; was_idempotent?: boolean }> {
    // 0. Check Idempotency Cache
    if (options?.idempotencyKey && this.memoryData.idempotency_cache?.[options.idempotencyKey]) {
      const cached = this.memoryData.idempotency_cache[options.idempotencyKey];
      const dep = this.memoryData.deposits.find(d => d.id === cached.deposit_id);
      const led = this.memoryData.financial_ledger?.find(l => l.deposit_request_id === cached.deposit_id);
      return {
        success: true,
        deposit: dep,
        ledger: led,
        was_idempotent: true,
      };
    }

    return this.withDepositLock(depositId, async () => {
      // 1. Lock and claim the pending deposit request
      const deposit = this.memoryData.deposits.find(d => d.id === depositId);
      if (!deposit) {
        return { success: false, error: 'Deposit request not found' };
      }

      // 2. ATOMIC CONDITIONAL CHECK: Verify that it is still PENDING
      // Equivalent to SQL: UPDATE deposits SET ... WHERE id = :id AND status = 'pending'
      if (deposit.status.toLowerCase() !== 'pending') {
        // Row affected = 0: Request was already processed by another administrator!
        const originalApprover = deposit.reviewed_by || deposit.approved_by || 'another administrator';

        if (!this.memoryData.blocked_approval_attempts) {
          this.memoryData.blocked_approval_attempts = [];
        }

        const blockedAttempt: BlockedApprovalAttempt = {
          id: `blk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          deposit_id: deposit.id,
          attempted_by_id: reviewer.id,
          attempted_by_username: reviewer.username,
          winning_admin_username: originalApprover,
          attempted_at: new Date().toISOString(),
          reason: `Deposit #${deposit.id} was already processed by Admin @${originalApprover}. Concurrent approval safely rejected.`,
        };
        this.memoryData.blocked_approval_attempts.unshift(blockedAttempt);

        // Record in Audit Log
        this.memoryData.audit_logs.unshift({
          id: `aud_blk_${Date.now()}`,
          actor_id: reviewer.id,
          actor_username: reviewer.username,
          actor_role: reviewer.role,
          action: 'BLOCKED_CONCURRENT_APPROVAL',
          details: `CONCURRENCY SAFETY LOCK: Admin @${reviewer.username} attempted concurrent approval on Deposit #${deposit.id} (${deposit.amount} ETB), but request was already claimed and approved by Admin @${originalApprover}. Zero double credit guaranteed.`,
          ip_reference: '197.156.103.1',
          created_at: new Date().toISOString(),
        });

        this.persist(this.memoryData);

        throw new ConcurrentApprovalConflictError('This deposit has already been processed by another administrator.');
      }

      const user = this.findUserById(deposit.user_id);
      if (!user) throw new Error('Recipient user account not found');

      const reviewerUser = this.findUserById(reviewer.id);

      // Verify Admin operational float if role is admin
      if (reviewer.role === 'admin') {
        if (!reviewerUser) {
          throw new Error('Reviewer staff account not found');
        }
        if (reviewerUser.wallet_balance < deposit.amount) {
          throw new InsufficientFloatError(
            `Insufficient Admin operational balance! Your balance is ${reviewerUser.wallet_balance.toFixed(2)} ETB, but approving this customer deposit requires ${deposit.amount.toFixed(2)} ETB. Please submit a Float Deposit Request to Super Admin first to replenish your balance.`
          );
        }
      }

      // BEGIN ATOMIC TRANSACTION SNAPSHOT FOR ZERO-PARTIAL-FAIL ROLLBACK
      const preTxSnapshot = JSON.stringify(this.memoryData);

      try {
        // 3. DATABASE CONSTRAINT CHECK: Unique deposit in financial ledger
        this.checkLedgerUniqueness(deposit.id);

        // 4. Change deposit status to APPROVED
        deposit.status = 'approved';
        deposit.reviewed_at = new Date().toISOString();
        deposit.approved_at = deposit.reviewed_at;
        deposit.reviewed_by = reviewer.username;
        deposit.approved_by = reviewer.username;

        // Deduct from Admin float if applicable
        if (reviewer.role === 'admin' && reviewerUser) {
          reviewerUser.wallet_balance = Number((reviewerUser.wallet_balance - deposit.amount).toFixed(2));
          this.memoryData.transactions.unshift({
            id: `tx_disb_${Date.now()}`,
            user_id: reviewerUser.id,
            type: 'admin_disbursement',
            amount: -deposit.amount,
            description: `Disbursed deposit for customer @${user.username} (Ref: ${deposit.reference_code})`,
            reference_id: deposit.id,
            balance_after: reviewerUser.wallet_balance,
            created_at: new Date().toISOString(),
          });
        }

        // 5. Credit the customer's balance/wallet/account
        const balanceBefore = user.wallet_balance;
        user.wallet_balance = Number((user.wallet_balance + deposit.amount).toFixed(2));
        const balanceAfter = user.wallet_balance;

        // 6. Create the corresponding financial ledger entry
        if (!this.memoryData.financial_ledger) {
          this.memoryData.financial_ledger = [];
        }

        const ledgerEntry: FinancialLedgerEntry = {
          id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          deposit_request_id: deposit.id,
          customer_id: user.id,
          customer_username: user.username,
          amount: deposit.amount,
          currency: 'ETB',
          type: 'DEPOSIT',
          status: 'COMPLETED',
          payment_method: deposit.payment_channel || deposit.payment_method || 'Commercial Bank of Ethiopia (CBE)',
          transaction_number: deposit.reference_code || deposit.transaction_number || 'UNKNOWN',
          approved_by: reviewer.username,
          approved_by_id: reviewer.id,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          created_at: new Date().toISOString(),
        };
        this.memoryData.financial_ledger.unshift(ledgerEntry);

        // Verification of uniqueness constraint
        const ledgersForDep = this.memoryData.financial_ledger.filter(l => l.deposit_request_id === deposit.id);
        if (ledgersForDep.length > 1) {
          throw new LedgerConstraintViolationError(`Duplicate ledger detected for deposit #${deposit.id}`);
        }

        // 7. Add customer wallet transaction
        this.memoryData.transactions.unshift({
          id: `tx_dep_${Date.now()}`,
          user_id: user.id,
          type: 'deposit',
          amount: deposit.amount,
          description: `Approved Deposit via ${deposit.payment_channel} (Disbursed by Admin @${reviewer.username}, Ref: ${deposit.reference_code})`,
          reference_id: deposit.id,
          balance_after: user.wallet_balance,
          created_at: new Date().toISOString(),
        });

        // 8. Create an audit log
        this.memoryData.audit_logs.unshift({
          id: `aud_${Date.now()}`,
          actor_id: reviewer.id,
          actor_username: reviewer.username,
          actor_role: reviewer.role,
          action: 'DEPOSIT_APPROVAL',
          details: `Admin ${reviewer.username} approved & disbursed ${deposit.amount} ETB to user ${user.username} (Ref: ${deposit.reference_code}). Ledger ID: ${ledgerEntry.id}.`,
          ip_reference: '197.156.103.1',
          created_at: new Date().toISOString(),
        });

        // Notifications
        this.memoryData.notifications.unshift({
          id: `notif_dep_app_${Date.now()}`,
          recipient_type: 'user',
          target_user_id: user.id,
          target_username: user.username,
          title: `Deposit Approved: ${deposit.amount.toLocaleString()} ETB Credited`,
          message: `Your deposit via ${deposit.payment_channel} (Ref: ${deposit.reference_code}) has been verified and disbursed by Admin @${reviewer.username}. Ledger ID: ${ledgerEntry.id}.`,
          type: 'success',
          created_at: new Date().toISOString(),
          read_by: [],
        });

        if (reviewer.role !== 'superadmin') {
          const remainingFloat = reviewerUser?.wallet_balance !== undefined ? `${reviewerUser.wallet_balance.toFixed(2)} ETB` : 'Operational';
          this.memoryData.notifications.unshift({
            id: `notif_sa_op_dep_${Date.now()}`,
            recipient_type: 'superadmin',
            target_username: 'superadmin',
            title: `⚡ Admin Deposit Approval: @${reviewer.username}`,
            message: `Admin @${reviewer.username} approved & disbursed ${deposit.amount.toLocaleString()} ETB for user @${user.username} (Ref: ${deposit.reference_code}). Admin float remaining: ${remainingFloat}.`,
            type: 'info',
            created_at: new Date().toISOString(),
            read_by: [],
          });
        }

        // SIMULATED FAILURE TEST HOOK (TEST 8)
        if (options?.simulateFailure) {
          throw new Error('SIMULATED_DATABASE_FAILURE_AFTER_CREDIT');
        }

        // Cache Idempotency Key
        if (options?.idempotencyKey) {
          if (!this.memoryData.idempotency_cache) {
            this.memoryData.idempotency_cache = {};
          }
          this.memoryData.idempotency_cache[options.idempotencyKey] = {
            deposit_id: deposit.id,
            result: { success: true, deposit_id: deposit.id, amount: deposit.amount },
            created_at: new Date().toISOString(),
          };
        }

        // 9. Persist atomically to disk
        this.persist(this.memoryData);

        return {
          success: true,
          deposit,
          ledger: ledgerEntry,
        };
      } catch (txError: any) {
        // ATOMIC ROLLBACK: Restore memoryData to exact pre-transaction state
        console.warn('Financial transaction aborted, rolling back all modifications:', txError.message);
        this.memoryData = JSON.parse(preTxSnapshot);
        this.persist(this.memoryData);
        throw txError;
      }
    });
  }

  // Reject Deposit Request (Atomic CAS & Lock)
  public async rejectDeposit(
    depositId: string,
    reason: string,
    reviewer: { id: string; username: string; role: UserRole }
  ): Promise<{ success: boolean; error?: string; deposit?: DepositRequest }> {
    return this.withDepositLock(depositId, async () => {
      const deposit = this.memoryData.deposits.find(d => d.id === depositId);
      if (!deposit) return { success: false, error: 'Deposit request not found' };
      if (deposit.status.toLowerCase() !== 'pending') {
        throw new ConcurrentApprovalConflictError('This deposit has already been processed by another administrator.');
      }

      const user = this.findUserById(deposit.user_id);

      deposit.status = 'rejected';
      deposit.rejection_reason = reason.trim();
      deposit.reviewed_at = new Date().toISOString();
      deposit.approved_at = deposit.reviewed_at;
      deposit.reviewed_by = reviewer.username;
      deposit.approved_by = reviewer.username;

      if (user) {
        this.memoryData.notifications.unshift({
          id: `notif_dep_rej_${Date.now()}`,
          recipient_type: 'user',
          target_user_id: user.id,
          target_username: user.username,
          title: `Deposit Rejected: Ref ${deposit.reference_code}`,
          message: `Your deposit request for ${deposit.amount.toLocaleString()} ETB was rejected. Reason: ${deposit.rejection_reason}`,
          type: 'alert',
          created_at: new Date().toISOString(),
          read_by: [],
        });
      }

      if (reviewer.role !== 'superadmin') {
        this.memoryData.notifications.unshift({
          id: `notif_sa_op_dep_rej_${Date.now()}`,
          recipient_type: 'superadmin',
          target_username: 'superadmin',
          title: `Admin Deposit Rejection: @${reviewer.username}`,
          message: `Admin @${reviewer.username} rejected deposit request (Ref: ${deposit.reference_code}) for user @${user?.username || 'user'}. Reason: "${deposit.rejection_reason}"`,
          type: 'info',
          created_at: new Date().toISOString(),
          read_by: [],
        });
      }

      this.memoryData.audit_logs.unshift({
        id: `aud_${Date.now()}`,
        actor_id: reviewer.id,
        actor_username: reviewer.username,
        actor_role: reviewer.role,
        action: 'DEPOSIT_REJECTION',
        details: `Rejected ${deposit.amount} ETB deposit for ${deposit.username}. Reason: ${deposit.rejection_reason}`,
        ip_reference: '197.156.103.1',
        created_at: new Date().toISOString(),
      });

      this.persist(this.memoryData);
      return { success: true, deposit };
    });
  }

  // Financial Ledger & Audit Getters
  public getFinancialLedger(): FinancialLedgerEntry[] {
    return this.memoryData.financial_ledger || [];
  }

  public getBlockedApprovalAttempts(): BlockedApprovalAttempt[] {
    return this.memoryData.blocked_approval_attempts || [];
  }

  public getDepositSummary() {
    const deposits = this.memoryData.deposits || [];
    const pending = deposits.filter(d => d.status.toLowerCase() === 'pending');
    const approved = deposits.filter(d => d.status.toLowerCase() === 'approved');
    const rejected = deposits.filter(d => d.status.toLowerCase() === 'rejected');

    return {
      total_pending_deposits: pending.length,
      total_approved_deposits: approved.length,
      total_rejected_deposits: rejected.length,
      pending_deposits_amount: pending.reduce((sum, d) => sum + d.amount, 0),
      approved_deposits_amount: approved.reduce((sum, d) => sum + d.amount, 0),
      rejected_deposits_amount: rejected.reduce((sum, d) => sum + d.amount, 0),
    };
  }

  // Admin Float Requests (Admins ask Super Admin for operational balance)
  public getAdminFloatRequests(): AdminFloatRequest[] {
    return this.memoryData.admin_float_requests || [];
  }

  public createAdminFloatRequest(data: {
    admin_id: string;
    amount: number;
    notes: string;
    bank_reference?: string;
  }): { success: boolean; request?: AdminFloatRequest; error?: string } {
    const admin = this.findUserById(data.admin_id);
    if (!admin) return { success: false, error: 'Admin account not found' };
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return { success: false, error: 'Only staff Admins can submit float requests' };
    }

    const newReq: AdminFloatRequest = {
      id: `flt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      admin_id: admin.id,
      admin_username: admin.username,
      amount: data.amount,
      notes: data.notes.trim(),
      bank_reference: data.bank_reference?.trim() || undefined,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    if (!this.memoryData.admin_float_requests) {
      this.memoryData.admin_float_requests = [];
    }
    this.memoryData.admin_float_requests.unshift(newReq);

    this.memoryData.notifications.unshift({
      id: `notif_flt_${Date.now()}`,
      recipient_type: 'superadmin',
      target_username: 'superadmin',
      title: `Admin Float Request: @${admin.username}`,
      message: `Admin @${admin.username} requested ${data.amount.toLocaleString()} ETB operational float. Awaiting Super Admin review.`,
      type: 'alert',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: admin.id,
      actor_username: admin.username,
      actor_role: admin.role,
      action: 'ADMIN_FLOAT_REQUEST',
      details: `Admin ${admin.username} submitted float deposit request of ${data.amount} ETB to Super Admin. Notes: ${data.notes}`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return { success: true, request: newReq };
  }

  public approveAdminFloatRequest(
    requestId: string,
    reviewer: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; request?: AdminFloatRequest } {
    if (reviewer.role !== 'superadmin') {
      return { success: false, error: 'Only Super Admin can approve Admin float requests.' };
    }

    const req = this.memoryData.admin_float_requests?.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Float request not found' };
    if (req.status !== 'pending') return { success: false, error: `Float request is already ${req.status}` };

    const admin = this.findUserById(req.admin_id);
    if (!admin) return { success: false, error: 'Admin account not found' };

    req.status = 'approved';
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewer.username;

    // Credit the Admin's operational float balance
    admin.wallet_balance = Number((admin.wallet_balance + req.amount).toFixed(2));

    // Transaction for Admin
    this.memoryData.transactions.unshift({
      id: `tx_flt_${Date.now()}`,
      user_id: admin.id,
      type: 'admin_float_credit',
      amount: req.amount,
      description: `Operational Float Credit approved by Super Admin @${reviewer.username} (${req.notes})`,
      reference_id: req.id,
      balance_after: admin.wallet_balance,
      created_at: new Date().toISOString(),
    });

    // Notify Admin
    this.memoryData.notifications.unshift({
      id: `notif_flt_app_${Date.now()}`,
      recipient_type: 'user',
      target_user_id: admin.id,
      target_username: admin.username,
      title: `Operational Float Approved: ${req.amount.toLocaleString()} ETB`,
      message: `Super Admin @${reviewer.username} approved your float request. Your balance is now ${admin.wallet_balance.toLocaleString()} ETB. You can now approve and disburse customer deposits.`,
      type: 'success',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    // Audit Log
    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: reviewer.id,
      actor_username: reviewer.username,
      actor_role: reviewer.role,
      action: 'ADMIN_FLOAT_APPROVED',
      details: `Super Admin ${reviewer.username} approved ${req.amount} ETB float for Admin ${admin.username}. New Admin balance: ${admin.wallet_balance} ETB`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return { success: true, request: req };
  }

  public rejectAdminFloatRequest(
    requestId: string,
    reason: string,
    reviewer: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; request?: AdminFloatRequest } {
    if (reviewer.role !== 'superadmin') {
      return { success: false, error: 'Only Super Admin can reject Admin float requests.' };
    }

    const req = this.memoryData.admin_float_requests?.find(r => r.id === requestId);
    if (!req) return { success: false, error: 'Float request not found' };
    if (req.status !== 'pending') return { success: false, error: `Float request is already ${req.status}` };

    req.status = 'rejected';
    req.rejection_reason = reason.trim();
    req.reviewed_at = new Date().toISOString();
    req.reviewed_by = reviewer.username;

    this.memoryData.notifications.unshift({
      id: `notif_flt_rej_${Date.now()}`,
      recipient_type: 'user',
      target_user_id: req.admin_id,
      target_username: req.admin_username,
      title: `Float Request Rejected`,
      message: `Super Admin rejected your float request of ${req.amount.toLocaleString()} ETB. Reason: ${reason}`,
      type: 'alert',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    this.persist(this.memoryData);
    return { success: true, request: req };
  }

  // Direct deposit from Super Admin to Admin
  public depositToAdmin(
    adminId: string,
    amount: number,
    note: string,
    reviewer: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; admin?: User } {
    if (reviewer.role !== 'superadmin') {
      return { success: false, error: 'Only Super Admin can deposit directly for Admins.' };
    }

    const admin = this.findUserById(adminId);
    if (!admin) return { success: false, error: 'Admin account not found' };
    if (admin.role !== 'admin' && admin.role !== 'superadmin') {
      return { success: false, error: 'Target user is not an Admin' };
    }

    admin.wallet_balance = Number((admin.wallet_balance + amount).toFixed(2));

    this.memoryData.transactions.unshift({
      id: `tx_sdep_${Date.now()}`,
      user_id: admin.id,
      type: 'admin_float_credit',
      amount: amount,
      description: `Super Admin Direct Deposit: ${note}`,
      balance_after: admin.wallet_balance,
      created_at: new Date().toISOString(),
    });

    this.memoryData.notifications.unshift({
      id: `notif_sdep_${Date.now()}`,
      recipient_type: 'user',
      target_user_id: admin.id,
      target_username: admin.username,
      title: `Direct Deposit Received: ${amount.toLocaleString()} ETB`,
      message: `Super Admin @${reviewer.username} deposited ${amount.toLocaleString()} ETB to your operational balance. Note: ${note}`,
      type: 'success',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: reviewer.id,
      actor_username: reviewer.username,
      actor_role: reviewer.role,
      action: 'SUPERADMIN_DIRECT_DEPOSIT',
      details: `Super Admin ${reviewer.username} directly deposited ${amount} ETB to Admin ${admin.username}. New balance: ${admin.wallet_balance} ETB`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    const { password_hash: _h, salt: _s, ...clean } = admin;
    return { success: true, admin: clean };
  }

  // Emergency Manual Balance Adjustment (Super Admin only)
  public adjustUserBalance(
    userId: string,
    type: 'credit' | 'debit',
    amount: number,
    auditNote: string,
    actor: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; user?: User } {
    const user = this.findUserById(userId);
    if (!user) return { success: false, error: 'User not found' };

    const delta = type === 'credit' ? amount : -amount;
    if (type === 'debit' && user.wallet_balance < amount) {
      return { success: false, error: `Cannot debit ${amount} ETB: user only has ${user.wallet_balance} ETB` };
    }

    user.wallet_balance = Number((user.wallet_balance + delta).toFixed(2));

    this.memoryData.transactions.unshift({
      id: `tx_adj_${Date.now()}`,
      user_id: user.id,
      type: 'admin_adjustment',
      amount: delta,
      description: `Executive Adjustment (${type.toUpperCase()}): ${auditNote}`,
      balance_after: user.wallet_balance,
      created_at: new Date().toISOString(),
    });

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'BALANCE_ADJUSTMENT',
      details: `${type.toUpperCase()} ${amount} ETB to ${user.username}. Note: ${auditNote}`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    const { password_hash, salt, ...clean } = user;
    return { success: true, user: clean };
  }

  // Create New Auction
  public createAuction(data: {
    title: string;
    category: string;
    description: string;
    image_url: string;
    start_price: number;
    bid_increment: number;
    participation_fee: number;
    internal_cost: number; // Strictly confidential
    start_time: string;
    end_time: string;
    actor: { id: string; username: string; role: UserRole };
  }): Auction {
    const newAuction: Auction = {
      id: `auc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: data.title.trim(),
      category: data.category,
      description: data.description.trim(),
      image_url: data.image_url.trim(),
      start_price: Number(data.start_price.toFixed(2)),
      bid_increment: Number(data.bid_increment.toFixed(2)),
      participation_fee: Number(data.participation_fee.toFixed(2)),
      internal_cost: Number(data.internal_cost.toFixed(2)),
      status: 'active',
      start_time: data.start_time,
      end_time: data.end_time,
      total_bids: 0,
      created_at: new Date().toISOString(),
    };

    this.memoryData.auctions.unshift(newAuction);

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: data.actor.id,
      actor_username: data.actor.username,
      actor_role: data.actor.role,
      action: 'CREATE_AUCTION',
      details: `Created auction "${newAuction.title}" with confidential item cost ${newAuction.internal_cost} ETB`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    // Broadcast notification
    this.memoryData.notifications.unshift({
      id: `notif_new_auc_${Date.now()}`,
      recipient_type: 'all',
      title: `✨ New Auction Live: ${newAuction.title}`,
      message: `Bidding is now open! Category: ${newAuction.category}, Participation Fee: ${newAuction.participation_fee} ETB. Place your unique bid now!`,
      type: 'info',
      created_at: new Date().toISOString(),
      read_by: [],
    });

    this.persist(this.memoryData);
    return newAuction;
  }

  // Auction Oversight: Pause, Resume, Extend, Cancel, Delete
  public controlAuction(
    auctionId: string,
    action: 'pause' | 'resume' | 'extend_1h' | 'extend_24h' | 'cancel' | 'delete',
    actor: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; auction?: Auction } {
    const auctionIdx = this.memoryData.auctions.findIndex(a => a.id === auctionId);
    if (auctionIdx === -1) return { success: false, error: 'Auction not found' };

    const auction = this.memoryData.auctions[auctionIdx];

    if (action === 'delete') {
      this.memoryData.auctions.splice(auctionIdx, 1);
      this.memoryData.audit_logs.unshift({
        id: `aud_${Date.now()}`,
        actor_id: actor.id,
        actor_username: actor.username,
        actor_role: actor.role,
        action: 'DELETE_AUCTION',
        details: `Deleted auction "${auction.title}" (ID: ${auction.id})`,
        ip_reference: '197.156.103.1',
        created_at: new Date().toISOString(),
      });
      this.persist(this.memoryData);
      return { success: true };
    }

    if (action === 'pause') {
      auction.status = 'paused';
    } else if (action === 'resume') {
      auction.status = 'active';
    } else if (action === 'cancel') {
      auction.status = 'cancelled';
    } else if (action === 'extend_1h') {
      const currentEnd = new Date(auction.end_time).getTime();
      auction.end_time = new Date(currentEnd + 3600000).toISOString();
      if (auction.status === 'ended') auction.status = 'active';
    } else if (action === 'extend_24h') {
      const currentEnd = new Date(auction.end_time).getTime();
      auction.end_time = new Date(currentEnd + 86400000).toISOString();
      if (auction.status === 'ended') auction.status = 'active';
    }

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'AUCTION_CONTROL',
      details: `Action ${action} on auction "${auction.title}"`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return { success: true, auction };
  }

  // Send Notification (Direct or Broadcast)
  public sendNotification(data: {
    recipient_type: 'all' | 'user';
    target_user_id?: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'alert' | 'urgent';
    actor: { id: string; username: string; role: UserRole };
  }): PlatformNotification {
    let targetUsername: string | undefined;
    if (data.target_user_id) {
      const targetUser = this.findUserById(data.target_user_id);
      targetUsername = targetUser?.username;
    }

    const notif: PlatformNotification = {
      id: `notif_${Date.now()}`,
      recipient_type: data.recipient_type,
      target_user_id: data.target_user_id,
      target_username: targetUsername,
      title: data.title.trim(),
      message: data.message.trim(),
      type: data.type,
      created_at: new Date().toISOString(),
      read_by: [],
    };

    this.memoryData.notifications.unshift(notif);

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: data.actor.id,
      actor_username: data.actor.username,
      actor_role: data.actor.role,
      action: 'DISPATCH_NOTIFICATION',
      details: `Sent ${data.type} notification to ${data.recipient_type === 'all' ? 'All Users' : targetUsername}: "${data.title}"`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.persist(this.memoryData);
    return notif;
  }

  // Mark notification read
  public markNotificationRead(notifId: string, userId: string) {
    const notif = this.memoryData.notifications.find(n => n.id === notifId);
    if (notif && !notif.read_by.includes(userId)) {
      notif.read_by.push(userId);
      this.persist(this.memoryData);
    }
  }

  // Super Admin Financials & P&L Calculation with date filtering
  public getFinancialReport(filter: 'all' | 'today' | 'week' | 'month' = 'all'): FinancialReport {
    this.checkAndConcludeAuctions();

    const now = new Date();
    let startDate: Date | null = null;

    if (filter === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (filter === 'week') {
      startDate = new Date(now.getTime() - 7 * 86400000);
    } else if (filter === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const filterDate = (dateStr: string) => {
      if (!startDate) return true;
      return new Date(dateStr) >= startDate;
    };

    // Filter deposits
    const approvedDeposits = this.memoryData.deposits.filter(
      d => (d.status === 'approved' || d.status === 'APPROVED') && filterDate(d.reviewed_at || d.created_at)
    );
    const pendingDeposits = this.memoryData.deposits.filter(
      d => (d.status === 'pending' || d.status === 'PENDING') && filterDate(d.created_at)
    );
    const rejectedDeposits = this.memoryData.deposits.filter(
      d => (d.status === 'rejected' || d.status === 'REJECTED') && filterDate(d.reviewed_at || d.created_at)
    );

    const totalApprovedDeposits = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);
    const pendingDepositsAmount = pendingDeposits.reduce((acc, d) => acc + d.amount, 0);
    const rejectedDepositsAmount = rejectedDeposits.reduce((acc, d) => acc + d.amount, 0);

    // Per-auction P&L breakdown (showcase demonstration auctions are excluded from active platform ledger so financial page starts at clean 0.00 ETB)
    const auditedAuctions = this.memoryData.auctions.filter(auc => !auc.is_showcase);
    const auctionsPnL: AuctionPnL[] = auditedAuctions.map(auc => {
      const auctionBids = this.memoryData.bids.filter(b => b.auction_id === auc.id && filterDate(b.created_at));
      const totalFeesCollected = auctionBids.reduce((acc, b) => acc + b.fee_paid, 0);
      const winningBidAmount = auc.winning_bid_amount || 0;
      const grossRevenue = totalFeesCollected + (auc.status === 'ended' ? winningBidAmount : 0);
      const confidentialCost = auc.internal_cost || 0;
      const netProfitLoss = grossRevenue - confidentialCost;

      return {
        auction_id: auc.id,
        title: auc.title,
        category: auc.category,
        status: auc.status,
        confidential_cost: confidentialCost,
        total_bids: auctionBids.length,
        total_fees_collected: totalFeesCollected,
        winning_bid_amount: winningBidAmount,
        gross_revenue: grossRevenue,
        net_profit_loss: netProfitLoss,
        winner_username: auc.winner_username,
        end_time: auc.end_time,
      };
    });

    const totalConfidentialCosts = auctionsPnL.reduce((acc, a) => acc + a.confidential_cost, 0);
    const totalBiddingRevenue = auctionsPnL.reduce((acc, a) => acc + a.gross_revenue, 0);
    const netProfitLoss = totalBiddingRevenue - totalConfidentialCosts;

    return {
      total_approved_deposits: totalApprovedDeposits,
      total_pending_deposits: pendingDeposits.length,
      total_rejected_deposits: rejectedDeposits.length,
      pending_deposits_amount: pendingDepositsAmount,
      rejected_deposits_amount: rejectedDepositsAmount,
      total_confidential_costs: totalConfidentialCosts,
      total_bidding_revenue: totalBiddingRevenue,
      net_profit_loss: netProfitLoss,
      total_active_auctions: this.memoryData.auctions.filter(a => a.status === 'active').length,
      total_ended_auctions: this.memoryData.auctions.filter(a => a.status === 'ended').length,
      auctions_pnl: auctionsPnL,
    };
  }
}

export const db = new Database();
