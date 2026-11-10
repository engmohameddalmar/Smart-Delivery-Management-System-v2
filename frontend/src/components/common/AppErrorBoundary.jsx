import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { if (import.meta.env.DEV) console.error('Application render error', error); }
  render() { if (this.state.failed) return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm"><h1 className="text-2xl font-extrabold">Unable to display this page</h1><p className="mt-3 text-sm leading-6 text-slate-500">An unexpected display error occurred. Your data has not been changed.</p><button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Reload Page</button></div></main>; return this.props.children; }
}
