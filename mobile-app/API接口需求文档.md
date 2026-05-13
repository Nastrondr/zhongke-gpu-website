# 中科GPU H5移动端 API 接口需求文档

> 版本：v1.1
> 日期：2025-01-20
> 更新：添加后端新增接口评估

---

## 一、接口现状总览

### 1.1 已对接接口（正常工作）

| 模块 | 接口 | 路径 | 状态 | 说明 |
|------|------|------|------|------|
| 登录 | POST | /open/api/v1/login | ✅ 正常 | 支持用户名密码登录 |
| 设备列表 | POST | /manage/api/v1/devices/endUsers/:userId/rentPage | ✅ 正常 | 分页查询租用设备 |
| 设备详情 | GET | /manage/api/v1/devices/:id | ✅ 正常 | 获取单个设备详情 |
| 设备状态 | GET | /manage/api/v1/devices/:id/status | ✅ 正常 | 获取设备在线状态 |
| 设备事件 | POST | /manage/api/v1/devices/:id/events/page | ✅ 正常 | 分页获取设备事件日志 |
| 设备算力 | POST | /manage/api/v1/devices/:id/tc/page | ✅ 正常 | 分页获取算力消耗记录 |
| 设备操作 | POST | /manage/api/v1/devices/:id/doAction/:action | ✅ 正常 | 执行设备快捷操作 |
| 设备解绑 | DELETE | /manage/api/v1/devices/:id/unbindRentUser | ✅ 正常 | 解绑承租用户 |
| 设备绑定 | POST | /devices/bind | ✅ 正常 | 绑定设备 |
| 扫码激活 | POST | /devices/activate/scan | ✅ 正常 | 扫码激活设备 |
| 模型列表 | GET | /manage/api/v1/ai/model/all | ✅ 正常 | 获取所有AI模型 |
| Token刷新 | POST | /auth/refresh | ⚠️ 待确认 | Token续期接口 |

---

### 1.2 后端新增接口（待前端对接）

| 模块 | 接口 | 路径 | 状态 | 说明 |
|------|------|------|------|------|
| 设备 | IoT调用 | POST /devices/{id}/iot/invork | ⚠️ 待确认 | 后端新增，需确认用途 |
| 设备 | 资产设备 | POST /devices/endUsers/{userId}/assetPage | ⚠️ 待确认 | 与rentPage区别不明 |

---

### 1.3 待后端提供接口（缺失或Mock）

| 优先级 | 模块 | 接口 | 路径 | 状态 | 说明 |
|--------|------|------|------|------|------|
| P0 | 技能 | 技能列表 | GET /skills | ❌ Mock | 需后端提供真实接口 |
| P0 | 技能 | 执行技能 | POST /skills/execute | ❌ Mock | 需后端提供真实接口 |
| P0 | 任务 | 任务列表 | GET /tasks | ❌ Mock | 需后端提供真实接口 |
| P0 | 任务 | 任务详情 | GET /tasks/:id | ❌ Mock | 需后端提供真实接口 |
| P0 | 任务 | 取消任务 | POST /tasks/:id/cancel | ❌ Mock | 需后端提供真实接口 |
| P0 | 钱包 | 钱包概览 | GET /wallet/overview | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 余额查询 | GET /wallet/balance | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 收入趋势 | GET /wallet/income-trend | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 消耗趋势 | GET /wallet/expense-trend | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 消耗细分 | GET /wallet/expense-breakdown | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 钱包记录 | GET /wallet/records | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 充值 | POST /wallet/topup | ❌ 待定 | 钱包功能暂缓 |
| P0 | 钱包 | 充值记录 | GET /wallet/topup-records | ❌ 待定 | 钱包功能暂缓 |
| P0 | 连接 | 连接列表 | GET /connections | ❌ Mock | 需后端提供真实接口 |
| P0 | 连接 | 添加连接 | POST /connections | ❌ Mock | 需后端提供真实接口 |
| P0 | 连接 | 删除连接 | DELETE /connections/:id | ❌ Mock | 需后端提供真实接口 |
| P0 | 连接 | 重连 | POST /connections/:id/reconnect | ❌ Mock | 需后端提供真实接口 |
| P0 | 连接 | 数据源 | GET /connections/data-sources | ❌ Mock | 需后端提供真实接口 |
| P0 | 连接 | 能力列表 | GET /connections/capabilities | ❌ Mock | 需后端提供真实接口 |
| P1 | 用户 | 权限列表 | GET /user/permissions | ⚠️ Mock | 仅开发环境Mock |
| P1 | 用户 | 绑定状态 | GET /user/bind-status | ⚠️ 部分 | 已对接但可能不完整 |
| P1 | 用户 | 账户绑定 | POST /user/account-binding | ⚠️ 部分 | 已对接但可能不完整 |
| P2 | AI对话 | 流式推理 | POST /manage/api/v1/ai/:provider/stream/proxy | ⚠️ 待验证 | 需提供provider列表 |
| P2 | AI对话 | 非思考推理 | POST /manage/api/v1/ai/:provider/stream/nothinking/proxy | ⚠️ 待验证 | 需提供provider列表 |
| P2 | AI对话 | 生成Token | POST /manage/api/v1/ai/accesstoken | ⚠️ 待验证 | AI访问令牌生成 |

