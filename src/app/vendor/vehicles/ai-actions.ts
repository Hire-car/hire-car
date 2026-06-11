"use server";

import { generateVehicleAutofill } from "@/lib/ai/vehicle-seo";
import { ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { requirePlanFeature } from "@/lib/plan-features";
import { requireUser } from "@/lib/security/auth";

export async function getVehicleAutofill(input: {
  organizationId: string;
  make: string;
  model: string;
  year: number;
}) {
  const user = await requireUser();
  await ensureUserCanManageOrganization(user.id, input.organizationId);
  await requirePlanFeature(input.organizationId, "aiSeoContent");

  // Input sanitization and guardrails to prevent extremely large inputs or prompt injection
  const make = input.make.trim().substring(0, 50);
  const model = input.model.trim().substring(0, 50);
  const year = Math.max(1950, Math.min(new Date().getFullYear() + 2, input.year));

  if (!make || !model) {
    throw new Error("Make and Model are required for AI generation.");
  }

  const data = await generateVehicleAutofill({ ...input, make, model, year });
  return data;
}
