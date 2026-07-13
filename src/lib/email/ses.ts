import nodemailer from "nodemailer";
import { getAppUrl, optionalEnv } from "@/lib/config";

const smtpHost = optionalEnv("SMTP_HOST") || "email-smtp.ap-southeast-2.amazonaws.com";
const smtpPort = parseInt(optionalEnv("SMTP_PORT") || "465", 10);
const smtpUser = optionalEnv("SMTP_USER") || "AKIAT3STWTTRRYLGNUFV";
const smtpPass = optionalEnv("SMTP_PASS") || "BJAbtXLb/IGLJXuvaD6+gCPG9GWGgUUfhFgW1ZqzAkvs";

export const transporter = (smtpHost && smtpUser && smtpPass)
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const FROM = process.env.EMAIL_FROM ?? "Hire Car Marketplace <noreply@hirecarmarketplace.com.au>";
const REPLY_TO = process.env.REPLY_TO_EMAIL ?? process.env.CONTACT_EMAIL_TO ?? "support@hirecarmarketplace.com.au";
const ADMIN_EMAIL = process.env.CONTACT_EMAIL_TO ?? "admin@hirecarmarketplace.com.au";

// --- Base Template Engine ---
function buildEmailTemplate({
  title,
  name,
  bodyHtml,
  ctaText,
  ctaUrl,
  footerText = "You're receiving this because you have an account at hirecarmarketplace.com.au."
}: {
  title: string;
  name?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}) {
  const logoHtml = `<img src="${getAppUrl()}/LOGO.png" alt="Hire Car Marketplace" style="height: 80px; width: auto; max-width: 100%;" />`;
  const nameHtml = name ? `<p style="margin-bottom: 24px; font-weight: 500;">Hi ${name},</p>` : "";
  const ctaHtml = ctaText && ctaUrl ? `
    <div style="text-align: center; margin: 40px 0 24px;">
      <a href="${ctaUrl}" style="background: linear-gradient(135deg, #ea580c, #f59e0b); color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(234, 88, 12, 0.39); width: 100%; max-width: 300px; box-sizing: border-box;">${ctaText} &rarr;</a>
    </div>` : "";

  return `
<div style="font-family: 'Inter', Roboto, sans-serif; width: 100%; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 24px 16px; box-sizing: border-box;">
  <div style="background-color: #ffffff; border-radius: 16px; padding: 32px 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); overflow: hidden; box-sizing: border-box;">
    <div style="text-align: center; margin-bottom: 32px;">
      ${logoHtml}
    </div>
    <div style="background: linear-gradient(135deg, #ea580c, #f59e0b); border-radius: 16px; padding: 24px 16px; text-align: center; margin-bottom: 32px;">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; line-height: 1.3; letter-spacing: -0.02em;">${title}</h1>
    </div>
    <div style="color: #334155; font-size: 16px; line-height: 1.6;">
      ${nameHtml}
      ${bodyHtml}
    </div>
    ${ctaHtml}
    <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px; text-align: center;">
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">${footerText}</p>
      <p style="color: #cbd5e1; font-size: 12px; margin-top: 8px;">Hire Car Marketplace &middot; Australia</p>
    </div>
  </div>
</div>`;
}

