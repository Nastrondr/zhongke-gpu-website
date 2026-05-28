/**
 * skills.js - 技能相关 Mock 数据
 *
 * 本文件存放技能相关的 mock 数据
 * 后续接入真实后端时，只需修改 getSkillList 等方法的实现
 *
 * 使用方式：通过 <script> 引入后，数据挂在 window.SkillMock 上
 */

window.SkillMock = {
  MOCK_SKILLS: [
    {
      id: 'skill-ocr',
      name: 'OCR识别',
      category: '文档类',
      description: '识别文档、票据与扫描资料',
      status: 'ready',
      supportedModels: ['finbert', 'fin-t5', 'deepseek-v3', 'qwen3.5'],
      isRecommended: true,
      icon: 'ocr'
    },
    {
      id: 'skill-data',
      name: '数据整理',
      category: '文档类',
      description: '自动整理结构化信息与资料内容',
      status: 'ready',
      supportedModels: ['finbert', 'fin-t5', 'deepseek-v3', 'glm-4-9b'],
      isRecommended: false,
      icon: 'data'
    },
    {
      id: 'skill-archive',
      name: '文档归档',
      category: '文档类',
      description: '将处理结果分类归档并写入文档库',
      status: 'unavailable',
      supportedModels: ['fin-t5', 'deepseek-v3'],
      isRecommended: false,
      icon: 'archive'
    },
    {
      id: 'skill-schedule',
      name: '任务调度',
      category: '任务类',
      description: '自动安排任务顺序并执行当前流程',
      status: 'ready',
      supportedModels: ['fin-t5', 'deepseek-v3', 'glm-4-9b'],
      isRecommended: false,
      icon: 'schedule'
    },
    {
      id: 'skill-reminder',
      name: '同步提醒',
      category: '任务类',
      description: '完成同步后自动提醒并推送结果',
      status: 'unavailable',
      supportedModels: ['deepseek-v3', 'qwen3.5'],
      isRecommended: false,
      icon: 'reminder'
    }
  ],

  SkillAPI: {
    getSkills() {
      return window.SkillMock.MOCK_SKILLS;
    },

    async getSkillList() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([...window.SkillMock.MOCK_SKILLS]);
        }, 300);
      });
    },

    async getSkillsByCategory(category) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const filtered = window.SkillMock.MOCK_SKILLS.filter(s => s.category === category);
          resolve(filtered);
        }, 200);
      });
    },

    async getSkillById(skillId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const skill = window.SkillMock.MOCK_SKILLS.find(s => s.id === skillId);
          resolve(skill || null);
        }, 200);
      });
    },

    async getSkillsByModel(modelId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const supported = window.SkillMock.MOCK_SKILLS.filter(s => s.supportedModels.includes(modelId));
          resolve(supported);
        }, 200);
      });
    },

    isSupported(skillId, modelId) {
      const skill = window.SkillMock.MOCK_SKILLS.find(s => s.id === skillId);
      if (!skill) return false;
      return skill.supportedModels.includes(modelId);
    },

    async executeSkill(skillId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const skill = window.SkillMock.MOCK_SKILLS.find(s => s.id === skillId);
          if (skill) {
            resolve({
              success: true,
              data: {
                taskId: 'task-' + Date.now(),
                skillId: skill.id,
                skillName: skill.name,
                status: 'running',
                startTime: new Date().toLocaleString('zh-CN')
              }
            });
          } else {
            resolve({ success: false, error: 'Skill not found' });
          }
        }, 500);
      });
    }
  }
};
