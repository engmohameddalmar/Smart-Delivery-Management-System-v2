import AccountDetails from '../../components/admin/AccountDetails.jsx';

export default function CustomerDetails() {
  return (
    <AccountDetails
      kind="customer"
      allowDelete={false}
      futureStats={[
        ['Total Orders', 0],
        ['Completed Orders', 0],
        ['Pending Orders', 0],
        ['Total Spent', '$0'],
      ]}
    />
  );
}
