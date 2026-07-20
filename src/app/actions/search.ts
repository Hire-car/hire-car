"use server";

import { createTypesenseClient } from "@/lib/search/typesense";

export async function getScopedSearchKey() {
  const client = createTypesenseClient();
  if (!client) {
    return null;
  }

  // Generate a key that can only perform searches and only see approved vehicles
  const searchOnlyApiKey = client.keys().generateScopedSearchKey(
    process.env.TYPESENSE_API_KEY!,
    { filter_by: "status:=approved" }
  );

  return {
    apiKey: searchOnlyApiKey,
    host: process.env.TYPESENSE_HOST,
    port: process.env.TYPESENSE_PORT ?? "443",
    protocol: process.env.TYPESENSE_PROTOCOL ?? "https",
  };
}
