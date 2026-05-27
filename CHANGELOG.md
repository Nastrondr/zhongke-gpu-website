# Changelog — device-chat 萤火虫设备对话优化

> 日期：2026-05-27
> 涉及文件：`device-chat.html`、`openclawChatService.js`、`ApiClient.js`、`api/index.js`

---

## 1. Markdown 渲染重构

**问题**：手写正则解析 markdown 在流式渲染中遇到未闭合标记（如 `**`）时，非贪婪匹配会跨区域劫持后续内容，导致文本结构错乱或内容丢失。同时仅支持粗体、行内代码、简单列表，表格等语法不支持。

**改动**：
- 引入 `marked` 库（v12.0.2，35KB），放在 `js/lib/marked.min.js`，零外部依赖
- `renderAssistantMarkdown()` 从 140 行手写正则简化为 `marked.parse(text)`
- CSS 选择器从自定义 class（`.md-table` 等）改为匹配 `marked` 原生输出标签（`table`、`h1`、`blockquote` 等），作用域限定在 `.message-bubble` 内
- 新增深色模式下表格、代码块的配色覆盖

**意义**：流式渲染安全，覆盖全部 CommonMark 语法（表格、嵌套列表、代码块、引用、转义字符等），不再需要逐个修复正则边界 case。

---

## 2. 发送消息后 runId 提取修复

**问题**：`sendChat` API 返回的 `runId` 位于 `data.data.rows[0].payload.runId`，但 `_extractRunIdFromSendResponse` 的候选路径列表中没有 `rows` 相关路径，导致 runId 提取失败。后果是 `awaitingRunId` 持续为 `true`，轮询返回的所有 assistant 事件被过滤丢弃，UI 卡在"正在发送指令..."直到超时。

**改动**：在 `_extractRunIdFromSendResponse` 候选列表增加 5 条 `rows` 路径：
- `response.data.data.rows[0].payload.runId`
- `response.data.data.data.rows[0].payload.runId`
- `response.data.rows[0].payload.runId`
- `response.data.data.rows.find(r => r.payload.runId)?.payload.runId`（兜底）
- `response.data.data.data.rows.find(r => r.payload.runId)?.payload.runId`（兜底）

**意义**：`sendChat` 返回后 runId 正确绑定到 `currentTurn.acceptedRunIds`，`awaitingRunId` 正常翻为 `false`，轮询事件不再被误丢弃。

---

## 3. 轮询提前终止修复

**问题**：两个超时机制导致轮询在收到 `chat_final`（`state: "final"`）之前就提前结束：

| 机制 | 原值 | 问题 |
|------|------|------|
| `maxInactivityTime` | 5 秒 | LLM 生成长回复时 token 间隔可能超过 5s，误判为流结束 |
| 无活动判定条件 | 仅靠实时时钟 | 单次网络抖动导致 1 轮零事件即触发，没有容错 |

**改动**：
- `maxInactivityTime` 从 `5000` → `30000`（30 秒）
- 无活动判定增加 `&& state.zeroRowsCount >= 3` 条件：连续 3 轮轮询都返回 0 条事件才触发

**意义**：轮询现在只有三种终止路径：(1) 收到匹配 runId 的 `chat_final`；(2) 10 分钟硬超时；(3) 30 秒静默 + 连续 3 轮零事件。不再因短暂静默或网络抖动提前中断。

---

## 4. 轮询期间 Loading Toast 抑制

**问题**：`ApiClient` 的请求拦截器对每个 HTTP 请求都会显示"加载中..." toast。活跃轮询期间每秒调用 `queryEvent`，导致 toast 反复闪烁。

**改动**：
- `ApiClient.js` 请求拦截器新增 `suppressLoading` 检查，标记为 `true` 的请求跳过 loading toast
- `api/index.js` 中 `queryEvent`、`queryRunInfo`、`startWebSocket` 三个后台请求均传入 `{ suppressLoading: true }`

**意义**：轮询请求不再触发全局 loading 提示，用户在对话过程中不会看到反复弹出的 toast。

---

## 5. Lifecycle 阶段 UI 优化

**问题**：收到 `lifecycleStart` 后显示"萤火虫正在分析问题..."属于无意义的 loading 文字。

**改动**：`onLifecycleStart` 回调改为更新为**空字符串 + `status: 'streaming'`**，第一个 token 到达后直接渲染内容。

**意义**：发送消息后的体验变为：短暂"正在发送指令..." → lifecycleStart 后静默等待 → LLM 吐出第一个字时内容直接出现。

---

## 6. 快捷指令"新的会话"

**问题**：原"管理会话"按钮跳转到独立页面，与设备对话流程割裂。

**改动**：替换为"新的会话"按钮，点击后调用 `handleSend('/new')`，复用完整发送链路向设备端发送 `/new` 指令。

**意义**：新建会话通过设备端协议完成，不依赖客户端本地清理逻辑，确保服务端和客户端会话状态一致。

---

# Changelog — 会话管理 & 架构重构

> 日期：2026-05-27
> 涉及文件：`api/index.js`、`openclawChatService.js`、`device-chat.html`、`css/device-chat.css` (新)、`js/pages/device-chat.js` (新)

---

## 7. OpenClaw 会话管理 API 封装

**问题**：之前没有对设备端 session 的 CRUD 能力，无法查询历史、切换会话。

