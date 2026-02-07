// ========== 定数 ==========
const API_BASE = 'https://public.api.aibo.com/v1';
const STORAGE_KEY_TOKEN = 'aibo_token';
const STORAGE_KEY_DEVICE = 'aibo_device_id';
const STORAGE_KEY_DEVICE_NAME = 'aibo_device_name';

// ========== 状態管理 ==========
let currentToken = '';
let currentDeviceId = '';
let currentDeviceName = '';
let isStandbyMode = false;

// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  updateUI();
});

function loadSettings() {
  currentToken = localStorage.getItem(STORAGE_KEY_TOKEN) || '';
  currentDeviceId = localStorage.getItem(STORAGE_KEY_DEVICE) || '';
  currentDeviceName = localStorage.getItem(STORAGE_KEY_DEVICE_NAME) || '';

  document.getElementById('tokenInput').value = currentToken;
}

function updateUI() {
  const isReady = currentToken && currentDeviceId;

  document.getElementById('setupRequired').classList.toggle('hidden', isReady);
  document.getElementById('actionPanel').classList.toggle('hidden', !isReady);
  document.getElementById('headerStatus').textContent = isReady
    ? `${currentDeviceName || 'aibo'} と接続中`
    : '設定が必要です';

  if (currentDeviceId) {
    document.getElementById('deviceInfo').style.display = 'block';
    document.getElementById('deviceName').textContent = currentDeviceName || currentDeviceId;
  } else {
    document.getElementById('deviceInfo').style.display = 'none';
  }
}

// ========== 設定関連 ==========
function toggleSettings() {
  const content = document.getElementById('settingsContent');
  const arrow = document.getElementById('settingsArrow');
  const isShow = content.classList.toggle('show');
  arrow.textContent = isShow ? '▲' : '▼';
}

function saveToken() {
  const token = document.getElementById('tokenInput').value.trim();
  if (!token) {
    alert('トークンを入力してください');
    return;
  }

  currentToken = token;
  localStorage.setItem(STORAGE_KEY_TOKEN, token);

  // トークン変更時はデバイス情報をクリア
  currentDeviceId = '';
  currentDeviceName = '';
  localStorage.removeItem(STORAGE_KEY_DEVICE);
  localStorage.removeItem(STORAGE_KEY_DEVICE_NAME);

  updateUI();
  alert('トークンを保存しました。\n「接続テスト」を押してaiboと接続してください。');
}

