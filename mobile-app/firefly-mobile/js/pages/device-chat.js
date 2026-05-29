let currentDevice = null;
let isProcessing = false;
// sessionKey 由 OpenClawChatService 统一管理，init 时 resolveSessionKey 设置
let currentAssistantMessageId = null;  // 当前助手消息ID（用于暂停时更新）

// 区分设备状态和小龙虾状态
const runtimeState = {
  deviceOnline: false,
  deviceStatusText: '设备状态未知',
  wsAlive:false,
  openclawOnline: false,
  openclawStatusText: '检测中',
  
  canChat: false
};

// 更新状态显示
function updateStatusDisplay() {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const deviceStatusText = document.getElementById('deviceStatusText');
  const { deviceOnline, openclawOnline, wsAlive } = runtimeState;

  // 计算综合状态文本
  let overallStatus = '';
  let dotClass = 'offline';

  if (!deviceOnline) {
    overallStatus = '设备离线';
    dotClass = 'offline';
  } else if (deviceOnline && !openclawOnline) {
    overallStatus = '设备在线 · 服务未启动';
    dotClass = 'warning';
  } else if (deviceOnline && wsAlive) {
    overallStatus = '设备在线 · 服务已启动';
    dotClass = 'online';
  }

  // 右上角状态胶囊
  if (statusDot && statusText) {
    statusDot.className = 'status-dot ' + dotClass;
    statusText.textContent = overallStatus;
  }

  // 更新设备状态显示
  const deviceStatusDot = document.getElementById('deviceStatusDot');
  if (deviceStatusDot && deviceStatusDot) {
    deviceStatusDot.className = 'status-dot ' + (deviceOnline ? 'online' : 'offline');
  }
  if (deviceStatusText) {
    deviceStatusText.textContent = deviceOnline ? '设备在线' : '设备离线';
  }
}

// 查询小龙虾服务状态
async function checkOpenclawStatus(deviceId) {
  try {
    const result = await window.OpenClawChatService.queryOpenClawStatus(deviceId);
    const wasLive = result.wsAlive;
    runtimeState.openclawOnline = wasLive;
    runtimeState.openclawStatusText = wasLive ? '在线' : '离线';
    runtimeState.canChat = result.wsAvlie;
    runtimeState.wsAlive = result.wsAvlie;
    
    updateStatusDisplay();

    if (wasLive) {
      // 服务已上线
      clearSystemNotice('openclaw_offline_notice');
    } else {
      // 服务仍未上线
      addSystemNoticeOnce('openclaw_offline_notice', '萤火虫服务未在线，请确认服务已启动后重试。', 'warning');
    }
  } catch (e) {
    console.error('[DeviceChat] checkOpenclawStatus failed:', e);
    runtimeState.openclawOnline = false;
    runtimeState.openclawStatusText = '检测失败';
    runtimeState.canChat = false;
    updateStatusDisplay();
    addSystemNoticeOnce('openclaw_offline_notice', '萤火虫服务未在线，请确认服务已启动后重试。', 'warning');
  }
}

// 初始化运行时状态
async function initRuntimeState(device) {
  if (!device) return;
  
  // 设备状态
  const status = String(device?.status || '').toLowerCase();
  const manageState = String(device?.manageState || '').toLowerCase();
  runtimeState.deviceOnline = ['online', 'running', 'active'].includes(status) || 
                       ['online', 'running', 'active'].includes(manageState);
  runtimeState.deviceStatusText = runtimeState.deviceOnline ? '设备在线' : '设备离线';
  
  console.log('[StateDebug] deviceOnline:', runtimeState.deviceOnline, device?.status, device?.manageState);
  
  // 小龙虾服务状态
  const numericDeviceId = resolveNumericDeviceId(device);
  if (numericDeviceId) {
    console.log('[OpenClawDevice] numericDeviceId:', numericDeviceId, typeof numericDeviceId);
    console.log('[OpenClawDevice] iotDeviceUuid:', device?.iotDeviceUuid);
    console.log('[OpenClawDevice] routeDeviceId:', device?.routeDeviceId);
    console.log('[OpenClawDevice] sn:', device?.sn);
    await checkOpenclawStatus(numericDeviceId);
  }

  // 根据状态显示不同的消息
  if (runtimeState.deviceOnline && runtimeState.openclawOnline) {
    addAssistantMessage('萤火虫已就绪，可以帮你查询设备状态、执行任务或处理资料。');
  } else if (runtimeState.deviceOnline && !runtimeState.openclawOnline) {
    addSystemNoticeOnce('openclaw_offline_notice', '设备在线，但萤火虫服务未启动。请点击右上角刷新检测，或启动服务后再试。', 'warning');
  } else {
    addSystemNoticeOnce('device_offline_notice', '设备离线，请检查设备网络或电源。', 'error');
  }
}

// DEBUG 模式下显示测试按钮
if (typeof DEBUG_OPENCLAW !== 'undefined' && DEBUG_OPENCLAW) {
  const testBtn = document.getElementById('testCmd');
  if (testBtn) testBtn.style.display = 'block';
}

