import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight } from "lucide-react";

interface HeroProps {
  onExplore: (page: "dashboard" | "investment") => void;
}

export default function Hero({ onExplore }: HeroProps) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".hero-title", {
      y: 60,
      opacity: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.1
    });

    gsap.from(".hero-desc", {
      y: 40,
      opacity: 0,
      duration: 1,
      delay: 0.5,
      ease: "power3.out"
    });

    gsap.from(".hero-btns", {
      y: 30,
      opacity: 0,
      duration: 1,
      delay: 0.8,
      ease: "power3.out"
    });

    gsap.from(".globe-container", {
      scale: 0.8,
      opacity: 0,
      duration: 2,
      delay: 0.3,
      ease: "power2.out"
    });

  }, { scope: root });

  return (
    <section ref={root} className="relative min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Golden Globe Background */}
      <div className="globe-container absolute inset-0 -z-20 flex items-center justify-center pointer-events-none">
        <div className="relative w-[800px] h-[800px] md:w-[1000px] md:h-[1000px]">
          {/* Outer glow rings */}
          <div className="globe-glow absolute inset-0 rounded-full bg-gt-orange/20 blur-[120px]" />
          <div className="absolute inset-8 rounded-full bg-gt-orange/10 blur-[80px] animate-pulse" />

          {/* The golden globe image */}
          <img 
            src="/golden_globe_main_asset_img.png" 
            alt="SAABI Globe"
            className="absolute inset-0 w-full h-full object-contain opacity-90 drop-shadow-[0_0_60px_rgba(228,93,0,0.4)]"
          />

          {/* Rotating ring effect */}
          <div className="absolute inset-0 rounded-full border border-gt-orange/20 animate-[spin_20s_linear_infinite]" 
               style={{ borderStyle: 'dashed', borderWidth: '1px' }} />
          <div className="absolute inset-12 rounded-full border border-white/10 animate-[spin_15s_linear_infinite_reverse]" 
               style={{ borderStyle: 'dotted', borderWidth: '2px' }} />
        </div>
      </div>

      {/* Dark overlay gradients */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-dark-bg/40" />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-bg via-transparent to-dark-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_#050505_100%)]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gt-orange/60 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex justify-center mb-8">
            <div className="px-4 py-1.5 rounded-lg border border-gt-orange/30 bg-gt-orange/10 text-[10px] tracking-[0.3em] font-black uppercase text-gt-orange backdrop-blur-sm">
                 FOR SAABI PEOPLE, BY SAABI PEOPLE
            </div>
        </div>

        <h1 className="hero-title text-5xl md:text-8xl font-bold leading-[0.95] mb-10 tracking-tighter uppercase">
          THE <span className="text-gt-orange text-glow brightness-125">REAL</span> ENGINE <br className="hidden md:block" /> OF COMMERCE
        </h1>

        <p className="hero-desc text-white/60 text-base md:text-xl max-w-2xl mb-14 leading-relaxed font-light mx-auto">
          Scale your business with distributed WhatsApp payments and state-wide service discovery. 
          Built for West Africa's economic powerhouse.
        </p>

        <div className="hero-btns flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={() => onExplore("dashboard")}
            className="group relative bg-gt-orange text-white px-10 py-5 rounded-full font-bold text-base flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-gt-orange/30 hover:shadow-gt-orange/50"
          >
            JOIN TODAY
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={() => onExplore("investment")}
            className="px-10 py-5 rounded-full border border-white/20 font-bold text-base text-white/80 hover:text-white hover:bg-white/10 hover:border-gt-orange/50 transition-all backdrop-blur-sm"
          >
            INVEST NOW
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
          {[
            { value: "40M+", label: "Informal Traders" },
            { value: "₦0", label: "Install Cost" },
            { value: "24/7", label: "WhatsApp Bot" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl md:text-3xl font-black text-gt-orange mb-1">{stat.value}</div>
              <div className="text-[10px] tracking-widest uppercase text-white/40 font-bold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-bg to-transparent -z-10" />
    </section>
  );
}