import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import Card from '../common/Card.jsx';

export default function RoleSystemSummary({ role }) {
  const { user } = useAuth();
  const location = useLocation();
  const [data, setData] = useState(null);
  const dashboard = `/${role}/dashboard`;
  useEffect(() => {
    if (location.pathname !== dashboard) return;
    const request = role === 'admin'
      ? Promise.all([api.get('/admin/dashboard/stats'), api.get('/users', { params: { role: 'driver', status: 'active', availability: 'available', limit: 1 } }), api.get('/settings')]).then(([users, drivers, settings]) => ({ users: users.data.data, availableDrivers: drivers.data.pagination.total, settings: settings.data.data }))
      : api.get('/settings/public').then(r => ({ settings: r.data.data }));
    request.then(setData).catch(() => {});
  }, [location.pathname, role]);
  if (location.pathname !== dashboard || !data) return null;
  if (role === 'admin') return <Wrap><Summary label="Active Users" value={data.users.activeUsers} /><Summary label="Businesses" value={data.users.totalBusinesses || 0} /><Summary label="Available Drivers" value={data.availableDrivers} /><Summary label="System Status" value={data.settings.maintenanceMode ? 'Maintenance' : 'Operational'} detail={`Registration ${data.settings.allowCustomerRegistration ? 'on' : 'off'} · Orders ${data.settings.allowCustomerOrderCreation ? 'on' : 'off'}`} /></Wrap>;
  if (role === 'customer') {
    const complete = [user.name, user.phone, user.address, user.avatar].filter(Boolean).length;
    return <Wrap><Summary label="Profile Completion" value={`${complete * 25}%`} /><Summary label="Account Status" value={user.status} /><Summary label="Payment Methods" value={data.settings.enabledPaymentMethods?.join(', ') || 'None'} /><Summary label="Support" value={data.settings.supportPhone || data.settings.supportEmail || 'Contact support'} /></Wrap>;
  }
  if (role === 'business') return <Wrap><Summary label="Account Status" value={user.status} /><Summary label="Portal" value="Business" /><Summary label="Payment Methods" value={data.settings.enabledPaymentMethods?.join(', ') || 'None'} /><Summary label="Support" value={data.settings.supportPhone || data.settings.supportEmail || 'Contact support'} /></Wrap>;
  return <Wrap><Summary label="Account Status" value={user.status} /><Summary label="Availability" value={user.isAvailable} /><Summary label="Current Delivery" value={user.currentDelivery ? 'Active' : 'None'} /><Summary label="Support" value={data.settings.supportPhone || data.settings.supportEmail || 'Contact support'} /></Wrap>;
}

function Wrap({ children }) { return <div className="grid gap-3 px-4 pt-5 sm:grid-cols-2 lg:px-8 xl:grid-cols-4">{children}</div>; }
function Summary({ label, value, detail }) { return <Card className="p-4"><p className="text-xs font-semibold uppercase text-slate-400">{label}</p><p className="mt-1 truncate text-lg font-bold capitalize" title={value}>{value}</p>{detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}</Card>; }
