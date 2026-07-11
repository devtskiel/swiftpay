import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
import { Plus, Minus, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export default function Balance() {
  const { data: balance, refetch: refetchBalance } = trpc.balance.getBalance.useQuery();
  const { data: history } = trpc.balance.getHistory.useQuery({ page: 1, limit: 20 });
  const { data: chartData } = trpc.balance.getChartData.useQuery({ days: 30 });
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const topUpMutation = trpc.balance.topUp.useMutation({
    onSuccess: () => { toast.success("Top-up successful"); setShowTopUp(false); setAmount(""); setDescription(""); refetchBalance(); },
    onError: (err) => toast.error(err.message),
  });
  const withdrawMutation = trpc.balance.withdraw.useMutation({
    onSuccess: () => { toast.success("Withdrawal successful"); setShowWithdraw(false); setAmount(""); setDescription(""); refetchBalance(); },
    onError: (err) => toast.error(err.message),
  });

  const chart = chartData?.dates.map((date, i) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    balance: chartData.balances[i] || 0,
  })) || [];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Balance & Wallet</h1>
          <p className="text-sm text-muted-foreground">Manage your merchant wallet</p>
        </div>

        {/* Balance Summary */}
        <Card className="bg-card border-border card-hover-glow">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Available Balance</p>
                <p className="text-4xl font-bold text-white font-mono mt-1">
                  \u20b1{(balance?.currentBalance || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Last updated: Just now</p>
              </div>
              <div className="hidden lg:block w-px h-16 bg-border" />
              <div className="space-y-1">
                <p className="text-sm text-emerald-400">Total Top-ups: \u20b1{(balance?.totalTopUps || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-red-400">Total Withdrawals: \u20b1{(balance?.totalWithdrawals || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="flex gap-2 lg:ml-auto">
                <Button onClick={() => setShowTopUp(true)} className="bg-emerald-500 hover:bg-emerald-600 h-11 font-semibold">
                  <Plus className="h-4 w-4 mr-2" /> Top Up
                </Button>
                <Button onClick={() => setShowWithdraw(true)} variant="destructive" className="h-11 font-semibold">
                  <Minus className="h-4 w-4 mr-2" /> Withdraw
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bank Deposit Info */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Cash In / Bank Deposit</CardTitle>
              <p className="text-xs text-muted-foreground">Standard account information for manual deposits</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary">Security Bank Corporation</span>
                  <Badge variant="outline" className="text-[10px]">Standard</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">Account Number</span>
                    <span className="text-xs font-mono text-white">0000068888173</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">Account Name</span>
                    <span className="text-xs text-white">Click Store</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-primary">Asia United Bank / Hellomoney</span>
                  <Badge variant="outline" className="text-[10px]">Standard</Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">Account Number</span>
                    <span className="text-xs font-mono text-white">934105321485</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-muted-foreground">Account Name</span>
                    <span className="text-xs text-white">Click Store</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground italic px-1">
                Note: Please upload your deposit slip via the "Top Up" button after making a manual transfer.
              </p>
            </CardContent>
          </Card>

          {/* Chart */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-white">Balance History</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart}>
                    <defs>
                      <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,51,88,0.5)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6480" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6480" }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20b1${v.toLocaleString()}`} />
                    <Tooltip contentStyle={{ backgroundColor: "#151A2E", border: "1px solid #2A3358", borderRadius: 8, fontSize: 12 }} itemStyle={{ color: "#fff" }} formatter={(v: number) => `\u20b1${v.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} />
                    <Area type="monotone" dataKey="balance" stroke="#4F6EF7" strokeWidth={2} fill="url(#balGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-white">Recent Movements</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[280px] overflow-y-auto">
              {history?.transactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              )}
              {history?.transactions.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", t.type === "top_up" ? "bg-emerald-500/20" : "bg-red-500/20")}>
                      {t.type === "top_up" ? <ArrowDownLeft className="h-4 w-4 text-emerald-500" /> : <ArrowUpRight className="h-4 w-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white capitalize">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                    </div>
                  </div>
                  <p className={cn("text-xs font-semibold font-mono", parseFloat(t.amount) > 0 ? "text-emerald-400" : "text-red-400")}>
                    {parseFloat(t.amount) > 0 ? "+" : ""}\u20b1{Math.abs(parseFloat(t.amount)).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top Up Dialog */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-white">Top Up Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-muted-foreground">Amount (PHP)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="1000.00" className="mt-1 h-11 bg-secondary/50 border-border" /></div>
            <div><Label className="text-muted-foreground">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bank transfer" className="mt-1 h-11 bg-secondary/50 border-border" /></div>
            <Button onClick={() => topUpMutation.mutate({ amount: parseFloat(amount), description })} disabled={topUpMutation.isPending || !amount} className="w-full bg-emerald-500 hover:bg-emerald-600 h-11 font-semibold">
              {topUpMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Top-up
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdraw} onOpenChange={setShowWithdraw}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="text-white">Withdraw from Wallet</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-muted-foreground">Amount (PHP)</Label><Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="1000.00" className="mt-1 h-11 bg-secondary/50 border-border" /></div>
            <div><Label className="text-muted-foreground">Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Withdrawal to bank" className="mt-1 h-11 bg-secondary/50 border-border" /></div>
            <Button onClick={() => withdrawMutation.mutate({ amount: parseFloat(amount), description })} disabled={withdrawMutation.isPending || !amount} variant="destructive" className="w-full h-11 font-semibold">
              {withdrawMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Confirm Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