// 新建会话
function startNewSession() {
  const newKey = 'agent:main:mobile:' + Date.now();
  window.OpenClawChatService._activeSessionKey = newKey;
  console.log('[OpenClaw] new session:', newKey);

  // 清空聊天记录
  const container = document.getElementById('chatContainer');
  container.innerHTML = '';

  // 显示欢迎语
  addAssistantMessage('小龙虾已开启新会话，请发送新的指令。');
}

// 安全转义 HTML
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 渲染 assistant 消息的 Markdown —— 使用 marked 库
function renderAssistantMarkdown(text) {
  if (!text) return '';
  if (typeof marked !== 'undefined') {
    return marked.parse(text);
  }
  // fallback：marked 未加载时，仅做 HTML 转义和换行
  return escapeHtml(text).replace(/\n/g, '<br>');
}

// 从URL获取deviceId
function getDeviceIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('deviceId');
}

// 解析数字型 deviceId（用于 API 路径）
// 注意：此函数只返回数字 ID，不返回字符串 UUID
function resolveNumericDeviceId(device, fallbackId) {
  // 优先使用 device.id 或 device.deviceId
  const rawId = device?.id || device?.deviceId || fallbackId;
  const numericId = Number(rawId);
  
  if (!Number.isFinite(numericId)) {
    // 如果是 UUID 字符串，返回 null 并记录错误
    console.error('[DeviceId] invalid numeric device id', {
      rawId,
      deviceId: device?.id,
      deviceDeviceId: device?.deviceId,
      fallbackId,
      iotDeviceUuid: device?.iotDeviceUuid,
      routeDeviceId: device?.routeDeviceId,
      sn: device?.sn
    });
    return null;
  }
  
  console.log('[DeviceId] numericDeviceId:', numericId, typeof numericId);
  return numericId;
}

// 从设备对象中提取数字 ID（更宽松的解析）
function extractNumericDeviceId(device) {
  if (!device) return null;
  
  // 尝试多种来源
  const id = device.id || device.deviceId;
  if (!id) return null;
  
  const numericId = Number(id);
  return Number.isFinite(numericId) ? numericId : null;
}

// 初始化
async function init() {
  // 初始化主题
  ThemeManager.init();
  
  const urlDeviceId = getDeviceIdFromUrl();

  const deviceList = Storage.Device.getDeviceList() || [];
  const cached = Storage.Device.getCurrentDevice();

  // 尝试从 URL 获取数字 ID，或从缓存/列表中找到对应设备
  let targetDevice = null;
  let numericDeviceId = null;
  
  if (urlDeviceId) {
    // 尝试将 URL 中的 ID 转为数字
    numericDeviceId = Number(urlDeviceId);
    
    if (Number.isFinite(numericDeviceId)) {
      // URL 中是数字 ID，直接使用
      targetDevice = deviceList.find(d => d.id === numericDeviceId || String(d.id) === urlDeviceId) || cached;
    } else {
      // URL 中是 UUID 或其他字符串，在设备列表中查找
      console.log('[DeviceChat] URL deviceId is not numeric, searching device list...');
      targetDevice = deviceList.find(d => 
        d.iotDeviceUuid === urlDeviceId || 
        d.uuid === urlDeviceId || 
        d.routeDeviceUuid === urlDeviceId ||
        d.routeDeviceId === urlDeviceId ||
        d.sn === urlDeviceId
      ) || cached;
      
      // 如果找到设备，提取数字 ID
      if (targetDevice) {
        numericDeviceId = extractNumericDeviceId(targetDevice);
      }
    }
  } else {
    // 没有 URL deviceId，使用缓存设备
    targetDevice = cached;
    numericDeviceId = extractNumericDeviceId(targetDevice);
  }
  
  currentDevice = targetDevice;
  console.log('[DeviceChat] found device:', currentDevice);
  console.log('[DeviceChat] numericDeviceId:', numericDeviceId);

  if (!currentDevice) {
    showError('未找到设备，请从设备页进入');
    return;
  }
  
  // 验证数字 deviceId
  if (!numericDeviceId) {
    console.log('[DeviceChat] numericDeviceId is null, checking device...', currentDevice);
    // 尝试最后从 currentDevice 提取
    numericDeviceId = extractNumericDeviceId(currentDevice);
    if (!numericDeviceId) {
      showError('设备ID异常，请重新进入设备对话');
      return;
    }
  }
  
  console.log('[DeviceChat] validated numericDeviceId:', numericDeviceId);

  // 显示设备信息
  renderDeviceInfo();
  
  // 初始化运行时状态（设备状态 + 萤火虫服务状态）
  await initRuntimeState(currentDevice);

  // 初始化聊天服务
  window.OpenClawChatService.init(currentDevice);

  // 解析当前用户的 session key（查 sessionList 匹配，没有则创建）
  if (numericDeviceId && runtimeState.openclawOnline) {
    const sessionKey = await window.OpenClawChatService.resolveSessionKey(numericDeviceId);
    console.log('[UI] session key resolved:', sessionKey);
  }

  // 启动轮询系统（恢复轮询 -> 空闲轮询）
  if (numericDeviceId && runtimeState.openclawOnline) {
    window.OpenClawChatService.startPolling(numericDeviceId, {});
  }

  // 加载会话历史消息
  if (numericDeviceId && runtimeState.openclawOnline) {
    try {
      console.log('[UI] loading session history...');
      const historyMessages = await window.OpenClawChatService.loadSessionHistory(numericDeviceId);
      if (historyMessages.length > 0) {
        historyMessages.forEach(msg => {
          if (msg.role === 'user') {
            addUserMessage(msg.text, [], msg.timestamp);
          } else if (msg.role === 'assistant' && msg.text) {
            addAssistantMessage(msg.text, { timestamp: msg.timestamp });
          }
        });
        console.log('[UI] loaded ' + historyMessages.length + ' history messages');
      }
    } catch (e) {
      console.warn('[UI] loadSessionHistory error:', e);
    }
  }

  // 初始化输入框交互
  initComposer();
}

