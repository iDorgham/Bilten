# Security Architecture

## 🎯 Overview

This document describes the security architecture of the Bilten platform, including authentication, authorization, data protection, and security best practices.

## 🛡️ Security Principles

### 1. **Zero-Trust Model**
- Never trust, always verify
- Verify every request and user
- Assume breach and design accordingly
- Implement defense in depth

### 2. **Security by Design**
- Security built into every layer
- Secure coding practices
- Regular security audits
- Continuous security monitoring

## 🔐 Authentication Strategy

### Multi-Factor Authentication (MFA)
```typescript
// MFA implementation
class MFAService {
  async generateTOTP(userId: string): Promise<string> {
    const secret = await this.getUserSecret(userId);
    return totp.generate(secret);
  }
  
  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getUserSecret(userId);
    return totp.verify(token, secret);
  }
  
  async enableMFA(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = speakeasy.generateSecret({
      name: 'Bilten Platform',
      issuer: 'Bilten'
    });
    
    await this.storeUserSecret(userId, secret.base32);
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }
}
```

### Password Security
```typescript
// Password hashing with bcrypt
class PasswordService {
  private readonly SALT_ROUNDS = 12;
  
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
  
  validatePasswordStrength(password: string): PasswordValidationResult {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && 
                hasLowerCase && hasNumbers && hasSpecialChar,
      errors: []
    };
  }
}
```

## 🔑 Authorization Framework

### Role-Based Access Control (RBAC)
```typescript
// Role and permission definitions
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  ATTENDEE = 'attendee'
}

enum Permission {
  // Event permissions
  EVENT_CREATE = 'event:create',
  EVENT_READ = 'event:read',
  EVENT_UPDATE = 'event:update',
  EVENT_DELETE = 'event:delete',
  
  // User permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Ticket permissions
  TICKET_CREATE = 'ticket:create',
  TICKET_READ = 'ticket:read',
  TICKET_UPDATE = 'ticket:update',
  TICKET_DELETE = 'ticket:delete',
  TICKET_VALIDATE = 'ticket:validate'
}

// Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.ADMIN]: [
    Permission.EVENT_CREATE, Permission.EVENT_READ, Permission.EVENT_UPDATE,
    Permission.USER_READ, Permission.USER_UPDATE,
    Permission.TICKET_READ, Permission.TICKET_UPDATE, Permission.TICKET_VALIDATE
  ],
  [UserRole.ORGANIZER]: [
    Permission.EVENT_CREATE, Permission.EVENT_READ, Permission.EVENT_UPDATE,
    Permission.TICKET_CREATE, Permission.TICKET_READ, Permission.TICKET_UPDATE
  ],
  [UserRole.ATTENDEE]: [
    Permission.EVENT_READ,
    Permission.TICKET_READ
  ]
};
```

### Permission Middleware
```typescript
// Permission checking middleware
const requirePermission = (permission: Permission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: { 
          code: 'FORBIDDEN', 
          message: 'Insufficient permissions',
          required: permission,
          granted: userPermissions
        }
      });
    }
    
    next();
  };
};

// Resource ownership middleware
const requireOwnership = (resourceType: string, resourceIdParam: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as AuthenticatedUser;
    const resourceId = req.params[resourceIdParam];
    
    const isOwner = await checkResourceOwnership(resourceType, resourceId, user.id);
    
    if (!isOwner && user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied to this resource' }
      });
    }
    
    next();
  };
};
```

## 🔒 Data Protection

### Data Encryption
```typescript
// Encryption service
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  
  encrypt(data: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex')
    };
  }
  
  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipher(
      this.algorithm, 
      this.key, 
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

### Sensitive Data Handling
```typescript
// Data masking utilities
class DataMaskingService {
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.length > 2 
      ? local.substring(0, 2) + '*'.repeat(local.length - 2)
      : '**';
    return `${maskedLocal}@${domain}`;
  }
  
  maskPhoneNumber(phone: string): string {
    return phone.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
  }
  
  maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }
}
```

## 🚪 Session Management

### JWT Token Security
```typescript
// JWT token service
class JWTService {
  private readonly accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
  private readonly refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
  
