# コマンドセンター型リデザイン 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ab_behave PWA を縦スクロール＋タブ切替構成から、コマンドセンター型ワンビュー・ダッシュボードに破壊的変更する。

**Architecture:** HTML 構造を完全に書き換え、タブを廃止してワンビューに統合する。モバイルではヘッダーにステータスチップ＋歯車アイコン、PC(1024px+)では2カラム（左サイドバー＋右メイン）レイアウト。CSS は既存の M3 デザイントークンを維持しつつ全面書き換え。JS はタブ切替を削除し、ステータスチップのタップ取得とカテゴリのインライン展開ロジックを追加する。

**Tech Stack:** Pure HTML / CSS / JavaScript（フレームワーク・ビルドツールなし）

**Spec:** `docs/superpowers/specs/2026-03-30-command-center-redesign.md`

---

## ファイル構成

| ファイル | 変更種別 | 責務 |
|---|---|---|
| `index.html` | 大幅書き換え | コマンドセンター型 HTML 構造（ヘッダー、サイドバー、クイックアクション、カテゴリリスト） |
| `style.css` | 全面書き換え | M3 デザイントークン維持 + コマンドセンターレイアウト + レスポンシブ |
| `script.js` | 部分書き換え | タブ廃止、ステータスチップ制御、設定パネル制御変更、カテゴリ展開 |
| `sw.js` | 1行変更 | キャッシュバージョン更新 |

---

### Task 1: HTML 構造の書き換え

**Files:**
- Modify: `index.html` (全面書き換え、`<head>` は維持)

- [ ] **Step 1: index.html の `<body>` 内を新しいコマンドセンター構造に書き換える**

`<head>` はそのまま維持。`<body>` 内を以下の構造に置き換える:

