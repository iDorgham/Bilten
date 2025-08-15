# AWS Deployment Guide

This guide covers the deployment and management of EventChain infrastructure on Amazon Web Services (AWS).

## Architecture Overview

### High-Level Architecture
```
Internet Gateway
    ↓
Application Load Balancer (ALB)
    ↓
ECS Fargate Cluster
    ├── API Gateway Service
    ├── Event Service
    ├── Order Service
    └── Analytics Service
    ↓
RDS PostgreSQL (Multi-AZ)
Redis ElastiCache
S3 Buckets
```

### AWS Services Used
- **Compute**: ECS Fargate, Lambda
- **Storage**: RDS PostgreSQL, ElastiCache Redis, S3
- **Networking**: VPC, ALB, CloudFront
- **Security**: IAM, Secrets Manager, WAF
- **Monitoring**: CloudWatch, X-Ray
- **CI/CD**: CodePipeline, CodeBuild, CodeDeploy

## Environment Setup

### Prerequisites
- AWS CLI configured with appropriate permissions
- Docker installed locally
- Terraform or AWS CDK for infrastructure as code
- kubectl for EKS management (if using Kubernetes)

### AWS Account Configuration

#### IAM Roles and Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:*",
        "rds:*",
        "s3:*",
        "elasticache:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

#### VPC Configuration
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=eventchain-vpc}]'

# Create subnets
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id vpc-12345678 --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

## Container Deployment

### ECS Fargate Setup

#### Task Definition
```json
{
  "family": "eventchain-api-gateway",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "api-gateway",
      "image": "your-account.dkr.ecr.us-east-1.amazonaws.com/eventchain-api-gateway:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:account:secret:eventchain/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/eventchain-api-gateway",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Service Configuration
```json
{
  "serviceName": "eventchain-api-gateway",
  "cluster": "eventchain-cluster",
  "taskDefinition": "eventchain-api-gateway:1",
  "desiredCount": 2,
  "launchType": "FARGATE",
  "networkConfiguration": {
    "awsvpcConfiguration": {
      "subnets": ["subnet-12345678", "subnet-87654321"],
      "securityGroups": ["sg-12345678"],
      "assignPublicIp": "ENABLED"
    }
  },
  "loadBalancers": [
    {
      "targetGroupArn": "arn:aws:elasticloadbalancing:us-east-1:account:targetgroup/eventchain-api/1234567890123456",
      "containerName": "api-gateway",
      "containerPort": 3000
    }
  ]
}
```

### Container Registry (ECR)

#### Repository Setup
```bash
# Create ECR repositories
aws ecr create-repository --repository-name eventchain-api-gateway
aws ecr create-repository --repository-name eventchain-event-service
aws ecr create-repository --repository-name eventchain-order-service
aws ecr create-repository --repository-name eventchain-analytics-service

# Get login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com
```

#### Image Build and Push
```bash
# Build and tag images
docker build -t eventchain-api-gateway ./api-gateway
docker tag eventchain-api-gateway:latest your-account.dkr.ecr.us-east-1.amazonaws.com/eventchain-api-gateway:latest

# Push to ECR
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/eventchain-api-gateway:latest
```

## Database Setup

### RDS PostgreSQL Configuration

#### Database Instance
```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name eventchain-db-subnet-group \
  --db-subnet-group-description "EventChain database subnet group" \
  --subnet-ids subnet-12345678 subnet-87654321

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier eventchain-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 13.7 \
  --master-username eventchain_admin \
  --master-user-password "SecurePassword123!" \
  --allocated-storage 100 \
  --storage-type gp2 \
  --storage-encrypted \
  --vpc-security-group-ids sg-12345678 \
  --db-subnet-group-name eventchain-db-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --auto-minor-version-upgrade
```

#### Database Security
```json
{
  "GroupName": "eventchain-db-sg",
  "Description": "Security group for EventChain database",
  "VpcId": "vpc-12345678",
  "SecurityGroupRules": [
    {
      "IpPermissions": [
        {
          "IpProtocol": "tcp",
          "FromPort": 5432,
          "ToPort": 5432,
          "UserIdGroupPairs": [
            {
              "GroupId": "sg-app-servers",
              "Description": "Access from application servers"
            }
          ]
        }
      ]
    }
  ]
}
```

### ElastiCache Redis Setup

#### Redis Cluster
```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name eventchain-cache-subnet-group \
  --cache-subnet-group-description "EventChain cache subnet group" \
  --subnet-ids subnet-12345678 subnet-87654321

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id eventchain-redis \
  --description "EventChain Redis cluster" \
  --num-cache-clusters 2 \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 6.2 \
  --cache-subnet-group-name eventchain-cache-subnet-group \
  --security-group-ids sg-12345678 \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

