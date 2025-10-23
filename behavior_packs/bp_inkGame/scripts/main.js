// Minecraftで実行
// main.js
import { system, world } from "@minecraft/server";
import gameManager from "./managers/gameManager.js";
import { playerManager } from "./managers/playerManager.js";
import { setScoreboardObject } from "./utils/scoreUtils.js";
import { scoreSettings } from "./config/scoreConfig.js";
import { tickingArea } from "./config/gameRuleConfig.js";
import playerUtils from "./utils/playerUtils.js";

// ワールド読み込み時
world.afterEvents.worldLoad.subscribe(ev => {
    // スコアボード作成・設定
    const id = scoreSettings.scoreboardName;
    const displayName = scoreSettings.scoreboardDisplayName;
    setScoreboardObject(id,displayName);

    // ワールドスポーンを設定
    playerUtils.setWorldSpawn();
    // 即時リスポーン
    world.gameRules.doImmediateRespawn = true;

    // tickingarea設定
    world.getDimension("overworld").runCommand(
        `tickingarea add ${tickingArea.start.x} ${tickingArea.start.y} ${tickingArea.start.z} ${tickingArea.end.x} ${tickingArea.end.y} ${tickingArea.end.z} quizArea`
    );
});

// プレイヤーがスポーンしたとき
world.afterEvents.playerSpawn.subscribe(ev => {
    // プレイヤー/管理者の振り分け・登録
    const player = ev.player;
    playerManager.addGamePlayer(player);
});



// プレイヤーが死んだ時
world.afterEvents.entityDie.subscribe(ev => {
    console.log(`Entity died: ${ev.deadEntity.id}`);
    // 死亡したエンティティがプレイヤーかチェック
    const deadEntityId = ev.deadEntity.id;
    playerManager.checkDeadPlayer(deadEntityId);
})



// 2秒ごとにチェック
system.runInterval(() => {
    // ゲームモード・ゲームルールの監視
    playerManager.checkPlayerGameMode();
    playerUtils.enforceGameRule();
}, 20 * 2);



// プレイヤーがエンティティをインタラクトした時
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const {player, target} = ev;    // player: プレイヤー、target: インタラクトしたNPC
    ev.cancel = true;
    // NPCとの会話ダイアログ表示
    console.log(`NPC ID is ${target.id}`);
    playerManager.handleNpcTalk(player, target.id);
});




// アイテムを使った時
world.afterEvents.itemUse.subscribe((ev) => {
    const { itemStack, source: player } = ev;
    const id = itemStack.typeId;
    const dim = player.dimension;

    const itemActions = {
        "minecraft:stick": async () => await gameManager.startGame(),
        "minecraft:end_rod": async () => await gameManager.prepareGame()
    };

    if (id in itemActions) {
        dim.runCommand(`clear @a ${id}`);
        system.run(async () => {
            try {
                await itemActions[id]();
            } catch (e) {
                console.error(`Failed action for ${id}:`, e);
                player.sendMessage(`§c${id} の動作中にエラーが発生しました。`);
            }
        });
    }
});
