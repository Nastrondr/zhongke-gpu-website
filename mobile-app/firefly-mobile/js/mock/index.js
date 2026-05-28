/**
 * Mock 数据目录
 *
 * 本目录用于存放各模块的 mock 数据，为后续抽离后端接口做准备。
 *
 * 目录结构：
 * - index.js     - 统一导出入口
 * - devices.js   - 设备相关 mock 数据
 * - models.js    - 模型相关 mock 数据
 * - skills.js    - 技能相关 mock 数据
 * - tasks.js     - 任务相关 mock 数据
 * - wallet.js    - 钱包/积分相关 mock 数据
 * - user.js      - 用户相关 mock 数据
 *
 * 使用方式：
 * 1. 页面中引入需要的 mock 文件
 * 2. 替换为真实 API 时，只需修改各模块中的方法实现
 *
 * 示例：
 * // 原：const data = MOCK_MODELS;
 * // 改：const data = await ModelAPI.getModelList();
 */

export { MOCK_DEVICES, DeviceAPI } from './devices.js';
export { MOCK_MODELS, ModelAPI } from './models.js';
export { MOCK_SKILLS, SkillAPI } from './skills.js';
export { MOCK_INITIAL_TASKS, TaskAPI } from './tasks.js';
export { MOCK_WALLET, WalletAPI } from './wallet.js';
export { MOCK_USER_PROFILE, UserAPI } from './user.js';

const MockData = {
  version: '1.0.0',
  description: 'Mock 数据统一出口'
};

export default MockData;
