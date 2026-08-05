import { create } from "zustand";
import { SEED_FEED, TX_SEED } from "./data";
import { readStoredTheme, writeStoredTheme } from "./theme-storage";
import type { ModalState, PayoutReq, PollOpt, Post, ToastMsg, TxItem } from "./types";

/**
 * Fan/Creator app store.
 *
 * BACKEND SEAM: every action below maps to exactly one API endpoint.
 * Keep the signature, replace the body with a repository call, keep the
 * optimistic mutation + rollback-on-failure. See README → Integration.
 */

let _seq = 900;
const uid = () => ++_seq;

export interface AppState {
  // session
  authed: boolean;
  theme: "dark" | "light";
  // wallet
  coins: number;
  walletTx: TxItem[];
  payoutReqs: PayoutReq[];
  // engagement
  liked: Record<string, boolean>;
  reacts: Record<string, string>;
  saved: Record<string, boolean>;
  votes: Record<string, number>;
  unlocked: Record<string, boolean>;
  subs: Record<string, boolean>;
  follows: Record<string, boolean>;
  hidden: Record<string, boolean>;
  muted: Record<string, boolean>;
  blocked: Record<string, boolean>;
  reported: Record<string, string>;
  myPosts: Post[];
  comments: Record<string, string[]>;
  notifsRead: boolean;
  // messages
  dms: Record<string, string[]>;
  dmUnlocked: Record<string, boolean>;
  // ui
  toasts: ToastMsg[];
  modal: ModalState | null;

  // actions
  setAuthed(v: boolean): void;
  setTheme(t: "dark" | "light"): void;
  toast(msg: string, tone?: "ok" | "err" | "", actionLabel?: string, action?: () => void): void;
  openModal(t: ModalState["t"], d?: unknown): void;
  closeModal(): void;
  spend(amt: number, label: string): boolean;
  buyCoins(amt: number, usd: string): void;
  tipUsd(v: number, handle: string): void;
  payoutError(amt: number): string | null;
  requestPayout(amt: number): void;
  toggleLike(id: string): void;
  setReact(id: string, emoji: string): void;
  toggleSave(id: string): void;
  vote(id: string, ix: number): void;
  unlockPost(p: Post): boolean;
  subscribe(handle: string): void;
  unsub(handle: string): void;
  toggleFollow(handle: string): void;
  hide(id: string): void;
  mute(handle: string): void;
  block(handle: string): void;
  report(id: string, reason: string): void;
  addComment(id: string, text: string): void;
  addPost(p: { text: string; media?: boolean; poll?: PollOpt[]; vis?: string; when?: string | null; price?: number }): void;
  delPost(id: string): void;
  markNotifsRead(): void;
  sendDm(threadKey: string, text: string): void;
  unlockDm(threadKey: string): boolean;
  feed(): Post[];
}

const drop = <T extends object>(m: T, k: string): T => {
  const n = { ...(m as Record<string, unknown>) };
  delete n[k];
  return n as T;
};

