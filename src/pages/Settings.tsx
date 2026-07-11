import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings as CheckCircle, XCircle, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settingsData } = trpc.settings.get.useQuery();
  const utils = trpc.useUtils();

  const [env, setEnv] = useState<"sandbox" | "production">("sandbox");
  const [sandboxKey, setSandboxKey] = useState("");
  const [sandboxSecret, setSandboxSecret] = useState("");
  const [prodKey, setProdKey] = useState("");
  const [prodSecret, setProdSecret] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (settingsData) {
      setEnv(settingsData.environment as "sandbox" | "production");
      setSandboxKey(settingsData.sandboxAccessKey || "");
      setSandboxSecret("");
      setProdKey(settingsData.productionAccessKey || "");
      setProdSecret("");
      setRedirectUrl(settingsData.redirectUrl || "");
      setCallbackUrl(settingsData.callbackUrl || "");
      setWebhookUrl(settingsData.webhookUrl || "");
      setNotifications(settingsData.emailNotifications ?? true);
    }
  }, [settingsData]);

  const updateMutation = trpc.settings.updateSwiftPay.useMutation({
    onSuccess: () => { toast.success("Settings saved"); utils.settings.get.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.settings.testConnection.useMutation({
    onSuccess: (res) => {
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      environment: env,
      sandboxAccessKey: sandboxKey || undefined,
      sandboxSecretKey: sandboxSecret || undefined,
      productionAccessKey: prodKey || undefined,
      productionSecretKey: prodSecret || undefined,
      redirectUrl: redirectUrl || undefined,
      callbackUrl: callbackUrl || undefined,
      webhookUrl: webhookUrl || undefined,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your Swift Pay integration</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Swift Pay Config */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" /> Swift Pay API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Environment Toggle */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Environment</Label>
                <div className="flex gap-2">
                  <button onClick={() => setEnv("sandbox")} className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${env === "sandbox" ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-border text-muted-foreground"}`}>
                    <span className="flex items-center justify-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Sandbox</span>
                  </button>
                  <button onClick={() => setEnv("production")} className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${env === "production" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground"}`}>
                    <span className="flex items-center justify-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Production</span>
                  </button>
                </div>
              </div>

              {/* Credentials */}
              {env === "sandbox" ? (
                <>
                  <div><Label className="text-xs text-muted-foreground">Sandbox Access Key</Label><Input value={sandboxKey} onChange={(e) => setSandboxKey(e.target.value)} placeholder="Enter sandbox access key" className="mt-1 h-10 bg-secondary/50 border-border font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Sandbox Secret Key</Label><Input value={sandboxSecret} onChange={(e) => setSandboxSecret(e.target.value)} type="password" placeholder="Enter sandbox secret key" className="mt-1 h-10 bg-secondary/50 border-border font-mono text-xs" /></div>
                  <div className="bg-secondary/30 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Gateway Host</p><p className="text-xs font-mono text-white">api.pay.sandbox.live.swiftpay.ph</p></div>
                </>
              ) : (
                <>
                  <div><Label className="text-xs text-muted-foreground">Production Access Key</Label><Input value={prodKey} onChange={(e) => setProdKey(e.target.value)} placeholder="Enter production access key" className="mt-1 h-10 bg-secondary/50 border-border font-mono text-xs" /></div>
                  <div><Label className="text-xs text-muted-foreground">Production Secret Key</Label><Input value={prodSecret} onChange={(e) => setProdSecret(e.target.value)} type="password" placeholder="Enter production secret key" className="mt-1 h-10 bg-secondary/50 border-border font-mono text-xs" /></div>
                  <div className="bg-secondary/30 rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Gateway Host</p><p className="text-xs font-mono text-white">api.pay.live.swiftpay.ph</p></div>
                </>
              )}

              <div><Label className="text-xs text-muted-foreground">Redirect URL</Label><Input value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://yourdomain.com/payment/callback" className="mt-1 h-10 bg-secondary/50 border-border" /></div>
              <div><Label className="text-xs text-muted-foreground">Callback URL</Label><Input value={callbackUrl} onChange={(e) => setCallbackUrl(e.target.value)} placeholder="https://yourdomain.com/api/webhook/collection" className="mt-1 h-10 bg-secondary/50 border-border" /></div>
              <div><Label className="text-xs text-muted-foreground">Webhook URL</Label><Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://yourdomain.com/api/webhook/disbursement" className="mt-1 h-10 bg-secondary/50 border-border" /></div>

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-accent h-10 font-semibold">
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Configuration
                </Button>
                <Button onClick={() => testMutation.mutate()} disabled={testMutation.isPending} variant="outline" className="border-border h-10">
                  {testMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {testMutation.data?.success ? <CheckCircle className="h-4 w-4 mr-2 text-emerald-400" /> : testMutation.data?.success === false ? <XCircle className="h-4 w-4 mr-2 text-destructive" /> : <Zap className="h-4 w-4 mr-2" />}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* General Settings */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base text-white">General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-white">Email Notifications</p><p className="text-[10px] text-muted-foreground">Alerts for failed transactions</p></div>
                <Switch checked={notifications} onCheckedChange={setNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-white">Timezone</p><p className="text-[10px] text-muted-foreground">Asia/Manila (PH)</p></div>
                <Badge variant="outline" className="text-[10px]">Default</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-white">Currency</p><p className="text-[10px] text-muted-foreground">Philippine Peso (PHP)</p></div>
                <Badge variant="outline" className="text-[10px]">\u20b1</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