// 渲染设备信息
function renderDeviceInfo() {
  const nameEl = document.getElementById('deviceName');
  const dotEl = document.getElementById('statusDot');
  const textEl = document.getElementById('statusText');
  
  if (nameEl) nameEl.textContent = currentDevice?.name || '未知设备';
  
  const isOnline = currentDevice?.isOnline || currentDevice?.status === 'online';
  if (dotEl) {
    dotEl.className = 'status-dot ' + (isOnline ? 'online' : 'offline');
  }
  if (textEl) {
    textEl.textContent = isOnline ? '设备在线' : '设备离线';
  }
}

// 快捷指令
function sendQuickCmd(message) {
  if (isProcessing) return;
  handleSend(message);
}

// 更新发送按钮状态（处理中状态）
function updateSendButton(processing) {
  const sendBtn = document.getElementById('sendBtn');
  const chatInput = document.getElementById('chatInput');
  const multiModalBtn = document.getElementById('multiModalBtn');

  if (processing) {
    sendBtn.classList.add('processing');
    sendBtn.disabled = false;  // 可以点击暂停
    chatInput.disabled = true;
    if (multiModalBtn) multiModalBtn.disabled = true;
  } else {
    sendBtn.classList.remove('processing');
    sendBtn.disabled = false;
    chatInput.disabled = false;
    if (multiModalBtn) multiModalBtn.disabled = false;
  }
}

// 暂停当前任务
function handlePause() {
  if (!isProcessing) return;

  console.log('[Pause] stopping current task...');

  // 停止轮询
  window.OpenClawChatService.stopPolling();

  // 更新助手消息状态
  if (currentAssistantMessageId) {
    updateAssistantMessage(currentAssistantMessageId, '已停止回答', { status: 'paused' });
  }

  // 恢复UI状态
  isProcessing = false;
  currentAssistantMessageId = null;
  updateSendButton(false);

  // 添加系统提示
  addSystemNoticeOnce('pause_notice', '已停止当前任务，可以发送新指令。', 'info');
}

// 输入框键盘事件（处理快捷键）
function handleInputKeydown(e) {
  const input = document.getElementById('chatInput');

  // 全选：Ctrl+A (Windows/Linux) 或 Cmd+A (Mac)
  if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
    if (input && input.value.length > 0) {
      e.preventDefault();
      input.select();
    }
    return;
  }

  // 发送消息：Enter（不按Shift）
  if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
    e.preventDefault();
    handleSend();
    return;
  }

  // Shift+Enter 换行：不需要特殊处理，浏览器默认行为即可
}

// 回车发送（保留向后兼容）
function handleKeyPress(e) {
  if (e.key === 'Enter' && !e.shiftKey && !isProcessing) {
    e.preventDefault();
    handleSend();
  }
}

// 多模态功能：切换菜单（与whale-chat统一）
function toggleAttachMenu() {
  const menu = document.getElementById('attachMenu');
  if (menu.style.display === 'none') {
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
}

// 点击其他地方关闭菜单
document.addEventListener('click', function(e) {
  if (!e.target.closest('#attachMenu') && !e.target.closest('#multiModalBtn')) {
    const menu = document.getElementById('attachMenu');
    if (menu) menu.style.display = 'none';
  }
});

// 处理多模态上传（与whale-chat统一）
function handleMultimodalUpload(type) {
  const menu = document.getElementById('attachMenu');
  if (menu) menu.style.display = 'none';

  const fileInput = document.getElementById('fileInput');
  if (!fileInput) return;

  switch(type) {
    case 'image':
      fileInput.accept = 'image/*';
      break;
    case 'document':
      fileInput.accept = '.pdf,.doc,.docx,.txt';
      break;
    case 'spreadsheet':
      fileInput.accept = '.xls,.xlsx,.csv';
      break;
    case 'scan':
      fileInput.accept = 'image/*';
      break;
    case 'voice':
      if (typeof showToast === 'function') {
        showToast('语音输入将在后续版本开放', 'info');
      } else {
        alert('语音输入将在后续版本开放');
      }
      return;
  }

  fileInput.click();
}

// 待发送的附件列表（图片 + 文件）
window.pendingAttachments = window.pendingAttachments || [];

function handleFileSelected(event) {
  var files = Array.from(event.target.files);
  if (!files.length) return;

  files.forEach(function(file) {
    var fileName = file.name.toLowerCase();
    var mimeType = getMimeType(file.name);
    var isImage = mimeType.startsWith('image/');

    var reader = new FileReader();
    reader.onload = function(e) {
      var base64 = e.target.result.split(',')[1];

      var attachment = {
        content: base64,
        mimeType: mimeType,
        name: file.name
      };

      if (isImage) {
        attachment.type = 'image';
        // 保留完整 data URL 供预览使用
        attachment.previewUrl = e.target.result;
      } else {
        attachment.fileName = file.name;
      }

      window.pendingAttachments.push(attachment);
      updateImageStaging();
    };
    reader.readAsDataURL(file);
  });

  event.target.value = '';
}

// 处理图片上传
async function handleImageUpload(event) {
  var files = event.target.files;
  if (!files || files.length === 0) return;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      continue;
    }

    try {
      var base64 = await fileToBase64(file);
      window.pendingAttachments = window.pendingAttachments || [];
      window.pendingAttachments.push({
        type: 'image',
        mimeType: file.type,
        content: base64,
        name: file.name,
        previewUrl: 'data:' + file.type + ';base64,' + base64
      });
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
    }
  }

  updateImageStaging();
  event.target.value = '';
}

