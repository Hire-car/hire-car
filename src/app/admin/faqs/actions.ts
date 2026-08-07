"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/security/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createFaq(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const category = String(formData.get("category") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  if (!category || !question || !answer) {
    throw new Error("Category, question, and answer are required.");
  }

  const { error } = await supabase.from("faqs").insert({
    category,
    question,
    answer,
    sort_order: isNaN(sortOrder) ? 0 : sortOrder,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
}

export async function updateFaq(formData: FormData) {
  await requireAdmin();
  const supabase = createAdminClient();

  const id = String(formData.get("id") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  const sortOrder = parseInt(String(formData.get("sortOrder") ?? "0"), 10);

  if (!id || !category || !question || !answer) {
    throw new Error("ID, category, question, and answer are required.");
  }

  const { error } = await supabase
    .from("faqs")
    .update({
      category,
      question,
      answer,
      sort_order: isNaN(sortOrder) ? 0 : sortOrder,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
}

export async function deleteFaq(id: string) {
  await requireAdmin();
  const supabase = createAdminClient();

  const { error } = await supabase.from("faqs").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/faq");
  revalidatePath("/admin/faqs");
}
