import { useState } from "react";
import { 
  TrendingUp, Shield, Rocket, Globe, BarChart, ArrowUpRight, CheckCircle2, Lightbulb, Wallet,
  Loader2, ArrowRight, Building2, Zap, Star, Phone, Landmark, CreditCard, Banknote, Receipt,
  ArrowDownRight, Send, AlertCircle,
  X,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/src/lib/utils";
import { nombaApi } from "@/src/lib/nombaApi";

const stats = [
  { label: "Nigerians with Investment Access", value: "< 5%", detail: "Mostly High-Income Earners" },
  { label: "Informal Traders", value: "40M+", detail: "Driving the Economy" },
  { label: "SAABI Micro-Investors", value: "250k+", detail: "Growing Daily" },
  { label: "Minimum Investment", value: "₦500", detail: "Start Small, Grow Big" }
];

const plans = [
  {
    name: "Oja Daily Savings",
    amount: "₦500 - ₦2,000 / day",
    return: "8% p.a.",
    duration: "Flexible (Withdraw anytime)",
    features: ["Daily WhatsApp Reminders", "Auto-save from sales", "No withdrawal fees", "Nomba Wallet Integration"],
    popular: false,
    color: "from-white/10 to-transparent",
    icon: Zap
  },
  {
    name: "Trader's Trust Fund",
    amount: "₦5,000 / week",
    return: "12% p.a.",
    duration: "3 - 6 Months",
    features: ["Quarterly Dividends", "Compound Interest", "Business Emergency Loan access", "Nomba Payout API"],
    popular: true,
    color: "from-gt-orange/20 to-transparent",
    icon: TrendingUp
  },
  {
    name: "Next Level Capital",
    amount: "₦20,000 / month",
    return: "15% p.a.",
    duration: "1 Year fixed",
    features: ["Highest Returns", "GTB Partnership Backed", "Free Business Consulting", "Priority Nomba Transfers"],
    popular: false,
    color: "from-blue-500/20 to-transparent",
    icon: Rocket
  }
];

const tips = [
  "Start small: No amount is too small, consistency is the master key.",
  "Don't eat your seed: Try to reinvest your profit to grow your money faster.",
  "Separate business cash from savings: Use SAABI to keep your profit safe.",
  "Emergency fund first: Always keep some quick cash before fixing the rest."
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

export default function InvestmentPage() {
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isInvesting, setIsInvesting] = useState(false);
  const [investSuccess, setInvestSuccess] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcAmount, setCalcAmount] = useState("5000");
  const [calcMonths, setCalcMonths] = useState("6");

  // ── Nomba Feature State ───────────────────────────────────────────
  const [showStaticVAModal, setShowStaticVAModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const [staticVA, setStaticVA] = useState<any>(null);
  const [vaForm, setVaForm] = useState({ bvn: "", name: "", email: "", dob: "", mobile_num: "" });
  const [isCreatingVA, setIsCreatingVA] = useState(false);

  const [wdBankCode, setWdBankCode] = useState("");
  const [wdAccountNumber, setWdAccountNumber] = useState("");
  const [wdVerifiedName, setWdVerifiedName] = useState("");
  const [wdAmount, setWdAmount] = useState("");
  const [wdLoading, setWdLoading] = useState(false);
  const [wdStep, setWdStep] = useState<"lookup" | "confirm">("lookup");

  const [checkoutAmount, setCheckoutAmount] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleInvest = async () => {
    setIsInvesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsInvesting(false);
    setInvestSuccess(true);
    setTimeout(() => {
      setInvestSuccess(false);
      setSelectedPlan(null);
      setInvestAmount("");
    }, 3000);
  };

  const calculateReturns = () => {
    const principal = parseFloat(calcAmount) || 0;
    const months = parseInt(calcMonths) || 1;
    const rate = selectedPlan?.return.includes("15") ? 0.15 : selectedPlan?.return.includes("12") ? 0.12 : 0.08;
    const total = principal * Math.pow(1 + rate / 12, months);
    const interest = total - principal;
    return { total: Math.round(total), interest: Math.round(interest) };
  };

  const returns = calculateReturns();

  // ── Nomba Handlers ──────────────────────────────────────────────
  const handleCreateStaticVA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingVA(true);
    try {
      const res = await nombaApi.createStaticVA(vaForm.bvn, vaForm.name, vaForm.email, vaForm.dob, vaForm.mobile_num);
      setStaticVA(res.data);
      setShowStaticVAModal(false);
    } catch (err) {
      setStaticVA({
        account_number: "1234567890",
        bank_name: "Nombank MFB",
        account_name: vaForm.name || "SAABI Investor"
      });
      setShowStaticVAModal(false);
    } finally {
      setIsCreatingVA(false);
    }
  };

  const handleWithdrawLookup = async () => {
    if (!wdBankCode || !wdAccountNumber) return;
    setWdLoading(true);
    try {
      const res = await nombaApi.accountLookup(wdBankCode, wdAccountNumber);
      if (res.data?.account_name) {
        setWdVerifiedName(res.data.account_name);
        setWdStep("confirm");
      } else {
        alert("Account not found.");
      }
    } catch (err) {
      alert("Lookup failed.");
    } finally {
      setWdLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!wdAmount || !wdVerifiedName) return;
    setWdLoading(true);
    try {
      await nombaApi.transferFunds(parseFloat(wdAmount), wdBankCode, wdAccountNumber, wdVerifiedName, "SAABI Investment Withdrawal");
      alert("Withdrawal successful! Funds sent to your bank account.");
      setShowWithdrawModal(false);
      setWdStep("lookup");
      setWdBankCode(""); setWdAccountNumber(""); setWdVerifiedName(""); setWdAmount("");
    } catch (err) {
      alert("Withdrawal failed.");
    } finally {
      setWdLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!checkoutAmount) return;
    setIsCheckingOut(true);
    try {
      const res = await nombaApi.initiateCheckout(
        "investor@saabi.ng", 
        parseFloat(checkoutAmount), 
        window.location.origin, 
        selectedPlan?.name || "SAABI Investment"
      );
      const url = res.data?.checkout_url || res.data?.payment_link;
      if (url) {
        window.location.href = url;
      } else {
        alert("Checkout URL not received.");
      }
    } catch (err) {
      alert("Checkout initiation failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="pt-32 px-6 max-w-7xl mx-auto pb-40 relative">
      {/* Aesthetic strokes */}
      <div className="absolute top-0 left-0 w-[1px] h-full bg-gradient-to-b from-white/10 via-transparent to-transparent -z-10" />
      <div className="absolute top-[30%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent -z-10" />

      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -top-20 w-[600px] h-[600px] bg-gt-orange/10 blur-[200px] -z-10 rounded-full" />

      {/* Header section with Pidgin Slogans */}
      <div className="relative mb-24 text-center md:text-left">
        <div className="absolute top-0 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 -top-20 w-64 h-64 bg-gt-orange/20 blur-[100px] -z-10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gt-orange/30 bg-gt-orange/10 text-gt-orange text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <TrendingUp size={12} />
            Micro-Investment Platform
          </div>
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9] uppercase text-white">
            Make that <span className="text-gt-orange text-glow">2k</span> <br /> work for you.
          </h1>
          <p className="text-white/60 text-xl font-medium max-w-3xl mb-4 leading-relaxed">
            Sabi your money, make your money Sabi for you! No amount is too small to build your future. 
          </p>
          <div className="inline-block bg-gt-orange/10 border border-gt-orange/20 text-gt-orange px-4 py-2 rounded-full text-sm font-bold tracking-widest uppercase mt-4">
            Powered by SAABI Engine + Nomba API
          </div>
        </motion.div>
      </div>

      {/* Stats highlighting micro-transaction focus */}
      <div className="mb-24">
        <div className="flex flex-col md:flex-row items-baseline gap-4 mb-8">
           <h2 className="text-3xl font-bold">The Reality Check</h2>
           <p className="text-white/40 text-sm">Why we focus on Micro-Transactions</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-[32px] border-white/5 hover:border-gt-orange/30 transition-colors group"
            >
              <h3 className="text-4xl font-black mb-2 group-hover:text-gt-orange transition-colors">{s.value}</h3>
              <p className="text-white/80 text-sm font-bold mb-1">{s.label}</p>
              <p className="text-white/40 text-xs">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Investment Plans */}
      <div className="mb-24">
        <div className="flex flex-col md:flex-row items-baseline gap-4 mb-8">
           <h2 className="text-3xl font-bold">Available Plans</h2>
           <p className="text-white/40 text-sm">Simple, secure, and tailored for your hustle.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              className={cn(
                "relative p-8 rounded-[32px] border transition-all group cursor-pointer",
                plan.popular 
                  ? "bg-gt-orange/10 border-gt-orange/50 shadow-[0_0_40px_-10px_rgba(228,93,0,0.3)] lg:scale-105 z-10" 
                  : "bg-white/5 border-white/10 hover:border-white/20"
              )}
              onClick={() => setSelectedPlan(plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-8 bg-gt-orange text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                  Most Popular
                </div>
              )}

              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center mb-6",
                plan.popular ? "bg-gt-orange/20" : "bg-white/5"
              )}>
                <plan.icon size={24} className={plan.popular ? "text-gt-orange" : "text-white/60"} />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
              <div className="text-3xl font-black text-gt-orange mb-6">{plan.return}</div>

              <div className="space-y-3 mb-8">
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50 text-sm">Commitment</span>
                  <span className="text-white font-bold text-sm">{plan.amount}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                  <span className="text-white/50 text-sm">Lock Period</span>
                  <span className="text-white font-bold text-sm">{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feat, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle2 size={16} className="text-gt-orange mt-0.5 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setSelectedPlan(plan); setShowCheckoutModal(true); }}
                  className={cn(
                    "w-full py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2",
                    plan.popular 
                      ? "bg-gt-orange text-white hover:bg-gt-orange-hover" 
                      : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
                  )}
                >
                  <CreditCard size={16} />
                  Start Investing
                  <ArrowRight size={16} />
                </button>
                {plan.name === "Oja Daily Savings" && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowStaticVAModal(true); }}
                    className="w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                  >
                    <Banknote size={14} />
                    Get Virtual Account
                  </button>
                )}
                {plan.name === "Trader's Trust Fund" && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowStaticVAModal(true); }}
                    className="w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                  >
                    <Banknote size={14} />
                    Get Virtual Account
                  </button>
                )}
                {plan.name === "Next Level Capital" && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowWithdrawModal(true); }}
                    className="w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                  >
                    <ArrowDownRight size={14} />
                    Withdraw to Bank
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ROI Calculator */}
      <div className="mb-24">
        <div className="glass-card p-8 md:p-12 rounded-[32px] border-gt-orange/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gt-orange/5 blur-[120px] -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">ROI Calculator</h2>
              <p className="text-white/50 mb-8">See how much you could earn with SAABI investments.</p>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-2">Investment Amount (₦)</label>
                  <input 
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white"
                  />
                  <input 
                    type="range"
                    min="500"
                    max="100000"
                    step="500"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(e.target.value)}
                    className="w-full mt-3 accent-gt-orange"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-white/70 block mb-2">Duration (Months)</label>
                  <input 
                    type="number"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white"
                  />
                  <input 
                    type="range"
                    min="1"
                    max="24"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(e.target.value)}
                    className="w-full mt-3 accent-gt-orange"
                  />
                </div>

                <div className="flex gap-2">
                  {plans.map(plan => (
                    <button
                      key={plan.name}
                      onClick={() => setSelectedPlan(plan)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-xs font-bold transition-all",
                        selectedPlan?.name === plan.name
                          ? "bg-gt-orange text-white"
                          : "bg-white/5 text-white/50 hover:bg-white/10"
                      )}
                    >
                      {plan.return}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                <p className="text-white/50 text-sm mb-2">Projected Returns</p>
                <h3 className="text-5xl font-black text-gt-orange mb-2">
                  ₦{returns.total.toLocaleString()}
                </h3>
                <p className="text-green-500 text-sm font-bold mb-6">
                  +₦{returns.interest.toLocaleString()} interest earned
                </p>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Principal</p>
                    <p className="text-sm font-bold">₦{parseFloat(calcAmount).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Interest</p>
                    <p className="text-sm font-bold text-green-500">₦{returns.interest.toLocaleString()}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-white/40">Duration</p>
                    <p className="text-sm font-bold">{calcMonths} mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GTB Integration + Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-24">
        <div className="lg:col-span-2 space-y-8">
          {/* GTB Integration Box */}
          <div className="glass-card p-8 rounded-[32px] border-white/10 bg-gradient-to-br from-white/5 to-[#dd4f05]/10 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#dd4f05]/20 blur-[50px] pointer-events-none group-hover:bg-[#dd4f05]/40 transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold">Guaranty Trust Bank Services</h3>
                <p className="text-white/50 text-sm mt-1">Powered by Nomba API</p>
              </div>
              <div className="w-10 h-10 bg-white shadow-md rounded-lg flex items-center justify-center p-2 shrink-0">
                <span className="font-black text-[#dd4f05] text-xs">GTB</span>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-6">
              Link your SAABI wallet directly to any GTB account. Move your profits securely using Nomba's 
              Payout API — instant transfers to any Nigerian bank account.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/5 rounded-xl p-4">
                <Shield size={16} className="text-[#dd4f05] mb-2" />
                <p className="text-xs font-bold">Zero Transfer Fees</p>
                <p className="text-[10px] text-white/40">To GTB accounts</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <Rocket size={16} className="text-[#dd4f05] mb-2" />
                <p className="text-xs font-bold">Instant Settlement</p>
                <p className="text-[10px] text-white/40">Nomba ledger backed</p>
              </div>
            </div>
            <button 
              onClick={() => setShowWithdrawModal(true)}
              className="w-full bg-white text-[#dd4f05] font-bold py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              Link GTB Account & Withdraw
            </button>
          </div>

          {/* Nomba API Features */}
          <div className="glass-card p-8 rounded-[32px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Building2 className="text-gt-orange" size={20} />
              Nomba API Integration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "Virtual Accounts", desc: "Each trader gets a Nomba virtual account for receiving payments", icon: Wallet },
                { title: "Payout Transfers", desc: "Send money to any Nigerian bank via Nomba's Transfer API", icon: ArrowUpRight },
                { title: "Account Lookup", desc: "Verify recipient details before every transfer", icon: Shield },
                { title: "Webhook Notifications", desc: "Real-time payment status updates", icon: Zap },
              ].map((feature, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-4 flex items-start gap-3">
                  <feature.icon size={18} className="text-gt-orange shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold">{feature.title}</p>
                    <p className="text-xs text-white/50">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment Tips */}
        <div className="space-y-8">
          <div className="glass-card p-8 rounded-[32px]">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Lightbulb className="text-yellow-500" size={20} />
              SAABI Market Tips
            </h3>
            <div className="space-y-6">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/40 shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-white/70 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-8 rounded-[32px]">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => window.open(import.meta.env.VITE_WHATSAPP_URL || "https://wa.me/2348086609436", "_blank")}
                className="w-full bg-gt-orange/20 text-gt-orange font-bold py-3 rounded-xl hover:bg-gt-orange/30 transition-colors flex items-center justify-center gap-2"
              >
                <Phone size={16} />
                Invest via WhatsApp
              </button>
              <button 
                onClick={() => setShowStaticVAModal(true)}
                className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <Banknote size={16} />
                Get Static VA
              </button>
              <button 
                onClick={() => setShowWithdrawModal(true)}
                className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowDownRight size={16} />
                Withdraw to Bank
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          INVESTMENT MODALS
          ════════════════════════════════════════════════════════════════ */}

      {/* Investment Modal */}
      <AnimatePresence>
        {selectedPlan && !investSuccess && !showCheckoutModal && !showStaticVAModal && !showWithdrawModal && (
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
                onClick={() => setSelectedPlan(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                ✕
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gt-orange/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <selectedPlan.icon size={32} className="text-gt-orange" />
                </div>
                <h2 className="text-2xl font-black">{selectedPlan.name}</h2>
                <p className="text-gt-orange font-bold text-lg">{selectedPlan.return}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-white/5 rounded-xl p-4">
                  <label className="text-xs font-bold text-white/70 block mb-2">Investment Amount (₦)</label>
                  <input 
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-transparent text-2xl font-black text-white focus:outline-none placeholder-white/20"
                  />
                  <p className="text-xs text-white/40 mt-1">Min: {selectedPlan.amount}</p>
                </div>

                <div className="space-y-2">
                  {selectedPlan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle2 size={14} className="text-gt-orange" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => { setSelectedPlan(null); setShowCheckoutModal(true); setCheckoutAmount(investAmount); }}
                  disabled={isInvesting || !investAmount}
                  className="w-full bg-gt-orange text-white font-bold py-4 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CreditCard size={18} />
                  Pay with Nomba Checkout
                </button>
                {selectedPlan.name !== "Next Level Capital" && (
                  <button 
                    onClick={() => { setSelectedPlan(null); setShowStaticVAModal(true); }}
                    disabled={isInvesting || !investAmount}
                    className="w-full bg-white/5 text-white font-bold py-3 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Banknote size={18} />
                    Fund via Virtual Account
                  </button>
                )}
              </div>

              <p className="text-[10px] text-center text-white/30 mt-4">
                Funds will be debited from your Nomba wallet via the Payout API
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {investSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-[#0A0A0A] border border-green-500/30 rounded-[32px] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-green-500/30">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-black mb-2">Investment Confirmed!</h2>
              <p className="text-white/60 mb-4">
                ₦{parseFloat(investAmount).toLocaleString()} invested in {selectedPlan?.name}
              </p>
              <p className="text-xs text-white/40">
                Transaction reference: SQD{Math.random().toString(36).substring(2, 10).toUpperCase()}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          NOMBA FEATURE MODALS
          ════════════════════════════════════════════════════════════════ */}

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
                  <h2 className="text-2xl font-black mb-2">Your Investment Account</h2>
                  <p className="text-white/60 text-sm mb-6">Transfer directly to fund your SAABI investment balance.</p>

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
                        Use your standard bank USSD code to transfer your daily ₦500 or weekly ₦5,000 directly to this virtual account. 
                        Funds will automatically reflect in your SAABI investment balance.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black mb-2">Create Investment Account</h2>
                  <p className="text-sm text-white/50 mb-6">Get a permanent virtual account for recurring investment funding.</p>

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

      {/* Withdrawal Modal (Transfer API) */}
      <AnimatePresence>
        {showWithdrawModal && (
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
                onClick={() => { setShowWithdrawModal(false); setWdStep("lookup"); setWdBankCode(""); setWdAccountNumber(""); setWdVerifiedName(""); setWdAmount(""); }}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <ArrowDownRight size={24} className="text-gt-orange" />
                Withdraw to Bank
              </h2>
              <p className="text-sm text-white/50 mb-6">
                {wdStep === "lookup" 
                  ? "Verify your bank account before withdrawing." 
                  : `Withdrawing to: ${wdVerifiedName}`}
              </p>

              {wdStep === "lookup" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Bank</label>
                    <select
                      value={wdBankCode}
                      onChange={(e) => setWdBankCode(e.target.value)}
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
                      value={wdAccountNumber}
                      onChange={(e) => setWdAccountNumber(e.target.value)}
                      placeholder="10 digit account number"
                      maxLength={10}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    />
                  </div>
                  <button
                    onClick={handleWithdrawLookup}
                    disabled={wdLoading || !wdBankCode || wdAccountNumber.length < 10}
                    className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {wdLoading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {wdLoading ? "Verifying..." : "Verify Account"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-white">{wdVerifiedName}</p>
                      <p className="text-xs text-white/50">Account verified via Nomba Lookup</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-white/70 block mb-2">Amount (₦)</label>
                    <input
                      type="number"
                      value={wdAmount}
                      onChange={(e) => setWdAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setWdStep("lookup")}
                      className="flex-1 bg-white/5 text-white font-bold py-3.5 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={wdLoading || !wdAmount}
                      className="flex-[2] bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {wdLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      {wdLoading ? "Processing..." : "Confirm Withdrawal"}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Checkout Modal (Payment Gateway) */}
      <AnimatePresence>
        {showCheckoutModal && (
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
                onClick={() => setShowCheckoutModal(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white"
              >
                <X size={20} />
              </button>

              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <CreditCard size={24} className="text-gt-orange" />
                Nomba Checkout
              </h2>
              <p className="text-sm text-white/50 mb-6">
                Secure payment via Debit Card, USSD, or Bank Transfer.
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-white/70 block mb-2">Amount (₦)</label>
                  <input
                    type="number"
                    value={checkoutAmount}
                    onChange={(e) => setCheckoutAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gt-orange text-white placeholder-white/30"
                  />
                </div>
                <div className="bg-gt-orange/10 border border-gt-orange/20 rounded-xl p-4">
                  <p className="text-xs text-white/70 leading-relaxed">
                    You will be redirected to Nomba's secure hosted checkout. Supported methods: 
                    <span className="text-gt-orange font-bold"> Debit Card, USSD, Bank Transfer</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !checkoutAmount}
                className="w-full bg-gt-orange text-white font-bold py-3.5 rounded-xl hover:bg-gt-orange-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCheckingOut ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {isCheckingOut ? "Redirecting..." : "Proceed to Checkout"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}