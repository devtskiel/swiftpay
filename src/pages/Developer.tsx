import { useState } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Plus, Key, Copy, Check, Trash2, Eye, EyeOff, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Developer() {
  const [showCreate, setShowCreate] = useState(false);
  const [showKeyResult, setShowKeyResult] = useState<{ public: string; secret: string } | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyEnv, setNewKeyEnv] = useState<"sandbox" | "production">("sandbox");
  const [visibleSecrets, setVisibleSecrets] = useState<Record<number, boolean>>({});

  const { data: keys, isLoading, refetch } = trpc.apiKey.list.useQuery();

  const generateMutation = trpc.apiKey.generate.useMutation({
    onSuccess: (res) => {
      setShowKeyResult({ public: res.publicKey, secret: res.secretKey });
      setShowCreate(false);
      setNewKeyName("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const revokeMutation = trpc.apiKey.revoke.useMutation({
    onSuccess: () => { toast.success("API key revoked"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const toggleSecret = (id: number) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Developer Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your platform API keys and webhooks</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gradient-accent h-11 font-semibold">
            <Plus className="h-4 w-4 mr-2" /> Generate API Key
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" /> API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Environment</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Public Key</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Created</th>
                      <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 shimmer rounded w-full" /></td></tr>
                    ))}
                    {keys?.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">No API keys generated yet</td></tr>
                    )}
                    {keys?.map((k) => (
                      <tr key={k.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-xs font-medium text-white">{k.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize", k.environment === "production" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10")}>
                            {k.environment}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <code className="text-[10px] font-mono text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">{k.publicKey}</code>
                            <button onClick={() => copyToClipboard(k.publicKey, "Public Key")} className="text-muted-foreground hover:text-white transition-colors">
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px] capitalize", k.status === "active" ? "border-emerald-500/30 text-emerald-400" : "border-destructive/30 text-destructive")}>
                            {k.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(k.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {k.status === "active" && (
                            <button onClick={() => { if(confirm("Are you sure? This will immediately break integrations using this key.")) revokeMutation.mutate({ id: k.id }) }} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-white">Integration Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Use your API keys to authenticate requests to the Swift Pay API. For security, never share your secret keys or commit them to version control.
              </p>
              <div className="bg-secondary/30 rounded-lg p-4 font-mono text-xs text-white space-y-2">
                <p className="text-muted-foreground"># Example request</p>
                <p>curl -X POST https://api.swiftpay.ph/v1/collections \</p>
                <p>  -H "Authorization: Bearer YOUR_SECRET_KEY" \</p>
                <p>  -H "Content-Type: application/json" \</p>
                <p>  -d '{"amount": 1000, "currency": "PHP"}'</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Key Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-white">Generate API Key</DialogTitle>
            <DialogDescription className="text-muted-foreground">Create a new key to integrate Swift Pay into your application.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Key Name</Label>
              <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. My Online Store" className="h-11 bg-secondary/50 border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Environment</Label>
              <div className="flex gap-2">
                <button onClick={() => setNewKeyEnv("sandbox")} className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all", newKeyEnv === "sandbox" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground")}>Sandbox</button>
                <button onClick={() => setNewKeyEnv("production")} className={cn("flex-1 py-2 rounded-lg border text-xs font-medium transition-all", newKeyEnv === "production" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground")}>Production</button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-border">Cancel</Button>
            <Button onClick={() => generateMutation.mutate({ name: newKeyName, environment: newKeyEnv })} disabled={!newKeyName || generateMutation.isPending} className="gradient-accent">
              {generateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={!!showKeyResult} onOpenChange={() => setShowKeyResult(null)}>
        <DialogContent className="bg-card border-border sm:max-w-lg">
          <DialogHeader>
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Key className="h-6 w-6 text-emerald-500" />
            </div>
            <DialogTitle className="text-white text-xl">API Key Generated</DialogTitle>
            <DialogDescription className="text-emerald-400/80 font-medium">
              Please copy your secret key now. You won't be able to see it again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <p className="text-xs text-amber-200/80 leading-relaxed">
                This secret key provides full access to your account. Keep it safe and never share it publicly.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase">Public Key</Label>
                <div className="flex gap-2">
                  <Input readOnly value={showKeyResult?.public} className="font-mono text-xs bg-secondary/50 border-border h-10" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(showKeyResult?.public || "", "Public Key")} className="border-border h-10 w-10 shrink-0"><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] text-muted-foreground uppercase">Secret Key</Label>
                <div className="flex gap-2">
                  <Input readOnly value={showKeyResult?.secret} className="font-mono text-xs bg-secondary/50 border-border h-10" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(showKeyResult?.secret || "", "Secret Key")} className="border-border h-10 w-10 shrink-0"><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowKeyResult(null)} className="w-full bg-emerald-500 hover:bg-emerald-600 font-semibold h-11">
            I've saved my secret key
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
