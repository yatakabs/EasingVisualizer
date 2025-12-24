# イージング関数リファレンス

イージングビジュアライザーは **16種類の数学的イージング関数** をサポートし、それぞれ3つのイーズタイプ変換に対応しています。

---

🌐 **Language / 言語:** [[Easing-Functions|English]] | 日本語

---

## イーズタイプ

各関数は3つの異なる変換で適用できます：

| イーズタイプ | 動作 | 数式適用 |
|-------------|------|---------|
| **EaseIn** | ゆっくり始まり、速く終わる | `f(x)` |
| **EaseOut** | 速く始まり、ゆっくり終わる | `1 - f(1 - x)` |
| **EaseBoth** | 両端がゆっくり | ブレンド：遅い→速い→遅い |

## 関数リファレンス

### 基本関数

#### Linear
- **数式:** `y = x`
- **説明:** イージングなし - 一定の変化率
- **ScriptMapper:** ❌ 利用不可

#### Quadratic
- **数式:** `y = x²`
- **説明:** 緩やかな加速カーブ
- **ScriptMapper:** ✅ `Quad`

#### Cubic
- **数式:** `y = x³`
- **説明:** 中程度の加速カーブ
- **ScriptMapper:** ✅ `Cubic`

#### Quartic
- **数式:** `y = x⁴`
- **説明:** 強い加速カーブ
- **ScriptMapper:** ✅ `Quart`

#### Quintic
- **数式:** `y = x⁵`
- **説明:** 非常に強い加速カーブ
- **ScriptMapper:** ✅ `Quint`

### スムーズ関数

#### Sine
- **数式:** `y = 1 - cos(πx/2)`
- **説明:** 滑らかな正弦波イージング
- **ScriptMapper:** ✅ `Sine`

#### Circular
- **数式:** `y = 1 - √(1-x²)`
- **説明:** 円弧の動き
- **ScriptMapper:** ✅ `Circ`

#### Exponential
- **数式:** `y = 2^(10(x-1))`
- **説明:** 指数関数的成長による極端な加速
- **ScriptMapper:** ✅ `Expo`

#### Square Root
- **数式:** `y = √x`
- **説明:** 二次関数の逆 - 速く始まる
- **ScriptMapper:** ❌ 利用不可

### 応用関数

#### Back
- **数式:** `y = x²(2.70158x - 1.70158)`
- **説明:** オーバーシュートして戻る - 「振りかぶり」効果
- **ScriptMapper:** ✅ `Back`

#### Elastic
- **数式:** `y = -2^(10(x-1))sin((x-1.1)×2π/0.4)`
- **説明:** バネのような振動効果
- **ScriptMapper:** ✅ `Elastic`

#### Bounce
- **数式:** 区分的バウンス関数
- **説明:** ボールがバウンドする効果
- **ScriptMapper:** ✅ `Bounce`

### 特殊関数

#### Hermite
- **数式:** `y = x²(3 - 2x)`
- **説明:** 滑らかなS字カーブ補間
- **ScriptMapper:** ❌ 利用不可

#### Bezier
- **数式:** `y = 3x²(1-x) + x³`
- **説明:** 3次ベジェスタイルのカーブ
- **ScriptMapper:** ❌ 利用不可

#### Parabolic
- **数式:** `y = 4x(1-x)`
- **説明:** 中点でピークに達する放物線
- **ScriptMapper:** ❌ 利用不可

#### Trigonometric
- **数式:** `y = (1 - cos(πx))/2`
- **説明:** 滑らかなコサインベースのS字カーブ
- **ScriptMapper:** ❌ 利用不可

### パラメトリック関数

#### Drift
- **数式:** パラメトリック（x, yパラメータ）
- **説明:** 調整可能な制御点を持つカスタムカーブ
- **ScriptMapper:** ✅ `Drift`
- **パラメータ:** X（0-10）、Y（0-10）がカーブ形状を制御

## ScriptMapper互換性

✅マークの関数はBeat SaberのScriptMapperと互換性があり、カメラ移動に直接使用できます。

| 関数 | ScriptMapper名 |
|------|---------------|
| Sine | `Sine` |
| Quadratic | `Quad` |
| Cubic | `Cubic` |
| Quartic | `Quart` |
| Quintic | `Quint` |
| Exponential | `Expo` |
| Circular | `Circ` |
| Back | `Back` |
| Elastic | `Elastic` |
| Bounce | `Bounce` |
| Drift | `Drift` |

→ 詳細：[[ScriptMapper-Mode.ja|ScriptMapperモード]]

## 関連項目

- [[Preview-Types.ja|プレビュータイプ]] - これらの関数を可視化
- [[Comparison-Mode.ja|比較モード]] - 関数を並べて比較
- [[Getting-Started.ja|はじめに]] - 基本的な使用ガイド
