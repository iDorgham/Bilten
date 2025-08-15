# EventChain Production Deployment Guide

## Overview
This guide provides comprehensive instructions for deploying EventChain to production environments, including infrastructure setup, deployment automation, and post-deployment verification.

## Architecture Overview

### Production Infrastructure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Web Servers   │    │   API Servers   │
│   (AWS ALB)     │────│   (Frontend)    │────│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   File Storage  │    │   Database      │
│   (CloudFront)  │    │   (S3)          │    │   (RDS)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │   Cache/Queue   │
                                               │   (ElastiCache) │
                                               └─────────────────┘
```

## Prerequisites

### AWS Account Setup
- AWS Account with appropriate permissions
- AWS CLI configured with deployment credentials
- Route 53 hosted zone for domain management
- SSL certificates via AWS Certificate Manager

### Required Tools
- **Terraform**: v1.0+ for infrastructure as code
- **Docker**: Latest version for containerization
- **kubectl**: For Kubernetes management (if using EKS)
- **Helm**: v3+ for Kubernetes package management
- **AWS CLI**: v2+ for AWS resource management

### Domain and SSL
- Domain name registered and configured
- SSL certificates issued via AWS Certificate Manager
- DNS records configured in Route 53

## Infrastructure Setup

### 1. Terraform Configuration

#### Main Infrastructure (terraform/main.tf)
```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket = "eventchain-terraform-state"
    key    = "production/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "eventchain"
      ManagedBy   = "terraform"
    }
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "eventchain-prod-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true
}

# RDS Database
resource "aws_db_instance" "main" {
  identifier = "eventchain-prod-db"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "eventchain"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "eventchain-prod-final-snapshot"
  
  performance_insights_enabled = true
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "eventchain-prod-redis"
  description                = "EventChain production Redis cluster"
  
  node_type                  = "cache.r6g.large"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                = var.redis_auth_token
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "eventchain-prod"
  
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]
  
  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight           = 1
  }
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
```

#### Variables (terraform/variables.tf)
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis authentication token"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "eventchain.com"
}
```

### 2. Deploy Infrastructure
```bash
# Initialize Terraform
cd terraform
terraform init

# Plan deployment
terraform plan -var-file="production.tfvars"

# Apply infrastructure
terraform apply -var-file="production.tfvars"

# Save outputs
terraform output > ../deployment/terraform-outputs.json
```

## Application Deployment

### 1. Docker Configuration

