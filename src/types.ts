export type UserRole = 'customer' | 'admin' | 'superadmin';

export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  role: UserRole;
  wallet_balance: number;
  status: UserStatus;
  email_verified: boolean;
  created_at: string;
  is_flagged?: boolean;
  flag_reason?: string;
  flagged_at?: string;
  duplicate_txn_attempts?: number;
}

export type AuctionStatus = 'active' | 'paused' | 'ended' | 'cancelled';

export interface Auction {
  id: string;
  title: string;
  category: 'Tech' | 'Luxury' | 'Jewelry' | 'Vehicles' | 'Appliances' | string;
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
}

export type DepositStatus = 'pending' | 'approved' | 'rejected';

export interface DepositRequest {
  id: string;
  user_id: string;
  username: string;
  user_phone: string;
  user_email: string;
  amount: number;
  payment_channel: 'Commercial Bank of Ethiopia (CBE)' | 'Telebirr' | 'Awash Bank' | 'Dashen Bank' | string;
  reference_code: string;
  receipt_url: string;
  receipt_name?: string;
  receipt_mime?: string;
  status: DepositStatus;
  rejection_reason?: string;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
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
  total_confidential_costs: number;
  total_bidding_revenue: number;
  net_profit_loss: number;
  total_active_auctions: number;
  total_ended_auctions: number;
  auctions_pnl: AuctionPnL[];
}
