# Deploy CotaCerta - Instruções

## 1. Containers já estão rodando

Os containers foram buildados e estão em execução:

```bash
docker compose ps
```

Você deve ver:
- cotacerta-postgres (porta 127.0.0.1:3341)
- cotacerta-api (porta 127.0.0.1:3401)
- cotacerta-web (porta 127.0.0.1:3411)

## 2. Testar containers localmente

```bash
# Testar API
curl -s http://127.0.0.1:3401/health

# Testar Web
curl -I http://127.0.0.1:3411
```

## 3. Configurar Nginx no host

### 3.1. Copiar configurações para o Nginx

```bash
# Copiar configuração do Web
sudo cp /opt/apps/projects/cotacerta/infra/nginx/cotacerta.gardenwjs.tech.conf /etc/nginx/sites-available/

# Copiar configuração da API
sudo cp /opt/apps/projects/cotacerta/infra/nginx/api.cotacerta.gardenwjs.tech.conf /etc/nginx/sites-available/
```

### 3.2. Ativar sites

```bash
# Ativar Web
sudo ln -s /etc/nginx/sites-available/cotacerta.gardenwjs.tech.conf /etc/nginx/sites-enabled/

# Ativar API
sudo ln -s /etc/nginx/sites-available/api.cotacerta.gardenwjs.tech.conf /etc/nginx/sites-enabled/
```

### 3.3. Testar configuração e recarregar

```bash
# Testar sintaxe
sudo nginx -t

# Se OK, recarregar Nginx
sudo systemctl reload nginx
```

## 4. Testar acesso HTTP (sem SSL)

```bash
# Testar Web (do servidor ou de fora)
curl -I http://cotacerta.gardenwjs.tech

# Testar API
curl -s http://api.cotacerta.gardenwjs.tech/health
```

## 5. Configurar SSL com Certbot

### 5.1. Instalar Certbot (se ainda não estiver instalado)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2. Emitir certificados SSL

```bash
# Emitir SSL para ambos os domínios de uma vez
sudo certbot --nginx -d cotacerta.gardenwjs.tech -d api.cotacerta.gardenwjs.tech

# OU emitir separadamente:
# sudo certbot --nginx -d cotacerta.gardenwjs.tech
# sudo certbot --nginx -d api.cotacerta.gardenwjs.tech
```

Siga as instruções do Certbot:
- Informe um email para notificações
- Aceite os termos de serviço
- Escolha redirecionar HTTP para HTTPS (recomendado)

### 5.3. Verificar renovação automática

```bash
# Testar renovação (dry-run)
sudo certbot renew --dry-run
```

O Certbot cria um timer systemd para renovação automática.

## 6. Testar acesso HTTPS

```bash
# Testar Web
curl -I https://cotacerta.gardenwjs.tech

# Testar API
curl -s https://api.cotacerta.gardenwjs.tech/health
```

## 7. Comandos úteis

### Gerenciar containers

```bash
# Ver logs
docker compose logs -f

# Ver logs apenas da API
docker compose logs -f api

# Ver logs apenas do Web
docker compose logs -f web

# Parar containers
docker compose down

# Subir containers
docker compose up -d

# Rebuild e subir
docker compose up -d --build

# Ver status
docker compose ps
```

### Gerenciar Nginx

```bash
# Ver status
sudo systemctl status nginx

# Parar
sudo systemctl stop nginx

# Iniciar
sudo systemctl start nginx

# Recarregar (sem downtime)
sudo systemctl reload nginx

# Reiniciar
sudo systemctl restart nginx

# Testar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/access.log
```

## 8. Troubleshooting

### Container não sobe

```bash
# Ver logs do container
docker compose logs api
docker compose logs web

# Entrar no container
docker compose exec api sh
docker compose exec web sh
```

### Nginx não conecta ao container

```bash
# Verificar se porta está ouvindo
sudo netstat -tlnp | grep 3401
sudo netstat -tlnp | grep 3411

# Testar conexão local
curl http://127.0.0.1:3401/health
curl http://127.0.0.1:3411
```

### SSL não funciona

```bash
# Verificar certificados
sudo certbot certificates

# Ver logs do Certbot
sudo journalctl -u certbot

# Forçar renovação
sudo certbot renew --force-renewal
```

## 9. Segurança

### Firewall

Certifique-se de que apenas as portas necessárias estão abertas:

```bash
# Ver regras do firewall
sudo ufw status

# Se necessário, permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Não abrir as portas 3341, 3401, 3411 publicamente
# Elas devem ficar apenas em 127.0.0.1
```

## 10. Backup

### Backup do banco de dados

```bash
# Exportar banco
docker compose exec postgres pg_dump -U cotacerta cotacerta > backup_$(date +%Y%m%d).sql

# Importar banco
docker compose exec -T postgres psql -U cotacerta cotacerta < backup_20260504.sql
```

### Backup dos volumes

```bash
# Listar volumes
docker volume ls

# Backup do volume do Postgres
docker run --rm -v cotacerta_cotacerta_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_data_$(date +%Y%m%d).tar.gz /data
```
