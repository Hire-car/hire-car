"use client";

import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePhone } from "@/lib/auth/validation";
import { toFriendlyAuthError } from "@/lib/auth/errors";
import { useAuthRedirect } from "@/components/auth/useAuthRedirect";

interface PhoneAuthFormProps {
  /** The user-selected role that drives the post-login destination. */
  role: "customer" | "vendor";
  /** The resolved safe next route (e.g. from resolveNextRoute(role)). */
  nextRoute: string;
  /** Optional plan carried through to the resolved destination. */
  plan?: string | null;
  /** Surfaces auth errors to a parent (e.g. AuthPanel) for shared rendering. */
  onError?: (message: string | null) => void;
  /** Allows a parent to disable the form (e.g. while another method is busy). */
  disabled?: boolean;
}

type Step = "phone" | "code";

/**
 * Phone OTP sign-in form.
 *
 * A two-step flow:
 *  1. Phone entry — validates E.164 format, then requests a one-time code via
 *     `signInWithOtp({ phone })`. The form advances to step 2 and shows the
 *     "code sent" success state ONLY when the request succeeds; on failure it
 *     stays on step 1 and shows no success state.
 *  2. Code entry — verifies the code via `verifyOtp({ phone, token, type: 'sms' })`.
 *     On success the shared `useAuthRedirect` hook syncs the profile and
 *     navigates. On failure the code field stays editable so the user can retry.
 *
 * While a request is pending, only the control that initiated it is disabled.
 * All errors are rendered through `toFriendlyAuthError`, so the SMS-provider
 * "not configured" error surfaces as the friendly "phone sign-in temporarily
 * unavailable" message.
 */
export function PhoneAuthForm({
  role,
  nextRoute,
  plan,
  onError,
  disabled,
}: PhoneAuthFormProps) {
  const { redirectByRole } = useAuthRedirect();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  async function requestCode() {
    setFieldError(null);
    onError?.(null);

    const result = validatePhone(phone);
    if (!result.ok) {
      setFieldError(result.message);
      return;
    }

    setIsRequestingCode(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setIsRequestingCode(false);

    if (error) {
      // Stay on the phone step; do NOT show the success state.
      setCodeSent(false);
      onError?.(toFriendlyAuthError(error));
      return;
    }

    // Success: advance to code entry and show the code-sent success state.
    setCodeSent(true);
    setStep("code");
  }

  async function verifyCode() {
    setFieldError(null);
    onError?.(null);

    if (code.trim().length === 0) {
      setFieldError("Enter the code we sent to your phone.");
      return;
    }

    setIsVerifying(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: code.trim(),
      type: "sms",
    });

    if (error || !data.session) {
      // Keep the code field editable so the user can retry.
      setIsVerifying(false);
      onError?.(toFriendlyAuthError(error));
      return;
    }

    // Session established — sync the profile and navigate.
    await redirectByRole({ role, next: nextRoute, plan });
  }

  function editPhoneNumber() {
    setStep("phone");
    setCode("");
    setCodeSent(false);
    setFieldError(null);
    onError?.(null);
  }

  if (step === "phone") {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!disabled && !isRequestingCode) requestCode();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="phone-number">Phone number</Label>
          <Input
            id="phone-number"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+14155552671"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={disabled || isRequestingCode}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "phone-error" : "phone-hint"}
          />
          {fieldError ? (
            <p id="phone-error" className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : (
            <p id="phone-hint" className="text-sm text-muted-foreground">
              Use international format, including your country code.
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="cta"
          disabled={disabled || isRequestingCode}
          className="w-full"
        >
          {isRequestingCode ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Sending code...
            </>
          ) : (
            <>
              Send code
              <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled && !isVerifying) verifyCode();
      }}
    >
      {codeSent && (
        <div
          className="flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p>
            We sent a code to <span className="font-medium">{phone.trim()}</span>.
            Enter it below to continue.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="otp-code">Verification code</Label>
        <Input
          id="otp-code"
          name="otp"
          type="text"
          autoComplete="one-time-code"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          disabled={disabled || isVerifying}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby={fieldError ? "otp-error" : undefined}
        />
        {fieldError && (
          <p id="otp-error" className="text-sm text-destructive" role="alert">
            {fieldError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="cta"
        disabled={disabled || isVerifying}
        className="w-full"
      >
        {isVerifying ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          <>
            Verify and continue
            <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={editPhoneNumber}
        disabled={disabled || isVerifying}
        className="w-full"
      >
        <ArrowLeft className="h-4 w-4" />
        Use a different number
      </Button>
    </form>
  );
}

export default PhoneAuthForm;
