import { publishDailyBlog } from "../src/lib/blog/publish-daily";

async function main() {
  console.log("Starting daily blog generation...");
  const result = await publishDailyBlog();
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
