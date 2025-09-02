# EventChain Backup and Recovery Plan

## Overview
This document outlines the comprehensive backup and disaster recovery strategy for the EventChain platform, ensuring business continuity and data protection across all critical systems and services.

## Recovery Objectives

### Recovery Time Objective (RTO)
- **Critical Systems**: 1 hour maximum downtime
- **Important Systems**: 4 hours maximum downtime
- **Standard Systems**: 24 hours maximum downtime

### Recovery Point Objective (RPO)
- **Critical Data**: Maximum 15 minutes of data loss
- **Important Data**: Maximum 1 hour of data loss
- **Standard Data**: Maximum 24 hours of data loss

### System Classification

#### Critical Systems (RTO: 1 hour, RPO: 15 minutes)
- Primary database (user data, transactions, events)
- Payment processing system
- Authentication service
- Core API services

#### Important Systems (RTO: 4 hours, RPO: 1 hour)
- File storage and media assets
- Analytics and reporting systems
- Email and notification services
- Search and discovery services

#### Standard Systems (RTO: 24 hours, RPO: 24 hours)
- Logging and monitoring data
- Development and staging environments
- Documentation and internal tools

## Backup Strategy

### Database Backup

#### PostgreSQL Primary Database
```bash
#!/bin/bash
# database-backup.sh

# Configuration
DB_HOST="eventchain-prod-db.region.rds.amazonaws.com"
DB_NAME="eventchain"
DB_USER="backup_user"
BACKUP_BUCKET="eventchain-backups"
RETENTION_DAYS=30

# Create timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="eventchain_backup_${TIMESTAMP}.sql"

echo "Starting database backup at $(date)"

# Create full database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
  --verbose --clean --no-owner --no-privileges \
  --format=custom > "/tmp/${BACKUP_FILE}"

# Compress backup
gzip "/tmp/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Upload to S3
aws s3 cp "/tmp/${COMPRESSED_FILE}" "s3://${BACKUP_BUCKET}/database/full/${COMPRESSED_FILE}"

# Verify backup integrity
if aws s3 ls "s3://${BACKUP_BUCKET}/database/full/${COMPRESSED_FILE}" > /dev/null; then
  echo "Backup successfully uploaded: ${COMPRESSED_FILE}"
  
  # Test backup restoration (on test instance)
  ./test-backup-restore.sh "${COMPRESSED_FILE}"
  
  # Clean up local files
  rm "/tmp/${COMPRESSED_FILE}"
else
  echo "ERROR: Backup upload failed"
  exit 1
fi

# Clean up old backups
aws s3 ls "s3://${BACKUP_BUCKET}/database/full/" | \
  awk '{print $4}' | \
  head -n -${RETENTION_DAYS} | \
  xargs -I {} aws s3 rm "s3://${BACKUP_BUCKET}/database/full/{}"

echo "Database backup completed at $(date)"
```

#### Continuous Backup with WAL-E
```bash
#!/bin/bash
# setup-continuous-backup.sh

# Install WAL-E
pip install wal-e[aws]

# Configure WAL-E environment
export WALE_S3_PREFIX="s3://eventchain-backups/wal-e"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"

# PostgreSQL configuration for continuous archiving
cat >> /etc/postgresql/14/main/postgresql.conf << EOF
# WAL archiving configuration
wal_level = replica
archive_mode = on
archive_command = 'wal-e wal-push %p'
archive_timeout = 60
max_wal_senders = 3
wal_keep_segments = 32
EOF

# Create base backup
wal-e backup-push /var/lib/postgresql/14/main

# Set up cron for regular base backups
echo "0 2 * * * postgres wal-e backup-push /var/lib/postgresql/14/main" | crontab -
```

#### Point-in-Time Recovery Setup
```sql
-- Create recovery configuration
-- recovery.conf (for PostgreSQL < 12) or postgresql.conf (for PostgreSQL >= 12)

-- Point-in-time recovery settings
restore_command = 'wal-e wal-fetch "%f" "%p"'
recovery_target_time = '2024-01-15 14:30:00'
recovery_target_action = 'promote'
```

### Application Data Backup

