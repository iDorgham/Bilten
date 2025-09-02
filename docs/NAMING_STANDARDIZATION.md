# File Naming Standardization Plan

## 📋 Current Issues Identified

### Inconsistent Naming Patterns
- **UPPERCASE files**: `CLEANUP_SUMMARY.md`, `PROJECT_STATUS.md`, `DOCUMENTATION_AUDIT.md`
- **Mixed case**: `MCP_DEVELOPMENT_WORKFLOW.md`, `LOGIN_GUIDE.md`
- **Inconsistent separators**: Some use underscores, others use hyphens

### Standard to Implement
**kebab-case** for all documentation files (lowercase with hyphens)

## 🔄 Files to Rename

### Root Documentation Files
```
CLEANUP_SUMMARY.md → cleanup-summary.md
DOCUMENTATION_AUDIT.md → documentation-audit.md
DOCUMENTATION_IMPROVEMENTS.md → documentation-improvements.md
DOCUMENTATION_RULES.md → documentation-rules.md
DOCUMENTATION_STRUCTURE.md → documentation-structure.md
IMPLEMENTATION_SUMMARY.md → implementation-summary.md
PROJECT_STATUS.md → project-status.md
AVATAR_MENU_IMPLEMENTATION.md → avatar-menu-implementation.md
```

### Deployment Files
```
DATABASE_SETUP_ALTERNATIVES.md → database-setup-alternatives.md
DATABASE_SETUP_SUMMARY.md → database-setup-summary.md
ENV_CONFIGURATION.md → env-configuration.md
LAUNCH_READINESS_CHECKLIST.md → launch-readiness-checklist.md
LAUNCH_STATUS_REPORT.md → launch-status-report.md
MONITORING_SETUP.md → monitoring-setup.md
POSTGRESQL_SETUP.md → postgresql-setup.md
REAL_API_SETUP.md → real-api-setup.md
```

### Guides Files
```
CLAUDE.md → claude.md
DOCUMENTATION.md → documentation.md
LOGIN_GUIDE.md → login-guide.md
MCP_DEVELOPMENT_WORKFLOW.md → mcp-development-workflow.md
MCP_WORKFLOW.md → mcp-workflow.md
ORGANIZATION_PLAN.md → organization-plan.md
ORGANIZATION_SUMMARY.md → organization-summary.md
PATH_CHANGES_TASKS.md → path-changes-tasks.md
RELEASE_NOTES.md → release-notes.md
SCRIPT_PATH_UPDATES.md → script-path-updates.md
STYLE_GUIDE.md → style-guide.md
TASKS.md → tasks.md
```

### Reports Files
```
LAUNCH_README.md → launch-readme.md
LAUNCH_SUCCESS_REPORT.md → launch-success-report.md
ROOT_REORGANIZATION_REPORT.md → root-reorganization-report.md
```

### Plans Files
```
FOLDER_AND_FILE_NAMING_CONVENTIONS.md → folder-and-file-naming-conventions.md
MIGRATION_SUMMARY.md → migration-summary.md
PROGRESS_DASHBOARD.md → progress-dashboard.md
PROGRESS_TRACKER.md → progress-tracker.md
PROGRESS_UPDATE_SUMMARY.md → progress-update-summary.md
```

## 📝 Standard Document Header Template

```markdown
# Document Title

> **Status**: [Draft | Review | Approved | Deprecated]  
> **Last Updated**: [Date]  
> **Version**: [Version Number]  
> **Maintained by**: [Team/Person]  
> **Review Date**: [Next Review Date]

## 📋 Overview

Brief description of the document's purpose and scope.

## 🎯 Purpose

What this document aims to achieve.

[Main Content]

---

**Document Information**
- **Created**: [Creation Date]
- **Last Modified**: [Last Modified Date]
- **Version**: [Version Number]
- **Status**: [Current Status]
- **Next Review**: [Next Review Date]
```

## 🔄 Implementation Steps

1. **Rename files** using consistent kebab-case naming
2. **Update all references** in other documents
3. **Apply standard headers** to all documentation files
4. **Update navigation** and index files
5. **Verify all links** are working correctly