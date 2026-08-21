import { Loader2 } from "lucide-react";

export default function VendorLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 mb-4 animate-pulse">
        <Loader2 className="h-7 w-7 text-slate-400 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">Loading dashboard...</p>
    </div>
  );
}