---

## 二、详细接口需求

### 2.1 设备模块 - 后端新增接口（待前端对接）

> **状态**：后端已提供接口，前端需对接

#### 2.1.1 设备IoT调用（待确认）
```
POST /manage/api/v1/devices/{id}/iot/invork
```

**⚠️ 待确认**：
- 请求参数格式？
- 返回数据格式？
- 适用场景？
- 与 `doAction` 的区别？

**请求体**：（待后端提供）
```json
{
  // 待确认
}
```

**响应示例**：（待后端提供）
```json
{
  "success": true,
  "data": {
    // 待确认
  }
}
```

#### 2.1.2 资产设备列表（待确认）
```
POST /manage/api/v1/devices/endUsers/{userId}/assetPage
```

**⚠️ 待确认**：
- 与 `rentPage` 的区别？（租用 vs 资产？）
- 返回字段有哪些？
- 适用场景？

**请求体**：（待后端提供）

**响应示例**：（待后端提供）
```json
{
  "success": true,
  "data": {
    // 待确认
  }
}
```

---

### 2.3 技能模块 (Skills) - P0

**当前状态**：完全使用 Mock 数据

**需要后端提供以下接口**：

#### 2.1.1 获取技能列表
```
GET /skills
```

**Query参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 技能分类筛选 |

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "skill_scan_doc",
      "name": "一键扫描",
      "description": "上传或扫描资料，自动识别内容、优化版面并生成 PDF 文件",
      "category": "文档类",
      "status": "ready",
      "icon": "scan",
      "supportedModels": ["FinBERT", "GLM-4-9B-Chat"]
    }
  ]
}
```

#### 2.1.2 执行技能
```
POST /skills/execute
```

**请求体**：
```json
{
  "skillId": "skill_scan_doc",
  "deviceId": "XY-01-A8F3",
  "modelId": "FinBERT",
  "params": {
    "fileId": "file_xxx",
    "options": ["auto_crop", "remove_shadow"]
  }
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "taskId": "task_xxx",
    "status": "running"
  }
}
```

---

### 2.4 任务模块 (Tasks) - P0

**当前状态**：完全使用 Mock 数据

**需要后端提供以下接口**：

#### 2.2.1 获取任务列表
```
GET /tasks
```

**Query参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| status | string | 否 | 状态筛选：running/success/failed |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "list": [
      {
        "id": "task_xxx",
        "name": "一键扫描任务",
        "category": "文档类",
        "source": "skill",
        "sourceName": "一键扫描",
        "status": "success",
        "createTime": "2025-01-20T10:00:00Z",
        "completeTime": "2025-01-20T10:05:00Z",
        "relatedSkillId": "skill_scan_doc",
        "relatedDeviceId": "XY-01-A8F3"
      }
    ]
  }
}
```