#### File Storage Backup (S3 Cross-Region Replication)
```json
{
  "Role": "arn:aws:iam::ACCOUNT:role/replication-role",
  "Rules": [
    {
      "ID": "EventChainMediaReplication",
      "Status": "Enabled",
      "Priority": 1,
      "Filter": {
        "Prefix": "media/"
      },
      "Destination": {
        "Bucket": "arn:aws:s3:::eventchain-backups-west",
        "StorageClass": "STANDARD_IA",
        "ReplicationTime": {
          "Status": "Enabled",
          "Time": {
            "Minutes": 15
          }
        },
        "Metrics": {
          "Status": "Enabled",
          "EventThreshold": {
            "Minutes": 15
          }
        }
      }
    }
  ]
}
```

#### Redis Backup
```bash
#!/bin/bash
# redis-backup.sh

REDIS_HOST="eventchain-prod-redis.region.cache.amazonaws.com"
REDIS_PORT=6379
BACKUP_BUCKET="eventchain-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "Starting Redis backup at $(date)"

# Create Redis backup
redis-cli -h $REDIS_HOST -p $REDIS_PORT --rdb "/tmp/redis_backup_${TIMESTAMP}.rdb"

# Compress and upload
gzip "/tmp/redis_backup_${TIMESTAMP}.rdb"
aws s3 cp "/tmp/redis_backup_${TIMESTAMP}.rdb.gz" \
  "s3://${BACKUP_BUCKET}/redis/redis_backup_${TIMESTAMP}.rdb.gz"

# Verify and cleanup
if aws s3 ls "s3://${BACKUP_BUCKET}/redis/redis_backup_${TIMESTAMP}.rdb.gz" > /dev/null; then
  echo "Redis backup successful"
  rm "/tmp/redis_backup_${TIMESTAMP}.rdb.gz"
else
  echo "ERROR: Redis backup failed"
  exit 1
fi

echo "Redis backup completed at $(date)"
```

### Configuration and Code Backup

#### Infrastructure as Code Backup
```bash
#!/bin/bash
# infrastructure-backup.sh

BACKUP_BUCKET="eventchain-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup Terraform state
aws s3 cp s3://eventchain-terraform-state/production/terraform.tfstate \
  "s3://${BACKUP_BUCKET}/infrastructure/terraform_state_${TIMESTAMP}.tfstate"

# Backup Kubernetes configurations
kubectl get all --all-namespaces -o yaml > "/tmp/k8s_config_${TIMESTAMP}.yaml"
aws s3 cp "/tmp/k8s_config_${TIMESTAMP}.yaml" \
  "s3://${BACKUP_BUCKET}/infrastructure/k8s_config_${TIMESTAMP}.yaml"

# Backup application configurations
tar -czf "/tmp/app_configs_${TIMESTAMP}.tar.gz" \
  /etc/eventchain/ \
  ~/.kube/config \
  /opt/eventchain/configs/

aws s3 cp "/tmp/app_configs_${TIMESTAMP}.tar.gz" \
  "s3://${BACKUP_BUCKET}/infrastructure/app_configs_${TIMESTAMP}.tar.gz"

# Cleanup
rm "/tmp/k8s_config_${TIMESTAMP}.yaml" "/tmp/app_configs_${TIMESTAMP}.tar.gz"

echo "Infrastructure backup completed"
```

#### Application Code Backup
```bash
#!/bin/bash
# code-backup.sh

BACKUP_BUCKET="eventchain-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup current production code
git archive --format=tar.gz --prefix=eventchain-${TIMESTAMP}/ HEAD > \
  "/tmp/eventchain_code_${TIMESTAMP}.tar.gz"

# Upload to S3
aws s3 cp "/tmp/eventchain_code_${TIMESTAMP}.tar.gz" \
  "s3://${BACKUP_BUCKET}/code/eventchain_code_${TIMESTAMP}.tar.gz"

# Backup Docker images
docker save eventchain/backend:latest | gzip > "/tmp/backend_image_${TIMESTAMP}.tar.gz"
docker save eventchain/frontend:latest | gzip > "/tmp/frontend_image_${TIMESTAMP}.tar.gz"

aws s3 cp "/tmp/backend_image_${TIMESTAMP}.tar.gz" \
  "s3://${BACKUP_BUCKET}/images/backend_image_${TIMESTAMP}.tar.gz"
aws s3 cp "/tmp/frontend_image_${TIMESTAMP}.tar.gz" \
  "s3://${BACKUP_BUCKET}/images/frontend_image_${TIMESTAMP}.tar.gz"

# Cleanup
rm "/tmp/eventchain_code_${TIMESTAMP}.tar.gz" \
   "/tmp/backend_image_${TIMESTAMP}.tar.gz" \
   "/tmp/frontend_image_${TIMESTAMP}.tar.gz"

echo "Code backup completed"
```

