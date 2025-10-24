// Minecraftで実行
// main.js
import { system, world } from "@minecraft/server";
import { gamePlayerManager } from "./managers/gamePlayerManager.js";
import { inkGun } from "./classes/inkGun.js";
import { teamConfig } from "./configs/playerConfig.js";

// ワールド読み込み時
world.afterEvents.worldLoad.subscribe(ev => {
    console.log("World loaded.");
});

world.afterEvents.playerSpawn.subscribe(ev => {
    const { player } = ev;
    console.log(`Player spawned: ${player.name} (${player.id})`);
    gamePlayerManager.addGamePlayer(player);

    const gamePlayer = gamePlayerManager.gamePlayers.get(player.id);
    if(gamePlayer) {
        gamePlayer.setTeam(teamConfig.teamBlue.teamColor, teamConfig.teamBlue.teamColorEntityType, teamConfig.teamBlue.teamColorBlockType);
    }
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
    for(const gamePlayer of gamePlayerManager.gamePlayers.values()) {
        gamePlayer.updatePerTick();
    }
}, 20 * 2);



// プレイヤーがエンティティをインタラクトした時
world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const {player, target} = ev;    // player: プレイヤー、target: インタラクトしたNPC
    ev.cancel = true;

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
