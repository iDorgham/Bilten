# Development Tools

This directory contains all development tools, utilities, and scripts for the Bilten platform.

## Directory Structure

### `scripts/`
Development and deployment scripts
- Build scripts
- Deployment scripts
- Database scripts
- Utility scripts

### `utilities/`
Standalone utility tools
- Code generators
- Data migration tools
- Configuration utilities
- Helper functions

### `mcp-workflows/`
Model Context Protocol workflows
- Automated testing workflows
- Payment testing workflows
- Performance testing workflows
- Monitoring workflows
- Health check workflows

## Usage

### Scripts
```bash
# Run development scripts
node tools/scripts/[script-name].js

# Run utility tools
node tools/utilities/[utility-name].js

# Run MCP workflows
node tools/mcp-workflows/[workflow-name].js
```

### Common Workflows
- **Testing**: `npm run test:e2e`
- **Payment Testing**: `npm run test:payment`
- **Performance Testing**: `npm run test:performance`
- **Monitoring**: `npm run monitor`
- **Health Checks**: `npm run health`

## Adding New Tools

1. Place scripts in `scripts/`
2. Place utilities in `utilities/`
3. Place MCP workflows in `mcp-workflows/`
4. Update this README with documentation
5. Add npm scripts to root `package.json` if needed

## Tool Categories

### Development
- Code generation
- Database migrations
- Testing automation
- Build optimization

### Operations
- Deployment automation
- Monitoring setup
- Health checks
- Performance testing

### Utilities
- Data processing
- Configuration management
- File operations
- API testing
