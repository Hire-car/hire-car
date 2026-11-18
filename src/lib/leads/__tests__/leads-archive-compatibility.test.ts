import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

/**
 * Interface representing public.leads record
 */
interface LeadRecord {
  id: string;
  vendor_id: string | null;
  vehicle_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_city: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: "new" | "contacted" | "converted" | "lost";
  ip_hash: string | null;
  customer_user_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface representing public.leads_archive record
 */
interface LeadsArchiveRecord {
  id: string;
  vendor_id: string | null;
  vehicle_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  pickup_city: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string;
  ip_hash: string | null;
  customer_user_id: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string;
  archive_reason: string;
}

/**
 * Simulates the exact behavior of app_private.archive_old_leads(p_days_old)
 * as defined in supabase/migrations/20260618120000_add_customer_user_id_to_leads.sql:
 *
 * with archived as (
 *   delete from public.leads
 *   where created_at < v_cutoff_date
 *     and status in ('new', 'contacted', 'lost')
 *   returning *
 * )
 * insert into public.leads_archive (
 *   id, vendor_id, vehicle_id, customer_name, customer_email, customer_phone,
 *   pickup_city, start_date, end_date, message, status, ip_hash, created_at, updated_at,
 *   archived_at, archive_reason, customer_user_id
 * )
 * select ...
 */
function simulateArchiveOldLeads(
  leadsStore: LeadRecord[],
  archiveStore: LeadsArchiveRecord[],
  cutoffDate: Date,
  schemaConstraints: { vehicleIdNullable: boolean; vendorIdNullable: boolean },
): { archivedCount: number } {
  const eligibleLeads = leadsStore.filter(
    (lead) =>
      new Date(lead.created_at) < cutoffDate &&
      ["new", "contacted", "lost"].includes(lead.status),
  );

  for (const lead of eligibleLeads) {
    // Check NOT NULL constraints on leads_archive
    if (!schemaConstraints.vehicleIdNullable && lead.vehicle_id === null) {
      throw new Error(
        'null value in column "vehicle_id" of relation "leads_archive" violates not-null constraint',
      );
    }
    if (!schemaConstraints.vendorIdNullable && lead.vendor_id === null) {
      throw new Error(
        'null value in column "vendor_id" of relation "leads_archive" violates not-null constraint',
      );
    }

    // Insert into leads_archive
    archiveStore.push({
      id: lead.id,
      vendor_id: lead.vendor_id,
      vehicle_id: lead.vehicle_id,
      customer_name: lead.customer_name,
      customer_email: lead.customer_email,
      customer_phone: lead.customer_phone,
      pickup_city: lead.pickup_city,
      start_date: lead.start_date,
      end_date: lead.end_date,
      message: lead.message,
      status: lead.status,
      ip_hash: lead.ip_hash,
      customer_user_id: lead.customer_user_id,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
      archived_at: new Date().toISOString(),
      archive_reason: "expired after 90 days",
    });

    // Remove from active leads
    const idx = leadsStore.findIndex((l) => l.id === lead.id);
    if (idx !== -1) {
      leadsStore.splice(idx, 1);
    }
  }

  return { archivedCount: eligibleLeads.length };
}

describe("Leads Archive Schema Compatibility", () => {
  it("verifies migration SQL contains the required DDL fix for public.leads_archive", () => {
    const migrationPath = path.resolve(
      process.cwd(),
      "supabase/migrations/20261117110000_lead_vendor_assignments.sql",
    );
    const content = fs.readFileSync(migrationPath, "utf-8");

    // Must alter public.leads to drop NOT NULL on vehicle_id and vendor_id
    expect(content).toMatch(/alter\s+table\s+public\.leads[\s\S]*?alter\s+column\s+vehicle_id\s+drop\s+not\s+null/i);
    expect(content).toMatch(/alter\s+table\s+public\.leads[\s\S]*?alter\s+column\s+vendor_id\s+drop\s+not\s+null/i);

    // Must align public.leads_archive by dropping NOT NULL on vehicle_id and vendor_id
    expect(content).toMatch(/alter\s+table\s+public\.leads_archive[\s\S]*?alter\s+column\s+vehicle_id\s+drop\s+not\s+null/i);
    expect(content).toMatch(/alter\s+table\s+public\.leads_archive[\s\S]*?alter\s+column\s+vendor_id\s+drop\s+not\s+null/i);
  });

  it("verifies normal vehicle-specific enquiries archive correctly under both schemas", () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
    const leads: LeadRecord[] = [
      {
        id: "lead-vehicle-1",
        vendor_id: "org-1111-2222-3333",
        vehicle_id: "veh-4444-5555-6666",
        customer_name: "John Doe",
        customer_email: "john@example.com",
        customer_phone: "+61412345678",
        pickup_city: "Sydney",
        start_date: "2026-08-01",
        end_date: "2026-08-05",
        message: "Booking enquiry for SUV",
        status: "lost",
        ip_hash: "hash123",
        customer_user_id: "user-7777",
        created_at: ninetyOneDaysAgo,
        updated_at: ninetyOneDaysAgo,
      },
    ];

    const archive: LeadsArchiveRecord[] = [];
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Normal vehicle enquiry works even when columns are NOT NULL
    const resultStrict = simulateArchiveOldLeads(
      [...leads],
      archive,
      cutoffDate,
      { vehicleIdNullable: false, vendorIdNullable: false },
    );
    expect(resultStrict.archivedCount).toBe(1);
    expect(archive.length).toBe(1);
    expect(archive[0].id).toBe("lead-vehicle-1");
    expect(archive[0].vehicle_id).toBe("veh-4444-5555-6666");
    expect(archive[0].vendor_id).toBe("org-1111-2222-3333");

    // Normal vehicle enquiry also continues to work cleanly under the updated nullable schema
    archive.length = 0;
    const resultUpdated = simulateArchiveOldLeads(
      [...leads],
      archive,
      cutoffDate,
      { vehicleIdNullable: true, vendorIdNullable: true },
    );
    expect(resultUpdated.archivedCount).toBe(1);
    expect(archive.length).toBe(1);
    expect(archive[0].vehicle_id).toBe("veh-4444-5555-6666");
    expect(archive[0].vendor_id).toBe("org-1111-2222-3333");
  });

  it("proves general location lead fails under unmigrated schema and succeeds under updated schema", () => {
    const ninetyOneDaysAgo = new Date(Date.now() - 91 * 24 * 60 * 60 * 1000).toISOString();
    const generalLocationLead: LeadRecord = {
      id: "lead-general-loc-1",
      vendor_id: null,
      vehicle_id: null,
      customer_name: "Jane Smith",
      customer_email: "jane@example.com",
      customer_phone: "+61498765432",
      pickup_city: "Melbourne",
      start_date: "2026-08-10",
      end_date: "2026-08-14",
      message: "Looking for rental in Melbourne",
      status: "contacted",
      ip_hash: "hash456",
      customer_user_id: null,
      created_at: ninetyOneDaysAgo,
      updated_at: ninetyOneDaysAgo,
    };

    const archive: LeadsArchiveRecord[] = [];
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // 1. Under unmigrated schema (strict NOT NULL), archiving throws a constraint violation
    expect(() => {
      simulateArchiveOldLeads(
        [{ ...generalLocationLead }],
        archive,
        cutoffDate,
        { vehicleIdNullable: false, vendorIdNullable: false },
      );
    }).toThrow('null value in column "vehicle_id" of relation "leads_archive" violates not-null constraint');

    // 2. Under updated schema (nullable columns from 20261117110000), archiving succeeds
    archive.length = 0;
    const leads = [{ ...generalLocationLead }];
    const result = simulateArchiveOldLeads(
      leads,
      archive,
      cutoffDate,
      { vehicleIdNullable: true, vendorIdNullable: true },
    );

    expect(result.archivedCount).toBe(1);
    expect(archive.length).toBe(1);
    expect(archive[0].id).toBe("lead-general-loc-1");
    expect(archive[0].vehicle_id).toBeNull();
    expect(archive[0].vendor_id).toBeNull();
    expect(archive[0].customer_name).toBe("Jane Smith");
    expect(archive[0].pickup_city).toBe("Melbourne");
    expect(archive[0].archive_reason).toBe("expired after 90 days");

    // Verify lead was deleted from active leads store
    expect(leads.length).toBe(0);
  });

  it("successfully archives mixed batches of vehicle-specific and general location leads", () => {
    const ninetyFiveDaysAgo = new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString();
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const mixedLeads: LeadRecord[] = [
      {
        id: "lead-veh-old",
        vendor_id: "org-1",
        vehicle_id: "veh-1",
        customer_name: "Customer One",
        customer_email: "c1@example.com",
        customer_phone: "+61411111111",
        pickup_city: "Sydney",
        start_date: "2026-07-01",
        end_date: "2026-07-05",
        message: null,
        status: "lost",
        ip_hash: null,
        customer_user_id: "usr-1",
        created_at: ninetyFiveDaysAgo,
        updated_at: ninetyFiveDaysAgo,
      },
      {
        id: "lead-gen-old",
        vendor_id: null,
        vehicle_id: null,
        customer_name: "Customer Two",
        customer_email: "c2@example.com",
        customer_phone: "+61422222222",
        pickup_city: "Perth",
        start_date: "2026-07-10",
        end_date: "2026-07-15",
        message: "Perth rental",
        status: "new",
        ip_hash: null,
        customer_user_id: null,
        created_at: ninetyFiveDaysAgo,
        updated_at: ninetyFiveDaysAgo,
      },
      {
        id: "lead-recent",
        vendor_id: "org-2",
        vehicle_id: "veh-2",
        customer_name: "Customer Three",
        customer_email: "c3@example.com",
        customer_phone: "+61433333333",
        pickup_city: "Melbourne",
        start_date: "2026-11-01",
        end_date: "2026-11-05",
        message: null,
        status: "new",
        ip_hash: null,
        customer_user_id: null,
        created_at: tenDaysAgo,
        updated_at: tenDaysAgo,
      },
    ];

    const archive: LeadsArchiveRecord[] = [];
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const result = simulateArchiveOldLeads(
      mixedLeads,
      archive,
      cutoffDate,
      { vehicleIdNullable: true, vendorIdNullable: true },
    );

    // Only the two leads older than 90 days are archived
    expect(result.archivedCount).toBe(2);
    expect(archive.length).toBe(2);

    const archivedIds = archive.map((a) => a.id);
    expect(archivedIds).toContain("lead-veh-old");
    expect(archivedIds).toContain("lead-gen-old");
    expect(archivedIds).not.toContain("lead-recent");

    // Only the recent lead remains in active leads
    expect(mixedLeads.length).toBe(1);
    expect(mixedLeads[0].id).toBe("lead-recent");
  });
});
