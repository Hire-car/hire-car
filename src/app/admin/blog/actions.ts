"use server";

import { revalidatePath } from "next/cache";
import { publishDailyBlog } from "@/lib/blog/publish-daily";
import { requireAdminRole } from "@/lib/security/auth";

export type GenerateBlogState = {
  status: "idle" | "success" | "error";
  message: string;
  slug?: string;
  warnings?: string[];
};

export async function triggerDailyBlogGeneration(
  _prev: GenerateBlogState,
  formData: FormData,
): Promise<GenerateBlogState> {
  await requireAdminRole(["owner", "admin"]);

  const intent = formData.get("intent");
  const force = intent === "force";

  try {
    const result = await publishDailyBlog({ force });

    if (!result.ok) {
      return { status: "error", message: result.error ?? "Generation failed" };
    }

    if (result.skipped) {
      return {
        status: "success",
        message: result.reason ?? "Skipped — already published today",
        slug: result.slug,
      };
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    const warningText = result.warnings?.length
      ? ` Warnings: ${result.warnings.join("; ")}`
      : "";

    return {
      status: "success",
      message: `Published: ${result.slug}${warningText}`,
      slug: result.slug,
      warnings: result.warnings,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
