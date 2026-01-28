import type { AuthTokens, LoginCredentials } from '../types/auth';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_IN: 'auth_expires_in',
} as const;

interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: any;
}

const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  const decoded = atob(base64);
  return decodeURIComponent(
    decoded.split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join('')
  );
};

const base64UrlEncode = (str: string): string => {
  const base64 = btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const decodeToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
};

const getStorage = (): Storage => {
  if (localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)) {
    return localStorage;
  }
  return sessionStorage;
};

const storeTokens = (tokens: AuthTokens, rememberMe: boolean = false): void => {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
  storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  storage.setItem(STORAGE_KEYS.EXPIRES_IN, tokens.expiresIn.toString());
};

const generateMockToken = (username: string, expiresIn: number): string => {
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
  const signature = 'mock_signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const login = async (credentials: LoginCredentials): Promise<AuthTokens> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockTokens: AuthTokens = {
    accessToken: generateMockToken(credentials.username, 3600),
    refreshToken: generateMockToken(credentials.username, 86400),
    expiresIn: 3600,
  };
  
  storeTokens(mockTokens, credentials.rememberMe);
  return mockTokens;
};

export const logout = (): void => {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.EXPIRES_IN);
  sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  sessionStorage.removeItem(STORAGE_KEYS.EXPIRES_IN);
};

export const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  if (isTokenExpired(refreshToken)) {
    throw new Error('Refresh token has expired');
  }
  
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const payload = decodeToken(refreshToken);
  const username = payload?.sub || 'user';
  const newAccessToken = generateMockToken(username, 3600);
  
  const storage = getStorage();
  storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
  storage.setItem(STORAGE_KEYS.EXPIRES_IN, '3600');
  
  return newAccessToken;
};

export const getAccessToken = (): string | null => {
  return getStorage().getItem(STORAGE_KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = (): string | null => {
  return getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const isAuthenticated = (): boolean => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return false;
  }
  if (isTokenExpired(accessToken)) {
    return false;
  }
  return true;
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = decodeToken(token);
    if (!payload || !payload.exp) {
      return true;
    }
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp <= currentTime + 30;
  } catch (error) {
    return true;
  }
};

export const authService = {
  login,
  logout,
  refreshAccessToken,
  getAccessToken,
  getRefreshToken,
  isAuthenticated,
  isTokenExpired,
};
