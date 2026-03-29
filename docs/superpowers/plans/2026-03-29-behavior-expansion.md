# ふるまいバリエーション拡充 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ab_behave の PlayMotion を8種→約80種に拡充し、PlayTrick 7種と MoveHead を新規追加する。

**Architecture:** 単一ファイル構成（index.html / script.js / style.css）を維持。PlayMotion はデータ駆動のアコーディオンUIで動的生成する。既存の ACTION_MAP ベースの実装を汎用的な関数に置き換える。

**Tech Stack:** HTML / CSS / JavaScript（フレームワーク・ビルドツールなし）、aibo Web API

**Spec:** `docs/superpowers/specs/2026-03-29-behavior-expansion-design.md`

---

### Task 1: script.js にデータ定義を追加し、既存 ACTION_MAP を廃止

**Files:**
- Modify: `script.js:2-9` (定数セクション末尾にデータ追加)
- Modify: `script.js:256-265` (ACTION_MAP を削除)

- [ ] **Step 1: MOTION_GROUPS データ定義を追加**

`script.js` の定数セクション（`CRYPTO_KEY_ID` の後、`// ========== 状態管理 ==========` の前）に以下を追加:

```js
// ========== ふるまいデータ定義 ==========
const MOTION_GROUPS = [
  {
    id: 'greeting',
    label: '🤝 あいさつ・コミュニケーション',
    motions: [
      { category: 'paw', mode: 'BODY_LEFT', name: '左前足でお手' },
      { category: 'paw', mode: 'BODY_RIGHT', name: '右前足でお手' },
      { category: 'highFive', mode: 'NONE', name: 'ハイタッチ' },
      { category: 'highFive', mode: 'BODY_LEFT', name: '左前足でハイタッチ' },
      { category: 'highFive', mode: 'BODY_RIGHT', name: '右前足でハイタッチ' },
      { category: 'beckon', mode: 'BODY_LEFT', name: '左前足で手まねき' },
      { category: 'beckon', mode: 'BODY_RIGHT', name: '右前足で手まねき' },
      { category: 'agree', mode: 'NONE', name: 'うなずく' },
      { category: 'nodHead', mode: 'NONE', name: '大きく2回うなずく' },
      { category: 'greeting', mode: 'NONE', name: 'あいさつ' },
      { category: 'handUp', mode: 'NONE', name: '両前足あげる' },
    ]
  },
  {
    id: 'voice',
    label: '🗣️ 鳴き声・歌',
    motions: [
      { category: 'bark', mode: 'NONE', name: '大きくほえる' },
      { category: 'sing', mode: 'NONE', name: '歌う' },
      { category: 'yap', mode: 'NONE', name: 'キャンキャン！' },
      { category: 'woof', mode: 'NONE', name: 'うなる' },
      { category: 'whine', mode: 'NONE', name: 'キュンとなく' },
      { category: 'belch', mode: 'NONE', name: 'げっぷ' },
      { category: 'sneeze', mode: 'NONE', name: 'くしゃみ' },
      { category: 'sleepTalking', mode: 'NONE', name: '寝ごと' },
    ]
  },
  {
    id: 'performance',
    label: '💃 ダンス・運動',
    motions: [
      { category: 'dance', mode: 'NONE', name: 'ダンス' },
      { category: 'stretch', mode: 'NONE', name: 'のび' },
      { category: 'swing', mode: 'NONE', name: '左右に体を揺らす' },
      { category: 'sideKick', mode: 'FRONT_LEFT', name: '左前足で横に蹴る' },
      { category: 'sideKick', mode: 'FRONT_RIGHT', name: '右前足で横に蹴る' },
      { category: 'sideUp', mode: 'BODY_LEFT', name: '左に転がる' },
      { category: 'sideUp', mode: 'BODY_RIGHT', name: '右に転がる' },
      { category: 'heeling', mode: 'NONE', name: 'ヘディング' },
      { category: 'heeling', mode: 'SPACE_LEFT', name: '左にヘディング' },
      { category: 'heeling', mode: 'SPACE_RIGHT', name: '右にヘディング' },
      { category: 'shakeHipsBehind', mode: 'NONE', name: 'お尻を振る' },
    ]
  },
  {
    id: 'emotion',
    label: '💕 甘え・感情表現',
    motions: [
      { category: 'friendly', mode: 'NONE', name: 'うれしそう' },
      { category: 'friendlyPalette', mode: 'NONE', name: '遊ぶ仕草' },
      { category: 'helloILoveYou', mode: 'NONE', name: 'うれしそうにする' },
      { category: 'infriendly', mode: 'NONE', name: '遊びたそう' },
      { category: 'kiss', mode: 'NONE', name: 'キス' },
      { category: 'hug', mode: 'NONE', name: '抱っこせがむ' },
      { category: 'happy', mode: 'NONE', name: 'よろこぶ' },
      { category: 'happyOrHot', mode: 'NONE', name: '満足した仕草' },
      { category: 'overJoyed', mode: 'NONE', name: 'とっても嬉しい' },
      { category: 'touched', mode: 'SPACE_CENTER', name: '口を開けて目を閉じる' },
      { category: 'prettyPlease', mode: 'NONE', name: '上目遣い' },
      { category: 'requestToPlay', mode: 'NONE', name: '遊びに誘う' },
      { category: 'bad', mode: 'NONE', name: 'いやがる' },
      { category: 'shakeHead', mode: 'NONE', name: 'かなしそう' },
      { category: 'peace', mode: 'SPACE_LEFT', name: 'すねて左を向く' },
      { category: 'peace', mode: 'SPACE_RIGHT', name: 'すねて右を向く' },
      { category: 'ready', mode: 'NONE', name: '待ちきれなそう' },
      { category: 'restless', mode: 'NONE', name: 'そわそわ' },
      { category: 'waiting', mode: 'NONE', name: '退屈そう' },
      { category: 'tired', mode: 'NONE', name: '疲れた' },
    ]
  },
  {
    id: 'body',
    label: '🐾 からだの動き',
    motions: [
      { category: 'lickBody', mode: 'BODY_LEFT', name: '左前足を毛づくろい' },
      { category: 'lickBody', mode: 'BODY_RIGHT', name: '右前足を毛づくろい' },
      { category: 'lickFace', mode: 'NONE', name: '顔をなめる' },
      { category: 'washFace', mode: 'NONE', name: '顔を洗う' },
      { category: 'scratchHead', mode: 'NONE', name: '頭をかく' },
      { category: 'scratchHead', mode: 'HIND_LEFT', name: '左後足で頭をかく' },
      { category: 'scratchHead', mode: 'HIND_RIGHT', name: '右後足で頭をかく' },
      { category: 'scratchFloor', mode: 'NONE', name: '地面を掘る' },
      { category: 'rubBack', mode: 'NONE', name: '背中を擦りつける' },
      { category: 'shake', mode: 'NONE', name: 'ぶるぶる' },
      { category: 'jiggle', mode: 'NONE', name: 'ブルっと震える' },
      { category: 'shudder', mode: 'NONE', name: '細かく震える' },
      { category: 'showTummy', mode: 'NONE', name: 'おなかを見せる' },
      { category: 'marking', mode: 'BOY', name: 'マーキング（男の子）' },
      { category: 'marking', mode: 'GIRL', name: 'マーキング（女の子）' },
      { category: 'wiggleEar', mode: 'BODY_BOTH', name: '耳をぴくっと' },
      { category: 'wiggleEar', mode: 'BODY_LEFT', name: '左耳をぴくっと' },
      { category: 'wiggleEar', mode: 'BODY_RIGHT', name: '右耳をぴくっと' },
      { category: 'drawInOnesChin', mode: 'NONE', name: 'あごをひく' },
      { category: 'bentBack', mode: 'NONE', name: 'へっぴり腰' },
      { category: 'peePose', mode: 'NONE', name: 'おしっこポーズ' },
    ]
  },
  {
    id: 'rest',
    label: '😴 休息・くつろぎ',
    motions: [
      { category: 'relax', mode: 'NONE', name: 'くつろぐ' },
      { category: 'sleep', mode: 'NONE', name: '寝る' },
      { category: 'dreaming', mode: 'NONE', name: '夢をみる' },
      { category: 'halfAsleep', mode: 'NONE', name: '寝ぼけ' },
      { category: 'yawn', mode: 'NONE', name: 'あくび' },
      { category: 'nod', mode: 'NONE', name: '居眠り' },
      { category: 'breath', mode: 'NONE', name: 'はあはあ呼吸' },
      { category: 'sit', mode: 'NONE', name: 'すわる' },
    ]
  },
  {
    id: 'reaction',
    label: '🔍 探索・反応',
    motions: [
      { category: 'curious', mode: 'NONE', name: '興味' },
      { category: 'perceive', mode: 'NONE', name: 'はっとする' },
      { category: 'lookOver', mode: 'NONE', name: 'のぞき込む' },
      { category: 'lookAroundHead', mode: 'NONE', name: 'きょろきょろ' },
      { category: 'sniff', mode: 'NONE', name: '目の前を嗅ぐ' },
      { category: 'sniffDown', mode: 'NONE', name: '下を嗅ぐ' },
      { category: 'sniffUp', mode: 'NONE', name: '上を嗅ぐ' },
      { category: 'startled', mode: 'NONE', name: '驚く' },
      { category: 'startledLittle', mode: 'NONE', name: '少し驚く' },
      { category: 'gasp', mode: 'NONE', name: '口をパクパク' },
      { category: 'moveAround', mode: 'NONE', name: 'うろうろ' },
      { category: 'openMouth', mode: 'NONE', name: '口を開け閉め' },
      { category: 'openMouth10s', mode: 'NONE', name: '口を10秒開ける' },
      { category: 'playBiting', mode: 'NONE', name: '甘噛み' },
      { category: 'drinkWater', mode: 'NONE', name: '水を飲む' },
      { category: 'eatDryFood', mode: 'NONE', name: 'えさを食べる' },
      { category: 'throwBone', mode: 'SPACE_CENTER', name: 'アイボーン正面に投げる' },
      { category: 'throwBone', mode: 'SPACE_LEFT', name: 'アイボーン左に投げる' },
      { category: 'throwBone', mode: 'SPACE_RIGHT', name: 'アイボーン右に投げる' },
      { category: 'throwDice', mode: 'SPACE_LEFT', name: 'サイコロ左に投げる' },
      { category: 'throwDice', mode: 'SPACE_RIGHT', name: 'サイコロ右に投げる' },
    ]
  }
];

const TRICK_LIST = [
  { trickName: 'aiboSquat', name: 'スクワット' },
  { trickName: 'happyBirthday', name: 'ハッピーバースデー' },
  { trickName: 'ifYoureHappyAndYouKnowIt', name: '幸せなら手をたたこう' },
  { trickName: 'londonBridgeIsFallingDown', name: 'ロンドン橋落ちた' },
  { trickName: 'radioExerciseNo1', name: 'ラジオ体操第一' },
  { trickName: 'veryLovelyAibo', name: 'とってもかわいいaibo' },
  { trickName: 'waltzOfTheFlowers', name: 'くるみ割り人形' },
];

const MOVE_HEAD_PRESETS = [
  { name: '正面', azimuth: 0, elevation: 0, velocity: 40 },
  { name: '左を見る', azimuth: 60, elevation: 0, velocity: 40 },
  { name: '右を見る', azimuth: -60, elevation: 0, velocity: 40 },
  { name: '上を見る', azimuth: 0, elevation: 30, velocity: 40 },
  { name: '下を見る', azimuth: 0, elevation: -30, velocity: 40 },
];
```

