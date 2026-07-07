import { cn } from "@/src/lib/utils";
import { Wallet, TrendingUp, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

interface NavbarProps {
  onNavigate: (page: "landing" | "dashboard" | "investment") => void;
  activePage: string;
}

export default function Navbar({ onNavigate, activePage }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", value: "landing", icon: Wallet },
    { label: "Investment", value: "investment", icon: TrendingUp },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass-card px-6 py-2.5 rounded-[24px] premium-stroke">
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => onNavigate("landing")}
        >
          <span className="font-display text-2xl font-black tracking-tighter text-gt-orange italic">SAABI</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => onNavigate(item.value as any)}
              className={cn(
                "text-sm font-bold tracking-widest uppercase transition-colors hover:text-gt-orange flex items-center gap-2",
                activePage === item.value ? "text-gt-orange" : "text-white/40"
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
          <button 
             onClick={() => onNavigate("dashboard")}
             className="bg-white text-black hover:bg-gt-orange hover:text-white px-6 py-2 rounded-full text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            DASHBOARD
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 left-6 right-6 md:hidden glass-card p-6 rounded-2xl z-40"
          >
            <div className="flex flex-col gap-6">
              {navItems.map((item) => (
                <button
                  key={item.value}
                  onClick={() => {
                    onNavigate(item.value as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "text-lg font-medium flex items-center gap-4 transition-colors",
                    activePage === item.value ? "text-gt-orange" : "text-white/70"
                  )}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
              <hr className="border-white/10" />
              <button 
                onClick={() => {
                   onNavigate("dashboard");
                   setIsMobileMenuOpen(false);
                }}
                className="bg-gt-orange text-white py-4 rounded-xl font-bold"
              >
                Launch App
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
