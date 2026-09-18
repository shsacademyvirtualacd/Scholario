export function sanitizePostgrestFilterValue(val: string): string {
  if (!val) return '""';
  const escaped = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
  return `"${escaped}"`;
}
