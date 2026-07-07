import React, { useState } from 'react';
import { Check, ArrowRight, Zap, GraduationCap, BookOpen } from 'lucide-react';

const BOARDS = [
  { value: 'fbise', label: 'Federal Board (FBISE)' },
  { value: 'punjab', label: 'Punjab Board (BISE)' },
  { value: 'cambridge', label: 'Cambridge (O/A Levels)' },
];

interface GradeOption {
  value: string;
  label: string;
  subjects: string[];
  basePrice: number;
}

const GRADES: Record<string, GradeOption[]> = {
  fbise: [
    { value: '9', label: 'Class 9', subjects: ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology / Computer Science'], basePrice: 2499 },
    { value: '10', label: 'Class 10', subjects: ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology / Computer Science'], basePrice: 2499 },
    { value: '11', label: 'Class 11', subjects: ['Urdu', 'English', 'Mathematics / Biology', 'Physics', 'Chemistry / Computer Science'], basePrice: 3499 },
    { value: '12', label: 'Class 12', subjects: ['Urdu', 'English', 'Mathematics / Biology', 'Physics', 'Chemistry / Computer Science'], basePrice: 3499 },
  ],
  punjab: [
    { value: '9', label: 'Class 9', subjects: ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology / Computer Science'], basePrice: 2299 },
    { value: '10', label: 'Class 10', subjects: ['Urdu', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology / Computer Science'], basePrice: 2299 },
    { value: '11', label: 'Class 11', subjects: ['Urdu', 'English', 'Mathematics / Biology', 'Physics', 'Chemistry / Computer Science'], basePrice: 3199 },
    { value: '12', label: 'Class 12', subjects: ['Urdu', 'English', 'Mathematics / Biology', 'Physics', 'Chemistry / Computer Science'], basePrice: 3199 },
  ],
  cambridge: [
    { value: 'o', label: 'O Levels', subjects: ['Mathematics D', 'Physics', 'Chemistry', 'Computer Science'], basePrice: 4999 },
    { value: 'a', label: 'A Levels', subjects: ['Mathematics (9709)', 'Physics (9702)', 'Computer Science (9618)'], basePrice: 6999 },
  ],
};

const PricingSection: React.FC = () => {
  const [selectedBoard, setSelectedBoard] = useState('fbise');
  const [selectedGradeValue, setSelectedGradeValue] = useState('10');

  const annual = false;

  const activeGradesList = GRADES[selectedBoard] || [];
  
  // Find currently active grade option, fall back to first if none matches
  const activeGrade = activeGradesList.find(g => g.value === selectedGradeValue) || activeGradesList[0];

  const handleBoardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const board = e.target.value;
    setSelectedBoard(board);
    // Auto-select first grade of newly selected board
    if (GRADES[board] && GRADES[board].length > 0) {
      setSelectedGradeValue(GRADES[board][0].value);
    }
  };

  // Calculate prices
  const customPrice = activeGrade ? localStorage.getItem(`scholario_price_${selectedBoard}_${activeGrade.value}`) : null;
  const basePrice = customPrice ? parseInt(customPrice, 10) : (activeGrade ? activeGrade.basePrice : 2499);
  const displayPrice = basePrice;

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="section-label justify-center mb-4">Pricing Calculator</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Select your Board & Class
          </h2>
          <p className="text-xl text-[#737373] max-w-xl mx-auto mb-8">
            Choose your academic path below to see the exact subjects and personalized monthly pricing plans.
          </p>

          {/* Interactive Selectors Bar */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#FAFAFA] border border-[#E5E5E5] p-5 rounded-2xl mb-12">
            <div>
              <label htmlFor="board-select" className="block text-left text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                1. Select Board
              </label>
              <select
                id="board-select"
                value={selectedBoard}
                onChange={handleBoardChange}
                className="w-full bg-white border border-[#E5E5E5] rounded-xl px-4 py-3 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#F4C430] cursor-pointer"
              >
                {BOARDS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="grade-select" className="block text-left text-xs font-bold text-[#737373] uppercase tracking-wider mb-2">
                2. Select Class / Grade
              </label>
              <select
                id="grade-select"
                value={selectedGradeValue}
                onChange={(e) => setSelectedGradeValue(e.target.value)}
                className="w-full bg-white border border-[#E5E5E5] rounded-xl px-4 py-3 text-sm font-semibold text-[#111111] focus:outline-none focus:border-[#F4C430] cursor-pointer"
              >
                {activeGradesList.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Layout Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          
          {/* Included Subjects Info (Left Side - 5 Columns) */}
          <div className="md:col-span-5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#FFFBF0] flex items-center justify-center border border-[#FDF3C8]">
                  <GraduationCap size={16} className="text-[#D4A017]" />
                </div>
                <h3 className="font-bold text-[#111111] text-lg">Active Courses Included</h3>
              </div>
              <p className="text-xs text-[#737373] mb-6 leading-relaxed">
                You will get comprehensive access to complete video lectures, notes, resources, and live mock exams for the following subjects:
              </p>

              <ul className="space-y-3">
                {activeGrade?.subjects.map((sub) => (
                  <li key={sub} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-[#F0F0F0]">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center border border-green-100 shrink-0">
                      <Check size={12} className="text-[#22c55e]" />
                    </div>
                    <span className="text-sm font-bold text-[#111111]">{sub}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-[#E5E5E5] text-[11px] text-[#A3A3A3] flex items-center gap-2">
              <BookOpen size={12} />
              <span>Full syllabus aligned with FBISE/Punjab/Cambridge requirements.</span>
            </div>
          </div>

          {/* Pricing Cards (Right Side - 7 Columns) */}
          <div className="md:col-span-7 flex justify-center items-stretch">
            
            {/* Dynamic Growth Plan Card */}
            <div className="relative rounded-2xl bg-[#111111] border border-[#111111] p-7 shadow-2xl flex flex-col justify-between text-white w-full max-w-sm">
              {/* Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span
                  className="px-3.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide"
                  style={{ background: '#F4C430', color: '#111111' }}
                >
                  Growth Bundle
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base font-bold text-white">Growth Plan</span>
                  <Zap size={14} style={{ color: '#F4C430' }} />
                </div>
                <p className="text-xs text-[#737373] leading-relaxed mb-6">
                  Ideal for students looking for structured daily schedules and note vaults.
                </p>

                {/* Dynamic Price */}
                <div className="mb-6 pb-6 border-b border-[#262626]">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-[#737373]">PKR</span>
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {displayPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[#737373]">/mo</span>
                  </div>
                </div>

                {/* Small checklist */}
                <ul className="space-y-2.5 mb-6 text-xs text-[#D4D4D4]">
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Complete Course access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Daily schedule logs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={12} className="text-[#F4C430]" />
                    <span>Resource library vaults</span>
                  </li>
                </ul>
              </div>

              <a 
                href="/register"
                className="btn btn-gold btn-md w-full flex items-center justify-center gap-1"
              >
                Get Started
                <ArrowRight size={14} />
              </a>
            </div>

          </div>
        </div>

        {/* Footnote */}
        <p className="text-center text-sm text-[#A3A3A3] mt-12">
          All pricing options denominated in Pakistani Rupees (PKR).
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