async function fetchDevices() {
  if (!currentToken) {
    alert('先にトークンを保存してください');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/devices`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.devices || data.devices.length === 0) {
      alert('aiboが見つかりませんでした。\nトークンを確認してください。');
      return;
    }

    // 最初のデバイスを使用
    const device = data.devices[0];
    currentDeviceId = device.deviceId;
    currentDeviceName = device.nickname || 'aibo';

    localStorage.setItem(STORAGE_KEY_DEVICE, currentDeviceId);
    localStorage.setItem(STORAGE_KEY_DEVICE_NAME, currentDeviceName);

    updateUI();
    alert(`${currentDeviceName} と接続しました！`);

  } catch (error) {
    alert(`接続エラー: ${error.message}`);
  }
}

// ========== アクション実行 ==========
const ACTION_MAP = {
  'paw': { category: 'paw', name: 'お手' },
  'highFive': { category: 'highFive', name: 'ハイタッチ' },
  'bark': { category: 'bark', name: 'ほえて' },
  'friendly': { category: 'friendly', name: 'なかよし' },
  'dance': { category: 'dance', name: 'ダンス' },
  'sing': { category: 'sing', name: '歌う' },
  'stretch': { category: 'stretch', name: '伸び' },
  'overJoyed': { category: 'overJoyed', name: '大喜び' }
};

async function executeAction(actionKey) {
  const action = ACTION_MAP[actionKey];
  if (!action) return;

  showStatus('loading', `${action.name} を実行中...`, 'actionStatus');

  // ボタンを一時的に無効化
  const buttons = document.querySelectorAll('.action-btn');
  buttons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/play_motion/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arguments: {
          Category: action.category,
          Mode: 'NONE'
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    showStatus('success', `${action.name} を指示しました！`, 'actionStatus');

    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}

// ========== 姿勢変更 ==========
const POSTURE_MAP = {
  'back': { name: 'おなかを見せる' },
  'crouch': { name: 'しゃがむ' },
  'down': { name: '伏せる' },
  'down_and_lengthen_behind': { name: '寝転がる' },
  'down_and_shorten_behind': { name: '足を曲げて寝転がる' },
  'sit_and_raise_both_hands': { name: '両前足あげる' },
  'sit': { name: 'すわる' },
  'sleep': { name: '寝る姿勢' },
  'stand': { name: '立つ' },
  'stand_straight': { name: 'まっすぐ立つ' }
};

async function executePosture(postureKey) {
  const posture = POSTURE_MAP[postureKey];
  if (!posture) return;

  showStatus('loading', `${posture.name} を実行中...`, 'actionStatus');

  const buttons = document.querySelectorAll('.action-btn, .mode-btn');
  buttons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/change_posture/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arguments: {
          FinalPosture: postureKey
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    showStatus('success', `${posture.name} を指示しました！`, 'actionStatus');

    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}

// ========== モード切替 ==========
function updateModeButton() {
  const btn = document.getElementById('modeBtn');
  if (isStandbyMode) {
    btn.textContent = '▶️ 指示待ちを解除する';
    btn.className = 'mode-btn normal';
  } else {
    btn.textContent = '⏸️ 指示待ちにする';
    btn.className = 'mode-btn standby';
  }
}

async function toggleMode() {
  const newMode = isStandbyMode ? 'NORMAL' : 'DEVELOPMENT';
  const label = isStandbyMode ? '指示待ち解除' : '指示待ち';
  const modeBtn = document.getElementById('modeBtn');

  showStatus('loading', `${label}に切り替え中...`, 'actionStatus');
  modeBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/set_mode/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arguments: {
          ModeName: newMode
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    isStandbyMode = !isStandbyMode;
    updateModeButton();
    showStatus('success', `${label}に切り替えました！`, 'actionStatus');

    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    modeBtn.disabled = false;
  }
}

function showStatus(type, message, targetId = 'actionStatus') {
  const statusEl = document.getElementById(targetId);
  statusEl.className = `status show ${type}`;
  statusEl.textContent = message;
}

// ========== タブ切替 ==========
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  if (tabName === 'info') {
    document.getElementById('tabInfo').classList.add('active');
    document.getElementById('tabContentInfo').classList.add('active');
  } else {
    document.getElementById('tabAction').classList.add('active');
    document.getElementById('tabContentAction').classList.add('active');
  }
}

// ========== バッテリー状態取得 (HungryStatus) ==========
const HUNGRY_STATUS_MAP = {
  'satisfied': { icon: '🔋', label: '満充電', desc: 'チャージステーションの上で、十分に充電されています' },
  'eating':    { icon: '🔌', label: '充電中', desc: 'チャージステーションの上で充電中です' },
  'enough':    { icon: '✅', label: '十分', desc: '十分に移動可能なほど充電されています' },
  'hungry':    { icon: '⚠️', label: '残りわずか', desc: '移動はできますが、充電が必要です' },
  'famished':  { icon: '🪫', label: 'バッテリー切れ', desc: '移動もできないほどバッテリー残量が少ないです' }
};

async function checkHungryStatus() {
  const checkBtn = document.getElementById('hungryCheckBtn');
  checkBtn.disabled = true;
  showStatus('loading', 'バッテリー状態を取得中...', 'infoStatus');

  try {
    // Step 1: Execute hungry_status
    const execResponse = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/hungry_status/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!execResponse.ok) {
      const error = await execResponse.json();
      throw new Error(error.message || `HTTP ${execResponse.status}`);
    }

    const execData = await execResponse.json();
    const executionId = execData.executionId;

    // Step 2: Poll for result
    const result = await pollExecution(executionId);

    if (result.status === 'SUCCEEDED' && result.result && result.result.hungry_status) {
      const energy = result.result.hungry_status.energy;
      updateHungryStatusDisplay(energy);
      showStatus('success', 'バッテリー状態を取得しました！', 'infoStatus');

      setTimeout(() => {
        document.getElementById('infoStatus').classList.remove('show');
      }, 3000);
    } else if (result.status === 'FAILED') {
      throw new Error('実行に失敗しました');
    } else {
      throw new Error(`予期しないステータス: ${result.status}`);
    }

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'infoStatus');
  } finally {
    checkBtn.disabled = false;
  }
}

async function pollExecution(executionId, maxRetries = 10, interval = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    await new Promise(resolve => setTimeout(resolve, interval));

    const response = await fetch(`${API_BASE}/executions/${executionId}`, {
      headers: { 'Authorization': `Bearer ${currentToken}` }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'SUCCEEDED' || data.status === 'FAILED') {
      return data;
    }
  }

  throw new Error('タイムアウト: 結果を取得できませんでした');
}

function updateHungryStatusDisplay(energy) {
  const info = HUNGRY_STATUS_MAP[energy] || { icon: '❓', label: energy, desc: '不明な状態です' };

  document.getElementById('hungryStatusIcon').textContent = info.icon;
  document.getElementById('hungryStatusLabel').textContent = info.label;
  document.getElementById('hungryStatusDesc').textContent = info.desc;

  const display = document.getElementById('hungryStatusDisplay');
  display.className = `hungry-status-display status-${energy}`;
}

// ========== 眠さ状態取得 (SleepyStatus) ==========
const SLEEPY_STATUS_MAP = {
  'no_sleepy':  { icon: '😆', label: '元気', desc: 'まったく眠くなく、元気に活動中' },
  'boring':     { icon: '😐', label: '退屈', desc: '刺激がなく、退屈な状態' },
  'sleepy':     { icon: '😪', label: '眠い', desc: '眠くなってきた状態' },
  'very_sleepy':{ icon: '😴', label: 'とても眠い', desc: 'かなり眠く、もう少しで寝そうな状態' }
};

async function checkSleepyStatus() {
  const checkBtn = document.getElementById('sleepyCheckBtn');
  checkBtn.disabled = true;
  showStatus('loading', '眠さ状態を取得中...', 'infoStatus');

  try {
    // Step 1: Execute sleepy_status
    const execResponse = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/sleepy_status/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!execResponse.ok) {
      const error = await execResponse.json();
      throw new Error(error.message || `HTTP ${execResponse.status}`);
    }

    const execData = await execResponse.json();
    const executionId = execData.executionId;

    // Step 2: Poll for result
    const result = await pollExecution(executionId);

    if (result.status === 'SUCCEEDED' && result.result && result.result.sleepy_status) {
      const status = result.result.sleepy_status.status;
      updateSleepyStatusDisplay(status);
      showStatus('success', '眠さ状態を取得しました！', 'infoStatus');

      setTimeout(() => {
        document.getElementById('infoStatus').classList.remove('show');
      }, 3000);
    } else if (result.status === 'FAILED') {
      throw new Error('実行に失敗しました');
    } else {
      throw new Error(`予期しないステータス: ${result.status}`);
    }

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'infoStatus');
  } finally {
    checkBtn.disabled = false;
  }
}

function updateSleepyStatusDisplay(status) {
  const info = SLEEPY_STATUS_MAP[status] || { icon: '❓', label: status, desc: '不明な状態です' };

  document.getElementById('sleepyStatusIcon').textContent = info.icon;
  document.getElementById('sleepyStatusLabel').textContent = info.label;
  document.getElementById('sleepyStatusDesc').textContent = info.desc;

  const display = document.getElementById('sleepyStatusDisplay');
  display.className = `sleepy-status-display status-${status}`;
}

// ========== Service Worker登録 ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed:', err));
}