```html
<body>
  <div class="app">
    <!-- === サイドバー（PC では左カラム、モバイルではヘッダー＋設定パネルとして機能） === -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-top">
        <!-- アプリタイトル -->
        <div class="app-header">
          <h1 class="app-title">🐕 ab_behave</h1>
          <!-- モバイル用: ステータスチップ＋歯車（PC では sidebar-status に移動） -->
          <div class="header-actions">
            <button class="status-chip" id="hungryChip" title="タップで更新">
              <span class="status-chip-icon" id="hungryChipIcon">🔋</span>
              <span class="status-chip-label" id="hungryChipLabel">--</span>
            </button>
            <button class="status-chip" id="sleepyChip" title="タップで更新">
              <span class="status-chip-icon" id="sleepyChipIcon">😪</span>
              <span class="status-chip-label" id="sleepyChipLabel">--</span>
            </button>
            <button class="settings-gear" id="settingsGear" aria-label="設定を開く">⚙️</button>
          </div>
        </div>

        <!-- PC 用: ステータスチップ（モバイルではヘッダー内に表示されるため非表示） -->
        <div class="sidebar-status" id="sidebarStatus">
          <button class="status-chip" id="hungryChipDesktop" title="タップで更新">
            <span class="status-chip-icon" id="hungryChipIconDesktop">🔋</span>
            <span class="status-chip-label" id="hungryChipLabelDesktop">--</span>
          </button>
          <button class="status-chip" id="sleepyChipDesktop" title="タップで更新">
            <span class="status-chip-icon" id="sleepyChipIconDesktop">😪</span>
            <span class="status-chip-label" id="sleepyChipLabelDesktop">--</span>
          </button>
        </div>

        <!-- モード切替（PC ではサイドバーに表示） -->
        <div class="sidebar-mode" id="sidebarMode">
          <button class="mode-btn standby" id="modeBtnDesktop">
            ⏸️ 指示待ちにする
          </button>
        </div>
      </div>

      <!-- 設定パネル（PC: サイドバー下部 / モバイル: ヘッダー下にスライドダウン） -->
      <div class="sidebar-bottom">
        <div class="settings-panel" id="settingsPanel">
          <div class="settings-panel-header" id="settingsPanelToggle">
            <span>⚙️ 設定</span>
            <span class="settings-panel-summary" id="settingsSummary"></span>
            <span class="settings-arrow" id="settingsPanelArrow">▼</span>
          </div>
          <div class="settings-panel-content" id="settingsPanelContent">
            <div class="input-group">
              <label>アクセストークン</label>
              <input type="password" id="tokenInput" placeholder="トークンを入力">
            </div>
            <div class="button-row">
              <button class="btn btn-primary" id="saveTokenBtn">保存</button>
              <button class="btn btn-secondary" id="fetchDevicesBtn">接続テスト</button>
            </div>
            <div class="device-info" id="deviceInfo" style="display:none;">
              <strong>接続中:</strong><br>
              <span id="deviceName">-</span>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- === メインコンテンツ === -->
    <main class="main-content" id="mainContent">
      <!-- 未設定時の表示 -->
      <div class="setup-required" id="setupRequired">
        <div class="setup-required-emoji">🔧</div>
        <p>設定を開いて、<br>アクセストークンを入力してください。</p>
      </div>

      <!-- コマンドセンター（設定完了後に表示） -->
      <div class="command-center hidden" id="commandCenter">
        <!-- モード切替（モバイル用 — PC では sidebar-mode に表示） -->
        <button class="mode-btn standby mobile-mode-btn" id="modeBtnMobile">
          ⏸️ 指示待ちにする
        </button>

        <!-- クイックアクションバー -->
        <div class="quick-actions">
          <button class="quick-action-btn" data-posture="stand">
            <span class="quick-action-icon">🧍</span>
            <span class="quick-action-label">立つ</span>
          </button>
          <button class="quick-action-btn" data-posture="sit">
            <span class="quick-action-icon">🪑</span>
            <span class="quick-action-label">すわる</span>
          </button>
          <button class="quick-action-btn" data-posture="down">
            <span class="quick-action-icon">⬇️</span>
            <span class="quick-action-label">伏せる</span>
          </button>
          <button class="quick-action-btn" data-action="dance">
            <span class="quick-action-icon">💃</span>
            <span class="quick-action-label">ダンス</span>
          </button>
        </div>

        <!-- カテゴリリスト -->
        <div class="category-list-label">すべてのアクション</div>

        <!-- 🐾 姿勢を変える -->
        <div class="category-card" id="categoryPosture">
          <div class="category-header" data-category="posture">
            <span class="category-title">🐾 姿勢を変える</span>
            <span class="category-count">10種類</span>
            <span class="category-arrow">▼</span>
          </div>
          <div class="category-content" id="categoryPostureContent">
            <div class="action-grid">
              <button class="action-btn posture-btn" data-posture="stand">
                <span class="emoji">🧍</span>立つ
              </button>
              <button class="action-btn posture-btn" data-posture="stand_straight">
                <span class="emoji">📐</span>まっすぐ立つ
              </button>
              <button class="action-btn posture-btn" data-posture="sit">
                <span class="emoji">🪑</span>すわる
              </button>
              <button class="action-btn posture-btn" data-posture="sit_and_raise_both_hands">
                <span class="emoji">🙌</span>両前足あげる
              </button>
              <button class="action-btn posture-btn" data-posture="down">
                <span class="emoji">⬇️</span>伏せる
              </button>
              <button class="action-btn posture-btn" data-posture="crouch">
                <span class="emoji">🦆</span>しゃがむ
              </button>
              <button class="action-btn posture-btn" data-posture="down_and_lengthen_behind">
                <span class="emoji">😴</span>寝転がる
              </button>
              <button class="action-btn posture-btn" data-posture="down_and_shorten_behind">
                <span class="emoji">🛌</span>足を曲げて寝転がる
              </button>
              <button class="action-btn posture-btn" data-posture="sleep">
                <span class="emoji">💤</span>寝る姿勢
              </button>
              <button class="action-btn posture-btn" data-posture="back">
                <span class="emoji">🔄</span>おなかを見せる
              </button>
            </div>
          </div>
        </div>

        <!-- 🎮 ふるまい -->
        <div class="category-card" id="categoryMotion">
          <div class="category-header" data-category="motion">
            <span class="category-title">🎮 ふるまい</span>
            <span class="category-count">7カテゴリ</span>
            <span class="category-arrow">▼</span>
          </div>
          <div class="category-content" id="categoryMotionContent">
            <div id="motionAccordion"></div>
          </div>
        </div>

        <!-- 🎪 トリック -->
        <div class="category-card" id="categoryTrick">
          <div class="category-header" data-category="trick">
            <span class="category-title">🎪 トリック</span>
            <span class="category-count">7種類</span>
            <span class="category-arrow">▼</span>
          </div>
          <div class="category-content" id="categoryTrickContent">
            <p class="trick-note">aiboが覚えているトリックのみ実行できます</p>
            <div class="action-grid" id="trickGrid"></div>
          </div>
        </div>

        <!-- 🐕 首を動かす -->
        <div class="category-card" id="categoryMoveHead">
          <div class="category-header" data-category="moveHead">
            <span class="category-title">🐕 首を動かす</span>
            <span class="category-count">5+カスタム</span>
            <span class="category-arrow">▼</span>
          </div>
          <div class="category-content" id="categoryMoveHeadContent">
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
        </div>

        <!-- ステータスメッセージ -->
        <div class="status" id="actionStatus"></div>
      </div>
    </main>
  </div>

  <script src="script.js"></script>
</body>
```

