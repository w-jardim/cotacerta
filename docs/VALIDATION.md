# Validation — CotaCerta

## Regra geral

Não avançar de fase sem validação.

## Checklist geral

- documentação atualizada;
- regras de negócio respeitadas;
- isolamento por caixinha mantido;
- sem exclusão indevida de movimentações financeiras;
- sem subgestor obrigatório;
- sem OCR/IA obrigatório no MVP.

## Fase 0

- documentos criados;
- MVP claro;
- escopo enxuto;
- regras principais registradas.

✅ Status: Validada

## Fase 1

Validações:

- frontend sobe;
- backend sobe;
- banco conecta;
- healthcheck responde;
- Docker Compose funcional.

✅ Status: Validada

## Fase 1.5

Validações:

- containers buildados com sucesso;
- API responde em http://127.0.0.1:3401/health;
- Web responde em http://127.0.0.1:3411;
- portas corretas configuradas (3341, 3401, 3411);
- bind apenas em 127.0.0.1 (não exposto publicamente);
- healthchecks configurados;
- restart unless-stopped configurado;
- configurações Nginx preparadas para host;
- instruções de SSL/Certbot documentadas.

✅ Status: Validada

Comandos de validação:
```bash
docker compose ps
curl -s http://127.0.0.1:3401/health
curl -I http://127.0.0.1:3411
```

### Correção de Healthcheck Web

Problema identificado: Container `cotacerta-web` ficava `unhealthy` porque o healthcheck usava `http://localhost/health` e dentro do container nginx:alpine o `localhost` não resolvia corretamente.

Solução aplicada: Alterado para `http://127.0.0.1/health` em:
- `docker-compose.yml` (serviço web)
- `apps/web/Dockerfile` (HEALTHCHECK)

Validação:
```bash
# Dentro do container funciona
docker exec cotacerta-web wget --quiet --tries=1 --spider http://127.0.0.1/health

# Status healthy
docker compose ps | grep web
# Output: cotacerta-web ... Up X seconds (healthy)
```

## Fase 2

Validações:

- ✅ Prisma ORM instalado e configurado (v6.19.3)
- ✅ Schema User criado com roles (ADMIN_PLATFORM, GESTOR_MASTER, COTISTA)
- ✅ Schema User criado com status (ACTIVE, BLOCKED, INACTIVE)
- ✅ Migration inicial executada com sucesso
- ✅ PrismaModule e PrismaService criados
- ✅ AuthModule com JWT configurado
- ✅ AuthService com bcrypt (10 rounds)
- ✅ DTOs com validação em português
- ✅ POST /auth/register funciona (role padrão: GESTOR_MASTER)
- ✅ POST /auth/login funciona
- ✅ GET /auth/me protegido por JWT funciona
- ✅ Email duplicado retorna 409 Conflict
- ✅ Senha incorreta retorna 401 Unauthorized
- ✅ Senha curta (<8 chars) retorna 400 Bad Request
- ✅ Rota protegida sem token retorna 401 Unauthorized
- ✅ PasswordHash nunca exposto nas respostas

✅ Status: Validada

## Fase 2.5 — Frontend Auth

Validações:

- ✅ react-router-dom instalado e configurado
- ✅ axios instalado com interceptors
- ✅ Estrutura de pastas criada (features/auth, pages, components/ui, lib, app)
- ✅ Sistema de tipos TypeScript (User, AuthResponse, LoginCredentials, RegisterData)
- ✅ AuthStorage para persistência de token no localStorage
- ✅ API client configurado (Bearer token automático, 401 redirect)
- ✅ AuthContext com estado global (user, isLoading, login, register, logout)
- ✅ Auto-carregamento de sessão via GET /auth/me
- ✅ ProtectedRoute (redireciona para /login se não autenticado)
- ✅ PublicOnlyRoute (redireciona para /dashboard se autenticado)
- ✅ Componente Button premium (primary/secondary, loading state)
- ✅ Componente Input premium (label, error, focus states)
- ✅ PublicLayout (gradient background, card centralizado)
- ✅ AuthenticatedLayout (header com user info, logout button)
- ✅ LoginPage funcional (integração com API)
- ✅ RegisterPage funcional (integração com API)
- ✅ DashboardPage com módulos futuros exibidos
- ✅ Sistema de rotas configurado (/, /login, /register, /dashboard)
- ✅ Build em produção funciona
- ✅ Container web (healthy) após rebuild
- ✅ Acesso público via HTTPS funcionando

✅ Status: Validada

