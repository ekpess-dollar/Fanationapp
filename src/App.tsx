import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ThemeChrome } from "@/components/theme";
import { useIdlePrefetch } from "@/lib/prefetch";
import AppLayout from "@/routes/_shell";
import Login from "@/routes/login";
import Signup from "@/routes/signup";

/**
 * Every route in one file — deliberately. The previous build inferred routing
 * from folder names, which meant answering "what URLs exist?" required walking
 * the tree. Here it is a list you can read top to bottom.
 *
 * `/login` and `/signup` sit outside `AppLayout` because the shell renders the
 * sidebar and topbar and redirects anyone unauthenticated straight back to
 * `/login` — nesting them would loop.
 *
 * They are also the only two screens imported eagerly, and for the same reason:
 * a cold hit on any URL in this app lands on `/login`, so it is the first paint
 * every single time. Splitting it out would buy nothing and cost a round trip,
 * because the browser would have to parse the entry chunk before it could even
 * discover the login chunk existed. The shell is eager on the same logic —
 * everything behind the door needs it.
 *
 * The other twenty-two are split, then fetched back during idle time by
 * `useIdlePrefetch`, so a cold load carries the screen you are actually looking
 * at and the rest arrive before you can click anything. See `lib/prefetch.ts`.
 */
const load = {
  feed: () => import("@/routes/feed"),
  explore: () => import("@/routes/explore"),
  reels: () => import("@/routes/reels"),
  live: () => import("@/routes/live"),
  messages: () => import("@/routes/messages"),
  notifications: () => import("@/routes/notifications"),
  collections: () => import("@/routes/collections"),
  subscriptions: () => import("@/routes/subscriptions"),
  wallet: () => import("@/routes/wallet"),
  settings: () => import("@/routes/settings"),
  creator: () => import("@/routes/creator"),
  studio: () => import("@/routes/studio"),
  studioEarnings: () => import("@/routes/studio/earnings"),
  studioContent: () => import("@/routes/studio/content"),
  studioVault: () => import("@/routes/studio/vault"),
  studioTiers: () => import("@/routes/studio/tiers"),
  studioFans: () => import("@/routes/studio/fans"),
  studioMessages: () => import("@/routes/studio/messages"),
  studioLive: () => import("@/routes/studio/live"),
  studioPromos: () => import("@/routes/studio/promos"),
  studioAnalytics: () => import("@/routes/studio/analytics"),
  studioPayouts: () => import("@/routes/studio/payouts"),
  studioVerify: () => import("@/routes/studio/verify"),
};

const FeedPage = lazy(load.feed);
const ExplorePage = lazy(load.explore);
const ReelsPage = lazy(load.reels);
const LivePage = lazy(load.live);
const MessagesPage = lazy(load.messages);
const NotificationsPage = lazy(load.notifications);
const CollectionsPage = lazy(load.collections);
const SubscriptionsPage = lazy(load.subscriptions);
const WalletPage = lazy(load.wallet);
const SettingsPage = lazy(load.settings);
const CreatorProfilePage = lazy(load.creator);
const StudioDashboard = lazy(load.studio);
const EarningsPage = lazy(load.studioEarnings);
const ContentStudioPage = lazy(load.studioContent);
const VaultPage = lazy(load.studioVault);
const TiersPage = lazy(load.studioTiers);
const FansPage = lazy(load.studioFans);
const MassMessagingPage = lazy(load.studioMessages);
const GoLivePage = lazy(load.studioLive);
const PromosPage = lazy(load.studioPromos);
const AnalyticsPage = lazy(load.studioAnalytics);
const PayoutsPage = lazy(load.studioPayouts);
const VerifyPage = lazy(load.studioVerify);

export default function App() {
  useIdlePrefetch(load);

  return (
    <>
      <ThemeChrome />
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<AppLayout />}>
          {/* Fan surface */}
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/reels" element={<ReelsPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/creator/:handle" element={<CreatorProfilePage />} />

          {/* Creator studio */}
          <Route path="/studio" element={<StudioDashboard />} />
          <Route path="/studio/earnings" element={<EarningsPage />} />
          <Route path="/studio/content" element={<ContentStudioPage />} />
          <Route path="/studio/vault" element={<VaultPage />} />
          <Route path="/studio/tiers" element={<TiersPage />} />
          <Route path="/studio/fans" element={<FansPage />} />
          <Route path="/studio/messages" element={<MassMessagingPage />} />
          <Route path="/studio/live" element={<GoLivePage />} />
          <Route path="/studio/promos" element={<PromosPage />} />
          <Route path="/studio/analytics" element={<AnalyticsPage />} />
          <Route path="/studio/payouts" element={<PayoutsPage />} />
          <Route path="/studio/verify" element={<VerifyPage />} />
        </Route>

        {/* Unknown URL — send fans home rather than showing a dead end. */}
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </>
  );
}
