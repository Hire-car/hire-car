import { NextResponse } from "next/server";
import { createTypesenseClient } from "@/lib/search/typesense";

export const dynamic = "force-dynamic";

export async function GET() {
  const client = createTypesenseClient();
  
  if (!client) {
    return NextResponse.json({ error: "Typesense not configured" }, { status: 500 });
  }

  try {
    const searchApiKey = process.env.TYPESENSE_API_KEY;
    if (!searchApiKey) throw new Error("TYPESENSE_API_KEY missing");

    // Generate a scoped search key that expires in 1 hour (valid_until)
    // and can only read from the 'vehicles' collection.
    const scopedKey = client.keys().generateScopedSearchKey(searchApiKey, {
      filter_by: "",
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    return NextResponse.json({
      apiKey: scopedKey,
      host: process.env.TYPESENSE_HOST,
      port: process.env.TYPESENSE_PORT ?? "443",
      protocol: process.env.TYPESENSE_PROTOCOL ?? "https",
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to generate search key" }, { status: 500 });
  }
}
