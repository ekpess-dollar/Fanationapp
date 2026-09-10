import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import CustomInput from "@/components/custom-input";
import { AuthThemeToggle } from "@/components/theme";
import { useCustomMutation } from "@/hooks/api/use-api";
import { useAppDispatch } from "@/services/hook";
import { Logo } from "@/lib/ui";
import {
  updateEmailType,
  updateUserEmail,
} from "@/services/features/auth/authSlice";

type ForgotPasswordFormValues = { email: string };

/**
 * Requests the reset link. The confirmation screen lives at `/email-sent`,
 * shared with the signup-verification flow — `emailType: "Reset"` is what
 * switches its copy and its resend endpoint over.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const forgotPasswordMutation = useCustomMutation<
    unknown,
    unknown,
    ForgotPasswordFormValues
  >({
    endpoint: "auth/forgot-password",
    method: "post",
  });

  const onSubmit = (values: ForgotPasswordFormValues) => {
    forgotPasswordMutation.mutate(values, {
      onSuccess: () => {
        dispatch(updateUserEmail(values.email));
        dispatch(updateEmailType("Reset"));
        navigate("/email-sent");
      },
    });
  };

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          <div
            className="display"
            style={{
              fontSize: 30,
              marginBottom: 6,
            }}
          >
            Forgot your password?
          </div>

          <div
            className="muted t14"
            style={{
              marginBottom: 22,
            }}
          >
            Enter the email on your account and we&apos;ll send you a link to
            set a new one.
          </div>

          <form
            className="card"
            style={{ padding: 26 }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <CustomInput<ForgotPasswordFormValues>
              name="email"
              id="forgot-password-email"
              control={control}
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              className="auth-input-last"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
            />

            <button
              type="submit"
              className="btn btn-blue btn-block"
              style={{ marginTop: 8 }}
              disabled={forgotPasswordMutation.isPending}
            >
              {forgotPasswordMutation.isPending
                ? "Sending link..."
                : "Send reset link"}
            </button>

            <div
              className="row center muted t14"
              style={{
                marginTop: 16,
                gap: 5,
              }}
            >
              <span>Remembered it?</span>

              <button
                type="button"
                className="blue b6"
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </div>
          </form>

          <AuthLegal verb="continuing" />
        </div>
      </div>

      <AuthHero
        title="Your audience. Your terms."
        sub="Subscriptions, pay-per-view drops, live gifting and coins — one account, one payout, same day. Creators on Fanation keep the relationship and the revenue."
      />
    </div>
  );
}
