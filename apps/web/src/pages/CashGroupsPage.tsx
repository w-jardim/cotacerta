import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { LinkButton } from '../components/ui/LinkButton';
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

export function CashGroupsPage() {
  const navigate = useNavigate();
  const [cashGroups, setCashGroups] = useState<CashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCashGroup, setEditingCashGroup] = useState<CashGroup | null>(null);

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
      const data = await cashGroupsApi.getAll();
      setCashGroups(data);
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
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cashGroups.map((cashGroup) => (
              <Card key={cashGroup.id} className="flex h-full flex-col p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-slate-950">{cashGroup.name}</h3>
                    <p className="text-sm leading-6 text-slate-600">
                      {cashGroup.description || 'Sem descrição informada para este ciclo.'}
                    </p>
                  </div>
                  <Badge status={cashGroup.status}>{getStatusLabel(cashGroup.status)}</Badge>
                </div>

                <div className="mt-6 grid gap-3 rounded-2xl bg-slate-50/90 p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>Ciclo</span>
                    <strong className="text-slate-900">{cashGroup.cycleYear}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Valor da cota</span>
                    <strong className="text-slate-900">R$ {parseFloat(cashGroup.quotaValue).toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Vencimento</span>
                    <strong className="text-slate-900">Dia {cashGroup.dueDay}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Máx. cotas por cotista</span>
                    <strong className="text-slate-900">{cashGroup.maxQuotasPerMember}</strong>
                  </div>
                </div>

                <div className="mt-6 grid gap-2">
                  <Button variant="secondary" onClick={() => navigate(`/caixinhas/${cashGroup.id}/cotistas`)}>
                    Ver cotistas
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" onClick={() => openEditModal(cashGroup)}>
                      Editar
                    </Button>
                    {(cashGroup.status === 'ACTIVE' || cashGroup.status === 'PAUSED') && (
                      <Button variant="ghost" onClick={() => handleToggleStatus(cashGroup)}>
                        {cashGroup.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <LinkButton onClick={() => navigate(`/caixinhas/${cashGroup.id}/cobrancas`)}>
                      Cobranças
                    </LinkButton>
                    {cashGroup.status !== 'ARCHIVED' && (
                      <LinkButton variant="danger" onClick={() => handleDelete(cashGroup)}>
                        Arquivar
                      </LinkButton>
                    )}
                  </div>
                </div>
              </Card>
            ))}
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
