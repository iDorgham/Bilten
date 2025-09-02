# Docker Guide

This guide covers Docker containerization, orchestration, and deployment strategies for the EventChain platform.

## Container Architecture

### Service Overview
```
EventChain Docker Architecture
├── Frontend (Next.js)
├── API Gateway (Node.js/Express)
├── Event Service (Node.js/Express)
├── Order Service (Node.js/Express)
├── Analytics Service (Node.js/Express)
├── PostgreSQL Database
├── Redis Cache
└── Nginx Reverse Proxy
```

### Container Network
- **Frontend Network**: Public-facing web application
- **API Network**: Internal microservices communication
- **Database Network**: Isolated database access
- **Cache Network**: Redis cache access

## Dockerfile Configuration

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### API Service Dockerfile
```dockerfile
# api-gateway/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies for building
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create app user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### Database Dockerfile
```dockerfile
# database/Dockerfile
FROM postgres:15-alpine

# Install additional extensions
RUN apk add --no-cache postgresql-contrib

# Copy initialization scripts
COPY ./init-scripts/ /docker-entrypoint-initdb.d/

# Copy custom configuration
COPY ./postgresql.conf /etc/postgresql/postgresql.conf
COPY ./pg_hba.conf /etc/postgresql/pg_hba.conf

# Set permissions
RUN chmod 644 /etc/postgresql/postgresql.conf
RUN chmod 644 /etc/postgresql/pg_hba.conf

# Expose port
EXPOSE 5432

# Use custom configuration
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]
```

## Docker Compose Configuration

### Development Environment
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend Service
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: base
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - api-gateway
    networks:
      - frontend-network
    restart: unless-stopped

  # API Gateway
  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
      target: base
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://eventchain:password@postgres:5432/eventchain_dev
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=dev-secret-key
    volumes:
      - ./api-gateway:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - api-network
      - database-network
    restart: unless-stopped

  # Event Service
  event-service:
    build:
      context: ./services/event-service
      dockerfile: Dockerfile
      target: base
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://eventchain:password@postgres:5432/eventchain_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/event-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - api-network
      - database-network
    restart: unless-stopped

  # Order Service
  order-service:
    build:
      context: ./services/order-service
      dockerfile: Dockerfile
      target: base
    ports:
      - "3003:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://eventchain:password@postgres:5432/eventchain_dev
      - REDIS_URL=redis://redis:6379
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
    volumes:
      - ./services/order-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - api-network
      - database-network
    restart: unless-stopped

  # Analytics Service
  analytics-service:
    build:
      context: ./services/analytics-service
      dockerfile: Dockerfile
      target: base
    ports:
      - "3004:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://eventchain:password@postgres:5432/eventchain_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./services/analytics-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - api-network
      - database-network
    restart: unless-stopped

  # PostgreSQL Database
  postgres:
    build:
      context: ./database
      dockerfile: Dockerfile
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=eventchain_dev
      - POSTGRES_USER=eventchain
      - POSTGRES_PASSWORD=password
      - POSTGRES_INITDB_ARGS=--encoding=UTF-8 --lc-collate=C --lc-ctype=C
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init-scripts:/docker-entrypoint-initdb.d
    networks:
      - database-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U eventchain -d eventchain_dev"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass redispassword
    volumes:
      - redis_data:/data
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
    networks:
      - database-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api-gateway
    networks:
      - frontend-network
      - api-network
    restart: unless-stopped

networks:
  frontend-network:
    driver: bridge
  api-network:
    driver: bridge
  database-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Production Environment
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: runner
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.eventchain.com
    networks:
      - frontend-network
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

  api-gateway:
    build:
      context: ./api-gateway
      dockerfile: Dockerfile
      target: runner
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    networks:
      - api-network
      - database-network
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Additional production configurations...

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

## Container Orchestration

### Docker Swarm Configuration

#### Initialize Swarm
```bash
# Initialize Docker Swarm
docker swarm init --advertise-addr <manager-ip>

# Add worker nodes
docker swarm join --token <worker-token> <manager-ip>:2377
```

#### Deploy Stack
```bash
# Deploy production stack
docker stack deploy -c docker-compose.prod.yml eventchain

# Check stack status
docker stack services eventchain
docker stack ps eventchain
```

### Kubernetes Deployment

#### Namespace Configuration
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: eventchain
  labels:
    name: eventchain
```

