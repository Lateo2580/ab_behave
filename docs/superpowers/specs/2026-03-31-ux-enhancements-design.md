# UX Enhancement Design — ab_behave

**Date**: 2026-03-31
**Status**: Approved
**Scope**: テーマ切替、文字サイズ変更、アクセシビリティ改善、最近使った操作の自動表示

---

## 1. ライト/ダークテーマ切り替え

### 配置
- ヘッダーの歯車ボタン（`#settingsGear`）の左隣に🌙/☀️トグルボタンを追加
- PC（1024px+）ではサイドバー上部、モバイルではヘッダーの `header-actions` 内に配置
- ボタンのスタイルは `.settings-gear` と同じ（32x32, 円形, `surface-container` 背景）

### 実装方式
- `<html data-theme="light|dark">` 属性で制御
- CSS変数を `:root`（ライト）と `[data-theme="dark"]`（ダーク）で二重定義
- `body::before` のグラデーション背景もダーク用に調整（暖色系を維持しつつ暗く）
- `prefers-color-scheme` メディアクエリでOS設定をデフォルト値として取得
- 明示的に選択した場合は `localStorage` の値を優先

### ダーク配色（ウォームダーク）

| トークン | ライト | ダーク |
|----------|--------|--------|
| `--md-primary` | `#B85A3C` | `#FFB599` |
| `--md-on-primary` | `#FFFFFF` | `#3A1507` |
| `--md-primary-container` | `#FFDED3` | `#5C2D1A` |
| `--md-on-primary-container` | `#3A1507` | `#FFDED3` |
| `--md-secondary` | `#5E8A65` | `#A8D5AB` |
| `--md-on-secondary` | `#FFFFFF` | `#1A3620` |
| `--md-secondary-container` | `#C8E6CB` | `#2A3D2D` |
| `--md-on-secondary-container` | `#1A3620` | `#C8E6CB` |
| `--md-tertiary` | `#A07D44` | `#E0C088` |
| `--md-on-tertiary` | `#FFFFFF` | `#352208` |
| `--md-tertiary-container` | `#F0DEB8` | `#4A3820` |
| `--md-on-tertiary-container` | `#352208` | `#F0DEB8` |
| `--md-error` | `#BA1A1A` | `#FFB4AB` |
| `--md-error-container` | `#FFDAD6` | `#93000A` |
| `--md-surface` | `#FFF8F5` | `#231917` |
| `--md-surface-dim` | `#E8DDD7` | `#1E1512` |
| `--md-surface-container-lowest` | `#FFFFFF` | `#1E1512` |
| `--md-surface-container-low` | `#FFF1EB` | `#2D211B` |
| `--md-surface-container` | `#F5E8E0` | `#352A24` |
| `--md-surface-container-high` | `#EBD9D0` | `#3D2E27` |
| `--md-surface-container-highest` | `#E0CEC4` | `#4A3B33` |
| `--md-on-surface` | `#231917` | `#FFEDE6` |
| `--md-on-surface-variant` | `#52443D` | `#D8C2B8` |
| `--md-inverse-surface` | `#392E28` | `#FFEDE6` |
| `--md-inverse-on-surface` | `#FFEDE6` | `#392E28` |
| `--md-outline` | `#857168` | `#6B5B53` |
| `--md-outline-variant` | `#D8C2B8` | `#4A3B33` |

### 永続化
- `localStorage` キー: `aibo_theme` (`"light"` | `"dark"`)
- `<meta name="theme-color">` をテーマ連動で更新（ライト: `#FFF8F5`, ダーク: `#231917`）
- 初期値: `localStorage` に値がなければ `prefers-color-scheme` を参照、それもなければ `"light"`

### トランジション
- テーマ切替時に `body` に `transition: background-color 0.3s, color 0.3s` を一時的に付与
- FOUC（Flash of Unstyled Content）防止: `script.js` の先頭でテーマを即座に適用

---

## 2. 文字サイズ変更

### 配置
- 設定パネル内（`.settings-panel-content`）のトークン入力・ボタン行の下に追加
- ラベル「文字サイズ」+ 3つのセグメントボタン

### 3段階

| レベル | ラベル | `<html>` font-size | スケール倍率 |
|--------|--------|---------------------|-------------|
| 標準 | `A`（小さめ表示） | `16px` | 1.0x |
| 大 | `A`（中サイズ表示） | `18px` | 1.125x |
| 特大 | `A`（大きめ表示） | `20px` | 1.25x |

### 実装方式
- `<html data-font-size="normal|large|xlarge">` 属性で制御
- `html` 要素の `font-size` を変更し、`rem` を使用している箇所が自動スケーリング
- `px` 固定値の箇所は `rem` に変換が必要:
  - `.action-btn` の `min-height: 90px` → `min-height: 5.625rem`
  - `.action-btn` の `font-size: 12px` → `font-size: 0.75rem`
  - `.input-group input` の `font-size: 15px` → `font-size: 0.9375rem`
  - `.btn` の `font-size: 14px` → `font-size: 0.875rem`
  - `.status` の `font-size: 13px` → `font-size: 0.8125rem`
  - その他 `px` でハードコードされた `font-size` → `rem` 変換

### レイアウト保護
- `action-grid` の列数は変更しない（モバイル2列、タブレット3列、PC4列）
- `quick-action-icon` のサイズはそのまま維持（`44px`/`48px` 固定 — タッチターゲット）
- サイドバーの `grid-template-columns: 280px 1fr` は固定値を維持
- ボタンの `padding` は `em` ベースにして文字サイズに追従

### セグメントボタンUI
```
[  A  |  A  |  A  ]
 標準    大   特大
```
- 選択中のセグメントは `primary` 背景 + `on-primary` 文字色
- 非選択は `surface-container` 背景

