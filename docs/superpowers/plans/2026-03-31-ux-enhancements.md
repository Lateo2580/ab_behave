# UX Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** テーマ切替、文字サイズ変更、アクセシビリティ改善、最近使った操作表示を ab_behave PWA に追加する。

**Architecture:** `<html>` の `data-theme` / `data-font-size` 属性で CSS 変数を切替えるアプローチ。FOUC 防止のため `script.js` 先頭で IIFE で即時適用。履歴データは `localStorage` に JSON で保持。全変更は既存4ファイル（`index.html`, `style.css`, `script.js`, `sw.js`）のみ。

**Tech Stack:** HTML / CSS (CSS Custom Properties) / Vanilla JavaScript / Web Storage API

---

## File Map

| ファイル | 変更内容 |
|----------|----------|
| `style.css` | ダークテーマ変数、文字サイズ変数、px→rem変換、focus-visible、セグメントボタン、最近の操作チップ |
| `script.js` | FOUC防止IIFE、テーマ切替、文字サイズ切替、aria-expanded連動、キーボードナビ、履歴記録・表示、alert→showStatus |
| `index.html` | viewport修正、aria属性追加、テーマトグルボタン、文字サイズUI、最近の操作セクション |
| `sw.js` | CACHE_NAME バージョン更新 |

---

### Task 1: CSS — ダークテーマ変数を追加

**Files:**
- Modify: `style.css:4-64` (`:root` の後に `[data-theme="dark"]` を追加)

- [ ] **Step 1: `[data-theme="dark"]` セレクタを追加**

`style.css` の `:root { ... }` ブロック（行64）の直後に以下を追加:

```css
/* Dark theme (Warm Dark) */
[data-theme="dark"] {
  --md-primary: #FFB599;
  --md-on-primary: #3A1507;
  --md-primary-container: #5C2D1A;
  --md-on-primary-container: #FFDED3;

  --md-secondary: #A8D5AB;
  --md-on-secondary: #1A3620;
  --md-secondary-container: #2A3D2D;
  --md-on-secondary-container: #C8E6CB;

  --md-tertiary: #E0C088;
  --md-on-tertiary: #352208;
  --md-tertiary-container: #4A3820;
  --md-on-tertiary-container: #F0DEB8;

  --md-error: #FFB4AB;
  --md-error-container: #93000A;

  --md-surface: #231917;
  --md-surface-dim: #1E1512;
  --md-surface-container-lowest: #1E1512;
  --md-surface-container-low: #2D211B;
  --md-surface-container: #352A24;
  --md-surface-container-high: #3D2E27;
  --md-surface-container-highest: #4A3B33;
  --md-on-surface: #FFEDE6;
  --md-on-surface-variant: #D8C2B8;
  --md-inverse-surface: #FFEDE6;
  --md-inverse-on-surface: #392E28;

  --md-outline: #6B5B53;
  --md-outline-variant: #4A3B33;

  --md-elevation-1: color-mix(in srgb, var(--md-primary) 5%, var(--md-surface));
  --md-elevation-2: color-mix(in srgb, var(--md-primary) 8%, var(--md-surface));
  --md-elevation-3: color-mix(in srgb, var(--md-primary) 11%, var(--md-surface));
}
```

- [ ] **Step 2: `body::before` のダーク用グラデーションを追加**

`style.css` の `body::before` ルール（行84-93）の後に追加:

```css
[data-theme="dark"] body::before {
  background:
    radial-gradient(ellipse 120% 80% at 20% 0%, color-mix(in srgb, var(--md-primary-container) 20%, transparent) 0%, transparent 60%),
    radial-gradient(ellipse 80% 100% at 90% 100%, color-mix(in srgb, var(--md-secondary-container) 15%, transparent) 0%, transparent 50%);
}
```

- [ ] **Step 3: テーマ切替トランジションのCSSを追加**

`body` ルール（行74-81）の後に追加:

```css
body.theme-transitioning,
body.theme-transitioning * {
  transition: background-color 0.3s var(--md-ease-standard),
              color 0.3s var(--md-ease-standard),
              border-color 0.3s var(--md-ease-standard) !important;
}
```

