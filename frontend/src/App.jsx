import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import IssueStock from './pages/IssueStock';
import Indents from './pages/Indents';
import PurchaseOrders from './pages/PurchaseOrders';
import WriteOffs from './pages/WriteOffs';
import Reports from './pages/Reports';
import Audit from './pages/Audit';
import Directory from './pages/Directory';
import Forms from './pages/Forms';
import Help from './pages/Help';
import { getCurrentUser } from './api';

// Simple Role Guard helper
function RoleGuard({ allowedRoles, children }) {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin' && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes wrapped in university sidebar layout */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="items" element={<Items />} />

            {/* Role-gated routes */}
            <Route
              path="issue-stock"
              element={
                <RoleGuard allowedRoles={['store']}>
                  <IssueStock />
                </RoleGuard>
              }
            />

            <Route path="indents" element={<Indents />} />

            <Route
              path="purchase-orders"
              element={
                <RoleGuard allowedRoles={['store', 'approver']}>
                  <PurchaseOrders />
                </RoleGuard>
              }
            />

            <Route
              path="write-offs"
              element={
                <RoleGuard allowedRoles={['store', 'approver']}>
                  <WriteOffs />
                </RoleGuard>
              }
            />

            <Route path="reports" element={<Reports />} />

            <Route
              path="audit"
              element={
                <RoleGuard allowedRoles={['approver']}>
                  <Audit />
                </RoleGuard>
              }
            />

            {/* University Resource & Help routes */}
            <Route path="directory" element={<Directory />} />
            <Route path="forms" element={<Forms />} />
            <Route path="help" element={<Help />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
