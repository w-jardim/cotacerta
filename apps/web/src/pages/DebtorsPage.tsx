import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { debtorsApi } from '../features/debtors/api';
import { cashGroupsApi } from '../features/cash-groups/api';
import type { Debtor } from '../features/debtors/types';
import type { CashGroup } from '../features/cash-groups/types';

export function DebtorsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [cashGroups, setCashGroups] = useState<CashGroup[]>([]);
  const [summary, setSummary] = useState({
    membersWithDebt: 0,
    totalMonthlyChargesPending: 0,
    totalLoansPending: 0,
    totalPending: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedMemberId, setCopiedMemberId] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const cashGroupId = searchParams.get('cashGroupId') || '';
  const referenceMonth = Number(searchParams.get('referenceMonth')) || currentMonth;
  const referenceYear = Number(searchParams.get('referenceYear')) || currentYear;

  useEffect(() => {
    async function loadCashGroups() {
      try {
        const groups = await cashGroupsApi.getAll();
        setCashGroups(groups);
      } catch (err) {
        console.error('Erro ao carregar caixinhas', err);
      }
    }
    loadCashGroups();
  }, []);

  useEffect(() => {
    async function loadDebtors() {
      setLoading(true);
      setError('');
      try {
        const data = await debtorsApi.getAllDebtors(
          cashGroupId || undefined,
          referenceMonth,
          referenceYear,
        );
        setDebtors(data.items);
        setSummary(data.summary);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Erro ao carregar devedores');
      } finally {
        setLoading(false);
      }
    }
    loadDebtors();
  }, [cashGroupId, referenceMonth, referenceYear]);

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleCopyMessage = async (debtor: Debtor) => {
    try {
      const message = await debtorsApi.getDebtorMessage(
        debtor.group.id,
        debtor.member.id,
        referenceMonth,
        referenceYear,
      );
      await navigator.clipboard.writeText(message.message);
      setCopiedMemberId(debtor.member.id);
      setTimeout(() => setCopiedMemberId(null), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao gerar mensagem');
    }
  };

  const handleWhatsApp = async (debtor: Debtor) => {
    try {
      const message = await debtorsApi.getDebtorMessage(
        debtor.group.id,
        debtor.member.id,
        referenceMonth,
        referenceYear,
      );
      if (message.whatsappUrl) {
        window.open(message.whatsappUrl, '_blank');
      } else {
        alert('Cotista não possui telefone cadastrado');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao abrir WhatsApp');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const monthOptions = [
    { value: '', label: 'Todos os meses' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: String(i + 1),
      label: new Date(2000, i).toLocaleString('pt-BR', { month: 'long' }),
    })),
  ];

  const yearOptions = [
    ...Array.from({ length: 10 }, (_, i) => ({
      value: String(currentYear - 5 + i),
      label: String(currentYear - 5 + i),
    })),
  ];

  const cashGroupOptions = [
    { value: '', label: 'Todas as caixinhas' },
    ...cashGroups.map((group) => ({
      value: group.id,
      label: `${group.name} (${group.cycleYear})`,
    })),
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <Card className="p-6">
          <PageHeader
            title="Quem Deve"
            subtitle="Visão consolidada de pendências por cotista, separando cotas mensais e empréstimos."
          />
        </Card>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Select
              label="Caixinha"
              value={cashGroupId}
              onChange={(e) => handleFilterChange('cashGroupId', e.target.value)}
            >
              {cashGroupOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="Mês de referência"
              value={String(referenceMonth)}
              onChange={(e) => handleFilterChange('referenceMonth', e.target.value)}
            >
              {monthOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            <Select
              label="Ano de referência"
              value={String(referenceYear)}
              onChange={(e) => handleFilterChange('referenceYear', e.target.value)}
            >
              {yearOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            tone="danger"
            icon={<span className="text-lg font-bold text-rose-700">👥</span>}
            value={summary.membersWithDebt}
            label="Cotistas com pendência"
            footnote="Total de participantes com dívida"
          />
          <StatCard
            tone="warning"
            icon={<span className="text-lg font-bold text-amber-700">📅</span>}
            value={formatCurrency(summary.totalMonthlyChargesPending)}
            label="Cotas em aberto"
            footnote="Pendências de mensalidades"
          />
          <StatCard
            tone="warning"
            icon={<span className="text-lg font-bold text-orange-700">💰</span>}
            value={formatCurrency(summary.totalLoansPending)}
            label="Empréstimos em aberto"
            footnote="Pendências de empréstimos"
          />
          <StatCard
            tone="danger"
            icon={<span className="text-lg font-bold text-red-700">💳</span>}
            value={formatCurrency(summary.totalPending)}
            label="Total pendente"
            footnote="Soma de todas as pendências"
          />
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <p className="text-slate-600">Carregando devedores...</p>
          </Card>
        ) : debtors.length === 0 ? (
          <EmptyState
            title="Ninguém deve nesta caixinha"
            description="Tudo em dia para o período selecionado."
          />
        ) : (
          <div className="space-y-4">
            {debtors.map((debtor) => (
              <Card key={`${debtor.group.id}-${debtor.member.id}`} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">
                        {debtor.member.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Caixinha: {debtor.group.name} ({debtor.group.cycleYear})
                      </p>
                      {debtor.member.phone && (
                        <p className="text-sm text-slate-500">
                          Telefone: {debtor.member.phone}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-rose-600">
                        {formatCurrency(debtor.totalPending)}
                      </p>
                      <p className="text-xs text-slate-500">Total pendente</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">
                        Cotas mensais
                      </p>
                      <p className="mt-1 text-xl font-bold text-amber-700">
                        {formatCurrency(debtor.monthlyCharges.totalPending)}
                      </p>
                      <p className="mt-1 text-xs text-amber-600">
                        {debtor.monthlyCharges.items.length} cobrança(s) pendente(s)
                      </p>
                    </div>

                    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                      <p className="text-sm font-semibold text-orange-900">
                        Empréstimos
                      </p>
                      <p className="mt-1 text-xl font-bold text-orange-700">
                        {formatCurrency(debtor.loans.totalPending)}
                      </p>
                      <p className="mt-1 text-xs text-orange-600">
                        {debtor.loans.items.length} empréstimo(s) em aberto
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/caixinhas/${debtor.group.id}/cobrancas`)}
                    >
                      Ver cobranças
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/caixinhas/${debtor.group.id}/emprestimos`)}
                    >
                      Ver empréstimos
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleCopyMessage(debtor)}
                    >
                      {copiedMemberId === debtor.member.id
                        ? '✓ Copiado!'
                        : 'Copiar mensagem'}
                    </Button>
                    {debtor.member.phone ? (
                      <Button onClick={() => handleWhatsApp(debtor)}>
                        Cobrar no WhatsApp
                      </Button>
                    ) : (
                      <Button disabled>Sem telefone</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
