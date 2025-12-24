# ScriptMapperモード

ScriptMapperモードはBeat Saberカメラスクリプティングワークフロー専用の可視化を提供します。

---

🌐 **Language / 言語:** [[ScriptMapper-Mode|English]] | 日本語

---

## ScriptMapperとは？

[ScriptMapper](https://github.com/hibit-at/Scriptmapper)は、マッピングソフトウェアのブックマークベースのコマンドからカメラスクリプト（`SongScript.json`）を生成するBeat Saber用ツールです。マッパーがカスタムレベルの視覚体験を向上させる滑らかなカメラトランジション、回転、移動を作成できます。

イージングビジュアライザーのScriptMapperモードは、マップに実装する前に、異なるイージング関数がカメラ移動でどのように見えるかをプレビューするのに役立ちます。

## ScriptMapperモードを有効にする

1. コントロールパネルの **ScriptMapper** トグルをクリック
2. インターフェースがScriptMapper専用コントロールに切り替わります
3. 追加のプレビューオプションが利用可能に

## ブックマークのインポート

ScriptMapperはBeat Saberマッピングソフトウェアのブックマークを使用してカメラ移動を定義します。これらのブックマークをイージングビジュアライザーに直接インポートできます：

### ブックマーク形式

ScriptMapperブックマークは以下の構造に従います：

```
startCommand,endCommand[,easing]
```

**例：**
- `center1,diagb3,OCubic` - OutCubicイージング
- `center-2,side3,IOBounce` - InOutBounceイージング

### インポート手順

1. **ScriptMapperコントロール** パネルを開く
2. インポートフィールドにブックマークテキストを貼り付け
3. **Import** をクリックしてカメラパスを可視化
4. プレビューがカメラ移動を表示するように更新

## プレビュー表示

ScriptMapperモードは3つの専用プレビュータイプを提供：

### 一人称視点

プレイヤーの視点からカメラ移動を体験：
- ゲームプレイ中にプレイヤーが見るものを表示
- リファレンスジオメトリ（アバター位置、ノーツ、壁）を含む
- 乗り物酔いの可能性をチェックするのに有用

### グラフ表示

数学的カーブを可視化：
- X、Y、Z位置の時間変化
- 回転角度（RX、RY、RZ）
- FOV変化
- ぎこちないトランジションの特定に役立つ

### 統合ビュー

以下を表示するマルチパネルディスプレイ：
- 一人称プレビュー
- 個別軸グラフ
- イージングカーブの可視化
- カメラパスの包括的な概要

## 対応イージングタイプ

ScriptMapperは11種類のイージング関数ファミリーとIn/Out/InOutバリエーションに対応：

| 関数 | In | Out | InOut |
|------|-----|-----|-------|
| **Sine** | InSine | OutSine | InOutSine |
| **Cubic** | InCubic | OutCubic | InOutCubic |
| **Quint** | InQuint | OutQuint | InOutQuint |
| **Circ** | InCirc | OutCirc | InOutCirc |
| **Elastic** | InElastic | OutElastic | InOutElastic |
| **Quad** | InQuad | OutQuad | InOutQuad |
| **Quart** | InQuart | OutQuart | InOutQuart |
| **Expo** | InExpo | OutExpo | InOutExpo |
| **Back** | InBack | OutBack | InOutBack |
| **Bounce** | InBounce | OutBounce | InOutBounce |

### 特殊：Drift関数

`Drift`イージングはカスタマイズ可能な加速を提供：

```
Drift_X_Y
```

- X, Y：0〜10のパラメータ（内部的には0〜1にスケール）
- イージングカーブの微調整が可能

### 短縮記法

ScriptMapperは省略されたイージング名に対応：

| 短縮 | 完全形 |
|------|-------|
| `I` + 名前 | `In` + 名前 |
| `O` + 名前 | `Out` + 名前 |
| `IO` + 名前 | `InOut` + 名前 |

**例：** `OCubic` = `OutCubic`、`IOBounce` = `InOutBounce`

## カメラ位置コマンド

ScriptMapperはプリセットカメラ位置を提供：

| コマンド | 説明 |
|---------|------|
| `center` | アバターの前面/背面ビュー |
| `top` | アバターの上から |
| `side` | サイドビュー（高さ1.5m） |
| `diagf` | 斜め前方（高さ3m） |
| `diagb` | 斜め後方（高さ3m） |
| `random` | 半径内のランダム位置 |

### 位置修飾子

| 修飾子 | 効果 |
|--------|------|
| `stop` | 位置を保持 |
| `mirror` | 左右反転 |
| `zoom` | FOVを調整 |
| `spin` | Z軸回転 |
| `slide` | 左右に移動 |
| `shift` | 上下に移動 |
| `push` | 前後に移動 |
| `turn` | アバター周りを回転 |

## ワークフローのコツ

1. **シンプルに始める** - 複雑なパスの前に基本的なトランジションをテスト
2. **Driftは控えめに** - デフォルトのイージングでほとんどのニーズに対応
3. **一人称でプレビュー** - 方向感覚を乱す動きをチェック
4. **異なる速度でテスト** - スロー再生で問題が明らかに
5. **動作するプリセットを保存** - 有用なカメラ移動のライブラリを構築

## 仕様リファレンス

完全なScriptMapperドキュメントについては、以下を参照：
- [ScriptMapper仕様](../scriptmapper-specification.md)
- [ScriptMapper GitHubリポジトリ](https://github.com/hibit-at/Scriptmapper)
- [easings.net](https://easings.net/) - ビジュアルイージングリファレンス

## 関連ページ

- [[Comparison-Mode.ja|比較モード]] - イージング関数を比較
- [[Preview-Types.ja|プレビュータイプ]] - 可視化オプション
- [[Easing-Functions.ja|イージング関数]] - 関数リファレンス
- [[Getting-Started.ja|はじめに]] - 基本的な使用ガイド