- [ ] **Step 4: テーマトグルボタンのCSSを追加**

`.settings-gear` ルール（行198-215）の後に追加:

```css
/* Theme toggle button */
.theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--md-surface-container);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: transform var(--md-duration-short) var(--md-ease-spring),
              background var(--md-duration-short) var(--md-ease-standard);
}

.theme-toggle:active {
  transform: scale(0.9);
}
```

- [ ] **Step 5: ブラウザで確認**

`index.html` を開き、ブラウザの DevTools Console で以下を実行して切替を確認:
```javascript
document.documentElement.dataset.theme = 'dark';
// 戻す: document.documentElement.dataset.theme = 'light';
```

- [ ] **Step 6: コミット**

```bash
git add style.css
git commit -m "style: ダークテーマ(ウォームダーク)のCSS変数とトグルボタンスタイルを追加"
```

---

### Task 2: CSS — 文字サイズ変数と px→rem 変換

**Files:**
- Modify: `style.css` (複数箇所の `px` → `rem` 変換、`[data-font-size]` ルール追加)

- [ ] **Step 1: 文字サイズのデータ属性ルールを追加**

Task 1 で追加したダークテーマブロックの後に:

```css
/* Font size scaling */
[data-font-size="large"] { font-size: 18px; }
[data-font-size="xlarge"] { font-size: 20px; }
```

- [ ] **Step 2: テキスト関連の `px` 値を `rem` に変換**

以下の箇所を編集（各行の `font-size` を `rem` に変更）:

`.settings-panel-header`（行246）:
```css
font-size: 0.9rem;  /* was 0.9rem — already rem, keep */
```

`.input-group label`（行291）:
```css
font-size: 0.78rem;  /* already rem, keep */
```

`.input-group input`（行299）:
```css
font-size: 0.9375rem;  /* was 15px */
```

`.btn`（行327）:
```css
font-size: 0.875rem;  /* was 14px */
```

`.device-info`（行398）:
```css
font-size: 0.8125rem;  /* was 13px */
```

`.action-btn`（行635-636）:
```css
min-height: 5.625rem;  /* was 90px */
font-size: 0.75rem;    /* was 12px */
```

`.mode-btn`（行444）:
```css
font-size: 0.875rem;  /* was 14px */
```

`.status`（行870）:
```css
font-size: 0.8125rem;  /* was 13px */
```

`.accordion-header`（行726）:
```css
font-size: 0.9rem;  /* already rem, keep */
```

`.move-head-custom-toggle`（行774）:
```css
font-size: 0.85rem;  /* already rem, keep */
```

- [ ] **Step 3: セグメントボタン（文字サイズ選択UI）のCSSを追加**

`.settings-panel-content` 関連スタイルの後（行280あたり）に追加:

```css
/* Font size segment control */
.font-size-group {
  margin-top: 16px;
}

.font-size-group label {
  display: block;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--md-on-surface-variant);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.font-size-segments {
  display: flex;
  border-radius: var(--md-shape-full);
  overflow: hidden;
  border: 2px solid var(--md-outline-variant);
}

.font-size-seg {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: var(--md-surface-container);
  color: var(--md-on-surface);
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: background var(--md-duration-short) var(--md-ease-standard),
              color var(--md-duration-short) var(--md-ease-standard);
}

.font-size-seg:not(:last-child) {
  border-right: 1px solid var(--md-outline-variant);
}

.font-size-seg[aria-pressed="true"] {
  background: var(--md-primary);
  color: var(--md-on-primary);
}

.font-size-seg:active {
  transform: scale(0.97);
}
```

- [ ] **Step 4: ブラウザで確認**

DevTools Console で `document.documentElement.style.fontSize = '20px'` を実行し、レイアウトが崩れないか確認。

- [ ] **Step 5: コミット**

```bash
git add style.css
git commit -m "style: 文字サイズ3段階のCSS(px→rem変換、セグメントボタン)を追加"
```

---

### Task 3: CSS — focus-visible と最近使った操作のスタイル

**Files:**
- Modify: `style.css` (focus-visible追加、最近の操作チップ)

- [ ] **Step 1: input の focus スタイルを focus-visible に変更**

