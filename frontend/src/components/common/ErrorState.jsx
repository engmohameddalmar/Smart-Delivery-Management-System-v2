import { CircleAlert, RotateCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><CircleAlert size={20} /><span className="min-w-0 flex-1">{message}</span>{onRetry && <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 font-semibold hover:bg-red-100"><RotateCw size={16} />Retry</button>}</div>;
}
