/**
 * skillService.js - 技能相关 Service 层
 *
 * 职责：
 * - 对接真实后端 API
 * - 提供技能分类、列表查询
 * - 支持按当前模型获取可用技能
 * - 处理技能执行逻辑
 * - 保留 Mock 回退能力
 */

const SkillService = {
  /**
   * 获取技能列表
   * @returns {Promise<Array>}
   */
  async getSkillList() {
    try {
      const response = await Api.Skill.getList();
      if (response && (response.code === '0' || response.success)) {
        return response.data || response.rows || [];
      }
    } catch (error) {
      console.error('[SkillService] API获取技能列表失败:', error);
    }
    if (window.SkillMock) {
      return await window.SkillMock.SkillAPI.getSkillList();
    }
    return [];
  },

  /**
   * 获取指定分类的技能
   * @param {string} category
   * @returns {Promise<Array>}
   */
  async getSkillsByCategory(category) {
    try {
      const skills = await this.getSkillList();
      return skills.filter(s => s.category === category);
    } catch (error) {
      console.error('[SkillService] 按分类获取技能失败:', error);
    }
    if (window.SkillMock) {
      return await window.SkillMock.SkillAPI.getSkillsByCategory(category);
    }
    return [];
  },

  /**
   * 获取当前模型支持执行的技能列表
   * @param {string} currentModelId - 当前模型 ID
   * @returns {Promise<Array>}
   */
  async getExecutableSkills(currentModelId) {
    try {
      const skills = await this.getSkillList();
      return skills.filter(s => s.modelId === currentModelId || !s.modelId);
    } catch (error) {
      console.error('[SkillService] 获取可执行技能失败:', error);
    }
    if (window.SkillMock) {
      return await window.SkillMock.SkillAPI.getSkillsByModel(currentModelId);
    }
    return [];
  },

  /**
   * 检查技能是否可执行
   * @param {string} skillId
   * @param {string} currentModelId
   * @returns {boolean}
   */
  isSkillExecutable(skillId, currentModelId) {
    const skills = this.getExecutableSkills(currentModelId);
    return skills.some(s => s.id === skillId);
  },

  /**
   * 执行技能
   * @param {string} skillId
   * @param {Object} params - 执行参数
   * @returns {Promise<Object>}
   */
  async executeSkill(skillId, params = {}) {
    try {
      const response = await Api.Skill.execute(skillId, params);
      if (response && (response.code === '0' || response.success)) {
        return response.data || response;
      }
    } catch (error) {
      console.error('[SkillService] API执行技能失败:', error);
    }
    if (window.SkillMock) {
      return await window.SkillMock.SkillAPI.executeSkill(skillId);
    }
    return null;
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
