# Guia de Padrões de Botões

## Componentes Disponíveis

### 1. Button (Botões Principais)
**Local:** `src/components/ui/Button.tsx`

**Uso:** Ações principais, submissão de formulários, modais

**Variantes:**
- `primary` (padrão) - Ações principais, criar, salvar, confirmar
- `secondary` - Ações secundárias, cancelar, voltar

**Exemplos:**
```tsx
<Button onClick={handleSubmit}>Criar Caixinha</Button>
<Button variant="secondary" onClick={onCancel}>Cancelar</Button>
<Button isLoading={loading}>Salvando...</Button>
```

---

### 2. ActionButton (Botões de Ação em Tabelas)
**Local:** `src/components/ui/ActionButton.tsx`

**Uso:** Ações inline em tabelas, cards, listas

**Variantes:**
- `primary` - Editar, visualizar, gerenciar
- `success` - Aprovar, pagar, confirmar
- `warning` - Pausar, bloquear, advertir
- `danger` - Remover, excluir, cancelar

**Exemplos:**
```tsx
<ActionButton variant="primary" onClick={handleEdit}>Editar</ActionButton>
<ActionButton variant="success" onClick={handleApprove}>Aprovar</ActionButton>
<ActionButton variant="warning" onClick={handleBlock}>Bloquear</ActionButton>
<ActionButton variant="danger" onClick={handleDelete}>Remover</ActionButton>
```

---

### 3. LinkButton (Botões Estilo Link)
**Local:** `src/components/ui/LinkButton.tsx`

**Uso:** Links clicáveis, navegação, ações terciárias

**Variantes:**
- `default` - Navegação, links gerais
- `danger` - Ações destrutivas de baixa prioridade (arquivar)

**Exemplos:**
```tsx
<LinkButton onClick={handleNavigate}>Gerenciar →</LinkButton>
<LinkButton variant="danger" onClick={handleArchive}>Arquivar Caixinha</LinkButton>
```

---

### 4. BackButton (Botão de Voltar)
**Local:** `src/components/ui/BackButton.tsx`

**Uso:** Navegação para página anterior

**Props:**
- `to` (obrigatório) - Caminho para onde voltar
- `label` (opcional) - Texto do botão (padrão: "Voltar")

**Exemplos:**
```tsx
<BackButton to="/dashboard" />
<BackButton to="/caixinhas" label="Voltar para Caixinhas" />
```

---

## Diretrizes de Uso

### Quando usar cada componente:

1. **Button** ➜ Formulários, modais, ações principais da página
2. **ActionButton** ➜ Tabelas, listas, ações inline
3. **LinkButton** ➜ Navegação secundária, links clicáveis
4. **BackButton** ➜ Voltar para página anterior

### Cores por Ação:

| Ação | Componente | Variante | Cor |
|------|------------|----------|-----|
| Criar, Salvar, Confirmar | Button | primary | Preto |
| Cancelar, Fechar | Button | secondary | Cinza |
| Editar, Ver | ActionButton | primary | Azul |
| Aprovar, Pagar | ActionButton | success | Verde |
| Pausar, Bloquear | ActionButton | warning | Âmbar |
| Remover, Excluir | ActionButton | danger | Vermelho |
| Navegar | LinkButton | default | Azul |
| Arquivar | LinkButton | danger | Vermelho |

---

## ❌ NÃO FAZER

```tsx
// ❌ Não criar botões inline com classes diretas
<button className="text-blue-600 hover:text-blue-800">Editar</button>

// ❌ Não usar estilos inconsistentes
<button className="px-4 py-2 bg-red-500">Excluir</button>
```

## ✅ FAZER

```tsx
// ✅ Usar componentes padronizados
<ActionButton variant="primary" onClick={handleEdit}>Editar</ActionButton>

// ✅ Usar as variantes corretas
<ActionButton variant="danger" onClick={handleDelete}>Excluir</ActionButton>
```

---

## Atualizações Recentes

- **06/05/2026** - Criados componentes ActionButton e LinkButton
- **06/05/2026** - Padronizados botões em ChargesPage, ChargesListPage, MembersPage e CashGroupsPage