- [ ] **Step 2: ブラウザで開いて HTML 構造が壊れていないことを確認**

ブラウザで `index.html` を開く。CSS が未対応のため見た目は崩れるが、全要素が DOM 上に存在し、コンソールに JS エラーがないことを確認する。

- [ ] **Step 3: コミット**

```bash
git add index.html
git commit -m "refactor: HTML をコマンドセンター型構造に書き換え"
```

---

### Task 2: CSS の全面書き換え（モバイルファースト）

**Files:**
- Modify: `style.css` (全面書き換え — デザイントークン `:root` セクションは維持)

- [ ] **Step 1: style.css を書き換える — デザイントークン + リセット + ベース**

`:root` のデザイントークンはそのまま維持。リセットとベーススタイルを更新:

```css
/* --- Reset & Base --- */
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Nunito', 'Zen Maru Gothic', system-ui, -apple-system, sans-serif;
  background: var(--md-surface);
  color: var(--md-on-surface);
  min-height: 100vh;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse 120% 80% at 20% 0%, color-mix(in srgb, var(--md-primary-container) 40%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 80% 100% at 90% 100%, color-mix(in srgb, var(--md-secondary-container) 30%, transparent) 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}

/* --- App Shell --- */
.app {
  min-height: 100vh;
}

.hidden {
  display: none !important;
}
```

- [ ] **Step 2: ヘッダー + サイドバー + 設定パネルの CSS を書く**

```css
/* === Sidebar / Header === */
.sidebar {
  padding: 16px;
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--md-on-surface);
  letter-spacing: -0.02em;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ステータスチップ */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--md-shape-full);
  border: none;
  font-family: inherit;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--md-surface-container-high);
  color: var(--md-on-surface-variant);
  transition: background var(--md-duration-short) var(--md-ease-standard),
              transform var(--md-duration-short) var(--md-ease-spring);
}

.status-chip:active {
  transform: scale(0.93);
}

.status-chip.loading {
  animation: chipPulse 1s ease-in-out infinite;
}

@keyframes chipPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-chip.status-satisfied,
.status-chip.status-enough,
.status-chip.status-no_sleepy {
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.status-chip.status-eating,
.status-chip.status-sleepy {
  background: color-mix(in srgb, #C8D6EC 60%, var(--md-surface-container));
  color: #2C3E50;
}

.status-chip.status-hungry,
.status-chip.status-boring {
  background: var(--md-tertiary-container);
  color: var(--md-on-tertiary-container);
}

.status-chip.status-famished,
.status-chip.status-very_sleepy {
  background: var(--md-error-container);
  color: var(--md-error);
}

.status-chip.error {
  background: var(--md-error-container);
  color: var(--md-error);
}

.status-chip-icon {
  font-size: 0.85rem;
}

.settings-gear {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: var(--md-surface-container);
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--md-duration-short) var(--md-ease-standard);
}

.settings-gear:active {
  background: var(--md-surface-container-high);
}

/* PC 用サイドバーパーツ（モバイルでは非表示） */
.sidebar-status,
.sidebar-mode {
  display: none;
}

.sidebar-bottom {
  margin-top: 12px;
}

/* === 設定パネル === */
.settings-panel {
  background: var(--md-surface-container-lowest);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-xl);
  overflow: hidden;
}

.settings-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--md-on-surface-variant);
}

.settings-panel-summary {
  flex: 1;
  text-align: right;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--md-outline);
}

.settings-arrow {
  font-size: 0.7rem;
  color: var(--md-outline);
  transition: transform var(--md-duration-medium) var(--md-ease-emphasized);
}

.settings-panel-content {
  display: none;
  padding: 0 18px 18px;
  animation: slideDown var(--md-duration-medium) var(--md-ease-emphasized);
}

.settings-panel-content.show {
  display: block;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

- [ ] **Step 3: 入力フィールド + ボタン + デバイス情報の CSS を書く**

```css
/* === Input Fields === */
.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--md-on-surface-variant);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  font-size: 15px;
  font-family: inherit;
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface);
  color: var(--md-on-surface);
  transition: border-color var(--md-duration-short) var(--md-ease-standard),
              box-shadow var(--md-duration-short) var(--md-ease-standard);
}

.input-group input:focus {
  outline: none;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}

.input-group input::placeholder {
  color: var(--md-outline);
}

/* === Buttons === */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.02em;
  border: none;
  border-radius: var(--md-shape-full);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform var(--md-duration-short) var(--md-ease-spring),
              box-shadow var(--md-duration-short) var(--md-ease-standard);
}

