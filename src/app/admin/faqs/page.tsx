import { requireAdmin } from "@/lib/security/auth";
import { getFaqs } from "@/lib/data/faqs";
import { MessageCircleQuestion, Plus, Trash2, Edit2 } from "lucide-react";
import { createFaq, updateFaq, deleteFaq } from "./actions";
import { ActionButton } from "@/components/admin/action-button";

export const metadata = { title: "Manage FAQs" };

export default async function AdminFaqsPage() {
  await requireAdmin();
  const faqCategories = await getFaqs();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircleQuestion className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold">Manage FAQs</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Create, edit, and categorize Frequently Asked Questions displayed on the public FAQ page.
        </p>
      </div>

      <form action={createFaq} className="rounded-2xl border border-border bg-card p-6 grid gap-4 md:grid-cols-2">
        <h2 className="md:col-span-2 text-lg font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add New FAQ
        </h2>
        
        <div>
          <label className="text-sm font-medium">Category</label>
          <input 
            name="category" 
            placeholder="e.g. For Customers" 
            required 
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Sort Order (lower appears first)</label>
          <input 
            name="sortOrder" 
            type="number" 
            defaultValue="0" 
            required 
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Question</label>
          <input 
            name="question" 
            placeholder="What is..." 
            required 
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium">Answer</label>
          <textarea 
            name="answer" 
            rows={4} 
            placeholder="Provide the detailed answer..." 
            required 
            className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
          />
        </div>

        <button type="submit" className="md:col-span-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground mt-2 w-fit">
          Add FAQ
        </button>
      </form>

      <div className="space-y-6">
        {faqCategories.map((category) => (
          <div key={category.category} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
              <h3 className="font-bold text-lg">{category.category}</h3>
            </div>
            <div className="divide-y divide-border">
              {category.questions.map((faq) => (
                <div key={faq.id} className="p-6">
                  <form action={updateFaq} className="grid gap-4 md:grid-cols-2">
                    <input type="hidden" name="id" value={faq.id} />
                    
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <input 
                        name="category" 
                        defaultValue={category.category} 
                        required 
                        className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Sort Order</label>
                      <input 
                        name="sortOrder" 
                        type="number" 
                        defaultValue={faq.sort_order} 
                        required 
                        className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Question</label>
                      <input 
                        name="question" 
                        defaultValue={faq.q} 
                        required 
                        className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-medium">Answer</label>
                      <textarea 
                        name="answer" 
                        rows={3} 
                        defaultValue={faq.a} 
                        required 
                        className="mt-1 w-full rounded-lg border border-input px-3 py-2 text-sm" 
                      />
                    </div>

                    <div className="md:col-span-2 flex items-center gap-3">
                      <button type="submit" className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        <Edit2 className="h-4 w-4" /> Save Changes
                      </button>
                      <ActionButton
                        action={deleteFaq.bind(null, faq.id)}
                        label="Delete"
                        loadingLabel="Deleting..."
                        variant="destructive"
                        className="rounded-lg px-4 py-2 text-sm font-medium"
                      />
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}

        {faqCategories.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
            No FAQs found. Add one above.
          </div>
        )}
      </div>
    </div>
  );
}
