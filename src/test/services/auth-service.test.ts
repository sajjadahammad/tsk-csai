import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as authService from '../../services/auth-service';
import type { LoginCredentials } from '../../types/auth';

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('login', () => {
    it('should authenticate user and return tokens', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      const tokens = await authService.login(credentials);

      expect(tokens).toBeDefined();
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.expiresIn).toBe(3600);
    });

    it('should store tokens in sessionStorage when rememberMe is false', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      await authService.login(credentials);

      expect(sessionStorage.getItem('auth_access_token')).toBeDefined();
      expect(sessionStorage.getItem('auth_refresh_token')).toBeDefined();
      expect(sessionStorage.getItem('auth_expires_in')).toBe('3600');
      expect(localStorage.getItem('auth_access_token')).toBeNull();
    });

    it('should store tokens in localStorage when rememberMe is true', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      };

      await authService.login(credentials);

      expect(localStorage.getItem('auth_access_token')).toBeDefined();
      expect(localStorage.getItem('auth_refresh_token')).toBeDefined();
      expect(localStorage.getItem('auth_expires_in')).toBe('3600');
    });

    it('should generate valid JWT tokens', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      const tokens = await authService.login(credentials);

      // JWT should have 3 parts separated by dots
      expect(tokens.accessToken.split('.')).toHaveLength(3);
      expect(tokens.refreshToken.split('.')).toHaveLength(3);
    });

    it('should include username in token payload', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      const tokens = await authService.login(credentials);

      // Decode the token to check payload
      const parts = tokens.accessToken.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      expect(payload.sub).toBe('testuser');
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clear all tokens from localStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      };

      await authService.login(credentials);
      expect(localStorage.getItem('auth_access_token')).toBeDefined();

      authService.logout();

      expect(localStorage.getItem('auth_access_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
      expect(localStorage.getItem('auth_expires_in')).toBeNull();
    });

    it('should clear all tokens from sessionStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      await authService.login(credentials);
      expect(sessionStorage.getItem('auth_access_token')).toBeDefined();

      authService.logout();

      expect(sessionStorage.getItem('auth_access_token')).toBeNull();
      expect(sessionStorage.getItem('auth_refresh_token')).toBeNull();
      expect(sessionStorage.getItem('auth_expires_in')).toBeNull();
    });

    it('should clear tokens from both storages', async () => {
      // Manually set tokens in both storages
      localStorage.setItem('auth_access_token', 'token1');
      sessionStorage.setItem('auth_access_token', 'token2');

      authService.logout();

      expect(localStorage.getItem('auth_access_token')).toBeNull();
      expect(sessionStorage.getItem('auth_access_token')).toBeNull();
    });
  });

  describe('getAccessToken', () => {
    it('should return access token from localStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      };

      const tokens = await authService.login(credentials);
      const retrievedToken = authService.getAccessToken();

      expect(retrievedToken).toBe(tokens.accessToken);
    });

    it('should return access token from sessionStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      const tokens = await authService.login(credentials);
      const retrievedToken = authService.getAccessToken();

      expect(retrievedToken).toBe(tokens.accessToken);
    });

    it('should return null when no token exists', () => {
      const token = authService.getAccessToken();

      expect(token).toBeNull();
    });

    it('should prioritize localStorage over sessionStorage', () => {
      localStorage.setItem('auth_access_token', 'local_token');
      sessionStorage.setItem('auth_access_token', 'session_token');

      const token = authService.getAccessToken();

      expect(token).toBe('local_token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return refresh token from localStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      };

      const tokens = await authService.login(credentials);
      const retrievedToken = authService.getRefreshToken();

      expect(retrievedToken).toBe(tokens.refreshToken);
    });

    it('should return refresh token from sessionStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      const tokens = await authService.login(credentials);
      const retrievedToken = authService.getRefreshToken();

      expect(retrievedToken).toBe(tokens.refreshToken);
    });

    it('should return null when no token exists', () => {
      const token = authService.getRefreshToken();

      expect(token).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when valid access token exists', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      await authService.login(credentials);

      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when no access token exists', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when access token is expired', () => {
      // Create an expired token (exp in the past)
      const expiredToken = createMockToken('testuser', -3600); // Expired 1 hour ago
      localStorage.setItem('auth_access_token', expiredToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return false when access token is about to expire (within 30 seconds)', () => {
      // Create a token that expires in 20 seconds
      const expiringToken = createMockToken('testuser', 20);
      localStorage.setItem('auth_access_token', expiringToken);

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when access token has more than 30 seconds until expiration', () => {
      // Create a token that expires in 60 seconds
      const validToken = createMockToken('testuser', 60);
      localStorage.setItem('auth_access_token', validToken);

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const validToken = createMockToken('testuser', 3600);

      expect(authService.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiredToken = createMockToken('testuser', -3600);

      expect(authService.isTokenExpired(expiredToken)).toBe(true);
    });

    it('should return true for token expiring within 30 seconds', () => {
      const expiringToken = createMockToken('testuser', 20);

      expect(authService.isTokenExpired(expiringToken)).toBe(true);
    });

    it('should return false for token with more than 30 seconds until expiration', () => {
      const validToken = createMockToken('testuser', 60);

      expect(authService.isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(authService.isTokenExpired(malformedToken)).toBe(true);
    });

    it('should return true for token without expiration claim', () => {
      const tokenWithoutExp = createMockTokenWithoutExp('testuser');

      expect(authService.isTokenExpired(tokenWithoutExp)).toBe(true);
    });

    it('should return true for empty token', () => {
      expect(authService.isTokenExpired('')).toBe(true);
    });

    it('should return true for token with invalid base64', () => {
      const invalidToken = 'invalid.!!!.token';

      expect(authService.isTokenExpired(invalidToken)).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token using refresh token', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      const originalTokens = await authService.login(credentials);
      const originalAccessToken = originalTokens.accessToken;

      // Wait a full second to ensure new token has different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      const newAccessToken = await authService.refreshAccessToken();

      expect(newAccessToken).toBeDefined();
      expect(newAccessToken).not.toBe(originalAccessToken);
      expect(authService.getAccessToken()).toBe(newAccessToken);
    });

    it('should throw error when no refresh token exists', async () => {
      await expect(authService.refreshAccessToken()).rejects.toThrow(
        'No refresh token available'
      );
    });

    it('should throw error when refresh token is expired', async () => {
      const expiredRefreshToken = createMockToken('testuser', -3600);
      // Also need to set access token so getStorage() works correctly
      localStorage.setItem('auth_access_token', 'dummy_token');
      localStorage.setItem('auth_refresh_token', expiredRefreshToken);

      await expect(authService.refreshAccessToken()).rejects.toThrow(
        'Refresh token has expired'
      );
    });

    it('should update access token in storage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: true,
      };

      await authService.login(credentials);
      const originalToken = localStorage.getItem('auth_access_token');

      // Wait a full second to ensure new token has different timestamp
      await new Promise(resolve => setTimeout(resolve, 1100));

      await authService.refreshAccessToken();
      const newToken = localStorage.getItem('auth_access_token');

      expect(newToken).not.toBe(originalToken);
      expect(newToken).toBeDefined();
    });

    it('should preserve username in refreshed token', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      await authService.login(credentials);
      const newAccessToken = await authService.refreshAccessToken();

      // Decode the new token
      const parts = newAccessToken.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      expect(payload.sub).toBe('testuser');
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent login calls', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
      };

      const [tokens1, tokens2] = await Promise.all([
        authService.login(credentials),
        authService.login(credentials),
      ]);

      expect(tokens1).toBeDefined();
      expect(tokens2).toBeDefined();
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should handle logout when not authenticated', () => {
      expect(() => authService.logout()).not.toThrow();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should handle token with special characters in username', async () => {
      const credentials: LoginCredentials = {
        username: 'test.user+123@example.com',
        password: 'password123',
      };

      const tokens = await authService.login(credentials);
      const parts = tokens.accessToken.split('.');
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      expect(payload.sub).toBe('test.user+123@example.com');
    });

    it('should handle very long usernames', async () => {
      const longUsername = 'a'.repeat(1000);
      const credentials: LoginCredentials = {
        username: longUsername,
        password: 'password123',
      };

      const tokens = await authService.login(credentials);

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.accessToken.split('.')).toHaveLength(3);
    });

    it('should handle empty username', async () => {
      const credentials: LoginCredentials = {
        username: '',
        password: 'password123',
      };

      const tokens = await authService.login(credentials);

      expect(tokens.accessToken).toBeDefined();
    });

    it('should handle token refresh with sessionStorage', async () => {
      const credentials: LoginCredentials = {
        username: 'testuser',
        password: 'password123',
        rememberMe: false,
      };

      await authService.login(credentials);
      const newToken = await authService.refreshAccessToken();

      expect(sessionStorage.getItem('auth_access_token')).toBe(newToken);
      expect(localStorage.getItem('auth_access_token')).toBeNull();
    });

    it('should handle multiple logout calls', () => {
      authService.logout();
      authService.logout();
      authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('auth_access_token', 'corrupted_data');

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.isTokenExpired('corrupted_data')).toBe(true);
    });
  });

  describe('Token Decoding', () => {
    it('should decode valid JWT token', () => {
      const token = createMockToken('testuser', 3600);

      expect(authService.isTokenExpired(token)).toBe(false);
    });

    it('should handle token with padding', () => {
      // Create a token that requires padding
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ sub: 'test', exp: Math.floor(Date.now() / 1000) + 3600 }));
      const token = `${header}.${payload}.signature`;

      expect(authService.isTokenExpired(token)).toBe(false);
    });

    it('should handle token with URL-safe base64', () => {
      const token = createMockToken('testuser', 3600);
      // Token should use URL-safe base64 (- and _ instead of + and /)
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
    });

    it('should handle token with Unicode characters', async () => {
      const credentials: LoginCredentials = {
        username: '测试用户',
        password: 'password123',
      };

      const tokens = await authService.login(credentials);
      const parts = tokens.accessToken.split('.');
      const payload = JSON.parse(
        decodeURIComponent(
          atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        )
      );

      expect(payload.sub).toBe('测试用户');
    });
  });
});

/**
 * Helper function to create a mock JWT token for testing
 */
function createMockToken(username: string, expiresIn: number): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: username,
    iat: now,
    exp: now + expiresIn,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.mock_signature`;
}

/**
 * Helper function to create a mock JWT token without expiration claim
 */
function createMockTokenWithoutExp(username: string): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    sub: username,
    iat: Math.floor(Date.now() / 1000),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedHeader}.${encodedPayload}.mock_signature`;
}

/**
 * Helper function to encode string to base64 URL format
 */
function base64UrlEncode(str: string): string {
  const base64 = btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
