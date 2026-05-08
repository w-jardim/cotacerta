import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { annualClosingsApi } from '../features/annual-closings/api';
import { cashGroupsApi } from '../features/cash-groups/api';
import type { AnnualClosing, MemberClosingResult, SimulateResult } from '../features/annual-closings/types';
import type { CashGroup } from '../features/cash-groups/types';

const BRL = (v: string | number) =>
  `R$ ${parseFloat(String(v)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function statusLabel(s: string) {
  if (s === 'CONFIRMED') return 'Confirmado';
  if (s === 'CANCELED') return 'Cancelado';
  return 'Simulação';
}

function getResultRows(closing: AnnualClosing | SimulateResult | null): MemberClosingResult[] {
  if (!closing) return [];
  if ('memberResults' in closing) return closing.memberResults;
  return closing.results.map((r) => ({
    ...r,
    memberName: r.member?.name ?? r.memberName ?? '',
  }));
}

export function AnnualClosingPage() {
  const { cashGroupId: groupId } = useParams<{ cashGroupId: string }>();

  const [group, setGroup] = useState<CashGroup | null>(null);
  const [savedClosings, setSavedClosings] = useState<AnnualClosing[]>([]);
  const [simulation, setSimulation] = useState<SimulateResult | null>(null);
  const [activeClosing, setActiveClosing] = useState<AnnualClosing | null>(null);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!groupId) return;
    cashGroupsApi.getOne(groupId).then(setGroup).catch(() => {});
    loadSaved();
  }, [groupId]);

  async function loadSaved() {
    if (!groupId) return;
    try {
      const list = await annualClosingsApi.list(groupId);
      setSavedClosings(list);
    } catch {
      /* silently fail */
    }
  }

  async function handleSimulate() {
    if (!groupId) return;
    setIsSimulating(true);
    setError('');
    setSuccessMsg('');
    setSimulation(null);
    setActiveClosing(null);
    try {
      const result = await annualClosingsApi.simulate(groupId, selectedYear);
      setSimulation(result);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao simular fechamento');
    } finally {
      setIsSimulating(false);
    }
  }

  async function handleSave() {
    if (!groupId) return;
    setIsSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const saved = await annualClosingsApi.save(groupId, selectedYear);
      setActiveClosing(saved);
      setSimulation(null);
      setSuccessMsg('Simulação salva com sucesso.');
      await loadSaved();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao salvar simulação');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirm() {
    if (!groupId || !activeClosing) return;
    setIsConfirming(true);
    setError('');
    setSuccessMsg('');
    try {
      const confirmed = await annualClosingsApi.confirm(groupId, activeClosing.id);
      setActiveClosing(confirmed);
      setIsConfirmModalOpen(false);
      setSuccessMsg('Fechamento confirmado com sucesso!');
      await loadSaved();
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao confirmar fechamento');
      setIsConfirmModalOpen(false);
    } finally {
      setIsConfirming(false);
    }
  }

  function loadSavedClosing(closing: AnnualClosing) {
    setActiveClosing(closing);
    setSimulation(null);
    setSelectedYear(closing.cycleYear);
    setError('');
    setSuccessMsg('');
  }

  const displayClosing: AnnualClosing | SimulateResult | null = activeClosing ?? simulation;
  const rows = getResultRows(displayClosing);
  const isConfirmed = activeClosing?.status === 'CONFIRMED';

  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <PageHeader
          title="Fechamento Anual"
          subtitle={group ? `Caixinha: ${group.name}` : ''}
          backTo="/caixinhas"
          backLabel="Voltar para Caixinhas"
        />

        {error && <Alert variant="error">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}

        {/* Controles */}
        <Card className="p-6">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
              Simular Fechamento
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Ano do ciclo</label>
                <select
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <Button onClick={handleSimulate} isLoading={isSimulating}>
                Simular fechamento
              </Button>
            </div>
          </div>
        </Card>

        {/* Fechamentos salvos */}
        {savedClosings.length > 0 && (
          <Card className="overflow-hidden">
            <h2 className="px-6 pt-5 pb-2 text-sm font-semibold uppercase tracking-widest text-slate-500">
              Fechamentos salvos
            </h2>
            <div className="divide-y divide-slate-100">
              {savedClosings.map((c) => (
                <div
                  key={c.id}
                  className="flex cursor-pointer items-center justify-between px-6 py-3 hover:bg-slate-50"
                  onClick={() => loadSavedClosing(c)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-800">Ciclo {c.cycleYear}</span>
                    <Badge status={c.status === 'CONFIRMED' ? 'ACTIVE' : c.status === 'CANCELED' ? 'BLOCKED' : 'PAUSED'}>
                      {statusLabel(c.status)}
                    </Badge>
                  </div>
                  <span className="text-sm text-slate-500">
                    {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Resultado da simulação/fechamento */}
        {displayClosing && (
          <>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                Resultado — Ciclo {displayClosing.cycleYear}
              </h2>
              {activeClosing && (
                <Badge status={isConfirmed ? 'ACTIVE' : 'PAUSED'}>
                  {statusLabel(activeClosing.status)}
                </Badge>
              )}
              {!activeClosing && (
                <Badge status="PAUSED">Pré-visualização</Badge>
              )}
            </div>

            {/* Cards de resumo */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl bg-teal-600 p-6 text-white shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-100">Valor por cota</p>
                <p className="mt-2 text-3xl font-bold tracking-tight">{BRL(displayClosing.valuePerQuota)}</p>
                <p className="mt-1 text-sm text-teal-100">{displayClosing.totalQuotas} cotas no total</p>
              </div>
              <div className="md:col-span-2 grid gap-4 sm:grid-cols-2">
                <StatCard
                  tone="success"
                  value={BRL(displayClosing.totalAvailable)}
                  label="Total disponível"
                />
                <StatCard
                  tone="success"
                  value={BRL(displayClosing.totalQuotaReceived)}
                  label="Recebido em cotas"
                />
                <StatCard
                  tone="brand"
                  value={BRL(displayClosing.totalLoanReceived)}
                  label="Recebido em empréstimos"
                />
                <StatCard
                  tone="warning"
                  value={BRL(displayClosing.totalPending)}
                  label="Total de pendências"
                />
              </div>
            </div>

            {/* Tabela por cotista */}
            {rows.length > 0 && (
              <Card className="overflow-hidden">
                <h2 className="px-6 pt-5 pb-4 text-sm font-semibold uppercase tracking-widest text-slate-500">
                  Resultado por cotista
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        <th className="pb-3 pl-6 pr-4">Cotista</th>
                        <th className="pb-3 pr-4 text-right">Cotas</th>
                        <th className="pb-3 pr-4 text-right">Valor bruto</th>
                        <th className="pb-3 pr-4 text-right">Dívida cotas</th>
                        <th className="pb-3 pr-4 text-right">Dívida emprést.</th>
                        <th className="pb-3 pr-4 text-right">Total dívidas</th>
                        <th className="pb-3 pr-4 text-right">Valor líquido</th>
                        <th className="pb-3 pr-6 text-right">Saldo devedor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((r, i) => {
                        const name = r.memberName ?? r.member?.name ?? '—';
                        const net = parseFloat(String(r.netAmount));
                        const remaining = parseFloat(String(r.remainingDebtAmount));
                        return (
                          <tr key={r.memberId ?? i} className="hover:bg-slate-50">
                            <td className="py-3 pl-6 pr-4 font-medium text-slate-800">{name}</td>
                            <td className="py-3 pr-4 text-right text-slate-600">{r.quotaQuantity}</td>
                            <td className="py-3 pr-4 text-right text-slate-700">{BRL(r.grossAmount)}</td>
                            <td className="py-3 pr-4 text-right text-amber-700">{BRL(r.quotaDebtAmount)}</td>
                            <td className="py-3 pr-4 text-right text-amber-700">{BRL(r.loanDebtAmount)}</td>
                            <td className="py-3 pr-4 text-right font-medium text-red-600">{BRL(r.totalDebtAmount)}</td>
                            <td className="py-3 pr-4 text-right font-semibold text-teal-700">{BRL(net)}</td>
                            <td className="py-3 pr-6 text-right font-semibold text-red-600">
                              {remaining > 0 ? BRL(remaining) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Ações */}
            {!isConfirmed && (
              <div className="flex flex-wrap gap-3">
                {simulation && (
                  <Button onClick={handleSave} isLoading={isSaving} variant="secondary">
                    Salvar simulação
                  </Button>
                )}
                {activeClosing && activeClosing.status === 'SIMULATED' && (
                  <Button
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Confirmar fechamento
                  </Button>
                )}
              </div>
            )}

            {isConfirmed && (
              <Alert variant="success">
                Fechamento confirmado em{' '}
                {activeClosing?.confirmedAt
                  ? new Date(activeClosing.confirmedAt).toLocaleDateString('pt-BR')
                  : '—'}
                . Nenhuma alteração é permitida após a confirmação.
              </Alert>
            )}
          </>
        )}

        {/* Modal de confirmação */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title="Confirmar Fechamento Anual"
        >
          <div className="space-y-4">
            <Alert variant="error">
              <strong>Atenção!</strong> Essa ação confirma o fechamento anual e deve ser feita somente
              após conferência cuidadosa de todos os valores. Ela não pode ser desfeita.
            </Alert>
            <p className="text-sm text-slate-600">
              Você está prestes a confirmar definitivamente o fechamento do ciclo{' '}
              <strong>{activeClosing?.cycleYear}</strong> da caixinha{' '}
              <strong>{group?.name}</strong>.
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isConfirming}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                isLoading={isConfirming}
                onClick={handleConfirm}
              >
                Confirmar fechamento
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
