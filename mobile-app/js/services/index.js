/**
 * services/index.js - Service 层统一出口
 *
 * 层级结构：
 * 页面 → Service 层 → Mock 数据层 / Storage 层
 *
 * 使用方式：
 * // 页面中引入需要的 service（通过 script 标签）
 * <script src="js/services/modelService.js"></script>
 * <script src="js/services/skillService.js"></script>
 *
 * // 调用示例
 * const models = await ModelService.getModelList();
 *
 * 后续接真实后端时：
 * 只需修改各 service 文件中的方法实现
 * 页面调用方式保持不变
 */

window.Services = {
  ModelService,
  SkillService,
  TaskService,
  WalletService,
  UserService
};
