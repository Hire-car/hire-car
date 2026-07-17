"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createDraftBlogArticle, type CreateDraftBlogState } from "./actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const initialState: CreateDraftBlogState = { status: "idle", message: "" };

export function CreateBlogButton() {
  const [state, formAction, pending] = useActionState(
    createDraftBlogArticle,
    initialState,
  );
  const router = useRouter();

  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <Button type="submit" disabled={pending} className="gap-2">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        Add New Blog
      </Button>
    </form>
  );
}
