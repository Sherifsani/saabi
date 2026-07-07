import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Search, 
  Map as MapIcon, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  MessageCircle,
  Wallet,
  ShieldCheck,
  Star,
  Send,
  MapPin,
  Briefcase,
  X,
  Loader2,
  Phone,
  Filter,
  CreditCard,
  Banknote,
  Receipt,
  Landmark,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { supabase } from "@/src/lib/supabase";
import { nombaApi } from "@/src/lib/nombaApi";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ── Types ──────────────────────────────────────────────────────────

interface Worker {
  id: string;
  full_name: string;
  phone_number: string;
  service_category: string;
  service_description: string | null;
  base_rate: string | null;
  lga: string;
  state: string;
  rating: number;
  review_count: number;
  is_verified: boolean;
  is_available: boolean;
  credibility_score: number;
}

// ── SEEDED DATA ─────────────────────────────────────────────────────

const userStats = [
  { label: "Total Transactions", value: "₦142,500", change: "+12.5%", positive: true, icon: Wallet },
  { label: "WhatsApp Chats", value: "24", change: "+5.2%", positive: true, icon: MessageCircle },
  { label: "Service Searches", value: "12", change: "-2.1%", positive: false, icon: Search },
  { label: "Active Requests", value: "3", change: "+1", positive: true, icon: Activity },
];

const monthlyActivityData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [
    {
      label: 'Volume (₦)',
      data: [45000, 52000, 38000, 65000, 59000, 92000],
      backgroundColor: '#E45D00',
      borderRadius: 6,
    },
  ],
};

const credibilityData = {
  labels: ['Credibility Score', 'Remaining'],
  datasets: [
    {
      data: [85, 15],
      backgroundColor: ['#E45D00', 'rgba(255, 255, 255, 0.05)'],
      borderWidth: 0,
      circumference: 270,
      rotation: 225,
      cutout: '80%',
    },
  ],
};

const sectorActivityData = {
  labels: ['Artisan', 'Logistics', 'Retail', 'Tech Repair', 'Food'],
  datasets: [
    {
      label: 'Search Volume',
      data: [400, 300, 200, 150, 500],
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 4,
    },
    {
      label: 'Provider Count',
      data: [150, 80, 120, 50, 200],
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: 4,
    },
    {
      label: 'Transaction Value (₦000s)',
      data: [850, 420, 310, 290, 750],
      backgroundColor: '#E45D00',
      borderRadius: 4,
    }
  ],
};

const whatsappHistory = [
  { id: 1, type: "payment", text: "Sent ₦5,000 to Baba Tolu", date: "Today, 10:45 AM", amount: "-₦5,000", status: "Completed" },
  { id: 2, type: "search", text: "Found 3 Electricians in Ikeja", date: "Yesterday, 2:15 PM", amount: null, status: "Resolved" },
  { id: 3, type: "payment", text: "Received ₦15,000 from Client Opay", date: "Yesterday, 9:00 AM", amount: "+₦15,000", status: "Completed" },
  { id: 4, type: "error", text: "Failed transfer to Quick Fix", date: "May 10, 4:20 PM", amount: "-₦2,000", status: "Failed" },
];

const lgaHeatmap = [
  { name: "Ikeja", intensity: 90 },
  { name: "Yaba", intensity: 75 },
  { name: "Lekki", intensity: 85 },
  { name: "Surulere", intensity: 60 },
  { name: "Oshodi", intensity: 45 },
  { name: "Ajah", intensity: 40 },
  { name: "Victoria Island", intensity: 95 },
  { name: "Ikorodu", intensity: 30 },
  { name: "Agege", intensity: 50 },
  { name: "Badagry", intensity: 15 },
  { name: "Epe", intensity: 10 },
  { name: "Apapa", intensity: 55 },
];

const SERVICE_CATEGORIES = [
  "Plumbing", "Electrical", "Carpentry", "Food Delivery", "Generator Repair",
  "Phone Repair", "Tailoring", "Hairdressing", "Logistics", "Cleaning",
  "Painting", "Welding", "Auto Mechanic", "Photography", "Event Planning",
  "Tutoring", "Fruit Vendor", "Vegetable Vendor", "Clothing Vendor", "Electronics Vendor",
];

const LGA_OPTIONS = [
  "Ikeja", "Yaba", "Lekki", "Surulere", "Oshodi", "Ajah", 
  "Victoria Island", "Ikorodu", "Agege", "Badagry", "Epe", "Apapa"
];