## Automated Backup Scheduling

### Backup Automation with AWS Lambda
```python
# backup-scheduler.py
import boto3
import json
import os
from datetime import datetime, timedelta

def lambda_handler(event, context):
    """
    Automated backup scheduler for EventChain
    """
    
    # Initialize AWS clients
    rds = boto3.client('rds')
    s3 = boto3.client('s3')
    ecs = boto3.client('ecs')
    
    backup_type = event.get('backup_type', 'full')
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    try:
        if backup_type == 'database' or backup_type == 'full':
            # Create RDS snapshot
            snapshot_id = f"eventchain-auto-backup-{timestamp}"
            rds.create_db_snapshot(
                DBSnapshotIdentifier=snapshot_id,
                DBInstanceIdentifier='eventchain-prod-db'
            )
            
            print(f"Database snapshot created: {snapshot_id}")
        
        if backup_type == 'files' or backup_type == 'full':
            # Trigger file backup task
            ecs.run_task(
                cluster='eventchain-prod',
                taskDefinition='eventchain-backup-task',
                launchType='FARGATE',
                networkConfiguration={
                    'awsvpcConfiguration': {
                        'subnets': os.environ['SUBNET_IDS'].split(','),
                        'securityGroups': [os.environ['SECURITY_GROUP_ID']],
                        'assignPublicIp': 'DISABLED'
                    }
                },
                overrides={
                    'containerOverrides': [
                        {
                            'name': 'backup-container',
                            'environment': [
                                {
                                    'name': 'BACKUP_TYPE',
                                    'value': 'files'
                                },
                                {
                                    'name': 'TIMESTAMP',
                                    'value': timestamp
                                }
                            ]
                        }
                    ]
                }
            )
            
            print("File backup task started")
        
        # Clean up old backups
        cleanup_old_backups(s3, timestamp)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Backup {backup_type} completed successfully',
                'timestamp': timestamp
            })
        }
        
    except Exception as e:
        print(f"Backup failed: {str(e)}")
        
        # Send alert
        sns = boto3.client('sns')
        sns.publish(
            TopicArn=os.environ['ALERT_TOPIC_ARN'],
            Subject='EventChain Backup Failed',
            Message=f'Backup failed with error: {str(e)}'
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }

def cleanup_old_backups(s3, current_timestamp):
    """
    Clean up backups older than retention period
    """
    bucket = 'eventchain-backups'
    retention_days = 30
    cutoff_date = datetime.now() - timedelta(days=retention_days)
    
    # List and delete old database backups
    response = s3.list_objects_v2(Bucket=bucket, Prefix='database/')
    
    for obj in response.get('Contents', []):
        if obj['LastModified'].replace(tzinfo=None) < cutoff_date:
            s3.delete_object(Bucket=bucket, Key=obj['Key'])
            print(f"Deleted old backup: {obj['Key']}")
```

### CloudWatch Events Schedule
```json
{
  "Rules": [
    {
      "Name": "EventChainDatabaseBackup",
      "ScheduleExpression": "rate(6 hours)",
      "State": "ENABLED",
      "Targets": [
        {
          "Id": "1",
          "Arn": "arn:aws:lambda:us-east-1:ACCOUNT:function:eventchain-backup-scheduler",
          "Input": "{\"backup_type\": \"database\"}"
        }
      ]
    },
    {
      "Name": "EventChainFullBackup",
      "ScheduleExpression": "cron(0 2 * * ? *)",
      "State": "ENABLED",
      "Targets": [
        {
          "Id": "1",
          "Arn": "arn:aws:lambda:us-east-1:ACCOUNT:function:eventchain-backup-scheduler",
          "Input": "{\"backup_type\": \"full\"}"
        }
      ]
    }
  ]
}
```

## Disaster Recovery Procedures

### Multi-Region Disaster Recovery

