# EventChain Maintenance Procedures

## Overview
This document outlines the comprehensive maintenance procedures for the EventChain platform, covering routine maintenance, system updates, performance optimization, and preventive measures to ensure optimal system health and performance.

## Maintenance Schedule

### Daily Maintenance (Automated)
- **Time**: 02:00 - 04:00 UTC (Low traffic period)
- **Frequency**: Every day
- **Duration**: 30 minutes maximum

#### Daily Tasks
- Database maintenance and optimization
- Log rotation and cleanup
- Cache warming and optimization
- Security scan and vulnerability checks
- Backup verification
- Performance metrics review

### Weekly Maintenance (Semi-Automated)
- **Time**: Sunday 02:00 - 06:00 UTC
- **Frequency**: Every Sunday
- **Duration**: 2 hours maximum

#### Weekly Tasks
- System updates and patches
- Database index optimization
- File storage cleanup
- SSL certificate renewal checks
- Dependency updates
- Performance baseline review

### Monthly Maintenance (Manual)
- **Time**: First Sunday of month 02:00 - 08:00 UTC
- **Frequency**: Monthly
- **Duration**: 4 hours maximum

#### Monthly Tasks
- Major system updates
- Infrastructure scaling review
- Security audit and penetration testing
- Disaster recovery testing
- Capacity planning review
- Documentation updates

### Quarterly Maintenance (Planned Downtime)
- **Time**: Scheduled with advance notice
- **Frequency**: Every 3 months
- **Duration**: 6 hours maximum

#### Quarterly Tasks
- Major infrastructure upgrades
- Database migration and optimization
- Security compliance audit
- Full disaster recovery test
- Performance optimization review
- Architecture review and updates

## Daily Maintenance Procedures

