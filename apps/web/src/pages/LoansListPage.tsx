import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { loansApi } from '../features/loans/api';
import type { Loan, LoanStatus, LoansSummary } from '../features/loans/types';

const STATUS_LABELS: Record<LoanStatus, string> = {
  OPEN: 'Aberto',
  PARTIAL: 'Parcial',
  PAID: 'Quitado',
  CANCELED: 'Cancelado',
};

export function LoansListPage() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoansSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | LoanStatus>('ALL');

  useEffect(() => {
    loadLoans();
  }, [statusFilter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await loansApi.getAllUserLoans(statusFilter === 'ALL' ? undefined : statusFilter);
      setLoans(data.items);
      setSummary(data.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar empréstimos');
    } finally {
      setLoading(false);
    }
  };

  const groupedLoans = loans.reduce(
    (acc, loan) => {
      const cashGroupId = loan.cashGroup?.id || loan.cashGroupId;
      if (!acc[cashGroupId]) {
        acc[cashGroupId] = {
          cashGroup: loan.cashGroup,
          loans: [],
        };
      }
      acc[cashGroupId].loans.push(loan);
      return acc;
    },
    {} as Record<string, { cashGroup?: Loan['cashGroup']; loans: Loan[] }>,
  );

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));

  const formatDate = (value: string | null) =>
    value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value)) : 'Sem vencimento';

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="cc-section-head">
          <PageHeader
            title="Empréstimos"
            subtitle="Acompanhe operações por caixinha, saldo em aberto e juros previstos sem misturar com mensalidades."
            backTo="/dashboard"
            backLabel="Voltar ao dashboard"
          />
          <div className="w-full md:w-64">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'ALL' | LoanStatus)}
            >
              <option value="ALL">Todos</option>
              <option value="OPEN">Abertos</option>
              <option value="PARTIAL">Parciais</option>
              <option value="PAID">Quitados</option>
              <option value="CANCELED">Cancelados</option>
            </Select>
          </div>
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-6">
              <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(summary.totalPrincipal)}</p>
              <p className="mt-2 text-sm text-slate-600">Total emprestado</p>
            </Card>
            <Card className="p-6">
              <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(summary.totalDue)}</p>
              <p className="mt-2 text-sm text-slate-600">Total previsto</p>
            </Card>
            <Card className="p-6">
              <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(summary.totalPaid)}</p>
              <p className="mt-2 text-sm text-slate-600">Total recebido</p>
            </Card>
            <Card className="p-6">
              <p className="text-3xl font-extrabold text-slate-950">{formatCurrency(summary.totalOpen)}</p>
              <p className="mt-2 text-sm text-slate-600">Saldo em aberto</p>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        )}

        {!loading && loans.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">EP</span>}
            title="Nenhum empréstimo registrado"
            description="Quando uma caixinha começar a operar empréstimos, eles aparecem aqui agrupados por grupo."
            action={<Button onClick={() => navigate('/caixinhas')}>Abrir caixinhas</Button>}
          />
        )}

        {!loading && loans.length > 0 && (
          <div className="space-y-6">
            {Object.entries(groupedLoans).map(([groupId, group]) => (
              <Card key={groupId} className="overflow-hidden p-0">
                <div className="cc-section-head border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{group.cashGroup?.name || 'Caixinha'}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {group.loans.length} empréstimo(s) • Ciclo {group.cashGroup?.cycleYear}
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/caixinhas/${groupId}/emprestimos`)}>
                    Gerenciar grupo
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th className="cc-th">Cotista</th>
                        <th className="cc-th">Principal</th>
                        <th className="cc-th">Juros</th>
                        <th className="cc-th">Total previsto</th>
                        <th className="cc-th">Saldo</th>
                        <th className="cc-th">Vencimento</th>
                        <th className="cc-th">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-slate-50/60">
                          <td className="cc-td">
                            <div className="font-semibold text-slate-900">{loan.member?.name}</div>
                            {loan.member?.phone && <div className="mt-1 text-xs text-slate-500">{loan.member.phone}</div>}
                          </td>
                          <td className="cc-td">{formatCurrency(loan.principalAmount)}</td>
                          <td className="cc-td">{parseFloat(loan.interestRate).toFixed(2)}%</td>
                          <td className="cc-td">{formatCurrency(loan.totalDue)}</td>
                          <td className="cc-td">{formatCurrency(loan.remainingAmount)}</td>
                          <td className="cc-td">{formatDate(loan.dueDate)}</td>
                          <td className="cc-td">
                            <Badge status={loan.status}>{STATUS_LABELS[loan.status]}</Badge>
                          </td>
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
