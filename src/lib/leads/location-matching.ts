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

export const SUBURB_TO_METRO_MAP: Record<string, string> = {
  parramatta: "sydney",
  bondi: "sydney",
  blacktown: "sydney",
  chatswood: "sydney",
  "north sydney": "sydney",
  manly: "sydney",
  penrith: "sydney",
  "surry hills": "sydney",
  mascot: "sydney",
  "melbourne cbd": "melbourne",
  southbank: "melbourne",
  richmond: "melbourne",
  "st kilda": "melbourne",
  carlton: "melbourne",
  footscray: "melbourne",
  dandenong: "melbourne",
  "box hill": "melbourne",
  "perth cbd": "perth",
  fremantle: "perth",
  joondalup: "perth",
  scarborough: "perth",
  subiaco: "perth",
  cannington: "perth",
  midland: "perth",
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
 * Resolves any raw location string (suburb, airport, CBD, metro) to its canonical metropolitan city.
 */
export function resolveMetropolitanArea(rawLocation: string): string | null {
  const normalized = normalizeCityName(rawLocation);
  if (!normalized) return null;

  // 1. Direct or normalized lookup in SUBURB_TO_METRO_MAP
  if (SUBURB_TO_METRO_MAP[normalized]) {
    return SUBURB_TO_METRO_MAP[normalized];
  }

  // 2. Direct metro cities or compound strings (e.g. "Sydney CBD", "Sydney Airport", "Melbourne Airport", "Perth Airport")
  const METRO_CITIES = [
    "sydney",
    "melbourne",
    "perth",
    "brisbane",
    "adelaide",
    "hobart",
    "darwin",
    "canberra",
    "gold coast",
    "cairns",
    "newcastle",
    "wollongong",
    "geelong",
  ];

  for (const metro of METRO_CITIES) {
    if (
      normalized === metro ||
      normalized.startsWith(`${metro} `) ||
      normalized.endsWith(` ${metro}`) ||
      normalized.includes(`${metro} `) ||
      normalized.includes(` ${metro}`)
    ) {
      return metro;
    }
  }

  // 3. Suburb keyword inside the string (e.g. "Parramatta station", "Mascot terminal", "Fremantle port")
  for (const [suburb, metro] of Object.entries(SUBURB_TO_METRO_MAP)) {
    const regex = new RegExp(`\\b${suburb}\\b`, "i");
    if (regex.test(normalized)) {
      return metro;
    }
  }

  return null;
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

  const targetMetro = resolveMetropolitanArea(normalizedCity);

  // Query branches matching city
  const branchQuery = supabase
    .from("branches")
    .select(`
      organization_id,
      name,
      city,
      state,
      address,
      status,
      organizations!inner(id, name, status)
    `)
    .eq("status", "approved");

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

    const branchCity = (b.city || "").toLowerCase().trim();
    const branchName = (b.name || "").toLowerCase().trim();
    const branchAddress = (b.address || "").toLowerCase().trim();

    // Matching conditions:
    // 1. Target metropolitan match (e.g. Parramatta/Bondi/Mascot -> Sydney; Fremantle -> Perth; St Kilda -> Melbourne)
    const matchesMetro = Boolean(targetMetro && (branchCity === targetMetro || branchCity.includes(targetMetro)));
    // 2. Direct city match (case-insensitive substring in either direction)
    const matchesDirectCity = branchCity === normalizedCity || branchCity.includes(normalizedCity) || normalizedCity.includes(branchCity);
    // 3. Branch name contains the location query (e.g. "Sydney Airport Branch", "Perth Airport & CBD")
    const matchesBranchName = branchName.includes(normalizedCity);
    // 4. Branch address contains the location query (e.g. "50 Mascot Dr" matches "Mascot")
    const matchesAddress = branchAddress.includes(normalizedCity);

    if (matchesMetro || matchesDirectCity || matchesBranchName || matchesAddress) {
      seenOrgs.add(org.id);
      matches.push({
        organizationId: org.id,
        name: org.name,
        city: b.city,
        state: b.state,
      });
    }
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

/**
 * Distribute a general location enquiry (without a selected vehicle) to all eligible vendors
 * whose approved branches match the requested location.
 * Ensures:
 * - Correct location matching
 * - Correct vendor eligibility (only approved organizations with approved branches)
 * - Zero duplicate assignments per vendor
 * - Notifications sent to each assigned vendor
 */
export async function distributeGeneralLocationLead(params: {
  leadId: string;
  pickupCity: string;
  customerName: string;
  startDate?: string;
  endDate?: string;
  message?: string;
}): Promise<{ matchedVendors: MatchingVendor[]; assignedCount: number }> {
  const { leadId, pickupCity, customerName, startDate, endDate } = params;
  const supabase = createAdminClient();

  const eligibleVendors = await findEligibleVendorsForLocation(pickupCity);
  const assignmentsTable = supabase.from("lead_vendor_assignments");

  let assignedCount = 0;
  const assignedOrgIds = new Set<string>();

  for (const vendor of eligibleVendors) {
    if (assignedOrgIds.has(vendor.organizationId)) continue;
    assignedOrgIds.add(vendor.organizationId);

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
        assignedCount++;

        // Dashboard notification for matching vendor
        const dateRange = startDate && endDate ? ` (${startDate} to ${endDate})` : "";
        await supabase.from("notifications").insert({
          organization_id: vendor.organizationId,
          title: "New Location Lead",
          message: `${customerName} is looking for a rental vehicle in ${pickupCity}${dateRange}.`,
          type: "info",
          link: `/vendor/leads`,
        }).then(({ error: notifErr }) => {
          if (notifErr) console.warn("[Location Distribution] Notification error:", notifErr.message);
        });
      }
    } catch (err) {
      console.warn("[Location Distribution] Error assigning vendor:", err);
    }
  }

  return {
    matchedVendors: eligibleVendors,
    assignedCount,
  };
}
