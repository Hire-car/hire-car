"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { transferBranch } from "./actions";

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
import { Loader2, ArrowRightLeft } from "lucide-react";

interface TransferBranchDialogProps {
  organizationId: string;
  branchId: string;
  branchName: string;
}

export function VendorTransferBranchDialog({ organizationId, branchId, branchName }: TransferBranchDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.append("branchId", branchId);
      formData.append("organizationId", organizationId);
      
      const email = formData.get("email") as string;
      const businessName = formData.get("businessName") as string;
      const abn = formData.get("abn") as string;
      
      if (!email || !businessName || !abn) {
        toast.error("Please fill in all required fields.");
        setLoading(false);
        return;
      }

      if (abn.replace(/\s/g, '').length !== 11) {
        toast.error("ABN must be exactly 11 digits.");
        setLoading(false);
        return;
      }

      const result = await transferBranch(formData);

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
      <button 
        onClick={() => setOpen(true)}
        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
        title="Transfer branch to another vendor"
      >
        <ArrowRightLeft className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Transfer Branch</DialogTitle>
            <DialogDescription>
              Shift &quot;{branchName}&quot; to a new owner as an independent agency. The new agency will require admin approval before it goes live.
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
