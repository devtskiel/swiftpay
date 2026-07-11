import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserCheck, Lock, Fingerprint, CheckCircle } from "lucide-react";

export default function Compliance() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Regulatory Compliance</h1>
          <p className="text-sm text-muted-foreground">Our commitment to regulatory standards and your protection</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* BSP Regulation */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" /> BSP Regulated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Swift Pay is regulated by the Bangko Sentral ng Pilipinas (BSP) as an Operator of Payment System (OPS)
                and Electronic Money Issuer (EMI). We adhere to all applicable BSP circulars and regulations including 
                but not limited to BSP Circular No. 1049 (National Payment Systems Act) and BSP Circular No. 1105 
                (Digital Payments Transformation Roadmap).
              </p>
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">License Information</p>
                <p className="text-xs font-mono text-white mt-0.5">License No.: OPS-2023-XXXX</p>
                <p className="text-xs font-mono text-white">EMI Cert.: EMI-2023-YYYY</p>
              </div>
            </CardContent>
          </Card>

          {/* KYC/AML */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-500" /> KYC & Anti-Money Laundering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We implement a risk-based approach to Know Your Customer (KYC) and Anti-Money Laundering (AML) 
                compliance in accordance with BSP regulations. Our program includes customer identification, 
                ongoing due diligence, transaction monitoring, and suspicious activity reporting.
              </p>
              <ul className="space-y-1.5">
                {[
                  "Customer identification and verification",
                  "Beneficial ownership verification",
                  "Ongoing transaction monitoring",
                  "Sanctions and PEP screening",
                  "Suspicious Activity Report (SAR) filing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white">
                    <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Data Privacy */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-amber-500" /> Data Privacy Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), we are committed to 
                protecting your personal information. Our privacy practices include:
              </p>
              <ul className="space-y-1.5">
                {[
                  "Lawful processing of personal data",
                  "Implementation of security measures",
                  "Data subject rights (access, correction, erasure)",
                  "Data breach notification procedures",
                  "DPO contact: privacy@swiftpay.ph",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white">
                    <CheckCircle className="h-3 w-3 text-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Security Standards */}
          <Card className="bg-card border-border card-hover-glow">
            <CardHeader>
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-primary" /> Security Standards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                We maintain the highest security standards to protect your data and transactions. Our security 
                infrastructure includes industry-leading encryption, regular audits, and compliance certifications.
              </p>
              <ul className="space-y-1.5">
                {[
                  "PCI-DSS Level 1 compliance",
                  "SSL/TLS encryption for all data transmission",
                  "AES-256 encryption for data at rest",
                  "Regular penetration testing",
                  "Third-party security audits",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-white">
                    <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
