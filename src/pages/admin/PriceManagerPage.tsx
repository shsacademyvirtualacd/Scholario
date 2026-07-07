import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Coins, Save } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';

const BOARDS = [
  { value: 'fbise', label: 'Federal Board (FBISE)' },
  { value: 'punjab', label: 'Punjab Board (BISE)' },
  { value: 'cambridge', label: 'Cambridge (O/A Levels)' },
];

const GRADES = {
  fbise: [
    { value: '9', label: 'Class 9', defaultPrice: 2499 },
    { value: '10', label: 'Class 10', defaultPrice: 2499 },
    { value: '11', label: 'Class 11', defaultPrice: 3499 },
    { value: '12', label: 'Class 12', defaultPrice: 3499 },
  ],
  punjab: [
    { value: '9', label: 'Class 9', defaultPrice: 2299 },
    { value: '10', label: 'Class 10', defaultPrice: 2299 },
    { value: '11', label: 'Class 11', defaultPrice: 3199 },
    { value: '12', label: 'Class 12', defaultPrice: 3199 },
  ],
  cambridge: [
    { value: 'o', label: 'O Levels', defaultPrice: 4999 },
    { value: 'a', label: 'A Levels', defaultPrice: 6999 },
  ],
};

export const PriceManagerPage: React.FC = () => {
  const [selectedBoard, setSelectedBoard] = useState('fbise');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load configured prices from localStorage whenever the selected board changes
  useEffect(() => {
    const list = GRADES[selectedBoard as keyof typeof GRADES] || [];
    const initialPrices: Record<string, number> = {};
    list.forEach((g) => {
      const stored = localStorage.getItem(`scholario_price_${selectedBoard}_${g.value}`);
      initialPrices[g.value] = stored ? parseInt(stored, 10) : g.defaultPrice;
    });
    setPrices(initialPrices);
  }, [selectedBoard]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3000);
  };

  const handlePriceChange = (gradeValue: string, newPriceVal: string) => {
    const parsed = parseInt(newPriceVal, 10);
    setPrices((prev) => ({
      ...prev,
      [gradeValue]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(prices).forEach(([gradeValue, price]) => {
      localStorage.setItem(`scholario_price_${selectedBoard}_${gradeValue}`, String(price));
    });
    triggerNotification('success', 'Pricing plan configurations saved successfully!');
  };

  const currentGradesList = GRADES[selectedBoard as keyof typeof GRADES] || [];

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Syllabus Price Manager"
            description="Configure marketing rates for the landing page calculator. For student-specific billing and WhatsApp collections, use the Fees manager."
          />
        </div>

        {/* Status Toast */}
        {notif && (
          <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-bottom-5 duration-300 ${
              notif.type === 'success'
                ? 'bg-[#F0FDF4] border-[#bbf7d0] text-[#16a34a]'
                : 'bg-[#FEF2F2] border-[#fecaca] text-[#dc2626]'
            }`}
          >
            {notif.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="text-xs font-bold">{notif.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instructions and Select Board */}
          <div className="lg:col-span-1">
            <div className="card card-elevated sticky top-24 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                <Coins size={18} className="text-[#F4C430]" />
                <h2 className="font-bold text-[#111111] text-base">Select Board</h2>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed">
                Choose the educational system you want to configure. Once saved, the price will instantly sync to the client pricing widget.
              </p>
              <div>
                <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Board Roster</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => setSelectedBoard(e.target.value)}
                  className="input text-sm"
                >
                  {BOARDS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pricing Config Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#F4C430]" />
                  <h2 className="font-bold text-[#111111] text-base">
                    {BOARDS.find((b) => b.value === selectedBoard)?.label} Pricing
                  </h2>
                </div>
                <span className="badge badge-gray text-xs">{currentGradesList.length} packages</span>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="divide-y divide-[#F5F5F5]">
                  {currentGradesList.map((g) => {
                    const priceValue = prices[g.value] !== undefined ? prices[g.value] : g.defaultPrice;
                    return (
                      <div key={g.value} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-[#111111] block leading-tight">{g.label}</span>
                          <span className="text-[10px] text-[#A3A3A3] font-semibold mt-1 block">
                            Default Package Rate: PKR {g.defaultPrice.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#737373]">PKR</span>
                          <input
                            type="number"
                            min="0"
                            value={priceValue}
                            onChange={(e) => handlePriceChange(g.value, e.target.value)}
                            className="input py-2 text-sm w-36 bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-bold font-mono text-right"
                            required
                          />
                          <span className="text-xs text-[#737373]">/mo</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                  <button type="submit" className="btn btn-gold flex items-center justify-center gap-2 px-6 py-2">
                    <Save size={14} />
                    Save Board Prices
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default PriceManagerPage;