`style.css` の `.input-group input:focus` ルール（行311-315）を以下に置き換え:

```css
.input-group input:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}

.input-group input:focus:not(:focus-visible) {
  outline: none;
  border-color: var(--md-primary);
  box-shadow: 0 0 0 1px var(--md-primary);
}
```

- [ ] **Step 2: 全インタラクティブ要素に focus-visible リングを追加**

ファイル末尾（レスポンシブクエリの前、セクション8の後あたり）に追加:

```css
/* ========== Focus Visible ========== */
.btn:focus-visible,
.action-btn:focus-visible,
.mode-btn:focus-visible,
.status-chip:focus-visible,
.settings-gear:focus-visible,
.theme-toggle:focus-visible,
.category-header:focus-visible,
.accordion-header:focus-visible,
.move-head-custom-toggle:focus-visible,
.quick-action-btn:focus-visible,
.font-size-seg:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.btn:focus:not(:focus-visible),
.action-btn:focus:not(:focus-visible),
.mode-btn:focus:not(:focus-visible),
.status-chip:focus:not(:focus-visible),
.settings-gear:focus:not(:focus-visible),
.theme-toggle:focus:not(:focus-visible),
.category-header:focus:not(:focus-visible),
.accordion-header:focus:not(:focus-visible),
.move-head-custom-toggle:focus:not(:focus-visible),
.quick-action-btn:focus:not(:focus-visible),
.font-size-seg:focus:not(:focus-visible) {
  outline: none;
}
```

- [ ] **Step 3: 最近使った操作セクションのCSSを追加**

focus-visible セクションの後に追加:

```css
/* ========== Recent Actions ========== */
.recent-actions {
  margin-bottom: 12px;
}

.recent-actions-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.recent-actions-scroll::-webkit-scrollbar {
  display: none;
}

.recent-action-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--md-shape-full);
  background: var(--md-surface-container-high);
  color: var(--md-on-surface);
  border: none;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: transform var(--md-duration-short) var(--md-ease-spring),
              background var(--md-duration-short) var(--md-ease-standard);
}

.recent-action-chip:active {
  transform: scale(0.93);
}

.recent-action-chip .chip-emoji {
  font-size: 1.1rem;
}
```

- [ ] **Step 4: コミット**

```bash
git add style.css
git commit -m "style: focus-visible リングと最近使った操作チップのスタイルを追加"
```

---

### Task 4: HTML — テーマトグル、文字サイズUI、aria属性、最近の操作セクション

**Files:**
- Modify: `index.html`

- [ ] **Step 1: viewport meta から user-scalable=no を削除**

`index.html` 行5 を変更:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

- [ ] **Step 2: モバイルヘッダーにテーマトグルボタンを追加**

`index.html` の `header-actions` 内（行37の `settings-gear` の前）に追加:

```html
            <button class="theme-toggle" id="themeToggle" aria-label="テーマ切替">🌙</button>
```

- [ ] **Step 3: 設定パネル内に文字サイズUIを追加**

`index.html` の `settings-panel-content` 内、`button-row` div（行74-77）の後に追加:

```html
            <div class="font-size-group">
              <label>文字サイズ</label>
              <div class="font-size-segments" role="group" aria-label="文字サイズ選択">
                <button class="font-size-seg" data-size="normal" aria-pressed="true" style="font-size:0.8rem;">A</button>
                <button class="font-size-seg" data-size="large" aria-pressed="false" style="font-size:1rem;">A</button>
                <button class="font-size-seg" data-size="xlarge" aria-pressed="false" style="font-size:1.2rem;">A</button>
              </div>
            </div>
```

- [ ] **Step 4: #actionStatus に aria 属性を追加**

`index.html` 行233 を変更:

```html
        <div class="status" id="actionStatus" role="status" aria-live="polite" aria-atomic="true"></div>
```

- [ ] **Step 5: カテゴリヘッダーに aria-expanded / aria-controls / role / tabindex を追加**

各 `.category-header` に属性を追加:

行127（posture）:
```html
          <div class="category-header" data-category="posture" role="button" tabindex="0" aria-expanded="false" aria-controls="categoryPostureContent">
```

