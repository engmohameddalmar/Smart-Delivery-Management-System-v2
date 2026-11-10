import { LoaderCircle } from 'lucide-react';
export default function Loading({ label = 'Loading…' }) { return <div className="flex items-center justify-center gap-2 p-8 text-slate-500"><LoaderCircle className="animate-spin" size={20} />{label}</div>; }
