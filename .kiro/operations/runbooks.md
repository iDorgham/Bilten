# Operations Runbooks

This document contains operational procedures and runbooks for managing the EventChain platform.

## Emergency Response

### Incident Response Process

#### Severity Levels
- **P0 (Critical)**: Complete service outage, data loss, security breach
- **P1 (High)**: Major feature unavailable, significant performance degradation
- **P2 (Medium)**: Minor feature issues, moderate performance impact
- **P3 (Low)**: Cosmetic issues, minimal user impact

#### Response Times
- **P0**: Immediate response (< 15 minutes)
- **P1**: 1 hour response
- **P2**: 4 hour response
- **P3**: Next business day

#### Escalation Chain
1. On-call engineer
2. Team lead
3. Engineering manager
4. CTO

### Service Outage Response

#### Immediate Actions (First 15 minutes)
1. **Acknowledge the incident**
   - Update status page
   - Notify stakeholders
   - Create incident channel

2. **Assess impact**
   - Check monitoring dashboards
   - Identify affected services
   - Estimate user impact

3. **Initial mitigation**
   - Apply immediate fixes if known
   - Scale resources if needed
   - Implement circuit breakers

#### Investigation Phase
1. **Gather information**
   - Check logs and metrics
   - Review recent deployments
   - Identify root cause

2. **Implement fix**
   - Deploy hotfix if available
   - Rollback if necessary
   - Monitor recovery

3. **Communicate updates**
   - Update status page
   - Notify stakeholders
   - Provide ETAs

#### Post-incident
1. **Service restoration**
   - Verify full functionality
   - Monitor for stability
   - Update status page

2. **Post-mortem**
   - Schedule within 48 hours
   - Document timeline
   - Identify action items

## Service Management

### Deployment Procedures

#### Production Deployment Checklist
- [ ] Code review completed
- [ ] All tests passing
- [ ] Security scan completed
- [ ] Database migrations tested
- [ ] Rollback plan prepared
- [ ] Monitoring alerts configured
- [ ] Stakeholders notified

#### Deployment Steps
1. **Pre-deployment**
```bash
# Verify staging environment
kubectl get pods -n staging
curl -f https://staging.eventchain.com/health

# Check database migrations
npm run db:migrate:dry-run
```

2. **Deployment**
```bash
# Deploy to production
kubectl apply -f k8s/production/
kubectl rollout status deployment/api-gateway
kubectl rollout status deployment/event-service
```

3. **Post-deployment verification**
```bash
# Health checks
curl -f https://api.eventchain.com/health
curl -f https://eventchain.com/health

# Smoke tests
npm run test:smoke:production
```

#### Rollback Procedure
```bash
# Quick rollback
kubectl rollout undo deployment/api-gateway
kubectl rollout undo deployment/event-service

# Verify rollback
kubectl rollout status deployment/api-gateway
```

### Database Operations

#### Backup Procedures
```bash
# Daily automated backup
pg_dump -h $DB_HOST -U $DB_USER eventchain_prod > backup_$(date +%Y%m%d).sql

# Verify backup integrity
pg_restore --list backup_$(date +%Y%m%d).sql
```

#### Migration Management
```bash
# Run migrations
npm run db:migrate

# Rollback migration
npm run db:migrate:rollback

# Check migration status
npm run db:migrate:status
```

#### Performance Monitoring
- Monitor slow queries (> 1 second)
- Check connection pool usage
- Monitor disk space usage
- Review index usage statistics

### Monitoring and Alerting

#### Key Metrics to Monitor
- **Application Performance**
  - Response time (95th percentile < 500ms)
  - Error rate (< 0.1%)
  - Throughput (requests per second)

- **Infrastructure**
  - CPU usage (< 80%)
  - Memory usage (< 85%)
  - Disk usage (< 80%)
  - Network latency

- **Business Metrics**
  - Order completion rate
  - Payment success rate
  - User registration rate

#### Alert Configuration
```yaml
# Example Prometheus alert rules
groups:
  - name: eventchain.rules
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected
```

## Security Operations

### Security Incident Response

#### Immediate Actions
1. **Contain the threat**
   - Isolate affected systems
   - Block malicious IPs
   - Disable compromised accounts

2. **Assess impact**
   - Check for data breach
   - Identify affected users
   - Review access logs

3. **Notify stakeholders**
   - Security team
   - Legal team
   - Affected customers

#### Security Monitoring
- Failed login attempts
- Unusual API usage patterns
- Database access anomalies
- File system changes

### SSL Certificate Management
```bash
# Check certificate expiration
openssl x509 -in certificate.crt -text -noout | grep "Not After"

# Renew Let's Encrypt certificates
certbot renew --dry-run
```

## Capacity Management

### Scaling Procedures

#### Horizontal Scaling
```bash
# Scale API gateway
kubectl scale deployment api-gateway --replicas=5

# Scale event service
kubectl scale deployment event-service --replicas=3
```

#### Vertical Scaling
```yaml
# Update resource limits
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "1Gi"
    cpu: "1000m"
```

#### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling optimization
- Query optimization
- Partitioning for large tables

### Performance Optimization

#### Application Level
- Enable caching (Redis)
- Optimize database queries
- Implement CDN for static assets
- Use compression for API responses

#### Infrastructure Level
- Load balancer configuration
- Auto-scaling policies
- Resource allocation optimization
- Network optimization

## Backup and Recovery

### Backup Strategy
- **Database**: Daily full backup, hourly incremental
- **File storage**: Daily backup to S3
- **Configuration**: Version controlled in Git
- **Secrets**: Encrypted backup in secure storage

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
pg_restore -h $DB_HOST -U $DB_USER -d eventchain_prod backup_20240101.sql

# Point-in-time recovery
pg_basebackup -h $DB_HOST -D /var/lib/postgresql/backup
```

#### Application Recovery
```bash
# Restore from container registry
docker pull eventchain/api-gateway:v1.2.0
kubectl set image deployment/api-gateway api-gateway=eventchain/api-gateway:v1.2.0
```

### Disaster Recovery
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Backup retention**: 30 days
- **Geographic redundancy**: Multi-region setup

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Check system health dashboards
- Review error logs
- Monitor backup completion
- Verify SSL certificate status

#### Weekly
- Review performance metrics
- Update security patches
- Clean up old logs
- Review capacity utilization

#### Monthly
- Security vulnerability scan
- Dependency updates
- Performance optimization review
- Disaster recovery testing

### Scheduled Maintenance
- **Maintenance window**: Sunday 2:00-4:00 AM UTC
- **Notification**: 48 hours advance notice
- **Rollback plan**: Always prepared
- **Communication**: Status page updates

## Contact Information

### On-call Rotation
- **Primary**: Current on-call engineer
- **Secondary**: Backup engineer
- **Escalation**: Team lead

### Emergency Contacts
- **Operations Team**: ops@eventchain.com
- **Security Team**: security@eventchain.com
- **Management**: management@eventchain.com

### External Vendors
- **Cloud Provider**: AWS Support
- **CDN Provider**: CloudFlare Support
- **Monitoring**: DataDog Support
- **Payment Processor**: Stripe Support

## Documentation Updates

This runbook should be updated:
- After each incident
- When procedures change
- During quarterly reviews
- When new services are added

Last updated: [Current Date]
Next review: [Quarterly Review Date]