#### Backend Dockerfile
```dockerfile
# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runtime

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S eventchain -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=eventchain:nodejs . .

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

USER eventchain
EXPOSE 3001

CMD ["npm", "start"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runtime

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. ECS Task Definitions

#### Backend Task Definition
```json
{
  "family": "eventchain-backend-prod",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/eventchain-backend-task-role",
  "containerDefinitions": [
    {
      "name": "eventchain-backend",
      "image": "ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/eventchain-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "PORT",
          "value": "3001"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:eventchain/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:eventchain/jwt-secret"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/eventchain-backend-prod",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### 3. ECS Service Configuration
```json
{
  "serviceName": "eventchain-backend-prod",
  "cluster": "eventchain-prod",
  "taskDefinition": "eventchain-backend-prod",
  "desiredCount": 3,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-xxx", "subnet-yyy"],
      "securityGroups": ["sg-xxx"],
      "assignPublicIp": "DISABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:ACCOUNT:targetgroup/eventchain-backend",
      "containerName": "eventchain-backend",
      "containerPort": 3001
    }
  ],
  "deploymentConfiguration": {
    "maximumPercent": 200,
    "minimumHealthyPercent": 50,
    "deploymentCircuitBreaker": {
      "enable": true,
      "rollback": true
    }
  },
  "enableExecuteCommand": true
}
```

## Deployment Automation

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY_BACKEND: eventchain-backend
  ECR_REPOSITORY_FRONTEND: eventchain-frontend

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run security audit
        run: npm audit --audit-level high

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push backend image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster eventchain-prod \
            --service eventchain-backend-prod \
            --force-new-deployment
      
      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster eventchain-prod \
            --services eventchain-backend-prod
      
      - name: Run post-deployment tests
        run: |
          npm run test:e2e:production
```

### 2. Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}

echo "Deploying EventChain to $ENVIRONMENT environment..."

# Build and push Docker images
echo "Building Docker images..."
docker build -t eventchain-backend:$IMAGE_TAG .
docker build -t eventchain-frontend:$IMAGE_TAG ./frontend

# Tag and push to ECR
echo "Pushing to ECR..."
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY

docker tag eventchain-backend:$IMAGE_TAG $ECR_REGISTRY/eventchain-backend:$IMAGE_TAG
docker tag eventchain-frontend:$IMAGE_TAG $ECR_REGISTRY/eventchain-frontend:$IMAGE_TAG

docker push $ECR_REGISTRY/eventchain-backend:$IMAGE_TAG
docker push $ECR_REGISTRY/eventchain-frontend:$IMAGE_TAG

# Update ECS services
echo "Updating ECS services..."
aws ecs update-service \
  --cluster eventchain-prod \
  --service eventchain-backend-prod \
  --force-new-deployment

aws ecs update-service \
  --cluster eventchain-prod \
  --service eventchain-frontend-prod \
  --force-new-deployment

# Wait for deployment to complete
echo "Waiting for deployment to complete..."
aws ecs wait services-stable \
  --cluster eventchain-prod \
  --services eventchain-backend-prod eventchain-frontend-prod

echo "Deployment completed successfully!"
```

## Database Migration

### 1. Migration Strategy
```bash
#!/bin/bash
# migrate-production.sh

set -e

echo "Starting production database migration..."

# Create backup before migration
echo "Creating database backup..."
aws rds create-db-snapshot \
  --db-instance-identifier eventchain-prod-db \
  --db-snapshot-identifier eventchain-prod-pre-migration-$(date +%Y%m%d%H%M%S)

# Run migrations
echo "Running database migrations..."
npm run migrate:production

# Verify migration
echo "Verifying migration..."
npm run migrate:status

echo "Database migration completed successfully!"
```

### 2. Zero-Downtime Migration
```javascript
// migrations/zero-downtime-strategy.js
const { Pool } = require('pg');

class ZeroDowntimeMigration {
  constructor(dbConfig) {
    this.pool = new Pool(dbConfig);
  }

  async addColumnWithDefault(tableName, columnName, columnType, defaultValue) {
    // Step 1: Add column without default
    await this.pool.query(`
      ALTER TABLE ${tableName} 
      ADD COLUMN ${columnName} ${columnType}
    `);

    // Step 2: Update existing rows in batches
    let offset = 0;
    const batchSize = 1000;
    
    while (true) {
      const result = await this.pool.query(`
        UPDATE ${tableName} 
        SET ${columnName} = $1 
        WHERE ${columnName} IS NULL 
        AND id IN (
          SELECT id FROM ${tableName} 
          WHERE ${columnName} IS NULL 
          LIMIT $2
        )
      `, [defaultValue, batchSize]);

      if (result.rowCount === 0) break;
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 3: Add NOT NULL constraint
    await this.pool.query(`
      ALTER TABLE ${tableName} 
      ALTER COLUMN ${columnName} SET NOT NULL
    `);

    // Step 4: Add default for future inserts
    await this.pool.query(`
      ALTER TABLE ${tableName} 
      ALTER COLUMN ${columnName} SET DEFAULT $1
    `, [defaultValue]);
  }
}
```

## Environment Configuration

### 1. Production Environment Variables
```bash
# Production .env file (stored in AWS Secrets Manager)
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@eventchain-prod-db.region.rds.amazonaws.com:5432/eventchain
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_URL=rediss://eventchain-prod-redis.region.cache.amazonaws.com:6379
REDIS_AUTH_TOKEN=secure-auth-token

# JWT
JWT_SECRET=super-secure-jwt-secret-for-production
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=super-secure-refresh-token-secret

# Payment Processing
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASS=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
FROM_EMAIL=noreply@eventchain.com

# File Storage
STORAGE_TYPE=s3
S3_BUCKET=eventchain-prod-uploads
S3_REGION=us-east-1
CDN_URL=https://cdn.eventchain.com

# Blockchain
BLOCKCHAIN_NETWORK=mainnet
INFURA_PROJECT_ID=your-mainnet-infura-project-id
PRIVATE_KEY=your-production-private-key

# External APIs
GOOGLE_MAPS_API_KEY=your-production-google-maps-api-key
SENDGRID_API_KEY=your-production-sendgrid-api-key

# Security
CORS_ORIGIN=https://eventchain.com,https://www.eventchain.com
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=1000
HELMET_CSP_ENABLED=true

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-new-relic-license-key

# Feature Flags
FEATURE_BLOCKCHAIN_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_NOTIFICATIONS_ENABLED=true
```

## SSL and Domain Configuration

### 1. Certificate Manager Setup
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name eventchain.com \
  --subject-alternative-names "*.eventchain.com" \
  --validation-method DNS \
  --region us-east-1

# Validate certificate via DNS
aws acm describe-certificate \
  --certificate-arn arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID
```

### 2. CloudFront Distribution
```json
{
  "DistributionConfig": {
    "CallerReference": "eventchain-prod-2024",
    "Comment": "EventChain Production CDN",
    "DefaultRootObject": "index.html",
    "Origins": [
      {
        "Id": "eventchain-alb",
        "DomainName": "eventchain-prod-alb-123456789.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only",
          "OriginSslProtocols": ["TLSv1.2"]
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "eventchain-alb",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "managed-caching-optimized",
      "OriginRequestPolicyId": "managed-cors-s3-origin"
    },
    "Enabled": true,
    "Aliases": ["eventchain.com", "www.eventchain.com"],
    "ViewerCertificate": {
      "AcmCertificateArn": "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID",
      "SslSupportMethod": "sni-only",
      "MinimumProtocolVersion": "TLSv1.2_2021"
    }
  }
}
```

## Post-Deployment Verification

### 1. Health Checks
```bash
#!/bin/bash
# health-check.sh

DOMAIN="https://eventchain.com"

echo "Running post-deployment health checks..."

# API Health Check
echo "Checking API health..."
curl -f "$DOMAIN/api/v1/health" || exit 1

# Database Connectivity
echo "Checking database connectivity..."
curl -f "$DOMAIN/api/v1/health/database" || exit 1

# Redis Connectivity
echo "Checking Redis connectivity..."
curl -f "$DOMAIN/api/v1/health/redis" || exit 1

# Authentication
echo "Testing authentication..."
TOKEN=$(curl -s -X POST "$DOMAIN/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@eventchain.com","password":"testpass"}' | \
  jq -r '.data.accessToken')

if [ "$TOKEN" = "null" ]; then
  echo "Authentication test failed"
  exit 1
fi

# Protected endpoint
echo "Testing protected endpoint..."
curl -f -H "Authorization: Bearer $TOKEN" "$DOMAIN/api/v1/events" || exit 1

echo "All health checks passed!"
```

### 2. Performance Testing
```bash
# Load testing with Artillery
npm install -g artillery

# Run load test
artillery run load-test-config.yml

# Monitor during load test
watch -n 1 'aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=eventchain-backend-prod \
  --start-time $(date -u -d "5 minutes ago" +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 60 \
  --statistics Average'
```

## Rollback Procedures

### 1. Application Rollback
```bash
#!/bin/bash
# rollback.sh

PREVIOUS_TASK_DEFINITION_ARN=$1

if [ -z "$PREVIOUS_TASK_DEFINITION_ARN" ]; then
  echo "Usage: $0 <previous-task-definition-arn>"
  exit 1
fi

echo "Rolling back to task definition: $PREVIOUS_TASK_DEFINITION_ARN"

# Update service to use previous task definition
aws ecs update-service \
  --cluster eventchain-prod \
  --service eventchain-backend-prod \
  --task-definition $PREVIOUS_TASK_DEFINITION_ARN

# Wait for rollback to complete
aws ecs wait services-stable \
  --cluster eventchain-prod \
  --services eventchain-backend-prod

echo "Rollback completed successfully!"
```

### 2. Database Rollback
```bash
#!/bin/bash
# database-rollback.sh

SNAPSHOT_ID=$1

if [ -z "$SNAPSHOT_ID" ]; then
  echo "Usage: $0 <snapshot-id>"
  exit 1
fi

echo "Rolling back database to snapshot: $SNAPSHOT_ID"

# Create new RDS instance from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier eventchain-prod-db-rollback \
  --db-snapshot-identifier $SNAPSHOT_ID

echo "Database rollback initiated. Manual intervention required to switch endpoints."
```

## Monitoring and Alerting Setup

### 1. CloudWatch Alarms
```bash
# CPU Utilization Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "EventChain-High-CPU" \
  --alarm-description "EventChain high CPU utilization" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:eventchain-alerts

# Database Connection Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "EventChain-DB-Connections" \
  --alarm-description "EventChain high database connections" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT:eventchain-alerts
```

## Security Hardening

### 1. Security Groups
```bash
# Backend security group
aws ec2 create-security-group \
  --group-name eventchain-backend-prod \
  --description "EventChain backend production security group" \
  --vpc-id vpc-12345678

# Allow HTTPS from ALB only
aws ec2 authorize-security-group-ingress \
  --group-id sg-backend \
  --protocol tcp \
  --port 3001 \
  --source-group sg-alb
```

### 2. IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::eventchain-prod-uploads/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:eventchain/*"
    }
  ]
}
```

## Troubleshooting

### Common Deployment Issues
1. **ECS Service Won't Start**: Check task definition, security groups, and subnets
2. **Database Connection Issues**: Verify security groups and connection strings
3. **SSL Certificate Issues**: Ensure certificate is validated and associated with load balancer
4. **High Memory Usage**: Monitor and adjust task memory allocation

### Useful Commands
```bash
# View ECS service events
aws ecs describe-services --cluster eventchain-prod --services eventchain-backend-prod

# Check task logs
aws logs tail /ecs/eventchain-backend-prod --follow

# Connect to running task
aws ecs execute-command \
  --cluster eventchain-prod \
  --task TASK-ID \
  --container eventchain-backend \
  --interactive \
  --command "/bin/bash"
```

This deployment guide provides a comprehensive approach to deploying EventChain to production with proper infrastructure, security, monitoring, and rollback procedures.