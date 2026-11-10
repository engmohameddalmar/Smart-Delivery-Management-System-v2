import { useEffect, useState } from 'react';

const options = [['today', 'Today'], ['7days', '7 Days'], ['30days', '30 Days'], ['3months', '3 Months'], ['12months', '12 Months'], ['thisyear', 'This Year'], ['custom', 'Custom']];
export default function DateRangeFilter({ value, onChange, disabled = false }) {
  const [selected, setSelected] = useState(value.period);
  const [custom, setCustom] = useState({ startDate: value.startDate || '', endDate: value.endDate || '' });
  useEffect(() => setSelected(value.period), [value.period]);
  const choose = (period) => { setSelected(period); if (period !== 'custom') onChange({ period }); };
  return <div className="no-print flex flex-wrap items-end gap-2"><select disabled={disabled} value={selected} onChange={(event) => choose(event.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-60">{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{selected === 'custom' && <><input aria-label="Start date" type="date" value={custom.startDate} onChange={(event) => setCustom({ ...custom, startDate: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><input aria-label="End date" type="date" value={custom.endDate} onChange={(event) => setCustom({ ...custom, endDate: event.target.value })} className="rounded-lg border px-3 py-2 text-sm" /><button type="button" disabled={disabled || !custom.startDate || !custom.endDate || custom.startDate > custom.endDate} onClick={() => onChange({ period: 'custom', ...custom })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Apply</button></>}</div>;
}
