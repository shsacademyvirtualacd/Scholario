import React, { useState } from 'react';
import { Bell, Search, Check, AlertCircle, Info, Loader, BookOpen, Users, Award } from 'lucide-react';

const UIShowcaseSection: React.FC = () => {
  const [inputVal, setInputVal] = useState('');
  const [checkboxes, setCheckboxes] = useState({ a: true, b: false, c: true });

  return (
    <section className="py-28 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-label justify-center mb-4">Design System</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Beautifully consistent
            <br />
            UI components
          </h2>
          <p className="text-xl text-[#737373] max-w-xl mx-auto">
            Every interaction in Scholario is designed with precision, clarity, and consistency.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buttons */}
          <div className="card card-elevated p-7">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest mb-6">
              Buttons
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn btn-primary btn-lg">Primary Large</button>
                <button className="btn btn-primary btn-md">Primary</button>
                <button className="btn btn-primary btn-sm">Primary Small</button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn btn-gold btn-lg">Gold Large</button>
                <button className="btn btn-gold btn-md">Gold</button>
                <button className="btn btn-gold btn-sm">Gold Small</button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn btn-ghost btn-lg">Ghost Large</button>
                <button className="btn btn-ghost btn-md">Ghost</button>
                <button className="btn btn-outline btn-md">Outline</button>
              </div>
            </div>
          </div>

          {/* Badges & Tags */}
          <div className="card card-elevated p-7">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest mb-6">
              Badges & Status
            </h3>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="badge badge-gold">Achievement</span>
                <span className="badge badge-green">Active</span>
                <span className="badge badge-blue">In Progress</span>
                <span className="badge badge-red">Overdue</span>
                <span className="badge badge-gray">Draft</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Mathematics', 'Physics', 'Computer Science', 'English', 'Chemistry'].map((tag) => (
                  <span key={tag} className="badge badge-gray">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1.5 text-xs text-[#22c55e] font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  Live Now
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#F4C430] font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F4C430]" />
                  Upcoming
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3] font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A3A3A3]" />
                  Completed
                </div>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className="card card-elevated p-7">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest mb-6">
              Form Inputs
            </h3>
            <div className="space-y-4">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  placeholder="Search courses, students…"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="input pl-9"
                />
              </div>
              <input type="text" placeholder="Student name" className="input" />
              <input type="email" placeholder="email@institution.edu.pk" className="input" />
              <div className="relative">
                <Bell size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                <input
                  type="text"
                  placeholder="Disabled input"
                  className="input pl-9 opacity-50 cursor-not-allowed"
                  disabled
                />
              </div>
              <div className="space-y-2">
                {(['a', 'b', 'c'] as const).map((key, i) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <div
                      onClick={() => setCheckboxes(prev => ({ ...prev, [key]: !prev[key] }))}
                      className="w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-150 shrink-0 cursor-pointer"
                      style={{
                        background: checkboxes[key] ? '#111111' : '#ffffff',
                        borderColor: checkboxes[key] ? '#111111' : '#D4D4D4',
                      }}
                    >
                      {checkboxes[key] && <Check size={12} className="text-white" strokeWidth={2.5} />}
                    </div>
                    <span className="text-sm text-[#525252]">
                      {['Enable email notifications', 'Auto-grade assignments', 'Share progress with parents'][i]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Cards & Alerts */}
          <div className="card card-elevated p-7">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest mb-6">
              Alerts & Feedback
            </h3>
            <div className="space-y-3">
              {/* Success */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#F0FDF4', borderColor: '#22c55e30' }}>
                <Check size={16} className="text-[#22c55e] mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[#166534]">Course published successfully</div>
                  <div className="text-xs text-[#4ade80] mt-0.5">Your course is now live and visible to students.</div>
                </div>
              </div>
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#FFFBF0', borderColor: '#F4C43040' }}>
                <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#D4A017' }} />
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#92700A' }}>Assignment deadline approaching</div>
                  <div className="text-xs mt-0.5" style={{ color: '#B8860B' }}>3 students have not submitted yet.</div>
                </div>
              </div>
              {/* Info */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: '#EFF6FF', borderColor: '#3b82f630' }}>
                <Info size={16} className="text-[#3b82f6] mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm font-semibold text-[#1e40af]">New AI feature available</div>
                  <div className="text-xs text-[#3b82f6] mt-0.5">Try our AI lesson planner in Course Builder.</div>
                </div>
              </div>
              {/* Loading skeleton */}
              <div className="p-4 rounded-xl border border-[#E5E5E5]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-3 w-32 rounded mb-2" />
                    <div className="skeleton h-2.5 w-48 rounded" />
                  </div>
                </div>
                <div className="skeleton h-2.5 w-full rounded mb-2" />
                <div className="skeleton h-2.5 w-4/5 rounded" />
                <div className="flex items-center gap-2 mt-3">
                  <Loader size={12} className="text-[#A3A3A3] animate-spin" />
                  <span className="text-xs text-[#A3A3A3]">Loading content…</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress & Stats */}
          <div className="card card-elevated p-7">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest mb-6">
              Progress Indicators
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Mathematics — Grade 10', value: 78, color: '#F4C430' },
                { label: 'Physics — Grade 11', value: 55, color: '#3b82f6' },
                { label: 'English Literature', value: 91, color: '#22c55e' },
                { label: 'Computer Science', value: 43, color: '#a855f7' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#262626]">{label}</span>
                    <span className="text-sm font-bold text-[#111111]">{value}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${value}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Empty State & Course Card */}
          <div className="card card-elevated p-7 space-y-5">
            <h3 className="text-sm font-bold text-[#111111] uppercase tracking-widest">
              Cards & Empty States
            </h3>
            {/* Mini course card */}
            <div className="rounded-xl border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group">
              <div className="h-2 bg-[#F4C430]" />
              <div className="p-4 flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFFBF0] flex items-center justify-center shrink-0">
                  <BookOpen size={18} style={{ color: '#F4C430' }} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#111111]">Advanced Calculus</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-[#A3A3A3]">
                      <Users size={11} /> 64 students
                    </span>
                    <span className="badge badge-green text-[10px]">Active</span>
                  </div>
                  <div className="progress-bar mt-2.5">
                    <div className="progress-fill" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>
            </div>
            {/* Empty State */}
            <div className="rounded-xl border border-dashed border-[#E5E5E5]">
              <div className="empty-state">
                <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] flex items-center justify-center mb-1">
                  <Award size={22} className="text-[#D4D4D4]" />
                </div>
                <div className="empty-state-title">No certificates yet</div>
                <div className="empty-state-description">
                  Complete a course to earn your first verified certificate.
                </div>
                <button className="btn btn-gold btn-sm mt-2">
                  Browse Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UIShowcaseSection;
