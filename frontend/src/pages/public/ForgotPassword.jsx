import { Link } from 'react-router-dom';
import Button from '../../components/common/Button.jsx';
import AuthShell from './AuthShell.jsx';

export default function ForgotPassword() {
  return (
    <AuthShell title="Password recovery" description="Automated password-reset email is not configured for this deployment.">
      <div className="space-y-5">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
          Contact your system administrator to verify your identity and reset your password securely.
        </p>
        <Link to="/login" className="block"><Button className="w-full">Return to Login</Button></Link>
      </div>
    </AuthShell>
  );
}
