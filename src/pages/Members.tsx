import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, UserX, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PERMISSIONS = [
  { key: "view_transactions", label: "View Transactions" },
  { key: "initiate_collections", label: "Initiate Collections" },
  { key: "initiate_disbursements", label: "Initiate Disbursements" },
  { key: "manage_settings", label: "Manage Settings" },
];

export default function Members() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "developer">("member");
  const [permissions, setPermissions] = useState<string[]>(["view_transactions"]);
  const { data: members, isLoading, refetch } = trpc.member.list.useQuery();

  const inviteMutation = trpc.member.invite.useMutation({
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      setShowInvite(false);
      setEmail("");
      setPermissions(["view_transactions"]);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.member.update.useMutation({
    onSuccess: () => { toast.success("Member updated"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const togglePermission = (key: string) => {
    setPermissions((p) => p.includes(key) ? p.filter((x) => x !== key) : [...p, key]);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Member Management</h1>
            <p className="text-sm text-muted-foreground">Manage team members and their permissions</p>
          </div>
          <Button onClick={() => setShowInvite(true)} className="gradient-accent h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Role</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Permissions</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Actions</th>
                </tr></thead>
                <tbody>
                  {isLoading && Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}><td colSpan={5} className="px-4 py-4"><div className="h-4 shimmer rounded w-full" /></td></tr>
                  ))}
                  {members?.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">No members yet</td></tr>
                  )}
                  {members?.map((m) => {
                    const perms = (m.permissions as string[]) || [];
                    return (
                      <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                              {(m.fullName || m.email)?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white">{m.fullName || "—"}</p>
                              <p className="text-[10px] text-muted-foreground">{m.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize", m.role === "admin" ? "border-primary/30 text-primary bg-primary/10" : "border-border text-muted-foreground")}>{m.role}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", m.status === "active" ? "bg-emerald-500" : m.status === "invited" ? "bg-amber-500" : "bg-gray-500")} />
                            <span className="text-xs text-white capitalize">{m.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {perms.map((p) => (
                              <Badge key={p} variant="outline" className="text-[9px] h-4 border-border text-muted-foreground">{p.replace(/_/g, " ")}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {m.status === "active" ? (
                              <button onClick={() => updateMutation.mutate({ id: m.id, status: "inactive" })} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors" title="Deactivate">
                                <UserX className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => updateMutation.mutate({ id: m.id, status: "active" })} className="p-1.5 rounded hover:bg-emerald-500/20 text-muted-foreground hover:text-emerald-500 transition-colors" title="Activate">
                                <UserCheck className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle className="text-white">Invite Team Member</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-muted-foreground">Email Address</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="colleague@company.com" type="email" className="mt-1.5 h-11 bg-secondary/50 border-border" />
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <div className="flex gap-2 mt-1.5">
                <button onClick={() => setRole("member")} className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all", role === "member" ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>Member</button>
                <button onClick={() => setRole("admin")} className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all", role === "admin" ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>Admin</button>
                <button onClick={() => setRole("developer" as any)} className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all", role === ("developer" as any) ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground hover:border-primary/30")}>Developer</button>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Permissions</Label>
              <div className="space-y-2 mt-2">
                {PERMISSIONS.map((p) => (
                  <div key={p.key} className="flex items-center gap-2">
                    <Checkbox id={p.key} checked={permissions.includes(p.key)} onCheckedChange={() => togglePermission(p.key)} />
                    <Label htmlFor={p.key} className="text-xs text-muted-foreground cursor-pointer">{p.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <Button onClick={() => inviteMutation.mutate({ email, role, permissions })} disabled={inviteMutation.isPending || !email} className="w-full gradient-accent h-11 font-semibold">
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
