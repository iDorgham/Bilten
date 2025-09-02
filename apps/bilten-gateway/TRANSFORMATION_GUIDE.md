# Request/Response Transformation Guide

This guide explains how to use the request/response transformation feature in the Bilten API Gateway.

## Overview

The transformation feature allows you to modify HTTP requests and responses as they pass through the gateway. This is useful for:

- **API Versioning**: Transform requests between different API versions
- **Security**: Remove sensitive headers or response fields
- **Standardization**: Add consistent headers across all services
- **Data Filtering**: Select only specific fields in responses
- **Path Rewriting**: Modify request paths for backend services

## Architecture

The transformation system consists of several components:

1. **TransformationMiddleware**: Core middleware that applies transformations
2. **TransformationManager**: Manages transformation rules and configuration
3. **Configuration Files**: JSON files defining transformation rules
4. **Management API**: REST endpoints for managing transformations

## Configuration

### Transformation Configuration File

Transformations are defined in `src/config/transformations.json`:

```json
{
  "transformations": {
    "rule-name": {
      "routePattern": "/api/users/*",
      "request": {
        "addHeaders": {
          "X-Service-Version": "v2",
          "X-Gateway-Source": "bilten-gateway"
        },
        "removeHeaders": ["X-Internal-Debug"],
        "modifyPath": {
          "stripPrefix": "/api/v1",
          "addPrefix": "/v2/api",
          "rewrite": "/old/(\\d+) -> /new/$1"
        }
      },
      "response": {
        "addHeaders": {
          "X-API-Version": "2.0",
          "Cache-Control": "public, max-age=300"
        },
        "removeHeaders": ["X-Internal-Service"],
        "fieldSelection": ["id", "name", "email", "profile.avatar"]
      }
    }
  },
  "globalTransformations": {
    "security": {
      "request": {
        "removeHeaders": ["X-Internal-Token", "X-Debug-Mode"]
      },
      "response": {
        "addHeaders": {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY"
        },
        "removeHeaders": ["Server", "X-Powered-By"]
      }
    }
  }
}
```

### Route Patterns

Route patterns support wildcards and are converted to regular expressions:

- `/api/users/*` - Matches `/api/users/123`, `/api/users/profile`, etc.
- `/api/events/*/tickets/*` - Matches `/api/events/123/tickets/456`
- `/api/auth` - Exact match only

## Request Transformations

### Adding Headers

Add headers to requests before they reach backend services:

```json
{
  "request": {
    "addHeaders": {
      "X-Service-Version": "v2",
      "X-User-ID": "{{request.headers.authorization}}",
      "X-Timestamp": "{{timestamp}}",
      "X-Correlation-ID": "{{correlationId}}"
    }
  }
}
```

#### Template Variables

- `{{request.headers.header-name}}` - Value from request header
- `{{request.path}}` - Request path
- `{{route.params.param-name}}` - Route parameter value
- `{{timestamp}}` - Current ISO timestamp
- `{{correlationId}}` - Request correlation ID

### Removing Headers

Remove headers from requests:

```json
{
  "request": {
    "removeHeaders": ["X-Internal-Debug", "X-Admin-Override"]
  }
}
```

### Path Modification

Transform request paths:

```json
{
  "request": {
    "modifyPath": {
      "stripPrefix": "/api/v1",
      "addPrefix": "/v2/api",
      "rewrite": "/users/(\\d+)/profile -> /users/$1/details"
    }
  }
}
```

- **stripPrefix**: Remove prefix from path
- **addPrefix**: Add prefix to path
- **rewrite**: Use regex to rewrite path (format: `pattern -> replacement`)

## Response Transformations

### Adding Headers

Add headers to responses:

```json
{
  "response": {
    "addHeaders": {
      "X-API-Version": "2.0",
      "Cache-Control": "public, max-age=300",
      "X-Response-Time": "{{responseTime}}"
    }
  }
}
```

### Removing Headers

Remove headers from responses:

```json
{
  "response": {
    "removeHeaders": ["X-Internal-Service", "X-Database-Query-Time"]
  }
}
```

### Field Selection

Filter response body to include only specific fields:

```json
{
  "response": {
    "fieldSelection": [
      "id",
      "name", 
      "email",
      "profile.avatar",
      "profile.displayName"
    ]
  }
}
```

This transforms:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret",
  "profile": {
    "avatar": "avatar.jpg",
    "displayName": "John",
    "phone": "123-456-7890"
  },
  "internalData": "sensitive"
}
```

Into:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "profile": {
    "avatar": "avatar.jpg",
    "displayName": "John"
  }
}
```

## Global Transformations

