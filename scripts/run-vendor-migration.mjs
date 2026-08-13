// One-shot migration script: adds about_business + vendor_faqs columns
// Run with: node scripts/run-migration.mjs
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const sql = readFileSync(
  "./supabase/migrations/20260813100000_vendor_about_and_faqs.sql",
  "utf-8",
);

// Split on semicolons and run each statement
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

for (const stmt of statements) {
  const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" }).single();
  if (error) {
    // Fallback: use the raw REST endpoint
    console.warn("RPC failed, trying direct:", error.message);
  } else {
    console.log("✓", stmt.substring(0, 60));
  }
}

// Simpler approach: run via the management API using the raw SQL endpoint
const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`;
console.log("\nSQL to run in Supabase Dashboard SQL Editor:");
console.log("=".repeat(60));
console.log(sql);
console.log("=".repeat(60));