.btn:active { transform: scale(0.95); }
.btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
.btn-primary { background: var(--md-primary); color: var(--md-on-primary); }
.btn-secondary { background: var(--md-surface-container-high); color: var(--md-on-surface); }

.button-row {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.button-row .btn { flex: 1; }

.device-info {
  background: var(--md-surface-container);
  padding: 14px 16px;
  border-radius: var(--md-shape-md);
  font-size: 13px;
  color: var(--md-on-surface-variant);
  margin-top: 12px;
  border: 1px solid var(--md-outline-variant);
}

.device-info strong { color: var(--md-on-surface); font-weight: 700; }
```

- [ ] **Step 4: メインコンテンツ（セットアップ案内 + モード切替 + クイックアクション）の CSS を書く**

```css
/* === Main Content === */
.main-content {
  padding: 0 16px 80px;
}

/* === Setup Required === */
.setup-required {
  text-align: center;
  padding: 48px 24px;
}

.setup-required-emoji {
  font-size: 3.5rem;
  margin-bottom: 16px;
  animation: gentleBounce 2s var(--md-ease-spring) infinite;
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.setup-required p {
  color: var(--md-on-surface-variant);
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.6;
}

/* === Mode Button === */
.mode-btn {
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.02em;
  border: none;
  border-radius: var(--md-shape-xl);
  cursor: pointer;
  color: white;
  position: relative;
  overflow: hidden;
  transition: transform var(--md-duration-short) var(--md-ease-spring),
              box-shadow var(--md-duration-short) var(--md-ease-standard);
}

.mode-btn:active { transform: scale(0.97); }
.mode-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
.mode-btn.standby { background: var(--md-secondary); color: var(--md-on-secondary); }
.mode-btn.normal { background: var(--md-tertiary); color: var(--md-on-tertiary); }

.mobile-mode-btn {
  margin-bottom: 12px;
}

/* === Quick Actions === */
.quick-actions {
  background: var(--md-surface-container-high);
  border-radius: var(--md-shape-xl);
  padding: 12px 8px;
  display: flex;
  justify-content: space-around;
  gap: 4px;
  margin-bottom: 16px;
}

.quick-action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: inherit;
  transition: transform var(--md-duration-short) var(--md-ease-spring);
}

.quick-action-btn:active { transform: scale(0.9); }
.quick-action-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }

.quick-action-icon {
  width: 44px;
  height: 44px;
  background: var(--md-surface-container-lowest);
  border-radius: var(--md-shape-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
  transition: box-shadow var(--md-duration-short) var(--md-ease-standard);
}

.quick-action-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--md-on-surface-variant);
}
```

- [ ] **Step 5: カテゴリカード + インライン展開 + アクショングリッドの CSS を書く**

```css
/* === Category List === */
.category-list-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--md-on-surface-variant);
  margin-bottom: 8px;
  padding-left: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.category-card {
  background: var(--md-surface-container-lowest);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-xl);
  margin-bottom: 8px;
  overflow: hidden;
  transition: border-color var(--md-duration-short) var(--md-ease-standard);
}

.category-header {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  cursor: pointer;
  transition: background var(--md-duration-short) var(--md-ease-standard);
}

.category-header:active {
  background: var(--md-surface-container);
}

.category-title {
  font-weight: 700;
  font-size: 0.92rem;
  color: var(--md-on-surface);
  flex: 1;
}

.category-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--md-outline);
  margin-right: 8px;
}

.category-arrow {
  font-size: 0.7rem;
  color: var(--md-outline);
  transition: transform var(--md-duration-medium) var(--md-ease-emphasized);
}

.category-card.open .category-arrow {
  transform: rotate(180deg);
}

.category-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--md-ease-emphasized),
              padding 0.3s var(--md-ease-emphasized);
  padding: 0 18px;
}

.category-card.open .category-content {
  max-height: 3000px;
  padding: 0 18px 18px;
  transition: max-height 0.6s var(--md-ease-standard),
              padding 0.3s var(--md-ease-standard);
}

/* === Action Grid === */
.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.action-btn {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border: none;
  border-radius: var(--md-shape-xl);
  padding: 14px 8px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform var(--md-duration-short) var(--md-ease-spring),
              background var(--md-duration-short) var(--md-ease-standard);
}

.action-btn:active { transform: scale(0.94); }
.action-btn:disabled { opacity: 0.38; cursor: not-allowed; transform: none; }
.action-btn .emoji { display: block; font-size: 1.6rem; margin-bottom: 4px; }

.posture-btn {
  background: var(--md-secondary-container) !important;
  color: var(--md-on-secondary-container) !important;
}

.motion-btn {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}

.trick-btn {
  background: var(--md-secondary-container) !important;
  color: var(--md-on-secondary-container) !important;
}

