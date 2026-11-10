import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';
import Button from '../../components/common/Button.jsx';

export default function CreateOrder() {
  return <Card className="p-8 text-center">
    <h1 className="text-2xl font-bold">Create Order</h1>
    <p className="mt-3 text-slate-600">Customer order creation is disabled in this setup. Your business must create delivery orders for you.</p>
    <div className="mt-6 flex justify-center gap-3">
      <Link to="/customer/orders"><Button>View Orders</Button></Link>
      <Link to="/customer/dashboard"><Button variant="secondary">Go to Dashboard</Button></Link>
    </div>
  </Card>;
}
