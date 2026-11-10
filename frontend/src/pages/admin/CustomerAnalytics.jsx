import { useEffect, useState } from 'react';

import DateRangeFilter from '../../components/analytics/DateRangeFilter.jsx';
import TopCustomersTable from '../../components/analytics/TopCustomersTable.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';
import StatCard from '../../components/dashboard/StatCard.jsx';

import {
  Users,
  UserCheck,
  UserPlus,
} from 'lucide-react';

import {
  getCustomerAnalytics,
} from '../../services/analyticsService.js';

export default function CustomerAnalytics() {
  const [range, setRange] = useState({
    period: '30days',
  });

  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);

    getCustomerAnalytics(range)
      .then(setData)
      .catch((e) =>
        setError(
          e.response?.data?.message ||
            'Unable to load customer analytics.'
        )
      );
  }, [range]);

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold">
            Customer Analytics
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Activity, order frequency, and spending.
          </p>
        </div>

        <DateRangeFilter
          value={range}
          onChange={setRange}
        />
      </div>

      {!data ? (
        <Loading label="Loading customer analytics…" />
      ) : (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              title="Total Customers"
              value={data.totalCustomers}
              icon={Users}
            />

            <StatCard
              title="Active Customers"
              value={data.activeCustomers}
              icon={UserCheck}
            />

            <StatCard
              title="New Customers"
              value={data.newCustomers}
              icon={UserPlus}
            />
          </div>

          <div className="mt-6">
            <TopCustomersTable
              customers={data.topCustomers}
            />
          </div>
        </>
      )}
    </div>
  );
}