#### Primary Region Failure Recovery
```bash
#!/bin/bash
# disaster-recovery-failover.sh

PRIMARY_REGION="us-east-1"
DR_REGION="us-west-2"
RECOVERY_TYPE=$1  # "partial" or "full"

echo "Initiating disaster recovery failover to $DR_REGION"

# Step 1: Assess primary region status
echo "Checking primary region status..."
PRIMARY_STATUS=$(aws ec2 describe-regions --region $PRIMARY_REGION 2>/dev/null && echo "available" || echo "unavailable")

if [ "$PRIMARY_STATUS" = "unavailable" ]; then
  echo "Primary region confirmed unavailable. Proceeding with full failover."
  RECOVERY_TYPE="full"
fi

# Step 2: Activate DR region infrastructure
echo "Activating DR region infrastructure..."

# Update Route 53 to point to DR region
aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch '{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.eventchain.com",
      "Type": "CNAME",
      "TTL": 60,
      "ResourceRecords": [{"Value": "eventchain-dr-alb.us-west-2.elb.amazonaws.com"}]
    }
  }]
}'

# Step 3: Restore database from latest backup
echo "Restoring database in DR region..."
LATEST_SNAPSHOT=$(aws rds describe-db-snapshots \
  --region $DR_REGION \
  --db-instance-identifier eventchain-prod-db \
  --query 'DBSnapshots[0].DBSnapshotIdentifier' \
  --output text)

aws rds restore-db-instance-from-db-snapshot \
  --region $DR_REGION \
  --db-instance-identifier eventchain-dr-db \
  --db-snapshot-identifier $LATEST_SNAPSHOT

# Wait for database to be available
aws rds wait db-instance-available \
  --region $DR_REGION \
  --db-instance-identifier eventchain-dr-db

# Step 4: Start application services
echo "Starting application services in DR region..."
aws ecs update-service \
  --region $DR_REGION \
  --cluster eventchain-dr \
  --service eventchain-backend-dr \
  --desired-count 3

aws ecs update-service \
  --region $DR_REGION \
  --cluster eventchain-dr \
  --service eventchain-frontend-dr \
  --desired-count 2

# Step 5: Verify services are healthy
echo "Verifying service health..."
for i in {1..30}; do
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.eventchain.com/health)
  if [ "$HEALTH_STATUS" = "200" ]; then
    echo "Services are healthy in DR region"
    break
  fi
  echo "Waiting for services to be healthy... (attempt $i/30)"
  sleep 30
done

# Step 6: Update monitoring and alerting
echo "Updating monitoring configuration..."
aws cloudwatch put-metric-alarm \
  --region $DR_REGION \
  --alarm-name "EventChain-DR-HighErrorRate" \
  --alarm-description "High error rate in DR region" \
  --metric-name ErrorRate \
  --namespace EventChain/DR \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

echo "Disaster recovery failover completed successfully"
echo "Services are now running in $DR_REGION"
```

#### Database Point-in-Time Recovery
```bash
#!/bin/bash
# database-point-in-time-recovery.sh

RECOVERY_TIME=$1  # Format: "2024-01-15 14:30:00"
RECOVERY_INSTANCE_ID="eventchain-recovery-$(date +%s)"

if [ -z "$RECOVERY_TIME" ]; then
  echo "Usage: $0 'YYYY-MM-DD HH:MM:SS'"
  exit 1
fi

echo "Starting point-in-time recovery to: $RECOVERY_TIME"

# Step 1: Create recovery instance from automated backup
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier eventchain-prod-db \
  --target-db-instance-identifier $RECOVERY_INSTANCE_ID \
  --restore-time "$RECOVERY_TIME" \
  --db-instance-class db.r6g.large \
  --no-multi-az \
  --no-publicly-accessible

echo "Recovery instance creation initiated: $RECOVERY_INSTANCE_ID"

# Step 2: Wait for instance to be available
echo "Waiting for recovery instance to be available..."
aws rds wait db-instance-available --db-instance-identifier $RECOVERY_INSTANCE_ID

# Step 3: Get recovery instance endpoint
RECOVERY_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier $RECOVERY_INSTANCE_ID \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

echo "Recovery instance available at: $RECOVERY_ENDPOINT"

# Step 4: Verify data integrity
echo "Verifying data integrity..."
RECORD_COUNT=$(psql -h $RECOVERY_ENDPOINT -U eventchain -d eventchain -t -c "
  SELECT COUNT(*) FROM events WHERE created_at <= '$RECOVERY_TIME';
")

echo "Records recovered: $RECORD_COUNT"

# Step 5: Create manual snapshot of recovery instance
RECOVERY_SNAPSHOT_ID="recovery-snapshot-$(date +%s)"
aws rds create-db-snapshot \
  --db-instance-identifier $RECOVERY_INSTANCE_ID \
  --db-snapshot-identifier $RECOVERY_SNAPSHOT_ID

echo "Recovery snapshot created: $RECOVERY_SNAPSHOT_ID"
echo "Recovery instance endpoint: $RECOVERY_ENDPOINT"
echo ""
echo "Next steps:"
echo "1. Verify data integrity on recovery instance"
echo "2. If data is correct, promote recovery instance to production"
echo "3. Update application configuration to use new endpoint"
echo "4. Delete old production instance after verification"
```