Global transformations are applied to all routes and are merged with route-specific transformations:

```json
{
  "globalTransformations": {
    "security": {
      "response": {
        "addHeaders": {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY"
        },
        "removeHeaders": ["Server", "X-Powered-By"]
      }
    },
    "monitoring": {
      "request": {
        "addHeaders": {
          "X-Request-ID": "{{correlationId}}",
          "X-Gateway-Timestamp": "{{timestamp}}"
        }
      }
    }
  }
}
```

## Management API

### Get All Transformations

```http
GET /api/gateway/transformations
```

Response:
```json
{
  "transformations": {
    "rule-name": { ... }
  },
  "statistics": {
    "totalRules": 5,
    "globalRules": 2,
    "routePatterns": ["rule1", "rule2"]
  }
}
```

### Add/Update Transformation Rule

```http
POST /api/gateway/transformations/my-rule
Content-Type: application/json

{
  "routePattern": "/api/test/*",
  "request": {
    "addHeaders": {
      "X-Test": "value"
    }
  }
}
```

### Remove Transformation Rule

```http
DELETE /api/gateway/transformations/my-rule
```

### Reload Configuration

```http
POST /api/gateway/transformations/reload
```

## Examples

### API Versioning

Transform v1 API calls to v2 backend:

```json
{
  "api-v1-to-v2": {
    "routePattern": "/api/v1/*",
    "request": {
      "modifyPath": {
        "stripPrefix": "/api/v1",
        "addPrefix": "/api/v2"
      },
      "addHeaders": {
        "X-API-Version": "v2"
      }
    },
    "response": {
      "addHeaders": {
        "X-Migrated-From": "v1"
      }
    }
  }
}
```

### Security Filtering

Remove sensitive data from user responses:

```json
{
  "user-security": {
    "routePattern": "/api/users/*",
    "response": {
      "fieldSelection": [
        "id", "username", "email", "profile.displayName", "profile.avatar"
      ],
      "removeHeaders": ["X-Internal-User-Role", "X-Database-ID"]
    }
  }
}
```

### Service Integration

Add service metadata for internal routing:

```json
{
  "service-metadata": {
    "routePattern": "/api/events/*",
    "request": {
      "addHeaders": {
        "X-Service-Name": "event-service",
        "X-Client-IP": "{{request.headers.x-forwarded-for}}",
        "X-User-Agent": "{{request.headers.user-agent}}"
      }
    }
  }
}
```

## Best Practices

### Performance

1. **Minimize Field Selection**: Only select fields you need to reduce response size
2. **Cache Transformations**: Transformation rules are cached for performance
3. **Avoid Complex Regex**: Keep path rewrite patterns simple

### Security

1. **Remove Sensitive Headers**: Always remove internal headers in responses
2. **Validate Input**: Transformation rules are validated before application
3. **Audit Transformations**: Log transformation applications for debugging

### Maintainability

1. **Use Descriptive Names**: Give transformation rules meaningful names
2. **Document Patterns**: Comment complex route patterns
3. **Test Transformations**: Write tests for custom transformation rules
4. **Version Control**: Keep transformation configs in version control

## Troubleshooting

### Common Issues

1. **Route Pattern Not Matching**
   - Check pattern syntax (use `*` for wildcards)
   - Test patterns with the management API
   - Enable debug logging to see pattern matching

2. **Field Selection Not Working**
   - Ensure field names match exactly (case-sensitive)
   - Use dot notation for nested fields (`profile.email`)
   - Check that response is JSON

3. **Headers Not Being Added**
   - Verify header names are valid (alphanumeric, hyphens, underscores)
   - Check for conflicting global transformations
   - Ensure transformation rule is active

### Debug Logging

Enable debug logging to troubleshoot transformations:

```javascript
// In your environment configuration
LOG_LEVEL=debug
```

This will log:
- Route pattern matching
- Transformation rule application
- Header modifications
- Field selection operations

### Validation Errors

The system validates transformation rules and provides detailed error messages:

```json
{
  "error": "Invalid transformation rule: Invalid header name: Invalid Header!"
}
```

Common validation errors:
- Invalid header names (must be alphanumeric with hyphens/underscores)
- Invalid regex patterns in path rewrite rules
- Empty field selection arrays
- Malformed route patterns

## Integration

The transformation system integrates with:

- **Routing Engine**: Applies transformations based on matched routes
- **Authentication**: Can access user context in transformations
- **Rate Limiting**: Transformations are applied after rate limiting
- **Monitoring**: Transformation metrics are collected
- **Caching**: Respects cache headers added by transformations

For more information, see the API Gateway documentation and the source code in `src/middleware/TransformationMiddleware.ts`.