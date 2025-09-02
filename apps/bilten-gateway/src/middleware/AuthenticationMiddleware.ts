import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Logger } from '../utils/Logger';
import { ConfigManager } from '../config/ConfigManager';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    scopes?: string[];
    clientId?: string;
    authType: 'jwt' | 'oauth' | 'api_key';
  };
  authContext?: {
    tokenType: 'bearer' | 'api_key';
    issuedAt?: number;
    expiresAt?: number;
    clientInfo?: {
      id: string;
      name: string;
      type: 'web' | 'mobile' | 'service' | 'third_party';
    };
  };
}

export interface AuthenticationConfig {
  jwt: {
    secret: string;
    expiresIn: string;
    issuer?: string;
    audience?: string;
  };
  oauth: {
    enabled: boolean;
    introspectionEndpoint?: string;
    clientId?: string;
    clientSecret?: string;
    tokenInfoEndpoint?: string;
  };
  apiKey: {
    enabled: boolean;
    headerName: string;
    queryParam: string;
    validationEndpoint?: string;
  };
}

export interface APIKeyInfo {
  id: string;
  name: string;
  clientId: string;
  scopes: string[];
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  isActive: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface OAuthTokenInfo {
  active: boolean;
  client_id: string;
  username?: string;
  scope?: string;
  exp?: number;
  iat?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  token_type?: string;
}

export class AuthenticationMiddleware {
  private static configManager = new ConfigManager();
  private static apiKeyCache = new Map<string, APIKeyInfo>();
  private static oauthTokenCache = new Map<string, OAuthTokenInfo>();

  static authenticate(options: { 
    requireAuth?: boolean;
    allowedAuthTypes?: ('jwt' | 'oauth' | 'api_key')[];
    requiredScopes?: string[];
  } = {}) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const { requireAuth = true, allowedAuthTypes = ['jwt', 'oauth', 'api_key'], requiredScopes = [] } = options;

      // Skip authentication for public endpoints
      const publicPaths = [
        '/health',
        '/api/auth/login',
        '/api/auth/register',
        '/api/auth/forgot-password',
        '/api/gateway/metrics',
        '/api/gateway/docs'
      ];

      const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
      if (isPublicPath || !requireAuth) {
        return next();
      }

      try {
        const authResult = await AuthenticationMiddleware.performAuthentication(req, allowedAuthTypes);
        
        if (!authResult.success) {
          return res.status(401).json({
            error: {
              code: authResult.errorCode || 'AUTHENTICATION_FAILED',
              message: authResult.message || 'Authentication failed',
              timestamp: new Date().toISOString(),
              traceId: req.headers['x-trace-id'] || 'unknown'
            }
          });
        }

        req.user = authResult.user!;
        if (authResult.context) {
          req.authContext = authResult.context;
        }

        // Check required scopes
        if (requiredScopes.length > 0) {
          const userScopes = req.user.scopes || [];
          const hasRequiredScopes = requiredScopes.every(scope => userScopes.includes(scope));
          
          if (!hasRequiredScopes) {
            const logger = Logger.getInstance();
            logger.warn('Insufficient scopes', {
              userId: req.user.id,
              requiredScopes,
              userScopes,
              path: req.path
            });

            return res.status(403).json({
              error: {
                code: 'INSUFFICIENT_SCOPES',
                message: `Required scopes: ${requiredScopes.join(', ')}`,
                timestamp: new Date().toISOString(),
                traceId: req.headers['x-trace-id'] || 'unknown'
              }
            });
          }
        }

        const logger = Logger.getInstance();
        logger.debug('User authenticated successfully', {
          userId: req.user.id,
          email: req.user.email,
          authType: req.user.authType,
          path: req.path,
          scopes: req.user.scopes
        });

        next();
      } catch (error) {
        const logger = Logger.getInstance();
        logger.error('Authentication error', {
          error: error instanceof Error ? error.message : 'Unknown error',
          path: req.path,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });

        return res.status(500).json({
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: 'Internal authentication error',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
      }
    };
  }

