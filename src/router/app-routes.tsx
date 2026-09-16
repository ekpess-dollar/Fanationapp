import { lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import AppLayout from "@/routes/_shell";
import LandingPage from "@/features/landing";
import Login from "@/routes/login";
import Signup from "@/routes/signup";
import EmailSent from "@/routes/email-sent";
import VerifyEmail from "@/routes/verify-email";
import ForgotPassword from "@/routes/forgot-password";
import ResetPassword from "@/routes/reset-password";
import { useIdlePrefetch } from "@/lib/prefetch";
import ProtectedRoute from "./protected-route";

/**
 * Public entry pages are loaded immediately.
 * Authenticated product pages remain lazy-loaded.
 */
const routeLoaders = {
  feed: () => import("@/routes/feed"),
  profile: () => import("@/routes/profile"),
  profileEdit: () => import("@/routes/profile-edit"),
  explore: () => import("@/routes/explore"),
  reels: () => import("@/routes/reels"),
  live: () => import("@/routes/live"),
  liveStream: () => import("@/routes/live-stream"),
  messages: () => import("@/routes/messages"),
  notifications: () => import("@/routes/notifications"),
  collections: () => import("@/routes/collections"),
  subscriptions: () => import("@/routes/subscriptions"),
  wallet: () => import("@/routes/wallet"),
  settings: () => import("@/routes/settings"),
  settingsNotifications: () => import("@/routes/settings-notifications"),
  settingsDisplay: () => import("@/routes/settings-display"),
  settingsPrivacy: () => import("@/routes/settings-privacy"),
  settingsAccountPassword: () => import("@/routes/settings-account-password"),
  settingsAccountSessions: () => import("@/routes/settings-account-sessions"),
  settingsAccountTwoFactor: () => import("@/routes/settings-account-2fa"),
  settingsAccountLink: () => import("@/routes/settings-account-link"),
  settingsAccountDelete: () => import("@/routes/settings-account-delete"),
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
const ProfilePage = lazy(routeLoaders.profile);
const EditProfilePage = lazy(routeLoaders.profileEdit);
const ExplorePage = lazy(routeLoaders.explore);
const ReelsPage = lazy(routeLoaders.reels);
const LivePage = lazy(routeLoaders.live);
const LiveStreamPage = lazy(routeLoaders.liveStream);
const MessagesPage = lazy(routeLoaders.messages);
const NotificationsPage = lazy(routeLoaders.notifications);
const CollectionsPage = lazy(routeLoaders.collections);
const SubscriptionsPage = lazy(routeLoaders.subscriptions);
const WalletPage = lazy(routeLoaders.wallet);
const SettingsPage = lazy(routeLoaders.settings);
const SettingsNotificationsPage = lazy(routeLoaders.settingsNotifications);
const SettingsDisplayPage = lazy(routeLoaders.settingsDisplay);
const SettingsPrivacyPage = lazy(routeLoaders.settingsPrivacy);
const SettingsPasswordPage = lazy(routeLoaders.settingsAccountPassword);
const SettingsSessionsPage = lazy(routeLoaders.settingsAccountSessions);
const SettingsTwoFactorPage = lazy(routeLoaders.settingsAccountTwoFactor);
const SettingsLinkAccountPage = lazy(routeLoaders.settingsAccountLink);
const SettingsDeleteAccountPage = lazy(routeLoaders.settingsAccountDelete);
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

      <Route path="/email-sent" element={<EmailSent />} />

      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Routes rendered inside the application shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Fan surface */}
          <Route path="/feed" element={<FeedPage />} />

          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/profile/edit" element={<EditProfilePage />} />

          <Route path="/explore" element={<ExplorePage />} />

          <Route path="/reels" element={<ReelsPage />} />

          <Route path="/live" element={<LivePage />} />

          <Route path="/live/:handle" element={<LiveStreamPage />} />

          <Route path="/messages" element={<MessagesPage />} />

          <Route path="/notifications" element={<NotificationsPage />} />

          <Route path="/collections" element={<CollectionsPage />} />

          <Route path="/subscriptions" element={<SubscriptionsPage />} />

          <Route path="/wallet" element={<WalletPage />} />

          <Route path="/settings" element={<SettingsPage />} />

          <Route path="/settings/notifications" element={<SettingsNotificationsPage />} />

          <Route path="/settings/display" element={<SettingsDisplayPage />} />

          <Route path="/settings/privacy" element={<SettingsPrivacyPage />} />

          <Route path="/settings/account/change-password" element={<SettingsPasswordPage />} />

          <Route path="/settings/account/login-sessions" element={<SettingsSessionsPage />} />

          <Route path="/settings/account/two-factor" element={<SettingsTwoFactorPage />} />

          <Route path="/settings/account/link/:provider" element={<SettingsLinkAccountPage />} />

          <Route path="/settings/account/delete-account" element={<SettingsDeleteAccountPage />} />

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
