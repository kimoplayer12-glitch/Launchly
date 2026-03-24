import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useFirebaseAuth } from "@/hooks/use-firebase-auth";
import { useTheme } from "@/hooks/use-theme";
import {
  Home,
  FileText,
  Share2,
  Zap,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  Calendar,
  Compass,
  Globe,
  DollarSign,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useFirebaseAuth();
  const { theme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const navGroups: NavGroup[] = [
    {
      title: "Main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
        {
          id: "analytics",
          label: "Analytics",
          icon: Compass,
          path: "/dashboard/analytics",
        },
        {
          id: "automations",
          label: "Automations",
          icon: Share2,
          path: "/dashboard/automations",
        },
      ],
    },
    {
      title: "Business Tools",
      items: [
        { id: "business", label: "Business Builder", icon: FileText, path: "/business-builder" },
        { id: "growth-plan", label: "Growth Plan", icon: Compass, path: "/growth-plan" },
        { id: "monetize", label: "Monetize Hub", icon: DollarSign, path: "/monetize-hub" },
      ],
    },
    {
      title: "Content & Marketing",
      items: [
        { id: "contentgen", label: "Content Generator", icon: Zap, path: "/content-generator" },
        { id: "scheduler", label: "Social Scheduler", icon: Calendar, path: "/social-media-scheduler" },
        { id: "adgen", label: "AdGen AI", icon: Zap, path: "/adgen" },
      ],
    },
    {
      title: "Generators",
      items: [
        { id: "website-mvp", label: "Website Editor", icon: Globe, path: "/dashboard/generate" },
        { id: "shop", label: "Store Generator", icon: ShoppingCart, path: "/generate-store" },
        { id: "website", label: "Website Generator", icon: Globe, path: "/generate-website" },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-[#111116]/95 backdrop-blur border-r border-white/10 p-6 transition-transform duration-300 z-40 lg:translate-x-0 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="mb-6 pt-4">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-neon-cyan flex items-center justify-center shadow-[0_8px_18px_rgba(124,92,255,0.35)]">
              <span className="text-xs font-bold text-white">LL</span>
            </div>
            <span className="font-bold text-lg">Launchly</span>
          </div>
        </div>
        {/* User Info */}
        <div className="mb-5 p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-foreground/60 mb-1">Logged in as</p>
          <p className="font-medium text-sm truncate">{user?.displayName || user?.email}</p>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto pr-2 mb-16">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-4">
              {/* Group Title */}
              <p className="px-3 py-1 text-[10px] font-semibold text-foreground/40 uppercase tracking-[0.2em]">
                {group.title}
              </p>
              {/* Group Items */}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        navigate(item.path);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/10 text-foreground border border-white/10"
                          : "text-foreground/70 hover:text-foreground hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions - Fixed */}
        <div className="space-y-2 border-t border-white/10 pt-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="truncate">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => {
              navigate("/settings");
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="truncate">Settings</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}

      {/* Main Content Offset */}
      <div className="hidden lg:block w-64" />
    </>
  );
}