- [ ] **Step 2: 既存の ACTION_MAP を削除**

`script.js` から `ACTION_MAP` 定数（以下のブロック）を削除:

```js
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
```

- [ ] **Step 3: コミット**

```bash
git add script.js
git commit -m "feat: PlayMotion/PlayTrick/MoveHead データ定義追加、ACTION_MAP廃止"
```

---

### Task 2: script.js に新しい API 呼び出し関数を追加

**Files:**
- Modify: `script.js` (executeAction を executeMotion に置換、executeTrick と executeMoveHead を追加)

- [ ] **Step 1: executeAction を executeMotion に置換**

既存の `executeAction` 関数を削除し、以下の `executeMotion` に置き換える:

```js
async function executeMotion(category, mode, displayName) {
  showStatus('loading', `${displayName} を実行中...`, 'actionStatus');

  const buttons = document.querySelectorAll('.action-btn, .motion-btn');
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
          Category: category,
          Mode: mode
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    showStatus('success', `${displayName} を指示しました！`, 'actionStatus');
    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}
```

- [ ] **Step 2: executeTrick 関数を追加**

`executeMotion` の後に追加:

```js
async function executeTrick(trickName, displayName) {
  showStatus('loading', `${displayName} を実行中...`, 'actionStatus');

  const buttons = document.querySelectorAll('.trick-btn');
  buttons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/play_trick/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arguments: {
          TrickName: trickName
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    showStatus('success', `${displayName} を指示しました！`, 'actionStatus');
    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}
```

