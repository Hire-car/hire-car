import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type SupabaseUser = {
  id: string;
  email?: string;
  app_metadata?: Record<string, unknown>;
  factors?: unknown[];
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export function userHasPlatformRole(
  user: SupabaseUser,
  roles = ["owner", "admin", "moderator"],
) {
  const platformRole = user.app_metadata?.platform_role;
  return typeof platformRole === "string" && roles.includes(platformRole);
}

async function userHasAdminRoleRecord(
  userId: string,
  roles = ["owner", "admin", "moderator"],
) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("active", true)
    .in("role", roles)
    .maybeSingle();

  return !!data;
}

async function userHasAdminAccess(user: SupabaseUser) {
  return userHasPlatformRole(user) || userHasAdminRoleRecord(user.id);
}

export async function getUserAdminRole(user: SupabaseUser): Promise<string> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("admin_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (data?.role) return data.role;
  
  if (user.app_metadata?.platform_role === "owner" || user.app_metadata?.platform_role === "admin") {
    return "super_admin";
  }

  return "viewer";
}

async function userHasAal2Session() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.currentLevel === "aal2";
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!(await userHasAdminAccess(user))) {
    redirect("/customer/dashboard");
  }

  if (!(await userHasAal2Session())) {
    redirect("/auth/mfa");
  }

  return user;
}

export async function requireAdminRole(allowedRoles: string[]) {
  const user = await requireUser();

  if (!(await userHasAal2Session())) {
    redirect("/auth/mfa");
  }

  // Check if they have an active admin role record for these specific roles
  // or if they are an owner/admin (who can do everything)
  const isGlobalAdmin = await userHasAdminRoleRecord(user.id, ["owner", "admin"]);
  if (isGlobalAdmin) {
    return user;
  }

  const hasSpecificRole = await userHasAdminRoleRecord(user.id, allowedRoles);
  if (!hasSpecificRole && !userHasPlatformRole(user, allowedRoles)) {
    redirect("/customer/dashboard");
  }

  return user;
}

export async function requireApiUser() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
    };
  }

  return { user, response: null };
}

export async function requireApiAdmin() {
  const { user, response } = await requireApiUser();

  if (!user) {
    return { user: null, response };
  }

  if (!(await userHasAdminAccess(user))) {
    return {
      user: null,
      response: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }

  if (!(await userHasAal2Session())) {
    return {
      user: null,
      response: NextResponse.json({ error: "MFA required" }, { status: 403 }),
    };
  }

  return { user, response: null };
}
