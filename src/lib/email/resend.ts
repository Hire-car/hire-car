import { Resend } from "resend";
import { getAppUrl, optionalEnv } from "@/lib/config";

const apiKey = optionalEnv("RESEND_API_KEY");
export const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? "Hire Car Marketplace <noreply@hirecarmarketplace.com.au>";
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? process.env.CONTACT_EMAIL_TO ?? "admin.hirecar@gmail.com";

export async function sendLeadAlert(input: {
  to: string;
  vehicleTitle: string;
  customerName: string;
}) {
  if (!resend) return { skipped: true };
  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New rental lead for ${input.vehicleTitle}`,
    text: `${input.customerName} submitted a rental enquiry. Open the vendor dashboard to review and respond.`,
  });
  return { skipped: false };
}

export async function sendCustomerEnquiryConfirmation(input: {
  to: string;
  customerName: string;
  vehicleTitle: string;
  leadId: string;
}) {
  if (!resend) return { skipped: true };
  const chatUrl = `${getAppUrl()}/messages/${input.leadId}`;
  const signInUrl = `${getAppUrl()}/auth/sign-in?redirectedFrom=${encodeURIComponent(chatUrl)}`;
  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `Your enquiry for ${input.vehicleTitle}`,
    text: [`Hi ${input.customerName},`, "", `We've sent your rental enquiry for ${input.vehicleTitle} to the vendor.`, "", `Sign in to chat with the vendor:`, signInUrl, "", `Or open your conversation:`, chatUrl].join("\n"),
  });
  return { skipped: false };
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  role?: "vendor" | "customer";
}) {
  if (!resend) return { skipped: true };
  const isVendor = input.role === "vendor";
  const dashboardUrl = isVendor ? `${getAppUrl()}/vendor/dashboard` : `${getAppUrl()}/search`;
  const greeting = isVendor
    ? "Your vendor account is ready. Start adding your fleet and reach thousands of customers across Australia."
    : "You're all set to find your perfect rental car across Australia. Browse thousands of vehicles from verified local vendors.";
  const ctaLabel = isVendor ? "Go to Vendor Dashboard" : "Browse Cars";

  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Welcome to Hire Car Marketplace! 🚗",
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="background:linear-gradient(135deg,#ea580c,#f59e0b);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:28px;margin:0;font-weight:900;">Welcome to HireCar! 🎉</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.name || "there"},</p>
      <p style="color:#334155;font-size:15px;line-height:1.6;">${greeting}</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${dashboardUrl}" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">${ctaLabel} →</a>
      </div>
      <p style="color:#94a3b8;font-size:13px;text-align:center;">Hire Car Marketplace · Australia</p>
    </div>`,
  });
  return { skipped: false };
}

// ─── Marketing Email ───────────────────────────────────────────────────────────

export async function sendMarketingEmail(input: {
  to: string;
  recipientName: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  if (!resend) return { skipped: true };
  const cta = input.ctaLabel && input.ctaUrl
    ? `<div style="text-align:center;margin:28px 0;"><a href="${input.ctaUrl}" style="background:linear-gradient(135deg,#ea580c,#f59e0b);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">${input.ctaLabel} →</a></div>`
    : "";
  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: input.subject,
    html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="background:linear-gradient(135deg,#ea580c,#f59e0b);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#fff;font-size:22px;margin:0;font-weight:900;">${input.heading}</h1>
      </div>
      <p style="color:#334155;font-size:16px;">Hi ${input.recipientName},</p>
      <div style="color:#334155;font-size:15px;line-height:1.7;">${input.bodyHtml}</div>
      ${cta}
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:32px;">You're receiving this because you have an account at hirecarmarketplace.com.au.</p>
    </div>`,
  });
  return { skipped: false };
}

// ─── Internal utilities ─────────────────────────────────────────────────────────

export async function sendNewMessageNotification(input: {
  to: string;
  recipientName: string;
  senderName: string;
  vehicleTitle: string;
  messagePreview: string;
  leadId: string;
  isVendorRecipient: boolean;
}) {
  if (!resend) return { skipped: true };
  const preview = sanitizeMessagePreview(input.messagePreview);
  const chatUrl = input.isVendorRecipient
    ? `${getAppUrl()}/vendor/leads/${input.leadId}`
    : `${getAppUrl()}/messages/${input.leadId}`;
  await resend.emails.send({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New message about ${input.vehicleTitle}`,
    text: [`Hi ${input.recipientName},`, "", `${input.senderName} sent you a message about ${input.vehicleTitle}:`, "", `"${preview}"`, "", `Reply here: ${chatUrl}`].join("\n"),
  });
  return { skipped: false };
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  if (!resend) return { skipped: true };
  const to = process.env.CONTACT_EMAIL_TO ?? process.env.EMAIL_FROM ?? "admin.hirecar@gmail.com";
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "Hire Car Support <admin.hirecar@gmail.com>",
    to,
    replyTo: input.email,
    subject: `Hire Car contact: ${input.topic}`,
    text: [`Name: ${input.name}`, `Email: ${input.email}`, `Topic: ${input.topic}`, "", input.message].join("\n"),
  });
  return { skipped: false };
}

/** Maximum characters of untrusted inbound content included in a notification email. */
const WHATSAPP_PREVIEW_MAX_LENGTH = 300;

function sanitizeMessagePreview(raw: string): string {
  const collapsed = raw.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
  if (collapsed.length <= WHATSAPP_PREVIEW_MAX_LENGTH) return collapsed;
  return `${collapsed.slice(0, WHATSAPP_PREVIEW_MAX_LENGTH)}…`;
}

async function withRetry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const attempts = Math.max(1, Math.floor(maxAttempts));
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
      }
    }
  }
  throw lastError;
}

export async function sendWhatsAppLeadAlert(
  input: {
    to: string;
    senderName: string;
    senderPhone: string;
    messagePreview: string;
    leadUrl: string;
  },
  maxAttempts = 3,
): Promise<{ skipped: boolean }> {
  if (!resend) return { skipped: true };
  const client = resend;
  const preview = sanitizeMessagePreview(input.messagePreview);
  await withRetry(
    () => client.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: input.to,
      subject: `New WhatsApp lead from ${input.senderName}`,
      text: [`${input.senderName} sent a new WhatsApp enquiry.`, "", `Name: ${input.senderName}`, `Phone: ${input.senderPhone}`, `Message: ${preview}`, "", `View the lead: ${input.leadUrl}`].join("\n"),
    }),
    maxAttempts,
  );
  return { skipped: false };
}