// 更新附件暂存区显示
function updateImageStaging() {
  var stagingArea = document.getElementById('imageStagingArea');
  if (!stagingArea) {
    var inputArea = document.querySelector('.input-area');
    var chatComposer = document.querySelector('.chat-composer');
    stagingArea = document.createElement('div');
    stagingArea.id = 'imageStagingArea';
    stagingArea.className = 'image-staging-area';
    if (chatComposer && inputArea) {
      inputArea.insertBefore(stagingArea, chatComposer);
    } else if (inputArea) {
      inputArea.appendChild(stagingArea);
    }
  }

  var attachments = window.pendingAttachments || [];

  if (attachments.length === 0) {
    stagingArea.style.display = 'none';
    return;
  }

  stagingArea.style.display = 'flex';

  var html = '';
  attachments.forEach(function(att, index) {
    if (att.type === 'image' && att.previewUrl) {
      html += '<div class="staged-image" style="position:relative;display:inline-block;margin:4px;">'
        + '<img src="' + att.previewUrl + '" style="width:60px;height:60px;object-fit:cover;border-radius:8px;">'
        + '<button onclick="removeStagedImage(' + index + ')" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:none;background:#ff4444;color:white;font-size:12px;cursor:pointer;line-height:1;">×</button>'
        + '</div>';
    } else {
      // 文件附件：显示文件图标 + 文件名
      var ext = (att.name || att.fileName || '').split('.').pop().toLowerCase();
      var iconColor = ext === 'pdf' ? '#ef4444' : (ext === 'xlsx' || ext === 'xls' || ext === 'csv' ? '#10b981' : '#60a5fa');
      html += '<div class="staged-file" style="position:relative;display:inline-flex;align-items:center;gap:6px;margin:4px;padding:8px 12px;background:var(--card-bg-soft, #f8f9fa);border-radius:8px;font-size:12px;max-width:160px;">'
        + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + iconColor + '" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
        + '<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-primary, #1f2937);">' + escapeHtml(att.name || att.fileName) + '</span>'
        + '<button onclick="removeStagedImage(' + index + ')" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;border:none;background:#ff4444;color:white;font-size:12px;cursor:pointer;line-height:1;">×</button>'
        + '</div>';
    }
  });

  stagingArea.innerHTML = html;
}

// 移除暂存附件
function removeStagedImage(index) {
  if (window.pendingAttachments) {
    window.pendingAttachments.splice(index, 1);
    updateImageStaging();
  }
}

