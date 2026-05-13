/**
 * 数据模型/类型定义
 * 为前后端对接提供统一的数据结构参考
 */

const ApiModels = {
  // 用户模型
  User: {
    id: 'string - 用户ID',
    username: 'string - 用户名',
    email: 'string - 邮箱',
    phone: 'string - 手机号',
    avatar: 'string - 头像URL',
    bindStatus: 'string - 绑定状态: none|pending|bound',
    createdAt: 'string - 创建时间 ISO8601',
    updatedAt: 'string - 更新时间 ISO8601'
  },

  // 设备模型
  Device: {
    id: 'string - 设备ID',
    name: 'string - 设备名称',
    type: 'string - 设备类型',
    status: 'string - 状态: online|offline|busy|error',
    isOnline: 'boolean - 是否在线',
    taskStatus: 'string - 当前任务状态',
    currentModel: 'string - 当前使用模型',
    deviceCount: 'number - 设备总数',
    onlineCount: 'number - 在线设备数',
    bindStatus: 'string - 绑定状态: none|pending|bound',
    lastSeen: 'string - 最后在线时间 ISO8601',
    networkStatus: 'string - 网络状态: strong|weak|none',
    skills: 'number - 已配置技能数',
    bindTime: 'string - 绑定时间 ISO8601'
  },

  // 模型模型
  Model: {
    id: 'string - 模型ID',
    name: 'string - 模型名称',
    description: 'string - 模型描述',
    capabilities: 'Array<string> - 支持的能力列表',
    status: 'string - 状态: available|busy|offline',
    isDefault: 'boolean - 是否默认模型'
  },

  // 技能模型
  Skill: {
    id: 'string - 技能ID',
    name: 'string - 技能名称',
    description: 'string - 技能描述',
    category: 'string - 分类',
    isSupported: 'boolean - 当前设备是否支持',
    icon: 'string - 图标名称',
    executeTime: 'string - 执行耗时',
    status: 'string - 状态: idle|running|completed|failed'
  },

  // 任务模型
  Task: {
    id: 'string - 任务ID',
    name: 'string - 任务名称',
    type: 'string - 任务类型',
    status: 'string - 状态: pending|running|completed|failed|cancelled',
    progress: 'number - 进度 0-100',
    createdAt: 'string - 创建时间 ISO8601',
    completedAt: 'string - 完成时间 ISO8601',
    result: 'Object - 任务结果',
    error: 'string - 错误信息'
  },

  // 钱包模型
  Wallet: {
    balance: 'number - 余额',
    unit: 'string - 单位',
    totalIncome: 'number - 总收益',
    totalExpense: 'number - 总消耗',
    todayIncome: 'number - 今日收益',
    todayExpense: 'number - 今日消耗',
    productionBalance: 'number - 生产余额',
    productionBalanceUnit: 'string - 生产单位',
    productionToday: 'number - 今日生产量',
    productionTodayUnit: 'string - 今日生产单位'
  },

  // 钱包记录模型
  WalletRecord: {
    id: 'string - 记录ID',
    type: 'string - 类型: income|expense',
    category: 'string - 分类',
    amount: 'number - 金额',
    unit: 'string - 单位',
    description: 'string - 描述',
    createdAt: 'string - 创建时间 ISO8601'
  },

  // 连接模型
  Connection: {
    id: 'string - 连接ID',
    name: 'string - 连接名称',
    type: 'string - 连接类型: wechat|dingtalk|feishu|email|etc',
    status: 'string - 状态: connected|pending|disconnected',
    lastSyncTime: 'string - 最后同步时间 ISO8601',
    permissions: 'Array<string> - 已授权权限列表',
    icon: 'string - 图标'
  },

  // 数据源模型
  DataSource: {
    id: 'string - 数据源ID',
    name: 'string - 数据源名称',
    type: 'string - 类型: doc|news|cloud|calendar|etc',
    status: 'string - 状态: enabled|disabled',
    itemCount: 'number - 条目数量',
    lastSyncTime: 'string - 最后同步时间 ISO8601'
  },

  // 充值记录模型
  TopupRecord: {
    id: 'string - 记录ID',
    amount: 'number - 充值金额',
    currency: 'string - 货币类型',
    status: 'string - 状态: pending|completed|failed',
    createdAt: 'string - 创建时间 ISO8601',
    completedAt: 'string - 完成时间 ISO8601'
  },

  // 通用 API 响应格式
  ApiResponse: {
    code: 'string - 状态码: 0|错误码',
    message: 'string - 消息',
    data: 'any - 响应数据',
    timestamp: 'number - 时间戳'
  },

  // 分页响应
  PaginatedResponse: {
    list: 'Array - 数据列表',
    total: 'number - 总数',
    page: 'number - 当前页',
    pageSize: 'number - 每页条数',
    hasMore: 'boolean - 是否有更多'
  }
};

window.ApiModels = ApiModels;