**改动**（`api/index.js`）：
- `sessionList(deviceId)` — 获取全部 session 列表（`sessions.list`）
- `sessionGet(deviceId, sessionKey)` — 获取单个 session 信息（`sessions.get`）
- `sessionGetHistory(deviceId, sessionKey, limit, maxChars)` — 获取聊天历史（`chat.history`）
- `sessionCreate(deviceId, key, label, agentId)` — 创建 session，label 默认 `key_timestamp`
- `sessionDelete(deviceId, sessionKey)` — 删除 session（`sessions.delete`）
- `healthCheck(deviceId)` — 健康检查（`health`），返回 `payload.ok` + sessions/agents/heartbeat 状态
- `_generateReqId(prefix)` — 有意义的请求 ID（`req-session-list-a3f2`），替代纯 UUID 便于调试

**意义**：完整的 session 生命周期管理能力，为多会话切换和历史加载提供基础。

---

## 8. 空闲轮询策略调整：queryEvent → healthCheck

**问题**：idle 模式下每 10s 调 `queryEvent` 查询事件，但没发消息时不会有新事件，纯浪费请求。真正的需求是探活。

**改动**（`openclawChatService.js`）：
- `idleInterval` 从 10s → 30s
- `_doPoll()` idle 分支：不再调用 `queryEvent`，改为调用 `_checkOpenClawHealth()`
- `_checkOpenClawHealth()` 调 `healthCheck` API，验证 `payload.ok === true`，结果缓存到 `_wsStatusCache.healthPayload`

**三段式策略更新**：

| 模式 | 间隔 | 动作 |
|------|------|------|
| recovery | 1s | `queryEvent` 补齐历史 |
| idle | 30s | `healthCheck` 探活 |
| active | 1s | `queryEvent` 监听流式事件 |

**意义**：不发消息时零 `queryEvent` 调用，30s 一次轻量 healthCheck 保活同时更新 sessions/agents 信息。

---

## 9. 发送前双重就绪检查（WS + OpenClaw）

**问题**：原来 `_ensureWebSocketReady` 只检查 WS 连接状态（`queryRunInfo`→`_isWebSocketReady`），WS 通不代表 OpenClaw 服务真正可用。

**改动**（`openclawChatService.js`）：
- `_ensureWebSocketReady` 改为两步：① WS 连接检查（`queryRunInfo`）→ ② OpenClaw 健康检查（`healthCheck` → `payload.ok`）
- 缓存命中时：`openclawOk === false` 会重新调 healthCheck，确保过期的不可用状态被刷新
- `_wsStatusCache` 扩充 `openclawOk`、`healthPayload` 字段

**意义**：发送消息前确保整个链路（WS 通道 + OpenClaw 服务）都就绪，避免发出去后才发现服务不可用。

---

## 10. 用户专属 Session 隔离

**问题**：之前 sessionKey 硬编码为 `'agent:main:main'`，多用户共用同一 session，消息混乱。

**改动**：
- `_activeSessionKey` 字段统一管理当前用户的 session key
- `resolveSessionKey(deviceId)` 方法（`openclawChatService.js`）：
  - 从 `Storage.Auth.getCurrentUser().mobile` 提取手机号后 6 位
  - key 规则：`agent:main:mobile-{phoneLast6}`
  - 调 `sessionList` 查找匹配 key → 找到则复用，否则调 `sessionCreate` 创建
  - 异常时兜底 `agent:main:mobile-{timestamp}`
- `sendMessageAndWait` 中 `currentTurn.sessionKey` 和 `sendChatMessage` 调用全部改用 `this._activeSessionKey`
- `device-chat.html` init 中先调 `resolveSessionKey`，再 `startPolling`，最后 `loadSessionHistory`
- 删除页面局部变量 `currentSessionKey`，所有 sessionKey 由 Service 统一管理

**意义**：不同用户自动使用独立 session（如 `agent:main:mobile-169367`），互不干扰。后续扩展多 session 切换只需改 key 来源。

---

## 11. 进入设备页自动加载历史消息

**问题**：之前进入设备页是空白聊天，看不到之前的对话记录。

**改动**：
- `loadSessionHistory(deviceId, sessionKey)`（`openclawChatService.js`）：调 `sessionGetHistory` API，返回 `[{ role, text, timestamp }]`
- 渲染逻辑（`device-chat.html` init）：遍历历史消息，`user` → `addUserMessage()`，`assistant` → `addAssistantMessage()`
- 只取 `content` 中 `type === 'text'` 的内容，跳过 `type: 'thinking'`

**意义**：用户进入设备页直接看到上次的对话历史，体验连续。

---

## 12. device-chat.html 文件拆解

**问题**：`device-chat.html` 2772 行，CSS / HTML / JS 全部混在一个文件，可维护性差。

**改动**：

| 拆分前 | 拆分后 | 行数 |
|--------|--------|------|
| 内联 `<style>` 块 | `css/device-chat.css` | 1099 |
| 内联 `<script>` 块 | `js/pages/device-chat.js` | 1464 |
| HTML 模板 + 外部引用 | `device-chat.html` | **208** |

**注意事项**：
- JS 以普通脚本加载（非 `type="module"`），保持全局作用域兼容 HTML `onclick` 属性
- 新增 `js/pages/` 目录，为后续其他页面的 JS 提取建立模式
- 加载顺序不变：theme-variables.css → device-chat.css → 依赖脚本 → device-chat.js
