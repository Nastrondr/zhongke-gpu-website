/**
 * taskService.js - 任务相关 Service 层
 *
 * 职责：
 * - 对接真实后端 API（如果可用）
 * - 暂时禁用不存在的 /tasks 接口，返回空数组
 * - 使用 localStorage 作为离线缓存
 * - 提供统一的任务查询与新增接口
 * - 保留 Mock 回退能力（仅用于本地演示）
 */

const TaskService = {
  STORAGE_KEY: 'deviceTaskHistory',
  API_AVAILABLE: false,

  getTaskHistory() {
    try {
      const cached = localStorage.getItem(this.STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  },

  setTaskHistory(tasks) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  },

  async fetchTaskList(params = {}) {
    console.log('[TaskService] fetchTaskList: /tasks 接口暂不可用，返回空数组');
    return [];
  },

  async addTask(task) {
    try {
      const response = await Api.Task.create(task);
      if (response && (response.code === '0' || response.success)) {
        const newTask = response.data || task;
        const history = this.getTaskHistory();
        history.unshift({ ...newTask, createdAt: new Date().toISOString() });
        this.setTaskHistory(history);
        return history;
      }
    } catch (error) {
      console.error('[TaskService] API创建任务失败:', error);
    }
    const history = this.getTaskHistory();
    history.unshift({ ...task, id: Date.now(), createdAt: new Date().toISOString() });
    this.setTaskHistory(history);
    return history;
  },

  async getRecentTasks(limit = 3) {
    const tasks = await this.fetchTaskList({ pageSize: limit });
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    return safeTasks.slice(0, limit);
  },

  async getTasksBySource(source) {
    const tasks = await this.fetchTaskList({ source });
    return Array.isArray(tasks) ? tasks : [];
  },

  async getTaskStats() {
    const history = this.getTaskHistory();
    return {
      total: history.length,
      success: history.filter(t => t.status === 'success').length,
      failed: history.filter(t => t.status === 'failed').length,
      running: history.filter(t => t.status === 'running').length
    };
  },

  createSkillTask(skillId, skillName, category, modelId, deviceId) {
    console.log('[TaskService] createSkillTask 被调用:', { skillId, skillName, category, modelId, deviceId });

    const task = {
      name: skillName + '任务',
      category: category,
      source: 'skill',
      sourceName: skillName,
      status: 'success',
      relatedSkillId: skillId,
      relatedModelId: modelId,
      relatedDeviceId: deviceId
    };

    const result = this.addTask(task);
    console.log('[TaskService] 任务已创建:', task);

    return task;
  }
};

window.TaskService = TaskService;
