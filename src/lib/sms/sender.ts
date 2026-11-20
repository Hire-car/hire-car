/**
 * SMS delivery provider integration for Hire Car Marketplace OTP.
 *
 * Supports Twilio (when credentials provided in environment) or generic SMS webhook.
 * In development or when unconfigured, reports provider status transparently.
 * NEVER fakes OTP delivery in production.
 */

export interface SmsSendResult {
  success: boolean;
  delivered: boolean;
  simulated?: boolean;
  provider: "twilio" | "custom" | "none";
  error?: string;
  messageId?: string;
}

export async function sendOtpSms(params: {
  phoneE164: string;
  code: string;
  vehicleTitle?: string;
}): Promise<SmsSendResult> {
  const { phoneE164, code, vehicleTitle } = params;
  const messageBody = vehicleTitle
    ? `Your Hire Car verification code for ${vehicleTitle} is: ${code}. Valid for 5 minutes. Do not share this code.`
    : `Your Hire Car verification code is: ${code}. Valid for 5 minutes. Do not share this code.`;

  // 1. Check Twilio credentials
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
      const body = new URLSearchParams();
      body.append("To", phoneE164);
      if (twilioFrom.startsWith("MG")) {
        body.append("MessagingServiceSid", twilioFrom);
      } else {
        body.append("From", twilioFrom);
      }
      body.append("Body", messageBody);

      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: body.toString(),
        },
      );

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.sid) {
        return {
          success: true,
          delivered: true,
          provider: "twilio",
          messageId: data.sid,
        };
      }

      console.error("[SMS Provider] Twilio delivery error:", data);
      return {
        success: false,
        delivered: false,
        provider: "twilio",
        error: data.message || "Twilio delivery failed",
      };
    } catch (err) {
      console.error("[SMS Provider] Exception during Twilio send:", err);
      return {
        success: false,
        delivered: false,
        provider: "twilio",
        error: err instanceof Error ? err.message : "SMS provider network error",
      };
    }
  }

  // 2. No SMS provider configured
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    // In local development, log to terminal for seamless developer testing
    console.info(`[SMS DEV LOG] ---------------------------------------------`);
    console.info(`[SMS DEV LOG] To: ${phoneE164}`);
    console.info(`[SMS DEV LOG] OTP Code: ${code}`);
    console.info(`[SMS DEV LOG] Message: ${messageBody}`);
    console.info(`[SMS DEV LOG] (Configure TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN for live SMS)`);
    console.info(`[SMS DEV LOG] ---------------------------------------------`);

    return {
      success: true,
      delivered: false,
      simulated: true,
      provider: "none",
    };
  }

  // Production without SMS credentials: do NOT claim real delivery succeeded
  console.warn(
    `[SMS Provider] SMS credentials not configured in production environment. Unable to deliver real SMS to ${phoneE164}.`,
  );
  return {
    success: false,
    delivered: false,
    simulated: false,
    provider: "none",
    error: "SMS gateway credentials not configured on the server.",
  };
}
