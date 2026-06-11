import { requireUser } from "@/lib/security/auth";
import { getVendorContext } from "@/lib/data/vendor";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import BookingsClient from "./bookings-client";

export const metadata = { title: "Bookings" };

export default async function BookingsPage() {
  const user = await requireUser();
  const context = await getVendorContext(user.id);

  if (context.setupError || context.organizations.length === 0) {
    redirect("/vendor/onboarding");
  }

  const org = context.organizations[0];

  const supabase = createAdminClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`id, start_date, end_date, status, customer_name, customer_email, customer_phone, total_price_aud, vehicles ( id, title, make, model )`)
    .eq("organization_id", org.id)
    .order("start_date", { ascending: true });

  return (
    <DashboardShell mode="vendor">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Bookings & Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your fleet&apos;s schedule and reservation pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
          <span className="font-semibold">{bookings?.length ?? 0}</span>
          <span>total bookings</span>
        </div>
      </div>

      <BookingsClient organizationId={org.id} initialBookings={bookings ?? []} />
    </DashboardShell>
  );
}
