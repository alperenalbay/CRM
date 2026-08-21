import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import Dashboard from '@/features/dashboard/Dashboard'
import Customers from '@/features/customers/Customers'
import Tickets from '@/features/tickets/Tickets'
import Tasks from '@/features/tasks/Tasks'
import Sales from '@/features/sales/Sales'
import ImportData from '@/features/import/ImportData'
import Users from '@/features/users/UsersPage'
import Login from '@/features/auth/Login'

function RequireAuth() {
  const location = useLocation()
  if (!localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <MainLayout />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="customers" element={<Customers />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="sales" element={<Sales />} />
        <Route path="import" element={<ImportData />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  )
}

export default App