// 文件转base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 根据文件名推断 MIME 类型
function getMimeType(fileName) {
  var ext = fileName.toLowerCase().split('.').pop();
  var mimeMap = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// 显示图片预览
function showImagePreview(src) {
  const modal = document.getElementById('imagePreviewModal');
  const img = document.getElementById('previewImage');
  img.src = src;
  modal.classList.add('active');
}

// 关闭图片预览
function closeImagePreview(event) {
  if (event && event.target.className === 'close-btn') return;
  const modal = document.getElementById('imagePreviewModal');
  modal.classList.remove('active');
}

// 渲染消息中的图片
function renderImages(images) {
  if (!images || images.length === 0) return '';

  const count = images.length;
  let gridClass = 'single';
  if (count === 2) gridClass = 'double';
  else if (count >= 3) gridClass = 'multiple';

  const imagesHtml = images.map(img =>
    `<img src="data:image/png;base64,${img}" onclick="showImagePreview(this.src)" alt="图片" style="cursor:pointer;">`
  ).join('');

  return `<div class="message-images ${gridClass}">${imagesHtml}</div>`;
}

// 发送消息
async function handleSend(customMessage = null) {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const message = (customMessage || input.value || '').trim();
  
  // 检查是否有待发送附件
  var pendingAttachments = window.pendingAttachments || [];
  var hasAttachments = pendingAttachments.length > 0;

  // 允许只发送图片/文档，或者只发送文字，或者两者都有
  if ((!message && !hasAttachments) || isProcessing) return;
  if (!currentDevice) {
    showError('未绑定设备');
    return;
  }

  const deviceUuid = window.OpenClawChatService.resolveDeviceUuid(currentDevice);
  if (!deviceUuid) {
    showError('当前设备缺少 iotDeviceUuid / uuid，暂无法连接萤火虫');
    return;
  }

  // 状态拦截
  if (!runtimeState.deviceOnline) {
    addSystemNoticeOnce('device_offline_notice', '设备离线，无法发送指令。请检查设备网络或电源。', 'error');
    return;
  }

  if (!runtimeState.openclawOnline) {
    addSystemNoticeOnce('openclaw_offline_notice', '设备在线，但萤火虫服务未启动。请先重新检测或启动服务。', 'warning');
    return;
  }

  const turnId = 'turn_' + Date.now();

  isProcessing = true;
  updateSendButton(true);  // 更新按钮状态为处理中

  // 提取图片用于消息气泡渲染
  var imageBase64List = [];
  var fileNames = [];
  if (hasAttachments) {
    pendingAttachments.forEach(function(att) {
      if (att.type === 'image') {
        imageBase64List.push(att.content);
      } else {
        fileNames.push(att.name || att.fileName);
      }
    });
  }

  addUserMessage(message, imageBase64List, null, fileNames);
  input.value = '';

  // 清空附件暂存区
  if (hasAttachments) {
    window.pendingAttachments = [];
    updateImageStaging();
  }

  // 创建助手消息气泡
  currentAssistantMessageId = addAssistantMessage('正在发送指令...', {
    status: 'loading',
    turnId: turnId
  });

  let commandCardId = null;

  const updateCurrentAssistant = (text, options = {}, meta = {}) => {
    const targetId = meta.assistantMessageId || currentAssistantMessageId;
    if (!targetId) {
      console.warn('[UIRender] drop assistant update: missing assistantMessageId');
      return;
    }
    updateAssistantMessage(targetId, text, options);
  };

  const addCommandCard = (output, index) => {
    const container = document.getElementById('chatContainer');
    const card = document.createElement('div');
    card.className = 'chat-card command-output';

    const header = document.createElement('div');
    header.className = 'card-header';
    header.textContent = '执行结果 #' + (index + 1);

    const body = document.createElement('div');
    body.className = 'card-body';

    const pre = document.createElement('pre');
    pre.className = 'command-output-text';
    pre.textContent = output.length > 500 ? output.substring(0, 500) + '...' : output;

    body.appendChild(pre);

    if (output.length > 500) {
      const toggle = document.createElement('button');
      toggle.className = 'card-toggle';
      toggle.textContent = '点击展开全部';
      toggle.onclick = () => {
        pre.textContent = pre.textContent.includes('...') ? output : output.substring(0, 500) + '...';
        toggle.textContent = pre.textContent.includes('...') ? '点击收起' : '点击展开全部';
      };
      body.appendChild(toggle);
    }

    card.appendChild(header);
    card.appendChild(body);
    container.appendChild(card);
    scrollToBottom();

    return card.id;
  };

  try {
    const response = await window.OpenClawChatService.sendMessageAndWait(currentDevice, message, {
      // Lifecycle 事件
      onLifecycleStart: (runId, data, meta = {}) => {
        updateCurrentAssistant('', { status: 'streaming' }, meta);
      },

      onLifecycleEnd: (data, meta = {}) => {},

      // Assistant 更新
      onAssistantUpdate: (text, meta = {}) => {
        updateCurrentAssistant(text, { status: 'streaming' }, meta);
      },

      // 命令输出
      onCommandOutput: (output, info, meta = {}) => {},

      // Final 完成
      onFinal: (text, meta = {}) => {
        updateCurrentAssistant(text, { status: 'done', final: true }, { ...meta, final: true });
      },

      // 警告提示
      onWarning: (msg, meta = {}) => {
        if (meta?.final || meta?.state === 'final') return;
        updateCurrentAssistant(msg, { status: 'loading' }, meta);
      },

      // 进入空闲状态
      onIdle: () => {}
    }, pendingAttachments, {
      turnId,
      assistantMessageId: currentAssistantMessageId
    });

    // 处理返回结果
    if (response?.success && response?.text) {
      updateCurrentAssistant(response.text, { status: 'done', final: response.isFinal });

      // 删除 warning DOM 追加逻辑，避免未定义变量问题
      // 直接使用 updateCurrentAssistant 处理即可
    } else if (!response?.success) {
      updateCurrentAssistant(response?.msg || '通信失败', { status: 'error' });
    } else {
      updateCurrentAssistant('暂未返回可读结果，请稍后重试。', { status: 'error' });
    }

  } catch (error) {
    console.error('[Turn] error:', error);
    updateCurrentAssistant(error.message || '通信失败', { status: 'error' });
  } finally {
    updateSendButton(false);  // 恢复按钮状态
    isProcessing = false;
    currentAssistantMessageId = null;
    input.value = '';  // 确保清空
    updateComposerState();  // 更新输入框状态
  }
}

// 重新生成消息
async function regenerateMessage(messageId) {
  console.log('[Regenerate] regenerating message:', messageId);
  
  // 找到对应的助手消息元素
  const messageEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (!messageEl) {
    console.error('[Regenerate] message not found:', messageId);
    return;
  }
  
  // 获取当前消息内容（用于重新发送相同问题）
  const contentEl = messageEl.querySelector('.message-content');
  if (!contentEl) return;
  
  // 获取上一条用户消息
  const messages = document.querySelectorAll('.chat-message');
  let userMessage = '';
  let found = false;
  
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].dataset.messageId === messageId) {
      found = true;
    } else if (found && messages[i].classList.contains('user')) {
      userMessage = messages[i].textContent || '';
      break;
    }
  }
  
  if (!userMessage) {
    console.error('[Regenerate] user message not found');
    return;
  }
  
  // 更新消息状态为重新生成中
  updateAssistantMessage(messageId, '重新生成中...', { status: 'loading' });
  
  // 发送消息
  await handleSend(userMessage);
}