#### 2.2.2 获取任务详情
```
GET /tasks/:id
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "id": "task_xxx",
    "name": "一键扫描任务",
    "category": "文档类",
    "source": "skill",
    "status": "success",
    "progress": 100,
    "result": {
      "fileId": "result_file_xxx",
      "fileName": "合同扫描结果.pdf",
      "fileSize": "2.1MB"
    },
    "createTime": "2025-01-20T10:00:00Z",
    "completeTime": "2025-01-20T10:05:00Z"
  }
}
```

#### 2.2.3 取消任务
```
POST /tasks/:id/cancel
```

**响应示例**：
```json
{
  "success": true,
  "message": "任务已取消"
}
```

---

### 2.5 钱包模块 (Wallet) - 待定

> **状态**：钱包功能暂缓，待后续需求确认后补充

**当前状态**：完全使用 Mock 数据

**需要后端提供以下接口**：（暂缓）

#### 2.3.1 获取钱包概览
```
GET /wallet/overview
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "balance": 10000.00,
    "unit": "算力",
    "convert": 0.85,
    "todayIncome": 100.00,
    "todayExpense": 50.00,
    "totalIncome": 5000.00,
    "totalExpense": 3000.00
  }
}
```

#### 2.3.2 获取余额
```
GET /wallet/balance
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "balance": 10000.00,
    "unit": "算力"
  }
}
```

#### 2.3.3 获取收入趋势
```
GET /wallet/income-trend
```

**Query参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 天数，默认7 |

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "date": "2025-01-20", "amount": 100.00 },
    { "date": "2025-01-19", "amount": 80.00 }
  ]
}
```

#### 2.3.4 获取消耗趋势
```
GET /wallet/expense-trend
```

**Query参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| days | number | 否 | 天数，默认7 |

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "date": "2025-01-20", "amount": 50.00 },
    { "date": "2025-01-19", "amount": 30.00 }
  ]
}
```

#### 2.3.5 获取消耗细分
```
GET /wallet/expense-breakdown
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "category": "模型推理", "amount": 200.00, "percentage": 40 },
    { "category": "文档处理", "amount": 150.00, "percentage": 30 }
  ]
}
```

#### 2.3.6 获取钱包记录
```
GET /wallet/records
```

**Query参数**：
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| type | string | 否 | 类型：income/expense |

**响应示例**：
```json
{
  "success": true,
  "data": {
    "total": 100,
    "list": [
      {
        "id": "record_xxx",
        "type": "expense",
        "category": "模型推理",
        "amount": 10.00,
        "balance": 9990.00,
        "createTime": "2025-01-20T10:00:00Z",
        "remark": "FinBERT 推理消耗"
      }
    ]
  }
}
```

#### 2.3.7 充值
```
POST /wallet/topup
```

**请求体**：
```json
{
  "amount": 100.00,
  "paymentMethod": "wechat",
  "orderId": "order_xxx"
}
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "orderId": "order_xxx",
    "qrCode": "weixin://..."
  }
}
```

#### 2.3.8 充值记录
```
GET /wallet/topup-records
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "topup_xxx",
      "amount": 100.00,
      "status": "success",
      "createTime": "2025-01-20T10:00:00Z"
    }
  ]
}
```

---

### 2.7 连接中心模块 (Connections) - P0

**当前状态**：完全使用 Mock 数据

**需要后端提供以下接口**：

#### 2.7.1 获取连接列表
```
GET /connections
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "conn_xxx",
      "name": "金融数据库",
      "type": "database",
      "status": "connected",
      "lastSyncTime": "2025-01-20T10:00:00Z"
    }
  ]
}
```

#### 2.7.2 添加连接
```
POST /connections
```

**请求体**：
```json
{
  "name": "金融数据库",
  "type": "database",
  "config": {
    "host": "db.example.com",
    "port": 3306,
    "database": "finance"
  }
}
```

#### 2.7.3 删除连接
```
DELETE /connections/:id
```

#### 2.7.4 重连
```
POST /connections/:id/reconnect
```

#### 2.7.5 获取数据源列表
```
GET /connections/data-sources
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "id": "ds_xxx", "name": "SQL Server", "type": "database" },
    { "id": "ds_xxx", "name": "MySQL", "type": "database" }
  ]
}
```

#### 2.7.6 获取连接能力
```
GET /connections/capabilities
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "id": "cap_xxx", "name": "数据查询", "description": "支持 SQL 查询" },
    { "id": "cap_xxx", "name": "数据同步", "description": "支持增量同步" }
  ]
}
```

