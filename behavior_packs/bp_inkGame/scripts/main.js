// Minecraftで実行
// main.js
import { system, world } from "@minecraft/server";
import { inkGun } from "./classes/inkGun.js";
import { flagManager } from "./managers/flagManager.js";
import { gameManager } from "./managers/gameManager.js";
import { gamePlayerManager } from "./managers/gamePlayerManager.js";
import { npcManager } from "./managers/npcManager.js";
import { npcConfigs } from "./configs/npcConfig.js";
import { playerSpawnPosition } from "./configs/playerConfig.js";
import { broadcastChat } from "./utils/helpers.js";



// ワールド読み込み時
world.afterEvents.worldLoad.subscribe(ev => {
    console.log("World loaded.");

    for (const [, config] of Object.entries(npcConfigs)) {
        npcManager.registerNPC(config.id, config);
    }
    system.runTimeout(() => {
        npcManager.spawnAllNPCs();
    }, 20 * 2);
});


// プレイヤーがスポーンしたとき
world.afterEvents.playerSpawn.subscribe(ev => {
    const { player } = ev;

    if(gameManager.gameState === "PLAYING" && gamePlayerManager.gamePlayers.has(player.id)) return;
    console.log(`Player spawned: ${player.name} (${player.id})`);
    gamePlayerManager.addGamePlayer(player);
    player.teleport(playerSpawnPosition.spawnPoint);
    const gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
    gamePlayerManager.setPlayerSpawnPoint(gamePlayer, playerSpawnPosition.spawnDimension, playerSpawnPosition.spawnPoint);
});


// エンティティが死んだ時
world.afterEvents.entityDie.subscribe(ev => {
    console.log(`Entity died: ${ev.deadEntity.id}`);
    if(gameManager.gameState !== "PLAYING") return;
    // 死亡したエンティティがプレイヤーかチェック
    const deadEntityId = ev.deadEntity.id;
    gamePlayerManager.checkDeadPlayer(deadEntityId);
})



// 毎tickチェック
system.runInterval(() => {
    // ゲームモード・ゲームルールの監視
    gamePlayerManager.checkPlayerGameMode();
    gameManager.enforceGameRule();

    // ゲーム中のみ監視(0.5秒おき)
    if(gameManager.gameState !== "PLAYING") return;
    for(const gamePlayer of gamePlayerManager.gamePlayers.values()) {
        gamePlayer.updatePerTick();
    }
}, 10);


// ゲーム中のインベントリチェック⇒Educationのバージョンでは利用不可
// world.afterEvents.playerInventoryItemChange.subscribe((ev) => {
//     const { player, itemStack } = ev;
//     const gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
//     if(!gamePlayer || gameManager.gameState !== "PLAYING") return;
//     if(itemStack.typeId === "edu:flag") {
//         flagManager.onGetFlag(gamePlayer);
//     }
// });

world.afterEvents.playerBreakBlock.subscribe((ev) => {
    const { player, block } = ev;
    if(gameManager.gameState !== "PLAYING") return;

    const gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
    if(gamePlayer && block.typeId === "edu:flag") {
        flagManager.onGetFlag(gamePlayer);
    }

})

// プレイヤーがエンティティをインタラクトした時
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const {player, target} = ev;    // player: プレイヤー、target: インタラクトしたNPC
    console.log(`player[${player.nameTag}] interacted entity[${target.nameTag}]`);

    // typeIdがedu:game_masterのNPCだけ反応するように
    if(target.typeId !== "edu:game_master") return;
    if(gameManager.gameState !== "PREPARE") return;

    // NPCのnameTag（表示名）でどの設定に対応するかを探す
    const npcConfig = [...npcManager.npcConfigs.values()].find(
        cfg => cfg.nameTag === target.nameTag
    );

    if (!npcConfig) return; // 対応する設定がなければ何もしない

    ev.cancel = true; // NPCのデフォルト挙動を止める
    npcManager.handleInteraction(player, npcConfig.id); // 対話イベントを発火

});


// アイテムを使った時
world.afterEvents.itemUse.subscribe((ev) => {
    const { itemStack, source: player } = ev;
    const gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
    console.log(`Item used by ${player.name}: ${itemStack.typeId}`);
    console.log(`GamePlayer found: ${gamePlayer ? "Yes" : "No"}`);
    if(!gamePlayer) return;

    if(itemStack.typeId === "edu:ink_gun") {
        console.log(`${player.name} used Ink Gun`);
        inkGun.shoot(gamePlayer);
    }

});
