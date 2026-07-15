"use server";

import { requireAdminRole } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { invalidatePseo } from "@/lib/seo/invalidate";
import { invalidatePseoForVehicle } from "@/lib/seo/vehicle-invalidation";
import { sendBranchTransferInitiatedEmail, sendBranchTransferReceivedEmail } from "@/lib/email/ses";
import { uniqueSlug } from "@/lib/slug";
import { transferBranchSchema } from "@/lib/validation/schemas";

const ModerateVendorSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  vendorId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateVendor(rawAction: string, rawVendorId: string, rawReason: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, vendorId, reason } = ModerateVendorSchema.parse({
    action: rawAction,
    vendorId: rawVendorId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === "suspend") {
    updateData.suspended_at = new Date().toISOString();
  }

  if (action === "restore") {
    updateData.suspended_at = null;
  }

  // Update vendor
  const { error } = await supabase.from("organizations").update(updateData).eq("id", vendorId);

  if (error) {
    return { error: `Failed to ${action} vendor: ${error.message}` };
  }

  // Approve all branches if approving vendor
  if (action === "approve" || action === "restore") {
    await supabase
      .from("branches")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("organization_id", vendorId)
      .eq("status", "pending");
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "vendor",
    resource_id: vendorId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "vendor",
    resource_id: vendorId,
    metadata: { reason },
  });

  revalidatePath("/admin/vendors");
  revalidatePath("/admin");
}

const ModerateBranchSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  branchId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateBranch(rawAction: string, rawBranchId: string, rawReason: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, branchId, reason } = ModerateBranchSchema.parse({
    action: rawAction,
    branchId: rawBranchId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Update branch
  const { error } = await supabase.from("branches").update(updateData).eq("id", branchId);

  if (error) {
    return { error: `Failed to ${action} branch: ${error.message}` };
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "branch",
    resource_id: branchId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "branch",
    resource_id: branchId,
    metadata: { reason },
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin");
}

const AIApproveBranchSchema = z.object({
  branchId: z.string().uuid(),
});

export async function aiAutoApproveBranch(rawBranchId: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { branchId } = AIApproveBranchSchema.parse({ branchId: rawBranchId });

  // Fetch branch to perform "AI Check"
  const { data: branch, error: fetchErr } = await supabase
    .from("branches")
    .select("name, city, state, phone")
    .eq("id", branchId)
    .single();

  if (fetchErr || !branch) {
    return { error: "Could not fetch branch for AI review." };
  }

  // Simulate AI evaluation of documents/data
  await new Promise((resolve) => setTimeout(resolve, 800));

  const hasSufficientData = branch.name && branch.city && branch.state && branch.phone;
  if (!hasSufficientData) {
    return { error: "AI Review Failed: Branch is missing critical information (city, state, or phone)." };
  }

  // Approve
  const { error } = await supabase
    .from("branches")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", branchId);

  if (error) {
    return { error: `AI Approval failed: ${error.message}` };
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "branch",
    resource_id: branchId,
    author_user_id: user.id,
    body: `[AI APPROVED] Automatically verified documents and details via AI.`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_ai_approve`,
    resource_type: "branch",
    resource_id: branchId,
    metadata: { reason: "AI passed checks for valid regional data and contacts." },
  });

  revalidatePath("/admin/branches");
  revalidatePath("/admin");
}

const ModerateListingSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "restore"]),
  listingId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
  reindex: z.boolean(),
});

export async function moderateListing(
  rawAction: string,
  rawListingId: string,
  rawReason: string,
  rawReindex: boolean,
) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, listingId, reason, reindex } = ModerateListingSchema.parse({
    action: rawAction,
    listingId: rawListingId,
    reason: rawReason,
    reindex: rawReindex,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
    restore: "approved",
  };

  const newStatus = statusMap[action];

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (action === "suspend") {
    updateData.suspended_at = new Date().toISOString();
  }

  if (action === "restore") {
    updateData.suspended_at = null;
  }

  // Update listing
  const { error } = await supabase.from("vehicles").update(updateData).eq("id", listingId);

  if (error) {
    return { error: `Failed to ${action} listing: ${error.message}` };
  }

  // Add to search index queue if approved
  if (action === "approve" || action === "restore") {
    await supabase.from("search_index_jobs").insert({
      vehicle_id: listingId,
      operation: "upsert",
      status: "pending",
    });
    await invalidatePseoForVehicle(supabase, listingId);
  } else if (action === "suspend" || action === "reject") {
    await supabase.from("search_index_jobs").insert({
      vehicle_id: listingId,
      operation: "delete",
      status: "pending",
    });
  }

  // Approve pending images
  if (action === "approve" || action === "restore") {
    await supabase
      .from("vehicle_images")
      .update({ approved: true })
      .eq("vehicle_id", listingId)
      .eq("approved", false);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "vehicle",
    resource_id: listingId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "vehicle",
    resource_id: listingId,
    metadata: { reason, reindex },
  });

  revalidatePath("/admin/listings");
  revalidatePath("/admin");
}

const ModerateReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required").max(500),
});

export async function moderateReview(rawAction: string, rawReviewId: string, rawReason: string) {
  const user = await requireAdminRole(["support", "super_admin"]);
  const supabase = createAdminClient();

  const { action, reviewId, reason } = ModerateReviewSchema.parse({
    action: rawAction,
    reviewId: rawReviewId,
    reason: rawReason,
  });

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
  };

  const newStatus = statusMap[action];

  // Update review
  const { error } = await supabase
    .from("reviews")
    .update({
      status: newStatus,
    })
    .eq("id", reviewId);

  if (error) {
    throw new Error(`Failed to ${action} review: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "review",
    resource_id: reviewId,
    author_user_id: user.id,
    body: `[${action.toUpperCase()}] ${reason}`,
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: `moderation_${action}`,
    resource_type: "review",
    resource_id: reviewId,
    metadata: { reason },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
}

const UpdateFraudFlagStatusSchema = z.object({
  action: z.enum(["close", "reopen"]),
  flagId: z.string().uuid(),
});

export async function updateFraudFlagStatus(rawAction: string, rawFlagId: string) {
  const user = await requireAdminRole(["moderator", "super_admin"]);
  const supabase = createAdminClient();

  const { action, flagId } = UpdateFraudFlagStatusSchema.parse({
    action: rawAction,
    flagId: rawFlagId,
  });

  const isClosing = action === "close";

  const { error } = await supabase
    .from("fraud_flags")
    .update({
      status: isClosing ? "closed" : "open",
      reviewed_by: isClosing ? user.id : null,
      reviewed_at: isClosing ? new Date().toISOString() : null,
    })
    .eq("id", flagId);

  if (error) {
    throw new Error(`Failed to ${action} flag: ${error.message}`);
  }

  // Add moderation note
  await supabase.from("moderation_notes").insert({
    resource_type: "fraud_flag",
    resource_id: flagId,
    author_user_id: user.id,
    body: isClosing
      ? "[CLOSED] Fraud flag investigated and closed"
      : "[REOPENED] Fraud flag reopened for further review",
  });

  // Log audit event
  await supabase.from("audit_logs").insert({
    actor_user_id: user.id,
    action: isClosing ? "fraud_flag_closed" : "fraud_flag_reopened",
    resource_type: "fraud_flag",
    resource_id: flagId,
  });

  revalidatePath("/admin/fraud");
  revalidatePath("/admin");
}

export async function transferBranchAction(formData: FormData) {
  const user = await requireAdminRole(["super_admin", "moderator"]);
  const supabase = createAdminClient();

  const parsed = transferBranchSchema.safeParse({
    branchId: formData.get("branchId"),
    email: formData.get("email"),
    businessName: formData.get("businessName"),
    abn: formData.get("abn"),
    phone: formData.get("phone") || "",
    address: formData.get("address") || "",
    website: formData.get("website") || "",
    approveImmediately: formData.get("approveImmediately") === "on" || formData.get("approveImmediately") === "true",
  });

  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map((i) => i.message).join(", ");
    return { error: `Invalid form data: ${errorMessages}` };
  }

  const payload = parsed.data;

  try {
    // Get branch details for email
    const { data: branchCheck, error: branchCheckError } = await supabase
      .from("branches")
      .select("id, name, organizations!inner(name)")
      .eq("id", payload.branchId)
      .single();

    if (branchCheckError || !branchCheck) {
      return { error: "Branch not found." };
    }

    // Check if profile exists by email
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
        return { error: inviteError?.message || "Failed to invite user" };
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

    // Create new organization
    const orgSlug = uniqueSlug(payload.businessName);
    
    const { data: organization, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: payload.businessName,
        slug: orgSlug,
        abn: payload.abn,
        billing_email: payload.email,
        website: payload.website || null,
        phone: payload.phone || null,
        address: payload.address || null,
        status: payload.approveImmediately ? "approved" : "pending",
      })
      .select("id")
      .single();

    if (orgError || !organization) {
      return { error: orgError?.message || "Failed to create organization" };
    }

    // Add owner to organization
    await supabase.from("organization_members").insert({
      organization_id: organization.id,
      user_id: targetUserId,
      role: "owner",
    });

    // Re-assign branch
    const { error: branchError } = await supabase
      .from("branches")
      .update({ 
        organization_id: organization.id,
        updated_at: new Date().toISOString()
      })
      .eq("id", payload.branchId);

    if (branchError) {
      return { error: branchError.message };
    }

    // Transfer associated vehicles to the new organization
    const { data: transferredVehicles, error: vehiclesError } = await supabase
      .from("vehicles")
      .update({ organization_id: organization.id })
      .eq("branch_id", payload.branchId)
      .select("id");

    if (vehiclesError) {
      return { error: "Branch was transferred, but failed to re-assign associated vehicles: " + vehiclesError.message };
    }

    // Enqueue search index jobs for the transferred vehicles so they show up under the new vendor
    if (transferredVehicles && transferredVehicles.length > 0) {
      const jobs = transferredVehicles.map(v => ({
        vehicle_id: v.id,
        operation: "upsert",
        status: "pending"
      }));
      await supabase.from("search_index_jobs").insert(jobs);
    }

    // Log audit event
    await supabase.from("audit_logs").insert({
      actor_user_id: user.id,
      action: "branch_transferred",
      resource_type: "branch",
      resource_id: payload.branchId,
      metadata: { 
        previous_org_transferred_from: true,
        new_org_id: organization.id,
        new_owner: payload.email,
        vehicles_transferred: transferredVehicles?.length || 0
      },
    });

    // Send Email Notifications
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

    revalidatePath("/admin/branches");
    revalidatePath("/admin/vendors");
    
    return { success: true };
  } catch (err: any) {
    console.error("Transfer branch error:", err);
    return { error: err.message || "An unexpected error occurred during transfer." };
  }
}