**Credenciais Padrão para Testes:**
- Email: `admin@cotacerta.com`
- Senha: `admin123456`
- Role: Gestor Master

**URLs de Acesso:**
- Produção: https://cotacerta.gardenwjs.tech
- API: https://api.cotacerta.gardenwjs.tech
- Local Web: http://127.0.0.1:3411
- Local API: http://127.0.0.1:3401

Comandos de validação:
```bash
# Registro
curl -X POST http://127.0.0.1:3401/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"teste@example.com","password":"senha12345"}'

# Login
curl -X POST http://127.0.0.1:3401/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha12345"}'

# Rota protegida (usar token do login)
curl http://127.0.0.1:3401/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Containers healthy
docker compose ps
```

## Fase 3 — Caixinhas

Validações:

- ✅ Enum CashGroupStatus criado (ACTIVE, PAUSED, CLOSED, ARCHIVED)
- ✅ Model CashGroup criado no Prisma
- ✅ Relacionamento User -> CashGroup configurado
- ✅ Migration executada com sucesso
- ✅ CashGroupsModule criado e integrado ao AppModule
- ✅ CashGroupsService implementado com validações
- ✅ CashGroupsController com rotas protegidas por JWT
- ✅ DTOs com class-validator em português
- ✅ POST /cash-groups cria caixinha
- ✅ GET /cash-groups lista apenas caixinhas do usuário autenticado
- ✅ GET /cash-groups/:id retorna uma caixinha
- ✅ PATCH /cash-groups/:id atualiza caixinha
- ✅ DELETE /cash-groups/:id arquiva caixinha (soft delete)
- ✅ Validação de propriedade (apenas dono pode editar/ver)
- ✅ Tipos TypeScript criados no frontend
- ✅ API client frontend implementado
- ✅ Componente Modal premium criado
- ✅ Página de caixinhas com listagem
- ✅ Formulário de criar caixinha
- ✅ Formulário de editar caixinha
- ✅ Toggle pausar/ativar caixinha
- ✅ Empty state premium
- ✅ Dashboard atualizado com contagem real
- ✅ Rota /caixinhas adicionada
- ✅ Build em produção funciona
- ✅ Containers (healthy) após rebuild
- ✅ Acesso público via HTTPS funcionando

✅ Status: Validada

Comandos de validação:
```bash
# Login e criação de caixinha
curl -s -X POST http://127.0.0.1:3401/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cotacerta.com","password":"admin123456"}' > /tmp/login.json

TOKEN=$(cat /tmp/login.json | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Criar caixinha
curl -X POST http://127.0.0.1:3401/cash-groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Teste 2026","cycleYear":2026,"quotaValue":100,"dueDay":10}'

# Listar caixinhas
curl http://127.0.0.1:3401/cash-groups \
  -H "Authorization: Bearer $TOKEN"

# Containers healthy
docker compose ps
```

## Fase 3+

Cada fase deve ter:

- teste manual;
- teste automatizado quando aplicável;
- revisão de regra de negócio;
- registro de riscos.

## Fase 6 — Pix e comprovantes

Validações:

- ✅ Model `ChargePayment` criado no Prisma
- ✅ Model `PaymentReceipt` criado no Prisma
- ✅ Migration de pagamentos e comprovantes aplicada com sucesso
- ✅ Pagamento pertence a uma cobrança, caixinha e cotista
- ✅ Pagamento em cobrança de outro usuário retorna `403 Forbidden`
- ✅ Registro manual de pagamento parcial funciona
- ✅ Registro manual de pagamento total funciona
- ✅ `amountPaid` da cobrança passa a ser calculado pelo histórico
- ✅ `status` da cobrança é recalculado para `PENDING`, `PARTIAL` ou `PAID`
- ✅ `paidAt` da cobrança reflete o pagamento mais recente
- ✅ Cobrança com pagamentos não pode ser cancelada
- ✅ Comprovante simples pode ser anexado ao pagamento
- ✅ Tipos de comprovante aceitos: JPG, PNG, WEBP e PDF
- ✅ Limite de comprovante de até 5MB validado
- ✅ GET de detalhe da cobrança retorna histórico de pagamentos
- ✅ Frontend exibe histórico e comprovante associado
- ✅ Build da API funciona
- ✅ Build do Web funciona
- ✅ Vencimento da cobrança preserva o dia configurado sem regressão de fuso
- ✅ Cobrança vencida recebe acréscimo conforme taxa da caixinha
- ✅ Valor original e valor atualizado ficam visíveis para o gestor

✅ Status: Validada

