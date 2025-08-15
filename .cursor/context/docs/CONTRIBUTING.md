# Contributing to EventChain

Thank you for your interest in contributing to EventChain! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### Development Setup
1. Clone the repository
2. Run `./setup-env.ps1` to set up environment variables
3. Run `docker-compose up -d` to start services
4. See [development/testing-guide.md](development/testing-guide.md) for detailed setup

## How to Contribute

### Reporting Issues
- Use GitHub Issues to report bugs or request features
- Provide clear reproduction steps for bugs
- Include environment details (OS, Node version, etc.)

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Ensure all tests pass
6. Submit a pull request with a clear description

### Code Standards
- Follow existing code style and patterns
- Write meaningful commit messages
- Include tests for new functionality
- Update documentation as needed

### Development Workflow
See [development/git-workflow.md](development/git-workflow.md) for our branching strategy and development process.

## Project Structure
- `frontend/` - Next.js frontend application
- `api-gateway/` - API gateway service
- `services/` - Microservices (event, order, analytics)
- `database/` - Database schemas and migrations
- `docker/` - Docker configurations

## Getting Help
- Check [development/troubleshooting.md](development/troubleshooting.md) for common issues
- Review existing issues and discussions
- Reach out to maintainers for guidance

## Code of Conduct
Please read and follow our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).