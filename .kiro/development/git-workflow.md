# Git Workflow Guide

This document outlines the Git workflow and branching strategy for the EventChain project.

## Branching Strategy

We use a modified Git Flow strategy with the following branch types:

### Main Branches
- **main** - Production-ready code, always deployable
- **develop** - Integration branch for features, staging environment

### Supporting Branches
- **feature/** - New features and enhancements
- **bugfix/** - Bug fixes for develop branch
- **hotfix/** - Critical fixes for production
- **release/** - Prepare releases, final testing

## Branch Naming Conventions

### Feature Branches
```
feature/ticket-booking-system
feature/user-authentication
feature/payment-integration
```

### Bug Fix Branches
```
bugfix/login-validation-error
bugfix/payment-timeout-issue
bugfix/event-date-display
```

### Hotfix Branches
```
hotfix/security-vulnerability-fix
hotfix/payment-gateway-outage
hotfix/critical-data-corruption
```

### Release Branches
```
release/v1.2.0
release/v1.3.0-beta
```

## Workflow Process

### Starting New Work

1. **Update local main branch**
```bash
git checkout main
git pull origin main
```

2. **Create feature branch from main**
```bash
git checkout -b feature/your-feature-name
```

3. **Work on your feature**
```bash
# Make changes
git add .
git commit -m "feat: add user authentication system"
```

### Commit Message Format

We follow Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

#### Examples
```bash
git commit -m "feat(auth): add JWT token validation"
git commit -m "fix(payment): resolve timeout issue in payment processing"
git commit -m "docs: update API documentation for events endpoint"
git commit -m "test(orders): add integration tests for order creation"
```

### Pull Request Process

1. **Push feature branch**
```bash
git push origin feature/your-feature-name
```

2. **Create Pull Request**
- Use descriptive title and description
- Link related issues
- Add reviewers
- Ensure CI checks pass

3. **PR Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Code Review Guidelines

#### For Authors
- Keep PRs small and focused
- Write clear commit messages
- Add tests for new functionality
- Update documentation
- Respond to feedback promptly

#### For Reviewers
- Review within 24 hours
- Be constructive and specific
- Check for security issues
- Verify tests are adequate
- Approve when ready

### Merging Strategy

#### Feature Branches
- Use "Squash and merge" for clean history
- Delete branch after merging
- Ensure CI passes before merging

#### Release Process
1. Create release branch from develop
2. Final testing and bug fixes
3. Update version numbers
4. Merge to main and develop
5. Tag release
6. Deploy to production

## Branch Protection Rules

### Main Branch
- Require pull request reviews (2 reviewers)
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main
- Require signed commits

### Develop Branch
- Require pull request reviews (1 reviewer)
- Require status checks to pass
- Allow force pushes by admins only

## Hotfix Process

For critical production issues:

1. **Create hotfix branch from main**
```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue-description
```

2. **Fix the issue**
```bash
# Make minimal changes to fix the issue
git add .
git commit -m "hotfix: resolve critical payment gateway issue"
```

3. **Test thoroughly**
- Run all relevant tests
- Manual testing in staging
- Security review if applicable

4. **Merge to main and develop**
```bash
# Merge to main
git checkout main
git merge hotfix/critical-issue-description
git tag -a v1.2.1 -m "Hotfix release v1.2.1"

# Merge to develop
git checkout develop
git merge hotfix/critical-issue-description
```

5. **Deploy immediately**

## Release Management

### Version Numbering
We use Semantic Versioning (SemVer):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Schedule
- **Major releases**: Quarterly
- **Minor releases**: Monthly
- **Patch releases**: As needed
- **Hotfixes**: Immediate for critical issues

### Release Checklist
- [ ] All features tested
- [ ] Documentation updated
- [ ] Migration scripts ready
- [ ] Deployment scripts updated
- [ ] Rollback plan prepared
- [ ] Stakeholders notified

## Git Hooks

### Pre-commit Hooks
- Code formatting (Prettier)
- Linting (ESLint)
- Type checking (TypeScript)
- Test execution (Jest)

### Pre-push Hooks
- Full test suite
- Build verification
- Security scanning

## Best Practices

### Commit Practices
- Make atomic commits
- Write descriptive commit messages
- Commit frequently
- Don't commit broken code
- Use interactive rebase to clean history

### Branch Management
- Keep branches short-lived
- Delete merged branches
- Regularly sync with main
- Use descriptive branch names

### Collaboration
- Communicate changes early
- Review code thoroughly
- Resolve conflicts promptly
- Keep team informed

## Troubleshooting

### Common Issues

**Merge Conflicts**
```bash
# Update your branch with latest main
git checkout feature/your-branch
git rebase main

# Resolve conflicts manually
# Then continue rebase
git rebase --continue
```

**Accidental Commits to Main**
```bash
# Move commits to feature branch
git branch feature/accidental-commits
git reset --hard HEAD~n  # n = number of commits to undo
git checkout feature/accidental-commits
```

**Lost Commits**
```bash
# Find lost commits
git reflog

# Recover commit
git cherry-pick <commit-hash>
```

## Tools and Integration

### Git Clients
- Command line (recommended)
- VS Code Git integration
- GitHub Desktop
- SourceTree

### CI/CD Integration
- GitHub Actions for automated testing
- Automated deployment on merge to main
- Branch protection enforcement
- Status checks integration

### Monitoring
- Branch age monitoring
- PR review time tracking
- Merge frequency metrics
- Code quality trends