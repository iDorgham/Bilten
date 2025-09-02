# MCP Development Workflow Guide

## 📋 Overview

This guide explains how to use Model Context Protocol (MCP) tools to enhance your Bilten development workflow. MCP provides powerful automation capabilities for testing, deployment, monitoring, and development tasks.

## 🛠️ Available MCP Tools

### Core Development Tools

#### 1. **Filesystem Operations**
```bash
# File and directory management
- read_file: Read file contents
- list_directory: List directory contents
- write_file: Create or update files
- delete_file: Remove files
```

#### 2. **Git Version Control**
```bash
# Automated version control
- git_status: Check repository status
- git_log: View commit history
- git_commit: Create commits
- git_push: Push changes
- git_pull: Pull updates
```

#### 3. **Playwright Testing**
```bash
# Automated browser testing
- playwright_screenshot: Capture screenshots
- playwright_navigate: Navigate to URLs
- playwright_evaluate: Execute JavaScript
- playwright_console_logs: Get console logs
```

### Infrastructure & Cloud Tools

#### 4. **Docker Containerization**
```bash
# Container management
- docker_ps: List running containers
- docker_logs: View container logs
- docker_exec: Execute commands in containers
- docker_build: Build container images
```

#### 5. **Azure Cloud Services**
```bash
# Azure resource management
- azure_resource_list: List Azure resources
- azure_database_query: Query databases
- azure_monitor_logs: View monitoring logs
- azure_storage_operations: Manage storage
```

#### 6. **Stripe Payment Processing**
```bash
# Payment flow testing
- stripe_customer_create: Create test customers
- stripe_payment_create: Process test payments
- stripe_webhook_test: Test webhook handling
- stripe_subscription_manage: Manage subscriptions
```

### Utility Tools

#### 7. **Web Search & Content**
```bash
# Research and content tools
- web_search: Search the web
- content_extract: Extract content from URLs
- tavily_search: Advanced web search
- tavily_extract: Extract web content
```

#### 8. **JavaScript Execution**
```bash
# Sandboxed code execution
- run_js_ephemeral: Execute JavaScript code
- run_js: Run JavaScript in sandbox
- search_npm_packages: Search npm packages
- get_dependency_types: Get package types
```

## 🚀 Workflow Examples

### 1. **Automated Testing Workflow**

```javascript
// Example: Run comprehensive test suite
const workflow = require('./tools/mcp-workflows/automated-testing.js');

// This will:
// 1. Test backend API endpoints
// 2. Test frontend UI components
// 3. Test gateway integration
// 4. Test payment flows with Stripe
// 5. Check database health
// 6. Run performance tests
workflow.runFullTestSuite();
```

### 2. **Database Health Monitoring**

```javascript
// Example: Monitor database health using Azure tools
async function monitorDatabaseHealth() {
  // Check PostgreSQL health
  const postgresHealth = await azure_database_query({
    database: 'bilten-postgres',
    query: 'SELECT version();'
  });
  
  // Check Redis health
  const redisHealth = await azure_monitor_logs({
    resource: 'bilten-redis',
    query: 'RedisMetrics | where MetricName == "connected_clients"'
  });
  
  // Check ClickHouse analytics
  const clickhouseHealth = await azure_database_query({
    database: 'bilten-clickhouse',
    query: 'SELECT count() FROM system.tables;'
  });
  
  return { postgresHealth, redisHealth, clickhouseHealth };
}
```

### 3. **Payment Flow Testing**

```javascript
// Example: Test Stripe payment integration
async function testPaymentFlow() {
  // Create test customer
  const customer = await stripe_customer_create({
    name: 'Test Customer',
    email: 'test@example.com'
  });
  
  // Create test product
  const product = await stripe_product_create({
    name: 'Test Event Ticket',
    description: 'Test ticket for automated testing'
  });
  
  // Create test price
  const price = await stripe_price_create({
    product: product.id,
    unit_amount: 5000, // $50.00
    currency: 'usd'
  });
  
  // Process test payment
  const payment = await stripe_payment_create({
    customer: customer.id,
    price: price.id,
    quantity: 1
  });
  
  return { customer, product, price, payment };
}
```

### 4. **Frontend E2E Testing**

