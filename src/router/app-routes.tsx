import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppLayout from "@/routes/_shell";
import LandingPage from "@/features/landing";
import Login from "@/routes/login";
import Signup from "@/routes/signup";
import { useIdlePrefetch } from "@/lib/prefetch";
import ProtectedRoute from "./protected-route";

/**
 * Public entry pages are loaded immediately.
 * Authenticated product pages remain lazy-loaded.
 */
const routeLoaders = {
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

const FeedPage = lazy(routeLoaders.feed);
const ExplorePage = lazy(routeLoaders.explore);
const ReelsPage = lazy(routeLoaders.reels);
const LivePage = lazy(routeLoaders.live);
const MessagesPage = lazy(routeLoaders.messages);
const NotificationsPage = lazy(routeLoaders.notifications);
const CollectionsPage = lazy(routeLoaders.collections);
const SubscriptionsPage = lazy(routeLoaders.subscriptions);
const WalletPage = lazy(routeLoaders.wallet);
const SettingsPage = lazy(routeLoaders.settings);
const CreatorProfilePage = lazy(routeLoaders.creator);

const StudioDashboard = lazy(routeLoaders.studio);
const EarningsPage = lazy(routeLoaders.studioEarnings);
const ContentStudioPage = lazy(routeLoaders.studioContent);
const VaultPage = lazy(routeLoaders.studioVault);
const TiersPage = lazy(routeLoaders.studioTiers);
const FansPage = lazy(routeLoaders.studioFans);
const MassMessagingPage = lazy(routeLoaders.studioMessages);
const GoLivePage = lazy(routeLoaders.studioLive);
const PromosPage = lazy(routeLoaders.studioPromos);
const AnalyticsPage = lazy(routeLoaders.studioAnalytics);
const PayoutsPage = lazy(routeLoaders.studioPayouts);
const VerifyPage = lazy(routeLoaders.studioVerify);

export default function AppRoutes() {
  const { pathname } = useLocation();

  useIdlePrefetch(routeLoaders, pathname !== "/");

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      {/* Routes rendered inside the application shell */}
      <Route element={<ProtectedRoute />}>
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
      </Route>

      {/* Unknown URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
