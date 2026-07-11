import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Wallet,
  Send,
  Receipt,
  Users,
  Landmark,
  Building2,
  Settings,
  Code,
  Shield,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Wallet, label: "Collections", path: "/collections" },
  { icon: Send, label: "Disbursements", path: "/disbursements" },
  { icon: Receipt, label: "Transactions", path: "/transactions" },
  { icon: Users, label: "Members", path: "/members" },
  { icon: Landmark, label: "Balance", path: "/balance" },
  { icon: Building2, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: Code, label: "Developer", path: "/developer" },
  { icon: Shield, label: "Compliance", path: "/compliance" },
  { icon: FileText, label: "Terms", path: "/terms" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0D1128] border-r border-border transition-all duration-300",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-border">
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden mr-2"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Wallet className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <div>
                <span className="font-bold text-sm text-white tracking-tight">Swift Pay</span>
                <span className="block text-[10px] text-muted-foreground leading-none">Merchant Portal</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto h-6 w-6 items-center justify-center rounded hover:bg-white/10 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group",
                  isActive
                    ? "bg-primary/15 text-primary border-l-[3px] border-l-primary"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground border-l-[3px] border-l-transparent",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                {!collapsed && (
                  <span className="text-[13px] font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div
            className={cn(
              "flex items-center gap-3 px-2 py-2 rounded-lg",
              collapsed ? "justify-center" : "",
            )}
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary text-xs font-bold">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate capitalize">
                  {user.role?.replace("_", " ")}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-destructive"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="mr-3">
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
              <Wallet className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm">Swift Pay</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
