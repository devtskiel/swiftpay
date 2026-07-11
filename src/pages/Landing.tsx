import { useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  ShieldCheck,
  BarChart3,
  Zap,
  Globe,
  Users,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Lock
} from "lucide-react";

const Logo3D = () => (
  <div className="relative group perspective-1000">
    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-accent preserve-3d group-hover:rotate-y-12 transition-transform duration-500 shadow-[0_10px_20px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)]">
      <Wallet className="h-6 w-6 text-white transform -translate-z-2" />
      <div className="absolute inset-0 rounded-xl bg-white/10 transform translate-z-1 pointer-events-none"></div>
    </div>
  </div>
);

const PartnerLogo = ({ name, icon: Icon }: { name: string, icon: any }) => (
  <div className="flex items-center gap-2 px-6 py-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 cursor-pointer group">
    <div className="p-2 rounded-lg bg-secondary/50 border border-transparent group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:scale-110 transition-all shadow-lg preserve-3d group-hover:rotate-x-12">
      <Icon className="h-6 w-6 text-foreground group-hover:text-primary" />
    </div>
    <span className="font-bold tracking-tight text-lg">{name}</span>
  </div>
);

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#02040a] text-foreground selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? "py-3 bg-[#02040a]/80 backdrop-blur-xl border-b border-white/5" : "py-6 bg-transparent"}`}>
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <Logo3D />
            <span className="text-2xl font-black tracking-tighter text-3d">Swift Pay</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-muted-foreground/80">
            <a href="#features" className="hover:text-primary transition-all hover:-translate-y-0.5">Features</a>
            <a href="#merchants" className="hover:text-primary transition-all hover:-translate-y-0.5">Merchants</a>
            <a href="#security" className="hover:text-primary transition-all hover:-translate-y-0.5">Security</a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-bold hover:bg-white/5" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button size="sm" className="font-bold shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all" onClick={() => navigate("/register")}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-56 md:pb-40 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
          </div>

          <div className="container mx-auto px-4 relative">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8 animate-fade-in glass-card">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                The future of digital commerce is here
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9] perspective-1000">
                <span className="inline-block animate-fade-in [animation-delay:200ms] text-white">Scale your</span><br />
                <span className="inline-block animate-fade-in [animation-delay:400ms] text-primary italic rotate-x-12">Empire</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-medium animate-fade-in [animation-delay:600ms]">
                Accept any payment, anywhere. We provide the 3D-secure infrastructure for modern businesses to thrive in the global economy.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fade-in [animation-delay:800ms]">
                <Button size="lg" className="h-14 px-10 text-lg font-black gradient-accent rounded-2xl shadow-2xl hover:scale-105 transition-transform" onClick={() => navigate("/register")}>
                  Start Now
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-2xl border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all">
                  Book Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Partners/Logo Wall */}
        <section className="py-12 border-y border-white/5 bg-white/[0.02]">
          <div className="container mx-auto px-4 overflow-hidden">
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8">
              <PartnerLogo name="VISA" icon={CreditCard} />
              <PartnerLogo name="Mastercard" icon={CreditCard} />
              <PartnerLogo name="Apple Pay" icon={Smartphone} />
              <PartnerLogo name="Google Pay" icon={Smartphone} />
              <PartnerLogo name="Stripe" icon={Wallet} />
              <PartnerLogo name="PayPal" icon={Wallet} />
            </div>
          </div>
        </section>

        {/* Features Grid with 3D effects */}
        <section id="features" className="py-32 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">The 3D Advantage</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                Our multi-layered security and lightning-fast processing gives your business the edge it deserves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                {
                  icon: <Zap className="h-8 w-8" />,
                  title: "Ultra-Fast API",
                  description: "100ms response times. Integrate once, scale forever with our developer-first infrastructure."
                },
                {
                  icon: <Lock className="h-8 w-8" />,
                  title: "3D Secure 2.0",
                  description: "Advanced fraud protection that doesn't sacrifice conversion. Built-in compliance."
                },
                {
                  icon: <BarChart3 className="h-8 w-8" />,
                  title: "AI Analytics",
                  description: "Predictive insights to optimize your checkout flow and boost revenue automatically."
                }
              ].map((feature, idx) => (
                <div key={idx} className="group perspective-1000">
                  <div className="p-10 rounded-[2.5rem] bg-card border border-white/5 hover:border-primary/50 transition-all duration-700 preserve-3d group-hover:rotate-x-12 group-hover:rotate-y-6 shadow-2xl relative overflow-hidden h-full">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/20 transition-colors"></div>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner group-hover:scale-110 transition-transform duration-500">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed text-lg font-medium">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Merchant Section - Focus on 3D Mockup */}
        <section id="merchants" className="py-32 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row items-center gap-20">
              <div className="flex-1 space-y-8">
                <h2 className="text-4xl md:text-6xl font-black leading-[0.95]">
                  Everything you need <br />
                  <span className="text-primary italic">In One View.</span>
                </h2>
                <p className="text-xl text-muted-foreground leading-relaxed font-medium">
                  We've reimagined the merchant portal. A sleek, high-performance interface that gives you total control over your financial operations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    "Global Payouts",
                    "Custom Checkout",
                    "Fraud Shields",
                    "No-Code Billing"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-bold">{item}</span>
                    </div>
                  ))}
                </div>

                <Button size="lg" className="h-14 px-10 rounded-2xl font-black text-lg" onClick={() => navigate("/register")}>
                  Join as Merchant
                </Button>
              </div>

              <div className="flex-1 w-full perspective-1000">
                <div className="relative transform rotate-y-[-20deg] rotate-x-[10deg] hover:rotate-y-[-10deg] hover:rotate-x-[5deg] transition-all duration-700 preserve-3d">
                  {/* Floating elements */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>

                  {/* Main Mockup Card */}
                  <div className="glass-card p-8 rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-white/10 relative z-10">
                    <div className="flex items-center justify-between mb-10">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Available Balance</div>
                        <div className="text-4xl font-black text-white">$42,850.12</div>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center glow-accent">
                        <Wallet className="h-8 w-8 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-[70%] bg-primary glow-accent"></div>
                      </div>
                      <div className="flex justify-between text-sm font-bold">
                        <span className="text-muted-foreground">Monthly Target</span>
                        <span className="text-white">70%</span>
                      </div>
                    </div>

                    <div className="mt-12 grid grid-cols-3 gap-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse"></div>
                      ))}
                    </div>
                  </div>

                  {/* Secondary floating cards */}
                  <div className="absolute -bottom-10 -left-10 glass-card p-6 rounded-2xl shadow-2xl border-white/10 transform translate-z-10 w-64 animate-bounce-slow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-green-500 rotate-[-45deg]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-muted-foreground">Recent Sale</div>
                        <div className="text-sm font-black">+$1,250.00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto glass-card p-12 md:p-24 rounded-[3rem] border-white/5 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none"></div>
              <ShieldCheck className="h-20 w-20 text-primary mx-auto mb-10 glow-accent" />
              <h2 className="text-4xl md:text-6xl font-black mb-8">Fortified Security.</h2>
              <p className="text-xl text-muted-foreground mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
                Your data is protected by multi-layered encryption and SOC2 compliant infrastructure. We handle the complexity so you can focus on growth.
              </p>
              <div className="flex flex-wrap justify-center gap-8">
                {["PCI DSS Level 1", "SOC2 Type II", "GDPR Compliant", "ISO 27001"].map(cert => (
                  <div key={cert} className="flex items-center gap-2 text-sm font-bold text-white/60">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    {cert}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-5xl md:text-8xl font-black mb-12 tracking-tighter leading-tight">
              Ready to go <br />
              <span className="text-primary italic">Global?</span>
            </h2>
            <Button size="lg" className="h-20 px-16 text-2xl font-black rounded-3xl gradient-accent shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:scale-105 transition-all" onClick={() => navigate("/register")}>
              Sign Up Now
            </Button>
            <p className="mt-10 text-muted-foreground font-bold">
              Join 10,000+ merchants already scaling with Swift Pay
            </p>
          </div>
        </section>
      </main>

      <footer className="py-20 border-t border-white/5 bg-black">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Logo3D />
                <span className="text-2xl font-black tracking-tighter">Swift Pay</span>
              </div>
              <p className="text-muted-foreground text-lg max-w-sm font-medium leading-relaxed">
                The world's most powerful payment infrastructure for modern merchants and digital empires.
              </p>
            </div>

            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4 text-muted-foreground font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">Platform</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Checkout</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Payouts</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-bold">
                <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-white/5">
            <p className="text-sm text-muted-foreground font-bold">
              © {new Date().getFullYear()} Swift Pay Solutions. High-performance payments.
            </p>
            <div className="flex gap-8 text-sm font-bold text-muted-foreground">
              <button onClick={() => navigate("/terms")} className="hover:text-primary">Terms</button>
              <button onClick={() => navigate("/compliance")} className="hover:text-primary">Compliance</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
