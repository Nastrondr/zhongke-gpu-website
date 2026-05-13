/**
 * modelService.js - 模型相关 Service 层
 *
 * 职责：
 * - 整合 MOCK_MODELS 静态数据
 * - 整合 Storage.Model 运行时状态（当前选中的模型）
 * - 提供统一的模型查询与切换接口
 *
 * 页面以后应调用此服务，而不是直接读 mock/models.js
 */

const ModelService = {
  /**
   * 获取模型列表
   * @returns {Promise<Array>}
   */
  async getModelList() {
    const models = await window.ModelMock.ModelAPI.getModelList();
    const currentModelId = window.Storage.Model.getCurrentModel();
    if (currentModelId) {
      models.forEach(m => {
        m.isCurrent = m.id === currentModelId;
      });
    }
    return models;
  },

  /**
   * 获取当前使用的模型
   * @returns {Promise<Object|null>}
   */
  async getCurrentModel() {
    const currentModelId = window.Storage.Model.getCurrentModel();
    if (currentModelId) {
      return await window.ModelMock.ModelAPI.getModelById(currentModelId);
    }
    const model = window.ModelMock.MOCK_MODELS.find(m => m.isCurrent);
    return model || window.ModelMock.MOCK_MODELS[0];
  },

  /**
   * 切换模型
   * @param {string} modelId
   * @returns {Promise<Object>}
   */
  async switchModel(modelId) {
    const result = await window.ModelMock.ModelAPI.switchModel(modelId);
    if (result.success) {
      window.Storage.Model.setCurrentModel(modelId);
    }
    return result;
  },

  /**
   * 获取模型支持的所有技能
   * @param {string} modelId
   * @returns {Promise<Array>}
   */
  async getSupportedSkills(modelId) {
    return await window.ModelMock.ModelAPI.getSupportedSkills(modelId);
  }
};

window.ModelService = ModelService;