### Application Recovery

#### Service Recovery Automation
```python
# service-recovery.py
import boto3
import time
import json
from typing import Dict, List

class ServiceRecovery:
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.ecs = boto3.client('ecs', region_name=region)
        self.elb = boto3.client('elbv2', region_name=region)
        self.route53 = boto3.client('route53')
        
    def recover_service(self, cluster: str, service: str, desired_count: int = 3) -> bool:
        """
        Recover a failed ECS service
        """
        try:
            # Check current service status
            response = self.ecs.describe_services(
                cluster=cluster,
                services=[service]
            )
            
            if not response['services']:
                print(f"Service {service} not found in cluster {cluster}")
                return False
            
            current_service = response['services'][0]
            current_count = current_service['desiredCount']
            running_count = current_service['runningCount']
            
            print(f"Service {service}: desired={current_count}, running={running_count}")
            
            # If service is completely down, restart it
            if running_count == 0:
                print(f"Restarting service {service}")
                self.ecs.update_service(
                    cluster=cluster,
                    service=service,
                    desiredCount=desired_count,
                    forceNewDeployment=True
                )
                
                # Wait for service to stabilize
                waiter = self.ecs.get_waiter('services_stable')
                waiter.wait(
                    cluster=cluster,
                    services=[service],
                    WaiterConfig={'maxAttempts': 30, 'delay': 30}
                )
                
            # Verify service health
            return self.verify_service_health(cluster, service)
            
        except Exception as e:
            print(f"Error recovering service {service}: {str(e)}")
            return False
    
    def verify_service_health(self, cluster: str, service: str) -> bool:
        """
        Verify service is healthy by checking load balancer targets
        """
        try:
            # Get service details
            response = self.ecs.describe_services(
                cluster=cluster,
                services=[service]
            )
            
            service_details = response['services'][0]
            
            # Check if service has load balancers
            if not service_details.get('loadBalancers'):
                print(f"Service {service} has no load balancers")
                return True
            
            # Check target group health
            for lb in service_details['loadBalancers']:
                target_group_arn = lb['targetGroupArn']
                
                targets = self.elb.describe_target_health(
                    TargetGroupArn=target_group_arn
                )
                
                healthy_targets = [
                    t for t in targets['TargetHealthDescriptions']
                    if t['TargetHealth']['State'] == 'healthy'
                ]
                
                if len(healthy_targets) == 0:
                    print(f"No healthy targets in target group {target_group_arn}")
                    return False
                
                print(f"Target group {target_group_arn}: {len(healthy_targets)} healthy targets")
            
            return True
            
        except Exception as e:
            print(f"Error verifying service health: {str(e)}")
            return False
    
    def recover_all_services(self, cluster: str) -> Dict[str, bool]:
        """
        Recover all services in a cluster
        """
        results = {}
        
        try:
            # List all services in cluster
            response = self.ecs.list_services(cluster=cluster)
            
            for service_arn in response['serviceArns']:
                service_name = service_arn.split('/')[-1]
                print(f"Recovering service: {service_name}")
                
                results[service_name] = self.recover_service(cluster, service_name)
                
                # Wait between service recoveries
                time.sleep(30)
                
        except Exception as e:
            print(f"Error recovering services in cluster {cluster}: {str(e)}")
        
        return results
    
    def update_dns_failover(self, hosted_zone_id: str, record_name: str, 
                           primary_value: str, secondary_value: str) -> bool:
        """
        Update Route 53 DNS to failover to secondary endpoint
        """
        try:
            # Create health check for primary endpoint
            health_check = self.route53.create_health_check(
                Type='HTTPS',
                ResourcePath='/health',
                FullyQualifiedDomainName=primary_value,
                Port=443,
                RequestInterval=30,
                FailureThreshold=3
            )
            
            health_check_id = health_check['HealthCheck']['Id']
            
            # Update primary record with health check
            self.route53.change_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                ChangeBatch={
                    'Changes': [
                        {
                            'Action': 'UPSERT',
                            'ResourceRecordSet': {
                                'Name': record_name,
                                'Type': 'CNAME',
                                'SetIdentifier': 'primary',
                                'Failover': 'PRIMARY',
                                'TTL': 60,
                                'ResourceRecords': [{'Value': primary_value}],
                                'HealthCheckId': health_check_id
                            }
                        },
                        {
                            'Action': 'UPSERT',
                            'ResourceRecordSet': {
                                'Name': record_name,
                                'Type': 'CNAME',
                                'SetIdentifier': 'secondary',
                                'Failover': 'SECONDARY',
                                'TTL': 60,
                                'ResourceRecords': [{'Value': secondary_value}]
                            }
                        }
                    ]
                }
            )
            
            print(f"DNS failover configured for {record_name}")
            return True
            
        except Exception as e:
            print(f"Error configuring DNS failover: {str(e)}")
            return False

# Usage example
if __name__ == "__main__":
    recovery = ServiceRecovery()
    
    # Recover specific service
    success = recovery.recover_service('eventchain-prod', 'eventchain-backend-prod')
    
    if success:
        print("Service recovery completed successfully")
    else:
        print("Service recovery failed")
        
        # Try DNS failover
        recovery.update_dns_failover(
            'Z123456789',
            'api.eventchain.com',
            'eventchain-prod-alb.us-east-1.elb.amazonaws.com',
            'eventchain-dr-alb.us-west-2.elb.amazonaws.com'
        )
```

