import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { MemberPortalLayout } from '../components/layout/MemberPortalLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { StatCard } from '../components/ui/StatCard';
import { authApi } from '../features/auth/api';
import { memberPortalApi } from '../features/member-portal/api';
import type {
  PortalMember,
  PortalDebts,
  PortalCharge,
  PortalLoan,
  UpdateProfileData,
  PortalPaymentRequest,
  ReceivingMethod,
  SubmitPaymentRequestData,
  PixStartResponse,
} from '../features/member-portal/types';

const MONTH_NAMES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: 'Aguardando análise',
  AUTO_MATCHED: 'Pré-validado',
  NEEDS_MANUAL_REVIEW: 'Conferência manual',
  MISMATCH: 'Divergência encontrada',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rejeitado',
  CANCELED: 'Cancelado',
};

const CHARGE_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Em atraso',
  PARTIAL: 'Parcial',
  CANCELED: 'Cancelado',
};

const LOAN_STATUS_LABEL: Record<string, string> = {
  OPEN: 'Em aberto',
  PARTIAL: 'Parcial',
  PAID: 'Pago',
  CANCELED: 'Cancelado',
};

function maskPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 11).replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3').replace(/^(\d{2})(\d{4,5})/, '($1) $2');
}
function maskCpf(value: string) {
  return value.replace(/\D/g, '').slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4').replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3').replace(/(\d{3})(\d{3})/, '$1.$2');
}

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'REJECTED' || status === 'MISMATCH') return 'danger';
  if (status === 'PENDING_REVIEW' || status === 'AUTO_MATCHED' || status === 'NEEDS_MANUAL_REVIEW') return 'warning';
  return 'neutral';
}