## Fase 7 — Empréstimos

Validações:

- ✅ Model `Loan` criado no Prisma
- ✅ Model `LoanPayment` criado no Prisma
- ✅ Empréstimos separados de `MonthlyCharge` e `Payment` de mensalidade
- ✅ Empréstimo só pode ser criado para cotista ativo da própria caixinha
- ✅ Juros são calculados no backend com base em principal + percentual
- ✅ Empréstimo usa vencimento padrão até o fim do ciclo da caixinha
- ✅ Fluxo de pagamento permite receber total ou apenas juros pendentes
- ✅ Pagamentos parciais mudam o status para `PARTIAL`
- ✅ Pagamentos totais mudam o status para `PAID`
- ✅ Cancelamento lógico de empréstimo implementado
- ✅ Cancelamento lógico de pagamento do empréstimo implementado
- ✅ Visão global do módulo disponível no dashboard
- ✅ Página da caixinha com resumo, lista, histórico e recebimentos

✅ Status: Validada

## Fase 8 — Quem Deve

Validações:

- ✅ Módulo `debtors` criado e integrado ao AppModule
- ✅ GET /debtors endpoint funcionando
- ✅ GET /cash-groups/:id/debtors endpoint funcionando
- ✅ GET /cash-groups/:id/debtors/:memberId/message endpoint funcionando
- ✅ Consolidação de cobranças pendentes (PENDING, PARTIAL, OVERDUE)
- ✅ Consolidação de empréstimos pendentes (OPEN, PARTIAL)
- ✅ Separação entre dívida de cotas e dívida de empréstimos
- ✅ Total pendente calculado no backend
- ✅ Usuário só acessa dados das próprias caixinhas
- ✅ Mensagem de cobrança gerada com formatação WhatsApp
- ✅ Link WhatsApp funcional (wa.me) gerado
- ✅ Sem telefone retorna whatsappUrl null
- ✅ Filtro por caixinha funciona
- ✅ Filtro por mês/ano funciona
- ✅ Frontend: página /quem-deve criada
- ✅ Frontend: cards de resumo exibindo estatísticas
- ✅ Frontend: lista de devedores com separação
- ✅ Frontend: botão "Copiar mensagem" funcional
- ✅ Frontend: botão "Cobrar no WhatsApp" funcional
- ✅ Frontend: botão desabilitado quando sem telefone
- ✅ Frontend: links para cobranças e empréstimos
- ✅ Frontend: estado vazio quando ninguém deve
- ✅ Frontend: filtros de caixinha, mês e ano
- ✅ Endpoint sem token retorna 401 Unauthorized
- ✅ Cobranças PAID e CANCELED não entram como dívida
- ✅ Empréstimos PAID e CANCELED não entram como dívida
- ✅ Build API passou
- ✅ Build Web passou
- ✅ Containers healthy após rebuild
- ✅ API pública continua OK
- ✅ Web pública continua OK
- ✅ Nenhuma nova movimentação financeira criada
- ✅ Nenhum fechamento anual implementado
- ✅ Nenhuma integração WhatsApp API oficial implementada
- ✅ Nenhum OCR/IA implementado

✅ Status: Validada

Comandos de validação:
```bash
# Login e teste de endpoints
LOGIN_RESPONSE=$(curl -s -X POST https://api.cotacerta.gardenwjs.tech/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cotacerta.com","password":"admin123456"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

# Listar todos os devedores
curl -s "https://api.cotacerta.gardenwjs.tech/debtors" \
  -H "Authorization: Bearer $TOKEN" | jq '.summary'

# Listar devedores de uma caixinha específica
curl -s "https://api.cotacerta.gardenwjs.tech/cash-groups/CASH_GROUP_ID/debtors?referenceMonth=5&referenceYear=2026" \
  -H "Authorization: Bearer $TOKEN" | jq '.summary'

# Gerar mensagem de cobrança
curl -s "https://api.cotacerta.gardenwjs.tech/cash-groups/CASH_GROUP_ID/debtors/MEMBER_ID/message?referenceMonth=5&referenceYear=2026" \
  -H "Authorization: Bearer $TOKEN" | jq '.message'

# Sem token (deve retornar 401)
curl -i "https://api.cotacerta.gardenwjs.tech/debtors"

# Containers healthy
docker compose ps

# Health checks
curl -s https://api.cotacerta.gardenwjs.tech/health
curl -I https://cotacerta.gardenwjs.tech
```

## Fase 9 — Painel do cotista

Validações:

