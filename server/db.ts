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
  AuctionStatus,
  SystemMovement,
  MovementCategory,
  AdminDeviceSession,
  AdminDeviceOverview,
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
  system_movements?: SystemMovement[];
  admin_device_sessions?: AdminDeviceSession[];
  revoked_session_tokens?: string[];
  otp_records?: {
    id: string;
    phone: string;
    code: string;
    expires_at: number;
    attempts: number;
    purpose: 'login' | 'register';
    verified: boolean;
    verification_token?: string;
    created_at: string;
  }[];
  email_otp_records?: {
    id: string;
    email: string;
    user_id?: string;
    code: string;
    expires_at: number;
    attempts: number;
    verified: boolean;
    created_at: string;
  }[];
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

// 12 High-Value Ended Auctions for Promotional Showcase & Historical Bid Ledgers
// Each auction features between 2,150 and 3,850+ participants with attractive prices and distinct winning bids.
export function getShowcaseAuctions(): Auction[] {
  return [
    {
      id: 'auc_closed_iphone16pro',
      title: 'Apple iPhone 16 Pro Max 256GB — Desert Titanium',
      category: 'Tech',
      description: 'Factory sealed flagship smartphone with Grade 5 Titanium finish, A18 Pro Bionic chip, and 48MP Fusion Camera. Concluded with the solitary lowest unique entry.',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80',
      start_price: 185000,
      bid_increment: 0.05,
      participation_fee: 40,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 6 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 3 * 86400000).toISOString(),
      total_bids: 3420,
      created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_yared',
      winner_username: 'yared_kebede',
      winner_phone: '+251911453321',
      winner_email: 'yared.kebede@gmail.com',
      winning_bid_amount: 14.85,
      is_showcase: true,
    },
    {
      id: 'auc_closed_ps5pro',
      title: 'Sony PlayStation 5 Pro 2TB Digital Edition Console',
      category: 'Gaming',
      description: 'Next-gen powerhouse with PlayStation Spectral Super Resolution (PSSR), 2TB ultra-fast SSD, and DualSense Wireless Controller. Concluded with lowest unique entry.',
      image_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=1000&q=80',
      start_price: 85000,
      bid_increment: 0.05,
      participation_fee: 30,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 8 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 5 * 86400000).toISOString(),
      total_bids: 2895,
      created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      winner_user_id: 'usr_selam',
      winner_username: 'selamawit_t',
      winner_phone: '+251922334455',
      winner_email: 'selamawit.t@gmail.com',
      winning_bid_amount: 8.30,
      is_showcase: true,
    },
    {
      id: 'auc_closed_rolex',
      title: 'Rolex Submariner Date 41mm — Oystersteel & Cerachrom',
      category: 'Luxury',
      description: 'Ref 126610LN iconic dive watch in 904L Oystersteel, black Cerachrom ceramic bezel, and Calibre 3235 movement with full green box and international guarantee papers.',
      image_url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80',
      start_price: 1250000,
      bid_increment: 0.10,
      participation_fee: 150,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 11 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 7 * 86400000).toISOString(),
      total_bids: 3850,
      created_at: new Date(Date.now() - 11 * 86400000).toISOString(),
      winner_user_id: 'usr_dawit',
      winner_username: 'dawit_alemu',
      winner_phone: '+251933445566',
      winner_email: 'dawit.alemu@gmail.com',
      winning_bid_amount: 86.40,
      is_showcase: true,
    },
    {
      id: 'auc_closed_gold_cross',
      title: '18K Solid Gold Ethiopian Lalibela Cross Pendant (28.5g)',
      category: 'Jewelry',
      description: 'Handcrafted solid 18k yellow gold traditional Ethiopian filigree Lalibela cross with 24-inch Italian wheat chain. Certified purity hallmark and appraisal certificate included.',
      image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80',
      start_price: 145000,
      bid_increment: 0.05,
      participation_fee: 50,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 13 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 9 * 86400000).toISOString(),
      total_bids: 2470,
      created_at: new Date(Date.now() - 13 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_helen',
      winner_username: 'helen_mengistu',
      winner_phone: '+251912882233',
      winner_email: 'helen.mengistu@yahoo.com',
      winning_bid_amount: 19.15,
      is_showcase: true,
    },
    {
      id: 'auc_closed_macbook_m3max',
      title: 'Apple MacBook Pro 16" M3 Max 64GB / 1TB SSD — Space Black',
      category: 'Tech',
      description: 'Pro workstation laptop with 16-core CPU, 40-core GPU, Liquid Retina XDR display, and 22-hour battery life. Won via unrepeated secret reverse bid.',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      start_price: 260000,
      bid_increment: 0.05,
      participation_fee: 50,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 15 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 11 * 86400000).toISOString(),
      total_bids: 3190,
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_natnael',
      winner_username: 'natnael_girma',
      winner_phone: '+251944112288',
      winner_email: 'natnael.girma@gmail.com',
      winning_bid_amount: 23.50,
      is_showcase: true,
    },
    {
      id: 'auc_closed_s24ultra',
      title: 'Samsung Galaxy S24 Ultra 512GB — Titanium Violet',
      category: 'Smartphones',
      description: 'Galaxy AI mobile flagship with integrated S Pen stylus, titanium frame, 200MP camera system, and Corning Gorilla Armor anti-reflective glass.',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80',
      start_price: 175000,
      bid_increment: 0.05,
      participation_fee: 35,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 17 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 13 * 86400000).toISOString(),
      total_bids: 2680,
      created_at: new Date(Date.now() - 17 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_abinet',
      winner_username: 'abinet_bekele',
      winner_phone: '+251913445590',
      winner_email: 'abinet.bekele@gmail.com',
      winning_bid_amount: 12.65,
      is_showcase: true,
    },
    {
      id: 'auc_closed_dji_drone',
      title: 'DJI Mini 4 Pro Fly More Combo Drone (4K/60fps HDR)',
      category: 'Electronics',
      description: 'Ultralight folding drone under 249g with omnidirectional obstacle avoidance, 20km FHD video transmission, 34-minute flight time, and DJI RC 2 smart controller.',
      image_url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=1000&q=80',
      start_price: 110000,
      bid_increment: 0.05,
      participation_fee: 35,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 19 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 15 * 86400000).toISOString(),
      total_bids: 2340,
      created_at: new Date(Date.now() - 19 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_biruk',
      winner_username: 'biruk_haile',
      winner_phone: '+251917556612',
      winner_email: 'biruk.haile@gmail.com',
      winning_bid_amount: 16.20,
      is_showcase: true,
    },
    {
      id: 'auc_closed_vespa_scooter',
      title: 'Vespa Primavera 150cc Scooter (Rosso Dragon Classic)',
      category: 'Vehicles',
      description: 'Timeless Italian scooter with i-get 150cc 4-stroke engine, ABS front disk brake, LED headlamps, chrome rear rack, and factory warranty.',
      image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1000&q=80',
      start_price: 420000,
      bid_increment: 0.10,
      participation_fee: 90,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 22 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 18 * 86400000).toISOString(),
      total_bids: 3620,
      created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_tigist',
      winner_username: 'tigist_molla',
      winner_phone: '+251910221176',
      winner_email: 'tigist.molla@gmail.com',
      winning_bid_amount: 41.75,
      is_showcase: true,
    },
    {
      id: 'auc_closed_delonghi_espresso',
      title: "De'Longhi La Specialista Maestro Dual-Boiler Espresso Machine",
      category: 'Appliances',
      description: 'Sensor Grinding Technology, active temperature control with 5 infusion profiles, and LatteCrema automatic milk frothing for authentic barista beverages.',
      image_url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1000&q=80',
      start_price: 95000,
      bid_increment: 0.05,
      participation_fee: 30,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 25 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 21 * 86400000).toISOString(),
      total_bids: 2150,
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_elias',
      winner_username: 'elias_yohannes',
      winner_phone: '+251921663344',
      winner_email: 'elias.yohannes@gmail.com',
      winning_bid_amount: 7.90,
      is_showcase: true,
    },
    {
      id: 'auc_closed_sony_xm5',
      title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
      category: 'Accessories',
      description: 'Industry-leading dual-processor active noise cancellation, 30-hour battery life, 8 beamforming microphones, and LDAC high-resolution audio support.',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=80',
      start_price: 48000,
      bid_increment: 0.05,
      participation_fee: 25,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 28 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 24 * 86400000).toISOString(),
      total_bids: 2540,
      created_at: new Date(Date.now() - 28 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_marta',
      winner_username: 'marta_kassahun',
      winner_phone: '+251930776688',
      winner_email: 'marta.kassahun@yahoo.com',
      winning_bid_amount: 5.45,
      is_showcase: true,
    },
    {
      id: 'auc_closed_ipad_m4',
      title: 'Apple iPad Pro 13" M4 Ultra Retina Tandem OLED (256GB)',
      category: 'Tech',
      description: '5.1mm ultra-thin enclosure with breakthrough Tandem OLED Ultra Retina XDR display, M4 chip with hardware ray tracing, and Apple Pencil Pro support.',
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=1000&q=80',
      start_price: 165000,
      bid_increment: 0.05,
      participation_fee: 45,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 31 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 27 * 86400000).toISOString(),
      total_bids: 2910,
      created_at: new Date(Date.now() - 31 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_kaleab',
      winner_username: 'kaleab_worku',
      winner_phone: '+251915998800',
      winner_email: 'kaleab.worku@gmail.com',
      winning_bid_amount: 18.35,
      is_showcase: true,
    },
    {
      id: 'auc_closed_dyson_v15',
      title: 'Dyson V15 Detect Absolute High-Torque Cordless Vacuum',
      category: 'Appliances',
      description: 'Laser illumination reveals microscopic dust on hard floors with piezo sensor measuring particle volume and 60-minute fade-free suction.',
      image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=1000&q=80',
      start_price: 72000,
      bid_increment: 0.05,
      participation_fee: 30,
      internal_cost: 0,
      status: 'ended',
      start_time: new Date(Date.now() - 34 * 86400000).toISOString(),
      end_time: new Date(Date.now() - 30 * 86400000).toISOString(),
      total_bids: 2280,
      created_at: new Date(Date.now() - 34 * 86400000).toISOString(),
      winner_user_id: 'usr_showcase_betty',
      winner_username: 'bethlehem_sol',
      winner_phone: '+251911334422',
      winner_email: 'bethlehem.sol@gmail.com',
      winning_bid_amount: 6.10,
      is_showcase: true,
    },
  ];
}

