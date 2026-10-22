import React from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Play,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Radio,
  Sparkles,
  Ban,
} from 'lucide-react';

export type StudentStatusType =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused'
  | 'live'
  | 'upcoming'
  | 'ready'
  | 'waiting'
  | 'ended'
  | 'todo'
  | 'due_soon'
  | 'overdue'
  | 'submitted'
  | 'submitted_late'
  | 'graded'
  | 'paid'
  | 'pending'
  | 'unpaid';

interface StudentStatusBadgeProps {
  status: StudentStatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export const StudentStatusBadge: React.FC<StudentStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  className = '',
}) => {
  const normalized = (status || '').toLowerCase().trim();

  let text = label;
  let icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} />;
  let styleClasses = 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';

  switch (normalized) {
    case 'present':
      text = text || 'Present';
      icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} className="text-emerald-500 shrink-0" />;
      styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      break;

    case 'late':
      text = text || 'Late';
      icon = <Clock size={size === 'sm' ? 12 : 14} className="text-amber-500 shrink-0" />;
      styleClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      break;

    case 'absent':
      text = text || 'Absent';
      icon = <XCircle size={size === 'sm' ? 12 : 14} className="text-rose-500 shrink-0" />;
      styleClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      break;

    case 'excused':
      text = text || 'Excused';
      icon = <AlertCircle size={size === 'sm' ? 12 : 14} className="text-blue-500 shrink-0" />;
      styleClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      break;

    case 'live':
      text = text || 'Class in session';
      icon = <Radio size={size === 'sm' ? 12 : 14} className="text-emerald-500 animate-pulse shrink-0" />;
      styleClasses = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      break;

    case 'ready':
      text = text || 'Link ready';
      icon = <Play size={size === 'sm' ? 12 : 14} className="text-amber-500 shrink-0" />;
      styleClasses = 'bg-amber-400/10 text-amber-700 dark:text-amber-300 border-amber-400/30';
      break;

    case 'waiting':
      text = text || 'Waiting for link';
      icon = <Clock size={size === 'sm' ? 12 : 14} className="text-neutral-500 shrink-0" />;
      styleClasses = 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      break;

    case 'ended':
      text = text || 'Ended';
      icon = <Clock size={size === 'sm' ? 12 : 14} className="text-neutral-400 shrink-0" />;
      styleClasses = 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
      break;

    case 'upcoming':
      text = text || 'Upcoming';
      icon = <Calendar size={size === 'sm' ? 12 : 14} className="text-sky-500 shrink-0" />;
      styleClasses = 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60';
      break;

    case 'todo':
      text = text || 'To do';
      icon = <Clock size={size === 'sm' ? 12 : 14} className="text-amber-500 shrink-0" />;
      styleClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      break;

    case 'due_soon':
      text = text || 'Due soon';
      icon = <AlertTriangle size={size === 'sm' ? 12 : 14} className="text-amber-500 shrink-0" />;
      styleClasses = 'bg-amber-100/70 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700';
      break;

    case 'overdue':
      text = text || 'Overdue';
      icon = <AlertCircle size={size === 'sm' ? 12 : 14} className="text-rose-600 shrink-0" />;
      styleClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
      break;

    case 'submitted':
      text = text || 'Submitted';
      icon = <FileCheck2 size={size === 'sm' ? 12 : 14} className="text-blue-500 shrink-0" />;
      styleClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60';
      break;

    case 'submitted_late':
      text = text || 'Submitted late';
      icon = <AlertTriangle size={size === 'sm' ? 12 : 14} className="text-orange-500 shrink-0" />;
      styleClasses = 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/60';
      break;

    case 'graded':
      text = text || 'Graded';
      icon = <Sparkles size={size === 'sm' ? 12 : 14} className="text-emerald-500 shrink-0" />;
      styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      break;

    case 'paid':
      text = text || 'Paid & Verified';
      icon = <CheckCircle2 size={size === 'sm' ? 12 : 14} className="text-emerald-500 shrink-0" />;
      styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60';
      break;

    case 'pending':
      text = text || 'Verification pending';
      icon = <Clock size={size === 'sm' ? 12 : 14} className="text-amber-500 shrink-0" />;
      styleClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
      break;

    case 'unpaid':
      text = text || 'Fee Unpaid';
      icon = <Ban size={size === 'sm' ? 12 : 14} className="text-neutral-500 shrink-0" />;
      styleClasses = 'bg-neutral-100 text-neutral-700 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700';
      break;

    default:
      text = text || status;
      break;
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border shrink-0 ${paddingClass} ${styleClasses} ${className}`}
    >
      {icon}
      <span>{text}</span>
    </span>
  );
};

export default StudentStatusBadge;
