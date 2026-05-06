import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { useAuth } from '../features/auth/auth-context';
import { cashGroupsApi } from '../features/cash-groups/api';
import { membersApi } from '../features/members/api';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cashGroupsCount, setCashGroupsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const [cashGroups, members] = await Promise.all([
          cashGroupsApi.getAll(),
          membersApi.getAllUserMembers(),
        ]);
        setCashGroupsCount(cashGroups.length);
        setMembersCount(members.filter((m: any) => m.status === 'ACTIVE').length);
      } catch (err) {
        console.error('Erro ao carregar estatísticas', err);
      }
    }
    loadStats();
  }, []);

  const modules = [
    {
      name: 'Caixinhas',
      description: 'Crie e gerencie suas caixinhas coletivas',
      icon: '🗂️',
      status: 'Disponível',
      path: '/caixinhas',
    },
    {
      name: 'Cotistas',
      description: 'Cadastre e controle participantes',
      icon: '👥',
      status: 'Disponível',
      path: '/cotistas',
    },
    {
      name: 'Cobranças',
      description: 'Gere cobranças mensais automaticamente',
      icon: '💳',
      status: 'Em breve',
    },
    {
      name: 'Pagamentos',
      description: 'Registre Pix e anexe comprovantes',
      icon: '💰',
      status: 'Em breve',
    },
    {
      name: 'Empréstimos',
      description: 'Controle empréstimos com juros',
      icon: '📊',
      status: 'Em breve',
    },
    {
      name: 'Fechamento Anual',
      description: 'Calcule divisão final por cota',
      icon: '📅',
      status: 'Em breve',
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Bem-vindo, {user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="mt-2 text-slate-600">
            Sistema pronto para gerenciar suas caixinhas de forma profissional
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-3">
                <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a 2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{cashGroupsCount}</p>
                <p className="text-sm text-slate-600">Caixinhas</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-3">
                <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{membersCount}</p>
                <p className="text-sm text-slate-600">Cotistas</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-3">
                <svg className="h-6 w-6 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">0</p>
                <p className="text-sm text-slate-600">Pagamentos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Módulos do Sistema</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => (
              <div
                key={module.name}
                onClick={() => module.path && navigate(module.path)}
                className={`group rounded-xl bg-white p-6 shadow-sm transition-all ${
                  module.path ? 'cursor-pointer hover:shadow-md' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{module.icon}</span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{module.name}</h4>
                      <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    module.status === 'Disponível'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {module.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2">
              <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Sistema em desenvolvimento</h4>
              <p className="mt-1 text-sm text-slate-600">
                Os módulos estão sendo implementados seguindo o roadmap do projeto.
                Em breve você poderá criar caixinhas, cadastrar cotistas e muito mais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
