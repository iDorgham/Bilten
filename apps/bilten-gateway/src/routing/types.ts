/**
 * Type definitions for the routing engine
 */

export interface RouteConfig {
  id: string;
  path: string;
  methods: string[];
  upstream: string;
  
  // Route-specific settings
  authentication: boolean;
  rateLimit?: string;
  caching?: CacheRule;
  transformation?: TransformationRule;
  
  // Version and feature flags
  version: string;
  enabled: boolean;
  deprecated?: Date;
  
  metadata: Record<string, any>;
}

export interface CacheRule {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  varyBy?: string[]; // Headers to vary cache by
  excludeHeaders?: string[];
}

export interface TransformationRule {
  requestTransform?: RequestTransform;
  responseTransform?: ResponseTransform;
}

export interface RequestTransform {
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
  modifyPath?: PathModification;
}

export interface ResponseTransform {
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
  fieldSelection?: string[];
}

export interface PathModification {
  stripPrefix?: string;
  addPrefix?: string;
  rewrite?: string; // Regex pattern for path rewriting
}

export interface RouteMatch {
  route: RouteConfig;
  params: Record<string, string>;
  query: Record<string, any>;
}

export interface RoutingContext {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  correlationId: string;
  timestamp: Date;
}

export interface ValidationRule {
  field: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: any[];
}

export interface RouteValidation {
  headers?: ValidationRule[];
  query?: ValidationRule[];
  body?: ValidationRule[];
}