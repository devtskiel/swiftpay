import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Plus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const INSTITUTIONS = [
  "RCBC", "BDO", "BPI", "METROBANK", "UNIONBANK", "CHINABANK", "SECURITYBANK",
  "EASTWEST", "PNB", "LANDBANK", "GCASH", "MAYA", "GRABPAY", "SHOPEEPAY",
  "SEABANK", "TONIK", "GOTYME", "CIMB", "AUB", "PAYMAYA",
];

export default function Disbursements() {
  const [showDialog, setShowDialog] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    accountNumber: "", firstName: "", middleName: "", lastName: "",
    mobileNumber: "", email: "", line1: "", city: "", postalCode: "",
    province: "", countryCode: "PH", institutionCode: "", amount: "", remarks: "",
  });
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = trpc.disbursement.list.useQuery({ page: 1, limit: 20, search: search || undefined });
  const sendMutation = trpc.disbursement.send.useMutation({
    onSuccess: () => {
      toast.success("Disbursement sent successfully");
      setShowDialog(false);
      setStep(1);
      setForm({ accountNumber: "", firstName: "", middleName: "", lastName: "", mobileNumber: "", email: "", line1: "", city: "", postalCode: "", province: "", countryCode: "PH", institutionCode: "", amount: "", remarks: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSend = () => {
    if (!form.accountNumber || !form.firstName || !form.lastName || !form.institutionCode || !form.amount) {
      toast.error("Please fill in all required fields");
      return;
    }
    sendMutation.mutate({
      channel: "INSTAPAY",
      institutionCode: form.institutionCode,
      amount: parseFloat(form.amount),
      remarks: form.remarks,
      recipient: {
        accountNumber: form.accountNumber,
        firstName: form.firstName,
        middleName: form.middleName || undefined,
        lastName: form.lastName,
        mobileNumber: form.mobileNumber || undefined,
        email: form.email || undefined,
        address: { line1: form.line1, city: form.city, postalCode: form.postalCode, province: form.province, countryCode: form.countryCode },
      },
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Disbursements</h1>
            <p className="text-sm text-muted-foreground">Send payouts via Swift Pay Disbursement API</p>
          </div>
          <Button onClick={() => setShowDialog(true)} className="gradient-accent h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Send Disbursement
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-card border-border" />
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Reference</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Recipient</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Bank</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                </tr></thead>
                <tbody>
                  {isLoading && Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 shimmer rounded w-full" /></td></tr>
                  ))}
                  {data?.disbursements.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No disbursements yet</td></tr>
                  )}
                  {data?.disbursements.map((d) => (
                    <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-white">{d.merchantReferenceNo}</td>
                      <td className="px-4 py-3 text-xs text-white">{d.recipientFirstName} {d.recipientLastName}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{d.institutionCode}</Badge></td>
                      <td className="px-4 py-3 text-xs text-white font-mono text-right">\u20b1{parseFloat(d.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn("text-[10px] h-5", getStatusStyle(d.status))}>{d.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-white">Send Disbursement</DialogTitle></DialogHeader>

          {step === 1 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium text-white">Recipient Information</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Account Number <span className="text-destructive">*</span></Label>
                  <Input value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">First Name <span className="text-destructive">*</span></Label>
                  <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Last Name <span className="text-destructive">*</span></Label>
                  <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Mobile</Label>
                  <Input value={form.mobileNumber} onChange={(e) => update("mobileNumber", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <Input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
              </div>
              <h3 className="text-sm font-medium text-white pt-2">Address</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Line 1 <span className="text-destructive">*</span></Label>
                  <Input value={form.line1} onChange={(e) => update("line1", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" />
                </div>
                <div><Label className="text-muted-foreground text-xs">City <span className="text-destructive">*</span></Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-muted-foreground text-xs">Postal Code <span className="text-destructive">*</span></Label><Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-muted-foreground text-xs">Province <span className="text-destructive">*</span></Label><Input value={form.province} onChange={(e) => update("province", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-muted-foreground text-xs">Country</Label><Input value={form.countryCode} onChange={(e) => update("countryCode", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
              </div>
              <Button onClick={() => setStep(2)} className="w-full gradient-accent h-11 font-semibold">Next</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium text-white">Transfer Details</h3>
              <div>
                <Label className="text-muted-foreground text-xs">Institution (Bank) <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-3 gap-2 mt-1 max-h-40 overflow-y-auto">
                  {INSTITUTIONS.map((code) => (
                    <button key={code} onClick={() => update("institutionCode", code)} className={cn("px-2 py-1.5 text-[10px] rounded border transition-all", form.institutionCode === code ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>
                      {code}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Amount (PHP) <span className="text-destructive">*</span></Label>
                <Input value={form.amount} onChange={(e) => update("amount", e.target.value)} type="number" step="0.01" placeholder="1000.00" className="mt-1 h-10 bg-secondary/50 border-border" />
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Remarks</Label>
                <Input value={form.remarks} onChange={(e) => update("remarks", e.target.value)} placeholder="Payment for order" className="mt-1 h-10 bg-secondary/50 border-border" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(1)} variant="outline" className="flex-1 border-border h-11">Back</Button>
                <Button onClick={handleSend} disabled={sendMutation.isPending} className="flex-1 bg-emerald-500 hover:bg-emerald-600 h-11 font-semibold">
                  {sendMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  <Send className="h-4 w-4 mr-2" /> Confirm & Send
                </Button>
              </div>
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
    case "REJECTED": case "FAILED": return "border-red-500/30 text-red-400 bg-red-500/10";
    default: return "border-border text-muted-foreground";
  }
}
