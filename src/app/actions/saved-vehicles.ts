"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function toggleSavedVehicle(vehicleId: string) {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("saved_vehicles")
    .select("id")
    .eq("user_id", user.id)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("saved_vehicles").delete().eq("id", existing.id);
    if (error) throw new Error(error.message);
    revalidatePath("/customer/saved");
    return { saved: false };
  }

  const { error } = await supabase.from("saved_vehicles").insert({
    user_id: user.id,
    vehicle_id: vehicleId,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/customer/saved");
  return { saved: true };
}