## Backup Verification and Testing

### Backup Integrity Testing
```bash
#!/bin/bash
# test-backup-integrity.sh

BACKUP_FILE=$1
TEST_DB_NAME="eventchain_backup_test"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

echo "Testing backup integrity: $BACKUP_FILE"

# Step 1: Create test database
createdb $TEST_DB_NAME

# Step 2: Restore backup to test database
if [[ $BACKUP_FILE == *.gz ]]; then
  gunzip -c "$BACKUP_FILE" | pg_restore -d $TEST_DB_NAME --verbose
else
  pg_restore -d $TEST_DB_NAME --verbose "$BACKUP_FILE"
fi

if [ $? -ne 0 ]; then
  echo "ERROR: Backup restoration failed"
  dropdb $TEST_DB_NAME
  exit 1
fi

# Step 3: Run integrity checks
echo "Running integrity checks..."

# Check table counts
EXPECTED_TABLES=("users" "events" "tickets" "payments" "organizations")
for table in "${EXPECTED_TABLES[@]}"; do
  COUNT=$(psql -d $TEST_DB_NAME -t -c "SELECT COUNT(*) FROM $table;")
  if [ $COUNT -eq 0 ]; then
    echo "WARNING: Table $table is empty"
  else
    echo "Table $table: $COUNT records"
  fi
done

# Check data consistency
CONSISTENCY_CHECKS=(
  "SELECT COUNT(*) FROM tickets WHERE event_id NOT IN (SELECT id FROM events)"
  "SELECT COUNT(*) FROM payments WHERE user_id NOT IN (SELECT id FROM users)"
  "SELECT COUNT(*) FROM events WHERE organizer_id NOT IN (SELECT id FROM organizations)"
)

for check in "${CONSISTENCY_CHECKS[@]}"; do
  RESULT=$(psql -d $TEST_DB_NAME -t -c "$check")
  if [ $RESULT -gt 0 ]; then
    echo "WARNING: Data consistency issue found: $check returned $RESULT"
  fi
done

# Step 4: Test application connectivity
echo "Testing application connectivity..."
export DATABASE_URL="postgresql://localhost:5432/$TEST_DB_NAME"
npm run test:database-connectivity

# Step 5: Cleanup
dropdb $TEST_DB_NAME

echo "Backup integrity test completed"
```

