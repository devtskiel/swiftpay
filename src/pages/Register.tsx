import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  User,
  Building2,
  Shield,
  FileText,
  CheckCircle,
  Camera,
  Upload,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5;

const steps = [
  { num: 1, icon: User, label: "Basic Info" },
  { num: 2, icon: Building2, label: "Business" },
  { num: 3, icon: Shield, label: "Verification" },
  { num: 4, icon: FileText, label: "Documents" },
  { num: 5, icon: CheckCircle, label: "Review" },
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Business
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [industry, setIndustry] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Step 3: Verification
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFile, setIdFile] = useState<string | null>(null);
  const [selfieCaptured, setSelfieCaptured] = useState(false);
  const [selfieUrl, setSelfieUrl] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [faceStatus, setFaceStatus] = useState("Looking for your face...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Step 4: Documents
  const [permitFile, setPermitFile] = useState<string | null>(null);
  const [permitNumber, setPermitNumber] = useState("");
  const [secFile, setSecFile] = useState<string | null>(null);
  const [birFile, setBirFile] = useState<string | null>(null);

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Registration successful! Welcome to Swift Pay.");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    },
    onError: (err) => {
      toast.error(err.message || "Registration failed");
    },
  });

  // ─── Face scan helpers ──────────────────────────────
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
        setFaceStatus("Position your face in the frame");

        // Simulate face detection and auto-capture after 3 seconds
        setTimeout(() => {
          setFaceStatus("Face detected! Hold still...");
          setTimeout(() => {
            captureSelfie();
          }, 1500);
        }, 2000);
      }
    } catch {
      setFaceStatus("Camera access denied. Please enable camera permissions.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureSelfie = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg");
        setSelfieUrl(dataUrl);
        setSelfieCaptured(true);
        setFaceStatus("Capture complete!");
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // ─── Validation ─────────────────────────────────────
  const canNext = () => {
    switch (step) {
      case 1:
        return fullName && email && password.length >= 8 && password === confirmPassword && mobileNumber;
      case 2:
        return businessName && businessType && registrationNumber && taxId && industry && streetAddress && city && province && postalCode;
      case 3:
        return idType && idNumber && idFile && selfieCaptured;
      case 4:
        return permitFile;
      case 5:
        return agreedToTerms;
      default:
        return false;
    }
  };

  const handleSubmit = () => {
    if (!canNext()) return;
    registerMutation.mutate({
      email,
      password,
      fullName,
      mobileNumber,
      businessName,
      businessType: businessType as "sole_proprietorship" | "partnership" | "corporation" | "cooperative",
      registrationNumber,
      taxId,
      industry,
      yearsInOperation: 0,
      streetAddress,
      city,
      province,
      postalCode,
      // KYC
      idType: idType as "passport" | "drivers_license" | "national_id" | "umid" | "prc_id",
      idNumber,
      idFile: idFile || "",
      selfieUrl,
      // Business Documents
      permitNumber,
      permitFile: permitFile || "",
      secFile: secFile || "",
      birFile: birFile || "",
    });
  };

  // ─── File upload handler (mock) ─────────────────────
  const handleFileUpload = (setter: (v: string) => void) => {
    // Simulate file upload with a placeholder
    setter("uploaded-file-" + Date.now());
    toast.success("File uploaded successfully");
  };

  // ─── Password strength ──────────────────────────────
  const getPasswordStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();
  const strengthColors = ["bg-muted", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-[640px] mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3 glow-accent">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Create Your Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete the steps below to get started</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 px-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                    step > s.num && "bg-emerald-500 text-white",
                    step === s.num && "bg-primary text-white ring-4 ring-primary/20",
                    step < s.num && "bg-secondary text-muted-foreground",
                  )}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn("text-[10px] mt-1.5 font-medium hidden sm:block", step >= s.num ? "text-white" : "text-muted-foreground")}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("w-8 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-all", step > s.num ? "bg-emerald-500" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
          {/* ─── Step 1: Basic Info ────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-white">Basic Information</h2>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-muted-foreground">Full Name <span className="text-destructive">*</span></Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Juan Dela Cruz" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Address <span className="text-destructive">*</span></Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Password <span className="text-destructive">*</span></Label>
                  <div className="relative mt-1.5">
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Min 8 characters" className="h-11 bg-secondary/50 border-border pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= strength ? strengthColors[strength] : "bg-muted")} />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1">{strengthLabels[strength]}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Confirm Password <span className="text-destructive">*</span></Label>
                  <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="Re-enter password" className={cn("mt-1.5 h-11 bg-secondary/50 border-border", confirmPassword && confirmPassword !== password && "border-destructive")} />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Mobile Number <span className="text-destructive">*</span></Label>
                  <Input value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="+63 912 345 6789" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 2: Business Details ──────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-white">Business Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground">Business Name <span className="text-destructive">*</span></Label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="ABC Enterprises Inc." className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Business Type <span className="text-destructive">*</span></Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger className="mt-1.5 h-11 bg-secondary/50 border-border"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="corporation">Corporation</SelectItem>
                      <SelectItem value="cooperative">Cooperative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registration No <span className="text-destructive">*</span></Label>
                  <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="SEC123456" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Tax ID / TIN <span className="text-destructive">*</span></Label>
                  <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="000-123-456-000" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Industry <span className="text-destructive">*</span></Label>
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Retail, Technology" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-muted-foreground">Street Address <span className="text-destructive">*</span></Label>
                  <Input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="123 Main Street" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">City <span className="text-destructive">*</span></Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Makati" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Province <span className="text-destructive">*</span></Label>
                  <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Metro Manila" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Postal Code <span className="text-destructive">*</span></Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="1200" className="mt-1.5 h-11 bg-secondary/50 border-border" />
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 3: Identity Verification ─────────────── */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-white">Identity Verification</h2>

              {/* ID Upload */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Government-Issued ID</Label>
                <Select value={idType} onValueChange={setIdType}>
                  <SelectTrigger className="h-11 bg-secondary/50 border-border"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="drivers_license">Driver&apos;s License</SelectItem>
                    <SelectItem value="national_id">National ID (PhilSys)</SelectItem>
                    <SelectItem value="umid">UMID</SelectItem>
                    <SelectItem value="prc_id">PRC ID</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="ID Number" className="h-11 bg-secondary/50 border-border" />
                <div
                  onClick={() => handleFileUpload(setIdFile)}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  {idFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="text-sm">ID uploaded successfully</span>
                    </div>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Click to upload ID photo</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF. Max 5MB.</p>
                    </>
                  )}
                </div>
              </div>

              {/* Face Scan */}
              <div className="space-y-3">
                <Label className="text-muted-foreground">Live Face Verification</Label>
                <p className="text-xs text-muted-foreground">Position your face within the frame and click Start</p>

                <div className="relative bg-black rounded-xl overflow-hidden border border-border" style={{ width: "100%", maxWidth: 400, height: 300, margin: "0 auto" }}>
                  {selfieCaptured && selfieUrl ? (
                    <img src={selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  )}
                  {/* Oval guide overlay */}
                  {!selfieCaptured && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-40 h-52 border-2 border-dashed border-white/30 rounded-full" />
                    </div>
                  )}
                  {/* Status */}
                  <div className="absolute bottom-3 left-0 right-0 text-center">
                    <span className={cn("text-xs px-3 py-1 rounded-full", selfieCaptured ? "bg-emerald-500/20 text-emerald-400" : "bg-black/60 text-white")}>
                      {faceStatus}
                    </span>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex gap-2 justify-center">
                  {!selfieCaptured && !cameraActive && (
                    <Button onClick={startCamera} type="button" variant="outline" className="border-border">
                      <Camera className="h-4 w-4 mr-2" /> Start Face Verification
                    </Button>
                  )}
                  {selfieCaptured && (
                    <Button onClick={() => { setSelfieCaptured(false); setSelfieUrl(""); startCamera(); }} type="button" variant="outline" className="border-border">
                      <Camera className="h-4 w-4 mr-2" /> Retake
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 4: Documents ────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-white">Business Documents</h2>

              {/* Business Permit */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Business Permit / Mayor&apos;s Permit <span className="text-destructive">*</span></Label>
                <Input value={permitNumber} onChange={(e) => setPermitNumber(e.target.value)} placeholder="Permit Number" className="h-11 bg-secondary/50 border-border" />
                <div onClick={() => handleFileUpload(setPermitFile)} className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  {permitFile ? (
                    <span className="text-sm text-emerald-400 flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Uploaded</span>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> Upload Permit</span>
                  )}
                </div>
              </div>

              {/* SEC Registration */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">SEC/CDA Registration Certificate</Label>
                <div onClick={() => handleFileUpload(setSecFile)} className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  {secFile ? (
                    <span className="text-sm text-emerald-400 flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Uploaded</span>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> Upload Certificate</span>
                  )}
                </div>
              </div>

              {/* BIR COR */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">BIR Certificate of Registration</Label>
                <div onClick={() => handleFileUpload(setBirFile)} className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  {birFile ? (
                    <span className="text-sm text-emerald-400 flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4" /> Uploaded</span>
                  ) : (
                    <span className="text-sm text-muted-foreground flex items-center justify-center gap-2"><Upload className="h-4 w-4" /> Upload COR</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── Step 5: Review ───────────────────────────── */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-lg font-semibold text-white">Review Your Information</h2>

              <div className="space-y-3">
                <ReviewSection title="Account Information" items={[
                  { label: "Full Name", value: fullName },
                  { label: "Email", value: email },
                  { label: "Mobile", value: mobileNumber },
                ]} />
                <ReviewSection title="Business Information" items={[
                  { label: "Business Name", value: businessName },
                  { label: "Type", value: businessType },
                  { label: "Registration", value: registrationNumber },
                  { label: "Address", value: `${streetAddress}, ${city}, ${province}` },
                ]} />
                <ReviewSection title="Verification" items={[
                  { label: "ID Type", value: idType },
                  { label: "ID Number", value: idNumber },
                  { label: "Selfie", value: selfieCaptured ? "Captured" : "Not captured" },
                ]} />
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox id="terms" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(v as boolean)} />
                <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                  I have read and agree to the{" "}
                  <button onClick={() => navigate("/terms")} className="text-primary hover:underline">Terms and Conditions</button>
                  {" "}and{" "}
                  <button onClick={() => navigate("/compliance")} className="text-primary hover:underline">Privacy Policy</button>
                </Label>
              </div>
            </div>
          )}

          {/* ─── Navigation ───────────────────────────────── */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setStep((s) => (s - 1) as Step)}
              disabled={step === 1}
              className="border-border h-11"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            {step < 5 ? (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canNext()}
                className="gradient-accent h-11 font-semibold"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canNext() || registerMutation.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 h-11 font-semibold"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Submit Application
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-primary hover:underline">Sign in</button>
        </p>
      </div>
    </div>
  );
}

function ReviewSection({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="bg-secondary/30 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-3">{title}</h3>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
            <p className="text-xs text-white truncate">{item.value || "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