### 永続化
- `localStorage` キー: `aibo_font_size` (`"normal"` | `"large"` | `"xlarge"`)
- 初期値: `"normal"`

---

## 3. aria-live 付き常設ステータスバー

### 変更対象
- `index.html`: `#actionStatus` に `role="status"`, `aria-live="polite"`, `aria-atomic="true"` を追加
- `script.js`: `showStatus()` 関数はそのまま活用。`alert()` 呼び出しがあれば `showStatus()` に置き換え

### ステータスの種類（既存を維持）
- `success`: 実行成功（緑系）
- `error`: エラー（赤系）
- `loading`: 実行中（グレー系）

### 変更範囲
- HTML属性の追加のみ。CSS・JSの大きな変更は不要
- `alert()` が `script.js` 内で使われている箇所を洗い出し、`showStatus()` に統合

---

## 4. フォーカス可視化 + aria-expanded

### 4a. フォーカスリングの改善

**現状の問題**: `input:focus` で `outline: none` を設定しており、キーボードユーザーがフォーカス位置を見失う。

**修正**:
```css
/* 削除 */
.input-group input:focus {
  outline: none;
}

/* 追加 */
.input-group input:focus-visible {
  outline: 2px solid var(--md-primary);
  outline-offset: 2px;
}

.input-group input:focus:not(:focus-visible) {
  outline: none;
}
```

全てのインタラクティブ要素（`.btn`, `.action-btn`, `.mode-btn`, `.status-chip`, `.settings-gear`, `.category-header`, `.accordion-header`）に同様の `:focus-visible` スタイルを適用。

### 4b. aria-expanded / aria-controls

以下のトグル要素に属性を追加:

| 要素 | aria-expanded | aria-controls |
|------|---------------|---------------|
| `#settingsPanelToggle` | `true/false` | `settingsPanelContent` |
| `.category-header[data-category="posture"]` | `true/false` | `categoryPostureContent` |
| `.category-header[data-category="motion"]` | `true/false` | `categoryMotionContent` |
| `.category-header[data-category="trick"]` | `true/false` | `categoryTrickContent` |
| `.category-header[data-category="moveHead"]` | `true/false` | `categoryMoveHeadContent` |
| `#moveHeadCustomToggle` | `true/false` | `moveHeadCustom` |
| 各 `.accordion-header` | `true/false` | 対応する `.accordion-content` |

`script.js` のトグル処理で `setAttribute('aria-expanded', ...)` を連動更新。

### 4c. user-scalable の許可

`index.html` の `<meta name="viewport">` から `user-scalable=no` を削除:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 4d. キーボードナビゲーション

カテゴリヘッダー・アコーディオンヘッダーに:
- `role="button"` と `tabindex="0"` を追加
- Enter/Space キーでもトグルできるようイベントリスナーを追加

---

## 5. お気に入り・最近使った操作の自動表示

### データ構造

`localStorage` キー: `aibo_action_history`

```json
{
  "posture:stand": { "count": 15, "lastUsed": 1774951000000 },
  "motion:dance:NONE": { "count": 8, "lastUsed": 1774950000000 },
  "trick:happyBirthday": { "count": 3, "lastUsed": 1774949000000 },
  "moveHead:preset:left": { "count": 5, "lastUsed": 1774948000000 }
}
```

キー命名規則:
- 姿勢: `posture:{postureName}`
- ふるまい: `motion:{category}:{mode}`
- トリック: `trick:{trickName}`
- 首プリセット: `moveHead:preset:{presetName}`

### 表示ロジック
- `lastUsed` でソートし、直近4件を表示
- 実行履歴が0件の場合はセクション非表示
- 表示更新タイミング: アクション実行成功時

### UI
- クイックアクションバーの上に配置
- ラベル: 「最近使った操作」（`.category-list-label` と同じスタイル）
- 横スクロール可能なチップ形式（ `display: flex; overflow-x: auto; gap: 8px;`）
- 各チップ: 絵文字 + 名前、タップで即実行
- スタイル: `surface-container-high` 背景、`shape-full` のピル型

### 記録タイミング
- `executePosture()`, `executeMotion()`, `executeTrick()`, `executeMoveHead()` の成功コールバック内で記録

---

## 技術的な注意事項

### FOUC 防止
`script.js` の先頭（DOMContentLoaded の前）でテーマと文字サイズを即座に適用:
```javascript
// IIFE で即時実行
(function() {
  const theme = localStorage.getItem('aibo_theme') ||
    (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;

  const fontSize = localStorage.getItem('aibo_font_size') || 'normal';
  document.documentElement.dataset.fontSize = fontSize;
})();
```

### Service Worker キャッシュ
- `sw.js` の `CACHE_NAME` バージョンを更新して再キャッシュを促す

### CSS変数の構成
- `:root` にライトテーマの値を維持（既存コードとの互換性）
- `[data-theme="dark"]` セレクタで上書き
- `[data-font-size="large"] { font-size: 18px; }`
- `[data-font-size="xlarge"] { font-size: 20px; }`

### ファイル変更範囲
| ファイル | 変更内容 |
|----------|----------|
| `index.html` | viewport修正、aria属性追加、テーマトグルボタン追加、文字サイズUI追加、ステータスaria属性追加 |
| `style.css` | ダークテーマ変数、文字サイズ変数、focus-visible、px→rem変換、最近の操作セクション、セグメントボタン |
| `script.js` | テーマ切替ロジック、文字サイズ切替、aria-expanded連動、履歴記録・表示、FOUC防止IIFE |
| `sw.js` | CACHE_NAME バージョン更新 |
