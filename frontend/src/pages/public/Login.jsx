import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Input from '../../components/common/Input.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import AuthShell from './AuthShell.jsx';

const dashboards = { admin: '/admin/dashboard', business: '/business/dashboard', driver: '/driver/dashboard', customer: '/customer/dashboard' };

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  if (!loading && isAuthenticated) return <Navigate to={dashboards[user.role]} replace/>;

  const submit = async event => {
    event.preventDefault(); setError('');
    if (!form.email.trim() || !form.password) { setError('Email and password are required.'); return; }
    setSubmitting(true);
    try {
      const loggedIn = await login({ email: form.email.trim(), password: form.password });
      const destination = dashboards[loggedIn.role];
      if (!destination) throw new Error('This account has an unsupported role.');
      navigate(destination, { replace: true });
    } catch (requestError) {
      if (!requestError.response) setError('Cannot connect to the server. Start the backend and try again.');
      else setError(requestError.response.data?.message || requestError.message || 'Unable to sign in. Please try again.');
    } finally { setSubmitting(false); }
  };

  return <AuthShell title="Welcome Back" description="Sign in to your Smart Delivery account." footer={<>Need access? Contact your business admin.</>}>
    <form onSubmit={submit} className="space-y-5">
      {error && <ErrorState message={error}/>} 
      <Input id="email" label="Email" type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} autoComplete="email" placeholder="you@example.com"/>
      <Input id="password" label="Password" type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} autoComplete="current-password" placeholder="••••••••"/>
      <div className="flex items-center justify-between gap-3"><label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="rounded border-slate-300 text-blue-600"/>Remember me</label><Link className="text-sm font-semibold text-blue-600" to="/forgot-password">Forgot password?</Link></div>
      <Button disabled={submitting} type="submit" className="w-full">{submitting ? 'Signing in...' : 'Login'}</Button>
    </form>
  </AuthShell>;
}
