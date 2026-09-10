import { SocialRow } from "@/components/auth";
import { DeviceMetadata } from "@/hooks/auth/use-device-metadata";
import { useGoogleSignIn } from "@/hooks/auth/use-google-sign-in";
import { showToast } from "@/utils/toastUtils";

interface SocialAuthButtonsProps extends DeviceMetadata {
  endpoint?: string;
}

export function SocialAuthButtons({
  ip,
  location,
  platform,
  browser,
  endpoint = "auth/login/oauth2",
}: SocialAuthButtonsProps) {
  const { signInWithGoogle, isGoogleSigningIn } = useGoogleSignIn({
    ip,
    location,
    platform,
    browser,
    endpoint,
  });

  return (
    <SocialRow
      onGoogle={signInWithGoogle}
      isGoogleLoading={isGoogleSigningIn}
      onApple={() => showToast("Apple sign-in is not available yet.", "info")}
    />
  );
}
