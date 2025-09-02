# Deployment Architecture

## 🎯 Overview

This document describes the deployment architecture of the Bilten platform, including infrastructure design, deployment strategies, and operational considerations.

## 🏗️ Infrastructure Design

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Load          │    │   Auto-scaling  │
│   (CloudFront)  │    │   Balancer      │    │   Groups        │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Application          │
                    │      Services             │
                    │                           │
                    │  ┌─────────┐ ┌─────────┐  │
                    │  │ Frontend│ │ Backend │  │
                    │  │ Service │ │ Service │  │
                    │  └─────────┘ └─────────┘  │
                    │  ┌─────────┐ ┌─────────┐  │
                    │  │ Gateway │ │ Scanner │  │
                    │  │ Service │ │ Service │  │
                    │  └─────────┘ └─────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │      Data Layer           │
                    │                           │
                    │  ┌─────────┐ ┌─────────┐  │
                    │  │PostgreSQL│ │ Redis   │  │
                    │  │Database │ │ Cache   │  │
                    │  └─────────┘ └─────────┘  │
                    └───────────────────────────┘
```

## 🚀 Deployment Strategies

### 1. **Blue-Green Deployment**
```yaml
# Blue-Green deployment configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bilten-backend-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bilten-backend
      version: blue
  template:
    metadata:
      labels:
        app: bilten-backend
        version: blue
    spec:
      containers:
      - name: backend
        image: bilten/backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
```

### 2. **Canary Deployment**
```yaml
# Canary deployment with traffic splitting
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: bilten-ingress
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
  - host: api.bilten.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: bilten-backend-canary
            port:
              number: 3000
```

### 3. **Rolling Update Strategy**
```yaml
# Rolling update configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bilten-frontend
spec:
  replicas: 5
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: bilten-frontend
  template:
    metadata:
      labels:
        app: bilten-frontend
    spec:
      containers:
      - name: frontend
        image: bilten/frontend:latest
        ports:
        - containerPort: 80
        readinessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 80
          initialDelaySeconds: 15
          periodSeconds: 20
```

## 🐳 Container Orchestration

### Docker Compose (Development)
```yaml
# docker-compose.yml for development
version: '3.8'
services:
  frontend:
    build: ./apps/bilten-frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:3001
    volumes:
      - ./apps/bilten-frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build: ./apps/bilten-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/bilten
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./apps/bilten-backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=bilten
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes (Production)
```yaml
# Kubernetes deployment configuration
apiVersion: v1
kind: Namespace
metadata:
  name: bilten

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: bilten-backend
  namespace: bilten
spec:
  replicas: 3
  selector:
    matchLabels:
      app: bilten-backend
  template:
    metadata:
      labels:
        app: bilten-backend
    spec:
      containers:
      - name: backend
        image: bilten/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: bilten-backend-service
  namespace: bilten
spec:
  selector:
    app: bilten-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

## ☁️ Cloud Infrastructure

### AWS Infrastructure
```terraform
# Terraform configuration for AWS
provider "aws" {
  region = "us-west-2"
}

# VPC Configuration
resource "aws_vpc" "bilten_vpc" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    Name = "bilten-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "bilten_cluster" {
  name = "bilten-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "bilten_alb" {
  name               = "bilten-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id
}

# RDS PostgreSQL
resource "aws_db_instance" "bilten_db" {
  identifier           = "bilten-db"
  engine               = "postgres"
  engine_version       = "14"
  instance_class       = "db.t3.micro"
  allocated_storage    = 20
  storage_encrypted    = true
  
  db_name  = "bilten"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.bilten_db_subnet_group.name
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "bilten_redis" {
  cluster_id           = "bilten-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
  security_group_ids   = [aws_security_group.redis_sg.id]
  subnet_group_name    = aws_elasticache_subnet_group.bilten_redis_subnet_group.name
}
```

### Azure Infrastructure
```bicep
// Bicep configuration for Azure
param location string = resourceGroup().location
param appServicePlanName string = 'bilten-app-plan'
param webAppName string = 'bilten-web-app'
param apiAppName string = 'bilten-api-app'

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2021-02-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
}

