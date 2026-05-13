# OpenClaw Gateway WebSocket 协议速记（用于自建私有 UI）

本文档是基于 OpenClaw 官方文档 `Gateway 网关协议`、TypeBox Schema 源码及本项目实现整理的"开发者速记版"，目的是帮助你在不提供后台管理页面的情况下，直接基于 Gateway WS 协议开发私有化界面。

参考来源：

- 官方协议页：`https://docs.openclaw.ai/zh-CN/gateway/protocol`
- TypeBox 概念：`https://docs.openclaw.ai/concepts/typebox`
- 源码 schema：`https://github.com/openclaw/openclaw/tree/main/src/gateway/protocol/schema/`

***

## 传输层

- **传输**：WebSocket（文本帧，JSON 负载）
- **第一帧必须是** **`connect`** **请求**（但在此之前服务端会先发 `connect.challenge` 事件）
- **负载上限**：
  - 握手成功前：单帧上限 64 KiB
  - 握手成功后：遵循 `hello-ok.policy.maxPayload` 和 `hello-ok.policy.maxBufferedBytes`
  - 过大/缓慢缓冲可能导致服务端发出 `payload.large` 事件后关闭连接或丢弃帧

***

## 帧格式（Frame）

三种帧类型：

### 请求 `req`

```json
{ "type": "req", "id": "uuid-v4", "method": "方法名", "params": { ... } }
```

### 响应 `res`

成功：

```json
{ "type": "res", "id": "uuid-v4", "ok": true, "payload": { ... } }
```

失败：

```json
{
  "type": "res",
  "id": "uuid-v4",
  "ok": false,
  "error": { "code": "ERROR_CODE", "message": "描述信息", "details": {}, "retryable": false, "retryAfterMs": 1000 }
}
```

### 事件 `event`

```json
{ "type": "event", "event": "事件名", "payload": { ... }, "seq": 1, "stateVersion": 1 }
```

> `seq` / `stateVersion` 为可选字段，取决于事件族。

***

## 一、握手（connect）—— 连接建立流程

### 步骤 1：服务端 → 客户端 → `connect.challenge` 事件

连接建立后，Gateway 首帧下发质询 nonce：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "Abc123Xyz...", "ts": 1737264000000 }
}
```

> **重要**：客户端必须等待此事件，拿到 `payload.nonce`，用于后续设备签名。

### 步骤 2：客户端 → 服务端 → `connect` 请求

```json
{
  "type": "req",
  "id": "conn-001",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "webchat-ui",
      "version": "1.0.0",
      "platform": "Windows",
      "mode": "webchat"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "password": "your-gateway-password" },
    "locale": "zh-CN",
    "userAgent": "clawchat/1.0.0",
    "device": {
      "id": "a1b2c3d4e5f6...",
      "publicKey": "base64url-encoded-ed25519-public-key",
      "signature": "base64url-encoded-ed25519-signature",
      "signedAt": 1737264000000,
      "nonce": "Abc123Xyz..."
    }
  }
}
```

#### connect 关键参数说明

| 参数                 | 类型        | 必填 | 说明                                                                  |
| ------------------ | --------- | -- | ------------------------------------------------------------------- |
| `minProtocol`      | number    | 是  | 协议最低版本，固定 `3`                                                       |
| `maxProtocol`      | number    | 是  | 协议最高版本，固定 `3`                                                       |
| `client.id`        | string    | 是  | 客户端标识，私有化 UI 可自定义如 `webchat-ui`                                     |
| `client.version`   | string    | 是  | 客户端版本号                                                              |
| `client.platform`  | string    | 是  | 平台标识：`web` / `Windows` / `macos` / `ios` / `android`                |
| `client.mode`      | string    | 是  | `operator`（控制端）/ `node`（能力宿主）/ `webchat` / `cli` / `backend` / `ui` |
| `role`             | string    | 是  | `operator`（控制平面） / `node`（能力宿主）                                     |
| `scopes`           | string\[] | 是  | operator 权限列表，最小集 `["operator.read", "operator.write"]`             |
| `auth`             | object    | 否  | 鉴权对象，常见字段：`password` / `token` / `deviceToken`                      |
| `device.id`        | string    | 是  | 设备指纹（公钥 SHA-256 的 hex）                                              |
| `device.publicKey` | string    | 是  | Ed25519 公钥，base64url 编码                                             |
| `device.signature` | string    | 是  | 设备签名，base64url 编码                                                   |
| `device.signedAt`  | number    | 是  | 签名时间戳（毫秒）                                                           |
| `device.nonce`     | string    | 是  | 来自 `connect.challenge` 的 nonce                                      |

#### auth 字段说明

```jsonc
// 方式一：使用 password（本项目页面使用的方式）
{ "auth": { "password": "your-gateway-password" } }

