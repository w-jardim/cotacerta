import { useEffect, useState, useCallback } from 'react';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { communicationsApi } from '../features/communications/api';
import type { CommunicationMessage } from '../features/communications/types';

function directionLabel(direction: string) {
  switch (direction) {
    case 'MEMBER_TO_ADMIN': return 'Cotista';
    case 'SYSTEM_TO_ADMIN': return 'Sistema';
    case 'ADMIN_TO_MEMBER': return 'Você → Cotista';
    case 'SYSTEM_TO_MEMBER': return 'Sistema → Cotista';
    default: return direction;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ComunicacoesPage() {
  const [messages, setMessages] = useState<CommunicationMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selected, setSelected] = useState<CommunicationMessage | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySuccess, setReplySuccess] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await communicationsApi.getInbox(1, 50);
      setMessages(data.messages);
      setTotal(data.total);
      setUnread(data.unread);
    } catch {
      setError('Não foi possível carregar as mensagens.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleOpen(msg: CommunicationMessage) {
    setSelected(msg);
    setReplyBody('');
    setReplyError('');
    setReplySuccess('');
    if (!msg.isRead) {
      communicationsApi.markRead([msg.id]).catch(() => {});
      setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      setUnread(n => Math.max(0, n - 1));
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !replyBody.trim()) return;
    setIsSendingReply(true);
    setReplyError('');
    setReplySuccess('');
    try {
      await communicationsApi.reply(selected.id, replyBody.trim());
      setReplySuccess('Resposta enviada com sucesso!');
      setReplyBody('');
      load();
    } catch {
      setReplyError('Erro ao enviar resposta. Tente novamente.');
    } finally {
      setIsSendingReply(false);
    }
  }

  async function handleMarkAllRead() {
    await communicationsApi.markAllRead().catch(() => {});
    setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    setUnread(0);
  }

  const canReply = selected?.direction === 'MEMBER_TO_ADMIN';

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Comunicações</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {total} mensagem{total !== 1 ? 's' : ''} · {unread} não lida{unread !== 1 ? 's' : ''}
            </p>
          </div>
          {unread > 0 && (
            <Button variant="secondary" onClick={handleMarkAllRead} className="text-sm">
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Message list */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                </div>
              )}
              {!loading && messages.length === 0 && (
                <div className="py-16 text-center text-sm text-slate-400">
                  Nenhuma mensagem
                </div>
              )}
              {!loading && messages.map(msg => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => handleOpen(msg)}
                  className={`w-full border-b border-slate-100 px-4 py-3.5 text-left transition last:border-0 hover:bg-slate-50 ${
                    selected?.id === msg.id ? 'bg-teal-50 hover:bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {!msg.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                    )}
                    {msg.isRead && <span className="mt-1.5 h-2 w-2 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${msg.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {msg.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {directionLabel(msg.direction)} · {msg.body.slice(0, 60)}{msg.body.length > 60 ? '…' : ''}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </Card>
          </div>

          {/* Message detail */}
          <div className="lg:col-span-3">
            {!selected ? (
              <Card className="p-10 text-center text-slate-400">
                <svg className="mx-auto mb-3 h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                <p className="text-sm">Selecione uma mensagem para ler</p>
              </Card>
            ) : (
              <Card className="p-6 space-y-5">
                {/* Message header */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-lg font-bold text-slate-900">{selected.title}</h2>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selected.direction === 'MEMBER_TO_ADMIN' || selected.direction === 'SYSTEM_TO_ADMIN'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-teal-50 text-teal-700'
                    }`}>
                      {directionLabel(selected.direction)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(selected.createdAt)}</p>
                </div>

                {/* Body */}
                <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-4">
                  <p className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed">{selected.body}</p>
                </div>

                {/* Reply form — only for messages from members */}
                {canReply && (
                  <form onSubmit={handleReply} className="space-y-3">
                    <p className="text-sm font-semibold text-slate-700">Responder</p>
                    {replyError && <Alert variant="error">{replyError}</Alert>}
                    {replySuccess && <Alert variant="success">{replySuccess}</Alert>}
                    <textarea
                      className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      rows={4}
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Digite sua resposta..."
                      required
                      maxLength={2000}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" isLoading={isSendingReply} className="text-sm">
                        Enviar resposta
                      </Button>
                    </div>
                  </form>
                )}

                {!canReply && (
                  <p className="text-xs text-slate-400 text-center">
                    Mensagem automática do sistema — sem resposta disponível
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