### Automated Daily Maintenance Script
```bash
#!/bin/bash
# daily-maintenance.sh

set -e

MAINTENANCE_LOG="/var/log/eventchain/maintenance-$(date +%Y%m%d).log"
MAINTENANCE_START=$(date)

echo "Starting daily maintenance at $MAINTENANCE_START" | tee -a $MAINTENANCE_LOG

# Function to log with timestamp
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $MAINTENANCE_LOG
}

# Function to check if maintenance window is active
check_maintenance_window() {
    current_hour=$(date +%H)
    if [ $current_hour -lt 2 ] || [ $current_hour -gt 4 ]; then
        log_message "WARNING: Running outside maintenance window (02:00-04:00 UTC)"
    fi
}

# Function to send maintenance alerts
send_alert() {
    local message=$1
    local severity=${2:-"info"}
    
    # Send to Slack
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🔧 Maintenance Alert [$severity]: $message\"}"
    
    # Send to monitoring system
    aws cloudwatch put-metric-data \
        --namespace "EventChain/Maintenance" \
        --metric-data MetricName=MaintenanceAlert,Value=1,Unit=Count
}

# Check maintenance window
check_maintenance_window

# 1. Database Maintenance
log_message "Starting database maintenance..."

# Analyze and vacuum database
psql $DATABASE_URL -c "
    -- Update table statistics
    ANALYZE;
    
    -- Vacuum to reclaim space
    VACUUM (ANALYZE, VERBOSE);
    
    -- Reindex critical tables
    REINDEX TABLE users;
    REINDEX TABLE events;
    REINDEX TABLE tickets;
    REINDEX TABLE payments;
" >> $MAINTENANCE_LOG 2>&1

if [ $? -eq 0 ]; then
    log_message "Database maintenance completed successfully"
else
    log_message "ERROR: Database maintenance failed"
    send_alert "Database maintenance failed" "error"
    exit 1
fi

# Check database performance
DB_SLOW_QUERIES=$(psql $DATABASE_URL -t -c "
    SELECT COUNT(*) FROM pg_stat_statements 
    WHERE mean_time > 1000 AND calls > 10;
")

if [ $DB_SLOW_QUERIES -gt 5 ]; then
    log_message "WARNING: $DB_SLOW_QUERIES slow queries detected"
    send_alert "$DB_SLOW_QUERIES slow queries detected" "warning"
fi

# 2. Log Rotation and Cleanup
log_message "Starting log cleanup..."

# Rotate application logs
find /var/log/eventchain -name "*.log" -size +100M -exec gzip {} \;
find /var/log/eventchain -name "*.log.gz" -mtime +7 -delete

# Clean up old maintenance logs
find /var/log/eventchain -name "maintenance-*.log" -mtime +30 -delete

# Clean up Docker logs
docker system prune -f --filter "until=24h" >> $MAINTENANCE_LOG 2>&1

log_message "Log cleanup completed"

# 3. Cache Optimization
log_message "Starting cache optimization..."

# Redis maintenance
redis-cli --eval - 0 <<EOF
-- Remove expired keys
local expired = 0
for i=1,1000 do
    local key = redis.call('RANDOMKEY')
    if key and redis.call('TTL', key) == -1 then
        redis.call('DEL', key)
        expired = expired + 1
    end
end
return expired
EOF

# Warm critical caches
curl -s "https://api.eventchain.com/cache/warm" >> $MAINTENANCE_LOG

log_message "Cache optimization completed"

# 4. Security Checks
log_message "Starting security checks..."

# Check for failed login attempts
FAILED_LOGINS=$(grep -c "Failed login attempt" /var/log/eventchain/auth.log || echo "0")
if [ $FAILED_LOGINS -gt 100 ]; then
    log_message "WARNING: $FAILED_LOGINS failed login attempts in last 24 hours"
    send_alert "$FAILED_LOGINS failed login attempts detected" "warning"
fi

# Check SSL certificate expiration
SSL_DAYS_LEFT=$(echo | openssl s_client -servername eventchain.com -connect eventchain.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2 | xargs -I {} date -d {} +%s)
CURRENT_DATE=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (SSL_DAYS_LEFT - CURRENT_DATE) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    log_message "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
    send_alert "SSL certificate expires in $DAYS_UNTIL_EXPIRY days" "warning"
fi

log_message "Security checks completed"

# 5. Backup Verification
log_message "Starting backup verification..."

# Check latest database backup
LATEST_BACKUP=$(aws s3 ls s3://eventchain-backups/database/full/ | sort | tail -n 1 | awk '{print $4}')
BACKUP_DATE=$(echo $LATEST_BACKUP | grep -o '[0-9]\{8\}_[0-9]\{6\}')
BACKUP_TIMESTAMP=$(date -d "${BACKUP_DATE:0:8} ${BACKUP_DATE:9:2}:${BACKUP_DATE:11:2}:${BACKUP_DATE:13:2}" +%s)
HOURS_SINCE_BACKUP=$(( (CURRENT_DATE - BACKUP_TIMESTAMP) / 3600 ))

if [ $HOURS_SINCE_BACKUP -gt 8 ]; then
    log_message "WARNING: Latest backup is $HOURS_SINCE_BACKUP hours old"
    send_alert "Latest backup is $HOURS_SINCE_BACKUP hours old" "warning"
else
    log_message "Backup verification passed - latest backup is $HOURS_SINCE_BACKUP hours old"
fi

# Test backup integrity
./test-backup-integrity.sh "s3://eventchain-backups/database/full/$LATEST_BACKUP" >> $MAINTENANCE_LOG 2>&1

log_message "Backup verification completed"

# 6. Performance Metrics Review
log_message "Starting performance metrics review..."

# Check API response times
AVG_RESPONSE_TIME=$(curl -s "http://prometheus:9090/api/v1/query?query=avg(http_request_duration_seconds)" | jq -r '.data.result[0].value[1]')
if (( $(echo "$AVG_RESPONSE_TIME > 2.0" | bc -l) )); then
    log_message "WARNING: Average API response time is ${AVG_RESPONSE_TIME}s"
    send_alert "High API response time: ${AVG_RESPONSE_TIME}s" "warning"
fi

# Check error rates
ERROR_RATE=$(curl -s "http://prometheus:9090/api/v1/query?query=rate(http_requests_total{status=~\"5..\"}[1h])" | jq -r '.data.result[0].value[1]')
if (( $(echo "$ERROR_RATE > 0.01" | bc -l) )); then
    log_message "WARNING: Error rate is ${ERROR_RATE}"
    send_alert "High error rate: ${ERROR_RATE}" "warning"
fi

log_message "Performance metrics review completed"

# 7. System Health Check
log_message "Starting system health check..."

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    log_message "WARNING: Disk usage is ${DISK_USAGE}%"
    send_alert "High disk usage: ${DISK_USAGE}%" "warning"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ $MEMORY_USAGE -gt 85 ]; then
    log_message "WARNING: Memory usage is ${MEMORY_USAGE}%"
    send_alert "High memory usage: ${MEMORY_USAGE}%" "warning"
fi

# Check service health
UNHEALTHY_SERVICES=$(kubectl get pods --all-namespaces --field-selector=status.phase!=Running | wc -l)
if [ $UNHEALTHY_SERVICES -gt 1 ]; then  # Subtract 1 for header
    log_message "WARNING: $((UNHEALTHY_SERVICES-1)) unhealthy services detected"
    send_alert "$((UNHEALTHY_SERVICES-1)) unhealthy services detected" "warning"
fi

log_message "System health check completed"

MAINTENANCE_END=$(date)
log_message "Daily maintenance completed at $MAINTENANCE_END"

# Send completion notification
send_alert "Daily maintenance completed successfully" "info"

# Generate maintenance report
cat > /tmp/maintenance-report.json <<EOF
{
  "date": "$(date +%Y-%m-%d)",
  "start_time": "$MAINTENANCE_START",
  "end_time": "$MAINTENANCE_END",
  "duration_minutes": $(( ($(date +%s) - $(date -d "$MAINTENANCE_START" +%s)) / 60 )),
  "tasks_completed": [
    "database_maintenance",
    "log_cleanup",
    "cache_optimization",
    "security_checks",
    "backup_verification",
    "performance_review",
    "health_check"
  ],
  "warnings": $(grep -c "WARNING" $MAINTENANCE_LOG),
  "errors": $(grep -c "ERROR" $MAINTENANCE_LOG)
}
EOF

# Upload report to S3
aws s3 cp /tmp/maintenance-report.json "s3://eventchain-reports/maintenance/daily/$(date +%Y%m%d).json"

exit 0
```

### Daily Maintenance Cron Setup
```bash
# Add to crontab
0 2 * * * /opt/eventchain/scripts/daily-maintenance.sh
```

## Weekly Maintenance Procedures

