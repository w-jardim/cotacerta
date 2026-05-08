-- =============================================================================
-- CotaCerta — Limpeza segura para produção
-- Remove dados operacionais de teste preservando o usuário administrador
-- Gerado em: 2026-05-08
-- =============================================================================

-- Proteção: abortar se não houver admin ativo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE email = 'admin@cotacerta.com'
      AND role IN ('ADMIN_PLATFORM', 'GESTOR_MASTER')
      AND status = 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Usuário admin@cotacerta.com não encontrado ou inativo. Abortando limpeza.';
  END IF;
END $$;

-- Usuário que será preservado
SELECT id, name, email, role, status
FROM users
WHERE email = 'admin@cotacerta.com';

-- Contagens ANTES
SELECT 'ANTES' AS momento, tabela, registros FROM (
  SELECT 'users'                           AS tabela, COUNT(*)::int AS registros FROM users
  UNION ALL SELECT 'cash_groups',                     COUNT(*)::int FROM cash_groups
  UNION ALL SELECT 'members',                         COUNT(*)::int FROM members
  UNION ALL SELECT 'monthly_charges',                 COUNT(*)::int FROM monthly_charges
  UNION ALL SELECT 'charge_payments',                 COUNT(*)::int FROM charge_payments
  UNION ALL SELECT 'payment_receipts',                COUNT(*)::int FROM payment_receipts
  UNION ALL SELECT 'loans',                           COUNT(*)::int FROM loans
  UNION ALL SELECT 'loan_payments',                   COUNT(*)::int FROM loan_payments
  UNION ALL SELECT 'annual_closings',                 COUNT(*)::int FROM annual_closings
  UNION ALL SELECT 'annual_closing_member_results',   COUNT(*)::int FROM annual_closing_member_results
) t ORDER BY tabela;

-- =============================================================================
-- LIMPEZA (transação segura)
-- =============================================================================
BEGIN;

-- 1. Fechamento anual (results primeiro por FK CASCADE, mas explicitamos)
DELETE FROM annual_closing_member_results;
DELETE FROM annual_closings;

-- 2. Empréstimos
DELETE FROM loan_payments;
DELETE FROM loans;

-- 3. Pagamentos de cobranças
DELETE FROM payment_receipts;
DELETE FROM charge_payments;

-- 4. Cobranças mensais
DELETE FROM monthly_charges;

-- 5. Cotistas
DELETE FROM members;

-- 6. Caixinhas
DELETE FROM cash_groups;

-- 7. Usuários de teste (todos exceto admin@cotacerta.com)
DELETE FROM users
WHERE email <> 'admin@cotacerta.com';

COMMIT;

-- =============================================================================
-- VALIDAÇÃO PÓS-LIMPEZA
-- =============================================================================

-- Usuários remanescentes
SELECT id, name, email, role, status FROM users ORDER BY created_at;

-- Contagens DEPOIS
SELECT 'DEPOIS' AS momento, tabela, registros FROM (
  SELECT 'users'                           AS tabela, COUNT(*)::int AS registros FROM users
  UNION ALL SELECT 'cash_groups',                     COUNT(*)::int FROM cash_groups
  UNION ALL SELECT 'members',                         COUNT(*)::int FROM members
  UNION ALL SELECT 'monthly_charges',                 COUNT(*)::int FROM monthly_charges
  UNION ALL SELECT 'charge_payments',                 COUNT(*)::int FROM charge_payments
  UNION ALL SELECT 'payment_receipts',                COUNT(*)::int FROM payment_receipts
  UNION ALL SELECT 'loans',                           COUNT(*)::int FROM loans
  UNION ALL SELECT 'loan_payments',                   COUNT(*)::int FROM loan_payments
  UNION ALL SELECT 'annual_closings',                 COUNT(*)::int FROM annual_closings
  UNION ALL SELECT 'annual_closing_member_results',   COUNT(*)::int FROM annual_closing_member_results
) t ORDER BY tabela;