#### API Gateway Deployment
```yaml
# k8s/api-gateway-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: eventchain
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: eventchain/api-gateway:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: eventchain-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: eventchain-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: eventchain
spec:
  selector:
    app: api-gateway
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

## Container Security

### Security Best Practices

#### Dockerfile Security
```dockerfile
# Use specific version tags
FROM node:18.17.0-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Don't run as root
USER nextjs

# Use COPY instead of ADD
COPY --chown=nextjs:nodejs . .

# Remove unnecessary packages
RUN apk del .build-deps

# Set read-only filesystem
RUN chmod -R 755 /app
```

#### Container Scanning
```bash
# Scan images for vulnerabilities
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/Library/Caches:/root/.cache/ \
  aquasec/trivy image eventchain/api-gateway:latest

# Scan with Snyk
snyk container test eventchain/api-gateway:latest
```

### Secrets Management

#### Docker Secrets
```bash
# Create secrets
echo "postgresql://user:pass@host:5432/db" | docker secret create db_url -
echo "redis://redis:6379" | docker secret create redis_url -

# Use in service
docker service create \
  --name api-gateway \
  --secret db_url \
  --secret redis_url \
  eventchain/api-gateway:latest
```

#### Kubernetes Secrets
```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: eventchain-secrets
  namespace: eventchain
type: Opaque
data:
  database-url: <base64-encoded-url>
  redis-url: <base64-encoded-url>
  jwt-secret: <base64-encoded-secret>
```

## Monitoring and Logging

### Container Monitoring

#### Prometheus Configuration
```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'eventchain-services'
    static_configs:
      - targets: ['api-gateway:3000', 'event-service:3000']
    metrics_path: /metrics
    scrape_interval: 5s
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "EventChain Container Metrics",
    "panels": [
      {
        "title": "Container CPU Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(container_cpu_usage_seconds_total[5m])",
            "legendFormat": "{{container_name}}"
          }
        ]
      },
      {
        "title": "Container Memory Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "container_memory_usage_bytes",
            "legendFormat": "{{container_name}}"
          }
        ]
      }
    ]
  }
}
```

### Centralized Logging

#### ELK Stack Configuration
```yaml
# elk/docker-compose.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.8.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

volumes:
  elasticsearch_data:
```

## Performance Optimization

### Multi-stage Builds

#### Optimized Dockerfile
```dockerfile
# Use multi-stage build for smaller images
FROM node:18-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime
WORKDIR /app
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --chown=nextjs:nodejs package*.json ./
USER nextjs
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Container Resource Limits

#### Docker Compose Limits
```yaml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Backup and Recovery

### Database Backup Container

#### Backup Script
```dockerfile
# backup/Dockerfile
FROM postgres:15-alpine

RUN apk add --no-cache aws-cli

COPY backup-script.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/backup-script.sh

CMD ["/usr/local/bin/backup-script.sh"]
```

```bash
#!/bin/bash
# backup/backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="eventchain_backup_${DATE}.sql"

# Create backup
pg_dump -h postgres -U eventchain -d eventchain_prod > /tmp/${BACKUP_FILE}

# Compress backup
gzip /tmp/${BACKUP_FILE}

# Upload to S3
aws s3 cp /tmp/${BACKUP_FILE}.gz s3://eventchain-backups/database/

# Clean up local file
rm /tmp/${BACKUP_FILE}.gz

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Automated Backup Service
```yaml
# backup service in docker-compose
backup:
  build:
    context: ./backup
  environment:
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    - PGPASSWORD=password
  depends_on:
    - postgres
  networks:
    - database-network
  # Run backup daily at 2 AM
  deploy:
    replicas: 0
    restart_policy:
      condition: none
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check container logs
docker logs <container-id>

# Check container status
docker ps -a

# Inspect container configuration
docker inspect <container-id>
```

#### Network Connectivity Issues
```bash
# List networks
docker network ls

# Inspect network
docker network inspect <network-name>

# Test connectivity between containers
docker exec -it <container-id> ping <other-container>
```

#### Resource Issues
```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

### Debugging Tools

#### Container Shell Access
```bash
# Access running container
docker exec -it <container-id> /bin/sh

# Run temporary debug container
docker run --rm -it --network container:<container-id> alpine sh
```

#### Log Analysis
```bash
# Follow logs in real-time
docker logs -f <container-id>

# View logs with timestamps
docker logs -t <container-id>

# Limit log output
docker logs --tail 100 <container-id>
```

---

*This Docker guide should be adapted based on your specific infrastructure requirements and deployment environment. Regular updates are recommended as Docker and container technologies evolve.*