### System Updates and Patches
```bash
#!/bin/bash
# weekly-maintenance.sh

set -e

MAINTENANCE_LOG="/var/log/eventchain/weekly-maintenance-$(date +%Y%m%d).log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $MAINTENANCE_LOG
}

log_message "Starting weekly maintenance"

# 1. System Updates
log_message "Checking for system updates..."

# Update package lists
apt-get update >> $MAINTENANCE_LOG 2>&1

# Check for security updates
SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")
if [ $SECURITY_UPDATES -gt 0 ]; then
    log_message "Installing $SECURITY_UPDATES security updates"
    apt-get upgrade -y >> $MAINTENANCE_LOG 2>&1
    
    # Check if reboot is required
    if [ -f /var/run/reboot-required ]; then
        log_message "System reboot required after updates"
        # Schedule reboot during next maintenance window
        echo "reboot" > /tmp/maintenance-reboot-required
    fi
fi

# 2. Docker Image Updates
log_message "Checking for Docker image updates..."

# Pull latest images
docker pull eventchain/backend:latest >> $MAINTENANCE_LOG 2>&1
docker pull eventchain/frontend:latest >> $MAINTENANCE_LOG 2>&1

# Update running containers if new images available
BACKEND_IMAGE_ID=$(docker images eventchain/backend:latest -q)
RUNNING_BACKEND_ID=$(docker ps --filter "ancestor=eventchain/backend" --format "{{.Image}}")

if [ "$BACKEND_IMAGE_ID" != "$RUNNING_BACKEND_ID" ]; then
    log_message "Updating backend containers with new image"
    kubectl rollout restart deployment/eventchain-backend
    kubectl rollout status deployment/eventchain-backend --timeout=300s
fi

# 3. Database Index Optimization
log_message "Starting database index optimization..."

psql $DATABASE_URL -c "
    -- Identify unused indexes
    SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
    FROM pg_stat_user_indexes 
    WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;
    
    -- Rebuild fragmented indexes
    REINDEX INDEX CONCURRENTLY idx_events_start_date;
    REINDEX INDEX CONCURRENTLY idx_tickets_event_id;
    REINDEX INDEX CONCURRENTLY idx_payments_created_at;
    
    -- Update table statistics
    ANALYZE VERBOSE;
" >> $MAINTENANCE_LOG 2>&1

# 4. File Storage Cleanup
log_message "Starting file storage cleanup..."

# Clean up temporary files older than 7 days
aws s3 rm s3://eventchain-uploads/temp/ --recursive \
    --exclude "*" --include "*" \
    --query "Contents[?LastModified<='$(date -d '7 days ago' --iso-8601)']"

# Clean up old log files
aws s3 rm s3://eventchain-logs/ --recursive \
    --exclude "*" --include "*.log" \
    --query "Contents[?LastModified<='$(date -d '30 days ago' --iso-8601)']"

# 5. SSL Certificate Renewal
log_message "Checking SSL certificate renewal..."

# Check and renew Let's Encrypt certificates
certbot renew --quiet --no-self-upgrade >> $MAINTENANCE_LOG 2>&1

# Update certificates in Kubernetes if renewed
if [ -f /etc/letsencrypt/live/eventchain.com/fullchain.pem ]; then
    kubectl create secret tls eventchain-tls \
        --cert=/etc/letsencrypt/live/eventchain.com/fullchain.pem \
        --key=/etc/letsencrypt/live/eventchain.com/privkey.pem \
        --dry-run=client -o yaml | kubectl apply -f -
fi

# 6. Dependency Updates
log_message "Checking for dependency updates..."

# Check for npm security vulnerabilities
cd /opt/eventchain/backend
npm audit --audit-level=high >> $MAINTENANCE_LOG 2>&1

# Update dependencies with security fixes
npm audit fix >> $MAINTENANCE_LOG 2>&1

# Check Python dependencies
cd /opt/eventchain/scripts
pip-audit >> $MAINTENANCE_LOG 2>&1

# 7. Performance Baseline Review
log_message "Reviewing performance baselines..."

# Generate performance report
python3 /opt/eventchain/scripts/generate-performance-report.py \
    --period=week \
    --output=/tmp/weekly-performance-report.json

# Compare with previous week
python3 /opt/eventchain/scripts/compare-performance.py \
    --current=/tmp/weekly-performance-report.json \
    --previous=/opt/eventchain/reports/performance/previous-week.json \
    --output=/tmp/performance-comparison.json

# Archive current report
cp /tmp/weekly-performance-report.json \
   /opt/eventchain/reports/performance/previous-week.json

log_message "Weekly maintenance completed"
```

## Monthly Maintenance Procedures

