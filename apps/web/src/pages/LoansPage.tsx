import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { StatCard } from '../components/ui/StatCard';
import { Textarea } from '../components/ui/Textarea';
import { cashGroupsApi } from '../features/cash-groups/api';
import type { CashGroup } from '../features/cash-groups/types';
import { loansApi } from '../features/loans/api';
import type {
  CreateLoanData,
  Loan,
  LoanPayment,
  LoanPaymentMethod,
  LoanStatus,
  LoansSummary,
} from '../features/loans/types';
import { membersApi } from '../features/members/api';
import type { Member } from '../features/members/types';

const STATUS_LABELS: Record<LoanStatus, string> = {
  OPEN: 'Aberto',
  PARTIAL: 'Parcial',
  PAID: 'Quitado',
  CANCELED: 'Cancelado',
};

export function LoansPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();
  const [cashGroup, setCashGroup] = useState<CashGroup | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<LoansSummary | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | LoanStatus>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanDetails, setLoanDetails] = useState<Loan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [formData, setFormData] = useState<CreateLoanData>({
    memberId: '',
    principalAmount: 0,
    interestRate: undefined,
    grantedAt: new Date().toISOString().slice(0, 10) + 'T12:00:00.000Z',
    notes: '',
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'PIX' as LoanPaymentMethod,
    paidAt: getTodayDateInputValue(),
    notes: '',
  });

  useEffect(() => {
    if (cashGroupId) {
      loadData();
    }
  }, [cashGroupId, selectedStatus]);

  async function loadData() {
    if (!cashGroupId) return;

    try {
      setIsLoading(true);
      setError('');
      const [groupData, membersData, loansData] = await Promise.all([
        cashGroupsApi.getOne(cashGroupId),
        membersApi.getAll(cashGroupId),
        loansApi.listLoans(cashGroupId, selectedStatus === 'ALL' ? undefined : selectedStatus),
      ]);
      setCashGroup(groupData);
      setMembers(membersData.filter((member) => member.status === 'ACTIVE'));
      setLoans(loansData.items);
      setSummary(loansData.summary);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar empréstimos');
      setCashGroup(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLoanDetails(loanId: string) {
    if (!cashGroupId) return;

    const data = await loansApi.getOne(cashGroupId, loanId);
    setLoanDetails(data);
    const remainingAmount = Math.max(0, parseFloat(data.remainingAmount));
    setPaymentData((current) => ({
      ...current,
      amount: remainingAmount > 0 ? remainingAmount.toFixed(2) : '',
    }));
  }

  function openCreateModal() {
    setFormData({
      memberId: members[0]?.id || '',
      principalAmount: 0,
      interestRate: undefined,
      grantedAt: new Date().toISOString().slice(0, 10) + 'T12:00:00.000Z',
      notes: '',
    });
    setIsCreateModalOpen(true);
  }

  async function openPaymentModal(loan: Loan) {
    setSelectedLoan(loan);
    setLoanDetails(null);
    setPaymentData({
      amount: '',
      method: 'PIX',
      paidAt: getTodayDateInputValue(),
      notes: '',
    });
    setIsPaymentModalOpen(true);

    try {
      await loadLoanDetails(loan.id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar histórico do empréstimo');
    }
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
  }

  function closePaymentModal() {
    setIsPaymentModalOpen(false);
    setSelectedLoan(null);
    setLoanDetails(null);
  }

  async function handleCreateLoan(event: FormEvent) {
    event.preventDefault();
    if (!cashGroupId) return;

    try {
      setIsSubmitting(true);
      setError('');
      await loansApi.create(cashGroupId, {
        memberId: formData.memberId,
        principalAmount: Number(formData.principalAmount),
        interestRate: formData.interestRate,
        grantedAt: ensureMiddayIso(formData.grantedAt.slice(0, 10)),
        notes: formData.notes || undefined,
      });
      await loadData();
      closeCreateModal();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao criar empréstimo');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterPayment(event: FormEvent) {
    event.preventDefault();
    if (!cashGroupId || !selectedLoan) return;

    try {
      setIsSubmittingPayment(true);
      setError('');
      await loansApi.registerPayment(cashGroupId, selectedLoan.id, {
        amount: Number(paymentData.amount),
        method: paymentData.method,
        paidAt: ensureMiddayIso(paymentData.paidAt),
        notes: paymentData.notes || undefined,
      });
      await loadData();
      await loadLoanDetails(selectedLoan.id);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao registrar pagamento');
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  async function handleCancelLoan(loan: Loan) {
    if (!cashGroupId) return;
    if (!window.confirm(`Deseja realmente cancelar o empréstimo de ${loan.member?.name}?`)) return;

    try {
      setError('');
      await loansApi.cancel(cashGroupId, loan.id);
      await loadData();
      if (selectedLoan?.id === loan.id) {
        await loadLoanDetails(loan.id);
      }
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao cancelar empréstimo');
    }
  }

  async function handleCancelPayment(payment: LoanPayment) {
    if (!cashGroupId || !selectedLoan) return;
    if (!window.confirm('Deseja cancelar este recebimento do empréstimo?')) return;

    try {
      setError('');
      await loansApi.cancelPayment(cashGroupId, selectedLoan.id, payment.id);
      await loadData();
      await loadLoanDetails(selectedLoan.id);
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message.join(', ') : message || 'Erro ao cancelar pagamento');
    }
  }

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));

  const formatDate = (value: string | null) =>
    value ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value)) : 'Sem vencimento';

  const cycleEndDate = cashGroup ? getCycleEndDate(cashGroup.cycleYear) : null;

  if (isLoading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="cc-section-head">
          <PageHeader
            backTo="/caixinhas"
            backLabel="Voltar para caixinhas"
            title={`Empréstimos${cashGroup ? ` • ${cashGroup.name}` : ''}`}
            subtitle="Controle operações com juros por cotista, recebimentos parciais e saldo devedor sem misturar com as cobranças mensais."
          />
          <Button onClick={openCreateModal} disabled={!members.length}>
            Novo empréstimo
          </Button>
        </div>

        <Card className="p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Visão do grupo</h2>
              <p className="mt-1 text-sm text-slate-600">
                Use o filtro para destacar empréstimos em aberto, parciais, quitados ou cancelados.
              </p>
            </div>
            <Select
              label="Filtrar por status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value as 'ALL' | LoanStatus)}
            >
              <option value="ALL">Todos</option>
              <option value="OPEN">Abertos</option>
              <option value="PARTIAL">Parciais</option>
              <option value="PAID">Quitados</option>
              <option value="CANCELED">Cancelados</option>
            </Select>
          </div>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}

        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard tone="brand" value={formatCurrency(summary.totalPrincipal)} label="Total emprestado" />
            <StatCard tone="success" value={formatCurrency(summary.totalDue)} label="Total previsto" />
            <StatCard tone="warning" value={formatCurrency(summary.totalPaid)} label="Total recebido" />
            <StatCard tone="danger" value={formatCurrency(summary.totalOpen)} label="Saldo em aberto" />
          </div>
        )}

        {!members.length && (
          <Alert variant="info">
            Adicione pelo menos um cotista ativo nesta caixinha para registrar empréstimos.
          </Alert>
        )}

        {loans.length === 0 ? (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">EP</span>}
            title="Nenhum empréstimo registrado"
            description="Quando o grupo começar a operar empréstimos, eles aparecerão aqui com resumo, histórico e saldo."
            action={members.length ? <Button onClick={openCreateModal}>Criar primeiro empréstimo</Button> : undefined}
          />
        ) : (
          <div className="cc-table-shell overflow-x-auto">
            <table className="cc-table">
              <thead>
                <tr>
                  <th className="cc-th">Cotista</th>
                  <th className="cc-th">Principal</th>
                  <th className="cc-th">Juros</th>
                  <th className="cc-th">Total previsto</th>
                  <th className="cc-th">Pago</th>
                  <th className="cc-th">Saldo</th>
                  <th className="cc-th">Vencimento</th>
                  <th className="cc-th">Status</th>
                  <th className="cc-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/60">
                    <td className="cc-td">
                      <div className="font-semibold text-slate-900">{loan.member?.name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        Concedido em {formatDate(loan.grantedAt)}
                      </div>
                    </td>
                    <td className="cc-td">{formatCurrency(loan.principalAmount)}</td>
                    <td className="cc-td">{parseFloat(loan.interestRate).toFixed(2)}%</td>
                    <td className="cc-td">{formatCurrency(loan.totalDue)}</td>
                    <td className="cc-td">{formatCurrency(loan.amountPaid)}</td>
                    <td className="cc-td">{formatCurrency(loan.remainingAmount)}</td>
                    <td className="cc-td">{formatDate(loan.dueDate)}</td>
                    <td className="cc-td">
                      <Badge status={loan.status}>{STATUS_LABELS[loan.status]}</Badge>
                    </td>
                    <td className="cc-td">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionButton variant="primary" onClick={() => openPaymentModal(loan)}>
                          Pagamentos
                        </ActionButton>
                        {loan.status !== 'CANCELED' && loan.status !== 'PAID' && (
                          <ActionButton variant="danger" onClick={() => handleCancelLoan(loan)}>
                            Cancelar
                          </ActionButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isCreateModalOpen} onClose={closeCreateModal} title="Novo empréstimo">
          <form onSubmit={handleCreateLoan} className="space-y-4">
            <Select
              label="Cotista"
              value={formData.memberId}
              onChange={(event) => setFormData({ ...formData, memberId: event.target.value })}
              required
            >
              <option value="">Selecione um cotista</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Select>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Valor emprestado (R$)"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.principalAmount || ''}
                onChange={(event) =>
                  setFormData({ ...formData, principalAmount: parseFloat(event.target.value) || 0 })
                }
                required
              />
              <Input
                label={`Percentual sobre o empréstimo (%)${cashGroup ? ` • padrão ${cashGroup.defaultLoanInterestRate}%` : ''}`}
                type="number"
                min="0"
                step="0.01"
                value={formData.interestRate ?? ''}
                onChange={(event) =>
                  setFormData({
                    ...formData,
                    interestRate: event.target.value === '' ? undefined : parseFloat(event.target.value),
                  })
                }
                placeholder={cashGroup?.defaultLoanInterestRate || '30'}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-1">
              <Input
                label="Data de concessão"
                type="date"
                value={formData.grantedAt.slice(0, 10)}
                onChange={(event) =>
                  setFormData({ ...formData, grantedAt: ensureMiddayIso(event.target.value) })
                }
                required
              />
            </div>

            <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <strong className="font-semibold">Vencimento do empréstimo:</strong>{' '}
              {cycleEndDate
                ? `até ${formatDate(cycleEndDate)} ou até a quitação total do valor tomado.`
                : 'até o término do ciclo da caixinha ou até a quitação total.'}
            </div>

            <Textarea
              label="Observação"
              value={formData.notes || ''}
              onChange={(event) => setFormData({ ...formData, notes: event.target.value })}
              rows={3}
              placeholder="Ex: empréstimo emergencial para o cotista"
            />

            <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-800">
              Total previsto estimado: {formatCurrency(
                (
                  (formData.principalAmount || 0) +
                  (formData.principalAmount || 0) *
                    (((formData.interestRate ?? parseFloat(cashGroup?.defaultLoanInterestRate || '0')) || 0) / 100)
                ).toFixed(2),
              )}
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={closeCreateModal} className="flex-1">
                Fechar
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Registrar empréstimo
              </Button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={isPaymentModalOpen}
          onClose={closePaymentModal}
          title={selectedLoan ? `Pagamentos • ${selectedLoan.member?.name}` : 'Pagamentos'}
        >
          <div className="space-y-6">
            {loanDetails && (
              <>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                        Resumo do empréstimo
                      </p>
                      <h3 className="text-xl font-bold text-slate-900">
                        {formatCurrency(loanDetails.principalAmount)} tomados
                      </h3>
                      <p className="text-sm text-slate-500">
                        Juros fixos de {parseFloat(loanDetails.interestRate).toFixed(2)}% sobre o valor tomado,
                        com vencimento até {formatDate(loanDetails.dueDate)} ou quitação total.
                      </p>
                    </div>

                    <div className="shrink-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Status</p>
                      <div className="mt-2">
                        <Badge status={loanDetails.status}>{STATUS_LABELS[loanDetails.status]}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <Card className="p-5">
                  <div className="mb-4">
                    <h4 className="text-base font-bold text-slate-900">Posição financeira</h4>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Separação entre principal, juros e saldo para facilitar a baixa manual.
                    </p>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Valor tomado</div>
                      <div className="mt-1.5 text-lg font-bold text-slate-900">{formatCurrency(loanDetails.principalAmount)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Juros totais</div>
                      <div className="mt-1.5 text-lg font-bold text-slate-900">{formatCurrency(loanDetails.totalInterestAmount)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Total previsto</div>
                      <div className="mt-1.5 text-lg font-bold text-slate-900">{formatCurrency(loanDetails.totalDue)}</div>
                    </div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Recebido</div>
                      <div className="mt-1.5 text-lg font-bold text-emerald-900">{formatCurrency(loanDetails.amountPaid)}</div>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-amber-600">Juros pendentes</div>
                      <div className="mt-1.5 text-lg font-bold text-amber-900">{formatCurrency(loanDetails.interestRemainingAmount)}</div>
                    </div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-rose-600">Principal pendente</div>
                      <div className="mt-1.5 text-lg font-bold text-rose-900">{formatCurrency(loanDetails.principalRemainingAmount)}</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 md:col-span-2 xl:col-span-3">
                      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Saldo total em aberto</div>
                      <div className="mt-1.5 text-xl font-bold text-white">{formatCurrency(loanDetails.remainingAmount)}</div>
                    </div>
                  </div>
                </Card>

                <form onSubmit={handleRegisterPayment} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Registrar recebimento</h3>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Registre entradas do empréstimo com atalho para quitar tudo ou receber apenas os juros pendentes.
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="justify-start text-left"
                      onClick={() =>
                        setPaymentData((current) => ({
                          ...current,
                          amount: parseFloat(loanDetails.remainingAmount).toFixed(2),
                        }))
                      }
                    >
                      Quitar total
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="justify-start text-left"
                      disabled={parseFloat(loanDetails.interestRemainingAmount) <= 0}
                      onClick={() =>
                        setPaymentData((current) => ({
                          ...current,
                          amount: parseFloat(loanDetails.interestRemainingAmount).toFixed(2),
                        }))
                      }
                    >
                      Pagar só juros
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Valor pago"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(event) => setPaymentData({ ...paymentData, amount: event.target.value })}
                      required
                    />
                    <Input
                      label="Data do pagamento"
                      type="date"
                      value={paymentData.paidAt}
                      onChange={(event) => setPaymentData({ ...paymentData, paidAt: event.target.value })}
                      required
                    />
                  </div>

                  <Select
                    label="Método"
                    value={paymentData.method}
                    onChange={(event) =>
                      setPaymentData({ ...paymentData, method: event.target.value as LoanPaymentMethod })
                    }
                  >
                    <option value="PIX">Pix</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="OTHER">Outro</option>
                  </Select>

                  <Textarea
                    label="Observação"
                    value={paymentData.notes}
                    onChange={(event) => setPaymentData({ ...paymentData, notes: event.target.value })}
                    rows={3}
                    placeholder="Ex: pagamento dos juros do período ou quitação total"
                  />

                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    O pagamento é baixado manualmente. Se quiser, você pode registrar apenas os juros primeiro e amortizar o principal depois.
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="secondary" onClick={closePaymentModal} className="flex-1">
                      Fechar
                    </Button>
                    <Button
                      type="submit"
                      isLoading={isSubmittingPayment}
                      disabled={loanDetails.status === 'CANCELED' || loanDetails.status === 'PAID'}
                      className="flex-1"
                    >
                      Registrar pagamento
                    </Button>
                  </div>
                </form>

                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Histórico de pagamentos</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Cada recebimento mantém valor, data, método e status.
                    </p>
                  </div>

                  {!loanDetails.payments?.length ? (
                    <EmptyState
                      icon={<span className="text-2xl font-bold text-slate-400">PG</span>}
                      title="Nenhum pagamento registrado"
                      description="O histórico aparece aqui assim que o primeiro recebimento for lançado."
                    />
                  ) : (
                    <div className="space-y-3">
                      {loanDetails.payments.map((payment) => (
                        <Card key={payment.id} className="p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                              <div className="text-lg font-bold text-slate-950">{formatCurrency(payment.amount)}</div>
                              <div className="text-sm text-slate-600">
                                {formatDate(payment.paidAt)} • {payment.method === 'PIX' ? 'Pix' : payment.method === 'CASH' ? 'Dinheiro' : 'Outro'}
                              </div>
                              {payment.notes && <div className="text-sm text-slate-500">{payment.notes}</div>}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge status={payment.status}>
                                {payment.status === 'CONFIRMED' ? 'Confirmado' : 'Cancelado'}
                              </Badge>
                              {payment.status === 'CONFIRMED' && loanDetails.status !== 'CANCELED' && (
                                <ActionButton variant="danger" onClick={() => handleCancelPayment(payment)}>
                                  Cancelar pagamento
                                </ActionButton>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {!loanDetails && (
              <div className="flex items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
              </div>
            )}
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getCycleEndDate(cycleYear: number) {
  return new Date(Date.UTC(cycleYear, 11, 31, 12, 0, 0)).toISOString();
}

function ensureMiddayIso(dateValue: string) {
  return new Date(`${dateValue}T12:00:00`).toISOString();
}