.trick-note {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--md-outline);
  margin-bottom: 10px;
}

.move-head-btn {
  background: var(--md-tertiary-container) !important;
  color: var(--md-on-tertiary-container) !important;
}
```

- [ ] **Step 6: ふるまいアコーディオン + MoveHead カスタム + ステータスメッセージの CSS を書く**

```css
/* === Motion Accordion (nested inside category) === */
.accordion-section { margin-bottom: 6px; }

.accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--md-surface-container);
  border-radius: var(--md-shape-md);
  cursor: pointer;
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--md-on-surface-variant);
  border: 1px solid var(--md-outline-variant);
  transition: background var(--md-duration-short) var(--md-ease-standard);
}

.accordion-header:active { background: var(--md-surface-container-high); }

.accordion-arrow {
  font-size: 0.7rem;
  color: var(--md-outline);
  transition: transform var(--md-duration-medium) var(--md-ease-emphasized);
}

.accordion-content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--md-ease-emphasized), padding 0.3s var(--md-ease-emphasized);
  padding: 0 2px;
}

.accordion-content.open {
  max-height: 2000px;
  padding: 8px 2px;
  transition: max-height 0.6s var(--md-ease-standard), padding 0.3s var(--md-ease-standard);
}

/* === MoveHead Custom === */
.move-head-custom-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-top: 8px;
  background: var(--md-surface-container);
  border-radius: var(--md-shape-md);
  cursor: pointer;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--md-on-surface-variant);
  border: 1px solid var(--md-outline-variant);
}

.move-head-custom {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--md-ease-emphasized), padding 0.3s var(--md-ease-emphasized);
}

.move-head-custom.open {
  max-height: 500px;
  padding: 14px 0;
  transition: max-height 0.6s var(--md-ease-standard), padding 0.3s var(--md-ease-standard);
}

.slider-group { margin-bottom: 16px; }

.slider-group label {
  display: block;
  font-size: 0.82rem;
  color: var(--md-on-surface-variant);
  margin-bottom: 8px;
  font-weight: 700;
}

.slider-group input[type="range"] {
  width: 100%;
  height: 8px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--md-surface-container-highest);
  border-radius: var(--md-shape-full);
  outline: none;
}

.slider-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--md-tertiary);
  cursor: pointer;
  border: 3px solid var(--md-surface-container-lowest);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.slider-group input[type="range"]::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--md-tertiary);
  cursor: pointer;
  border: 3px solid var(--md-surface-container-lowest);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.move-head-execute-btn {
  width: 100%;
  margin-top: 8px;
  background: var(--md-tertiary);
  color: var(--md-on-tertiary);
}

/* === Status Messages === */
.status {
  text-align: center;
  padding: 12px 16px;
  border-radius: var(--md-shape-full);
  margin-top: 14px;
  font-size: 13px;
  font-weight: 700;
  display: none;
  animation: statusIn var(--md-duration-medium) var(--md-ease-spring);
}