### Infrastructure Scaling Review
```python
# monthly-scaling-review.py
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, List

class ScalingReview:
    def __init__(self):
        self.cloudwatch = boto3.client('cloudwatch')
        self.ecs = boto3.client('ecs')
        self.rds = boto3.client('rds')
        self.elasticache = boto3.client('elasticache')
        
    def analyze_ecs_scaling(self, cluster_name: str, service_name: str) -> Dict:
        """Analyze ECS service scaling patterns"""
        
        # Get CPU and memory utilization for the past month
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        cpu_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'ClusterName', 'Value': cluster_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,  # 1 hour periods
            Statistics=['Average', 'Maximum']
        )
        
        memory_metrics = self.cloudwatch.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='MemoryUtilization',
            Dimensions=[
                {'Name': 'ServiceName', 'Value': service_name},
                {'Name': 'ClusterName', 'Value': cluster_name}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=3600,
            Statistics=['Average', 'Maximum']
        )
        
        # Analyze patterns
        cpu_avg = sum(point['Average'] for point in cpu_metrics['Datapoints']) / len(cpu_metrics['Datapoints'])
        cpu_max = max(point['Maximum'] for point in cpu_metrics['Datapoints'])
        
        memory_avg = sum(point['Average'] for point in memory_metrics['Datapoints']) / len(memory_metrics['Datapoints'])
        memory_max = max(point['Maximum'] for point in memory_metrics['Datapoints'])
        
        # Generate recommendations
        recommendations = []
        
        if cpu_avg > 70:
            recommendations.append("Consider increasing CPU allocation or scaling out")
        elif cpu_avg < 30:
            recommendations.append("Consider reducing CPU allocation to save costs")
            
        if memory_avg > 80:
            recommendations.append("Consider increasing memory allocation")
        elif memory_avg < 40:
            recommendations.append("Consider reducing memory allocation")
            
        if cpu_max > 90 or memory_max > 95:
            recommendations.append("Consider implementing auto-scaling policies")
        
        return {
            'service': service_name,
            'cpu_average': cpu_avg,
            'cpu_maximum': cpu_max,
            'memory_average': memory_avg,
            'memory_maximum': memory_max,
            'recommendations': recommendations
        }
    
    def analyze_rds_scaling(self, db_instance_id: str) -> Dict:
        """Analyze RDS instance scaling needs"""
        
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        # Get database metrics
        metrics = ['CPUUtilization', 'DatabaseConnections', 'FreeableMemory', 'ReadLatency', 'WriteLatency']
        db_metrics = {}
        
        for metric in metrics:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName=metric,
                Dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': db_instance_id}],
                StartTime=start_time,
                EndTime=end_time,
                Period=3600,
                Statistics=['Average', 'Maximum']
            )
            
            if response['Datapoints']:
                db_metrics[metric] = {
                    'average': sum(point['Average'] for point in response['Datapoints']) / len(response['Datapoints']),
                    'maximum': max(point['Maximum'] for point in response['Datapoints'])
                }
        
        # Generate recommendations
        recommendations = []
        
        if db_metrics.get('CPUUtilization', {}).get('average', 0) > 70:
            recommendations.append("Consider upgrading to a larger instance class")
            
        if db_metrics.get('DatabaseConnections', {}).get('maximum', 0) > 80:
            recommendations.append("Consider implementing connection pooling or read replicas")
            
        if db_metrics.get('ReadLatency', {}).get('average', 0) > 0.2:
            recommendations.append("Consider adding read replicas or optimizing queries")
            
        return {
            'instance': db_instance_id,
            'metrics': db_metrics,
            'recommendations': recommendations
        }
    
    def generate_scaling_report(self) -> Dict:
        """Generate comprehensive scaling report"""
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'period': '30_days',
            'services': {},
            'databases': {},
            'summary': {
                'total_recommendations': 0,
                'cost_optimization_opportunities': [],
                'performance_improvements': []
            }
        }
        
        # Analyze ECS services
        services = [
            ('eventchain-prod', 'eventchain-backend-prod'),
            ('eventchain-prod', 'eventchain-frontend-prod'),
            ('eventchain-prod', 'eventchain-worker-prod')
        ]
        
        for cluster, service in services:
            analysis = self.analyze_ecs_scaling(cluster, service)
            report['services'][service] = analysis
            report['summary']['total_recommendations'] += len(analysis['recommendations'])
        
        # Analyze RDS instances
        databases = ['eventchain-prod-db']
        
        for db in databases:
            analysis = self.analyze_rds_scaling(db)
            report['databases'][db] = analysis
            report['summary']['total_recommendations'] += len(analysis['recommendations'])
        
        return report

# Usage
if __name__ == "__main__":
    reviewer = ScalingReview()
    report = reviewer.generate_scaling_report()
    
    # Save report
    with open(f'/tmp/scaling-report-{datetime.now().strftime("%Y%m%d")}.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"Scaling review completed. Total recommendations: {report['summary']['total_recommendations']}")
```

