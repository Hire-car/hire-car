import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  const timestamp = Date.now();
  const slug = `untitled-article-${timestamp}`;

  const { data, error } = await supabase
    .from("blog_articles")
    .insert({
      title: "Untitled Article",
      slug: slug,
      excerpt: "Write a short summary here...",
      body: "<p>Start writing your article here...</p>",
      status: "draft",
      source: "manual",
      reading_time_minutes: 1,
    })
    .select("id")
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}

testInsert();