- [ ] **Step 3: executeMoveHead 関数を追加**

`executeTrick` の後に追加:

```js
async function executeMoveHead(azimuth, elevation, velocity) {
  const displayName = `首を動かす (${azimuth}°, ${elevation}°)`;
  showStatus('loading', `${displayName} を実行中...`, 'actionStatus');

  const buttons = document.querySelectorAll('.move-head-btn');
  buttons.forEach(btn => btn.disabled = true);

  try {
    const response = await fetch(`${API_BASE}/devices/${currentDeviceId}/capabilities/move_head/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        arguments: {
          Azimuth: azimuth,
          Elevation: elevation,
          Velocity: velocity
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    showStatus('success', `${displayName} を指示しました！`, 'actionStatus');
    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);

  } catch (error) {
    showStatus('error', `エラー: ${error.message}`, 'actionStatus');
  } finally {
    buttons.forEach(btn => btn.disabled = false);
  }
}
```

- [ ] **Step 4: コミット**

```bash
git add script.js
git commit -m "feat: executeMotion/executeTrick/executeMoveHead 関数を追加"
```

---

### Task 3: index.html のアクションタブを再構成

**Files:**
- Modify: `index.html:88-177` (アクションタブの中身を置換)

- [ ] **Step 1: アクションタブの中身を置換**

`index.html` の `<!-- アクション実行タブ -->` セクション（`<div class="card tab-content" id="tabContentAction">` の中身）を以下に置き換える:

```html
      <!-- アクション実行タブ -->
      <div class="card tab-content" id="tabContentAction">
        <div class="mode-section">
          <h2>📋 モード切替</h2>
          <button class="mode-btn standby" id="modeBtn">
            ⏸️ 指示待ちにする
          </button>
        </div>

        <div class="posture-section">
          <h2>🐾 姿勢を変える</h2>
          <div class="action-grid">
            <button class="action-btn posture-btn" data-posture="stand">
              <span class="emoji">🧍</span>
              立つ
            </button>
            <button class="action-btn posture-btn" data-posture="stand_straight">
              <span class="emoji">📐</span>
              まっすぐ立つ
            </button>
            <button class="action-btn posture-btn" data-posture="sit">
              <span class="emoji">🪑</span>
              すわる
            </button>
            <button class="action-btn posture-btn" data-posture="sit_and_raise_both_hands">
              <span class="emoji">🙌</span>
              両前足あげる
            </button>
            <button class="action-btn posture-btn" data-posture="down">
              <span class="emoji">⬇️</span>
              伏せる
            </button>
            <button class="action-btn posture-btn" data-posture="crouch">
              <span class="emoji">🦆</span>
              しゃがむ
            </button>
            <button class="action-btn posture-btn" data-posture="down_and_lengthen_behind">
              <span class="emoji">😴</span>
              寝転がる
            </button>
            <button class="action-btn posture-btn" data-posture="down_and_shorten_behind">
              <span class="emoji">🛌</span>
              足を曲げて寝転がる
            </button>
            <button class="action-btn posture-btn" data-posture="sleep">
              <span class="emoji">💤</span>
              寝る姿勢
            </button>
            <button class="action-btn posture-btn" data-posture="back">
              <span class="emoji">🔄</span>
              おなかを見せる
            </button>
          </div>
        </div>

        <div class="motion-section">
          <h2>🎮 ふるまい</h2>
          <div id="motionAccordion"></div>
        </div>

        <div class="trick-section">
          <h2>🎪 トリック</h2>
          <p class="trick-note">aiboが覚えているトリックのみ実行できます</p>
          <div class="action-grid" id="trickGrid"></div>
        </div>

        <div class="move-head-section">
          <h2>🐕 首を動かす</h2>
          <div class="action-grid" id="moveHeadPresetGrid"></div>
          <div class="move-head-custom-toggle" id="moveHeadCustomToggle">
            <span>カスタム設定</span>
            <span id="moveHeadCustomArrow">▼</span>
          </div>
          <div class="move-head-custom" id="moveHeadCustom">
            <div class="slider-group">
              <label>左右 (Azimuth): <span id="azimuthValue">0</span>°</label>
              <input type="range" id="azimuthSlider" min="-80" max="80" value="0">
            </div>
            <div class="slider-group">
              <label>上下 (Elevation): <span id="elevationValue">0</span>°</label>
              <input type="range" id="elevationSlider" min="-40" max="40" value="0">
            </div>
            <div class="slider-group">
              <label>速さ (Velocity): <span id="velocityValue">40</span> deg/s</label>
              <input type="range" id="velocitySlider" min="10" max="80" value="40">
            </div>
            <button class="btn btn-primary move-head-execute-btn" id="moveHeadExecuteBtn">実行</button>
          </div>
        </div>

        <div class="status" id="actionStatus"></div>
      </div>
