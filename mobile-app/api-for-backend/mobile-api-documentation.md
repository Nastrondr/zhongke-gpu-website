# 移动端 API 接口文档

## 概述

本文档描述移动端与后端服务之间的 API 接口契约。

**基础 URL**：
- 开发环境：`http://localhost:3000/api`
- 测试环境：`https://staging-api.example.com/api`
- 生产环境：`https://api.example.com/api`

**认证方式**：Bearer Token (JWT)

**通用请求头**：
```
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 目录

1. [认证接口](#认证接口-auth)
2. [用户接口](#用户接口-user)
3. [设备接口](#设备接口-device)
4. [模型接口](#模型接口-model)
5. [技能接口](#技能接口-skill)
6. [任务接口](#任务接口-task)
7. [钱包接口](#钱包接口-wallet)
8. [连接接口](#连接接口-connection)

---

## 认证接口 (Auth)

### 登录
```
POST /auth/login
```

**请求体**：
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**：
```json
{
  "code": "0",
  "message": "登录成功",
  "data": {
    "token": "string - JWT token",
    "refreshToken": "string - 刷新token",
    "expiresIn": 7200,
    "user": {
      "id": "string",
      "username": "string",
      "avatar": "string"
    }
  }
}
```

### 登出
```
POST /auth/logout
```

**响应**：
```json
{
  "code": "0",
  "message": "登出成功"
}
```

### 注册
```
POST /auth/register
```

**请求体**：
```json
{
  "username": "string",
  "password": "string",
  "phone": "string",
  "code": "string - 验证码"
}
```

**响应**：
```json
{
  "code": "0",
  "message": "注册成功",
  "data": {
    "token": "string",
    "userId": "string"
  }
}
```

### 刷新 Token
```
POST /auth/refresh
```

**请求体**：
```json
{
  "refreshToken": "string"
}
```

---

## 用户接口 (User)

### 获取用户资料
```
GET /user/profile
```

**响应**：
```json
{
  "code": "0",
  "message": "success",
  "data": {
    "id": "string",
    "username": "string",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "bindStatus": "none|pending|bound",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 更新用户资料
```
PUT /user/profile
```

**请求体**：
```json
{
  "username": "string",
  "avatar": "string"
}
```

### 获取用户权限
```
GET /user/permissions
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "permissions": ["device:bind", "task:create", "wallet:topup"]
  }
}
```

---

## 设备接口 (Device)

### 获取设备列表
```
GET /devices
```

**响应**：
```json
{
  "code": "0",
  "data": [
    {
      "id": "string",
      "name": "数字大脑 01",
      "type": "数字大脑",
      "status": "online|offline|busy|error",
      "isOnline": true,
      "taskStatus": "空闲中",
      "currentModel": "FinBERT",
      "bindTime": "2024-01-01T00:00:00Z",
      "lastSeen": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 获取设备详情
```
GET /devices/:id
```

### 获取设备状态
```
GET /devices/:id/status
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "status": "online",
    "isOnline": true,
    "taskStatus": "空闲中",
    "networkStatus": "strong",
    "lastSeen": "2024-01-01T00:00:00Z"
  }
}
```

### 绑定设备
```
POST /devices/bind
```

**请求体**：
```json
{
  "deviceId": "string",
  "bindCode": "string"
}
```

### 解绑设备
```
POST /devices/:id/unbind
```

### 验证绑定链接
```
POST /devices/verify-bind-link
```

**请求体**：
```json
{
  "link": "string - 设备绑定链接"
}
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "deviceId": "string",
    "deviceName": "string",
    "valid": true
  }
}
```

### 扫描设备
```
POST /devices/:id/scan
```

**响应**：
```json
{
  "code": "0",
  "message": "扫描任务已下发",
  "data": {
    "taskId": "string"
  }
}
```

### 同步设备数据
```
POST /devices/:id/sync
```

### 重启设备服务
```
POST /devices/:id/restart
```

### 诊断设备
```
POST /devices/:id/diagnose
```

---

## 模型接口 (Model)

### 获取模型列表
```
GET /models
```

**响应**：
```json
{
  "code": "0",
  "data": [
    {
      "id": "string",
      "name": "FinBERT",
      "description": "金融理解模型",
      "capabilities": ["文本理解", "情感分析"],
      "status": "available"
    }
  ]
}
```

### 获取当前模型
```
GET /models/current
```

### 切换模型
```
POST /models/switch
```

**请求体**：
```json
{
  "modelId": "string"
}
```

---

## 技能接口 (Skill)

### 获取技能列表
```
GET /skills
```

**响应**：
```json
{
  "code": "0",
  "data": [
    {
      "id": "string",
      "name": "OCR识别",
      "description": "提取图片与扫描件文字",
      "category": "文档类",
      "isSupported": true,
      "icon": "scan"
    }
  ]
}
```

### 执行技能
```
POST /skills/execute
```

**请求体**：
```json
{
  "skillId": "string",
  "params": {}
}
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "taskId": "string",
    "status": "running"
  }
}
```

### 获取执行历史
```
GET /skills/history?page=1&pageSize=20
```

---

## 任务接口 (Task)

### 获取任务列表
```
GET /tasks?status=running&page=1&pageSize=20
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "list": [
      {
        "id": "string",
        "name": "OCR识别任务",
        "type": "ocr",
        "status": "running",
        "progress": 50,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```

### 获取任务详情
```
GET /tasks/:id
```

### 取消任务
```
POST /tasks/:id/cancel
```

---

## 钱包接口 (Wallet)

### 获取余额
```
GET /wallet/balance
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "balance": 10000,
    "unit": "tokens"
  }
}
```

### 获取钱包概览
```
GET /wallet/overview
```

**响应**：
```json
{
  "code": "0",
  "data": {
    "balance": 10000,
    "unit": "tokens",
    "totalIncome": 50000,
    "totalExpense": 40000,
    "todayIncome": 1000,
    "todayExpense": 500
  }
}
```

### 获取收入趋势
```
GET /wallet/income-trend?period=today|week|month
```

### 获取消耗趋势
```
GET /wallet/expense-trend?period=today|week|month
```

### 获取消耗细分
```
GET /wallet/expense-breakdown
```

### 获取钱包记录
```
GET /wallet/records?type=income|expense&page=1&pageSize=20
```

### 充值
```
POST /wallet/topup
```

**请求体**：
```json
{
  "amount": 100,
  "currency": "CNY",
  "paymentMethod": "alipay|wechat|paypal"
}
```

### 获取充值记录
```
GET /wallet/topup-records
```

---

## 连接接口 (Connection)

### 获取连接列表
```
GET /connections
```

**响应**：
```json
{
  "code": "0",
  "data": [
    {
      "id": "string",
      "name": "微信",
      "type": "wechat",
      "status": "connected",
      "lastSyncTime": "2024-01-01T00:00:00Z",
      "permissions": ["消息通知", "文档读取"]
    }
  ]
}
```

### 添加连接
```
POST /connections
```

**请求体**：
```json
{
  "type": "wechat|dingtalk|feishu|email",
  "authCode": "string"
}
```

### 移除连接
```
DELETE /connections/:id
```

### 重新连接
```
POST /connections/:id/reconnect
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 缺少必填参数 |
| 2001 | 未授权 |
| 2002 | Token 过期 |
| 2003 | 无权限 |
| 3001 | 资源不存在 |
| 3002 | 设备不在线 |
| 4001 | 服务器内部错误 |
| 4002 | 服务暂不可用 |

---

## 使用示例

### 1. 在 HTML 中引入
```html
<!-- API 服务层 -->
<script src="js/services/api/config.js"></script>
<script src="js/services/api/endpoints.js"></script>
<script src="js/services/api/models.js"></script>
<script src="js/services/api/ApiClient.js"></script>
<script src="js/services/api/index.js"></script>
```

### 2. 调用 API
```javascript
// 登录
async function login() {
  try {
    const result = await Api.Auth.login('username', 'password');
    console.log('登录成功', result);
  } catch (error) {
    console.error('登录失败', error.message);
  }
}

// 获取设备列表
async function getDevices() {
  try {
    const devices = await Api.Device.getList();
    console.log('设备列表', devices);
  } catch (error) {
    console.error('获取失败', error.message);
  }
}

// 切换模型
async function switchModel(modelId) {
  try {
    await Api.Model.switch(modelId);
    console.log('模型切换成功');
  } catch (error) {
    console.error('切换失败', error.message);
  }
}
```

### 3. 切换环境
```javascript
// 在控制台中可以切换 API 环境
ApiConfig.setEnv('production'); // 切换到生产环境
ApiConfig.setEnv('staging');    // 切换到测试环境
ApiConfig.setEnv('development'); // 切换到开发环境
```