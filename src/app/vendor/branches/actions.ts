/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVendorContext, ensureUserCanManageOrganization } from "@/lib/data/vendor";
import { getBranchLimit, getOrganizationPlanCode } from "@/lib/plan-features";
import { requireUser } from "@/lib/security/auth";
import { uniqueSlug } from "@/lib/slug";
import { branchSchema, transferBranchSchema } from "@/lib/validation/schemas";
import { invalidatePseo } from "@/lib/seo/invalidate";
import { sendBranchTransferInitiatedEmail, sendBranchTransferReceivedEmail } from "@/lib/email/ses";
import { processSearchIndexJobs } from "@/lib/search/typesense";

export async function createBranch(prevState: any, formData: FormData) {
  const user = await requireUser();
  const payloadResult = branchSchema.safeParse({
    organizationId: formData.get("organizationId"),
    name: formData.get("name"),
    city: formData.get("city"),
    state: formData.get("state"),
    address: formData.get("address"),
    phone: formData.get("phone") || "",
    whatsapp: formData.get("whatsapp") || "",
  });

  if (!payloadResult.success) {
    return { error: "Invalid form data. Please check your inputs." };
  }
  
  const payload = payloadResult.data;

  try {
    await ensureUserCanManageOrganization(user.id, payload.organizationId);

    const supabase = createAdminClient();
    const planCode = await getOrganizationPlanCode(payload.organizationId);
    const branchLimit = getBranchLimit(planCode);

    if (branchLimit !== null) {
      const { count } = await supabase
        .from("branches")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", payload.organizationId);

      if ((count ?? 0) >= branchLimit) {
        return { error: `Your ${planCode ?? "current"} plan allows up to ${branchLimit} branch(es). Please upgrade to add more.` };
      }
    }

    const { error } = await supabase.from("branches").insert({
      organization_id: payload.organizationId,
      name: payload.name,
      slug: uniqueSlug(`${payload.name} ${payload.city}`),
      city: payload.city,
      state: payload.state,
      address: payload.address,
      phone: payload.phone || null,
      whatsapp: payload.whatsapp || null,
      status: "approved",
    });

    if (error) {
      return { error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_created",
      resource_type: "organization",
      resource_id: payload.organizationId,
      metadata: { name: payload.name, city: payload.city },
    });

    revalidatePath("/vendor/branches");
    await invalidatePseo({ city: payload.city });
    
    return { error: null, success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create branch." };
  }
}

export async function getCurrentVendorContext() {
  const user = await requireUser();
  return getVendorContext(user.id);
}

export async function updateBranch(prevState: any, formData: FormData) {
  const user = await requireUser();
  const branchId = formData.get("id") as string;
  const organizationId = formData.get("organizationId") as string;
  
  const payloadResult = branchSchema.safeParse({
    organizationId,
    name: formData.get("name"),
    city: formData.get("city"),
    state: formData.get("state"),
    address: formData.get("address"),
    phone: formData.get("phone") || "",
    whatsapp: formData.get("whatsapp") || "",
  });

  if (!payloadResult.success) {
    return { error: "Invalid form data. Please check your inputs." };
  }
  
  const payload = payloadResult.data;

  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("branches")
      .update({
        name: payload.name,
        city: payload.city,
        state: payload.state,
        address: payload.address,
        phone: payload.phone || null,
        whatsapp: payload.whatsapp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", branchId)
      .eq("organization_id", organizationId);

    if (error) {
      return { error: error.message };
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_updated",
      resource_type: "organization",
      resource_id: organizationId,
      metadata: { branch_id: branchId, name: payload.name, city: payload.city },
    });

    revalidatePath("/vendor/branches");
    await invalidatePseo({ city: payload.city });
    
    return { error: null, success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update branch." };
  }
}

export async function deleteBranch(branchId: string, organizationId: string) {
  const user = await requireUser();
  
  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branchId)
      .eq("organization_id", organizationId);

    if (error) {
      if (error.code === '23503') {
        throw new Error("Cannot delete branch because it has vehicles assigned to it. Please reassign or delete the vehicles first.");
      }
      throw new Error(error.message);
    }

    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_deleted",
      resource_type: "organization",
      resource_id: organizationId,
      metadata: { branch_id: branchId },
    });

    revalidatePath("/vendor/branches");
    return { success: true };
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to delete branch.");
  }
}

