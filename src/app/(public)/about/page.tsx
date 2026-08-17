import { AboutClient } from "./about-client";
import { SiteHeader } from "@/components/server-site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "About Us | Hire Car",
  description: "Learn about Hire Car's mission to solve the rental monopoly and connect customers directly with verified, independent car rental operators across Australia.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <AboutClient />
      <SiteFooter />
    </>
  );
}

