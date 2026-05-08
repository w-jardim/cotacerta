import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { cashGroupsApi } from '../features/cash-groups/api';
import type { LedgerResponse, LedgerEntry } from '../features/cash-groups/types';

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

const CATEGORY_LABELS: Record<LedgerEntry['category'], string> = {
  COTA_PAGA: 'Cota paga',
  EMPRESTIMO_CONCEDIDO: 'Empréstimo concedido',
  PAGAMENTO_EMPRESTIMO: 'Pagamento de empréstimo',
};

function EntryTypeChip({ type }: { type: LedgerEntry['type'] }) {
  if (type === 'ENTRADA') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
        </svg>
        Entrada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
      </svg>
      Saída
    </span>
  );
}

export function LedgerPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cashGroupId) loadLedger();
  }, [cashGroupId]);

  async function loadLedger() {
    try {
      setIsLoading(true);
      setError('');
      const data = await cashGroupsApi.getLedger(cashGroupId!);
      setLedger(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar extrato');
    } finally {
      setIsLoading(false);
    }
  }

  const saldo = ledger ? parseFloat(ledger.summary.saldo) : 0;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          title="Extrato da Caixinha"
          subtitle="Movimentações financeiras: entradas de cotas e empréstimos, saídas de empréstimos concedidos"
          backTo={`/caixinhas/${cashGroupId}/cobrancas`}
          backLabel="Voltar"
        />

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="rounded-xl bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent" />
            <p className="mt-2 text-sm text-slate-600">Carregando extrato...</p>
          </div>
        ) : ledger ? (
          <>
            {/* Cards de resumo */}
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                tone="success"
                label="Total Entradas"
                value={formatCurrency(ledger.summary.totalEntradas)}
              />
              <StatCard
                tone="danger"
                label="Total Saídas"
                value={formatCurrency(ledger.summary.totalSaidas)}
              />
              <div className={`rounded-xl p-5 shadow-sm ${saldo >= 0 ? 'bg-teal-600' : 'bg-rose-600'}`}>
                <p className="text-sm font-medium text-white/80">Saldo Atual</p>
                <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(saldo)}</p>
              </div>
            </div>

            {/* Tabela de movimentações */}
            {ledger.entries.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 01-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                }
                title="Nenhuma movimentação"
                description="Ainda não há entradas ou saídas registradas nesta caixinha."
              />
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Tipo</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Descrição</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Cotista</th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {ledger.entries.map((entry) => (
                        <tr key={`${entry.category}-${entry.id}`} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {formatDate(entry.date)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            <EntryTypeChip type={entry.type} />
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {entry.description}
                            <span className="ml-1.5 text-xs text-slate-400">
                              ({CATEGORY_LABELS[entry.category]})
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {entry.memberName}
                          </td>
                          <td className={`whitespace-nowrap px-6 py-4 text-right text-sm font-semibold ${
                            entry.type === 'ENTRADA' ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {entry.type === 'ENTRADA' ? '+' : '-'} {formatCurrency(entry.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={4} className="px-6 py-3 text-sm font-medium text-slate-700">
                          Saldo ({ledger.entries.length} movimentações)
                        </td>
                        <td className={`px-6 py-3 text-right text-sm font-bold ${saldo >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatCurrency(saldo)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AuthenticatedLayout>
  );
}
