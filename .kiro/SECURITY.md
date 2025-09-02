# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### Private Disclosure
**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please report security issues by emailing: [security@eventchain.com]

### What to Include
Please include the following information in your report:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Any suggested fixes or mitigations
- Your contact information

### Response Timeline
- **Initial Response**: Within 48 hours of receiving your report
- **Status Update**: Within 7 days with our assessment
- **Resolution**: Security fixes will be prioritized and released as soon as possible

### Disclosure Policy
- We will acknowledge receipt of your vulnerability report
- We will confirm the vulnerability and determine its severity
- We will develop and test a fix
- We will release the fix and publicly disclose the vulnerability details
- We will credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

### For Contributors
- Never commit sensitive data (API keys, passwords, etc.)
- Use environment variables for configuration
- Follow secure coding practices
- Keep dependencies updated
- Run security scans regularly

### For Deployments
- Use HTTPS in production
- Implement proper authentication and authorization
- Regularly update system dependencies
- Monitor for security alerts
- Use secure database configurations
- Implement rate limiting and input validation

## Security Features
- JWT-based authentication
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure session management

## Contact
For security-related questions or concerns, contact: [security@eventchain.com]