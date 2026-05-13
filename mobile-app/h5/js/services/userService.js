/**
 * userService.js - 用户相关 Service 层
 *
 * 职责：
 * - 整合 Storage.Auth 运行时状态（登录态、用户信息）
 * - 对接真实后端 API 获取权限/绑定状态
 * - 支持 Mock 登录回退（仅开发/测试环境）
 *
 * 页面以后应调用此服务，而不是直接读 mock/user.js 或 Storage.Auth
 */

const UserService = {
  /**
   * 检查用户是否已登录
   * @returns {boolean}
   */
  isLoggedIn() {
    return Storage.Auth.isLoggedIn();
  },

  /**
   * 获取当前登录用户信息
   * @returns {Object|null}
   */
  getCurrentUser() {
    const user = Storage.Auth.getCurrentUser();
    if (user) {
      return {
        id: user.userId || user.id || '',
        username: user.account || user.username || '用户',
        email: user.email || '',
        phone: user.mobile || user.phone || '',
        avatar: user.avatar || '',
        bindStatus: user.bindStatus || 'none',
        accountData: Storage.Auth.getAccountData()
      };
    }
    return null;
  },

  /**
   * 获取用户 profile（不含敏感信息）
   * @returns {Promise<Object>}
   */
  async getUserProfile() {
    console.log('[Profile] request start');
    try {
      const cached = Storage.Auth.getCurrentUser();
      if (cached) {
        const profile = {
          id: cached.userId || cached.id || '',
          username: cached.account || cached.username || '用户',
          email: cached.email || '',
          phone: cached.mobile || cached.phone || '',
          avatar: cached.avatar || '',
          bindStatus: cached.bindStatus || 'none',
          createdAt: cached._creation_date || cached.createdAt || ''
        };
        console.log('[Profile] success (from login cache):', profile);
        return profile;
      }
    } catch (error) {
      console.error('[Profile] failed:', error.message || error);
    }

    return {
      id: '',
      username: '未登录',
      email: '',
      phone: '',
      avatar: '',
      bindStatus: 'none',
      createdAt: ''
    };
  },

  /**
   * 获取用户权限列表
   * @returns {Promise<Object>}
   */
  async getPermissions() {
    try {
      const response = await Api.User.getPermissions();
      if (response && (response.code === '0' || response.success)) {
        return response.data || {};
      }
    } catch (error) {
      console.error('[UserService] API获取权限失败:', error);
    }
    if (window.UserMock) {
      return await window.UserMock.getPermissions();
    }
    return {};
  },

  /**
   * 检查用户是否有指定权限
   * @param {string} permission
   * @returns {boolean}
   */
  async hasPermission(permission) {
    try {
      const permissions = await this.getPermissions();
      if (permissions && permissions[permission] !== undefined) {
        return !!permissions[permission];
      }
    } catch (error) {
      console.error('[UserService] 权限检查失败:', error);
    }
    if (window.UserMock) {
      return window.UserMock.hasPermission(permission);
    }
    return false;
  },

  /**
   * Mock 登录验证（仅开发/测试环境使用）
   * @param {Object} accountData - 账号数据 { username, password }
   * @returns {Object|null} - 匹配成功返回账号信息，否则返回 null
   */
  _mockLoginVerify(accountData) {
    if (!ApiConfig.isMockLoginEnabled()) {
      return null;
    }

    const accounts = window.MOCK_ACCOUNTS || [];
    const found = accounts.find(acc =>
      acc.username === accountData.username && acc.password === accountData.password
    );

    if (found) {
      console.log('[Auth] Mock login verified:', found.username);
      return found;
    }
    return null;
  },

  /**
   * 执行登录（由登录页调用）
   * @param {Object} accountData - 账号完整数据 { username, password }
   * @param {boolean} rememberMe - 是否记住登录
   * @returns {Promise<{success: boolean, message?: string}>}
   */
  async login(accountData, rememberMe = false) {
    console.log('[AuthDebug] login request start');
    console.log('[AuthDebug] account:', accountData.username);
    console.log('[AuthDebug] password:', accountData.password ? '***' : 'EMPTY');

    const loginRequest = {
      loginType: 'mobile_password',
      mobile: accountData.username,
      password: accountData.password
    };

    console.log('[AuthDebug] login request body:', JSON.stringify(loginRequest));

    try {
      const response = await Api.Auth.login(loginRequest);

      console.log('[AuthDebug] login raw response:', JSON.stringify(response, null, 2));
      console.log('[AuthDebug] response.data:', JSON.stringify(response.data, null, 2));
      console.log('[AuthDebug] token candidate fields:', {
        accessToken: response.data?.accessToken,
        token: response.data?.token,
        data_accessToken: response.data?.data?.accessToken,
        app_accessToken: response.data?.application?.accessToken
      });

      if (response.success) {
        const userData = response.data;

        console.log('[AuthDebug] userData keys:', Object.keys(userData || {}));

        let token = userData?.accessToken ||
                     userData?.token ||
                     userData?.data?.accessToken ||
                     userData?.application?.accessToken;
        console.log('[AuthDebug] extracted token:', token ? token.substring(0, 30) + '...' : 'EMPTY');

        if (token) {
          Storage.Auth.setToken(token);
          console.log('[AuthDebug] stored token after login:', Storage.Auth.getToken() ? Storage.Auth.getToken().substring(0, 30) + '...' : 'NULL');
        } else {
          console.warn('[AuthDebug] NO TOKEN FOUND in response.data');
        }

        Storage.Auth.setLoggedIn(true, !rememberMe);
        Storage.Auth.setUser(userData);
        Storage.Auth.setAccountData(accountData);

        console.log('[AuthDebug] final stored token:', Storage.Auth.getToken() ? Storage.Auth.getToken().substring(0, 30) + '...' : 'NULL');
        console.log('[Auth] login success');
        return { success: true, user: userData };
      } else {
        console.log('[Auth] login failed:', response.msg);

        if (ApiConfig.isMockLoginEnabled()) {
          console.log('[Auth] API failed, trying mock login...');
          const mockAccount = this._mockLoginVerify(accountData);

          if (mockAccount) {
            const mockToken = 'mock-token-' + mockAccount.username + '-' + Date.now();
            console.log('[AuthDebug] mock login success, token:', mockToken.substring(0, 30) + '...');
            Storage.Auth.setToken(mockToken);
            console.log('[AuthDebug] stored mock token:', Storage.Auth.getToken().substring(0, 30) + '...');
            Storage.Auth.setLoggedIn(true, !rememberMe);

            const mockUserData = {
              userId: 'mock-user-' + mockAccount.username,
              account: mockAccount.username,
              username: mockAccount.username,
              email: mockAccount.username + '@test.com',
              mobile: '13800138000',
              bindStatus: mockAccount.bindStatus,
              accessToken: mockToken
            };

            Storage.Auth.setUser(mockUserData);
            Storage.Auth.setAccountData({
              ...accountData,
              agentName: mockAccount.agentName,
              deviceLink: mockAccount.deviceLink,
              bindStatus: mockAccount.bindStatus
            });

            console.log('[Auth] mock login success');
            return { success: true, user: mockUserData };
          }
        }

        return { success: false, message: response.msg || '登录失败' };
      }
    } catch (error) {
      console.error('[AuthDebug] login API error:', error.message || error);
      console.error('[AuthDebug] error type:', error.name);
      console.error('[AuthDebug] error code:', error.code);

      if (ApiConfig.isMockLoginEnabled()) {
        console.log('[Auth] API failed, trying mock login...');
        const mockAccount = this._mockLoginVerify(accountData);

        if (mockAccount) {
          const mockToken = 'mock-token-' + mockAccount.username + '-' + Date.now();
          Storage.Auth.setToken(mockToken);
          Storage.Auth.setLoggedIn(true, !rememberMe);

          const mockUserData = {
            userId: 'mock-user-' + mockAccount.username,
            account: mockAccount.username,
            username: mockAccount.username,
            email: mockAccount.username + '@test.com',
            mobile: '13800138000',
            bindStatus: mockAccount.bindStatus,
            accessToken: mockToken
          };

          Storage.Auth.setUser(mockUserData);
          Storage.Auth.setAccountData({
            ...accountData,
            agentName: mockAccount.agentName,
            deviceLink: mockAccount.deviceLink,
            bindStatus: mockAccount.bindStatus
          });

          console.log('[Auth] mock login success');
          return { success: true, user: mockUserData };
        }
      }

      return { success: false, message: error.message || '网络错误，请稍后重试' };
    }
  },

  /**
   * 执行登出
   */
  logout() {
    Storage.Auth.logout();
  },

  /**
   * 获取账号绑定状态
   * @returns {string|null} - none/pending/bound
   */
  getBindStatus() {
    const accountData = Storage.Auth.getAccountData();
    return accountData ? accountData.bindStatus : null;
  }
};

window.UserService = UserService;