// ─── Leads & Enquiries ────────────────────────────────────────────────────────
export async function sendLeadAlert(input: {
  to: string;
  vehicleTitle: string;
  customerName: string;
}) {
  if (!transporter) return { skipped: true };
  const dashboardUrl = `${getAppUrl()}/vendor/dashboard`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New rental lead for ${input.vehicleTitle}`,
    html: buildEmailTemplate({
      title: "New Rental Lead! 🎉",
      bodyHtml: `<p><strong>${input.customerName}</strong> has submitted a new rental enquiry for your vehicle: <strong>${input.vehicleTitle}</strong>.</p><p>Respond quickly to increase your chances of securing the booking.</p>`,
      ctaText: "Review Lead",
      ctaUrl: dashboardUrl
    })
  });
  return { skipped: false };
}

export async function sendCustomerEnquiryConfirmation(input: {
  to: string;
  customerName: string;
  vehicleTitle: string;
  leadId: string;
}) {
  if (!transporter) return { skipped: true };
  const chatUrl = `${getAppUrl()}/messages/${input.leadId}`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `Your enquiry for ${input.vehicleTitle}`,
    html: buildEmailTemplate({
      title: "Enquiry Sent! 🚗",
      name: input.customerName,
      bodyHtml: `<p>Your rental enquiry for <strong>${input.vehicleTitle}</strong> has been successfully sent to the vendor.</p><p>You will be notified as soon as they reply. You can track your conversation and messages anytime by signing in.</p>`,
      ctaText: "View Conversation",
      ctaUrl: chatUrl
    })
  });
  return { skipped: false };
}

// ─── Welcome Emails ────────────────────────────────────────────────────────────
export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  role?: "vendor" | "customer";
}) {
  if (!transporter) return { skipped: true };
  const isVendor = input.role === "vendor";
  const dashboardUrl = isVendor ? `${getAppUrl()}/vendor/dashboard` : `${getAppUrl()}/search`;
  const greeting = isVendor
    ? "<p>Your vendor account is ready! Start adding your fleet to our marketplace and reach thousands of potential renters across Australia.</p>"
    : "<p>You're all set to find your perfect rental car across Australia. Browse thousands of vehicles from verified local vendors.</p>";
  const ctaLabel = isVendor ? "Go to Vendor Dashboard" : "Browse Cars";

  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Welcome to Hire Car Marketplace! 🚗",
    html: buildEmailTemplate({
      title: "Welcome to HireCar! 🎊",
      name: input.name || "there",
      bodyHtml: greeting,
      ctaText: ctaLabel,
      ctaUrl: dashboardUrl
    })
  });
  return { skipped: false };
}

// ─── Marketing & Mass Marketing ───────────────────────────────────────────────
export async function sendMarketingEmail(input: {
  to: string;
  recipientName: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  if (!transporter) return { skipped: true };
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: input.subject,
    html: buildEmailTemplate({
      title: input.heading,
      name: input.recipientName,
      bodyHtml: input.bodyHtml,
      ctaText: input.ctaLabel,
      ctaUrl: input.ctaUrl
    })
  });
  return { skipped: false };
}

export async function sendMassMarketingEmail(input: {
  recipients: { email: string; name: string }[];
  subject: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}) {
  if (!transporter) return { skipped: true };
  let sentCount = 0;
  for (const recipient of input.recipients) {
    try {
      await transporter.sendMail({
        from: FROM,
        replyTo: REPLY_TO,
        to: recipient.email,
        subject: input.subject,
        html: buildEmailTemplate({
          title: input.heading,
          name: recipient.name,
          bodyHtml: input.bodyHtml,
          ctaText: input.ctaLabel,
          ctaUrl: input.ctaUrl,
          footerText: "You're receiving this mass marketing email because you are subscribed to our updates."
        })
      });
      sentCount++;
    } catch (e) {
      console.error(`Failed to send mass email to ${recipient.email}`, e);
    }
  }
  return { skipped: false, sentCount };
}

// ─── Approval Emails ───────────────────────────────────────────────────────────
export async function sendVendorApprovalEmail(input: {
  to: string;
  vendorName: string;
}) {
  if (!transporter) return { skipped: true };
  const dashboardUrl = `${getAppUrl()}/vendor/dashboard`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Your Vendor Account is Approved! 🎉",
    html: buildEmailTemplate({
      title: "You are Approved! ✅",
      name: input.vendorName,
      bodyHtml: "<p>Great news! Your vendor account has been reviewed and approved by our team. You can now start adding your vehicles to the marketplace and receiving leads.</p>",
      ctaText: "Go to Dashboard",
      ctaUrl: dashboardUrl
    })
  });
  return { skipped: false };
}

export async function sendVehicleApprovalEmail(input: {
  to: string;
  vehicleTitle: string;
}) {
  if (!transporter) return { skipped: true };
  const listingsUrl = `${getAppUrl()}/vendor/fleet`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Your Vehicle is Live! 🚗",
    html: buildEmailTemplate({
      title: "Vehicle Approved! 🎊",
      bodyHtml: `<p>Great news! Your listing for <strong>${input.vehicleTitle}</strong> has been approved and is now live on the marketplace for customers to see.</p>`,
      ctaText: "View Fleet",
      ctaUrl: listingsUrl
    })
  });
  return { skipped: false };
}

// ─── Reminder & Alert Emails ───────────────────────────────────────────────────
export async function sendAdminPendingReminderEmail(input: {
  to: string;
  pendingVendorsCount: number;
  pendingVehiclesCount: number;
}) {
  if (!transporter) return { skipped: true };
  const adminUrl = `${getAppUrl()}/admin`;
  
  const itemsHtml = `
    <ul>
      ${input.pendingVendorsCount > 0 ? `<li><strong>${input.pendingVendorsCount}</strong> pending vendors</li>` : ""}
      ${input.pendingVehiclesCount > 0 ? `<li><strong>${input.pendingVehiclesCount}</strong> pending vehicles</li>` : ""}
    </ul>
  `;

  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: "Pending Approvals Require Your Attention",
    html: buildEmailTemplate({
      title: "Action Required ⚠️",
      name: "Admin",
      bodyHtml: `<p>There are items in the moderation queue waiting for your approval:</p>${itemsHtml}`,
      ctaText: "Go to Admin Panel",
      ctaUrl: adminUrl
    })
  });
  return { skipped: false };
}

export async function sendVendorUnreadLeadReminderEmail(input: {
  to: string;
  vendorName: string;
  unreadCount: number;
}) {
  if (!transporter) return { skipped: true };
  const dashboardUrl = `${getAppUrl()}/vendor/leads`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `You have ${input.unreadCount} unread lead(s)!`,
    html: buildEmailTemplate({
      title: "Unread Leads 📧",
      name: input.vendorName,
      bodyHtml: `<p>You have <strong>${input.unreadCount}</strong> lead(s) waiting for your response. Responding quickly improves your ranking and increases your bookings!</p>`,
      ctaText: "View Leads",
      ctaUrl: dashboardUrl
    })
  });
  return { skipped: false };
}

export async function sendMaliciousActivityAlert(input: {
  activityType: string;
  description: string;
  userId?: string;
  ipAddress?: string;
}) {
  if (!transporter) return { skipped: true };
  const adminUrl = `${getAppUrl()}/admin`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: ADMIN_EMAIL,
    subject: `🚨 Malicious Activity Alert: ${input.activityType}`,
    html: buildEmailTemplate({
      title: "Security Alert 🚨",
      name: "Admin Team",
      bodyHtml: `<p>We detected potentially malicious activity on the platform.</p>
      <ul>
        <li><strong>Type:</strong> ${input.activityType}</li>
        <li><strong>Description:</strong> ${input.description}</li>
        ${input.userId ? `<li><strong>User ID:</strong> ${input.userId}</li>` : ""}
        ${input.ipAddress ? `<li><strong>IP Address:</strong> ${input.ipAddress}</li>` : ""}
      </ul>
      <p>Please investigate this issue immediately.</p>`,
      ctaText: "Open Admin Dashboard",
      ctaUrl: adminUrl
    })
  });
  return { skipped: false };
}

// ─── Internal Utilities ────────────────────────────────────────────────────────
export async function sendNewMessageNotification(input: {
  to: string;
  recipientName: string;
  senderName: string;
  vehicleTitle: string;
  messagePreview: string;
  leadId: string;
  isVendorRecipient: boolean;
}) {
  if (!transporter) return { skipped: true };
  const preview = sanitizeMessagePreview(input.messagePreview);
  const chatUrl = input.isVendorRecipient
    ? `${getAppUrl()}/vendor/leads/${input.leadId}`
    : `${getAppUrl()}/messages/${input.leadId}`;
    
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `New message about ${input.vehicleTitle}`,
    html: buildEmailTemplate({
      title: "New Message 💬",
      name: input.recipientName,
      bodyHtml: `<p><strong>${input.senderName}</strong> sent you a message regarding <strong>${input.vehicleTitle}</strong>.</p>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-style: italic; margin-bottom: 24px; color: #475569;">
        "${preview}"
      </div>`,
      ctaText: "Reply Now",
      ctaUrl: chatUrl
    })
  });
  return { skipped: false };
}

export async function sendContactMessage(input: {
  name: string;
  email: string;
  topic: string;
  message: string;
}) {
  if (!transporter) return { skipped: true };
  const to = process.env.CONTACT_EMAIL_TO ?? process.env.EMAIL_FROM ?? "support@hirecarmarketplace.com.au";
  
  await transporter.sendMail({
    from: FROM,
    to,
    replyTo: input.email,
    subject: `Hire Car contact: ${input.topic}`,
    html: buildEmailTemplate({
      title: "New Contact Message 📨",
      name: "Support Team",
      bodyHtml: `
      <p>You have received a new contact message.</p>
      <ul>
        <li><strong>Name:</strong> ${input.name}</li>
        <li><strong>Email:</strong> ${input.email}</li>
        <li><strong>Topic:</strong> ${input.topic}</li>
      </ul>
      <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; color: #475569;">
        ${input.message.replace(/\n/g, "<br>")}
      </div>`,
    })
  });
  return { skipped: false };
}

/** Maximum characters of untrusted inbound content included in a notification email. */
const WHATSAPP_PREVIEW_MAX_LENGTH = 300;

function sanitizeMessagePreview(raw: string): string {
  const collapsed = raw.replace(/[\u0000-\u001F\u007F]+/g, " ").replace(/\s+/g, " ").trim();
  if (collapsed.length <= WHATSAPP_PREVIEW_MAX_LENGTH) return collapsed;
  return `${collapsed.slice(0, WHATSAPP_PREVIEW_MAX_LENGTH)}\u2026`;
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
  if (!transporter) return { skipped: true };
  const preview = sanitizeMessagePreview(input.messagePreview);
  
  await withRetry(
    () => transporter!.sendMail({
      from: FROM,
      replyTo: REPLY_TO,
      to: input.to,
      subject: `New WhatsApp lead from ${input.senderName}`,
      html: buildEmailTemplate({
        title: "WhatsApp Lead 📱",
        bodyHtml: `<p><strong>${input.senderName}</strong> sent a new WhatsApp enquiry.</p>
        <ul>
          <li><strong>Name:</strong> ${input.senderName}</li>
          <li><strong>Phone:</strong> ${input.senderPhone}</li>
        </ul>
        <div style="background-color: #f1f5f9; padding: 16px; border-radius: 8px; font-style: italic; margin-bottom: 24px; color: #475569;">
          "${preview}"
        </div>`,
        ctaText: "View Lead",
        ctaUrl: input.leadUrl
      })
    }),
    maxAttempts,
  );
  return { skipped: false };
}

// ─── Etiquette Emails ────────────────────────────────────────────────────────
export async function sendLeadConvertedEmail(input: {
  to: string;
  customerName: string;
  vehicleTitle: string;
  vendorName: string;
  leadId: string;
}) {
  if (!transporter) return { skipped: true };
  const chatUrl = `${getAppUrl()}/messages/${input.leadId}`;
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `Your booking for ${input.vehicleTitle} is confirmed!`,
    html: buildEmailTemplate({
      title: "Booking Confirmed! 🎉",
      name: input.customerName,
      bodyHtml: `<p>Great news! <strong>${input.vendorName}</strong> has officially accepted and confirmed your rental enquiry for the <strong>${input.vehicleTitle}</strong>.</p><p>You can view your booking details and coordinate pickup directly with the vendor using the secure messaging portal.</p>`,
      ctaText: "View Booking & Chat",
      ctaUrl: chatUrl
    })
  });
  return { skipped: false };
}

export async function sendReviewRequestEmail(input: {
  to: string;
  customerName: string;
  vehicleTitle: string;
  vendorName: string;
  leadId: string;
}) {
  if (!transporter) return { skipped: true };
  const reviewUrl = `${getAppUrl()}/customer/dashboard`; 
  
  await transporter.sendMail({
    from: FROM,
    replyTo: REPLY_TO,
    to: input.to,
    subject: `How was your rental from ${input.vendorName}?`,
    html: buildEmailTemplate({
      title: "How was your trip? 🚗",
      name: input.customerName,
      bodyHtml: `<p>We hope you had a fantastic experience renting the <strong>${input.vehicleTitle}</strong> from <strong>${input.vendorName}</strong>!</p><p>Your feedback is incredibly valuable to our community. Please take 60 seconds to leave a quick review for the vendor. This helps other renters make great choices and rewards good vendors.</p>`,
      ctaText: "Leave a Review",
      ctaUrl: reviewUrl
    })
  });
  return { skipped: false };
}
