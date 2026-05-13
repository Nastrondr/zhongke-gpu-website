# 中科融算网 设计规范

> 版本：1.0.0
> 更新日期：2026-04-24
> 适用范围：中科融算网 GPU 裸金属与卡时销售业务

---

## 一、颜色系统

### 1.1 主色调

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--deep-blue-900` | `#081A3A` | 最深蓝 - 深色页面主背景 |
| `--deep-blue-800` | `#0B234D` | 深蓝 - 深色卡片背景 |
| `--deep-blue-700` | `#12336B` | 中深蓝 - 渐变色 |

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--primary-blue` | `#2563EB` | 主蓝色 - 主要按钮/链接 |
| `--primary-blue-dark` | `#1D4ED8` | 主色深 - 按钮悬停状态 |

### 1.2 强调色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--accent-blue` | `#3B82F6` | 强调蓝 |
| `--electric-blue` | `#38BDF8` | 电光蓝 - 高亮效果 |
| `--highlight-cyan` | `#67E8F9` | 青色高亮 |

### 1.3 文字颜色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--text-dark` | `#0F172A` | 深色文字 - 标题 |
| `--text-base` | `#334155` | 正文文字 |
| `--text-light` | `#64748B` | 浅色文字 - 辅助说明 |
| `--text-lighter` | `#94A3B8` | 更浅文字 - 次要信息 |

### 1.4 背景颜色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--bg-white` | `#FFFFFF` | 白色背景 - 卡片/容器 |
| `--bg-light` | `#F8FAFC` | 浅灰背景 - 区块背景 |
| `--bg-blue-light` | `#EEF4FF` | 浅蓝背景 - 高亮区块 |

### 1.5 边框颜色

| 变量名 | 色值 | 用途 |
|--------|------|------|
| `--border-light` | `#D9E6FF` | 浅色边框 |
| `--border-dark` | `rgba(255, 255, 255, 0.12)` | 深色透明边框（用于深色背景） |

### 1.6 兼容变量（旧版）

| 变量名 | 对应新版 |
|--------|---------|
| `--primary` | `--primary-blue` |
| `--primary-dark` | `--primary-blue-dark` |
| `--primary-light` | `--accent-blue` |
| `--accent` | `--electric-blue` |
| `--accent-light` | `--highlight-cyan` |
| `--bg-gray` | `#E5EAF2` |
| `--bg-dark` | `--deep-blue-900` |
| `--bg-dark-light` | `--deep-blue-800` |
| `--border-color` | `--border-light` |
| `--border-primary` | `rgba(37, 99, 235, 0.15)` |

---

## 二、字体系统

