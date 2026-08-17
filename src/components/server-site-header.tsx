import { SiteHeader as ClientSiteHeader } from "./site-header";
import { getCurrentUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function SiteHeader() {
  const user = await getCurrentUser();
  let initialAuth = null;
  
  if (user) {
    const supabase = createAdminClient();
    const { count } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    const isVendor = (count ?? 0) > 0;
    initialAuth = {
      isLoggedIn: true,
      isVendor,
      profileHref: isVendor ? "/vendor/dashboard" : "/customer/dashboard",
      profileLabel: isVendor ? "Vendor Dashboard" : "My Account",
      vendorUpgradeHref: "/vendor/upgrade",
      listFleetLabel: "List Your Fleet",
    };
  } else {
    initialAuth = {
      isLoggedIn: false,
      isVendor: false,
      profileHref: "/customer/dashboard",
      profileLabel: "My Account",
      vendorUpgradeHref: "/vendor/upgrade",
      listFleetLabel: "List Your Fleet",
    };
  }

  return <ClientSiteHeader initialAuth={initialAuth} />;
}
