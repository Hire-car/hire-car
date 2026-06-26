import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireUser } from "@/lib/security/auth";

import { getVendorContext } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function VendorLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  
  const [context, { userHasAdminAccess }] = await Promise.all([
    getVendorContext(user.id),
    import("@/lib/security/auth")
  ]);

  const isAdmin = await userHasAdminAccess(user);

  if (context.organizations.length === 0) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  const organizationId = context.organizations[0].id;
  
  const supabase = createAdminClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, title, message, type, read, created_at, link")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <DashboardShell 
      mode="vendor" 
      isAdmin={isAdmin} 
      userEmail={user.email} 
      orgId={organizationId} 
      initialNotifications={notifications ?? []}
    >
      {children}
    </DashboardShell>
  );
}
