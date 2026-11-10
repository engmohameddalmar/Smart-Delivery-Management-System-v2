import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import BusinessLayout from './layouts/BusinessLayout.jsx';
import CustomerLayout from './layouts/CustomerLayout.jsx';
import DriverLayout from './layouts/DriverLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import ActivityLogs from './pages/admin/ActivityLogs.jsx';
import AdminBusinessDetails from './pages/admin/BusinessDetails.jsx';
import AdminBusinesses from './pages/admin/Businesses.jsx';
import CustomerAnalytics from './pages/admin/CustomerAnalytics.jsx';
import CustomerDetails from './pages/admin/CustomerDetails.jsx';
import Customers from './pages/admin/Customers.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminDeliveries from './pages/admin/Deliveries.jsx';
import AdminDeliveryDetails from './pages/admin/DeliveryDetails.jsx';
import DeliveryAnalytics from './pages/admin/DeliveryAnalytics.jsx';
import DriverDetails from './pages/admin/DriverDetails.jsx';
import DriverPerformance from './pages/admin/DriverPerformance.jsx';
import Drivers from './pages/admin/Drivers.jsx';
import EditOrder from './pages/admin/EditOrder.jsx';
import EditUser from './pages/admin/EditUser.jsx';
import CreateAdminOrder from './pages/admin/CreateOrder.jsx';
import AdminOrderDetails from './pages/admin/OrderDetails.jsx';
import AdminOrders from './pages/admin/Orders.jsx';
import AdminPaymentDetails from './pages/admin/PaymentDetails.jsx';
import PaymentAnalytics from './pages/admin/PaymentAnalytics.jsx';
import AdminPayments from './pages/admin/Payments.jsx';
import Reports from './pages/admin/Reports.jsx';
import AdminSettings from './pages/admin/Settings.jsx';
import UserDetails from './pages/admin/UserDetails.jsx';
import Users from './pages/admin/Users.jsx';
import BusinessCreateOrder from './pages/business/CreateOrder.jsx';
import BusinessDashboard from './pages/business/Dashboard.jsx';
import BusinessDeliveries from './pages/business/Deliveries.jsx';
import BusinessCustomers from './pages/business/Customers.jsx';
import BusinessOrderDetails from './pages/business/OrderDetails.jsx';
import BusinessOrders from './pages/business/Orders.jsx';
import BusinessPaymentDetails from './pages/business/PaymentDetails.jsx';
import BusinessPayments from './pages/business/Payments.jsx';
import CustomerDashboard from './pages/customer/Dashboard.jsx';
import CustomerOrderDetails from './pages/customer/OrderDetails.jsx';
import CustomerOrders from './pages/customer/Orders.jsx';
import CustomerPaymentDetails from './pages/customer/PaymentDetails.jsx';
import CustomerPayments from './pages/customer/Payments.jsx';
import DriverDashboard from './pages/driver/Dashboard.jsx';
import DriverDeliveryDetails from './pages/driver/DeliveryDetails.jsx';
import DeliveryHistory from './pages/driver/DeliveryHistory.jsx';
import MyDeliveries from './pages/driver/MyDeliveries.jsx';
import NotFound from './pages/NotFound.jsx';
import Notifications from './pages/Notifications.jsx';
import Profile from './pages/Profile.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import About from './pages/public/About.jsx';
import Contact from './pages/public/Contact.jsx';
import ForgotPassword from './pages/public/ForgotPassword.jsx';
import Home from './pages/public/Home.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import Services from './pages/public/Services.jsx';
import TrackDelivery from './pages/public/TrackDelivery.jsx';

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/track" element={<TrackDelivery />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
    </Route>
    <Route path="/unauthorized" element={<ProtectedRoute><Unauthorized /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><Standalone><Notifications /></Standalone></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Standalone><Profile /></Standalone></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<AdminDashboard />} />
      <Route path="users" element={<Users />} />
      <Route path="users/:id" element={<UserDetails />} />
      <Route path="users/:id/edit" element={<EditUser />} />
      <Route path="businesses" element={<AdminBusinesses />} />
      <Route path="businesses/:id" element={<AdminBusinessDetails />} />
      <Route path="drivers" element={<Drivers />} />
      <Route path="drivers/:id" element={<DriverDetails />} />
      <Route path="customers" element={<Customers />} />
      <Route path="customers/:id" element={<CustomerDetails />} />
      <Route path="orders" element={<AdminOrders />} />
      <Route path="orders/create" element={<CreateAdminOrder />} />
      <Route path="orders/:id" element={<AdminOrderDetails />} />
      <Route path="orders/:id/edit" element={<EditOrder />} />
      <Route path="deliveries" element={<AdminDeliveries />} />
      <Route path="deliveries/:id" element={<AdminDeliveryDetails />} />
      <Route path="payments" element={<AdminPayments />} />
      <Route path="payments/:id" element={<AdminPaymentDetails />} />
      <Route path="reports" element={<Reports />} />
      <Route path="driver-performance" element={<DriverPerformance />} />
      <Route path="customer-analytics" element={<CustomerAnalytics />} />
      <Route path="payment-analytics" element={<PaymentAnalytics />} />
      <Route path="delivery-analytics" element={<DeliveryAnalytics />} />
      <Route path="settings" element={<AdminSettings />} />
      <Route path="activity-logs" element={<ActivityLogs />} />
    </Route>
    <Route path="/business" element={<ProtectedRoute roles={['business']}><BusinessLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<BusinessDashboard />} />
      <Route path="orders" element={<BusinessOrders />} />
      <Route path="orders/create" element={<BusinessCreateOrder />} />
      <Route path="orders/:id" element={<BusinessOrderDetails />} />
      <Route path="deliveries" element={<BusinessDeliveries />} />
      <Route path="customers" element={<BusinessCustomers />} />
      <Route path="payments" element={<BusinessPayments />} />
      <Route path="payments/:id" element={<BusinessPaymentDetails />} />
      <Route path="history" element={<BusinessOrders history />} />
    </Route>
    <Route path="/driver" element={<ProtectedRoute roles={['driver']}><DriverLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<DriverDashboard />} />
      <Route path="deliveries" element={<MyDeliveries />} />
      <Route path="deliveries/:id" element={<DriverDeliveryDetails />} />
      <Route path="history" element={<DeliveryHistory />} />
    </Route>
    <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerLayout /></ProtectedRoute>}>
      <Route index element={<Navigate to="dashboard" replace />} />
      <Route path="dashboard" element={<CustomerDashboard />} />
      <Route path="orders" element={<CustomerOrders />} />
      <Route path="orders/:id" element={<CustomerOrderDetails />} />
      <Route path="payments" element={<CustomerPayments />} />
      <Route path="payments/:id" element={<CustomerPaymentDetails />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes>;
}

function Standalone({ children }) {
  return <div className="min-h-screen bg-slate-50 p-4 sm:p-8"><div className="mx-auto max-w-5xl">{children}</div></div>;
}
