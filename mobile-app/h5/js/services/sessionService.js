/**
 * SessionManager - 会话管理服务
 *
 * 提供会话的列表、创建、删除、重置、切换功能
 * 基于 OpenClaw Gateway WS 协议封装
 */

const SessionManager = {
  KEY: 'session_',

  currentSessionKey: 'agent:main:main',

  _storage: null,

  init() {
    this._storage = window.Storage || {
      get: (k, v) => localStorage.getItem(k) || v,
      set: (k, v) => localStorage.setItem(k, v),
      remove: (k) => localStorage.removeItem(k)
    };
  },

  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  async list() {
    const sessions = this._storage.get(this.KEY + 'list', []) || [];
    return {
      ok: true,
      payload: { sessions }
    };
  },

  async create(sessionKey, label, agentId = 'default') {
    const sessions = this._storage.get(this.KEY + 'list', []) || [];
    const newSession = {
      key: sessionKey || `session_${Date.now()}`,
      label: label || '新会话',
      agentId: agentId,
      messageCount: 0,
      lastActivityMs: Date.now(),
      active: true
    };

    sessions.push(newSession);
    this._storage.set(this.KEY + 'list', sessions);

    return {
      ok: true,
      payload: { session: newSession }
    };
  },

  async delete(sessionKey) {
    const sessions = this._storage.get(this.KEY + 'list', []) || [];
    const filtered = sessions.filter(s => s.key !== sessionKey);
    this._storage.set(this.KEY + 'list', filtered);

    if (this.currentSessionKey === sessionKey) {
      this.currentSessionKey = 'agent:main:main';
      this._storage.set(this.KEY + 'current', this.currentSessionKey);
    }

    return { ok: true };
  },

  async reset(sessionKey) {
    const sessions = this._storage.get(this.KEY + 'list', []) || [];
    const idx = sessions.findIndex(s => s.key === sessionKey);
    if (idx !== -1) {
      sessions[idx].messageCount = 0;
      sessions[idx].lastActivityMs = Date.now();
      this._storage.set(this.KEY + 'list', sessions);
    }

    return { ok: true };
  },

  async rename(sessionKey, newLabel) {
    const sessions = this._storage.get(this.KEY + 'list', []) || [];
    const idx = sessions.findIndex(s => s.key === sessionKey);
    if (idx !== -1) {
      sessions[idx].label = newLabel;
      this._storage.set(this.KEY + 'list', sessions);
    }

    return { ok: true };
  },

  getCurrentSession() {
    return this._storage.get(this.KEY + 'current', 'agent:main:main') || 'agent:main:main';
  },

  setCurrentSession(sessionKey) {
    this.currentSessionKey = sessionKey;
    this._storage.set(this.KEY + 'current', sessionKey);
  },

  formatTime(timestamp) {
    if (!timestamp) return '--';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

    return `${date.getMonth() + 1}-${date.getDate()}`;
  }
};

window.SessionManager = SessionManager;