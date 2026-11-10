import Card from '../common/Card.jsx';

export default function ChartShell({ title, data = [], valueKey, labelKey = 'date', color = '#4f46e5', format = (value) => value }) {
  const rows = Array.isArray(data) ? data.filter((item) => item && typeof item === 'object') : [];
  const max = Math.max(...rows.map((item) => Number(item[valueKey]) || 0), 1);
  return <Card className="p-5"><h2 className="font-bold">{title}</h2>{rows.length ? <div className="mt-6 flex h-56 items-end gap-2 overflow-x-auto border-b border-l px-3 pt-4">{rows.map((item, index) => { const label = item[labelKey] ?? 'Unknown'; const value = Number(item[valueKey]) || 0; return <div key={`${label}-${index}`} className="group flex min-w-8 flex-1 flex-col items-center justify-end"><span className="mb-1 hidden text-[10px] font-semibold group-hover:block">{format(value)}</span><div title={`${label}: ${format(value)}`} className="w-full max-w-12 rounded-t transition hover:opacity-80" style={{ height: `${Math.max((value / max) * 170, 3)}px`, backgroundColor: color }} /><span className="mt-2 max-w-14 truncate text-[9px] text-slate-500">{label}</span></div>; })}</div> : <p className="grid h-56 place-items-center text-sm text-slate-500">No data available.</p>}</Card>;
}
