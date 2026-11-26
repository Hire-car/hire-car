import { NextResponse } from "next/server";

export interface CookieOptions {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date | number;
  sameSite?: true | false | "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  partitioned?: boolean;
  priority?: "low" | "medium" | "high";
}

export interface CookieSource {
  cookies: {
    getAll: () => CookieOptions[];
  };
}

/**
 * Copies all cookies from a source response (e.g. updated Supabase session cookies)
 * to a target redirect response, ensuring security flags (httpOnly, secure, sameSite, path)
 * are completely preserved across HTTP 307 or 301 redirects.
 */
export function redirectWithCookies(
  sourceResponse: CookieSource,
  redirectUrl: URL | string,
  status = 307,
): NextResponse {
  const targetUrl =
    typeof redirectUrl === "string"
      ? new URL(redirectUrl, "http://localhost")
      : redirectUrl;
  const redirectResponse = NextResponse.redirect(targetUrl, status);

  sourceResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
  });

  return redirectResponse;
}
