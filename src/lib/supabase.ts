import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Supabase environment variables not set. Using placeholder values. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Diary {
  id: string;
  diary_number: number;
  ticket_start_range: number;
  ticket_end_range: number;
  total_tickets: number;
  expected_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Issuer {
  id: string;
  issuer_name: string;
  contact_number: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface DiaryAllotment {
  id: string;
  diary_id: string;
  issuer_id: string;
  allotment_date: string;
  status: 'allotted' | 'fully_sold' | 'paid' | 'returned';
  amount_collected: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  diary?: Diary;
  issuer?: Issuer;
}

export interface TicketSale {
  id: string;
  lottery_number: number;
  purchaser_name: string;
  purchaser_contact: string;
  purchaser_address?: string;
  issuer_id: string;
  diary_id: string;
  purchase_date: string;
  amount_paid: number;
  created_at: string;
  updated_at: string;
  // Joined data
  issuer?: Issuer;
  diary?: Diary;
}

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  user_id?: string;
  timestamp: string;
}

export interface DashboardStats {
  total_tickets_sold: number;
  total_revenue: number;
  diaries_allotted: number;
  diaries_fully_sold: number;
  diaries_paid: number;
  diaries_returned: number;
  total_amount_collected: number;
  expected_amount_from_allotted: number;
}

export interface IssuerPerformance {
  id: string;
  issuer_name: string;
  contact_number: string;
  diaries_allotted: number;
  tickets_sold: number;
  total_collected: number;
  expected_amount: number;
  collection_percentage: number;
}

// Helper function to get diary number from lottery number
export function getDiaryFromLotteryNumber(lotteryNumber: number): number {
  if (lotteryNumber <= 39996) {
    return Math.ceil(lotteryNumber / 22);
  } else {
    return 1819; // Last diary
  }
}

// Helper function to get ticket range for a diary
export function getTicketRangeForDiary(diaryNumber: number): { start: number; end: number } {
  if (diaryNumber === 1819) {
    return { start: 39997, end: 39999 };
  } else {
    const start = (diaryNumber - 1) * 22 + 1;
    const end = diaryNumber * 22;
    return { start, end };
  }
}

// Helper function to validate lottery number for diary
export function validateLotteryNumberForDiary(lotteryNumber: number, diaryNumber: number): boolean {
  const range = getTicketRangeForDiary(diaryNumber);
  return lotteryNumber >= range.start && lotteryNumber <= range.end;
}
