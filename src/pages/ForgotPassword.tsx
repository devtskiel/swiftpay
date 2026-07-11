import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Reset instructions sent to your email");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutation.mutate({ email });
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <MailCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-muted-foreground mb-8">
            We've sent password reset instructions to <span className="text-white font-medium">{email}</span>.
          </p>
          <Button onClick={() => navigate("/login")} variant="outline" className="w-full border-border">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4 glow-accent">
            <Wallet className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Swift Pay</h1>
          <p className="text-sm text-muted-foreground mt-1">Merchant Portal</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center text-xs text-muted-foreground hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Sign In
          </button>

          <h2 className="text-lg font-semibold text-white mb-1">Forgot Password?</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and we'll send you instructions to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm text-muted-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11 bg-secondary/50 border-border"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={mutation.isPending || !email}
              className="w-full h-11 gradient-accent hover:opacity-90 transition-opacity font-semibold"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
