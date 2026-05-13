/**
 * skillService.js - 技能相关 Service 层
 *
 * 职责：
 * - 整合 MOCK_SKILLS 静态数据
 * - 提供技能分类、列表查询
 * - 支持按当前模型获取可用技能
 * - 处理技能执行逻辑
 *
 * 页面以后应调用此服务，而不是直接读 mock/skills.js
 */

const SkillService = {
  /**
   * 获取技能列表
   * @returns {Promise<Array>}
   */
  async getSkillList() {
    return await window.SkillMock.SkillAPI.getSkillList();
  },

  /**
   * 获取指定分类的技能
   * @param {string} category
   * @returns {Promise<Array>}
   */
  async getSkillsByCategory(category) {
    return await window.SkillMock.SkillAPI.getSkillsByCategory(category);
  },

  /**
   * 获取当前模型支持执行的技能列表
   * @param {string} currentModelId - 当前模型 ID
   * @returns {Promise<Array>}
   */
  async getExecutableSkills(currentModelId) {
    return await window.SkillMock.SkillAPI.getSkillsByModel(currentModelId);
  },

  /**
   * 检查技能是否可执行
   * @param {string} skillId
   * @param {string} currentModelId
   * @returns {boolean}
   */
  isSkillExecutable(skillId, currentModelId) {
    return window.SkillMock.SkillAPI.isSupported(skillId, currentModelId);
  },

  /**
   * 执行技能
   * @param {string} skillId
   * @returns {Promise<Object>}
   */
  async executeSkill(skillId) {
    return await window.SkillMock.SkillAPI.executeSkill(skillId);
  },

  /**
   * 获取技能分类列表
   * @returns {Array}
   */
  getCategories() {
    return ['文档类', '任务类', '设备类'];
  }
};

window.SkillService = SkillService;
