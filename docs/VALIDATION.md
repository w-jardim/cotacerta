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
