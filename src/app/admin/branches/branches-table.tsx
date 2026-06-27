"use client";

import { useState, useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { moderateBranch, aiAutoApproveBranch } from "../actions";

interface BranchRow {
  id: string;
  name: string;
  city: string;
  state: string;
  phone: string;
  status: string;
  vendor_name: string;
  created_at: string;
}

interface AdminBranchesTableProps {
  data: BranchRow[];
}

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case "approved": return "success" as const;
    case "pending": return "warning" as const;
    case "suspended": return "destructive" as const;
    default: return "outline" as const;
  }
};

export function AdminBranchesTable({ data }: AdminBranchesTableProps) {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q) ||
        b.vendor_name.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns: DataTableColumn<Record<string, unknown>>[] = [
    {
      key: "name",
      label: "Branch",
      sortable: true,
      render: (val) => <span className="font-medium text-foreground">{val as string}</span>,
    },
    {
      key: "vendor_name",
      label: "Vendor",
      sortable: true,
    },
    {
      key: "city",
      label: "City",
      sortable: true,
    },
    {
      key: "state",
      label: "State",
      sortable: true,
    },
    {
      key: "phone",
      label: "Phone",
      render: (val) => (
        <span className="text-sm text-muted-foreground">{(val as string) || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (val) => (
        <Badge variant={statusBadgeVariant(val as string)}>
          {val as string}
        </Badge>
      ),
    },
    {
      key: "created_at",
      label: "Created",
      sortable: true,
      render: (val) => (
        <span className="text-sm text-muted-foreground">
          {new Date(val as string).toLocaleDateString("en-AU")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => {
        return (
          <div className="flex justify-end gap-2">
            {row.status === "pending" && (
              <>
                <form action={aiAutoApproveBranch.bind(null, row.id as string)}>
                  <Button type="submit" variant="secondary" size="sm" className="h-8 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200">
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    AI Auto-Approve
                  </Button>
                </form>
                <form action={moderateBranch.bind(null, "approve", row.id as string, "Approved from admin dashboard")}>
                  <Button type="submit" variant="default" size="sm" className="h-8 text-xs badge-glow-success">
                    Approve
                  </Button>
                </form>
              </>
            )}
            {row.status === "approved" && (
              <form action={moderateBranch.bind(null, "suspend", row.id as string, "Suspended from admin dashboard")}>
                <Button type="submit" variant="destructive" size="sm" className="h-8 text-xs">
                  Suspend
                </Button>
              </form>
            )}
            {row.status === "suspended" && (
              <form action={moderateBranch.bind(null, "restore", row.id as string, "Restored from admin dashboard")}>
                <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                  Restore
                </Button>
              </form>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter control */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by branch name, city, state, or vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-border bg-background pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {filteredData.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No branches found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData as unknown as Record<string, unknown>[]}
          pageSize={20}
          pageSizeOptions={[10, 20, 50]}
        />
      )}
    </div>
  );
}
