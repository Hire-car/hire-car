import { config } from "dotenv"; 
config({ path: ".env.local" }); 
import { createClient } from "@supabase/supabase-js"; 
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!); 
async function main() { 
  const { data } = await supabase.rpc("get_homepage_city_stats"); 
  console.log("HOMEPAGE STATS:");
  console.log(data); 

  const { data: b } = await supabase.from('branches').select('city, name');
  console.log("BRANCHES:");
  console.log(b);
} 
main();
