# h5 文件夹结构优化建议

> 创建时间：2025-05-14
> 更新：2025-05-14 (新增文件结构问题检查)
> 文件路径：`mobile-app/h5/`

---

## 一、JS 目录优化（已完成 ✅）

### 1.1 入口文件一致性

| 目录 | index.js | 状态 |
|------|---------|------|
| mock/ | ✅ 存在 | 正常 |
| services/ | ✅ 存在 | 正常 |
| services/api/ | ✅ 存在 | 正常 |
| utils/ | ✅ 已新增 | 已完成 |

### 1.2 分散文件处理

| 文件 | 状态 |
|------|------|
| icons.js | ✅ 已删除 |
| main.js | ✅ 已删除 |

### 1.3 JS 路径统一

| 任务 | 状态 |
|------|------|
| 将 `/h5/js/` 改为 `js/` | ✅ 已完成 |

---

## 二、新发现的文件结构问题

### 2.1 根目录分散的 JS 文件

| 文件位置 | 应在位置 | 问题 |
|----------|----------|------|
| `bottom-nav.js` | `js/utils/` | 分散在根目录 |

### 2.2 根目录的文档文件

| 文件 | 说明 | 建议 |
|------|------|------|
| `api-test.html` | 测试文件 | 删除 |
| `EVALUATION.md` | 评估报告 | 删除或归档 |
| `VITE_MIGRATION.md` | 迁移方案 | 保留参考 |
| `manifest.json` | PWA 配置 | ✅ 正常 |

### 2.3 根目录 HTML 文件数量

共 20 个 HTML 页面：
- index.html, home.html
- device.html, device-chat.html
- connection-center.html, session-center.html
- task-center.html
- token-overview.html, token-consumption.html, token-production.html
- topup.html
- account-binding.html, mobile-diagnosis.html
- model-switch.html, model-skill.html
- skill-execute.html
- whale-chat.html

---

## 三、待处理问题清单

### 高优先级
- [ ] 移动 `bottom-nav.js` 到 `js/utils/` 并更新引用

### 中优先级
- [ ] 删除 `api-test.html` (测试文件)
- [ ] 删除 `EVALUATION.md` (已使用完毕)

### 低优先级
- [ ] 考虑归档 `VITE_MIGRATION.md` 或保留作为参考

---

## 四、根目录文件汇总

### 应该保留
| 文件 | 说明 |
|------|------|
| `*.html` | 页面文件 |
| `manifest.json` | PWA 配置 |

### 可以删除
| 文件 | 说明 |
|------|------|
| `api-test.html` | 测试文件 |
| `EVALUATION.md` | 已完成 |
| `css/REDUNDANCY.md` | 技术债记录 |

### 需移动
| 当前 | 目标 |
|------|------|
| `bottom-nav.js` | `js/utils/bottom-nav.js` |

---

## 五、实施建议

### 5.1 移动 bottom-nav.js

```bash
# 移动文件
mv bottom-nav.js js/utils/

# 更新引用（在 HTML 文件中）
sed -i '' 's|bottom-nav.js|js/utils/bottom-nav.js|g' *.html
```

### 5.2 删除测试/文档文件

```bash
rm api-test.html
rm EVALUATION.md
rm css/REDUNDANCY.md
```

---

## 六、风险提示

| 操作 | 风险 | 缓解 |
|------|------|------|
| 移动 bottom-nav.js | 路径引用失效 | 先备份再执行 |
| 删除文档文件 | 丢失文档 | 确认不再需要 |