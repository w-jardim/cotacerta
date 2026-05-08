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
      `Tem certeza que deseja arquivar a caixinha "${cashGroup.name}"?\n\nEsta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    try {
      await cashGroupsApi.delete(cashGroup.id);
      await loadCashGroups();
    } catch {
      setError('Erro ao arquivar caixinha');
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

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard tone="brand" value={cashGroups.length} label="Total de caixinhas" />
          <StatCard tone="success" value={activeCount} label="Caixinhas ativas" />
          <StatCard tone="warning" value={pausedCount} label="Caixinhas pausadas" />
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
                  <div className="mx-5 grid grid-cols-3 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70">
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

                  <div className="mx-5 mt-2 grid grid-cols-2 divide-x divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="px-3 py-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Vencimento</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">Dia {cashGroup.dueDay}</p>
                    </div>
                    <div className="px-3 py-3 text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Máx. cotas/cotista</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">{cashGroup.maxQuotasPerMember}</p>
                    </div>
                  </div>

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

                  {/* Secondary actions */}
                  <div className="mt-3 flex items-center gap-1 border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/caixinhas/${cashGroup.id}/fechamento`)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      Fechamento
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(cashGroup)}
                      className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      Editar
                    </button>
                    {(cashGroup.status === 'ACTIVE' || cashGroup.status === 'PAUSED') && (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(cashGroup)}
                        className="rounded-md px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        {cashGroup.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      </button>
                    )}
                    {cashGroup.status !== 'ARCHIVED' && (
                      <button
                        type="button"
                        onClick={() => handleDelete(cashGroup)}
                        className="ml-auto rounded-md px-3 py-1.5 text-xs font-semibold text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        Arquivar
                      </button>
                    )}
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
