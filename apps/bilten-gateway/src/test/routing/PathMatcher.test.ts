/**
 * Unit tests for PathMatcher
 */

import { PathMatcher } from '../../routing/PathMatcher';

describe('PathMatcher', () => {
  let pathMatcher: PathMatcher;

  beforeEach(() => {
    pathMatcher = new PathMatcher();
  });

  describe('compilePattern', () => {
    it('should compile simple static paths', () => {
      const pattern = pathMatcher.compilePattern('/api/users');
      expect(pattern.pattern).toBe('/api/users');
      expect(pattern.paramNames).toEqual([]);
      expect(pattern.regex.test('/api/users')).toBe(true);
      expect(pattern.regex.test('/api/users/123')).toBe(false);
    });

    it('should compile paths with parameters', () => {
      const pattern = pathMatcher.compilePattern('/api/users/:id');
      expect(pattern.pattern).toBe('/api/users/:id');
      expect(pattern.paramNames).toEqual(['id']);
      expect(pattern.regex.test('/api/users/123')).toBe(true);
      expect(pattern.regex.test('/api/users')).toBe(false);
    });

    it('should compile paths with multiple parameters', () => {
      const pattern = pathMatcher.compilePattern('/api/users/:userId/posts/:postId');
      expect(pattern.paramNames).toEqual(['userId', 'postId']);
      expect(pattern.regex.test('/api/users/123/posts/456')).toBe(true);
      expect(pattern.regex.test('/api/users/123/posts')).toBe(false);
    });

    it('should compile paths with wildcards', () => {
      const pattern = pathMatcher.compilePattern('/api/*');
      expect(pattern.regex.test('/api/anything/here')).toBe(true);
      expect(pattern.regex.test('/api/')).toBe(true);
      expect(pattern.regex.test('/other')).toBe(false);
    });

    it('should cache compiled patterns', () => {
      const pattern1 = pathMatcher.compilePattern('/api/users/:id');
      const pattern2 = pathMatcher.compilePattern('/api/users/:id');
      expect(pattern1).toBe(pattern2); // Same object reference
    });
  });

  describe('matchPath', () => {
    it('should match exact static paths', () => {
      const result = pathMatcher.matchPath('/api/users', '/api/users');
      expect(result.match).toBe(true);
      expect(result.params).toEqual({});
    });

    it('should not match different static paths', () => {
      const result = pathMatcher.matchPath('/api/users', '/api/posts');
      expect(result.match).toBe(false);
      expect(result.params).toEqual({});
    });

    it('should match and extract single parameter', () => {
      const result = pathMatcher.matchPath('/api/users/:id', '/api/users/123');
      expect(result.match).toBe(true);
      expect(result.params).toEqual({ id: '123' });
    });

    it('should match and extract multiple parameters', () => {
      const result = pathMatcher.matchPath(
        '/api/users/:userId/posts/:postId',
        '/api/users/123/posts/456'
      );
      expect(result.match).toBe(true);
      expect(result.params).toEqual({ userId: '123', postId: '456' });
    });

    it('should handle URL encoded parameters', () => {
      const result = pathMatcher.matchPath('/api/users/:name', '/api/users/john%20doe');
      expect(result.match).toBe(true);
      expect(result.params).toEqual({ name: 'john doe' });
    });

    it('should match wildcard patterns', () => {
      const result = pathMatcher.matchPath('/api/*', '/api/users/123/posts');
      expect(result.match).toBe(true);
    });

    it('should not match if parameter is missing', () => {
      const result = pathMatcher.matchPath('/api/users/:id', '/api/users');
      expect(result.match).toBe(false);
    });
  });

  describe('isMoreSpecific', () => {
    it('should consider static paths more specific than parameterized paths', () => {
      expect(pathMatcher.isMoreSpecific('/api/users/profile', '/api/users/:id')).toBe(true);
      expect(pathMatcher.isMoreSpecific('/api/users/:id', '/api/users/profile')).toBe(false);
    });

    it('should consider paths with fewer parameters more specific', () => {
      expect(pathMatcher.isMoreSpecific('/api/users/:id', '/api/users/:id/posts/:postId')).toBe(false);
      expect(pathMatcher.isMoreSpecific('/api/users/:id/posts/:postId', '/api/users/:id')).toBe(true);
    });

    it('should consider paths without wildcards more specific', () => {
      expect(pathMatcher.isMoreSpecific('/api/users/:id', '/api/*')).toBe(true);
      expect(pathMatcher.isMoreSpecific('/api/*', '/api/users/:id')).toBe(false);
    });

    it('should handle equal specificity', () => {
      expect(pathMatcher.isMoreSpecific('/api/users/:id', '/api/posts/:id')).toBe(false);
      expect(pathMatcher.isMoreSpecific('/api/posts/:id', '/api/users/:id')).toBe(false);
    });
  });

  describe('sortRoutesBySpecificity', () => {
    it('should sort routes from most specific to least specific', () => {
      const routes = [
        { path: '/api/*' },
        { path: '/api/users/:id' },
        { path: '/api/users/profile' },
        { path: '/api/users/:id/posts/:postId' }
      ];

      const sorted = pathMatcher.sortRoutesBySpecificity(routes);

      expect(sorted.map(r => r.path)).toEqual([
        '/api/users/profile',
        '/api/users/:id/posts/:postId',
        '/api/users/:id',
        '/api/*'
      ]);
    });
  });

  describe('clearCache', () => {
    it('should clear the pattern cache', () => {
      pathMatcher.compilePattern('/api/users/:id');
      expect(pathMatcher['patterns'].size).toBe(1);
      
      pathMatcher.clearCache();
      expect(pathMatcher['patterns'].size).toBe(0);
    });
  });
});