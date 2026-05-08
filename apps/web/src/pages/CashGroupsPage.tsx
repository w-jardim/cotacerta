import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Textarea } from '../components/ui/Textarea';
import { cashGroupsApi } from '../features/cash-groups/api';
import type {
  CashGroup,
  CreateCashGroupData,
  UpdateCashGroupData,
} from '../features/cash-groups/types';
import { membersApi } from '../features/members/api';

export function CashGroupsPage() {
  const navigate = useNavigate();
  const [cashGroups, setCashGroups] = useState<CashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCashGroup, setEditingCashGroup] = useState<CashGroup | null>(null);
  const [memberStats, setMemberStats] = useState<Record<string, { count: number; quotas: number }>>({});

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState<CreateCashGroupData>({
    name: '',
    description: '',
    cycleYear: currentYear,
    quotaValue: 0,
    dueDay: 10,
    maxQuotasPerMember: 2,
    defaultLoanInterestRate: 30,
    receivingPixEnabledForCharges: false,
    receivingPixEnabledForLoans: false,
    receivingPixKey: '',
    receivingPixKeyHolder: '',
    receivingPixReceiverCity: '',
    receivingPixDescriptionPrefix: '',
    receivingInstructions: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCashGroups();
  }, []);

  async function loadCashGroups() {
    try {
      setIsLoading(true);
      setError('');
      const [data, allMembers] = await Promise.all([
        cashGroupsApi.getAll(),
        membersApi.getAllUserMembers().catch(() => []),
      ]);
      setCashGroups(data);

      const stats: Record<string, { count: number; quotas: number }> = {};
      for (const m of allMembers) {
        if (!m.cashGroupId) continue;
        if (!stats[m.cashGroupId]) stats[m.cashGroupId] = { count: 0, quotas: 0 };
        stats[m.cashGroupId].count += 1;
        stats[m.cashGroupId].quotas += m.quotasCount ?? 0;
      }
      setMemberStats(stats);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar caixinhas');
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      cycleYear: currentYear,
      quotaValue: 0,
      dueDay: 10,
      maxQuotasPerMember: 2,
      defaultLoanInterestRate: 30,
      receivingPixEnabledForCharges: false,
      receivingPixEnabledForLoans: false,
      receivingPixKey: '',
      receivingPixKeyHolder: '',
      receivingPixReceiverCity: '',
      receivingPixDescriptionPrefix: '',
      receivingInstructions: '',
    });
  }

  function openCreateModal() {
    resetForm();
    setIsCreateModalOpen(true);
  }

  function openEditModal(cashGroup: CashGroup) {
    setEditingCashGroup(cashGroup);
    setFormData({
      name: cashGroup.name,
      description: cashGroup.description || '',
      cycleYear: cashGroup.cycleYear,
      quotaValue: parseFloat(cashGroup.quotaValue),
      dueDay: cashGroup.dueDay,
      maxQuotasPerMember: cashGroup.maxQuotasPerMember,
      defaultLoanInterestRate: parseFloat(cashGroup.defaultLoanInterestRate),
      receivingPixEnabledForCharges: cashGroup.receivingPixEnabledForCharges,
      receivingPixEnabledForLoans: cashGroup.receivingPixEnabledForLoans,
      receivingPixKey: cashGroup.receivingPixKey || '',
      receivingPixKeyHolder: cashGroup.receivingPixKeyHolder || '',
      receivingPixReceiverCity: cashGroup.receivingPixReceiverCity || '',
      receivingPixDescriptionPrefix: cashGroup.receivingPixDescriptionPrefix || '',
      receivingInstructions: cashGroup.receivingInstructions || '',
    });
    setIsEditModalOpen(true);
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingCashGroup(null);
    setError('');
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await cashGroupsApi.create(formData);
      await loadCashGroups();
      closeModals();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao criar caixinha');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingCashGroup) return;

    setIsSubmitting(true);
    setError('');

    try {
      const updateData: UpdateCashGroupData = {
        name: formData.name,
        description: formData.description || undefined,
        quotaValue: formData.quotaValue,
        dueDay: formData.dueDay,
        maxQuotasPerMember: formData.maxQuotasPerMember,
        defaultLoanInterestRate: formData.defaultLoanInterestRate,
        receivingPixEnabledForCharges: formData.receivingPixEnabledForCharges,
        receivingPixEnabledForLoans: formData.receivingPixEnabledForLoans,
        receivingPixKey: formData.receivingPixKey || undefined,
        receivingPixKeyHolder: formData.receivingPixKeyHolder || undefined,
        receivingPixReceiverCity: formData.receivingPixReceiverCity || undefined,
        receivingPixDescriptionPrefix:
          formData.receivingPixDescriptionPrefix || undefined,
        receivingInstructions: formData.receivingInstructions || undefined,
      };

      await cashGroupsApi.update(editingCashGroup.id, updateData);
      await loadCashGroups();
      closeModals();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao atualizar caixinha');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(cashGroup: CashGroup) {
    try {
      const newStatus = cashGroup.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await cashGroupsApi.update(cashGroup.id, { status: newStatus });
      await loadCashGroups();
    } catch {
      setError('Erro ao alterar status da caixinha');
    }
  }

  async function handleDelete(cashGroup: CashGroup) {
    const confirmed = window.confirm(
      `Tem certeza que deseja arquivar a caixinha "${cashGroup.name}"?\n\nEsta ação pode ser desfeita posteriormente.`,
    );

    if (!confirmed) return;

    try {
      await cashGroupsApi.delete(cashGroup.id);
      await loadCashGroups();
    } catch {
      setError('Erro ao arquivar caixinha');
    }
  }

  async function handleRestore(cashGroup: CashGroup) {
    const confirmed = window.confirm(
      `Tem certeza que deseja desarquivar a caixinha "${cashGroup.name}"?`,
    );

    if (!confirmed) return;

    try {
      await cashGroupsApi.restore(cashGroup.id);
      await loadCashGroups();
    } catch {
      setError('Erro ao desarquivar caixinha');
    }
  }

  function getStatusLabel(status: string) {
    const labels = {
      ACTIVE: 'Ativa',
      PAUSED: 'Pausada',
      CLOSED: 'Fechada',
      ARCHIVED: 'Arquivada',
    };

    return labels[status as keyof typeof labels] || status;
  }

  const activeCount = cashGroups.filter((group) => group.status === 'ACTIVE').length;
  const pausedCount = cashGroups.filter((group) => group.status === 'PAUSED').length;
  const archivedCount = cashGroups.filter((group) => group.status === 'ARCHIVED').length;

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="cc-section-head">
          <PageHeader
            title="Caixinhas"
            subtitle="Organize ciclos, configure cotas e mantenha cada grupo com identidade financeira própria."
            backTo="/dashboard"
            backLabel="Voltar ao dashboard"
          />
          <Button onClick={openCreateModal}>Nova caixinha</Button>
        </div>

        {error && !isCreateModalOpen && !isEditModalOpen && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard tone="brand" value={cashGroups.length} label="Total de caixinhas" />
          <StatCard tone="success" value={activeCount} label="Caixinhas ativas" />
          <StatCard tone="warning" value={pausedCount} label="Caixinhas pausadas" />
          <StatCard tone="neutral" value={archivedCount} label="Caixinhas arquivadas" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        )}

        {!isLoading && cashGroups.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">CX</span>}
            title="Nenhuma caixinha cadastrada"
            description="Comece pela estrutura principal do sistema. Depois você poderá adicionar cotistas, gerar cobranças e acompanhar inadimplência."
            action={<Button onClick={openCreateModal}>Criar primeira caixinha</Button>}
          />
        )}

        {!isLoading && cashGroups.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cashGroups.map((cashGroup) => {
              const stats = memberStats[cashGroup.id];
              return (
                <div
                  key={cashGroup.id}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">
                        {cashGroup.cycleYear}
                      </p>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug truncate">
                        {cashGroup.name}
                      </h3>
                      {cashGroup.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-1">
                          {cashGroup.description}
                        </p>
                      )}
                    </div>
                    <Badge status={cashGroup.status}>{getStatusLabel(cashGroup.status)}</Badge>
                  </div>

                  {/* Metrics */}
                  <div className="mx-5 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="grid grid-cols-3 divide-x divide-slate-100">
                      <div className="px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cota</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          R$ {parseFloat(cashGroup.quotaValue).toFixed(2)}
                        </p>
                      </div>
                      <div className="px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cotistas</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {stats != null ? stats.count : '—'}
                        </p>
                      </div>
                      <div className="px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cotas</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {stats != null ? stats.quotas : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
                      <div className="px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vencimento</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">Dia {cashGroup.dueDay}</p>
                      </div>
                      <div className="px-3 py-3 text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Máx. cotas/cotista</p>
                        <p className="mt-1 text-sm font-bold text-slate-800">{cashGroup.maxQuotasPerMember}</p>
                      </div>
                    </div>
                  </div>

                  {(cashGroup.receivingPixEnabledForCharges ||
                    cashGroup.receivingPixEnabledForLoans) && (
                    <div className="mx-5 mt-3 rounded-xl border border-teal-100 bg-teal-50 px-3 py-3 text-xs text-teal-900">
                      <p className="font-semibold uppercase tracking-wide text-teal-700">
                        Pix configurado
                      </p>
                      <p className="mt-1">
                        {cashGroup.receivingPixEnabledForCharges ? 'Cotas' : ''}
                        {cashGroup.receivingPixEnabledForCharges &&
                        cashGroup.receivingPixEnabledForLoans
                          ? ' e '
                          : ''}
                        {cashGroup.receivingPixEnabledForLoans ? 'Empréstimos' : ''}
                      </p>
                      {cashGroup.receivingPixKey && (
                        <p className="mt-1 font-mono text-[11px] text-slate-700">
                          {cashGroup.receivingPixKey}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Primary actions */}
                  <div className="flex gap-2 px-5 pt-4">
                    <button
                      type="button"
                      onClick={() => navigate(`/caixinhas/${cashGroup.id}/cotistas`)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800"
                    >
                      Cotistas
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/caixinhas/${cashGroup.id}/cobrancas`)}
                      className="flex-1 rounded-lg bg-teal-700 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Cobranças
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/caixinhas/${cashGroup.id}/emprestimos`)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800"
                    >
                      Empréstimos
                    </button>
                  </div>

                  {/* Footer actions */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 px-5 py-2.5">
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/caixinhas/${cashGroup.id}/extrato`)}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        Extrato
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/caixinhas/${cashGroup.id}/fechamento`)}
                        className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Fechamento
                      </button>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => openEditModal(cashGroup)}
                        title="Editar"
                        className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      {(cashGroup.status === 'ACTIVE' || cashGroup.status === 'PAUSED') && (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cashGroup)}
                          title={cashGroup.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          {cashGroup.status === 'ACTIVE' ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                            </svg>
                          )}
                        </button>
                      )}
                      {cashGroup.status !== 'ARCHIVED' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cashGroup)}
                          title="Arquivar"
                          className="rounded-md p-1.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.75 7.5h16.5M16.5 7.5V6a2.25 2.25 0 0 0-2.25-2.25h-4.5A2.25 2.25 0 0 0 7.5 6v1.5" />
                          </svg>
                        </button>
                      )}
                      {cashGroup.status === 'ARCHIVED' && (
                        <button
                          type="button"
                          onClick={() => handleRestore(cashGroup)}
                          title="Desarquivar"
                          className="rounded-md p-1.5 text-teal-500 transition hover:bg-teal-50 hover:text-teal-700"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          title="Nova caixinha"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              label="Nome da caixinha"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
              placeholder="Ex: Caixinha 2026"
            />

            <Textarea
              label="Descrição"
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              placeholder="Resumo rápido da finalidade da caixinha"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Ano do ciclo"
                type="number"
                value={formData.cycleYear}
                onChange={(event) => setFormData({ ...formData, cycleYear: parseInt(event.target.value, 10) })}
                required
                min={2000}
              />
              <Input
                label="Dia de vencimento"
                type="number"
                value={formData.dueDay}
                onChange={(event) => setFormData({ ...formData, dueDay: parseInt(event.target.value, 10) })}
                required
                min={1}
                max={28}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Valor da cota (R$)"
                type="number"
                step="0.01"
                value={formData.quotaValue}
                onChange={(event) => setFormData({ ...formData, quotaValue: parseFloat(event.target.value) })}
                required
                min={0.01}
              />
              <Input
                label="Máx. cotas por cotista"
                type="number"
                value={formData.maxQuotasPerMember}
                onChange={(event) => setFormData({ ...formData, maxQuotasPerMember: parseInt(event.target.value, 10) })}
                required
                min={1}
                max={10}
              />
            </div>

            <Input
              label="Taxa de juros padrão (%)"
              type="number"
              step="0.01"
              value={formData.defaultLoanInterestRate}
              onChange={(event) =>
                setFormData({ ...formData, defaultLoanInterestRate: parseFloat(event.target.value) })
              }
              required
              min={0}
              max={100}
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Formas de recebimento</p>
                <p className="mt-1 text-xs text-slate-500">
                  Você pode configurar depois. Esses dados serão usados para gerar o Pix copia e cola e o QR Code para o cotista.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.receivingPixEnabledForCharges)}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      receivingPixEnabledForCharges: event.target.checked,
                    })
                  }
                />
                Aceitar Pix para cotas
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.receivingPixEnabledForLoans)}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      receivingPixEnabledForLoans: event.target.checked,
                    })
                  }
                />
                Aceitar Pix para empréstimos
              </label>
              <Input
                label="Chave Pix"
                value={formData.receivingPixKey || ''}
                onChange={(event) =>
                  setFormData({ ...formData, receivingPixKey: event.target.value })
                }
                placeholder="CPF, telefone, email ou chave aleatória"
              />
              <Input
                label="Nome do recebedor"
                value={formData.receivingPixKeyHolder || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixKeyHolder: event.target.value,
                  })
                }
                placeholder="Nome que aparece no Pix"
              />
              <Input
                label="Cidade do recebedor"
                value={formData.receivingPixReceiverCity || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixReceiverCity: event.target.value,
                  })
                }
                placeholder="Ex: Rio de Janeiro"
              />
              <Input
                label="Descrição padrão do Pix"
                value={formData.receivingPixDescriptionPrefix || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixDescriptionPrefix: event.target.value,
                  })
                }
                placeholder="Ex: CotaCerta"
              />
              <Textarea
                label="Instruções manuais"
                rows={3}
                value={formData.receivingInstructions || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingInstructions: event.target.value,
                  })
                }
                placeholder="Orientações para dinheiro ou outros combinados"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModals} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Criar caixinha
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title="Editar caixinha"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              label="Nome da caixinha"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
            />

            <Textarea
              label="Descrição"
              rows={3}
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Valor da cota (R$)"
                type="number"
                step="0.01"
                value={formData.quotaValue}
                onChange={(event) => setFormData({ ...formData, quotaValue: parseFloat(event.target.value) })}
                required
                min={0.01}
              />
              <Input
                label="Dia de vencimento"
                type="number"
                value={formData.dueDay}
                onChange={(event) => setFormData({ ...formData, dueDay: parseInt(event.target.value, 10) })}
                required
                min={1}
                max={28}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Máx. cotas por cotista"
                type="number"
                value={formData.maxQuotasPerMember}
                onChange={(event) => setFormData({ ...formData, maxQuotasPerMember: parseInt(event.target.value, 10) })}
                required
                min={1}
                max={10}
              />
              <Input
                label="Taxa de juros (%)"
                type="number"
                step="0.01"
                value={formData.defaultLoanInterestRate}
                onChange={(event) =>
                  setFormData({ ...formData, defaultLoanInterestRate: parseFloat(event.target.value) })
                }
                required
                min={0}
              max={100}
            />

            <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Formas de recebimento</p>
                <p className="mt-1 text-xs text-slate-600">
                  Esses dados serão usados para gerar o Pix copia e cola e o QR Code para o cotista.
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.receivingPixEnabledForCharges)}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      receivingPixEnabledForCharges: event.target.checked,
                    })
                  }
                />
                Aceitar Pix para cotas
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(formData.receivingPixEnabledForLoans)}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      receivingPixEnabledForLoans: event.target.checked,
                    })
                  }
                />
                Aceitar Pix para empréstimos
              </label>
              <Input
                label="Chave Pix"
                value={formData.receivingPixKey || ''}
                onChange={(event) =>
                  setFormData({ ...formData, receivingPixKey: event.target.value })
                }
                placeholder="CPF, telefone, email ou chave aleatória"
                required={
                  Boolean(formData.receivingPixEnabledForCharges) ||
                  Boolean(formData.receivingPixEnabledForLoans)
                }
              />
              <Input
                label="Nome do recebedor"
                value={formData.receivingPixKeyHolder || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixKeyHolder: event.target.value,
                  })
                }
                placeholder="Nome que aparece no Pix"
                required={
                  Boolean(formData.receivingPixEnabledForCharges) ||
                  Boolean(formData.receivingPixEnabledForLoans)
                }
              />
              <Input
                label="Cidade do recebedor"
                value={formData.receivingPixReceiverCity || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixReceiverCity: event.target.value,
                  })
                }
                placeholder="Ex: Rio de Janeiro"
              />
              <Input
                label="Descrição padrão do Pix"
                value={formData.receivingPixDescriptionPrefix || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingPixDescriptionPrefix: event.target.value,
                  })
                }
                placeholder="Ex: CotaCerta"
              />
              <Textarea
                label="Instruções manuais"
                rows={3}
                value={formData.receivingInstructions || ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    receivingInstructions: event.target.value,
                  })
                }
                placeholder="Orientações para dinheiro ou outros combinados"
              />
            </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={closeModals} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1" isLoading={isSubmitting}>
                Salvar alterações
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
