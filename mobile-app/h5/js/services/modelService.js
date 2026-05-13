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

// 模型ID到显示名称和描述的映射
const modelDisplayInfo = {
  'qwen3.6:35b': { name: 'Qwen 3.6', description: '通用推理、深度思考、金融分析' },
  'qwen3.5:27b': { name: 'Qwen 3.5', description: '轻量推理、高频任务、快速响应' },
  'glm-4.7-flash:latest': { name: 'GLM 4.7', description: '对话交互、综合内容生成、文档处理' }
};

// 允许的模型ID列表
const allowedModelIds = ['qwen3.6:35b', 'qwen3.5:27b', 'glm-4.7-flash:latest'];

const ModelService = {
  /**
   * 获取模型列表
   * @returns {Promise<Array>}
   */
  async getModelList() {
    try {
      // 调用 CAS 新 API
      const response = await Api.Model.getListCas();
      console.log('[ModelService] model list raw response:', response);

      // CAS OpenAI兼容格式: { data: [{ id, object, ... }] }
      if (response && Array.isArray(response.data)) {
        const currentModel = window.Storage.Model.getCurrentModel();
        const currentModelId = currentModel?.id;

        const models = response.data
          .map(item => {
            const info = modelDisplayInfo[item.id];
            return {
              id: item.id,
              name: info?.name || item.id,
              description: info?.description || 'AI模型',
              isCurrent: item.id === currentModelId
            };
          })
          .filter(m => allowedModelIds.includes(m.id)); // 只保留允许的3个模型

        console.log('[ModelService] processed models:', models);
        return models;
      }

      // 旧格式 fallback: { models: [...] }
      if (response && Array.isArray(response.models)) {
        const currentModel = window.Storage.Model.getCurrentModel();
        const currentModelId = currentModel?.id;

        const models = response.models
          .map(item => {
            const info = modelDisplayInfo[item.model];
            return {
              id: item.model,
              name: info?.name || item.name,
              description: info?.description || 'AI模型',
              isCurrent: item.model === currentModelId
            };
          })
          .filter(m => allowedModelIds.includes(m.id)); // 只保留允许的3个模型

        return models;
      }
    } catch (error) {
      console.error('[ModelService] 获取模型列表失败:', error);
    }

    // fallback到默认模型
    const currentModelId = window.Storage.Model.getCurrentModel()?.id;
    return [
      { id: 'qwen3.6:35b', name: 'Qwen 3.6', description: '通用推理、深度思考、金融分析', isCurrent: 'qwen3.6:35b' === currentModelId },
      { id: 'qwen3.5:27b', name: 'Qwen 3.5', description: '轻量推理、高频任务、快速响应', isCurrent: 'qwen3.5:27b' === currentModelId },
      { id: 'glm-4.7-flash:latest', name: 'GLM 4.7', description: '对话交互、综合内容生成、文档处理', isCurrent: 'glm-4.7-flash:latest' === currentModelId }
    ];
  },

  /**
   * 获取当前使用的模型
   * @returns {Promise<Object|null>}
   */
  async getCurrentModel() {
    const currentModel = window.Storage.Model.getCurrentModel();
    if (currentModel && currentModel.id) {
      return {
        id: currentModel.id,
        name: modelDisplayInfo[currentModel.id]?.name || currentModel.id,
        description: modelDisplayInfo[currentModel.id]?.description || 'AI模型'
      };
    }
    return { id: 'qwen3.6:35b', name: 'Qwen 3.6', description: '通用推理、深度思考、金融分析' };
  },

  /**
   * 切换模型
   * @param {string} modelId
   * @returns {Promise<Object>}
   */
  async switchModel(modelId) {
    const modelName = modelDisplayInfo[modelId]?.name || modelId;
    window.Storage.Model.setCurrentModel({ id: modelId, name: modelName });
    return { success: true, data: { id: modelId, name: modelName } };
  },

  /**
   * 获取模型支持的所有技能
   * @param {string} modelId
   * @returns {Promise<Array>}
   */
  async getSupportedSkills(modelId) {
    try {
      const response = await Api.Skill.getList();
      if (response && (response.code === '0' || response.success)) {
        const skills = response.data || response.rows || [];
        return skills.filter(s => s.modelId === modelId || !s.modelId);
      }
    } catch (error) {
      console.error('[ModelService] API获取支持技能失败:', error);
    }
    if (window.ModelMock) {
      return await window.ModelMock.ModelAPI.getSupportedSkills(modelId);
    }
    return [];
  }
};

window.ModelService = ModelService;
