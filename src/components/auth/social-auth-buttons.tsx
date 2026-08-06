import { useGoogleSignIn } from "@/hooks/auth/use-google-sign-in";
import { getBrowserInfo, getPlatformFromUAParser } from "@/utils/helper";
import { SocialRow } from "@/components/auth";
import { showToast } from "@/utils/toastUtils";

export function SocialAuthButtons() {
  const { signInWithGoogle, isGoogleSigningIn } = useGoogleSignIn({
    ip: "",
    location: "",
    platform: getPlatformFromUAParser(),
    browser: getBrowserInfo(),
    endpoint: "auth/login/oauth2",
  });

  return (
    <SocialRow
      onGoogle={signInWithGoogle}
      isGoogleLoading={isGoogleSigningIn}
      onApple={() => showToast("Apple sign-in is not available yet.", "info")}
    />
  );
}
