const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Client for the backend's Nomba REST surface (app/routers/nomba_api.py).
// Nomba credentials live on the backend; the browser only talks to our API.
export const nombaApi = {
  async initiateCheckout(email: string, amount: number, callbackUrl?: string, customerName?: string) {
    const res = await fetch(`${API_BASE}/api/nomba/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount, callback_url: callbackUrl, customer_name: customerName }),
    });
    if (!res.ok) throw new Error("Checkout failed");
    return res.json();
  },

  async createStaticVA(bvn: string, name: string, email: string, dob: string, mobileNum: string) {
    const res = await fetch(`${API_BASE}/api/nomba/va/static`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bvn, name, email, dob, mobile_num: mobileNum }),
    });
    if (!res.ok) throw new Error("VA creation failed");
    return res.json();
  },

  async createDynamicVA(amount: number, durationSeconds: number, email: string) {
    const res = await fetch(`${API_BASE}/api/nomba/va/dynamic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, duration_seconds: durationSeconds, email }),
    });
    if (!res.ok) throw new Error("Dynamic VA creation failed");
    return res.json();
  },

  async accountLookup(bankCode: string, accountNumber: string) {
    const res = await fetch(`${API_BASE}/api/nomba/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bank_code: bankCode, account_number: accountNumber }),
    });
    if (!res.ok) throw new Error("Lookup failed");
    return res.json();
  },

  async transferFunds(amount: number, bankCode: string, accountNumber: string, accountName: string, remark?: string) {
    const res = await fetch(`${API_BASE}/api/nomba/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, bank_code: bankCode, account_number: accountNumber, account_name: accountName, remark }),
    });
    if (!res.ok) throw new Error("Transfer failed");
    return res.json();
  },
};