### Security Audit Script
```bash
#!/bin/bash
# monthly-security-audit.sh

AUDIT_LOG="/var/log/eventchain/security-audit-$(date +%Y%m%d).log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $AUDIT_LOG
}

log_message "Starting monthly security audit"

# 1. System Security Updates
log_message "Checking for security updates..."

# Check for unattended upgrades
if ! systemctl is-active --quiet unattended-upgrades; then
    log_message "WARNING: Unattended upgrades service is not running"
fi

# Check for pending security updates
SECURITY_UPDATES=$(apt list --upgradable 2>/dev/null | grep -c security || echo "0")
if [ $SECURITY_UPDATES -gt 0 ]; then
    log_message "WARNING: $SECURITY_UPDATES security updates pending"
fi

# 2. User Access Audit
log_message "Auditing user access..."

# Check for users with sudo access
SUDO_USERS=$(grep -E '^sudo:' /etc/group | cut -d: -f4)
log_message "Users with sudo access: $SUDO_USERS"

# Check for users with shell access
SHELL_USERS=$(awk -F: '$7 ~ /bash|sh/ {print $1}' /etc/passwd)
log_message "Users with shell access: $SHELL_USERS"

# Check for inactive users
INACTIVE_USERS=$(lastlog -b 90 | awk 'NR>1 && $2=="**Never" {print $1}')
if [ -n "$INACTIVE_USERS" ]; then
    log_message "Inactive users (90+ days): $INACTIVE_USERS"
fi

# 3. Network Security Audit
log_message "Auditing network security..."

# Check open ports
OPEN_PORTS=$(netstat -tuln | awk 'NR>2 {print $4}' | cut -d: -f2 | sort -u)
log_message "Open ports: $OPEN_PORTS"

# Check firewall status
if command -v ufw >/dev/null; then
    UFW_STATUS=$(ufw status | head -1)
    log_message "Firewall status: $UFW_STATUS"
fi

# 4. SSL/TLS Security
log_message "Checking SSL/TLS configuration..."

# Check SSL certificate validity
SSL_EXPIRY=$(echo | openssl s_client -servername eventchain.com -connect eventchain.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
log_message "SSL certificate expires: $SSL_EXPIRY"

# Check SSL configuration
SSL_GRADE=$(curl -s "https://api.ssllabs.com/api/v3/analyze?host=eventchain.com" | jq -r '.endpoints[0].grade')
log_message "SSL Labs grade: $SSL_GRADE"

# 5. Application Security
log_message "Auditing application security..."

# Check for hardcoded secrets
HARDCODED_SECRETS=$(grep -r -i "password\|secret\|key" /opt/eventchain/backend --include="*.js" --include="*.json" | grep -v node_modules | wc -l)
if [ $HARDCODED_SECRETS -gt 0 ]; then
    log_message "WARNING: Potential hardcoded secrets found: $HARDCODED_SECRETS"
fi

# Check npm audit
cd /opt/eventchain/backend
NPM_VULNERABILITIES=$(npm audit --json | jq '.metadata.vulnerabilities.total')
if [ $NPM_VULNERABILITIES -gt 0 ]; then
    log_message "WARNING: $NPM_VULNERABILITIES npm vulnerabilities found"
fi

# 6. Database Security
log_message "Auditing database security..."

# Check database user permissions
DB_USERS=$(psql $DATABASE_URL -t -c "SELECT usename FROM pg_user WHERE usesuper = true;")
log_message "Database superusers: $DB_USERS"

# Check for default passwords
DEFAULT_PASSWORDS=$(psql $DATABASE_URL -t -c "SELECT usename FROM pg_user WHERE passwd IS NULL;")
if [ -n "$DEFAULT_PASSWORDS" ]; then
    log_message "WARNING: Users with no password: $DEFAULT_PASSWORDS"
fi

# 7. Log Analysis
log_message "Analyzing security logs..."

# Check for brute force attempts
BRUTE_FORCE=$(grep -c "Failed password" /var/log/auth.log || echo "0")
if [ $BRUTE_FORCE -gt 100 ]; then
    log_message "WARNING: $BRUTE_FORCE failed password attempts in auth.log"
fi

# Check for suspicious API calls
SUSPICIOUS_API=$(grep -c "401\|403" /var/log/eventchain/api.log || echo "0")
if [ $SUSPICIOUS_API -gt 1000 ]; then
    log_message "WARNING: $SUSPICIOUS_API unauthorized API calls"
fi

# 8. Compliance Check
log_message "Running compliance checks..."

# Check file permissions
WORLD_WRITABLE=$(find /opt/eventchain -type f -perm -002 | wc -l)
if [ $WORLD_WRITABLE -gt 0 ]; then
    log_message "WARNING: $WORLD_WRITABLE world-writable files found"
fi

# Check for SUID/SGID files
SUID_FILES=$(find /opt/eventchain -type f \( -perm -4000 -o -perm -2000 \) | wc -l)
if [ $SUID_FILES -gt 0 ]; then
    log_message "WARNING: $SUID_FILES SUID/SGID files found"
fi

# Generate security report
cat > /tmp/security-audit-report.json <<EOF
{
  "audit_date": "$(date --iso-8601)",
  "security_updates_pending": $SECURITY_UPDATES,
  "npm_vulnerabilities": $NPM_VULNERABILITIES,
  "brute_force_attempts": $BRUTE_FORCE,
  "suspicious_api_calls": $SUSPICIOUS_API,
  "world_writable_files": $WORLD_WRITABLE,
  "suid_files": $SUID_FILES,
  "ssl_grade": "$SSL_GRADE",
  "recommendations": [
    $([ $SECURITY_UPDATES -gt 0 ] && echo "\"Install pending security updates\",")
    $([ $NPM_VULNERABILITIES -gt 0 ] && echo "\"Fix npm vulnerabilities\",")
    $([ $BRUTE_FORCE -gt 100 ] && echo "\"Investigate brute force attempts\",")
    $([ $WORLD_WRITABLE -gt 0 ] && echo "\"Fix file permissions\",")
    "\"Regular security monitoring\""
  ]
}
EOF

# Upload report
aws s3 cp /tmp/security-audit-report.json "s3://eventchain-reports/security/monthly/$(date +%Y%m%d).json"

log_message "Monthly security audit completed"
```

## Quarterly Maintenance Procedures