// Web App (Frontend)
resource webApp 'Microsoft.Web/sites@2021-02-01' = {
  name: webAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '18.x'
      appSettings: [
        {
          name: 'REACT_APP_API_URL'
          value: 'https://${apiAppName}.azurewebsites.net'
        }
      ]
    }
  }
}

// API App (Backend)
resource apiApp 'Microsoft.Web/sites@2021-02-01' = {
  name: apiAppName
  location: location
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      nodeVersion: '18.x'
      appSettings: [
        {
          name: 'NODE_ENV'
          value: 'production'
        }
        {
          name: 'DATABASE_URL'
          value: 'postgresql://${databaseServerName}.postgres.database.azure.com:5432/bilten'
        }
      ]
    }
  }
}
```

## 🔄 CI/CD Pipeline

### GitHub Actions Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build applications
      run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Backend
      uses: docker/build-push-action@v4
      with:
        context: ./apps/bilten-backend
        push: true
        tags: bilten/backend:${{ github.sha }}
    
    - name: Build and push Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./apps/bilten-frontend
        push: true
        tags: bilten/frontend:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Kubernetes
      uses: steebchen/kubectl@v2
      with:
        config: ${{ secrets.KUBE_CONFIG_DATA }}
        command: set image deployment/bilten-backend backend=bilten/backend:${{ github.sha }}
```

### GitLab CI Pipeline
```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: "/certs"

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
    - npm run lint
    - npm run build

build-backend:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - docker build -t bilten/backend:$CI_COMMIT_SHA ./apps/bilten-backend
    - docker push bilten/backend:$CI_COMMIT_SHA

build-frontend:
  stage: build
  image: docker:20.10.16
  services:
    - docker:20.10.16-dind
  script:
    - docker build -t bilten/frontend:$CI_COMMIT_SHA ./apps/bilten-frontend
    - docker push bilten/frontend:$CI_COMMIT_SHA

deploy-production:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache curl
    - curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
    - chmod +x ./kubectl
  script:
    - ./kubectl set image deployment/bilten-backend backend=bilten/backend:$CI_COMMIT_SHA
    - ./kubectl set image deployment/bilten-frontend frontend=bilten/frontend:$CI_COMMIT_SHA
  only:
    - main
```

## 📊 Monitoring & Observability

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'bilten-backend'
    static_configs:
      - targets: ['bilten-backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'bilten-frontend'
    static_configs:
      - targets: ['bilten-frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

### Grafana Dashboards
```json
{
  "dashboard": {
    "title": "Bilten Platform Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

## 🔒 Security Configuration

### Network Security
```yaml
# Security group configuration
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: bilten-network-policy
  namespace: bilten
spec:
  podSelector:
    matchLabels:
      app: bilten-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: database
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - namespaceSelector:
        matchLabels:
          name: cache
    ports:
    - protocol: TCP
      port: 6379
```

### Secrets Management
```yaml
# Kubernetes secrets
apiVersion: v1
kind: Secret
metadata:
  name: database-secret
  namespace: bilten
type: Opaque
data:
  url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAZGI6NTQzMi9iaWx0ZW4=
  username: dXNlcg==
  password: cGFzc3dvcmQ=

---
apiVersion: v1
kind: Secret
metadata:
  name: jwt-secret
  namespace: bilten
type: Opaque
data:
  access-secret: YWNjZXNzLXNlY3JldC1rZXk=
  refresh-secret: cmVmcmVzaC1zZWNyZXQta2V5
```

## 🔧 Environment Configuration

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@db:5432/bilten
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=redis-password

# JWT
JWT_ACCESS_SECRET=access-secret-key
JWT_REFRESH_SECRET=refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@bilten.com
SMTP_PASS=email-password

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Monitoring
PROMETHEUS_PORT=9090
SENTRY_DSN=https://...
```

## 📈 Scaling Strategies

### Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: bilten-backend-hpa
  namespace: bilten
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: bilten-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling
```yaml
# PostgreSQL read replicas
apiVersion: v1
kind: Service
metadata:
  name: postgres-read-replicas
  namespace: bilten
spec:
  selector:
    app: postgres
    role: read-replica
  ports:
  - protocol: TCP
    port: 5432
    targetPort: 5432
  type: ClusterIP
```

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
