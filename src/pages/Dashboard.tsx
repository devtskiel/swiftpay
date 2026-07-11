import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Send,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: stats, isLoading: statsLoading } = trpc.transaction.getStats.useQuery(undefined, { enabled: !!user });
  const { data: volumeData } = trpc.transaction.getVolumeData.useQuery({ days: 30 }, { enabled: !!user });
  const { data: recentTxns } = trpc.transaction.list.useQuery({ page: 1, limit: 10, type: "all" }, { enabled: !!user });

  // ─── Particle Background ────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    interface Particle {
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 1 + Math.random() * 1,
      opacity: 0.2 + Math.random() * 0.4,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(79, 110, 247, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(79, 110, 247, ${(120 - dist) / 120 * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ─── Chart data ─────────────────────────────────────
  const chartData = volumeData?.dates.map((date, i) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    collections: volumeData.collections[i] || 0,
    disbursements: volumeData.disbursements[i] || 0,
  })) || [];

  const formatCurrency = (val: number) => `\u20b1${val.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AppLayout>
      {/* Particle background */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" style={{ width: "100%", height: "100%" }} />

      <div className="relative z-10 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Overview of your payment activity</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Collected"
            amount={stats?.totalCollected || 0}
            icon={Wallet}
            borderColor="border-l-emerald-500"
            iconColor="text-emerald-500"
            trend="+12.5%"
            loading={statsLoading}
          />
          <SummaryCard
            title="Total Disbursed"
            amount={stats?.totalDisbursed || 0}
            icon={Send}
            borderColor="border-l-primary"
            iconColor="text-primary"
            trend="+8.2%"
            loading={statsLoading}
          />
          <SummaryCard
            title="Pending"
            amount={stats?.pendingAmount || 0}
            icon={Clock}
            borderColor="border-l-amber-500"
            iconColor="text-amber-500"
            subtitle={`${stats?.pendingCount || 0} transactions`}
            loading={statsLoading}
          />
          <SummaryCard
            title="Failed/Canceled"
            amount={stats?.failedAmount || 0}
            icon={XCircle}
            borderColor="border-l-destructive"
            iconColor="text-destructive"
            subtitle="Needs attention"
            loading={statsLoading}
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate("/collections")} className="gradient-accent h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Initiate Collection
          </Button>
          <Button onClick={() => navigate("/disbursements")} variant="secondary" className="h-11 bg-primary/20 text-primary hover:bg-primary/30">
            <Send className="h-4 w-4 mr-2" /> Send Disbursement
          </Button>
          <Button onClick={() => navigate("/transactions")} variant="outline" className="h-11 border-border">
            View All Transactions
          </Button>
        </div>

        {/* Charts + Recent Transactions */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="xl:col-span-2 bg-card border-border card-hover-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Transaction Volume</CardTitle>
              <p className="text-xs text-muted-foreground">Daily collections vs disbursements (30 days)</p>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,51,88,0.5)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5A6480" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A6480" }} axisLine={false} tickLine={false} tickFormatter={(v) => `\u20b1${v.toLocaleString()}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#151A2E", border: "1px solid #2A3358", borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: "#fff" }}
                      labelStyle={{ color: "#8892B0", marginBottom: 4 }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Area type="monotone" dataKey="collections" stroke="#22c55e" strokeWidth={2} fill="url(#colGrad)" name="Collections" />
                    <Area type="monotone" dataKey="disbursements" stroke="#4F6EF7" strokeWidth={2} fill="url(#disGrad)" name="Disbursements" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white">Recent Transactions</CardTitle>
              <p className="text-xs text-muted-foreground">Last 10 transactions</p>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
              {recentTxns?.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
              )}
              {recentTxns?.items.map((txn) => (
                <div key={`${txn.type}-${txn.id}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", txn.type === "collection" ? "bg-emerald-500/20" : "bg-primary/20")}>
                      {txn.type === "collection" ? <ArrowDownRight className="h-4 w-4 text-emerald-500" /> : <ArrowUpRight className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white capitalize">{txn.type}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{txn.referenceNo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-white font-mono">\u20b1{parseFloat(txn.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
                    <Badge variant="outline" className={cn("text-[9px] h-4 px-1.5", getStatusStyle(txn.status))}>
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Components ───────────────────────────────────────

function SummaryCard({
  title, amount, icon: Icon, borderColor, iconColor, trend, subtitle, loading,
}: {
  title: string; amount: number; icon: React.ComponentType<{ className?: string }>;
  borderColor: string; iconColor: string; trend?: string; subtitle?: string; loading?: boolean;
}) {
  return (
    <Card className={cn("bg-card border-border card-hover-glow border-l-[3px]", borderColor)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{title}</p>
            {loading ? (
              <div className="h-7 w-32 shimmer rounded" />
            ) : (
              <p className="text-xl font-bold text-white font-mono tracking-tight">
                \u20b1{amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
            {trend && <p className="text-xs text-emerald-400">{trend} from last month</p>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("p-2 rounded-lg bg-opacity-10", iconColor.replace("text-", "bg-"))}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
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
