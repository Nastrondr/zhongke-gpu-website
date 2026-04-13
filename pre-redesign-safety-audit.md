# 中科融算网 - 改版前安全盘点报告

**生成日期**: 2026-04-13  
**当前网站版本**: v1.0 (在线生产环境)

---

## A. 当前网站全部页面文件清单

| 序号 | 文件名 | 页面名称 | 主导航中出现 |
|:----:|--------|----------|:------------:|
| 1 | index.html | 首页 | ✅ 是 |
| 2 | products.html | 产品与服务 | ✅ 是 |
| 3 | bare-metal.html | 裸金属GPU租赁 | ❌ 否 |
| 4 | gpu-time.html | GPU卡时销售 | ❌ 否 |
| 5 | computing-center.html | 算力中心 | ✅ 是 |
| 6 | ai.html | 人工智能 | ❌ 否 |
| 7 | robot.html | 机器人 | ❌ 否 |
| 8 | solutions.html | 解决方案 | ✅ 是 |
| 9 | resources.html | 资源中心 | ✅ 是 |
| 10 | about.html | 关于我们 | ✅ 是 |
| 11 | contact.html | 联系销售 | ✅ 是 |

**说明**: 主导航中共出现8项（含下拉菜单中的3项子页面）

---

## B. 当前网站导航结构

### B.1 头部导航（Header）

```
├── 首页 (index.html) ← 当前高亮
├── 产品与服务 (products.html) ← 下拉菜单
│   ├── 产品分类 → products.html#product-categories
│   ├── 产品对比 → products.html#product-comparison
│   └── 联系销售 → contact.html
├── 算力中心 (computing-center.html) ← 下拉菜单
│   ├── 算力中心建设 → computing-center.html#center-construction
│   ├── 人工智能 → computing-center.html#ai
│   └── 机器人 → computing-center.html#robotics
├── 解决方案 (solutions.html)
├── 资源中心 (resources.html) ← 下拉菜单
│   ├── 新闻动态 → resources.html
│   ├── 行业资讯 → resources.html
│   ├── 文档中心 → resources.html
│   ├── 常见问题 → resources.html
│   └── 案例展示 → resources.html
├── 关于我们 (about.html)
├── [登录] ← 占位链接
├── [注册] ← 占位链接
└── [获取报价] → contact.html
```

### B.2 页脚导航（Footer）

```
├── 产品与服务
│   ├── 产品分类 → products.html#product-categories
│   ├── 产品对比 → products.html#product-comparison
│   └── 联系销售 → contact.html
├── 支持与资源
│   ├── 新闻动态 → resources.html
│   ├── 行业资讯 → resources.html
│   ├── 文档中心 → resources.html
│   ├── 常见问题 → resources.html
│   └── 案例展示 → resources.html
└── 联系方式（静态信息）
    ├── 联系人: 田杰
    ├── 电话: 0755-86168478
    ├── 手机: 13603075697
    ├── 邮箱: tianjie@szsbay.com
    └── 地址: 深圳市南山区...
```

### B.3 页面跳转关系

```
首页 (index.html)
├── → 裸金属GPU租赁 (bare-metal.html)
├── → GPU卡时销售 (gpu-time.html)
├── → 算力中心 (computing-center.html)
├── → 解决方案 (solutions.html)
├── → 人工智能 (ai.html) ← 通过算力中心子链接
├── → 机器人 (robot.html) ← 通过算力中心子链接
├── → 联系销售 (contact.html)
└── → 关于我们 (about.html)

产品与服务 (products.html)
├── → 裸金属GPU租赁 (bare-metal.html)
├── → GPU卡时销售 (gpu-time.html)
└── → 联系销售 (contact.html)

算力中心 (computing-center.html)
├── → 人工智能 (ai.html) ← 左侧边栏
├── → 机器人 (robot.html) ← 左侧边栏
└── → 联系销售 (contact.html)

资源中心 (resources.html)
└── [所有链接均为当前页面锚点，无实际跳转]

所有页面
└── → 联系销售 (contact.html) ← CTA按钮
```

---

## C. 当前首页模块清单（从上到下）

| 序号 | 模块名称 | 作用说明 |
|:----:|----------|----------|
| 1 | Header导航栏 | 全站导航，包含Logo、主菜单、登录注册、获取报价按钮 |
| 2 | Hero英雄区 | 品牌展示，主标题"中科融算网 AI算力平台"、副标题、CTA按钮 |
| 3 | 快速入口 | 4个快捷卡片：裸金属GPU、卡时销售、算力中心、解决方案 |
| 4 | 解决方案 | 6大行业卡片：金融、医疗、制造、科研、互联网、自动驾驶 |
| 5 | 数据背书 | 4项核心数据：500+企业、1000+GPU、3区域、99.9%可用性 |
| 6 | 技术能力 | 3卡片：顶级GPU资源、弹性高性能、企业级安全 |
| 7 | 使用流程 | 4步骤流程图：选择产品→配置选择→提交订单→开通使用 |
| 8 | CTA区 | 行动召唤："获取专业解决方案" + "立即咨询"按钮 |
| 9 | Footer页脚 | 版权信息、导航链接、联系方式 |