### Infrastructure Upgrade Planning
```python
# quarterly-upgrade-planning.py
import boto3
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple

class UpgradePlanner:
    def __init__(self):
        self.ec2 = boto3.client('ec2')
        self.rds = boto3.client('rds')
        self.eks = boto3.client('eks')
        self.elasticache = boto3.client('elasticache')
        
    def check_ami_updates(self) -> List[Dict]:
        """Check for newer AMI versions"""
        
        # Get current instances
        instances = self.ec2.describe_instances(
            Filters=[
                {'Name': 'tag:Project', 'Values': ['eventchain']},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )
        
        upgrade_recommendations = []
        
        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                current_ami = instance['ImageId']
                instance_type = instance['InstanceType']
                
                # Get AMI details
                ami_details = self.ec2.describe_images(ImageIds=[current_ami])
                ami_creation_date = ami_details['Images'][0]['CreationDate']
                
                # Check for newer AMIs
                newer_amis = self.ec2.describe_images(
                    Owners=['amazon'],
                    Filters=[
                        {'Name': 'name', 'Values': ['amzn2-ami-hvm-*']},
                        {'Name': 'state', 'Values': ['available']},
                        {'Name': 'creation-date', 'Values': [f'{ami_creation_date}*']}
                    ]
                )
                
                if len(newer_amis['Images']) > 1:  # More than current AMI
                    latest_ami = max(newer_amis['Images'], key=lambda x: x['CreationDate'])
                    
                    upgrade_recommendations.append({
                        'instance_id': instance_id,
                        'current_ami': current_ami,
                        'recommended_ami': latest_ami['ImageId'],
                        'current_ami_date': ami_creation_date,
                        'recommended_ami_date': latest_ami['CreationDate'],
                        'instance_type': instance_type
                    })
        
        return upgrade_recommendations
    
    def check_rds_upgrades(self) -> List[Dict]:
        """Check for RDS engine upgrades"""
        
        instances = self.rds.describe_db_instances()
        upgrade_recommendations = []
        
        for instance in instances['DBInstances']:
            if 'eventchain' in instance['DBInstanceIdentifier']:
                db_id = instance['DBInstanceIdentifier']
                current_version = instance['EngineVersion']
                engine = instance['Engine']
                
                # Get available upgrades
                upgrades = self.rds.describe_db_engine_versions(
                    Engine=engine,
                    EngineVersion=current_version
                )
                
                valid_upgrades = upgrades['DBEngineVersions'][0].get('ValidUpgradeTarget', [])
                
                if valid_upgrades:
                    # Find the latest stable version
                    latest_version = max(
                        [v for v in valid_upgrades if not v.get('IsMajorVersionUpgrade', False)],
                        key=lambda x: x['EngineVersion'],
                        default=None
                    )
                    
                    if latest_version and latest_version['EngineVersion'] != current_version:
                        upgrade_recommendations.append({
                            'db_instance': db_id,
                            'current_version': current_version,
                            'recommended_version': latest_version['EngineVersion'],
                            'is_major_upgrade': latest_version.get('IsMajorVersionUpgrade', False),
                            'auto_upgrade_date': latest_version.get('AutoUpgradeDate')
                        })
        
        return upgrade_recommendations
    
    def check_kubernetes_upgrades(self) -> List[Dict]:
        """Check for Kubernetes cluster upgrades"""
        
        clusters = self.eks.list_clusters()
        upgrade_recommendations = []
        
        for cluster_name in clusters['clusters']:
            if 'eventchain' in cluster_name:
                cluster_info = self.eks.describe_cluster(name=cluster_name)
                current_version = cluster_info['cluster']['version']
                
                # Get available updates
                updates = self.eks.describe_update(
                    name=cluster_name,
                    updateId='latest'  # This would need to be implemented properly
                )
                
                # For now, check if version is older than 3 minor versions
                current_minor = int(current_version.split('.')[1])
                latest_supported = current_minor + 2  # Assuming 2 versions ahead is available
                
                if latest_supported > current_minor:
                    upgrade_recommendations.append({
                        'cluster_name': cluster_name,
                        'current_version': current_version,
                        'recommended_version': f"1.{latest_supported}",
                        'upgrade_type': 'minor'
                    })
        
        return upgrade_recommendations
    
    def generate_upgrade_plan(self) -> Dict:
        """Generate comprehensive upgrade plan"""
        
        plan = {
            'generated_at': datetime.now().isoformat(),
            'quarter': f"Q{((datetime.now().month - 1) // 3) + 1} {datetime.now().year}",
            'ami_upgrades': self.check_ami_updates(),
            'rds_upgrades': self.check_rds_upgrades(),
            'kubernetes_upgrades': self.check_kubernetes_upgrades(),
            'timeline': self.create_upgrade_timeline(),
            'risk_assessment': self.assess_upgrade_risks(),
            'rollback_plan': self.create_rollback_plan()
        }
        
        return plan
    
    def create_upgrade_timeline(self) -> List[Dict]:
        """Create upgrade timeline with dependencies"""
        
        timeline = [
            {
                'week': 1,
                'tasks': [
                    'Backup all critical data',
                    'Update staging environment',
                    'Run comprehensive tests'
                ]
            },
            {
                'week': 2,
                'tasks': [
                    'Upgrade non-critical services',
                    'Monitor performance',
                    'Update monitoring and alerting'
                ]
            },
            {
                'week': 3,
                'tasks': [
                    'Upgrade database (minor versions)',
                    'Upgrade Kubernetes cluster',
                    'Update application dependencies'
                ]
            },
            {
                'week': 4,
                'tasks': [
                    'Upgrade critical services',
                    'Performance optimization',
                    'Documentation updates'
                ]
            }
        ]
        
        return timeline
    
    def assess_upgrade_risks(self) -> Dict:
        """Assess risks associated with upgrades"""
        
        return {
            'high_risk': [
                'Major database version upgrades',
                'Kubernetes major version upgrades',
                'Breaking changes in dependencies'
            ],
            'medium_risk': [
                'Minor database version upgrades',
                'AMI updates with kernel changes',
                'Application framework updates'
            ],
            'low_risk': [
                'Security patches',
                'Minor dependency updates',
                'Configuration updates'
            ],
            'mitigation_strategies': [
                'Comprehensive testing in staging',
                'Gradual rollout with monitoring',
                'Immediate rollback capability',
                'Communication plan for stakeholders'
            ]
        }
    
    def create_rollback_plan(self) -> Dict:
        """Create rollback procedures for each upgrade type"""
        
        return {
            'database_rollback': {
                'method': 'Point-in-time recovery',
                'estimated_time': '30 minutes',
                'prerequisites': ['Recent backup verification', 'Maintenance window']
            },
            'application_rollback': {
                'method': 'Kubernetes deployment rollback',
                'estimated_time': '10 minutes',
                'prerequisites': ['Previous deployment available', 'Health checks passing']
            },
            'infrastructure_rollback': {
                'method': 'Terraform state rollback',
                'estimated_time': '45 minutes',
                'prerequisites': ['Previous Terraform state', 'Infrastructure backup']
            }
        }

# Usage
if __name__ == "__main__":
    planner = UpgradePlanner()
    upgrade_plan = planner.generate_upgrade_plan()
    
    # Save plan
    with open(f'/tmp/upgrade-plan-{datetime.now().strftime("%Y-Q%q")}.json', 'w') as f:
        json.dump(upgrade_plan, f, indent=2)
    
    print("Quarterly upgrade plan generated successfully")
```

## Maintenance Monitoring and Reporting