// 方式二：使用 token（网关配置的共享令牌）
{ "auth": { "token": "shared-gateway-token" } }

// 方式三：使用 deviceToken（之前握手签发的设备令牌，可免密）
{ "auth": { "deviceToken": "previously-issued-device-token" } }

// 方式四：password + deviceToken 同时发送
{ "auth": { "password": "...", "deviceToken": "..." } }
```

### 步骤 3：服务端 → 客户端 → `hello-ok` 响应

```json
{
  "type": "res",
  "id": "conn-001",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": { "version": "2026.4.19", "connId": "ws-abc123" },
    "features": {
      "methods": ["health", "status", "chat.send", "chat.history", "chat.abort", "sessions.list", "models.list", "..."],
      "events": ["tick", "presence", "health", "chat", "sessions.changed", "..."]
    },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 123456
    },
    "policy": {
      "maxPayload": 26214400,
      "maxBufferedBytes": 52428800,
      "tickIntervalMs": 15000
    },
    "auth": {
      "deviceToken": "new-device-token-hash...",
      "role": "operator",
      "scopes": ["operator.read", "operator.write"]
    }
  }
}
```

> **关键**：`hello-ok.auth.deviceToken` 如果存在，应缓存到本地（localStorage），下次连接时可用它替代 password，实现免密重连。

***

## 二、聊天（Chat）—— 核心对话指令

### 2.1 获取聊天历史 `chat.history`

请求：

```json
{
  "type": "req",
  "id": "req-001",
  "method": "chat.history",
  "params": {
    "sessionKey": "main",
    "limit": 200,
    "maxChars": 500000
  }
}
```

| 参数           | 类型     | 必填 | 说明                     |
| ------------ | ------ | -- | ---------------------- |
| `sessionKey` | string | 是  | 会话标识，默认 `"main"`       |
| `limit`      | number | 否  | 返回条数上限（1\~1000）        |
| `maxChars`   | number | 否  | 单条消息文本最大字符数（1\~500000） |

响应示例：

```json
{
  "type": "res",
  "id": "req-001",
  "ok": true,
  "payload": {
    "messages": [
      {
        "id": "msg-uuid-001",
        "role": "user",
        "message": "你好，帮我看看这张图片",
        "timestamp": 1737264000000
      },
      {
        "id": "msg-uuid-002",
        "role": "assistant",
        "message": "你好！请问你想了解这张图片的什么信息呢？",
        "timestamp": 1737264001000,
        "usage": { "inputTokens": 150, "outputTokens": 80 }
      }
    ]
  }
}
```

> `chat.history` 会对输出做显示规范化：移除内联指令标签、工具调用 XML payload、模型控制令牌等，纯静默行（`NO_REPLY`/`no_reply`）会被省略。

### 2.2 发送文本消息 `chat.send`

请求：

```json
{
  "type": "req",
  "id": "req-002",
  "method": "chat.send",
  "params": {
    "sessionKey": "main",
    "message": "你好，今天天气怎么样？",
    "deliver": false,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

| 参数                     | 类型      | 必填    | 说明                                                  |
| ---------------------- | ------- | ----- | --------------------------------------------------- |
| `sessionKey`           | string  | 是     | 会话标识                                                |
| `message`              | string  | 是     | 消息文本                                                |
| `thinking`             | string  | 否     | thinking 模式（如 `"low"`, `"high"`, `"xhigh"` 等，视模型支持） |
| `deliver`              | boolean | 否     | 是否投递到外部渠道（默认 `false`，仅在 WebChat 可见）                 |
| `attachments`          | array   | 否     | 附件列表（图片等），见下文 2.3                                   |
| `timeoutMs`            | number  | 否     | 超时毫秒数                                               |
| `idempotencyKey`       | string  | **是** | 幂等键，UUID v4，防止重复执行                                  |
| `originatingChannel`   | string  | 否     | 来源渠道标识                                              |
| `originatingTo`        | string  | 否     | 目标地址                                                |
| `originatingAccountId` | string  | 否     | 来源账号                                                |
| `originatingThreadId`  | string  | 否     | 来源线程 ID                                             |

### 2.3 发送带图片的消息 `chat.send`（附件）

图片以 base64 编码的 `attachments` 数组形式发送（依据官方 `logs-chat.ts` Schema + 网关实现 `chat-attachments.ts`）：

```json
{
  "type": "req",
  "id": "req-003",
  "method": "chat.send",
  "params": {
    "sessionKey": "main",
    "message": "请帮我分析这张图片",
    "deliver": false,
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440001",
    "attachments": [
      {
        "type": "image",
        "mimeType": "image/png",
        "content": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      },
      {
        "type": "image",
        "mimeType": "image/jpeg",
        "content": "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGB..."
      }
    ]
  }
}
```

附件字段说明：

| 字段         | 类型     | 必填 | 说明                                            |
| ---------- | ------ | -- | --------------------------------------------- |
| `type`     | string | 是  | 固定 `"image"`                                  |
| `mimeType` | string | 是  | MIME 类型：`image/png`、`image/jpeg`、`image/webp` |
| `content`  | string | 是  | 图片的 base64 编码（不含 `data:image/...;base64,` 前缀） |

> **限制**：
>
> - 单文件最大 5 MB（默认，由 `mediaMaxMb` 控制）
> - 支持格式：PNG、JPEG、WebP（可扩展到 GIF 等）
> - 网关会嗅探 base64 内容验证 MIME 类型，对超大 payload 转为 `media://inbound/<id>` 本地引用

**另一种附件格式**（更底层的 `source` 形式，某些工具链使用）：

```json
{
  "attachments": [
    {
      "source": {
        "type": "base64",
        "media_type": "image/png",
        "data": "iVBORw0KGgo..."
      }
    }
  ]
}
```

### 2.4 停止当前聊天 `chat.abort`

请求：

```json
{
  "type": "req",
  "id": "req-004",
  "method": "chat.abort",
  "params": {
    "sessionKey": "main"
  }
}
```

| 参数           | 类型     | 必填 | 说明                         |
| ------------ | ------ | -- | -------------------------- |
| `sessionKey` | string | 是  | 会话标识                       |
| `runId`      | string | 否  | 指定要中止的 runId，不传则中止当前活跃 run |

> 中止后已产生的部分 assistant 输出会保留在 transcript 中并标记 abort 元数据。

### 2.5 注入助手笔记 `chat.inject`

请求（直接往 transcript 追加一条助手消息，不触发 agent run）：

```json
{
  "type": "req",
  "id": "req-005",
  "method": "chat.inject",
  "params": {
    "sessionKey": "main",
    "message": "系统提示：以上对话已归档到 2026年4月 标签下。",
    "label": "系统归档"
  }
}
```

| 参数           | 类型     | 必填 | 说明            |
| ------------ | ------ | -- | ------------- |
| `sessionKey` | string | 是  | 会话标识          |
| `message`    | string | 是  | 注入的消息内容       |
| `label`      | string | 否  | 标签（最长 100 字符） |

***

## 三、聊天事件（`chat` event）—— 流式更新

发送 `chat.send` 后，Gateway 会通过 `event:"chat"` 推送流式更新：

### 3.1 delta（增量文本）

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "run-uuid-001",
    "sessionKey": "main",
    "seq": 1,
    "state": "delta",
    "message": "今天北京的天气晴，气温 18°C 到 25°C..."
  },
  "seq": 42
}
```

### 3.2 final（完成）

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "run-uuid-001",
    "sessionKey": "main",
    "seq": 15,
    "state": "final",
    "message": "今天北京的天气晴，气温 18°C 到 25°C...（完整文本）",
    "usage": { "inputTokens": 120, "outputTokens": 350, "cost": 0.002 },
    "stopReason": "end_turn"
  },
  "seq": 56
}
```

