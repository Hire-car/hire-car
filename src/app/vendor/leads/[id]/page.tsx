import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ChatInterface } from "@/components/chat-interface";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, CheckCircle2, MessageSquare, Sparkles, Clock } from "lucide-react";
import { formatAustralianDateTime } from "@/lib/date-utils";

export default async function VendorChatRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = createAdminClient();

  // Fetch lead and verify vendor ownership or assignment
  const { data: lead } = await supabase
    .from("leads")
    .select(`
      *,
      vehicles(title, price_per_day_aud)
    `)
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  // Get all organizations the current user can manage
  const { data: userMemberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin", "manager"]);

  const userOrgIds = userMemberships?.map((m) => m.organization_id) ?? [];
  if (userOrgIds.length === 0) {
    notFound();
  }

  // Check if any of user's organizations is primary vendor or assigned via location
  let authorizedOrgId: string | null = null;
  let assignmentStatus: string | null = null;

  const { data: assignments } = await supabase
    .from("lead_vendor_assignments")
    .select("organization_id, status")
    .eq("lead_id", lead.id)
    .in("organization_id", userOrgIds);

  if (lead.vendor_id && userOrgIds.includes(lead.vendor_id)) {
    authorizedOrgId = lead.vendor_id;
    const primaryAssignment = assignments?.find((a) => a.organization_id === authorizedOrgId);
    if (primaryAssignment) {
      assignmentStatus = primaryAssignment.status;
    }
  } else if (assignments && assignments.length > 0) {
    authorizedOrgId = assignments[0].organization_id;
    assignmentStatus = assignments[0].status;
  }

  if (!authorizedOrgId) {
    notFound();
  }

  // Fetch existing messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", lead.id)
    .order("created_at", { ascending: true });

  const { data: vendorMembers } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", authorizedOrgId);
  const vendorUserIds = vendorMembers?.map((m) => m.user_id) || [];

  const vehicle = lead.vehicles as unknown as { title: string; price_per_day_aud: number } | null;
  const displayStatus = (assignmentStatus === "closed" ? "lost" : assignmentStatus) || lead.status;
  const isLocationLead = lead.vendor_id !== authorizedOrgId;

  // Duration & Pricing calculation
  const startDate = new Date(lead.start_date);
  const endDate = new Date(lead.end_date);
  const diffTime = endDate.getTime() - startDate.getTime();
  const daysCount = Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)));

  const basePrice = lead.snapshot_price_per_day_aud ?? vehicle?.price_per_day_aud ?? null;
  const offerPrice = lead.snapshot_offer_price_aud ?? null;
  const hasDiscount = Boolean(offerPrice && basePrice && offerPrice < basePrice);
  const effectiveDailyRate = hasDiscount ? offerPrice! : basePrice;
  const estimatedTotal = effectiveDailyRate ? effectiveDailyRate * daysCount : null;
  const totalSavings = hasDiscount && basePrice ? (basePrice - offerPrice!) * daysCount : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/vendor/leads"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium hover:bg-slate-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Leads
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            Lead: {vehicle?.title || "General Enquiry"}
          </h1>
        </div>
        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide border-emerald-200 bg-emerald-50 text-emerald-600">
          {displayStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer & Enquiry Details Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Location lead notice if applicable */}
          {isLocationLead && (
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-xs text-purple-900 shadow-sm">
              <p className="font-bold flex items-center gap-1.5 text-purple-800">
                <MapPin className="h-3.5 w-3.5" />
                Location-Distributed Lead
              </p>
              <p className="mt-1 leading-relaxed text-purple-700">
                This enquiry was automatically matched to your fleet because your approved branch covers customer pickup in <strong>{lead.pickup_city}</strong>.
              </p>
            </div>
          )}

          {/* Customer Details */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <User className="h-4 w-4" />
              Customer Details
            </h3>
            <div className="space-y-3.5 text-sm">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Customer Name</p>
                <p className="font-medium text-slate-900 mt-0.5">{lead.customer_name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Mobile Phone Number</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <a
                    href={`tel:${lead.customer_phone}`}
                    className="font-medium text-blue-600 hover:underline flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {lead.customer_phone}
                  </a>
                  {lead.phone_verified ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
                      <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-normal">
                      (Call customer)
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Email Address</p>
                <a
                  href={`mailto:${lead.customer_email}`}
                  className="font-medium text-blue-600 hover:underline flex items-center gap-1.5 mt-0.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {lead.customer_email}
                </a>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Received</p>
                <p className="font-medium text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  {formatAustralianDateTime(lead.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Rental Request & Pricing */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Rental Request Details</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Pickup Location</p>
                  <p className="font-medium text-slate-900 mt-0.5">{lead.pickup_city}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 uppercase font-semibold">Requested Dates</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {new Date(lead.start_date).toLocaleDateString("en-AU")} – {new Date(lead.end_date).toLocaleDateString("en-AU")}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Duration: {daysCount} {daysCount === 1 ? "day" : "days"}
                  </p>
                </div>
              </div>

              {/* Pricing breakdown */}
              {basePrice && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1.5">Pricing Details</p>
                  <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-600">Daily Rate:</span>
                      <div className="flex items-center gap-1.5">
                        {hasDiscount && (
                          <span className="text-xs text-slate-400 line-through">
                            ${basePrice}
                          </span>
                        )}
                        <span className={`font-bold ${hasDiscount ? "text-[#ea580c]" : "text-slate-900"}`}>
                          ${effectiveDailyRate} AUD / day
                        </span>
                      </div>
                    </div>
                    {estimatedTotal && (
                      <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/60 font-semibold text-slate-900">
                        <span>Total ({daysCount}d):</span>
                        <span className="text-base text-slate-950 font-black">
                          ${estimatedTotal} AUD
                        </span>
                      </div>
                    )}
                    {hasDiscount && totalSavings > 0 && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold mt-1">
                        <Sparkles className="h-3 w-3" />
                        Discount applied: saves ${totalSavings} AUD
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customer Enquiry Message */}
          {lead.message && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Customer Message
              </h3>
              <p className="text-sm text-slate-700 italic bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap leading-relaxed">
                &ldquo;{lead.message}&rdquo;
              </p>
            </div>
          )}
        </div>

        {/* Messaging Interface */}
        <div className="lg:col-span-2">
          <ChatInterface 
            leadId={lead.id} 
            currentUserId={user.id} 
            vendorUserIds={vendorUserIds}
            initialMessages={messages || []} 
            otherPartyName={lead.customer_name}
          />
        </div>
      </div>
    </div>
  );
}