### Maintenance Dashboard
```python
# maintenance-dashboard.py
import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta
import json
import boto3

class MaintenanceDashboard:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket = 'eventchain-reports'
        
    def load_maintenance_reports(self, report_type: str, days: int = 30) -> pd.DataFrame:
        """Load maintenance reports from S3"""
        
        reports = []
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # List objects in S3
        response = self.s3.list_objects_v2(
            Bucket=self.bucket,
            Prefix=f'maintenance/{report_type}/'
        )
        
        for obj in response.get('Contents', []):
            # Parse date from filename
            filename = obj['Key'].split('/')[-1]
            date_str = filename.split('.')[0]
            
            try:
                report_date = datetime.strptime(date_str, '%Y%m%d')
                if start_date <= report_date <= end_date:
                    # Download and parse report
                    report_obj = self.s3.get_object(Bucket=self.bucket, Key=obj['Key'])
                    report_data = json.loads(report_obj['Body'].read())
                    report_data['date'] = report_date
                    reports.append(report_data)
            except ValueError:
                continue
        
        return pd.DataFrame(reports)
    
    def create_maintenance_overview(self):
        """Create maintenance overview dashboard"""
        
        st.title("EventChain Maintenance Dashboard")
        
        # Load data
        daily_reports = self.load_maintenance_reports('daily', 30)
        weekly_reports = self.load_maintenance_reports('weekly', 90)
        
        if not daily_reports.empty:
            # Maintenance completion rate
            col1, col2, col3, col4 = st.columns(4)
            
            with col1:
                success_rate = (daily_reports['errors'] == 0).mean() * 100
                st.metric("Success Rate", f"{success_rate:.1f}%")
            
            with col2:
                avg_duration = daily_reports['duration_minutes'].mean()
                st.metric("Avg Duration", f"{avg_duration:.0f} min")
            
            with col3:
                total_warnings = daily_reports['warnings'].sum()
                st.metric("Total Warnings", total_warnings)
            
            with col4:
                total_errors = daily_reports['errors'].sum()
                st.metric("Total Errors", total_errors)
            
            # Maintenance duration trend
            st.subheader("Maintenance Duration Trend")
            fig = px.line(daily_reports, x='date', y='duration_minutes',
                         title='Daily Maintenance Duration')
            st.plotly_chart(fig, use_container_width=True)
            
            # Error and warning trends
            st.subheader("Issues Trend")
            fig = go.Figure()
            fig.add_trace(go.Scatter(x=daily_reports['date'], y=daily_reports['warnings'],
                                   mode='lines+markers', name='Warnings'))
            fig.add_trace(go.Scatter(x=daily_reports['date'], y=daily_reports['errors'],
                                   mode='lines+markers', name='Errors'))
            fig.update_layout(title='Warnings and Errors Over Time')
            st.plotly_chart(fig, use_container_width=True)
            
            # Task completion status
            st.subheader("Task Completion Status")
            if 'tasks_completed' in daily_reports.columns:
                task_counts = {}
                for tasks_list in daily_reports['tasks_completed']:
                    for task in tasks_list:
                        task_counts[task] = task_counts.get(task, 0) + 1
                
                task_df = pd.DataFrame(list(task_counts.items()), 
                                     columns=['Task', 'Completion Count'])
                fig = px.bar(task_df, x='Task', y='Completion Count',
                           title='Task Completion Frequency')
                st.plotly_chart(fig, use_container_width=True)
        
        # Weekly maintenance summary
        if not weekly_reports.empty:
            st.subheader("Weekly Maintenance Summary")
            
            # Security updates
            if 'security_updates' in weekly_reports.columns:
                fig = px.bar(weekly_reports, x='date', y='security_updates',
                           title='Security Updates Applied Weekly')
                st.plotly_chart(fig, use_container_width=True)
            
            # Performance improvements
            if 'performance_improvements' in weekly_reports.columns:
                improvements = weekly_reports['performance_improvements'].sum()
                st.metric("Performance Improvements", improvements)
    
    def create_maintenance_calendar(self):
        """Create maintenance calendar view"""
        
        st.subheader("Maintenance Calendar")
        
        # Create calendar data
        today = datetime.now()
        calendar_data = []
        
        # Next 30 days
        for i in range(30):
            date = today + timedelta(days=i)
            maintenance_type = []
            
            # Daily maintenance (every day)
            maintenance_type.append("Daily")
            
            # Weekly maintenance (Sundays)
            if date.weekday() == 6:  # Sunday
                maintenance_type.append("Weekly")
            
            # Monthly maintenance (first Sunday of month)
            if date.weekday() == 6 and date.day <= 7:
                maintenance_type.append("Monthly")
            
            # Quarterly maintenance (manually scheduled)
            if date.month in [3, 6, 9, 12] and date.day == 1:
                maintenance_type.append("Quarterly")
            
            calendar_data.append({
                'date': date,
                'maintenance_types': ', '.join(maintenance_type),
                'day_of_week': date.strftime('%A')
            })
        
        calendar_df = pd.DataFrame(calendar_data)
        st.dataframe(calendar_df, use_container_width=True)
    
    def create_maintenance_alerts(self):
        """Create maintenance alerts and notifications"""
        
        st.subheader("Maintenance Alerts")
        
        # Load recent reports to check for issues
        daily_reports = self.load_maintenance_reports('daily', 7)
        
        if not daily_reports.empty:
            # Check for recent errors
            recent_errors = daily_reports[daily_reports['errors'] > 0]
            if not recent_errors.empty:
                st.error(f"⚠️ {len(recent_errors)} maintenance sessions had errors in the last 7 days")
                st.dataframe(recent_errors[['date', 'errors', 'warnings']])
            
            # Check for increasing duration
            if len(daily_reports) >= 7:
                recent_avg = daily_reports.tail(3)['duration_minutes'].mean()
                older_avg = daily_reports.head(4)['duration_minutes'].mean()
                
                if recent_avg > older_avg * 1.5:
                    st.warning(f"⚠️ Maintenance duration increasing: {recent_avg:.0f} min vs {older_avg:.0f} min")
            
            # Check for high warning count
            high_warning_days = daily_reports[daily_reports['warnings'] > 5]
            if not high_warning_days.empty:
                st.warning(f"⚠️ {len(high_warning_days)} days with high warning count (>5)")

# Streamlit app
if __name__ == "__main__":
    dashboard = MaintenanceDashboard()
    
    # Sidebar navigation
    page = st.sidebar.selectbox("Choose a page", 
                               ["Overview", "Calendar", "Alerts"])
    
    if page == "Overview":
        dashboard.create_maintenance_overview()
    elif page == "Calendar":
        dashboard.create_maintenance_calendar()
    elif page == "Alerts":
        dashboard.create_maintenance_alerts()
```