export const useAppStore = create<AppState>()((set, get) => ({
  authed: false,
  /* Read at module evaluation, which happens after the pre-paint script in
     `index.html` has already put the same value on `<body>`. Both read the same
     key, so React mounts agreeing with what is on screen instead of correcting
     it. Everything else in this store is session state and stays in memory. */
  theme: readStoredTheme(),
  coins: 12400,
  walletTx: [],
  payoutReqs: [],
  liked: {},
  reacts: {},
  /* An account that has been used has history. Collections opening on its own
     empty state is technically correct and reads as a broken page, so the demo
     account arrives with a few things already bookmarked — deliberately across
     five creators and three post types. "3" is Priscilla's PPV drop: it stays
     blurred in Collections, which is the point. Saving a locked post is not a
     way around paying for it. */
  saved: { "1": true, "3": true, "6": true, "7": true, "9": true, "14": true },
  votes: {},
  unlocked: {},
  subs: { sofiaa: true, marcusbeats: true, elenalive: true },
  /* Following is free and subscribing is not, so the two lists overlap without
     matching — this account follows six creators and pays three of them. */
  follows: { sofiaa: true, aishab: true, lenaart: true, zaraali: true, leochef: true, noahk: true },
  hidden: {},
  muted: {},
  blocked: {},
  reported: {},
  myPosts: [],
  comments: {},
  notifsRead: false,
  dms: {},
  dmUnlocked: {},
  toasts: [],
  modal: null,

  setAuthed: (v) => set({ authed: v }),
  /* Write first, then set. Only an explicit choice is ever stored — a visitor
     who never touches the toggle leaves no key behind, so the default stays
     changeable without stranding anyone on a value they never picked. */
  setTheme: (t) => {
    writeStoredTheme(t);
    set({ theme: t });
  },

  toast: (msg, tone = "", actionLabel, action) => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, msg, tone, actionLabel, action }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3400);
  },

  openModal: (t, d) => set({ modal: { t, d } }),
  closeModal: () => set({ modal: null }),

  // POST /wallet/spend
  spend: (amt, label) => {
    const { coins, toast } = get();
    if (coins < amt) {
      toast("Not enough coins — top up your wallet to continue", "err");
      return false;
    }
    set((s) => ({
      coins: s.coins - amt,
      walletTx: [{ t: label, s: "Coins", a: "", d: "Just now", coin: `-${amt.toLocaleString()}` }, ...s.walletTx],
    }));
    return true;
  },

  // POST /wallet/purchase
  buyCoins: (amt, usd) => {
    set((s) => ({
      coins: s.coins + amt,
      walletTx: [{ t: `Coin pack — ${amt.toLocaleString()} coins`, s: "Card · Paystack", a: `-${usd}.00`, d: "Just now", coin: `+${amt.toLocaleString()}` }, ...s.walletTx],
    }));
    get().toast(`${amt.toLocaleString()} coins added to your wallet`, "ok");
  },

  // POST /tips
  tipUsd: (v, handle) => {
    set((s) => ({ walletTx: [{ t: `Tip to @${handle}`, s: "Card · Paystack", a: `-$${v}.00`, d: "Just now", coin: "" }, ...s.walletTx] }));
    get().toast(`$${v} tip sent to @${handle} 💛`, "ok");
  },

  payoutError: (amt) =>
    amt < 50 ? "Minimum payout is $50" : amt > 4280 ? "Exceeds your available balance ($4,280)" : null,

  // POST /payouts
  requestPayout: (amt) => {
    set((s) => ({ payoutReqs: [{ amt, st: "Pending review", d: "Just now" }, ...s.payoutReqs] }));
    get().toast(`Payout of $${amt.toLocaleString()} requested — arrives in 1–3 business days`, "ok");
  },

  // POST /posts/:id/like
  toggleLike: (id) => set((s) => ({ liked: { ...s.liked, [id]: !s.liked[id] } })),

  // POST /posts/:id/react
  setReact: (id, emoji) =>
    set((s) => ({ reacts: s.reacts[id] === emoji ? drop(s.reacts, id) : { ...s.reacts, [id]: emoji } })),

  // POST /posts/:id/save
  toggleSave: (id) => {
    const on = !get().saved[id];
    set((s) => ({ saved: { ...s.saved, [id]: on } }));
    get().toast(on ? "Saved to your collection" : "Removed from your collection", on ? "ok" : "");
  },

  // POST /polls/:id/vote — one vote per user, enforced client + server
  vote: (id, ix) => {
    if (get().votes[id] != null) return;
    set((s) => ({ votes: { ...s.votes, [id]: ix } }));
    get().toast("Vote recorded", "ok");
  },

  // POST /purchases (PPV)
  unlockPost: (p) => {
    if (!get().spend(p.price ?? 150, "PPV unlock")) return false;
    set((s) => ({ unlocked: { ...s.unlocked, [p.id]: true } }));
    get().toast("Content unlocked 🔓", "ok");
    return true;
  },

  // POST /subscriptions
  subscribe: (handle) => {
    set((s) => ({ subs: { ...s.subs, [handle]: true } }));
    get().toast(`Subscribed to @${handle} · renews Aug 17`, "ok");
  },

  // DELETE /subscriptions/:handle
  unsub: (handle) => {
    set((s) => ({ subs: drop(s.subs, handle) }));
    get().toast(`Subscription to @${handle} cancelled — active until Aug 17`);
  },

  // POST /follows
  toggleFollow: (handle) => {
    const was = get().follows[handle];
    set((s) => ({ follows: { ...s.follows, [handle]: !was } }));
    get().toast(was ? `Unfollowed @${handle}` : `Following @${handle}`, was ? "" : "ok");
  },

  // POST /posts/:id/hide
  hide: (id) => {
    set((s) => ({ hidden: { ...s.hidden, [id]: true } }));
    get().toast("Post hidden — we'll show fewer like it", "", "Undo", () =>
      set((s) => ({ hidden: drop(s.hidden, id) })),
    );
  },

  // POST /users/:handle/mute
  mute: (handle) => {
    set((s) => ({ muted: { ...s.muted, [handle]: true } }));
    get().toast(`Muted @${handle} — their posts won't appear in your feed`, "", "Undo", () =>
      set((s) => ({ muted: drop(s.muted, handle) })),
    );
  },

  // POST /users/:handle/block
  block: (handle) => {
    set((s) => ({ blocked: { ...s.blocked, [handle]: true } }));
    get().toast(`Blocked @${handle} — they can't see your profile or message you`, "err", "Undo", () =>
      set((s) => ({ blocked: drop(s.blocked, handle) })),
    );
  },

  // POST /reports
  report: (id, reason) => {
    set((s) => ({ reported: { ...s.reported, [id]: reason } }));
    get().toast("Report submitted — Trust & Safety reviews within 24h", "ok");
  },

  // POST /posts/:id/comments
  addComment: (id, text) =>
    set((s) => ({ comments: { ...s.comments, [id]: [...(s.comments[id] ?? []), text] } })),

  // POST /posts
  addPost: (p) => {
    const id = `u${uid()}`;
    const post: Post = {
      id,
      who: "You",
      h: "yourhandle",
      t: "now",
      v: false,
      text: p.text,
      type: p.media ? "image" : p.poll ? "poll" : "text",
      seed: `me${id}`,
      likes: 0,
      comments: 0,
      coins: 0,
      poll: p.poll,
      mine: true,
      vis: p.vis,
      price: p.price,
    };
    set((s) => ({ myPosts: [post, ...s.myPosts] }));
    get().toast(p.when ? `Scheduled for ${p.when}` : "Posted to your feed", "ok");
  },

  // DELETE /posts/:id
  delPost: (id) => {
    set((s) => ({ myPosts: s.myPosts.filter((x) => x.id !== id) }));
    get().toast("Post deleted");
  },

  // POST /notifications/read-all
  markNotifsRead: () => {
    set({ notifsRead: true });
    get().toast("All notifications marked as read", "ok");
  },

  // POST /dms/:thread/messages
  sendDm: (threadKey, text) =>
    set((s) => ({ dms: { ...s.dms, [threadKey]: [...(s.dms[threadKey] ?? []), text] } })),

  // POST /dms/:thread/unlock
  unlockDm: (threadKey) => {
    if (!get().spend(200, "Unlock paid message")) return false;
    set((s) => ({ dmUnlocked: { ...s.dmUnlocked, [threadKey]: true } }));
    get().toast("Message unlocked", "ok");
    return true;
  },

  // GET /feed
  feed: () => {
    const s = get();
    return [...s.myPosts, ...SEED_FEED].filter(
      (p) => !s.hidden[p.id] && !s.muted[p.h] && !s.blocked[p.h],
    );
  },
}));

export const walletHistory = (state: Pick<AppState, "walletTx">): TxItem[] => [
  ...state.walletTx,
  ...TX_SEED,
];
