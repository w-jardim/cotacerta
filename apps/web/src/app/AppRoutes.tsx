import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CashGroupsPage } from '../pages/CashGroupsPage';
import { MembersPage } from '../pages/MembersPage';
import { MembersListPage } from '../pages/MembersListPage';
import { ChargesPage } from '../pages/ChargesPage';
import { ChargesListPage } from '../pages/ChargesListPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caixinhas"
          element={
            <ProtectedRoute>
              <CashGroupsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cotistas"
          element={
            <ProtectedRoute>
              <MembersListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cobrancas"
          element={
            <ProtectedRoute>
              <ChargesListPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caixinhas/:cashGroupId/cotistas"
          element={
            <ProtectedRoute>
              <MembersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/caixinhas/:id/cobrancas"
          element={
            <ProtectedRoute>
              <ChargesPage />
            </ProtectedRoute>
          }
        />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
