import { MessageSquare, Search, BarChart3, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

const features = [
  {
    title: "Zero-Install Payments",
    desc: "Payments initiated via WhatsApp. No apps, no onboarding friction. Just natural language.",
    icon: MessageSquare,
    color: "bg-orange-500",
    size: "col-span-1 lg:col-span-2"
  },
  {
    title: "AI Service Discovery",
    desc: "Match informal traders with clients using NLP. 'Looking for a plumber in Yaba'.",
    icon: Search,
    color: "bg-blue-500",
    size: "col-span-1"
  },
  {
    title: "State-Wide Activity",
    desc: "Institutional dashboard for tax authorities to view LGA-level aggregates and heatmaps.",
    icon: BarChart3,
    color: "bg-purple-500",
    size: "col-span-1"
  },
  {
    title: "Privacy First",
    desc: "Aggregative data only. Minimum cohort of 5 users before any data is rendered.",
    icon: ShieldCheck,
    color: "bg-green-500",
    size: "col-span-1 lg:col-span-2"
  }
];

export default function Features() {
  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-6xl font-black mb-6">BUILT FOR <span className="text-gt-orange">NIGERIA'S</span> UNIQUE ECONOMY</h2>
        <p className="text-white/60 text-lg max-w-3xl mx-auto">
          We combine the familiarity of WhatsApp with the power of Artificial Intelligence to bridge the gap between informal traders and formal systems.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -5 }}
            className={`glass-card p-10 rounded-[32px] group ${f.size}`}
          >
            <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-black/20 group-hover:scale-110 transition-transform`}>
              <f.icon className="text-white" size={28} />
            </div>
            <h3 className="text-2xl font-bold mb-4">{f.title}</h3>
            <p className="text-white/50 leading-relaxed text-lg">
              {f.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
