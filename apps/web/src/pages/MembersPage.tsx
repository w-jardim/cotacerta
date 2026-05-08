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
import type { AdminPaymentRequest, CashGroup } from '../features/cash-groups/types';
import type { CreateMemberData, Member, ProfileChangeRequest, UpdateMemberData } from '../features/members/types';
import type { CreateAccessResult } from '../features/member-access/types';

const MONTH_NAMES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const PAY_REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: 'Aguardando análise',
  AUTO_MATCHED: 'Pré-validado',
  NEEDS_MANUAL_REVIEW: 'Conferência manual',
  MISMATCH: 'Divergência encontrada',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rejeitado',
  CANCELED: 'Cancelado',
};

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
    bankInstitution: '',
    bankAccountHolder: '',
    quotasCount: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile change requests state
  const [profileChangeRequests, setProfileChangeRequests] = useState<ProfileChangeRequest[]>([]);
  const [isProfileChangesModalOpen, setIsProfileChangesModalOpen] = useState(false);
  const [selectedProfileChange, setSelectedProfileChange] = useState<ProfileChangeRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Payment requests state
  const [paymentRequests, setPaymentRequests] = useState<AdminPaymentRequest[]>([]);
  const [isPayRequestsModalOpen, setIsPayRequestsModalOpen] = useState(false);
  const [selectedPayRequest, setSelectedPayRequest] = useState<AdminPaymentRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isReviewingPay, setIsReviewingPay] = useState(false);
  const [reviewAction, setReviewAction] = useState<'confirm' | 'reject' | null>(null);
  const [reviewPayError, setReviewPayError] = useState('');
  const [showReceiptFor, setShowReceiptFor] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<{
    fileName: string | null;
    mimeType: string | null;
    dataUrl: string;
    memberName: string;
  } | null>(null);

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
      const [groupData, membersData, profileChanges, payReqs] = await Promise.all([
        cashGroupsApi.getOne(cashGroupId),
        membersApi.getAll(cashGroupId),
        membersApi.getProfileChangeRequests().catch(() => []),
        cashGroupsApi.getPaymentRequests(cashGroupId).catch(() => []),
      ]);
      setCashGroup(groupData);
      setMembers(membersData);
      setProfileChangeRequests(profileChanges.filter((r) => r.member.cashGroupId === cashGroupId));
      setPaymentRequests(payReqs);
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
      bankInstitution: '',
      bankAccountHolder: '',
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
      bankInstitution: member.bankInstitution || '',
      bankAccountHolder: member.bankAccountHolder || '',
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
    setIsProfileChangesModalOpen(false);
    setSelectedProfileChange(null);
    setIsRejectModalOpen(false);
    setRejectionReason('');
    setIsPayRequestsModalOpen(false);
    setSelectedPayRequest(null);
    setReviewNotes('');
    setReviewAction(null);
    setReviewPayError('');
    setShowReceiptFor(null);
    setReceiptPreview(null);
  }

  function renderCheckBadge(label: string, value: boolean | null) {
    return (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          value === true
            ? 'bg-green-100 text-green-800'
            : value === false
              ? 'bg-rose-100 text-rose-700'
              : 'bg-slate-100 text-slate-600'
        }`}
      >
        {label}: {value === true ? 'Conferido' : value === false ? 'Atenção' : 'Sem comparação'}
      </span>
    );
  }

  async function handleConfirmPayRequest(req: AdminPaymentRequest) {
    if (!cashGroupId) return;
    setIsReviewingPay(true);
    setReviewPayError('');
    try {
      await cashGroupsApi.confirmPaymentRequest(cashGroupId, req.id, reviewNotes || undefined);
      await loadData();
      closeModals();
    } catch (err: any) {
      setReviewPayError(err.response?.data?.message || 'Erro ao confirmar pagamento');
    } finally {
      setIsReviewingPay(false);
    }
  }

  async function handleRejectPayRequest(req: AdminPaymentRequest) {
    if (!cashGroupId) return;
    setIsReviewingPay(true);
    setReviewPayError('');
    try {
      await cashGroupsApi.rejectPaymentRequest(cashGroupId, req.id, reviewNotes || undefined);
      await loadData();
      closeModals();
    } catch (err: any) {
      setReviewPayError(err.response?.data?.message || 'Erro ao rejeitar solicitação');
    } finally {
      setIsReviewingPay(false);
    }
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
        cpf: formData.cpf || undefined,
        phone: formData.phone || undefined,
        pixKey: formData.pixKey || undefined,
        bankInstitution: formData.bankInstitution || undefined,
        bankAccountHolder: formData.bankAccountHolder || undefined,
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

  async function handleApproveProfileChange(requestId: string) {
    try {
      await membersApi.approveProfileChange(requestId);
      await loadData();
      closeModals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao aprovar alteração');
    }
  }

  async function handleRejectProfileChange(event: FormEvent) {
    event.preventDefault();
    if (!selectedProfileChange) return;
    try {
      await membersApi.rejectProfileChange(selectedProfileChange.id, rejectionReason || undefined);
      await loadData();
      closeModals();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao rejeitar alteração');
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
  const pendingPayRequests = paymentRequests.filter(
    (r) => r.status === 'PENDING_REVIEW' || r.status === 'AUTO_MATCHED' || r.status === 'NEEDS_MANUAL_REVIEW',
  );

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

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard tone="brand" value={activeMembers.length} label="Cotistas ativos" />
          <StatCard tone="success" value={totalQuotas} label="Total de cotas" />
          <StatCard tone="warning" value={`R$ ${totalMonthly.toFixed(2)}`} label="Arrecadação mensal" />
          <StatCard
            tone={pendingPayRequests.length > 0 ? 'danger' : profileChangeRequests.length > 0 ? 'warning' : 'neutral'}
            value={pendingPayRequests.length + profileChangeRequests.length}
            label="Pendências"
          />
        </div>

        {pendingPayRequests.length > 0 && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-teal-800">
                  {pendingPayRequests.length} solicitação{pendingPayRequests.length > 1 ? 'ões' : ''} de pagamento aguardando confirmação
                </p>
                <p className="mt-0.5 text-xs text-teal-700">
                  Cotistas enviaram comprovantes ou informaram pagamentos em dinheiro.
                </p>
              </div>
              <Button onClick={() => setIsPayRequestsModalOpen(true)}>
                Revisar pagamentos
              </Button>
            </div>
          </div>
        )}

        {profileChangeRequests.length > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {profileChangeRequests.length} solicitação{profileChangeRequests.length > 1 ? 'ões' : ''} de alteração de perfil aguardando aprovação
                </p>
                <p className="mt-0.5 text-xs text-amber-700">Cotistas solicitaram atualizar seus dados cadastrais.</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setIsProfileChangesModalOpen(true)}
              >
                Revisar
              </Button>
            </div>
          </div>
        )}

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
                  <th className="cc-th">Contato</th>
                  <th className="cc-th">Dados bancários</th>
                  <th className="cc-th text-center">Cotas</th>
                  <th className="cc-th text-center">Status</th>
                  <th className="cc-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const hasPendingChange = profileChangeRequests.some((r) => r.memberId === member.id);
                  return (
                    <tr key={member.id} className={member.status !== 'ACTIVE' ? 'bg-slate-50/90' : 'hover:bg-slate-50/60'}>
                      {/* Cotista: nome + CPF + badge acesso + badge alteração */}
                      <td className="cc-td min-w-[160px]">
                        <div className="font-semibold text-slate-900">{member.name}</div>
                        {member.cpf && (
                          <div className="text-xs text-slate-400">CPF: {member.cpf}</div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {member.userId ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${member.user?.status === 'ACTIVE' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>
                              {member.user?.status === 'ACTIVE' ? '✓ Acesso ativo' : '⊘ Acesso bloqueado'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Sem acesso
                            </span>
                          )}
                          {hasPendingChange && (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                              ⏳ Alteração pendente
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contato: telefone + chave pix */}
                      <td className="cc-td min-w-[160px]">
                        <div className="text-sm text-slate-700">{member.phone || '—'}</div>
                        {member.pixKey && (
                          <div className="mt-0.5 text-xs text-slate-400">
                            <span className="font-medium text-slate-500">Pix:</span> {member.pixKey}
                          </div>
                        )}
                      </td>

                      {/* Dados bancários: instituição + titular */}
                      <td className="cc-td min-w-[160px]">
                        {member.bankInstitution || member.bankAccountHolder ? (
                          <>
                            {member.bankInstitution && (
                              <div className="text-sm font-medium text-slate-700">{member.bankInstitution}</div>
                            )}
                            {member.bankAccountHolder && (
                              <div className="text-xs text-slate-400">{member.bankAccountHolder}</div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">Não informado</span>
                        )}
                      </td>

                      {/* Cotas */}
                      <td className="cc-td text-center">
                        <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {member.quotasCount} {member.quotasCount === 1 ? 'cota' : 'cotas'}
                        </span>
                      </td>

                      {/* Status do cotista */}
                      <td className="cc-td text-center">
                        <Badge status={member.status}>
                          {member.status === 'ACTIVE' ? 'Ativo' : member.status === 'BLOCKED' ? 'Bloqueado' : 'Inativo'}
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="cc-td">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <ActionButton variant="primary" onClick={() => openEditModal(member)}>
                            Editar
                          </ActionButton>
                          {hasPendingChange && (
                            <ActionButton
                              variant="warning"
                              onClick={() => {
                                const req = profileChangeRequests.find((r) => r.memberId === member.id);
                                if (req) { setSelectedProfileChange(req); setIsProfileChangesModalOpen(true); }
                              }}
                            >
                              Ver alteração
                            </ActionButton>
                          )}
                          {!member.userId ? (
                            <ActionButton variant="success" onClick={() => openAccessModal(member)}>
                              Criar acesso
                            </ActionButton>
                          ) : (
                            <ActionButton
                              variant={member.user?.status === 'ACTIVE' ? 'warning' : 'success'}
                              onClick={() => handleToggleUserAccess(member)}
                            >
                              {member.user?.status === 'ACTIVE' ? 'Bloquear' : 'Ativar'} acesso
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
                  );
                })}
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

            <div className="space-y-1">
              <Input
                label="CPF (opcional)"
                value={formData.cpf || ''}
                onChange={(event) =>
                  setFormData({ ...formData, cpf: maskCpf(event.target.value) })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="text-xs text-slate-500">
                💡 Não é obrigatório, mas é recomendado para evitar homonímia (pessoas com o mesmo nome).
              </p>
            </div>

            <div className="space-y-1">
              <Input
                label="Chave Pix"
                value={formData.pixKey}
                onChange={(event) => setFormData({ ...formData, pixKey: event.target.value })}
                placeholder="Email, telefone, CPF ou chave aleatória"
              />
              <p className="text-xs text-amber-600">
                ⚠️ Cadastre uma chave Pix válida que esteja no nome do titular da cota. Isso facilita a conferência e o repasse dos valores.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Instituição bancária"
                value={formData.bankInstitution || ''}
                onChange={(event) => setFormData({ ...formData, bankInstitution: event.target.value })}
                placeholder="Ex: Nubank, Bradesco, Itaú"
              />
              <Input
                label="Titular da conta"
                value={formData.bankAccountHolder || ''}
                onChange={(event) => setFormData({ ...formData, bankAccountHolder: event.target.value })}
                placeholder="Nome completo do titular"
              />
            </div>

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

            <div className="space-y-1">
              <Input
                label="CPF (opcional)"
                value={formData.cpf || ''}
                onChange={(event) =>
                  setFormData({ ...formData, cpf: maskCpf(event.target.value) })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="text-xs text-slate-500">
                💡 Não é obrigatório, mas é recomendado para evitar homonímia (pessoas com o mesmo nome).
              </p>
            </div>

            <div className="space-y-1">
              <Input
                label="Chave Pix"
                value={formData.pixKey}
                onChange={(event) => setFormData({ ...formData, pixKey: event.target.value })}
                placeholder="Email, telefone, CPF ou chave aleatória"
              />
              <p className="text-xs text-amber-600">
                ⚠️ Cadastre uma chave Pix válida que esteja no nome do titular da cota. Isso facilita a conferência e o repasse dos valores.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Instituição bancária"
                value={formData.bankInstitution || ''}
                onChange={(event) => setFormData({ ...formData, bankInstitution: event.target.value })}
                placeholder="Ex: Nubank, Bradesco, Itaú"
              />
              <Input
                label="Titular da conta"
                value={formData.bankAccountHolder || ''}
                onChange={(event) => setFormData({ ...formData, bankAccountHolder: event.target.value })}
                placeholder="Nome completo do titular"
              />
            </div>

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

        {/* Modal: Aprovar/Rejeitar alterações de perfil */}
        <Modal
          isOpen={isProfileChangesModalOpen && !isRejectModalOpen}
          onClose={closeModals}
          title="Solicitações de alteração de perfil"
        >
          <div className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            {(selectedProfileChange ? [selectedProfileChange] : profileChangeRequests).map((req) => {
              const data = req.requestedData;
              const member = members.find((m) => m.id === req.memberId);
              return (
                <div key={req.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900">{req.member.name}</p>
                      <p className="text-xs text-slate-400">
                        Solicitado em {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(data).map(([key, value]) => {
                      const labels: Record<string, string> = {
                        name: 'Nome',
                        cpf: 'CPF',
                        phone: 'Telefone',
                        pixKey: 'Chave Pix',
                        bankInstitution: 'Instituição bancária',
                        bankAccountHolder: 'Titular da conta',
                      };
                      const currentValue = member ? (member as any)[key] : null;
                      return (
                        <div key={key} className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{labels[key] || key}</p>
                            <p className="text-slate-500 line-through">{currentValue || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-600">Novo valor</p>
                            <p className="font-medium text-slate-900">{value as string || '—'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      onClick={() => handleApproveProfileChange(req.id)}
                      className="flex-1"
                    >
                      ✓ Aprovar
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedProfileChange(req);
                        setIsRejectModalOpen(true);
                      }}
                      className="flex-1"
                    >
                      ✕ Rejeitar
                    </Button>
                  </div>
                </div>
              );
            })}
            <Button variant="secondary" onClick={closeModals} className="w-full">
              Fechar
            </Button>
          </div>
        </Modal>

        {/* Modal: Solicitações de pagamento */}
        <Modal
          isOpen={isPayRequestsModalOpen && !selectedPayRequest}
          onClose={closeModals}
          title="Solicitações de pagamento"
        >
          <div className="space-y-4">
            {paymentRequests.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma solicitação encontrada.</p>
            ) : (
              paymentRequests.map((req) => (
                <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{req.member.name}</p>
                      <p className="text-xs text-slate-400">
                        {req.type === 'MONTHLY_CHARGE' && req.monthlyCharge
                          ? `Cota ${MONTH_NAMES[req.monthlyCharge.referenceMonth]}/${req.monthlyCharge.referenceYear}`
                          : 'Empréstimo'}
                        {' · '}
                        {req.method === 'PIX' ? 'Pix' : req.method === 'CASH' ? 'Dinheiro' : 'Outro'}
                        {' · '}
                        {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      req.status === 'CONFIRMED' ? 'bg-green-100 text-green-800'
                      : req.status === 'REJECTED' ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-800'
                    }`}>
                      {PAY_REQUEST_STATUS_LABEL[req.status] ?? req.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Valor declarado</p>
                      <p className="font-semibold text-slate-900">R$ {parseFloat(req.amountDeclared).toFixed(2)}</p>
                    </div>
                    {req.type === 'MONTHLY_CHARGE' && req.monthlyCharge && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Valor esperado</p>
                        <p className="font-semibold text-slate-900">
                          R$ {(parseFloat(req.monthlyCharge.amountDue) - parseFloat(req.monthlyCharge.amountPaid)).toFixed(2)}
                        </p>
                      </div>
                    )}
                    {req.type === 'LOAN' && req.loan && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Saldo devedor</p>
                        <p className="font-semibold text-slate-900">
                          R$ {(parseFloat(req.loan.totalDue) - parseFloat(req.loan.amountPaid)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>

                  {req.notes && (
                    <p className="text-xs text-slate-500 italic">"{req.notes}"</p>
                  )}

                  {req.pixPayload && (
                    <div className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-3 text-xs text-slate-700">
                      <p className="font-semibold uppercase tracking-wide text-teal-700">
                        Pix vinculado
                      </p>
                      <p className="mt-1">
                        <span className="font-medium">Recebedor:</span>{' '}
                        {req.pixPayload.receiverName} ({req.pixPayload.receiverCity})
                      </p>
                      <p className="mt-1 break-all">
                        <span className="font-medium">Chave:</span>{' '}
                        {req.pixPayload.pixKey}
                      </p>
                      <p className="mt-1 break-all font-mono text-[11px] text-slate-600">
                        {req.pixPayload.copyPasteCode}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700">
                    <p className="font-semibold uppercase tracking-wide text-slate-600">
                      Ajuda para conferência
                    </p>
                    <p className="mt-1 text-slate-600">
                      {req.reviewSummary.recommendation}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {renderCheckBadge(
                        'Valor da cobrança',
                        req.reviewSummary.amountMatchesExpected,
                      )}
                      {renderCheckBadge(
                        'Valor do Pix',
                        req.reviewSummary.pixMatchesDeclared,
                      )}
                      {renderCheckBadge(
                        'Chave Pix',
                        req.reviewSummary.pixKeyMatchesConfigured,
                      )}
                      {renderCheckBadge(
                        'Recebedor',
                        req.reviewSummary.receiverMatchesConfigured,
                      )}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="font-medium text-slate-500">Valor esperado</p>
                        <p className="text-slate-900">
                          {req.reviewSummary.expectedAmount
                            ? `R$ ${req.reviewSummary.expectedAmount}`
                            : 'Não disponível'}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">Valor informado pelo cotista</p>
                        <p className="text-slate-900">
                          R$ {req.reviewSummary.declaredAmount}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium text-slate-500">Valor gerado no Pix</p>
                        <p className="text-slate-900">
                          {req.reviewSummary.pixAmount
                            ? `R$ ${req.reviewSummary.pixAmount}`
                            : 'Não disponível'}
                        </p>
                      </div>
                    </div>
                    {req.reviewSummary.warnings.length > 0 && (
                      <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-2 text-amber-800">
                        {req.reviewSummary.warnings.map((warning) => (
                          <p key={warning}>{warning}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {req.receiptDataUrl && (
                    <div>
                      <div className="flex flex-wrap gap-3 text-xs">
                        <button
                          type="button"
                          className="font-medium text-teal-700 underline"
                          onClick={() =>
                            setShowReceiptFor(showReceiptFor === req.id ? null : req.id)
                          }
                        >
                          {showReceiptFor === req.id
                            ? 'Ocultar comprovante'
                            : 'Ver comprovante'}
                        </button>
                        <button
                          type="button"
                          className="font-medium text-teal-700 underline"
                          onClick={() =>
                            setReceiptPreview({
                              fileName: req.receiptFileName,
                              mimeType: req.receiptMimeType,
                              dataUrl: req.receiptDataUrl!,
                              memberName: req.member.name,
                            })
                          }
                        >
                          Abrir ampliado
                        </button>
                        <a
                          href={req.receiptDataUrl}
                          download={req.receiptFileName || 'comprovante'}
                          className="font-medium text-teal-700 underline"
                        >
                          Baixar comprovante
                        </a>
                      </div>
                      {showReceiptFor === req.id && (
                        req.receiptMimeType?.startsWith('image/') ? (
                          <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50 p-2">
                            <img
                              src={req.receiptDataUrl}
                              alt="Comprovante"
                              className="mx-auto max-h-80 w-full rounded-lg object-contain"
                            />
                          </div>
                        ) : (
                          <a
                            href={req.receiptDataUrl}
                            download={req.receiptFileName || 'comprovante.pdf'}
                            className="mt-2 block text-xs text-teal-700 underline"
                          >
                            Baixar {req.receiptFileName || 'comprovante'}
                          </a>
                        )
                      )}
                    </div>
                  )}

                  {(req.status === 'PENDING_REVIEW' || req.status === 'AUTO_MATCHED' || req.status === 'NEEDS_MANUAL_REVIEW' || req.status === 'MISMATCH') && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <textarea
                        value={selectedPayRequest?.id === req.id ? reviewNotes : ''}
                        onChange={(e) => { setSelectedPayRequest(req); setReviewNotes(e.target.value); }}
                        onFocus={() => setSelectedPayRequest(req)}
                        rows={2}
                        placeholder="Observação do gestor (opcional)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isReviewingPay && selectedPayRequest?.id === req.id && reviewAction === 'confirm'}
                          onClick={() => { setSelectedPayRequest(req); setReviewAction('confirm'); handleConfirmPayRequest(req); }}
                          className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          {isReviewingPay && selectedPayRequest?.id === req.id && reviewAction === 'confirm'
                            ? 'Confirmando...' : 'Confirmar baixa'}
                        </button>
                        <button
                          type="button"
                          disabled={isReviewingPay && selectedPayRequest?.id === req.id && reviewAction === 'reject'}
                          onClick={() => { setSelectedPayRequest(req); setReviewAction('reject'); handleRejectPayRequest(req); }}
                          className="flex-1 rounded-lg border border-rose-300 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {isReviewingPay && selectedPayRequest?.id === req.id && reviewAction === 'reject'
                            ? 'Rejeitando...' : 'Rejeitar'}
                        </button>
                      </div>
                      {reviewPayError && selectedPayRequest?.id === req.id && (
                        <p className="text-xs text-red-600">{reviewPayError}</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
            <Button variant="secondary" onClick={closeModals} className="w-full">
              Fechar
            </Button>
          </div>
        </Modal>

        {/* Modal: Motivo da rejeição */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => { setIsRejectModalOpen(false); setRejectionReason(''); }}
          title="Rejeitar alteração de perfil"
        >
          <form onSubmit={handleRejectProfileChange} className="space-y-4">
            <p className="text-sm text-slate-600">
              Informe o motivo da rejeição para notificar o cotista <strong>{selectedProfileChange?.member.name}</strong>.
            </p>
            <Input
              label="Motivo (opcional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Chave Pix não corresponde ao titular da cota"
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => { setIsRejectModalOpen(false); setRejectionReason(''); }}
                className="flex-1"
              >
                Voltar
              </Button>
              <Button type="submit" variant="secondary" className="flex-1 !border-rose-300 !text-rose-600 hover:!bg-rose-50">
                Confirmar rejeição
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={receiptPreview != null}
          onClose={() => setReceiptPreview(null)}
          title={`Comprovante ampliado${receiptPreview ? ` — ${receiptPreview.memberName}` : ''}`}
        >
          {receiptPreview && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href={receiptPreview.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-teal-700 underline"
                >
                  Abrir em nova aba
                </a>
                <a
                  href={receiptPreview.dataUrl}
                  download={receiptPreview.fileName || 'comprovante'}
                  className="font-medium text-teal-700 underline"
                >
                  Baixar arquivo
                </a>
              </div>

              {receiptPreview.mimeType?.startsWith('image/') ? (
                <div className="max-h-[75vh] overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={receiptPreview.dataUrl}
                    alt="Comprovante ampliado"
                    className="mx-auto h-auto max-w-none rounded-lg"
                  />
                </div>
              ) : (
                <iframe
                  src={receiptPreview.dataUrl}
                  title="Comprovante"
                  className="h-[75vh] w-full rounded-xl border border-slate-200"
                />
              )}
            </div>
          )}
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