  generateAccessToken(user: User): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        permissions: ROLE_PERMISSIONS[user.role]
      },
      this.accessTokenSecret,
      { expiresIn: '15m' }
    );
  }
  
  generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.refreshTokenSecret,
      { expiresIn: '7d' }
    );
  }
  
  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
  }
  
  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
  }
}
```

### Session Security
```typescript
// Session management
class SessionService {
  async createSession(userId: string, deviceInfo: DeviceInfo): Promise<Session> {
    const sessionId = crypto.randomUUID();
    const session: Session = {
      id: sessionId,
      userId,
      deviceInfo,
      createdAt: new Date(),
      lastActive: new Date(),
      isActive: true
    };
    
    await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify(session));
    return session;
  }
  
  async validateSession(sessionId: string): Promise<Session | null> {
    const sessionData = await this.redis.get(`session:${sessionId}`);
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData) as Session;
    if (!session.isActive) return null;
    
    // Update last active time
    session.lastActive = new Date();
    await this.redis.setex(`session:${sessionId}`, 86400, JSON.stringify(session));
    
    return session;
  }
  
  async invalidateSession(sessionId: string): Promise<void> {
    await this.redis.del(`session:${sessionId}`);
  }
}
```

## 🛡️ Input Validation & Sanitization

### Input Validation
```typescript
// Validation schemas
const eventValidationSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .trim(),
  description: Joi.string()
    .max(1000)
    .optional()
    .trim(),
  startDate: Joi.date()
    .greater('now')
    .required(),
  endDate: Joi.date()
    .greater(Joi.ref('startDate'))
    .required(),
  venueId: Joi.string()
    .uuid()
    .optional(),
  capacity: Joi.number()
    .integer()
    .min(1)
    .optional()
});

// Sanitization middleware
const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Sanitize body
  if (req.body) {
    req.body = DOMPurify.sanitize(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = DOMPurify.sanitize(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params) {
    req.params = DOMPurify.sanitize(req.params);
  }
  
  next();
};
```

## 🚫 Rate Limiting & DDoS Protection

### Rate Limiting
```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req: Request) => {
    // Skip rate limiting for certain endpoints
    return req.path.startsWith('/api/v1/health');
  }
};

// Apply rate limiting
app.use('/api/v1/', rateLimit(rateLimitConfig));
```

### DDoS Protection
```typescript
// DDoS protection middleware
const ddosProtection = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip;
  const requestCount = getRequestCount(clientIP);
  
  if (requestCount > 1000) { // 1000 requests per minute
    return res.status(429).json({
      success: false,
      error: {
        code: 'DDoS_PROTECTION',
        message: 'Request rate too high'
      }
    });
  }
  
  incrementRequestCount(clientIP);
  next();
};
```

## 🔍 Security Monitoring

### Security Event Logging
```typescript
// Security event logger
class SecurityLogger {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      eventType: event.type,
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      details: event.details,
      severity: event.severity
    };
    
    // Log to security log
    await this.logger.info('Security Event', logEntry);
    
    // Store in database for analysis
    await this.securityEventRepository.create(logEntry);
    
    // Alert if high severity
    if (event.severity === 'HIGH') {
      await this.alertSecurityTeam(logEntry);
    }
  }
}

// Security event types
enum SecurityEventType {
  LOGIN_ATTEMPT = 'login_attempt',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change'
}
```

### Intrusion Detection
```typescript
// Intrusion detection service
class IntrusionDetectionService {
  async analyzeRequest(req: Request): Promise<SecurityAnalysis> {
    const analysis: SecurityAnalysis = {
      riskScore: 0,
      threats: [],
      recommendations: []
    };
    
    // Check for SQL injection attempts
    if (this.detectSQLInjection(req)) {
      analysis.riskScore += 50;
      analysis.threats.push('SQL_INJECTION_ATTEMPT');
    }
    
    // Check for XSS attempts
    if (this.detectXSS(req)) {
      analysis.riskScore += 40;
      analysis.threats.push('XSS_ATTEMPT');
    }
    
    // Check for suspicious patterns
    if (this.detectSuspiciousPatterns(req)) {
      analysis.riskScore += 30;
      analysis.threats.push('SUSPICIOUS_PATTERN');
    }
    
    return analysis;
  }
  
  private detectSQLInjection(req: Request): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
      /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
      /(\b(EXEC|EXECUTE)\b)/i
    ];
    
    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
    return sqlPatterns.some(pattern => pattern.test(requestString));
  }
  
  private detectXSS(req: Request): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];
    
    const requestString = JSON.stringify(req.body) + JSON.stringify(req.query);
    return xssPatterns.some(pattern => pattern.test(requestString));
  }
}
```

## 🔧 Security Configuration

### Environment Security
```typescript
// Security configuration
const securityConfig = {
  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // days
  },
  
  // Session configuration
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict'
  },
  
  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    max: 100
  }
};
```

---

**Last Updated**: December 2024  
**Version**: 2.0  
**Maintained by**: Architecture Team
