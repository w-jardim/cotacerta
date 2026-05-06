# CotaCerta

Sistema para gestão de caixinhas coletivas de cotistas.

## Objetivo

O CotaCerta visa ajudar gestores de caixinhas a controlar:

- caixinhas independentes;
- cotistas;
- cotas mensais;
- pagamentos por Pix;
- comprovantes;
- quem pagou;
- quem está devendo;
- empréstimos com juros;
- fechamento anual;
- divisão final por cota;
- painel simples do cotista.

## Persona inicial

O sistema nasce a partir da dor de um gestor que administra várias caixinhas no papel, recebe pagamentos por Pix, cobra atrasos por WhatsApp e precisa conferir comprovantes manualmente.

## Princípio principal

Cada caixinha deve ser independente.  
Dados financeiros nunca podem misturar grupos diferentes.

## Status

Projeto em desenvolvimento ativo.

### Acesso ao Sistema

**URL de Produção:** https://cotacerta.gardenwjs.tech

**Credenciais Padrão:**
- Email: `admin@cotacerta.com`
- Senha: `admin123456`
- Role: Gestor Master

> ⚠️ **Importante:** Altere a senha padrão em ambiente de produção.

### Desenvolvimento Local

```bash
# Subir containers
docker compose up -d

# Acessar localmente
Web: http://127.0.0.1:3411
API: http://127.0.0.1:3401

# Executar seed (criar usuário padrão)
docker exec cotacerta-api npm run prisma:seed
```

## Fases previstas

1. Documentação base
2. Setup técnico
3. Autenticação
4. Caixinhas
5. Cotistas
6. Cobranças mensais
7. Pagamentos Pix e comprovantes
8. Tela de quem deve
9. Painel do cotista
10. Empréstimos
11. Fechamento anual
12. Leitura inteligente de comprovantes