```

- [ ] **Step 2: コミット**

```bash
git add index.html
git commit -m "feat: アクションタブ再構成 - 姿勢→ふるまい→トリック→首の配置順"
```

---

### Task 4: script.js に動的UI生成ロジックを追加

**Files:**
- Modify: `script.js` (bindEvents の後に buildUI 関数群を追加、DOMContentLoaded から呼び出し)

- [ ] **Step 1: UI 生成関数を追加**

`script.js` の `bindEvents` 関数の後に以下を追加:

```js
// ========== 動的UI生成 ==========
function buildMotionAccordion() {
  const container = document.getElementById('motionAccordion');
  if (!container) return;

  MOTION_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'accordion-section';

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `<span>${group.label}</span><span class="accordion-arrow">▼</span>`;
    header.addEventListener('click', () => {
      const content = section.querySelector('.accordion-content');
      const arrow = header.querySelector('.accordion-arrow');
      const isOpen = content.classList.toggle('open');
      arrow.textContent = isOpen ? '▲' : '▼';
    });

    const content = document.createElement('div');
    content.className = 'accordion-content';

    const grid = document.createElement('div');
    grid.className = 'action-grid';

    group.motions.forEach(motion => {
      const btn = document.createElement('button');
      btn.className = 'action-btn motion-btn';
      btn.innerHTML = `${motion.name}`;
      btn.addEventListener('click', () => executeMotion(motion.category, motion.mode, motion.name));
      grid.appendChild(btn);
    });

    content.appendChild(grid);
    section.appendChild(header);
    section.appendChild(content);
    container.appendChild(section);
  });
}

