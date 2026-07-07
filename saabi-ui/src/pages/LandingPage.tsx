import Hero from "@/src/components/landing/Hero";
import StorySection from "@/src/components/landing/StorySection";
import OnboardingSection from "@/src/components/landing/OnboardingSection";
import WhatsAppBotSection from "@/src/components/landing/WhatsAppBotSection";
import PricingSection from "@/src/components/landing/PricingSection";
import CTA from "@/src/components/landing/CTA";
import { motion } from "motion/react";

interface LandingPageProps {
  onNavigate: (page: "landing" | "dashboard" | "investment") => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-0"
    >
      <Hero onExplore={() => onNavigate("dashboard")} />
      <StorySection />
      <OnboardingSection />
      <WhatsAppBotSection />
      <PricingSection />
      <CTA onAction={() => onNavigate("dashboard")} />
    </motion.div>
  );
}