// 复制消息内容
async function copyMessage(messageId, message) {
  console.log('[Copy] copying message:', messageId);
  
  try {
    // 复制到剪贴板
    await navigator.clipboard.writeText(message);
    
    // 显示复制成功提示
    showCopySuccess(messageId);
  } catch (err) {
    console.error('[Copy] failed:', err);
    
    // 降级方案：创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = message;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      showCopySuccess(messageId);
    } catch (e) {
      console.error('[Copy] fallback failed:', e);
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

// 显示复制成功提示
function showCopySuccess(messageId) {
  const msg = document.querySelector(`[data-message-id="${messageId}"]`);
  if (msg) {
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.textContent = '已复制';
    msg.parentNode.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 2000);
  }
}

// 引用功能 - 直接插入到输入框
function showQuoteSelector(messageId, message) {
  console.log('[Quote] inserting quote:', messageId);
  
  const input = document.getElementById('chatInput');
  if (input) {
    // 直接插入引用格式
    input.value = `> ${message.trim()}\n\n`;
    input.focus();
    // 自动调整输入框高度
    autoResizeInput(input);
  }
}

// 自动调整输入框高度
function autoResizeInput(textarea) {
  textarea.style.height = 'auto';
  const maxHeight = 160; // 最大高度限制
  const scrollHeight = textarea.scrollHeight;
  const newHeight = Math.min(scrollHeight, maxHeight);
  textarea.style.height = newHeight + 'px';
  
  // 更新 CSS 变量，供消息区 padding-bottom 使用
  const composer = document.getElementById('chatComposer');
  if (composer) {
    const composerHeight = Math.max(56, newHeight + 16); // 加上 padding
    document.documentElement.style.setProperty('--composer-height', `${composerHeight}px`);
  }
}

// 更新输入框组合器状态
function updateComposerState() {
  const chatComposer = document.getElementById('chatComposer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  
  if (!chatComposer || !chatInput) return;
  
  const hasText = chatInput.value.trim().length > 0;
  const isFocused = document.activeElement === chatInput;
  const isMultiline = chatInput.scrollHeight > 48; // 单行高度阈值
  const isProcessing = window.isProcessing || false;
  
  // 更新状态 class
  chatComposer.classList.toggle('has-text', hasText);
  chatComposer.classList.toggle('is-focused', isFocused && !isProcessing);
  chatComposer.classList.toggle('is-multiline', isMultiline);
  chatComposer.classList.toggle('is-processing', isProcessing);
  
  // 更新按钮显示
  if (hasText || isProcessing) {
    // 有文本或处理中时显示发送按钮
    if (sendBtn) sendBtn.style.display = 'flex';
    if (voiceBtn) voiceBtn.style.display = 'none';
  } else {
    // 无文本且非处理中时显示语音按钮
    if (sendBtn) sendBtn.style.display = 'none';
    if (voiceBtn) voiceBtn.style.display = 'flex';
  }
  
  // 调整输入框高度
  autoResizeInput(chatInput);
}

// 键盘弹出适配
function setupKeyboardAdaptation() {
  if (!window.visualViewport) return;
  
  const updateKeyboardOffset = () => {
    const vv = window.visualViewport;
    
    // 检查 visualViewport 是否接近全屏（键盘未弹出或已收起）
    const isFullScreen = vv.height >= window.innerHeight - 20;
    
    // 计算键盘偏移量
    let offset = isFullScreen ? 0 : Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    
    // 限制最大偏移量（避免异常值）
    const maxOffset = 360;
    offset = Math.min(offset, maxOffset);
    
    // 调试日志（仅开发环境）
    if (offset > 0) {
      console.debug('[Keyboard] offset:', offset, 'px');
    }
    
    document.documentElement.style.setProperty('--keyboard-offset', `${offset}px`);
    
    // 滚动到输入框位置（避免重复滚动）
    if (offset > 50) {
      setTimeout(() => {
        const inputArea = document.querySelector('.input-area');
        if (inputArea) {
          inputArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  };
  
  window.visualViewport.addEventListener('resize', updateKeyboardOffset);
  window.visualViewport.addEventListener('scroll', updateKeyboardOffset);
}

// 语音按钮点击处理
function handleVoiceClick() {
  // 语音功能开发中提示
  if (typeof showToast === 'function') {
    showToast('语音输入开发中', 'info');
  } else if (typeof alert === 'function') {
    alert('语音输入开发中');
  } else {
    console.log('[Voice] 语音输入开发中');
  }
}

// 初始化输入框交互
function initComposer() {
  const chatInput = document.getElementById('chatInput');
  const chatComposer = document.getElementById('chatComposer');
  const sendBtn = document.getElementById('sendBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const multiModalBtn = document.getElementById('multiModalBtn');
  
  // 空值检查
  if (!chatInput) {
    console.warn('[Composer] chatInput not found');
    return;
  }
  if (!chatComposer) {
    console.warn('[Composer] chatComposer not found');
    return;
  }
  if (!sendBtn) {
    console.warn('[Composer] sendBtn not found');
    return;
  }
  if (!voiceBtn) {
    console.warn('[Composer] voiceBtn not found');
    return;
  }
  if (!multiModalBtn) {
    console.warn('[Composer] multiModalBtn not found');
    return;
  }
  
  // 绑定事件
  chatInput.addEventListener('focus', () => {
    if (!window.isProcessing) {
      updateComposerState();
    }
  });
  
  chatInput.addEventListener('blur', () => {
    if (!window.isProcessing) {
      updateComposerState();
    }
  });
  
  chatInput.addEventListener('input', () => {
    updateComposerState();
  });
  
  chatInput.addEventListener('keydown', handleInputKeydown);
  chatInput.addEventListener('keypress', handleKeyPress);
  
  // 设置键盘适配
  setupKeyboardAdaptation();
  
  // 初始化状态
  updateComposerState();
}

// 添加用户消息
function addUserMessage(message, images, timestamp, fileNames) {
  images = images || [];
  fileNames = fileNames || [];
  var container = document.getElementById('chatContainer');
  var div = document.createElement('div');
  div.className = 'chat-message user';

  var content = '';
  // 渲染图片
  if (images.length > 0) {
    content += renderImages(images);
  }
  content += '<div class="message-text">' + escapeHtml(message) + '</div>';
  // 渲染文件附件名
  if (fileNames.length > 0) {
    content += '<div class="message-files">';
    fileNames.forEach(function(name) {
      content += '<span class="file-chip">' + escapeHtml(name) + '</span>';
    });
    content += '</div>';
  }
  // 时间
  if (timestamp) {
    content += '<div class="message-time">' + formatTime(timestamp) + '</div>';
  }

  div.innerHTML = content;
  container.appendChild(div);
  scrollToBottom();
}

// 渲染消息内容（支持 Markdown）
function renderMessageContent(text) {
  if (typeof renderAssistantMarkdown === 'function') {
    return renderAssistantMarkdown(text);
  }
  return text;
}

// 添加助手消息（带 data-message-id）
function addAssistantMessage(message, options = {}) {
  const container = document.getElementById('chatContainer');
  const id = options.id || `assistant_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // 外层行容器
  const rowDiv = document.createElement('div');
  rowDiv.className = 'message-row assistant';

  // assistant 消息统一宽度容器
  const wrapDiv = document.createElement('div');
  wrapDiv.className = 'assistant-message-wrap';

  // 气泡
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble assistant-bubble';
  bubbleDiv.dataset.messageId = id;
  bubbleDiv.dataset.turnId = options.turnId || '';

  if (options.isError) {
    bubbleDiv.classList.add('error');
  }
  if (options.warning) {
    bubbleDiv.classList.add('warning');
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = renderMessageContent(message);
  bubbleDiv.appendChild(contentDiv);

  if (options.warning) {
    const warningDiv = document.createElement('div');
    warningDiv.className = 'chat-warning';
    warningDiv.textContent = options.warning;
    bubbleDiv.appendChild(warningDiv);
  }

  wrapDiv.appendChild(bubbleDiv);

  // 元信息行（操作按钮 + 时间戳）
  const metaRow = document.createElement('div');
  metaRow.className = 'message-meta-row assistant-meta-row';

  // 操作按钮
  if (!options.isError && message && message.length > 0) {
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'message-actions';

    // 重新生成按钮
    const regenerateBtn = document.createElement('button');
    regenerateBtn.className = 'message-action-btn';
    regenerateBtn.title = '重新生成';
    regenerateBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
      </svg>
    `;
    regenerateBtn.onclick = () => regenerateMessage(id);
    actionsDiv.appendChild(regenerateBtn);

    // 复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.className = 'message-action-btn';
    copyBtn.title = '复制';
    copyBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
    `;
    copyBtn.onclick = () => copyMessage(id, message);
    actionsDiv.appendChild(copyBtn);

    // 引用按钮
    const quoteBtn = document.createElement('button');
    quoteBtn.className = 'message-action-btn';
    quoteBtn.title = '引用';
    quoteBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;
    quoteBtn.onclick = () => showQuoteSelector(id, message);
    actionsDiv.appendChild(quoteBtn);

    // 点赞按钮
    const likeBtn = document.createElement('button');
    likeBtn.className = 'message-action-btn';
    likeBtn.title = '点赞';
    likeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
      </svg>
    `;
    likeBtn.onclick = () => handleLike(id);
    actionsDiv.appendChild(likeBtn);

    // 点踩按钮
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'message-action-btn';
    dislikeBtn.title = '点踩';
    dislikeBtn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
      </svg>
    `;
    dislikeBtn.onclick = () => handleDislike(id);
    actionsDiv.appendChild(dislikeBtn);

    metaRow.appendChild(actionsDiv);
  }

  // 时间戳
  const timeSpan = document.createElement('span');
  timeSpan.className = 'message-time';
  timeSpan.textContent = formatTime(options.timestamp || Date.now());
  metaRow.appendChild(timeSpan);

  wrapDiv.appendChild(metaRow);
  rowDiv.appendChild(wrapDiv);
  container.appendChild(rowDiv);
  scrollToBottom();

  return id;
}

// 更新助手消息内容
function updateAssistantMessage(messageId, text, options = {}) {
  if (!messageId) {
    console.warn('[UIRender] drop assistant update: missing messageId');
    return false;
  }

  const el = document.querySelector(`[data-message-id="${messageId}"]`);

  if (!el) {
    console.error('[UIRender] assistant message not found:', messageId);
    return false;
  }

  const contentEl =
    el.querySelector('.message-content') ||
    el.querySelector('.bubble-content') ||
    el.querySelector('.assistant-content') ||
    el;

  contentEl.innerHTML = renderMessageContent(text);

  el.classList.remove('loading', 'streaming', 'error', 'warning', 'paused');
  if (options.status) {
    el.classList.add(options.status);
  }
  
  scrollToBottom();
  return true;
}

// 添加助手气泡（可更新的，兼容旧接口）
function addAssistantBubble(message, status = null) {
  const container = document.getElementById('chatContainer');
  const id = `bubble_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const div = document.createElement('div');
  div.className = 'chat-message assistant';
  div.dataset.messageId = id;
  
  if (status) {
    div.classList.add(status);
  }
  
  const bubbleContent = document.createElement('div');
  bubbleContent.className = 'bubble-content';
  bubbleContent.textContent = message;
  div.appendChild(bubbleContent);
  
  if (status) {
    const bubbleStatus = document.createElement('div');
    bubbleStatus.className = 'bubble-status';
    bubbleStatus.textContent = status;
    div.appendChild(bubbleStatus);
  }
  
  container.appendChild(div);
  scrollToBottom();
  
  console.log('[UIRender] addAssistantBubble', { id, status, textPreview: String(message).slice(0, 50) });
  return id;
}

// 添加loading消息
function addLoadingMessage(message) {
  const container = document.getElementById('chatContainer');
  const div = document.createElement('div');
  div.className = 'chat-message assistant loading typing';
  div.id = 'loading-' + Date.now();
  div.textContent = message;
  container.appendChild(div);
  scrollToBottom();
  return div.id;
}

// 显示错误
function showError(message) {
  const container = document.getElementById('chatContainer');
  const div = document.createElement('div');
  div.className = 'chat-message error';
  div.textContent = message;
  container.appendChild(div);
  scrollToBottom();
}

function addSystemNoticeOnce(id, text, type = 'warning') {
  if (document.querySelector(`[data-notice-id="${id}"]`)) return;

  const container = document.getElementById('chatContainer');
  const notice = document.createElement('div');
  notice.className = `chat-message system-notice ${type}`;
  notice.dataset.noticeId = id;
  notice.textContent = text;
  container.appendChild(notice);
  scrollToBottom();
}

function clearSystemNotice(id) {
  const notice = document.querySelector(`[data-notice-id="${id}"]`);
  if (notice) notice.remove();
}

// 移除消息
function removeMessage(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

// 切换原始JSON显示
function toggleRaw(el) {
  const parent = el.parentElement;
  const raw = parent.dataset.raw;
  if (raw) {
    if (el.textContent.includes('展开')) {
      el.textContent = '▲ 收起原始JSON';
      const rawDiv = document.createElement('div');
      rawDiv.className = 'chat-raw';
      rawDiv.textContent = raw;
      parent.appendChild(rawDiv);
    } else {
      el.textContent = '▼ 点击展开原始JSON';
      const rawDiv = parent.querySelector('.chat-raw');
      if (rawDiv) rawDiv.remove();
    }
  }
}

// 格式化消息时间
function formatTime(time) {
  if (!time) return '刚刚';
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// 点赞
function handleLike(messageId) {
  console.log('[DeviceChat] Like message:', messageId);
}

// 点踩
function handleDislike(messageId) {
  console.log('[DeviceChat] Dislike message:', messageId);
}

// 滚动到底部
function scrollToBottom() {
  const container = document.getElementById('chatContainer');
  container.scrollTop = container.scrollHeight;
}

// 页面加载完成
document.addEventListener('DOMContentLoaded', init);