### 3.3 aborted（中止）

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "run-uuid-001",
    "sessionKey": "main",
    "state": "aborted"
  }
}
```

### 3.4 error（错误）

```json
{
  "type": "event",
  "event": "chat",
  "payload": {
    "runId": "run-uuid-001",
    "sessionKey": "main",
    "state": "error",
    "errorMessage": "模型返回超时",
    "errorKind": "timeout"
  }
}
```

`errorKind` 可能值：

- `"refusal"` — 模型拒绝
- `"timeout"` — 超时
- `"rate_limit"` — 速率限制
- `"context_length"` — 上下文超长
- `"unknown"` — 未知错误

> **UI 实现提示**：
>
> - `delta` 时累积文本并实时渲染
> - `final` / `aborted` / `error` 时结束流式渲染，可选调用 `chat.history` 刷新完整列表
> - `error` 时可展示 `errorMessage` 给用户

***

## 四、系统状态查询

### 4.1 健康检查 `health`

请求：

```json
{ "type": "req", "id": "req-010", "method": "health" }
```

响应：

```json
{
  "type": "res",
  "id": "req-010",
  "ok": true,
  "payload": {
    "ok": true,
    "uptimeMs": 3600000,
    "version": "2026.4.19",
    "sessions": { "active": 3, "total": 12 },
    "models": { "configured": 5, "reachable": 5 }
  }
}
```

### 4.2 状态摘要 `status`

请求：

```json
{ "type": "req", "id": "req-011", "method": "status" }
```

响应（operator 角色可见内容）：

```json
{
  "type": "res",
  "id": "req-011",
  "ok": true,
  "payload": {
    "ok": true,
    "version": "2026.4.19",
    "uptimeMs": 3600000,
    "model": "openai/gpt-4o",
    "contextTokens": 2500,
    "contextLimit": 128000,
    "lastResponseTokens": 350,
    "estimatedCost": 0.002,
    "provider": "openai",
    "apiKeyConfigured": true,
    "channels": {
      "telegram": { "connected": true },
      "discord": { "connected": false }
    },
    "sessions": { "active": 3, "total": 12 }
  }
}
```

### 4.3 在线状态 `system-presence`

请求：

```json
{ "type": "req", "id": "req-012", "method": "system-presence" }
```

响应：

```json
{
  "type": "res",
  "id": "req-012",
  "ok": true,
  "payload": {
    "entries": [
      {
        "deviceId": "a1b2c3d4...",
        "roles": ["operator"],
        "scopes": ["operator.read", "operator.write"],
        "connectedAtMs": 1737264000000,
        "lastSeenMs": 1737264100000,
        "connId": "ws-abc123"
      }
    ]
  }
}
```

***

## 五、模型与用量查询

### 5.1 模型列表 `models.list`

请求：

```json
{ "type": "req", "id": "req-013", "method": "models.list" }
```

响应：

```json
{
  "type": "res",
  "id": "req-013",
  "ok": true,
  "payload": {
    "models": [
      {
        "id": "openai/gpt-4o",
        "provider": "openai",
        "name": "GPT-4o",
        "contextWindow": 128000,
        "maxOutputTokens": 16384,
        "supportsVision": true,
        "supportsTools": true,
        "available": true
      },
      {
        "id": "anthropic/claude-sonnet-4-20250514",
        "provider": "anthropic",
        "name": "Claude Sonnet 4",
        "contextWindow": 200000,
        "maxOutputTokens": 8192,
        "supportsVision": true,
        "supportsTools": true,
        "available": true
      }
    ]
  }
}
```

### 5.2 用量状态 `usage.status`

请求：

```json
{ "type": "req", "id": "req-014", "method": "usage.status" }
```

响应：

```json
{
  "type": "res",
  "id": "req-014",
  "ok": true,
  "payload": {
    "providers": {
      "openai": {
        "totalCost": 2.35,
        "totalTokens": 125000,
        "window": "monthly",
        "limit": 50.0,
        "remaining": 47.65
      },
      "anthropic": {
        "totalCost": 1.80,
        "totalTokens": 98000,
        "window": "monthly",
        "limit": 30.0,
        "remaining": 28.20
      }
    }
  }
}
```

***

## 六、会话管理

### 6.1 会话列表 `sessions.list`

请求：

```json
{ "type": "req", "id": "req-020", "method": "sessions.list" }
```

响应：

```json
{
  "type": "res",
  "id": "req-020",
  "ok": true,
  "payload": {
    "sessions": [
      {
        "key": "main",
        "label": "主会话",
        "agentId": "default",
        "messageCount": 42,
        "lastActivityMs": 1737264000000,
        "active": true
      },
      {
        "key": "work",
        "label": "工作讨论",
        "agentId": "work-agent",
        "messageCount": 15,
        "lastActivityMs": 1737260000000,
        "active": false
      }
    ]
  }
}
```

### 6.2 获取单个会话 `sessions.get`

请求：

```json
{
  "type": "req",
  "id": "req-021",
  "method": "sessions.get",
  "params": { "sessionKey": "main" }
}
```

### 6.3 创建会话 `sessions.create`

请求：

```json
{
  "type": "req",
  "id": "req-022",
  "method": "sessions.create",
  "params": {
    "sessionKey": "new-session",
    "label": "新会话",
    "agentId": "default"
  }
}
```

### 6.4 删除会话 `sessions.delete`

请求：

```json
{
  "type": "req",
  "id": "req-023",
  "method": "sessions.delete",
  "params": { "sessionKey": "old-session" }
}
```

### 6.5 重置会话 `sessions.reset`

请求：

```json
{
  "type": "req",
  "id": "req-024",
  "method": "sessions.reset",
  "params": { "sessionKey": "main" }
}
```

***

## 七、频道状态

### 7.1 频道状态 `channels.status`

请求：

```json
{ "type": "req", "id": "req-030", "method": "channels.status" }
```

响应：

```json
{
  "type": "res",
  "id": "req-030",
  "ok": true,
  "payload": {
    "channels": {
      "telegram": {
        "status": "connected",
        "accountName": "@my_bot",
        "connectedAtMs": 1737264000000
      },
      "discord": {
        "status": "disconnected",
        "reason": "token_revoked"
      },
      "whatsapp": {
        "status": "connected",
        "accountName": "+8613800138000",
        "connectedAtMs": 1737260000000
      }
    }
  }
}
```

### 7.2 渠道登出 `channels.logout`

请求：

```json
{
  "type": "req",
  "id": "req-031",
  "method": "channels.logout",
  "params": { "channel": "telegram" }
}
```

***

## 八、配置管理

### 8.1 获取配置 `config.get`

请求：

```json
{ "type": "req", "id": "req-040", "method": "config.get" }
```

### 8.2 获取配置 Schema `config.schema`

请求：

```json
{ "type": "req", "id": "req-041", "method": "config.schema" }
```

***

## 九、事件流（Events）—— 完整列表

以下事件在握手成功后由服务端主动推送，客户端需按需处理：

| 事件名                                                      | 负载内容                                         | 说明                                   |
| -------------------------------------------------------- | -------------------------------------------- | ------------------------------------ |
| `chat`                                                   | `{ runId, sessionKey, state, message, ... }` | 聊天流式更新，见第三章                          |
| `presence`                                               | `{ entries: [...] }`                         | 在线状态快照（同 `system-presence` 响应）       |
| `health`                                                 | `{ ok, uptimeMs, version, ... }`             | 健康快照更新                               |
| `tick`                                                   | `{ ts: 1737264000000 }`                      | 周期性 keepalive（间隔 = `tickIntervalMs`） |
| `heartbeat`                                              | `{ ... }`                                    | 心跳事件流                                |
| `sessions.changed`                                       | `{ ... }`                                    | 会话索引/元数据变更                           |
| `session.message`                                        | `{ ... }`                                    | 已订阅会话的 transcript 更新                 |
| `session.tool`                                           | `{ ... }`                                    | 已订阅会话的工具事件流                          |
| `shutdown`                                               | `{ reason: "..." }`                          | 网关即将关闭                               |
| `cron`                                                   | `{ ... }`                                    | 定时任务运行/变更事件                          |
| `node.pair.requested` / `node.pair.resolved`             | `{ ... }`                                    | 节点配对生命周期                             |
| `device.pair.requested` / `device.pair.resolved`         | `{ ... }`                                    | 设备配对生命周期                             |
| `exec.approval.requested` / `exec.approval.resolved`     | `{ ... }`                                    | exec 审批生命周期                          |
| `plugin.approval.requested` / `plugin.approval.resolved` | `{ ... }`                                    | 插件审批生命周期                             |

> **作用域过滤**：`chat`、`session.message`、`session.tool` 等事件至少需要 `operator.read` 作用域才会被推送。`tick`、`presence`、`health` 等传输级事件不受限制。

***

## 十、角色与作用域

### 角色

| 角色         | 说明                                    |
| ---------- | ------------------------------------- |
| `operator` | 控制平面客户端（UI/CLI/自动化）                   |
| `node`     | 能力宿主（camera/screen/canvas/system.run） |

### operator 作用域

| 作用域                     | 说明                                           |
| ----------------------- | -------------------------------------------- |
| `operator.read`         | 读取聊天、对话、事件流                                  |
| `operator.write`        | 发送消息、写入操作                                    |
| `operator.admin`        | 管理：config 修改、wizard、update、exec.approvals 管理 |
| `operator.approvals`    | 审批操作                                         |
| `operator.pairing`      | 设备/节点配对管理                                    |
| `operator.talk.secrets` | 读取 Talk/TTS 密钥配置                             |

***

## 十一、私有化 UI 开发注意事项

### 1) Origin 限制

浏览器 WebSocket 携带 `Origin` 头，Gateway 拒绝未允许来源时返回 close code `1008`。

**修复**：在 `openclaw.json` 中添加：

```json5
{
  gateway: {
    controlUi: {
      allowedOrigins: ["http://localhost:3000", "http://127.0.0.1:3000", "https://你的域名"],
    },
  },
}
```

### 2) 认证策略

- **password**：首次连接使用，成功后可缓存下发的 `deviceToken`
- **deviceToken**：来自 `hello-ok.auth.deviceToken`，缓存后可免密重连
- **token**：网关配置的共享令牌
- **敏感信息**：不要写入日志、拼接进 URL、回传到第三方后端

### 3) 设备身份持久化

- 设备私钥（Ed25519）应缓存在 `localStorage`，同一浏览器 profile 下保持稳定
- 丢失私钥 = 新设备 = 需重新配对授权
- 不要跨设备同步私钥

### 4) 幂等键（idempotencyKey）

有副作用的 RPC 方法（`chat.send`、`send`、`sessions.create` 等）需要 `idempotencyKey`：

- 每次调用生成新 UUID v4
- 重试时复用同一个 key，避免重复执行

### 5) 事件顺序与状态一致性

- `seq` 仅在单个连接内单调，不要跨连接假设连续
- 断线重连后，先用 `chat.history` / `sessions.list` 拉快照对齐，再消费新事件

### 6) 流式渲染优化

- 限制单条消息累积大小和渲染频率
- `chat` 事件的 `state:"delta"` 做增量追加，`state:"final"` 做终态处理
- 必要时节流/分批渲染

### 7) 生产环境安全

- 使用 `wss://`（TLS）
- 如果启用证书固定（pinning），提前设计证书更新流程
- 不要暴露 Gateway 端口到公网（建议 SSH 隧道或 Tailscale 转发）

***

## 十二、本项目实现对照

| 功能                                                | 位置                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| WS 客户端（connect/chat.send/chat.history/chat.abort） | [gatewayWsClient.ts](file:///d:/Demo/clawchat/src/lib/openclaw/gatewayWsClient.ts)     |
| 设备身份生成与持久化（Ed25519）                               | [deviceIdentity.ts](file:///d:/Demo/clawchat/src/lib/openclaw/deviceIdentity.ts)       |
| 签名 payload 构建（v2 格式）                              | [deviceAuthPayload.ts](file:///d:/Demo/clawchat/src/lib/openclaw/deviceAuthPayload.ts) |
| deviceToken 缓存                                    | [deviceTokenStore.ts](file:///d:/Demo/clawchat/src/lib/openclaw/deviceTokenStore.ts)   |
| demo 页面（含调试日志面板）                                  | [page.tsx](file:///d:/Demo/clawchat/src/app/page.tsx)                                  |

