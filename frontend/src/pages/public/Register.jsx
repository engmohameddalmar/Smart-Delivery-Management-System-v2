import { Link } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import Button from '../../components/common/Button.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';

export default function Register() {
  return (
    <AuthShell
      title="Customer registration is closed"
      description="Businesses create customer accounts in this system. Please contact your business admin or sign in if you already have an account."
      footer={<>Already have an account? <Link className="font-semibold text-indigo-600" to="/login">Login</Link></>}
    >
      <ErrorState message="Public sign-up is disabled. Customers are added by a business account." />
      <div className="mt-5 flex gap-3">
        <Link to="/login"><Button>Go to Login</Button></Link>
        <Link to="/"><Button variant="secondary">Home</Button></Link>
      </div>
    </AuthShell>
  );
}
