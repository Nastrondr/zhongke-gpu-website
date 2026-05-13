/**
 * API 客户端核心
 * 封装 fetch 请求，提供统一的请求/响应拦截器
 */

class ApiClient {
  constructor() {
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };

    // 添加默认请求拦截器
    this.addRequestInterceptor(async (config) => {
      // 添加认证 token
      const token = Storage.get('auth_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }

      // 添加时间戳防止缓存
      if (config.method === 'GET') {
        config.url += (config.url.includes('?') ? '&' : '?') + `_t=${Date.now()}`;
      }

      if (ApiConfig.isLogEnabled()) {
        console.log(`[ApiClient] 请求: ${config.method} ${config.url}`, config);
      }

      return config;
    });

    // 添加默认响应拦截器
    this.addResponseInterceptor(
      // 成功响应
      async (response) => {
        if (ApiConfig.isLogEnabled()) {
          console.log(`[ApiClient] 响应: ${response.status} ${response.url}`);
        }

        // 处理不同的状态码
        if (response.status === 200 || response.status === 201) {
          return response.json();
        }

        // 其他状态码视为错误
        const error = await this.handleErrorResponse(response);
        throw error;
      },
      // 错误响应
      async (error) => {
        if (ApiConfig.isLogEnabled()) {
          console.error(`[ApiClient] 请求错误:`, error);
        }

        // 处理网络错误
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
          throw new ApiError('NETWORK_ERROR', '网络连接失败，请检查网络设置');
        }

        throw error;
      }
    );
  }

  /**
   * 添加请求拦截器
   * @param {Function} interceptor - 拦截器函数
   */
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * 添加响应拦截器
   * @param {Function} onFulfilled - 成功处理
   * @param {Function} onRejected - 失败处理
   */
  addResponseInterceptor(onFulfilled, onRejected) {
    this.responseInterceptors.push({ onFulfilled, onRejected });
  }

  /**
   * 执行请求
   * @param {Object} config - 请求配置
   * @returns {Promise<Object>} 响应数据
   */
  async request(config) {
    // 应用请求拦截器
    let finalConfig = { ...config };
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // 构建 fetch 选项
    const fetchOptions = {
      method: finalConfig.method || 'GET',
      headers: {
        ...this.defaultHeaders,
        ...finalConfig.headers
      },
      mode: 'cors'
    };

    // 添加请求体
    if (finalConfig.body && ['POST', 'PUT', 'PATCH'].includes(finalConfig.method)) {
      fetchOptions.body = typeof finalConfig.body === 'string'
        ? finalConfig.body
        : JSON.stringify(finalConfig.body);
    }

    // 添加超时
    const timeout = finalConfig.timeout || ApiConfig.getTimeout();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    try {
      // 发送请求
      const response = await fetch(finalConfig.url, fetchOptions);
      clearTimeout(timeoutId);

      // 应用响应拦截器
      let result = response;
      for (const interceptor of this.responseInterceptors) {
        try {
          result = await interceptor.onFulfilled(result);
        } catch (error) {
          if (interceptor.onRejected) {
            await interceptor.onRejected(error);
          }
          throw error;
        }
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      // 应用错误拦截器
      for (const interceptor of this.responseInterceptors) {
        if (interceptor.onRejected) {
          try {
            await interceptor.onRejected(error);
          } catch (e) {
            // 忽略拦截器中的错误
          }
        }
      }

      throw error;
    }
  }

  /**
   * 处理错误响应
   * @param {Response} response - 响应对象
   * @returns {Promise<ApiError>}
   */
  async handleErrorResponse(response) {
    let errorMessage = '请求失败';
    let errorCode = 'UNKNOWN_ERROR';

    try {
      const data = await response.json();
      errorMessage = data.message || data.error || errorMessage;
      errorCode = data.code || errorCode;
    } catch (e) {
      // 忽略解析错误
    }

    const error = new ApiError(errorCode, errorMessage);
    error.status = response.status;

    switch (response.status) {
      case 401:
        error.message = '登录已过期，请重新登录';
        this.handleUnauthorized();
        break;
      case 403:
        error.message = '没有权限执行此操作';
        break;
      case 404:
        error.message = '请求的资源不存在';
        break;
      case 500:
        error.message = '服务器内部错误，请稍后重试';
        break;
      case 502:
      case 503:
        error.message = '服务暂时不可用，请稍后重试';
        break;
    }

    return error;
  }

  /**
   * 处理未授权情况
   */
  handleUnauthorized() {
    // 清除登录状态
    Storage.Auth.logout();
    Storage.remove('auth_token');

    // 跳转到登录页
    if (window.location.pathname !== '/index.html') {
      window.location.href = '/index.html';
    }
  }

  /**
   * GET 请求
   * @param {string} url - 请求 URL
   * @param {Object} headers - 请求头
   */
  get(url, headers) {
    return this.request({ url, method: 'GET', headers });
  }

  /**
   * POST 请求
   * @param {string} url - 请求 URL
   * @param {Object} body - 请求体
   * @param {Object} headers - 请求头
   */
  post(url, body, headers) {
    return this.request({ url, method: 'POST', body, headers });
  }

  /**
   * PUT 请求
   * @param {string} url - 请求 URL
   * @param {Object} body - 请求体
   * @param {Object} headers - 请求头
   */
  put(url, body, headers) {
    return this.request({ url, method: 'PUT', body, headers });
  }

  /**
   * DELETE 请求
   * @param {string} url - 请求 URL
   * @param {Object} headers - 请求头
   */
  delete(url, headers) {
    return this.request({ url, method: 'DELETE', headers });
  }
}

/**
 * API 错误类
 */
class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = null;
  }

  toString() {
    return `[${this.code}] ${this.message}`;
  }
}

window.ApiError = ApiError;

// 创建全局 API 客户端实例
window.apiClient = new ApiClient();