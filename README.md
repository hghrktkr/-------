# Minecraft Splatoon-like Game (ScriptAPI)

Minecraft 統合版 (Bedrock Edition) 向けの ScriptAPI + Addon による
スプラトゥーン風チーム対戦ゲームです。

プレイヤーはチームごとに「インクショット」で地面を塗り、
フラッグを奪取して自陣に持ち帰ることでポイントを競います。

## 🎮 ゲーム概要
- チーム制 (例: Blue / Orange)
- 塗り面積 + フラッグスコアの合計で勝敗判定
- リスポーン / リロードシステム
- 特殊スキル（チャージ・バーストなど）
- マップごとのステージ構成

## 🔧 実装予定の主要システム
- `GameManager` : 試合進行（開始・終了・リセット）
- `GamePlayer` : プレイヤー状態管理（チーム・スコア・インク残量など）
- `InkManager` : ブロック着色・判定
- `FlagManager` : フラッグの生成・奪取・スコア加算処理
- `UIManager` : スコアボードやタイトル表示

## 📁 ディレクトリ構成 (概要)
├── behavior_pack/
│   ├── manifest.json
│   ├── scripts/
│   │   ├── main.js         トリガー関係
│   │   ├── managers/       各クラスのマネージャー
│   │   ├── classes/        プレイヤー、インク関係のクラス
│   │   └── utils/          各種ユーティリティ
│   └── functions/
├── resource_pack/
│   ├── manifest.json
│   └── textures/
├── src/
│   ├── configs/
│   ├── managers/
│   ├── classes/
│   └── utils/
└── package.json
