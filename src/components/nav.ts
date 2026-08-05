export const FAN_NAV: Array<[string, string, string]> = [
  ["/feed", "Home", "home"],
  ["/explore", "Explore", "discover"],
  ["/reels", "Reels", "play"],
  ["/live", "Live", "live"],
  ["/messages", "Messages", "msg"],
  ["/notifications", "Notifications", "bell"],
  ["/collections", "Collections", "bookmark"],
  ["/subscriptions", "Subscriptions", "star"],
  ["/wallet", "Wallet", "wallet"],
  ["/settings", "Settings", "gear"],
];

export const STUDIO_NAV: Array<[string, string, string]> = [
  ["/studio", "Dashboard", "grid"],
  ["/studio/earnings", "Earnings", "dollar"],
  ["/studio/content", "Content studio", "upload"],
  ["/studio/vault", "Vault", "grid"],
  ["/studio/tiers", "Subscriptions & tiers", "star"],
  ["/studio/fans", "Fans", "users"],
  ["/studio/messages", "Mass messaging", "msg"],
  ["/studio/live", "Go Live", "live"],
  ["/studio/promos", "Promotions", "gift"],
  ["/studio/analytics", "Analytics", "chart"],
  ["/studio/payouts", "Payouts", "wallet"],
  ["/studio/verify", "Verification", "shield"],
];

/**
 * The four destinations that earn a bottom tab on a phone. Everything else in the
 * lists above is one tap further, behind More.
 *
 * Not a slice of the lists above, for two reasons. The sidebar is ordered by
 * category and a tab bar is ordered by how often a thumb reaches for it — Reels
 * outranks Messages in the sidebar and does not here. And the labels have to be
 * one short word at 10.5px: "Content studio" and "Mass messaging" do not fit under
 * a 20px icon, so the tab carries its own.
 */
export const FAN_TABS: Array<[string, string, string]> = [
  ["/feed", "Home", "home"],
  ["/explore", "Explore", "discover"],
  ["/live", "Live", "live"],
  ["/messages", "Inbox", "msg"],
];

export const STUDIO_TABS: Array<[string, string, string]> = [
  ["/studio", "Home", "grid"],
  ["/studio/content", "Content", "upload"],
  ["/studio/earnings", "Earnings", "dollar"],
  ["/studio/fans", "Fans", "users"],
];
