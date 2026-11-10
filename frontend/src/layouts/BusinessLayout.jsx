import { Bell, CreditCard, History, LayoutDashboard, Package, PackagePlus, Truck, User, Users } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSystemSummary from '../components/dashboard/RoleSystemSummary.jsx';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import Topbar from '../components/dashboard/Topbar.jsx';

const items = [
  ['Dashboard', LayoutDashboard, '/business/dashboard'],
  ['Orders', Package, '/business/orders'],
  ['Create Order', PackagePlus, '/business/orders/create'],
  ['Deliveries', Truck, '/business/deliveries'],
  ['Customers', Users, '/business/customers'],
  ['Payments', CreditCard, '/business/payments'],
  ['History', History, '/business/history'],
  ['Notifications', Bell, '/notifications'],
  ['Profile', User, '/profile'],
].map(([label, icon, to]) => ({ label, icon, to, enabled: true }));

export default function BusinessLayout() {
  const [open, setOpen] = useState(false);
  return <div><Sidebar items={items} open={open} onClose={() => setOpen(false)} /><div className="min-h-screen lg:pl-64"><Topbar title="Business Portal" onMenu={() => setOpen(true)} /><RoleSystemSummary role="business" /><main className="p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>;
}
