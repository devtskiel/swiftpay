import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Download, Search, Eye, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const [filters, setFilters] = useState({ type: "all" as "all" | "collection" | "disbursement", status: "", search: "", dateFrom: "", dateTo: "" });
  const [selectedTxn, setSelectedTxn] = useState<null | Record<string, unknown>>(null);

  const { data, isLoading } = trpc.transaction.list.useQuery({
    page: 1, limit: 50,
    type: filters.type === "all" ? undefined : filters.type,
    status: filters.status || undefined,
    search: filters.search || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const exportCsv = () => {
    if (!data?.items.length) return;
    const headers = ["Type", "Reference", "Amount", "Currency", "Status", "Name", "Institution", "Date"];
    const rows = data.items.map((t) => [
      t.type, t.referenceNo, t.amount, t.currency, t.status,
      t.customerName || t.recipientName || "", t.institutionCode || "",
      new Date(t.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">All Transactions</h1>
            <p className="text-sm text-muted-foreground">Unified view of collections and disbursements</p>
          </div>
          <Button onClick={exportCsv} variant="outline" className="border-border h-11">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by ID, reference..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} className="pl-10 h-10 bg-card border-border" />
          </div>
          <Select value={filters.type} onValueChange={(v) => setFilters((p) => ({ ...p, type: v as "all" | "collection" | "disbursement" }))}>
            <SelectTrigger className="w-36 h-10 bg-card border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="collection">Collection</SelectItem>
              <SelectItem value="disbursement">Disbursement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status} onValueChange={(v) => setFilters((p) => ({ ...p, status: v }))}>
            <SelectTrigger className="w-36 h-10 bg-card border-border"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="EXECUTED">Executed</SelectItem>
              <SelectItem value="CANCELED">Canceled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="EXPIRED">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={filters.dateFrom} onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value }))} className="h-10 bg-card border-border w-36" />
          <Input type="date" value={filters.dateTo} onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value }))} className="h-10 bg-card border-border w-36" />
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Reference</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Institution</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Date</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 shimmer rounded w-full" /></td></tr>
                  ))}
                  {data?.items.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">No transactions found</td></tr>
                  )}
                  {data?.items.map((txn) => (
                    <tr key={`${txn.type}-${txn.id}`} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => setSelectedTxn(txn as unknown as Record<string, unknown>)}>
                      <td className="px-4 py-3">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", txn.type === "collection" ? "bg-emerald-500/20" : "bg-primary/20")}>
                          {txn.type === "collection" ? <ArrowDownRight className="h-3.5 w-3.5 text-emerald-500" /> : <ArrowUpRight className="h-3.5 w-3.5 text-primary" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-white">{txn.referenceNo}</td>
                      <td className="px-4 py-3 text-xs text-white font-mono text-right">\u20b1{parseFloat(txn.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px] h-5", getStatusStyle(txn.status))}>{txn.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-white">{txn.customerName || txn.recipientName || "—"}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{txn.institutionCode || "—"}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="px-4 py-3"><Eye className="h-4 w-4 text-muted-foreground hover:text-white transition-colors" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selectedTxn} onOpenChange={() => setSelectedTxn(null)}>
        <SheetContent className="bg-card border-border w-full sm:max-w-md">
          <SheetHeader><SheetTitle className="text-white">Transaction Details</SheetTitle></SheetHeader>
          {selectedTxn && (
            <div className="space-y-4 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-white font-mono">\u20b1{parseFloat(selectedTxn.amount as string).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="outline" className={cn("text-xs capitalize", getStatusStyle(selectedTxn.status as string))}>{selectedTxn.status as string}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{selectedTxn.type as string}</Badge>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border">
                <DetailRow label="Reference" value={selectedTxn.referenceNo as string} />
                <DetailRow label="Institution" value={(selectedTxn.institutionCode as string) || "—"} />
                <DetailRow label="Name" value={(selectedTxn.customerName as string) || (selectedTxn.recipientName as string) || "—"} />
                <DetailRow label="Date" value={new Date(selectedTxn.createdAt as string).toLocaleString("en-US")} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs text-white font-mono">{value}</span>
    </div>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "EXECUTED": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    case "PENDING": return "border-amber-500/30 text-amber-400 bg-amber-500/10";
    case "CANCELED": case "EXPIRED": return "border-gray-500/30 text-gray-400 bg-gray-500/10";
    case "REJECTED": case "FAILED": return "border-red-500/30 text-red-400 bg-red-500/10";
    default: return "border-border text-muted-foreground";
  }
}
