/**
 * models.js - 模型相关 Mock 数据
 *
 * 本文件存放模型相关的 mock 数据
 * 后续接入真实后端时，只需修改 getModelList 等方法的实现
 *
 * 使用方式：通过 <script> 引入后，数据挂在 window.ModelMock 上
 */

window.ModelMock = {
  MOCK_MODELS: [
    {
      id: 'finbert',
      name: 'FinBERT',
      tag: '金融理解',
      description: '金融文本理解、情绪判断、资讯分析',
      inputPrice: 0.12,
      outputPrice: 0.35,
      supportedSkills: ['market-analysis', 'report-analysis', 'data-organization'],
      isCurrent: true,
      status: 'normal',
      lastSwitchTime: '今天 10:32'
    },
    {
      id: 'fin-t5',
      name: 'Fin-T5',
      tag: '金融处理',
      description: '摘要生成、问答、金融文档处理',
      inputPrice: 0.15,
      outputPrice: 0.42,
      supportedSkills: ['report-analysis', 'doc-archive', 'task-schedule'],
      isCurrent: false,
      status: 'normal'
    },
    {
      id: 'deepseek-v3',
      name: 'DeepSeek-V3',
      tag: '通用推理',
      description: '通用问答、逻辑分析、日常任务',
      inputPrice: 0.08,
      outputPrice: 0.28,
      supportedSkills: ['ocr', 'data-organization', 'task-schedule', 'sync-remind', 'device-link'],
      isCurrent: false,
      status: 'normal'
    },
    {
      id: 'qwen3.5',
      name: 'qwen3.5',
      tag: '轻量模型',
      description: '轻量本地推理、高频任务处理',
      inputPrice: 0.05,
      outputPrice: 0.18,
      supportedSkills: ['ocr', 'sync-remind', 'device-link'],
      isCurrent: false,
      status: 'normal'
    },
    {
      id: 'glm-4-9b',
      name: 'GLM-4-9B-Chat',
      tag: '对话模型',
      description: '对话交互、综合内容生成',
      inputPrice: 0.10,
      outputPrice: 0.32,
      supportedSkills: ['market-analysis', 'data-organization', 'task-schedule'],
      isCurrent: false,
      status: 'normal'
    }
  ],

  ModelAPI: {
    async getModelList() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...window.ModelMock.MOCK_MODELS]);
        }, 300);
      });
    },

    async getCurrentModel() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const current = window.ModelMock.MOCK_MODELS.find(m => m.isCurrent);
          resolve(current || null);
        }, 200);
      });
    },

    async getModelById(modelId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const model = window.ModelMock.MOCK_MODELS.find(m => m.id === modelId);
          resolve(model || null);
        }, 200);
      });
    },

    async switchModel(modelId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const model = window.ModelMock.MOCK_MODELS.find(m => m.id === modelId);
          if (model) {
            window.ModelMock.MOCK_MODELS.forEach(m => m.isCurrent = false);
            model.isCurrent = true;
            model.lastSwitchTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
            resolve({ success: true, data: model });
          } else {
            resolve({ success: false, error: 'Model not found' });
          }
        }, 500);
      });
    },

    async getSupportedSkills(modelId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const model = window.ModelMock.MOCK_MODELS.find(m => m.id === modelId);
          resolve(model ? model.supportedSkills : []);
        }, 200);
      });
    }
  }
};
