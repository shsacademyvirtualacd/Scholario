import React, { useState, useEffect, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { syncPricingToFeeConfigs, getClassesWithFeeConfigs, ClassWithFeeConfig } from '../../lib/db';
import { BOARDS, BoardId } from '../../lib/taxonomy';
import { toast } from 'sonner';

// Canonical Short Labels for all 7 boards
const BOARD_TABS: { id: string; label: string; short: string }[] = [
  { id: 'all', label: 'All Boards', short: 'All' },
  { id: 'fbise', label: 'Federal Board (FBISE)', short: 'FBISE' },
  { id: 'punjab', label: 'Punjab Board', short: 'Punjab' },
  { id: 'sindh', label: 'Sindh Board', short: 'Sindh' },
  { id: 'kpk', label: 'KPK Board', short: 'KPK' },
  { id: 'olevel', label: 'O Levels', short: 'O Levels' },
  { id: 'alevel', label: 'A Levels', short: 'A Levels' },
  { id: 'ielts', label: 'IELTS Preparation', short: 'IELTS' },
];

export const PriceManagerPage: React.FC = () => {
  const [classesList, setClassesList] = useState<ClassWithFeeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Baseline database prices vs. User edited draft prices
  const [originalPrices, setOriginalPrices] = useState<Record<string, number>>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});

  // Filters & Search
  const [selectedBoardId, setSelectedBoardId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnconfigured, setOnlyUnconfigured] = useState(false);

  // Collapsible Board Sections (all open by default)
  const [collapsedBoards, setCollapsedBoards] = useState<Record<string, boolean>>({});

  // Modals
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Bulk Edit Form State
  const [bulkMode, setBulkMode] = useState<'set' | 'percent' | 'amount'>('percent');
  const [bulkValue, setBulkValue] = useState<string>('10');
  const [bulkScope, setBulkScope] = useState<'filtered' | 'board' | 'unconfigured'>('filtered');

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getClassesWithFeeConfigs();
      setClassesList(data);

      const baseline: Record<string, number> = {};
      data.forEach((c) => {
        baseline[c.id] = c.amount || 0;
      });
      setOriginalPrices(baseline);
      setEditedPrices(baseline);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load classes and pricing: ' + (err.message || 'Database error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute changed class IDs
  const changedClassIds = useMemo(() => {
    return Object.keys(editedPrices).filter(
      (id) => editedPrices[id] !== undefined && editedPrices[id] !== originalPrices[id]
    );
  }, [editedPrices, originalPrices]);

  const hasUnsavedChanges = changedClassIds.length > 0;

  // Handle single price input changes
  const handlePriceChange = (classId: string, rawVal: string) => {
    // Only accept positive digits
    const cleanDigits = rawVal.replace(/\D/g, '');
    const num = cleanDigits === '' ? 0 : parseInt(cleanDigits, 10);
    setEditedPrices((prev) => ({
      ...prev,
      [classId]: Math.max(0, num),
    }));
  };

  // Discard all unsaved edits
  const handleDiscardChanges = () => {
    setEditedPrices({ ...originalPrices });
    toast.info('Discarded all unsaved pricing edits.');
  };

  // Toggle board section collapse
  const toggleBoardCollapse = (boardId: string) => {
    setCollapsedBoards((prev) => ({
      ...prev,
      [boardId]: !prev[boardId],
    }));
  };

  // Summary counts across all boards
  const totalCount = classesList.length;
  const configuredCount = useMemo(() => {
    return classesList.filter((c) => {
      const p = editedPrices[c.id] !== undefined ? editedPrices[c.id] : c.amount;
      return p > 0;
    }).length;
  }, [classesList, editedPrices]);
  const unconfiguredCount = totalCount - configuredCount;

  // Per-board stats
  const boardStats = useMemo(() => {
    return BOARDS.map((b) => {
      const boardClasses = classesList.filter((c) => c.board_id === b.id);
      const configured = boardClasses.filter((c) => {
        const p = editedPrices[c.id] !== undefined ? editedPrices[c.id] : c.amount;
        return p > 0;
      }).length;
      return {
        ...b,
        total: boardClasses.length,
        configured,
        unconfigured: boardClasses.length - configured,
      };
    });
  }, [classesList, editedPrices]);

  // Filtered classes list
  const filteredClasses = useMemo(() => {
    return classesList.filter((cls) => {
      // Board filter
      if (selectedBoardId !== 'all' && cls.board_id !== selectedBoardId) {
        return false;
      }

      // Unconfigured only filter
      const currentPrice = editedPrices[cls.id] !== undefined ? editedPrices[cls.id] : cls.amount;
      if (onlyUnconfigured && currentPrice > 0) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = cls.display_name.toLowerCase().includes(q);
        const boardMatch = (cls.board_name || '').toLowerCase().includes(q);
        const gradeMatch = (cls.grade || '').toLowerCase().includes(q);
        if (!nameMatch && !boardMatch && !gradeMatch) return false;
      }

      return true;
    });
  }, [classesList, selectedBoardId, onlyUnconfigured, searchQuery, editedPrices]);

  // Group filtered classes by Board
  const groupedClassesByBoard = useMemo(() => {
    const groups: { board: (typeof BOARDS)[0] | { id: string; name: string; shortName: string }; classes: ClassWithFeeConfig[] }[] = [];
    const boardOrder: BoardId[] = ['fbise', 'punjab', 'sindh', 'kpk', 'olevel', 'alevel', 'ielts'];

    boardOrder.forEach((bId) => {
      const matchedBoard = BOARDS.find((b) => b.id === bId) || {
        id: bId,
        name: bId.toUpperCase(),
        shortName: bId.toUpperCase(),
        description: '',
      };
      const boardClasses = filteredClasses.filter((c) => c.board_id === bId);
      if (boardClasses.length > 0) {
        groups.push({
          board: matchedBoard,
          classes: boardClasses,
        });
      }
    });

    return groups;
  }, [filteredClasses]);

  // Bulk Edit Execution
  const handleApplyBulkEdit = () => {
    const val = parseFloat(bulkValue);
    if (isNaN(val) || val < 0) {
      toast.error('Please enter a valid positive number for bulk adjustment.');
      return;
    }

    let targetClasses = filteredClasses;
    if (bulkScope === 'board' && selectedBoardId !== 'all') {
      targetClasses = classesList.filter((c) => c.board_id === selectedBoardId);
    } else if (bulkScope === 'unconfigured') {
      targetClasses = classesList.filter((c) => (editedPrices[c.id] || c.amount || 0) === 0);
    }

    const nextEdited = { ...editedPrices };
    targetClasses.forEach((cls) => {
      const current = editedPrices[cls.id] !== undefined ? editedPrices[cls.id] : cls.amount || 0;
      let computed = current;

      if (bulkMode === 'set') {
        computed = Math.round(val);
      } else if (bulkMode === 'percent') {
        computed = Math.round(current * (1 + val / 100));
      } else if (bulkMode === 'amount') {
        computed = Math.max(0, Math.round(current + val));
      }

      nextEdited[cls.id] = computed;
    });

    setEditedPrices(nextEdited);
    setBulkModalOpen(false);
    toast.success(`Applied bulk update to ${targetClasses.length} classes. Review and save below.`);
  };

  // Confirm and Save only the modified classes
  const handleConfirmSaveOnlyEdited = async () => {
    setSaving(true);
    try {
      const savePromises = changedClassIds.map((classId) => {
        const newPrice = editedPrices[classId] || 0;
        return syncPricingToFeeConfigs(classId, newPrice);
      });

      await Promise.all(savePromises);

      toast.success(`Successfully saved ${changedClassIds.length} fee rates!`);
      setReviewModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save fee rates: ' + (err.message || 'Error occurred'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-5 pb-24">
        {/* ── Page Header & Fixed Accurate Description ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeader
            title="Price & Fee Manager"
            description="Configure official tuition pricing across all 7 academic boards (FBISE, Punjab Board, Sindh Board, KPK Board, O Levels, A Levels & IELTS Preparation)."
          />

          {/* Quick Bulk Action Button */}
          <button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="self-start sm:self-center px-3.5 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <SlidersHorizontal size={14} className="text-amber-500" />
            <span>Bulk Set or Increase</span>
          </button>
        </div>

        {/* ── Single Source of Truth Mini-Banner (Shrunk to 1 line) ── */}
        <div className="px-3.5 py-2 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <span className="font-bold shrink-0">Single Source of Truth:</span>
          <span className="truncate">
            Fee rates configured here instantly apply across student onboarding, checkout summaries, and the public tuition calculator.
          </span>
        </div>

        {/* ── Filter Bar: Short Board Tabs, Search, & Unset Toggle ── */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-xs space-y-2.5">
          {/* Top row: Short Board Tabs (horizontal scroll on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {BOARD_TABS.map((tab) => {
              const isSelected = selectedBoardId === tab.id;
              const count =
                tab.id === 'all'
                  ? classesList.length
                  : classesList.filter((c) => c.board_id === tab.id).length;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedBoardId(tab.id)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span>{tab.short}</span>
                  <span className={`ml-1.5 text-[10px] ${isSelected ? 'opacity-80' : 'text-neutral-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom row: Search + "Not configured only" filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search class or syllabus..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={onlyUnconfigured}
                  onChange={(e) => setOnlyUnconfigured(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-neutral-300 focus:ring-amber-500 cursor-pointer"
                />
                <span>Not configured only ({unconfiguredCount})</span>
              </label>

              {(selectedBoardId !== 'all' || searchQuery || onlyUnconfigured) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBoardId('all');
                    setSearchQuery('');
                    setOnlyUnconfigured(false);
                  }}
                  className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1"
                >
                  <RotateCcw size={11} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Main Layout: Desktop 2-column (Sticky Left Rail + Main Collapsible Sections) ── */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-neutral-200 border-t-amber-400 animate-spin mx-auto" />
            <p className="text-xs text-neutral-500 font-medium">Loading classes and fee configurations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ── Sticky Left Rail: Compact Board Coverage Summary ── */}
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
              <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-amber-500" />
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                      Pricing Coverage
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {configuredCount} / {totalCount}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((configuredCount / Math.max(totalCount, 1)) * 100)}%` }}
                  />
                </div>

                {/* Board rows in Rail */}
                <div className="space-y-1.5 text-xs">
                  {boardStats.map((bs) => {
                    const isAllConfigured = bs.unconfigured === 0;
                    return (
                      <button
                        key={bs.id}
                        type="button"
                        onClick={() => setSelectedBoardId(selectedBoardId === bs.id ? 'all' : bs.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
                          selectedBoardId === bs.id
                            ? 'bg-neutral-100 dark:bg-neutral-800 font-bold'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <span className="text-neutral-800 dark:text-neutral-200">{bs.shortName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 tabular-nums">
                            {bs.configured}/{bs.total}
                          </span>
                          {isAllConfigured ? (
                            <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded">
                              {bs.unconfigured} unset
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {/* ── Main Panel: Collapsible Board Sections with Compact Class Rows ── */}
            <div className="lg:col-span-8 space-y-4">
              {groupedClassesByBoard.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl space-y-2">
                  <Coins size={28} className="mx-auto text-neutral-300 dark:text-neutral-600" />
                  <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    No classes match your current filters.
                  </p>
                </div>
              ) : (
                groupedClassesByBoard.map(({ board, classes }) => {
                  const isCollapsed = Boolean(collapsedBoards[board.id]);
                  const boardConfigured = classes.filter((c) => (editedPrices[c.id] || c.amount || 0) > 0).length;

                  return (
                    <section
                      key={board.id}
                      className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs overflow-hidden"
                    >
                      {/* Collapsible Header */}
                      <button
                        type="button"
                        onClick={() => toggleBoardCollapse(board.id)}
                        className="w-full p-3.5 sm:p-4 bg-neutral-50/70 dark:bg-neutral-900/40 hover:bg-neutral-100/70 dark:hover:bg-neutral-900/70 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                          <div>
                            <h4 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              {board.name}
                            </h4>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              {boardConfigured}/{classes.length} configured
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {boardConfigured === classes.length ? (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Complete
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                              {classes.length - boardConfigured} unset
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Class Rows */}
                      {!isCollapsed && (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800/80">
                          {classes.map((cls) => {
                            const original = originalPrices[cls.id] || 0;
                            const current = editedPrices[cls.id] !== undefined ? editedPrices[cls.id] : original;
                            const isEdited = current !== original;
                            const isUnset = current === 0;

                            const percentChange =
                              original > 0 ? Math.round(((current - original) / original) * 100) : 0;
                            const isHighChange = Math.abs(percentChange) >= 30;

                            return (
                              <div
                                key={cls.id}
                                className={`p-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                  isEdited
                                    ? 'bg-amber-500/[0.06] dark:bg-amber-500/[0.08]'
                                    : 'hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30'
                                }`}
                              >
                                {/* Left: Class Name + Status */}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                                      {cls.board_id === 'ielts' ? cls.display_name : `Class ${cls.display_name}`}
                                    </span>

                                    {/* Flag ONLY when Not Configured */}
                                    {isUnset && (
                                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                        Not configured
                                      </span>
                                    )}

                                    {/* Old-to-new indicator only when edited */}
                                    {isEdited && (
                                      <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.2 rounded-md ${
                                          isHighChange
                                            ? 'bg-amber-500 text-neutral-950'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200'
                                        }`}
                                      >
                                        <span>PKR {original.toLocaleString()}</span>
                                        <ArrowRight size={10} />
                                        <span>PKR {current.toLocaleString()}</span>
                                        <span className="ml-1">({percentChange > 0 ? `+${percentChange}%` : `${percentChange}%`})</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Right: Compact Price Input (PKR ... /term) */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center">
                                  <span className="text-[11px] font-bold text-neutral-400 uppercase">PKR</span>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={current === 0 ? '' : current}
                                    onChange={(e) => handlePriceChange(cls.id, e.target.value)}
                                    placeholder="0"
                                    className={`w-28 text-right text-xs px-2.5 py-1.5 rounded-lg border tabular-nums font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                                      isEdited
                                        ? 'border-amber-400 bg-white dark:bg-neutral-800 text-amber-900 dark:text-amber-200 font-bold ring-1 ring-amber-400/50'
                                        : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                                    }`}
                                  />
                                  <span className="text-[10px] text-neutral-400 uppercase">/term</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Sticky Bottom Save Bar (Visible when there are unsaved edits) ── */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 inset-x-4 max-w-4xl mx-auto z-40 bg-neutral-900 dark:bg-neutral-950 text-white border border-neutral-700 rounded-2xl p-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-bold">
                {changedClassIds.length} {changedClassIds.length === 1 ? 'unsaved rate change' : 'unsaved rate changes'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDiscardChanges}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Discard
              </button>

              <button
                type="button"
                onClick={() => setReviewModalOpen(true)}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Save size={13} />
                <span>Review & Save ({changedClassIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Review & Confirm Save Dialog (Listing only edited rows) ── */}
        {reviewModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Coins size={18} className="text-amber-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    Review Pricing Changes ({changedClassIds.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                  Confirm the updated tuition fee rates below. Changes will apply immediately to checkout and the fee calculator.
                </p>

                <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                  {changedClassIds.map((id) => {
                    const cls = classesList.find((c) => c.id === id);
                    const oldPrice = originalPrices[id] || 0;
                    const newPrice = editedPrices[id] || 0;
                    const diff = newPrice - oldPrice;
                    const percent = oldPrice > 0 ? Math.round((diff / oldPrice) * 100) : 0;
                    const isHighChange = Math.abs(percent) >= 30;

                    return (
                      <div key={id} className="p-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {cls?.board_name} • {cls?.display_name}
                          </div>
                          {isHighChange && (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={11} />
                              <span>Notice: Change exceeds 30%</span>
                            </span>
                          )}
                        </div>

                        <div className="text-right tabular-nums">
                          <div className="font-bold text-neutral-900 dark:text-neutral-100">
                            PKR {newPrice.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            was PKR {oldPrice.toLocaleString()}{' '}
                            <span className={diff >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              ({diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={saving}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirmSaveOnlyEdited}
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center gap-1.5 shadow-xs"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  <span>{saving ? 'Saving...' : `Confirm & Save (${changedClassIds.length})`}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Bulk Set / Increase Modal ── */}
        {bulkModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={18} className="text-amber-500" />
                  <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                    Bulk Price Adjustment
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Mode Select */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Action Type
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBulkMode('percent')}
                      className={`py-2 text-center rounded-xl font-bold transition-all ${
                        bulkMode === 'percent'
                          ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Increase %
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('amount')}
                      className={`py-2 text-center rounded-xl font-bold transition-all ${
                        bulkMode === 'amount'
                          ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      + / - Fixed PKR
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkMode('set')}
                      className={`py-2 text-center rounded-xl font-bold transition-all ${
                        bulkMode === 'set'
                          ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Set Exact PKR
                    </button>
                  </div>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    {bulkMode === 'percent'
                      ? 'Percentage Value (%)'
                      : bulkMode === 'amount'
                      ? 'Adjustment Amount (PKR)'
                      : 'Exact Rate (PKR)'}
                  </label>
                  <input
                    type="number"
                    value={bulkValue}
                    onChange={(e) => setBulkValue(e.target.value)}
                    placeholder={bulkMode === 'percent' ? '10' : '4500'}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  />
                </div>

                {/* Scope Select */}
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Target Scope
                  </label>
                  <select
                    value={bulkScope}
                    onChange={(e) => setBulkScope(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="filtered">Currently filtered view ({filteredClasses.length} classes)</option>
                    <option value="unconfigured">Only unconfigured classes ({unconfiguredCount})</option>
                    {selectedBoardId !== 'all' && (
                      <option value="board">All classes in selected board</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkEdit}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 shadow-xs"
                >
                  Apply to Unsaved Edits
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default PriceManagerPage;