```css
--font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

### 字体加载顺序
1. Noto Sans SC（Google Fonts - 中文优化）
2. -apple-system（iOS 系统字体）
3. BlinkMacSystemFont（macOS Chrome）
4. Segoe UI（Windows）
5. PingFang SC（macOS 中文）
6. Microsoft YaHei（Windows 中文）
7. sans-serif（兜底）

### 字号规范

| 用途 | 字号 | 行高 |
|------|------|------|
| Hero 标题 | 44-48px | 1.2-1.3 |
| 区块标题 | 36-40px | 1.2-1.3 |
| 卡片标题 | 18-20px | 1.4 |
| 正文 | 14-16px | 1.6-1.7 |
| 辅助文字 | 12-13px | 1.5 |

---

## 三、阴影系统

```css
--shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.06);      /* 小阴影 - 轻微层级 */
--shadow-md: 0 6px 20px rgba(15, 23, 42, 0.08);      /* 中阴影 - 卡片默认 */
--shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.12);     /* 大阴影 - 弹窗/浮层 */
--shadow-card: 0 12px 32px rgba(15, 23, 42, 0.08);   /* 卡片阴影 */
--shadow-card-hover: 0 18px 40px rgba(15, 23, 42, 0.12);  /* 卡片悬停阴影 */
```

---

## 四、渐变系统

```css
/* 主要渐变 - 用于 Hero/CTA 区域 */
--gradient-primary: linear-gradient(135deg, #081A3A 0%, #0B234D 38%, #12336B 100%);

/* CTA 渐变 - 用于浅色背景区块 */
--gradient-cta: linear-gradient(135deg, #EEF4FF 0%, #F8FAFC 100%);

/* 深色卡片渐变 */
--gradient-card-dark: linear-gradient(180deg, #0B234D 0%, #081A3A 100%);
```

---

## 五、圆角系统

| 元素 | 圆角值 |
|------|--------|
| 按钮 | 8px / 10px / 12px |
| 卡片 | 16px / 20px |
| 输入框 | 8px |
| 图片/媒体 | 12px / 16px |

```css
--border-radius: 8px;  /* 基础圆角 */
```

---

## 六、过渡/动效系统

### 6.1 基础过渡

```css
--transition: all 0.3s ease;
```

### 6.2 缓动函数

```css
--ease-out-smooth: cubic-bezier(0.22, 1, 0.36, 1);      /* 平滑退出 - 推荐用于弹窗/下拉 */
--ease-out-gentle: cubic-bezier(0.25, 0.1, 0.25, 1);   /* 柔和退出 - 推荐用于轮播 */
--ease-in-out-smooth: cubic-bezier(0.4, 0, 0.2, 1);     /* 平滑进出 - 推荐用于轮播 */
```

### 6.3 动画时长

```css
--duration-hero: 0.8s;      /* Hero 区域动画 */
--duration-module: 0.6s;     /* 内容模块动画 */
--duration-card: 0.5s;      /* 卡片加载动画 */
--duration-hover: 0.3s;     /* 悬停效果 */
--duration-quick: 0.2s;     /* 快速反馈 */
```

### 6.4 位移距离

```css
--offset-hero: 32px;        /* Hero 区块偏移 */
--offset-module: 28px;      /* 模块偏移 */
--offset-card: 20px;        /* 卡片偏移 */
--offset-subtle: 12px;      /* 微调偏移 */
```

### 6.5 悬停提升

```css
--hover-lift: -6px;         /* 默认悬停上移 */
--hover-lift-sm: -4px;      /* 小元素悬停上移 */
--hover-lift-lg: -8px;      /* 大元素悬停上移 */
```

---

## 七、响应式断点

| 断点 | 宽度范围 | 说明 |
|------|---------|------|
| Desktop | > 1024px | 桌面端 - 4列/3列布局 |
| Tablet | 769px - 1024px | 平板端 - 2列布局 |
| Mobile | 641px - 768px | 移动端 - 1-2列 |
| Small Mobile | ≤ 640px | 小屏幕手机 |
| Extra Small | ≤ 480px | 超小屏幕 - 全宽布局 |

### 媒体查询

```css
/* 平板及以下 */
@media (max-width: 1024px) { }

/* 移动端及以下 */
@media (max-width: 768px) { }

/* 小屏幕 */
@media (max-width: 640px) { }

/* 手机 */
@media (max-width: 480px) { }

/* 桌面端及以上 */
@media (min-width: 769px) { }

/* 减少动画（无障碍） */
@media (prefers-reduced-motion: reduce) { }
```

---

## 八、间距系统

### 8.1 基础间距

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;
```

### 8.2 栅格间距

```css
.gap-16 { gap: 16px; }
.gap-20 { gap: 20px; }
.gap-24 { gap: 24px; }
.gap-32 { gap: 32px; }
.gap-40 { gap: 40px; }
.gap-48 { gap: 48px; }
.gap-60 { gap: 60px; }
.gap-80 { gap: 80px; }
```

### 8.3 内边距规范

| 元素 | 内边距 |
|------|--------|
| 容器 | 0 40px（桌面）/ 0 20px（移动） |
| 区块 | 80px 0 / 60px 0（移动） |
| 卡片 | 24px / 28px / 32px |
| 按钮 | 12px 24px / 14px 28px |

---

## 九、组件规范

### 9.1 按钮

```html
<!-- 主要按钮 -->
<a href="#" class="btn-primary">主要操作</a>

<!-- 次要按钮 -->
<a href="#" class="btn-secondary">次要操作</a>
```

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: var(--primary-blue);
  color: #fff;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);
}

.btn-primary:hover {
  background: var(--primary-blue-dark);
  transform: translateY(-2px);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  padding: 12px 24px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.22);
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);
}
```

### 9.2 卡片

```html
<a href="#" class="card">
  <h3>卡片标题</h3>
  <p>卡片内容</p>