@keyframes statusIn {
  from { opacity: 0; transform: translateY(4px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.status.show { display: block; }
.status.success { background: var(--md-secondary-container); color: var(--md-on-secondary-container); }
.status.error { background: var(--md-error-container); color: var(--md-error); }
.status.loading { background: var(--md-surface-container-high); color: var(--md-on-surface-variant); }
```

- [ ] **Step 7: アニメーション + スクロールバー + セレクション の CSS を書く**

```css
/* === Page Load Animation === */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.sidebar { animation: fadeInUp var(--md-duration-long) var(--md-ease-emphasized); }

.command-center .mode-btn,
.command-center .quick-actions,
.command-center .category-card {
  animation: fadeInUp var(--md-duration-long) var(--md-ease-emphasized) backwards;
}

.command-center .quick-actions { animation-delay: 50ms; }
.command-center .category-card:nth-child(1) { animation-delay: 100ms; }
.command-center .category-card:nth-child(2) { animation-delay: 150ms; }
.command-center .category-card:nth-child(3) { animation-delay: 200ms; }
.command-center .category-card:nth-child(4) { animation-delay: 250ms; }

/* === Scrollbar === */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--md-outline-variant); border-radius: var(--md-shape-full); }

/* === Selection === */
::selection { background: var(--md-primary-container); color: var(--md-on-primary-container); }
```

- [ ] **Step 8: レスポンシブ CSS を書く（タブレット + PC + ワイド PC）**

```css
/* ========== Responsive ========== */

/* --- Tablet (640px+) --- */
@media (min-width: 640px) {
  .sidebar { padding: 20px 24px; }
  .main-content { padding: 0 24px 80px; }
  .action-grid { grid-template-columns: repeat(3, 1fr); }
  .quick-action-icon { width: 48px; height: 48px; font-size: 1.5rem; }
}

/* --- Desktop (1024px+) --- */
@media (min-width: 1024px) {
  .app {
    max-width: 960px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 280px 1fr;
    min-height: 100vh;
  }

  /* サイドバー: 左カラムとして固定 */
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 24px;
    border-right: 1px solid var(--md-outline-variant);
    background: var(--md-surface-container-low);
  }

  .sidebar-top { flex: 1; }

  /* PC ではヘッダーのレイアウトを縦に */
  .app-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0;
  }

  .app-title { font-size: 1.5rem; }

  /* PC ではモバイル用のステータスチップ・歯車を非表示 */
  .header-actions { display: none; }

  /* PC 用のサイドバーステータスとモードを表示 */
  .sidebar-status {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 14px;
  }

  .sidebar-mode {
    display: block;
    margin-top: 14px;
  }

  /* PC ではモバイル用モードボタンを非表示 */
  .mobile-mode-btn { display: none; }

  /* メインコンテンツ */
  .main-content {
    padding: 24px 28px 80px;
  }

  .action-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }

  .action-btn:hover:not(:disabled) {
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .action-btn:active:not(:disabled) {
    transform: scale(0.95) translateY(0);
  }

  .category-header:hover {
    background: var(--md-surface-container);
  }

  .quick-action-btn:hover:not(:disabled) .quick-action-icon {
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
}

/* --- Wide Desktop (1280px+) --- */
@media (min-width: 1280px) {
  .app {
    max-width: 1100px;
    grid-template-columns: 320px 1fr;
  }

  .action-grid { grid-template-columns: repeat(4, 1fr); }
}
```

- [ ] **Step 9: ブラウザで開き、モバイル・タブレット・PC 各サイズでレイアウトを確認**

DevTools のレスポンシブモードで 375px / 768px / 1024px / 1440px で表示を確認する。

- [ ] **Step 10: コミット**

```bash
git add style.css
git commit -m "style: コマンドセンター型レイアウトの CSS を実装"
```

---

### Task 3: JavaScript の書き換え

**Files:**
- Modify: `script.js`（タブ切替削除、ステータスチップ制御追加、設定パネル制御変更、カテゴリ展開追加、クイックアクション追加）

- [ ] **Step 1: タブ切替関連のコードを削除する**

`switchTab` 関数と、`bindEvents` 内のタブ切替イベントリスナーを削除:

```js
// bindEvents() 内から以下を削除:
document.getElementById('tabInfo').addEventListener('click', () => switchTab('info'));
document.getElementById('tabAction').addEventListener('click', () => switchTab('action'));

// 以下の関数を削除:
function switchTab(tabName) { ... }
```

- [ ] **Step 2: updateUI 関数を新構造に対応させる**

`updateUI` を書き換えて、`commandCenter`/`setupRequired` の表示切替と設定パネルのサマリー表示に対応:

```js
function updateUI() {
  const isReady = currentToken && currentDeviceId;

  document.getElementById('setupRequired').classList.toggle('hidden', isReady);
  document.getElementById('commandCenter').classList.toggle('hidden', !isReady);

  // 設定パネルのサマリー表示
  const summary = document.getElementById('settingsSummary');
  if (currentDeviceName) {
    summary.textContent = `接続中: ${currentDeviceName}`;
  } else if (currentToken) {
    summary.textContent = '未接続';
  } else {
    summary.textContent = '';
  }

  // デバイス情報
  if (currentDeviceId) {
    document.getElementById('deviceInfo').style.display = 'block';
    document.getElementById('deviceName').textContent = currentDeviceName || currentDeviceId;
  } else {
    document.getElementById('deviceInfo').style.display = 'none';
  }

  // 未設定時は設定パネルを自動展開
  if (!isReady) {
    const content = document.getElementById('settingsPanelContent');
    if (!content.classList.contains('show')) {
      content.classList.add('show');
    }
  }
}
```

- [ ] **Step 3: 設定パネルの制御を新構造に対応させる**

`toggleSettings` を書き換え、歯車アイコン用の新しいイベントリスナーを追加:

```js
function toggleSettingsPanel() {
  const content = document.getElementById('settingsPanelContent');
  const arrow = document.getElementById('settingsPanelArrow');
  const isShow = content.classList.toggle('show');
  arrow.textContent = isShow ? '▲' : '▼';
}
```

- [ ] **Step 4: カテゴリカードのインライン展開ロジックを追加する**

```js
function bindCategoryToggle() {
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.category-card');
      card.classList.toggle('open');
    });
  });
}
```

- [ ] **Step 5: ステータスチップのタップ取得ロジックを追加する**

ヘッダーのステータスチップをタップすると API を叩いてチップを更新する:

```js
function updateHungryChip(energy) {
  const info = HUNGRY_STATUS_MAP[energy] || { icon: '❓', label: energy };
  // モバイル用チップ
  document.getElementById('hungryChipIcon').textContent = info.icon;
  document.getElementById('hungryChipLabel').textContent = info.label;
  const chip = document.getElementById('hungryChip');
  chip.className = `status-chip status-${energy}`;
  // PC 用チップ
  document.getElementById('hungryChipIconDesktop').textContent = info.icon;
  document.getElementById('hungryChipLabelDesktop').textContent = info.label;
  const chipDesktop = document.getElementById('hungryChipDesktop');
  chipDesktop.className = `status-chip status-${energy}`;
}

