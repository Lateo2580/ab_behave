# ふるまいバリエーション大幅拡充 設計書

> 作成日: 2026-03-29

## 概要

ab_behave の aibo ふるまい操作を大幅に拡充する。現在の PlayMotion 8種 + ChangePosture 10種から、PlayMotion 全種（約80種）+ PlayTrick 7種 + MoveHead を追加する。

## スコープ

### 追加するもの

- **PlayMotion**: 8種 → 約80種（7グループのアコーディオンUI）
- **PlayTrick**: 7種の新規セクション
- **MoveHead**: プリセット5つ + カスタムスライダーUIの新規セクション

### 追加しないもの

- PlayBone / PlayDice（アクセサリー系）
- 移動系 API（MoveForward, TurnAround 等）
- 認識系 API の追加（HungryStatus, SleepyStatus は実装済みのまま）

## 実装アプローチ

単一ファイル構成を維持する。index.html / script.js / style.css をそれぞれ拡張し、ビルドツールは導入しない。

## アクションタブ内の配置順

```
📋 モード切替（既存のまま）
─────────────────
🐾 姿勢を変える（既存 ChangePosture、変更なし）
─────────────────
🎮 ふるまい（PlayMotion）
  ▶ 🤝 あいさつ・コミュニケーション（11種）
  ▶ 🗣️ 鳴き声・歌（8種）
  ▶ 💃 ダンス・運動（11種）
  ▶ 💕 甘え・感情表現（20種）
  ▶ 🐾 からだの動き（21種）
  ▶ 😴 休息・くつろぎ（8種）
  ▶ 🔍 探索・反応（21種）
─────────────────
🎪 トリック（PlayTrick、7種）
─────────────────
🐕 首を動かす（MoveHead）
```

## データ構造

### PlayMotion（MOTION_GROUPS）

script.js の先頭に定義する配列。各グループは以下の構造:

```js
{
  id: 'greeting',           // グループ識別子
  label: '🤝 あいさつ・コミュニケーション',  // 表示ラベル
  motions: [
    { category: 'paw', mode: 'BODY_LEFT', name: '左前足でお手' },
    ...
  ]
}
```

#### グループ一覧と所属モーション

**🤝 あいさつ・コミュニケーション** (greeting)
- paw (BODY_LEFT / BODY_RIGHT), highFive (NONE / BODY_LEFT / BODY_RIGHT)
- beckon (BODY_LEFT / BODY_RIGHT), agree (NONE), nodHead (NONE)
- greeting (NONE), handUp (NONE)

**🗣️ 鳴き声・歌** (voice)
- bark (NONE), sing (NONE), yap (NONE), woof (NONE)
- whine (NONE), belch (NONE), sneeze (NONE), sleepTalking (NONE)

**💃 ダンス・運動** (performance)
- dance (NONE), stretch (NONE), swing (NONE)
- sideKick (FRONT_LEFT / FRONT_RIGHT), sideUp (BODY_LEFT / BODY_RIGHT)
- heeling (NONE / SPACE_LEFT / SPACE_RIGHT), shakeHipsBehind (NONE)

**💕 甘え・感情表現** (emotion)
- friendly (NONE), friendlyPalette (NONE), helloILoveYou (NONE), infriendly (NONE)
- kiss (NONE), hug (NONE), happy (NONE), happyOrHot (NONE), overJoyed (NONE)
- touched (SPACE_CENTER), prettyPlease (NONE), requestToPlay (NONE)
- bad (NONE), shakeHead (NONE), peace (SPACE_LEFT / SPACE_RIGHT)
- ready (NONE), restless (NONE), waiting (NONE), tired (NONE)

**🐾 からだの動き** (body)
- lickBody (BODY_LEFT / BODY_RIGHT), lickFace (NONE)
- washFace (NONE), scratchHead (NONE / HIND_LEFT / HIND_RIGHT), scratchFloor (NONE)
- rubBack (NONE), shake (NONE), jiggle (NONE), shudder (NONE)
- showTummy (NONE), marking (BOY / GIRL)
- wiggleEar (BODY_BOTH / BODY_LEFT / BODY_RIGHT)
- drawInOnesChin (NONE), bentBack (NONE), peePose (NONE)

**😴 休息・くつろぎ** (rest)
- relax (NONE), sleep (NONE), dreaming (NONE), halfAsleep (NONE)
- yawn (NONE), nod (NONE), breath (NONE), sit (NONE)

**🔍 探索・反応** (reaction)
- curious (NONE), perceive (NONE), lookOver (NONE), lookAroundHead (NONE)
- sniff (NONE), sniffDown (NONE), sniffUp (NONE)
- startled (NONE), startledLittle (NONE), gasp (NONE), moveAround (NONE)
- openMouth (NONE), openMouth10s (NONE), playBiting (NONE)
- drinkWater (NONE), eatDryFood (NONE)
- throwBone (SPACE_CENTER / SPACE_LEFT / SPACE_RIGHT)
- throwDice (SPACE_LEFT / SPACE_RIGHT)

### PlayTrick（TRICK_LIST）

