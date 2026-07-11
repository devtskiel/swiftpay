import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, CheckCircle } from "lucide-react";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using the Swift Pay Merchant Portal, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the service. These terms constitute a legally binding agreement between you and Swift Pay Inc.",
  },
  {
    title: "2. Merchant Obligations",
    content: "As a merchant, you agree to: (a) provide accurate and complete information during registration; (b) maintain the security of your account credentials; (c) comply with all applicable laws and regulations including BSP Circular 1049; (d) not use the service for any illegal or unauthorized purpose; (e) promptly notify us of any unauthorized access or security breach.",
  },
  {
    title: "3. Payment Processing",
    content: "Swift Pay facilitates payment processing services. You authorize us to process transactions on your behalf. Settlement of funds will occur according to the schedule agreed upon in your merchant agreement. You acknowledge that transaction processing times may vary depending on the payment method and banking institution.",
  },
  {
    title: "4. Fees and Charges",
    content: "You agree to pay all applicable fees as set forth in your merchant agreement. Fees may include transaction processing fees, monthly service fees, chargeback fees, and any other fees specified. All fees are non-refundable unless otherwise stated. We reserve the right to modify fees with 30 days advance notice.",
  },
  {
    title: "5. Chargebacks and Disputes",
    content: "You are responsible for all chargebacks, refunds, and disputed transactions. We may deduct chargeback amounts and associated fees from your settlement funds. You agree to cooperate fully in resolving any disputes and to provide requested documentation within the specified timeframe.",
  },
  {
    title: "6. Data Privacy",
    content: "We collect and process personal data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). By using our service, you consent to our collection, use, and disclosure of personal information as described in our Privacy Policy. We implement appropriate security measures to protect your data.",
  },
  {
    title: "7. Termination",
    content: "Either party may terminate this agreement with 30 days written notice. We may suspend or terminate your account immediately for violation of these terms, fraudulent activity, or if required by law. Upon termination, you remain liable for all outstanding fees and chargebacks.",
  },
  {
    title: "8. Limitation of Liability",
    content: "To the maximum extent permitted by law, Swift Pay shall not be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability shall not exceed the total amount of fees paid by you in the 12 months preceding the claim.",
  },
  {
    title: "9. Governing Law",
    content: "These terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes shall be resolved through arbitration in Metro Manila in accordance with the rules of the Philippine Dispute Resolution Center.",
  },
  {
    title: "10. Amendments",
    content: "We reserve the right to modify these terms at any time. Changes will be effective upon posting to the portal. Your continued use of the service constitutes acceptance of the modified terms. Material changes will be notified via email at least 15 days before taking effect.",
  },
];

export default function Terms() {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">Terms and Conditions</h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: January 1, 2026</p>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="p-6 max-h-[600px] overflow-y-auto space-y-6">
            {SECTIONS.map((section) => (
              <div key={section.title}>
                <h2 className="text-sm font-semibold text-white mb-2">{section.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">{section.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Acceptance */}
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Checkbox id="accept" checked={accepted} onCheckedChange={(v) => setAccepted(v as boolean)} />
            <label htmlFor="accept" className="text-xs text-muted-foreground cursor-pointer">
              I have read and agree to the Terms and Conditions
            </label>
          </div>
          <Button disabled={!accepted} onClick={() => navigate("/register")} className="gradient-accent h-10 font-semibold">
            <CheckCircle className="h-4 w-4 mr-2" /> Accept & Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
