"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/auth/validation";
import { toFriendlyAuthError } from "@/lib/auth/errors";
import { useAuthRedirect } from "@/components/auth/useAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailAuthFormProps {
  /** The user-selected role that drives the post-login destination. */
  role: "customer" | "vendor";
  /** The resolved safe next route (e.g. from resolveNextRoute(role)). */
  nextRoute: string;
  /** Optional plan carried through to the email-confirmation callback link. */
  plan?: string | null;
  /** Surfaces auth errors to a parent (e.g. AuthPanel) for shared rendering. */
  onError?: (message: string | null) => void;
  /** Allows a parent to disable the form (e.g. while another method is busy). */
  disabled?: boolean;
}

/** Per-field validation messages shown inline beneath each input. */
interface FieldErrors {
  email?: string;
  otp?: string;
}

export function EmailAuthForm({
  role,
  nextRoute,
  plan,
  onError,
  disabled,
}: EmailAuthFormProps) {
  const { redirectToDestination } = useAuthRedirect();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  function validateEmailInput(): boolean {
    const errors: FieldErrors = {};
    const emailResult = validateEmail(email);
    if (!emailResult.ok) errors.email = emailResult.message;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function validateOtpInput(): boolean {
    const errors: FieldErrors = {};
    if (!otp || otp.length !== 6) errors.otp = "Please enter the 6-digit code.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSendOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    if (!validateEmailInput()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      sessionStorage.setItem("auth_intended_role", role);

      const callbackParams = new URLSearchParams({ next: nextRoute, role });
      if (plan) callbackParams.set("plan", plan);

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
        },
      });

      if (error) {
        onError?.(toFriendlyAuthError(error));
        setIsSubmitting(false);
        return;
      }

      setOtpSent(true);
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    if (!validateOtpInput()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp.trim(),
        type: "email",
      });

      if (error || !data.session) {
        onError?.(toFriendlyAuthError(error));
        setIsSubmitting(false);
        return;
      }

      await redirectToDestination(nextRoute);
    } catch (err) {
      onError?.(toFriendlyAuthError(err));
      setIsSubmitting(false);
    }
  }

  if (otpSent) {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email-auth-otp">Enter the 6-digit code sent to {email}</Label>
          <Input
            id="email-auth-otp"
            type="text"
            name="otp"
            autoComplete="one-time-code"
            inputMode="numeric"
            placeholder="123456"
            value={otp}
            maxLength={6}
            onChange={(event) => setOtp(event.target.value.replace(/\\D/g, ""))}
            disabled={disabled || isSubmitting}
            aria-invalid={Boolean(fieldErrors.otp)}
            aria-describedby={fieldErrors.otp ? "email-auth-otp-error" : undefined}
          />
          {fieldErrors.otp && (
            <p id="email-auth-otp-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.otp}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="cta"
          disabled={disabled || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <KeyRound className="h-5 w-5" />
              Verify & Sign In
              <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
            </>
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              onError?.(null);
            }}
            disabled={disabled || isSubmitting}
            className="font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Use a different email
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email-auth-email">Email address</Label>
        <Input
          id="email-auth-email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={disabled || isSubmitting}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={
            fieldErrors.email ? "email-auth-email-error" : undefined
          }
        />
        {fieldErrors.email ? (
          <p
            id="email-auth-email-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            We'll send you a secure login code. No password needed!
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="cta"
        disabled={disabled || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Sending code...
          </>
        ) : (
          <>
            <Mail className="h-5 w-5" />
            Continue with Email
            <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}

export default EmailAuthForm;
