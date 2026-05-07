import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { chargesApi } from '../features/charges/api';
import type { MonthlyCharge } from '../features/charges/types';

export function ChargesListPage() {
  const navigate = useNavigate();
  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCharges();
  }, []);

  const loadCharges = async () => {
    try {
      setLoading(true);
      const data = await chargesApi.getAllUserCharges();
      setCharges(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar cobranças');
    } finally {
      setLoading(false);
    }
  };

  const chargesByCashGroup = charges.reduce((acc, charge) => {
    const groupId = charge.cashGroupId;
    if (!acc[groupId]) {
      acc[groupId] = {
        cashGroup: charge.cashGroup,
        charges: [],
      };
    }
    acc[groupId].charges.push(charge);
    return acc;
  }, {} as Record<string, { cashGroup: any; charges: MonthlyCharge[] }>);

  const cashGroups = Object.values(chargesByCashGroup);
  const totalCharges = charges.length;
  const totalDue = charges.reduce((sum, charge) => sum + parseFloat(charge.amountDue), 0);
  const totalPending = charges.reduce(
    (sum, charge) => sum + (parseFloat(charge.amountDue) - parseFloat(charge.amountPaid)),
    0,
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(dateString));

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      PARTIAL: 'Parcial',
      OVERDUE: 'Atrasado',
      CANCELED: 'Cancelado',
    };

    return <Badge status={status}>{labels[status] || status}</Badge>;
  };

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[month - 1];
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <PageHeader
          title="Cobranças abertas"
          subtitle="Visualize cobranças agrupadas por caixinha e entre direto no fluxo operacional de cada grupo."
          backTo="/dashboard"
          backLabel="Voltar ao dashboard"
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-3xl font-extrabold text-slate-950">{totalCharges}</p>
            <p className="mt-2 text-sm text-slate-600">Total de cobranças</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(totalDue)}</p>
            <p className="mt-2 text-sm text-slate-600">Valor total</p>
          </Card>
          <Card className="p-6">
            <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(totalPending)}</p>
            <p className="mt-2 text-sm text-slate-600">Pendente</p>
          </Card>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        )}

        {!loading && charges.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">CB</span>}
            title="Nenhuma cobrança aberta encontrada"
            description="Todas as cobranças estão pagas ou ainda não houve geração para os grupos ativos."
          />
        )}

        {!loading && charges.length > 0 && (
          <div className="space-y-6">
            {cashGroups.map(({ cashGroup, charges: groupCharges }) => (
              <Card key={cashGroup?.id} className="overflow-hidden p-0">
                <div className="cc-section-head border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{cashGroup?.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {groupCharges.length} cobrança(s) • Ciclo {cashGroup?.cycleYear}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/caixinhas/${cashGroup?.id}/cobrancas`)}>
                    Gerenciar grupo
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th className="cc-th">Cotista</th>
                        <th className="cc-th">Período</th>
                        <th className="cc-th">Vencimento</th>
                        <th className="cc-th">Cotas</th>
                        <th className="cc-th">Valor</th>
                        <th className="cc-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupCharges.map((charge) => (
                        <tr key={charge.id} className="hover:bg-slate-50/60">
                          <td className="cc-td">
                            <div className="font-semibold text-slate-900">{charge.member?.name}</div>
                            {charge.member?.phone && (
                              <div className="mt-1 text-xs text-slate-500">{charge.member.phone}</div>
                            )}
                          </td>
                          <td className="cc-td">{getMonthName(charge.referenceMonth)}/{charge.referenceYear}</td>
                          <td className="cc-td">{formatDate(charge.dueDate)}</td>
                          <td className="cc-td">{charge.quotasCount}</td>
                          <td className="cc-td">
                            <div className="font-semibold text-slate-900">{formatCurrency(parseFloat(charge.amountDue))}</div>
                            {parseFloat(charge.amountDue) > parseFloat(charge.baseAmount) && (
                              <div className="mt-1 text-xs text-amber-700">
                                Base: {formatCurrency(parseFloat(charge.baseAmount))}
                              </div>
                            )}
                            {parseFloat(charge.amountPaid) > 0 && (
                              <div className="mt-1 text-xs text-emerald-700">
                                Pago: {formatCurrency(parseFloat(charge.amountPaid))}
                              </div>
                            )}
                          </td>
                          <td className="cc-td">{getStatusBadge(charge.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
