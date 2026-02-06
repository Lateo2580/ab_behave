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

  const statusEl = document.getElementById('actionStatus');
  showStatus('loading', `${action.name} を実行中...`);

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
    showStatus('success', `${action.name} を指示しました！`);

    // 3秒後にステータスを消す
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`);
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

  const statusEl = document.getElementById('actionStatus');
  showStatus('loading', `${posture.name} を実行中...`);

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
    showStatus('success', `${posture.name} を指示しました！`);

    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`);
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

  showStatus('loading', `${label}に切り替え中...`);
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
    showStatus('success', `${label}に切り替えました！`);

    const statusEl = document.getElementById('actionStatus');
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`);
  } finally {
    modeBtn.disabled = false;
  }
}

function showStatus(type, message) {
  const statusEl = document.getElementById('actionStatus');
  statusEl.className = `status show ${type}`;
  statusEl.textContent = message;
}

// ========== Service Worker登録 ==========
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker registration failed:', err));
}
