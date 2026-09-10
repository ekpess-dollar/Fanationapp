import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import { AuthThemeToggle } from "@/components/theme";
import { useCustomMutation } from "@/hooks/api/use-api";
import { Icon, Logo } from "@/lib/ui";

type VerifyEmailVariables = { token: string };

/**
 * Where the link in the verification email points. `auth/verify-email`
 * matches the `auth/verify` check in the axios interceptor, so this request
 * carries no stale bearer token and never enters the refresh loop.
 */
export default function VerifyEmail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const verifyMutation = useCustomMutation<
    unknown,
    unknown,
    VerifyEmailVariables
  >({
    endpoint: "auth/verify-email",
    method: "post",
  });

  /*
   * Verification tokens are single-use server-side, so this guards against
   * submitting the same one twice — React StrictMode double-invokes mount
   * effects in dev, and that would otherwise burn the token on its own retry.
   */
  const submittedToken = useRef<string | null>(null);

  useEffect(() => {
    if (token && submittedToken.current !== token) {
      submittedToken.current = token;
      verifyMutation.mutate({ token });
    }
    // Re-run only if the token in the URL itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const status = !token
    ? "missing"
    : verifyMutation.isSuccess
      ? "success"
      : verifyMutation.isError
        ? "error"
        : "pending";

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          {status === "pending" && (
            <div className="card" style={{ padding: 26, textAlign: "center" }}>
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--muted)",
                  display: "inline-block",
                  animation: "blink 1.4s ease-in-out infinite",
                  marginBottom: 18,
                }}
              />
              <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                Verifying your email…
              </div>
              <div className="muted t14">This only takes a moment.</div>
            </div>
          )}

          {status === "success" && (
            <div className="card" style={{ padding: 26, textAlign: "center" }}>
              <div
                className="feature-ic"
                style={{ background: "rgba(93,221,144,.14)", margin: "0 auto 18px" }}
              >
                <Icon n="check" c="var(--mint-ink)" s={22} />
              </div>

              <div className="display" style={{ fontSize: 28, marginBottom: 8 }}>
                Welcome to Fanation
              </div>

              <div className="muted t14" style={{ marginBottom: 22, lineHeight: 1.55 }}>
                Your email is verified and your account is ready. Sign in to
                start exploring.
              </div>

              <button
                type="button"
                className="btn btn-blue btn-block"
                onClick={() => navigate("/login", { replace: true })}
              >
                Continue to log in
              </button>
            </div>
          )}

          {(status === "error" || status === "missing") && (
            <div className="card" style={{ padding: 26, textAlign: "center" }}>
              <div
                className="feature-ic"
                style={{ background: "rgba(243,106,70,.14)", margin: "0 auto 18px" }}
              >
                <Icon n="x" c="var(--coral-ink)" s={22} />
              </div>

              <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                Link invalid or expired
              </div>

              <div className="muted t14" style={{ marginBottom: 22, lineHeight: 1.55 }}>
                {status === "missing"
                  ? "This verification link is missing its token."
                  : "This verification link no longer works. Request a new one to finish setting up your account."}
              </div>

              <button
                type="button"
                className="btn btn-blue btn-block"
                onClick={() => navigate("/email-sent")}
              >
                Resend verification email
              </button>
            </div>
          )}

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title="You're in."
        sub="Set your price, keep the relationship, get paid the same day. Everything's ready whenever you are."
      />
    </div>
  );
}
