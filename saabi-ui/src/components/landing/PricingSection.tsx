import { motion } from "motion/react";
import { Check, Zap, Rocket, Building2 } from "lucide-react";

export const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for individual informal traders",
    features: ["WhatsApp Payment Bot", "Basic Service Profile", "Standard QR Codes", "24/7 Support"],
    icon: Zap,
    color: "from-white/10 to-transparent"
  },
  {
    name: "Pro Trader",
    price: "₦5k / mo",
    desc: "For growing businesses needing scale",
    features: ["Advanced NLP Matching", "Verified Badge", "Priority Discovery", "Credit Score Building", "Inventory Management"],
    icon: Rocket,
    color: "from-gt-orange/20 to-transparent",
    popular: true
  },
  {
    name: "Institutional",
    price: "Custom",
    desc: "For IRS and Ministry agencies",
    features: ["LGA Dashboards", "Raw Data Access", "Heatmap Analytics", "Custom Reporting", "Multi-user Access"],
    icon: Building2,
    color: "from-blue-500/20 to-transparent"
  }
];

export default function PricingSection() {
  return (
    <section className="px-6 py-32 max-w-7xl mx-auto">
      <div className="text-center mb-20 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-gt-orange/50 to-transparent" />
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter">FUEL YOUR <span className="text-gt-orange text-glow">AMBITION</span></h2>
        <p className="text-white/40 text-base md:text-lg max-w-2xl mx-auto font-light">Choose the tier that fits your journey. From the smallest stall to the largest ministry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch auto-rows-fr">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`glass-card p-8 md:p-10 rounded-[40px] md:rounded-[48px] relative group overflow-hidden flex flex-col h-full ${plan.popular ? 'border-gt-orange/40 ring-1 ring-gt-orange/20 lg:scale-105 z-10 lg:my-0' : ''}`}
          >
            {/* Background Glow */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] bg-gradient-to-br ${plan.color} opacity-50`} />
            
            <div className="relative z-10 mb-8">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-110 transition-transform">
                <plan.icon size={24} className={plan.popular ? 'text-gt-orange' : 'text-white'} />
              </div>
              <h3 className="text-2xl font-bold mb-2 tracking-tight">{plan.name}</h3>
              <p className="text-white/40 text-xs md:text-sm font-light">{plan.desc}</p>
            </div>

            <div className="relative z-10 mb-10 flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-bold">{plan.price}</span>
              {plan.price.includes('₦') && <span className="text-white/20 text-sm italic">per month</span>}
            </div>

            <div className="relative z-10 space-y-4 mb-12 flex-1">
              {plan.features.map((f) => (
                <div key={f} className="flex items-center gap-3 text-white/50 text-sm font-light">
                  <div className="w-5 h-5 rounded-full bg-gt-orange/10 flex items-center justify-center shrink-0 border border-gt-orange/20">
                    <Check size={10} className="text-gt-orange" />
                  </div>
                  {f}
                </div>
              ))}
            </div>

            <button className={`w-full py-5 rounded-2xl font-bold text-sm md:text-base transition-all ${
              plan.popular 
                ? 'bg-gt-orange text-white hover:bg-gt-orange-hover' 
                : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
            }`}>
              {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
