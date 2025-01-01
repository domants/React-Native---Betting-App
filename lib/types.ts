// Core types for the admin features
export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "coordinator" | "sub_coordinator" | "usher";
  parent_id: string | null;
  percentage_l2: number;
  percentage_l3: number;
  winnings_l2: number;
  winnings_l3: number;
  created_at: string;
  updated_at: string;
}

export interface DrawResult {
  id: string;
  draw_date: string;
  l2_result: string;
  d3_result: string;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  bet_number: string;
  bet_amount: number;
  bet_type: "L2" | "3D";
  draw_date: string;
  status: "pending" | "won" | "lost";
  created_at: string;
}

export interface BetLimit {
  id: string;
  number_type: "L2" | "3D";
  limit_amount: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
  role: User["role"];
  parent_id?: string;
  percentage_balance?: number;
  winnings_balance?: number;
}
