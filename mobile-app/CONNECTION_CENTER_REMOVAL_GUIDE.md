# 连接中心页面 - 移除外部应用连接与假数据替换指南

## 一、任务概述

本指南详细记录了如何从连接中心页面移除微信、飞书等外部应用连接功能，并将假数据替换为"功能开发中"占位提示文案的完整流程。

---

## 二、改动内容清单

### 2.1 移除的功能

| 移除项 | 说明 | 影响位置 |
|--------|------|----------|
| 微信连接卡片 | 微信应用连接入口 | `.app-item.wechat` |
| 飞书连接卡片 | 飞书应用连接入口 | `.app-item.feishu` |
| 添加连接按钮 | 顶部"添加连接"操作按钮 | `.add-btn` |
| 微信/飞书图标样式 | 应用图标CSS样式定义 | `.app-icon.wechat`、`.app-icon.feishu` |

### 2.2 添加的占位提示

| 位置 | 文案内容 | 图标颜色 |
|------|----------|----------|
| 应用连接区域 | 暂无外部应用连接 / 您可以直接在本平台使用小龙虾的全部功能 | 灰色 (#9ca3af) |
| 数据源区域 | 功能开发中 / 数据源管理功能正在开发，敬请期待 | 橙色 (#f59e0b) |
| 设备能力区域 | 功能开发中 / 设备能力功能正在开发，敬请期待 | 橙色 (#f59e0b) |

---

## 三、详细操作步骤

### 步骤1：移除添加连接按钮

**修改文件**: `firefly-mobile/connection-center.html`

```html
<!-- 移除前 -->
<div class="nav-header">
  <a href="device.html" class="back-btn">...</a>
  <div class="nav-title">
    <h1>连接中心</h1>
  </div>
  <button class="add-btn">
    <svg>...</svg>
    添加连接
  </button>
</div>

<!-- 移除后 -->
<div class="nav-header">
  <a href="device.html" class="back-btn">...</a>
  <div class="nav-title">
    <h1>连接中心</h1>
  </div>
  <!-- 移除 add-btn -->
</div>
```

### 步骤2：移除应用连接卡片（微信、飞书）

**修改文件**: `firefly-mobile/connection-center.html`

```html
<!-- 移除前 - app-list 包含微信、飞书等应用卡片 -->
<div class="section">
  <div class="section-title">应用连接</div>
  <div class="app-list">
    <div class="app-item">
      <div class="app-icon wechat"></div>
      <div class="app-info">...</div>
    </div>
    <div class="app-item">
      <div class="app-icon feishu"></div>
      <div class="app-info">...</div>
    </div>
  </div>
</div>

<!-- 移除后 - 替换为占位提示 -->
<div class="section">
  <div class="section-title">应用连接</div>
  <div class="app-list" style="padding: 40px 20px;">
    <div style="text-align: center;">
      <div style="width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: rgba(156, 163, 175, 0.1); display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" fill="none" style="width: 32px; height: 32px; color: #9ca3af;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">暂无外部应用连接</div>
      <div style="font-size: 12px; color: var(--text-tertiary);">您可以直接在本平台使用小龙虾的全部功能</div>
    </div>
  </div>
</div>
```

### 步骤3：替换数据源区域假数据

**修改文件**: `firefly-mobile/connection-center.html`

```html
<!-- 替换前 - 包含假数据卡片 -->
<div class="section">
  <div class="section-title">数据源</div>
  <div class="data-source-list">
    <div class="data-source-item">...</div>
    <div class="data-source-item">...</div>
  </div>
</div>

<!-- 替换后 - 功能开发中占位 -->
<div class="section">
  <div class="section-title">数据源</div>
  <div class="data-source-list" style="padding: 40px 20px;">
    <div style="text-align: center;">
      <div style="width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" fill="none" style="width: 32px; height: 32px; color: #f59e0b;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">功能开发中</div>
      <div style="font-size: 12px; color: var(--text-tertiary);">数据源管理功能正在开发，敬请期待</div>
    </div>
  </div>
</div>
```

### 步骤4：替换设备能力区域假数据（在"全部"标签页中）

**修改文件**: `firefly-mobile/connection-center.html`

```html
<!-- 替换前 - 包含假数据卡片 -->
<div class="section">
  <div class="section-title">设备能力</div>
  <div class="capability-list">
    <div class="capability-item">...</div>
    ...
  </div>
</div>

<!-- 替换后 - 功能开发中占位 -->
<div class="section">
  <div class="section-title">设备能力</div>
  <div class="capability-list" style="padding: 40px 20px;">
    <div style="text-align: center;">
      <div style="width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: rgba(245, 158, 11, 0.1); display: flex; align-items: center; justify-content: center;">
        <svg viewBox="0 0 24 24" fill="none" style="width: 32px; height: 32px; color: #f59e0b;">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">功能开发中</div>
      <div style="font-size: 12px; color: var(--text-tertiary);">设备能力功能正在开发，敬请期待</div>
    </div>
  </div>
</div>
```

### 步骤5：清理冗余CSS样式

**修改文件**: `firefly-mobile/connection-center.html`

```css
/* 移除以下微信、飞书相关样式 */
.app-icon.wechat {
  background: linear-gradient(135deg, #07c160 0%, #06ad56 100%);
}

.app-icon.feishu {
  background: linear-gradient(135deg, #00b42a 0%, #00a324 100%);
}
```

---

## 四、占位提示文案规范

### 4.1 通用占位模板

```html
<div style="padding: 40px 20px;">
  <div style="text-align: center;">
    <!-- 圆形图标容器 -->
    <div style="width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: BACKGROUND_COLOR; display: flex; align-items: center; justify-content: center;">
      <svg viewBox="0 0 24 24" fill="none" style="width: 32px; height: 32px; color: ICON_COLOR;">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <!-- 标题 -->
    <div style="font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px;">标题文案</div>
    <!-- 描述 -->
    <div style="font-size: 12px; color: var(--text-tertiary);">描述文案</div>
  </div>
</div>
```

### 4.2 配色方案

| 场景 | 背景色 | 图标色 |
|------|--------|--------|
| 空状态（暂无数据） | `rgba(156, 163, 175, 0.1)` | `#9ca3af` |
| 开发中（功能未实现） | `rgba(245, 158, 11, 0.1)` | `#f59e0b` |

---

## 五、修改后的页面结构

```
连接中心页面
├── 顶部导航栏（已移除"添加连接"按钮）
├── 统计卡片（保持不变）
├── 标签导航（全部 / 应用 / 数据源 / 设备能力）
├── 全部标签页
│   ├── 应用连接 → 「暂无外部应用连接」占位
│   ├── 数据源 → 「功能开发中」占位
│   └── 设备能力 → 「功能开发中」占位
├── 应用标签页 → 「暂无外部应用连接」占位
├── 数据源标签页
│   ├── 数据源 → 「功能开发中」占位
│   └── 设备能力 → 「功能开发中」占位
├── 设备能力标签页（保持假数据展示）
└── 底部状态栏（保持不变）
```

---

## 六、注意事项

1. **设备能力标签页**：保留了假数据展示，因为该标签页是设备能力的专用展示区域，用户可能期望看到功能预览

2. **CSS样式清理**：移除微信、飞书相关的`.app-icon`样式定义，避免冗余代码

3. **响应式适配**：占位提示使用内联样式，确保在深色/浅色模式下都能正确显示

4. **用户体验**：使用统一的占位样式，避免用户误解功能异常

---

## 七、相关文件

- **主文件**: [connection-center.html](firefly-mobile/connection-center.html)

---

## 八、变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|----------|------|
| 2026-05-28 | v1.0 | 移除微信、飞书连接功能，添加占位提示文案 | 开发团队 |

---

*文档版本: v1.0*  
*创建日期: 2026-05-28*