  private static async performAuthentication(
    req: AuthenticatedRequest, 
    allowedAuthTypes: ('jwt' | 'oauth' | 'api_key')[]
  ): Promise<{
    success: boolean;
    user?: AuthenticatedRequest['user'];
    context?: AuthenticatedRequest['authContext'];
    errorCode?: string;
    message?: string;
  }> {
    const token = AuthenticationMiddleware.extractToken(req);
    
    if (!token) {
      return {
        success: false,
        errorCode: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication token is required'
      };
    }

    // Try JWT authentication first
    if (allowedAuthTypes.includes('jwt')) {
      const jwtResult = await AuthenticationMiddleware.validateJWT(token, req);
      if (jwtResult.success) {
        return jwtResult;
      }
    }

    // Try API Key authentication
    if (allowedAuthTypes.includes('api_key')) {
      const apiKeyResult = await AuthenticationMiddleware.validateAPIKey(token, req);
      if (apiKeyResult.success) {
        return apiKeyResult;
      }
    }

    // Try OAuth token introspection
    if (allowedAuthTypes.includes('oauth')) {
      const oauthResult = await AuthenticationMiddleware.validateOAuthToken(token, req);
      if (oauthResult.success) {
        return oauthResult;
      }
    }

    return {
      success: false,
      errorCode: 'AUTHENTICATION_FAILED',
      message: 'Invalid or expired authentication token'
    };
  }

  private static async validateJWT(token: string, req: AuthenticatedRequest) {
    try {
      const jwtConfig = AuthenticationMiddleware.configManager.getJWTConfig();
      const decoded = jwt.verify(token, jwtConfig.secret) as any;

      return {
        success: true,
        user: {
          id: decoded.id || decoded.sub || decoded.userId,
          email: decoded.email,
          role: decoded.role || 'user',
          organizationId: decoded.organizationId || decoded.org_id,
          scopes: decoded.scopes || decoded.scope?.split(' ') || [],
          clientId: decoded.client_id,
          authType: 'jwt' as const
        },
        context: {
          tokenType: 'bearer' as const,
          issuedAt: decoded.iat,
          expiresAt: decoded.exp,
          clientInfo: decoded.client_info
        }
      };
    } catch (error) {
      const logger = Logger.getInstance();
      logger.debug('JWT validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      return {
        success: false,
        errorCode: 'INVALID_JWT',
        message: 'Invalid JWT token'
      };
    }
  }

  private static async validateAPIKey(apiKey: string, req: AuthenticatedRequest) {
    try {
      // Check cache first
      let keyInfo = AuthenticationMiddleware.apiKeyCache.get(apiKey);
      
      if (!keyInfo) {
        // Validate with backend service (mock implementation)
        const fetchedKeyInfo = await AuthenticationMiddleware.fetchAPIKeyInfo(apiKey);
        keyInfo = fetchedKeyInfo || undefined;
        if (keyInfo) {
          // Cache for 5 minutes
          AuthenticationMiddleware.apiKeyCache.set(apiKey, keyInfo);
          setTimeout(() => {
            AuthenticationMiddleware.apiKeyCache.delete(apiKey);
          }, 5 * 60 * 1000);
        }
      }

      if (!keyInfo || !keyInfo.isActive) {
        return {
          success: false,
          errorCode: 'INVALID_API_KEY',
          message: 'Invalid or inactive API key'
        };
      }

      if (keyInfo.expiresAt && keyInfo.expiresAt < new Date()) {
        return {
          success: false,
          errorCode: 'EXPIRED_API_KEY',
          message: 'API key has expired'
        };
      }

      return {
        success: true,
        user: {
          id: keyInfo.clientId,
          email: `${keyInfo.clientId}@api.bilten.com`,
          role: 'api_client',
          organizationId: keyInfo.metadata?.organizationId,
          scopes: keyInfo.scopes,
          clientId: keyInfo.clientId,
          authType: 'api_key' as const
        },
        context: {
          tokenType: 'api_key' as const,
          expiresAt: keyInfo.expiresAt ? Math.floor(keyInfo.expiresAt.getTime() / 1000) : 0,
          clientInfo: {
            id: keyInfo.clientId,
            name: keyInfo.name,
            type: 'third_party' as const
          }
        }
      };
    } catch (error) {
      const logger = Logger.getInstance();
      logger.debug('API key validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      return {
        success: false,
        errorCode: 'API_KEY_VALIDATION_ERROR',
        message: 'API key validation failed'
      };
    }
  }

