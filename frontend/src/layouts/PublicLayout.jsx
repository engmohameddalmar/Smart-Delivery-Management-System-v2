import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from '../components/public/Footer.jsx';
import Navbar from '../components/public/Navbar.jsx';
import { getPublicSettings } from '../services/settingsService.js';

function AvailabilityMessage({ title, message }) {
  return <div className="grid min-h-[65vh] place-items-center p-6 text-center"><div><h1 className="text-3xl font-extrabold">{title}</h1><p className="mt-3 text-slate-500">{message}</p></div></div>;
}

export default function PublicLayout() {
  const [settings, setSettings] = useState(null);
  const location = useLocation();
  useEffect(() => { getPublicSettings().then(setSettings).catch(() => {}); }, []);
  const maintenance = settings?.maintenanceMode && !['/login', '/track'].includes(location.pathname);
  const registrationClosed = settings?.allowCustomerRegistration === false && location.pathname === '/register';
  return <div className="min-h-screen"><Navbar settings={settings} /><main>{maintenance ? <AvailabilityMessage title="System is currently under maintenance." message="Please try again later or contact support." /> : registrationClosed ? <AvailabilityMessage title="Registration is currently unavailable." message="Please contact support or try again later." /> : <Outlet />}</main><Footer settings={settings} /></div>;
}
