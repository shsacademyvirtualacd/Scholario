import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Clock, Search, Check,
  AlertCircle, Sparkles, Save, Loader2, Coins
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { 
  getUniversalFeeConfig, saveUniversalFeeConfig, 
  getPendingFeeStatuses, updateFeeStatus,
  getClassesWithFeeConfigs, syncPricingToFeeConfigs,
  ClassWithFeeConfig
} from '../../lib/db';
import { BOARDS } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';

export const AdminFeesPage: React.FC = () => {
  const isMobile = useMobile();
  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'configs'>('pending');

  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingClasses, setSavingClasses] = useState(false);
  const [savingClassId, setSavingClassId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Data States
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<ClassWithFeeConfig[]>([]);
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [classPrices, setClassPrices] = useState<Record<string, number>>({});

  // Config Form States
  const [instructions, setInstructions] = useState<string>('');
  const [whatsappNum, setWhatsappNum] = useState<string>('03222314436');
  const [approvingIds, setApprovingIds] = useState<Record<string, boolean>>({});

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Audit notes state when verifying
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});

  const showNotification = (message: string) => {
    setSuccessNotif(message);
    setTimeout(() => setSuccessNotif(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pendingData, configData, classesData] = await Promise.all([
        getPendingFeeStatuses(),
        getUniversalFeeConfig(),
        getClassesWithFeeConfigs()
      ]);
      setPendingList(pendingData);
      setClassesList(classesData);

      const initialPrices: Record<string, number> = {};
      classesData.forEach((cls) => {
        initialPrices[cls.id] = cls.amount || 0;
      });
      setClassPrices(initialPrices);

      if (configData) {
        setInstructions(configData.payment_instructions);
        setWhatsappNum(configData.whatsapp_number);
      } else {
        // Fallback default structure
        setInstructions('Easypaisa:\nNumber: 03335292094\nName: Sadia Fatima\n\nJazzCash:\nNumber: 03058969050\nName: Haseena Bibi');
        setWhatsappNum('03222314436');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to retrieve fee information. Please check database connectivity.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Keep pending list live: refresh whenever any fee_statuses row changes
  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: async () => {
      const fresh = await getPendingFeeStatuses().catch(() => []);
      setPendingList(fresh);
    },
    onUpdate: async () => {
      const fresh = await getPendingFeeStatuses().catch(() => []);
      setPendingList(fresh);
    },
  });

  const handlePriceChange = (classId: string, value: string) => {
    const parsed = parseInt(value, 10);
    setClassPrices((prev) => ({
      ...prev,
      [classId]: isNaN(parsed) ? 0 : parsed
    }));
  };

  const handleSaveSingleClassFee = async (classId: string) => {
    setSavingClassId(classId);
    try {
      setError(null);
      const amount = classPrices[classId] || 0;
      await syncPricingToFeeConfigs(classId, amount);
      showNotification('Class fee rate updated successfully in database!');
      const updatedClasses = await getClassesWithFeeConfigs();
      setClassesList(updatedClasses);
    } catch (err: any) {
      setError(err.message || 'Failed to update class fee.');
    } finally {
      setSavingClassId(null);
    }
  };

  const handleSaveAllClassFees = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClasses(true);
    try {
      setError(null);
      const targetClasses = selectedBoardFilter === 'all'
        ? classesList
        : classesList.filter((c) => c.board_id === selectedBoardFilter);

      for (const cls of targetClasses) {
        const amount = classPrices[cls.id] || 0;
        await syncPricingToFeeConfigs(cls.id, amount);
      }

      showNotification('All class tuition fee rates saved and synced to database!');
      const updatedClasses = await getClassesWithFeeConfigs();
      setClassesList(updatedClasses);
    } catch (err: any) {
      setError(err.message || 'Failed to save class fees.');
    } finally {
      setSavingClasses(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      await saveUniversalFeeConfig(instructions.trim(), whatsappNum.trim());
      showNotification('Universal fee configuration successfully saved!');
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePayment = async (studentId: string) => {
    setApprovingIds(prev => ({ ...prev, [studentId]: true }));
    try {
      setError(null);
      const note = auditNotes[studentId]?.trim() || 'Payment verified manually by Administrator via WhatsApp screenshot reference.';
      await updateFeeStatus(studentId, 'paid', note);
      showNotification('Student marked as PAID successfully.');
      
      // Update local state
      setPendingList(prev => prev.filter(item => item.student_id !== studentId));
      setAuditNotes(prev => {
        const copy = { ...prev };
        delete copy[studentId];
        return copy;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to verify payment.');
    } finally {
      setApprovingIds(prev => ({ ...prev, [studentId]: false }));
    }
  };

  const handleAuditNoteChange = (studentId: string, val: string) => {
    setAuditNotes(prev => ({
      ...prev,
      [studentId]: val
    }));
  };

  // Filter list
  const filteredPending = pendingList.filter(item => 
    item.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = selectedBoardFilter === 'all'
    ? classesList
    : classesList.filter((c) => c.board_id === selectedBoardFilter);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Institutional Fee Management"
            description="Manage active student billing, per-class tuition rates across all boards (FBISE, Sindh Board & IELTS Preparation), and WhatsApp verification."
          />
        </div>

        {/* Success Toast */}
        {successNotif && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-[#F0FDF4] border-[#bbf7d0] text-[#16a34a] shadow-lg animate-in slide-in-from-bottom-5 duration-300">
            <Check size={16} />
            <span className="text-xs font-bold">{successNotif}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-sm text-[#dc2626] flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className={`flex border-b border-[#E5E5E5] pb-px ${isMobile ? 'flex-col gap-0' : 'items-center gap-1'}`}>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isMobile
                ? `px-4 py-3 text-xs font-bold border-b-2 w-full ${
                    activeTab === 'pending'
                      ? 'border-[#F4C430] text-[#111111] bg-amber-50/30'
                      : 'border-transparent text-[#737373]'
                  }`
                : `px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${
                    activeTab === 'pending'
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#262626]'
                  }`
            }`}
          >
            <Clock size={14} />
            Pending Verification ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`flex items-center gap-2 transition-all duration-200 ${
              isMobile
                ? `px-4 py-3 text-xs font-bold border-b-2 w-full ${
                    activeTab === 'configs'
                      ? 'border-[#F4C430] text-[#111111] bg-amber-50/30'
                      : 'border-transparent text-[#737373]'
                  }`
                : `px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 ${
                    activeTab === 'configs'
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#262626]'
                  }`
            }`}
          >
            <Settings size={14} />
            Fee Configuration & Rates
          </button>
        </div>

        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3 interactive">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading fee modules...</span>
          </div>
        ) : (
          <div>
            {/* Tab 1: Pending Approvals */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="card bg-white border border-[#E5E5E5] p-4 interactive">
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                    <input
                      type="text"
                      placeholder="Search pending students by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
                    />
                  </div>
                </div>

                {/* List */}
                {filteredPending.length === 0 ? (
                  <div className="card text-center py-16 interactive">
                    <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-sm font-bold text-[#111111]">All caught up!</h3>
                    <p className="text-xs text-[#737373] mt-1">There are no student fee payments awaiting verification.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPending.map((item) => (
                      <div key={item.student_id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col gap-4">
                        {/* Student Meta */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-extrabold text-[#111111]">{item.full_name}</span>
                            <span className="badge badge-gray text-[10px]">{item.class_name}</span>
                            {item.amount && typeof item.amount === 'number' && item.amount > 0 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black">
                                PKR {item.amount.toLocaleString()} / term
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#737373]">{item.email}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3] font-semibold mt-1">
                            <Clock size={11} />
                            <span>Submitted: {new Date(item.updated_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Audit Input & Verify Button */}
                        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row items-center'}`}>
                          <input
                            type="text"
                            placeholder="Optional audit log comment..."
                            value={auditNotes[item.student_id] || ''}
                            onChange={(e) => handleAuditNoteChange(item.student_id, e.target.value)}
                            className="input py-2 text-xs bg-[#FAFAFA] w-full"
                          />
                          <button
                            onClick={() => handleApprovePayment(item.student_id)}
                            disabled={approvingIds[item.student_id]}
                            className={`btn btn-gold flex items-center justify-center gap-1.5 py-2 text-xs font-bold shrink-0 disabled:opacity-50 ${isMobile ? 'w-full px-4' : 'px-5'}`}
                          >
                            {approvingIds[item.student_id] ? (
                              <Loader2 size={14} className="animate-spin shrink-0" />
                            ) : (
                              <Check size={14} />
                            )}
                            Approve & Mark Paid
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Configurations */}
            {activeTab === 'configs' && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Section 1: Per-Class Tuition Rates */}
                <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#F5F5F5] pb-4">
                    <div className="flex items-center gap-2">
                      <Coins size={18} className="text-[#F4C430]" />
                      <div>
                        <h2 className="font-extrabold text-[#111111] text-base">
                          Per-Class Tuition Rates (All Boards & Classes)
                        </h2>
                        <p className="text-xs text-[#737373] mt-0.5">
                          Configure official tuition fee amounts across Federal Board (FBISE), Sindh Board, and IELTS Preparation. Prices set here apply instantly across student onboarding, checkout, and the public fee calculator.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Board Filter Switcher */}
                  <div className="flex items-center gap-2 bg-[#F5F5F5] p-1.5 rounded-xl max-w-md">
                    <button
                      type="button"
                      onClick={() => setSelectedBoardFilter('all')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                        selectedBoardFilter === 'all'
                          ? 'bg-white text-[#111111] shadow-xs'
                          : 'text-[#737373] hover:text-[#111111]'
                      }`}
                    >
                      All Classes ({classesList.length})
                    </button>
                    {BOARDS.map((b) => {
                      const count = classesList.filter((c) => c.board_id === b.id).length;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setSelectedBoardFilter(b.id)}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                            selectedBoardFilter === b.id
                              ? 'bg-white text-[#111111] shadow-xs'
                              : 'text-[#737373] hover:text-[#111111]'
                          }`}
                        >
                          {b.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Classes Table / Form */}
                  <form onSubmit={handleSaveAllClassFees} className="space-y-4">
                    <div className="divide-y divide-[#F5F5F5]">
                      {filteredClasses.map((cls) => {
                        const priceVal = classPrices[cls.id] !== undefined ? classPrices[cls.id] : 0;
                        const isSet = cls.is_set && cls.amount > 0;

                        return (
                          <div key={cls.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-[#111111]">
                                  {cls.board_id === 'ielts' ? cls.display_name : `Class ${cls.display_name}`}
                                </span>
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                  {cls.board_name}
                                </span>
                                {isSet ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    DB Rate: PKR {cls.amount.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Unset (PKR 0) — will insert row
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#A3A3A3] uppercase">PKR</span>
                              <input
                                type="number"
                                min="0"
                                value={priceVal === 0 ? '' : priceVal}
                                onChange={(e) => handlePriceChange(cls.id, e.target.value)}
                                placeholder="0 (Unset)"
                                className="input py-1.5 text-xs bg-white border-[#E5E5E5] rounded-lg font-bold font-mono w-28 text-right"
                              />
                              <span className="text-[10px] font-black text-[#A3A3A3] uppercase">/term</span>

                              <button
                                type="button"
                                onClick={() => handleSaveSingleClassFee(cls.id)}
                                disabled={savingClassId === cls.id || savingClasses}
                                title="Save this class rate"
                                className="p-2 rounded-lg bg-slate-100 hover:bg-[#F4C430] text-slate-700 hover:text-black transition-colors disabled:opacity-50"
                              >
                                {savingClassId === cls.id ? (
                                  <Loader2 size={13} className="animate-spin" />
                                ) : (
                                  <Check size={13} />
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
                        disabled={savingClasses}
                        className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2 text-xs font-bold"
                      >
                        {savingClasses ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Saving Class Rates…
                          </>
                        ) : (
                          <>
                            <Save size={14} />
                            Save All Class Rates
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Section 2: Universal Payment Setup */}
                <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                    <Sparkles size={16} className="text-[#F4C430]" />
                    <div>
                      <h2 className="font-extrabold text-[#111111] text-base">
                        Universal Payment Accounts & WhatsApp Verification
                      </h2>
                      <p className="text-xs text-[#737373] mt-0.5">
                        Account numbers and verification instructions sent to students during registration and checkout.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* WhatsApp Phone */}
                    <div>
                      <label className="block text-xs font-bold text-[#262626] mb-1.5">
                        WhatsApp Verification Line (wa.me Number)
                      </label>
                      <input
                        type="text"
                        required
                        value={whatsappNum}
                        onChange={(e) => setWhatsappNum(e.target.value)}
                        placeholder="e.g. 03222314436"
                        className="input py-2 text-xs"
                      />
                      <span className="text-[10px] text-[#A3A3A3] mt-1 block">
                        Specify the phone number where students will send their payment receipts via WhatsApp.
                      </span>
                    </div>

                    {/* Instructions */}
                    <div>
                      <label className="block text-xs font-bold text-[#262626] mb-1.5">
                        Payment Account Details (Bank, Easypaisa, JazzCash)
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        className="input py-2 text-xs font-mono leading-relaxed"
                        placeholder="Easypaisa:&#10;Number: 03335292094&#10;Name: Sadia Fatima"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold interactive"
                    >
                      {saving ? (
                        <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                      ) : (
                        <>
                          <Save size={14} />
                          Save Universal Setup
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminFeesPage;