## Emergency Maintenance Procedures

### Emergency Maintenance Checklist
```markdown
# Emergency Maintenance Checklist

## Pre-Emergency Maintenance
- [ ] Assess severity and impact
- [ ] Notify stakeholders (if time permits)
- [ ] Create incident ticket
- [ ] Assemble emergency response team
- [ ] Prepare rollback plan

## During Emergency Maintenance
- [ ] Document all actions taken
- [ ] Monitor system health continuously
- [ ] Communicate progress to stakeholders
- [ ] Test fixes thoroughly
- [ ] Verify system stability

## Post-Emergency Maintenance
- [ ] Update status page
- [ ] Notify stakeholders of resolution
- [ ] Document lessons learned
- [ ] Schedule post-incident review
- [ ] Update procedures if needed
```

### Emergency Maintenance Script
```bash
#!/bin/bash
# emergency-maintenance.sh

EMERGENCY_TYPE=$1
INCIDENT_ID=$2

if [ -z "$EMERGENCY_TYPE" ] || [ -z "$INCIDENT_ID" ]; then
    echo "Usage: $0 <emergency_type> <incident_id>"
    echo "Emergency types: database, application, security, infrastructure"
    exit 1
fi

EMERGENCY_LOG="/var/log/eventchain/emergency-${INCIDENT_ID}-$(date +%Y%m%d_%H%M%S).log"

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $EMERGENCY_LOG
}

# Send emergency notification
send_emergency_alert() {
    local message=$1
    
    # PagerDuty
    curl -X POST "https://api.pagerduty.com/incidents" \
        -H "Authorization: Token token=$PAGERDUTY_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"incident\": {
                \"type\": \"incident\",
                \"title\": \"Emergency Maintenance: $EMERGENCY_TYPE\",
                \"service\": {
                    \"id\": \"$PAGERDUTY_SERVICE_ID\",
                    \"type\": \"service_reference\"
                },
                \"urgency\": \"high\",
                \"body\": {
                    \"type\": \"incident_body\",
                    \"details\": \"$message\"
                }
            }
        }"
    
    # Slack
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 EMERGENCY MAINTENANCE: $message\"}"
}

log_message "Starting emergency maintenance: $EMERGENCY_TYPE (Incident: $INCIDENT_ID)"
send_emergency_alert "Emergency maintenance started for $EMERGENCY_TYPE"

case $EMERGENCY_TYPE in
    "database")
        log_message "Database emergency maintenance"
        
        # Stop application to prevent data corruption
        kubectl scale deployment eventchain-backend --replicas=0
        
        # Create emergency backup
        pg_dump $DATABASE_URL > "/tmp/emergency-backup-${INCIDENT_ID}.sql"
        
        # Apply emergency fixes (example)
        psql $DATABASE_URL -c "
            -- Kill long-running queries
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';
            
            -- Emergency vacuum
            VACUUM ANALYZE;
        "
        
        # Restart application
        kubectl scale deployment eventchain-backend --replicas=3
        ;;
        
    "application")
        log_message "Application emergency maintenance"
        
        # Rollback to previous version
        kubectl rollout undo deployment/eventchain-backend
        kubectl rollout status deployment/eventchain-backend --timeout=300s
        
        # Clear problematic cache
        redis-cli FLUSHALL
        ;;
        
    "security")
        log_message "Security emergency maintenance"
        
        # Block suspicious IPs
        if [ -f "/tmp/suspicious-ips.txt" ]; then
            while read ip; do
                iptables -A INPUT -s $ip -j DROP
            done < /tmp/suspicious-ips.txt
        fi
        
        # Rotate API keys
        ./rotate-api-keys.sh emergency
        
        # Enable enhanced security mode
        kubectl set env deployment/eventchain-backend SECURITY_MODE=enhanced
        ;;
        
    "infrastructure")
        log_message "Infrastructure emergency maintenance"
        
        # Scale up critical services
        kubectl scale deployment eventchain-backend --replicas=5
        
        # Enable circuit breakers
        kubectl set env deployment/eventchain-backend CIRCUIT_BREAKER_ENABLED=true
        ;;
esac

# Verify system health
log_message "Verifying system health..."
sleep 30

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://api.eventchain.com/health)
if [ "$HEALTH_CHECK" = "200" ]; then
    log_message "System health check passed"
    send_emergency_alert "Emergency maintenance completed successfully"
else
    log_message "ERROR: System health check failed (HTTP $HEALTH_CHECK)"
    send_emergency_alert "Emergency maintenance completed but health check failed"
fi

log_message "Emergency maintenance completed: $EMERGENCY_TYPE (Incident: $INCIDENT_ID)"

# Upload emergency log
aws s3 cp $EMERGENCY_LOG "s3://eventchain-reports/emergency/$(basename $EMERGENCY_LOG)"

exit 0
```

This comprehensive maintenance procedures document ensures EventChain operates at peak performance with minimal downtime, proactive issue prevention, and systematic approach to system health management.