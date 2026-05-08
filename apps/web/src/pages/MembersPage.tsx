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
import { memberAccessApi } from '../features/member-access/api';
import type { CashGroup } from '../features/cash-groups/types';
import type { CreateMemberData, Member, UpdateMemberData } from '../features/members/types';
import type { CreateAccessResult } from '../features/member-access/types';

export function MembersPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();

  // Mask helpers
  function maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
  }

  function maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

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

  // Access management state
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessModalMember, setAccessModalMember] = useState<Member | null>(null);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessResult, setAccessResult] = useState<CreateAccessResult | null>(null);
  const [isSubmittingAccess, setIsSubmittingAccess] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      cpf: '',
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
      cpf: member.cpf || '',
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
    setIsAccessModalOpen(false);
    setAccessModalMember(null);
    setAccessEmail('');
    setAccessResult(null);
    setAccessError('');
    setCopiedField(null);
  }

  function openAccessModal(member: Member) {
    setAccessModalMember(member);
    setAccessEmail('');
    setAccessResult(null);
    setAccessError('');
    setIsAccessModalOpen(true);
  }

  async function handleCreateAccess(event: FormEvent) {
    event.preventDefault();
    if (!accessModalMember || !cashGroupId) return;
    try {
      setIsSubmittingAccess(true);
      setAccessError('');
      const result = await memberAccessApi.createAccess(
        cashGroupId,
        accessModalMember.id,
        accessEmail,
      );
      setAccessResult(result);
      await loadData();
    } catch (err: any) {
      setAccessError(err.response?.data?.message || 'Erro ao criar acesso');
    } finally {
      setIsSubmittingAccess(false);
    }
  }

  async function handleToggleUserAccess(member: Member) {
    if (!cashGroupId || !member.userId) return;
    try {
      if (member.user?.status === 'ACTIVE') {
        await memberAccessApi.blockAccess(cashGroupId, member.id);
      } else {
        await memberAccessApi.activateAccess(cashGroupId, member.id);
      }
      await loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao alterar acesso');
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
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
                  <th className="cc-th text-center">Acesso</th>
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
                    <td className="cc-td text-center">
                      {member.userId ? (
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${member.user?.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
                          {member.user?.status === 'ACTIVE' ? '✓ Ativo' : '⊘ Bloqueado'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                          Sem acesso
                        </span>
                      )}
                    </td>
                    <td className="cc-td">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionButton variant="primary" onClick={() => openEditModal(member)}>
                          Editar
                        </ActionButton>
                        {!member.userId ? (
                          <ActionButton variant="success" onClick={() => openAccessModal(member)}>
                            Criar acesso
                          </ActionButton>
                        ) : (
                          <ActionButton
                            variant={member.user?.status === 'ACTIVE' ? 'warning' : 'success'}
                            onClick={() => handleToggleUserAccess(member)}
                          >
                            {member.user?.status === 'ACTIVE' ? 'Bloquear acesso' : 'Ativar acesso'}
                          </ActionButton>
                        )}
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
              onChange={(event) =>
                setFormData({ ...formData, phone: maskPhone(event.target.value) })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />

            <Input
              label="CPF (opcional)"
              value={formData.cpf || ''}
              onChange={(event) =>
                setFormData({ ...formData, cpf: maskCpf(event.target.value) })
              }
              placeholder="000.000.000-00"
              maxLength={14}
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

            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
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
              onChange={(event) =>
                setFormData({ ...formData, phone: maskPhone(event.target.value) })
              }
              placeholder="(00) 00000-0000"
              maxLength={15}
              required
            />

            <Input
              label="CPF (opcional)"
              value={formData.cpf || ''}
              onChange={(event) =>
                setFormData({ ...formData, cpf: maskCpf(event.target.value) })
              }
              placeholder="000.000.000-00"
              maxLength={14}
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

            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
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

        {/* Modal: Criar acesso do cotista */}
        <Modal
          isOpen={isAccessModalOpen}
          onClose={closeModals}
          title={`Criar acesso — ${accessModalMember?.name}`}
        >
          {!accessResult ? (
            <form onSubmit={handleCreateAccess} className="space-y-4">
              {accessError && <Alert variant="error">{accessError}</Alert>}
              <p className="text-sm text-slate-600">
                O sistema irá gerar uma senha provisória. Você deverá enviá-la
                manualmente ao cotista.
              </p>
              <Input
                label="Email do cotista"
                type="email"
                value={accessEmail}
                onChange={(e) => setAccessEmail(e.target.value)}
                required
                placeholder="cotista@email.com"
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeModals}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmittingAccess}
                  className="flex-1"
                >
                  Criar acesso
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
                ✓ Acesso criado com sucesso!
              </div>
              <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-900">
                <strong>Guarde essa senha.</strong> Ela será exibida apenas agora.
              </div>
              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono">
                      {accessResult.user.email}
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(accessResult.user.email, 'email')}
                      className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-300"
                    >
                      {copiedField === 'email' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Senha provisória
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-slate-100 px-3 py-2 text-sm font-mono tracking-wider">
                      {accessResult.temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(accessResult.temporaryPassword, 'password')
                      }
                      className="rounded-lg bg-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-300"
                    >
                      {copiedField === 'password' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(
                      `Email: ${accessResult.user.email}\nSenha: ${accessResult.temporaryPassword}\nAcesso: https://cotacerta.gardenwjs.tech`,
                      'all',
                    )
                  }
                  className="w-full rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
                >
                  {copiedField === 'all' ? '✓ Credenciais copiadas!' : 'Copiar todas as credenciais'}
                </button>
              </div>
              <Button onClick={closeModals} variant="secondary" className="w-full">
                Fechar
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
