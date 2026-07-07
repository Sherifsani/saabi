import { motion } from "motion/react";
import { MessageSquare, Search, Shield, BarChart3, Wallet, Users } from "lucide-react";

const stories = [
  {
    id: 1,
    title: "Distributed Payments",
    subtitle: "Formalizing the Informal",
    desc: "A trader in Mushin can now receive payments from around the world via a simple WhatsApp bot. No app install needed.",
    icon: MessageSquare,
    image: "./money-tree.jpg",
    className: "lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-gt-orange/20 to-transparent"
  },
  {
    id: 2,
    title: "Service Discovery",
    subtitle: "Find Talent Instantly",
    desc: "Looking for a plumber in Yaba? Our NLP engine matches skills to needs in seconds.",
    icon: Search,
    image: "./busy-street.jpg",
        className: "lg:col-span-1 lg:row-span-1"
  },
  {
    id: 3,
    title: "State Visibility",
    subtitle: "Aggregate Analytics",
    desc: "Real-time heatmaps for LGA revenue tracking without compromising individual privacy.",
    icon: BarChart3,
    image: "./city-low.jpg",
    className: "lg:col-span-1 lg:row-span-1"
  },
  {
    id: 4,
    title: "SAABI Wallet",
    subtitle: "Financial Inclusion",
    desc: "Every trader gets a virtual account linked to their BVN, enabling formal credit scoring.",
    icon: Wallet,
    image: "./inclusion.jpg",
    className: "lg:col-span-2 lg:row-span-1"
  }
];

export default function StorySection() {
  return (
    <section className="px-6 py-32 max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-white/5 via-white/10 to-transparent -z-10" />
      <div className="absolute top-[40%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />

      <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-7xl font-bold mb-6 leading-tight tracking-tighter">
            BRIDGING THE <span className="text-gt-orange text-glow">DIGITAL</span> DIVIDE
          </h2>
          <p className="text-white/40 text-lg md:text-xl font-light leading-relaxed">
            SAABI isn't just an app. It's a national utility layer for the 80% of Nigeria that operates in the shadows.
          </p>
        </div>
        <div className="hidden md:block h-[1px] flex-1 bg-gradient-to-r from-gt-orange/50 to-transparent mx-10 mb-6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[280px]">
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ y: -8 }}
            className={`glass-card p-8 rounded-[40px] relative overflow-hidden group flex flex-col justify-end ${story.className}`}
          >
            {/* Background Image / Texture */}
            <div className="absolute inset-0 -z-10 opacity-30 group-hover:opacity-50 transition-opacity">
              <img 
                src={story.image} 
                alt={story.title}
                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="w-12 h-12 bg-gt-orange/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10 group-hover:bg-gt-orange transition-colors">
                <story.icon size={24} className="group-hover:text-white text-gt-orange transition-colors" />
              </div>
              <p className="text-gt-orange font-bold text-sm tracking-widest uppercase mb-2">
                {story.subtitle}
              </p>
              <h3 className="text-3xl font-bold mb-4">{story.title}</h3>
              <p className="text-white/50 text-base font-light group-hover:text-white/80 transition-colors">
                {story.desc}
              </p>
            </div>
            
            {/* Stroke effect */}
            <div className="absolute inset-0 rounded-[40px] border border-white/5 group-hover:border-gt-orange/30 transition-colors pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
