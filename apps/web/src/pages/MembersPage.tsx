import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BackButton } from '../components/ui/BackButton';
import { cashGroupsApi } from '../features/cash-groups/api';
import { membersApi } from '../features/members/api';
import type { CashGroup } from '../features/cash-groups/types';
import type { Member, CreateMemberData, UpdateMemberData } from '../features/members/types';

export function MembersPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();
  
  const [cashGroup, setCashGroup] = useState<CashGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states
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
      console.log('Carregando caixinha:', cashGroupId);
      
      const [groupData, membersData] = await Promise.all([
        cashGroupsApi.getOne(cashGroupId),
        membersApi.getAll(cashGroupId),
      ]);
      
      console.log('Dados carregados:', { groupData, membersData });
      setCashGroup(groupData);
      setMembers(membersData);
    } catch (err: any) {
      console.error('Erro ao carregar:', err);
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

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
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

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
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
    if (!confirm(`Tem certeza que deseja remover ${member.name}?`)) return;

    try {
      await membersApi.delete(member.id);
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao remover cotista');
    }
  }

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const totalQuotas = activeMembers.reduce((sum, m) => sum + m.quotasCount, 0);
  const totalMonthly = cashGroup
    ? parseFloat(cashGroup.quotaValue) * totalQuotas
    : 0;

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Carregando...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  if (!isLoading && !cashGroup) {
    return (
      <AuthenticatedLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-lg font-semibold text-slate-900 mb-2">
            Caixinha não encontrada
          </div>
          {error && (
            <div className="text-sm text-red-600 mb-4">{error}</div>
          )}
          <BackButton to="/caixinhas" label="Voltar para Caixinhas" />
        </div>
      </AuthenticatedLayout>
    );
  }

  // TypeScript guard - se chegou aqui, cashGroup existe
  if (!cashGroup) {
    return null;
  }

  return (
    <AuthenticatedLayout>
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/caixinhas" label="Voltar para Caixinhas" />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                {cashGroup.name}
              </h1>
              <p className="mt-2 text-slate-600">
                Ano {cashGroup.cycleYear} • Cota R$ {cashGroup.quotaValue} •
                Vencimento dia {cashGroup.dueDay}
              </p>
            </div>
            <Button onClick={openCreateModal}>Adicionar Cotista</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <div className="text-sm font-medium text-blue-900">
              Total de Cotistas
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-900">
              {activeMembers.length}
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6">
            <div className="text-sm font-medium text-purple-900">
              Total de Cotas
            </div>
            <div className="mt-2 text-3xl font-bold text-purple-900">
              {totalQuotas}
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6">
            <div className="text-sm font-medium text-green-900">
              Arrecadação Mensal
            </div>
            <div className="mt-2 text-3xl font-bold text-green-900">
              R$ {totalMonthly.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <div className="mx-auto max-w-sm">
              <div className="text-5xl">👥</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Nenhum cotista cadastrado
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Adicione cotistas para começar a gerenciar as cotas desta
                caixinha.
              </p>
              <Button onClick={openCreateModal} className="mt-6">
                Adicionar Primeiro Cotista
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Telefone
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">
                    Chave Pix
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Cotas
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-slate-900">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {members.map((member) => (
                  <tr
                    key={member.id}
                    className={
                      member.status !== 'ACTIVE' ? 'bg-slate-50 opacity-60' : ''
                    }
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.phone || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {member.pixKey || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-900">
                        {member.quotasCount}{' '}
                        {member.quotasCount === 1 ? 'cota' : 'cotas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          member.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {member.status === 'ACTIVE'
                          ? 'Ativo'
                          : member.status === 'BLOCKED'
                            ? 'Bloqueado'
                            : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(member)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleToggleStatus(member)}
                          className="text-sm font-medium text-amber-600 hover:text-amber-800"
                        >
                          {member.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          title="Adicionar Cotista"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Nome *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Nome completo"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
            />

            <Input
              label="Chave Pix"
              value={formData.pixKey}
              onChange={(e) =>
                setFormData({ ...formData, pixKey: e.target.value })
              }
              placeholder="Email, telefone, CPF ou chave aleatória"
            />

            <Input
              label={`Quantidade de Cotas * (máx: ${cashGroup.maxQuotasPerMember})`}
              type="number"
              min="1"
              max={cashGroup.maxQuotasPerMember}
              value={formData.quotasCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quotasCount: parseInt(e.target.value) || 1,
                })
              }
              required
            />

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <strong>Valor mensal:</strong> R${' '}
              {(parseFloat(cashGroup.quotaValue) * formData.quotasCount).toFixed(
                2,
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModals}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Adicionar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={closeModals}
          title="Editar Cotista"
        >
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <Input
              label="Nome *"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              placeholder="Nome completo"
            />

            <Input
              label="Telefone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
            />

            <Input
              label="Chave Pix"
              value={formData.pixKey}
              onChange={(e) =>
                setFormData({ ...formData, pixKey: e.target.value })
              }
              placeholder="Email, telefone, CPF ou chave aleatória"
            />

            <Input
              label={`Quantidade de Cotas * (máx: ${cashGroup.maxQuotasPerMember})`}
              type="number"
              min="1"
              max={cashGroup.maxQuotasPerMember}
              value={formData.quotasCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quotasCount: parseInt(e.target.value) || 1,
                })
              }
              required
            />

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <strong>Valor mensal:</strong> R${' '}
              {(parseFloat(cashGroup.quotaValue) * formData.quotasCount).toFixed(
                2,
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeModals}
                className="flex-1"
              >
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
