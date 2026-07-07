import { ArrowRight } from "lucide-react";

interface CTAProps {
  onAction: () => void;
}

export default function CTA({ onAction }: CTAProps) {
  return (
    <section className="px-4 py-32 md:px-6">
      <div className="max-w-7xl mx-auto bg-gradient-to-br from-gt-orange to-orange-900 rounded-[32px] md:rounded-[64px] p-10 md:p-32 text-center relative overflow-hidden group shadow-2xl shadow-gt-orange/20">
        {/* Animated Orbs */}
        <div className="absolute top-0 left-0 w-48 md:w-96 h-48 md:h-96 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 blur-[80px] md:blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
        <div className="absolute bottom-0 right-0 w-48 md:w-96 h-48 md:h-96 bg-black/30 rounded-full translate-x-1/2 translate-y-1/2 blur-[80px] md:blur-[100px] group-hover:scale-125 transition-transform duration-1000" />
        
        <div className="relative z-10">
          <h2 className="text-3xl md:text-8xl font-bold text-white mb-6 md:mb-10 leading-[1.1] md:leading-[0.9] tracking-tighter">
            JOIN THE <br className="hidden md:block" /> FINANCIAL REVOLUTION
          </h2>
          <p className="text-white/70 text-sm md:text-2xl max-w-xl mx-auto mb-10 md:mb-16 font-light">
            Don't get left behind. Join SAABI Today and Secure your tomorrow.
          </p>
          <button 
            onClick={onAction}
            className="bg-white text-black px-6 py-4 md:px-12 md:py-6 rounded-full font-black text-base md:text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-3 md:gap-4 mx-auto group/btn"
          >
            GET STARTED NOW
            <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
