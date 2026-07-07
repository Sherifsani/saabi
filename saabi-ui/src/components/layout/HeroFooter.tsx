import { Twitter, Github, Linkedin, MessageCircle } from "lucide-react";

export default function HeroFooter() {
  return (
    <footer className="px-6 py-32 bg-dark-bg border-t border-white/5 overflow-hidden relative">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Massive Logo as Centerpiece */}
        <div className="mb-12 text-center select-none">
          <h2 className="text-[12vw] md:text-[180px] font-black font-display tracking-tighter text-gt-orange opacity-30 italic leading-none hover:opacity-50 transition-opacity text-glow">
            SAABI
          </h2>
        </div>

        <div className="text-center mb-20 max-w-2xl relative z-10">
          <h3 className="text-xl md:text-2xl font-medium mb-4 text-white/70 tracking-tight">
            Designing the experiences that build nations.
          </h3>
          <p className="text-white/30 text-sm md:text-base font-light leading-relaxed">
            Empowering Nigeria's informal economy through distributed payments and AI-driven service discovery.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 w-full mb-24 text-center">
          <div>
            <h4 className="text-white font-bold mb-6 text-[10px] tracking-[0.4em] uppercase opacity-40">Ecosystem</h4>
            <ul className="space-y-3 text-white/30 text-xs">
              <li><a href="#" className="hover:text-gt-orange transition-colors">Payments</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Discovery</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Analytics</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Verification</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-[10px] tracking-[0.4em] uppercase opacity-40">Resources</h4>
            <ul className="space-y-3 text-white/30 text-xs">
              <li><a href="#" className="hover:text-gt-orange transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">API Docs</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Case Studies</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-[10px] tracking-[0.4em] uppercase opacity-40">Contact</h4>
            <ul className="space-y-3 text-white/30 text-xs">
              <li><a href="#" className="hover:text-gt-orange transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Partnerships</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">General Inquiries</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6 text-[10px] tracking-[0.4em] uppercase opacity-40">Legal</h4>
            <ul className="space-y-3 text-white/30 text-xs">
              <li><a href="#" className="hover:text-gt-orange transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gt-orange transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="w-full flex flex-col md:flex-row items-center justify-between pt-12 border-t border-white/5 gap-8">
          <div className="flex items-center gap-2">
             <span className="text-gt-orange font-black italic text-lg tracking-tighter">SAABI</span>
             <span className="text-white/10 text-[10px] tracking-widest font-bold uppercase ml-4">&copy; {new Date().getFullYear()} NOMBA • LAGOS</span>
          </div>
          <div className="flex items-center gap-8">
            <a href="#" className="text-white/20 hover:text-gt-orange transition-all hover:scale-110"><Linkedin size={16} /></a>
            <a href="#" className="text-white/20 hover:text-gt-orange transition-all hover:scale-110"><Github size={16} /></a>
            <a href="#" className="text-white/20 hover:text-gt-orange transition-all hover:scale-110"><MessageCircle size={16} /></a>
          </div>
        </div>
      </div>
      
      {/* Background Subtle Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full hero-gradient pointer-events-none opacity-20" />
    </footer>
  );
}