---

## D. "产品与服务"相关页面清单

### D.1 产品相关页面列表

| 序号 | 文件名 | 页面名称 | 定位 |
|:----:|--------|----------|------|
| 1 | products.html | 产品与服务 | 产品聚合页/产品对比页 |
| 2 | bare-metal.html | 裸金属GPU租赁 | 长期租赁产品详情 |
| 3 | gpu-time.html | GPU卡时销售 | 按时间计费产品详情 |

### D.2 产品页面跳转关系

```
产品与服务 (products.html)
│
├── [核心产品区 - 裸金属GPU租赁卡片]
│   └── → 裸金属GPU租赁 (bare-metal.html)
│
├── [核心产品区 - GPU卡时销售卡片]
│   └── → GPU卡时销售 (gpu-time.html)
│
├── [产品对比表格]
│   ├── 裸金属 vs 卡时销售对比
│
└── [CTA按钮]
    └── → 联系销售 (contact.html)

裸金属GPU租赁 (bare-metal.html)
│
├── 配置选项（GPU型号、CPU、内存、存储、网络）
├── 产品卡片（8个：H100 1/2/4/8卡 + GH200 1G/2G/4G/SXM）
├── GPU参数表格（H100、GH200、A100等）
└── CTA按钮 → 联系销售 (contact.html)

GPU卡时销售 (gpu-time.html)
│
├── 计费方式说明（按小时/天/套餐包/包月包年）
├── 产品卡片（8个：与裸金属相同产品）
├── GPU参数表格
└── CTA按钮 → 联系销售 (contact.html)
```

### D.3 产品核心文案（需保护）

**裸金属GPU租赁页 (bare-metal.html)**:
- 产品标题：裸金属GPU租赁
- 配置选项：GPU型号(CPU/内存/存储/网络)、租赁周期、年付折扣
- 产品数量：8个产品卡片
- GPU参数：H100、GH200、A100、RTX 4090、L40等

**GPU卡时销售页 (gpu-time.html)**:
- 产品标题：GPU卡时销售
- 计费方式：按小时/天/套餐包/包月包年
- 产品数量：8个产品卡片
- GPU参数：与裸金属页相同

---

## E. 平台能力/算力中心/解决方案/资源中心/关于我们/联系销售页面清单

### E.1 页面列表

| 序号 | 文件名 | 页面名称 | 核心内容/作用 |
|:----:|--------|----------|---------------|
| 1 | computing-center.html | 算力中心 | 三大分中心介绍（襄阳、怀柔、威海）、业务板块导航 |
| 2 | ai.html | 人工智能 | AI业务介绍、算力支撑能力展示 |
| 3 | robot.html | 机器人 | 机器人业务介绍、计算支撑能力展示 |
| 4 | solutions.html | 解决方案 | 6大行业解决方案（金融、医疗、制造、科研、互联网、自动驾驶） |
| 5 | resources.html | 资源中心 | 5类资源入口（新闻动态、行业资讯、文档中心、常见问题、案例展示）— **当前为占位状态** |
| 6 | about.html | 关于我们 | 公司简介、使命愿景、核心优势 |
| 7 | contact.html | 联系销售 | 联系方式、在线咨询表单 |

### E.2 详细说明

**算力中心 (computing-center.html)**:
- 三大分中心：襄阳、怀柔、威海
- 业务板块：算力中心建设、人工智能、机器人
- 展示内容：位置、规模、特点

**人工智能 (ai.html)**:
- 左侧边栏导航
- AI业务内容介绍
- 算力支撑能力说明

**机器人 (robot.html)**:
- 左侧边栏导航
- 机器人业务介绍
- 计算支撑能力说明

**解决方案 (solutions.html)**:
- 6大行业解决方案卡片
- 每个行业含：图标、名称、业务场景、推荐配置

**资源中心 (resources.html)**:
- 5类资源入口
- **当前状态：全部为"敬请期待"占位**
- 后续可填充真实内容

**关于我们 (about.html)**:
- 公司简介
- 使命/愿景/价值观
- 公司优势列表

**联系销售 (contact.html)**:
- 联系方式：电话、邮箱、地址
- 在线咨询表单：姓名、邮箱、电话、留言
- **表单当前为静态HTML，未接入后端**

---

## F. 改版保护名单

### F.1 现有页面文件（不得删除）

