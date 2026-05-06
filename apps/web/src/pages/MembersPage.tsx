import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { Alert } from '../components/ui/Alert';
import { BackButton } from '../components/ui/BackButton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { cashGroupsApi } from '../features/cash-groups/api';
import { membersApi } from '../features/members/api';
import type { CashGroup } from '../features/cash-groups/types';
import type { CreateMemberData, Member, UpdateMemberData } from '../features/members/types';

export function MembersPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();

  const [cashGroup, setCashGroup] = useState<CashGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<CreateMemberData>({
    cashGroupId: cashGroupId || '',
    name: '',
    phone: '',
    pixKey: '',
    quotasCount: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cashGroupId) {
      loadData();
    }
  }, [cashGroupId]);

  async function loadData() {
    if (!cashGroupId) {
      setError('ID da caixinha não encontrado na URL');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const [groupData, membersData] = await Promise.all([
        cashGroupsApi.getOne(cashGroupId),
        membersApi.getAll(cashGroupId),
      ]);
      setCashGroup(groupData);
      setMembers(membersData);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      setCashGroup(null);
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateModal() {
    setFormData({
      cashGroupId: cashGroupId || '',
      name: '',
      phone: '',
      pixKey: '',
      quotasCount: 1,
    });
    setIsCreateModalOpen(true);
  }

  function openEditModal(member: Member) {
    setEditingMember(member);
    setFormData({
      cashGroupId: member.cashGroupId,
      name: member.name,
      phone: member.phone || '',
      pixKey: member.pixKey || '',
      quotasCount: member.quotasCount,
    });
    setIsEditModalOpen(true);
  }

  function closeModals() {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingMember(null);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    try {
      setIsSubmitting(true);
      setError('');
      await membersApi.create(formData);
      await loadData();
      closeModals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar cotista');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    if (!editingMember) return;

    try {
      setIsSubmitting(true);
      setError('');
      const updateData: UpdateMemberData = {
        name: formData.name,
        phone: formData.phone || undefined,
        pixKey: formData.pixKey || undefined,
        quotasCount: formData.quotasCount,
      };
      await membersApi.update(editingMember.id, updateData);
      await loadData();
      closeModals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar cotista');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleStatus(member: Member) {
    try {
      const newStatus = member.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
      await membersApi.update(member.id, { status: newStatus });
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar status');
    }
  }

  async function handleDelete(member: Member) {
    if (!window.confirm(`Tem certeza que deseja remover ${member.name}?`)) return;

    try {
      await membersApi.delete(member.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao remover cotista');
    }
  }

  const activeMembers = members.filter((member) => member.status === 'ACTIVE');
  const totalQuotas = activeMembers.reduce((sum, member) => sum + member.quotasCount, 0);
  const totalMonthly = cashGroup ? parseFloat(cashGroup.quotaValue) * totalQuotas : 0;

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isLoading && !cashGroup) {
    return (
      <AuthenticatedLayout>
        <div className="space-y-4 py-12 text-center">
          <div className="text-lg font-semibold text-slate-900">Caixinha não encontrada</div>
          {error && <Alert variant="error">{error}</Alert>}
          <div className="flex justify-center">
            <BackButton to="/caixinhas" label="Voltar para caixinhas" />
          </div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!cashGroup) return null;

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="cc-section-head">
          <PageHeader
            backTo="/caixinhas"
            backLabel="Voltar para caixinhas"
            title={cashGroup.name}
            subtitle={`Ano ${cashGroup.cycleYear} • Cota R$ ${cashGroup.quotaValue} • Vencimento dia ${cashGroup.dueDay}`}
          />
          <Button onClick={openCreateModal}>Adicionar cotista</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard tone="brand" value={activeMembers.length} label="Cotistas ativos" />
          <StatCard tone="success" value={totalQuotas} label="Total de cotas" />
          <StatCard tone="warning" value={`R$ ${totalMonthly.toFixed(2)}`} label="Arrecadação mensal" />
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {members.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">CT</span>}
            title="Nenhum cotista cadastrado"
            description="Adicione participantes para começar a gerenciar cotas, Pix e cobranças desta caixinha."
            action={<Button onClick={openCreateModal}>Adicionar primeiro cotista</Button>}
          />
        ) : (
          <div className="cc-table-shell overflow-x-auto">
            <table className="cc-table">
              <thead>
                <tr>
                  <th className="cc-th">Cotista</th>
                  <th className="cc-th">Telefone</th>
                  <th className="cc-th">Chave Pix</th>
                  <th className="cc-th text-center">Cotas</th>
                  <th className="cc-th text-center">Status</th>
                  <th className="cc-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className={member.status !== 'ACTIVE' ? 'bg-slate-50/90' : 'hover:bg-slate-50/60'}>
                    <td className="cc-td">
                      <div className="font-semibold text-slate-900">{member.name}</div>
                    </td>
                    <td className="cc-td">{member.phone || '—'}</td>
                    <td className="cc-td">{member.pixKey || '—'}</td>
                    <td className="cc-td text-center">
                      <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {member.quotasCount} {member.quotasCount === 1 ? 'cota' : 'cotas'}
                      </span>
                    </td>
                    <td className="cc-td text-center">
                      <Badge status={member.status}>
                        {member.status === 'ACTIVE'
                          ? 'Ativo'
                          : member.status === 'BLOCKED'
                            ? 'Bloqueado'
                            : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="cc-td">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionButton variant="primary" onClick={() => openEditModal(member)}>
                          Editar
                        </ActionButton>
                        <ActionButton variant="warning" onClick={() => handleToggleStatus(member)}>
                          {member.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => handleDelete(member)}>
                          Remover
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={closeModals} title="Adicionar cotista">
          <form onSubmit={handleCreate} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              label="Nome"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
              placeholder="Nome completo"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />

            <Input
              label="Chave Pix"
              value={formData.pixKey}
              onChange={(event) => setFormData({ ...formData, pixKey: event.target.value })}
              placeholder="Email, telefone, CPF ou chave aleatória"
            />

            <Input
              label={`Quantidade de cotas (máx: ${cashGroup.maxQuotasPerMember})`}
              type="number"
              min="1"
              max={cashGroup.maxQuotasPerMember}
              value={formData.quotasCount}
              onChange={(event) =>
                setFormData({ ...formData, quotasCount: parseInt(event.target.value, 10) || 1 })
              }
              required
            />

            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              Valor mensal estimado: R$ {(parseFloat(cashGroup.quotaValue) * formData.quotasCount).toFixed(2)}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={closeModals} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Adicionar
              </Button>
            </div>
          </form>
        </Modal>

        <Modal isOpen={isEditModalOpen} onClose={closeModals} title="Editar cotista">
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              label="Nome"
              value={formData.name}
              onChange={(event) => setFormData({ ...formData, name: event.target.value })}
              required
              placeholder="Nome completo"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />

            <Input
              label="Chave Pix"
              value={formData.pixKey}
              onChange={(event) => setFormData({ ...formData, pixKey: event.target.value })}
              placeholder="Email, telefone, CPF ou chave aleatória"
            />

            <Input
              label={`Quantidade de cotas (máx: ${cashGroup.maxQuotasPerMember})`}
              type="number"
              min="1"
              max={cashGroup.maxQuotasPerMember}
              value={formData.quotasCount}
              onChange={(event) =>
                setFormData({ ...formData, quotasCount: parseInt(event.target.value, 10) || 1 })
              }
              required
            />

            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              Valor mensal estimado: R$ {(parseFloat(cashGroup.quotaValue) * formData.quotasCount).toFixed(2)}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={closeModals} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Salvar
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
