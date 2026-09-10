import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import CustomInput from "@/components/custom-input";
import { AuthThemeToggle } from "@/components/theme";
import { useCustomMutation } from "@/hooks/api/use-api";
import { Icon, Logo } from "@/lib/ui";
import { PASSWORD_LABELS } from "@/data";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type ResetPasswordVariables = { token: string; password: string };

/**
 * Where the link in the reset email points. Submitting posts the token
 * alongside the new password in one call — there is no separate "verify the
 * token first" step, so a token that is invalid or already used only ever
 * surfaces as an error on submit, not before the form renders.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");

  const { control, handleSubmit, watch } = useForm<ResetPasswordFormValues>({
    mode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  });

  const password = watch("password") ?? "";

  const passwordRules: Array<[string, boolean]> = [
    ["8+ characters", password.length >= 8],
    ["Uppercase", /[A-Z]/.test(password)],
    ["Lowercase", /[a-z]/.test(password)],
    ["Number", /[0-9]/.test(password)],
    ["Special character", /[^A-Za-z0-9]/.test(password)],
  ];

  const passwordScore = passwordRules.filter(([, isValid]) => isValid).length;

  const passwordScoreColor =
    passwordScore >= 4
      ? "var(--mint-ink)"
      : passwordScore >= 2
        ? "var(--amber-ink)"
        : "var(--muted)";

  const resetMutation = useCustomMutation<
    unknown,
    unknown,
    ResetPasswordVariables
  >({
    endpoint: "auth/reset-password",
    method: "post",
    successMessage: () => "Password updated",
  });

  const onSubmit = (values: ResetPasswordFormValues) => {
    if (!token) return;
    resetMutation.mutate({ token, password: values.password });
  };

  if (!token || resetMutation.isError) {
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
                style={{ background: "rgba(243,106,70,.14)", margin: "0 auto 18px" }}
              >
                <Icon n="x" c="var(--coral-ink)" s={22} />
              </div>

              <div className="display" style={{ fontSize: 24, marginBottom: 8 }}>
                Link invalid or expired
              </div>

              <div className="muted t14" style={{ marginBottom: 22, lineHeight: 1.55 }}>
                {token
                  ? "This reset link no longer works. Request a new one to set your password."
                  : "This reset link is missing its token."}
              </div>

              <button
                type="button"
                className="btn btn-blue btn-block"
                onClick={() => navigate("/forgot-password")}
              >
                Request a new link
              </button>
            </div>

            <AuthLegal verb="continuing" />
          </div>
        </div>

        <AuthHero
          title="Your audience. Your terms."
          sub="Subscriptions, pay-per-view drops, live gifting and coins — one account, one payout, same day."
        />
      </div>
    );
  }

  if (resetMutation.isSuccess) {
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
                style={{ background: "rgba(93,221,144,.14)", margin: "0 auto 18px" }}
              >
                <Icon n="check" c="var(--mint-ink)" s={22} />
              </div>

              <div className="display" style={{ fontSize: 26, marginBottom: 8 }}>
                Password updated
              </div>

              <div className="muted t14" style={{ marginBottom: 22, lineHeight: 1.55 }}>
                Your password has been changed. Sign in with your new one.
              </div>

              <button
                type="button"
                className="btn btn-blue btn-block"
                onClick={() => navigate("/login", { replace: true })}
              >
                Continue to log in
              </button>
            </div>

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

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          <div className="display" style={{ fontSize: 30, marginBottom: 6 }}>
            Set a new password
          </div>

          <div className="muted t14" style={{ marginBottom: 22 }}>
            Choose something you haven&apos;t used on this account before.
          </div>

          <form
            className="card"
            style={{ padding: 26 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <CustomInput<ResetPasswordFormValues>
              name="password"
              id="reset-password"
              control={control}
              type="password"
              label="New password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              rules={{
                required: "Password is required",
                validate: {
                  minimumLength: (value) =>
                    value.length >= 8 ||
                    "Password must contain at least 8 characters",

                  uppercase: (value) =>
                    /[A-Z]/.test(value) ||
                    "Password must contain an uppercase letter",

                  lowercase: (value) =>
                    /[a-z]/.test(value) ||
                    "Password must contain a lowercase letter",

                  number: (value) =>
                    /[0-9]/.test(value) || "Password must contain a number",

                  specialCharacter: (value) =>
                    /[^A-Za-z0-9]/.test(value) ||
                    "Password must contain a special character",
                },
              }}
            />

            <CustomInput<ResetPasswordFormValues>
              name="confirmPassword"
              id="reset-password-confirm"
              control={control}
              type="password"
              label="Confirm password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="auth-input-last"
              rules={{
                required: "Confirm your password",
                validate: (value) =>
                  value === password || "Passwords don't match",
              }}
            />

            <div className="card" style={{ padding: 14, margin: "14px 0" }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span className="up muted">Password strength</span>

                <span className="t12 b7" style={{ color: passwordScoreColor }}>
                  {PASSWORD_LABELS[passwordScore]}
                </span>
              </div>

              <div className="progress" style={{ marginBottom: 12 }}>
                <i style={{ width: `${passwordScore * 20}%` }} />
              </div>

              <div className="grid g2 gap8">
                {passwordRules.map(([label, isValid]) => (
                  <div
                    key={label}
                    className="row gap8 t13"
                    style={{ color: isValid ? "var(--mint-ink)" : "var(--muted2)" }}
                  >
                    <Icon n="check" s={14} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-blue btn-block"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? "Updating..." : "Update password"}
            </button>
          </form>

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title="Your audience. Your terms."
        sub="Subscriptions, pay-per-view drops, live gifting and coins — one account, one payout, same day."
      />
    </div>
  );
}