function updateSleepyChip(status) {
  const info = SLEEPY_STATUS_MAP[status] || { icon: '❓', label: status };
  document.getElementById('sleepyChipIcon').textContent = info.icon;
  document.getElementById('sleepyChipLabel').textContent = info.label;
  const chip = document.getElementById('sleepyChip');
  chip.className = `status-chip status-${status}`;
  document.getElementById('sleepyChipIconDesktop').textContent = info.icon;
  document.getElementById('sleepyChipLabelDesktop').textContent = info.label;
  const chipDesktop = document.getElementById('sleepyChipDesktop');
  chipDesktop.className = `status-chip status-${status}`;
}

async function chipCheckHungry() {
  const chips = [document.getElementById('hungryChip'), document.getElementById('hungryChipDesktop')];
  chips.forEach(c => c.classList.add('loading'));

  try {
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
    const result = await pollExecution(execData.executionId);

    if (result.status === 'SUCCEEDED' && result.result && result.result.hungry_status) {
      updateHungryChip(result.result.hungry_status.energy);
    } else {
      throw new Error('取得失敗');
    }
  } catch (error) {
    chips.forEach(c => { c.className = 'status-chip error'; });
    showStatus('error', `バッテリー取得エラー: ${error.message}`, 'actionStatus');
  } finally {
    chips.forEach(c => c.classList.remove('loading'));
  }
}