行172（motion）:
```html
          <div class="category-header" data-category="motion" role="button" tabindex="0" aria-expanded="false" aria-controls="categoryMotionContent">
```

行188（trick）:
```html
          <div class="category-header" data-category="trick" role="button" tabindex="0" aria-expanded="false" aria-controls="categoryTrickContent">
```

行201（moveHead）:
```html
          <div class="category-header" data-category="moveHead" role="button" tabindex="0" aria-expanded="false" aria-controls="categoryMoveHeadContent">
```

- [ ] **Step 6: 設定パネルヘッダーに aria 属性を追加**

行64:
```html
          <div class="settings-panel-header" id="settingsPanelToggle" role="button" tabindex="0" aria-expanded="false" aria-controls="settingsPanelContent">
```

- [ ] **Step 7: moveHeadCustomToggle に aria 属性を追加**

行209:
```html
              <div class="move-head-custom-toggle" id="moveHeadCustomToggle" role="button" tabindex="0" aria-expanded="false" aria-controls="moveHeadCustom">
```

- [ ] **Step 8: 最近使った操作セクションを追加**

`index.html` の `command-center` 内、モバイルモードボタン（行98-100）の後、クイックアクションバーの前に追加:

```html
        <!-- 最近使った操作 -->
        <div class="recent-actions hidden" id="recentActions">
          <div class="category-list-label">最近使った操作</div>
          <div class="recent-actions-scroll" id="recentActionsScroll"></div>
        </div>
```

- [ ] **Step 9: コミット**

```bash
git add index.html
git commit -m "feat: テーマトグル、文字サイズUI、aria属性、最近の操作セクションをHTMLに追加"
```

---

### Task 5: JS — FOUC防止IIFEとテーマ切替ロジック

**Files:**
- Modify: `script.js:1` (先頭にIIFE追加), `script.js:323-387` (bindEvents, DOMContentLoaded)

- [ ] **Step 1: FOUC防止IIFEをファイル先頭に追加**

`script.js` の1行目（`const API_BASE = ...` の前）に挿入:

```javascript
// ========== FOUC 防止: テーマ・文字サイズを即時適用 ==========
(function () {
  const theme = localStorage.getItem('aibo_theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;

  const fontSize = localStorage.getItem('aibo_font_size') || 'normal';
  document.documentElement.dataset.fontSize = fontSize;
})();

```

- [ ] **Step 2: テーマ切替関数を追加**

`script.js` の `showStatus` 関数（行790）の前あたりに追加:

```javascript
// ========== テーマ切替 ==========
function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.dataset.theme === 'dark' ? 'light' : 'dark';

  document.body.classList.add('theme-transitioning');
  html.dataset.theme = newTheme;
  localStorage.setItem('aibo_theme', newTheme);

  // theme-color meta を更新
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.content = newTheme === 'dark' ? '#231917' : '#FFF8F5';
  }

  // トグルボタンのアイコンを更新
  updateThemeToggleIcon(newTheme);

  setTimeout(() => {
    document.body.classList.remove('theme-transitioning');
  }, 350);
}

function updateThemeToggleIcon(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = icon;
}
```

- [ ] **Step 3: DOMContentLoaded 内でテーマアイコンを初期化**

`script.js` の `DOMContentLoaded` コールバック内（`buildMoveHeadPresets()` の後）に追加:

```javascript
  // テーマトグルアイコンを初期化
  updateThemeToggleIcon(document.documentElement.dataset.theme);
```

- [ ] **Step 4: bindEvents にテーマトグルのイベントリスナーを追加**

`bindEvents()` 関数の先頭（設定パネルのリスナーの前）に追加:

```javascript
  // テーマ切替
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
```

- [ ] **Step 5: ブラウザで確認**

テーマトグルボタンをクリックしてダーク↔ライトが切り替わることを確認。リロード後も設定が維持されることを確認。

- [ ] **Step 6: コミット**

```bash
git add script.js
git commit -m "feat: テーマ切替ロジック(FOUC防止IIFE含む)を追加"
```

---

### Task 6: JS — 文字サイズ切替ロジック

**Files:**
- Modify: `script.js`

