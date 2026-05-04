# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências do monorepo
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/

# Instalar dependências do workspace
RUN npm ci

# Copiar código fonte
COPY apps/api ./apps/api
COPY packages ./packages

# Build da API
WORKDIR /app/apps/api
RUN npm run build

# Gerar Prisma Client
RUN npx prisma generate

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copiar package.json e instalar apenas deps de produção
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/api/package*.json ./apps/api/

# Instalar apenas dependências de produção
RUN npm ci --omit=dev --workspace=apps/api

# Copiar código compilado
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

WORKDIR /app/apps/api

# Gerar Prisma Client no ambiente de produção
RUN npx prisma generate

# Expor porta da API
EXPOSE 3401

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV API_PORT=3401

# Comando de inicialização
CMD ["npm", "run", "start:prod"]