const BANK_CODES = [
  { code: "058", name: "GTBank" },
  { code: "011", name: "First Bank" },
  { code: "033", name: "UBA" },
  { code: "035", name: "Wema Bank" },
  { code: "050", name: "Ecobank" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "232", name: "Sterling Bank" },
  { code: "215", name: "Unity Bank" },
  { code: "032", name: "Union Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "044", name: "Access Bank" },
];

import { User } from "@supabase/supabase-js";

export default function Dashboard({ user }: { user?: User | null }) {
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [searchLga, setSearchLga] = useState("");
  const [searchResults, setSearchResults] = useState<Worker[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [registerForm, setRegisterForm] = useState({
    full_name: "",
    phone_number: "",
    email: "",
    service_category: "",
    service_description: "",
    base_rate: "",
    lga: "",
  });
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // ── Nomba Feature State ───────────────────────────────────────────
  const [showSendMoneyModal, setShowSendMoneyModal] = useState(false);
  const [showStaticVAModal, setShowStaticVAModal] = useState(false);
  const [showPayServiceModal, setShowPayServiceModal] = useState(false);
  const [payServiceWorker, setPayServiceWorker] = useState<Worker | null>(null);

  const [staticVA, setStaticVA] = useState<any>(null);
  const [vaForm, setVaForm] = useState({ bvn: "", name: "", email: "", dob: "", mobile_num: "" });
  const [isCreatingVA, setIsCreatingVA] = useState(false);

  const [tfBankCode, setTfBankCode] = useState("");
  const [tfAccountNumber, setTfAccountNumber] = useState("");
  const [tfVerifiedName, setTfVerifiedName] = useState("");
  const [tfAmount, setTfAmount] = useState("");
  const [tfRemark, setTfRemark] = useState("");
  const [tfLoading, setTfLoading] = useState(false);
  const [tfStep, setTfStep] = useState<"lookup" | "confirm">("lookup");

  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"card" | "dynamic_va">("card");
  const [dynamicVAData, setDynamicVAData] = useState<any>(null);
  const [isPaying, setIsPaying] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const openWhatsApp = () => {
    const whatsappURL = import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/2348086609436";
    window.open(whatsappURL, "_blank");
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/discovery/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          category: searchCategory || undefined,
          lga: searchLga || undefined,
          limit: 10,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([
        {
          id: "demo-1",
          full_name: "Baba Tolu",
          phone_number: "+2348012345678",
          service_category: "Plumbing",
          service_description: "Expert plumber with 15 years experience",
          base_rate: "₦5,000/hr",
          lga: "Ikeja",
          state: "Lagos",
          rating: 5.0,
          review_count: 24,
          is_verified: true,
          is_available: true,
          credibility_score: 92,
        },
        {
          id: "demo-2",
          full_name: "Quick Fix Electric",
          phone_number: "+2348098765432",
          service_category: "Electrical",
          service_description: "Residential and commercial electrical work",
          base_rate: "₦4,000/hr",
          lga: "Yaba",
          state: "Lagos",
          rating: 4.8,
          review_count: 18,
          is_verified: true,
          is_available: true,
          credibility_score: 88,
        },
        {
          id: "demo-3",
          full_name: "Mama Nkechi",
          phone_number: "+2348034567890",
          service_category: "Food Delivery",
          service_description: "Home-cooked Nigerian meals delivered fresh",
          base_rate: "₦2,500/meal",
          lga: "Lekki",
          state: "Lagos",
          rating: 4.9,
          review_count: 56,
          is_verified: true,
          is_available: true,
          credibility_score: 95,
        },
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const response = await fetch(`${API_BASE}/discovery/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      if (response.ok) {
        setRegisterSuccess(true);
        setTimeout(() => {
          setRegisterSuccess(false);
          setShowProviderModal(false);
          setRegisterForm({
            full_name: "", phone_number: "", email: "",
            service_category: "", service_description: "", base_rate: "", lga: "",
          });
        }, 2000);
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setShowProviderModal(false);
      }, 2000);
    } finally {
      setIsRegistering(false);
    }
  };

  const contactWorker = (worker: Worker) => {
    const message = `Hi ${worker.full_name}, I found you on SAABI and I'm interested in your ${worker.service_category} services.`;
    window.open(`https://wa.me/${worker.phone_number.replace('+', '')}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // ── Nomba Transfer Handlers ──────────────────────────────────────
  const handleLookup = async () => {
    if (!tfBankCode || !tfAccountNumber) return;
    setTfLoading(true);
    try {
      const res = await nombaApi.accountLookup(tfBankCode, tfAccountNumber);
      if (res.data?.account_name) {
        setTfVerifiedName(res.data.account_name);
        setTfStep("confirm");
      } else {
        alert("Account not found. Please check details.");
      }
    } catch (err) {
      alert("Lookup failed. Please check sandbox credentials.");
    } finally {
      setTfLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!tfAmount || !tfVerifiedName) return;
    setTfLoading(true);
    try {
      await nombaApi.transferFunds(parseFloat(tfAmount), tfBankCode, tfAccountNumber, tfVerifiedName, tfRemark || "SAABI Transfer");
      alert("Transfer successful!");
      setShowSendMoneyModal(false);
      setTfStep("lookup");
      setTfBankCode(""); setTfAccountNumber(""); setTfVerifiedName(""); setTfAmount(""); setTfRemark("");
    } catch (err) {
      alert("Transfer failed. Please verify sandbox configuration.");
    } finally {
      setTfLoading(false);
    }
  };

  const handleCreateStaticVA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVA(true);
    try {
      const res = await nombaApi.createStaticVA(vaForm.bvn, vaForm.name, vaForm.email, vaForm.dob, vaForm.mobile_num);
      setStaticVA(res.data);
      setShowStaticVAModal(false);
    } catch (err) {
      // Demo fallback
      setStaticVA({
        account_number: "1234567890",
        bank_name: "Nombank MFB",
        account_name: vaForm.name || user?.user_metadata?.full_name || "SAABI User"
      });
      setShowStaticVAModal(false);
    } finally {
      setIsCreatingVA(false);
    }
  };

  const openPayService = (worker: Worker) => {
    setPayServiceWorker(worker);
    setPayAmount("");
    setPayMethod("card");
    setDynamicVAData(null);
    setShowPayServiceModal(true);
  };

  const handlePayWithCard = async () => {
    if (!payAmount) return;
    setIsPaying(true);
    try {
      const userEmail = user?.email || "demo@saabi.ng";
      const res = await nombaApi.initiateCheckout(userEmail, parseFloat(payAmount), window.location.origin, payServiceWorker?.full_name);
      const url = res.data?.checkout_url || res.data?.payment_link;
      if (url) {
        window.location.href = url;
      } else {
        alert("Payment link not received. Check sandbox configuration.");
      }
    } catch (err) {
      alert("Payment initiation failed");
    } finally {
      setIsPaying(false);
    }
  };

  const handleGenerateDynamicVA = async () => {
    if (!payAmount) return;
    setIsPaying(true);
    try {
      const userEmail = user?.email || "demo@saabi.ng";
      const res = await nombaApi.createDynamicVA(parseFloat(payAmount), 3600, userEmail);
      setDynamicVAData(res.data || {
        account_number: "9988776655",
        bank_name: "Nombank MFB",
        amount: payAmount,
        expires_in: "60 minutes"
      });
    } catch (err) {
      setDynamicVAData({
        account_number: "9988776655",
        bank_name: "Nombank MFB",
        amount: payAmount,
        expires_in: "60 minutes"
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-28 px-6 max-w-[1600px] mx-auto pb-12 relative min-h-screen"
    >
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_10%,#000_10%,transparent_100%)]" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6 relative z-10"
      >
        <div>
          <h1 className="text-3xl md:text-5xl font-black mb-2">Welcome back, <span className="text-gt-orange">{user?.user_metadata?.full_name?.split(' ')[0] || "Trader"}</span></h1>
          <p className="text-white/50">Your Personal Dashboard & Activity Summary</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
             onClick={() => supabase.auth.signOut()}
             className="text-white/40 hover:text-white text-xs font-bold px-4 py-2 border border-white/10 rounded-xl bg-white/5 transition-colors"
          >
             Sign Out
          </button>
          <button 
            onClick={() => setShowSearchModal(true)}
            className="bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Search size={16} />
            Find Services
          </button>
          <button 
            onClick={() => setShowProviderModal(true)}
            className="bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Briefcase size={16} />
            Register as Provider
          </button>
          <button 
            onClick={() => setShowStaticVAModal(true)}
            className="bg-white/10 border border-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
          >
            <Landmark size={16} />
            My Virtual Account
          </button>
          <button 
            onClick={() => setShowSendMoneyModal(true)}
            className="bg-gt-orange text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gt-orange-hover transition-colors"
          >
            <Send size={16} />
            Send Money
          </button>
        </div>
      </motion.div>

      {/* Static VA Banner (if created) */}
      <AnimatePresence>
        {staticVA && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card p-6 rounded-2xl mb-8 border-gt-orange/30 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gt-orange/10 blur-[50px] rounded-full pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gt-orange/20 rounded-xl flex items-center justify-center text-gt-orange">
                  <Banknote size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Your Static Virtual Account</h3>
                  <p className="text-sm text-white/60">
                    {staticVA.account_name} • {staticVA.bank_name || "Nombank MFB"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-3 border border-white/10">
                <span className="text-xl font-black tracking-widest">{staticVA.account_number}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(staticVA.account_number)}
                  className="text-xs text-gt-orange font-bold hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3">
              Give this account number to your customers to receive payments directly into your SAABI wallet.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
        {userStats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 rounded-3xl relative overflow-hidden group hover:border-gt-orange/30 hover:bg-white/[0.02] transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gt-orange/5 blur-[50px] group-hover:bg-gt-orange/10 transition-all rounded-full pointer-events-none" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 bg-gt-orange/10 rounded-xl flex items-center justify-center text-gt-orange">
                <stat.icon size={20} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
                stat.positive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
              )}>
                {stat.positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-white/50 text-sm font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-black">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 relative z-10"
      >
        {/* Monthly Activity */}
        <div className="glass-card p-8 rounded-[36px] lg:col-span-2 relative overflow-hidden group hover:border-gt-orange/20 transition-colors">
          <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-gt-orange/5 blur-[80px] group-hover:bg-gt-orange/10 transition-all rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Activity className="text-gt-orange" size={20} />
              Monthly Activity
            </h3>
            <select className="bg-white/5 border border-white/10 rounded-lg text-xs px-2 py-1 focus:outline-none">
               <option>2026</option>
               <option>2025</option>
            </select>
          </div>
          <div className="h-[250px]">
            <Bar 
              data={monthlyActivityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                  x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                },
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>

        {/* Credibility Rating */}
        <div className="glass-card p-8 rounded-[36px] flex flex-col items-center justify-center relative overflow-hidden group hover:border-gt-orange/20 transition-colors">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gt-orange/5 blur-[60px] group-hover:bg-gt-orange/10 transition-all rounded-full pointer-events-none" />
          <h3 className="text-xl font-bold mb-4 w-full text-left flex items-center gap-2 relative z-10">
            <ShieldCheck className="text-gt-orange" size={20} />
            Credibility Rating
          </h3>
          <div className="relative w-[200px] h-[200px] flex items-center justify-center">
            <Doughnut 
              data={credibilityData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                cutout: '80%'
              }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-4xl font-black text-gt-orange">85%</span>
              <span className="text-xs text-white/50 uppercase tracking-widest font-bold mt-1">Excellent</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* WhatsApp History + Cashflow Heatmap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 relative z-10"
      >
        {/* WhatsApp Transactions History */}
        <div className="glass-card p-8 rounded-[36px] relative overflow-hidden group hover:border-gt-orange/20 transition-colors">
          <div className="flex items-center justify-between mb-6 relative z-10">
             <h3 className="text-xl font-bold flex items-center gap-2">
                 <MessageCircle className="text-gt-orange" size={20} />
                 WhatsApp History
             </h3>
             <button className="text-xs text-gt-orange hover:underline font-bold">View All</button>
          </div>
          <div className="space-y-4">
             {whatsappHistory.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/[0.07] transition-colors">
                    <div className="flex items-center gap-4">
                       <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          tx.type === 'payment' ? 'bg-gt-orange/20 text-gt-orange' : 
                          tx.type === 'search' ? 'bg-blue-500/20 text-blue-500' : 'bg-red-500/20 text-red-500'
                       )}>
                          {tx.type === 'payment' ? <Wallet size={18} /> : 
                           tx.type === 'search' ? <Search size={18} /> : 
                           <Activity size={18} />}
                       </div>
                       <div>
                          <p className="text-sm font-bold">{tx.text}</p>
                          <p className="text-xs text-white/40">{tx.date}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       {tx.amount && (
                           <p className={cn("text-sm font-bold", tx.amount.startsWith('+') ? 'text-green-500' : '')}>
                               {tx.amount}
                           </p>
                       )}
                       <p className={cn("text-[10px] uppercase tracking-wider font-bold mt-1", 
                          tx.status === 'Failed' ? 'text-red-500' : 'text-white/30'
                       )}>{tx.status}</p>
                    </div>
                </div>
             ))}
          </div>
        </div>

        {/* Cashflow Heatmap */}
        <div className="glass-card p-8 rounded-[36px] relative overflow-hidden group hover:border-gt-orange/20 transition-colors">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gt-orange/5 blur-[80px] pointer-events-none" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-2">
               <MapIcon className="text-gt-orange" size={20} />
               Cashflow (LGA Map)
            </h3>
            <span className="text-xs text-white/50 bg-white/5 px-2 py-1 rounded-md">Last 30 Days</span>
          </div>
          <p className="text-xs text-white/40 mb-6">Geographic shading by transaction volume per Local Government Area.</p>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
             {lgaHeatmap.map((lga, i) => (
                <div 
                   key={i} 
                   className="relative h-20 rounded-xl overflow-hidden flex items-end p-2 border border-white/10 hover:border-gt-orange/30 transition-colors cursor-pointer group"
                >
                   <div 
                      className="absolute inset-0 bg-gt-orange transition-opacity"
                      style={{ opacity: lga.intensity / 100 }}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                   <div className="relative z-10 w-full flex flex-col">
                      <span className="text-[10px] font-bold text-white leading-tight">{lga.name}</span>
                      <span className="text-[9px] text-white/70">{lga.intensity}% vol</span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </motion.div>

      {/* Sector Activity + Service Discovery Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 relative z-10">
        {/* Sector Activity */}
        <div className="glass-card p-8 rounded-[36px]">
           <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
              <BarChart3 className="text-gt-orange" size={20} />
              Sector Activity
           </h3>
           <p className="text-xs text-white/40 mb-8">Breakdown of searches, registered providers, and tx value.</p>
           <div className="h-[300px]">
             <Bar 
               data={sectorActivityData}
               options={{
                 responsive: true,
                 maintainAspectRatio: false,
                 scales: {
                   y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                   x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                 },
                 plugins: { 
                   legend: { position: 'bottom', labels: { color: 'white', usePointStyle: true, padding: 20 } } 
                 }
               }}
             />
           </div>
        </div>

        {/* Quick Service Discovery */}
        <div className="glass-card p-8 rounded-[36px] flex flex-col relative overflow-hidden group hover:border-gt-orange/20 transition-colors">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gt-orange/5 blur-[80px] pointer-events-none" />
           <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2">
                 <Users className="text-gt-orange" size={20} />
                 Discover Service Providers
              </h3>
              <button 
                onClick={() => setShowSearchModal(true)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-gt-orange/20 transition-colors"
              >
                 <Search size={14} />
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
              {[
                { name: "Baba Tolu", service: "Plumbing", location: "Ikeja", rating: 5.0, rate: "₦5k/hr", verified: true },
                { name: "Quick Fix", service: "Electrician", location: "Yaba", rating: 4.8, rate: "₦4k/hr", verified: true },
                { name: "Mama Nkechi", service: "Food Delivery", location: "Lekki", rating: 4.9, rate: "₦2.5k/meal", verified: true },
                { name: "Tech Bro Repairs", service: "Phone Repair", location: "Computer Village", rating: 4.7, rate: "Varies", verified: false },
              ].map((provider, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between hover:bg-white/10 transition-colors cursor-pointer relative overflow-hidden group/card">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-gt-orange/20 blur-[30px] rounded-full group-hover/card:bg-gt-orange/40 transition-colors" />
                    <div>
                        <div className="flex justify-between items-start mb-2 relative z-10">
                            <h4 className="font-bold text-sm text-white">{provider.name}</h4>
                            <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-md font-bold">
                               <Star size={10} className="fill-yellow-500" />
                               {provider.rating}
                            </div>
                        </div>
                        <p className="text-xs text-gt-orange font-medium mb-1 relative z-10">{provider.service}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1 relative z-10">
                           <MapPin size={10} /> {provider.location}
                        </p>
                        {provider.verified && (
                          <span className="inline-flex items-center gap-1 text-[9px] text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded mt-2">
                            <ShieldCheck size={8} /> Verified
                          </span>
                        )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 relative z-10">
                        <span className="text-xs font-bold text-white/80">{provider.rate}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); openPayService({
                              id: `demo-${i}`, full_name: provider.name, phone_number: "+2348000000000",
                              service_category: provider.service, service_description: null,
                              base_rate: provider.rate, lga: provider.location, state: "Lagos",
                              rating: provider.rating, review_count: 10, is_verified: provider.verified,
                              is_available: true, credibility_score: 90
                            }); }}
                            className="text-[10px] font-bold uppercase tracking-wider text-gt-orange hover:text-white transition-colors"
                          >
                            Pay
                          </button>
                          <button 
                            onClick={() => setShowSearchModal(true)}
                            className="text-[10px] font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
                          >
                            Contact
                          </button>
                        </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => { setShowSearchModal(false); setSearchResults([]); }}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black mb-2">Find Services</h2>
              <p className="text-sm text-white/50 mb-6">Search for skilled workers and traders near you.</p>

              <div className="space-y-4 mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. plumber in Ikeja" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <select 
                      value={searchCategory}
                      onChange={(e) => setSearchCategory(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white appearance-none"
                    >
                      <option value="">All Categories</option>
                      {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                    <select 
                      value={searchLga}
                      onChange={(e) => setSearchLga(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white appearance-none"
                    >
                      <option value="">All LGAs</option>
                      {LGA_OPTIONS.map(lga => (
                        <option key={lga} value={lga}>{lga}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gt-orange-hover transition-colors disabled:opacity-50"
                >
                  {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                  {isSearching ? "Searching..." : "Search"}
                </button>
              </div>

              {/* Results */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-white/60 mb-3">{searchResults.length} results found</h3>
                  {searchResults.map((worker) => (
                    <motion.div 
                      key={worker.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-white">{worker.full_name}</h4>
                          <p className="text-xs text-gt-orange">{worker.service_category}</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-md font-bold">
                          <Star size={10} className="fill-yellow-500" />
                          {worker.rating}
                        </div>
                      </div>
                      <p className="text-xs text-white/50 mb-3">{worker.service_description || "No description"}</p>
                      <div className="flex items-center gap-4 text-xs text-white/40 mb-3">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {worker.lga}</span>
                        <span>{worker.base_rate || "Rate varies"}</span>
                        {worker.is_verified && (
                          <span className="text-green-500 flex items-center gap-1">
                            <ShieldCheck size={10} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => contactWorker(worker)}
                          className="flex-1 bg-gt-orange/20 text-gt-orange text-xs font-bold py-2 rounded-lg hover:bg-gt-orange/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <MessageCircle size={12} /> WhatsApp
                        </button>
                        <button 
                          onClick={() => openPayService(worker)}
                          className="flex-1 bg-white/5 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                        >
                          <CreditCard size={12} /> Pay
                        </button>
                        <button 
                          onClick={() => setSelectedWorker(worker)}
                          className="flex-1 bg-white/5 text-white text-xs font-bold py-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          View Profile
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Registration Modal */}
      <AnimatePresence>
        {showProviderModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowProviderModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              {registerSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <ShieldCheck size={40} className="text-green-500" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Application Submitted!</h2>
                  <p className="text-white/60">Your profile is under review. You'll be notified via WhatsApp.</p>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-2">Register as a Provider</h2>
                  <p className="text-sm text-white/50 mb-6">Join thousands of verified traders & service workers on SAABI.</p>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={registerForm.full_name}
                        onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                        placeholder="John Doe" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">Phone</label>
                        <input 
                          type="tel" 
                          required
                          value={registerForm.phone_number}
                          onChange={(e) => setRegisterForm({...registerForm, phone_number: e.target.value})}
                          placeholder="+234..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">Email</label>
                        <input 
                          type="email" 
                          value={registerForm.email}
                          onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                          placeholder="john@example.com" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">Service Category</label>
                        <select 
                          required
                          value={registerForm.service_category}
                          onChange={(e) => setRegisterForm({...registerForm, service_category: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white appearance-none"
                        >
                          <option value="">Select...</option>
                          {SERVICE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">Base Rate</label>
                        <input 
                          type="text" 
                          value={registerForm.base_rate}
                          onChange={(e) => setRegisterForm({...registerForm, base_rate: e.target.value})}
                          placeholder="e.g. ₦5,000/hr" 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">LGA / Area</label>
                      <select 
                        required
                        value={registerForm.lga}
                        onChange={(e) => setRegisterForm({...registerForm, lga: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white appearance-none"
                      >
                        <option value="">Select...</option>
                        {LGA_OPTIONS.map(lga => (
                          <option key={lga} value={lga}>{lga}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">Description</label>
                      <textarea 
                        value={registerForm.service_description}
                        onChange={(e) => setRegisterForm({...registerForm, service_description: e.target.value})}
                        placeholder="Briefly describe your services..." 
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30 resize-none"
                      />
                    </div>

                    <div className="bg-gt-orange/10 border border-gt-orange/20 rounded-xl p-4 flex items-start gap-3">
                      <ShieldCheck size={20} className="text-gt-orange shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-gt-orange mb-1">Verification Required</h4>
                        <p className="text-xs text-white/60 leading-relaxed">
                          All providers undergo verification. Make sure your details match your government ID.
                        </p>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isRegistering}
                      className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isRegistering ? <Loader2 size={18} className="animate-spin" /> : null}
                      {isRegistering ? "Submitting..." : "Submit Application"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Worker Detail Modal */}
      <AnimatePresence>
        {selectedWorker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedWorker(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gt-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-gt-orange/30">
                  <Users size={40} className="text-gt-orange" />
                </div>
                <h2 className="text-2xl font-black">{selectedWorker.full_name}</h2>
                <p className="text-gt-orange font-medium">{selectedWorker.service_category}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/50 text-sm">Rating</span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star size={14} className="fill-yellow-500" />
                    <span className="font-bold">{selectedWorker.rating}</span>
                    <span className="text-white/30 text-xs">({selectedWorker.review_count} reviews)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/50 text-sm">Location</span>
                  <span className="font-bold text-sm">{selectedWorker.lga}, {selectedWorker.state}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/50 text-sm">Rate</span>
                  <span className="font-bold text-sm text-gt-orange">{selectedWorker.base_rate || "Negotiable"}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/50 text-sm">Credibility</span>
                  <span className="font-bold text-sm">{selectedWorker.credibility_score}%</span>
                </div>
                {selectedWorker.is_verified && (
                  <div className="flex items-center justify-center gap-2 text-green-500 text-sm py-2">
                    <ShieldCheck size={16} />
                    <span className="font-bold">Verified Provider</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => contactWorker(selectedWorker)}
                  className="bg-gt-orange/20 text-gt-orange font-bold py-3 rounded-xl hover:bg-gt-orange/30 transition-colors flex items-center justify-center gap-2"
                >
                  <Phone size={16} />
                  WhatsApp
                </button>
                <button 
                  onClick={() => { setSelectedWorker(null); openPayService(selectedWorker); }}
                  className="bg-gt-orange text-white font-bold py-3 rounded-xl hover:bg-gt-orange-hover transition-colors flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  Pay Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          NOMBA FEATURE MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* Send Money Modal (Transfer API) */}
      <AnimatePresence>
        {showSendMoneyModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => { setShowSendMoneyModal(false); setTfStep("lookup"); setTfBankCode(""); setTfAccountNumber(""); setTfVerifiedName(""); setTfAmount(""); setTfRemark(""); }}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <Send size={24} className="text-gt-orange" />
                Send Money
              </h2>
              <p className="text-sm text-white/50 mb-6">
                {tfStep === "lookup" 
                  ? "Verify recipient account before transferring." 
                  : `Sending to: ${tfVerifiedName}`}
              </p>

              {tfStep === "lookup" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Bank</label>
                    <select
                      value={tfBankCode}
                      onChange={(e) => setTfBankCode(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white appearance-none"
                    >
                      <option value="">Select Bank</option>
                      {BANK_CODES.map(b => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Account Number</label>
                    <input
                      type="text"
                      value={tfAccountNumber}
                      onChange={(e) => setTfAccountNumber(e.target.value)}
                      placeholder="10 digit account number"
                      maxLength={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    />
                  </div>
                  <button
                    onClick={handleLookup}
                    disabled={tfLoading || !tfBankCode || tfAccountNumber.length < 10}
                    className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {tfLoading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {tfLoading ? "Verifying..." : "Verify Recipient"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle size={20} className="text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{tfVerifiedName}</p>
                      <p className="text-xs text-white/50">Account verified via Nomba Lookup</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Amount (₦)</label>
                    <input
                      type="number"
                      value={tfAmount}
                      onChange={(e) => setTfAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Remark (Optional)</label>
                    <input
                      type="text"
                      value={tfRemark}
                      onChange={(e) => setTfRemark(e.target.value)}
                      placeholder="e.g. Payment for services"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setTfStep("lookup")}
                      className="flex-1 bg-white/5 text-white font-bold py-3.5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={tfLoading || !tfAmount}
                      className="flex-[2] bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {tfLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {tfLoading ? "Sending..." : "Confirm Transfer"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Static VA Modal */}
      <AnimatePresence>
        {showStaticVAModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setShowStaticVAModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              {staticVA ? (
                <div className="text-center py-4">
                  <div className="w-20 h-20 bg-gt-orange/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-gt-orange/30">
                    <Banknote size={40} className="text-gt-orange" />
                  </div>
                  <h2 className="text-2xl font-black mb-2">Your Static Virtual Account</h2>
                  <p className="text-white/60 text-sm mb-6">Share this account with customers to receive payments directly.</p>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <p className="text-xs text-white/40 mb-1">Account Name</p>
                    <p className="text-sm font-bold mb-4">{staticVA.account_name}</p>
                    <p className="text-xs text-white/40 mb-1">Account Number</p>
                    <div className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-3 border border-white/10 mb-4">
                      <span className="text-xl font-black tracking-widest">{staticVA.account_number}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(staticVA.account_number)}
                        className="text-xs text-gt-orange font-bold hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-white/40 mb-1">Bank</p>
                    <p className="text-sm font-bold">{staticVA.bank_name || "Nombank MFB"}</p>
                  </div>

                  <div className="bg-gt-orange/10 border border-gt-orange/20 rounded-xl p-4 text-left">
                    <div className="flex items-start gap-3">
                      <AlertCircle size={18} className="text-gt-orange shrink-0 mt-0.5" />
                      <p className="text-xs text-white/70 leading-relaxed">
                        Funds transferred to this account will automatically reflect in your SAABI wallet balance. 
                        No manual reconciliation needed.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-2">Create Virtual Account</h2>
                  <p className="text-sm text-white/50 mb-6">Get a permanent virtual account for receiving payments.</p>

                  <form onSubmit={handleCreateStaticVA} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={vaForm.name}
                        onChange={(e) => setVaForm({...vaForm, name: e.target.value})}
                        placeholder="As per BVN" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">Email</label>
                      <input 
                        type="email" 
                        required
                        value={vaForm.email}
                        onChange={(e) => setVaForm({...vaForm, email: e.target.value})}
                        placeholder="john@example.com" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">BVN</label>
                        <input 
                          type="text" 
                          required
                          value={vaForm.bvn}
                          onChange={(e) => setVaForm({...vaForm, bvn: e.target.value})}
                          placeholder="11 digits" 
                          maxLength={11}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-white/70 block mb-1.5">Mobile</label>
                        <input 
                          type="tel" 
                          required
                          value={vaForm.mobile_num}
                          onChange={(e) => setVaForm({...vaForm, mobile_num: e.target.value})}
                          placeholder="+234..." 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-white/70 block mb-1.5">Date of Birth (DD/MM/YYYY)</label>
                      <input 
                        type="text" 
                        required
                        value={vaForm.dob}
                        onChange={(e) => setVaForm({...vaForm, dob: e.target.value})}
                        placeholder="01/01/1990" 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={isCreatingVA}
                      className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCreatingVA ? <Loader2 size={18} className="animate-spin" /> : <Banknote size={18} />}
                      {isCreatingVA ? "Creating..." : "Create Virtual Account"}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pay Service Modal (Dynamic VA + Card) */}
      <AnimatePresence>
        {showPayServiceModal && payServiceWorker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShowPayServiceModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black mb-2">Pay {payServiceWorker.full_name}</h2>
              <p className="text-sm text-white/50 mb-6">{payServiceWorker.service_category} • {payServiceWorker.base_rate || "Rate varies"}</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-2">Amount (₦)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    placeholder="Enter exact amount"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setPayMethod("card"); setDynamicVAData(null); }}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      payMethod === "card" ? "bg-gt-orange text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                    )}
                  >
                    <CreditCard size={14} /> Card / Checkout
                  </button>
                  <button
                    onClick={() => { setPayMethod("dynamic_va"); setDynamicVAData(null); }}
                    className={cn(
                      "py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                      payMethod === "dynamic_va" ? "bg-gt-orange text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                    )}
                  >
                    <Receipt size={14} /> Bank Transfer
                  </button>
                </div>

                {payMethod === "card" && (
                  <div className="bg-gt-orange/10 border border-gt-orange/20 rounded-xl p-4">
                    <p className="text-xs text-white/70 leading-relaxed">
                      You will be redirected to Nomba's secure checkout to complete payment via Debit Card, USSD, or Bank Transfer.
                    </p>
                  </div>
                )}

                {payMethod === "dynamic_va" && !dynamicVAData && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-xs text-white/70 leading-relaxed mb-3">
                      A unique virtual account will be generated for exactly <span className="text-gt-orange font-bold">₦{payAmount || "0"}</span>. 
                      Transfer the exact amount to avoid automatic refunds.
                    </p>
                  </div>
                )}

                {dynamicVAData && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-gt-orange/30 rounded-xl p-4"
                  >
                    <p className="text-xs text-white/40 mb-1">Dynamic Virtual Account</p>
                    <div className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2 border border-white/10 mb-2">
                      <span className="text-lg font-black tracking-widest">{dynamicVAData.account_number}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(dynamicVAData.account_number)}
                        className="text-[10px] text-gt-orange font-bold hover:underline"
                      >
                        Copy
                      </button>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/50">{dynamicVAData.bank_name || "Nombank MFB"}</span>
                      <span className="text-gt-orange font-bold">Expires in {dynamicVAData.expires_in || "60 mins"}</span>
                    </div>
                    <div className="mt-3 bg-gt-orange/10 rounded-lg p-2 text-center">
                      <span className="text-xs font-bold text-gt-orange">Exact Amount: ₦{dynamicVAData.amount}</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {payMethod === "card" ? (
                <button
                  onClick={handlePayWithCard}
                  disabled={isPaying || !payAmount}
                  className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPaying ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                  {isPaying ? "Redirecting..." : "Pay with Nomba Checkout"}
                </button>
              ) : (
                <button
                  onClick={dynamicVAData ? () => setShowPayServiceModal(false) : handleGenerateDynamicVA}
                  disabled={isPaying || !payAmount}
                  className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPaying ? <Loader2 size={18} className="animate-spin" /> : dynamicVAData ? <CheckCircle size={18} /> : <Receipt size={18} />}
                  {isPaying ? "Generating..." : dynamicVAData ? "Done — Close" : "Generate Invoice Account"}
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}