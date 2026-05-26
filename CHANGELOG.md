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
