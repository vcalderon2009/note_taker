# Deployment Guide

This guide covers deploying Note-Taker AI to production environments.

## Deployment Options

### 1. Docker Compose (Recommended for VPS)

Best for single-server deployments with full control.

### 2. Cloud Platforms

- **AWS**: ECS, EKS, or EC2 with Docker
- **Google Cloud**: Cloud Run, GKE, or Compute Engine
- **Azure**: Container Instances, AKS, or Virtual Machines
- **DigitalOcean**: App Platform or Droplets

### 3. Kubernetes

For scalable, multi-server deployments.

## Prerequisites

- **Server**: Linux server with Docker and Docker Compose
- **Domain**: Domain name for your application (optional)
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)
- **Backup Strategy**: Database and file backups
- **Monitoring**: Log aggregation and monitoring tools

## Production Environment Setup

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Make (optional)
sudo apt install make -y
```

### 2. Clone and Configure

```bash
# Clone repository
git clone https://github.com/your-username/note-taker.git
cd note_taker

# Copy production configuration
cp infra/compose/docker-compose.prod.yml.example infra/compose/docker-compose.prod.yml
```

### 3. Environment Configuration

Create production environment file:

```bash
# .env.production
# Database
POSTGRES_DB=note_taker_prod
POSTGRES_USER=note_taker_user
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_HOST=db
POSTGRES_PORT=5432

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
API_RELOAD=false

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_WS_URL=wss://your-domain.com/ws

# AI Configuration
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2:3b

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET=your_jwt_secret_here

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_BURST=10
```

### 4. SSL Certificate Setup

#### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Certificates will be stored in /etc/letsencrypt/live/your-domain.com/
```

#### Using Nginx Reverse Proxy

Create nginx configuration:

```nginx
# /etc/nginx/sites-available/note-taker
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/note-taker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Compose Production Setup

### 1. Production Docker Compose

```yaml
# infra/compose/docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    build:
      context: ../../src/api
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      - LLM_PROVIDER=${LLM_PROVIDER}
      - OLLAMA_BASE_URL=${OLLAMA_BASE_URL}
      - SECRET_KEY=${SECRET_KEY}
      - LOG_LEVEL=${LOG_LEVEL}
    depends_on:
      db:
        condition: service_healthy
      ollama:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ../../src/frontend
      dockerfile: Dockerfile
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
    depends_on:
      api:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - api
    restart: unless-stopped

volumes:
  postgres_data:
  ollama_data:
```

### 2. Deploy with Docker Compose

```bash
# Start production services
docker-compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.prod.yml up -d

# Check status
docker-compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.prod.yml ps

# View logs
docker-compose -f infra/compose/docker-compose.yml -f infra/compose/docker-compose.prod.yml logs -f
```

## Cloud Platform Deployments

### AWS ECS Deployment

1. **Create ECS Cluster**
2. **Build and Push Images to ECR**
3. **Create Task Definitions**
4. **Set up Load Balancer**
5. **Configure RDS Database**

### Google Cloud Run

1. **Build and Push to Container Registry**
2. **Deploy Services**
3. **Configure Cloud SQL**
4. **Set up Cloud Load Balancing**

### DigitalOcean App Platform

1. **Connect GitHub Repository**
2. **Configure Build Settings**
3. **Set Environment Variables**
4. **Deploy Database**

## Database Management

### Backup Strategy

```bash
# Create backup script
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="note_taker_prod"

# Create backup
docker-compose exec -T db pg_dump -U $POSTGRES_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Restore from Backup

```bash
# Restore database
gunzip -c /backups/backup_20240115_120000.sql.gz | docker-compose exec -T db psql -U $POSTGRES_USER $DB_NAME
```

### Database Migrations

```bash
# Run migrations in production
docker-compose exec api alembic upgrade head

# Check migration status
docker-compose exec api alembic current
```

## Monitoring and Logging

### Application Monitoring

#### Health Checks

```bash
# Check API health
curl https://your-domain.com/api/health

# Check all services
docker-compose ps
```

#### Log Management

```bash
# View application logs
docker-compose logs -f api
docker-compose logs -f frontend

# Log rotation (add to crontab)
0 0 * * * docker-compose logs --tail=1000 api > /var/log/note-taker/api.log.$(date +\%Y\%m\%d)
```

#### Monitoring with Prometheus

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'note-taker-api'
    static_configs:
      - targets: ['api:8000']
    metrics_path: '/api/metrics'
```

### Performance Monitoring

#### Database Monitoring

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('note_taker_prod'));

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### Application Metrics

- **Response Time**: Monitor API response times
- **Error Rate**: Track error rates and types
- **Throughput**: Monitor requests per second
- **Resource Usage**: CPU, memory, and disk usage

## Security Considerations

### Environment Security

1. **Firewall Configuration**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS Configuration**
   - Use strong cipher suites
   - Enable HSTS headers
   - Regular certificate renewal

3. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Regular security updates

### Application Security

1. **Environment Variables**
   - Never commit secrets to version control
   - Use secure secret management
   - Rotate secrets regularly

2. **API Security**
   - Implement rate limiting
   - Use HTTPS only
   - Validate all inputs
   - Implement proper authentication

3. **Container Security**
   - Use minimal base images
   - Regular security updates
   - Run containers as non-root user

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer**: Distribute traffic across multiple instances
2. **Database Scaling**: Read replicas for read-heavy workloads
3. **Caching**: Redis for session and data caching
4. **CDN**: CloudFront or similar for static assets

### Vertical Scaling

1. **Resource Monitoring**: Track CPU, memory, and disk usage
2. **Auto-scaling**: Automatic resource adjustment based on load
3. **Performance Tuning**: Optimize database queries and application code

## Maintenance

### Regular Maintenance Tasks

1. **Security Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

2. **Database Maintenance**
   ```bash
   # Vacuum database
   docker-compose exec db psql -U $POSTGRES_USER $DB_NAME -c "VACUUM ANALYZE;"
   
   # Check database health
   docker-compose exec db psql -U $POSTGRES_USER $DB_NAME -c "SELECT * FROM pg_stat_activity;"
   ```

3. **Log Rotation**
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/note-taker
   ```

### Disaster Recovery

1. **Backup Verification**: Regularly test backup restoration
2. **Recovery Procedures**: Document step-by-step recovery process
3. **Monitoring Alerts**: Set up alerts for critical failures
4. **Documentation**: Keep deployment documentation up to date

## Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check resource usage
docker stats

# Restart service
docker-compose restart service-name
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec db pg_isready -U $POSTGRES_USER

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec api python -c "from app.db import get_db; print('DB OK')"
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect your-domain.com:443
```

### Performance Issues

1. **Check Resource Usage**: Monitor CPU, memory, and disk
2. **Database Performance**: Analyze slow queries
3. **Network Issues**: Check connectivity and latency
4. **Application Logs**: Look for errors and warnings

---

For additional help with deployment, check the [Development Guide](development.md) or create an issue on GitHub.