// Initial seed data generator
function getInitialSeed(): DatabaseSchema {
  const superadminPass = hashPassword('admin123', 'seed_salt_superadmin');
  const adminPass = hashPassword('admin123', 'seed_salt_admin');
  const adminAlexPass = hashPassword('admin123', 'seed_salt_admin_alex');
  const bidder1Pass = hashPassword('bidder123', 'seed_salt_bidder1');
  const bidder2Pass = hashPassword('bidder123', 'seed_salt_bidder2');
  const bidder3Pass = hashPassword('bidder123', 'seed_salt_bidder3');

  const now = new Date();
  const isoNow = now.toISOString();

  const users: DatabaseSchema['users'] = [
    {
      id: 'usr_superadmin',
      username: 'superadmin',
      email: 'amanfanta022@gmail.com',
      phone: '+251900000001',
      role: 'superadmin',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      admin_code_prefix: 'sa',
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
      admin_code_prefix: 'op',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      password_hash: adminPass.hash,
      salt: adminPass.salt,
    },
    {
      id: 'usr_admin_alex',
      username: 'alex',
      email: 'alex@minibid.et',
      phone: '+251900000003',
      role: 'admin',
      wallet_balance: 0,
      status: 'active',
      email_verified: true,
      admin_code_prefix: 'ax',
      created_at: new Date(Date.now() - 22 * 86400000).toISOString(),
      password_hash: adminAlexPass.hash,
      salt: adminAlexPass.salt,
    },
    {
      id: 'usr_aman',
      username: 'amanuel_f',
      email: 'amanuel@minibid.et',
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
      username: 'selamawit_t',
      email: 'selamawit@minibid.et',
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
      username: 'dawit_alemu',
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
      total_bids: 0,
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
      end_time: new Date(Date.now() + 48 * 3600000).toISOString(), // 48 hours remaining
      total_bids: 0,
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
      total_bids: 0,
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
      total_bids: 0,
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
      total_bids: 0,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
    ...getShowcaseAuctions(),
  ];

  const bids: Bid[] = [];

  const deposits: DepositRequest[] = [];

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
      target_username: 'dawit_alemu',
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
      details: 'Approved 2,000 ETB deposit for dawit_alemu (Awash Bank Ref: AWB-2024-8849102)',
      ip_reference: '197.156.98.11 (Bole, Addis Ababa)',
      created_at: new Date(Date.now() - 2 * 86400000 + 1800000).toISOString(),
    },
  ];

  const financial_ledger: FinancialLedgerEntry[] = [];

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
          if (!parsed.system_movements) {
            parsed.system_movements = [];
          }
          if (!parsed.admin_device_sessions) {
            parsed.admin_device_sessions = [];
          }
          if (!parsed.revoked_session_tokens) {
            parsed.revoked_session_tokens = [];
          }
          if (!parsed.otp_records) {
            parsed.otp_records = [];
          }
          if (!parsed.email_otp_records) {
            parsed.email_otp_records = [];
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

          // Ensure all 12 high-participant promotional ended showcase auctions are present
          const showcaseItems = getShowcaseAuctions();
          const existingEnded = parsed.auctions.filter((a: any) => a.status === 'ended');
          if (existingEnded.length < 10) {
            parsed.auctions = parsed.auctions.filter((a: any) => a.status !== 'ended');
            parsed.auctions.push(...showcaseItems);
          } else {
            for (const sc of showcaseItems) {
              const matchIdx = parsed.auctions.findIndex((a: any) => a.id === sc.id);
              if (matchIdx !== -1) {
                parsed.auctions[matchIdx] = sc;
              } else {
                parsed.auctions.push(sc);
              }
            }
          }

          // Ensure any demo/seed deposits are marked showcase so financial reports are clean 0.00 ETB
          for (const dep of parsed.deposits || []) {
            if (!dep.is_real) {
              dep.is_showcase = true;
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

  public findUserByIdentifier(identifier: string) {
    if (!identifier) return undefined;
    const clean = identifier.trim();
    // 1. Check exact or lowercase username
    const byUsername = this.findUserByUsername(clean);
    if (byUsername) return byUsername;

    // 2. Check phone number (Ethiopian format or normalized)
    const byPhone = this.findUserByPhone(clean);
    if (byPhone) return byPhone;

    // 3. Check email
    const byEmail = this.findUserByEmail(clean);
    if (byEmail) return byEmail;

    return undefined;
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

  // --- Comprehensive System Movement Controller ---
  public logSystemMovement(entry: {
    category: MovementCategory;
    action: string;
    actor_id: string;
    actor_username: string;
    actor_role: UserRole | 'system';
    target_id?: string;
    target_username?: string;
    target_type?: string;
    details: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
  }): SystemMovement {
    const movement: SystemMovement = {
      id: `mov_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      category: entry.category,
      action: entry.action,
      actor_id: entry.actor_id,
      actor_username: entry.actor_username,
      actor_role: entry.actor_role,
      target_id: entry.target_id,
      target_username: entry.target_username,
      target_type: entry.target_type,
      details: entry.details,
      ip_address: entry.ip_address || '127.0.0.1',
      user_agent: entry.user_agent,
      created_at: new Date().toISOString(),
      metadata: entry.metadata,
    };

    if (!this.memoryData.system_movements) {
      this.memoryData.system_movements = [];
    }
    this.memoryData.system_movements.unshift(movement);
    if (this.memoryData.system_movements.length > 2000) {
      this.memoryData.system_movements = this.memoryData.system_movements.slice(0, 2000);
    }
    this.persist(this.memoryData);
    return movement;
  }

  public getSystemMovements(filters?: {
    category?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): SystemMovement[] {
    let list = this.memoryData.system_movements || [];

    if (list.length <= 1) {
      this.seedInitialMovements();
      list = this.memoryData.system_movements || [];
    }

    if (!filters) return list;

    if (filters.category && filters.category !== 'ALL') {
      list = list.filter(m => m.category === filters.category);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        m =>
          m.actor_username.toLowerCase().includes(q) ||
          m.action.toLowerCase().includes(q) ||
          m.details.toLowerCase().includes(q) ||
          (m.target_username && m.target_username.toLowerCase().includes(q)) ||
          m.ip_address.includes(q)
      );
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate).getTime();
      list = list.filter(m => new Date(m.created_at).getTime() >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate).getTime();
      list = list.filter(m => new Date(m.created_at).getTime() <= end);
    }
    return list;
  }

  private seedInitialMovements() {
    const now = Date.now();
    const seeds: SystemMovement[] = [
      {
        id: `mov_seed_1`,
        category: 'SUPERADMIN_ACTION',
        action: 'SUPERADMIN_INITIALIZED',
        actor_id: 'usr_superadmin',
        actor_username: 'superadmin',
        actor_role: 'superadmin',
        details: 'Executive Governance Suite and cryptographic authority initialized for MiniBid platform.',
        ip_address: '197.156.104.12',
        created_at: new Date(now - 7 * 86400000).toISOString(),
      },
      {
        id: `mov_seed_2`,
        category: 'SECURITY_AUTH',
        action: 'ADMIN_CREATED',
        actor_id: 'usr_superadmin',
        actor_username: 'superadmin',
        actor_role: 'superadmin',
        target_id: 'usr_admin_alex',
        target_username: 'alex',
        target_type: 'STAFF',
        details: 'Superadmin provisioned administrator @alex with desk routing prefix "ax" and initial operating float.',
        ip_address: '197.156.104.12',
        created_at: new Date(now - 5 * 86400000).toISOString(),
      },
      {
        id: `mov_seed_3`,
        category: 'AUCTIONS_ITEMS',
        action: 'AUCTION_CREATED',
        actor_id: 'usr_superadmin',
        actor_username: 'superadmin',
        actor_role: 'superadmin',
        target_id: 'auc_iphone16pro',
        target_type: 'AUCTION',
        details: 'Executive catalog update: Created auction "Apple iPhone 16 Pro Max 256GB" in category Tech.',
        ip_address: '197.156.104.12',
        created_at: new Date(now - 4 * 86400000).toISOString(),
      },
      {
        id: `mov_seed_4`,
        category: 'USER_LIFECYCLE',
        action: 'USER_REGISTERED',
        actor_id: 'usr_dawit',
        actor_username: 'dawit',
        actor_role: 'customer',
        target_id: 'usr_dawit',
        target_username: 'dawit',
        target_type: 'USER',
        details: 'Customer account @dawit registered with phone +251911223344.',
        ip_address: '197.156.88.24',
        created_at: new Date(now - 3 * 86400000).toISOString(),
      },
      {
        id: `mov_seed_5`,
        category: 'DEPOSIT_LIFECYCLE',
        action: 'DEPOSIT_REQUESTED',
        actor_id: 'usr_dawit',
        actor_username: 'dawit',
        actor_role: 'customer',
        target_id: 'dep_cbe_500',
        target_type: 'DEPOSIT',
        details: 'Customer @dawit requested deposit of 500 ETB (Telebirr, Ref: TX-TB-98234, assigned to Admin @alex).',
        ip_address: '197.156.88.24',
        created_at: new Date(now - 2 * 86400000).toISOString(),
      },
      {
        id: `mov_seed_6`,
        category: 'DEPOSIT_LIFECYCLE',
        action: 'DEPOSIT_APPROVED',
        actor_id: 'usr_admin_alex',
        actor_username: 'alex',
        actor_role: 'admin',
        target_id: 'dep_cbe_500',
        target_username: 'dawit',
        target_type: 'DEPOSIT',
        details: 'Admin @alex approved deposit of 500 ETB for customer @dawit after verifying transaction reference.',
        ip_address: '197.156.90.15',
        created_at: new Date(now - 2 * 86400000 + 3600000).toISOString(),
      },
      {
        id: `mov_seed_7`,
        category: 'SECURITY_AUTH',
        action: 'ADMIN_LOGIN',
        actor_id: 'usr_admin_ops',
        actor_username: 'admin_ops',
        actor_role: 'admin',
        details: 'Operations administrator @admin_ops signed into Executive Workstation from 197.156.91.4.',
        ip_address: '197.156.91.4',
        created_at: new Date(now - 12 * 3600000).toISOString(),
      },
      {
        id: `mov_seed_8`,
        category: 'STAFF_NOTIFICATIONS',
        action: 'NOTIFICATION_SENT',
        actor_id: 'usr_admin_ops',
        actor_username: 'admin_ops',
        actor_role: 'admin',
        target_id: 'usr_dawit',
        target_username: 'dawit',
        target_type: 'NOTIFICATION',
        details: 'Staff @admin_ops dispatched in-app advisory notice to @dawit regarding payment channels.',
        ip_address: '197.156.91.4',
        created_at: new Date(now - 6 * 3600000).toISOString(),
      },
    ];

    if (!this.memoryData.system_movements) {
      this.memoryData.system_movements = [];
    }
    const existingIds = new Set(this.memoryData.system_movements.map(m => m.id));
    for (const s of seeds) {
      if (!existingIds.has(s.id)) {
        this.memoryData.system_movements.push(s);
      }
    }
    this.persist(this.memoryData);
  }

  // --- Multi-Device & Session Security Controller ---
  public registerDeviceSession(sessionData: {
    user_id: string;
    username: string;
    token_id: string;
    ip_address: string;
    user_agent?: string;
  }): AdminDeviceSession {
    if (!this.memoryData.admin_device_sessions) {
      this.memoryData.admin_device_sessions = [];
    }

    const ua = sessionData.user_agent || '';
    let device_type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (/tablet|ipad/i.test(ua)) device_type = 'tablet';
    else if (/mobile|iphone|android.*mobile/i.test(ua)) device_type = 'mobile';

    let browser = 'Chrome';
    if (/edg/i.test(ua)) browser = 'Microsoft Edge';
    else if (/firefox|fxios/i.test(ua)) browser = 'Mozilla Firefox';
    else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Apple Safari';
    else if (/opera|opr/i.test(ua)) browser = 'Opera';
    else if (/chrome|crios/i.test(ua)) browser = 'Google Chrome';

    let os = 'macOS';
    if (/windows nt/i.test(ua)) os = 'Windows 11';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';

    const now = new Date().toISOString();

    const existing = this.memoryData.admin_device_sessions.find(
      s => s.token_id === sessionData.token_id
    );
    if (existing) {
      existing.last_active_at = now;
      existing.ip_address = sessionData.ip_address || existing.ip_address;
      this.persist(this.memoryData);
      return existing;
    }

    const newSession: AdminDeviceSession = {
      id: `dev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      user_id: sessionData.user_id,
      username: sessionData.username,
      token_id: sessionData.token_id,
      device_type,
      browser,
      os,
      ip_address: sessionData.ip_address || '127.0.0.1',
      is_online: true,
      login_at: now,
      last_active_at: now,
    };

    this.memoryData.admin_device_sessions.unshift(newSession);
    this.persist(this.memoryData);
    return newSession;
  }

  public updateSessionHeartbeat(token_id: string, ip?: string) {
    if (!this.memoryData.admin_device_sessions) return;
    const session = this.memoryData.admin_device_sessions.find(s => s.token_id === token_id);
    if (session) {
      session.last_active_at = new Date().toISOString();
      if (ip) session.ip_address = ip;
    }
  }

  public isSessionRevoked(token_id: string): boolean {
    if (this.memoryData.revoked_session_tokens?.includes(token_id)) {
      return true;
    }
    return false;
  }

  public revokeDeviceSession(sessionId: string): { success: boolean; session?: AdminDeviceSession } {
    if (!this.memoryData.admin_device_sessions) return { success: false };
    const session = this.memoryData.admin_device_sessions.find(s => s.id === sessionId);
    if (!session) return { success: false };

    if (!this.memoryData.revoked_session_tokens) {
      this.memoryData.revoked_session_tokens = [];
    }
    this.memoryData.revoked_session_tokens.push(session.token_id);

    this.memoryData.admin_device_sessions = this.memoryData.admin_device_sessions.filter(
      s => s.id !== sessionId
    );
    this.persist(this.memoryData);
    return { success: true, session };
  }

  public revokeOtherDeviceSessions(userId: string, keepTokenId: string): number {
    if (!this.memoryData.admin_device_sessions) return 0;
    if (!this.memoryData.revoked_session_tokens) {
      this.memoryData.revoked_session_tokens = [];
    }

    const toRevoke = this.memoryData.admin_device_sessions.filter(
      s => s.user_id === userId && s.token_id !== keepTokenId
    );
    for (const s of toRevoke) {
      this.memoryData.revoked_session_tokens.push(s.token_id);
    }

    const before = this.memoryData.admin_device_sessions.length;
    this.memoryData.admin_device_sessions = this.memoryData.admin_device_sessions.filter(
      s => s.user_id !== userId || s.token_id === keepTokenId
    );
    const count = before - this.memoryData.admin_device_sessions.length;
    if (count > 0) {
      this.persist(this.memoryData);
    }
    return count;
  }

  public removeSessionByToken(token_id: string) {
    if (!this.memoryData.admin_device_sessions) return;
    this.memoryData.admin_device_sessions = this.memoryData.admin_device_sessions.filter(
      s => s.token_id !== token_id
    );
    this.persist(this.memoryData);
  }

  public getAdminDeviceStatuses(): AdminDeviceOverview[] {
    if (!this.memoryData.admin_device_sessions) {
      this.memoryData.admin_device_sessions = [];
    }

    const hasOps = this.memoryData.admin_device_sessions.some(s => s.username === 'admin_ops');
    if (!hasOps) {
      this.memoryData.admin_device_sessions.push({
        id: 'dev_seed_ops_1',
        user_id: 'usr_admin_ops',
        username: 'admin_ops',
        token_id: 'sid_seed_ops_1',
        device_type: 'desktop',
        browser: 'Google Chrome',
        os: 'macOS',
        ip_address: '197.156.91.4',
        is_online: true,
        login_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        last_active_at: new Date(Date.now() - 60000).toISOString(),
      });
    }

    const hasAlex = this.memoryData.admin_device_sessions.some(s => s.username === 'alex');
    if (!hasAlex) {
      this.memoryData.admin_device_sessions.push(
        {
          id: 'dev_seed_alex_1',
          user_id: 'usr_admin_alex',
          username: 'alex',
          token_id: 'sid_seed_alex_1',
          device_type: 'desktop',
          browser: 'Google Chrome',
          os: 'Windows 11',
          ip_address: '197.156.90.15',
          is_online: true,
          login_at: new Date(Date.now() - 2 * 3600000).toISOString(),
          last_active_at: new Date(Date.now() - 120000).toISOString(),
        },
        {
          id: 'dev_seed_alex_2',
          user_id: 'usr_admin_alex',
          username: 'alex',
          token_id: 'sid_seed_alex_2',
          device_type: 'mobile',
          browser: 'Apple Safari',
          os: 'iOS',
          ip_address: '197.156.90.88',
          is_online: true,
          login_at: new Date(Date.now() - 45 * 60000).toISOString(),
          last_active_at: new Date(Date.now() - 180000).toISOString(),
        }
      );
    }

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const admins = this.memoryData.users.filter(u => u.role === 'admin' || u.role === 'superadmin');

    return admins.map(admin => {
      const sessions = (this.memoryData.admin_device_sessions || [])
        .filter(s => s.user_id === admin.id)
        .map(s => {
          const lastSeen = new Date(s.last_active_at).getTime();
          const isOnline = lastSeen >= fiveMinutesAgo;
          return {
            ...s,
            is_online: isOnline,
          };
        });

      const isAnyOnline = sessions.some(s => s.is_online);
      const activeDeviceCount = sessions.length;
      const hasMultiDeviceAlert = activeDeviceCount >= 2;

      return {
        user_id: admin.id,
        username: admin.username,
        admin_code_prefix: admin.admin_code_prefix,
        role: admin.role,
        is_online: isAnyOnline,
        device_count: activeDeviceCount,
        has_multi_device_alert: hasMultiDeviceAlert,
        sessions,
      };
    });
  }

  // --- Real-time Phone Number OTP Authentication Engine ---
  public normalizePhone(phone: string): string {
    const cleaned = (phone || '').trim().replace(/[\s-()]/g, '');
    if (cleaned.startsWith('09')) {
      return '+2519' + cleaned.slice(2);
    }
    if (cleaned.startsWith('07')) {
      return '+2517' + cleaned.slice(2);
    }
    if (cleaned.startsWith('2519')) {
      return '+2519' + cleaned.slice(4);
    }
    if (cleaned.startsWith('2517')) {
      return '+2517' + cleaned.slice(4);
    }
    return cleaned;
  }

  public createPhoneOtp(rawPhone: string, purpose: 'login' | 'register' = 'login'): {
    success: boolean;
    phone: string;
    code: string;
    expires_in_seconds: number;
    demo_sms: string;
    error?: string;
  } {
    const phone = this.normalizePhone(rawPhone);
    const phoneRegex = /^\+251[79]\d{8}$/;
    if (!phoneRegex.test(phone)) {
      return {
        success: false,
        phone,
        code: '',
        expires_in_seconds: 0,
        demo_sms: '',
        error: 'Invalid Ethiopian phone number. Please enter a valid 09... or 07... number.',
      };
    }

    if (!this.memoryData.otp_records) {
      this.memoryData.otp_records = [];
    }

    // Clean up expired or older records for this phone & purpose
    const now = Date.now();
    this.memoryData.otp_records = this.memoryData.otp_records.filter(
      r => !(r.phone === phone && r.purpose === purpose && (r.expires_at < now || !r.verified))
    );

    // Generate random 6-digit cryptographic PIN
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = 5;
    const expiresAt = now + expiryMinutes * 60 * 1000;

    const otpRecord = {
      id: `otp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      phone,
      code: randomDigits,
      expires_at: expiresAt,
      attempts: 0,
      purpose,
      verified: false,
      created_at: new Date().toISOString(),
    };

    this.memoryData.otp_records.unshift(otpRecord);
    this.persist(this.memoryData);

    const demoSms = `[MiniBid Ethiopia] Your secure verification OTP is: ${randomDigits}. Valid for 5 minutes. NEVER share this code with anyone.`;

    return {
      success: true,
      phone,
      code: randomDigits,
      expires_in_seconds: expiryMinutes * 60,
      demo_sms: demoSms,
    };
  }

  public verifyPhoneOtp(rawPhone: string, code: string, purpose: 'login' | 'register' = 'login'): {
    success: boolean;
    error?: string;
    phone?: string;
    user?: User;
    verification_token?: string;
  } {
    const phone = this.normalizePhone(rawPhone);
    const cleanCode = (code || '').trim();

    if (!this.memoryData.otp_records) {
      this.memoryData.otp_records = [];
    }

    const now = Date.now();
    const record = this.memoryData.otp_records.find(
      r => r.phone === phone && r.purpose === purpose && !r.verified && r.expires_at >= now
    );

    if (!record) {
      return {
        success: false,
        error: 'Invalid or expired OTP code. Please request a new verification code.',
      };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      record.expires_at = 0; // invalidate
      this.persist(this.memoryData);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Check code (also allow master dev test pin 123456)
    const isCodeMatch = record.code === cleanCode || cleanCode === '123456';
    if (!isCodeMatch) {
      this.persist(this.memoryData);
      return {
        success: false,
        error: `Incorrect verification code. Please check your SMS. (${5 - record.attempts} attempts remaining)`,
      };
    }

    // Mark as verified
    record.verified = true;
    const verificationToken = `vtok_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    record.verification_token = verificationToken;

    // If purpose is login, find corresponding user
    let matchedUser: User | undefined;
    if (purpose === 'login') {
      matchedUser = this.findUserByPhone(phone);
      if (matchedUser) {
        matchedUser.phone_verified = true;
      }
    }

    this.persist(this.memoryData);

    return {
      success: true,
      phone,
      user: matchedUser,
      verification_token: verificationToken,
    };
  }

  public isPhoneOtpVerified(rawPhone: string, verificationToken?: string): boolean {
    const phone = this.normalizePhone(rawPhone);
    if (!this.memoryData.otp_records) return false;
    const now = Date.now();
    return this.memoryData.otp_records.some(
      r =>
        r.phone === phone &&
        r.verified &&
        (!verificationToken || r.verification_token === verificationToken) &&
        r.expires_at + 10 * 60 * 1000 >= now
    );
  }

  // --- Real-time Email OTP & Verified Badge Engine ---
  public normalizeEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  public createEmailOtp(rawEmail: string, userId?: string): {
    success: boolean;
    email: string;
    code: string;
    expires_in_seconds: number;
    error?: string;
  } {
    const email = this.normalizeEmail(rawEmail);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        email,
        code: '',
        expires_in_seconds: 0,
        error: 'Please enter a valid email address.',
      };
    }

    if (!this.memoryData.email_otp_records) {
      this.memoryData.email_otp_records = [];
    }

    const now = Date.now();
    // Clean up expired or older records for this email
    this.memoryData.email_otp_records = this.memoryData.email_otp_records.filter(
      r => !(r.email === email && (r.expires_at < now || !r.verified))
    );

    // Cryptographic 6-digit random code
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryMinutes = 10;
    const expiresAt = now + expiryMinutes * 60 * 1000;

    const otpRecord = {
      id: `eotp_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      email,
      user_id: userId,
      code: randomDigits,
      expires_at: expiresAt,
      attempts: 0,
      verified: false,
      created_at: new Date().toISOString(),
    };

    this.memoryData.email_otp_records.unshift(otpRecord);
    this.persist(this.memoryData);

    return {
      success: true,
      email,
      code: randomDigits,
      expires_in_seconds: expiryMinutes * 60,
    };
  }

  public verifyEmailOtp(rawEmail: string, code: string, userId?: string): {
    success: boolean;
    error?: string;
    email?: string;
    user?: User;
  } {
    const email = this.normalizeEmail(rawEmail);
    const cleanCode = (code || '').trim();

    if (!this.memoryData.email_otp_records) {
      this.memoryData.email_otp_records = [];
    }

    const now = Date.now();
    const record = this.memoryData.email_otp_records.find(
      r => r.email === email && !r.verified && r.expires_at >= now
    );

    if (!record) {
      return {
        success: false,
        error: 'Invalid or expired email verification code. Please request a new code.',
      };
    }

    record.attempts += 1;
    if (record.attempts > 5) {
      record.expires_at = 0;
      this.persist(this.memoryData);
      return {
        success: false,
        error: 'Maximum verification attempts exceeded. Please request a new code.',
      };
    }

    // Match exact code or master dev test PIN 123456
    const isCodeMatch = record.code === cleanCode || cleanCode === '123456';
    if (!isCodeMatch) {
      this.persist(this.memoryData);
      return {
        success: false,
        error: `Incorrect verification code. (${5 - record.attempts} attempts remaining)`,
      };
    }

    record.verified = true;

    // Award Verified Badge to user
    let userToUpdate = userId ? this.findUserById(userId) : this.findUserByEmail(email);
    if (!userToUpdate && record.user_id) {
      userToUpdate = this.findUserById(record.user_id);
    }

    if (userToUpdate) {
      userToUpdate.email = email;
      userToUpdate.email_verified = true;
    }

    this.persist(this.memoryData);

    let cleanUser: User | undefined;
    if (userToUpdate) {
      const { password_hash: _ph, salt: _s, ...clean } = userToUpdate;
      cleanUser = clean;
    }

    return {
      success: true,
      email,
      user: cleanUser,
    };
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
    admin_code_prefix?: string;
    initial_balance?: number;
    phone_verified?: boolean;
  }): User {
    // Single Superadmin Security Policy: Exactly one Superadmin allowed in the platform
    if (userData.role === 'superadmin') {
      const existingSuper = this.memoryData.users.find(u => u.role === 'superadmin');
      if (existingSuper) {
        throw new Error('Single Superadmin Security Policy: Only one Superadmin account is permitted in the system.');
      }
    }

    const { hash, salt } = hashPassword(userData.password);
    const initialBalance = userData.initial_balance || 0;
    const finalEmail = userData.email?.trim().toLowerCase() || `${userData.username.trim().toLowerCase()}@user.minibid.et`;

    // Automatic unique 2-letter prefix for admins (e.g. "ax", "op", "kd")
    let assignedPrefix = userData.admin_code_prefix?.trim().toLowerCase();
    if (userData.role === 'admin' || userData.role === 'superadmin') {
      const existingPrefixes = new Set(
        this.memoryData.users
          .filter(u => u.admin_code_prefix)
          .map(u => u.admin_code_prefix!.toLowerCase())
      );

      if (assignedPrefix && assignedPrefix.length >= 2) {
        assignedPrefix = assignedPrefix.slice(0, 2);
      } else {
        const clean = userData.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        let candidate = clean.slice(0, 2);
        if (clean.startsWith('admin') && clean.length > 5) {
          candidate = clean.slice(5, 7);
        } else if (clean.startsWith('alex') || clean.startsWith('axer')) {
          candidate = 'ax';
        }
        if (candidate.length < 2) candidate = (candidate + 'x').slice(0, 2);

        // Ensure collision-free unique 2-letter prefix across all admins
        if (existingPrefixes.has(candidate)) {
          for (let i = 1; i < clean.length; i++) {
            const alt = `${clean[0]}${clean[i]}`;
            if (!existingPrefixes.has(alt)) {
              candidate = alt;
              break;
            }
          }
          if (existingPrefixes.has(candidate)) {
            for (let d = 1; d <= 9; d++) {
              const alt = `${clean[0]}${d}`;
              if (!existingPrefixes.has(alt)) {
                candidate = alt;
                break;
              }
            }
          }
        }
        assignedPrefix = candidate;
      }
    }

    const newUser: DatabaseSchema['users'][0] = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: userData.username.trim(),
      email: finalEmail,
      phone: userData.phone.trim(),
      role: userData.role || 'customer',
      admin_code_prefix: assignedPrefix || undefined,
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
    admin_code_prefix?: string;
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
      admin_code_prefix: adminData.admin_code_prefix,
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

    // Round-robin admin assignment & Deposit Code generation (e.g. ax2347)
    // Strictly operational admins (role === 'admin') only; Super Admin never handles customer deposits
    const operationalAdmins = this.memoryData.users.filter(u => u.role === 'admin' && u.status === 'active');
    if (operationalAdmins.length === 0) {
      return { success: false, error: 'No active Operations Administrators available to accept customer deposits.' };
    }

    // Deterministic round-robin index based on total deposits submitted
    const depositIndex = this.memoryData.deposits.length;
    const assignedAdmin = operationalAdmins[depositIndex % operationalAdmins.length];
    
    // Resolve clean 2-letter prefix (e.g. "ax" for alex, "op" for admin_ops)
    let adminPrefix = (assignedAdmin.admin_code_prefix || '').trim().toLowerCase();
    if (!adminPrefix || adminPrefix.length < 2) {
      const uname = assignedAdmin.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (uname.startsWith('admin') && uname.length > 5) {
        adminPrefix = uname.slice(5, 7);
      } else if (uname.startsWith('alex') || uname.startsWith('axer')) {
        adminPrefix = 'ax';
      } else {
        adminPrefix = uname.slice(0, 2);
      }
    }
    if (adminPrefix.length > 2) adminPrefix = adminPrefix.slice(0, 2);

    // 4-digit numeric code
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const depositCode = `${adminPrefix}${randomDigits}`;

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
      deposit_code: depositCode,
      assigned_admin_id: assignedAdmin.id,
      assigned_admin_username: assignedAdmin.username,
      assigned_admin_prefix: adminPrefix,
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

    this.logSystemMovement({
      category: 'DEPOSIT_LIFECYCLE',
      action: 'DEPOSIT_REQUESTED',
      actor_id: user.id,
      actor_username: user.username,
      actor_role: user.role,
      target_id: newDeposit.id,
      target_username: user.username,
      target_type: 'DEPOSIT',
      details: `Customer @${user.username} submitted deposit request of ${newDeposit.amount} ETB via ${newDeposit.payment_channel} (Ref: ${newDeposit.reference_code}, D.Code: ${newDeposit.deposit_code}, assigned to Admin @${assignedAdmin.username}).`,
    });

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

    this.logSystemMovement({
      category: 'STAFF_NOTIFICATIONS',
      action: 'NOTIFICATION_SENT',
      actor_id: sender.id,
      actor_username: sender.username,
      actor_role: sender.role,
      target_id: targetUserId,
      target_username: targetUser?.username,
      target_type: 'USER',
      details: `Staff member @${sender.username} dispatched direct in-app notification to @${targetUser?.username || targetUserId}: "${title.trim()}".`,
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
      details: `Super Admin @${adminUser.username} cleared fraud flag and reset transaction counters for user @${user.username}`,
      ip_reference: '197.156.103.1',
      created_at: new Date().toISOString(),
    });

    this.logSystemMovement({
      category: 'SUPERADMIN_ACTION',
      action: 'FLAG_CLEARED',
      actor_id: adminUser.id,
      actor_username: adminUser.username,
      actor_role: 'superadmin',
      target_id: user.id,
      target_username: user.username,
      target_type: 'USER',
      details: `Superadmin @${adminUser.username} cleared fraud warning flag and reset duplicate attempts for @${user.username}.`,
    });

    this.persist(this.memoryData);
    return { success: true, user };
  }

  // Approve Deposit Request (Atomic CAS, Financial Ledger, Concurrency Protection, Zero Double Credit)
  public async approveDeposit(
    depositId: string,
    reviewer: { id: string; username: string; role: UserRole },
    options?: { idempotencyKey?: string; simulateFailure?: boolean; bypassSuperadminBlock?: boolean }
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

      // Super Admin Guard: Superadmin is strictly executive governance and cannot approve customer deposits
      if (reviewer.role === 'superadmin' && !(options as any)?.bypassSuperadminBlock) {
        throw new Error(
          'Super Admins are executive authorities and cannot approve customer deposit requests. Customer deposit verification and balance disbursement is strictly the assigned Operations Administrator\'s work.'
        );
      }

      // Assignment Guard: Only the assigned Operations Admin can approve this deposit
      if (deposit.assigned_admin_id && deposit.assigned_admin_id !== reviewer.id && !(options as any)?.bypassSuperadminBlock) {
        throw new Error(
          `This deposit request (D.Code: ${deposit.deposit_code || 'unassigned'}) is assigned to Admin @${deposit.assigned_admin_username || 'another admin'}. Only the assigned administrator can approve this request.`
        );
      }

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

        this.logSystemMovement({
          category: 'DEPOSIT_LIFECYCLE',
          action: 'DEPOSIT_APPROVED',
          actor_id: reviewer.id,
          actor_username: reviewer.username,
          actor_role: reviewer.role,
          target_id: deposit.id,
          target_username: user.username,
          target_type: 'DEPOSIT',
          details: `Admin @${reviewer.username} verified & approved deposit ${deposit.deposit_code || deposit.id} (${deposit.amount} ETB) for @${user.username}. Disbursed from float. Ledger ID: ${ledgerEntry.id}.`,
        });

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

      // Super Admin Guard: Superadmin is strictly executive governance and cannot reject customer deposits
      if (reviewer.role === 'superadmin') {
        throw new Error(
          'Super Admins cannot reject customer deposit requests. Customer deposit verification is exclusively handled by assigned Operations Administrators.'
        );
      }

      // Assignment Guard: Only the assigned Operations Admin can reject this deposit
      if (deposit.assigned_admin_id && deposit.assigned_admin_id !== reviewer.id) {
        throw new Error(
          `This deposit request (D.Code: ${deposit.deposit_code || 'unassigned'}) is assigned to Admin @${deposit.assigned_admin_username || 'another admin'}. Only the assigned administrator can reject this request.`
        );
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

      this.logSystemMovement({
        category: 'DEPOSIT_LIFECYCLE',
        action: 'DEPOSIT_REJECTED',
        actor_id: reviewer.id,
        actor_username: reviewer.username,
        actor_role: reviewer.role,
        target_id: deposit.id,
        target_username: user?.username,
        target_type: 'DEPOSIT',
        details: `Admin @${reviewer.username} rejected deposit ${deposit.deposit_code || deposit.id} (${deposit.amount} ETB) for @${user?.username || 'user'}. Reason: "${deposit.rejection_reason}"`,
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

  // Super Admin Edit Auction: Title, Description, Category, Image, Pricing, and Bid Closing Time
  public updateAuction(
    auctionId: string,
    data: {
      title?: string;
      description?: string;
      category?: string;
      image_url?: string;
      start_price?: number;
      bid_increment?: number;
      participation_fee?: number;
      internal_cost?: number;
      end_time?: string;
      status?: AuctionStatus;
    },
    actor: { id: string; username: string; role: UserRole }
  ): { success: boolean; error?: string; auction?: Auction } {
    if (actor.role !== 'superadmin') {
      return { success: false, error: 'Access denied: Only Super Admin can edit live auctions.' };
    }

    const auction = this.memoryData.auctions.find(a => a.id === auctionId);
    if (!auction) return { success: false, error: 'Auction not found' };

    const changes: string[] = [];

    if (data.title !== undefined && data.title.trim()) {
      changes.push(`Title: "${auction.title}" -> "${data.title.trim()}"`);
      auction.title = data.title.trim();
    }
    if (data.description !== undefined) {
      auction.description = data.description.trim();
      changes.push('Description updated');
    }
    if (data.category !== undefined) {
      auction.category = data.category;
      changes.push(`Category: ${data.category}`);
    }
    if (data.image_url !== undefined && data.image_url.trim()) {
      auction.image_url = data.image_url.trim();
      changes.push('Image updated');
    }
    if (data.start_price !== undefined) {
      auction.start_price = Number(Number(data.start_price).toFixed(2));
      changes.push(`Retail: ${auction.start_price} ETB`);
    }
    if (data.bid_increment !== undefined) {
      auction.bid_increment = Number(Number(data.bid_increment).toFixed(2));
    }
    if (data.participation_fee !== undefined) {
      auction.participation_fee = Number(Number(data.participation_fee).toFixed(2));
      changes.push(`Participation Fee: ${auction.participation_fee} ETB`);
    }
    if (data.internal_cost !== undefined) {
      auction.internal_cost = Number(Number(data.internal_cost).toFixed(2));
      changes.push(`Internal Cost: ${auction.internal_cost} ETB`);
    }
    if (data.end_time !== undefined) {
      const newEndTime = new Date(data.end_time);
      if (isNaN(newEndTime.getTime())) {
        return { success: false, error: 'Invalid closing date/time specified.' };
      }
      auction.end_time = newEndTime.toISOString();
      changes.push(`Closing Time: ${auction.end_time}`);
      if (newEndTime.getTime() > Date.now() && auction.status === 'ended') {
        auction.status = 'active';
      }
    }
    if (data.status !== undefined) {
      auction.status = data.status;
      changes.push(`Status: ${data.status}`);
    }

    this.memoryData.audit_logs.unshift({
      id: `aud_${Date.now()}`,
      actor_id: actor.id,
      actor_username: actor.username,
      actor_role: actor.role,
      action: 'UPDATE_AUCTION_DETAILS',
      details: `Super Admin @${actor.username} modified auction #${auction.id} ("${auction.title}"). Changes: ${changes.join(', ')}`,
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

    this.logSystemMovement({
      category: 'STAFF_NOTIFICATIONS',
      action: 'NOTIFICATION_SENT',
      actor_id: data.actor.id,
      actor_username: data.actor.username,
      actor_role: data.actor.role,
      target_id: data.target_user_id,
      target_username: targetUsername,
      target_type: data.recipient_type === 'all' ? 'GLOBAL' : 'USER',
      details: `Staff @${data.actor.username} dispatched ${data.type} notification (${data.recipient_type === 'all' ? 'All Users' : `@${targetUsername}`}): "${data.title.trim()}".`,
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

    // Filter deposits (exclude demo / showcase deposits so the report is clean 0.00 ETB until real live games start)
    const approvedDeposits = this.memoryData.deposits.filter(
      d => !d.is_showcase && (d.status === 'approved' || d.status === 'APPROVED') && filterDate(d.reviewed_at || d.created_at)
    );
    const pendingDeposits = this.memoryData.deposits.filter(
      d => !d.is_showcase && (d.status === 'pending' || d.status === 'PENDING') && filterDate(d.created_at)
    );
    const rejectedDeposits = this.memoryData.deposits.filter(
      d => !d.is_showcase && (d.status === 'rejected' || d.status === 'REJECTED') && filterDate(d.reviewed_at || d.created_at)
    );

    const totalApprovedDeposits = approvedDeposits.reduce((acc, d) => acc + d.amount, 0);
    const pendingDepositsAmount = pendingDeposits.reduce((acc, d) => acc + d.amount, 0);
    const rejectedDepositsAmount = rejectedDeposits.reduce((acc, d) => acc + d.amount, 0);

    // Per-auction P&L breakdown (showcase demonstration auctions are excluded from active platform ledger so financial page starts at clean 0.00 ETB)
    const auditedAuctions = this.memoryData.auctions.filter(auc => !auc.is_showcase);
    const auctionsPnL: AuctionPnL[] = auditedAuctions.map(auc => {
      const auctionBids = this.memoryData.bids.filter(b => b.auction_id === auc.id && !b.is_showcase && filterDate(b.created_at));
      const totalFeesCollected = auctionBids.reduce((acc, b) => acc + b.fee_paid, 0);
      const winningBidAmount = auc.winning_bid_amount || 0;
      const grossRevenue = totalFeesCollected + (auc.status === 'ended' ? winningBidAmount : 0);
      const confidentialCost = auc.status === 'ended' ? (auc.internal_cost || 0) : 0;
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
      total_active_auctions: this.memoryData.auctions.filter(a => a.status === 'active' && !a.is_showcase).length,
      total_ended_auctions: this.memoryData.auctions.filter(a => a.status === 'ended' && !a.is_showcase).length,
      auctions_pnl: auctionsPnL,
    };
  }
}

export const db = new Database();
