/**
 * The second element of each tuple is an i18n key (see lib/core/i18n.ts),
 * not literal text — `_shell.tsx` renders it through `t()`. Keeping the
 * label out of the array itself is what let language become a Settings
 * option instead of a hardcoded string baked into the nav.
 */
export const FAN_NAV: Array<[string, string, string]> = [
  ["/feed", "nav_home", "home"],
  ["/explore", "nav_explore", "discover"],
  ["/reels", "nav_reels", "play"],
  ["/live", "nav_live", "live"],
  ["/messages", "nav_messages", "msg"],
  ["/notifications", "nav_notifications", "bell"],
  ["/collections", "nav_collections", "bookmark"],
  ["/subscriptions", "nav_subscriptions", "star"],
  ["/wallet", "nav_wallet", "wallet"],
  ["/settings", "nav_settings", "gear"],
  ["/profile", "nav_profile", "user"],
];

export const STUDIO_NAV: Array<[string, string, string]> = [
  ["/studio", "studio_dashboard", "grid"],
  ["/studio/earnings", "studio_earnings", "dollar"],
  ["/studio/content", "studio_content", "upload"],
  ["/studio/vault", "studio_vault", "grid"],
  ["/studio/tiers", "studio_tiers", "star"],
  ["/studio/fans", "studio_fans", "users"],
  ["/studio/messages", "studio_messages", "msg"],
  ["/studio/live", "studio_live", "live"],
  ["/studio/promos", "studio_promos", "gift"],
  ["/studio/analytics", "studio_analytics", "chart"],
  ["/studio/payouts", "studio_payouts", "wallet"],
  ["/studio/verify", "studio_verify", "shield"],
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
  ["/feed", "tab_home", "home"],
  ["/explore", "tab_explore", "discover"],
  ["/live", "tab_live", "live"],
  ["/messages", "tab_inbox", "msg"],
];

export const STUDIO_TABS: Array<[string, string, string]> = [
  ["/studio", "studio_tab_home", "grid"],
  ["/studio/content", "studio_tab_content", "upload"],
  ["/studio/earnings", "studio_tab_earnings", "dollar"],
  ["/studio/fans", "studio_tab_fans", "users"],
];