- [ ] **Step 1: 文字サイズ切替関数を追加**

テーマ切替関数の後に追加:

```javascript
// ========== 文字サイズ切替 ==========
function setFontSize(size) {
  document.documentElement.dataset.fontSize = size;
  localStorage.setItem('aibo_font_size', size);
  updateFontSizeSegments(size);
}

function updateFontSizeSegments(activeSize) {
  document.querySelectorAll('.font-size-seg').forEach(btn => {
    btn.setAttribute('aria-pressed', btn.dataset.size === activeSize ? 'true' : 'false');
  });
}
```

- [ ] **Step 2: DOMContentLoaded で文字サイズセグメントを初期化**

`updateThemeToggleIcon(...)` の後に追加:

```javascript
  // 文字サイズセグメントを初期化
  updateFontSizeSegments(document.documentElement.dataset.fontSize || 'normal');
```

- [ ] **Step 3: bindEvents に文字サイズセグメントのイベントリスナーを追加**

テーマ切替リスナーの後に追加:

```javascript
  // 文字サイズ切替
  document.querySelectorAll('.font-size-seg').forEach(btn => {
    btn.addEventListener('click', () => setFontSize(btn.dataset.size));
  });
```

- [ ] **Step 4: ブラウザで確認**

設定パネルを開き、文字サイズの各セグメントボタンをクリック。テキストがスケーリングされ、レイアウトが崩れないことを確認。

- [ ] **Step 5: コミット**

```bash
git add script.js
git commit -m "feat: 文字サイズ3段階切替ロジックを追加"
```

---

### Task 7: JS — aria-expanded 連動とキーボードナビゲーション

**Files:**
- Modify: `script.js`

- [ ] **Step 1: toggleSettingsPanel に aria-expanded を追加**

`toggleSettingsPanel` 関数（行448-453）を以下に変更:

```javascript
function toggleSettingsPanel() {
  const content = document.getElementById('settingsPanelContent');
  const arrow = document.getElementById('settingsPanelArrow');
  const toggle = document.getElementById('settingsPanelToggle');
  const isShow = content.classList.toggle('show');
  arrow.textContent = isShow ? '▼' : '▲';
  toggle.setAttribute('aria-expanded', String(isShow));
}
```

- [ ] **Step 2: bindCategoryToggle に aria-expanded を追加**

`bindCategoryToggle` 関数（行533-539）を以下に変更:

```javascript
function bindCategoryToggle() {
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.closest('.category-card');
      const isOpen = card.classList.toggle('open');
      header.setAttribute('aria-expanded', String(isOpen));
    });
  });
}
```

- [ ] **Step 3: moveHeadCustomToggle の aria-expanded を追加**

`bindEvents` 内の moveHeadCustomToggle リスナー（行364-369）を以下に変更:

```javascript
  document.getElementById('moveHeadCustomToggle').addEventListener('click', () => {
    const content = document.getElementById('moveHeadCustom');
    const arrow = document.getElementById('moveHeadCustomArrow');
    const toggle = document.getElementById('moveHeadCustomToggle');
    const isOpen = content.classList.toggle('open');
    arrow.textContent = isOpen ? '▲' : '▼';
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
```

- [ ] **Step 4: buildMotionAccordion に aria-expanded を追加**

`buildMotionAccordion` 関数内のヘッダー生成（行267-274）を以下に変更:

```javascript
    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    header.setAttribute('aria-expanded', 'false');
    header.innerHTML = `<span>${group.label}</span><span class="accordion-arrow">▼</span>`;

    const content = document.createElement('div');
    content.className = 'accordion-content';
    content.id = `accordion-${group.id}`;
    header.setAttribute('aria-controls', content.id);

    header.addEventListener('click', () => {
      const arrow = header.querySelector('.accordion-arrow');
      const isOpen = content.classList.toggle('open');
      arrow.textContent = isOpen ? '▲' : '▼';
      header.setAttribute('aria-expanded', String(isOpen));
    });
```

- [ ] **Step 5: キーボードナビゲーション（Enter/Space）を追加**

`bindEvents` 関数の末尾（`moveHeadExecuteBtn` リスナーの後）に追加:

