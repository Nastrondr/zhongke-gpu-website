/**
 * tasks.js - 任务相关 Mock 数据
 *
 * 本文件存放任务相关的 mock 数据
 * 实际任务历史存储在 localStorage（运行时状态）
 * 本文件提供初始化数据和辅助方法
 *
 * 使用方式：通过 <script> 引入后，数据挂在 window.TaskMock 上
 */

window.TaskMock = {
  INITIAL_TASKS: [
    {
      id: 'task-001',
      name: 'OCR识别任务',
      category: '文档类',
      source: 'skill',
      sourceName: 'OCR识别',
      status: 'success',
      time: '今天 14:32',
      relatedDeviceId: 'LX-02-B7H9',
      relatedModelId: 'finbert',
      relatedSkillId: 'skill-ocr'
    },
    {
      id: 'task-002',
      name: '数据整理任务',
      category: '文档类',
      source: 'skill',
      sourceName: '数据整理',
      status: 'success',
      time: '今天 11:20',
      relatedDeviceId: 'LX-02-B7H9',
      relatedModelId: 'finbert',
      relatedSkillId: 'skill-data'
    },
    {
      id: 'task-003',
      name: 'DeepSeek-V3 切换',
      category: '模型类',
      source: 'model',
      sourceName: '模型切换',
      status: 'success',
      time: '今天 10:32',
      relatedDeviceId: 'LX-02-B7H9',
      relatedModelId: 'deepseek-v3'
    },
    {
      id: 'task-004',
      name: '任务调度任务',
      category: '任务类',
      source: 'skill',
      sourceName: '任务调度',
      status: 'success',
      time: '昨天 16:45',
      relatedDeviceId: 'LX-02-B7H9',
      relatedModelId: 'fin-t5',
      relatedSkillId: 'skill-schedule'
    },
    {
      id: 'task-005',
      name: '文档归档任务',
      category: '文档类',
      source: 'skill',
      sourceName: '文档归档',
      status: 'failed',
      time: '昨天 15:30',
      relatedDeviceId: 'LX-02-B7H9',
      relatedModelId: 'glm-4-9b',
      relatedSkillId: 'skill-archive'
    }
  ],

  STORAGE_KEY: 'deviceTaskHistory',

  getTaskHistory() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [...this.INITIAL_TASKS];
    } catch {
      return [...this.INITIAL_TASKS];
    }
  },

  setTaskHistory(tasks) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(tasks));
  },

  addTask(task) {
    const tasks = this.getTaskHistory();
    tasks.unshift({
      id: 'task-' + Date.now(),
      ...task,
      time: '今天 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    });
    this.setTaskHistory(tasks);
    return tasks;
  },

  getRecentTasks(limit = 3) {
    return this.getTaskHistory().slice(0, limit);
  },

  getTasksBySource(source) {
    return this.getTaskHistory().filter(t => t.source === source);
  },

  getTaskStats() {
    const tasks = this.getTaskHistory();
    return {
      total: tasks.length,
      success: tasks.filter(t => t.status === 'success').length,
      failed: tasks.filter(t => t.status === 'failed').length,
      running: tasks.filter(t => t.status === 'running').length
    };
  }
};
