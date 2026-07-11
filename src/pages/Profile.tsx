import { useState, useEffect } from "react";
import { trpc } from "@/providers/trpc";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Shield, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { data: profile, isLoading } = trpc.merchant.getProfile.useQuery();
  const { data: compliance } = trpc.merchant.getComplianceStatus.useQuery();
  const utils = trpc.useUtils();
  const updateMutation = trpc.merchant.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated"); utils.merchant.getProfile.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || "",
        registrationNumber: profile.registrationNumber || "",
        taxId: profile.taxId || "",
        industry: profile.industry || "",
        contactPersonName: profile.contactPersonName || "",
        contactEmail: profile.contactEmail || "",
        contactPhone: profile.contactPhone || "",
        websiteUrl: profile.websiteUrl || "",
        streetAddress: profile.streetAddress || "",
        city: profile.city || "",
        province: profile.province || "",
        postalCode: profile.postalCode || "",
      });
    }
  }, [profile]);

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = () => {
    updateMutation.mutate({
      businessName: form.businessName,
      registrationNumber: form.registrationNumber,
      taxId: form.taxId,
      industry: form.industry,
      contactPersonName: form.contactPersonName,
      contactEmail: form.contactEmail,
      contactPhone: form.contactPhone,
      websiteUrl: form.websiteUrl,
      streetAddress: form.streetAddress,
      city: form.city,
      province: form.province,
      postalCode: form.postalCode,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your business details</p>
        </div>

        {/* Header Card */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-dashed border-primary/30 flex items-center justify-center shrink-0 cursor-pointer hover:border-primary/60 transition-colors">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">{profile?.businessName || "Your Business"}</h2>
                <p className="text-xs text-muted-foreground">Active since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}</p>
              </div>
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="gradient-accent h-10 font-semibold">
                {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Details */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader><CardTitle className="text-base text-white">Business Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 shimmer rounded" />)}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Business Name</Label><Input value={form.businessName || ""} onChange={(e) => update("businessName", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Registration Number</Label><Input value={form.registrationNumber || ""} onChange={(e) => update("registrationNumber", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Tax ID / TIN</Label><Input value={form.taxId || ""} onChange={(e) => update("taxId", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Industry</Label><Input value={form.industry || ""} onChange={(e) => update("industry", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Contact Person</Label><Input value={form.contactPersonName || ""} onChange={(e) => update("contactPersonName", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Contact Email</Label><Input value={form.contactEmail || ""} onChange={(e) => update("contactEmail", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Contact Phone</Label><Input value={form.contactPhone || ""} onChange={(e) => update("contactPhone", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Website</Label><Input value={form.websiteUrl || ""} onChange={(e) => update("websiteUrl", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div className="sm:col-span-2"><Label className="text-xs text-muted-foreground">Street Address</Label><Input value={form.streetAddress || ""} onChange={(e) => update("streetAddress", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">City</Label><Input value={form.city || ""} onChange={(e) => update("city", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Province</Label><Input value={form.province || ""} onChange={(e) => update("province", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
                <div><Label className="text-xs text-muted-foreground">Postal Code</Label><Input value={form.postalCode || ""} onChange={(e) => update("postalCode", e.target.value)} className="mt-1 h-10 bg-secondary/50 border-border" /></div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status */}
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-base text-white">Compliance Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {compliance?.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className={item.status === "verified" ? "text-emerald-500" : "text-amber-500"}>
                      {item.status === "verified" ? <CheckCircle className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                    </div>
                    <span className="text-xs text-white">{item.label}</span>
                  </div>
                  <span className={cn("text-[10px] capitalize", item.status === "verified" ? "text-emerald-400" : "text-amber-400")}>{item.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ");
}