```javascript
  // キーボードナビゲーション: Enter/Space で role="button" 要素をクリック
  document.querySelectorAll('[role="button"][tabindex="0"]').forEach(el => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
```

- [ ] **Step 6: updateUI で未設定時の設定パネル自動展開に aria-expanded を追加**

`updateUI` 関数内（行439-444）を以下に変更:

```javascript
  if (!isReady) {
    const content = document.getElementById('settingsPanelContent');
    const toggle = document.getElementById('settingsPanelToggle');
    if (!content.classList.contains('show')) {
      content.classList.add('show');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }
```

- [ ] **Step 7: コミット**

```bash
git add script.js
git commit -m "a11y: aria-expanded連動とキーボードナビゲーションを追加"
```

---

### Task 8: JS — alert() を showStatus() に置換

**Files:**
- Modify: `script.js`

- [ ] **Step 1: alert() の使用箇所を特定して置換**

以下6箇所の `alert()` を `showStatus()` に変更:

**行462** (`saveToken` — トークン未入力):
```javascript
      showStatus('error', 'トークンを入力してください', 'actionStatus');
```

**行475** (`saveToken` — 暗号化失敗):
```javascript
    showStatus('error', '暗号化に失敗しました。ブラウザが Web Crypto API に対応しているか確認してください。', 'actionStatus');
```

**行490** (`saveToken` — 保存成功):
```javascript
  showStatus('success', 'トークンを保存しました。「接続テスト」を押してaiboと接続してください。', 'actionStatus');
  setTimeout(() => {
    document.getElementById('actionStatus').classList.remove('show');
  }, 5000);
```

**行495** (`fetchDevices` — トークン未保存):
```javascript
    showStatus('error', '先にトークンを保存してください', 'actionStatus');
```

**行513** (`fetchDevices` — デバイス見つからない):
```javascript
      showStatus('error', 'aiboが見つかりませんでした。トークンを確認してください。', 'actionStatus');
```

**行525** (`fetchDevices` — 接続成功):
```javascript
    showStatus('success', `${currentDeviceName} と接続しました！`, 'actionStatus');
    setTimeout(() => {
      document.getElementById('actionStatus').classList.remove('show');
    }, 3000);
```

**行528** (`fetchDevices` — エラー):
```javascript
    showStatus('error', `接続エラー: ${error.message}`, 'actionStatus');
```

- [ ] **Step 2: ブラウザで確認**

設定パネルでトークン未入力で「保存」を押し、ステータスバーにエラーが表示されることを確認。

- [ ] **Step 3: コミット**

```bash
git add script.js
git commit -m "refactor: alert()をshowStatus()に統合してaria-liveステータスに集約"
```

---

### Task 9: JS — 最近使った操作の履歴記録と表示

**Files:**
- Modify: `script.js`

- [ ] **Step 1: 履歴データの読み書きユーティリティを追加**

`showStatus` 関数の後に追加:

```javascript
// ========== 最近使った操作 ==========
const STORAGE_KEY_HISTORY = 'aibo_action_history';

function recordAction(actionKey, displayName, emoji) {
  let history = {};
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '{}');
  } catch { /* ignore */ }

  if (!history[actionKey]) {
    history[actionKey] = { count: 0, lastUsed: 0, name: displayName, emoji: emoji || '' };
  }
  history[actionKey].count += 1;
  history[actionKey].lastUsed = Date.now();
  history[actionKey].name = displayName;
  if (emoji) history[actionKey].emoji = emoji;

  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  renderRecentActions();
}

function getRecentActions(limit = 4) {
  let history = {};
  try {
    history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '{}');
  } catch { return []; }

  return Object.entries(history)
    .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
    .slice(0, limit)
    .map(([key, data]) => ({ key, ...data }));
}
```

- [ ] **Step 2: renderRecentActions 関数を追加**

