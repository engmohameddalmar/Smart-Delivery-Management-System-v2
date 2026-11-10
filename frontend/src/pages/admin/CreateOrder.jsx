import { Link } from 'react-router-dom';
import Card from '../../components/common/Card.jsx';

export default function CreateOrder() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Create Order</h1>
      <p className="page-subtitle">Admin does not create delivery orders in this workflow.</p>
      <Card className="mt-6 p-6">
        <p className="text-sm text-slate-600">
          Delivery orders are created by the business account after the customer is added. If you need to create an order, go to the
          business portal.
        </p>
        <div className="mt-4">
          <Link to="/admin/businesses" className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
            Manage Businesses
          </Link>
        </div>
      </Card>
    </div>
  );
}
