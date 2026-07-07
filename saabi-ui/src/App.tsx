
import { useState, useEffect } from "react";
import LandingPage from "@/src/pages/LandingPage";
import Dashboard from "@/src/pages/Dashboard";
import InvestmentPage from "@/src/pages/InvestmentPage";
import Navbar from "@/src/components/layout/Navbar";
import HeroFooter from "@/src/components/layout/HeroFooter";
import FloatingWhatsApp from "@/src/components/ui/FloatingWhatsApp";
import LoginModal from "@/src/components/ui/LoginModal";
import { supabase } from "@/src/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"landing" | "dashboard" | "investment">("landing");
  const [user, setUser] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPage, setPendingPage] = useState<"dashboard" | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: "landing" | "dashboard" | "investment") => {
    if (page === "dashboard" && !user) {
      setPendingPage("dashboard");
      setShowLoginModal(true);
      return;
    }
    
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingPage) {
      setCurrentPage(pendingPage);
      setPendingPage(null);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg selection:bg-gt-orange/30 selection:text-gt-orange">
      <Navbar onNavigate={handleNavigate} activePage={currentPage} />
      <main>
        {currentPage === "landing" && <LandingPage onNavigate={handleNavigate} />}
        {currentPage === "dashboard" && <Dashboard user={user} />}
        {currentPage === "investment" && <InvestmentPage />}
      </main>
      
      {currentPage === "landing" && <HeroFooter />}
      <FloatingWhatsApp />

      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => {
          setShowLoginModal(false);
          setPendingPage(null);
        }}
        onSuccess={handleLoginSuccess}
      />
      
      {/* Background glow effects */}
      <div className="fixed top-0 -z-10 h-full w-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[10%] h-[500px] w-[500px] rounded-full bg-gt-orange/10 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-gt-orange/5 blur-[120px]" />
      </div>
    </div>
  );
}
