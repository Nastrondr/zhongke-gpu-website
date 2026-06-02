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
    async login(loginRequest) {
      const endpoint = ApiEndpoints.auth.login;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      // 登录接口不需要认证，因为还没有 token
      // 但需要 x-app-key header
      return apiClient.post(url, loginRequest, {
        requireAuth: false,
        headers: {
          'x-app-key': 'zkgzy-cms'
        }
      });
    },

    async logout() {
      const endpoint = ApiEndpoints.auth.logout;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url);
    },

    async register(data) {
      const endpoint = ApiEndpoints.auth.register;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      // 注册接口也不需要认证
      return apiClient.post(url, data, {
        requireAuth: false,
        headers: {
          'x-app-key': 'zkgzy-cms'
        }
      });
    },

    async sendCode(data) {
      const endpoint = ApiEndpoints.auth.sendCode;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      // 发送验证码接口不需要认证
      return apiClient.post(url, data, {
        requireAuth: false,
        headers: {
          'x-app-key': 'zkgzy-cms'
        }
      });
    },

    async verifyCode(data) {
      const endpoint = ApiEndpoints.auth.verifyCode;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      // 验证验证码接口不需要认证
      return apiClient.post(url, data, {
        requireAuth: false,
        headers: {
          'x-app-key': 'zkgzy-cms'
        }
      });
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

  // 订单相关
  Order: {
    // 获取用户订单列表
    async listByUser(userId, requestBody) {
      const endpoint = ApiEndpoints.order.listByUser;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { userId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody);
    },

    // 创建订单
    async create(orderData) {
      const endpoint = ApiEndpoints.order.create;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, orderData);
    },

    // 获取订单详情
    async getDetail(orderId) {
      const endpoint = ApiEndpoints.order.detail;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: orderId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    // 取消订单
    async cancel(orderId) {
      const endpoint = ApiEndpoints.order.cancel;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: orderId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.put(url);
    },

    // 支付订单
    async pay(orderId, payChannel = '') {
      const endpoint = ApiEndpoints.order.pay;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: orderId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, { orderId, payChannel });
    }
  },

  // 设备（四象平台 API）
  Device: {
    // 获取用户租用设备列表
    async getList(userId, requestBody) {
      const endpoint = ApiEndpoints.device.list;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { userId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody);
    },

    // 获取设备详情
    async getDetail(deviceId) {
      const endpoint = ApiEndpoints.device.detail;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    // 获取设备状态
    async getStatus(deviceId) {
      const endpoint = ApiEndpoints.device.status;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.get(url);
    },

    // 获取设备事件分页
    async getEvents(deviceId, requestBody) {
      const endpoint = ApiEndpoints.device.events;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody);
    },

    // 获取设备算力消耗分页
    async getTcPage(deviceId, requestBody) {
      const endpoint = ApiEndpoints.device.tc;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody);
    },

    // 设备操作 (doAction)
    async doAction(deviceId, action) {
      const endpoint = ApiEndpoints.device.doAction;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId, action });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, {});
    },

    // 解绑承租用户
    async unbindRentUser(deviceId) {
      const endpoint = ApiEndpoints.device.unbindRentUser;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { id: deviceId });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.delete(url);
    },

    // 绑定承租用户
    async bindRentUser(bindData) {
      const endpoint = ApiEndpoints.device.bindRentUser;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, bindData);
    },

    // 扫码激活设备
    async scanActivate(qrCode) {
      const endpoint = ApiEndpoints.device.scanActivate;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.post(url, { qrCode });
    }
  },

  // 小龙虾设备 OPENCLAW_MANAGER 命令
  OPENCLAW: {
    // 发送命令到小龙虾设备（使用新接口 /manage/api/v1/devices/{id}/iot/capbility/invork）
    async sendChat(deviceId, message, sessionKey = 'agent:main:main', attachments = []) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const deliver = false;
      const chatParams = {
        sessionKey: sessionKey,
        message: message,
        deliver: deliver,
        idempotencyKey: this._generateUUID()
      };

      // 构建附件列表（图片 + 文件）
      if (attachments && attachments.length > 0) {
        chatParams.attachments = attachments.map(att => {
          const item = { content: att.content };
          if (att.type === 'image') {
            item.type = 'image';
            item.mimeType = att.mimeType || 'image/png';
          } else {
            // 文件附件：fileName 对 OOXML 格式至关重要
            if (att.fileName) item.fileName = att.fileName;
            item.mimeType = att.mimeType || 'application/octet-stream';
          }
          return item;
        });
      }

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'chat.send',
              params: chatParams
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sendChat:', { deviceId, message, attachments: attachments.length, deliver });
      console.log('[OpenClawSend] userInput:', message);
      console.log('[OpenClawSend] requestId:', requestBody.Parameter.parameter.data.id);
      console.log('[OpenClawSend] idempotencyKey:', chatParams.idempotencyKey);
      console.log('[OpenClawSend] deliver:', deliver);
      console.log('[OpenClawSend] final payload:', JSON.stringify(requestBody, null, 2));
      return apiClient.post(url, requestBody);
    },

    // 查询WebSocket运行状态
    async queryRunInfo(deviceId) {
      const numericId = Number(deviceId);
      if (!Number.isFinite(numericId)) {
        throw new Error('[OpenClawDeviceId] queryRunInfo deviceId must be numeric, got: ' + deviceId);
      }
      
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', numericId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'queryRunInfo'
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] queryRunInfo:', { deviceId, url });
      console.log('[OpenClawRunInfo] final payload:', JSON.stringify(requestBody, null, 2));
      
      const response = await apiClient.post(url, requestBody, { suppressLoading: true });
      console.log('[OpenClawRunInfo] raw response:', JSON.stringify(response, null, 2));
      return response;
    },

    // 启动WebSocket
    async startWebSocket(deviceId, uri, token) {
      const numericId = Number(deviceId);
      if (!Number.isFinite(numericId)) {
        throw new Error('[OpenClawDeviceId] startWebSocket deviceId must be numeric, got: ' + deviceId);
      }
      
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', numericId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'start',
            uri: uri,
            token: token
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      const maskedToken = token ? token.slice(0, 6) + '...' + token.slice(-4) : 'null';
      console.log('[OPENCLAW] startWebSocket:', { deviceId, uri, token: maskedToken });
      console.log('[OpenClawStartWS] final payload:', JSON.stringify(requestBody, (key, value) => {
        if (key === 'token' && typeof value === 'string') {
          return value.slice(0, 6) + '...' + value.slice(-4);
        }
        return value;
      }, 2));
      
      const response = await apiClient.post(url, requestBody, { suppressLoading: true });
      console.log('[OpenClawStartWS] raw response:', JSON.stringify(response, null, 2));
      return response;
    },

    // 查询设备事件
    async queryEvent(deviceId, tsStart, limit = 10) {
      const numericId = Number(deviceId);
      if (!Number.isFinite(numericId)) {
        throw new Error('[OpenClawDeviceId] queryEvent deviceId must be numeric, got: ' + deviceId);
      }
      
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', numericId);
      const url = ApiEndpoints.buildUrl(path);
      
      console.log('[OpenClawDeviceId] queryEvent final url:', url);
      console.log('[OpenClawDeviceId] queryEvent path deviceId:', numericId);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'queryEvent',
            ts_start: tsStart,
            limit: limit
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] queryEvent:', { deviceId, tsStart, limit, url });
      console.log('[OpenClawQueryEvent] final payload:', JSON.stringify(requestBody, null, 2));
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 停止WebSocket
    async stopWebSocket(deviceId) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'stop'
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] stopWebSocket:', { deviceId, url });
      return apiClient.post(url, requestBody);
    },

    // 查询模型列表
    async listModels(deviceId) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'models.list',
              params: {}
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] listModels:', { deviceId, url });
      return apiClient.post(url, requestBody);
    },

    // 查询技能列表
    async listSkills(deviceId) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'skills.status',
              params: {}
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] listSkills:', { deviceId, url });
      return apiClient.post(url, requestBody);
    },

    // 启用技能
    async enableSkill(deviceId, skillKey) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'skills.enable',
              params: {
                skill: skillKey
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] enableSkill:', { deviceId, skillKey, url });
      return apiClient.post(url, requestBody);
    },

    // 停用技能
    async disableSkill(deviceId, skillKey) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'skills.disable',
              params: {
                skill: skillKey
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] disableSkill:', { deviceId, skillKey, url });
      return apiClient.post(url, requestBody);
    },

    // 切换模型
    async switchModel(deviceId, model) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateUUID(),
              method: 'sessions.patch',
              params: {
                key: 'agent:main:main',
                model: model
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] switchModel:', { deviceId, model, url });
      return apiClient.post(url, requestBody);
    },

    // 删除事件
    async deleteEvent(deviceId, tsStart, tsEnd) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);
      
      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'deleteEvent',
            ts_start: tsStart,
            ts_end: tsEnd
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };
      
      console.log('[OPENCLAW] deleteEvent:', { deviceId, tsStart, tsEnd, url });
      return apiClient.post(url, requestBody);
    },

    // 健康检查
    async healthCheck(deviceId) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('health'),
              method: 'health'
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] healthCheck:', { deviceId });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // ==================== 会话管理 ====================

    // 获取会话列表
    async sessionList(deviceId) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('session-list'),
              method: 'sessions.list'
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionList:', { deviceId });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 获取会话信息
    async sessionGet(deviceId, sessionKey) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('session-get'),
              method: 'sessions.get',
              params: { key: sessionKey }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionGet:', { deviceId, sessionKey });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 获取会话聊天历史
    async sessionGetHistory(deviceId, sessionKey, limit = 200, maxChars = 500000) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('chat-history'),
              method: 'chat.history',
              params: {
                sessionKey: sessionKey,
                limit: limit,
                maxChars: maxChars
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionGetHistory:', { deviceId, sessionKey, limit, maxChars });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 创建新会话
    async sessionCreate(deviceId, key, label, agentId = 'default') {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const sessionLabel = label || (key + '_' + Date.now());

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('session-create'),
              method: 'sessions.create',
              params: {
                key: key,
                label: sessionLabel,
                agentId: agentId
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionCreate:', { deviceId, key, label: sessionLabel, agentId });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 更新会话信息（重命名）
    async sessionPatch(deviceId, sessionKey, updates) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('session-patch'),
              method: 'sessions.patch',
              params: {
                key: sessionKey,
                ...updates
              }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionPatch:', { deviceId, sessionKey, updates });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 删除会话
    async sessionDelete(deviceId, sessionKey) {
      const endpoint = ApiEndpoints.device.openclaw.invork;
      const path = endpoint.path.replace(':id', deviceId);
      const url = ApiEndpoints.buildUrl(path);

      const requestBody = {
        Plugin_Name: 'com.szsbay.kernel',
        RPCMethod: 'Post',
        Parameter: {
          parameter: {
            command: 'command',
            data: {
              type: 'req',
              id: this._generateReqId('session-delete'),
              method: 'sessions.delete',
              params: { key: sessionKey }
            }
          },
          CmdType: 'systemExtend.OPENCLAW_MANAGER'
        },
        expireSeconds: 10,
        ID: 0,
        applicationName: ''
      };

      console.log('[OPENCLAW] sessionDelete:', { deviceId, sessionKey });
      return apiClient.post(url, requestBody, { suppressLoading: true });
    },

    // 生成有意义的请求ID（格式: req-{prefix}-{random4}）
    _generateReqId(prefix) {
      const suffix = Math.random().toString(36).substring(2, 6);
      return 'req-' + prefix + '-' + suffix;
    },

    // 生成UUID
    _generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  },

  // 模型
  Model: {
    async getList() {
      const endpoint = ApiEndpoints.model.list;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getListCas() {
      const endpoint = ApiEndpoints.model.listCas;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      return apiClient.get(url);
    },

    async getCurrent() {
      console.warn('[Api.Model] getCurrent() 不存在对应四象API，模型切换是客户端行为');
      return { success: false, message: '无此接口' };
    },

    async switch(modelId) {
      console.warn('[Api.Model] switch() 不存在对应四象API，模型切换是客户端行为');
      return { success: false, message: '无此接口' };
    },

    async getCapabilities() {
      console.warn('[Api.Model] getCapabilities() 不存在对应四象API');
      return { success: false, message: '无此接口' };
    },

    async getAccessToken(deviceId) {
      const endpoint = ApiEndpoints.model.accessToken;
      const url = ApiEndpoints.buildUrl(endpoint.path);
      const device = Storage.Device.getCurrentDevice();
      const requestBody = {
        deviceId: deviceId || device?.deviceId || 0,
        productId: 0,
        accountId: 0,
        expireTime: '24h'
      };
      return apiClient.post(url, requestBody);
    },

    async streamChat(provider, requestBody) {
      const endpoint = ApiEndpoints.model.stream;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { provider });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody);
    },

    async streamNoThinking(provider, requestBody) {
      const endpoint = ApiEndpoints.model.streamNoThinking;
      const path = ApiEndpoints.replacePathParams(endpoint.path, { provider });
      const url = ApiEndpoints.buildUrl(path);
      return apiClient.post(url, requestBody, { isStream: true });
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