## Load Balancing and CDN

### Application Load Balancer

#### ALB Configuration
```bash
# Create load balancer
aws elbv2 create-load-balancer \
  --name eventchain-alb \
  --subnets subnet-12345678 subnet-87654321 \
  --security-groups sg-12345678 \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

# Create target groups
aws elbv2 create-target-group \
  --name eventchain-api-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-12345678 \
  --target-type ip \
  --health-check-path /health
```

#### SSL Certificate
```bash
# Request SSL certificate
aws acm request-certificate \
  --domain-name api.eventchain.com \
  --subject-alternative-names "*.eventchain.com" \
  --validation-method DNS \
  --region us-east-1
```

### CloudFront Distribution

#### CDN Configuration
```json
{
  "CallerReference": "eventchain-cdn-2024",
  "Comment": "EventChain CDN distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "eventchain-api",
        "DomainName": "eventchain-alb-123456789.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      },
      {
        "Id": "eventchain-static",
        "DomainName": "eventchain-static.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "eventchain-api",
    "ViewerProtocolPolicy": "redirect-to-https",
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      }
    }
  }
}
```

## Storage Configuration

### S3 Buckets

#### Bucket Setup
```bash
# Create S3 buckets
aws s3 mb s3://eventchain-static-assets
aws s3 mb s3://eventchain-user-uploads
aws s3 mb s3://eventchain-backups

# Configure bucket policies
aws s3api put-bucket-policy --bucket eventchain-static-assets --policy file://s3-static-policy.json
```

