import { useEffect, useState } from 'react';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { Alert } from '../components/ui/Alert';
import { cashGroupsApi } from '../features/cash-groups/api';
import { aiApi } from '../features/ai/api';
import type { CashGroup, AdminPaymentRequest } from '../features/cash-groups/types';
import type { AIConfig } from '../features/ai/types';

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'Aguardando conferência',
  AUTO_MATCHED: 'Compatível',
  NEEDS_MANUAL_REVIEW: 'Revisão manual',
  MISMATCH: 'Divergência',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rejeitado',
  CANCELED: 'Cancelado',
};

const TYPE_LABELS: Record<string, string> = {
  MONTHLY_CHARGE: 'Cota',
  LOAN: 'Empréstimo',
};

const METHOD_LABELS: Record<string, string> = {
  PIX: 'Pix',
  CASH: 'Dinheiro',
  OTHER: 'Outros',
};

const MONTH_NAMES = [
  '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusBadge(status: string) {
  const mapping: Record<string, string> = {
    PENDING_REVIEW: 'PENDING',
    AUTO_MATCHED: 'ACTIVE',
    NEEDS_MANUAL_REVIEW: 'PENDING',
    MISMATCH: 'OVERDUE',
    CONFIRMED: 'PAID',
    REJECTED: 'CANCELED',
    CANCELED: 'CANCELED',
  };
  return <Badge status={mapping[status] || 'PENDING'}>{STATUS_LABELS[status] || status}</Badge>;
}