---

### 2.8 用户模块 - P1

#### 2.8.1 获取权限列表
```
GET /user/permissions
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    { "id": "perm_xxx", "name": "设备管理", "code": "device:manage" },
    { "id": "perm_xxx", "name": "技能使用", "code": "skill:use" }
  ]
}
```

#### 2.8.2 获取绑定状态
```
GET /user/bind-status
```

**响应示例**：
```json
{
  "success": true,
  "data": {
    "bindStatus": "bound",
    "deviceLink": "https://xxx.com/bind?code=xxx",
    "boundTime": "2025-01-15T10:00:00Z"
  }
}
```

#### 2.8.3 账户绑定
```
POST /user/account-binding
```

**请求体**：
```json
{
  "bindCode": "xxx"
}
```

---

### 2.9 AI对话模块 - P2（需进一步确认）

#### 2.9.1 获取AI Provider列表
**需求说明**：目前 stream 接口需要 provider 参数（如 deepseek, openai），需后端提供支持的 provider 列表。

#### 2.9.2 AI流式推理
```
POST /manage/api/v1/ai/:provider/stream/proxy
```

**请求体**：
```json
{
  "messages": [
    { "role": "user", "content": "你好" }
  ],
  "deviceId": "XY-01-A8F3",
  "modelId": "FinBERT"
}
```

---

## 三、CORS 配置需求

**问题描述**：前端部署在 `localhost:8081` 或 `0.0.0.0:8081`，调用后端 `test.zhisuancf.cn` 时遇到 CORS 错误。

**错误信息**：
```
Request header field x-app-key is not allowed by Access-Control-Allow-Headers in preflight response
```

**解决方案**：后端需在 CORS 配置中添加 `x-app-key` 到 `Access-Control-Allow-Headers`。

**后端 CORS 配置示例**（Spring Boot）：
```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOrigins(
                "http://localhost:8081",
                "http://localhost:8080",
                "http://192.168.*.*:8081",
                "http://192.168.*.*:8080"
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")  // 或添加 "x-app-key"
            .allowCredentials(true);
    }
}
```

---

## 四、数据字段说明

### 4.1 任务状态枚举
| 状态值 | 说明 |
|--------|------|
| running | 进行中 |
| success | 已完成 |
| failed | 失败 |
| cancelled | 已取消 |

### 4.2 设备状态枚举
| 状态值 | 说明 |
|--------|------|
| online | 在线 |
| offline | 离线 |
| busy | 忙碌 |
| error | 错误 |

### 4.3 设备任务状态枚举
| 状态值 | 说明 |
|--------|------|
| 空闲中 | 设备空闲 |
| 运行中 | 正在执行任务 |
| 文档归档中 | 正在归档文档 |
| 资讯总结中 | 正在总结资讯 |
| 数据同步中 | 正在同步数据 |
| 模型切换中 | 正在切换模型 |

### 4.4 绑定状态枚举
| 状态值 | 说明 |
|--------|------|
| none | 未绑定 |
| pending | 绑定中 |
| bound | 已绑定 |

---

## 五、联系方式

| 角色 | 负责模块 | 说明 |
|------|----------|------|
| 前端 | H5移动端 | 中科GPU H5应用 |
| 后端 | 四象平台API | 设备、模型、AI相关 |
| 后端 | 主系统API | 用户、钱包、任务、连接相关 |

---

## 六、附录

### 6.1 当前 API 基础路径
- 测试环境：`https://www.test.zhisuancf.cn`
- 四象设备API：`/manage/api/v1/devices/`
- 四象AI API：`/manage/api/v1/ai/`

### 6.2 当前支持的 AI Provider
（待后端提供清单）

### 6.3 Mock数据文件位置
- `/h5/js/mock/user.js` - 用户Mock数据
- `/h5/js/mock/wallet.js` - 钱包Mock数据（暂缓）
- `/h5/js/mock/skills.js` - 技能Mock数据
- `/h5/js/mock/tasks.js` - 任务Mock数据
- `/h5/js/mock/models.js` - 模型Mock数据