  private static async validateOAuthToken(token: string, req: AuthenticatedRequest) {
    try {
      // Check cache first
      let tokenInfo = AuthenticationMiddleware.oauthTokenCache.get(token);
      
      if (!tokenInfo) {
        const fetchedTokenInfo = await AuthenticationMiddleware.introspectOAuthToken(token);
        tokenInfo = fetchedTokenInfo || undefined;
        if (tokenInfo && tokenInfo.active) {
          // Cache for 2 minutes
          AuthenticationMiddleware.oauthTokenCache.set(token, tokenInfo);
          setTimeout(() => {
            AuthenticationMiddleware.oauthTokenCache.delete(token);
          }, 2 * 60 * 1000);
        }
      }

      if (!tokenInfo || !tokenInfo.active) {
        return {
          success: false,
          errorCode: 'INVALID_OAUTH_TOKEN',
          message: 'Invalid or inactive OAuth token'
        };
      }

      if (tokenInfo.exp && tokenInfo.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          errorCode: 'EXPIRED_OAUTH_TOKEN',
          message: 'OAuth token has expired'
        };
      }

      const scopes = tokenInfo.scope ? tokenInfo.scope.split(' ') : [];

      return {
        success: true,
        user: {
          id: tokenInfo.sub || tokenInfo.username || tokenInfo.client_id,
          email: tokenInfo.username || `${tokenInfo.client_id}@oauth.bilten.com`,
          role: 'oauth_client',
          scopes,
          clientId: tokenInfo.client_id,
          authType: 'oauth' as const
        },
        context: {
          tokenType: 'bearer' as const,
          issuedAt: tokenInfo.iat || 0,
          expiresAt: tokenInfo.exp || 0,
          clientInfo: {
            id: tokenInfo.client_id,
            name: tokenInfo.client_id,
            type: 'third_party' as const
          }
        }
      };
    } catch (error) {
      const logger = Logger.getInstance();
      logger.debug('OAuth token validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        path: req.path
      });
      
