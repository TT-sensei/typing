# ローマ字タイピングバトル

小学生が「ひらがなとローマ字の対応」を覚えながら、気持ちよくキーボード入力に慣れる60秒タイピングバトルです。

## 遊び方

- かなバトル：ローマ字を見ながら、かな1文字を入力
- ことばバトル：ローマ字を見ながら、言葉を連続入力
- マスターバトル：ローマ字を見ずに思い出して入力（段階ヒントあり）

Enterは不要です。正しい文字列が完成した瞬間に攻撃します。ミスタイプでは止まらず、敵が攻撃ラインへ達した場合だけHPとコンボが減ります。

## ローマ字データ

画面に見せるつづりは、文化庁「ローマ字のつづり方」（令和7年12月22日内閣告示第4号）の本表を基準にしています。

- 表示例：`shi / chi / tsu / fu / ji / sha / cha`
- PC入力では `si / ti / tu / hu / zi / sya / tya` なども受理
- 表示用 `show` と入力許可 `accepts` は `src/data.js` で分離
- 促音・拗音・撥音は `src/romaji.js` で組み立て

公式資料：https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/roma/index2.html

## 主な機能

- 問題文字固定・敵だけが接近するバトル画面
- 必要打鍵数に応じた敵の初期距離と入力猶予
- 1打鍵10点＋最大2.0倍のコンボ倍率
- NAVI Fantasy 6人のSTAND / ATTACK / DAMAGE / SPECIAL
- 失敗問題を3〜5問後に再出題する復習キュー
- ヒント後に自力成功したときの `RETRY CLEAR!`
- モード別BEST SCORE・最大コンボ・最高正確率
- edu-assetsを使った150個のバッジコレクション
- Web Audio APIによる外部音源不要の効果音
- localStorage保存、音ON/OFF、動きを減らす設定への対応

## 技術構成

HTML / CSS / JavaScriptのみで動き、GitHub Pagesへそのまま公開できます。サーバー、DB、APIキーは不要です。

```text
index.html
styles.css
src/
  app.js       画面・バトル進行
  data.js      問題・素材・バッジデータ
  romaji.js    ローマ字表示・入力判定
  storage.js   学習履歴・復習・保存
  audio.js     効果音
test/
  romaji.test.js
```

## 確認

```bash
npm test
npm run check
```
