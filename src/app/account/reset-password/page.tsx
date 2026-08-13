"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validatePassword } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hashParsed, setHashParsed] = useState(false);

  useEffect(() => {
    // Supabase passes errors in the URL hash fragment (e.g. #error=access_denied&error_description=...)
    const hash = window.location.hash;
    if (hash && hash.includes("error=")) {
      const params = new URLSearchParams(hash.substring(1));
      const description = params.get("error_description");
      if (description) {
        setTimeout(() => setErrorMsg(description.replace(/\+/g, " ")), 0);
      } else {
        setTimeout(() => setErrorMsg("The reset link is invalid or has expired."), 0);
      }
    }
    setTimeout(() => setHashParsed(true), 0);
  }, []);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    const validation = validatePassword(password);
    if (!validation.ok) {
      setErrorMsg(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push("/auth/sign-in");
      }, 3000);
    }
  }

  if (!hashParsed) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {success ? "Password Updated" : "Reset Password"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {success
              ? "Your password has been successfully reset. Redirecting you to sign in..."
              : "Enter your new password below."}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
            <Button
              className="w-full mt-4"
              onClick={() => router.push("/auth/sign-in")}
            >
              Go to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || !!errorMsg}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting || !!errorMsg}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !!errorMsg}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>

            {errorMsg && errorMsg.includes("expired") && (
              <Button
                variant="outline"
                className="w-full mt-4"
                type="button"
                onClick={() => router.push("/auth/sign-in")}
              >
                Request a new link
              </Button>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
