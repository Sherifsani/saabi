import { motion, AnimatePresence } from "motion/react";
import { MessageCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const whatsappURL = import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/2348086609436"

  const openWhatsApp = () => {
    window.open(whatsappURL, "_blank");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          className="fixed bottom-8 right-8 z-[100] group"
        >
          {/* Label Tooltip */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gt-orange text-white text-[10px] font-black uppercase tracking-widest rounded-full opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 pointer-events-none whitespace-nowrap shadow-xl">
            Chat with SAABI
          </div>

          {/* Main Button */}
          <button
            onClick={openWhatsApp}
            className="w-16 h-16 rounded-full bg-gt-orange text-white flex items-center justify-center shadow-[0_0_40px_-5px_rgba(228,93,0,0.6)] hover:scale-110 active:scale-95 transition-all relative overflow-hidden"
          >
            {/* Animated Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-20" />
            
            <MessageCircle size={30} className="fill-white/10 group-hover:scale-110 transition-transform" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
