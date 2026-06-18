import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SiteHeader } from "@/components/site-header";
import { ChatInterface } from "@/components/chat-interface";
import { LeaveReviewModal } from "@/components/leave-review-modal";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CustomerChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  // Fetch lead without customer_email filter so both customers and vendor
  // org members can reach this page. Ownership is verified below.
  const { data: lead } = await supabase
    .from("leads")
    .select(`
      id, customer_email, customer_user_id, vendor_id,
      organizations(name)
    `)
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  // Verify the current user is authorized to view this conversation:
  //   (a) UUID match via customer_user_id  — most reliable
  //   (b) email match                      — fallback for leads created before customer_user_id
  //   (c) vendor org membership            — lets vendor staff reply
  const isCustomerById = !!lead.customer_user_id && lead.customer_user_id === user.id;
  const isCustomerByEmail =
    !!profile?.email &&
    lead.customer_email.toLowerCase() === profile.email.toLowerCase();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", lead.vendor_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const isVendorMember = !!membership;

  if (!isCustomerById && !isCustomerByEmail && !isVendorMember) {
    notFound();
  }

  // Fetch existing messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const org = lead.organizations as unknown as { name: string } | null;

  return (
    <div className="min-h-screen bg-slate-50 pt-[88px]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/customer/enquiries" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#FF5F00]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Enquiries
          </Link>

          <LeaveReviewModal leadId={lead.id} vendorName={org?.name || "Vendor"} />
        </div>

        <ChatInterface
          leadId={lead.id}
          currentUserId={user.id}
          initialMessages={messages || []}
          otherPartyName={org?.name || "Vendor"}
        />
      </main>
    </div>
  );
}