</a>
```

```css
.card {
  display: flex;
  flex-direction: column;
  padding: 32px 28px;
  background: var(--bg-white);
  border-radius: 20px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
  text-decoration: none;
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(var(--hover-lift));
}
```

### 9.3 图标

图标使用 Lucide Icons CDN，通过 `icons.js` 自动替换带有 `lucide-icon` 类的 SVG 元素。

```html
<svg class="lucide-icon" width="24" height="24" viewBox="0 0 24 24">
  <!-- Lucide 图标路径 -->
</svg>
```

```css
.lucide-icon {
  stroke: var(--primary);
  stroke-width: 2px;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: var(--transition);
}
```

### 9.4 导航栏

```css
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-white);
  box-shadow: var(--shadow-sm);
  z-index: 1000;
}

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}
```

### 9.5 页脚

```css
.footer {
  background: var(--deep-blue-900);
  color: #fff;
  padding: 60px 0 30px;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 48px;
}
```

---

## 十、页面结构

### 10.1 导航栏结构

```
Header
├── Logo + 导航链接
├── 主导航菜单
│   ├── 首页
│   ├── 产品与服务（下拉：裸金属租赁 / 卡时销售）
│   ├── 算力中心（下拉：算力中心建设 / 人工智能 / 机器人）
│   ├── 政策与新闻
│   ├── 资源中心（下拉：硬件产品 / 周边设备 / AI应用）
│   ├── 关于我们
│   └── 联系咨询
└── 操作按钮（登录 / 注册 / 获取报价）
```

### 10.2 首页模块顺序

1. Hero 轮播区
2. 三大核心业务入口（3列卡片）
3. 应用场景预览（3列网格）
4. 数据背书（4列统计）
5. 为什么选择中科融算（3列卡片）
6. 使用流程（4步）
7. CTA 行动召唤区
8. 页脚

### 10.3 产品页模块顺序

1. Hero 轮播（2张：裸金属租赁 / 卡时销售）
2. 产品分类（2列卡片）
3. 产品对比表格
4. 咨询与购买引导
5. 页脚

---

## 十一、常用类名

| 类名 | 用途 |
|------|------|
| `.container` | 页面容器，最大宽度 1200px |
| `.section-title` | 区块标题 |
| `.grid` | 栅格布局 |
| `.card` | 卡片组件 |
| `.btn-primary` | 主要按钮 |
| `.btn-secondary` | 次要按钮 |
| `.footer` | 页脚 |
| `.header` | 顶部导航 |
| `.hero` | Hero 区域 |
| `.lucide-icon` | Lucide 图标 |

---

## 十二、深色/浅色模式

目前网站主要使用浅色模式。深色模式元素使用：

- 深色背景：`--deep-blue-900` / `#081A3A`
- 深色文字：`rgba(255,255,255,0.7-0.85)`
- 深色边框：`rgba(255,255,255,0.12)`

---

## 十三、注意事项

1. **颜色不混用**：浅色模式使用浅色变量，深色模式使用深色变量，避免颜色冲突
2. **图标优先使用 Lucide**：通过 `icons.js` 自动管理，确保一致性
3. **响应式优先移动端**：新组件应从移动端开始设计，再适配桌面
4. **无障碍支持**：`prefers-reduced-motion` 媒体查询处理减少动画偏好