export function PaymentRequestsPage() {
  const [cashGroups, setCashGroups] = useState<CashGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [requests, setRequests] = useState<AdminPaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');

  // Modal de detalhes
  const [selectedRequest, setSelectedRequest] = useState<AdminPaymentRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Modal de confirmação
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // Modal de rejeição
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Config de IA
  const [aiConfig, setAIConfig] = useState<AIConfig | null>(null);
  const [isUpdatingAI, setIsUpdatingAI] = useState(false);

  // Carregar caixinhas e config IA
  useEffect(() => {
    loadCashGroups();
    aiApi.getConfig().then(setAIConfig).catch(() => {});
  }, []);

  async function handleAIToggle(enabled: boolean) {
    if (isUpdatingAI) return;
    setIsUpdatingAI(true);
    try {
      const updated = await aiApi.updateConfig({ aiEnabled: enabled });
      setAIConfig(updated);
    } catch {
      setError('Erro ao atualizar configuração de IA');
    } finally {
      setIsUpdatingAI(false);
    }
  }

  async function handleAIProvider(provider: 'local' | 'openai') {
    if (isUpdatingAI) return;
    setIsUpdatingAI(true);
    try {
      const updated = await aiApi.updateConfig({ provider });
      setAIConfig(updated);
    } catch {
      setError('Erro ao atualizar provider de IA');
    } finally {
      setIsUpdatingAI(false);
    }
  }

  // Carregar solicitações quando seleciona caixinha
  useEffect(() => {
    if (selectedGroupId) {
      loadRequests();
    } else {
      setRequests([]);
    }
  }, [selectedGroupId]);

  async function loadCashGroups() {
    try {
      setIsLoading(true);
      setError('');
      const data = await cashGroupsApi.getAll();
      setCashGroups(data.filter((g) => g.status !== 'ARCHIVED'));
      if (data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar caixinhas');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadRequests() {
    try {
      setIsLoading(true);
      setError('');
      const data = await cashGroupsApi.getPaymentRequests(selectedGroupId);
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar solicitações');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedRequest) return;
    try {
      setIsConfirming(true);
      setError('');
      await cashGroupsApi.confirmPaymentRequest(
        selectedGroupId,
        selectedRequest.id,
        confirmNotes || undefined,
      );
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(false);
      setConfirmNotes('');
      await loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao confirmar pagamento');
    } finally {
      setIsConfirming(false);
    }
  }

  async function handleReject() {
    if (!selectedRequest) return;
    try {
      setIsRejecting(true);
      setError('');
      await cashGroupsApi.rejectPaymentRequest(
        selectedGroupId,
        selectedRequest.id,
        rejectNotes || undefined,
      );
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      setRejectNotes('');
      await loadRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao rejeitar solicitação');
    } finally {
      setIsRejecting(false);
    }
  }

  async function handleReanalyze() {
    if (!selectedRequest) return;
    try {
      setError('');
      await cashGroupsApi.analyzePaymentRequest(selectedGroupId, selectedRequest.id);
      await loadRequests();
      // Atualizar request selecionado
      const updated = requests.find((r) => r.id === selectedRequest.id);
      if (updated) setSelectedRequest(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao reprocessar análise');
    }
  }

  function openDetailModal(request: AdminPaymentRequest) {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  }

  function closeDetailModal() {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  }

  // Filtrar requests
  const filteredRequests = requests.filter((req) => {
    if (statusFilter && req.status !== statusFilter) return false;
    if (typeFilter && req.type !== typeFilter) return false;
    if (methodFilter && req.method !== methodFilter) return false;
    return true;
  });

  // Calcular estatísticas
  const stats = {
    pending: requests.filter((r) => r.status === 'PENDING_REVIEW').length,
    autoMatched: requests.filter((r) => r.status === 'AUTO_MATCHED').length,
    mismatch: requests.filter((r) => r.status === 'MISMATCH').length,
    needsReview: requests.filter((r) => r.status === 'NEEDS_MANUAL_REVIEW').length,
    confirmed: requests.filter((r) => r.status === 'CONFIRMED').length,
    rejected: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <PageHeader
          title="Conferência de Pagamentos"
          subtitle="Analise os comprovantes enviados pelos cotistas antes de confirmar a baixa"
          backTo="/dashboard"
          backLabel="Dashboard"
        />

        {error && (
          <div className="relative">
            <Alert variant="error">{error}</Alert>
            <button
              onClick={() => setError('')}
              className="absolute right-3 top-3 rounded-lg p-1 text-red-600 hover:bg-red-100"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Card de Configuração de IA */}
        {aiConfig !== null && (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-slate-900">Análise Assistida por IA</h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {aiConfig.aiEnabled
                    ? `Ativa — provider: ${aiConfig.provider === 'openai' ? 'OpenAI' : 'Local (heurístico)'}`
                    : 'Desativada — apenas análise heurística'}
                </p>
              </div>
              <button
                onClick={() => handleAIToggle(!aiConfig.aiEnabled)}
                disabled={isUpdatingAI}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  aiConfig.aiEnabled ? 'bg-teal-600' : 'bg-slate-200'
                } ${isUpdatingAI ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={aiConfig.aiEnabled ? 'Desativar IA' : 'Ativar IA'}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    aiConfig.aiEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            {aiConfig.aiEnabled && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAIProvider('local')}
                  disabled={isUpdatingAI}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    aiConfig.provider === 'local'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Local (heurístico)
                </button>
                <button
                  onClick={() => handleAIProvider('openai')}
                  disabled={isUpdatingAI}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    aiConfig.provider === 'openai'
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  OpenAI
                </button>
              </div>
            )}
          </div>
        )}

        {/* Seleção de Caixinha */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <label htmlFor="cashGroup" className="block text-sm font-medium text-slate-700">
            Caixinha
          </label>
          <Select
            id="cashGroup"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="mt-1"
          >
            <option value="">Selecione uma caixinha</option>
            {cashGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>
        </div>

        {selectedGroupId && (
          <>
            {/* Cards de Resumo */}
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                value={stats.pending}
                label="Aguardando"
              />
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                value={stats.autoMatched}
                label="Compatíveis"
              />
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                }
                value={stats.mismatch}
                label="Divergências"
              />
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                }
                value={stats.needsReview}
                label="Revisão"
              />
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                value={stats.confirmed}
                label="Confirmados"
              />
              <StatCard
                icon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                value={stats.rejected}
                label="Rejeitados"
              />
            </div>

            {/* Filtros */}
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-slate-700">
                    Status
                  </label>
                  <Select
                    id="statusFilter"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Todos</option>
                    <option value="PENDING_REVIEW">Aguardando conferência</option>
                    <option value="AUTO_MATCHED">Compatível</option>
                    <option value="NEEDS_MANUAL_REVIEW">Revisão manual</option>
                    <option value="MISMATCH">Divergência</option>
                    <option value="CONFIRMED">Confirmado</option>
                    <option value="REJECTED">Rejeitado</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="typeFilter" className="block text-sm font-medium text-slate-700">
                    Tipo
                  </label>
                  <Select
                    id="typeFilter"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Todos</option>
                    <option value="MONTHLY_CHARGE">Cota</option>
                    <option value="LOAN">Empréstimo</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="methodFilter" className="block text-sm font-medium text-slate-700">
                    Método
                  </label>
                  <Select
                    id="methodFilter"
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="mt-1"
                  >
                    <option value="">Todos</option>
                    <option value="PIX">Pix</option>
                    <option value="CASH">Dinheiro</option>
                    <option value="OTHER">Outros</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Lista de Solicitações */}
            {isLoading ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-slate-600">Carregando...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <EmptyState
                icon={
                  <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                }
                title="Nenhuma solicitação para conferir"
                description="Não há solicitações de pagamento com os filtros selecionados."
              />
            ) : (
              <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Cotista
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Método
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Enviado em
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {request.member.name}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {TYPE_LABELS[request.type]}
                            {request.monthlyCharge && (
                              <span className="ml-1 text-xs text-slate-500">
                                ({MONTH_NAMES[request.monthlyCharge.referenceMonth]}/{request.monthlyCharge.referenceYear})
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {METHOD_LABELS[request.method]}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {formatCurrency(request.amountDeclared)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                            {formatDate(request.createdAt)}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                            <button
                              onClick={() => openDetailModal(request)}
                              className="font-medium text-teal-600 hover:text-teal-700"
                            >
                              Ver detalhes
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de Detalhes */}
        {selectedRequest && (
          <Modal
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
            title="Detalhes da Solicitação"
          >
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-700">Cotista</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedRequest.member.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Tipo</p>
                  <p className="mt-1 text-sm text-slate-900">{TYPE_LABELS[selectedRequest.type]}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Método</p>
                  <p className="mt-1 text-sm text-slate-900">{METHOD_LABELS[selectedRequest.method]}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Valor Declarado</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatCurrency(selectedRequest.amountDeclared)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">Enviado em</p>
                  <p className="mt-1 text-sm text-slate-900">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {/* Informações da Cobrança/Empréstimo */}
              {selectedRequest.monthlyCharge && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Cobrança Mensal</p>
                  <div className="mt-2 grid gap-2 text-sm">
                    <p>
                      <span className="text-slate-600">Referência:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {MONTH_NAMES[selectedRequest.monthlyCharge.referenceMonth]}/
                        {selectedRequest.monthlyCharge.referenceYear}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600">Valor devido:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(selectedRequest.monthlyCharge.amountDue)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600">Valor pago:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(selectedRequest.monthlyCharge.amountPaid)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {selectedRequest.loan && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Empréstimo</p>
                  <div className="mt-2 grid gap-2 text-sm">
                    <p>
                      <span className="text-slate-600">Valor principal:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(selectedRequest.loan.principalAmount)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600">Total devido:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(selectedRequest.loan.totalDue)}
                      </span>
                    </p>
                    <p>
                      <span className="text-slate-600">Valor pago:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {formatCurrency(selectedRequest.loan.amountPaid)}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Observações */}
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Observações do Cotista</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Análise do Comprovante */}
              {selectedRequest.analysis && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-700">Análise do Comprovante</p>
                      {aiConfig?.aiEnabled && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                          </svg>
                          IA ativa
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleReanalyze}
                      className="text-sm font-medium text-teal-600 hover:text-teal-700"
                    >
                      Reprocessar
                    </button>
                  </div>
                  <div className="mt-3 space-y-3 text-sm">
                    {selectedRequest.reviewSummary.warnings.length > 0 && (
                      <div className="rounded-md bg-amber-50 p-3">
                        <p className="font-medium text-amber-800">Avisos:</p>
                        <ul className="mt-1 list-inside list-disc text-amber-700">
                          {selectedRequest.reviewSummary.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="grid gap-2">
                      <p>
                        <span className="text-slate-600">Valor esperado:</span>{' '}
                        <span className="font-medium">
                          {selectedRequest.reviewSummary.expectedAmount
                            ? formatCurrency(selectedRequest.reviewSummary.expectedAmount)
                            : 'N/A'}
                        </span>
                      </p>
                      <p>
                        <span className="text-slate-600">Valor declarado:</span>{' '}
                        <span className="font-medium">
                          {formatCurrency(selectedRequest.reviewSummary.declaredAmount)}
                        </span>
                      </p>
                      {selectedRequest.reviewSummary.pixAmount && (
                        <p>
                          <span className="text-slate-600">Valor no Pix:</span>{' '}
                          <span className="font-medium">
                            {formatCurrency(selectedRequest.reviewSummary.pixAmount)}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="rounded-md bg-slate-100 p-3">
                      <p className="font-medium text-slate-700">Recomendação:</p>
                      <p className="mt-1 text-slate-600">{selectedRequest.reviewSummary.recommendation}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comprovante */}
              {selectedRequest.receiptDataUrl && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Comprovante</p>
                  <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
                    <img
                      src={selectedRequest.receiptDataUrl}
                      alt="Comprovante"
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Notas de Revisão */}
              {selectedRequest.reviewNotes && (
                <div>
                  <p className="text-sm font-medium text-slate-700">Notas da Revisão</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedRequest.reviewNotes}</p>
                  {selectedRequest.reviewedBy && (
                    <p className="mt-1 text-xs text-slate-500">
                      Revisado por {selectedRequest.reviewedBy.name} em {formatDate(selectedRequest.reviewedAt!)}
                    </p>
                  )}
                </div>
              )}

              {/* Ações */}
              {selectedRequest.status !== 'CONFIRMED' && selectedRequest.status !== 'REJECTED' && (
                <div className="flex gap-3 border-t border-slate-200 pt-4">
                  <Button
                    variant="primary"
                    onClick={() => {
                      setIsConfirmModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    Confirmar Baixa
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsRejectModalOpen(true);
                    }}
                    className="flex-1"
                  >
                    Rejeitar
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Modal de Confirmação */}
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => !isConfirming && setIsConfirmModalOpen(false)}
          title="Confirmar Baixa de Pagamento"
        >
          <div className="space-y-4">
            <Alert variant="warning">
              Essa ação atualizará a cobrança ou empréstimo relacionado. Confirme apenas após conferir o
              comprovante.
            </Alert>

            <div>
              <label htmlFor="confirmNotes" className="block text-sm font-medium text-slate-700">
                Observações (opcional)
              </label>
              <Textarea
                id="confirmNotes"
                value={confirmNotes}
                onChange={(e) => setConfirmNotes(e.target.value)}
                rows={3}
                placeholder="Adicione observações sobre a conferência..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-200 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isConfirming}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                isLoading={isConfirming}
                className="flex-1"
              >
                Confirmar Baixa
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Rejeição */}
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => !isRejecting && setIsRejectModalOpen(false)}
          title="Rejeitar Solicitação"
        >
          <div className="space-y-4">
            <Alert variant="error">
              Ao rejeitar, a solicitação será marcada como rejeitada e não atualizará a cobrança ou
              empréstimo.
            </Alert>

            <div>
              <label htmlFor="rejectNotes" className="block text-sm font-medium text-slate-700">
                Motivo da Rejeição
              </label>
              <Textarea
                id="rejectNotes"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={3}
                placeholder="Explique o motivo da rejeição..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 border-t border-slate-200 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={isRejecting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleReject}
                isLoading={isRejecting}
                className="flex-1"
              >
                Rejeitar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AuthenticatedLayout>
  );
}
