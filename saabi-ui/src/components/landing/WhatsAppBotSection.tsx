import { motion } from "motion/react";
import { MessageCircle, Phone, Sparkles, Send } from "lucide-react";

export default function WhatsAppBotSection() {
  const openWhatsApp = () => {
    const whatsappURL = import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/2348086609436";
    window.open(whatsappURL, "_blank");
  };

  return (
    <section className="px-6 py-32 max-w-7xl mx-auto relative overflow-hidden">
      <div className="glass-card rounded-[48px] p-8 md:p-20 flex flex-col lg:flex-row items-center gap-16 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gt-orange/10 blur-[120px] -z-10 -translate-y-1/2 translate-x-1/2" />
        
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gt-orange/10 border border-gt-orange/20 text-gt-orange text-[10px] font-black uppercase tracking-[0.3em] mb-8">
            <Sparkles size={12} />
            Pure Simplicity
          </div>
          
          <h2 className="text-4xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter uppercase">
            YOUR BUSINESS <br /> IN YOUR <span className="text-gt-orange text-glow">POCKET</span>
          </h2>
          
          <p className="text-white/40 text-lg md:text-xl font-light mb-12 max-w-xl leading-relaxed">
            Forget complex apps. Just send a text. Check sales, pay suppliers, and find customers directly on WhatsApp.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <button 
              onClick={openWhatsApp}
              className="bg-gt-orange text-white px-10 py-5 rounded-full font-bold text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-gt-orange/20"
            >
              CHAT WITH SAABI
              <MessageCircle size={22} className="fill-white/20" />
            </button>
          </div>
        </div>

        <div className="flex-[1.5] relative">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-center relative z-10 scale-90 md:scale-100">
            {/* Mock Phone 1: Discovery */}
            <div className="glass-card p-6 rounded-3xl w-full max-w-[280px] border-gt-orange/20 relative shadow-2xl">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gt-orange flex items-center justify-center font-black text-white text-[10px]">S</div>
                    <div>
                        <div className="text-xs font-bold">SAABI Bot</div>
                        <div className="text-[8px] text-gt-orange uppercase tracking-widest font-bold">Online</div>
                    </div>
                </div>

                <div className="space-y-3 min-h-[160px]">
                    <div className="bg-white/5 p-2.5 rounded-2xl rounded-tl-none mr-6">
                        <p className="text-[10px] text-white/60 leading-relaxed">Welcome! How can I help your business today?</p>
                    </div>
                    <div className="bg-gt-orange/20 p-2.5 rounded-2xl rounded-tr-none ml-6 border border-gt-orange/20">
                        <p className="text-[10px] text-white">Find plumber in Ikeja</p>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-2xl rounded-tl-none mr-6">
                        <p className="text-[10px] text-white/60 font-bold mb-1">Found 3 Plumbers</p>
                        <p className="text-[8px] text-white/40">1. Baba Tolu - 5.0 ★<br />2. Quick Fix - 4.8 ★</p>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                    <div className="flex-1 text-[8px] text-white/20 pl-2">Type...</div>
                    <div className="w-6 h-6 rounded-lg bg-gt-orange flex items-center justify-center">
                        <Send size={10} />
                    </div>
                </div>
            </div>

            {/* Mock Phone 2: Payments */}
            <div className="glass-card p-6 rounded-3xl w-full max-w-[280px] border-gt-orange/20 relative shadow-2xl md:mt-12">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gt-orange flex items-center justify-center font-black text-white text-[10px]">S</div>
                    <div>
                        <div className="text-xs font-bold">SAABI Bot</div>
                        <div className="text-[8px] text-gt-orange uppercase tracking-widest font-bold">Encrypted</div>
                    </div>
                </div>

                <div className="space-y-3 min-h-[160px]">
                    <div className="bg-gt-orange/20 p-2.5 rounded-2xl rounded-tr-none ml-6 border border-gt-orange/20">
                        <p className="text-[10px] text-white italic">"transfer 2k to John Opay 23488XXXXX"</p>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-2xl rounded-tl-none mr-6 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gt-orange animate-pulse" />
                            <p className="text-[10px] text-white/60 font-bold">Processing Transaction...</p>
                        </div>
                        <p className="text-[9px] text-white/40 leading-relaxed">Verifying John Opay (9827***31). Confirming ₦2,000.00 from your Wallet.</p>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-2xl rounded-tl-none mr-6">
                        <p className="text-[10px] text-gt-orange font-bold">✓ Payment Successful</p>
                        <p className="text-[8px] text-white/40">Ref: SAABI-992-TX • 2:40 PM</p>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5">
                    <div className="flex-1 text-[8px] text-white/20 pl-2">Type...</div>
                    <div className="w-6 h-6 rounded-lg bg-gt-orange flex items-center justify-center">
                        <Send size={10} />
                    </div>
                </div>
            </div>

            {/* Decorative Floating Icons */}
            <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-10 -right-5 w-16 h-16 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-center shadow-2xl z-20"
            >
                <Phone className="text-gt-orange" size={24} />
            </motion.div>
          </div>

          <div className="text-center mt-12 relative z-10 flex flex-col items-center gap-2">
            <div className="px-5 py-2 rounded-full border border-white/5 bg-white/2 text-[9px] tracking-[0.4em] font-black uppercase text-white/20">
              Powered by the <span className="text-white/40">SAABI ENGINE</span>
            </div>
          </div>

          {/* Glow Behind Phones */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gt-orange/20 blur-[100px] -z-10 rounded-full" />
        </div>
      </div>
    </section>
  );
}
