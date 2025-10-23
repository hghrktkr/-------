/**
 * ゲームルールの設定{key:ゲームルール名, value:true/false}
 */
export const gameRuleConfig = {
    doDaylightCycle: false,        // 昼夜サイクルを進行させるか
    doWeatherCycle: false,         // 天候が変化するか
    doFireTick: true,             // 火の延焼・消滅が起こるか
    doMobSpawning: false,          // モブが自然スポーンするか
    doMobLoot: false,              // モブがドロップするか
    doTileDrops: false,            // ブロック破壊時にアイテムが落ちるか
    keepInventory: false,          // 死亡時にインベントリを保持するか
    fallDamage: true,             // 落下ダメージを受けるか
    fireDamage: true,             // 火や溶岩でダメージを受けるか
    drowningDamage: true,         // 溺死ダメージを受けるか
    naturalRegeneration: true,    // 自然回復するか
    doInsomnia: false,             // 不眠によるファントムがスポーンするか
    doImmediateRespawn: true,     // 即リスポーンするか
    pvp: false,                    // プレイヤー同士の攻撃を有効にするか
    mobGriefing: false,            // モブがブロックを壊したり動かしたりするか
    showCoordinates: true,        // 座標を表示するか
    showDeathMessages: false,      // 死亡メッセージを表示するか
    spawnRadius: 5,            // スポーン地点のランダム半径（数値指定推奨）
    sendCommandFeedback: false,    // コマンド実行結果を表示するか
    maxCommandChainLength: 0   // コマンドチェーンの最大長（数値指定推奨）
}

export const gameDifficulty = "normal"

// 読み込む範囲
export const tickingArea = {
    "start": {x: -65, y: 50, z: -65},
    "end": {x: 65, y: 80, z: 65}
}