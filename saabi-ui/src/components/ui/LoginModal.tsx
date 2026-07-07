import { useState } from "react";
import { motion } from "motion/react";
import { Mail, ArrowRight } from "lucide-react";
import { supabase } from "@/src/lib/supabase";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // HACKATHON: Immediately open dashboard regardless for demo flow
    onSuccess();

    // Fire-and-forget the actual magic link email
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    }).then(({ error }) => {
      if (error) console.error("Magic link error:", error);
    });

    setMagicLinkSent(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 text-white/50 hover:text-white z-10"
        >
          ✕
        </button>

        {magicLinkSent ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
              <Mail size={40} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-black mb-3">Check Your Email</h2>
            <p className="text-white/60 mb-8 leading-relaxed">
              We've sent a magic login link to <br/>
              <span className="text-white font-bold">{email}</span>
            </p>
            <button 
              onClick={onClose}
              className="bg-white/10 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-white/20 transition-colors"
            >
              Close Window
            </button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-center mb-8">
              <div className="flex items-center gap-2 cursor-pointer group justify-center">
                <span className="font-display text-2xl font-black tracking-tighter text-gt-orange italic">SAABI</span>
              </div>
              <h2 className="text-2xl font-black mb-2">Welcome to SAABI</h2>
              <p className="text-sm text-white/50">Login to access your personalized Dashboard</p>
            </div>

            {error && (
               <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-xl text-center">
                  {error}
               </div>
            )}

            <div className="space-y-4 mb-6">
              <button 
                onClick={() => handleOAuthLogin('github')}
                disabled={loading}
                className="w-full bg-[#24292e] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 hover:bg-[#2c3238] transition-colors border border-white/5 disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0A0A0A] px-2 text-white/40">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin}>
               <div className="relative mb-4">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                     type="email" 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="name@example.com" 
                     className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30" 
                     required
                  />
               </div>
               <button 
                 type="submit"
                 disabled={loading}
                 className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gt-orange-hover transition-colors disabled:opacity-50"
               >
                  Send Magic Link
                  <ArrowRight size={18} />
               </button>
            </form>

            <p className="text-[10px] text-center text-white/40 mt-6 leading-relaxed">
               By continuing, you agree to SAABI's Terms of Service and Privacy Policy. Secure authentication provided by Supabase.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}