```javascript
function renderRecentActions() {
  const container = document.getElementById('recentActions');
  const scroll = document.getElementById('recentActionsScroll');
  if (!container || !scroll) return;

  const actions = getRecentActions(4);
  if (actions.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  scroll.innerHTML = '';

  actions.forEach(action => {
    const chip = document.createElement('button');
    chip.className = 'recent-action-chip';
    chip.innerHTML = `<span class="chip-emoji">${action.emoji}</span>${action.name}`;
    chip.addEventListener('click', () => executeRecentAction(action.key));
    scroll.appendChild(chip);
  });
}

function executeRecentAction(actionKey) {
  const parts = actionKey.split(':');
  const type = parts[0];

  if (type === 'posture') {
    executePosture(parts[1]);
  } else if (type === 'motion') {
    const category = parts[1];
    const mode = parts[2];
    // 名前は履歴から取得
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '{}');
    const name = history[actionKey]?.name || category;
    executeMotion(category, mode, name);
  } else if (type === 'trick') {
    const trickName = parts[1];
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '{}');
    const name = history[actionKey]?.name || trickName;
    executeTrick(trickName, name);
  } else if (type === 'moveHead' && parts[1] === 'preset') {
    const presetName = parts[2];
    const preset = MOVE_HEAD_PRESETS.find(p => p.name === presetName);
    if (preset) {
      executeMoveHead(preset.azimuth, preset.elevation, preset.velocity);
    }
  }
}
```

- [ ] **Step 3: 各実行関数の成功コールバックに recordAction を追加**

**executePosture** — `showStatus('success', ...)` の行の後に追加:
```javascript
    const postureEmojis = { stand:'🧍', stand_straight:'📐', sit:'🪑', sit_and_raise_both_hands:'🙌', down:'⬇️', crouch:'🦆', down_and_lengthen_behind:'😴', down_and_shorten_behind:'🛌', sleep:'💤', back:'🔄' };
    recordAction(`posture:${postureKey}`, posture.name, postureEmojis[postureKey] || '🐾');
```

**executeMotion** — `showStatus('success', ...)` の行の後に追加:
```javascript
    recordAction(`motion:${category}:${mode}`, displayName, '🎮');
```

**executeTrick** — `showStatus('success', ...)` の行の後に追加:
```javascript
    recordAction(`trick:${trickName}`, displayName, '🎪');
```

**executeMoveHead** — `showStatus('success', ...)` の行の後に追加（プリセットの場合のみ記録）:
```javascript
    const matchedPreset = MOVE_HEAD_PRESETS.find(p => p.azimuth === azimuth && p.elevation === elevation);
    if (matchedPreset) {
      recordAction(`moveHead:preset:${matchedPreset.name}`, matchedPreset.name, '🐕');
    }
```

- [ ] **Step 4: DOMContentLoaded で最近の操作を初期描画**

`updateFontSizeSegments(...)` の後に追加:

```javascript
  // 最近使った操作を表示
  renderRecentActions();
```

- [ ] **Step 5: ブラウザで確認**

いくつかのアクションを実行し、最近使った操作がチップとして表示されることを確認。

- [ ] **Step 6: コミット**

```bash
git add script.js
git commit -m "feat: 最近使った操作の履歴記録と自動表示を追加"
```

---

### Task 10: SW — キャッシュバージョン更新と最終確認

**Files:**
- Modify: `sw.js:1`

- [ ] **Step 1: CACHE_NAME を更新**

`sw.js` 行1 を変更:

```javascript
const CACHE_NAME = 'aibo-remote-v7';
```

- [ ] **Step 2: コミット**

```bash
git add sw.js
git commit -m "chore: Service Worker キャッシュバージョンを v7 に更新"
```

- [ ] **Step 3: 全体の動作確認**

ブラウザで以下を確認:
1. テーマ切替: 🌙ボタンでダーク↔ライト切替、リロード後も維持
2. 文字サイズ: 設定パネルで3段階切替、レイアウト崩れなし
3. ステータスバー: アクション実行時に aria-live で通知
4. フォーカス: Tab キーで全要素にフォーカスリング表示
5. キーボード: Enter/Space でカテゴリ展開
6. 最近の操作: 実行後にチップ表示、タップで再実行
7. ピンチズーム: モバイルで拡大可能

- [ ] **Step 4: 全変更をまとめた確認コミット（必要な場合のみ）**

全テストをパスしたら完了。修正が必要な場合はここで対応してコミット。