export async function transferBranch(formData: FormData) {
  const user = await requireUser();
  const supabase = createAdminClient();

  const organizationId = formData.get("organizationId") as string;
  
  if (!organizationId) {
    return { error: "Organization ID is required." };
  }

  // Verify the vendor owns the branch they are transferring
  try {
    await ensureUserCanManageOrganization(user.id, organizationId);
  } catch (err) {
    return { error: "Unauthorized to manage this organization." };
  }

  const parsed = transferBranchSchema.safeParse({
    branchId: formData.get("branchId"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    abn: formData.get("abn"),
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    website: formData.get("website") || "",
    // Vendors cannot auto-approve.
    approveImmediately: false,
  });

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map(i => i.message).join(", ");
    return { error: `Invalid form data: ${errorMessages}` };
  }

  const payload = parsed.data;

  try {
    // 1. Check if the branch actually belongs to the user's organization
    const { data: branchCheck, error: branchCheckError } = await supabase
      .from("branches")
      .select("id, name, organizations!inner(name)")
      .eq("id", payload.branchId)
      .eq("organization_id", organizationId)
      .single();

    if (branchCheckError || !branchCheck) {
      return { error: "Branch not found or does not belong to your organization." };
    }

    // 2. Check if profile exists by email
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.email)
      .single();

    let targetUserId = existingProfile?.id;

    if (!targetUserId) {
      // Invite new user
      const { data: authData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(payload.email, {
        data: { full_name: payload.businessName },
      });

      if (inviteError || !authData.user) {
        return { error: inviteError?.message || "Failed to invite user." };
      }
      
      targetUserId = authData.user.id;
      
      // Create their profile
      await supabase.from("profiles").upsert({
        id: targetUserId,
        email: payload.email,
        full_name: payload.businessName,
        phone: payload.phone || null,
      });
    }

    // 3. Create new organization
    const orgSlug = uniqueSlug(payload.businessName);
    
    const { data: newOrganization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: payload.businessName,
        slug: orgSlug,
        abn: payload.abn,
        billing_email: payload.email,
        website: payload.website || null,
        phone: payload.phone || null,
        address: payload.address || null,
        status: "pending", // Always pending for vendor-initiated transfers
      })
      .select("id")
      .single();

    if (orgError || !newOrganization) {
      return { error: orgError?.message || "Failed to create new organization." };
    }

    // 4. Add new owner to organization
    await supabase.from("organization_members").insert({
      organization_id: newOrganization.id,
      user_id: targetUserId,
      role: "owner",
    });

    // 5. Re-assign branch
    const { error: branchError } = await supabase
      .from("branches")
      .update({ 
        organization_id: newOrganization.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.branchId);

    if (branchError) {
      return { error: branchError.message };
    }

    // 6. Transfer associated vehicles to the new organization
    const { data: transferredVehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .update({ organization_id: newOrganization.id })
      .eq("branch_id", payload.branchId)
      .select("id");

    if (vehiclesError) {
      return { error: "Branch was transferred, but failed to re-assign associated vehicles: " + vehiclesError.message };
    }

    // 7. Enqueue search index jobs for the transferred vehicles
    if (transferredVehicles && transferredVehicles.length > 0) {
      const jobs = transferredVehicles.map(v => ({
        vehicle_id: v.id,
        operation: "upsert",
        status: "pending"
      }));
      await supabase.from("search_index_jobs").insert(jobs).then(() => {
        processSearchIndexJobs().catch(console.error);
      });
    }

    // 8. Log audit event
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_transferred_by_vendor",
      resource_type: "branch",
      resource_id: payload.branchId,
      metadata: { 
        previous_org_id: organizationId,
        new_org_id: newOrganization.id,
        new_owner: payload.email,
        vehicles_transferred: transferredVehicles?.length || 0
      },
    });

    // 9. Send Email Notifications
    const branchName = branchCheck.name;
    const vendorName = (branchCheck.organizations as unknown as { name: string }).name;

    await Promise.allSettled([
      sendBranchTransferInitiatedEmail({
        to: user.email!,
        vendorName: vendorName,
        branchName: branchName,
        newOwnerEmail: payload.email,
        newBusinessName: payload.businessName,
      }),
      sendBranchTransferReceivedEmail({
        to: payload.email,
        newBusinessName: payload.businessName,
        branchName: branchName,
      }),
    ]);

    revalidatePath("/vendor/branches");
    
    return { success: true };
  } catch (err: any) {
    console.error("Transfer branch error:", err);
    return { error: err.message || "An unexpected error occurred during transfer." };
  }
}
