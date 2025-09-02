# MCP Development Workflow Guide

## 🚀 Quick Start

### Available MCP Tools
- **Filesystem**: File operations and management
- **Git**: Version control automation
- **Playwright**: Browser testing and automation
- **Docker**: Container management
- **Azure**: Cloud infrastructure management
- **Stripe**: Payment flow testing
- **Web Search**: Research and content extraction
- **JavaScript**: Sandboxed code execution

### Key Workflows

#### 1. Automated Testing
```bash
# Run comprehensive test suite
node tools/mcp-workflows/automated-testing.js
```

#### 2. Database Health Check
```javascript
// Monitor PostgreSQL, Redis, ClickHouse
await azure_database_query({ database: 'bilten-postgres' });
await azure_monitor_logs({ resource: 'bilten-redis' });
```

#### 3. Payment Flow Testing
```javascript
// Test Stripe integration
await stripe_customer_create({ name: 'Test User' });
await stripe_payment_create({ amount: 5000 });
```

#### 4. Frontend E2E Testing
```javascript
// Test with Playwright
await playwright_navigate({ url: 'http://localhost:3000' });
await playwright_screenshot({ path: './test-results.png' });
```

### Configuration
- Enhanced config: `.kiro/settings/mcp-enhanced.json`
- Environment variables for Azure, Stripe, Docker
- Automated workflows for testing, deployment, monitoring

### Best Practices
- Run tests before deployment
- Monitor database health regularly
- Test payment flows with Stripe
- Use Playwright for E2E testing
- Monitor performance metrics

---

**Version**: 1.0 | **Last Updated**: December 2024
