import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../features/auth/auth-context';
import { cashGroupsApi } from '../features/cash-groups/api';
import { membersApi } from '../features/members/api';
import { chargesApi } from '../features/charges/api';
import { loansApi } from '../features/loans/api';
import { debtorsApi } from '../features/debtors/api';
import type { CashGroup } from '../features/cash-groups/types';

interface DashboardStats {
  activeCashGroups: number;
  activeMembers: number;
  pendingChargesCount: number;
  pendingChargesTotal: number;
  openLoansCount: number;
  openLoansTotal: number;
  debtorsCount: number;
  debtorsTotal: number;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function KpiCard({
  label,
  value,
  sub,
  tone = 'neutral',
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}) {
  const tones = {
    neutral: 'border-slate-200/70',
    brand: 'border-teal-200/60 bg-gradient-to-br from-teal-50/60 to-white',
    success: 'border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white',
    warning: 'border-amber-200/60 bg-gradient-to-br from-amber-50/60 to-white',
    danger: 'border-rose-200/60 bg-gradient-to-br from-rose-50/60 to-white',
  };
  const dots = {
    neutral: 'bg-slate-400',
    brand: 'bg-teal-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  };

  return (
    <div
      className={`rounded-3xl border bg-white/90 px-6 py-5 shadow-sm transition ${tones[tone]} ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block h-2 w-2 rounded-full ${dots[tone]}`} />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-slate-950 tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
    </div>
  );
}

function QuickActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-800"
    >
      {icon && <span className="text-base">{icon}</span>}
      {label}
    </button>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    activeCashGroups: 0,
    activeMembers: 0,
    pendingChargesCount: 0,
    pendingChargesTotal: 0,
    openLoansCount: 0,
    openLoansTotal: 0,
    debtorsCount: 0,
    debtorsTotal: 0,
  });
  const [activeCashGroups, setActiveCashGroups] = useState<CashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [groups, members, charges, loans, debtors] = await Promise.all([
          cashGroupsApi.getAll(),
          membersApi.getAllUserMembers(),
          chargesApi.getAllUserCharges(),
          loansApi.getAllUserLoans(),
          debtorsApi.getAllDebtors().catch(() => ({ items: [], summary: { totalPending: 0, membersWithDebt: 0 } })),
        ]);

        const active = groups.filter((g: CashGroup) => g.status === 'ACTIVE');
        const activeMembers = members.filter((m: any) => m.status === 'ACTIVE').length;

        const pendingChargesTotal = charges.reduce(
          (sum: number, c: any) => sum + (parseFloat(c.amountDue) - parseFloat(c.amountPaid)),
          0,
        );

        const openLoans = loans.items.filter((l: any) =>
          ['OPEN', 'PARTIAL'].includes(l.status),
        );
        const openLoansTotal = openLoans.reduce(
          (sum: number, l: any) => sum + parseFloat(l.remainingAmount || '0'),
          0,
        );

        setStats({
          activeCashGroups: active.length,
          activeMembers,
          pendingChargesCount: charges.length,
          pendingChargesTotal,
          openLoansCount: openLoans.length,
          openLoansTotal,
          debtorsCount: debtors.summary?.membersWithDebt ?? 0,
          debtorsTotal: debtors.summary?.totalPending ?? 0,
        });

        setActiveCashGroups(active.slice(0, 5));
      } catch (err) {
        console.error('Erro ao carregar dashboard', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'gestor';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  function getStatusLabel(status: string) {
    const labels: Record<string, string> = { ACTIVE: 'Ativa', PAUSED: 'Pausada', CLOSED: 'Fechada', ARCHIVED: 'Arquivada' };
    return labels[status] || status;
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">

        {/* Header executivo */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              {greeting}
            </p>
            <h2 className="mt-1 text-3xl font-extrabold text-slate-950">{firstName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Painel de gestão · {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate('/quem-deve')}>
              Quem deve
            </Button>
            <Button onClick={() => navigate('/caixinhas')}>
              Nova caixinha
            </Button>
          </div>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              tone="brand"
              label="Caixinhas ativas"
              value={stats.activeCashGroups}
              sub={`${stats.activeCashGroups === 1 ? '1 grupo' : `${stats.activeCashGroups} grupos`} em operação`}
              onClick={() => navigate('/caixinhas')}
            />
            <KpiCard
              tone="success"
              label="Cotistas ativos"
              value={stats.activeMembers}
              sub="Participantes vinculados"
              onClick={() => navigate('/cotistas')}
            />
            <KpiCard
              tone={stats.pendingChargesTotal > 0 ? 'warning' : 'neutral'}
              label="Cobranças abertas"
              value={formatBRL(stats.pendingChargesTotal)}
              sub={`${stats.pendingChargesCount} lançamento${stats.pendingChargesCount !== 1 ? 's' : ''} pendente${stats.pendingChargesCount !== 1 ? 's' : ''}`}
              onClick={() => navigate('/cobrancas')}
            />
            <KpiCard
              tone={stats.openLoansCount > 0 ? 'danger' : 'neutral'}
              label="Empréstimos em aberto"
              value={stats.openLoansCount}
              sub={stats.openLoansCount > 0 ? `${formatBRL(stats.openLoansTotal)} a receber` : 'Nenhum em aberto'}
              onClick={() => navigate('/emprestimos')}
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Atenção necessária */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Atenção necessária
            </h3>

            {isLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {stats.debtorsCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/quem-deve')}
                    className="w-full flex items-center justify-between gap-4 rounded-2xl border border-rose-200/60 bg-rose-50/60 px-5 py-4 text-left shadow-sm transition hover:border-rose-300 hover:bg-rose-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-rose-900">
                        {stats.debtorsCount} cotista{stats.debtorsCount !== 1 ? 's' : ''} com pendências
                      </p>
                      <p className="text-xs text-rose-700">
                        {formatBRL(stats.debtorsTotal)} em aberto no total
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-rose-700">Ver →</span>
                  </button>
                )}

                {stats.pendingChargesCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/cobrancas')}
                    className="w-full flex items-center justify-between gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/60 px-5 py-4 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        {stats.pendingChargesCount} cobrança{stats.pendingChargesCount !== 1 ? 's' : ''} aguardando pagamento
                      </p>
                      <p className="text-xs text-amber-700">
                        {formatBRL(stats.pendingChargesTotal)} pendentes
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-amber-700">Ver →</span>
                  </button>
                )}

                {stats.openLoansCount > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/emprestimos')}
                    className="w-full flex items-center justify-between gap-4 rounded-2xl border border-slate-200/60 bg-slate-50/60 px-5 py-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {stats.openLoansCount} empréstimo{stats.openLoansCount !== 1 ? 's' : ''} em aberto
                      </p>
                      <p className="text-xs text-slate-600">
                        {formatBRL(stats.openLoansTotal)} a receber
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-slate-600">Ver →</span>
                  </button>
                )}

                {stats.debtorsCount === 0 && stats.pendingChargesCount === 0 && stats.openLoansCount === 0 && (
                  <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 px-5 py-4">
                    <p className="text-sm font-semibold text-emerald-800">✓ Tudo em dia por aqui</p>
                    <p className="text-xs text-emerald-700">Nenhuma pendência financeira encontrada.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
              Ações rápidas
            </h3>
            <div className="flex flex-col gap-2">
              <QuickActionButton icon="＋" label="Nova caixinha" onClick={() => navigate('/caixinhas')} />
              <QuickActionButton icon="⊞" label="Ver caixinhas" onClick={() => navigate('/caixinhas')} />
              <QuickActionButton icon="⚠" label="Quem deve" onClick={() => navigate('/quem-deve')} />
              <QuickActionButton icon="R$" label="Cobranças abertas" onClick={() => navigate('/cobrancas')} />
              <QuickActionButton icon="↗" label="Empréstimos" onClick={() => navigate('/emprestimos')} />
            </div>
          </div>
        </div>

        {/* Caixinhas ativas */}
        {!isLoading && activeCashGroups.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Caixinhas ativas
              </h3>
              <button
                type="button"
                className="text-xs font-semibold text-teal-700 hover:underline"
                onClick={() => navigate('/caixinhas')}
              >
                Ver todas →
              </button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white/90 shadow-sm">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Caixinha</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Ciclo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Cota</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-widest text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeCashGroups.map((group) => (
                    <tr key={group.id} className="hover:bg-teal-50/30 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{group.name}</p>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{group.cycleYear}</td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        R$ {parseFloat(group.quotaValue).toFixed(2)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge status={group.status}>{getStatusLabel(group.status)}</Badge>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                            onClick={() => navigate(`/caixinhas/${group.id}/cotistas`)}
                          >
                            Cotistas
                          </button>
                          <button
                            type="button"
                            className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                            onClick={() => navigate(`/caixinhas/${group.id}/cobrancas`)}
                          >
                            Cobranças
                          </button>
                          <button
                            type="button"
                            className="rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-800 transition"
                            onClick={() => navigate(`/caixinhas/${group.id}/emprestimos`)}
                          >
                            Abrir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!isLoading && activeCashGroups.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-500 text-sm">Nenhuma caixinha ativa encontrada.</p>
            <Button className="mt-4" onClick={() => navigate('/caixinhas')}>
              Criar primeira caixinha
            </Button>
          </Card>
        )}

      </div>
    </AuthenticatedLayout>
  );
}
