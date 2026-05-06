import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BackButton } from '../components/ui/BackButton';
import { cashGroupsApi } from '../features/cash-groups/api';
import type { CashGroup, CreateCashGroupData, UpdateCashGroupData } from '../features/cash-groups/types';

export function CashGroupsPage() {
  const navigate = useNavigate();
  const [cashGroups, setCashGroups] = useState<CashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCashGroup, setEditingCashGroup] = useState<CashGroup | null>(null);

  const currentYear = new Date().getFullYear();

  // Form states
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
      const data = await cashGroupsApi.getAll();
      setCashGroups(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar caixinhas');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      name: '',
      description: '',
      cycleYear: currentYear,
      quotaValue: 0,
      dueDay: 10,
      maxQuotasPerMember: 2,
      defaultLoanInterestRate: 30,
    });
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
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

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
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
    } catch (err: any) {
      alert('Erro ao alterar status');
    }
  }

  async function handleDelete(cashGroup: CashGroup) {
    const confirmMessage = `Tem certeza que deseja arquivar a caixinha "${cashGroup.name}"?\n\nEsta ação não pode ser desfeita.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await cashGroupsApi.delete(cashGroup.id);
      await loadCashGroups();
    } catch (err: any) {
      alert('Erro ao arquivar caixinha');
    }
  }

  function getStatusColor(status: string) {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      CLOSED: 'bg-slate-100 text-slate-800',
      ARCHIVED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-800';
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

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <BackButton to="/dashboard" label="Voltar para Dashboard" />
            <h1 className="text-2xl font-bold text-slate-900">Caixinhas</h1>
            <p className="mt-1 text-sm text-slate-600">
              Gerencie suas caixinhas coletivas
            </p>
          </div>
          <Button onClick={openCreateModal}>
            Nova Caixinha
          </Button>
        </div>

        {/* Error */}
        {error && !isCreateModalOpen && !isEditModalOpen && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cashGroups.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">Nenhuma caixinha cadastrada</h3>
            <p className="mt-2 text-sm text-slate-600">
              Comece criando sua primeira caixinha coletiva
            </p>
            <Button onClick={openCreateModal} className="mt-4">
              Criar Primeira Caixinha
            </Button>
          </div>
        )}

        {/* Cash Groups List */}
        {!isLoading && cashGroups.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cashGroups.map((cashGroup) => (
              <div
                key={cashGroup.id}
                className="rounded-xl bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{cashGroup.name}</h3>
                    {cashGroup.description && (
                      <p className="mt-1 text-sm text-slate-600">{cashGroup.description}</p>
                    )}
                  </div>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(cashGroup.status)}`}>
                    {getStatusLabel(cashGroup.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Ciclo:</span>
                    <span className="font-medium text-slate-900">{cashGroup.cycleYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor da cota:</span>
                    <span className="font-medium text-slate-900">
                      R$ {parseFloat(cashGroup.quotaValue).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vencimento:</span>
                    <span className="font-medium text-slate-900">Dia {cashGroup.dueDay}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Máx cotas/membro:</span>
                    <span className="font-medium text-slate-900">{cashGroup.maxQuotasPerMember}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    onClick={() => navigate(`/caixinhas/${cashGroup.id}/cotistas`)}
                    className="w-full text-xs"
                  >
                    Ver Cotistas
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => openEditModal(cashGroup)}
                      className="flex-1 text-xs"
                    >
                      Editar
                    </Button>
                    {(cashGroup.status === 'ACTIVE' || cashGroup.status === 'PAUSED') && (
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleStatus(cashGroup)}
                        className="flex-1 text-xs"
                      >
                        {cashGroup.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      </Button>
                    )}
                  </div>
                </div>

                {cashGroup.status !== 'ARCHIVED' && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleDelete(cashGroup)}
                      className="w-full rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Arquivar Caixinha
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          title="Nova Caixinha"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Nome da caixinha"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ex: Caixinha 2026"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                rows={3}
                placeholder="Descrição da caixinha"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Ano do ciclo"
                type="number"
                value={formData.cycleYear}
                onChange={(e) => setFormData({ ...formData, cycleYear: parseInt(e.target.value) })}
                required
                min={2000}
              />

              <Input
                label="Dia de vencimento"
                type="number"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                required
                min={1}
                max={28}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor da cota (R$)"
                type="number"
                step="0.01"
                value={formData.quotaValue}
                onChange={(e) => setFormData({ ...formData, quotaValue: parseFloat(e.target.value) })}
                required
                min={0.01}
              />

              <Input
                label="Máx cotas/membro"
                type="number"
                value={formData.maxQuotasPerMember}
                onChange={(e) => setFormData({ ...formData, maxQuotasPerMember: parseInt(e.target.value) })}
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
              onChange={(e) => setFormData({ ...formData, defaultLoanInterestRate: parseFloat(e.target.value) })}
              required
              min={0}
              max={100}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModals}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
              >
                Criar Caixinha
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title="Editar Caixinha"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Nome da caixinha"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descrição (opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor da cota (R$)"
                type="number"
                step="0.01"
                value={formData.quotaValue}
                onChange={(e) => setFormData({ ...formData, quotaValue: parseFloat(e.target.value) })}
                required
                min={0.01}
              />

              <Input
                label="Dia de vencimento"
                type="number"
                value={formData.dueDay}
                onChange={(e) => setFormData({ ...formData, dueDay: parseInt(e.target.value) })}
                required
                min={1}
                max={28}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Máx cotas/membro"
                type="number"
                value={formData.maxQuotasPerMember}
                onChange={(e) => setFormData({ ...formData, maxQuotasPerMember: parseInt(e.target.value) })}
                required
                min={1}
                max={10}
              />

              <Input
                label="Taxa de juros (%)"
                type="number"
                step="0.01"
                value={formData.defaultLoanInterestRate}
                onChange={(e) => setFormData({ ...formData, defaultLoanInterestRate: parseFloat(e.target.value) })}
                required
                min={0}
                max={100}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModals}
                className="flex-1"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
