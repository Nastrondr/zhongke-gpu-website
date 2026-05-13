/**
 * API 服务层统一出口
 *
 * 使用方式：
 * <script src="js/services/api/config.js"></script>
 * <script src="js/services/api/endpoints.js"></script>
 * <script src="js/services/api/models.js"></script>
 * <script src="js/services/api/ApiClient.js"></script>
 * <script src="js/services/api/index.js"></script>
 *
 * API 调用示例：
 *
 * // 获取用户信息
 * const user = await Api.User.getProfile();
 *
 * // 获取设备列表
 * const devices = await Api.Device.getList();
 *
 * // 切换模型
 * await Api.Model.switch({ modelId: 'FinBERT' });
 */

const Api = {
  // 认证
  Auth: {
    async login(username, password) {
      const endpoint = ApiEndpoints.auth.login;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { username, password });
    },

    async logout() {
      const endpoint = ApiEndpoints.auth.logout;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url);
    },

    async register(data) {
      const endpoint = ApiEndpoints.auth.register;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    },

    async refreshToken(refreshToken) {
      const endpoint = ApiEndpoints.auth.refreshToken;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { refreshToken });
    }
  },

  // 用户
  User: {
    async getProfile() {
      const endpoint = ApiEndpoints.user.profile;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async updateProfile(data) {
      const endpoint = ApiEndpoints.user.updateProfile;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.put(url, data);
    },

    async getPermissions() {
      const endpoint = ApiEndpoints.user.permissions;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getBindStatus() {
      const endpoint = ApiEndpoints.user.bindStatus;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async bindAccount(data) {
      const endpoint = ApiEndpoints.user.accountBinding;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    }
  },

  // 设备
  Device: {
    async getList() {
      const endpoint = ApiEndpoints.device.list;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getDetail(deviceId) {
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const endpoint = ApiEndpoints.device.detail;
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    async getStatus(deviceId) {
      const endpoint = ApiEndpoints.device.status;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    async bind(data) {
      const endpoint = ApiEndpoints.device.bind;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    },

    async unbind(deviceId) {
      const endpoint = ApiEndpoints.device.unbind;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async bindWithLink(link) {
      const endpoint = ApiEndpoints.device.verifyBindLink;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { link });
    },

    async scan(deviceId) {
      const endpoint = ApiEndpoints.device.scan;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async sync(deviceId) {
      const endpoint = ApiEndpoints.device.sync;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async restart(deviceId) {
      const endpoint = ApiEndpoints.device.restart;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async diagnose(deviceId) {
      const endpoint = ApiEndpoints.device.diagnose;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    }
  },

  // 模型
  Model: {
    async getList() {
      const endpoint = ApiEndpoints.model.list;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getCurrent() {
      const endpoint = ApiEndpoints.model.current;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async switch(modelId) {
      const endpoint = ApiEndpoints.model.switch;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { modelId });
    },

    async getCapabilities() {
      const endpoint = ApiEndpoints.model.capabilities;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    }
  },

  // 技能
  Skill: {
    async getList() {
      const endpoint = ApiEndpoints.skill.list;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async execute(skillId, params) {
      const endpoint = ApiEndpoints.skill.execute;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { skillId, ...params });
    },

    async getHistory(page = 1, pageSize = 20) {
      const endpoint = ApiEndpoints.skill.history;
      const url = ApiEndpoints.buildUrl(endpoint.path) + `?page=${page}&pageSize=${pageSize}`;
      return apiClient.get(url);
    },

    async getSupported() {
      const endpoint = ApiEndpoints.skill.supported;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    }
  },

  // 任务
  Task: {
    async getList(params = {}) {
      const endpoint = ApiEndpoints.task.list;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    },

    async getDetail(taskId) {
      const endpoint = ApiEndpoints.task.detail;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: taskId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    async cancel(taskId) {
      const endpoint = ApiEndpoints.task.cancel;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: taskId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async create(data) {
      const endpoint = ApiEndpoints.task.create;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    }
  },

  // 钱包
  Wallet: {
    async getBalance() {
      const endpoint = ApiEndpoints.wallet.balance;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getOverview() {
      const endpoint = ApiEndpoints.wallet.overview;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getIncomeTrend(params = {}) {
      const endpoint = ApiEndpoints.wallet.incomeTrend;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    },

    async getExpenseTrend(params = {}) {
      const endpoint = ApiEndpoints.wallet.expenseTrend;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    },

    async getExpenseBreakdown(params = {}) {
      const endpoint = ApiEndpoints.wallet.expenseBreakdown;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    },

    async getRecords(params = {}) {
      const endpoint = ApiEndpoints.wallet.records;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    },

    async topup(data) {
      const endpoint = ApiEndpoints.wallet.topup;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    },

    async getTopupRecords(params = {}) {
      const endpoint = ApiEndpoints.wallet.topupRecords;
      const queryString = new URLSearchParams(params).toString();
      const url = ApiEndpoints.buildUrl(endpoint.path) + (queryString ? `?${queryString}` : '');
      return apiClient.get(url);
    }
  },

  // 连接
  Connection: {
    async getList() {
      const endpoint = ApiEndpoints.connection.list;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async add(data) {
      const endpoint = ApiEndpoints.connection.add;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, data);
    },

    async remove(connectionId) {
      const endpoint = ApiEndpoints.connection.remove;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: connectionId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.delete(url);
    },

    async reconnect(connectionId) {
      const endpoint = ApiEndpoints.connection.reconnect;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: connectionId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url);
    },

    async getDataSources() {
      const endpoint = ApiEndpoints.connection.dataSources;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getCapabilities() {
      const endpoint = ApiEndpoints.connection.capabilities;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    }
  }
};

window.Api = Api;