async function chipCheckSleepy() {
  const chips = [document.getElementById('sleepyChip'), document.getElementById('sleepyChipDesktop')];
  chips.forEach(c => c.classList.add('loading'));

  try {
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
    const result = await pollExecution(execData.executionId);

    if (result.status === 'SUCCEEDED' && result.result && result.result.sleepy_status) {
      updateSleepyChip(result.result.sleepy_status.status);
    } else {
      throw new Error('取得失敗');
    }
  } catch (error) {
    chips.forEach(c => { c.className = 'status-chip error'; });
    showStatus('error', `眠さ取得エラー: ${error.message}`, 'actionStatus');
  } finally {
    chips.forEach(c => c.classList.remove('loading'));
  }
}
```

- [ ] **Step 6: クイックアクションバーのイベントリスナーを追加する**

```js
function bindQuickActions() {
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const posture = btn.dataset.posture;
      const action = btn.dataset.action;
      if (posture) {
        executePosture(posture);
      } else if (action === 'dance') {
        executeMotion('dance', 'NONE', 'ダンス');
      }
    });
  });
}
```

- [ ] **Step 7: モード切替ボタンの同期を追加する（モバイル＋PC 両方のボタンを同期）**

`updateModeButton` を書き換え、両方のモードボタンを同期:

```js
function updateModeButton() {
  const buttons = [document.getElementById('modeBtnMobile'), document.getElementById('modeBtnDesktop')];
  buttons.forEach(btn => {
    if (!btn) return;
    if (isStandbyMode) {
      btn.textContent = '▶️ 指示待ちを解除する';
      btn.className = btn.className.replace('standby', 'normal');
      if (!btn.className.includes('normal')) btn.classList.add('normal');
      btn.classList.remove('standby');
    } else {
      btn.textContent = '⏸️ 指示待ちにする';
      btn.className = btn.className.replace('normal', 'standby');
      if (!btn.className.includes('standby')) btn.classList.add('standby');
      btn.classList.remove('normal');
    }
  });
}
```

- [ ] **Step 8: bindEvents を新構造に全面書き換えする**

```js
function bindEvents() {
  // 設定パネル
  document.getElementById('settingsPanelToggle').addEventListener('click', toggleSettingsPanel);
  document.getElementById('settingsGear').addEventListener('click', toggleSettingsPanel);
  document.getElementById('saveTokenBtn').addEventListener('click', saveToken);
  document.getElementById('fetchDevicesBtn').addEventListener('click', fetchDevices);

  // ステータスチップ（モバイル + PC）
  document.getElementById('hungryChip').addEventListener('click', chipCheckHungry);
  document.getElementById('sleepyChip').addEventListener('click', chipCheckSleepy);
  document.getElementById('hungryChipDesktop').addEventListener('click', chipCheckHungry);
  document.getElementById('sleepyChipDesktop').addEventListener('click', chipCheckSleepy);

  // モード切替（モバイル + PC）
  document.getElementById('modeBtnMobile').addEventListener('click', toggleMode);
  document.getElementById('modeBtnDesktop').addEventListener('click', toggleMode);

  // 姿勢ボタン (カテゴリ内)
  document.querySelectorAll('[data-posture]').forEach(btn => {
    if (!btn.classList.contains('quick-action-btn')) {
      btn.addEventListener('click', () => executePosture(btn.dataset.posture));
    }
  });

  // カテゴリ展開
  bindCategoryToggle();

  // クイックアクション
  bindQuickActions();

  // MoveHead カスタム設定
  document.getElementById('moveHeadCustomToggle').addEventListener('click', () => {
    const content = document.getElementById('moveHeadCustom');
    const arrow = document.getElementById('moveHeadCustomArrow');
    const isOpen = content.classList.toggle('open');
    arrow.textContent = isOpen ? '▲' : '▼';
  });

  document.getElementById('azimuthSlider').addEventListener('input', (e) => {
    document.getElementById('azimuthValue').textContent = e.target.value;
  });
  document.getElementById('elevationSlider').addEventListener('input', (e) => {
    document.getElementById('elevationValue').textContent = e.target.value;
  });
  document.getElementById('velocitySlider').addEventListener('input', (e) => {
    document.getElementById('velocityValue').textContent = e.target.value;
  });

  document.getElementById('moveHeadExecuteBtn').addEventListener('click', () => {
    const azimuth = parseFloat(document.getElementById('azimuthSlider').value);
    const elevation = parseFloat(document.getElementById('elevationSlider').value);
    const velocity = parseFloat(document.getElementById('velocitySlider').value);
    executeMoveHead(azimuth, elevation, velocity);
  });
}
```

- [ ] **Step 9: 不要になった旧関数を削除する**

以下を削除:
- `toggleSettings()` — `toggleSettingsPanel()` に置き換え済み
- `switchTab()` — タブ廃止
- `checkHungryStatus()` — `chipCheckHungry()` に置き換え済み
- `checkSleepyStatus()` — `chipCheckSleepy()` に置き換え済み
- `updateHungryStatusDisplay()` — `updateHungryChip()` に置き換え済み
- `updateSleepyStatusDisplay()` — `updateSleepyChip()` に置き換え済み

`pollExecution()` は引き続きチップ取得で使用するので残す。

- [ ] **Step 10: ブラウザで全機能を手動確認**

以下を確認:
1. 初回アクセス時に設定パネルが自動展開される
2. トークン保存 → 接続テストが動作する
3. 接続後にコマンドセンターが表示される
4. ステータスチップをタップするとローディング → 更新される
5. モード切替ボタンが動作する（モバイル・PC 両方）
6. クイックアクションバーの4ボタンが動作する
7. 各カテゴリカードの展開/折りたたみが動作する
8. ふるまいのサブカテゴリアコーディオンが動作する
9. トリック・首を動かすが動作する
10. レスポンシブ: 375px / 768px / 1024px / 1440px で表示確認

- [ ] **Step 11: コミット**

```bash
git add script.js
git commit -m "feat: JS をコマンドセンター型に対応（タブ廃止、チップ取得、カテゴリ展開）"
```

---

### Task 4: SW キャッシュ更新 + 最終確認

**Files:**
- Modify: `sw.js:1` (キャッシュバージョン更新)

- [ ] **Step 1: sw.js のキャッシュバージョンを更新する**

```js
const CACHE_NAME = 'aibo-remote-v6';
```

- [ ] **Step 2: コミット**

```bash
git add sw.js
git commit -m "chore: SW キャッシュバージョンを v6 に更新"
```

- [ ] **Step 3: 全体の最終確認**

ブラウザのキャッシュをクリアして `index.html` をリロード。以下を確認:
1. M3 Expressive のデザイントークンが正しく適用されている
2. Nunito + Zen Maru Gothic フォントが読み込まれている
3. モバイル表示: ヘッダーにステータスチップと歯車、モード切替が全幅、クイックアクション、カテゴリリスト
4. PC 表示: 左サイドバーにステータス・モード切替・設定、右にクイックアクション＋カテゴリリスト
5. 全アクションが API 呼び出しまで正常に動作する
