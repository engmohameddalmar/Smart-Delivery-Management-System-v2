import { useEffect, useState } from 'react';

import Button from '../../components/common/Button.jsx';
import Card from '../../components/common/Card.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import Loading from '../../components/common/Loading.jsx';

import api from '../../services/api.js';

export default function ActivityLogs() {
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entityType: '',
    date: '',
  });

  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);

    api
      .get('/activity-logs', {
        params: {
          ...filters,
          page,
          limit: 20,
        },
      })
      .then((r) => setData(r.data))
      .catch((e) =>
        setError(
          e.response?.data?.message ||
            'Unable to load activity logs.'
        )
      );
  }, [filters, page]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold">
        Activity Logs
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Security and administrative change history.
      </p>

      <Card className="mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['search', 'Search description'],
          ['action', 'Action'],
          ['entityType', 'Entity type'],
        ].map(([key, label]) => (
          <input
            key={key}
            value={filters[key]}
            onChange={(e) => {
              setFilters({
                ...filters,
                [key]: e.target.value,
              });
              setPage(1);
            }}
            placeholder={label}
            className="rounded-lg border px-3 py-2 text-sm"
          />
        ))}

        <input
          type="date"
          value={filters.date}
          onChange={(e) => {
            setFilters({
              ...filters,
              date: e.target.value,
            });
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        />
      </Card>

      {error ? (
        <div className="mt-6">
          <ErrorState message={error} />
        </div>
      ) : !data ? (
        <Loading label="Loading activity logs…" />
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  {[
                    'Date',
                    'User',
                    'Action',
                    'Entity',
                    'Description',
                  ].map((x) => (
                    <th
                      key={x}
                      className="px-4 py-3"
                    >
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.data.map((log) => (
                  <tr
                    className="border-t"
                    key={log._id}
                  >
                    <td className="px-4 py-4">
                      {new Date(
                        log.createdAt
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 font-semibold">
                      {log.user?.name || 'Former user'}
                    </td>

                    <td className="px-4">
                      {log.action}
                    </td>

                    <td className="px-4">
                      {log.entityType}
                    </td>

                    <td className="px-4">
                      {log.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!data.data.length && (
            <p className="p-8 text-center text-sm text-slate-500">
              No activity logs found.
            </p>
          )}

          <div className="flex justify-between border-t p-4 text-sm">
            <span>
              {data.pagination.total} records
            </span>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>

              <Button
                variant="secondary"
                disabled={
                  page >= data.pagination.pages
                }
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