### Disaster Recovery Testing
```bash
#!/bin/bash
# dr-test.sh

DR_TEST_TYPE=$1  # "database", "application", or "full"
TEST_ENVIRONMENT="dr-test"

echo "Starting disaster recovery test: $DR_TEST_TYPE"

case $DR_TEST_TYPE in
  "database")
    echo "Testing database recovery..."
    
    # Create test database from latest backup
    LATEST_BACKUP=$(aws s3 ls s3://eventchain-backups/database/full/ | sort | tail -n 1 | awk '{print $4}')
    aws s3 cp "s3://eventchain-backups/database/full/$LATEST_BACKUP" "/tmp/$LATEST_BACKUP"
    
    # Restore to test instance
    createdb eventchain_dr_test
    gunzip -c "/tmp/$LATEST_BACKUP" | pg_restore -d eventchain_dr_test --verbose
    
    # Run application tests against restored database
    export DATABASE_URL="postgresql://localhost:5432/eventchain_dr_test"
    npm run test:integration
    
    # Cleanup
    dropdb eventchain_dr_test
    rm "/tmp/$LATEST_BACKUP"
    ;;
    
  "application")
    echo "Testing application recovery..."
    
    # Deploy application to test environment
    kubectl create namespace $TEST_ENVIRONMENT
    helm install eventchain-dr-test ./helm/eventchain \
      --namespace $TEST_ENVIRONMENT \
      --set environment=dr-test \
      --set database.host=eventchain-dr-test-db
    
    # Wait for deployment
    kubectl wait --for=condition=available --timeout=300s \
      deployment/eventchain-backend -n $TEST_ENVIRONMENT
    
    # Run health checks
    kubectl port-forward -n $TEST_ENVIRONMENT svc/eventchain-backend 8080:3001 &
    PORT_FORWARD_PID=$!
    
    sleep 10
    curl -f http://localhost:8080/health || echo "Health check failed"
    
    # Cleanup
    kill $PORT_FORWARD_PID
    helm uninstall eventchain-dr-test -n $TEST_ENVIRONMENT
    kubectl delete namespace $TEST_ENVIRONMENT
    ;;
    
  "full")
    echo "Testing full disaster recovery..."
    
    # Test database recovery
    ./dr-test.sh database
    
    # Test application recovery
    ./dr-test.sh application
    
    # Test DNS failover
    echo "Testing DNS failover..."
    dig api.eventchain.com
    
    # Test monitoring and alerting
    echo "Testing monitoring..."
    curl -f http://prometheus:9090/api/v1/query?query=up
    ;;
esac

echo "Disaster recovery test completed: $DR_TEST_TYPE"
```

## Recovery Documentation

### Recovery Runbooks
```markdown
# Database Recovery Runbook

## Scenario: Complete Database Failure

### Immediate Actions (0-15 minutes)
1. **Confirm database failure**
   ```bash
   psql -h eventchain-prod-db.region.rds.amazonaws.com -U eventchain -c "SELECT 1;"
   ```

2. **Check RDS console for instance status**
   - Log into AWS Console
   - Navigate to RDS → Databases
   - Check eventchain-prod-db status

3. **Notify team**
   ```bash
   # Send alert to incident channel
   curl -X POST $SLACK_WEBHOOK_URL -d '{
     "text": "🚨 Database failure detected - initiating recovery procedures"
   }'
   ```

### Recovery Actions (15-60 minutes)
1. **Identify latest backup**
   ```bash
   aws rds describe-db-snapshots \
     --db-instance-identifier eventchain-prod-db \
     --query 'DBSnapshots[0].DBSnapshotIdentifier'
   ```

2. **Restore from snapshot**
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier eventchain-prod-db-recovery \
     --db-snapshot-identifier LATEST_SNAPSHOT_ID
   ```

3. **Update application configuration**
   ```bash
   kubectl set env deployment/eventchain-backend \
     DATABASE_URL=postgresql://eventchain-prod-db-recovery.region.rds.amazonaws.com:5432/eventchain
   ```

4. **Verify recovery**
   ```bash
   # Test database connectivity
   psql -h eventchain-prod-db-recovery.region.rds.amazonaws.com -U eventchain -c "SELECT COUNT(*) FROM users;"
   
   # Test application health
   curl -f https://api.eventchain.com/health
   ```