      return {
        success: false,
        errorCode: 'OAUTH_VALIDATION_ERROR',
        message: 'OAuth token validation failed'
      };
    }
  }

  private static async fetchAPIKeyInfo(apiKey: string): Promise<APIKeyInfo | null> {
    try {
      // Mock implementation - in real scenario, this would call the user service
      // For now, we'll simulate some API keys for testing
      const mockAPIKeys: Record<string, APIKeyInfo> = {
        'ak_test_12345': {
          id: 'ak_test_12345',
          name: 'Test API Key',
          clientId: 'client_test_123',
          scopes: ['read:events', 'write:events', 'read:users'],
          rateLimit: {
            requestsPerMinute: 100,
            requestsPerHour: 1000
          },
          isActive: true,
          metadata: {
            organizationId: 'org_123',
            createdBy: 'admin@bilten.com'
          }
        },
        'ak_prod_67890': {
          id: 'ak_prod_67890',
          name: 'Production API Key',
          clientId: 'client_prod_456',
          scopes: ['read:events', 'read:analytics'],
          rateLimit: {
            requestsPerMinute: 1000,
            requestsPerHour: 10000
          },
          isActive: true,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          metadata: {
            organizationId: 'org_456',
            createdBy: 'api@partner.com'
          }
        }
      };

      return mockAPIKeys[apiKey] || null;
    } catch (error) {
      const logger = Logger.getInstance();
      logger.error('Failed to fetch API key info', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private static async introspectOAuthToken(token: string): Promise<OAuthTokenInfo | null> {
    try {
      // Mock implementation - in real scenario, this would call OAuth provider's introspection endpoint
      // For testing, we'll simulate token introspection
      if (token.startsWith('oauth_')) {
        return {
          active: true,
          client_id: 'oauth_client_123',
          username: 'oauth_user',
          scope: 'read:events write:events read:users',
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          iat: Math.floor(Date.now() / 1000) - 300, // 5 minutes ago
          sub: 'oauth_user_456',
          aud: 'bilten-api',
          iss: 'https://auth.bilten.com',
          token_type: 'Bearer'
        };
      }

      return null;
    } catch (error) {
      const logger = Logger.getInstance();
      logger.error('Failed to introspect OAuth token', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  private static extractToken(req: Request): string | null {
    // Check Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
      }
      if (authHeader.startsWith('Basic ')) {
        // Handle Basic auth for API keys
        const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
        const [username, password] = credentials.split(':');
        // If username is empty and password contains the API key
        if (!username && password) {
          return password;
        }
        // If username contains the API key
        if (username && !password) {
          return username;
        }
      }
    }

    // Check X-API-Key header
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      return apiKey;
    }

    // Check API-Key header (alternative)
    const apiKeyAlt = req.headers['api-key'] as string;
    if (apiKeyAlt) {
      return apiKeyAlt;
    }

    // Check query parameter (for WebSocket connections, etc.)
    const queryToken = req.query.token as string;
    if (queryToken) {
      return queryToken;
    }

    // Check query parameter for API key
    const queryApiKey = req.query.api_key as string;
    if (queryApiKey) {
      return queryApiKey;
    }

    return null;
  }

  static requireRole(requiredRole: string | string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      const userRole = req.user.role;
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const roleHierarchy = ['user', 'moderator', 'admin', 'super_admin', 'api_client', 'oauth_client'];
      
      const userRoleIndex = roleHierarchy.indexOf(userRole);
      const hasRequiredRole = requiredRoles.some(role => {
        const requiredRoleIndex = roleHierarchy.indexOf(role);
        return userRoleIndex !== -1 && (userRoleIndex >= requiredRoleIndex || userRole === role);
      });

      if (!hasRequiredRole) {
        const logger = Logger.getInstance();
        logger.warn('Authorization failed - insufficient role', {
          userId: req.user.id,
          userRole,
          requiredRoles,
          path: req.path,
          authType: req.user.authType
        });

        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: `Access denied. Required role(s): ${requiredRoles.join(', ')}`,
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      next();
    };
  }

  static requireScopes(requiredScopes: string | string[]) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      const userScopes = req.user.scopes || [];
      const requiredScopesList = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
      
      const hasRequiredScopes = requiredScopesList.every(scope => userScopes.includes(scope));

      if (!hasRequiredScopes) {
        const logger = Logger.getInstance();
        logger.warn('Authorization failed - insufficient scopes', {
          userId: req.user.id,
          userScopes,
          requiredScopes: requiredScopesList,
          path: req.path,
          authType: req.user.authType
        });

        res.status(403).json({
          error: {
            code: 'INSUFFICIENT_SCOPES',
            message: `Access denied. Required scope(s): ${requiredScopesList.join(', ')}`,
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      next();
    };
  }

  static requireOrganization(organizationId?: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      const targetOrgId = organizationId || req.params.organizationId || req.query.organizationId as string;
      
      if (!targetOrgId) {
        res.status(400).json({
          error: {
            code: 'ORGANIZATION_ID_REQUIRED',
            message: 'Organization ID is required',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      // Super admins can access any organization
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user belongs to the organization
      if (req.user.organizationId !== targetOrgId) {
        const logger = Logger.getInstance();
        logger.warn('Authorization failed - organization mismatch', {
          userId: req.user.id,
          userOrganizationId: req.user.organizationId,
          targetOrganizationId: targetOrgId,
          path: req.path
        });

        res.status(403).json({
          error: {
            code: 'ORGANIZATION_ACCESS_DENIED',
            message: 'Access denied to this organization',
            timestamp: new Date().toISOString(),
            traceId: req.headers['x-trace-id'] || 'unknown'
          }
        });
        return;
      }

      next();
    };
  }

  static optional() {
    return AuthenticationMiddleware.authenticate({ requireAuth: false });
  }

  static clearCaches() {
    AuthenticationMiddleware.apiKeyCache.clear();
    AuthenticationMiddleware.oauthTokenCache.clear();
    const logger = Logger.getInstance();
    logger.info('Authentication caches cleared');
  }
}