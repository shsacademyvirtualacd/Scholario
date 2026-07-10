import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Coins, Save, Loader2 } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { syncPricingToFeeConfigs, getTaxonomy, getFeeConfig } from '../../lib/db';
import { BOARD } from '../../lib/taxonomy';

export const PriceManagerPage: React.FC = () => {
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    getTaxonomy().then(setTaxonomy).catch(console.error);
  }, []);

  useEffect(() => {
    if (!taxonomy) return;
    const list = taxonomy.classes.filter((c: any) => c.board_id === BOARD.id);
    const loadPrices = async () => {
      const initialPrices: Record<string, number> = {};
      for (const c of list) {
        try {
          const cfg = await getFeeConfig(c.id);
          initialPrices[c.id] = cfg?.amount && typeof cfg.amount === 'number' ? cfg.amount : 0;
        } catch (err) {
          console.error(err);
          initialPrices[c.id] = 0;
        }
      }
      setPrices(initialPrices);
    };
    loadPrices();
  }, [taxonomy]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3000);
  };

  const handlePriceChange = (classId: string, newPriceVal: string) => {
    const parsed = parseInt(newPriceVal, 10);
    setPrices((prev) => ({
      ...prev,
      [classId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Sync strictly by exact class ID (UUID from classes table) to fee_configs
      const syncPromises = Object.entries(prices).map(([classId, price]) =>
        syncPricingToFeeConfigs(classId, price)
      );
      await Promise.all(syncPromises);

      triggerNotification('success', 'Pricing configurations saved and synced to live database!');
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to save database pricing: ' + (err.message || 'database error'));
    } finally {
      setSaving(false);
    }
  };

  const currentGradesList = taxonomy
    ? taxonomy.classes
        .filter((c: any) => c.board_id === BOARD.id)
        .map((c: any) => ({
          id: c.id,
          value: c.grade,
          label: c.display_name,
        }))
    : [];

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
          {/* Instructions */}
          <div className="lg:col-span-1">
            <div className="card card-elevated sticky top-24 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                <Coins size={18} className="text-[#F4C430]" />
                <h2 className="font-bold text-[#111111] text-base">FBISE Pricing</h2>
              </div>
              <p className="text-xs text-[#737373] leading-relaxed">
                Configure tuition pricing for each FBISE grade. Once saved, the price will instantly sync to the client pricing widget.
              </p>
            </div>
          </div>

          {/* Pricing Config Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[#F5F5F5] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#F4C430]" />
                  <h2 className="font-bold text-[#111111] text-base">
                    Federal Board (FBISE) Pricing
                  </h2>
                </div>
                <span className="badge badge-gray text-xs">{currentGradesList.length} packages</span>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <div className="divide-y divide-[#F5F5F5]">
                  {currentGradesList.map((g: any) => {
                    const priceValue = prices[g.id] !== undefined ? prices[g.id] : '';
                    return (
                      <div key={g.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-[#111111] block leading-tight">{g.label}</span>
                          <span className="text-[10px] text-[#A3A3A3] font-semibold mt-1 block">
                            {prices[g.id] && prices[g.id] > 0
                              ? `Current Live DB Rate: PKR ${prices[g.id].toLocaleString()} / term`
                              : 'Status: Price not yet set in database'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#737373]">PKR</span>
                          <input
                            type="number"
                            min="0"
                            value={priceValue}
                            onChange={(e) => handlePriceChange(g.id, e.target.value)}
                            placeholder="Not set"
                            className="input py-2 text-sm w-36 bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-bold font-mono text-right"
                            required
                          />
                          <span className="text-xs text-[#737373]">/term</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="btn btn-gold flex items-center justify-center gap-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Saving & Syncing…
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Save Prices
                      </>
                    )}
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
