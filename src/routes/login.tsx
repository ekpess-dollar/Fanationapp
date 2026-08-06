import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import CustomInput from "@/components/custom-input";
import { AuthThemeToggle } from "@/components/theme";
import { useAppStore } from "@/lib/core";
import { Logo } from "@/lib/ui";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();

  const setAuthed = useAppStore((state) => state.setAuthed);
  const toast = useAppStore((state) => state.toast);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    mode: "onBlur",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const completeLogin = () => {
    setAuthed(true);
    navigate("/feed");
  };

  const onSubmit = (_values: LoginFormValues) => {
    completeLogin();
  };

  const handleForgotPassword = () => {
    toast("Password reset link sent — check your inbox");
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
            Welcome back
          </div>

          <div
            className="muted t14"
            style={{
              marginBottom: 22,
            }}
          >
            Sign in to pick up where you left off.
          </div>

          <form
            className="card"
            style={{
              padding: 26,
            }}
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <SocialAuthButtons />

            <div className="authdiv">or with email</div>

            <CustomInput<LoginFormValues>
              name="email"
              id="login-email"
              control={control}
              type="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              rules={{
                required: "Email is required",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Enter a valid email address",
                },
              }}
            />

            <div
              className="row between"
              style={{
                marginBottom: 7,
              }}
            >
              <label
                className="label"
                htmlFor="login-password"
                style={{
                  marginBottom: 0,
                }}
              >
                Password
              </label>

              <button
                type="button"
                className="blue t12 b6"
                style={{
                  cursor: "pointer",
                }}
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <CustomInput<LoginFormValues>
              name="password"
              id="login-password"
              control={control}
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="auth-input-last"
              rules={{
                required: "Password is required",
              }}
            />

            <label
              className="row gap8 muted t13"
              style={{
                margin: "14px 0 16px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                defaultChecked
                style={{
                  width: 15,
                  height: 15,
                  accentColor: "var(--blue)",
                  cursor: "pointer",
                }}
              />

              <span>Keep me signed in for 30 days</span>
            </label>

            <button
              type="submit"
              className="btn btn-blue btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>

            <div
              className="row center muted t14"
              style={{
                marginTop: 16,
                gap: 5,
              }}
            >
              <span>Don&apos;t have an account?</span>

              <button
                type="button"
                className="blue b6"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => navigate("/signup")}
              >
                Create one
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
