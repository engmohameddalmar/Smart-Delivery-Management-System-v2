import { ShieldX } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const dashboards = { admin: '/admin/dashboard', business: '/business/dashboard', driver: '/driver/dashboard', customer: '/customer/dashboard' };

export default function Unauthorized() {
  const { user } = useAuth();
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-4"><div className="max-w-lg text-center"><ShieldX className="mx-auto text-red-500" size={56} /><p className="mt-5 text-6xl font-extrabold">403</p><h1 className="mt-3 text-2xl font-bold">Access Denied</h1><p className="mt-3 text-slate-500">You do not have permission to access this page.</p><Link className="mt-7 inline-block" to={dashboards[user?.role] || '/'}><Button>Go to Dashboard</Button></Link></div></main>;
}
