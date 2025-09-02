# Launch Scripts

This directory contains all launch and deployment scripts for the Bilten platform.

## Scripts Overview

- `launch-bilten.ps1` - Main PowerShell launch script (comprehensive)
- `launch-bilten-simple.ps1` - Simplified PowerShell launch script
- `launch-bilten-fixed.ps1` - Fixed version of the main launch script
- `launch-bilten.bat` - Windows batch file launch script
- `quick-launch.ps1` - Quick development launch script

## Usage

### Development
```powershell
# Quick development setup
./scripts/launch/quick-launch.ps1

# Simple launch
./scripts/launch/launch-bilten-simple.ps1
```

### Production
```powershell
# Full production launch
./scripts/launch/launch-bilten.ps1

# Fixed version
./scripts/launch/launch-bilten-fixed.ps1
```

### Windows Batch
```cmd
# Windows batch launch
scripts\launch\launch-bilten.bat
```

## Script Details

Each script handles:
- Environment setup
- Docker container management
- Service orchestration
- Health checks
- Logging setup

See individual script files for detailed documentation.
