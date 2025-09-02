# Bilten Project - Root Folder Organization Plan

## Current Issues
- Too many loose files in root directory (40+ files)
- Mixed documentation scattered across root and Docs folder
- Configuration files mixed with documentation
- Log files and temporary files in root
- Inconsistent naming and organization

## Proposed New Structure

```
Bilten/
├── 📁 apps/                          # All application directories
│   ├── bilten-backend/               # Backend API service
│   ├── bilten-frontend/              # Frontend React application
│   ├── bilten-gateway/               # API Gateway service
│   └── bilten-scanner/               # Mobile scanner application
│
├── 📁 infrastructure/                # Infrastructure and deployment
│   ├── database/                     # Database configurations and migrations
│   ├── monitoring/                   # Monitoring stack configurations
│   ├── docker/                       # Docker configurations
│   │   ├── docker-compose.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── docker-compose.monitoring.yml
│   │   └── Dockerfile.*
│   └── scripts/                      # Infrastructure scripts
│
├── 📁 docs/                          # All documentation
│   ├── guides/                       # User and developer guides
│   ├── api/                          # API documentation
│   ├── deployment/                   # Deployment guides
│   ├── architecture/                 # Architecture documentation
│   └── plans/                        # Project plans and roadmaps
│
├── 📁 config/                        # Configuration files
│   ├── env/                          # Environment configurations
│   ├── ci-cd/                        # CI/CD configurations
│   └── development/                  # Development configurations
│
├── 📁 tools/                         # Development tools and utilities
│   ├── scripts/                      # Development scripts
│   └── utilities/                    # Utility files
│
├── 📁 temp/                          # Temporary files and logs
│   ├── logs/                         # Application logs
│   └── uploads/                      # Temporary uploads
│
├── 📁 .github/                       # GitHub configurations
├── 📁 .vscode/                       # VS Code configurations
├── 📁 .cursor/                       # Cursor IDE configurations
├── 📁 .git/                          # Git repository
├── 📁 node_modules/                  # Node.js dependencies
├── 📄 .gitignore                     # Git ignore rules
├── 📄 .dockerignore                  # Docker ignore rules
├── 📄 README.md                      # Main project README
├── 📄 package.json                   # Root package.json
└── 📄 .cursorrules                   # Cursor rules
```

## File Migration Plan

### 1. Move Applications
- Move all `bilten-*` directories to `apps/`

### 2. Consolidate Documentation
- Move all `.md` files from root to appropriate `docs/` subdirectories
- Merge `Docs/` folder content into `docs/`

### 3. Organize Infrastructure
- Move `database/` to `infrastructure/database/`
- Move `monitoring/` to `infrastructure/monitoring/`
- Move Docker files to `infrastructure/docker/`
- Move infrastructure scripts to `infrastructure/scripts/`

### 4. Organize Configuration
- Move environment files to `config/env/`
- Move CI/CD configs to `config/ci-cd/`
- Move development configs to `config/development/`

### 5. Organize Tools
- Move development scripts to `tools/scripts/`
- Move utility files to `tools/utilities/`

### 6. Clean Temporary Files
- Move `logs/` to `temp/logs/`
- Move `uploads/` to `temp/uploads/`
- Clean up log files in root

## Benefits of This Organization

1. **Clear Separation of Concerns**: Applications, infrastructure, docs, and configs are clearly separated
2. **Better Scalability**: Easy to add new applications or services
3. **Improved Navigation**: Developers can quickly find what they need
4. **Cleaner Root**: Root directory becomes much cleaner and focused
5. **Standard Structure**: Follows common monorepo patterns
6. **Better Documentation**: All docs are centralized and organized by type

## Implementation Steps

1. Create new directory structure
2. Move files systematically
3. Update all references and imports
4. Update documentation links
5. Test all applications still work
6. Update CI/CD pipelines
7. Update team documentation

## Files to Keep in Root
- `README.md` - Main project documentation
- `package.json` - Root package management
- `.gitignore` - Git ignore rules
- `.dockerignore` - Docker ignore rules
- `.cursorrules` - Cursor IDE rules
- Configuration directories (`.github/`, `.vscode/`, `.cursor/`)
- `node_modules/` - Dependencies
- `.git/` - Git repository

## Files to Move
- All `bilten-*` directories → `apps/`
- All `.md` files → `docs/` (except README.md)
- `database/` → `infrastructure/database/`
- `monitoring/` → `infrastructure/monitoring/`
- Docker files → `infrastructure/docker/`
- Scripts → `tools/scripts/` or `infrastructure/scripts/`
- Environment files → `config/env/`
- Log files → `temp/logs/`
- Uploads → `temp/uploads/`
