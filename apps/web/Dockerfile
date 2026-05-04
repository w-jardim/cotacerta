# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências do monorepo
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Instalar dependências do workspace
RUN npm ci

# Copiar código fonte
COPY apps/web ./apps/web
COPY packages ./packages

# Build da Web com Vite
WORKDIR /app/apps/web
RUN npm run build

# Production stage com Nginx
FROM nginx:1.25-alpine

# Copiar arquivos buildados para o Nginx
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copiar configuração customizada do Nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta 80
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Nginx já tem CMD padrão
CMD ["nginx", "-g", "daemon off;"]
