export type UserRole = 'customer' | 'admin' | 'superadmin';

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  email?: string;
  phone: string;
  role: UserRole;
  wallet_balance: number;
  status: UserStatus;
  email_verified?: boolean;
  phone_verified?: boolean;
  created_at: string;
  is_flagged?: boolean;
  flag_reason?: string;
  flagged_at?: string;
  duplicate_txn_attempts?: number;
  admin_code_prefix?: string; // 2-letter routing prefix e.g. "ax" for Alex, "op" for Ops
}

export type AuctionStatus = 'active' | 'paused' | 'ended' | 'cancelled';

export type AuctionCategory =
  | 'Accessories'
  | 'Kitchen & Dining'
  | 'Electronics'
  | 'Vehicles & Automotive'
  | 'Luxury & Watches'
  | 'Smartphones & Tablets'
  | 'Gaming & Consoles'
  | 'Fashion & Apparel'
  | 'Home Appliances'
  | 'Collectibles & Art'
  | string;

export interface Auction {
  id: string;
  title: string;
  category: AuctionCategory;
  description: string;
  image_url: string;
  start_price: number;
  bid_increment: number;
  participation_fee: number;
  // CONFIDENTIAL: Only visible to Super Admin
  internal_cost?: number;
  status: AuctionStatus;
  start_time: string;
  end_time: string;
  total_bids: number;
  created_at: string;
  // Concluded fields
  winner_user_id?: string;
  winner_username?: string;
  winner_phone?: string;
  winner_email?: string;
  winning_bid_amount?: number;
  is_showcase?: boolean;
  // Super Admin Live Tracking (Only returned to Super Admin)
  superadmin_live_overview?: SuperAdminLiveOverview;
}

export interface SuperAdminLiveOverview {
  currently_winning_bid_amount: number | null;
  currently_winning_username: string | null;
  currently_winning_phone: string | null;
  total_bids: number;
  unique_bids_count: number;
  duplicate_bids_count: number;
  gross_fees: number;
  internal_cost: number;
  projected_margin: number;
}

export interface SuperAdminLiveBid {
  id: string;
  rank: number;
  bid_amount: number;
  status: 'unique_lowest' | 'unique_not_lowest' | 'not_unique';
  user_id: string;
  username: string;
  phone: string;
  created_at: string;
  fee_paid: number;
  duplicate_count: number;
  duplicate_bidders?: { username: string; phone: string; user_id: string; created_at?: string }[];
}

export interface SuperAdminCurrentlyWinningBid {
  id: string;
  bid_amount: number;
  user_id: string;
  username: string;
  phone: string;
  created_at: string;
  fee_paid: number;
}

export interface SuperAdminDuplicateCluster {
  amount: number;
  count: number;
  bidders: { username: string; phone: string; user_id: string; created_at: string }[];
}

export interface SuperAdminLiveGameDetail {
  auction_id: string;
  title: string;
  status: AuctionStatus;
  currently_winning_bid: SuperAdminCurrentlyWinningBid | null;
  total_bids: number;
  unique_bids_count: number;
  duplicate_bids_count: number;
  gross_fees_collected: number;
  internal_cost: number;
  projected_net_margin: number;
  duplicate_clusters: SuperAdminDuplicateCluster[];
}

export type BidUniquenessStatus = 'unique_lowest' | 'unique_not_lowest' | 'not_unique' | 'submitted';

export interface Bid {
  id: string;
  auction_id: string;
  user_id: string;
  username: string;
  bid_amount: number;
  fee_paid: number;
  created_at: string;
  status?: BidUniquenessStatus;
  is_showcase?: boolean;
}

