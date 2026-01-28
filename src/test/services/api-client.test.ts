import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the auth service before importing api-client
vi.mock('../../services/auth-service', () => ({
  getAccessToken: vi.fn(() => null),
  refreshAccessToken: vi.fn(),
  logout: vi.fn(),
}));

// Import the mocked functions
import { getAccessToken, refreshAccessToken, logout } from '../../services/auth-service';

// Mock axios
let mockAxiosInstance: any;
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

describe('API Client', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a callable mock function for the axios instance
    const mockAxiosCall = vi.fn();
    
    mockAxiosInstance = Object.assign(mockAxiosCall, {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn((onFulfilled) => {
            mockAxiosInstance._requestInterceptor = onFulfilled;
            return 0;
          }),
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            mockAxiosInstance._responseInterceptor = onFulfilled;
            mockAxiosInstance._responseErrorInterceptor = onRejected;
            return 0;
          }),
        },
      },
      defaults: {
        headers: {
          common: {} as Record<string, string>,
        },
      },
      _requestInterceptor: null as any,
      _responseInterceptor: null as any,
      _responseErrorInterceptor: null as any,
    });

    // Reset modules to force re-import
    vi.resetModules();
  });

  it('should call axios get method', async () => {
    const { apiClient } = await import('../../services/api-client');
    const mockData = { id: 1, title: 'Test' };
    mockAxiosInstance.get.mockResolvedValue({ data: mockData });

    const result = await apiClient.get('/test');

    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined);
    expect(result).toEqual(mockData);
  });

  it('should call axios post method', async () => {
    const { apiClient } = await import('../../services/api-client');
    const mockData = { id: 1, title: 'Test' };
    const postData = { title: 'New Post' };
    mockAxiosInstance.post.mockResolvedValue({ data: mockData });

    const result = await apiClient.post('/test', postData);

    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', postData, undefined);
    expect(result).toEqual(mockData);
  });

  it('should call axios put method', async () => {
    const { apiClient } = await import('../../services/api-client');
    const mockData = { id: 1, title: 'Updated' };
    const putData = { title: 'Updated Post' };
    mockAxiosInstance.put.mockResolvedValue({ data: mockData });

    const result = await apiClient.put('/test/1', putData);

    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', putData, undefined);
    expect(result).toEqual(mockData);
  });

  it('should call axios patch method', async () => {
    const { apiClient } = await import('../../services/api-client');
    const mockData = { id: 1, title: 'Patched' };
    const patchData = { title: 'Patched Post' };
    mockAxiosInstance.patch.mockResolvedValue({ data: mockData });

    const result = await apiClient.patch('/test/1', patchData);

    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', patchData, undefined);
    expect(result).toEqual(mockData);
  });

  it('should call axios delete method', async () => {
    const { apiClient } = await import('../../services/api-client');
    const mockData = { success: true };
    mockAxiosInstance.delete.mockResolvedValue({ data: mockData });

    const result = await apiClient.delete('/test/1');

    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1', undefined);
    expect(result).toEqual(mockData);
  });

  it('should set auth token', async () => {
    const { apiClient } = await import('../../services/api-client');
    
    apiClient.setAuthToken('test-token');

    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer test-token');
  });

  it('should clear auth token', async () => {
    const { apiClient } = await import('../../services/api-client');
    mockAxiosInstance.defaults.headers.common['Authorization'] = 'Bearer test-token';
    
    apiClient.clearAuthToken();

    expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBeUndefined();
  });

  /**
   * Property-Based Test: JWT Token Attachment
   * 
   * Property 1: JWT Token Attachment
   * **Validates: Requirements 1.2**
   * 
   * This property test verifies that for any API request made through the API_Client
   * when an authentication token exists, the request headers should contain an
   * Authorization header with the Bearer token.
   * 
   * The test runs 100+ iterations with random request configurations to ensure
   * the property holds across all request types and configurations.
   */
  describe('Property-Based Test: JWT Token Attachment', () => {
    it('should attach JWT token to all authenticated requests (100+ iterations)', async () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Generate random token
        const randomToken = `token_${Math.random().toString(36).substring(2, 15)}_${Date.now()}_${i}`;
        
        // Mock authService to return the random token
        vi.mocked(getAccessToken).mockReturnValue(randomToken);
        
        // Import fresh apiClient instance
        const { apiClient, axiosInstance } = await import('../../services/api-client');
        
        // Get the request interceptor function
        const requestInterceptor = mockAxiosInstance._requestInterceptor;
        expect(requestInterceptor).toBeDefined();
        
        // Generate random request configuration
        const requestMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
        const method = requestMethods[Math.floor(Math.random() * requestMethods.length)];
        
        // Generate random URL path
        const paths = ['/users', '/posts', '/comments', '/albums', '/photos', '/todos'];
        const randomPath = paths[Math.floor(Math.random() * paths.length)];
        const randomId = Math.floor(Math.random() * 100) + 1;
        const url = Math.random() > 0.5 ? randomPath : `${randomPath}/${randomId}`;
        
        // Generate random request data for methods that support it
        const requestData = method !== 'get' && method !== 'delete' ? {
          title: `Test ${Math.random().toString(36).substring(7)}`,
          body: `Body ${Math.random().toString(36).substring(7)}`,
          userId: Math.floor(Math.random() * 10) + 1,
        } : undefined;
        
        // Generate random config options
        const config = Math.random() > 0.5 ? {
          timeout: Math.floor(Math.random() * 10000) + 1000,
          headers: {
            'X-Custom-Header': `custom_${Math.random().toString(36).substring(7)}`,
          },
        } : undefined;
        
        // Create a mock config object to pass through the interceptor
        const mockConfig: any = {
          method,
          url,
          headers: config?.headers ? { ...config.headers } : {},
          data: requestData,
        };
        
        // Call the request interceptor
        const interceptedConfig = await requestInterceptor(mockConfig);
        
        // Property: When auth token exists, Authorization header must be present
        expect(interceptedConfig.headers.Authorization).toBeDefined();
        
        // Property: Authorization header must use Bearer scheme
        expect(interceptedConfig.headers.Authorization).toMatch(/^Bearer /);
        
        // Property: Authorization header must contain the exact token
        expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${randomToken}`);
        
        // Property: Request ID header must be added
        expect(interceptedConfig.headers['X-Request-ID']).toBeDefined();
        expect(interceptedConfig.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
        
        // Property: Custom headers should be preserved
        if (config?.headers) {
          Object.keys(config.headers).forEach(key => {
            expect(interceptedConfig.headers[key]).toBe(config.headers[key]);
          });
        }
      }
    });

    it('should not attach Authorization header when no token exists (100+ iterations)', async () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        // Mock authService to return null (no token)
        vi.mocked(getAccessToken).mockReturnValue(null);
        
        // Import apiClient instance
        const { apiClient } = await import('../../services/api-client');
        
        // Generate random request configuration
        const requestMethods = ['get', 'post', 'put', 'patch', 'delete'] as const;
        const method = requestMethods[Math.floor(Math.random() * requestMethods.length)];
        
        const paths = ['/users', '/posts', '/comments'];
        const url = paths[Math.floor(Math.random() * paths.length)];
        
        // Get the request interceptor function
        const requestInterceptor = mockAxiosInstance._requestInterceptor;
        expect(requestInterceptor).toBeDefined();
        
        // Create a mock config object
        const mockConfig: any = {
          method,
          url,
          headers: {},
        };
        
        // Call the request interceptor
        const interceptedConfig = await requestInterceptor(mockConfig);
        
        // Property: When no auth token exists, Authorization header should not be set
        expect(interceptedConfig.headers.Authorization).toBeUndefined();
        
        // Property: Request ID should still be added
        expect(interceptedConfig.headers['X-Request-ID']).toBeDefined();
      }
    });

    it('should handle various token formats and special characters (100+ iterations)', async () => {
      const iterations = 100;
      
      // Generate various token formats
      const tokenGenerators = [
        // JWT-like tokens
        () => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Math.random().toString(36).substring(2)}.${Math.random().toString(36).substring(2)}`,
        // UUID-like tokens
        () => `${Math.random().toString(36).substring(2, 10)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
        // Base64-like tokens
        () => Buffer.from(`token_${Math.random()}_${Date.now()}`).toString('base64'),
        // Simple alphanumeric tokens
        () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        // Tokens with special characters (URL-safe)
        () => `token-${Math.random().toString(36).substring(2)}_${Date.now()}`,
      ];
      
      for (let i = 0; i < iterations; i++) {
        // Generate random token using one of the generators
        const generator = tokenGenerators[i % tokenGenerators.length];
        const randomToken = generator();
        
        // Mock authService to return the random token
        vi.mocked(getAccessToken).mockReturnValue(randomToken);
        
        // Import apiClient instance
        const { apiClient } = await import('../../services/api-client');
        
        // Get the request interceptor
        const requestInterceptor = mockAxiosInstance._requestInterceptor;
        
        // Create mock config
        const mockConfig: any = {
          method: 'get',
          url: '/test',
          headers: {},
        };
        
        // Call the interceptor
        const interceptedConfig = await requestInterceptor(mockConfig);
        
        // Property: Token should be attached regardless of format
        expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${randomToken}`);
        
        // Property: Token should not be modified or encoded
        expect(interceptedConfig.headers.Authorization).toContain(randomToken);
      }
    });

    it('should attach token to requests with various HTTP methods and configurations', async () => {
      const iterations = 120; // Test all combinations
      
      const methods = ['get', 'post', 'put', 'patch', 'delete'];
      const hasConfig = [true, false];
      const hasCustomHeaders = [true, false];
      
      let testIndex = 0;
      
      // Generate all combinations
      for (const method of methods) {
        for (const withConfig of hasConfig) {
          for (const withHeaders of hasCustomHeaders) {
            const token = `token_${testIndex}_${method}`;
            vi.mocked(getAccessToken).mockReturnValue(token);
            
            const { apiClient } = await import('../../services/api-client');
            const requestInterceptor = mockAxiosInstance._requestInterceptor;
            
            const mockConfig: any = {
              method,
              url: `/test/${testIndex}`,
              headers: withHeaders ? { 'X-Custom': 'value' } : {},
            };
            
            // Add data for methods that support it
            if (method !== 'get' && method !== 'delete') {
              mockConfig.data = { test: 'data' };
            }
            
            if (withConfig) {
              mockConfig.timeout = 5000;
            }
            
            const interceptedConfig = await requestInterceptor(mockConfig);
            
            // Property: Token must be attached for all method/config combinations
            expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${token}`);
            
            // Property: Original config should be preserved
            if (withHeaders) {
              expect(interceptedConfig.headers['X-Custom']).toBe('value');
            }
            
            if (withConfig) {
              expect(interceptedConfig.timeout).toBe(5000);
            }
            
            testIndex++;
          }
        }
      }
      
      // Verify we tested all combinations (5 methods × 2 config × 2 headers = 20 combinations)
      expect(testIndex).toBe(20); // 5 * 2 * 2 = 20
      
      // Run additional random iterations to exceed 100
      for (let i = 20; i < iterations; i++) {
        const method = methods[Math.floor(Math.random() * methods.length)];
        const token = `token_${i}_${method}`;
        vi.mocked(getAccessToken).mockReturnValue(token);
        
        const { apiClient } = await import('../../services/api-client');
        const requestInterceptor = mockAxiosInstance._requestInterceptor;
        
        const mockConfig: any = {
          method,
          url: `/test/${i}`,
          headers: {},
        };
        
        const interceptedConfig = await requestInterceptor(mockConfig);
        
        // Property: Token must be attached
        expect(interceptedConfig.headers.Authorization).toBe(`Bearer ${token}`);
        
        testIndex++;
      }
      
      // Verify we tested 100+ iterations
      expect(testIndex).toBeGreaterThanOrEqual(100);
    });
  });

  /**
   * Unit Tests: Token Refresh Flow
   * 
   * **Validates: Requirements 8.2**
   * 
   * These unit tests verify the token refresh flow when a 401 error occurs.
   * The tests cover:
   * - 401 response triggers token refresh
   * - Successful refresh retries original request
   * - Failed refresh clears auth and redirects
   */
  describe('Token Refresh Flow', () => {
    beforeEach(() => {
      // Reset window.location mock
      delete (window as any).location;
      (window as any).location = { href: '' };
    });

    it('should trigger token refresh on 401 response', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      // Mock a 401 error
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          method: 'get',
          url: '/protected-resource',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      // Mock refreshAccessToken to succeed
      vi.mocked(refreshAccessToken).mockResolvedValue('new-access-token');
      
      // Mock the axios instance call to succeed on retry
      mockAxiosInstance.mockResolvedValue({ data: { success: true } });
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      expect(errorInterceptor).toBeDefined();
      
      // Call the error interceptor with 401 error
      await errorInterceptor(error401);
      
      // Verify that refreshAccessToken was called
      expect(refreshAccessToken).toHaveBeenCalled();
    });

    it('should retry original request after successful token refresh', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      const newToken = 'new-access-token-12345';
      
      // Mock a 401 error
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          method: 'get',
          url: '/protected-resource',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      // Mock refreshAccessToken to succeed
      vi.mocked(refreshAccessToken).mockResolvedValue(newToken);
      
      // Mock the axios instance to succeed on retry
      const mockRetryResponse = { data: { id: 1, name: 'Protected Data' } };
      mockAxiosInstance.mockResolvedValue(mockRetryResponse);
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Call the error interceptor
      const result = await errorInterceptor(error401);
      
      // Verify that refreshAccessToken was called
      expect(refreshAccessToken).toHaveBeenCalled();
      
      // Verify that the axios instance was called to retry the request
      expect(mockAxiosInstance).toHaveBeenCalled();
      
      // Verify that the Authorization header was updated with new token
      const retryCall = mockAxiosInstance.mock.calls[0][0];
      expect(retryCall.headers.Authorization).toBe(`Bearer ${newToken}`);
      
      // Verify that _retry flag was set
      expect(retryCall._retry).toBe(true);
      
      // Verify the result is the retry response
      expect(result).toEqual(mockRetryResponse);
    });

    it('should clear auth and redirect on failed token refresh', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      // Mock a 401 error
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          method: 'get',
          url: '/protected-resource',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      // Mock refreshAccessToken to fail
      const refreshError = new Error('Refresh token expired');
      vi.mocked(refreshAccessToken).mockRejectedValue(refreshError);
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Call the error interceptor and expect it to reject
      await expect(errorInterceptor(error401)).rejects.toThrow();
      
      // Verify that refreshAccessToken was called
      expect(refreshAccessToken).toHaveBeenCalled();
      
      // Verify that logout was called to clear auth state
      expect(logout).toHaveBeenCalled();
      
      // Verify that window.location.href was set to redirect to login
      expect(window.location.href).toBe('/login');
    });

    it('should not retry if request already has _retry flag', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      // Clear previous calls
      vi.clearAllMocks();
      
      // Mock a 401 error with _retry flag already set
      const error401 = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: {
          method: 'get',
          url: '/protected-resource',
          headers: {},
          _retry: true, // Already retried
        },
        message: 'Request failed with status code 401',
      };
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Call the error interceptor
      try {
        await errorInterceptor(error401);
      } catch (error) {
        // Expected to reject with formatted error
      }
      
      // Verify that refreshAccessToken was NOT called
      expect(refreshAccessToken).not.toHaveBeenCalled();
      
      // Verify that logout was NOT called
      expect(logout).not.toHaveBeenCalled();
    });

    it('should queue multiple requests during token refresh', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      const newToken = 'new-access-token-queue-test';
      
      // Create multiple 401 errors
      const error1 = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: {
          method: 'get',
          url: '/resource-1',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      const error2 = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: {
          method: 'post',
          url: '/resource-2',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      // Mock refreshAccessToken with a delay to simulate async refresh
      vi.mocked(refreshAccessToken).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(newToken), 100);
        });
      });
      
      // Mock axios instance to succeed on retry
      mockAxiosInstance.mockResolvedValue({ data: { success: true } });
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Trigger both errors simultaneously
      const promise1 = errorInterceptor(error1);
      const promise2 = errorInterceptor(error2);
      
      // Wait for both to complete
      const [result1, result2] = await Promise.all([promise1, promise2]);
      
      // Verify that refreshAccessToken was called only once
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      
      // Verify that both requests were retried
      expect(mockAxiosInstance).toHaveBeenCalledTimes(2);
      
      // Verify both requests have the new token
      const call1 = mockAxiosInstance.mock.calls[0][0];
      const call2 = mockAxiosInstance.mock.calls[1][0];
      
      expect(call1.headers.Authorization).toBe(`Bearer ${newToken}`);
      expect(call2.headers.Authorization).toBe(`Bearer ${newToken}`);
    });

    it('should reject all queued requests if token refresh fails', async () => {
      // Reset modules to get a fresh instance
      vi.resetModules();
      
      const { apiClient } = await import('../../services/api-client');
      
      // Clear all previous mock calls
      vi.clearAllMocks();
      
      // Create multiple 401 errors
      const error1 = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: {
          method: 'get',
          url: '/resource-1',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      const error2 = {
        response: { status: 401, data: { message: 'Unauthorized' } },
        config: {
          method: 'get',
          url: '/resource-2',
          headers: {},
          _retry: false,
        },
        message: 'Request failed with status code 401',
      };
      
      // Mock refreshAccessToken to fail
      const refreshError = new Error('Refresh token expired');
      vi.mocked(refreshAccessToken).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(refreshError), 100);
        });
      });
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Trigger both errors simultaneously
      const promise1 = errorInterceptor(error1);
      const promise2 = errorInterceptor(error2);
      
      // Both should reject
      await expect(promise1).rejects.toThrow();
      await expect(promise2).rejects.toThrow();
      
      // Verify that refreshAccessToken was called only once
      expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      
      // Verify that logout was called
      expect(logout).toHaveBeenCalled();
      
      // Verify redirect to login
      expect(window.location.href).toBe('/login');
    });

    it('should handle non-401 errors without triggering refresh', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      // Mock various non-401 errors
      const errors = [
        {
          response: { status: 400, data: { message: 'Bad Request' } },
          config: { method: 'post', url: '/test', headers: {} },
          message: 'Request failed with status code 400',
        },
        {
          response: { status: 403, data: { message: 'Forbidden' } },
          config: { method: 'get', url: '/test', headers: {} },
          message: 'Request failed with status code 403',
        },
        {
          response: { status: 404, data: { message: 'Not Found' } },
          config: { method: 'get', url: '/test', headers: {} },
          message: 'Request failed with status code 404',
        },
        {
          response: { status: 500, data: { message: 'Internal Server Error' } },
          config: { method: 'get', url: '/test', headers: {} },
          message: 'Request failed with status code 500',
        },
      ];
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      for (const error of errors) {
        // Reset mocks
        vi.clearAllMocks();
        
        // Call the error interceptor
        try {
          await errorInterceptor(error);
        } catch (e) {
          // Expected to reject with formatted error
        }
        
        // Verify that refreshAccessToken was NOT called
        expect(refreshAccessToken).not.toHaveBeenCalled();
        
        // Verify that logout was NOT called
        expect(logout).not.toHaveBeenCalled();
      }
    });

    it('should format error responses correctly', async () => {
      const { apiClient } = await import('../../services/api-client');
      
      // Get the response error interceptor
      const errorInterceptor = mockAxiosInstance._responseErrorInterceptor;
      
      // Test API error with response
      const apiError = {
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Resource not found', code: 'NOT_FOUND' },
        },
        config: { method: 'get', url: '/test', headers: {} },
        message: 'Request failed with status code 404',
      };
      
      try {
        await errorInterceptor(apiError);
      } catch (error: any) {
        expect(error.message).toBe('Resource not found');
        expect(error.status).toBe(404);
        expect(error.statusText).toBe('Not Found');
        expect(error.code).toBe('NOT_FOUND');
      }
      
      // Test network error (no response)
      const networkError = {
        request: {},
        config: { method: 'get', url: '/test', headers: {} },
        message: 'Network Error',
      };
      
      try {
        await errorInterceptor(networkError);
      } catch (error: any) {
        expect(error.message).toBe('Network error. Please check your internet connection.');
        expect(error.code).toBe('NETWORK_ERROR');
      }
      
      // Test unknown error (no request or response)
      const unknownError = {
        config: { method: 'get', url: '/test', headers: {} },
        message: 'Something went wrong',
      };
      
      try {
        await errorInterceptor(unknownError);
      } catch (error: any) {
        expect(error.message).toBe('Something went wrong');
        expect(error.code).toBe('UNKNOWN_ERROR');
      }
    });
  });
});
