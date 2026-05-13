/**
 * taskService.js - 任务相关 Service 层
 *
 * 职责：
 * - 提供统一的任务查询与新增接口
 * - 整合 localStorage 运行时状态（任务历史）
 * - 读取 window.TaskMock 获取 mock 数据
 *
 * 页面以后应调用此服务，而不是直接操作任务数组
 */

const TaskService = {
  STORAGE_KEY: 'deviceTaskHistory',

  getTaskHistory() {
    if (window.TaskMock) {
      return window.TaskMock.getTaskHistory();
    }
    return [];
  },

  setTaskHistory(tasks) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  },

  addTask(task) {
    if (window.TaskMock) {
      return window.TaskMock.addTask(task);
    }
    return [];
  },

  getRecentTasks(limit = 3) {
    if (window.TaskMock) {
      return window.TaskMock.getRecentTasks(limit);
    }
    return [];
  },

  getTasksBySource(source) {
    if (window.TaskMock) {
      return window.TaskMock.getTasksBySource(source);
    }
    return [];
  },

  getTaskStats() {
    if (window.TaskMock) {
      return window.TaskMock.getTaskStats();
    }
    return { total: 0, success: 0, failed: 0, running: 0 };
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
    console.log('[TaskService] 当前任务总数:', this.getTaskHistory().length);

    return task;
  }
};

window.TaskService = TaskService;
