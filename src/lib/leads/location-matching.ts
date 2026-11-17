import { createAdminClient } from "@/lib/supabase/admin";

export const AUSTRALIAN_CITY_STATE_MAP: Record<string, string> = {
  sydney: "NSW",
  parramatta: "NSW",
  bondi: "NSW",
  blacktown: "NSW",
  chatswood: "NSW",
  "north sydney": "NSW",
  manly: "NSW",
  penrith: "NSW",
  "surry hills": "NSW",
  mascot: "NSW",
  newcastle: "NSW",
  wollongong: "NSW",

  melbourne: "VIC",
  "melbourne cbd": "VIC",
  southbank: "VIC",
  richmond: "VIC",
  "st kilda": "VIC",
  carlton: "VIC",
  footscray: "VIC",
  dandenong: "VIC",
  "box hill": "VIC",
  geelong: "VIC",

  perth: "WA",
  "perth cbd": "WA",
  fremantle: "WA",
  joondalup: "WA",
  scarborough: "WA",
  subiaco: "WA",
  cannington: "WA",
  midland: "WA",

  brisbane: "QLD",
  "gold coast": "QLD",
  cairns: "QLD",
  adelaide: "SA",
  hobart: "TAS",
  darwin: "NT",
  canberra: "ACT",
};

export interface MatchingVendor {
  organizationId: string;
  name: string;
  city: string;
  state: string;
}

/**
 * Normalizes location search string into city name.
 */
export function normalizeCityName(raw: string): string {
  if (!raw) return "";
  return raw.trim().toLowerCase();
}

/**
 * Returns state abbreviation for known Australian metro cities.
 */
export function getStateForCity(city: string): string | null {
  const normalized = normalizeCityName(city);
  return AUSTRALIAN_CITY_STATE_MAP[normalized] || null;
}

/**
 * Find approved vendors whose active branches match the customer's pickup city.
 * Excludes suspended or unapproved vendors.
 */
export async function findEligibleVendorsForLocation(
  pickupCity: string,
  excludeOrgId?: string,
): Promise<MatchingVendor[]> {
  const supabase = createAdminClient();
  const normalizedCity = normalizeCityName(pickupCity);

  if (!normalizedCity) return [];

  // Query branches matching city
  let branchQuery = supabase
    .from("branches")
    .select(`
      organization_id,
      city,
      state,
      status,
      organizations!inner(id, name, status)
    `)
    .eq("status", "approved");

  type QueryWithIlike = { ilike: (column: string, pattern: string) => typeof branchQuery };
  if ("ilike" in branchQuery && typeof (branchQuery as unknown as QueryWithIlike).ilike === "function") {
    branchQuery = (branchQuery as unknown as QueryWithIlike).ilike("city", `%${normalizedCity}%`);
  }

  const { data: branches, error } = await branchQuery;

  if (error || !branches) {
    if (error) {
      console.error("[Location Matching] Error querying branches:", error);
    }
    return [];
  }

  const seenOrgs = new Set<string>();
  const matches: MatchingVendor[] = [];

  for (const b of branches) {
    const org = b.organizations as unknown as { id: string; name: string; status: string } | null;
    if (!org || org.status !== "approved") continue;
    if (excludeOrgId && org.id === excludeOrgId) continue;
    if (seenOrgs.has(org.id)) continue;

    seenOrgs.add(org.id);
    matches.push({
      organizationId: org.id,
      name: org.name,
      city: b.city,
      state: b.state,
    });
  }

  return matches;
}

/**
 * Distribute a lead to eligible vendors based on location.
 * Always records the primary vehicle's vendor, plus assigns to matching local operators.
 */
export async function assignLeadToLocationVendors(params: {
  leadId: string;
  pickupCity: string;
  primaryVendorId: string;
  customerName: string;
  vehicleTitle?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{ primaryAssigned: boolean; locationAssignedCount: number; assignedOrgIds: string[] }> {
  const {
    leadId,
    pickupCity,
    primaryVendorId,
    customerName,
    vehicleTitle,
    startDate,
    endDate,
  } = params;

  const supabase = createAdminClient();
  const assignedOrgIds: string[] = [];

  // 1. Assign primary vendor
  const assignmentsTable = supabase.from("lead_vendor_assignments");
  let primaryError: { message: string } | null = null;

  try {
    if (typeof assignmentsTable.upsert === "function") {
      const res = await assignmentsTable.upsert(
        {
          lead_id: leadId,
          organization_id: primaryVendorId,
          status: "new",
        },
        { onConflict: "lead_id,organization_id" },
      );
      primaryError = res.error;
    } else if (typeof assignmentsTable.insert === "function") {
      const res = await assignmentsTable.insert({
        lead_id: leadId,
        organization_id: primaryVendorId,
        status: "new",
      });
      primaryError = res.error;
    }
  } catch (err) {
    primaryError = { message: err instanceof Error ? err.message : String(err) };
  }

  if (!primaryError) {
    assignedOrgIds.push(primaryVendorId);
  } else {
    console.warn("[Location Matching] Primary vendor assignment upsert failed:", primaryError.message);
  }

  // 2. Discover additional matching vendors in the same pickup city / metro area
  const locationVendors = await findEligibleVendorsForLocation(pickupCity, primaryVendorId);

  let locationAssignedCount = 0;
  for (const vendor of locationVendors) {
    try {
      let assignError: { message: string } | null = null;
      if (typeof assignmentsTable.upsert === "function") {
        const res = await assignmentsTable.upsert(
          {
            lead_id: leadId,
            organization_id: vendor.organizationId,
            status: "new",
          },
          { onConflict: "lead_id,organization_id" },
        );
        assignError = res.error;
      } else if (typeof assignmentsTable.insert === "function") {
        const res = await assignmentsTable.insert({
          lead_id: leadId,
          organization_id: vendor.organizationId,
          status: "new",
        });
        assignError = res.error;
      }

      if (!assignError) {
        locationAssignedCount++;
        assignedOrgIds.push(vendor.organizationId);

        // Create dashboard notification for matching vendor
        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : "";
        const vehContext = vehicleTitle ? ` for ${vehicleTitle}` : "";

        await supabase.from("notifications").insert({
          organization_id: vendor.organizationId,
          title: "New Location Opportunity",
          message: `${customerName} is looking for a rental vehicle in ${pickupCity}${dateRange}${vehContext}.`,
          type: "info",
          link: `/vendor/leads`,
        }).then(({ error: notifErr }) => {
          if (notifErr) console.warn("[Location Matching] Notification error:", notifErr.message);
        });
      }
    } catch (locErr) {
      console.warn("[Location Matching] Error assigning vendor:", locErr);
    }
  }

  return {
    primaryAssigned: !primaryError,
    locationAssignedCount,
    assignedOrgIds,
  };
}
