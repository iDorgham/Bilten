/**
 * Path matching utility for route resolution
 */

export interface PathPattern {
  pattern: string;
  regex: RegExp;
  paramNames: string[];
}

export class PathMatcher {
  private patterns: Map<string, PathPattern> = new Map();

  /**
   * Compile a path pattern into a regex for matching
   * Supports parameters like /users/:id and wildcards like /api/*
   */
  compilePattern(path: string): PathPattern {
    if (this.patterns.has(path)) {
      return this.patterns.get(path)!;
    }

    const paramNames: string[] = [];
    let regexPattern = '';
    
    // Split path into segments and process each one
    const segments = path.split('/');
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      
      if (segment === '') {
        // Empty segment (leading slash or double slash)
        if (i === 0 && path.startsWith('/')) {
          regexPattern += '/';
        }
        continue;
      }
      
      // Add slash separator before non-first segments
      if (regexPattern && !regexPattern.endsWith('/')) {
        regexPattern += '/';
      }
      
      if (segment.startsWith(':')) {
        // Parameter segment
        const paramName = segment.slice(1);
        paramNames.push(paramName);
        regexPattern += '([^/]+)';
      } else if (segment === '*') {
        // Wildcard segment
        regexPattern += '(.*)';
      } else {
        // Static segment - escape special regex characters
        const escapedSegment = segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        regexPattern += escapedSegment;
      }
    }

    // Ensure exact match
    regexPattern = `^${regexPattern}$`;

    const pattern: PathPattern = {
      pattern: path,
      regex: new RegExp(regexPattern),
      paramNames
    };

    this.patterns.set(path, pattern);
    return pattern;
  }

  /**
   * Match a request path against a route pattern
   */
  matchPath(routePath: string, requestPath: string): { match: boolean; params: Record<string, string> } {
    const pattern = this.compilePattern(routePath);
    const match = pattern.regex.exec(requestPath);

    if (!match) {
      return { match: false, params: {} };
    }

    const params: Record<string, string> = {};
    
    // Extract parameter values
    for (let i = 0; i < pattern.paramNames.length; i++) {
      const paramName = pattern.paramNames[i];
      const paramValue = match[i + 1];
      if (paramValue !== undefined) {
        params[paramName] = decodeURIComponent(paramValue);
      }
    }

    return { match: true, params };
  }

  /**
   * Check if a path pattern is more specific than another
   * Used for route priority ordering
   */
  isMoreSpecific(pathA: string, pathB: string): boolean {
    // Count static segments vs dynamic segments
    const staticSegmentsA = (pathA.match(/\/[^/:*]+/g) || []).length;
    const staticSegmentsB = (pathB.match(/\/[^/:*]+/g) || []).length;

    if (staticSegmentsA !== staticSegmentsB) {
      return staticSegmentsA > staticSegmentsB;
    }

    // Count parameters
    const paramsA = (pathA.match(/:[^/]+/g) || []).length;
    const paramsB = (pathB.match(/:[^/]+/g) || []).length;

    if (paramsA !== paramsB) {
      return paramsA < paramsB; // Fewer parameters = more specific
    }

    // Count wildcards
    const wildcardsA = (pathA.match(/\*/g) || []).length;
    const wildcardsB = (pathB.match(/\*/g) || []).length;

    if (wildcardsA !== wildcardsB) {
      return wildcardsA < wildcardsB; // Fewer wildcards = more specific
    }

    // Count total segments - shorter paths are more specific when everything else is equal
    const totalSegmentsA = pathA.split('/').filter(s => s.length > 0).length;
    const totalSegmentsB = pathB.split('/').filter(s => s.length > 0).length;

    return totalSegmentsA < totalSegmentsB;
  }

  /**
   * Sort routes by specificity (most specific first)
   */
  sortRoutesBySpecificity<T extends { path: string }>(routes: T[]): T[] {
    return routes.sort((a, b) => {
      if (this.isMoreSpecific(a.path, b.path)) {
        return -1;
      }
      if (this.isMoreSpecific(b.path, a.path)) {
        return 1;
      }
      return 0;
    });
  }

  /**
   * Clear compiled patterns cache
   */
  clearCache(): void {
    this.patterns.clear();
  }
}