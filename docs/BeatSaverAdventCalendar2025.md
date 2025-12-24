# 二年ぶりのクリスマス

🌅 こんばんは、朝です 🌅🎄 これは [Beat Saber Advent Calendar 2025](https://adventar.org/calendars/11369) - 24日目の記事です 🎄

投稿時刻は12月24日の午前25時です。ごめんなさい。

嘘です。12月24日の昼に出てしまいました。恐ろしい。遅刻エネルギー大放出です。別の意味でごめんなさい。

## あーちーちーあーちー

今年の [Beat Saber Advent Calendar 2025](https://adventar.org/calendars/11369)、カメラスクリプト関連の記事がたくさんですね。自分が動かなくてもカメラが動いてくれる。その素晴らしさに全人類が目覚めたのかもしれない。

日本の夜明けだ。世界平和だ。人類のぼっ立ち歴史に新たな一ページが加わる――

10日目に[リュナンさんの「ScriptMapperとCameraMovementの新機能紹介」](https://note.com/rynan/n/n902eba64d04a)、11日目に[ぶっちさんの「カメラワークの基本」](https://note.com/butthi02/n/n7cd716b1cc7c)、12日目に[さりおさんの「さりお流？カメラスクリプトの作り方」](https://note.com/sariorz/n/nd177c5d2b8c9)...

流行っているんですかね？流行っているんですね。

これらの記事を読んで「カメラスクリプト、作ってみたい！」と思った人もいると思います。

カメラスクリプト製作の現在の主流は、hibitさんが開発している [Script Mapper](https://github.com/hibit-at/Scriptmapper) と、リュナンさんが開発している [ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)を組み合わせて使う方法です。[ChroMapper](https://github.com/Caeden117/ChroMapper) 上で視覚的に操作しながらカメラスクリプトを記述し、リアルタイムで動きを確認できます。カメラスクリプト黎明期には考えられなかった快適さです。

でも、実際に [Script Mapper](https://github.com/hibit-at/Scriptmapper) でカメラスクリプトを作り始めると、ぶつかる壁があります。

~~そう、ぼっ立ち非対応壁~~

そう、イージング関数選びの壁です。

## イージング

上記の[さりおさんの記事](https://note.com/sariorz/n/nd177c5d2b8c9)にも書かれていますが、Beat Saber のカメラスクリプトでは、カメラの動きにイージング関数を使うことができます。[Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマークにイージング関数を指定することで、[ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)でその動きを確認できます。

イージングとは、アニメーションに「緩急」をつける仕組みです。動き始めや終わりに加速・減速を加えることで、動きをより自然に見せることができます。

### イージング関数とは？

イージング（Easing）とは、アニメーションの進行度合いを時間に対してどのように変化させるかを定義する数学的な関数です。これを使わなければ直線的に遷移してぎこちなく見えてしまうような動作をより自然に、滑らかに表現することができます。例えば、物体が動き始めるときに徐々に加速し、動き終わるときに徐々に減速するような効果を実現できます。

### イージング関数にはさまざまな種類があります。[Script Mapper](https://github.com/hibit-at/Scriptmapper)が対応しているものには以下のようなものがあります。

| 関数名 | 数式 (EaseIn) | 特徴 | 最適な使用場面の例 |
|--------|---------------|------|----------------|
| **Sine** | `1 - cos((t * π) / 2)` | 正弦波を基にした滑らかな加速・減速。最も自然で控えめな動き。 | ゆっくりとしたカメラの移動、穏やかなシーン、自然な視点移動 |
| **Quad** | `t²` | 二次関数による中程度の加速・減速。Sineより少し強め。 | 一般的なカメラワーク、バランスの取れた動きが欲しい時 |
| **Cubic** | `t³` | 三次関数によるより強い加速・減速。メリハリのある動き。 | ドラマチックなシーン、印象的なカメラ移動 |
| **Quart** | `t⁴` | 四次関数による劇的な加速・減速。かなり強い緩急。 | インパクトのある演出、激しい動きの強調 |
| **Quint** | `t⁵` | 五次関数による非常に強い加速・減速。極端な緩急。 | 特別な演出、非常に強調したい瞬間 |
| **Expo** | `2^(10 * (t - 1))` | 指数関数による急激な加速・減速。ほぼ瞬間的な変化。 | 瞬間移動風の演出、爆発的な動き |
| **Circ** | `1 - √(1 - t²)` | 円形関数による滑らかな動き。始点/終点付近が特に滑らか。 | 円弧を描くような動き、優雅なカメラワーク |
| **Back** | `2.70158 * t³ - 1.70158 * t²` | 一度逆方向に戻ってから目的地へ。オーバーシュート効果。 | 勢いをつけた動き、ジャンプ前の溜め、反動表現 |
| **Elastic** | 弾性振動関数 | バネのような振動でオーバーシュートして戻る。 | コミカルな演出、衝撃の余韻、弾む動き |
| **Bounce** | 跳ね返り関数 | 目的地に到達する際に跳ねる効果。 | 着地表現、ボールのバウンド、ポップな演出 |
| **Drift** | パラメトリック関数 | X, Y パラメータで多様な動きを表現可能。 | カスタム動作、他の関数では表現できない特殊な動き |

… 選ぶの大変ですね？

### イージングの適用方法

ScriptMapper におけるイージング関数の適用方法には、主に以下の3つのタイプがあります：

| タイプ | 適用タイミング | 速度変化 | 効果 | 最適な使用場面の例 |
|--------|----------------|----------|------|----------------|
| **Ease In** | アニメーションの開始時 | ゆっくり → 速く | 動きはじめがゆっくりで徐々に加速。動きの勢いを強調。 | カメラが動き始める瞬間、加速感を出したい時、被写体に向かって勢いよく近づく演出 |
| **Ease Out** | アニメーションの終了時 | 速く → ゆっくり | 徐々に減速し滑らかに停止。動きの余韻を強調。 | カメラが目的地に到着する時、着地感を出したい時、視点が落ち着く演出 |
| **Ease In Out** | 開始時と終了時の両方 | ゆっくり → 速く → ゆっくり | 動きはじめと動き終わりが滑らか。全体的に自然な動き。 | 一般的なカメラ移動、自然で違和感のない動きが欲しい時、シーン間のトランジション |

…どのタイプを選べば良いか悩んじゃいますね？

### [Script Mapper](https://github.com/hibit-at/Scriptmapper) でイージング関数を試す

[Script Mapper](https://github.com/hibit-at/Scriptmapper) と [ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)を使えば、様々なイージング関数を試すことができます。ブックマークにイージング関数を指定して、[ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement) 上で動きを確認する流れです。

便利です。とても便利です。

ですが、イージング関数は非常に多くの種類があります。全部を把握するのは大変ですし、個々の特性を理解して適切なものを選べるようになるには時間がかかります。実際の動作や見た目をイメージできるようになるまでには、かなりの試行錯誤が必要でしょう。

もちろん一つ一つ、地道に試していくことは可能です。でも、すべてを試すのは大変です。

沢山のブックマークを書いて、[Script Mapper](https://github.com/hibit-at/Scriptmapper) でスクリプトを生成し、[ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)で動きを確認して...ある一箇所に適したイージング関数を見つけるまでに、何度もこのプロセスを繰り返す必要があります。

イージング関数の違いを視覚的に比較するのも難しいです。
同時に複数のイージング関数を比較できるわけではないので、各関数を個別に試して、その動きを記憶しながら比較する必要があります。それぞれの微妙な違いを把握するのは同時にそれらを見比べないと難しいでしょうし、かといってその微妙な違いが無視できるほど小さいわけでもありません。

大変ですよね？大変ですね。
と、いうわけで、[Script Mapper](https://github.com/hibit-at/Scriptmapper) と [ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)を補完する形で、イージング関数を視覚的に比較・試用できるツールを作りました。

Easing Visualizer というド直球の名前です。

先日 [さりおさんの記事](https://note.com/sariorz/n/nd177c5d2b8c9#aeea93e5-8168-4925-b0a2-d683b6b0a64b)で一部が紹介されていたのはこれです。

## Easing Visualizer

[Easing Visualizer](https://yatakabs.github.io/easingvisualizer/) は、イージング関数を視覚的に比較・試用できるウェブアプリケーションです。

「[Script Mapper](https://github.com/hibit-at/Scriptmapper) でブックマークを書く前に、どの関数がどんな動きをするか知りたい」「イージング関数多すぎて選べない」という問題を解決するために作りました。

主な機能は2つあります：

- **比較モード**: 複数のイージング関数を並べて表示し、4種類の方法（Glow、Graph、Camera、Value）で同時に比較できます
- **Script Mapper モード**: [Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマーク形式でコマンドを入力し、Beat Saber を起動せずにブラウザ上でカメラの動きを確認できます

ちょっと機能盛りすぎたかもしれません。ごめんなさい。だっていろんな機能ほしかったんだもの。やすを。

ということで、この記事では Easing Visualizer の使い方について詳しく説明します。Beat Saber Advent Calendar 2025 24日目の記事、ようやく本編スタートです。

### 基本的な機能

二つのモードがあります。

**比較モード**: 複数のイージング関数を同時に表示し、動きを比較できます。[Script Mapper](https://github.com/hibit-at/Scriptmapper) でブックマークを書く前に、どのイージング関数を使うか検討するのに便利です。

**Script Mapper モード**: [Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマーク形式でカメラパスを入力し、Beat Saber 起動前にブラウザ上で動きを確認できます。

#### 比較モード

<!-- TODO: Screenshot of Comparison mode showing multiple easing functions -->

複数のイージング関数を並べて表示して、動きを比較できます。[Script Mapper](https://github.com/hibit-at/Scriptmapper) でどのイージング関数を使うか迷った時に便利です。最大24個まで追加できます。でも多すぎると大変です。

4つの表示方法（Glow、Graph、Camera、Value）を同時に確認できます。違いが一目で分かります。

各イージング関数で EaseIn、EaseOut、EaseBoth を切り替えることもできます。並べ替えもドラッグ & ドロップで簡単にできます。まあ、よくある感じです。

#### Script Mapper モード 

<!-- TODO: Screenshot of Script Mapper mode showing all three views -->

[Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマーク形式で Camera Movement のコマンドを記述し、その動きを確認できます。複数のウェイポイントを繋げて、複雑なカメラパスを作成できます。

[Script Mapper](https://github.com/hibit-at/Scriptmapper) でブックマークを書いたら、[ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)で確認する前に、ここで動きを確認できます。Beat Saber を起動せずにブラウザ上で確認できるので便利です。

例えば次の4つのブックマークを入力すると、[Script Mapper](https://github.com/hibit-at/Scriptmapper) で生成されるカメラスクリプトと同じ動きを Easing Visualizer 上で確認できます。

```
dpos_3_0.5_-4_60,IOQuad
dpos_-2_3_-3_50,IOQuad
dpos_0_1.5_-5_65,IOQuad
dpos_4_2_2_55,stop
```

3つのビュー（Third Person、First Person、Timing Graph）で同時に表示されます。Third Person はカメラパス全体を外から見る感じ、First Person はカメラ目線で見る感じ、Timing Graph はタイムラインで見る感じです。実際の Beat Saber に近い感じで確認できます。

プリセットのカメラパスもいくつか用意しています。ドロップダウンから選択するだけです。簡単です。

<!-- TODO: Screenshot of Easing Visualizer UI showing both modes -->

### 比較モードの使い方

#### 表示するイージング関数の選択

<!-- TODO: Screenshot of Adding Easing Function Panel -->

ツールバーの「Add」ボタンをクリックすると、イージング関数のリストが表示されます。好きな関数を選択するとパネルが追加されます。最大24個まで追加できます。でも多すぎると大変です。

各パネルには EaseIn、EaseOut、EaseBoth の切り替えボタンがあります。同じ関数の異なる変形を試せます。

パネルはドラッグ & ドロップで並び替えできます。比較しやすい順番に並べてください。

#### 表示方法の選択

<!-- TODO: Screenshot of Display Mode Toolbar -->

ツールバーで4種類の表示方法を選択できます。Glow、Graph、Camera、Value。全部同時に表示することもできます。好きなものだけ選んでください。

##### Glow Preview

光の強さでイージング関数の出力を表現しています。0から1まで変化する円の輝度でイージング関数の動きが分かります。雰囲気が分かります。

<!-- TODO: Screenshot of Glow Preview -->

##### Graph Preview

2Dグラフで関数のカーブを表示しています。現在位置を示すマーカーも表示されます。数学的な動きが見えます。

Gamma補正を使っている場合は、元のカーブも点線で表示されます。補正前と補正後の違いが分かります。

<!-- TODO: Screenshot of Graph Preview -->

##### Camera Preview

3D空間でカメラの動きを表示しています。Beat Saberの人型モデルも表示されます。実際のカメラワークに近い感じです。

カメラの Start Position と End Position は Advanced Settings で変更できます。アスペクト比や座標系も選べます。細かいですね。

<!-- TODO: Screenshot of Camera Preview -->

##### Value Preview

Input と Output の数値を表示しています。0-100%のバーで進行度を可視化しています。リアルタイムで更新されます。

数値派の人向け。

<!-- TODO: Screenshot of Value Preview -->

#### その他の操作

再生速度は 0.25x から 3x まで調整できます。ゆっくり見たいときは遅く、サクサク確認したいときは速く。
<!-- TODO: Screenshot of Speed Selector -->

Advanced Settings で Manual Input Mode を有効にするとスライダーで好きなタイミングで止められます。フレーム単位で確認したい場合に利用できるかと思います。
<!-- TODO: Screenshot of Manual Input Mode -->

こんな感じです。

### Script Mapper モードの使い方

ツールバーの Mode Switcher で [Script Mapper](https://github.com/hibit-at/Scriptmapper) モードに切り替えられます。このモードでは [Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマーク形式でカメラパスを作成し、Beat Saber 起動前にその動きを確認できます。複数のウェイポイントを繋げて複雑なカメラワークを実現できます。

<!-- TODO: Screenshot of Script Mapper mode showing input area -->

#### プリセット

<!-- TODO: Screenshot of Preset Selector  -->
いくつかのプリセットカメラパスを用意しています。Preset Selector のドロップダウンから選択するだけです。

プリセットを選ぶと自動的にブックマークが入力されてカメラパスが表示されます。そのまま [Script Mapper](https://github.com/hibit-at/Scriptmapper) にコピーして使ってもいいしカスタマイズしてもいいです。好きにしてください。

#### ブックマークの入力

[Script Mapper](https://github.com/hibit-at/Scriptmapper) のブックマーク形式でコマンドを記述します。`dpos_X_Y_Z_FOV` または `q_X_Y_Z_RX_RY_RZ_FOV` 形式で入力できます。[Script Mapper](https://github.com/hibit-at/Scriptmapper) で使っているブックマークをそのままコピーして貼り付けることもできます。

例えばこんな感じです。

<!-- TODO: Support specifying beat timing in the future to respect timing-based movements. -->
```
dpos_3_0.5_-4_60,IOQuad
dpos_-2_3_-3_50,IQuad
dpos_0_1.5_-5_65,OQuad
dpos_4_2_2_55,stop
```

<!-- TODO: Screenshot of Script Mapper mode showing input area with example bookmarks -->

各行が1つのウェイポイントです。カンマの後ろにイージング関数を指定します。`IOQuad` は EaseInOut Quadratic、`IQuad` は EaseIn Quadratic、`OQuad` は EaseOut Quadratic という意味です。[Script Mapper](https://github.com/hibit-at/Scriptmapper) と同じ形式です。

セグメントごとにイージング関数を選択できます。Drift 関数を使う場合は X と Y のパラメータも調整できます。Advanced Settings の Drift Parameters で変更してください。

#### プレビュー表示のみかた

3つのビューが同時に表示されます。

Third Person View はカメラパス全体を外から見る感じです。カメラの軌跡が見えます。Beat Saber の人型モデルも表示されます。
<!-- TODO: Screenshot of Third Person View -->

First Person View はカメラ目線で見る感じです。プレイヤー視点です。実際の Beat Saber で見える映像に近いです。
<!-- TODO: Screenshot of First Person View  -->

Timing Graph はタイムラインで見る感じです。どのタイミングでどのセグメントが実行されているかが分かります。
<!-- TODO: Screenshot of Timing Graph -->

<!-- TODO: Screenshot of Script Mapper mode showing all three views -->

3つ同時に表示されます。便利です。

### その他の機能

いろいろ細かい機能があります。

#### 再生速度の調整

ツールバーの Speed から再生速度を調整できます。0.25x から 3x まで調整可能です。

ゆっくり見たいときは遅く、サクサク確認したいときは速く。それだけです。簡単ですね。

<!-- TODO: Screenshot of Speed Selector to show where the speed adjustment is located -->

#### Manual Input Mode

Advanced Settings で Manual Input Mode を有効にするとスライダーで好きなタイミングで止められます。フレーム単位で確認したいときに利用できます。

再生ボタンを押さずにスライダーを動かすだけで確認できます。

#### Gamma Correction

Advanced Settings で Gamma 値を調整すると出力に補正をかけられます。1.0 から 4.0 まで調整可能です。

Gamma補正を使うとグラフに元のカーブも点線で表示されます。補正前と補正後の違いが分かります。まあ、使う人は使うかなと。

※ まず使うことはありません。イージング関数にガンマ補正をかける意味もなければ、 Script Mapper や CameraMovement プラグインも対応していません。

<!-- TODO: Screenshot of Gamma Correction setting and effect on Graph Preview -->

#### Camera Settings

Advanced Settings でカメラの設定を変更できます。Start Position と End Position、Aspect Ratio、Coordinate System などを調整できます。

Beat Saber の座標系（left-handed）にも対応しています。細かいですね。
※ まず使うことはないと思いますが。

#### 設定の保存・共有

Preset 機能で設定を保存できます。Presets ボタンから保存や読み込みができます。

Share ボタンをクリックすると現在の設定が URL にエンコードされます。URL をコピーして他の人と共有できます。URL を開くと同じ設定が復元されます。

<!-- TODO: Screenshot of Share dialog and URL preview banner -->

便利です。

## おわりに

[Easing Visualizer](https://yatakabs.github.io/easingvisualizer/) でイージング関数を比較できます。[Script Mapper](https://github.com/hibit-at/Scriptmapper) モードでカメラパスの動きも確認できます。

[Script Mapper](https://github.com/hibit-at/Scriptmapper) と [ChroMapper-CameraMovement プラグイン](https://github.com/rynan4818/ChroMapper-CameraMovement)でカメラスクリプトを作る時の補助ツールとして使ってもらえると嬉しいです。便利かはわかりません。
もし使ってみて、「便利だった！」とか「ここがもうちょっとこうだったら嬉しいな」とかあれば、ぜひフィードバックをください。実際に使う人の意見を可能な限り取り入れて改善していければと思います。


## 免責事項
このツールの利用によって生じた、いかなる不利益も、開発者は一切の責任を負いません。あしからず。

バグとかあったらごめんなさい。[GitHub の Issue](https://github.com/yatakabs/easingvisualizer/issues) とか Twitter や Discord 、配信のコメントなどでも構いませんので、教えてもらえたら助かります。

お返事なども遅れがちになるかもしれませんが、ご容赦ください。

それでは、よいクリスマスを 🎄
🌅 朝でした 🌅