```
index.html          - 首页
products.html       - 产品与服务
bare-metal.html     - 裸金属GPU租赁
gpu-time.html       - GPU卡时销售
computing-center.html - 算力中心
ai.html             - 人工智能
robot.html          - 机器人
solutions.html      - 解决方案
resources.html      - 资源中心
about.html          - 关于我们
contact.html        - 联系销售
```

### F.2 现有导航链接（不得删除/修改锚点）

**头部导航**:
```
首页                              → index.html
产品与服务                        → products.html
  ├── 产品分类                    → products.html#product-categories
  ├── 产品对比                    → products.html#product-comparison
  └── 联系销售                    → contact.html
算力中心                          → computing-center.html
  ├── 算力中心建设                → computing-center.html#center-construction
  ├── 人工智能                   → computing-center.html#ai
  └── 机器人                     → computing-center.html#robotics
解决方案                          → solutions.html
资源中心                          → resources.html
  ├── 新闻动态                    → resources.html
  ├── 行业资讯                    → resources.html
  ├── 文档中心                    → resources.html
  ├── 常见问题                    → resources.html
  └── 案例展示                    → resources.html
关于我们                          → about.html
登录                              → # (占位)
注册                              → # (占位)
获取报价                          → contact.html
```

**页脚导航**:
```
产品与服务
  ├── 产品分类                    → products.html#product-categories
  ├── 产品对比                    → products.html#product-comparison
  └── 联系销售                    → contact.html
支持与资源
  ├── 新闻动态                    → resources.html
  ├── 行业资讯                    → resources.html
  ├── 文档中心                    → resources.html
  ├── 常见问题                    → resources.html
  └── 案例展示                    → resources.html
```

### F.3 核心业务文案（需完整保留）

| 页面 | 需保护的文案内容 |
|------|-----------------|
| **首页** | 快速入口4卡片、解决方案6行业、数据背书4指标、技术能力3卡片、使用流程4步骤 |
| **裸金属GPU租赁** | 8个产品卡片信息、配置选项文案、GPU参数表格 |
| **GPU卡时销售** | 8个产品卡片信息、计费方式文案、GPU参数表格 |
| **算力中心** | 三大分中心介绍（襄阳/怀柔/威海） |
| **解决方案** | 6大行业名称、行业场景描述、推荐配置 |
| **联系我们** | 联系方式信息（电话/邮箱/地址）、表单字段 |

---

## G. 最小风险改版建议

### G.1 建议直接修改的页面

| 页面 | 改版方式 | 风险等级 |
|------|----------|---------|
| index.html | 直接修改 | 🟡 中 |
| about.html | 直接修改 | 🟢 低 |
| contact.html | 直接修改 | 🟢 低 |

**理由**:
- index.html: 首页是核心展示页面，改动频繁，建议直接修改但需保留核心模块结构
- about.html: 内容相对独立，改动影响范围小
- contact.html: 表单和联系方式，改动影响范围小

### G.2 建议先复制后重构的页面

| 页面 | 复制后文件名 | 风险等级 |
|------|-------------|---------|
| products.html | products-old.html | 🟡 中 |
| bare-metal.html | bare-metal-old.html | 🔴 高 |
| gpu-time.html | gpu-time-old.html | 🔴 高 |
| solutions.html | solutions-old.html | 🟡 中 |
| computing-center.html | computing-center-old.html | 🟡 中 |

**理由**:
- 这些页面包含核心产品信息，一旦丢失影响业务
- 先复制备份，原文件修改后可对比恢复
- 建议使用Git管理版本

### G.3 建议暂时不要动的页面

| 页面 | 原因 |
|------|------|
| ai.html | 内容单薄，后续可能需要重新设计 |
| robot.html | 内容单薄，后续可能需要重新设计 |
| resources.html | 当前为占位状态，建议填充真实内容后再改版 |

### G.4 改版操作建议

1. **使用Git管理版本**
   ```bash
   git add -A
   git commit -m "改版前备份 - $(date)"
   ```

2. **修改前备份策略**
   - 重要页面修改前先复制备份
   - 保持备份文件与原文件同目录

3. **导航修改原则**
   - 不删除现有导航项
   - 不改变现有链接地址
   - 如需新增，另行标记

4. **样式修改原则**
   - 优先修改CSS变量（:root）
   - 避免直接修改页面内联样式

---

## 总结

### 改版安全红线

1. ❌ 不得删除任何HTML文件
2. ❌ 不得修改导航链接地址
3. ❌ 不得删除产品页面内容
4. ❌ 不得删除页脚导航

### 改版优先级建议

| 优先级 | 页面 | 建议 |
|:------:|------|------|
| P0 | 首页 | 重点改版对象，但保留核心模块 |
| P1 | 产品页 | 谨慎改版，务必备份 |
| P2 | 解决方案/算力中心 | 中等风险，建议备份 |
| P3 | 资源中心 | 先填充内容再改版 |
| P4 | 关于我们/联系销售 | 低优先级 |

---

**报告完成**