```js
const TRICK_LIST = [
  { trickName: 'aiboSquat', name: 'スクワット' },
  { trickName: 'happyBirthday', name: 'ハッピーバースデー' },
  { trickName: 'ifYoureHappyAndYouKnowIt', name: '幸せなら手をたたこう' },
  { trickName: 'londonBridgeIsFallingDown', name: 'ロンドン橋落ちた' },
  { trickName: 'radioExerciseNo1', name: 'ラジオ体操第一' },
  { trickName: 'veryLovelyAibo', name: 'とってもかわいいaibo' },
  { trickName: 'waltzOfTheFlowers', name: 'くるみ割り人形' },
];
```

### MoveHead プリセット（MOVE_HEAD_PRESETS）

```js
const MOVE_HEAD_PRESETS = [
  { name: '正面', azimuth: 0, elevation: 0, velocity: 40 },
  { name: '左を見る', azimuth: 60, elevation: 0, velocity: 40 },
  { name: '右を見る', azimuth: -60, elevation: 0, velocity: 40 },
  { name: '上を見る', azimuth: 0, elevation: 30, velocity: 40 },
  { name: '下を見る', azimuth: 0, elevation: -30, velocity: 40 },
];
```

## UI 設計

### アコーディオン（PlayMotion）

- グループヘッダーをタップで開閉
- 開くと中に 2x2 グリッドのボタンが表示される
- 複数グループを同時に開ける（排他ではない）
- 初期状態は全て閉じている
- CSS transition で開閉アニメーション
- 既存のピンク系グラデーションボタンを継続使用

### PlayTrick セクション

- 2x2 グリッド配置（7個なので最後は1つ単独）
- **緑系グラデーション**ボタンで PlayMotion と差別化
- 小さく注釈: 「aiboが覚えているトリックのみ実行できます」
- API: `POST /v1/devices/${deviceId}/capabilities/play_trick/execute`
- パラメータ: `{ arguments: { TrickName: trickName } }`

### MoveHead セクション

- プリセットボタン5つ: 正面 / 左を見る / 右を見る / 上を見る / 下を見る
- **オレンジ系グラデーション**ボタン
- 「カスタム設定」折りたたみセクション:
  - 左右 (Azimuth): range スライダー -80 〜 +80、デフォルト 0
  - 上下 (Elevation): range スライダー -40 〜 +40、デフォルト 0
  - 速さ (Velocity): range スライダー 10 〜 80、デフォルト 40
  - 各スライダーの横に現在値をリアルタイム表示
  - [実行] ボタン
- API: `POST /v1/devices/${deviceId}/capabilities/move_head/execute`
- パラメータ: `{ arguments: { Azimuth, Elevation, Velocity } }`

### ボタンの色分け

| セクション | カラー |
|---|---|
| PlayMotion | ピンク系 `#ff6b9d → #ff8a80`（既存） |
| PlayTrick | 緑系 `#43a047 → #66bb6a` |
| MoveHead プリセット | オレンジ系 `#fb8c00 → #ffa726` |
| 姿勢変更 | 青系 `#42a5f5 → #7e57c2`（既存） |

## API 呼び出し

### PlayMotion（既存の executeAction を拡張）

既存の `ACTION_MAP` + `executeAction()` を廃止し、`MOTION_GROUPS` からデータを参照する汎用的な実行関数に置き換える。

```js
async function executeMotion(category, mode, displayName) {
  // 既存の executeAction と同じ処理だが、
  // ACTION_MAP ではなく引数で直接受け取る
}
```

### PlayTrick（新規）

```js
async function executeTrick(trickName, displayName) {
  // POST /v1/devices/${deviceId}/capabilities/play_trick/execute
  // body: { arguments: { TrickName: trickName } }
}
```

### MoveHead（新規）

```js
async function executeMoveHead(azimuth, elevation, velocity) {
  // POST /v1/devices/${deviceId}/capabilities/move_head/execute
  // body: { arguments: { Azimuth, Elevation, Velocity } }
}
```

## HTML 生成

PlayMotion のアコーディオンと中のボタングリッドは、`MOTION_GROUPS` データから **JavaScript で動的に生成** する。HTML にベタ書きしない。

理由:
- 80個以上のボタンを HTML にベタ書きすると保守が困難
- データ定義を変更するだけでUIが自動更新される

PlayTrick のボタンも `TRICK_LIST` から動的生成する。MoveHead のプリセットも `MOVE_HEAD_PRESETS` から動的生成する。

## 変更対象ファイル

| ファイル | 変更内容 |
|---|---|
| script.js | データ定義追加、動的UI生成、API呼び出し関数追加、既存 ACTION_MAP 廃止 |
| style.css | アコーディオンスタイル、トリックボタン色、MoveHead スライダースタイル追加 |
| index.html | 既存のふるまいボタンのベタ書きを削除し、動的生成のコンテナ要素に置換。PlayTrick・MoveHead のコンテナ追加。姿勢セクションの配置順変更 |
| sw.js | CACHE_NAME のバージョン番号を更新（v2 → v3） |
