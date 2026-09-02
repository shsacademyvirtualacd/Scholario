import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Coins, Save, Loader2, Layers, Check } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { syncPricingToFeeConfigs, getClassesWithFeeConfigs, ClassWithFeeConfig } from '../../lib/db';
import { BOARDS } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';

export const PriceManagerPage: React.FC = () => {
  const isMobile = useMobile();
  const [classesList, setClassesList] = useState<ClassWithFeeConfig[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getClassesWithFeeConfigs();
      setClassesList(data);

      const initialPrices: Record<string, number> = {};
      data.forEach((c) => {
        initialPrices[c.id] = c.amount || 0;
      });
      setPrices(initialPrices);
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to load classes and pricing: ' + (err.message || 'Database error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3500);
  };

  const handlePriceChange = (classId: string, newPriceVal: string) => {
    const parsed = parseInt(newPriceVal, 10);
    setPrices((prev) => ({
      ...prev,
      [classId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSaveSingle = async (classId: string) => {
    setSavingClassId(classId);
    try {
      const price = prices[classId] || 0;
      await syncPricingToFeeConfigs(classId, price);
      triggerNotification('success', 'Fee rate updated successfully!');
      await loadData();
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to save fee rate: ' + (err.message || 'database error'));
    } finally {
      setSavingClassId(null);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const targetClasses = selectedBoardId === 'all' 
        ? classesList 
        : classesList.filter((c) => c.board_id === selectedBoardId);

      await Promise.all(
        targetClasses.map((cls) => {
          const price = prices[cls.id] || 0;
          return syncPricingToFeeConfigs(cls.id, price);
        })
      );

      triggerNotification('success', 'All class fee rates saved successfully!');
      await loadData();
    } catch (err: any) {
      console.error(err);
      triggerNotification('error', 'Failed to save fee rates: ' + (err.message || 'Error occurred'));
    } finally {
      setSaving(false);
    }
  };

  const filteredClasses = selectedBoardId === 'all'
    ? classesList
    : classesList.filter((c) => c.board_id === selectedBoardId);

  const totalClassesCount = classesList.length;
  const configuredCount = classesList.filter((c) => c.is_set && c.amount > 0).length;
  const unconfiguredCount = totalClassesCount - configuredCount;

  const boardStats = BOARDS.map((b) => {
    const boardClasses = classesList.filter((c) => c.board_id === b.id);
    const configured = boardClasses.filter((c) => c.is_set && c.amount > 0).length;
    return {
      ...b,
      total: boardClasses.length,
      configured,
      unconfigured: boardClasses.length - configured,
    };
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Syllabus Price & Fee Manager"
            description="Configure official tuition pricing and fee rates across all boards (FBISE, Sindh Board & IELTS Preparation). Changes apply instantly across student onboarding, checkout, and the public fee calculator."
          />
        </div>

        {/* Board Switcher */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-[#E5E5E5] shadow-sm max-w-xl flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedBoardId('all')}
            className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              selectedBoardId === 'all'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]'
            }`}
          >
            <Layers size={14} className={selectedBoardId === 'all' ? 'text-[#F4C430]' : 'text-[#A3A3A3]'} />
            <span>All Boards ({classesList.length})</span>
          </button>
          {BOARDS.map((b) => {
            const count = classesList.filter((c) => c.board_id === b.id).length;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBoardId(b.id)}
                className={`py-2 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                  selectedBoardId === b.id
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]'
                }`}
              >
                <Layers size={14} className={selectedBoardId === b.id ? 'text-[#F4C430]' : 'text-[#A3A3A3]'} />
                <span>{b.name} ({count})</span>
              </button>
            );
          })}
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

        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3 interactive">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading classes and fee rates...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pricing Summary & Overview */}
            <div className="lg:col-span-1">
              <div className="card card-elevated sticky top-24 space-y-4 interactive">
                <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                  <Coins size={18} className="text-[#F4C430]" />
                  <h2 className="font-bold text-[#111111] text-base">Board-Agnostic Pricing</h2>
                </div>

                <p className="text-xs text-[#737373] leading-relaxed">
                  Prices set here apply instantly across the site for the selected board and class — no other steps needed.
                </p>

                {/* Quick Stats */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-[#111111] pb-1 border-b border-[#F5F5F5]">
                    <span className="text-[#737373]">Pricing Coverage</span>
                    <span className="text-[#111111]">{configuredCount} of {totalClassesCount} Configured</span>
                  </div>

                  <div className="space-y-1.5">
                    {boardStats.map((bs) => (
                      <div key={bs.id} className="flex items-center justify-between text-xs bg-[#FAFAFA] px-3 py-2 rounded-xl border border-[#F0F0F0]">
                        <span className="font-bold text-[#111111]">{bs.name}</span>
                        <span className="font-semibold text-xs text-[#737373]">
                          {bs.configured}/{bs.total} active
                          {bs.unconfigured > 0 ? (
                            <span className="ml-1.5 text-amber-600 font-bold">({bs.unconfigured} unset)</span>
                          ) : (
                            <span className="ml-1.5 text-emerald-600 font-bold">✓</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {unconfiguredCount > 0 && (
                    <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-800 bg-amber-50/80 border border-amber-200/70 p-2.5 rounded-xl">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>{unconfiguredCount} {unconfiguredCount === 1 ? 'class requires' : 'classes require'} a fee rate to be configured.</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-900 block">Single Source of Truth</span>
                  <p className="text-[11px] text-amber-800 leading-normal">
                    Changes made here instantly reflect in student onboarding, student checkout summaries, and the public tuition estimator.
                  </p>
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
                      {selectedBoardId === 'all' ? 'All Board Packages' : `${BOARDS.find(b => b.id === selectedBoardId)?.name || 'Board'} Packages`}
                    </h2>
                  </div>
                  <span className="badge badge-gray text-xs">{filteredClasses.length} classes</span>
                </div>

                <form onSubmit={handleSaveAll} className="space-y-5">
                  <div className="divide-y divide-[#F5F5F5]">
                    {filteredClasses.map((cls) => {
                      const priceValue = prices[cls.id] !== undefined ? prices[cls.id] : 0;

                      return (
                        <div key={cls.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-[#111111] leading-tight">
                                {cls.board_id === 'ielts' ? cls.display_name : `Class ${cls.display_name}`}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                {cls.board_name}
                              </span>
                              {cls.is_set && cls.amount > 0 ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Configured
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  Unset (PKR 0)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-[#A3A3A3] font-semibold mt-1 block">
                              {cls.is_set && cls.amount > 0
                                ? `Current Live Rate: PKR ${cls.amount.toLocaleString()} / term`
                                : 'Status: Price unset (defaults to PKR 0)'}
                            </span>
                          </div>

                          <div className={`flex items-center gap-2 ${isMobile ? 'w-full bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0] mt-2' : ''}`}>
                            <span className="text-xs font-black text-[#A3A3A3] uppercase tracking-wider">PKR</span>
                            <input
                              type="number"
                              min="0"
                              value={priceValue === 0 ? '' : priceValue}
                              onChange={(e) => handlePriceChange(cls.id, e.target.value)}
                              placeholder="0 (Unset)"
                              className={`input py-2 text-sm bg-white border-[#E5E5E5] rounded-xl font-bold font-mono ${isMobile ? 'flex-1 text-left' : 'w-32 text-right'}`}
                            />
                            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">/term</span>
                            
                            <button
                              type="button"
                              onClick={() => handleSaveSingle(cls.id)}
                              disabled={savingClassId === cls.id || saving}
                              title="Save this class price"
                              className="p-2 rounded-xl bg-slate-100 hover:bg-[#F4C430] text-slate-700 hover:text-black transition-colors disabled:opacity-50"
                            >
                              {savingClassId === cls.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                    <button 
                      type="submit" 
                      disabled={saving}
                      className={`btn btn-gold flex items-center justify-center gap-2 py-3 disabled:opacity-50 disabled:cursor-not-allowed font-bold ${isMobile ? 'w-full text-sm rounded-xl' : 'px-8 rounded-xl'}`}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Saving All Classes…
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Save All Class Prices
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default PriceManagerPage;

