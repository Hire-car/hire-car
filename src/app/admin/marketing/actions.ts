"use server";

import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMarketingEmail } from "@/lib/email/resend";

export type MarketingEmailState = {
  status: "idle" | "success" | "error";
  message: string;
};

type Recipient = {
  email: string;
  name: string;
};

const ADMIN_EMAIL = process.env.CONTACT_EMAIL_TO ?? "admin.hirecar@gmail.com";
const MAX_RECIPIENTS = 500;

function parseManualRecipients(raw: string): Recipient[] {
  return raw
    .split(/[\n,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .map((email) => ({ email, name: "there" }));
}

function dedupeRecipients(recipients: Recipient[]) {
  const seen = new Set<string>();
  return recipients.filter((recipient) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient.email)) return false;
    if (seen.has(recipient.email)) return false;
    seen.add(recipient.email);
    return true;
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textToHtml(value: string) {
  return escapeHtml(value)
    .split(/\n{2,}/)
    .map((paragraph) => `<p style="margin:0 0 16px;">${paragraph.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

async function getAudienceRecipients(audience: string, manualRecipients: string) {
  const supabase = createAdminClient();

  if (audience === "manual") {
    return parseManualRecipients(manualRecipients);
  }

  if (audience === "admin") {
    return [{ email: ADMIN_EMAIL.toLowerCase(), name: "Admin" }];
  }

  if (audience === "vendors") {
    const { data, error } = await supabase
      .from("organizations")
      .select("name, billing_email")
      .not("billing_email", "is", null)
      .order("created_at", { ascending: false })
      .limit(MAX_RECIPIENTS);

    if (error) throw new Error(`Could not load vendor recipients: ${error.message}`);

    return (data ?? []).map((org) => ({
      email: String(org.billing_email).trim().toLowerCase(),
      name: org.name || "there",
    }));
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, email")
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(MAX_RECIPIENTS);

  if (error) throw new Error(`Could not load account recipients: ${error.message}`);

  return (data ?? []).map((profile) => ({
    email: String(profile.email).trim().toLowerCase(),
    name: profile.full_name || "there",
  }));
}

export async function sendMarketingCampaign(
  _previousState: MarketingEmailState,
  formData: FormData,
): Promise<MarketingEmailState> {
  await requireAdmin();

  const audience = String(formData.get("audience") ?? "admin");
  const manualRecipients = String(formData.get("recipients") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const heading = String(formData.get("heading") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const ctaLabel = String(formData.get("ctaLabel") ?? "").trim();
  const ctaUrl = String(formData.get("ctaUrl") ?? "").trim();

  if (subject.length < 4 || subject.length > 160) {
    return { status: "error", message: "Subject must be between 4 and 160 characters." };
  }

  if (heading.length < 4 || heading.length > 120) {
    return { status: "error", message: "Heading must be between 4 and 120 characters." };
  }

  if (body.length < 10 || body.length > 8000) {
    return { status: "error", message: "Body must be between 10 and 8000 characters." };
  }

  if ((ctaLabel && !ctaUrl) || (!ctaLabel && ctaUrl)) {
    return { status: "error", message: "CTA label and URL must be provided together." };
  }

  if (ctaUrl && !/^https?:\/\/.+/i.test(ctaUrl)) {
    return { status: "error", message: "CTA URL must start with http:// or https://." };
  }

  try {
    const recipients = dedupeRecipients(await getAudienceRecipients(audience, manualRecipients));
    if (recipients.length === 0) {
      return { status: "error", message: "No valid recipients found for this campaign." };
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const bodyHtml = textToHtml(body);

    for (const recipient of recipients) {
      try {
        const result = await sendMarketingEmail({
          to: recipient.email,
          recipientName: recipient.name,
          subject,
          heading,
          bodyHtml,
          ctaLabel: ctaLabel || undefined,
          ctaUrl: ctaUrl || undefined,
        });

        if (result.skipped) skipped += 1;
        else sent += 1;
      } catch (error) {
        failed += 1;
        console.error("[Marketing] Failed to send campaign email", {
          recipient: recipient.email,
          error,
        });
      }
    }

    if (sent === 0 && skipped > 0) {
      return {
        status: "error",
        message: "Campaign was not sent because RESEND_API_KEY is not configured.",
      };
    }

    return {
      status: failed > 0 ? "error" : "success",
      message: `Campaign complete. Sent ${sent}, failed ${failed}, skipped ${skipped}.`,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not send campaign.",
    };
  }
}
