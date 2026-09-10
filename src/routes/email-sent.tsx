import { useNavigate } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import { AuthThemeToggle } from "@/components/theme";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useAppSelector } from "@/services/hook";
import { Icon, Logo } from "@/lib/ui";

type ResendVariables = {
  params: { email: string };
  body: Record<string, never>;
};

/**
 * Shared "check your inbox" landing spot for both flows that end with a
 * link mailed to the user — signup (verify) and forgot-password (reset).
 * `emailType`, set by whichever flow navigated here, picks the copy and
 * which endpoint a resend hits; the link itself always opens `/verify-email`
 * or `/reset-password`, whichever the backend mailed.
 */
export default function EmailSent() {
  const navigate = useNavigate();
  const email = useAppSelector((s) => s.auth.userEmail);
  const emailType = useAppSelector((s) => s.auth.emailType);
  const isReset = emailType === "Reset";

  const resendMutation = useCustomMutation<unknown, unknown, ResendVariables>({
    endpoint: isReset ? "auth/forgot-password" : "auth/resend-verification-link",
    method: "post",
    useQueryParams: true,
    successMessage: () => (isReset ? "Reset link sent" : "Verification email sent"),
  });

  const resend = () => {
    if (!email) return;
    resendMutation.mutate({ params: { email }, body: {} });
  };

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          <div className="card" style={{ padding: 26, textAlign: "center" }}>
            <div
              className="feature-ic"
              style={{ background: "rgba(37,153,246,.16)", margin: "0 auto 18px" }}
            >
              <Icon n="send" c="var(--blueL-ink)" s={20} />
            </div>

            <div className="display" style={{ fontSize: 26, marginBottom: 8 }}>
              {isReset ? "Reset your password" : "Verify your email"}
            </div>

            <div className="muted t14" style={{ marginBottom: 22, lineHeight: 1.55 }}>
              {email ? (
                <>
                  We&apos;ve sent a {isReset ? "password reset" : "verification"}{" "}
                  link to <b style={{ color: "var(--gray-12)" }}>{email}</b>.
                  {isReset
                    ? " Click it to choose a new password."
                    : " Click it to activate your account."}
                </>
              ) : isReset ? (
                "We've sent a password reset link to your inbox. Click it to choose a new password."
              ) : (
                "We've sent a verification link to your inbox. Click it to activate your account."
              )}
            </div>

            {email && (
              <button
                type="button"
                className="btn btn-ghost btn-block"
                disabled={resendMutation.isPending}
                onClick={resend}
                style={{ marginBottom: 14 }}
              >
                {resendMutation.isPending ? "Sending..." : "Resend email"}
              </button>
            )}

            <button
              type="button"
              className="blue b6 t14"
              onClick={() => navigate("/login")}
            >
              Back to log in
            </button>
          </div>

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title={isReset ? "One link away." : "Almost there."}
        sub={
          isReset
            ? "Pick a new password and you're straight back in — same account, same audience, same payouts."
            : "One click and your account is live. Set your price, share your first drop, and start turning followers into income."
        }
      />
    </div>
  );
}