export function MemberPortalPage() {
  const [member, setMember] = useState<PortalMember | null>(null);
  const [debts, setDebts] = useState<PortalDebts | null>(null);
  const [recentCharges, setRecentCharges] = useState<PortalCharge[]>([]);
  const [recentLoans, setRecentLoans] = useState<PortalLoan[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PortalPaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile editing
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState<UpdateProfileData>({});
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Change password
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Payment request
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<
    | { type: 'MONTHLY_CHARGE'; charge: PortalCharge }
    | { type: 'LOAN'; loan: PortalLoan }
    | { type: 'QUOTA_DECLARE' }
    | null
  >(null);
  const [payMethod, setPayMethod] = useState<ReceivingMethod>('PIX');
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [payRefMonth, setPayRefMonth] = useState(new Date().getMonth() + 1);
  const [payRefYear, setPayRefYear] = useState(new Date().getFullYear());
  const [receiptFile, setReceiptFile] = useState<{ name: string; mimeType: string; dataUrl: string } | null>(null);
  const [pixSession, setPixSession] = useState<PixStartResponse | null>(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [payError, setPayError] = useState('');
  const [paySuccess, setPaySuccess] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      setError('');
      const [memberData, debtsData, chargesData, loansData, reqData] =
        await Promise.all([
          memberPortalApi.getMe(),
          memberPortalApi.getDebts(),
          memberPortalApi.getCharges(),
          memberPortalApi.getLoans(),
          memberPortalApi.getPaymentRequests(),
        ]);
      setMember(memberData);
      setDebts(debtsData);
      setRecentCharges(chargesData.slice(0, 6));
      setRecentLoans(loansData.slice(0, 5));
      setPaymentRequests(reqData.slice(0, 10));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  }

  function openEditProfile() {
    if (!member) return;
    setProfileData({
      name: member.name,
      cpf: member.cpf || '',
      phone: member.phone ?? '',
      pixKey: member.pixKey || '',
      bankInstitution: member.bankInstitution || '',
      bankAccountHolder: member.bankAccountHolder || '',
    });
    setProfileError('');
    setProfileSuccess('');
    setIsEditProfileOpen(true);
  }

  async function handleUpdateProfile(e: FormEvent) {
    e.preventDefault();
    setIsSubmittingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await memberPortalApi.updateMe(profileData);
      setProfileSuccess('Alteração enviada! Aguarde a aprovação do administrador.');
      await loadData();
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Erro ao enviar alteração');
    } finally {
      setIsSubmittingProfile(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setIsSubmittingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setIsSubmittingPassword(false);
    }
  }

  function openPayModal(
    target:
      | { type: 'MONTHLY_CHARGE'; charge: PortalCharge }
      | { type: 'LOAN'; loan: PortalLoan }
      | { type: 'QUOTA_DECLARE' },
  ) {
    setPayTarget(target);
    setPayMethod('PIX');
    setPayNotes('');
    setReceiptFile(null);
    setPixSession(null);
    setCopyFeedback('');
    setPayError('');
    setPaySuccess('');

    if (target.type === 'MONTHLY_CHARGE') {
      const remaining =
        parseFloat(target.charge.amountDue) - parseFloat(target.charge.amountPaid);
      setPayAmount(remaining.toFixed(2));
    } else if (target.type === 'LOAN') {
      const remaining =
        parseFloat(target.loan.totalDue) - parseFloat(target.loan.amountPaid);
      setPayAmount(remaining.toFixed(2));
    } else {
      setPayAmount('');
      setPayRefMonth(new Date().getMonth() + 1);
      setPayRefYear(new Date().getFullYear());
    }

    setIsPayModalOpen(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setPayError('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFile({
        name: file.name,
        mimeType: file.type,
        dataUrl: reader.result as string,
      });
      setPayError('');
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmitPayment(e: FormEvent) {
    e.preventDefault();
    setPayError('');
    setPaySuccess('');

    if (!payTarget) return;

    const amount = parseFloat(payAmount.replace(',', '.'));
    if (!amount || amount <= 0) {
      setPayError('Informe um valor válido.');
      return;
    }

    setIsSubmittingPay(true);
    try {
      if (payMethod === 'PIX' && payTarget.type !== 'QUOTA_DECLARE') {
        if (!pixSession) {
          const result =
            payTarget.type === 'MONTHLY_CHARGE'
              ? await memberPortalApi.startChargePixPayment(payTarget.charge.id, {
                  method: 'PIX',
                })
              : await memberPortalApi.startLoanPixPayment(payTarget.loan.id, {
                  method: 'PIX',
                });

          setPixSession(result);
          setPayAmount(result.paymentRequest.amount.toFixed(2));
          return;
        }

        if (!receiptFile) {
          setPayError('Pagamento via Pix exige o comprovante anexado.');
          return;
        }

        const result = await memberPortalApi.attachPaymentReceipt(
          pixSession.paymentRequest.id,
          {
            receiptFileName: receiptFile.name,
            receiptMimeType: receiptFile.mimeType,
            receiptDataUrl: receiptFile.dataUrl,
          },
        );
        setPaySuccess(result.message);
        await loadData();
        return;
      }

      if (payMethod === 'PIX' && !receiptFile) {
        setPayError('Pagamento via Pix exige o comprovante anexado.');
        return;
      }

      const data: SubmitPaymentRequestData = {
        type: payTarget.type === 'QUOTA_DECLARE' ? 'MONTHLY_CHARGE' : payTarget.type,
        method: payMethod,
        amountDeclared: amount,
        notes: payTarget.type === 'QUOTA_DECLARE'
          ? `Cota ${MONTH_NAMES[payRefMonth]}/${payRefYear}${payNotes ? ' — ' + payNotes : ''}`
          : payNotes || undefined,
        receiptFileName: receiptFile?.name,
        receiptMimeType: receiptFile?.mimeType,
        receiptDataUrl: receiptFile?.dataUrl,
      };

      if (payTarget.type === 'MONTHLY_CHARGE') {
        data.monthlyChargeId = payTarget.charge.id;
      } else if (payTarget.type === 'LOAN') {
        data.loanId = payTarget.loan.id;
      }
      // QUOTA_DECLARE: sem monthlyChargeId — gestor faz a vinculação manual

      const result = await memberPortalApi.submitPaymentRequest(data);
      setPaySuccess(result.message);
      await loadData();
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Erro ao enviar solicitação');
    } finally {
      setIsSubmittingPay(false);
    }
  }

  async function handleCopyPixCode() {
    if (!pixSession?.pix.copyPasteCode) return;

    await navigator.clipboard.writeText(pixSession.pix.copyPasteCode);
    setCopyFeedback('Código Pix copiado.');
    setTimeout(() => setCopyFeedback(''), 2000);
  }

  if (isLoading) {
    return (
      <MemberPortalLayout>
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      </MemberPortalLayout>
    );
  }

  if (error) {
    return (
      <MemberPortalLayout>
        <Alert variant="error">{error}</Alert>
      </MemberPortalLayout>
    );
  }

  if (!member) return null;

  const pendingPayRequests = paymentRequests.filter(
    (r) => r.status === 'PENDING_REVIEW' || r.status === 'AUTO_MATCHED' || r.status === 'NEEDS_MANUAL_REVIEW',
  );

  const cashGroup = member.cashGroup as any;
  const pixAvailableForTarget =
    payTarget?.type === 'MONTHLY_CHARGE'
      ? Boolean(cashGroup.receivingPixEnabledForCharges)
      : payTarget?.type === 'LOAN'
        ? Boolean(cashGroup.receivingPixEnabledForLoans)
        : Boolean(cashGroup.receivingPixEnabledForCharges);

  return (
    <MemberPortalLayout>
      <div className="space-y-8">
        {/* Header do cotista */}
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Bem-vindo
            </p>
            <h2 className="text-2xl font-extrabold text-slate-950">
              {member.name}
            </h2>
            <p className="text-sm text-slate-500">
              {member.cashGroup.name} · Ano {member.cashGroup.cycleYear} ·{' '}
              {member.quotasCount}{' '}
              {member.quotasCount === 1 ? 'cota' : 'cotas'} · Vencimento dia{' '}
              {member.cashGroup.dueDay}
            </p>
          </div>
        </div>

        {/* Resumo de pendências */}
        {debts && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              tone={parseFloat(debts.summary.totalDebt) > 0 ? 'danger' : 'success'}
              value={`R$ ${debts.summary.totalDebt}`}
              label="Total em aberto"
            />
            <StatCard
              tone={debts.summary.pendingChargesCount > 0 ? 'warning' : 'success'}
              value={debts.summary.pendingChargesCount}
              label="Cobranças pendentes"
            />
            <StatCard
              tone={debts.summary.pendingLoansCount > 0 ? 'warning' : 'success'}
              value={debts.summary.pendingLoansCount}
              label="Empréstimos em aberto"
            />
          </div>
        )}

        {/* Aviso de solicitações pendentes */}
        {pendingPayRequests.length > 0 && (
          <Alert variant="warning">
            Você tem {pendingPayRequests.length} solicitação(ões) de pagamento aguardando confirmação do gestor.
          </Alert>
        )}

        {/* Cobranças recentes */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Minhas cobranças</h3>
          {recentCharges.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma cobrança encontrada.</p>
          ) : (
            <div className="cc-table-shell overflow-x-auto">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th className="cc-th">Referência</th>
                    <th className="cc-th text-right">Valor</th>
                    <th className="cc-th text-right">Pago</th>
                    <th className="cc-th text-center">Status</th>
                    <th className="cc-th">Vencimento</th>
                    <th className="cc-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCharges.map((charge) => {
                    const hasPending = paymentRequests.some(
                      (r) =>
                        r.monthlyCharge?.referenceMonth === charge.referenceMonth &&
                        r.monthlyCharge?.referenceYear === charge.referenceYear &&
                        (r.status === 'PENDING_REVIEW' || r.status === 'AUTO_MATCHED' || r.status === 'NEEDS_MANUAL_REVIEW'),
                    );
                    const canPay = charge.status !== 'PAID' && charge.status !== 'CANCELED' && !hasPending;

                    return (
                      <tr key={charge.id} className="hover:bg-slate-50/60">
                        <td className="cc-td font-semibold">
                          {MONTH_NAMES[charge.referenceMonth]}/{charge.referenceYear}
                        </td>
                        <td className="cc-td text-right">
                          R$ {parseFloat(charge.amountDue).toFixed(2)}
                        </td>
                        <td className="cc-td text-right">
                          R$ {parseFloat(charge.amountPaid).toFixed(2)}
                        </td>
                        <td className="cc-td text-center">
                          <Badge
                            status={
                              charge.status === 'PAID'
                                ? 'ACTIVE'
                                : charge.status === 'OVERDUE'
                                  ? 'BLOCKED'
                                  : 'INACTIVE'
                            }
                          >
                            {CHARGE_STATUS_LABEL[charge.status] ?? charge.status}
                          </Badge>
                        </td>
                        <td className="cc-td text-sm text-slate-500">
                          {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="cc-td">
                          {hasPending ? (
                            <span className="text-xs text-amber-600 font-medium">Aguardando gestor</span>
                          ) : canPay ? (
                            <Button
                              variant="secondary"
                              className="text-xs py-1 px-3"
                              onClick={() => openPayModal({ type: 'MONTHLY_CHARGE', charge })}
                            >
                              Pagar cota
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Empréstimos */}
        {recentLoans.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Meus empréstimos</h3>
            <div className="cc-table-shell overflow-x-auto">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th className="cc-th">Data</th>
                    <th className="cc-th text-right">Principal</th>
                    <th className="cc-th text-right">Total</th>
                    <th className="cc-th text-right">Pago</th>
                    <th className="cc-th text-center">Status</th>
                    <th className="cc-th"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentLoans.map((loan) => {
                    const hasPending = paymentRequests.some(
                      (r) =>
                        r.loan?.id === loan.id &&
                        r.type === 'LOAN' &&
                        (r.status === 'PENDING_REVIEW' || r.status === 'AUTO_MATCHED' || r.status === 'NEEDS_MANUAL_REVIEW'),
                    );
                    const canPay = loan.status !== 'PAID' && loan.status !== 'CANCELED' && !hasPending;

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/60">
                        <td className="cc-td text-sm text-slate-500">
                          {new Date(loan.grantedAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="cc-td text-right">
                          R$ {parseFloat(loan.principalAmount).toFixed(2)}
                        </td>
                        <td className="cc-td text-right">
                          R$ {parseFloat(loan.totalDue).toFixed(2)}
                        </td>
                        <td className="cc-td text-right">
                          R$ {parseFloat(loan.amountPaid).toFixed(2)}
                        </td>
                        <td className="cc-td text-center">
                          <Badge
                            status={
                              loan.status === 'PAID'
                                ? 'ACTIVE'
                                : loan.status === 'OPEN' || loan.status === 'PARTIAL'
                                  ? 'BLOCKED'
                                  : 'INACTIVE'
                            }
                          >
                            {LOAN_STATUS_LABEL[loan.status] ?? loan.status}
                          </Badge>
                        </td>
                        <td className="cc-td">
                          {hasPending ? (
                            <span className="text-xs text-amber-600 font-medium">Aguardando gestor</span>
                          ) : canPay ? (
                            <Button
                              variant="secondary"
                              className="text-xs py-1 px-3"
                              onClick={() => openPayModal({ type: 'LOAN', loan })}
                            >
                              Pagar empréstimo
                            </Button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Minhas solicitações de pagamento */}
        {paymentRequests.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Minhas solicitações de pagamento</h3>
            <div className="space-y-3">
              {paymentRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.type === 'MONTHLY_CHARGE' && req.monthlyCharge
                          ? `Cota ${MONTH_NAMES[req.monthlyCharge.referenceMonth]}/${req.monthlyCharge.referenceYear}`
                          : 'Empréstimo'}
                        {' · '}
                        {req.method === 'PIX' ? 'Pix' : req.method === 'CASH' ? 'Dinheiro' : 'Outro'}
                        {' · '}
                        R$ {parseFloat(req.amountDeclared).toFixed(2)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {new Date(req.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                      {req.reviewNotes && (
                        <p className="mt-1 text-xs text-slate-500 italic">{req.reviewNotes}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        statusTone(req.status) === 'success'
                          ? 'bg-green-100 text-green-800'
                          : statusTone(req.status) === 'danger'
                            ? 'bg-red-100 text-red-800'
                            : statusTone(req.status) === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {STATUS_LABEL[req.status] ?? req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Caixinha */}
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm">
          <h3 className="mb-3 text-lg font-bold text-slate-900">Minha caixinha</h3>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Caixinha</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{member.cashGroup.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Ano</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{member.cashGroup.cycleYear}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor da cota</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                R$ {parseFloat(member.cashGroup.quotaValue).toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Minhas cotas</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">{member.quotasCount}</dd>
            </div>
          </dl>

          {/* Informações de pagamento da caixinha */}
          {(cashGroup.receivingPixKey || cashGroup.receivingInstructions) && (
            <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Como pagar</p>
              {cashGroup.receivingPixKey && (
                <p className="text-sm text-slate-700">
                  <span className="font-medium">Chave Pix:</span> {cashGroup.receivingPixKey}
                  {cashGroup.receivingPixKeyHolder && (
                    <span className="ml-1 text-slate-500">({cashGroup.receivingPixKeyHolder})</span>
                  )}
                </p>
              )}
              {cashGroup.receivingInstructions && (
                <p className="text-sm text-slate-700 whitespace-pre-line">{cashGroup.receivingInstructions}</p>
              )}
            </div>
          )}
        </div>

        {/* Meu Perfil */}
        <div className="rounded-2xl border border-white/70 bg-white/80 px-6 py-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Meu perfil</h3>
            <Button variant="secondary" onClick={openEditProfile} className="text-sm">
              Editar
            </Button>
          </div>

          {member.pendingProfileChange && (
            <Alert variant="warning">
              Você tem uma alteração pendente de aprovação desde{' '}
              {new Date(member.pendingProfileChange.createdAt).toLocaleDateString('pt-BR')}.
            </Alert>
          )}

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: 'Nome', value: member.name },
              { label: 'Telefone', value: member.phone },
              { label: 'CPF', value: member.cpf || '—' },
              { label: 'Chave Pix', value: member.pixKey || '—' },
              { label: 'Instituição bancária', value: member.bankInstitution || '—' },
              { label: 'Titular da conta', value: member.bankAccountHolder || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="border-t border-slate-100 pt-4">
            <Button
              variant="secondary"
              onClick={() => { setIsChangePasswordOpen(true); setPasswordError(''); setPasswordSuccess(''); }}
              className="text-sm"
            >
              Alterar senha
            </Button>
          </div>
        </div>

        {/* Modal: Informar pagamento */}
        <Modal
          isOpen={isPayModalOpen}
          onClose={() => { if (!isSubmittingPay) setIsPayModalOpen(false); }}
          title={
            payTarget?.type === 'LOAN'
              ? 'Informar pagamento de empréstimo'
              : payTarget?.type === 'QUOTA_DECLARE'
                ? 'Declarar pagamento de cota'
                : 'Informar pagamento de cota'
          }
        >
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            {payError && <Alert variant="error">{payError}</Alert>}
            {paySuccess ? (
              <div className="space-y-4">
                <Alert variant="success">{paySuccess}</Alert>
                <Button onClick={() => setIsPayModalOpen(false)} className="w-full">
                  Fechar
                </Button>
              </div>
            ) : (
              <>
                {/* Forma de pagamento */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Forma de pagamento
                  </label>
                  <div className="flex gap-3">
                    {(['PIX', 'CASH', 'OTHER'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setPayMethod(m);
                          setReceiptFile(null);
                          setPixSession(null);
                          setCopyFeedback('');
                        }}
                        disabled={m === 'PIX' && !pixAvailableForTarget}
                        className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition ${
                          payMethod === m
                            ? 'border-teal-600 bg-teal-50 text-teal-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                        } ${m === 'PIX' && !pixAvailableForTarget ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        {m === 'PIX' ? 'Pix' : m === 'CASH' ? 'Dinheiro' : 'Outro'}
                      </button>
                    ))}
                  </div>
                  {!pixAvailableForTarget && (
                    <p className="text-xs text-slate-500">
                      Pix não está habilitado para este tipo de pagamento nesta caixinha.
                    </p>
                  )}
                </div>

                {/* Instruções de pagamento */}
                {payMethod === 'PIX' && pixSession?.pix.copyPasteCode && (
                  <div className="space-y-4 rounded-xl border border-teal-100 bg-teal-50 px-4 py-4 text-sm">
                    <div>
                      <p className="font-semibold text-teal-700">QR Code Pix</p>
                      <p className="mt-1 text-slate-600">
                        Pague no app do seu banco e depois envie o comprovante.
                      </p>
                    </div>
                    <div className="flex justify-center rounded-xl bg-white p-4">
                      <QRCodeSVG value={pixSession.pix.copyPasteCode} size={208} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Recebedor
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {pixSession.pix.receiverName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {pixSession.pix.receiverCity}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Chave Pix
                        </p>
                        <p className="mt-1 break-all font-mono text-xs text-slate-800">
                          {pixSession.pix.pixKey}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Pix copia e cola
                      </p>
                      <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2">
                        <p className="break-all font-mono text-xs text-slate-800">
                          {pixSession.pix.copyPasteCode}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={handleCopyPixCode}
                        >
                          Copiar código Pix
                        </Button>
                        {copyFeedback && (
                          <p className="self-center text-xs font-medium text-teal-700">
                            {copyFeedback}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {payMethod === 'PIX' && !pixSession && cashGroup?.receivingPixKey && pixAvailableForTarget && (
                  <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm">
                    <p className="font-semibold text-teal-700">Pix pronto para gerar</p>
                    <p className="mt-1 text-slate-700">
                      O valor do Pix será definido pelo backend com base no saldo pendente.
                    </p>
                    <p className="mt-2 font-mono text-slate-800">{cashGroup.receivingPixKey}</p>
                    {cashGroup.receivingPixKeyHolder && (
                      <p className="mt-0.5 text-slate-500">Favorecido: {cashGroup.receivingPixKeyHolder}</p>
                    )}
                  </div>
                )}

                {payMethod === 'CASH' && cashGroup?.receivingInstructions && (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold">Instruções:</p>
                    <p className="mt-1 whitespace-pre-line">{cashGroup.receivingInstructions}</p>
                  </div>
                )}

                {/* Mês/Ano de referência (apenas para declaração livre de cota) */}
                {payTarget?.type === 'QUOTA_DECLARE' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-sm font-semibold text-slate-700">Mês</label>
                      <select
                        value={payRefMonth}
                        onChange={(e) => setPayRefMonth(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none"
                      >
                        {MONTH_NAMES.slice(1).map((m, i) => (
                          <option key={i + 1} value={i + 1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      label="Ano"
                      type="number"
                      value={payRefYear}
                      onChange={(e) => setPayRefYear(Number(e.target.value))}
                      min={2020}
                      max={2099}
                    />
                  </div>
                )}

                {/* Valor */}
                <Input
                  label={
                    payTarget?.type === 'MONTHLY_CHARGE' && payTarget.charge.status === 'OVERDUE'
                      ? 'Valor atualizado para pagamento (R$)'
                      : payTarget?.type === 'MONTHLY_CHARGE' &&
                          payTarget.charge.status === 'PARTIAL'
                        ? 'Saldo restante (R$)'
                        : payTarget?.type === 'LOAN'
                          ? 'Saldo a pagar (R$)'
                          : 'Valor declarado (R$)'
                  }
                  type="text"
                  inputMode="decimal"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder="0,00"
                  required
                  readOnly={payMethod === 'PIX' && payTarget?.type !== 'QUOTA_DECLARE'}
                />

                {/* Comprovante */}
                {payMethod === 'PIX' && payTarget?.type !== 'QUOTA_DECLARE' && !pixSession ? (
                  <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    Gere o Pix primeiro. Depois que pagar no banco, anexe o comprovante para conferência.
                  </div>
                ) : payMethod === 'PIX' ? (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Comprovante Pix <span className="text-red-500">*</span>
                    </label>
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-6 hover:border-teal-400 hover:bg-teal-50 transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {receiptFile ? (
                        <p className="text-sm font-medium text-teal-700">{receiptFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-slate-500">Clique para selecionar o comprovante</p>
                          <p className="mt-1 text-xs text-slate-400">PNG, JPG ou PDF · máx. 5 MB</p>
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-amber-600">
                      O comprovante é obrigatório para pagamentos via Pix.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-sm font-semibold text-slate-700">
                      Comprovante (opcional)
                    </label>
                    <div
                      className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-4 hover:border-slate-400 transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {receiptFile ? (
                        <p className="text-sm font-medium text-teal-700">{receiptFile.name}</p>
                      ) : (
                        <p className="text-sm text-slate-500">Clique para anexar comprovante (opcional)</p>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* Observação */}
                <div className="space-y-1">
                  <label className="block text-sm font-semibold text-slate-700">
                    Observação (opcional)
                  </label>
                  <textarea
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="Ex: paguei hoje às 10h, chave CPF..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsPayModalOpen(false)}
                    className="flex-1"
                    disabled={isSubmittingPay}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={isSubmittingPay} className="flex-1">
                    {payMethod === 'PIX' && payTarget?.type !== 'QUOTA_DECLARE'
                      ? pixSession
                        ? 'Enviar comprovante para conferência'
                        : 'Gerar Pix'
                      : payMethod === 'PIX'
                        ? 'Enviei o Pix'
                        : 'Informar pagamento'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Modal>

        {/* Modal: Editar perfil */}
        <Modal isOpen={isEditProfileOpen} onClose={() => setIsEditProfileOpen(false)} title="Editar meu perfil">
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileError && <Alert variant="error">{profileError}</Alert>}
            {profileSuccess && <Alert variant="success">{profileSuccess}</Alert>}

            <p className="text-sm text-slate-500">
              As alterações serão enviadas ao administrador para aprovação antes de serem aplicadas.
            </p>

            <Input
              label="Nome"
              value={profileData.name || ''}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              placeholder="Nome completo"
            />

            <Input
              label="Telefone"
              type="tel"
              value={profileData.phone || ''}
              onChange={(e) => setProfileData({ ...profileData, phone: maskPhone(e.target.value) })}
              placeholder="(00) 00000-0000"
              maxLength={15}
            />

            <div className="space-y-1">
              <Input
                label="CPF (opcional)"
                value={profileData.cpf || ''}
                onChange={(e) => setProfileData({ ...profileData, cpf: maskCpf(e.target.value) })}
                placeholder="000.000.000-00"
                maxLength={14}
              />
              <p className="text-xs text-slate-500">
                Não é obrigatório, mas é recomendado para evitar homonímia.
              </p>
            </div>

            <div className="space-y-1">
              <Input
                label="Chave Pix"
                value={profileData.pixKey || ''}
                onChange={(e) => setProfileData({ ...profileData, pixKey: e.target.value })}
                placeholder="Email, telefone, CPF ou chave aleatória"
              />
              <p className="text-xs text-amber-600">
                A chave Pix deve estar no nome do titular da cota. Isso facilita o repasse dos valores.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Instituição bancária"
                value={profileData.bankInstitution || ''}
                onChange={(e) => setProfileData({ ...profileData, bankInstitution: e.target.value })}
                placeholder="Ex: Nubank, Bradesco"
              />
              <Input
                label="Titular da conta"
                value={profileData.bankAccountHolder || ''}
                onChange={(e) => setProfileData({ ...profileData, bankAccountHolder: e.target.value })}
                placeholder="Nome completo do titular"
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsEditProfileOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmittingProfile} className="flex-1">
                Enviar alteração
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Alterar senha */}
        <Modal isOpen={isChangePasswordOpen} onClose={() => setIsChangePasswordOpen(false)} title="Alterar senha">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordError && <Alert variant="error">{passwordError}</Alert>}
            {passwordSuccess && <Alert variant="success">{passwordSuccess}</Alert>}

            <Input
              label="Senha atual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="Sua senha atual"
            />
            <Input
              label="Nova senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar nova senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repita a nova senha"
            />

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setIsChangePasswordOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmittingPassword} className="flex-1">
                Alterar senha
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MemberPortalLayout>
  );
}
