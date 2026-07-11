import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Copy, CheckCircle, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Collections() {
  const [showInitiate, setShowInitiate] = useState(false);
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [institutionCode, setInstitutionCode] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = trpc.collection.list.useQuery({ page: 1, limit: 20, search: search || undefined });
  const initiateMutation = trpc.collection.initializeOrder.useMutation({
    onSuccess: (res) => {
      setRedirectUrl(res.customerRedirectUrl);
      setStep(3);
      toast.success("Collection order initialized");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleInitiate = () => {
    if (!customerName || !customerEmail || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    initiateMutation.mutate({
      customerName,
      customerEmail,
      customerPhone,
      amount: parseFloat(amount),
      referenceNo: referenceNo || undefined,
      institutionCode: institutionCode || undefined,
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(redirectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Collections</h1>
            <p className="text-sm text-muted-foreground">Manage payment collections through Swift Pay</p>
          </div>
          <Button onClick={() => { setShowInitiate(true); setStep(1); setRedirectUrl(""); }} className="gradient-accent h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Initiate Collection
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by reference number..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
        </div>

        {/* Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Reference</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Customer</th>
                    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 shimmer rounded w-full" /></td></tr>
                    ))
                  )}
                  {data?.transactions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No collection transactions yet</td></tr>
                  )}
                  {data?.transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white">{txn.referenceNo}</td>
                      <td className="px-4 py-3 text-xs text-white">{txn.customerName || "—"}</td>
                      <td className="px-4 py-3 text-xs text-white font-mono text-right">₱{parseFloat(txn.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px] h-5", getStatusStyle(txn.status))}>{txn.status}</Badge></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Initiate Dialog */}
      <Dialog open={showInitiate} onOpenChange={setShowInitiate}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Initiate Collection</DialogTitle>
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-muted-foreground">Customer Name <span className="text-destructive">*</span></Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="John Doe" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground">Customer Email <span className="text-destructive">*</span></Label>
                <Input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="john@example.com" type="email" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground">Customer Phone</Label>
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+63 912 345 6789" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <Button onClick={() => setStep(2)} className="w-full gradient-accent h-11 font-semibold">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-muted-foreground">Amount (PHP) <span className="text-destructive">*</span></Label>
                <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="1000.00" type="number" step="0.01" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground">Reference Number</Label>
                <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Auto-generated if empty" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground">Institution Code (optional)</Label>
                <Input value={institutionCode} onChange={(e) => setInstitutionCode(e.target.value)} placeholder="e.g. GCASH, RCBC" className="mt-1.5 h-11 bg-secondary/50 border-border" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-border h-11">Back</Button>
                <Button onClick={handleInitiate} disabled={initiateMutation.isPending} className="flex-1 gradient-accent h-11 font-semibold">
                  {initiateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Generate URL
                </Button>
              </div>
            </div>
          )}

          {step === 3 && redirectUrl && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Collection URL generated!</span>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 break-all">
                <p className="text-xs text-muted-foreground mb-1">Customer Redirect URL:</p>
                <p className="text-xs font-mono text-white">{redirectUrl}</p>
              </div>
              <Button onClick={copyUrl} variant="outline" className="w-full border-border h-11">
                {copied ? <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy URL"}
              </Button>
              <Button onClick={() => { setShowInitiate(false); setStep(1); }} className="w-full gradient-accent h-11 font-semibold">Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function getStatusStyle(status: string) {
  switch (status) {
    case "EXECUTED": return "border-emerald-500/30 text-emerald-400 bg-emerald-500/10";
    case "PENDING": return "border-amber-500/30 text-amber-400 bg-amber-500/10";
    case "CANCELED": case "EXPIRED": return "border-gray-500/30 text-gray-400 bg-gray-500/10";
    case "REJECTED": return "border-red-500/30 text-red-400 bg-red-500/10";
    default: return "border-border text-muted-foreground";
  }
}
