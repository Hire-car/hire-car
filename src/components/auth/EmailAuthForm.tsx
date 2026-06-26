"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Mail, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
} from "@/lib/auth/validation";
import { toFriendlyAuthError } from "@/lib/auth/errors";
import { useAuthRedirect } from "@/components/auth/useAuthRedirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmailAuthMode = "login" | "signup";

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
  password?: string;
  confirm?: string;
}

/**
 * Email + password authentication form with a login/signup toggle.
 *
 * Validation (email, password policy, confirmation) runs client-side *before*
 * any Supabase call. Signup uses `supabase.auth.signUp`; login uses
 * `supabase.auth.signInWithPassword`, both via the browser client factory.
 *
 * When signup succeeds but Supabase email confirmation is enabled (no active
 * session is returned), the form shows a "check your email" message instead of
 * redirecting. When an active session exists, it calls `useAuthRedirect` to
 * sync the profile and navigate to the resolved destination.
 *
 * Only this form's own submit button is disabled while a request is pending so
 * the other authentication methods remain selectable. Supabase failures are
 * mapped through `toFriendlyAuthError` — raw payloads are never shown.
 */
export function EmailAuthForm({
  role,
  nextRoute,
  plan,
  onError,
  disabled,
}: EmailAuthFormProps) {
  const { redirectToDestination } = useAuthRedirect();

  const [mode, setMode] = useState<EmailAuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const isSignup = mode === "signup";

  function switchMode(next: EmailAuthMode) {
    if (next === mode) return;
    setMode(next);
    setFieldErrors({});
    setConfirm("");
    setConfirmationSent(false);
    onError?.(null);
  }

  /** Runs the relevant validators; returns true when input is valid. */
  function validate(): boolean {
    const errors: FieldErrors = {};

    const emailResult = validateEmail(email);
    if (!emailResult.ok) errors.email = emailResult.message;

    const passwordResult = validatePassword(password);
    if (!passwordResult.ok) errors.password = passwordResult.message;

    if (isSignup) {
      const confirmResult = validatePasswordConfirmation(password, confirm);
      if (!confirmResult.ok) errors.confirm = confirmResult.message;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || isSubmitting) return;

    onError?.(null);
    setConfirmationSent(false);

    if (!validate()) return;

    setIsSubmitting(true);
    const supabase = createClient();

    try {
      sessionStorage.setItem("auth_intended_role", role);

      if (isSignup) {
        const callbackParams = new URLSearchParams({ next: nextRoute, role });
        if (plan) callbackParams.set("plan", plan);

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?${callbackParams.toString()}`,
          },
        });

        if (error) {
          onError?.(toFriendlyAuthError(error));
          setIsSubmitting(false);
          return;
        }

        // Email confirmation enabled: signup succeeded without a session.
        if (!data.session) {
          setConfirmationSent(true);
          setIsSubmitting(false);
          return;
        }

        // Active session returned: sync profile and navigate.
        await redirectToDestination(nextRoute);
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
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

  if (confirmationSent) {
    return (
      <div
        className="flex flex-col items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-6 text-center"
        role="status"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <p className="font-semibold text-foreground">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email.trim()}</span>.
            Confirm your address to finish signing up.
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setConfirmationSent(false);
            switchMode("login");
          }}
          className="mt-1"
        >
          Back to sign in
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
        {fieldErrors.email && (
          <p
            id="email-auth-email-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email-auth-password">Password</Label>
        <Input
          id="email-auth-password"
          type="password"
          name="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={disabled || isSubmitting}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? "email-auth-password-error" : undefined
          }
        />
        {fieldErrors.password && (
          <p
            id="email-auth-password-error"
            className="text-sm text-destructive"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        )}
      </div>

      {isSignup && (
        <div className="space-y-2">
          <Label htmlFor="email-auth-confirm">Confirm password</Label>
          <Input
            id="email-auth-confirm"
            type="password"
            name="confirm-password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={disabled || isSubmitting}
            aria-invalid={Boolean(fieldErrors.confirm)}
            aria-describedby={
              fieldErrors.confirm ? "email-auth-confirm-error" : undefined
            }
          />
          {fieldErrors.confirm && (
            <p
              id="email-auth-confirm-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {fieldErrors.confirm}
            </p>
          )}
        </div>
      )}

      <Button
        type="submit"
        size="cta"
        disabled={disabled || isSubmitting}
        className="w-full"
        aria-label={isSignup ? "Create account with email" : "Sign in with email"}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isSignup ? "Creating account..." : "Signing in..."}
          </>
        ) : (
          <>
            <Mail className="h-5 w-5" />
            {isSignup ? "Create account" : "Sign in"}
            <ArrowRight className="h-5 w-5 transition-transform group-hover/button:translate-x-0.5" />
          </>
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isSignup ? "Already have an account?" : "New to Hire Car?"}{" "}
        <button
          type="button"
          onClick={() => switchMode(isSignup ? "login" : "signup")}
          disabled={disabled || isSubmitting}
          className="font-semibold text-primary underline-offset-4 hover:underline disabled:opacity-50"
        >
          {isSignup ? "Sign in" : "Create an account"}
        </button>
      </p>
    </form>
  );
}

export default EmailAuthForm;