- ✅ Vínculo 1:1 entre `User` e `Member` criado no Prisma (`userId` em Member)
- ✅ Migration `20260509180000_add_member_user_link` aplicada em produção
- ✅ `UserRole.COTISTA` já existia no schema; utilizado para role do cotista
- ✅ `RolesGuard` implementado (`auth/guards/roles.guard.ts`)
- ✅ Decorator `@Roles(...)` implementado (`auth/decorators/roles.decorator.ts`)
- ✅ Todas as rotas de gestor bloqueadas para `COTISTA` (403 Forbidden)
- ✅ Módulo `member-access` criado com endpoints de criação/bloqueio/ativação de acesso
- ✅ POST `/cash-groups/:groupId/members/:memberId/access` cria User COTISTA vinculado ao Member
- ✅ Senha provisória gerada pelo backend (10 chars alfanuméricos)
- ✅ Senha provisória retornada uma única vez na resposta de criação
- ✅ Senha provisória nunca armazenada em texto puro (bcrypt hash)
- ✅ PATCH `.../access/block` bloqueia acesso do cotista
- ✅ PATCH `.../access/activate` reativa acesso do cotista
- ✅ GET `.../access` retorna status do acesso sem senha
- ✅ Gestor só cria/gerencia acesso de cotistas das próprias caixinhas
- ✅ Member duplicado retorna erro (sem duplicidade de acesso)
- ✅ Módulo `member-portal` criado com endpoints exclusivos do cotista
- ✅ GET `/member-portal/me` retorna dados do cotista logado
- ✅ GET `/member-portal/groups` retorna caixinhas do cotista
- ✅ GET `/member-portal/charges` retorna cobranças do cotista
- ✅ GET `/member-portal/payments` retorna pagamentos do cotista
- ✅ GET `/member-portal/loans` retorna empréstimos do cotista
- ✅ GET `/member-portal/debts` retorna pendências do cotista
- ✅ Cotista logado acessa apenas dados do próprio Member
- ✅ Gestor não acessa `/member-portal/me` (403 Forbidden)
- ✅ Cotista bloqueado não consegue logar ("Usuário inativo ou bloqueado")
- ✅ Frontend: redirecionamento por role após login (COTISTA → /meu-painel, GESTOR → /dashboard)
- ✅ Frontend: `GestorRoute` bloqueia COTISTA com redirect para /meu-painel
- ✅ Frontend: `CotistaRoute` bloqueia não-COTISTA com redirect para /dashboard
- ✅ Frontend: `MemberPortalPage` com dashboard do cotista
- ✅ Frontend: badge "Acesso ativo" / "Sem acesso" na listagem de cotistas
- ✅ Frontend: modal de criação de acesso com exibição da senha provisória
- ✅ Frontend: botões copiar email, senha e link de acesso
- ✅ Frontend: botões bloquear/ativar acesso do cotista
- ✅ Build API passou
- ✅ Build Web passou
- ✅ Migration aplicada em produção
- ✅ Containers healthy após rebuild
- ✅ API pública continua OK
- ✅ Web pública continua OK
- ✅ Sem envio de email/SMS
- ✅ Sem confirmação por email/SMS
- ✅ Sem convite por token
- ✅ Nenhuma regra financeira alterada

✅ Status: Validada

Comandos de validação:
```bash
# Login gestor
LOGIN_RESPONSE=$(curl -s -X POST https://api.cotacerta.gardenwjs.tech/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cotacerta.com","password":"admin123456"}')
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

# Criar acesso para cotista
curl -i -X POST https://api.cotacerta.gardenwjs.tech/cash-groups/$GROUP_ID/members/$MEMBER_ID/access \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"cotista@example.com"}'

# Login cotista com senha provisória
curl -s -X POST https://api.cotacerta.gardenwjs.tech/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"cotista@example.com","password":"SENHA_PROVISORIA"}' | jq .

# Portal do cotista
COTISTA_TOKEN="..."
curl -s https://api.cotacerta.gardenwjs.tech/member-portal/me \
  -H "Authorization: Bearer $COTISTA_TOKEN" | jq .

# Cotista bloqueado em rota de gestor (deve retornar 403)
curl -i https://api.cotacerta.gardenwjs.tech/cash-groups \
  -H "Authorization: Bearer $COTISTA_TOKEN"

# Bloquear acesso
curl -X PATCH https://api.cotacerta.gardenwjs.tech/cash-groups/$GROUP_ID/members/$MEMBER_ID/access/block \
  -H "Authorization: Bearer $TOKEN"
```

