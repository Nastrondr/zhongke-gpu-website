# h5/js 文件夹结构优化建议

> 创建时间：2025-05-14
> 文件路径：`mobile-app/h5/js/`

---

## 一、当前问题

### 1.1 入口文件不一致

| 目录 | index.js | 状态 |
|------|---------|------|
| mock/ | ✅ 存在 | 正常 |
| services/ | ✅ 存在 | 正常 |
| services/api/ | ✅ 存在 | 正常 |
| **utils/** | ❌ **缺失** | **需补充** |

### 1.2 分散文件

| 文件 | 问题 | 建议 |
|------|------|------|
| `icons.js` | 独立根目录，未使用 | 删除或确认用途 |
| `main.js` | 独立根目录 | 合并到 utils 或删除 |

### 1.3 命名不规范

| 当前 | 建议 |
|------|------|
| deviceService.js | 保持 |
| openclawChatService.js | 保持 |
| sessionService.js | 保持 |

---

## 二、优化方案

### 2.1 推荐目录结构

```
js/
├── index.js              ← 新增 (可选：统一入口)
├── mock/
│   ├── index.js       ✅
│   ├── devices.js
│   ├── models.js
│   ├── skills.js
│   ├── tasks.js
│   ├── user.js
│   └── wallet.js
├── services/
│   ├── index.js       ✅
│   ├── api/
│   │   ├── index.js ✅
│   │   ├── ApiClient.js
│   │   ├── config.js
│   │   ├── endpoints.js
│   │   ├── index.js
│   │   └── models.js
│   └──
│       ├── deviceService.js
│       ├── modelService.js
│       ├── openclawChatService.js
│       ├── sessionService.js
│       ├── skillService.js
│       ├── taskService.js
│       ├── themeService.js
│       ├── userService.js
│       └── walletService.js
└── utils/
    ├── index.js       ← ✅ 新增
    ├── navigation.js
    ├── skeleton.js
    ├── splash.js
    ├── storage.js
    └── toast.js
```

### 2.2 分散文件处理

| 文件 | 动作 | 原因 |
|------|------|------|
| icons.js | ❓ 待定 | 需确认是否使用 |
| main.js | ❓ 待定 | 需确认是否使用 |

---

## 三、使用方式

### 3.1 引入方式对比

```javascript
// ❌ 旧方式 (直接引入)
import { Storage } from '/h5/js/utils/storage.js';
import { Navigation } from '/h5/js/utils/navigation.js';

// ✅ 新方式 (通过 index.js 统一入口)
import { Storage, Navigation } from '/h5/js/utils/index.js';
```

### 3.2 代码示例

```html
<!-- 批量引入 utils -->
<script type="module">
  import { Storage, Navigation, Toast } from './js/utils/index.js';

  // 使用
  const user = Storage.Auth.getCurrentUser();
  Navigation.goTo('home.html');
</script>
```

---

## 四、实施清单

- [x] 新增 `utils/index.js` 入口 - ✅ 已完成

待确认：
- [ ] 检查 `icons.js` 用途
- [ ] 检查 `main.js` 用途
- [ ] 决定是否删除或保留

---

## 五、向后兼容

当前优化**不影响**现有代码：
- 原有直接引入方式仍然可用
- 新增 index.js 是额外入口
- 无破坏性变更