function buildTrickGrid() {
  const container = document.getElementById('trickGrid');
  if (!container) return;

  TRICK_LIST.forEach(trick => {
    const btn = document.createElement('button');
    btn.className = 'action-btn trick-btn';
    btn.innerHTML = `${trick.name}`;
    btn.addEventListener('click', () => executeTrick(trick.trickName, trick.name));
    container.appendChild(btn);
  });
}

function buildMoveHeadPresets() {
  const container = document.getElementById('moveHeadPresetGrid');
  if (!container) return;

  MOVE_HEAD_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.className = 'action-btn move-head-btn';
    btn.innerHTML = `${preset.name}`;
    btn.addEventListener('click', () => executeMoveHead(preset.azimuth, preset.elevation, preset.velocity));
    container.appendChild(btn);
  });
}
```

- [ ] **Step 2: bindEvents に新しいイベントハンドラを追加**

`bindEvents` 関数内に以下を追加（既存のアクションボタンのイベント委譲 `document.querySelectorAll('[data-action]')` のブロックを削除し、代わりに以下を追加）:

```js
  // MoveHead カスタム設定の開閉
  document.getElementById('moveHeadCustomToggle').addEventListener('click', () => {
    const content = document.getElementById('moveHeadCustom');
    const arrow = document.getElementById('moveHeadCustomArrow');
    const isOpen = content.classList.toggle('open');
    arrow.textContent = isOpen ? '▲' : '▼';
  });

  // MoveHead スライダーのリアルタイム値表示
  document.getElementById('azimuthSlider').addEventListener('input', (e) => {
    document.getElementById('azimuthValue').textContent = e.target.value;
  });
  document.getElementById('elevationSlider').addEventListener('input', (e) => {
    document.getElementById('elevationValue').textContent = e.target.value;
  });
  document.getElementById('velocitySlider').addEventListener('input', (e) => {
    document.getElementById('velocityValue').textContent = e.target.value;
  });

  // MoveHead カスタム実行ボタン
  document.getElementById('moveHeadExecuteBtn').addEventListener('click', () => {
    const azimuth = parseFloat(document.getElementById('azimuthSlider').value);
    const elevation = parseFloat(document.getElementById('elevationSlider').value);
    const velocity = parseFloat(document.getElementById('velocitySlider').value);
    executeMoveHead(azimuth, elevation, velocity);
  });
