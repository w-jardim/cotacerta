import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { membersApi } from '../features/members/api';
import type { Member } from '../features/members/types';
import type { CashGroup } from '../features/cash-groups/types';

interface MemberWithCashGroup extends Member {
  cashGroup: Pick<CashGroup, 'id' | 'name' | 'cycleYear' | 'quotaValue' | 'status'>;
}

export function MembersListPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberWithCashGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    try {
      setIsLoading(true);
      setError('');
      const data = await membersApi.getAllUserMembers();
      setMembers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar cotistas');
    } finally {
      setIsLoading(false);
    }
  }

  const activeMembers = members.filter((member) => member.status === 'ACTIVE');
  const totalQuotas = activeMembers.reduce((sum, member) => sum + member.quotasCount, 0);

  const membersByCashGroup = members.reduce((acc, member) => {
    const groupId = member.cashGroup.id;
    if (!acc[groupId]) {
      acc[groupId] = {
        cashGroup: member.cashGroup,
        members: [],
      };
    }
    acc[groupId].members.push(member);
    return acc;
  }, {} as Record<string, { cashGroup: MemberWithCashGroup['cashGroup']; members: MemberWithCashGroup[] }>);

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <PageHeader
          title="Todos os cotistas"
          subtitle="Acompanhe os participantes de todas as suas caixinhas com a mesma visão de status, cotas e contato."
          backTo="/dashboard"
          backLabel="Voltar ao dashboard"
        />

        {error && <Alert variant="error">{error}</Alert>}

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard tone="brand" value={members.length} label="Cotistas cadastrados" />
          <StatCard tone="success" value={activeMembers.length} label="Cotistas ativos" />
          <StatCard tone="warning" value={totalQuotas} label="Total de cotas" />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700" />
          </div>
        )}

        {!isLoading && members.length === 0 && (
          <EmptyState
            icon={<span className="text-3xl font-bold text-slate-400">CT</span>}
            title="Nenhum cotista cadastrado"
            description="Crie uma caixinha e cadastre participantes para começar a distribuir cotas e gerar cobranças."
            action={<Button onClick={() => navigate('/caixinhas')}>Ir para caixinhas</Button>}
          />
        )}

        {!isLoading && members.length > 0 && (
          <div className="space-y-6">
            {Object.values(membersByCashGroup).map(({ cashGroup, members: groupMembers }) => (
              <Card key={cashGroup.id} className="overflow-hidden p-0">
                <div className="cc-section-head border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{cashGroup.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ano {cashGroup.cycleYear} • Cota R$ {cashGroup.quotaValue} •{' '}
                      {groupMembers.filter((member) => member.status === 'ACTIVE').length} cotistas ativos
                    </p>
                  </div>
                  <Button variant="secondary" onClick={() => navigate(`/caixinhas/${cashGroup.id}/cotistas`)}>
                    Gerenciar grupo
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th className="cc-th">Cotista</th>
                        <th className="cc-th">Telefone</th>
                        <th className="cc-th">Chave Pix</th>
                        <th className="cc-th text-center">Cotas</th>
                        <th className="cc-th text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupMembers.map((member) => (
                        <tr key={member.id} className={member.status !== 'ACTIVE' ? 'bg-slate-50/80' : 'hover:bg-slate-50/60'}>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
