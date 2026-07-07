import React, { useState, useEffect } from 'react';
import { 
  Coins, Settings, ShieldCheck, Clock, Search, Check,
  AlertCircle, Sparkles, Save
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { 
  getAllOfferings, getFeeConfig, saveFeeConfig, 
  getPendingFeeStatuses, updateFeeStatus 
} from '../../lib/db';
import type { ClassOffering } from '../../types';

export const AdminFeesPage: React.FC = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'pending' | 'configs'>('pending');

  // Loaders & Errors
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotif, setSuccessNotif] = useState<string | null>(null);

  // Data States
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [pendingList, setPendingList] = useState<any[]>([]);

  // Config Form States
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<number>(4500);
  const [instructions, setInstructions] = useState<string>('');
  const [whatsappNum, setWhatsappNum] = useState<string>('+923001234567');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Audit notes state when verifying
  const [auditNotes, setAuditNotes] = useState<Record<string, string>>({});

  const showNotification = (message: string) => {
    setSuccessNotif(message);
    setTimeout(() => setSuccessNotif(null), 3000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [offeringsData, pendingData] = await Promise.all([
        getAllOfferings(),
        getPendingFeeStatuses()
      ]);
      setOfferings(offeringsData);
      setPendingList(pendingData);

      if (offeringsData.length > 0) {
        setSelectedClassId(offeringsData[0].id);
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

  // Fetch fee config when selected offering changes
  useEffect(() => {
    if (!selectedClassId) return;
    getFeeConfig(selectedClassId).then(config => {
      if (config) {
        setFeeAmount(config.amount);
        setInstructions(config.payment_instructions);
        setWhatsappNum(config.whatsapp_number);
      } else {
        // Fallback default structure
        setFeeAmount(4500);
        setInstructions('Bank Alfalah\nAccount Title: SHS Academy\nAccount No: 5502-1928-3746\n\nJazzCash / Easypaisa:\nNumber: 0300-1234567\nName: Ahmad Khan');
        setWhatsappNum('+923001234567');
      }
    }).catch(console.error);
  }, [selectedClassId]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    try {
      setSaving(true);
      setError(null);
      await saveFeeConfig(selectedClassId, feeAmount, instructions.trim(), whatsappNum.trim());
      showNotification('Fee configuration successfully saved!');
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleApprovePayment = async (studentId: string) => {
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

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Institutional Fee Management"
            description="Manage active student billing and WhatsApp verification. For public-facing marketing rates, use the Syllabus Price Manager."
          />
        </div>

        {/* Success Toast */}
        {successNotif && (
          <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-[#F0FDF4] border-[#bbf7d0] text-[#16a34a] shadow-lg animate-in slide-in-from-bottom-5 duration-300">
            <Check size={16} />
            <span className="text-xs font-bold">{successNotif}</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-sm text-[#dc2626] flex items-center gap-2">
            <AlertCircle size={16} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex items-center gap-1 border-b border-[#E5E5E5] pb-px">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-[#F4C430] text-[#111111]'
                : 'border-transparent text-[#737373] hover:text-[#262626]'
            }`}
          >
            <Clock size={14} />
            Pending Verification ({pendingList.length})
          </button>
          <button
            onClick={() => setActiveTab('configs')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'configs'
                ? 'border-[#F4C430] text-[#111111]'
                : 'border-transparent text-[#737373] hover:text-[#262626]'
            }`}
          >
            <Settings size={14} />
            Fee Configuration
          </button>
        </div>

        {loading ? (
          <div className="card py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
            <span className="text-xs text-[#737373] font-medium">Loading modules...</span>
          </div>
        ) : (
          <div>
            {/* Tab 1: Pending Approvals */}
            {activeTab === 'pending' && (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="card bg-white border border-[#E5E5E5] p-4">
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
                  <div className="card text-center py-16">
                    <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-3" />
                    <h3 className="text-sm font-bold text-[#111111]">All caught up!</h3>
                    <p className="text-xs text-[#737373] mt-1">There are no student fee payments awaiting verification.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredPending.map((item) => (
                      <div key={item.student_id} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        {/* Student Meta */}
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-[#111111]">{item.full_name}</span>
                            <span className="badge badge-gray text-[10px]">{item.class_name}</span>
                          </div>
                          <p className="text-xs text-[#737373]">{item.email}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#A3A3A3] font-semibold mt-1">
                            <Clock size={11} />
                            <span>Submitted: {new Date(item.updated_at).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Audit Input & Verify Button */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 w-full md:w-auto">
                          <div className="w-full sm:w-64">
                            <input
                              type="text"
                              placeholder="Optional audit log comment..."
                              value={auditNotes[item.student_id] || ''}
                              onChange={(e) => handleAuditNoteChange(item.student_id, e.target.value)}
                              className="input py-2 text-xs bg-[#FAFAFA] w-full"
                            />
                          </div>
                          
                          <button
                            onClick={() => handleApprovePayment(item.student_id)}
                            className="btn btn-gold flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-bold shrink-0 self-stretch sm:self-auto"
                          >
                            <Check size={14} />
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Select Class */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                      <Coins size={16} className="text-[#F4C430]" />
                      <h2 className="font-extrabold text-[#111111] text-sm">Select Class</h2>
                    </div>

                    <p className="text-xs text-[#737373] leading-relaxed">
                      Select which syllabus class offering you want to update payment settings for. Each class can have custom rates and receipt lines.
                    </p>

                    <div>
                      <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wider mb-1.5">
                        Class Offering
                      </label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="input text-xs cursor-pointer"
                      >
                        {offerings.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.subject} ({o.grade})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Side: Configuration Editor */}
                <div className="lg:col-span-2">
                  <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl border border-[#E5E5E5] p-6 space-y-6">
                    <div className="flex items-center gap-2 border-b border-[#F5F5F5] pb-3">
                      <Sparkles size={16} className="text-[#F4C430]" />
                      <h2 className="font-extrabold text-[#111111] text-sm">
                        Configure payment for {offerings.find(o => o.id === selectedClassId)?.subject}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {/* Fee Amount */}
                      <div>
                        <label className="block text-xs font-bold text-[#262626] mb-1.5">
                          Tuition Fee Amount (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          required
                          value={feeAmount}
                          onChange={(e) => setFeeAmount(parseInt(e.target.value, 10) || 0)}
                          className="input py-2 text-xs font-semibold"
                        />
                      </div>

                      {/* WhatsApp Phone */}
                      <div>
                        <label className="block text-xs font-bold text-[#262626] mb-1.5">
                          WhatsApp Line (wa.me Number)
                        </label>
                        <input
                          type="text"
                          required
                          value={whatsappNum}
                          onChange={(e) => setWhatsappNum(e.target.value)}
                          placeholder="e.g. +923001234567"
                          className="input py-2 text-xs"
                        />
                        <span className="text-[10px] text-[#A3A3A3] mt-1 block">
                          Include country code without special characters (e.g. +92 or 92).
                        </span>
                      </div>

                      {/* Instructions */}
                      <div>
                        <label className="block text-xs font-bold text-[#262626] mb-1.5">
                          Payment Instructions (Bank Account / Wallet details)
                        </label>
                        <textarea
                          required
                          rows={6}
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          className="input py-2 text-xs font-mono leading-relaxed"
                          placeholder="Bank Alfalah&#10;Account Name: SHS Academy&#10;Account No: 1234-5678"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#F5F5F5] flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-gold flex items-center justify-center gap-1.5 px-6 py-2.5 text-xs font-bold"
                      >
                        {saving ? (
                          <div className="w-4 h-4 rounded-full border border-current border-t-transparent animate-spin" />
                        ) : (
                          <>
                            <Save size={14} />
                            Save Config
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminFeesPage;
