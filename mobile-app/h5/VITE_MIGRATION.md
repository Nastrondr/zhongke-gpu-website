# Vite 迁移方案

> 创建时间：2025-05-14
> 项目：mobile-app/h5

---

## 一、当前代码分析

### 1.1 外部依赖
| 依赖 | 来源 | 迁移影响 |
|------|------|----------|
| Chart.js | cdn.jsdelivr.net | 需改为 npm 引入 |
| Lucide Icons | 未使用 | 可选引入 |

### 1.2 内部依赖
- `js/utils/` - 工具函数 (storage, navigation, toast, splash)
- `js/services/` - 业务服务 (user, device, wallet, theme)
- `js/mock/` - Mock 数据
- `js/services/api/` - API 配置

### 1.3 脚本引用方式
- 混合：有 `/h5/js/` 和 `js/` 两种路径
- 内联：部分 JS 代码直接写在 HTML 中

---

## 二、迁移成本评估

### 2.1 高成本项 🔴

| 项目 | 原因 | 工作量 |
|------|------|--------|
| 路径统一 | 混合路径需规范化 | 20+ HTML |
| 内联 JS | 需抽取为模块 | 大量 |
| 硬编码 URL | 需外置配置 | 中等 |
| 20+ HTML 页面 | 需逐一迁移 | 高 |

### 2.2 中成本项 🟡

| 项目 | 原因 | 工作量 |
|------|------|--------|
| Mock 数据 | 需转为独立模块 | 低 |
| 多入口 | vite.config 多入口配置 | 中等 |

### 2.3 低成本项 🟢

| 项目 | 原因 | 工作量 |
|------|------|--------|
| CSS | 可直接复用 | 无 |
| 图片资源 | 可直接复用 | 无 |
| 工具函数 | 转为 ES6 模块 | 低 |

---

## 三、迁移方案

### 3.1 推荐方案：渐进式迁移

```
Phase 1: 基础搭建 (1-2天)
├── 1. 初始化 Vite 项目
├── 2. 创建 vite.config.js 多入口配置
├── 3. 移动 h5/ 到 src/ 目录
└── 4. 配置别名 @ → src/

Phase 2: 依赖迁移 (1天)
├── 1. npm install chart.js
├── 2. 替换 CDN 引用
├── 3. 安装其他必要依赖
└── 4. 配置代理 (开发环境)

Phase 3: 代码重构 (3-5天)
├── 1. 统一脚本路径
├── 2. 抽取内联 JS 为模块
├── 3. 外置配置 (API URL)
├── 4. 规范化目录结构
└── 5. 类型定义 (可选)

Phase 4: 优化 (1-2天)
├── 1. 代码分割
├── 2. 懒加载配置
├── 3. 资源压缩
└── 4. 构建优化
```

### 3.2 目录结构规划

```
mobile-app/
├── index.html          → 入口页面
├── src/
│   ├── h5/             → 移动端页面
│   │   ├── index.html
│   │   ├── home.html
│   │   ├── device.html
│   │   └── ...
│   ├── js/             → JS 模块
│   │   ├── services/
│   │   ├── utils/
│   │   └── mock/
│   ├── css/            → CSS
│   └── images/         → 图片
├── public/             → 静态资源
├── vite.config.js     → Vite 配置
└── package.json
```

---

## 四、需修改的配置文件

### 4.1 vite.config.js

```javascript
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@h5': resolve(__dirname, 'src/h5'),
    },
  },
  
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'src/h5/home.html'),
        device: resolve(__dirname, 'src/h5/device.html'),
        // ... 其他页面
      },
    },
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://your-api.com',
        changeOrigin: true,
      },
    },
  },
});
```

### 4.2 package.json

```json
{
  "name": "zhongke-gpu-h5",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "chart.js": "^4.4.0"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

### 4.3 HTML 路径修改

```html
<!-- 旧 -->
<script src="/h5/js/utils/storage.js"></script>

<!-- 新 -->
<script type="module" src="@/js/utils/storage.js"></script>
<!-- 或使用 CDN 版本 -->
```

---

## 五、实施步骤

### Step 1: 创建基础配置
```bash
npm create vite@latest . --template vanilla
```

### Step 2: 配置多入口
修改 `vite.config.js` 支持 20+ 页面

### Step 3: 安装依赖
```bash
npm install chart.js
```

### Step 4: 路径统一
批量替换 `/h5/js/` 为 `@/js/`

### Step 5: 测试构建
```bash
npm run build
```

---

## 六、风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 页面过多 | 分批迁移，先迁移核心页面 |
| 内联 JS | 优先抽取公共函数 |
| 路径问题 | 使用 Vite 别名 |
| 构建失败 | 保留原项目作为备份 |

---

## 七、预估工时

| 阶段 | 工时 |
|------|------|
| 基础搭建 | 1-2 天 |
| 依赖迁移 | 1 天 |
| 代码重构 | 3-5 天 |
| 优化测试 | 1-2 天 |
| **总计** | **6-10 天** |

---

## 八、迁移决策

### 推荐立即迁移的场景
- 🔴 需频繁更新功能
- 🔴 团队协作开发
- 🔴 需要 TypeScript
- 🔴 需要复杂构建优化

### 可暂缓迁移的场景
- 🟢 纯静态展示页面
- 🟢 维护频率低
- 🟢 预算/时间有限