```

- [ ] **Step 3: DOMContentLoaded から buildUI を呼び出す**

既存の `DOMContentLoaded` ハンドラ内の `bindEvents()` の後に以下を追加:

```js
  buildMotionAccordion();
  buildTrickGrid();
  buildMoveHeadPresets();
```

- [ ] **Step 4: コミット**

```bash
git add script.js
git commit -m "feat: PlayMotion/PlayTrick/MoveHead の動的UI生成ロジック追加"
```

---

### Task 5: style.css にアコーディオン・トリック・MoveHead のスタイルを追加

**Files:**
- Modify: `style.css` (末尾に新スタイルを追加)

- [ ] **Step 1: アコーディオンスタイルを追加**

`style.css` の末尾に以下を追加:

```css
/* ========== アコーディオン (PlayMotion) ========== */
.motion-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.accordion-section {
  margin-bottom: 8px;
}

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  color: #555;
  transition: background 0.2s;
}

.accordion-header:active {
  background: #e9ecef;
}

.accordion-arrow {
  font-size: 0.8rem;
  color: #999;
  transition: transform 0.2s;
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, padding 0.3s ease-out;
  padding: 0 4px;
}

.accordion-content.open {
  max-height: 2000px;
  padding: 12px 4px;
  transition: max-height 0.5s ease-in, padding 0.3s ease-in;
}

.motion-btn {
  font-size: 13px;
  padding: 14px 8px;
}
```

- [ ] **Step 2: トリックセクションスタイルを追加**

```css
/* ========== トリック (PlayTrick) ========== */
.trick-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.trick-note {
  font-size: 0.8rem;
  color: #999;
  margin: -8px 0 12px;
}

