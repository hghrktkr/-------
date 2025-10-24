// Minecraftで実行
// main.js
import { system, world } from "@minecraft/server";
import { eventHandler } from "./managers/eventHandler.js";
import { gamePlayerManager } from "./managers/gamePlayerManager.js";

// ワールド読み込み時
world.afterEvents.worldLoad.subscribe(ev => {
    console.log("World loaded.");
});


// エンティティが死んだ時
world.afterEvents.entityDie.subscribe(ev => {
    console.log(`Entity died: ${ev.deadEntity.id}`);
    // 死亡したエンティティがプレイヤーかチェック
    const deadEntityId = ev.deadEntity.id;
    gamePlayerManager.checkDeadPlayer(deadEntityId);
})



// 2秒ごとにチェック
system.runInterval(() => {
    // ゲームモード・ゲームルールの監視
    gamePlayerManager.checkPlayerGameMode();
}, 20 * 2);



// プレイヤーがエンティティをインタラクトした時
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const {player, target} = ev;    // player: プレイヤー、target: インタラクトしたNPC
    ev.cancel = true;

});


/** エンティティイベントが実行されたとき */
world.afterEvents.dataDrivenEntityTrigger.subscribe((ev) => {
    const { entity, eventId } = ev;
    eventHandler(entity, eventId);
});


// アイテムを使った時
world.afterEvents.itemUse.subscribe((ev) => {
    const { itemStack, source: player } = ev;
});