export type DepositStatus = 'pending' | 'approved' | 'rejected' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DepositRequest {
  id: string;
  user_id: string; // Customer ID
  username: string;
  user_phone: string;
  user_email?: string;
  amount: number;
  payment_channel: 'Commercial Bank of Ethiopia (CBE)' | 'Telebirr' | 'Awash Bank' | 'Dashen Bank' | string;
  payment_method?: string; // alias
  reference_code: string; // Transaction number
  transaction_number?: string; // alias
  receipt_url: string;
  receipt_name?: string;
  receipt_mime?: string;
  receipt_size_bytes?: number;
  status: DepositStatus;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  approved_at?: string; // alias
  approved_by?: string; // alias
  idempotency_key?: string;
  attempt_number?: number;
  is_showcase?: boolean;
  deposit_code?: string; // e.g. "ax2347"
  assigned_admin_id?: string;
  assigned_admin_username?: string;
  assigned_admin_prefix?: string;
  warning_count?: number;
  last_warned_at?: string;
  last_warned_by?: string;
  warning_message?: string;
  reassigned_from_id?: string;
  reassigned_from_username?: string;
  reassigned_at?: string;
  reassigned_by?: string;
  elapsed_seconds?: number;
  elapsed_minutes?: number;
  is_sla_breached?: boolean;
  executive_override?: boolean;
}

export interface FinancialLedgerEntry {
  id: string;
  deposit_request_id: string; // UNIQUE CONSTRAINT in database
  customer_id: string;
  customer_username: string;
  amount: number;
  currency: 'ETB';
  type: 'DEPOSIT';
  status: 'COMPLETED';
  payment_method: string;
  transaction_number: string;
  approved_by: string;
  approved_by_id: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface BlockedApprovalAttempt {
  id: string;
  deposit_id: string;
  attempted_by_id: string;
  attempted_by_username: string;
  winning_admin_username: string;
  attempted_at: string;
  reason: string;
}

export interface FinancialIntegrityTestStep {
  testId: string;
  name: string;
  description: string;
  passed: boolean;
  durationMs: number;
  details: string;
  evidence: Record<string, any>;
}

export interface IntegrityTestSuiteReport {
  timestamp: string;
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDurationMs: number;
  steps: FinancialIntegrityTestStep[];
}

export type TransactionType = 'deposit' | 'bid_fee' | 'bid_amount' | 'refund' | 'admin_adjustment' | 'admin_disbursement' | 'admin_float_credit';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  reference_id?: string;
  balance_after: number;
  created_at: string;
}

export interface AdminFloatRequest {
  id: string;
  admin_id: string;
  admin_username: string;
  amount: number;
  notes: string;
  bank_reference?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface PlatformNotification {
  id: string;
  recipient_type: 'all' | 'user' | 'admin' | 'superadmin';
  target_user_id?: string;
  target_username?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'alert' | 'urgent';
  created_at: string;
  read_by: string[];
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_username: string;
  actor_role: UserRole;
  action: string;
  details: string;
  ip_reference: string;
  created_at: string;
}

export type MovementCategory =
  | 'USER_LIFECYCLE'
  | 'DEPOSIT_LIFECYCLE'
  | 'AUCTIONS_ITEMS'
  | 'SECURITY_AUTH'
  | 'STAFF_NOTIFICATIONS'
  | 'SUPERADMIN_ACTION';

export interface SystemMovement {
  id: string;
  category: MovementCategory;
  action: string;
  actor_id: string;
  actor_username: string;
  actor_role: UserRole | 'system';
  target_id?: string;
  target_username?: string;
  target_type?: string;
  details: string;
  ip_address: string;
  user_agent?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface AdminDeviceSession {
  id: string;
  user_id: string;
  username: string;
  token_id: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  ip_address: string;
  is_online: boolean;
  login_at: string;
  last_active_at: string;
}

export interface AdminDeviceOverview {
  user_id: string;
  username: string;
  admin_code_prefix?: string;
  role: UserRole;
  is_online: boolean;
  device_count: number;
  has_multi_device_alert: boolean;
  sessions: AdminDeviceSession[];
}

export interface AuctionPnL {
  auction_id: string;
  title: string;
  category: string;
  status: AuctionStatus;
  confidential_cost: number;
  total_bids: number;
  total_fees_collected: number;
  winning_bid_amount: number;
  gross_revenue: number;
  net_profit_loss: number;
  winner_username?: string;
  end_time: string;
}

export interface FinancialReport {
  total_approved_deposits: number;
  total_pending_deposits: number;
  total_rejected_deposits: number;
  pending_deposits_amount: number;
  rejected_deposits_amount: number;
  total_confidential_costs: number;
  total_bidding_revenue: number;
  net_profit_loss: number;
  total_active_auctions: number;
  total_ended_auctions: number;
  auctions_pnl: AuctionPnL[];
}
