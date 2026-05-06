import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { BackButton } from '../components/ui/BackButton';
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

  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const totalQuotas = activeMembers.reduce((sum, m) => sum + m.quotasCount, 0);

  // Agrupar por caixinha
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
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/dashboard" label="Voltar para Dashboard" />
          <h1 className="text-3xl font-bold text-slate-900">Todos os Cotistas</h1>
          <p className="mt-2 text-slate-600">
            Visualize todos os cotistas cadastrados em suas caixinhas
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6">
            <div className="text-sm font-medium text-blue-900">
              Total de Cotistas Ativos
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
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && members.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <div className="mx-auto max-w-sm">
              <div className="text-5xl">👥</div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                Nenhum cotista cadastrado
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Crie uma caixinha e adicione cotistas para começar.
              </p>
              <button
                onClick={() => navigate('/caixinhas')}
                className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Ir para Caixinhas
              </button>
            </div>
          </div>
        )}

        {/* Members by Cash Group */}
        {!isLoading && members.length > 0 && (
          <div className="space-y-6">
            {Object.values(membersByCashGroup).map(({ cashGroup, members }) => (
              <div
                key={cashGroup.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Cash Group Header */}
                <div className="border-b border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {cashGroup.name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        Ano {cashGroup.cycleYear} • Cota R$ {cashGroup.quotaValue} •{' '}
                        {members.filter((m) => m.status === 'ACTIVE').length} cotistas ativos
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/caixinhas/${cashGroup.id}/cotistas`)}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Gerenciar
                    </button>
                  </div>
                </div>

                {/* Members Table */}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
