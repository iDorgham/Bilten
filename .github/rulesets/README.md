# 🛡️ GitHub Rulesets for Bilten

This directory contains GitHub Rulesets that enforce security, quality, and deployment policies for the Bilten event management platform.

## 📋 Overview

GitHub Rulesets provide a centralized way to manage repository rules and policies. They help ensure code quality, security, and compliance across the project.

## 🎯 Rulesets

### 1. Security Ruleset (`security-ruleset.json`)
**Target**: Main branches (main, master, develop, release/*)
**Purpose**: Enforce security policies and prevent vulnerabilities

**Key Features**:
- 🔍 Secret scanning and push protection
- 📦 Dependency review
- 🔒 Code scanning with CodeQL
- ✅ Required security workflows
- 👥 Mandatory code reviews (2 approvals)
- 🔐 Required commit signatures
- 📝 Linear history requirement

### 2. Quality Ruleset (`quality-ruleset.json`)
**Target**: All branches except hotfix and docs
**Purpose**: Ensure code quality and maintainability

**Key Features**:
- 🧪 Required CI/CD workflows
- ✅ Status checks (Build, Tests, Lint, Type Check, Coverage)
- 👥 Code reviews (1 approval)
- 💬 Conversation resolution
- 🚀 Staging deployment requirement

### 3. Production Ruleset (`production-ruleset.json`)
**Target**: Main branches only (main, master)
**Purpose**: Strict production deployment controls

**Key Features**:
- 🚀 Production deployment workflows
- 🔒 Security audit requirements
- ⚡ Performance and E2E tests
- 👥 Strict code reviews (3 approvals)
- 🔐 Required signatures
- 📝 Linear history
- 💬 Conversation resolution
- 🛡️ Backup verification

### 4. Development Ruleset (`development-ruleset.json`)
**Target**: Development branches (develop, feature/*, hotfix/*)
**Purpose**: Streamlined development workflow

**Key Features**:
- 🧪 Basic CI/CD workflows
- ✅ Essential status checks
- 👥 Light code reviews (1 approval)
- 🚀 Development deployment

## 🔧 Configuration

### Enforcement Levels
- **Active**: Rules are enforced and block non-compliant changes
- **Evaluate**: Rules are evaluated but don't block changes (for testing)

### Bypass Actors
Rulesets can be bypassed by:
- **Integration**: Automated systems (CI/CD)
- **User**: Specific users with bypass permissions
- **Never**: No bypass allowed (production rules)

### Conditions
Rulesets apply based on:
- **Branch patterns**: Which branches the rules apply to
- **Repository names**: Which repositories are affected
- **File paths**: Specific files or directories

## 🚀 Implementation

### 1. Enable Rulesets
```bash
# Using GitHub CLI
gh api repos/:owner/:repo/rulesets \
  --method POST \
  --field name="Bilten Security Ruleset" \
  --field enforcement=active \
  --field target=branch \
  --field rules='[{"type":"secret_scanning","state":"enabled"}]'
```

### 2. Apply to Branches
```bash
# Apply security ruleset to main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Security Scan"]}' \
  --field enforce_admins=true
```

### 3. Configure Workflows
Ensure the required workflows exist:
- `.github/workflows/security-scan.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/test.yml`
- `.github/workflows/lint.yml`
- `.github/workflows/deploy-production.yml`

## 📊 Monitoring

### Ruleset Status
Monitor ruleset compliance through:
- GitHub repository insights
- Pull request status checks
- Security tab alerts
- Dependabot notifications

### Metrics
Track key metrics:
- Ruleset bypass frequency
- Failed status checks
- Security scan results
- Code review turnaround time

## 🔄 Maintenance

### Regular Updates
- Review and update ruleset configurations monthly
- Adjust enforcement levels based on team feedback
- Update bypass permissions as needed
- Monitor and optimize workflow performance

### Troubleshooting
Common issues and solutions:

#### Ruleset Not Applied
```bash
# Check ruleset status
gh api repos/:owner/:repo/rulesets

# Verify branch protection
gh api repos/:owner/:repo/branches/main/protection
```

#### Workflow Failures
```bash
# Check workflow runs
gh run list --workflow=security-scan.yml

# View workflow logs
gh run view <run-id> --log
```

#### Bypass Issues
```bash
# Check bypass permissions
gh api repos/:owner/:repo/rulesets/:ruleset-id/bypass_actors
```

## 📚 Resources

- [GitHub Rulesets Documentation](https://docs.github.com/en/rest/repos/rules)
- [Branch Protection API](https://docs.github.com/en/rest/branches/branch-protection)
- [Security Best Practices](https://docs.github.com/en/code-security)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

## 🤝 Contributing

When updating rulesets:
1. Test changes in a development environment
2. Update this documentation
3. Notify the team of changes
4. Monitor for any issues after deployment

## 📞 Support

For questions or issues with rulesets:
1. Check the [Common Issues](Common-Issues) wiki page
2. Review GitHub documentation
3. Create an issue with detailed information
4. Contact the development team

---

**Note**: These rulesets are designed to balance security, quality, and development velocity. Adjust configurations based on your team's needs and project requirements.
