import { useEffect, useState } from 'react';
import { MemberPortalLayout } from '../components/layout/MemberPortalLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { memberPortalApi } from '../features/member-portal/api';
import type { PortalMember, PortalDebts, PortalCharge, PortalLoan } from '../features/member-portal/types';

const MONTH_NAMES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

export function MemberPortalPage() {
  const [member, setMember] = useState<PortalMember | null>(null);
  const [debts, setDebts] = useState<PortalDebts | null>(null);
  const [recentCharges, setRecentCharges] = useState<PortalCharge[]>([]);
  const [recentLoans, setRecentLoans] = useState<PortalLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError('');
      const [memberData, debtsData, chargesData, loansData] =
        await Promise.all([
          memberPortalApi.getMe(),
          memberPortalApi.getDebts(),
          memberPortalApi.getCharges(),
          memberPortalApi.getLoans(),
        ]);
      setMember(memberData);
      setDebts(debtsData);
      setRecentCharges(chargesData.slice(0, 6));
      setRecentLoans(loansData.slice(0, 5));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <MemberPortalLayout>
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      </MemberPortalLayout>
    );
  }

  if (error) {
    return (
      <MemberPortalLayout>
        <Alert variant="error">{error}</Alert>
      </MemberPortalLayout>
    );
  }

  if (!member) return null;

  const chargeStatusLabel: Record<string, string> = {
    PENDING: 'Pendente',
    PAID: 'Pago',
    OVERDUE: 'Em atraso',
    PARTIAL: 'Parcial',
    CANCELED: 'Cancelado',
  };

  const loanStatusLabel: Record<string, string> = {
    OPEN: 'Em aberto',
    PARTIAL: 'Parcial',
    PAID: 'Pago',
    CANCELED: 'Cancelado',
  };

  return (
    <MemberPortalLayout>
      <div className="space-y-8">
        {/* Header do cotista */}
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Bem-vindo
            </p>
            <h2 className="text-2xl font-extrabold text-slate-950">
              {member.name}
            </h2>
            <p className="text-sm text-slate-500">
              {member.cashGroup.name} · Ano {member.cashGroup.cycleYear} ·{' '}
              {member.quotasCount}{' '}
              {member.quotasCount === 1 ? 'cota' : 'cotas'} · Vencimento dia{' '}
              {member.cashGroup.dueDay}
            </p>
          </div>
        </div>

        {/* Resumo de pendências */}
        {debts && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              tone={
                parseFloat(debts.summary.totalDebt) > 0 ? 'danger' : 'success'
              }
              value={`R$ ${debts.summary.totalDebt}`}
              label="Total em aberto"
            />
            <StatCard
              tone={debts.summary.pendingChargesCount > 0 ? 'warning' : 'success'}
              value={debts.summary.pendingChargesCount}
              label="Cobranças pendentes"
            />
            <StatCard
              tone={debts.summary.pendingLoansCount > 0 ? 'warning' : 'success'}
              value={debts.summary.pendingLoansCount}
              label="Empréstimos em aberto"
            />
          </div>
        )}

        {/* Cobranças recentes */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Minhas cobranças
          </h3>
          {recentCharges.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma cobrança encontrada.</p>
          ) : (
            <div className="cc-table-shell overflow-x-auto">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th className="cc-th">Referência</th>
                    <th className="cc-th text-right">Valor</th>
                    <th className="cc-th text-right">Pago</th>
                    <th className="cc-th text-center">Status</th>
                    <th className="cc-th">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCharges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-slate-50/60">
                      <td className="cc-td font-semibold">
                        {MONTH_NAMES[charge.referenceMonth]}/{charge.referenceYear}
                      </td>
                      <td className="cc-td text-right">
                        R$ {parseFloat(charge.amountDue).toFixed(2)}
                      </td>
                      <td className="cc-td text-right">
                        R$ {parseFloat(charge.amountPaid).toFixed(2)}
                      </td>
                      <td className="cc-td text-center">
                        <Badge
                          status={
                            charge.status === 'PAID'
                              ? 'ACTIVE'
                              : charge.status === 'OVERDUE'
                                ? 'BLOCKED'
                                : 'INACTIVE'
                          }
                        >
                          {chargeStatusLabel[charge.status] ?? charge.status}
                        </Badge>
                      </td>
                      <td className="cc-td text-sm text-slate-500">
                        {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Empréstimos */}
        {recentLoans.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Meus empréstimos
            </h3>
            <div className="cc-table-shell overflow-x-auto">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th className="cc-th">Data</th>
                    <th className="cc-th text-right">Principal</th>
                    <th className="cc-th text-right">Total</th>
                    <th className="cc-th text-right">Pago</th>
                    <th className="cc-th text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/60">
                      <td className="cc-td text-sm text-slate-500">
                        {new Date(loan.grantedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="cc-td text-right">
                        R$ {parseFloat(loan.principalAmount).toFixed(2)}
                      </td>
                      <td className="cc-td text-right">
                        R$ {parseFloat(loan.totalDue).toFixed(2)}
                      </td>
                      <td className="cc-td text-right">
                        R$ {parseFloat(loan.amountPaid).toFixed(2)}
                      </td>
                      <td className="cc-td text-center">
                        <Badge
                          status={
                            loan.status === 'PAID'
                              ? 'ACTIVE'
                              : loan.status === 'OPEN' || loan.status === 'PARTIAL'
                                ? 'BLOCKED'
                                : 'INACTIVE'
                          }
                        >
                          {loanStatusLabel[loan.status] ?? loan.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Caixinha */}
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm">
          <h3 className="mb-3 text-lg font-bold text-slate-900">
            Minha caixinha
          </h3>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Caixinha
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {member.cashGroup.name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ano
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {member.cashGroup.cycleYear}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Valor da cota
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                R$ {parseFloat(member.cashGroup.quotaValue).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Minhas cotas
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {member.quotasCount}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </MemberPortalLayout>
  );
}