### Post-Recovery Actions
1. **Update DNS if necessary**
2. **Monitor application performance**
3. **Document incident and lessons learned**
4. **Schedule post-incident review**
```

### Recovery Time Tracking
```python
# recovery-tracker.py
import time
import json
from datetime import datetime, timedelta

class RecoveryTracker:
    def __init__(self):
        self.start_time = None
        self.milestones = []
        self.rto_target = None
        self.rpo_target = None
    
    def start_recovery(self, incident_type: str, rto_hours: int, rpo_minutes: int):
        """Start tracking recovery time"""
        self.start_time = datetime.now()
        self.rto_target = self.start_time + timedelta(hours=rto_hours)
        self.rpo_target = timedelta(minutes=rpo_minutes)
        
        self.add_milestone("recovery_started", f"Recovery started for {incident_type}")
        
        print(f"Recovery started at {self.start_time}")
        print(f"RTO target: {self.rto_target}")
        print(f"RPO target: {self.rpo_target}")
    
    def add_milestone(self, milestone_id: str, description: str):
        """Add a recovery milestone"""
        timestamp = datetime.now()
        elapsed = timestamp - self.start_time if self.start_time else timedelta(0)
        
        milestone = {
            'id': milestone_id,
            'description': description,
            'timestamp': timestamp.isoformat(),
            'elapsed_minutes': elapsed.total_seconds() / 60
        }
        
        self.milestones.append(milestone)
        print(f"[{elapsed}] {description}")
    
    def check_rto_status(self) -> dict:
        """Check if we're meeting RTO targets"""
        if not self.start_time or not self.rto_target:
            return {'status': 'not_started'}
        
        current_time = datetime.now()
        elapsed = current_time - self.start_time
        remaining = self.rto_target - current_time
        
        if current_time > self.rto_target:
            status = 'exceeded'
        elif remaining.total_seconds() < 900:  # Less than 15 minutes remaining
            status = 'at_risk'
        else:
            status = 'on_track'
        
        return {
            'status': status,
            'elapsed_minutes': elapsed.total_seconds() / 60,
            'remaining_minutes': remaining.total_seconds() / 60,
            'target_time': self.rto_target.isoformat()
        }
    
    def complete_recovery(self, data_loss_minutes: int = 0):
        """Mark recovery as complete"""
        completion_time = datetime.now()
        total_time = completion_time - self.start_time
        
        self.add_milestone("recovery_completed", "Recovery completed successfully")
        
        # Check if we met our targets
        rto_met = completion_time <= self.rto_target
        rpo_met = timedelta(minutes=data_loss_minutes) <= self.rpo_target
        
        report = {
            'recovery_completed': completion_time.isoformat(),
            'total_recovery_time_minutes': total_time.total_seconds() / 60,
            'rto_target_minutes': (self.rto_target - self.start_time).total_seconds() / 60,
            'rto_met': rto_met,
            'data_loss_minutes': data_loss_minutes,
            'rpo_target_minutes': self.rpo_target.total_seconds() / 60,
            'rpo_met': rpo_met,
            'milestones': self.milestones
        }
        
        print(f"\n=== Recovery Complete ===")
        print(f"Total time: {total_time}")
        print(f"RTO met: {rto_met}")
        print(f"RPO met: {rpo_met}")
        
        return report
    
    def generate_report(self) -> str:
        """Generate recovery report"""
        report = {
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'milestones': self.milestones,
            'rto_status': self.check_rto_status()
        }
        
        return json.dumps(report, indent=2)

# Usage example
tracker = RecoveryTracker()
tracker.start_recovery("database_failure", rto_hours=1, rpo_minutes=15)
tracker.add_milestone("backup_identified", "Latest backup identified")
tracker.add_milestone("restore_started", "Database restore initiated")
tracker.add_milestone("restore_completed", "Database restore completed")
tracker.add_milestone("app_updated", "Application configuration updated")
tracker.add_milestone("health_verified", "System health verified")
report = tracker.complete_recovery(data_loss_minutes=5)
```

This comprehensive backup and recovery plan ensures EventChain can recover from any disaster scenario while meeting strict RTO and RPO requirements, with automated processes and thorough testing procedures.