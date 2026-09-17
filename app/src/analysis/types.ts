export type Side = "BUY" | "SELL";

export interface Order {
  timestamp: Date;
  symbol: string;
  side: Side;
  qty: number;
  price: number;
  rowIndex: number;
}

export interface ParseError {
  rowIndex: number;
  raw: string;
  message: string;
}

export interface ParseResult {
  orders: Order[];
  errors: ParseError[];
}

export type Direction = "LONG" | "SHORT";

export interface Fill {
  qty: number;
  price: number;
  timestamp: Date;
  isAveragingDown?: boolean;
}

export interface RoundTripTrade {
  id: string;
  symbol: string;
  direction: Direction;
  entryFills: Fill[];
  exitFills: Fill[];
  isOpen: boolean;
  entryTime: Date;
  exitTime: Date | null;
  qtyEntered: number;
  qtyExited: number;
  avgEntryPrice: number;
  avgExitPrice: number | null;
  realizedPnl: number;
  holdingMinutes: number | null;
  hasAveragingDown: boolean;
  averagingDownPnl: number;
}

export type HabitType =
  | "revenge_trading"
  | "cutting_winners_short"
  | "averaging_down"
  | "overtrading"
  | "opening_minutes";

export interface HabitResult {
  type: HabitType;
  detected: boolean;
  insufficientData: boolean;
  occurrences: number;
  costRupees: number;
  relatedTradeIds: string[];
  detail: Record<string, number>;
}

export interface WhatWentWell {
  key: string;
  text: string;
}

export interface MonthlyReview {
  trades: RoundTripTrade[];
  totalRealizedPnl: number;
  closedTradeCount: number;
  openTradeCount: number;
  winCount: number;
  lossCount: number;
  habits: HabitResult[];
  topHabits: HabitResult[];
  wentWell: WhatWentWell[];
  insufficientOverallData: boolean;
}
