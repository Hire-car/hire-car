"use client";

import { useActionState } from "react";
import { Megaphone, Send } from "lucide-react";

import { sendMarketingCampaign } from "@/app/admin/marketing/actions";
import type { MarketingEmailState } from "@/app/admin/marketing/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: MarketingEmailState = {
  status: "idle",
  message: "",
};

export function MarketingForm() {
  const [state, action, isPending] = useActionState(sendMarketingCampaign, initialState);

  return (
    <Card variant="elevated">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-primary" />
          Compose campaign
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {state.status !== "idle" && (
          <div
            className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
            role="status"
          >
            {state.message}
          </div>
        )}

        <form action={action} className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="audience">Audience</Label>
            <select
              id="audience"
              name="audience"
              defaultValue="admin"
              className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="admin">Admin test inbox</option>
              <option value="manual">Manual recipients</option>
              <option value="accounts">All account emails</option>
              <option value="vendors">Vendor billing emails</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recipients">Manual recipients</Label>
            <Textarea
              id="recipients"
              name="recipients"
              rows={3}
              placeholder="one@example.com, two@example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" maxLength={160} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="heading">Email heading</Label>
              <Input id="heading" name="heading" maxLength={120} required />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              name="body"
              rows={10}
              placeholder="Write the campaign copy. Blank lines become paragraphs."
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="ctaLabel">CTA label</Label>
              <Input id="ctaLabel" name="ctaLabel" placeholder="Browse vehicles" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ctaUrl">CTA URL</Label>
              <Input id="ctaUrl" name="ctaUrl" type="url" placeholder="https://www.hirecar.com.au/search" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="cta" disabled={isPending}>
              <Send className="h-4 w-4" />
              {isPending ? "Sending..." : "Send campaign"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
