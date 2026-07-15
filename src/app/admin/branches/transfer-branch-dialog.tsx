"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transferBranchAction } from "../actions";
import { transferBranchSchema } from "@/lib/validation/schemas";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransferBranchDialogProps {
  branchId: string;
  branchName: string;
}

export function TransferBranchDialog({ branchId, branchName }: TransferBranchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("branchId", branchId);
      
      // Client side validation check
      const parsed = transferBranchSchema.safeParse({
        branchId: branchId,
        email: formData.get("email"),
        businessName: formData.get("businessName"),
        abn: formData.get("abn"),
        phone: formData.get("phone") || "",
        address: formData.get("address") || "",
        website: formData.get("website") || "",
        approveImmediately: formData.get("approveImmediately") === "on",
      });
      
      if (!parsed.success) {
        toast.error("Please check the required fields.");
        setLoading(false);
        return;
      }

      const result = await transferBranchAction(formData);

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully transferred ${branchName} to independent agency.`);
        setOpen(false);
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOpen(true)}>
        Transfer
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer Branch</DialogTitle>
            <DialogDescription>
              Shift &quot;{branchName}&quot; to a new owner as an independent agency.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">New Owner Email</Label>
              <Input id="email" name="email" type="email" placeholder="owner@agency.com" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">New Business Name</Label>
              <Input id="businessName" name="businessName" placeholder="Acme Rentals" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="abn">ABN (11 digits)</Label>
              <Input id="abn" name="abn" placeholder="12345678901" required minLength={11} maxLength={11} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input id="phone" name="phone" placeholder="0400000000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input id="website" name="website" placeholder="https://..." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Headquarters Address (Optional)</Label>
              <Input id="address" name="address" placeholder="123 Main St..." />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="approveImmediately"
                name="approveImmediately"
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="approveImmediately">Approve new agency immediately</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Transfer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