#### Bucket Policies
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::eventchain-static-assets/*"
    }
  ]
}
```

### File Upload Configuration

#### Presigned URLs
```javascript
// Generate presigned URL for file uploads
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

const generatePresignedUrl = (bucket, key, expires = 3600) => {
  return s3.getSignedUrl('putObject', {
    Bucket: bucket,
    Key: key,
    Expires: expires,
    ContentType: 'image/jpeg'
  });
};
```

## Monitoring and Logging

### CloudWatch Configuration

#### Log Groups
```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/eventchain-api-gateway
aws logs create-log-group --log-group-name /ecs/eventchain-event-service
aws logs create-log-group --log-group-name /ecs/eventchain-order-service
aws logs create-log-group --log-group-name /ecs/eventchain-analytics-service
```

#### Custom Metrics
```javascript
// Send custom metrics to CloudWatch
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

const putMetric = async (metricName, value, unit = 'Count') => {
  const params = {
    Namespace: 'EventChain/Application',
    MetricData: [
      {
        MetricName: metricName,
        Value: value,
        Unit: unit,
        Timestamp: new Date()
      }
    ]
  };
  
  await cloudwatch.putMetricData(params).promise();
};
```

### Alarms and Notifications

#### CloudWatch Alarms
```bash
# Create CPU utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "EventChain-High-CPU" \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Security Configuration

### IAM Roles and Policies

#### ECS Task Role
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
      "Resource": [
        "arn:aws:s3:::eventchain-user-uploads/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:account:secret:eventchain/*"
      ]
    }
  ]
}
```

### Secrets Management

#### AWS Secrets Manager
```bash
# Store database credentials
aws secretsmanager create-secret \
  --name "eventchain/database-url" \
  --description "EventChain database connection string" \
  --secret-string "postgresql://username:password@eventchain-prod-db.cluster-xyz.us-east-1.rds.amazonaws.com:5432/eventchain"

# Store API keys
aws secretsmanager create-secret \
  --name "eventchain/stripe-api-key" \
  --description "Stripe API key for payment processing" \
  --secret-string "sk_live_..."
```

### Web Application Firewall (WAF)

#### WAF Rules
```json
{
  "Name": "EventChainWAF",
  "Scope": "CLOUDFRONT",
  "DefaultAction": {
    "Allow": {}
  },
  "Rules": [
    {
      "Name": "AWSManagedRulesCommonRuleSet",
      "Priority": 1,
      "OverrideAction": {
        "None": {}
      },
      "Statement": {
        "ManagedRuleGroupStatement": {
          "VendorName": "AWS",
          "Name": "AWSManagedRulesCommonRuleSet"
        }
      },
      "VisibilityConfig": {
        "SampledRequestsEnabled": true,
        "CloudWatchMetricsEnabled": true,
        "MetricName": "CommonRuleSetMetric"
      }
    }
  ]
}
```

## CI/CD Pipeline

### CodePipeline Configuration

#### Pipeline Structure
```json
{
  "pipeline": {
    "name": "eventchain-pipeline",
    "roleArn": "arn:aws:iam::account:role/service-role/AWSCodePipelineServiceRole",
    "artifactStore": {
      "type": "S3",
      "location": "eventchain-pipeline-artifacts"
    },
    "stages": [
      {
        "name": "Source",
        "actions": [
          {
            "name": "SourceAction",
            "actionTypeId": {
              "category": "Source",
              "owner": "ThirdParty",
              "provider": "GitHub",
              "version": "1"
            },
            "configuration": {
              "Owner": "your-org",
              "Repo": "eventchain",
              "Branch": "main",
              "OAuthToken": "{{resolve:secretsmanager:github-token}}"
            },
            "outputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Build",
        "actions": [
          {
            "name": "BuildAction",
            "actionTypeId": {
              "category": "Build",
              "owner": "AWS",
              "provider": "CodeBuild",
              "version": "1"
            },
            "configuration": {
              "ProjectName": "eventchain-build"
            },
            "inputArtifacts": [
              {
                "name": "SourceOutput"
              }
            ],
            "outputArtifacts": [
              {
                "name": "BuildOutput"
              }
            ]
          }
        ]
      },
      {
        "name": "Deploy",
        "actions": [
          {
            "name": "DeployAction",
            "actionTypeId": {
              "category": "Deploy",
              "owner": "AWS",
              "provider": "ECS",
              "version": "1"
            },
            "configuration": {
              "ClusterName": "eventchain-cluster",
              "ServiceName": "eventchain-api-gateway",
              "FileName": "imagedefinitions.json"
            },
            "inputArtifacts": [
              {
                "name": "BuildOutput"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### CodeBuild Project

#### Build Specification
```yaml
version: 0.2

phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - REPOSITORY_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)
      - IMAGE_TAG=${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on `date`
      - echo Building the Docker image...
      - docker build -t $REPOSITORY_URI:latest ./api-gateway
      - docker tag $REPOSITORY_URI:latest $REPOSITORY_URI:$IMAGE_TAG
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker images...
      - docker push $REPOSITORY_URI:latest
      - docker push $REPOSITORY_URI:$IMAGE_TAG
      - echo Writing image definitions file...
      - printf '[{"name":"api-gateway","imageUri":"%s"}]' $REPOSITORY_URI:$IMAGE_TAG > imagedefinitions.json

artifacts:
  files:
    - imagedefinitions.json
```

## Backup and Disaster Recovery

### Database Backups

#### Automated Backups
```bash
# Configure automated backups
aws rds modify-db-instance \
  --db-instance-identifier eventchain-prod-db \
  --backup-retention-period 30 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "sun:04:00-sun:05:00"
```

#### Manual Snapshots
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier eventchain-prod-db \
  --db-snapshot-identifier eventchain-prod-snapshot-$(date +%Y%m%d)
```

### Cross-Region Replication

#### RDS Cross-Region Backup
```bash
# Copy snapshot to another region
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier arn:aws:rds:us-east-1:account:snapshot:eventchain-prod-snapshot \
  --target-db-snapshot-identifier eventchain-prod-snapshot-backup \
  --source-region us-east-1 \
  --region us-west-2
```

## Cost Optimization

### Resource Tagging

#### Tagging Strategy
```bash
# Tag resources for cost allocation
aws ec2 create-tags \
  --resources i-1234567890abcdef0 \
  --tags Key=Project,Value=EventChain Key=Environment,Value=Production Key=Team,Value=Backend
```

### Auto Scaling

#### ECS Service Auto Scaling
```json
{
  "ServiceName": "eventchain-api-gateway",
  "ScalableDimension": "ecs:service:DesiredCount",
  "MinCapacity": 2,
  "MaxCapacity": 10,
  "TargetTrackingScalingPolicies": [
    {
      "TargetValue": 70.0,
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
      },
      "ScaleOutCooldown": 300,
      "ScaleInCooldown": 300
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### ECS Service Won't Start
- Check task definition for errors
- Verify IAM roles and permissions
- Check security group configurations
- Review CloudWatch logs for errors

#### Database Connection Issues
- Verify security group rules
- Check database endpoint and port
- Validate credentials in Secrets Manager
- Test connectivity from application servers

#### Load Balancer Health Checks Failing
- Verify health check path is accessible
- Check application startup time
- Review security group configurations
- Monitor application logs

### Debugging Tools

#### AWS CLI Commands
```bash
# Check ECS service status
aws ecs describe-services --cluster eventchain-cluster --services eventchain-api-gateway

# View CloudWatch logs
aws logs tail /ecs/eventchain-api-gateway --follow

# Check RDS instance status
aws rds describe-db-instances --db-instance-identifier eventchain-prod-db
```

---

*This deployment guide should be customized based on your specific requirements and security policies. Regular updates are recommended as AWS services evolve.*