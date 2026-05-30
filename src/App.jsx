import { Routes, Route, Navigate } from 'react-router-dom'
import StorePage from './pages/StorePage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import OrderPage from './pages/OrderPage.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/checkout/:productId" element={<CheckoutPage />} />
      <Route path="/order/:orderId" element={<OrderPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