.trick-btn {
  background: linear-gradient(135deg, #43a047 0%, #66bb6a 100%) !important;
  box-shadow: 0 4px 15px rgba(67, 160, 71, 0.3) !important;
  font-size: 13px;
  padding: 14px 8px;
}
```

- [ ] **Step 3: MoveHead セクションスタイルを追加**

```css
/* ========== 首を動かす (MoveHead) ========== */
.move-head-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.move-head-btn {
  background: linear-gradient(135deg, #fb8c00 0%, #ffa726 100%) !important;
  box-shadow: 0 4px 15px rgba(251, 140, 0, 0.3) !important;
  font-size: 13px;
  padding: 14px 8px;
}

.move-head-custom-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-top: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  color: #666;
}

.move-head-custom {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, padding 0.3s ease-out;
}

.move-head-custom.open {
  max-height: 500px;
  padding: 16px 0;
  transition: max-height 0.5s ease-in, padding 0.3s ease-in;
}

.slider-group {
  margin-bottom: 16px;
}

.slider-group label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 6px;
  font-weight: 600;
}

.slider-group input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  border-radius: 3px;
  outline: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fb8c00 0%, #ffa726 100%);
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(251, 140, 0, 0.4);
}

.move-head-execute-btn {
  width: 100%;
  margin-top: 8px;
  background: linear-gradient(135deg, #fb8c00 0%, #ffa726 100%);
}
```

- [ ] **Step 4: コミット**

```bash
git add style.css
git commit -m "feat: アコーディオン・トリック・MoveHead のスタイル追加"
```

---

### Task 6: 既存コードのクリーンアップと SW バージョン更新

**Files:**
- Modify: `script.js` (不要になった data-action イベントリスナー削除)
- Modify: `sw.js:1` (CACHE_NAME バージョン更新)

- [ ] **Step 1: bindEvents から不要なイベントリスナーを削除**

`bindEvents` 関数内の以下のブロックを削除（動的生成に置き換え済み）:

```js
  // アクションボタン (イベント委譲)
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => executeAction(btn.dataset.action));
  });
```

- [ ] **Step 2: sw.js のキャッシュバージョンを更新**

`sw.js` の1行目を変更:

```js
const CACHE_NAME = 'aibo-remote-v3';
```

- [ ] **Step 3: コミット**

```bash
git add script.js sw.js
git commit -m "chore: 不要なイベントリスナー削除、SWキャッシュバージョンをv3に更新"
```

---

### Task 7: ブラウザ動作確認

**Files:** なし（確認のみ）

- [ ] **Step 1: 全ファイルの整合性確認**

以下を確認:
- `script.js` に `ACTION_MAP` が残っていないこと
- `script.js` に `executeAction` 関数が残っていないこと
- `index.html` に `data-action` 属性のボタンが残っていないこと
- `index.html` の `motionAccordion`, `trickGrid`, `moveHeadPresetGrid` コンテナが存在すること

Run: `grep -n "ACTION_MAP\|executeAction\|data-action" script.js index.html`
Expected: 一致なし

- [ ] **Step 2: ブラウザで表示確認**

ローカルサーバーで `index.html` を開き以下を確認:
1. アクションタブに「モード切替 → 姿勢を変える → ふるまい → トリック → 首を動かす」の順で表示
2. ふるまいセクションに7つのアコーディオンヘッダーが表示
3. アコーディオンをタップすると中のボタングリッドが開閉
4. トリックセクションに緑色のボタンが7つ表示
5. 首を動かすセクションにオレンジ色のプリセットボタンが5つ表示
6. 「カスタム設定」を開くとスライダー3本と実行ボタンが表示
7. スライダーを動かすと横の値がリアルタイム更新

- [ ] **Step 3: 最終コミット（必要な修正があれば）**

問題があれば修正してコミット:

```bash
git add -A
git commit -m "fix: 動作確認で見つかった問題を修正"
```
