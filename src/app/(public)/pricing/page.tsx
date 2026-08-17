import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/security/auth";
import { getVendorContext } from "@/lib/data/vendor";
import { PricingContent } from "./pricing-content";
import { SiteHeader } from "@/components/server-site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "Pricing | Hire Car",
  description: "Simple, transparent pricing for vehicle rental operators.",
};

export default async function PricingPage() {
  const user = await getCurrentUser();

  if (user) {
    const vendorContext = await getVendorContext(user.id);
    if (vendorContext.organizations.length > 0) {
      redirect("/vendor/billing");
    }
  }

  return (
    <>
      <SiteHeader />
      <PricingContent />
      <SiteFooter />
    </>
  );
}

