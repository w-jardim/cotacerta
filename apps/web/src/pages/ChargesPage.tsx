import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
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
import { cashGroupsApi } from '../features/cash-groups/api';
import { chargesApi } from '../features/charges/api';
import type { CashGroup } from '../features/cash-groups/types';
import type {
  ChargeDetails,
  ChargesSummary,
  MonthlyCharge,
  PaymentReceipt,
} from '../features/charges/types';

const MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024;

export function ChargesPage() {
  const { cashGroupId } = useParams<{ cashGroupId: string }>();
  const [cashGroup, setCashGroup] = useState<CashGroup | null>(null);
  const [charges, setCharges] = useState<MonthlyCharge[]>([]);
  const [summary, setSummary] = useState<ChargesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [generateMonth, setGenerateMonth] = useState(`${currentDate.getMonth() + 1}`);
  const [generateYear, setGenerateYear] = useState(`${currentDate.getFullYear()}`);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<MonthlyCharge | null>(null);
  const [chargeDetails, setChargeDetails] = useState<ChargeDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(getTodayDateInputValue());
  const [receipt, setReceipt] = useState<PaymentReceipt | undefined>();
  const [receiptError, setReceiptError] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const years = Array.from({ length: 5 }, (_, index) => currentDate.getFullYear() - 2 + index);

  useEffect(() => {
    if (cashGroupId) {
      loadCashGroup();
    }
  }, [cashGroupId]);

  useEffect(() => {
    if (cashGroupId) {
      loadCharges();
    }
  }, [cashGroupId, selectedMonth, selectedYear]);

  const loadCashGroup = async () => {
    try {
      const data = await cashGroupsApi.getOne(cashGroupId!);
      setCashGroup(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar caixinha');
    }
  };

  const loadCharges = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await chargesApi.listCharges(
        cashGroupId!,
        selectedMonth === 'all' ? undefined : parseInt(selectedMonth, 10),
        selectedYear === 'all' ? undefined : parseInt(selectedYear, 10),
      );
      setCharges(data.charges);
      setSummary(data.summary);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Erro ao carregar cobranças');
      } else {
        setCharges([]);
        setSummary(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadChargeDetails = async (chargeId: string) => {
    try {
      setDetailsLoading(true);
      const data = await chargesApi.getOne(cashGroupId!, chargeId);
      setChargeDetails(data);
      const remaining = Math.max(0, parseFloat(data.amountDue) - parseFloat(data.amountPaid));
      setPaymentAmount(remaining.toFixed(2));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar histórico da cobrança');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      await chargesApi.generateCharges(cashGroupId!, {
        referenceMonth: parseInt(generateMonth, 10),
        referenceYear: parseInt(generateYear, 10),
      });
      setShowGenerateModal(false);
      await loadCharges();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao gerar cobranças');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPayment = async () => {
    if (!selectedCharge) return;

    try {
      setIsSubmittingPayment(true);
      setError('');
      await chargesApi.registerPayment(cashGroupId!, selectedCharge.id, {
        amountPaid: parseFloat(paymentAmount),
        paidAt: new Date(`${paymentDate}T12:00:00`).toISOString(),
        paymentMethod: 'PIX',
        receipt,
      });
      await Promise.all([loadCharges(), loadChargeDetails(selectedCharge.id)]);
      setReceipt(undefined);
      setReceiptError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCancel = async (chargeId: string) => {
    if (!window.confirm('Deseja realmente cancelar esta cobrança?')) return;
    try {
      setLoading(true);
      setError('');
      await chargesApi.cancel(cashGroupId!, chargeId);
      await loadCharges();
      if (selectedCharge?.id === chargeId) {
        await loadChargeDetails(chargeId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao cancelar cobrança');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = async (charge: MonthlyCharge) => {
    setSelectedCharge(charge);
    setChargeDetails(null);
    setPaymentDate(getTodayDateInputValue());
    setReceipt(undefined);
    setReceiptError('');
    setShowPaymentModal(true);
    await loadChargeDetails(charge.id);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedCharge(null);
    setChargeDetails(null);
    setPaymentAmount('');
    setPaymentDate(getTodayDateInputValue());
    setReceipt(undefined);
    setReceiptError('');
  };

  const handleReceiptChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setReceipt(undefined);
      setReceiptError('');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setReceipt(undefined);
      setReceiptError('Comprovante deve ser JPG, PNG, WEBP ou PDF.');
      return;
    }

    if (file.size > MAX_RECEIPT_SIZE_BYTES) {
      setReceipt(undefined);
      setReceiptError('Comprovante deve ter no máximo 5MB.');
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    setReceipt({
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      dataUrl,
    });
    setReceiptError('');
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      PAID: 'Pago',
      PARTIAL: 'Parcial',
      OVERDUE: 'Atrasado',
      CANCELED: 'Cancelado',
    };
    return <Badge status={status}>{labels[status] || status}</Badge>;
  };

  const formatCurrency = (value: string) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(value));

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(dateString));

  const lateRate = cashGroup ? parseFloat(cashGroup.defaultLoanInterestRate) : 0;
  const hasLateFee = chargeDetails
    ? parseFloat(chargeDetails.amountDue) > parseFloat(chargeDetails.baseAmount)
    : false;
  const lateFeeAmount = chargeDetails ? parseFloat(chargeDetails.lateFeeAmount || '0') : 0;
  const monthlyLateFeeAmount = chargeDetails
    ? parseFloat(chargeDetails.monthlyLateFeeAmount || '0')
    : 0;
  const overdueMonths = chargeDetails?.overdueMonths || 0;

  const remainingAmount = chargeDetails
    ? Math.max(0, parseFloat(chargeDetails.amountDue) - parseFloat(chargeDetails.amountPaid))
    : 0;

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <div className="cc-section-head">
          <PageHeader
            backTo="/caixinhas"
            backLabel="Voltar para caixinhas"
            title={`Cobranças${cashGroup ? ` • ${cashGroup.name}` : ''}`}
            subtitle="Veja a situação geral da caixinha, filtre por período quando quiser e acompanhe pagamentos, comprovantes e atrasos."
          />
        </div>

        <Card className="p-6">
          <div className="cc-section-head">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Visão geral da caixinha</h2>
              <p className="mt-1 text-sm text-slate-600">
                Use os filtros para focar em um mês específico ou acompanhe todas as cobranças do ciclo.
              </p>
            </div>
            <Button onClick={() => setShowGenerateModal(true)} disabled={loading} className="w-full md:w-auto">
              Gerar cobranças
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Select
              label="Filtrar por mês"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              <option value="all">Todos os meses</option>
              {months.map((month, index) => (
                <option key={month} value={index + 1}>
                  {month}
                </option>
              ))}
            </Select>

            <Select
              label="Filtrar por ano"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              <option value="all">Todos os anos</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        {error && <Alert variant="error">{error}</Alert>}

        {summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard tone="brand" value={formatCurrency(summary.totalDue)} label="Total a receber" footnote={`${summary.totalCharges} cobrança(s)`} />
            <StatCard tone="success" value={formatCurrency(summary.totalPaid)} label="Total pago" footnote={`${summary.paidCount} cobrança(s) pagas`} />
            <StatCard tone="warning" value={formatCurrency(summary.totalPending)} label="Total pendente" footnote={`${summary.pendingCount} cobrança(s) pendentes`} />
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        )}

        {!loading && charges.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">CB</span>}
            title="Nenhuma cobrança encontrada"
            description='Gere as cobranças do período selecionado para começar a acompanhar pagamentos, comprovantes e pendências.'
            action={<Button onClick={() => setShowGenerateModal(true)}>Gerar cobranças do período</Button>}
          />
        )}

        {!loading && charges.length > 0 && (
          <div className="cc-table-shell overflow-x-auto">
            <table className="cc-table">
              <thead>
                <tr>
                  <th className="cc-th">Cotista</th>
                  <th className="cc-th">Período</th>
                  <th className="cc-th">Cotas</th>
                  <th className="cc-th">Vencimento</th>
                  <th className="cc-th">Valor devido</th>
                  <th className="cc-th">Valor pago</th>
                  <th className="cc-th">Status</th>
                  <th className="cc-th text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} className="hover:bg-slate-50/60">
                    <td className="cc-td">
                      <div className="font-semibold text-slate-900">{charge.member?.name}</div>
                      {charge.member?.phone && (
                        <div className="mt-1 text-xs text-slate-500">{charge.member.phone}</div>
                      )}
                    </td>
                    <td className="cc-td">
                      {months[charge.referenceMonth - 1]}/{charge.referenceYear}
                    </td>
                    <td className="cc-td">{charge.quotasCount}</td>
                    <td className="cc-td">{formatDate(charge.dueDate)}</td>
                    <td className="cc-td">
                      <div className="font-semibold text-slate-900">{formatCurrency(charge.amountDue)}</div>
                      {parseFloat(charge.amountDue) > parseFloat(charge.baseAmount) && (
                        <div className="mt-1 text-xs text-amber-700">
                          Base: {formatCurrency(charge.baseAmount)}
                        </div>
                      )}
                    </td>
                    <td className="cc-td">{formatCurrency(charge.amountPaid)}</td>
                    <td className="cc-td">{getStatusBadge(charge.status)}</td>
                    <td className="cc-td">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ActionButton variant="primary" onClick={() => openPaymentModal(charge)}>
                          Pagamentos
                        </ActionButton>
                        {charge.status !== 'CANCELED' && (
                          <ActionButton variant="danger" onClick={() => handleCancel(charge.id)}>
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

        <Modal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          title="Gerar cobranças"
        >
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-700">
              Escolha o período para gerar as cobranças desta caixinha.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Mês da geração"
                value={generateMonth}
                onChange={(event) => setGenerateMonth(event.target.value)}
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </Select>
              <Select
                label="Ano da geração"
                value={generateYear}
                onChange={(event) => setGenerateYear(event.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-sm leading-6 text-slate-500">
              O sistema criará cobranças para os cotistas ativos da caixinha selecionada.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowGenerateModal(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? 'Gerando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showPaymentModal}
          onClose={closePaymentModal}
          title="Pagamentos da cobrança"
        >
          <div className="space-y-6">
            {detailsLoading && (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
              </div>
            )}

            {!detailsLoading && chargeDetails && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card variant="subtle" className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Base</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(chargeDetails.baseAmount)}</p>
                  </Card>
                  <Card variant="subtle" className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Devido</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(chargeDetails.amountDue)}</p>
                  </Card>
                  <Card variant="subtle" className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pago</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(chargeDetails.amountPaid)}</p>
                  </Card>
                  <Card variant="subtle" className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Saldo</p>
                    <p className="mt-2 text-lg font-bold text-slate-950">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount)}
                    </p>
                  </Card>
                  <Card variant="subtle" className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
                    <div className="mt-2">{getStatusBadge(chargeDetails.status)}</div>
                  </Card>
                </div>

                {hasLateFee && (
                  <Alert variant="info">
                    Vencimento encerrado em {formatDate(chargeDetails.dueDate)}. Foi aplicado acréscimo de{' '}
                    <strong>{lateRate.toFixed(2)}%</strong>, adicionando{' '}
                    <strong>
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lateFeeAmount)}
                    </strong>{' '}
                    ao valor original da cobrança em <strong>{overdueMonths} mês(es)</strong> de atraso.
                  </Alert>
                )}

                <Card className="p-5">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-slate-950">Registrar novo pagamento</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Cotista: <strong>{chargeDetails.member?.name}</strong>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Vencimento da cobrança: <strong>{formatDate(chargeDetails.dueDate)}</strong>
                    </p>
                  </div>

                  {chargeDetails.status === 'PAID' || chargeDetails.status === 'CANCELED' ? (
                    <Alert variant="info">
                      {chargeDetails.status === 'PAID'
                        ? 'Esta cobrança já está quitada. Você ainda pode consultar o histórico e os comprovantes.'
                        : 'Esta cobrança está cancelada. Não é possível registrar novos pagamentos.'}
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          label="Valor pago"
                          type="number"
                          step="0.01"
                          value={paymentAmount}
                          onChange={(event) => setPaymentAmount(event.target.value)}
                          placeholder="0,00"
                        />
                        <Input
                          label="Data do pagamento"
                          type="date"
                          value={paymentDate}
                          onChange={(event) => setPaymentDate(event.target.value)}
                        />
                      </div>

                      <Select label="Método de pagamento" value="PIX" disabled>
                        <option value="PIX">Pix</option>
                      </Select>

                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <span>Valor original</span>
                          <strong>{formatCurrency(chargeDetails.baseAmount)}</strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>Acréscimo mensal</span>
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyLateFeeAmount)}
                          </strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>Meses em atraso</span>
                          <strong>{overdueMonths}</strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>Total de acréscimos</span>
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lateFeeAmount)}
                          </strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>Valor atualizado</span>
                          <strong>{formatCurrency(chargeDetails.amountDue)}</strong>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span>Saldo pendente</span>
                          <strong>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remainingAmount)}
                          </strong>
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Comprovante
                        </label>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          onChange={handleReceiptChange}
                          className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                        />
                        {receipt && (
                          <p className="mt-2 text-xs text-slate-500">
                            {receipt.fileName} • {(receipt.sizeBytes / 1024).toFixed(1)} KB
                          </p>
                        )}
                        {receiptError && <p className="mt-2 text-sm text-red-600">{receiptError}</p>}
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={closePaymentModal}>
                          Fechar
                        </Button>
                        <Button onClick={handleRegisterPayment} isLoading={isSubmittingPayment}>
                          Registrar Pix
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                <Card className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-950">Histórico de pagamentos</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Cada lançamento mantém valor, data, método Pix e comprovante associado.
                      </p>
                    </div>
                  </div>

                  {chargeDetails.payments.length === 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                      Nenhum pagamento registrado nesta cobrança.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chargeDetails.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-base font-bold text-slate-950">
                                {formatCurrency(payment.amountPaid)}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                Pix recebido em {formatDate(payment.paidAt)}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge status="PAID">{payment.paymentMethod}</Badge>
                              {payment.receipt && (
                                <Button
                                  variant="secondary"
                                  onClick={() => window.open(payment.receipt?.dataUrl, '_blank', 'noopener,noreferrer')}
                                >
                                  Ver comprovante
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}

function getTodayDateInputValue() {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o comprovante'));
    reader.readAsDataURL(file);
  });
}
