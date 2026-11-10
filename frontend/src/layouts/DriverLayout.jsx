import { Bell, History, LayoutDashboard, Truck, User } from 'lucide-react'; import { useState } from 'react'; import { Outlet } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar.jsx'; import Topbar from '../components/dashboard/Topbar.jsx';
import RoleSystemSummary from '../components/dashboard/RoleSystemSummary.jsx';
const items=[['Dashboard',LayoutDashboard,true,'/driver/dashboard'],['My Deliveries',Truck,true,'/driver/deliveries'],['History',History,true,'/driver/history'],['Notifications',Bell,true,'/notifications'],['Profile',User,true,'/profile']].map(([label,icon,enabled,to])=>({label,icon,enabled,to}));
export default function DriverLayout(){const [open,setOpen]=useState(false);return <div><Sidebar items={items} open={open} onClose={()=>setOpen(false)}/><div className="min-h-screen lg:pl-64"><Topbar title="Driver Portal" onMenu={()=>setOpen(true)}/><RoleSystemSummary role="driver"/><main className="p-4 sm:p-6 lg:p-8"><Outlet/></main></div></div>}
