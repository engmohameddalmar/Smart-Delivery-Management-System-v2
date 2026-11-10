import { Bell, Menu, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';

export default function Topbar({ title, onMenu }) {
  const { user } = useAuth();
  const panel = useRef(null);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = async () => {
    try {
      const [countResponse, listResponse] = await Promise.all([
        api.get('/notifications/unread-count'),
        api.get('/notifications', { params: { limit: 5 } }),
      ]);
      setCount(countResponse.data.data.count);
      setNotifications(listResponse.data.data);
    } catch {
      // The topbar remains usable if notifications are temporarily unavailable.
    }
  };

  useEffect(() => {
    loadNotifications();
    const close = event => panel.current && !panel.current.contains(event.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const markRead = async notification => {
    if (!notification.isRead) {
      await api.patch(`/notifications/${notification._id}/read`);
      setCount(value => Math.max(0, value - 1));
      setNotifications(items => items.map(item => item._id === notification._id ? { ...item, isRead: true } : item));
    }
  };

  const initials = user?.name?.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-white px-4 sm:px-6 lg:px-8">
    <button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu /></button>
    <div className="min-w-0 flex-1"><h1 className="truncate text-base font-semibold text-slate-950">{title}</h1><p className="hidden text-xs text-slate-500 sm:block">Welcome back, {user?.name}</p></div>
    <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2 md:flex"><Search size={16} className="text-slate-400"/><input aria-label="Search" className="w-full bg-transparent text-sm outline-none" placeholder="Search records"/></div>
    <div className="relative" ref={panel}>
      <button onClick={() => setOpen(value => !value)} className="relative rounded-lg border p-2 text-slate-600 hover:bg-slate-50" aria-label="Notifications">
        <Bell size={20}/>{count > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-5 text-white">{count > 99 ? '99+' : count}</span>}
      </button>
      {open && <div className="absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b p-4"><p className="font-bold">Notifications</p><span className="text-xs text-slate-500">{count} unread</span></div>
        <div className="max-h-80 divide-y overflow-y-auto">{notifications.map(notification => <button key={notification._id} onClick={() => markRead(notification)} className={`block w-full p-4 text-left hover:bg-slate-50 ${notification.isRead ? '' : 'bg-indigo-50'}`}><p className="text-sm font-semibold">{notification.title}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{notification.message}</p><p className="mt-2 text-[11px] text-slate-400">{new Date(notification.createdAt).toLocaleString()}</p></button>)}{!notifications.length && <p className="p-6 text-center text-sm text-slate-500">No notifications yet.</p>}</div>
        <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t p-3 text-center text-sm font-semibold text-indigo-600 hover:bg-indigo-50">View all notifications</Link>
      </div>}
    </div>
    <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700" title={user?.name}>{initials}</div>
    <div className="hidden min-w-0 sm:block"><p className="max-w-32 truncate text-sm font-medium">{user?.name}</p><p className="text-xs capitalize text-slate-400">{user?.role}</p></div>
  </header>;
}
