import { motion } from "motion/react";
import { MessageCircleMore, Smartphone, Zap, CheckCircle2 } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Save Number",
    desc: "Save the SAABI number on your phone or scan the QR code to start.",
    icon: Smartphone,
    detail: "+234 800 000 SAABI"
  },
  {
    id: "02",
    title: "Say 'Hello'",
    desc: "Open WhatsApp and send 'Hello'. Our friendly Bot will reply instantly.",
    icon: MessageCircleMore,
    detail: "Available 24/7"
  },
  {
    id: "03",
    title: "Start Trading",
    desc: "Send 'Pay' or 'Find Plumber' to start doing business. It's that easy!",
    icon: Zap,
    detail: "Stress Free"
  }
];

export default function OnboardingSection() {
  return (
    <section className="px-6 py-32 max-w-7xl mx-auto border-y border-white/5 bg-[#050505] relative overflow-hidden">
      {/* Aesthetic strokes */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-white/10 via-transparent to-transparent" />
      </div>

      {/* Background visual flair */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gt-orange/5 blur-[120px] rounded-full" />
      </div>

      <div className="text-center mb-24">
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter uppercase">
          START IN <span className="text-gt-orange text-glow">SECONDS</span>
        </h2>
        <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
          No complex apps. No long forms. Just you and your WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
        {steps.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center group"
          >
            <div className="relative mb-10">
              {/* Connector line for desktop */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-[48px] left-[130px] w-[calc(100%+80px)] h-[1px] bg-gradient-to-r from-gt-orange/30 via-gt-orange/10 to-transparent z-0" />
              )}
              
              <div className="w-24 h-24 rounded-[32px] bg-gt-orange/10 flex items-center justify-center relative z-10 border border-gt-orange/20 transition-all group-hover:scale-110 group-hover:border-gt-orange/50 duration-500 shadow-[0_0_50px_-20px_rgba(228,93,0,0.5)]">
                {/* Inner decorative rings */}
                <div className="absolute inset-2 rounded-[24px] border border-white/5 pointer-events-none" />
                <div className="absolute inset-4 rounded-[20px] border border-gt-orange/5 pointer-events-none" />
                
                <step.icon size={36} className="text-gt-orange brightness-110 drop-shadow-[0_0_8px_rgba(228,93,0,0.5)]" />
                
                <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gt-orange text-white font-mono font-black text-xs flex items-center justify-center border-4 border-[#050505] shadow-[0_0_20px_rgba(228,93,0,0.4)]">
                  {step.id}
                </span>
              </div>
            </div>

            <h3 className="text-2xl font-bold mb-4 tracking-tight uppercase">{step.title}</h3>
            <p className="text-white/40 text-base font-light mb-6 leading-relaxed px-4 max-w-sm">
              {step.desc}
            </p>
            
            <div className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] tracking-[0.3em] font-black uppercase text-white/40 group-hover:text-gt-orange group-hover:border-gt-orange/20 transition-all duration-300">
                {step.detail}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-24 text-center">
        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-3xl bg-gt-orange/5 border border-white/5 hover:border-gt-orange/20 transition-colors">
            <CheckCircle2 className="text-gt-orange" size={20} />
            <span className="text-white/40 font-bold tracking-widest text-[10px] uppercase">
              <span className="text-white">Get Started Today</span> And Join The Sabbi People
            </span>
        </div>
      </div>
    </section>
  );
}
