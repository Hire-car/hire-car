import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
};

export type FaqCategory = {
  category: string;
  questions: {
    id: string;
    q: string;
    a: string;
    sort_order: number;
  }[];
};

export const getFaqs = unstable_cache(
  async function getFaqs(): Promise<FaqCategory[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("faqs")
      .select("*")
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });
      
    if (error || !data) {
      console.error("Error fetching FAQs:", error?.message);
      return [];
    }

    const grouped = data.reduce((acc: FaqCategory[], curr: any) => {
      let cat = acc.find((c) => c.category === curr.category);
      if (!cat) {
        cat = { category: curr.category, questions: [] };
        acc.push(cat);
      }
      cat.questions.push({
        id: curr.id,
        q: curr.question,
        a: curr.answer,
        sort_order: curr.sort_order,
      });
      return acc;
    }, []);

    return grouped;
  },
  ["faqs"],
  { tags: ["faqs"], revalidate: 3600 }
);
