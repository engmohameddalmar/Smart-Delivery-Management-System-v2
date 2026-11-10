export default function Button({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const styles = { primary: 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700', secondary: 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50', dark: 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800', danger: 'border-red-600 bg-red-600 text-white hover:bg-red-700', ghost: 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100' };
  return <button type={type} className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-60 ${styles[variant] || styles.primary} ${className}`} {...props}>{children}</button>;
}
