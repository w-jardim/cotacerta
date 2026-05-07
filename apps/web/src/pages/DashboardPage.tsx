import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthenticatedLayout } from '../components/layout/AuthenticatedLayout';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/auth-context';
import { cashGroupsApi } from '../features/cash-groups/api';
import { membersApi } from '../features/members/api';
import { chargesApi } from '../features/charges/api';
import { loansApi } from '../features/loans/api';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cashGroupsCount, setCashGroupsCount] = useState(0);
  const [membersCount, setMembersCount] = useState(0);
  const [chargesCount, setChargesCount] = useState(0);
  const [openLoansCount, setOpenLoansCount] = useState(0);

  useEffect(() => {
    async function loadStats() {
      try {
        const [cashGroups, members, charges, loans] = await Promise.all([
          cashGroupsApi.getAll(),
          membersApi.getAllUserMembers(),
          chargesApi.getAllUserCharges(),
          loansApi.getAllUserLoans(),
        ]);
        setCashGroupsCount(cashGroups.length);
        setMembersCount(members.filter((member: any) => member.status === 'ACTIVE').length);
        setChargesCount(charges.length);
        setOpenLoansCount(
          loans.items.filter((loan) => ['OPEN', 'PARTIAL'].includes(loan.status)).length,
        );
      } catch (err) {
        console.error('Erro ao carregar estatísticas', err);
      }
    }

    loadStats();
  }, []);

  const modules = [
    {
      name: 'Caixinhas',
      description: 'Crie, organize e acompanhe cada ciclo sem misturar dados financeiros.',
      status: 'Disponível',
      path: '/caixinhas',
    },
    {
      name: 'Cotistas',
      description: 'Centralize os participantes, cotas ativas e dados de contato.',
      status: 'Disponível',
      path: '/cotistas',
    },
    {
      name: 'Cobranças',
      description: 'Acompanhe valores pendentes, pagos e cobranças do mês.',
      status: 'Disponível',
      path: '/cobrancas',
    },
    {
      name: 'Pagamentos',
      description: 'Registre Pix, anexe comprovantes e acompanhe o histórico dos recebimentos.',
      status: 'Disponível',
      path: '/cobrancas',
    },
    {
      name: 'Empréstimos',
      description: 'Gestão de saldo devedor e cálculo de juros por cotista.',
      status: 'Disponível',
      path: '/emprestimos',
    },
    {
      name: 'Quem Deve',
      description: 'Visão consolidada de pendências, cobrança por WhatsApp e filtro por período.',
      status: 'Disponível',
      path: '/quem-deve',
    },
    {
      name: 'Fechamento anual',
      description: 'Apuração final por cota com visibilidade do resultado.',
      status: 'Disponível',
      path: '/caixinhas',
    },
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-8">
        <Card className="overflow-hidden p-8">
          <div className="cc-section-head">
            <PageHeader
              title={`Olá, ${user?.name?.split(' ')[0] || 'gestor'}`}
              subtitle="Seu painel concentra as caixinhas, cotistas e cobranças em uma visão única, clara e pronta para ação."
            />
            <Button onClick={() => navigate('/caixinhas')}>Abrir caixinhas</Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            tone="brand"
            icon={<span className="text-lg font-bold text-teal-700">CX</span>}
            value={cashGroupsCount}
            label="Caixinhas"
            footnote="Estruturas ativas sob sua gestão"
          />
          <StatCard
            tone="success"
            icon={<span className="text-lg font-bold text-emerald-700">CT</span>}
            value={membersCount}
            label="Cotistas ativos"
            footnote="Participantes vinculados às caixinhas"
          />
          <StatCard
            tone="warning"
            icon={<span className="text-lg font-bold text-amber-700">CB</span>}
            value={chargesCount}
            label="Cobranças listadas"
            footnote="Pendências e lançamentos recentes"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <StatCard
            tone="danger"
            icon={<span className="text-lg font-bold text-rose-700">EP</span>}
            value={openLoansCount}
            label="Empréstimos em aberto"
            footnote="Operações com saldo pendente ou parcial"
          />
        </div>

        <section className="space-y-4">
          <div className="cc-section-head">
            <PageHeader
              title="Módulos do sistema"
              subtitle="Os módulos disponíveis seguem a mesma base visual e priorizam rapidez operacional."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map((module) => (
              <Card
                key={module.name}
                className={`flex h-full flex-col justify-between p-6 transition ${
                  module.path ? 'cursor-pointer hover:-translate-y-1 hover:shadow-xl' : ''
                }`}
                onClick={() => module.path && navigate(module.path)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-950">{module.name}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{module.description}</p>
                    </div>
                    <Badge status={module.status === 'Disponível' ? 'ACTIVE' : 'PAUSED'}>
                      {module.status}
                    </Badge>
                  </div>
                </div>

                <div className="mt-6">
                  {module.path ? (
                    <Button variant="secondary" className="w-full">
                      Acessar módulo
                    </Button>
                  ) : (
                    <p className="text-sm font-semibold text-slate-500">Disponível nas próximas fases do roadmap.</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>

        <Card variant="subtle" className="p-6">
          <h3 className="text-lg font-bold text-slate-950">Foco do MVP</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            A prioridade atual continua sendo gestão de caixinhas, cotistas, cobranças e leitura rápida de quem deve, com fluxo simples para o gestor master.
          </p>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
