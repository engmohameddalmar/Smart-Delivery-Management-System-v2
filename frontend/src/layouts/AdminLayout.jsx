import { Activity, BarChart3, Bell, Bike, Building2, CreditCard, LayoutDashboard, Package, Settings, TrendingUp, Truck, User, Users } from 'lucide-react';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import RoleSystemSummary from '../components/dashboard/RoleSystemSummary.jsx';
import Sidebar from '../components/dashboard/Sidebar.jsx';
import Topbar from '../components/dashboard/Topbar.jsx';

const items = [
  ['Dashboard', LayoutDashboard, '/admin/dashboard'],
  ['Users', Users, '/admin/users'],
  ['Businesses', Building2, '/admin/businesses'],
  ['Create Business', Building2, '/admin/businesses'],
  ['Drivers', Bike, '/admin/drivers'],
  ['Customers', Users, '/admin/customers'],
  ['Orders', Package, '/admin/orders'],
  ['Deliveries', Truck, '/admin/deliveries'],
  ['Payments', CreditCard, '/admin/payments'],
  ['Reports', BarChart3, '/admin/reports'],
  ['Driver Analytics', TrendingUp, '/admin/driver-performance'],
  ['Customer Analytics', TrendingUp, '/admin/customer-analytics'],
  ['Payment Analytics', TrendingUp, '/admin/payment-analytics'],
  ['Delivery Analytics', TrendingUp, '/admin/delivery-analytics'],
  ['Activity Logs', Activity, '/admin/activity-logs'],
  ['Notifications', Bell, '/notifications'],
  ['Profile', User, '/profile'],
  ['Settings', Settings, '/admin/settings'],
].map(([label, icon, to]) => ({ label, icon, to, enabled: true }));

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return <div><Sidebar items={items} open={open} onClose={() => setOpen(false)} /><div className="min-h-screen lg:pl-64"><Topbar title="Operations" onMenu={() => setOpen(true)} /><RoleSystemSummary role="admin" /><main className="p-4 sm:p-6 lg:p-8"><Outlet /></main></div></div>;
}
