/** Fanation shared domain types — single source of truth for web, admin, and (later) API contracts. */

export type PostType = "image" | "video" | "poll" | "locked" | "text";

export interface Creator {
  id: string;
  name: string;
  handle: string;
  tag: string;
  avg: string;
  price: number;
  v: boolean;
  live?: boolean;
}

export interface PollOpt {
  label: string;
  pct: number;
}

export interface Post {
  id: string;
  who: string;
  h: string; // handle
  t: string; // relative time label
  v: boolean;
  text: string;
  type: PostType;
  seed: string; // mesh art seed (placeholder imagery)
  likes: number;
  comments: number;
  coins: number;
  price?: number; // PPV coins
  dur?: string; // video duration label
  poll?: PollOpt[];
  mine?: boolean;
  vis?: string;
  when?: string | null;
}

export interface NotifItem {
  icon: string;
  color: string;
  /** Who the row is about. Absent on system notices, which carry no face. */
  actor?: string;
  text: string;
  time: string;
}

export interface TxItem {
  t: string;
  s: string;
  a: string;
  d: string;
  coin: string;
}

export interface ToastMsg {
  id: number;
  msg: string;
  tone?: "ok" | "err" | "";
  actionLabel?: string;
  action?: () => void;
}

export interface PayoutReq {
  amt: number;
  st: string;
  d: string;
}

export type ModalKind =
  | "subscribe" | "coins" | "gift" | "ppv" | "tip" | "report"
  | "compose" | "payout" | "paidmsg" | "menu" | "react";

export interface ModalState {
  t: ModalKind;
  d?: unknown;
}

/* ---------------- Admin domain ---------------- */

export interface AdminUser {
  id: number;
  n: string;
  h: string;
  role: "Creator" | "Fan";
  st: string;
  j: string;
  spend: string;
  strikes: number;
}

export interface KycApp {
  id: number;
  n: string;
  h: string;
  doc: string;
  risk: string;
  t: string;
  st: string;
}

export interface AdminPayout {
  id: number;
  n: string;
  amt: number;
  m: string;
  t: string;
  st: string;
}

export interface ModReport {
  id: number;
  t: string;
  who: string;
  n: number;
  reason: string;
  sev: "High" | "Medium" | "Low";
  prev: string;
  st: string;
  target: string;
  outcome?: string;
}

export interface AuditEntry {
  time: string;
  who: string;
  act: string;
  cat: string;
  why: string;
}

export interface ConfirmCfg {
  title: string;
  desc: string;
  verb: string;
  tone?: "danger";
  reasons?: string[];
  requireReason?: boolean;
  durations?: string[];
  confirmText?: string;
  onGo: (why: string, duration?: string) => void;
}
