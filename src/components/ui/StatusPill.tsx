import React from 'react';

export type StatusType = 'present' | 'absent' | 'late' | 'upcoming' | 'cancelled' | 'active' | 'inactive';

interface StatusPillProps {
  status: StatusType | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  let styles = 'status-pill-neutral';
  let label = status;

  switch (normalized) {
    case 'present':
      styles = 'status-pill-success';
      label = 'Present';
      break;
    case 'absent':
      styles = 'status-pill-danger';
      label = 'Absent';
      break;
    case 'late':
      styles = 'status-pill-warning';
      label = 'Late';
      break;
    case 'upcoming':
      styles = 'status-pill-warning';
      label = 'Upcoming';
      break;
    case 'cancelled':
      styles = 'status-pill-neutral line-through';
      label = 'Cancelled';
      break;
    case 'active':
      styles = 'status-pill-success';
      label = 'Active';
      break;
    case 'inactive':
      styles = 'status-pill-neutral';
      label = 'Inactive';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap shrink-0 select-none ${styles}`}>
      {label}
    </span>
  );
};

export default StatusPill;
