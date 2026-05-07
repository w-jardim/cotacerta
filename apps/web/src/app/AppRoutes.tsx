import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CashGroupsPage } from '../pages/CashGroupsPage';
import { MembersPage } from '../pages/MembersPage';
import { MembersListPage } from '../pages/MembersListPage';
import { ChargesPage } from '../pages/ChargesPage';
import { ChargesListPage } from '../pages/ChargesListPage';
import { LoansPage } from '../pages/LoansPage';
import { LoansListPage } from '../pages/LoansListPage';
import { DebtorsPage } from '../pages/DebtorsPage';
import { MemberPortalPage } from '../pages/MemberPortalPage';
import { AnnualClosingPage } from '../pages/AnnualClosingPage';
import { GestorRoute } from '../features/auth/GestorRoute';
import { CotistaRoute } from '../features/auth/CotistaRoute';
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />
        <Route path="/dashboard" element={<GestorRoute><DashboardPage /></GestorRoute>} />
        <Route path="/caixinhas" element={<GestorRoute><CashGroupsPage /></GestorRoute>} />
        <Route path="/cotistas" element={<GestorRoute><MembersListPage /></GestorRoute>} />
        <Route path="/cobrancas" element={<GestorRoute><ChargesListPage /></GestorRoute>} />
        <Route path="/emprestimos" element={<GestorRoute><LoansListPage /></GestorRoute>} />
        <Route path="/quem-deve" element={<GestorRoute><DebtorsPage /></GestorRoute>} />
        <Route path="/caixinhas/:cashGroupId/cotistas" element={<GestorRoute><MembersPage /></GestorRoute>} />
        <Route path="/caixinhas/:id/cobrancas" element={<GestorRoute><ChargesPage /></GestorRoute>} />
        <Route path="/caixinhas/:cashGroupId/emprestimos" element={<GestorRoute><LoansPage /></GestorRoute>} />
        <Route path="/caixinhas/:id/fechamento" element={<GestorRoute><AnnualClosingPage /></GestorRoute>} />
        <Route path="/meu-painel" element={<CotistaRoute><MemberPortalPage /></CotistaRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