```javascript
// Example: Test frontend with Playwright
async function testFrontendE2E() {
  // Navigate to application
  await playwright_navigate({
    url: 'http://localhost:3000'
  });
  
  // Test event creation flow
  await playwright_evaluate({
    code: `
      // Fill event creation form
      document.querySelector('[data-testid="event-title"]').value = 'Test Event';
      document.querySelector('[data-testid="event-date"]').value = '2024-12-25';
      document.querySelector('[data-testid="create-event-btn"]').click();
    `
  });
  
  // Capture screenshot
  await playwright_screenshot({
    path: './test-results/event-creation.png'
  });
  
  // Check for success message
  const successMessage = await playwright_evaluate({
    code: 'document.querySelector(".success-message")?.textContent'
  });
  
  return successMessage;
}
```

### 5. **Automated Deployment**

```javascript
// Example: Automated deployment workflow
async function deployBilten() {
  // 1. Run tests
  await runTests();
  
  // 2. Build applications
  await buildApplications();
  
  // 3. Build Docker images
  await docker_build({
    context: './apps/bilten-backend',
    tag: 'bilten-backend:latest'
  });
  
  // 4. Deploy to Azure
  await azure_deploy({
    resourceGroup: 'bilten-prod',
    template: './infrastructure/azure-deploy.json'
  });
  
  // 5. Health check
  await healthCheck();
  
  // 6. Send notification
  await sendNotification({
    message: 'Bilten deployment completed successfully'
  });
}
```

## 📊 Monitoring & Analytics

### 1. **Performance Monitoring**

```javascript
// Monitor application performance
async function monitorPerformance() {
  // API response times
  const apiMetrics = await azure_monitor_logs({
    query: 'AppMetrics | where MetricName == "response_time" | summarize avg(Value)'
  });
  
  // Database performance
  const dbMetrics = await azure_monitor_logs({
    query: 'DatabaseMetrics | where MetricName == "query_duration" | summarize avg(Value)'
  });
  
  // Frontend performance
  const frontendMetrics = await azure_monitor_logs({
    query: 'FrontendMetrics | where MetricName == "page_load_time" | summarize avg(Value)'
  });
  
  return { apiMetrics, dbMetrics, frontendMetrics };
}
```

### 2. **Error Tracking**

```javascript
// Track and analyze errors
async function trackErrors() {
  const errors = await azure_monitor_logs({
    query: 'AppLogs | where Level == "Error" | summarize count() by bin(TimeGenerated, 1h)'
  });
  
  return errors;
}
```

## 🔧 Configuration

### MCP Configuration File

The enhanced MCP configuration is located at `.kiro/settings/mcp-enhanced.json`. This file includes:

- **Server configurations** for all available tools
- **Workflow configurations** for each Bilten service
- **Automation rules** for common tasks

### Environment Variables

```bash
# Required environment variables
FASTMCP_LOG_LEVEL=ERROR
AZURE_SUBSCRIPTION_ID=your-subscription-id
STRIPE_SECRET_KEY=your-stripe-secret-key
DOCKER_HOST=your-docker-host
```

## 📈 Best Practices

### 1. **Automated Testing**
- Run tests before every deployment
- Use Playwright for E2E testing
- Test payment flows with Stripe
- Monitor test coverage

### 2. **Database Management**
- Regular health checks
- Automated backups
- Performance monitoring
- Migration testing

### 3. **Deployment Automation**
- Automated builds
- Health checks after deployment
- Rollback procedures
- Performance monitoring

### 4. **Monitoring & Alerting**
- Real-time performance monitoring
- Error tracking and alerting
- Resource usage monitoring
- User experience metrics

## 🚨 Troubleshooting

### Common Issues

1. **MCP Server Connection Issues**
   ```bash
   # Check server status
   mcp_server_status
   
   # Restart servers
   mcp_server_restart
   ```

2. **Docker Container Issues**
   ```bash
   # Check container status
   docker_ps
   
   # View container logs
   docker_logs --container bilten-backend
   ```

3. **Azure Resource Issues**
   ```bash
   # Check resource health
   azure_resource_health --resource bilten-postgres
   
   # View monitoring logs
   azure_monitor_logs --resource bilten-postgres
   ```

## 📚 Additional Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Playwright Documentation](https://playwright.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🤝 Contributing

To add new MCP workflows:

1. Create new workflow file in `tools/mcp-workflows/`
2. Update configuration in `.kiro/settings/mcp-enhanced.json`
3. Add documentation to this guide
4. Test the workflow thoroughly
5. Submit pull request

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Maintained by**: Bilten Development Team
