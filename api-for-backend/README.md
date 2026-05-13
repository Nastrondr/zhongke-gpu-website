# 移动端 API 对接包

## 目录结构

```
api-for-backend/
├── README.md                          # 本文件
├── mobile-api-documentation.md        # API 接口文档（核心）
├── api/
│   ├── config.js                     # API 配置（环境/基础URL）
│   ├── endpoints.js                  # API 端点定义
│   ├── models.js                     # 数据模型定义
│   ├── ApiClient.js                  # 请求客户端（拦截器/错误处理）
│   └── index.js                      # API 服务统一出口
└── mock-samples/
    ├── devices.js                    # 设备 Mock 数据
    ├── user.js                       # 用户 Mock 数据
    ├── wallet.js                     # 钱包 Mock 数据
    └── tasks.js                      # 任务 Mock 数据
```

## 快速开始

### 1. 查看接口文档
打开 `mobile-api-documentation.md` 查看完整的 API 接口定义。

### 2. 基础配置
- 开发环境 Base URL: `http://localhost:3000/api`
- 认证方式: Bearer Token (JWT)
- 请求格式: JSON

### 3. 必需实现的模块（共 8 个）

| 模块 | 接口数 | 说明 |
|------|--------|------|
| Auth | 6 | 登录/注册/登出/Token刷新/验证码 |
| User | 5 | 资料/权限/绑定状态 |
| Device | 9 | 列表/状态/绑定/解绑/诊断 |
| Model | 4 | 列表/当前/切换/能力 |
| Skill | 4 | 列表/执行/历史/支持状态 |
| Task | 4 | 列表/详情/取消/创建 |
| Wallet | 8 | 余额/收支/充值/记录 |
| Connection | 6 | 列表/添加/移除/重连 |

### 4. 错误码规范

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 2001 | 未授权 |
| 2002 | Token 过期 |
| 3001 | 资源不存在 |
| 4001 | 服务器内部错误 |

## 对接检查清单

- [ ] 实现所有 API 端点
- [ ] 正确返回 JSON 格式
- [ ] 实现 JWT Token 认证
- [ ] 实现 Token 刷新机制
- [ ] 实现 401/403/500 等错误处理
- [ ] 对接后联系前端切换 `ApiConfig.env`

## 联系方式

如有问题，请联系前端开发团队。