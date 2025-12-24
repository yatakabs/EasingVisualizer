# イージング関数ビジュアライザー

**Beat Saberモッディング**と**アニメーションワークフロー**のためのイージング関数可視化比較ツールです。

🚀 **[ライブデモを試す](https://yatakabs.github.io/EasingVisualizer/)**

---

🌐 **Language / 言語:** [[Home|English]] | 日本語

---

## 主な機能

### 🎯 2つの可視化モード

- **[[Comparison-Mode.ja|比較モード]]** - 複数のイージング関数をアニメーションプレビューで並べて比較
- **[[ScriptMapper-Mode.ja|ScriptMapperモード]]** - Beat Saber ScriptMapperモッディング用のカメラパスを可視化

### 📊 16種類のイージング関数

以下を含む数学的イージング関数を完全サポート：
- 基本：Linear, Quadratic, Cubic, Quartic, Quintic
- スムーズ：Sine, Circular, Exponential, Square Root
- 応用：Back, Elastic, Bounce, Hermite, Bezier, Parabolic, Trigonometric

各関数は **EaseIn**、**EaseOut**、**EaseBoth** の変換に対応しています。

→ [[Easing-Functions.ja|イージング関数リファレンス]]を参照

### 🖼️ 5種類のプレビュータイプ

| プレビュー | 説明 |
|-----------|------|
| **Glow** | 光の強度アニメーション |
| **Graph** | 2Dカーブの可視化 |
| **Camera** | 3Dカメラ移動プレビュー |
| **Value** | 数値の入出力表示 |
| **Easing Compare** | EaseIn/Out/Bothの比較表示 |

→ [[Preview-Types.ja|プレビュータイプリファレンス]]を参照

### ⚡ その他の機能

- **再生コントロール** - 再生/一時停止、速度調整（0.1x〜10x）、60fpsアニメーション
- **プリセットシステム** - 設定の保存・読み込み・共有
- **URL共有** - プレビューモード付きURLで設定を共有
- **ガンマ補正** - 調整可能なガンマ値による出力フィルター
- **キーボードショートカット** - クイックナビゲーションと操作

## クイックスタート

→ [[Getting-Started.ja|今すぐ始める]]

## 技術スタック

- React 19 + TypeScript
- Vite + Tailwind CSS
- Three.js（3Dプレビュー）
- Radix UI / shadcn/ui

---

**[[Contributing|コントリビュート]]** · **[[FAQ.ja|よくある質問]]** · **[GitHubリポジトリ](https://github.com/yatakabs/EasingVisualizer)**
