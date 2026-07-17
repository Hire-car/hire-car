import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuditLogInsert() {
  // Let's try to insert an audit log for an imaginary user to see if FK constraint fails
  const fakeUserId = "00000000-0000-0000-0000-000000000000";
  const { data, error } = await supabase.from("audit_logs").insert({
    actor_user_id: fakeUserId,
    action: "blog_article_created",
    resource_type: "blog_article",
    resource_id: "eab13f08-b2f1-4ea0-ac9f-89832b84cfb4",
  });

  console.log("Audit log data:", data);
  console.log("Audit log error:", error);
}

testAuditLogInsert();
